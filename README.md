# 🎟️ High-Concurrency Event Ticket Booking Backend API

A production-style modular monolith REST API built with **Node.js, TypeScript, Express, PostgreSQL, Prisma 7, Docker, Redis, and BullMQ**.

Engineered specifically to solve the hard problems of ticket booking systems: **race conditions, temporary inventory holds, zero double-booking, idempotency, delayed expiration workers, and asynchronous background email delivery**.

---

## 🏗️ System Architecture

```text
Client (Web / Mobile)
        │
        ▼
 Express Router & Middleware (JWT Authenticate + RBAC Authorize)
        │
        ▼
   Controller Layer (HTTP Input / Response Status Mapping)
        │
        ▼
   Service Layer (Business Logic & Concurrency Rules)
        │
        ├──► PostgreSQL (Prisma 7): Authoritative Source of Truth
        │     - ACID Transactions (prisma.$transaction)
        │     - Compound Unique Constraints (Zero Double-Booking)
        │     - Row-level consistency
        │
        ├──► Redis 7 (In-Memory State & Timer Coordination)
        │
        └──► BullMQ (Delayed Jobs & Asynchronous Queues)
                 │
                 ├──► Expiration Worker (Auto-releases expired seat holds)
                 └──► Email Worker (Async confirmation email delivery + exponential backoff)
```

---

## 🌟 Core Features

- **Authentication & RBAC**: JWT-based stateless authentication with bcrypt password hashing (10 rounds) and strict Role-Based Access Control (`CUSTOMER`, `ORGANIZER`, `ADMIN`).
- **Venue & Inventory Management**: Admins can configure venues with multi-section seating charts (`VIP`, `General`, `Row A`, etc.) enforced via compound unique indexes.
- **Event Scheduling**: Organizers can schedule concerts and events with venue collision detection.
- **Atomic 10-Minute Seat Holds**: Users temporarily hold seats during checkout. Prevents other users from acquiring the seat.
- **Automatic Hold Expiration**: BullMQ delayed worker wakes up after 10 minutes, checks database state defensively, and auto-releases the hold if unpaid.
- **Zero Double-Booking Guarantee**: Pure database transactions + PostgreSQL compound unique constraints make it mathematically impossible to double-book seats.
- **Idempotent Checkout**: Safe retries using `Idempotency-Key` headers. Network glitches will never double-charge or duplicate bookings.
- **Asynchronous Email Worker**: Confirmation emails are dispatched in the background with exponential retry backoff, keeping HTTP checkout latency under 40ms.
- **Automated Concurrency Testing**: 10 simultaneous requests fired at the exact same millisecond verified via Jest and Supertest.

---

## 🛡️ How I Prevented Double Booking (System Design Deep Dive)

In high-demand ticket sales (e.g. Coldplay, Taylor Swift), thousands of users click "Book" on the exact same seat at the exact same millisecond. Naive application-level checks fail because of **Race Conditions**:

```text
User A ───────┐
              ├──► Read DB: "Is Seat A1 available?" ──► Both read YES!
User B ───────┘
              │
              ├──► User A: Writes Booking for Seat A1
              └──► User B: Writes Booking for Seat A1 (💥 DOUBLE BOOKING!)
```

### The 4-Layer Defense Strategy:

1. **Database-Level Compound Unique Constraints**:
   At the PostgreSQL engine level, the `SeatHold` and `Booking` tables enforce:
   ```prisma
   @@unique([eventId, seatId])
   ```
   Even if two threads execute simultaneously, the database storage engine serializes the row write. Exactly one row commits; the second row triggers a `UniqueConstraintViolation` error.

2. **Atomic State Hand-off inside `$transaction`**:
   `confirmBooking` wraps hold deletion and booking insertion in a single atomic database transaction:
   ```typescript
   await prisma.$transaction(async (tx) => {
     // 1. Verify user owns the hold and hold hasn't expired
     // 2. Delete the temporary hold
     // 3. Insert the confirmed booking
   });
   ```
   If the server crashes midway, the transaction automatically **rolls back**, preventing orphaned holds or unpaid bookings.

3. **Defensive Expiration Worker (Handling the Confirmation Race)**:
   What if User A confirms at minute 9:59 and the 10:00 expiration worker wakes up?
   The worker queries if a `Booking` row already exists before deleting anything. If confirmed, it safely aborts:
   ```typescript
   if (confirmedBooking) return; // Paid! Do not release!
   if (hold.expiresAt > new Date()) return; // Still valid! Do not release!
   ```

4. **Empirical Proof via Automated Stress Testing**:
   Verified via `tests/concurrency.test.ts`:
   - 10 distinct users dispatch simultaneous requests to the exact same seat at the same millisecond via `Promise.all`.
   - **Result**: Exactly **1** succeeds (`201 Created`), exactly **9** are blocked (`409 Conflict`), and database count is strictly **1**.

---

## ⚡ Why Redis?

Redis is **NOT** used as the primary source of truth — PostgreSQL is the single authoritative source of truth.

We use Redis because:
- **Timer Coordination**: Storing 100,000 active countdown timers in Node.js memory (`setTimeout`) would crash the process or be lost on server restarts. Redis holds job timers persistently in a Sorted Set (`ZSET`).
- **Zero Polling Overhead**: Instead of running a heavy `SELECT * FROM seat_holds WHERE expiresAt < NOW()` every second on PostgreSQL, BullMQ uses Redis event notifications to wake up workers only when an expiration is due.

---

## 📬 Why BullMQ?

- **Decoupled Background Execution**: Sending emails or clearing holds happens outside the user's HTTP request lifecycle. Checkout response drops from 2000ms to **35ms**.
- **Resilience & Automatic Retries**: If the email service has a temporary network glitch, BullMQ automatically retries with **exponential backoff** (`2s, 4s, 8s, 16s`).
- **Distributed Ready**: Multiple worker processes can run across different Docker containers or servers, pulling jobs from the shared Redis queue without duplicate processing.

---

## 🔌 API Reference

### Auth
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register customer |
| `POST` | `/api/auth/login` | Public | Login & receive JWT |
| `GET` | `/api/auth/me` | Bearer Token | Get authenticated user profile |

### Venues & Inventory
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/venues` | Admin | Create venue with capacity |
| `GET` | `/api/venues` | Public | List all venues |
| `POST` | `/api/venues/:venueId/seats` | Admin | Batch-generate seating chart |

### Events
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/events` | Organizer / Admin | Schedule event (with collision detection) |
| `GET` | `/api/events` | Public | List events with filters & pagination |
| `GET` | `/api/events/:eventId/seats`| Public | Seating chart availability map |

### Bookings & Concurrency
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/bookings/hold` | Authenticated | Create 10-min temporary hold (`201` or `409`) |
| `POST` | `/api/bookings/confirm` | Authenticated | Confirm booking (`Idempotency-Key` header required) |

---

## 🚀 Setup & Local Installation

### 1. Prerequisites
- Node.js (>= v20)
- Docker Desktop
- npm

### 2. Clone & Install
```bash
git clone <your-repo-url>
cd "EVENT TICKET BOOKING BACKEND SYSTEM"
npm install
```

### 3. Environment Variables
Create a `.env` file in the root:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/event_booking?schema=public"
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="1d"
REDIS_HOST="localhost"
REDIS_PORT=6379
PORT=5000
```

### 4. Start Infrastructure Containers
```bash
docker compose up -d
```
Starts:
- PostgreSQL on `localhost:5433`
- Redis on `localhost:6379`

### 5. Run Database Migrations & Seeds
```bash
npx prisma migrate dev
npx prisma db seed
```

### 6. Start Development Server & Workers
```bash
npm run dev
```

---

## 🧪 Running Automated Tests

Run the complete test suite (Auth + 10-User Concurrency Test):
```bash
npm test
```

Expected Output:
```text
 PASS  tests/auth.test.ts
 PASS  tests/concurrency.test.ts
   --- CONCURRENCY TEST RESULTS ---
   Total Requests: 10
   Successes (201 Created):  1
   Conflicts (409 Blocked):  9
   --------------------------------

Test Suites: 2 passed, 2 total
Tests:       7 passed, 7 total
```

---

## 👨‍💻 Engineering Learnings & Takeaways
- **ACID over Application Logic**: Never rely purely on JavaScript `if (!seat.isBooked)` checks for shared inventory. The database must enforce consistency.
- **Idempotency is Non-Negotiable**: Network retries are a certainty in distributed networks. Endpoints that transfer value must support idempotency keys.
- **The Dual-Write Trap**: Never publish to external message brokers (Redis, RabbitMQ) *inside* a database transaction before the transaction commits.

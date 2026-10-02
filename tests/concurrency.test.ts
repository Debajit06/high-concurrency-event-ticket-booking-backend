import request from "supertest";
import app from "../src/app";
import prisma from "../src/lib/prisma";
import jwt from "jsonwebtoken";

describe("Concurrency & Race Condition Prevention", () => {
  let eventId: string;
  let seatId: string;
  let venueId: string;
  const userTokens: string[] = [];
  const testUserIds: string[] = [];

  beforeAll(async () => {
    // 1. Create a dedicated test Venue
    const venue = await prisma.venue.create({
      data: {
        name: "Concurrency Arena",
        address: "100 Race Condition Blvd",
        city: "San Francisco",
        capacity: 500,
      },
    });
    venueId = venue.id;

    // 2. Create a single competitive Seat
    const seat = await prisma.seat.create({
      data: {
        venueId,
        section: "RACE",
        row: "Z",
        seatNumber: 99,
      },
    });
    seatId = seat.id;

    // 3. Create a test Organizer and Event
    const organizer = await prisma.user.create({
      data: {
        name: "Test Organizer",
        email: `organizer_${Date.now()}@example.com`,
        password: "hash",
        role: "ORGANIZER",
      },
    });
    testUserIds.push(organizer.id);

    const event = await prisma.event.create({
      data: {
        title: "High Concurrency Festival",
        description: "Stress test event",
        startTime: new Date(Date.now() + 86400000),
        endTime: new Date(Date.now() + 90000000),
        venueId,
        organizerId: organizer.id,
      },
    });
    eventId = event.id;

    // 4. Create 10 distinct users and generate valid JWT tokens for them
    for (let i = 1; i <= 10; i++) {
      const user = await prisma.user.create({
        data: {
          name: `Concurrent User ${i}`,
          email: `race_user_${i}_${Date.now()}@example.com`,
          password: "hash",
          role: "CUSTOMER",
        },
      });
      testUserIds.push(user.id);

      const token = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET as string,
        { expiresIn: "1h" }
      );
      userTokens.push(token);
    }
  });

  afterAll(async () => {
    // Cleanup test data
    await prisma.seatHold.deleteMany({ where: { eventId } });
    await prisma.booking.deleteMany({ where: { eventId } });
    await prisma.seat.deleteMany({ where: { venueId } });
    await prisma.event.deleteMany({ where: { id: eventId } });
    await prisma.venue.deleteMany({ where: { id: venueId } });
    await prisma.user.deleteMany({ where: { id: { in: testUserIds } } });
    await prisma.$disconnect();
  });

  it("should allow EXACTLY 1 user to hold the seat when 10 concurrent requests hit simultaneously", async () => {
    // Fire all 10 hold requests simultaneously in parallel!
    const responses = await Promise.all(
      userTokens.map((token) =>
        request(app)
          .post("/api/bookings/hold")
          .set("Authorization", `Bearer ${token}`)
          .send({ eventId, seatId })
      )
    );

    // Count how many got 201 Created vs 409 Conflict
    const successCount = responses.filter((r) => r.status === 201).length;
    const conflictCount = responses.filter((r) => r.status === 409).length;

    console.log(`\n--- CONCURRENCY TEST RESULTS ---`);
    console.log(`Total Requests: 10`);
    console.log(`Successes (201 Created):  ${successCount}`);
    console.log(`Conflicts (409 Blocked):  ${conflictCount}`);
    console.log(`--------------------------------\n`);

    // Strict assertions:
    expect(successCount).toBe(1);
    expect(conflictCount).toBe(9);

    // Verify PostgreSQL database state: exactly 1 hold row must exist!
    const holdsInDb = await prisma.seatHold.count({
      where: { eventId, seatId },
    });
    expect(holdsInDb).toBe(1);
  });
});


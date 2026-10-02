import request from "supertest";
import app from "../src/app";
import prisma from "../src/lib/prisma";

describe("Authentication & Authorization API", () => {
  const testUser = {
    name: "Jest Test User",
    email: `jest_test_${Date.now()}@example.com`,
    password: "Password123@",
  };

  let authToken: string;

  // Cleanup after all tests finish
  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { contains: "jest_test_" } },
    });
    await prisma.$disconnect();
  });

  it("should register a new user successfully", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send(testUser);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("user");
    expect(res.body.user.email).toBe(testUser.email);
    expect(res.body.user).not.toHaveProperty("password"); // Password must never leak!
  });

  it("should reject duplicate email registration", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send(testUser);

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/already exists/i);
  });

  it("should login with valid credentials and return a JWT token", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
    authToken = res.body.token; // Save for protected route test
  });

  it("should reject login with wrong password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: testUser.email,
        password: "WrongPassword999!",
      });

    expect(res.status).toBe(401);
  });

  it("should allow access to protected profile with valid token", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(testUser.email);
  });

  it("should reject access to protected profile without token", async () => {
    const res = await request(app).get("/api/auth/me");

    expect(res.status).toBe(401);
  });
});

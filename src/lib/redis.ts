import Redis from "ioredis";

export const redisConnection = {
  host: process.env.REDIS_HOST || "localhost",
  port: Number(process.env.REDIS_PORT) || 6379,
  maxRetriesPerRequest: null,
  ...(process.env.REDIS_PASSWORD ? { password: process.env.REDIS_PASSWORD } : {}),
  ...(process.env.REDIS_TLS === "true" ? { tls: {} } : {}),
};

export const redisClient = new Redis(redisConnection as any);

redisClient.on("connect", () => {
  console.log("Redis connection successfully established");
});

redisClient.on("error", (error) => {
  console.error("Redis connection error", error);
});

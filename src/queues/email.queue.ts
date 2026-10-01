import { Queue } from "bullmq";
import { redisConnection } from "../lib/redis";

export interface EmailJobData {
  to: string;
  bookingId: string;
  eventTitle: string;
  seatInfo: string;
}

export const emailQueue = new Queue<EmailJobData>("email-queue", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 5, 
    backoff: {
      type: "exponential",
      delay: 2000, 
    },
    removeOnComplete: true,
  },
});

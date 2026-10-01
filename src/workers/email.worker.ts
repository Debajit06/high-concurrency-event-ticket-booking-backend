import { Worker, Job } from "bullmq";
import { redisConnection } from "../lib/redis";
import { EmailJobData } from "../queues/email.queue";


export const emailWorker = new Worker<EmailJobData>(
  "email-queue",
  async (job: Job<EmailJobData>) => {
    const { to, bookingId, eventTitle, seatInfo } = job.data;
    console.log(`[EmailWorker] 📧 Sending booking confirmation email to: ${to}...`);

await new Promise((resolve) => setTimeout(resolve, 800));

console.log(`-----------------------------------------------------`);

console.log(`📩 TICKET CONFIRMATION EMAIL SENT`);
    console.log(`To:        ${to}`);
    console.log(`Booking:   ${bookingId}`);
    console.log(`Event:     ${eventTitle}`);
    console.log(`Seat:      ${seatInfo}`);
    console.log(`Status:    DELIVERED ✅`);
    console.log(`-----------------------------------------------------`);
  },
  {
    connection: redisConnection,
  }
);
emailWorker.on("completed", (job) => {
  console.log(`[EmailWorker] Email job ${job.id} completed successfully`);
});
emailWorker.on("failed", (job, err) => {
  console.error(`[EmailWorker] Email job ${job?.id} failed: ${err.message}`);
});

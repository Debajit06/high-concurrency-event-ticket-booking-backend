import { Queue } from "bullmq";
import {redisConnection} from "../lib/redis";
import { Connection } from "pg";


export interface HoldExpirationJobData {
  holdId: string;
  eventId: string;
  seatId: string;
}

export const bookingQueue = new Queue<HoldExpirationJobData>
("booking-queue",{
    connection:redisConnection,
    defaultJobOptions:{
        attempts:3,

        backoff:{
            type:"exponential",
            delay:1000
        },
        removeOnComplete:true,
        removeOnFail:100
    },
});

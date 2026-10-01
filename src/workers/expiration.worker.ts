import { Worker,Job} from "bullmq";
import prisma  from "../lib/prisma";
import { redisConnection } from "../lib/redis";
import { HoldExpirationJobData } from "../queues/booking.queue";


export const expirationWorker = new Worker<HoldExpirationJobData>
("booking-queue",
    async (Job:Job<HoldExpirationJobData>)=>{
        const{holdId,eventId,seatId}=Job.data;
        console.log(`[Worker] Processing expiration check for Hold: ${holdId}`);

        const confirmBooking= await prisma.booking.findUnique({
            where:{
                eventId_seatId:{eventId,seatId}
            }
        

        })
        if(confirmBooking){
           console.log(`[Worker] Seat ${seatId} was already confirmed. Skipping release.`);
      return; 
        }
        const hold=await prisma .seatHold.findUnique({
            where:{
                id:holdId
            }
        })
        if(!hold){
           console.log(`[Worker] Hold ${holdId} not found. Skipping release.`);
           return; 
        }
        if(hold.expiresAt> new Date()){
            console.log(`[Worker] Hold ${holdId} is still active until ${hold.expiresAt.toISOString()}. Skipping.`);
      return;

        }

        await prisma.seatHold.delete({
            where:{
                id:holdId
            }
        });
        console.log(`[Worker] ⏰ Hold ${holdId} expired. Seat ${seatId} has been released!`);
        
    },
    {
        connection:redisConnection
    }
);

expirationWorker.on("completed",(Job)=>{
    console.log(`[Worker] Completed job ${Job.id}`);
});

expirationWorker.on("error",(error)=>{
    console.error(`[Worker] Error:`,error);
});

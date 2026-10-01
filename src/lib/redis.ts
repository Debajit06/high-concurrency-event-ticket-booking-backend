import Redis from "ioredis";



export const redisConnection ={
    host:process.env.REDIS_HOST||"localhost",
    port:Number(process.env.REDIS_PORT)||6379,
    maxRetriesPerRequest:null

};


export const redisClient=new Redis(redisConnection);

redisClient.on("connect",()=>{
    console.log("Redis connection succesfully established");
});

redisClient.on("error",(error)=>{
    console.error("Redis connection error",error)
})
import express from "express";
import prisma from "./lib/prisma";
import authRouter from "./routes/auth.routes";
import venueRouter from "./routes/venue.routes";

const app = express();
app.use(express.json());

app.get("/health",async(req,res)=>{
    try{
        await prisma.$queryRaw`SELECT 1`
        res.status(200).json({status:"OK",message:"Server is healthy",database:"connected"})

    } catch(error){
        res.status(503).json({status:"error",message:"Database connection failed",error})

    }
    
})
app.use("/api/auth",authRouter);
app.use("/api/venues",venueRouter)


export default app;
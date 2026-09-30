import {Response } from "express"
import { holdSeat,confirmBooking } from "../services/booking.service";
import { AuthRequest } from "../middlewares/auth.middleware";

export const holdSeatHandler =async(req:AuthRequest,res:Response)=>{
    try{
    const{eventId,seatId}=req.body;

    if(!eventId||!seatId){
        return res.status(400).json({message:"Missing required parameters"})
    }

    const userId = req.user?.userId;

    if(!userId){
        return res.status(401).json({message:"Unauthorized"})
    }
    const seatHold=await holdSeat(eventId,seatId,userId);
    return res.status(201).json(seatHold);

} catch(error:any){
    if (
    error.message === "Seat is already booked" ||
    error.message === "Seat is currently held by another user" ||
    error.message === "Seat hold has expired or does not exist" ||
    error.message === "You do not have an active hold on this seat"
  ) {
    return res.status(409).json({ message: error.message });
  }
  return res.status(500).json({ message: error.message });
}

    
}

export const confirmBookingHandler=async(req:AuthRequest,res:Response)=>{
    try{
        const{eventId,seatId}=req.body;
        const idempotencyKey = req.headers['idempotency-key'] as string;

        if(!eventId||!seatId){
            return res.status(400).json({message:"Missing required parameters"})
        }
        if(!idempotencyKey){
            return res.status(400).json({message:"Missing idempotency-key"})
        }
        const userId=req.user?.userId;
        if(!userId){
            return res.status(401).json({message:"Unauthorized"})
        }
        const booking=await confirmBooking(userId,eventId,seatId,idempotencyKey);
        return res.status(200).json(booking);


    }

    catch(error:any){
        return res.status(409).json({message:error.message})
    }
}
import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import {createEvent,getEvents} from '../services/event.service';




export const createEventHandler=async(req:AuthRequest,res:Response)=>{
    try{
        const{ title, description, startTime, endTime, venueId}=req.body;
        const organizerId=req.user?.userId;

        if(!organizerId){
            return res.status(403).json({
                message:"unauthorized"
            })
        }
        
        if(!title || !startTime || !endTime || !venueId){
            return res.status(400).json({ message: "Title, startTime, endTime, and venueId are required" });
        }

        const event=await createEvent({
            title,
            description,
            startTime,
            endTime,
            venueId,
            organizerId,
        })
    return res.status(201).json({
      message: "Event created successfully",
      event,
    });

    }
    catch(error:any){
        if (error.message === "Venue not found") {
      return res.status(404).json({ message: error.message });
    }
    if (
      error.message === "Venue is already booked during this time window." ||
      error.message === "Event start time must be before end time"
    ) {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: error.message || "Internal server error" });
  

    }

}

export const getEventsHandler = async (req: AuthRequest, res: Response) => {
  try {
    const queryParams: { city?: string; page?: number; limit?: number } = {};
    if (req.query.city) queryParams.city = String(req.query.city);
    if (req.query.page) queryParams.page = Number(req.query.page);
    if (req.query.limit) queryParams.limit = Number(req.query.limit);
    const result = await getEvents(queryParams);
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(500).json({ message: error.message || "Internal server error" });
  }
};
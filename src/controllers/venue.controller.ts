import { Request,Response } from "express";
import {createVenue, getAllVenues} from "../services/venue.service"



export const  createVanueHandler=async(req:Request,res:Response)=>{
    try{

        const{name,address,city,capacity}=req.body;
        if(!name||!address||!city||capacity==undefined){
            return res.status(400).json({message:"All field are required"})
        }

        const numericCapacity=Number(capacity);
        if(isNaN(numericCapacity)|| numericCapacity<=0){
            return res.status(400).json({message:"Capacity must be a valid positive number"});
        }
        const venue=await createVenue({
            name,
            address,
            city,
            capacity:numericCapacity,
        })

        return res.status(201).json({
            message:"Venue created successfully",
            data:venue
        })

    }catch(error){
        return res.status(500).json({
            message:"Internal server error",
            error
        })

    }
}

export const getAllVenueHandler=async(req:Request,res:Response)=>{
    try{
        const values= await getAllVenues();
        return res.status(200).json({
            message:"Venues fetched successfully",
            data:values,
        });

    }catch(error){
        return res.status(500).json({
            message:"Internal server error",
            error
        });

    }
}
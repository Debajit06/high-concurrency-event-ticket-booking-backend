import { Request,Response } from "express";
import { registerUser } from "../services/auth.service";



export const register=async(req:Request,res:Response)=>{
    try{
        const{email,password,name}=req.body
        if(!email||!password||!name){
           return res.status(400).json({message:"all field are required"})
        }

        const result=await registerUser(email,password,name)
        return res.status(201).json(result)
    
    }catch(error:any){

        if(error.message==="User already exists"){
            return res.status(409).json({message:error.message})
        }
        return res.status(500).json({message:"Internal server error"})

    }
    
}
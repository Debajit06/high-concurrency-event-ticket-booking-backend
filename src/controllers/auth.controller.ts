import { Request,Response } from "express";
import { registerUser,loginUser } from "../services/auth.service";



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

export const login=async(req:Request,res:Response)=>{
    try{
        const{email,password}=req.body;
        if(!email||!password){
            return res.status(400).json({ message: "Email and password are required"})
        }
        const result=await loginUser(email,password)
        res.status(200).json(result)

    }
    catch(error:any){
        if(error.message==="Invalid email or password"){
            return res.status(401).json({message:error.message})
        }
        res.status(500).json({message:error.message})

    }
}
import { Request,Response } from "express";
import { registerUser,loginUser } from "../services/auth.service";
import { AuthRequest } from "../middlewares/auth.middleware";
import prisma from "../lib/prisma";



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

export const getProfile=async(req:AuthRequest,res:Response)=>{
    try{
        const userId=req.user?.userId;

        if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

        const user=await prisma.user.findUnique({
            where: {id:userId},
            select:{
                id:true,
                name:true,
                email:true,
                role:true,
                createdAt:true
            }
        })
        if(!user){
            return res.status(404).json({message:"User not found"})


        }
        return res.status(200).json({user})
    }catch (error: any) {
    return res.status(500).json({message:error.message})
    
}
} 
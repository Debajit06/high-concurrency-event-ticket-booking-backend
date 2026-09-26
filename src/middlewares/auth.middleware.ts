import { Request,Response,NextFunction } from "express";
import jwt from "jsonwebtoken";


export interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
  };
}

export const authenticate =async(req:AuthRequest,res:Response,next:NextFunction)=>{
 const authHeader=req.headers.authorization;

 if(!authHeader){
  return res.status(401).json({
    success:false,
    message:"Unauthorized"
  })
 }


 const[schema,token]=authHeader?.split(" ")

 if(!authHeader || schema !=="Bearer"||!token){
    return res.status(401).json({
        success:false,
        message:"Unauthorized"
    })
 }

 
  try{
    const decodedToken=jwt.verify(token,process.env.JWT_SECRET as string) as {userId:string,role:string};
    req.user=decodedToken;
    next();
  }catch(error){
    res.status(401).json({
      success:false,
      message:"Unauthorized"
    })
  }
}

export const authorizationRole=(...allowedRoles:string[])=>{
  return(req:AuthRequest,res:Response,next:NextFunction)=>{
    if(!req.user||!allowedRoles.includes(req.user.role)){
      return res.status(403).json({
        success:false,
        message:"Forbidden: You do not have permission to perform this action",
      })

    }

    next()
  }
}
import bcrypt from "bcryptjs";
import prisma from "../lib/prisma";



export const registerUser = async(email:string,password:string,name:string)=>{
    try{
       const existingUser= await prisma.user.findUnique({
            where:{email}
        })
        if(existingUser){
            throw new Error("User already exists")
        }
        const hashPassword = await bcrypt.hash(password,10);
       const createdUser = await prisma.user.create({
            data: { name, email, password: hashPassword },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
            }
       })
        return {
            message:"User created successfully",
            user:createdUser
        }

    }
    catch(error){
        throw error

    }
    
    
    
}
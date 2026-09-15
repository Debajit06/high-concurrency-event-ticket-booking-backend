import bcrypt from "bcryptjs";
import prisma from "../lib/prisma";
import jwt from "jsonwebtoken";



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

export const loginUser = async (email: string, password: string) => {
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (!existingUser) {
    throw new Error("Invalid email or password");
  }

  const isPasswordValid = await bcrypt.compare(password, existingUser.password);
  if (!isPasswordValid) {
    throw new Error("Invalid email or password");
  }

  const token = jwt.sign(
    { userId: existingUser.id, role: existingUser.role },
    process.env.JWT_SECRET as string,
    { expiresIn: "1d" }
  );

  return {
    message: "User logged in successfully",
    user: {
      id: existingUser.id,
      name: existingUser.name,
      email: existingUser.email,
      role: existingUser.role,
    },
    token,
  };
};

import bcrypt from "bcryptjs";
import prisma from "../src/lib/prisma";



async function main() {
    const adminEmail="admin123@gmail.com";

    const existingAdmin=await prisma.user.findUnique({
        where:{email:adminEmail}
    })
    if(!existingAdmin){
        const hashPassword=await bcrypt.hash("Debajit610@",10);
         const admin=await prisma.user.create({
            data:{
                name: "Super Admin",
                email: adminEmail,
                password: hashPassword,
                role: "ADMIN", 
            }
        })
        console.log("Admin user seeded successfully:", admin.email);
    }else{
        console.log("Admin user already exists:", existingAdmin.email);
    }


}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

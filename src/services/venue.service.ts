import prisma  from "../lib/prisma";



export interface createVenueDTO {
    name:string;
    address:string;
    city:string;
    capacity:number;
    
}

export const createVenue = async(data:createVenueDTO)=>{
    return prisma.venue.create({
        data
    })
}

export const getAllVenues = async()=>{
    return await prisma.venue.findMany({
        include:{
            _count:{
                select:{
                    events:true,
                    seats:true,
                }
            }
        }
    })
}



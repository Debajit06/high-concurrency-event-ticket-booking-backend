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

export interface seatInput {
    section:string,
    row:string,
    seatNumber:number

}

export const addSeatToVenue=async(venueId:string,seats:seatInput[])=>{
    const venue=await prisma.venue.findUnique({
        where:{
            id:venueId
        }
    })
    if(!venue){
        throw new Error("venue not found")
    }

    const seatData=seats.map((seat)=>({
        venueId,
        section:seat.section,
        row:seat.row,
        seatNumber:seat.seatNumber

    }));

    return await prisma.seat.createMany({
        data:seatData,
        skipDuplicates:true
    })

    
}



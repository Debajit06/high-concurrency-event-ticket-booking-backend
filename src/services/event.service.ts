import prisma from "../lib/prisma";


export interface createEventDTO{
title: string;
description?: string;
startTime: string; 
endTime: string;
venueId: string;
organizerId: string;
}

export const createEvent =async (data:createEventDTO)=>{
    const start=new Date(data.startTime);
    const end= new Date(data.endTime);

    if(start>=end){
        throw new Error("Event start time must be before end time")
    }

    const venue=await prisma.venue.findUnique({
        where:{
            id:data.venueId
        }
    })
    if(!venue){
        throw new Error("Venue not found!")
    }
    const conflict= await prisma.event.findFirst({
        where:{
            venueId:data.venueId,
            AND:[
                {startTime:{lt:end}},
                {endTime:{gt:start}}
            ]
        }
    })
    if(conflict){
        throw new Error("Venue is already booked during this time window.")
    }

    return await prisma.event.create({
        data:{
            title: data.title,
             description: data.description||"",
            startTime: start,
            endTime: end,
            venueId: data.venueId,
            organizerId: data.organizerId,

        },
        include: {
      venue: true,
    },
    })
    

}

export const getEvents = async (query: { city?: string; page?: number; limit?: number }) => {
  const page = query.page && query.page > 0 ? query.page : 1;
  const limit = query.limit && query.limit > 0 ? query.limit : 10;
  const skip = (page - 1) * limit;
  const whereClause: any = {};
  if (query.city) {
    whereClause.venue = {
      city: { contains: query.city, mode: "insensitive" },
    };
  }
  const [events, total] = await Promise.all([
    prisma.event.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: { startTime: "asc" },
      include: {
        venue: true,
        organizer: {
          select: { id: true, name: true, email: true },
        },
      },
    }),
    prisma.event.count({ where: whereClause }),
  ]);
  return {
    events,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getEventSeat=async(eventId:string)=>{
  const event=await prisma.event.findUnique({
    where:{
      id:eventId
    },select:{
      id:true,
      title:true,
      venueId:true
    }
  })
  if(!event){
    throw new Error("Event not found!")
  }

  const seats= await prisma.seat.findMany({
    where:{ venueId:event.venueId},
    orderBy: [
      { section: "asc" },
      { row: "asc" },
      { seatNumber: "asc" },
    ]
  })
  
  return { event, seats };
  
}


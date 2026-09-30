import prisma from "../lib/prisma";

export const holdSeat = async (eventId: string, seatId: string, userId: string) => {
  return await prisma.$transaction(async (tx) => {
    const existingBooking = await tx.booking.findUnique({
      where: {
        eventId_seatId: { eventId, seatId },
      },
    });

    if (existingBooking) {
      throw new Error("Seat is already booked");
    }

    const existingHold = await tx.seatHold.findUnique({
      where: {
        eventId_seatId: { eventId, seatId },
      },
    });

    if (existingHold) {
      const isStillActive = existingHold.expiresAt > new Date();

      if (isStillActive) {
        if (existingHold.userId === userId) {
          return existingHold;
        }
        throw new Error("Seat is currently held by another user");
      }

      await tx.seatHold.delete({
        where: { id: existingHold.id },
      });
    }

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    return await tx.seatHold.create({
      data: {
        eventId,
        seatId,
        userId,
        expiresAt,
      },
      include: {
        seat: true,
        event: {
          select: { title: true },
        },
      },
    });
  });
};

export const confirmBooking = async (
  userId: string,
  eventId: string,
  seatId: string,
  idempotencyKey: string
) => {
  return await prisma.$transaction(async (tx) => {
    // 1. Idempotency check: if already confirmed with this key, return it safely
    const existingBooking = await tx.booking.findUnique({
      where: { idempotencyKey },
      include: {
        seat: true,
        event: {
          select: { title: true },
        },
      },
    });

    if (existingBooking) {
      return existingBooking;
    }

    // 2. Validate hold: verify hold exists, has not expired, and belongs to user
    const existingHold = await tx.seatHold.findUnique({
      where: {
        eventId_seatId: { eventId, seatId },
      },
    });

    if (!existingHold || existingHold.expiresAt <= new Date()) {
      throw new Error("Seat hold has expired or does not exist");
    }

    if (existingHold.userId !== userId) {
      throw new Error("You do not have an active hold on this seat");
    }

    // 3. Delete the temporary hold record
    await tx.seatHold.delete({
      where: { id: existingHold.id },
    });

    // 4. Create the permanent confirmed booking
    return await tx.booking.create({
      data: {
        eventId,
        seatId,
        userId,
        status: "CONFIRMED",
        idempotencyKey,
      },
      include: {
        seat: true,
        event: {
          select: { title: true },
        },
      },
    });
  });
};

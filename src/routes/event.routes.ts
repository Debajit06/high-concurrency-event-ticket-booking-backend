import express from "express";
import { createEventHandler, getEventsHandler,getEventSeatHandler } from "../controllers/event.controller";
import { authenticate, authorizationRole } from "../middlewares/auth.middleware";


const eventRoutes =express.Router();


eventRoutes.get("/",getEventsHandler);
eventRoutes.post("/",authenticate,authorizationRole("ORGANIZER","ADMIN"),createEventHandler)
eventRoutes.get("/:eventId/seats",getEventSeatHandler);

export default eventRoutes;
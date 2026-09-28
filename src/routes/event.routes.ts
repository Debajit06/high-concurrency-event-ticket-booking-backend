import express from "express";
import { createEventHandler, getEventsHandler } from "../controllers/event.controller";
import { authenticate, authorizationRole } from "../middlewares/auth.middleware";


const eventRoutes =express.Router();


eventRoutes.get("/",getEventsHandler);
eventRoutes.post("/",authenticate,authorizationRole("ORGANIZER","ADMIN"),createEventHandler)


export default eventRoutes;
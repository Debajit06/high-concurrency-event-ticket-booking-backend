import express from "express";
import { authenticate,authorizationRole } from "../middlewares/auth.middleware";
import { createVanueHandler, getAllVenueHandler,addSeatHandler } from "../controllers/venue.controller";



const venueRouter =express.Router();

venueRouter.post("/",authenticate,authorizationRole("ADMIN"),createVanueHandler);
venueRouter.get("/",getAllVenueHandler);
venueRouter.post("/:venueId/seats",authenticate,authorizationRole("ADMIN"),addSeatHandler)

export default venueRouter;

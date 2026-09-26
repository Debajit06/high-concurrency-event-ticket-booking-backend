import express from "express";
import { authenticate,authorizationRole } from "../middlewares/auth.middleware";
import { createVanueHandler, getAllVenueHandler } from "../controllers/venue.controller";



const venueRouter =express.Router();

venueRouter.post("/",authenticate,authorizationRole("ADMIN"),createVanueHandler);
venueRouter.get("/",getAllVenueHandler);

export default venueRouter;

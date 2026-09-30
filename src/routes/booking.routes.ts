import express from "express";
import { authenticate } from "../middlewares/auth.middleware";
import {holdSeatHandler,confirmBookingHandler} from "../controllers/booking.controller";


const bookigRouter=express.Router();

bookigRouter.post("/hold",authenticate,holdSeatHandler)
bookigRouter.post("/confirm",authenticate,confirmBookingHandler)

export default bookigRouter
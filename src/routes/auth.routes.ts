import express from "express"
import {authenticate} from "../middlewares/auth.middleware"
import {register,login,getProfile} from "../controllers/auth.controller"

const authRouter=express.Router();

authRouter.post("/register",register);
authRouter.post("/login",login)

authRouter.get("/me",authenticate,getProfile)

export default authRouter

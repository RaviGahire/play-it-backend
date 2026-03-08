import { Router } from "express";
import { loginUser, logoutUser, refreshAccessToken, registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js"
import { verifyJwtToken } from "../middlewares/auth.middleware.js";

const router = Router()

// register
router.route("/register").post(upload.fields([{name:"avatar",maxCount:1},{name:"coverImage",maxCount:1}]),registerUser)

// login 
router.route("/login").post(loginUser)

// secured routes
router.route("/logout").post(verifyJwtToken,logoutUser)
router.route("/refresh-token").post(refreshAccessToken)

export default router
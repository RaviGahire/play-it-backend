import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js"

const router = Router()

// register
router.route("/register").post(upload.fields([{name:"avatar",maxCount:2},{name:"coverImage",maxCount:1}]),registerUser)








export default router
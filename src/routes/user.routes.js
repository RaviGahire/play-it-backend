import { Router } from "express";
import { changeCurrentUserPassword, getCurrentUser, loginUser, logoutUser, refreshAccessToken, registerUser, updateUserAccountDetails, updateUserAvatar, updateUserCoverImage } from "../controllers/user.controller.js";
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


//change user password 
router.route("/change-password").post(changeCurrentUserPassword)

//get user profile 
router.route("/profile").get(getCurrentUser)

//update user account details
router.route("/update").post(updateUserAccountDetails)

//file updation routes
router.route("/update-avatar").post(updateUserAvatar)
router.route("/update-cover-image").post(updateUserCoverImage)

export default router
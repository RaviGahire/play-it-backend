import { Router } from "express";
import { changeCurrentUserPassword, getCurrentUser, getUserChannelProfile, loginUser, logoutUser, refreshAccessToken, registerUser, updateUserAccountDetails, updateUserAvatar, updateUserCoverImage } from "../controllers/user.controller.js";
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
router.route("/change-password").post(verifyJwtToken,changeCurrentUserPassword)

//get user profile 
router.route("/current-user").get(verifyJwtToken,getCurrentUser)

//update user account details
router.route("/update-user-details").post(verifyJwtToken,updateUserAccountDetails)

//image update routes
router.route("/update-avatar").post(verifyJwtToken,upload.single("avatar") ,updateUserAvatar)
router.route("/update-cover-image").post(verifyJwtToken,upload.single("coverImage"),updateUserCoverImage) 

//get User Channel Profile
router.get("/channel-profile/:username", verifyJwtToken, getUserChannelProfile)

export default router
import { Router } from "express";
import { changeCurrentUserPassword, getCurrentUser, getUserChannelProfile, getUserWatchHistory, loginUser, logoutUser, refreshAccessToken, registerUser, updateUserAccountDetails, updateUserAvatar, updateUserCoverImage } from "../controllers/user.controller.js";
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
router.route("/update-user-details").patch(verifyJwtToken,updateUserAccountDetails)

//image update routes
router.route("/update-avatar").patch(verifyJwtToken,upload.single("avatar") ,updateUserAvatar)
router.route("/update-cover-image").patch(verifyJwtToken,upload.single("coverImage"),updateUserCoverImage) 

//get User Channel Profile
router.route("/channel-profile/:username").get(verifyJwtToken, getUserChannelProfile)

//get user watch history
router.route("/watch-history").get(verifyJwtToken,getUserWatchHistory)

export default router
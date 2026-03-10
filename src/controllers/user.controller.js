import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudnary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"
import fs from "fs"
import mongoose from "mongoose"


// custom method for access and refresh token
const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        if (!user) { throw new ApiError(404, "User not found") }
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken

        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(500, error?.message || "Something went wrong while generating refresh and access token")
    }
}
// user routes
export const registerUser = asyncHandler(async (req, res) => {
    // get data from frontend
    const { fullname, username, email, password } = req.body
    // file validation
    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;
    try {

        // validation 
        if ([fullname, username, email, password,].some((field) => field?.trim() === "")) {
            throw new ApiError(400, "All fields are required")
        }

        // user already exists
        const existedUser = await User.findOne({ $or: [{ email }, { username }] })
        if (existedUser) {
            throw new ApiError(409, "User email or username already exists")
        }

        let coverImage;
        if (coverImageLocalPath) {
            coverImage = await uploadOnCloudinary(coverImageLocalPath);
        }

        if (!avatarLocalPath) {
            throw new ApiError(400, "Avatar file is Required")
        }
        const avatar = await uploadOnCloudinary(avatarLocalPath)
        if (!avatar) {
            throw new ApiError(400, "Avatar file is Required")
        }
        // Create user
        const user = await User.create({
            fullname,
            avatar: avatar.url,
            coverImage: coverImage?.url || "",
            email,
            password,
            username,
        })

        const createdUser = await User.findById(user._id).select("-password -refreshToken") // remove pass and token
        if (!createdUser) {
            throw new ApiError(500, "User registration failed")
        }
        return res.status(201).json(new ApiResponse(200, createdUser, "User register successfully"))

    } catch (error) {
        if (avatarLocalPath && fs.existsSync(avatarLocalPath)) {
            fs.unlinkSync(avatarLocalPath);
        }

        if (coverImageLocalPath && fs.existsSync(coverImageLocalPath)) {
            fs.unlinkSync(coverImageLocalPath);
        }

        return res.status(error.statusCode || 500).json(new ApiError(500, null, error.message))

    }

})

//login
export const loginUser = asyncHandler(async (req, res) => {

    const { username, email, password } = req.body

    // check if both not available 
    if (!(username || email)) {
        throw new ApiError(400, "Username or Email is required")
    }

    //find user using email or username 
    const user = await User.findOne({ $or: [{ username }, { email }] })

    if (!user) {
        throw new ApiError(401, "User does not exist")
    }

    // console.log(user)
    // check password using custom method isPasswordCorrect
    const isPassValid = await user.isPasswordCorrect(password)

    if (!isPassValid) {
        throw new ApiError(401, "Invalid credentials")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id) // passed user id 

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")


    //send kookies
    const options = {
        httpOnly: true,
        secure: true
    }

    //send to client 
    return res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(200, { user: loggedInUser, accessToken, refreshToken }, "User logged in successfully"))

})

//Logout user 
export const logoutUser = asyncHandler(async (req, res) => {

    const userId = req.user._id

    await User.findByIdAndUpdate(
        userId, {
        $set: {
            refreshToken: undefined
        },
        new: true
    }
    )
    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged out successfully"))

})

//Refresh token
export const refreshAccessToken = asyncHandler(async (req, res) => {
    //acess refresh token for both mobile and web
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    console.log("incomingRefreshToken", incomingRefreshToken)

    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }

    //try catch block
    try {
        const decodedRefreshToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

        if (!decodedRefreshToken) {
            throw new ApiError(401, "Token not found")
        }

        const userId = decodedRefreshToken?._id

        const user = await User.findById(userId)

        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Rerfresh token is expired or used")
        }

        const options = {
            httpOnly: true,
            secure: true
        }

        const { accessToken, newRefreshToken } = await generateAccessAndRefreshTokens(user._id)

        return res.status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(new ApiResponse(200, { accessToken, refreshToken: newRefreshToken }, "Access token refresh successfully"))
    } catch (error) {
        throw new ApiError(401, error.message, "Invalid refresh token")

    }
})

//change password
export const changeCurrentUserPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body

    if (!oldPassword || !newPassword) {
        throw new ApiError(400, "Please provide both passwords")
    }

    const user = await User.findById(req.user?._id)
    if (!user) {
        throw new ApiError(404, "User not found")
    }

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(401, "invalid old password")
    }

    user.password = newPassword

    await user.save({ validateBeforeSave: false })

    return res.status(200)
        .json(new ApiResponse(200, {}, "Password chnaged successfully"))

})

//forgot password


// get current logged in user
export const getCurrentUser = asyncHandler(async (req, res) => {

    const currentUser = req.user

    if (!currentUser) {
        throw new ApiError(401, "current user not found")
    }
    return res.status(200).json(new ApiResponse(200, currentUser, "Current user fetched successfully"))
})

// update user
export const updateUserAccountDetails = asyncHandler(async (req, res) => {
    const { fullname, email } = req.body
    // console.log(fullname,email)

    if (!(fullname.trim() && email.trim())) {
        throw new ApiError(400, "All fields are required")
    }

    const userId = req.user?._id
    const updatedUser = await User.findByIdAndUpdate(userId, {
        $set: {
            fullname, email
        }
    }, { new: true }).select("-password")

    return res.status(200)
        .json(new ApiResponse(200, updatedUser, "Account details updated successfully"))

})

//file update endpoint 
//update user avatar
export const updateUserAvatar = asyncHandler(async (req, res) => {

    let avatarLocalPath = req.file?.path
    // console.log(avatarLocalPath)

    if (!avatarLocalPath) {
        throw new ApiError(400, "avatar file is missing")
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath)

    console.log(avatar)

    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading avatar")
    }

    await User.findByIdAndUpdate(
        req.user?._id, {
        $set: { avatar: avatar.url }
    }, { new: true })

    return res.status(200).json(new ApiResponse(200, {}, "Avatar updated sucessfully"))

})

//update cover image
export const updateUserCoverImage = asyncHandler(async (req, res) => {

    let coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover image file is missing")
    }
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading cover image")
    }

    await User.findByIdAndUpdate(
        req.user?._id, {
        $set: { coverImage: coverImage.url }
    }, { new: true })

    return res.status(200).json(new ApiResponse(200, {}, "Cover image updated sucessfully"))

})

//aggrigation pipeline route

export const getUserChannelProfile = asyncHandler(async (req, res) => {

    const { username } = req.params

    if (!username?.trim()) {
        throw new ApiError(400, "Username is missing")
    }
    //aggregation piple line
    const channel = await User.aggregate([
        { $match: { username: username } }, // matches the requested username
        {
            $lookup: {                     //Subscribers of this channel field matches this user's _id
                from: "subscriptions",
                localField: "_id", //current user's _id
                foreignField: "channel", //field in subscriptions
                as: "subscribers" //output array name
            }
        },
        {
            $lookup: { //Get all channels this user has subscribed to
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscribers",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: { $size: "$subscribers" },    // total number of subscribers
                channelsSubscribedToCount: { $size: "$subscribedTo" }, // total channels this user subscribed to
                isSubscribed: {
                    $cond: { //condition
                        if: { $in: [req.user._id, "$subscribers.subscriber"] }, //check if logged-in user's id exists
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: { // sent selectedd fields to frontend
                fullname: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                avatar: 1,
                coverImage: 1,
                email: 1
            }
        }

    ])

    if (channel?.length) {
        throw new ApiError(404, "channel does not exists")
    }

    return res.status(200).json(new ApiResponse(200, channel[0], "User channel fetched successfully"))

})

export const getUserWatchHistory = asyncHandler(async (req, res) => {
    // nested pipeline
    const user = await User.aggregate(
        [{
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        }, {
            $lookup: {
                from: "videos",
                foreignField: "_id",
                localField: "watchHistroy",
                as: "watchHistory",

                // Nested pipline
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",

                            // nested pipline
                            pipeline: [
                                {
                                    $project: {
                                        fullname: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }])

        return res.status(200).json(new ApiResponse(200,user[0].watchHistory,"Watch history fetched successfully"))
})
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import  {User}  from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudnary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import fs from "fs"


// custom method for access and refresh token
const generateAccessAndRefreshTokens = async (userId) => {
    try {
        // find user 
        const user = await User.findById(userId)
        //generating tokens
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        //save 
        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        //return both
        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating access and referesh tokens")
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

    try {
        //find user using email or username 
        const user = await User.findOne({ $or: [ {username}, {email} ] })
    
        if (!user) {
            throw new ApiError(404, "User does not exist")
        }

        // console.log(user)
        // check password using custom method isPasswordCorrect
        const isPassValid = await user.isPasswordCorrect(password)

        if (!isPassValid) {
            throw new ApiError(401, "Invalid passowrd")
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

    } catch (error) {
        return res.status(500).json(new ApiError(error.statusCode, "Internal server error", error.message))
    }
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
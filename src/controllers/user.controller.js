import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudnary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import fs from "fs"

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


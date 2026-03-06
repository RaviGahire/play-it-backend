import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudnary.js"
import { ApiResponse } from "../utils/ApiResponse.js"

// user routes
export const registerUser = asyncHandler(async (req, res) => {
    // get data from frontend
    const { fullname, username, email, password } = req.body

    // validation 
    if ([fullname, username, email, password,].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required")
    }

    // user already exists
    const existedUser = await User.findOne({ $or: [{ email }, { username }] })

    if (existedUser) {
        throw new ApiError(409, "User email or username already exists")
    }

    // file validation
    const avatarLocalPath = req.files?.avatar[0]?.path;

    // for cover image
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;
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

    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username,

    })

    const createdUser = await User.findById(user._id).select("-password -refreshToken")

    if (!createdUser) {
        throw new ApiError(500, "User registration failed")
    }
    return res.status(201).json(new ApiResponse(200, createdUser, "User register successfully"))
})


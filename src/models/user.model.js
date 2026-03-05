import mongoose, { Schema } from "mongoose";

const userSchema = new Schema({
    username: {
        type: String,
        required: [true , "Username is required"],
        unique: true,
        lowercase: true,
        trim: true,
        index: true
    },
    email: {
        type: String,
        required: [true , "Email is required"],
        unique: true,
        lowercase: true,
        trim: true,

    },
    fullname: {
        type: String,
        required: [true , "Fullname is required"],
        trim: true,

    },
    avatar: {
        type: String,
        required: true,
        trim: true,

    },
    coverImage: {
        type: String,
           
    },
    watchHistory:{
        type: Schema.Types.ObjectId,
        ref:"Video"
    },
    password:{
        type:String,
        required:[true , "Password is required"]
    },
    refreshToken:{
        type:String
    }

},{timestamps:true})

export const User = mongoose.model("User", userSchema)
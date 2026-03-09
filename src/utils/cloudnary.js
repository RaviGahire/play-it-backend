import { v2 as cloudinary } from "cloudinary"
import fs from "fs"
import { ApiError } from "./ApiError.js"


// basic config 
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_SECRET_KEY,
    secure: true
})



// create function to handle file upload
const uploadOnCloudinary = async (localFilePath) => {

    try {
        if (!localFilePath) { throw "File path is required" }

        // Upload file 
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })

        // file has been uplaoded successfully
        // console.log("file is uploaded successfully")

        // delete temp file after successful upload
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }

        return response

    } catch (error) {
        fs.unlinkSync(localFilePath);
        console.error("Cloudinary upload error:", error)
       throw new ApiError(413, "File size is too large. Max file size is 4 MB")
        return null;
    }
}

export { uploadOnCloudinary }
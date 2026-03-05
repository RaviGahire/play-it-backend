import { v2 as cloudinary } from "cloudinary"
import { error } from "console"
import fs from "fs"

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
        console.log("file is uploaded successfully")

        return response

    } catch (error) {

        fs.unlinkSync(localFilePath) // remove the locally saved temporary file as the upload operation got failed
        return null
    }
}

export {uploadOnCloudinary}
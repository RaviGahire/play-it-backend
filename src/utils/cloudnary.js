import { v2 as cloudinary } from "cloudinary"
import fs from "fs"



// basic config 
cloudinary.config({
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
    api_key:process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_SECRET_KEY,
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
             // delete temp file after successful upload
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }

        return response

    } catch (error) {

       // delete temp file if upload failed
        if (localFilePath && fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }

        console.error("Cloudinary upload error:", error);

        return null;
    }
}

export {uploadOnCloudinary}
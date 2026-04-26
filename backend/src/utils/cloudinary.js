import { v2 as cloudinary } from 'cloudinary'
import fs from 'fs'
import { ApiError } from './apiError.js';

const uploadFileToCloudinary = async (localFilePath, resourceType = "auto") =>{

  cloudinary.config({ 
  cloud_name: process.env.CLOUD_NAME, 
  api_key: process.env.API_KEY, 
  api_secret: process.env.API_SECRET, 
});

  try {
   console.log("file path", localFilePath)
   
    if(localFilePath){

      let uploadOptions = {
        resource_type: resourceType, // "auto" for images, "video" for videos
        folder: "User_Avatars",       // Organizes into a folder
      }

      if (resourceType === "video") {
          // VIDEO BACKGROUND PROCESSING :
          // Instead of compressing synchronously (which hangs the server),
          // we tell Cloudinary to compress the video in the background!
          uploadOptions.eager = [
              { quality: "auto", fetch_format: "auto" }
          ];
          uploadOptions.eager_async = true; 
      } else {
          // SYNCHRONOUS PROCESSING (Images only):
          // For images, we can compress immediately because images are tiny and fast!
          uploadOptions.quality = "auto";
          uploadOptions.fetch_format = "auto";
      }

    let response = await cloudinary.uploader.upload(localFilePath , uploadOptions)
    fs.unlinkSync(localFilePath)
    return response
  }
  } catch (error) {
    console.log("ERROR" , error)
    fs.unlinkSync(localFilePath)
    throw new ApiError(error.status || 500 ,  error.message || "something went wrong", error)

  }


}


const deleteFileFromCloudinary = async (fileUrl) => {

    cloudinary.config({ 
  cloud_name: process.env.CLOUD_NAME, 
  api_key: process.env.API_KEY, 
  api_secret: process.env.API_SECRET, 
});


  try {

    if(!fileUrl) return new ApiError(500 , "file url not found")

         // Extracting public ID from URL
        // Example: https://res.cloudinary.com/cloud/image/upload/v123/uploads/abc.webp -> uploads/abc

        const publicId = fileUrl.split('/').slice(-2).join('/').split('.')[0];
        console.log(publicId, "publicID")
        const response = cloudinary.uploader.destroy(publicId,{
          resource_type: 'image', 
        invalidate: true              // Clears CDN cache immediately
      })
      
      return response
    
  } catch (error) {

      throw new ApiError( error.message || "something went wrong", error.status || 500 , error)
  }

}


export {uploadFileToCloudinary , deleteFileFromCloudinary}
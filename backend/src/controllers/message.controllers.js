import {Message} from "../models/message.model.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Chat } from "../models/chat.model.js";
import { uploadFileToCloudinary } from "../utils/cloudinary.js";
import { deleteFileFromCloudinary } from "../utils/cloudinary.js";
import mongoose from "mongoose";
const commonMessageAggregation = () => {
  return [
    {
      $lookup: {
        from: "users",
        localField: "sender",
        foreignField: "_id",
        as: "sender",
        pipeline: [
          {
            $project: {
              username: 1,
              avatar: 1,
              email: 1,
            },
          },
        ],
      },
    },

    {
        $addFields : {
            sender : {$first : "$sender"}
        }
    }
  ];
};



const sendMessage = asyncHandler(async (req , res , next)=>{
    const {id} = req.user
    const {chatId} = req.params
    const {content} = req.body

    if(!content && !req.files?.attachements?.length){
       throw new ApiError(401,"Message content or attachment is required")
    }

    const findChat = await Chat.findOne({_id :  chatId})

    if(!findChat){
       throw new ApiError(401 , "chat does not exist")
    }

    let filesPathUploadedToCloudinary = []

    if(req.files?.attachements && req.files.attachements.length >= 1){
      // Upload files in parallel using Promise.all
      const uploadPromises = req.files.attachements.map(async (file) => {
        console.log("processing file ", file.originalname)
        const uploadedFile = await uploadFileToCloudinary(file?.path)
        return uploadedFile.url
      });

      filesPathUploadedToCloudinary = await Promise.all(uploadPromises);
    }


    console.log(filesPathUploadedToCloudinary , "Files uploaded cloudnary")
 




})


export {sendMessage}
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { Chat } from "../models/chat.model.js";
import logger from "../logger/winston.logger.js";
import mongoose from "mongoose";
import { emitSocketEvents } from "../sockets/index.js";
import { ChatEventEnum } from "../constant.js";

const commonChatAggregation = () =>{
   return [


  {

    // we have lookup from the chatSchema inside the userSchema to get all participants details
    // from userSchema and join them in chatSchema
    $lookup: {
     from: "users",
     localField: "participants",
     foreignField: "_id",
     as: "participants",
      pipeline : [
        {
           $project: {
              password: 0,
              refreshToken: 0,
              forgotPasswordToken: 0,
              forgotPasswordExpiry: 0,
              emailVerificationToken: 0,
              emailVerificationExpiry: 0,
              authProvider : 0,
			isVerified : 0,
             googleId : 0,
            },
        }
      ]
      
   },
  },


  {
    // we have lookup from the chatSchema inside the messageSchema to get lastMessage details 
    // from the message schema and add that details inside chatSchema
    //
    $lookup: {
      from: "messages",
      localField: "lastMessage",
      foreignField: "_id",
      as: "lastMessage",
      pipeline : [
        {   // what ever details we got inside the lastMessage key of chatSchema we then
            // further look 
            // we go in lastMessage and lookup from that lastMessage (which is inside chatSchema)
            // to the userSchema and gets all details related to the sender of the lastMessage

          $lookup :{
            from : 'users',
            localField : "sender",
            foreignField : "_id",
            as : "sender",
            pipeline : [
              {
                $project : {	
				          username : 1,
                  avatar : 1,
                  _id : 1,
                  email : 1
                  
                }
              }
            ]
          }
        },  

        {
          $addFields : {
            sender : {$first : "$sender"}
          }
        }
      ],

      
      
    },
    
    
  },
  

  {
    $addFields: {
      lastMessage: {$first : "$lastMessage"}
    }
  }

  
]
}


const createOneOnONeChat = asyncHandler(async (req ,res , next)=>{
  const {receiverId} = req.params
  const {id} = req.user

  const findUser = await User.findById(receiverId)

  //* 1 
  // confirm that the user to whom message will be send must exists
  if(!findUser){
    res.status(400).json(new ApiResponse(400 , "The user you wants to chat does not exists "))
  }

  //* 2
  // check is loggin user is trying to chat with himself
  if(receiverId === id){
    res.status(400).json(new ApiResponse(400 , "You can not chat to your self"))
  }

   //* 3
  // now we will check does ? we have any previous chat related to loggin user and receiver user
  // for this we will write aggregation pipeline why , bcz other option is to get all the data from backend
  // and check everything here which can slow the server

  const chatAggregation = await Chat.aggregate([
    {
   $match: {
     isGroupChat : false,

     $and : [
       {
         participants : {
           $elemMatch : {$eq : ObjectId(id)}
         },

         participants : {
            $elemMatch : {$eq : ObjectId(new mongoose.Types.ObjectId(receiverId))} 
            // coverting string receiverId to (Type: BSON ObjectId) so that we can use this to lookup inside documents 
         }
       }
     ],

   },

 },

 ...commonChatAggregation()

  ])


  //*4
  // if we find chats means these both user already created a chat
  if(chatAggregation.length){
    return res.status(200).json(new ApiResponse(200 , chatAggregation[0] , "Chat fetched Succesfully"))
  }


  //* 5
  // if not then we will create chat between both users
  const newChatInstance = new Chat.create({
    chatCreatedBy : id,
    participants : [id , new mongoose.Types.ObjectId(receiverId)],
  })


  //* 6 (In Above  aggregation piepline we find the chat document and proccesed it using the praticipants ids )
  //* here we will do the same aggregaation but using the exisitng chat ID  it self

  const chatAggregation2 = Chat.aggregate([
      {
        $match : {
          _id : newChatInstance._id
        }
      },

      ...commonChatAggregation
  ])

  console.log(chatAggregation2 , "Aggregation result")
  
  const payload = chatAggregation2[0]

  if(!payload){
   res.status(200).send(new ApiError(400 , "Internal Server Error"))
  }


  payload.participants?.foreach((items)=>{

    console.log("items" , items)

    if(items._id.toString() === id.toString()) return
    emitSocketEvents(req , items._id , ChatEventEnum.NEW_CHAT_EVENT , payload)

  });


res.status(200).json(
  new ApiResponse(200 ,"chat retreived succesfully" , payload)
)


})


export {createOneOnONeChat}
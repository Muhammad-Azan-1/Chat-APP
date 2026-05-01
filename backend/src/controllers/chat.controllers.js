import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { Chat } from "../models/chat.model.js";
import logger from "../logger/winston.logger.js";
import mongoose from "mongoose";
import { emitSocketEvents } from "../sockets/index.js";
import { ChatEventEnum } from "../constant.js";

const commonChatAggregation = () => {
  return [
    {
      // we have lookup from the chatSchema inside the userSchema to get all participants details
      // from userSchema and join them in chatSchema
      $lookup: {
        from: "users",
        localField: "participants",
        foreignField: "_id",
        as: "participants",
        pipeline: [
          {
            $project: {
              password: 0,
              refreshToken: 0,
              forgotPasswordToken: 0,
              forgotPasswordExpiry: 0,
              emailVerificationToken: 0,
              emailVerificationExpiry: 0,
              authProvider: 0,
              isVerified: 0,
              googleId: 0,
            },
          },
        ],
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
        pipeline: [
          {
            // what ever details we got inside the lastMessage key of chatSchema we then
            // further look
            // we go in lastMessage and lookup from that lastMessage (which is inside chatSchema)
            // to the userSchema and gets all details related to the sender of the lastMessage

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
                    _id: 1,
                    email: 1,
                  },
                },
              ],
            },
          },

          {
            $addFields: {
              sender: { $first: "$sender" },
            },
          },
        ],
      },
    },

    {
      $addFields: {
        lastMessage: { $first: "$lastMessage" },
      },
    },
  ];
};



//* One on One Chats

const createOneOnONeChat = asyncHandler(async (req, res, next) => {
  const { receiverId } = req.params;
  const { id } = req.user;

  // console.log(receiverId, id);

  const findUser = await User.findById(receiverId);

  //* 1
  // confirm that the user to whom message will be send must exists
  if (!findUser) {
    return res
      .status(400)
      .json(
        new ApiResponse(400, "The user you wants to chat does not exists "),
      );
  }

  //* 2
  // check is loggin user is trying to chat with himself
  if (receiverId === id) {
    return res
      .status(400)
      .json(new ApiResponse(400, "You can not chat to your self"));
  }

  //* 3
  // now we will check does ? we have any previous chat related to loggin user and receiver user
  // for this we will write aggregation pipeline why , bcz other option is to get all the data from backend
  // and check everything here which can slow the server

  const chatAggregation = await Chat.aggregate([
    {
      $match: {
        isGroupChat: false,
        $and: [
          {
            participants: {
              $elemMatch: { $eq: new mongoose.Types.ObjectId(id) },
            },
          },
          {
            participants: {
              $elemMatch: { $eq: new mongoose.Types.ObjectId(receiverId) },
            },
          },
        ],
      },
    },

    ...commonChatAggregation(),
  ]);

  //*4
  // if we find chats means these both user already created a chat
  if (chatAggregation.length) {
    return res
      .status(200)
      .json(
        new ApiResponse(200,  "Chat fetched Succesfully" , chatAggregation[0]),
      );
  }

  //* 5
  // if not then we will create chat between both users
  const newChatInstance = await Chat.create({
    chatCreatedBy: id,
    participants: [
      new mongoose.Types.ObjectId(id),
      new mongoose.Types.ObjectId(receiverId),
    ],
  });

  //* 6 (In Above  aggregation piepline we find the chat document and proccesed it using the praticipants ids )
  //* here we will do the same aggregaation but using the exisitng chat ID  it self

  const chatAggregation2 = await Chat.aggregate([
    {
      $match: {
        _id: newChatInstance._id,
      },
    },

    ...commonChatAggregation(),
  ]);

  // console.log(chatAggregation2, "Aggregation result");

  const payload = chatAggregation2[0];

  // console.log("PAYLOAD", payload)

  if (!payload) {
    throw new ApiError(500, "Internal Server Error");
  }

  payload.participants?.forEach((items) => {
    console.log("items", items);

    // 1. Are you the person who created the chat (Ali)?
    // If yes, STOP. You already got the HTTP response.
    if (items._id.toString() === id.toString()) return;

    // 2. Are you the OTHER person (Zaid)?
    // If yes, I am going to ping your personal "User ID Room"
    console.log(`[TESTING] Emitting newChat to Room ID: "${items._id.toString()}"`);
    emitSocketEvents(req, items._id.toString() , ChatEventEnum.NEW_CHAT_EVENT, payload);
  });

  res
    .status(200)
    .json(new ApiResponse(200, "chat retreived succesfully", payload));
});


const deleteOneOnOneChat = asyncHandler(async (req, res, next)=>{

  const {chatId} = req.params
  const {id} = req.user

  const chat = await Chat.aggregate([
    {

      $match : {
        _id : new mongoose.Types.ObjectId(chatId)
      }
    },

    ...commonChatAggregation()
  ])


  const payload = chat[0]

  if(!payload){
    new ApiError(401 , "chat does not exsits" ,payload ) 
  }


  // deleting chats
   await Chat.findByIdAndDelete(chatId)

  // deleting messages related to that chats if exists
  

  // get other particiaptes so that we can emit Event from them to know that chat is deleted 
  const participants = payload?.participants?.find((p) => p._id !== id  )


  emitSocketEvents(
    req ,
    participants._id,
    ChatEventEnum.LEAVE_CHAT_EVENT,
    payload
  )


  return res.status(200).json(new ApiResponse(200 , "chat deleted succesfully" , {}))

})




//* Group chats




// * get all Chats of a User

const getAllChats = asyncHandler(async (req, res, next) => {
  logger.info("some one hit get all chats")

  const { id } = req.user;

  // console.log(id)

  const chats = await Chat.aggregate([
    {
      $match: {
        participants: { $elemMatch: { $eq: new mongoose.Types.ObjectId(id) } },
      },
    },

    {
      $sort: {
        updatedAt: -1,
      },
    },

   ...commonChatAggregation()
   ,

  { // most Important pipeline see it detials in below Example: (getAllChats)
    $match : {
        $or :[
          {chatCreatedBy : new mongoose.Types.ObjectId(id)},
          {lastMessage : {$exists : true , $ne : null}}
        ]
    }
  }

  ]);
  

  return res.status(200).json(new ApiResponse(200, "chat fetched successfully" , chats))
});


//* get a Single chat for a User
const getChatById = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const { id } = req.user;

  const chatAggregation = await Chat.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(chatId),
      },
    },
    ...commonChatAggregation(),
  ]);

  const chat = chatAggregation[0];

  if (!chat) {
    throw new ApiError(404, "Chat does not exist");
  }

  // Verify user is a participant
  const isParticipant = chat.participants.some(
    (p) => p._id.toString() === id.toString()
  );

  if (!isParticipant) {
    throw new ApiError(403, "You are not a participant of this chat");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Chat fetched successfully", chat));
});




export { createOneOnONeChat , getAllChats , deleteOneOnOneChat, getChatById };




// //? Exmaple Get All Chats : 

// Current Pipeline:                                                                                                                                                                                                          
//   1. First $match - filters chats where user is a participant                                                                                                                                                                
//   2. $sort - sorts by updatedAt                                                                                                                                                                                              
//   3. ...commonChatAggregation() - does lookups to populate participants and lastMessage                                                                                                                                      
//   4. (Proposed) Second $match - filters based on chatCreatedBy OR lastMessage                                                                                                                                                
                                                                                                                                                                                                                             
//   The user is asking:                                                                                                                                                                                                        
//   - What does each stage do?                                                                                                                                                                                                 
//   - How do documents flow through the pipeline?                                                                                                                                                                              
//   - What happens when we apply the second $match after commonChatAggregation?                                                                                                                                                
                                                                                                                                                                                                                             
//   Let me explain this step by step with an example scenario.                                                                                                                                                                 
                                                                                                                                                                                                                             
//   Example Scenario:                                                                                                                                                                                                          
//   - User A (id: "123") is logged in                                                                                                                                                                                          
//   - Database has 3 chats:                                                                                                                                                                                                    
//     - Chat 1: User A created with User B (no messages)      
//     - Chat 2: User C created with User A (no messages)                                                                                                                                                                       
//     - Chat 3: User A with User D (has messages)                                                                                                                                                                              
                                                                                                                                                                                                                             
//   Pipeline Flow:                                                                                                                                                                                                             
                                                                                                                                                                                                                             
//   Stage 1 - First $match:                                                                                                                                                                                                    
//   {                                                                                                                                                                                                                          
//     $match: {                                                                                                                                                                                                                
//       participants: { $elemMatch: { $eq: new mongoose.Types.ObjectId(id) } }
//     }                                                                                                                                                                                                                        
//   }                                                                                                                                                                                                                          
//   This filters: "Give me all chats where User A is a participant"                                                                                                                                                            
//   Result: Chat 1, Chat 2, Chat 3 (all 3 pass through)                                                                                                                                                                        
                                                                                                                                                                                                                             
//   Stage 2 - $sort:                                                                                                                                                                                                           
//   Sorts by updatedAt (most recent first)                                                                                                                                                                                     
                                                                                                                                                                                                                             
//   Stage 3 - commonChatAggregation():                                                                                                                                                                                         
//   This does $lookup operations:                                                                                                                                                                                              
//   - Populates participants array with full user details                                                                                                                                                                      
//   - Populates lastMessage with message details (if exists)                                                                                                                                                                   
                                                                                                                                                                                                                             
//   After this stage:                                                                                                                                                                                                          
//   - Chat 1: participants populated, lastMessage = null                                                                                                                                                                       
//   - Chat 2: participants populated, lastMessage = null                                                                                                                                                                       
//   - Chat 3: participants populated, lastMessage = {message object}                                                                                                                                                           
                                                                                                                                                                                                                             
//   Stage 4 - Second $match (proposed):                                                                                                                                                                                        
//   {                                                                                                                                                                                                                          
//     $match: {                                                                                                                                                                                                                
//       $or: [                                                                                                                                                                                                                 
//         { chatCreatedBy: new mongoose.Types.ObjectId(id) }, 
//         { lastMessage: { $exists: true, $ne: null } }                                                                                                                                                                        
//       ]                                                                                                                                                                                                                      
//     }                                                                                                                                                                                                                        
//   }                                                                                                                                                                                                                          
                                                                                                                                                                                                                             
//   This filters: "Keep only chats where User A created it OR it has messages"                                                                                                                                                 
                                                                                                                                                                                                                             
//   Checking each chat:                                                                                                                                                                                                        
//   - Chat 1: chatCreatedBy = "123" (User A) → PASSES (User A created it)                                                                                                                                                      
//   - Chat 2: chatCreatedBy = "456" (User C), lastMessage = null → FAILS (User A didn't create it, no messages)                                                                                                                
//   - Chat 3: lastMessage exists → PASSES (has messages)                                                       
                                                                                                                                                                                                                             
//   Final result: Chat 1 and Chat 3 are returned to User A                                                                                                                                                                     
                                                                                                                                                                                                                             
//   This is exactly what we want! User A sees chats they created and chats with messages, but not chats others created with them that have no messages yet.                                                                    
                                                                                                                                                                                                                             
                                                                                                                                                                                                                             
//   Great question! Let me walk you through the entire aggregation pipeline flow step by step with a real example.
                                                                                                                                                                                                                             
//   📊 Pipeline Flow Explanation                              
                                                                                                                                                                                                                             
//   Example Scenario:                                                                                                                                                                                                          
  
//   User A (you, id: "123") is logged in                                                                                                                                                                                       
                                                            
//   Database has 3 chats:                                                                                                                                                                                                      
//   1. Chat 1: User A created with User B (no messages yet)   
//   2. Chat 2: User C created with User A (no messages yet)                                                                                                                                                                    
//   3. Chat 3: User A with User D (has 5 messages)
                                                                                                                                                                                                                             
//   ---                                                       
//   🔄 Stage-by-Stage Flow:
                                                                                                                                                                                                                             
//   Stage 1: First $match
                                                                                                                                                                                                                             
//   {                                                                                                                                                                                                                          
//     $match: {                                                                                                                                                                                                                
//       participants: { $elemMatch: { $eq: new mongoose.Types.ObjectId(id) } }                                                                                                                                                 
//     }                                                                                                                                                                                                                        
//   }                                                                                                                                                                                                                          
                                                                                                                                                                                                                             
//   What it does: "Give me all chats where User A is a participant"                                                                                                                                                            
  
//   Documents passing through:                                                                                                                                                                                                 
//   - ✅ Chat 1 (User A is participant)                       
//   - ✅ Chat 2 (User A is participant)                                                                                                                                                                                        
//   - ✅ Chat 3 (User A is participant)                       
                                                                                                                                                                                                                             
//   Result: 3 documents continue to next stage                                                                                                                                                                                 
                                                                                                                                                                                                                             
//   ---                                                                                                                                                                                                                        
//   Stage 2: $sort                                                                                                                                                                                                             
                                                                                                                                                                                                                             
//   {
//     $sort: { updatedAt: -1 }                                                                                                                                                                                                 
//   }                                                                                                                                                                                                                          
  
//   What it does: Sorts chats by most recent first                                                                                                                                                                             
                                                            
//   Documents: Still 3 chats, now sorted                                                                                                                                                                                       
                                                            
//   ---                                                                                                                                                                                                                        
//   Stage 3: ...commonChatAggregation()                       
                                                                                                                                                                                                                             
//   What it does:
//   - Does $lookup to populate participants with full user details                                                                                                                                                             
//   - Does $lookup to populate lastMessage with message details                                                                                                                                                                
                                                                                                                                                                                                                             
//   Documents after this stage:                                                                                                                                                                                                
                                                                                                                                                                                                                             
//   // Chat 1                                                                                                                                                                                                                  
//   {                                                                                                                                                                                                                          
//     _id: "chat1",                                                                                                                                                                                                            
//     chatCreatedBy: "123", // User A created it                                                                                                                                                                               
//     participants: [                                                                                                                                                                                                          
//       { _id: "123", username: "UserA", avatar: "..." },                                                                                                                                                                      
//       { _id: "456", username: "UserB", avatar: "..." }                                                                                                                                                                       
//     ],                                                                                                                                                                                                                       
//     lastMessage: null  // ❌ No messages yet                                                                                                                                                                                 
//   }                                                                                                                                                                                                                          
                                                                                                                                                                                                                             
//   // Chat 2                                                                                                                                                                                                                  
//   {                                                                                                                                                                                                                          
//     _id: "chat2",                                                                                                                                                                                                            
//     chatCreatedBy: "789", // User C created it                                                                                                                                                                               
//     participants: [                                                                                                                                                                                                          
//       { _id: "789", username: "UserC", avatar: "..." },                                                                                                                                                                      
//       { _id: "123", username: "UserA", avatar: "..." }                                                                                                                                                                       
//     ],                                                                                                                                                                                                                       
//     lastMessage: null  // ❌ No messages yet                                                                                                                                                                                 
//   }                                                                                                                                                                                                                          
                                                                                                                                                                                                                             
//   // Chat 3                                                                                                                                                                                                                  
//   {                                                                                                                                                                                                                          
//     _id: "chat3",                                                                                                                                                                                                            
//     chatCreatedBy: "123",                                                                                                                                                                                                    
//     participants: [...],                                                                                                                                                                                                     
//     lastMessage: {  // ✅ Has messages                                                                                                                                                                                       
//       _id: "msg1",                                                                                                                                                                                                           
//       message: "Hello!",                                                                                                                                                                                                     
//       sender: {...}                                                                                                                                                                                                          
//     }                                                                                                                                                                                                                        
//   }                                                                                                                                                                                                                          
                                                                                                                                                                                                                             
//   Result: 3 fully populated documents                                                                                                                                                                                        
  
//   ---                                                                                                                                                                                                                        
//   Stage 4: Second $match (NEW - what we'll add)             
                                                                                                                                                                                                                             
//   {
//     $match: {                                                                                                                                                                                                                
//       $or: [                                                                                                                                                                                                                 
//         { chatCreatedBy: new mongoose.Types.ObjectId("123") },  // Did I create it?                                                                                                                                          
//         { lastMessage: { $exists: true, $ne: null } }           // Has messages?                                                                                                                                             
//       ]                                                                                                                                                                                                                      
//     }                                                                                                                                                                                                                        
//   }                                                                                                                                                                                                                          
                                                                                                                                                                                                                             
//   What it does: "Keep only chats where User A created it OR it has messages"                                                                                                                                                 
  
//   Checking each document:                                                                                                                                                                                                    
                                                            
//   Chat 1:                                                                                                                                                                                                                    
//   - chatCreatedBy === "123" ✅ (User A created it)          
//   - PASSES → Continues to response                                                                                                                                                                                           
  
//   Chat 2:                                                                                                                                                                                                                    
//   - chatCreatedBy === "789" ❌ (User C created it, not User A)
//   - lastMessage === null ❌ (No messages)                                                                                                                                                                                    
//   - FAILS → Filtered out                                    
                                                                                                                                                                                                                             
//   Chat 3:                                                                                                                                                                                                                    
//   - lastMessage exists ✅ (Has messages)                                                                                                                                                                                     
//   - PASSES → Continues to response                                                                                                                                                                                           
                                                                                                                                                                                                                             
//   ---                                                                                                                                                                                                                        
//   ✅ Final Result Sent to User A:                                                                                                                                                                                            
                                                                                                                                                                                                                             
//   [                                                                                                                                                                                                                          
//     Chat 1,  // User A created it (even without messages)                                                                                                                                                                    
//     Chat 3   // Has messages                                                                                                                                                                                                 
//   ]                                                                                                                                                                                                                          
                                                                                                                                                                                                                             
//   Chat 2 is hidden because User A didn't create it and it has no messages yet.                                                                                                                                               
                                                            
//   ---                                                                                                                                                                                                                        
//   🎯 Summary:                                               
                                                                                                                                                                                                                             
//   1. First $match → Filters by participant (gets all chats I'm in)
//   2. $sort → Orders them                                                                                                                                                                                                     
//   3. commonChatAggregation() → Populates full details (participants, lastMessage)                                                                                                                                            
//   4. Second $match → Filters again based on populated data (creator OR has messages)                                                                                                                                         
                                                                                                                                                                                                                             
//   The second $match works on the enriched documents after lookups, so it can check the lastMessage field that was populated in stage 3.                                                                                      

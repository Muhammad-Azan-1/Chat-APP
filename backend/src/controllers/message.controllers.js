import mongoose from "mongoose";
import { ChatEventEnum } from "../constant.js";
import { Chat } from "../models/chat.model.js";
import { Message } from "../models/message.model.js";
import { emitSocketEvents } from "../sockets/index.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadFileToCloudinary, deleteFileFromCloudinary } from "../utils/cloudinary.js";

/**
 * @description Utility function which returns the pipeline stages to structure the chat message schema with common lookups
 * @returns {mongoose.PipelineStage[]}
 */
const chatMessageCommonAggregation = () => {
  return [
    {
      $lookup: {
        from: "users",
        foreignField: "_id",
        localField: "sender",
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
      $addFields: {
        sender: { $first: "$sender" },
      },
    },
  ];
};

const getAllMessages = asyncHandler(async (req, res) => {
  const { chatId } = req.params;

  const selectedChat = await Chat.findById(chatId);

  if (!selectedChat) {
    throw new ApiError(404, "Chat does not exist");
  }

  // Only send messages if the logged in user is a part of the chat he is requesting messages of
  if (!selectedChat.participants?.includes(req.user?._id)) {
    throw new ApiError(400, "User is not a part of this chat");
  }

  const messages = await Message.aggregate([
    {
      $match: {
        chat: new mongoose.Types.ObjectId(chatId),
      },
    },
    ...chatMessageCommonAggregation(),
    {
      $sort: {
        createdAt: -1,
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(200,  "Messages fetched successfully" , messages || [])
    );
});

const sendMessage = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const { message } = req.body;

  if (!message && !req.files?.attachments?.length) {
    throw new ApiError(400, "Message content or attachment is required");
  }

  const selectedChat = await Chat.findById(chatId);

  if (!selectedChat) {
    throw new ApiError(404, "Chat does not exist");
  }

  let filesPathUploadedToCloudinary = [];

  if (req.files?.attachments && req.files.attachments.length >= 1) {
    // Upload files in parallel using Promise.all
    const uploadPromises = req.files.attachments.map(async (file) => {
      console.log("processing file ", file.originalname);
      const uploadedFile = await uploadFileToCloudinary(file?.path);
      return {
        url: uploadedFile.url
      };
    });

    filesPathUploadedToCloudinary = await Promise.all(uploadPromises);
  }

  // Create a new message instance with appropriate metadata
  const newMessage = await Message.create({
    sender: new mongoose.Types.ObjectId(req.user._id),
    message: message || "",
    chat: new mongoose.Types.ObjectId(chatId),
    attachements: filesPathUploadedToCloudinary,
  });

  // update the chat's last message which could be utilized to show last message in the list item
  const chat = await Chat.findByIdAndUpdate(
    chatId,
    {
      $set: {
        lastMessage: newMessage._id,
      },
    },
    { new: true }
  );

  // structure the message
  const messages = await Message.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(newMessage._id),
      },
    },
    ...chatMessageCommonAggregation(),
  ]);

  // Store the aggregation result
  const receivedMessage = messages[0];

  if (!receivedMessage) {
    throw new ApiError(500, "Internal server error");
  }

  // logic to emit socket event about the new message created to the other participants
  chat.participants.forEach((participantObjectId) => {
    // here the chat is the raw instance of the chat in which participants is the array of object ids of users
    // avoid emitting event to the user who is sending the message
    if (participantObjectId.toString() === req.user._id.toString()) return;

    // emit the receive message event to the other participants with received message as the payload
    emitSocketEvents(
      req,
      participantObjectId.toString(),
      ChatEventEnum.MESSAGE_RECEIVED_EVENT,
      receivedMessage
    );
  });

  return res
    .status(201)
    .json(new ApiResponse(201,  "Message saved successfully" ,receivedMessage));
});



const deleteMessage = asyncHandler(async (req, res) => {
  //controller to delete chat messages and attachments

  const { chatId, messageId } = req.params;

  //Find the chat based on chatId and checking if user is a participant of the chat
  const chat = await Chat.findOne({
    _id: new mongoose.Types.ObjectId(chatId),
    participants: req.user?._id,
  });

  if (!chat) {
    throw new ApiError(404, "Chat does not exist");
  }

  //Find the message based on message id
  const messageToDelete = await Message.findOne({
    _id: new mongoose.Types.ObjectId(messageId),
  });

  if (!messageToDelete) {
    throw new ApiError(404, "Message does not exist");
  }

  // Check if user is the sender of the message
  if (messageToDelete.sender.toString() !== req.user._id.toString()) {
    throw new ApiError(
      403,
      "You are not the authorised to delete the message, you are not the sender"
    );
  }

  if (messageToDelete.attachements.length > 0) {
    //If the message has attachments, remove them from Cloudinary
    const deletePromises = messageToDelete.attachements.map(async (asset) => {
      if (asset.url) {
        await deleteFileFromCloudinary(asset.url);
      }
    });
    await Promise.all(deletePromises);
  }

  //deleting the message from DB
  await Message.deleteOne({
    _id: new mongoose.Types.ObjectId(messageId),
  });

  //Updating the last message of the chat to the previous message after deletion if the message deleted was last message
  if (chat.lastMessage.toString() === messageToDelete._id.toString()) {
    const lastMessage = await Message.findOne(
      { chat: chatId },
      {},
      { sort: { createdAt: -1 } }
    );

    await Chat.findByIdAndUpdate(chatId, {
      lastMessage: lastMessage ? lastMessage?._id : null,
    });
  }

  // logic to emit socket event about the message deleted to the other participants
  chat.participants.forEach((participantObjectId) => {
    // here the chat is the raw instance of the chat in which participants is the array of object ids of users
    // avoid emitting event to the user who is deleting the message
    if (participantObjectId.toString() === req.user._id.toString()) return;
    // emit the delete message event to the other participants frontend with delete messageId as the payload
    emitSocketEvents(
      req,
      participantObjectId.toString(),
      ChatEventEnum.MESSAGE_DELETE_EVENT,
      messageToDelete
    );
  });

  return res
    .status(200)
    .json(new ApiResponse(200,  "Message deleted successfully" , messageToDelete));
});

export { getAllMessages, sendMessage, deleteMessage };

import mongoose, { Schema } from "mongoose";
import { types } from "util";

const chatSchema = new Schema(
  {
    chatCreatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    participants: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
      ],
    },

    admins: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],
    },


    isGroupChat: {
      type: Boolean,
      default: false,
    },

    groupName: {
      type: String,
    },

    groupAvatar: {
      type: String,
      default:
        "https://cdn.vectorstock.com/i/500p/53/42/profile-icon-user-avatar-vector-22965342.jpg",
    },

    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
  },
  { timestamps: true },
);

export const Chat = mongoose.model("Chat", chatSchema);

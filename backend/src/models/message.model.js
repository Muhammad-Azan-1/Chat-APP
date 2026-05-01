import { Schema } from "mongoose"
import mongoose from "mongoose"

const messageSchema = new Schema({


    sender : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "User",
        required : true
    },


    message : {
        type : String,
        required : false
    },

    attachements : {
        type : [
            {
                url : String
            }
        ],
         default : []
    },

    chat : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "Chat",
        required : true
    }




}, { timestamps: true })



export  const Message = mongoose.model("Message" , messageSchema)
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
        required : true
    },

    attachements : {
        type : [
            {
                url : String,
                localPath : String
            }
        ],
         default : []
    },

    chat : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "Chat",
        required : true
    }

   


})



export  const Message = mongoose.model("Message" , messageSchema)
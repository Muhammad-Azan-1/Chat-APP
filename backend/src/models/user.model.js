import mongoose , {Schema} from "mongoose";
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import crypto from 'crypto'

import { AvailableLoginTypes , AvailableUserRoles , UserRolesEnum , LoginTypesEnum } from "../constant.js";

const userSchema = new Schema({

    username : {
        type : String,
        required : true,
        trim : true,

    },
    email : {
        type : String,
        required : true,
        trim : true,

    },

    password : {
        type : String
    },

    authProvider : {
        type : String,
        enum : AvailableLoginTypes,
        default :  LoginTypesEnum.EMAIL_PASSWORD,
        required : true
    },

    googleId : {
        type : String,
        unique : true,
        sparse : true
    },

    roles : {
        type : String,
        enum : AvailableUserRoles ,
        default : UserRolesEnum.USER,
        required : true
    },

    avatar : {
        type : String,
        default : "https://cdn.vectorstock.com/i/500p/53/42/profile-icon-user-avatar-vector-22965342.jpg"
    },

    isVerified : {
        type : Boolean,
        default : false
    },

    verificationOTP: {
            type: String 
        },

    verificationToken: {
            type: String 

        },

    verificationExpiry: {
            type: Date 
        },


    resetPasswordToken: {
            type: String // Stores hashed reset token
        },

    resetPasswordExpiry: {
            type: Date
        },

    refreshToken: {
            type: String
        }
    
} , {timestamps : true } )


userSchema.index({email : 1}  , {unique : true})
userSchema.index({username : 1}  , {unique : true})
// sparse: true is CRITICAL here!
// Since users without tokens will have `verificationToken: null`, 
// MongoDB's `unique: true` would normally see multiple users with `null` as a unique violation and crash.
// `sparse: true` tells MongoDB: "Only enforce uniqueness IF the field actually exists and is not null."
userSchema.index({verificationToken : 1}  , {unique : true, sparse: true , default : undefined})
userSchema.index({verificationOTP : 1}  , {unique : true, sparse: true , default : undefined})


/* ------------------ Hooks ------------------ */

 userSchema.pre("save" , async function(){

    if(!this.isModified("password")){
        return
    }

    if(this.password){
    this.password = await bcrypt.hash(this.password , 10)
    }

})

/* ------------------ Methods ------------------ */

userSchema.methods.checkPassword = async function(password){
    return  await bcrypt.compare(password , this.password)
}


userSchema.methods.generateAccessToken =  function (){

    return  jwt.sign(
        {
            id : this._id,
            name : this.fullName,
            email : this.email
        },

        process.env.ACCESS_TOKEN_SECRET,

        {
            expiresIn : process.env.ACCESS_TOKEN_EXPIRY

        }
    )

}



userSchema.methods.generateRefreshToken =  function (){

    return  jwt.sign(
        {
            id : this._id,
        },

        process.env.REFRESH_TOKEN_SECRET,

        {
            expiresIn : process.env.REFRESH_TOKEN_EXPIRY

        }
    )

}


// email setup with both OTP and magic link

userSchema.methods.generateVerficationOTP = function(){

    const OTP =  crypto.randomInt(100000 , 999999).toString()

    const hashedOTP = crypto.createHash('sha256').update(OTP).digest("hex")

    this.verificationOTP = hashedOTP
    this.verificationExpiry = Date.now() + 5 * 60 * 1000

    return OTP
}



userSchema.methods.generateVerficationToken = function(){

        const token = crypto.randomBytes(32).toString("hex")
        const hashedToken = crypto.createHash('sha256').update(token).digest("hex")

        this.verificationToken = hashedToken
        this.verificationExpiry = Date.now() + 5 * 60 * 1000

        return token
    }



    // reset password setup with magic link

userSchema.methods.generateResetPasswordToken = function(){

        const token = crypto.randomBytes(32).toString("hex")
        const hashedToken = crypto.createHash('sha256').update(token).digest("hex")

        this.resetPasswordToken = hashedToken
        this.resetPasswordExpiry = Date.now() + 5 * 60 * 1000

        return token
    }



export const User =  mongoose.model("User" , userSchema)

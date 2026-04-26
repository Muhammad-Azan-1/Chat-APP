import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/apiError.js"
import { asyncHandler } from "../utils/asyncHandler.js"

export const verifyJWT = asyncHandler(async (req, res, next) => {

    console.log(req.headers)

    const token = req.cookies?.accessToken || req.headers?.authorization?.replace("Bearer ", "")

    if (!token) {
        throw new ApiError(401, "Unauthorized — no token provided")
    }

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

    const user = await User.findById(decoded.id).select("-password -refreshToken")

    if (!user) {
        throw new ApiError(401, "Unauthorized — invalid token")
    }

    req.user = user
    next()
})

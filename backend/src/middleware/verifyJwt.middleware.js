import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/apiError.js"
import { asyncHandler } from "../utils/asyncHandler.js"

export const verifyJWT = asyncHandler(async (req, res, next) => {


    // console.log(req.headers)

    const token = req.cookies?.accessToken || req.headers?.authorization?.replace("Bearer ", "")

    if (!token) {
        throw new ApiError(401, "Unauthorized — no token provided")
    }

    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

        const user = await User.findById(decoded.id).select("-password -refreshToken")

        if (!user) {
            throw new ApiError(401, "Unauthorized — invalid token")
        }

        req.user = user
        next()
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw new ApiError(401, "Token expired")
        }
        if (error.name === 'JsonWebTokenError') {
            throw new ApiError(401, "Invalid token")
        }
        throw error
    }
})



// ============================================================================
// SOFT JWT VERIFY — Used ONLY for logout
// ============================================================================
// WHY: When a user's access token expires, jwt.verify() throws an error,
// which means users with expired tokens can NEVER log out (they get a 500).
//
// This middleware uses { ignoreExpiration: true } so it still validates
// the token signature (prevents tampering) but allows expired tokens through.
// If no token at all, we still proceed — logout will just clear cookies.
// ============================================================================

export const verifyJWTSoft = asyncHandler(async (req, res, next) => {
    const token = req.cookies?.accessToken || req.headers?.authorization?.replace("Bearer ", "")

    if (!token) {
        // No token at all — still allow logout to clear cookies
        req.user = null
        return next()
    }

    try {
        // ignoreExpiration: true → decodes even if expired, but still checks signature!
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, { ignoreExpiration: true })
        const user = await User.findById(decoded.id).select("-password -refreshToken")
        req.user = user // Could be null if user was deleted, that's fine
    } catch (error) {
        // Token is completely invalid (tampered) — still allow logout to clear cookies
        req.user = null
    }

    next()
})

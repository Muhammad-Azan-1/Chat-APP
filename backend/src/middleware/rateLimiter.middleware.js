import rateLimit from 'express-rate-limit'

// 1. GLOBAL AUTH LIMITER (DDoS Protection)
// Allows 100 requests per 15 minutes to any auth route.
export const authLimiter = rateLimit({
    windowMs : 15 * 60 * 1000,
    max : 100,
    message: {
        success: false,
        message: "Too many requests from this IP, please try again after 15 minutes"
    },
    standardHeaders: true, 
    legacyHeaders: false 
})

// 2. REGISTRATION LIMITER
// Prevents bots from creating millions of junk accounts at once
export const registerLimiter = rateLimit({
    windowMs:  60 * 60 * 1000,   // 1 hour window
    max: 5,                      // 5 registrations per hour per IP
    message: {
        success: false,
        message: "Too many accounts created from this IP, please try again later"
    },
    standardHeaders: true,
    legacyHeaders: false
})

// 3. LOGIN LIMITER 
// Prevents Brute Force guessing of passwords
export const loginLimiter = rateLimit({
    windowMs:  60 * 1000,   // 60 second window
    max: 3,                 // 3 login attempts per minute per IP
    message: {
        success: false,
        message: "Too many login attempts, please try again after 60 seconds"
    },
    standardHeaders: true,
    legacyHeaders: false
})

// 4. VERIFY EMAIL LIMITER
// Prevents Brute Force guessing of the 6-Digit OTP
export const verifyLimiter = rateLimit({
    windowMs:  60 * 1000,   // 60 second window
    max: 3,                 // 3 attempts per minute to guess OTP
    message: {
        success: false,
        message: "Too many verification attempts. Please wait 60 seconds."
    },
    standardHeaders: true,
    legacyHeaders: false
})

// 5. RESEND EMAIL LIMITER
// Extremely strict. Prevents high AWS/SendGrid bills and inbox spamming.
export const resendEmailLimiter = rateLimit({
    windowMs:  60 * 1000,   // 60 second window
    max: 2,                 // ONLY 1 email allowed to be sent per minute
    message: {
        success: false,
        message: "Please wait 60 seconds before requesting another verification email."
    },
    standardHeaders: true,
    legacyHeaders: false
})

// 6. FORGOT PASSWORD LIMITER
// Prevents spamming forgot password emails and overwhelming the mailing service.
export const forgotPasswordLimiter = rateLimit({
    windowMs: 60 * 1000,    // 60 second window
    max: 2,                 // ONLY 2 requests allowed per minute
    message: {
        success: false,
        message: "Please wait before requesting another reset link."
    },
    standardHeaders: true,
    legacyHeaders: false
})

/* 
========================================================================================
💡 WHY SEPARATE LIMITERS? (Architecture Note)
========================================================================================
Express-rate-limit tracks requests *per instance*. 
If you only export one `strictLimiter` and use it on Register, Verify, and Login, 
a user shares that single 3-attempt limit across all three routes combined!
A normal flow (Signup -> Verify -> Login) would burn exactly 3 attempts, instantly 
locking them out of the app. By splitting them up by risk context, we allow users to 
traverse the auth flow normally while still strongly preventing brute-force attacks!

`authLimiter` acts as the "Front Door" (stops overall DDoS / spam hitting the server),
while specific limiters act as "Room Doors" (stops specific password/OTP guessing actions).
========================================================================================
*/
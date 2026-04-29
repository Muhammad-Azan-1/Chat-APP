import { Router } from "express";
import { register , verifyEmail , login , resendEmailVerfication,  search,forgotPassword , resetPassword , googleAuth , editProfile , refreshAcessToken , logout } from "../controllers/user.controllers.js";
import { authLimiter, registerLimiter, verifyLimiter, loginLimiter, resendEmailLimiter, forgotPasswordLimiter } from "../middleware/rateLimiter.middleware.js";
import { verifyJWT, verifyJWTSoft } from "../middleware/verifyJwt.middleware.js";
import {upload} from '../middleware/mutler.middleware.js'
const router = Router()

// Applies global protection to all auth routes
router.use(authLimiter)


//? =================== PUBLIC ROUTES (No login required) ===================

router.route("/register").post(registerLimiter, register)
router.route("/verifyEmail").post(verifyLimiter, verifyEmail)
router.route("/login").post(loginLimiter, login)

router.route("/resendEmailVerfication").post(resendEmailLimiter, resendEmailVerfication)
router.route("/forgotPassword").post(forgotPasswordLimiter, forgotPassword)

router.route("/resetPassword").post(resetPassword)

router.route("/googleAuth").post(googleAuth)

router.route("/refreshAcessToken").post(refreshAcessToken)




//? =================== PROTECTED ROUTES (Login required) ===================

router.route("/logout").post(verifyJWTSoft, logout)

router.route("/editProfile").post(verifyJWT, upload.single("avatar") ,editProfile)

router.route("/search").get(verifyJWT, search)

export default router
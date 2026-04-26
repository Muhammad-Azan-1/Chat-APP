import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  sendEmailVerfication,
  sendPasswordResetEmail,
} from "../utils/emailVerfication.js";
import logger from "../logger/winston.logger.js";
import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import { uploadFileToCloudinary } from "../utils/cloudinary.js";

import NodeCache from "node-cache";

const searchCache = new NodeCache({ stdTTL: 120 });
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "Lax", // Use 'none' if backend and frontend are on different domains in production
};

const generateAccessAndRefreshToken = async (id) => {
  try {
    const user = await User.findById(id);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Failed to generate tokens", error.message);
  }
};

// ============================================================================
//? 1. REGISTER
// ============================================================================

const register = asyncHandler(async (req, res, next) => {
  logger.info("Someone hit the /register route!");

  const { username, email, password, redirect } = req.body;

  const existingUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existingUser) {
    if (existingUser.username == username) {
      throw new ApiError(400, "Username already exists");
    }
    if (existingUser.email == email) {
      throw new ApiError(400, "Email already exists");
    }
  }

  const user = await User.create({
    username,
    email,
    password,
  });

  const otp = user.generateVerficationOTP();
  const token = user.generateVerficationToken();

  await user.save({ validateBeforeSave: false });

  const EmailVerfication = await sendEmailVerfication(
    email,
    username,
    otp,
    token,
    redirect,
  );

  if (!EmailVerfication) {
    throw new ApiError(
      500,
      "Failed to send verification email",
      EmailVerfication.error || "",
    );
  }

  const findUser = await User.findById(user._id).select(
    "-password -refreshToken -verificationOTP -verificationToken -verificationExpiry -resetPasswordToken -resetPasswordExpiry ",
  );

  if (!findUser) {
    throw new ApiError(
      500,
      "Something went wrong, could not register the user",
    );
  }

  res
    .status(200)
    .json(
      new ApiResponse(200, "User registered successfully", { user: findUser }),
    );
});

// ============================================================================
//? 3. LOGIN
// ============================================================================

const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(404, "Invaled Email or Password");
  }

  const isCorrentPass = await user.checkPassword(password);

  if (!isCorrentPass) {
    throw new ApiError(404, "Invaled Email or Password");
  }

  if (!user.isVerified) {
    throw new ApiError(400, "Please verify your email first");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id,
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken -verificationOTP -verificationToken -authProvider -googleId -verificationExpiry -resetPasswordToken -resetPasswordExpiry ",
  );

  res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(200, "User logged in successfully", {
        user: loggedInUser,
        accessToken,
      }),
    );
});

// ============================================================================
//? 3.Resend Email Verfication
// ============================================================================

const resendEmailVerfication = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user || user.isVerified) {
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "Please check your Email we've send verification link.",
          {},
        ),
      );
  }

  const otp = user.generateVerficationOTP();
  const token = user.generateVerficationToken();

  await user.save({ validateBeforeSave: false });

  const EmailVerfication = await sendEmailVerfication(
    email,
    user.username,
    otp,
    token,
  );

  if (!EmailVerfication) {
    throw new ApiError(
      500,
      "Failed to send verification email",
      EmailVerfication.error || "",
    );
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Email verification sent successfully", {}));
});

// ============================================================================
//? 2. EMAIL VERIFICATION (OTP or Magic Link)
// ============================================================================

const verifyEmail = asyncHandler(async (req, res, next) => {
  const { otp, token } = req.body;

  if (!otp && !token) {
    throw new ApiError(400, "Please provide either OTP or verification token");
  }

  let user = null;
  let hashing = null;

  if (otp) {
    hashing = crypto.createHash("sha256").update(otp.toString()).digest("hex");
    // Find the by hashed Otp
    user = await User.findOne({
      verificationOTP: hashing,
      verificationExpiry: { $gt: Date.now() }, // "Find a user where the Expiry Time stored in the database is Greater Than ($gt) the Current Time."
    });
    if (!user) {
      throw new ApiError(400, "Invalid OTP or OTP has expired");
    }
  }

  if (!user && token) {
    hashing = crypto
      .createHash("sha256")
      .update(token.toString())
      .digest("hex");
    user = await User.findOne({
      verificationToken: hashing,
      verificationExpiry: { $gt: Date.now() }, // "Find a user where the Expiry Time stored in the database is Greater Than ($gt) the Current Time."
    });

    if (!user) {
      throw new ApiError(400, "Invalid token or token has expired");
    }
  }

  // Already verified? No need to do it again.
  if (user?.isVerified) {
    throw new ApiError(400, "Email is already verified");
  }

  // --- Mark user as verified and clean up ---
  // WHY delete tokens after use: One-time use tokens are a security best practice.
  // If someone intercepts the email later, the token is already consumed and useless.
  user.isVerified = true;
  user.verificationOTP = undefined;
  user.verificationToken = undefined;
  user.verificationExpiry = undefined;

  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "Email verified successfully! You can now log in.",
        {},
      ),
    );
});

// ============================================================================
//? 4. FORGOT PASSWORD
// ============================================================================

const forgotPassword = asyncHandler(async (req, res, next) => {
  const { email, redirect } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "Please check your Email we've send Password Reset link.",
        ),
      );
  }

  if (user.authProvider == "GOOGLE") {
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "Please check your Email we've send Password Reset link.",
        ),
      );
  }

  const resetToken = user.generateResetPasswordToken();

  await user.save({ validateBeforeSave: false });

  const EmailVerfication = await sendPasswordResetEmail(
    email,
    user.username,
    resetToken,
    redirect,
  );

  if (!EmailVerfication) {
    throw new ApiError(
      500,
      "Failed to send Password Reset email",
      EmailVerfication.error || "",
    );
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Password Reset email sent successfully", {}));
});

// ============================================================================
//? 5. Reset Password
// ============================================================================

const resetPassword = asyncHandler(async (req, res, next) => {
  const { token, password } = req.body;

  if (!token || !password) {
    throw new ApiError(400, "Please provide token and password");
  }

  // The DB stores the token hashed, so we must hash the incoming raw token before searching!
  const hashedToken = crypto
    .createHash("sha256")
    .update(token.toString())
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpiry: { $gt: Date.now() },
  });

  if (!user) {
    throw new ApiError(400, "Invalid token or token has expired");
  }

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpiry = undefined;

  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "Password reset successfully redirecting to login",
        {},
      ),
    );
});

// ============================================================================
//? 6. Google Auth
// ============================================================================

const googleAuth = asyncHandler(async (req, res, next) => {
  const { token } = req.body;

  if (!token) {
    throw new ApiError(400, "Google ID token is required");
  }

  let payload;
  try {
    // 1. SECURITY CHECK: Verify the token was issued to YOUR app

    const tokenInfoRfs = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?access_token=${token}`,
    );
    const tokenInfo = await tokenInfoRfs.json();

    // If the token's audience doesn't match your Client ID, reject it immediately
    if (tokenInfo.aud !== process.env.GOOGLE_CLIENT_ID) {
      throw new ApiError(400, "Invalid Google Token ID");
    }

    // 2. FETCH USER DATA: Now that we know the token is safe, fetch the profile
    const profileRes = await fetch(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    payload = await profileRes.json();
  } catch (error) {
    throw new ApiError(400, "Invaled Google Token ID");
  }

  const { sub: googleId, email, name, picture, email_verified } = payload;

  if (!email_verified) {
    throw new ApiError(400, "Email is not verified");
  }

  let user = await User.findOne({ email });

  if (user) {
    if (user.authProvider === "EMAIL_PASSWORD") {
      throw new ApiError(
        409,
        "An account with this email already exists. Please log in with your email and password.",
      );
    }

    if (user.authProvider == "GOOGLE" && user.googleId !== googleId) {
      throw new ApiError(401, "Google account mismatch");
    }
  } else {
    user = await User.create({
      username: email.split("@")[0],
      email,
      googleId,
      avatar: picture || "",
      authProvider: "GOOGLE",
      isVerified: true,
    });
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id,
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -isVerified -resetPasswordToken -authProvider -googleId -resetPasswordExpiry -verificationOTP -verificationToken -verificationExpiry ",
  );

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(200, "Google Authentication Successfull", {
        user: loggedInUser,
        accessToken,
      }),
    );
});

// ============================================================================
//? 7. refresh Access Token
// ============================================================================

const refreshAcessToken = asyncHandler(async (req, res, next) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body?.refreshToken;

  console.log("Incoming token", incomingRefreshToken);

  if (!incomingRefreshToken) {
    throw new ApiError(400, "Refresh token is required");
  }

  const decodeToken = jwt.verify(
    incomingRefreshToken,
    process.env.REFRESH_TOKEN_SECRET,
  );

  if(!decodeToken){
    res.status(200).send(new ApiError(401 , "Invaled Refresh token or Expired")) 
   }

  console.log("decoded", decodeToken);

  const user = await User.findById(decodeToken.id);

  if (!user) {
    throw new ApiError(400, "Invalid Refresh Token");
  }

  if (user.refreshToken != incomingRefreshToken) {
    throw new ApiError(400, "Refresh token has been used or expire");
  }

  const { accessToken, refreshToken: newRefreshToken } =
    await generateAccessAndRefreshToken(decodeToken?.id);

  res
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", newRefreshToken, cookieOptions)
    .status(200)
    .json(
      new ApiResponse(200, "Acess Token has been generated", {
        accessToken,
        newRefreshToken,
      }),
    );
});


// ============================================================================
//? 8. edit Profile
// ============================================================================

const editProfile = asyncHandler(async (req, res, next) => {
  const { id } = req.user;
  const { username, email } = req.body;
  const localFilePath = req.file?.path;

  console.log("Image url" , localFilePath)

  if (!username && !email && !localFilePath) {
    throw new ApiError(400, "Please provide username or email or Avatar");
  }

  // Check if someone else already has this username or email
  if (username || email) {
    const $orConditions = [];
    if (username) $orConditions.push({ username });
    if (email) $orConditions.push({ email });

    const existingUser = await User.findOne({
      $or: $orConditions,
      _id: { $ne: id }, // Exclude the current user from the check so that check are only apply on other users
    });

    if (existingUser) {
      if (existingUser.username === username) {
        throw new ApiError(400, "Username already exists");
      }
      if (existingUser.email === email) {
        throw new ApiError(400, "Email already exists");
      }
    }
  }

  const updateFields = {};
  if (username) updateFields.username = username;
  if (email) updateFields.email = email;

  if (localFilePath) {
    const avatarResponse = await uploadFileToCloudinary(localFilePath);
    if (!avatarResponse) {
      throw new ApiError(500, "Error uploading avatar to Cloudinary");
    }
    updateFields.avatar = avatarResponse.url;
  }

  const user = await User.findByIdAndUpdate(
    id,
    {
      $set: updateFields, // Only updates fields that actually have values
    },
    {
      new: true,
      runValidators: true,
    },
  ).select(
    "-password -isVerified -refreshToken -resetPasswordToken -authProvider -googleId -resetPasswordExpiry -verificationOTP -verificationToken -verificationExpiry ",
  );

  if (!user) {
    throw new ApiError(400, "User not found or failed to update profile");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Profile updated successfully", user));
});



// ============================================================================
//? 9. logout
// ============================================================================


const logout = asyncHandler(async (req, res, next) => {
  // Clear the refreshToken stored in DB so the old token is invalidated server-side
  await User.findByIdAndUpdate(
    req.user?._id,
    { $unset: { refreshToken: 1 } },
    { new: true },
  );

  return res
    .status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(new ApiResponse(200, "User logged out successfully", {}));
});


// ============================================================================
//? 10. Search
// ============================================================================

const search = asyncHandler(async (req, res, next)=>{

    const {query} = req.query


    if(!query || !query.trim()){
        throw new ApiError(400 , "Please provide a query")
    }

    const cleanQuery = query.toLowerCase().trim()
    const cacheKey = `Search_${cleanQuery}_${req.user._id}` // search_mu_858585
    const cachedSearch = searchCache.get(cacheKey)

    if(cachedSearch){

        return res.status(200).json(new ApiResponse(200 , "Users fetched successfully" , cachedSearch))
    }

    const users = await User.find({
        // Search by regex
        username: { $regex: query, $options: "i" },
        // IMPORTANT: Exclude the logged-in user! We don't want to search for ourselves.
        _id: { $ne: req.user._id } 
    })
    // POSITIVE SELECTION: Just ask for what you need! (_id is included automatically)
    .select("_id username avatar")
    // LIMIT to 10 results so your app doesn't crash if they type "a"
    .limit(10); 


    searchCache.set(cacheKey , users)

    return res

        .status(200)
        .json(new ApiResponse(200, "Users fetched successfully", users));

})



// Here is exactly what that magical line does and why it is the standard for searching!

// ```javascript
// username: { $regex: query, $options: "i" }
// ```

// ### 1. What does `$regex` do?
// If you did not use `$regex`, and just wrote `username: query`, MongoDB would do an **Exact Match Mode**.
// * If a user's name is `"Batman"`, but you searched for `"Bat"`, MongoDB would return `0` results. It would only work if you typed exactly `"Batman"`.

// `$regex` tells MongoDB to do a **Partial Match Mode**. 
// * If you type `"Bat"`, it will instantly find `"Batman"`, `"Batgirl"`, `"Wombat"`, etc. It finds anything that *contains* those letters.

// ### 2. What does `$options: "i"` do?
// The `"i"` stands for **Case-Insensitive**.
// Without it, if someone's username is `"Azan"`, and you type `"azan"` (all lowercase), MongoDB won't find it because computers treat uppercase and lowercase totally differently. 

// Setting `"i"` forces it to ignore capitalization, so typing `"AZAN"`, `"azan"`, or `"aZaN"` will smoothly find the correct user!

// ---

// ### How is this search optimized?
// Regular Expressions (`$regex`) can actually be quite slow for a database if it has to search through 10,000 users.

// This is exactly why that `.limit(10)` line is so important for optimization! 
// Because we added `.limit(10)`, the instant MongoDB finds 10 people whose name matches "Az", it **immediately stops searching the database**. It doesn't waste CPU power trying to check the remaining 9,990 users. This keeps your search lightning-fast and prevents server crashes!

//** */ ============================================================================

//** */ ============================================================================


export {
  register,
  verifyEmail,
  login,
  editProfile,
  resendEmailVerfication,
  forgotPassword,
  resetPassword,
  googleAuth,
  refreshAcessToken,
  logout,
  search,
};

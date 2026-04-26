import nodemailer from "nodemailer"



// Lazy load transporter so process.env is ready, but cache it so we only create it once
let transporterInstance = null;

const getTransporter = () => {
    if (!transporterInstance) {
        transporterInstance = nodemailer.createTransport({
            service : 'gmail',
            auth : {
                user : process.env.EMAIL_USER,
                pass : process.env.EMAIL_PASS
            }
        })
    }
    return transporterInstance;
}

const sendEmailVerfication = async (email , username , otp , magicUrlToken , redirect) => {
    
    const transpoter = getTransporter();
    
    // Append redirect to the magic URL so the user lands back on the right page after verifying
    const redirectQuery = redirect ? `&redirect=${encodeURIComponent(redirect)}` : ""
    const verifyEmail = `${process.env.FRONTEND_URL}/verifyEmail?token=${magicUrlToken}${redirectQuery}`

    const mailOption = {
        from : `Chat App <${process.env.EMAIL_USER}>`,
        to : email,
        subject :  "Please Verify Your Email Address",
        html : `
         <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #333;">Welcome, ${username}!</h2>
                <p>Thank you for registering. Please verify your email address using one of the methods below:</p>

                <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin-top: 0;">Option 1: Enter this OTP</h3>
                    <p style="font-size: 32px; font-weight: bold; letter-spacing: 8px; text-align: center; color: #2563eb;">
                        ${otp}
                    </p>
                    <p style="color: #666; font-size: 14px; text-align: center;">This code expires in 15 minutes.</p>
                </div>

                <div style="text-align: center; margin: 20px 0;">
                    <p><strong>Option 2:</strong> Click the button below</p>
                    <a href="${verifyEmail}"
                       style="display: inline-block; background: #2563eb; color: white; padding: 12px 30px;
                              text-decoration: none; border-radius: 6px; font-weight: bold;">
                        Verify My Email
                    </a>
                </div>

                <p style="color: #999; font-size: 12px; margin-top: 30px;">
                    If you didn't create an account, please ignore this email.
                </p>
            </div>
        `
    }

   return await transpoter.sendMail(mailOption)

}



const sendPasswordResetEmail = async (email , username , magicUrlToken , redirect) => {
    const transpoter = getTransporter();

    // Append redirect to the reset URL so the user is sent back to the right page after resetting
    const redirectQuery = redirect ? `&redirect=${encodeURIComponent(redirect)}` : ""
    const resetPassword = `${process.env.FRONTEND_URL}/resetPassword?token=${magicUrlToken}${redirectQuery}`

    const mailOptions = {
        from : `Chat App ${process.env.EMAIL_USER}`,
        to : email,
        subject : "Reset you Password",
        html :`
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #333;">Password Reset Request</h2>
                <p>Hi ${username},</p>
                <p>We received a request to reset your password. Click the button below to set a new password:</p>

                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetPassword}"
                       style="display: inline-block; background: #dc2626; color: white; padding: 12px 30px;
                              text-decoration: none; border-radius: 6px; font-weight: bold;">
                        Reset My Password
                    </a>
                </div>

                <p style="color: #666; font-size: 14px;">This link expires in 15 minutes.</p>
                <p style="color: #999; font-size: 12px; margin-top: 30px;">
                    If you didn't request a password reset, please ignore this email. Your password will remain unchanged.
                </p>
            </div>
        `
    }

    return await transpoter.sendMail(mailOptions)
}

export {sendEmailVerfication , sendPasswordResetEmail}
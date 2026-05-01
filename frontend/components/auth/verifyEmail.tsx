"use client";

import React, { useState, useRef, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { MailCheck, RefreshCw, ShieldAlert } from "lucide-react";
import { useAuthCooldown } from "@/hooks/useAuthCooldown";
import { AuthButton } from "./shared/AuthButton";
import { AuthAlerts } from "./shared/AuthAlerts";
const VerifyEmail = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const redirectParam = searchParams.get("redirect");
  const redirectQuery = redirectParam
    ? `?redirect=${encodeURIComponent(redirectParam)}`
    : "";

  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);

  const [rateLimitMessage, setRateLimitMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [isVerifyingToken, setIsVerifyingToken] = useState(!!token);
  const [isVerifying, setIsVerifying] = useState(false); // Controls button spinner

  const { cooldown, setCooldown } = useAuthCooldown("verify");

  const handleOtpChange = (index: number, value: string) => {
    // console.log("value", value, "index", index);
    if (!/^\d*$/.test(value)) return; // only digits

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // take last digit only

    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    // console.log(
    //   "function running bcz of keydown (backspace or delete is clicked)",
    //   otp[index],
    //   index,
    // );
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    // console.log(pastedData, "Pasted Data");
    if (!/^\d+$/.test(pastedData)) return; // check if the pasted data is only digits

    const digits = pastedData.slice(0, 6).split("");
    const newOtp = [...otp];
    // console.log(newOtp, "newOTP");
    digits.forEach((digit, i) => {
      newOtp[i] = digit;
    });
    setOtp(newOtp);

    // Focus the next empty input or the last one
    const nextEmpty = newOtp.findIndex((d) => !d);
    inputRefs.current[nextEmpty === -1 ? 5 : nextEmpty]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isVerifyingToken) {
      const otpString = otp.join("");
      if (otpString.length < 6) return;
    }

    setRateLimitMessage("");
    setErrorMessage("");
    setSuccessMessage("");
    setIsVerifying(true);

    try {
      // Pick body based on mode!
      const bodyPayload = isVerifyingToken ? { token } : { otp: otp.join("") };

      const response = await fetch("/api/v1/users/verifyEmail", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(bodyPayload),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          setCooldown(60);
          setRateLimitMessage(data.message || "Too many attempts.");
          return;
        }
        throw new Error(data.message || "Verification failed");
      }

      setSuccessMessage(data.message || "Email verified successfully!");
      if (!isVerifyingToken) setOtp(["", "", "", "", "", ""]);
      setTimeout(() => router.push(`/login${redirectQuery}`), 1500);
    } catch (error: any) {
      setErrorMessage(error.message);
    } finally {
      setIsVerifying(false);
    }
  };

  const otpFilled = otp.every((d) => d !== "");

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1b1c20] px-4 font-sans">
      <div className="max-w-[480px] w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col items-center justify-center mb-8">
          <div className="w-14 h-14 bg-[#272934] rounded-full flex items-center justify-center mb-4 border border-gray-500/30 shadow-sm">
            <MailCheck className="w-7 h-7 text-white" strokeWidth={2} />
          </div>
          <h2 className="text-2xl font-medium text-white tracking-wide">
            Verify Your Email
          </h2>
          <p className="text-gray-400 mt-2 text-center text-[15px] leading-relaxed">
            {isVerifyingToken ? (
              "Click the button below to verify your email securely."
            ) : (
              <>
                We&apos;ve sent a 6-digit code to your email. <br />
                Enter it below to verify your account.
              </>
            )}
          </p>
        </div>

        <AuthAlerts
          rateLimit={rateLimitMessage}
          error={errorMessage || undefined}
          success={
            successMessage && !rateLimitMessage && !errorMessage
              ? successMessage
              : undefined
          }
        />

        {/* OTP Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* OTP Inputs */}

          {!isVerifyingToken && (
            <div className="flex justify-center gap-3" onPaste={handlePaste}>
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-[52px] h-[58px] bg-[#272934] text-white text-center text-xl font-semibold border border-gray-500/30 rounded-[14px] outline-none focus:border-[#5260A3] transition-colors"
                />
              ))}
            </div>
          )}

          {/* Verify Button */}
          <div className="pt-1">
            <AuthButton
              isLoading={isVerifying}
              cooldown={cooldown}
              disabled={(!isVerifyingToken && !otpFilled) || isVerifying}
              cooldownLabel={(s) => `Verify in ${s}s`}
              text={isVerifyingToken ? "Verify My Email" : "Verify Email"}
            />
          </div>
        </form>

        {/* Resend Section */}
        <div className="text-center space-y-3 pt-2">
          <p className="text-sm text-gray-400">
            Didn&apos;t receive the email?
          </p>
          <Link
            href={`/resendVerification${redirectQuery}`}
            className="inline-flex items-center gap-2 text-[14px] font-medium transition-colors cursor-pointer text-[#5260A3] hover:text-[#6a78bd]"
          >
            {" "}
            Request New Code
          </Link>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 pb-8 text-sm text-gray-300">
          Back to{" "}
          <Link
            href={`/login${redirectQuery}`}
            className="text-[#5260A3] hover:text-[#6a78bd] font-medium transition-colors cursor-pointer"
          >
            Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;

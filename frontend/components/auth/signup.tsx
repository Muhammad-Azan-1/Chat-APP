"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Mail, UserIcon, Eye, EyeOff } from "lucide-react";
import { useAuthCooldown } from "@/hooks/useAuthCooldown";
import { AuthAlerts } from "./shared/AuthAlerts";
import { AuthButton } from "./shared/AuthButton";
import GoogleAuth from "./googleAuth";
import { LOGIN_USER_ACTION } from "@/redux/actions/authAction";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/redux/store/store";

const Signup = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect");
  const redirectQuery = redirectParam ? `?redirect=${encodeURIComponent(redirectParam)}` : "";
  const { cooldown, setCooldown } = useAuthCooldown("signup");

  // 1. Cleaned up redundant state variables!
  const [error, setError] = useState<string>("");
  const [rateLimitMessage, setRateLimitMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState("")
  const [googleLoading, setGoogleLoading] = useState(false)

  const dispatch = useDispatch<AppDispatch>()

  
  const [userData, setUserData] = useState({
    email: "",
    username: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserData({
      ...userData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 2. Prevent submission if they are in the penalty box
    if (cooldown > 0) return; 

    // Frontend Password Validation First
    if (userData.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setError("");
    setRateLimitMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/v1/users/register", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ ...userData, redirect: redirectParam || undefined }),
      });

      const data = await response.json();
      // dispatch(LOGIN_USER_ACTION(data?.data?.user))

      if (!response.ok) {
         if (response.status === 429) {
          console.log("rate limit exceeded", response);

          setCooldown(60);
          setRateLimitMessage(
            data.message ||
              "Too many registration attempts. Please try again later.",
          );
          return; // 🛑 Stop execution
        }
        // 3. Throw the backend error down to the catch block
        throw new Error(data.message || "Failed to register");
      }

      // Successfully Registered: show success banner then redirect
      setCooldown(0);
      setSuccessMessage("Account created! Check your email for the verification link.");
      setTimeout(() => router.push(`/verifyEmail${redirectQuery}`), 1500);
      
    } catch (err: any) {
      // 🟢 Catch the backend message (e.g., "Email already in use")
      setError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1b1c20] px-4 font-sans">
      <div className="max-w-[480px] w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col items-center justify-center mb-8">
          <Lock className="w-8 h-8 text-white mb-2" strokeWidth={2.5} />
          <h2 className="text-2xl font-medium text-white tracking-wide">
            Register
          </h2>
        </div>

        {/* Alerts */}
        <AuthAlerts error={error || undefined} rateLimit={rateLimitMessage || undefined} success={successMessage || undefined} />

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Input */}
          <div className="relative w-full">
            <input
              type="email"
              name="email"
              required
              value={userData.email}
              onChange={handleChange}
              placeholder="Enter the email..."
              className="w-full bg-[#272934] text-white placeholder-gray-400/70 text-[15px] border border-gray-500/30 rounded-[18px] px-6 py-[18px] outline-none focus:border-[#5260A3] transition-colors overflow-hidden"
            />
            <Mail className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-teal-600/80 pointer-events-none" />
          </div>

          {/* Username Input */}
          <div className="relative w-full">
            <input
              type="text"
              name="username"
              required
              value={userData.username}
              onChange={handleChange}
              placeholder="Enter the username..."
              className="w-full bg-[#272934] text-white placeholder-gray-400/70 text-[15px] border border-gray-500/30 rounded-[18px] px-6 py-[18px] outline-none focus:border-[#5260A3] transition-colors overflow-hidden"
            />
            <UserIcon className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-teal-600/80 pointer-events-none" />
          </div>

          {/* Password Input */}
          <div className="relative w-full">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              required
              value={userData.password}
              onChange={handleChange}
              placeholder="Enter the password..."
              className="w-full bg-[#272934] text-white placeholder-gray-400/70 text-[15px] border border-gray-500/30 rounded-[18px] px-6 py-[18px] outline-none focus:border-[#5260A3] transition-colors pr-14 overflow-hidden"
            />

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setShowPassword((prev) => !prev);
              }}
              className="absolute right-5 top-1/2 -translate-y-1/2 p-2 z-50 cursor-pointer text-teal-600/80 hover:text-teal-400 transition-colors pointer-events-auto"
            >
              {showPassword ? (
                <Eye className="w-5 h-5 pointer-events-none" />
              ) : (
                <EyeOff className="w-5 h-5 pointer-events-none" />
              )}
            </button>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <AuthButton
              text="Register"
              isLoading={isLoading}
              cooldown={cooldown}
              disabled={!userData.email || !userData.username || !userData.password}
              cooldownLabel={(seconds) => `Too many attempts. Try again in ${seconds}s`}
            />
          </div>

              {/* Divider */}
        <div className="flex items-center gap-4 py-1">
          <div className="flex-1 h-px bg-gray-500/30" />
          <span className="text-xs text-gray-400 uppercase tracking-widest">or</span>
          <div className="flex-1 h-px bg-gray-500/30" />
        </div>

          
        </form>

        <GoogleAuth setError={setError} setSuccessMsg={setSuccessMessage} setLoading={setGoogleLoading} isLoading={googleLoading} />


        {/* Footer */}
        <div className="text-center mt-6 pb-8 text-sm text-gray-300">
          Already have an account?{" "}
          <Link
            href={`/login${redirectQuery}`}
            className="text-[#5260A3] hover:text-[#6a78bd] font-medium transition-colors"
          >
            Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
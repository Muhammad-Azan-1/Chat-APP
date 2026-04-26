"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Mail, Eye, EyeOff } from "lucide-react";
import { AuthAlerts } from "./shared/AuthAlerts";
import { useAuthCooldown } from "../../hooks/useAuthCooldown";
import { AuthButton } from "./shared/AuthButton";
import GoogleAuth from "./googleAuth";
import { LOGIN_USER_ACTION } from "@/redux/actions/authAction";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/redux/store/store";


const Login = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect");
  const redirectQuery = redirectParam ? `?redirect=${encodeURIComponent(redirectParam)}` : "";
  const [showPassword, setShowPassword] = useState(false);
  const [userData, setUserData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState<string>("");
  const [rateLimitMessage, setRateLimitMessage] = useState<string>("");
  const { cooldown, setCooldown } = useAuthCooldown("login");
  const [isLoading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false)


  const dispatch = useDispatch<AppDispatch>()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserData({
      ...userData,
      [e.target.name]: e.target.value,
    });
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cooldown > 0) return;
    setError("");
    setRateLimitMessage("");
    setLoading(true);
    try {
      const response = await fetch("/api/v1/users/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();
      dispatch(LOGIN_USER_ACTION(data?.data?.user))

      if (!response.ok) {
        if (response.status === 429) {
        
          setCooldown(60);
          setRateLimitMessage(
            data.message || "Too many login attempts. Please try again later."
          );
          return; // 🛑 Stop execution
        }

        // console.log("normal errror occured", data.message);
        throw new Error(data.message || "Failed to login");
      }

      setCooldown(0);
      setSuccessMessage("Login successful! Redirecting...");
      setTimeout(() => router.push(redirectParam ? redirectParam : "/chat"), 1500);
    } catch (err: any) {
      console.log(err.message);
      setError(
        err.message || "An unexpected error occurred. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1b1c20] px-4 font-sans">
      <div className="max-w-[480px] w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col items-center justify-center mb-8">
          <Lock className="w-8 h-8 text-white mb-2" strokeWidth={2.5} />
          <h2 className="text-2xl font-medium text-white tracking-wide">
            Login
          </h2>
        </div>

        {/* Alerts */}
        <div className="space-y-2">
          <AuthAlerts
            rateLimit={rateLimitMessage}
            error={error}
            success={successMessage}
          />
          
          {/* Email Verification Action Link */}
          {error === "Please verify your email first" && (
            <div className="text-center text-sm pb-2">
              <Link
                href={`/verifyEmail${redirectQuery}`}
                className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors underline"
              >
                Click here to securely verify your email.
              </Link>
            </div>
          )}
        </div>

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
              placeholder="Enter your email..."
              className="w-full bg-[#272934] text-white placeholder-gray-400/70 text-[15px] border border-gray-500/30 rounded-[18px] px-6 py-[18px] outline-none focus:border-[#5260A3] transition-colors overflow-hidden"
            />
            <Mail className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-teal-600/80 pointer-events-none" />
          </div>

          {/* Password Input */}
          <div className="relative w-full">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              required
              value={userData.password}
              onChange={handleChange}
              placeholder="Enter your password..."
              className="w-full bg-[#272934] text-white placeholder-gray-400/70 text-[15px] border border-gray-500/30 rounded-[18px] px-6 py-[18px] outline-none focus:border-[#5260A3] transition-colors pr-14 overflow-hidden"
            />
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setShowPassword((prev) => !prev);
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 z-50 cursor-pointer text-teal-600/80 hover:text-teal-400 transition-colors pointer-events-auto"
            >
              {showPassword ? (
                <Eye className="w-5 h-5 pointer-events-none" />
              ) : (
                <EyeOff className="w-5 h-5 pointer-events-none" />
              )}
            </button>
          </div>

          {/* Forgot Password */}
          <div className="text-right">
            <Link
              href={`/forgotPassword${redirectQuery}`}
              className="text-[13px] text-gray-400 hover:text-[#6a78bd] transition-colors cursor-pointer"
            >
              Forgot Password?
            </Link>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <AuthButton
              text="Login"
              isLoading={isLoading}
              cooldown={cooldown}
              disabled={!userData.email || !userData.password}
              cooldownLabel={(seconds) =>
                `Too many attempts. Try again in ${seconds}s`
              }
            />
          </div>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-4 py-1">
          <div className="flex-1 h-px bg-gray-500/30" />
          <span className="text-xs text-gray-400 uppercase tracking-widest">or</span>
          <div className="flex-1 h-px bg-gray-500/30" />
        </div>

        {/* Google Login */}
        <GoogleAuth setError={setError} setSuccessMsg={setSuccessMessage} setLoading={setGoogleLoading} isLoading={googleLoading} />

        {/* Footer */}
        <div className="text-center mt-6 pb-8 text-sm text-gray-300">
          Don't have an account?{" "}
          <Link
            href={`/signup${redirectQuery}`}
            className="text-[#5260A3] hover:text-[#6a78bd] font-medium transition-colors"
          >
            Register
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;

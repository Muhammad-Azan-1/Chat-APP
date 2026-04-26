"use client"

import React, { useState } from 'react'
import Link from 'next/link'
import { Lock, Mail } from 'lucide-react'
import { AuthAlerts } from './shared/AuthAlerts'
import { AuthButton } from './shared/AuthButton'
import { useAuthCooldown } from '@/hooks/useAuthCooldown'

import { useSearchParams } from "next/navigation";

const ForgotPassword = () => {
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect");
  const redirectQuery = redirectParam ? `?redirect=${encodeURIComponent(redirectParam)}` : "";
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  
  const [errorMessage, setErrorMessage] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [rateLimitMessage, setRateLimitMessage] = useState("")

  const { cooldown, setCooldown } = useAuthCooldown("forgot");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent spam clicking while timer is running
    if (cooldown > 0) return;

    setErrorMessage("");
    setSuccessMessage("");
    setRateLimitMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/v1/users/forgotPassword", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ email, redirect: redirectParam || undefined }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          // Hardcoded 60s cooldown for email spam prevention
          setCooldown(60); 
          setRateLimitMessage(data.message || "Too many attempts. Please try again later.");
          return;
        }
        
        // Throw any other backend errors (e.g., "Email not found")
        throw new Error(data.message || "Failed to send reset link.");
      }

      setSuccessMessage(data.message || "Password reset link sent to your email!");
      // Hardcoded 30s cooldown on success so they don't drain your email quota
      setCooldown(30); 
      setEmail("");
      
    } catch (error: any) {
      setErrorMessage(error.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-[#1b1c20] px-4 font-sans'>
      <div className='max-w-[480px] w-full space-y-6'>
        {/* Header */}
        <div className='flex flex-col items-center justify-center mb-8'>
          <div className='w-14 h-14 bg-[#272934] rounded-full flex items-center justify-center mb-4 border border-gray-500/30 shadow-sm'>
            <Lock className='w-7 h-7 text-white' strokeWidth={2.5} />
          </div>
          <h2 className='text-2xl font-medium text-white tracking-wide'>Forgot Password</h2>
          <p className='text-gray-400 mt-2 text-center text-[15px]'>
            Enter your email and we'll send you a link to reset your password.
          </p>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className='space-y-4'>
          
          <AuthAlerts 
            rateLimit={rateLimitMessage}
            error={errorMessage || undefined}
            success={successMessage && !rateLimitMessage && !errorMessage ? successMessage : undefined}
          />
          
          {/* Email Input */}
          <div className='relative w-full'>
            <input 
              type='email' 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder='Enter your email...' 
              className='w-full bg-[#272934] text-white placeholder-gray-400/70 text-[15px] border border-gray-500/30 rounded-[18px] px-6 py-[18px] outline-none focus:border-[#5260A3] transition-colors overflow-hidden'
            />
            <Mail className='absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-teal-600/80 pointer-events-none' />
          </div>

          {/* Submit Button */}
          <div className='pt-2'>
            <AuthButton 
              text="Send Reset Link"
              isLoading={isLoading}
              cooldown={cooldown}
              disabled={!email || isLoading}
              cooldownLabel={(s) => `Resend in ${s}s`}
            />
          </div>
        </form>

        {/* Footer */}
        <div className='text-center mt-6 pb-8 text-sm text-gray-300'>
          Remember your password?{' '}
          <Link href={`/login${redirectQuery}`} className='text-[#5260A3] hover:text-[#6a78bd] font-medium transition-colors cursor-pointer'>
            Login
          </Link>
        </div>

      </div>
    </div>
  )
}

export default ForgotPassword;
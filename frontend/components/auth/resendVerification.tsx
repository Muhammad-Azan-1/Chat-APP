"use client"

import React, { useState } from 'react'
import Link from 'next/link'
import { Mail, Send } from 'lucide-react'
import { useAuthCooldown } from '@/hooks/useAuthCooldown'
import { AuthAlerts } from '@/components/auth/shared/AuthAlerts'
import { AuthButton } from '@/components/auth/shared/AuthButton'

import { useSearchParams } from 'next/navigation';

const ResendVerification = () => {
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect");
  const redirectQuery = redirectParam ? `?redirect=${encodeURIComponent(redirectParam)}` : "";
  const [email, setEmail] = useState("")

  const [errorMessage, setErrorMessage] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [rateLimitMessage, setRateLimitMessage] = useState("")

  const { cooldown, setCooldown } = useAuthCooldown("resend");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cooldown > 0) return;


    setErrorMessage("");
    setSuccessMessage("");
    setRateLimitMessage("");
    setIsLoading(true);

    try {
      const response = await fetch('/api/v1/users/resendEmailVerfication', {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 429) {
          setCooldown(60);
          setRateLimitMessage(data.message || "Too many attempts. Please try again later.");
          return;
        }
        throw new Error(data.message || "Failed to resend email")
      }

      setSuccessMessage(data.message || "Verification email sent successfully! Please check your inbox.")
      setCooldown(30) // Prevent immediate spam after success
      setEmail("")

    } catch (error: any) {
      setErrorMessage(error.message);
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
            <Send className='w-6 h-6 text-white ml-[-2px]' strokeWidth={2} />
          </div>
          <h2 className='text-2xl font-medium text-white tracking-wide'>Resend Verification</h2>
          <p className='text-gray-400 mt-2 text-center text-[15px] leading-relaxed'>
            We&apos;ll send you a new 6-digit code or magic link to your registered email address.
          </p>
        </div>

        {/* Alerts */}
        <AuthAlerts
          rateLimit={rateLimitMessage}
          error={ errorMessage || undefined}
          success={successMessage && !rateLimitMessage && !errorMessage ? successMessage : undefined}
        />

        {/* Form */}
        <form onSubmit={handleSubmit} className='space-y-4'>
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

          <div className='pt-2'>
            <AuthButton
              text="Send Verification Email"
              isLoading={isLoading}
              cooldown={cooldown}
              disabled={!email}
              cooldownLabel={(s) => `Resend in ${s}s`}
            />
          </div>
        </form>

        {/* Footer */}
        <div className='text-center mt-6 pb-8 text-sm text-gray-300'>
          Back to{' '}
          <Link href={`/verifyEmail${redirectQuery}`} className='text-[#5260A3] hover:text-[#6a78bd] font-medium transition-colors'>
            Verification
          </Link>
        </div>

      </div>
    </div>
  )
}

export default ResendVerification

"use client"

import React, { useState } from 'react'
import Link from 'next/link'
import { Lock, Eye, EyeOff } from 'lucide-react'
import { AuthAlerts } from '@/components/auth/shared/AuthAlerts'
import { AuthButton } from '@/components/auth/shared/AuthButton'
import { useSearchParams  , useRouter} from 'next/navigation'




const NewPassword = () => {

  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const redirectParam = searchParams.get("redirect");
  const redirectQuery = redirectParam ? `?redirect=${encodeURIComponent(redirectParam)}` : "";

  console.log("TOKEN" , token)
  const Router = useRouter()

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [successMsg , setSuccessMsg] = useState("")
  const [error, setError] = useState("")


  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: ""
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async(e: React.FormEvent) => {
    e.preventDefault();

    if (formData.newPassword !== formData.confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    if(!token){
      setError("Invalid or expired token");
      return;
    }

    setError("");
    setIsLoading(true)
    setSuccessMsg("")

  try {
      const response = await fetch('/api/v1/users/resetPassword', 
        {
          method : "POST",
         headers : {"Content-Type" : "application/json"},
         body : JSON.stringify({password : formData.newPassword , token})
  
        }
      )

      const data = await response.json()

      if(!response.ok){
        throw new Error(data.message || "Some thing went wrong can not reset password")
        }

      setSuccessMsg(data.message)
      setFormData({
        newPassword: "",
        confirmPassword: ""
      })

     setTimeout(() => {
      Router.push(`/login${redirectQuery}`) 
     }, 1500);

  } catch (error : any) {
    setError(error.message || "Some thing went wrong can not reset password")
  
  } finally {
  setIsLoading(false)

  }
    // Handle password reset logic here
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-[#1b1c20] px-4 font-sans'>
      <div className='max-w-[480px] w-full space-y-6'>
        {/* Header */}
        <div className='flex flex-col items-center justify-center mb-8'>
          <div className='w-14 h-14 bg-[#272934] rounded-full flex items-center justify-center mb-4 border border-gray-500/30 shadow-sm'>
            <Lock className='w-7 h-7 text-white' strokeWidth={2.5} />
          </div>
          <h2 className='text-2xl font-medium text-white tracking-wide'>Reset Password</h2>
          <p className='text-gray-400 mt-2 text-center text-[15px]'>
            Choose a new password for your account.
          </p>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className='space-y-4'>

          <AuthAlerts error={error} success={successMsg} />

          {/* New Password Input */}
          <div className='relative w-full'>
            <input 
              type={showPassword ? "text" : "password"}
              name='newPassword'
              required
              value={formData.newPassword}
              onChange={handleChange}
              placeholder='Enter new password...' 
              className='w-full bg-[#272934] text-white placeholder-gray-400/70 text-[15px] border border-gray-500/30 rounded-[18px] px-6 py-[18px] outline-none focus:border-[#5260A3] transition-colors pr-14 overflow-hidden'
            />
            <button 
              type="button"
              onClick={(e) => {
                e.preventDefault()
                setShowPassword((prev) => !prev)
              }}
              className='absolute right-4 top-1/2 -translate-y-1/2 p-2 z-50 cursor-pointer text-teal-600/80 hover:text-teal-400 transition-colors pointer-events-auto'
            >
              {showPassword ? <Eye className='w-5 h-5 pointer-events-none' /> : <EyeOff className='w-5 h-5 pointer-events-none' />}
            </button>
          </div>

          {/* Confirm Password Input */}
          <div className='relative w-full'>
            <input 
              type={showConfirmPassword ? "text" : "password"}
              name='confirmPassword'
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder='Confirm new password...' 
              className='w-full bg-[#272934] text-white placeholder-gray-400/70 text-[15px] border border-gray-500/30 rounded-[18px] px-6 py-[18px] outline-none focus:border-[#5260A3] transition-colors pr-14 overflow-hidden'
            />
            <button 
              type="button"
              onClick={(e) => {
                e.preventDefault()
                setShowConfirmPassword((prev) => !prev)
              }}
              className='absolute right-4 top-1/2 -translate-y-1/2 p-2 z-50 cursor-pointer text-teal-600/80 hover:text-teal-400 transition-colors pointer-events-auto'
            >
              {showConfirmPassword ? <Eye className='w-5 h-5 pointer-events-none' /> : <EyeOff className='w-5 h-5 pointer-events-none' />}
            </button>
          </div>

          {/* Submit Button */}
          <div className='pt-2'>
            <AuthButton 
              text="Reset Password"
              isLoading={isLoading}
              disabled={!formData.newPassword || !formData.confirmPassword}
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

export default NewPassword
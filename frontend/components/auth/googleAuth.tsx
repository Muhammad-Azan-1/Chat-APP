"use client";


import  {RefreshCw} from 'lucide-react'
import { useGoogleLogin } from "@react-oauth/google";
import { useRouter, useSearchParams } from 'next/navigation'; // <-- Next.js specific router
import { LOGIN_USER_ACTION } from "@/redux/actions/authAction";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/redux/store/store";

const GoogleAuth = ({setError , setSuccessMsg , setLoading , isLoading} : {setError : (error : string) => void , setSuccessMsg : (msg : string) => void , setLoading : (loading : boolean) => void , isLoading : boolean}) => {

    const router = useRouter()
    const searchParams = useSearchParams()
    const redirectParam = searchParams.get("redirect")
    const dispatch = useDispatch<AppDispatch>()

  const loginWithGoogle = useGoogleLogin({
    
    onSuccess: async (credentialResponse) => {
         setLoading(true)
      // The hook returns an access_token, not a credential object, 
      // but assuming the backend can handle the token:
      const accessToken = credentialResponse?.access_token;

      setError("")
      setSuccessMsg("")
      try {
        const response = await fetch('/api/v1/users/googleAuth', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
          },
          body: JSON.stringify({token : accessToken})
        });

        const data = await response.json();

        // console.log("DATA" , data)
       dispatch(LOGIN_USER_ACTION(data?.data?.user))
        
        if (!response.ok) {
          throw new Error(data.message || 'Failed to login with Google');
        }


        setTimeout(() => {
            router.push(redirectParam ? redirectParam : '/chat')
        }, 500);
      } catch (error : any) {
        setSuccessMsg("")
       setError(error.message || "Login Failed somethin went wrong")

      }finally{
        setLoading(false)
      }
    },
    onError: () => {
      setError("Login Failed")
      setLoading(false)
    }
  });

  return (
    <button
      onClick={() => loginWithGoogle()}
      className={`group relative w-full flex items-center justify-center gap-3 bg-[#272934] text-white text-[15px] font-medium border border-gray-500/30 rounded-[18px] px-6 py-[18px] outline-none cursor-pointer overflow-hidden transition-all duration-300 ease-out hover:border-[#5260A3]/60 hover:shadow-[0_0_20px_rgba(82,96,163,0.15)] active:scale-[0.985] ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      {/* Subtle gradient overlay on hover */}
      <span className="absolute inset-0 bg-linear-to-r from-[#5260A3]/0 via-[#5260A3]/5 to-[#5260A3]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Google "G" Logo — inline SVG for crisp rendering */}
      <span className="relative shrink-0 w-5 h-5 transition-transform duration-300 group-hover:scale-110">
        <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
      </span>

        {
            isLoading && (
              <RefreshCw className="w-5 h-5 animate-spin" />
            )
        }
      {/* Button Text */}
      <span className="relative tracking-wide">Continue with Google</span>

      {/* Shimmer effect on hover */}
      <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out bg-linear-to-r from-transparent via-white/4 to-transparent" />
    </button>
  );
};

export default GoogleAuth;
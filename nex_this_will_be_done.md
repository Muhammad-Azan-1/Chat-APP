Step 1: User visits /chat
        → Frontend middleware catches → redirects to /login?redirect=/chat

Step 2: Login page loads
        → Reads ?redirect=/chat from URL
        → Saves it: sessionStorage.setItem("auth_redirect", "/chat")
        → Now it's PERMANENTLY stored in the browser's memory

Step 3: User clicks "Register" → goes to /signup
        → sessionStorage STILL has "auth_redirect" = "/chat" ✅

Step 4: User registers → frontend redirects to /verifyEmail
        → sessionStorage STILL has it ✅

Step 5: User opens email, clicks magic link → /verifyEmail?token=abc123
        → YES, the backend only sends ?token=abc123
        → BUT sessionStorage STILL has "auth_redirect" = "/chat" ✅
        → It lives in the BROWSER, not in the URL!

Step 6: Email verified → frontend redirects to /login
        → sessionStorage STILL has it ✅

Step 7: User logs in successfully
        → Login reads: sessionStorage.getItem("auth_redirect") → "/chat"
        → router.push("/chat") 🎉
        → sessionStorage.removeItem("auth_redirect") // cleanup

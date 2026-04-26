import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },

      {
        protocol : 'http',
        hostname : 'res.cloudinary.com',

      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
  

  //
   async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: "http://localhost:4000/api/v1/:path*",
      },
    ]
  },

  // This is way to get third-party authentication popups (like Google, GitHub, or Facebook login) to actually talk back to your application.
 async headers (){

    return [
      {
      source : '/(.*)',
      headers : [
        {
          key: 'Cross-Origin-Opener-Policy',
          value: 'same-origin-allow-popups', // This is the magic line!
        }
      ]
      }
    
    ]
  }
};

export default nextConfig;



//* Here is the breakdown of what each part does:

//? ### 1\. `source: '/(.*)'`

// This tells Next.js: *"Apply the following rule to every single page and API route in my entire application."* The `/(.*)` is a regular expression that means "literally any URL path."

//? ### 2\. The Header: `Cross-Origin-Opener-Policy` (COOP)

// COOP is a security feature built into web browsers (like Chrome, Safari, Firefox). It prevents malicious websites from opening your app in a popup and trying to steal information from it.

// By default, many modern frameworks apply a very strict COOP rule called `same-origin`.

//   * **The `same-origin` rule means:** "My app is in a high-security lockdown. If my app opens a popup (like https://www.google.com/search?q=google.com), sever all communication between my app and that popup. They are not allowed to talk to each other."

//? ### 3\. The Value: `same-origin-allow-popups` (The Magic Line)

// This line explicitly relaxes that strict lockdown.

// It tells the browser: *"Keep my app secure, **BUT** if my app intentionally opens a popup window, allow that popup to communicate back to my app."*

// ### How this fixes your Google Login:

// When a user clicks "Continue with Google," here is what happens behind the scenes:

// 1.  Your Next.js app opens a popup window pointing to `accounts.google.com`.
// 2.  The user logs in inside the popup.
// 3.  Once successful, Google's script inside the popup tries to yell back to your main window: *"Hey\! They logged in successfully, here is their access token\! You can close me now."*

// **Without this code:** The browser acts like a strict security guard. It blocks the Google popup from talking to your main window. Your app never gets the token, the popup stays open, and you see that red `Cross-Origin-Opener-Policy` error in your console.

// **With this code:** The security guard checks the rules, sees `allow-popups`, and lets Google hand the token back to your main Next.js window. Your app receives the token, the popup closes automatically, and the login succeeds\!
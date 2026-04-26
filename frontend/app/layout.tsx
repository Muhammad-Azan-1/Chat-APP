import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import MainProvider from "./Provider";
import { GoogleOAuthProvider } from "@react-oauth/google";

const poppins = Poppins({
  variable: "--font-poppins",
  weight: "400",
  subsets: ["latin"],
});



export const metadata: Metadata = {
  title: "Chat App",
  description: "Chat App",
};

export default function RootLayout({ children,}: Readonly<{children: React.ReactNode;}>) {
  return (

    <html
      lang="en"
      className={` ${poppins.variable} h-full antialiased dark`}
    >
        <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <GoogleOAuthProvider clientId={process.env.GOOGLE_CLIENT_ID!}>
        <MainProvider>
        {children}
        </MainProvider>
      </GoogleOAuthProvider>
      </body>
    </html>
  );
}

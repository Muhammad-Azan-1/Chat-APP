import { NextResponse , NextRequest } from "next/server"
import { authRoutes , privateRoutes, publicRoutes } from "./routes/route"


const proxy = ( request : NextRequest) =>{

    const path = request.nextUrl.pathname
    const token = request.cookies?.get("accessToken")?.value


    if(token && authRoutes.some((items)=> path === items)){
        const chatUrl = new URL("/chat" , request.nextUrl)
        return NextResponse.redirect(chatUrl)
    }
   

    // 2. If user is trying to access a protected path but has NO token -> Redirect to Login
    // ye if sirf tab chaly ga jab user login na hu
    if(!token && !authRoutes.some((items)=> path === items) && !publicRoutes.some((items)=> path === items)){  
        const loginUrl = new URL("/login" , request.nextUrl)
        loginUrl.searchParams.set('redirect' , path)
        return NextResponse.redirect(loginUrl)
    }


      return NextResponse.next();

}

export default proxy


// This tells Next.js exactly which routes the middleware SHOULD run on.
export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT for the ones starting with:
     * - _next/static (static files like CSS/JS)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api (API routes, unless you specifically want middleware to protect those too)
     */
    '/((?!_next/static|_next/image|favicon.ico|api).*)',
  ],
};
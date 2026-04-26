# How Browsers Automatically Handle HttpOnly Cookies (Step-by-Step)

This document maps out the entire lifecycle of how your `accessToken` travels smoothly and securely between your Next.js Frontend and Express Backend without Javascript ever touching it.

## Step 1: The Backend "Orders" the Cookie to be Saved
A user logs in by calling `POST /api/v1/auth/login`.

Inside your Express controller, you log the user in, generate an `accessToken`, and send the HTTP response back to the frontend.
```javascript
res.cookie("accessToken", accessToken, {
    httpOnly: true, // Crucial step!
    secure: process.env.NODE_ENV === "production",
})
```
Behind the scenes, your backend attaches a special HTTP Header to the response before sending it over the internet:
`Set-Cookie: accessToken=eyJhbGciOi...; HttpOnly`

## Step 2: The Web Browser Locks it Away
When your browser (Chrome, Safari, Firefox) receives the login response, it doesn't give the token to your React/Next.js Javascript code.

Instead, the browser's internal engine sees `Set-Cookie` and acts like a security vault:
1. It looks at the domain it came from (e.g., `localhost`).
2. It locks the `accessToken` inside its internal cookie storage labeled for `localhost`.
3. Because of `HttpOnly`, the browser actively blocks Javascript (`document.cookie`) from viewing or reading that storage cell.

## Step 3: Triggering a New Request (e.g. Logout)
Sometime later, the user clicks the "Logout" button. Your React code fires a simple `fetch` command:
```javascript
fetch("/api/v1/auth/logout", {
  method: "POST"
});
```
Notice how your Javascript code does **not** include an `Authorization: Bearer <token>` header. Javascript has no token to give!

## Step 4: The Browser Plays "Automatic Postman"
Before the `fetch` request leaves your computer, the browser intercepts it at the network level. 

1. The browser checks where the request is going (`/api/v1/auth/logout` -> mapped to `localhost`).
2. It checks its hidden cookie vault: *"Do I have any cookies stored for `localhost`?"*
3. It finds the `accessToken` ,  `refreshToken`  and **automatically injects it** into the outgoing HTTP Headers:

```http
POST /api/v1/auth/logout HTTP/1.1
Host: localhost:3000
Cookie: accessToken=eyJhbGciOi...
```
The request leaves your computer with the token attached, completely automatically.

## Step 5: The Backend Decides What to Do
The request hits your Express backend holding that `Cookie` header. 

What happens next depends on the route's specific Middleware:

### Scenario A: A Protected Route (`/logout`, `/updateProfile`)
You put your `verifyJWT` middleware on this route.
```javascript
// Looks for cookies FIRST, but falls back to manual Authorization header
const token = req.cookies?.accessToken || req.headers?.authorization?.replace("Bearer ", "")
```
The middleware grabs the `accessToken` from `req.cookies`, verifies it was created by your app, and allows the request to continue `next()` to the controller.

### Scenario B: A Public Route (`/register`, `/login`)
The browser **still sent the cookie** (because browsers blindly send cookies to matching domains).
However, you didn't put `verifyJWT` on this route. The backend controller (e.g., your `register` function) just ignores the cookie sitting in the headers, does its job, and responds.

---

## The "Same-Origin" vs "Cross-Origin" Catch

For the browser to act as that automatic postman, the domains MUST matched. 

### Scenario 1: The Next.js Proxy Trick (What you have done)
Your React code runs on `localhost:3000` and makes requests to `/api/v1/...`. 
Because of the `rewrites()` rule in `next.config.ts`, Next.js catches this request at port 3000 and silently passes it to your Express backend on `localhost:4000`.
Because the browser only sees the request going to `localhost:3000`, it assumes the frontend and backend are on the **Exact Same Origin**. It blindly attaches the cookies automatically.

### Scenario 2: Explicit Cross-Origin Requests (Without Proxy)
If you **did not** have `next.config.ts` rewrites configured, and your React code explicitly tried to command a fetch directly to the backend:
```javascript
fetch("http://localhost:4000/api/v1/auth/logout", {
  method: "POST"
});
```
The browser would flag this as **Cross-Origin** (`localhost:3000` -> `localhost:4000`). It becomes extremely defensive and **WILL NOT SEND the cookies**. 

To make the browser send cookies securely across different origins, a strict two-way handshake is required:

1. **The Frontend MUST explicitly tell the browser to send cookies:**
```javascript
fetch("http://localhost:4000/api/v1/auth/logout", {
  method: "POST",
  credentials: "include" // <--- Required to send cookies cross-origin
});
```
2. **The Backend MUST explicitly allow cookies from that specific origin:**
```javascript
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true // <--- Required to accept cookies
}));
```

---

### Summary Table

| Action | Who does it? | Does Javascript touch the token? |
| :--- | :--- | :--- |
| **Generates Token** | Express Backend (`res.cookie`) | No |
| **Stores the Token** | Web Browser (Internal Vault) | No (Blocked by `HttpOnly`) |
| **Attaches Token to `fetch`** | Web Browser (Network Level intercept) | No |
| **Reads arriving Token** | Express Backend (`verifyJWT`) | No |

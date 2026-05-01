# 🐛 Message Send Debugging Guide

## Issue: Message Not Sending

### Step 1: Check Browser Console

Open browser DevTools (F12) and check for errors:

**Expected to see:**
```
Socket connected successfully! <socket_id>
```

**Common errors:**
- `currentUserId is undefined` → Auth state issue (FIXED ✅)
- `Failed to fetch` → Backend not running
- `401 Unauthorized` → Token expired
- `Network error` → Wrong API URL

---

### Step 2: Check Redux State

Open Redux DevTools and verify:

**Auth State:**
```javascript
auth: {
  details: {
    _id: "user_id_here",  // ← Must exist
    username: "...",
    email: "...",
    avatar: "..."
  },
  isAuthenticated: true
}
```

**Message State:**
```javascript
message: {
  messages: {},
  loading: false,
  error: null  // ← Should be null
}
```

---

### Step 3: Check Network Tab

When you click send, you should see:

**Request:**
```
POST http://localhost:4000/api/v1/message/send/:chatId
Status: 201 Created
```

**If you see:**
- `404 Not Found` → Route not registered
- `401 Unauthorized` → JWT verification failed
- `400 Bad Request` → Missing message or chatId
- `500 Internal Server Error` → Backend error (check backend console)

---

### Step 4: Check Backend Console

Backend should log:
```
processing file <filename>  // If file attached
```

**Common backend errors:**
- `Chat does not exist` → Invalid chatId
- `Message content or attachment is required` → Empty message
- `Cloudinary upload failed` → Check Cloudinary credentials

---

### Step 5: Add Debug Logs

Temporarily add console logs to track the flow:

**In `messageInput.tsx` (line 38):**
```typescript
const handleSend = async () => {
  console.log("🔵 Sending message:", { message, attachments });
  // ... rest of code
```

**In `useMessages.ts` (line 46):**
```typescript
const sendMessage = useCallback(async (content: string, attachments: File[] = []) => {
  console.log("🟢 useMessages.sendMessage called:", { content, attachments, currentUserId });
  // ... rest of code
```

**In `messageApi.ts` (line 51):**
```typescript
export async function sendMessage(...) {
  console.log("🟡 API call starting:", { chatId, message, attachments });
  // ... rest of code
```

---

### Step 6: Common Fixes

#### Fix 1: Auth State Issue (Already Fixed ✅)
```typescript
// Changed from:
state.auth.user?._id
// To:
state.auth.details?._id
```

#### Fix 2: Empty Message
Make sure you're typing something before pressing send.

#### Fix 3: Invalid Chat ID
```typescript
// In RightChatBox, check:
console.log("Selected chat ID:", selectedChat?.id);
```

#### Fix 4: Backend Not Running
```bash
cd backend
npm run dev
# Should see: "Server is running on port 4000"
```

#### Fix 5: Wrong API URL
Check `frontend/.env`:
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

---

### Step 7: Test Minimal Case

Try sending just text (no attachments):
1. Type "test"
2. Press Enter
3. Check console for logs
4. Check Network tab for API call

---

### Step 8: Check Backend Route

Verify route is registered in `backend/src/app.js`:
```javascript
app.use("/api/v1/message", messageRouter)
```

---

## 🎯 Quick Diagnostic

Run this in browser console:
```javascript
// Check auth state
console.log("Auth:", window.__REDUX_DEVTOOLS_EXTENSION__?.store?.getState().auth);

// Check if API URL is set
console.log("API URL:", process.env.NEXT_PUBLIC_API_URL);

// Check socket connection
console.log("Socket connected:", window.__REDUX_DEVTOOLS_EXTENSION__?.store?.getState().socket.isConnected);
```

---

## 📋 Checklist

- [ ] Backend running on port 4000
- [ ] Frontend running on port 3000
- [ ] Socket connected (check console)
- [ ] User is authenticated (check Redux)
- [ ] Chat is selected (selectedChat?.id exists)
- [ ] Message input has text
- [ ] No errors in browser console
- [ ] No errors in backend console

---

## 🆘 Still Not Working?

Share with me:
1. **Browser console errors** (screenshot or copy)
2. **Network tab** (failed request details)
3. **Backend console output**
4. **Redux state** (auth and message slices)

I'll help you debug further!

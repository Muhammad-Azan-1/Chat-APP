# 🚀 Quick Start - Message Feature

## ✅ Configuration Complete

- Backend Port: 4000
- Socket URL: http://localhost:4000
- Frontend API URL: http://localhost:4000
- Cloudinary: Configured

---

## 🎯 Start Testing Now

### Step 1: Start Backend
```bash
cd backend
npm run dev
```
**Expected output:**
```
Server is running on port 4000
MongoDB connected successfully
```

### Step 2: Start Frontend (New Terminal)
```bash
cd frontend
npm run dev
```
**Expected output:**
```
Ready on http://localhost:3000
```

### Step 3: Test Message Flow

1. **Open browser** → `http://localhost:3000`
2. **Login** with your account
3. **Select or create a chat**
4. **Type a message** → Press Enter
5. **✅ Message should appear instantly**

### Step 4: Test File Upload

1. **Click paperclip icon** 📎
2. **Select an image**
3. **See preview** below input
4. **Click send** ➤
5. **✅ Image uploads to Cloudinary and displays**

### Step 5: Test Real-time (Optional)

1. **Open incognito window**
2. **Login with different user**
3. **Open same chat**
4. **Send message from first window**
5. **✅ Message appears in both windows instantly**

---

## 🔍 What to Check

### Browser Console Should Show:
```
Socket connected successfully! <socket_id>
```

### Redux DevTools Should Show:
```
message: {
  messages: {
    "chatId": [
      { id: "...", content: "...", ... }
    ]
  },
  loading: false,
  error: null
}
```

### Network Tab Should Show:
```
GET /api/v1/message/get/:chatId → 200 OK
POST /api/v1/message/send/:chatId → 201 Created
```

---

## 🐛 Common Issues & Fixes

### Issue: "Socket connection error"
**Fix:** Check backend is running on port 4000

### Issue: "Failed to fetch messages"
**Fix:** Verify `NEXT_PUBLIC_API_URL` in frontend/.env

### Issue: "File upload failed"
**Fix:** Check Cloudinary credentials in backend/.env

### Issue: Messages not appearing in real-time
**Fix:** Check socket connection in browser console

---

## 📊 Success Indicators

✅ Socket connects on page load  
✅ Messages load when chat is selected  
✅ New messages appear instantly  
✅ File attachments upload successfully  
✅ Delete message works  
✅ Real-time updates work across devices  

---

Ready to start! Run the commands above and let me know if you encounter any issues. 🎯

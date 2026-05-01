# 🔧 Fix 404 Error - Restart Backend

## The Problem
The message routes were added after the backend server started, so they're not loaded yet.

## The Solution

### Step 1: Stop Backend Server
Go to the terminal running your backend and press:
```
Ctrl + C
```

### Step 2: Restart Backend
```bash
cd backend
npm run dev
```

**Expected output:**
```
Server is running on port 4000
MongoDB connected successfully
```

### Step 3: Test Routes Are Working

Open a new terminal and test the health endpoint:
```bash
curl http://localhost:4000/health
```

**Should return:**
```json
{"status":"OK","message":"Server is running"}
```

### Step 4: Test Message Route (Optional)

You can test if the route exists (will get 401 without auth, but that's OK):
```bash
curl http://localhost:4000/api/v1/message/get/test123
```

**Should return:**
```json
{"statusCode":401,"message":"Unauthorized request"}
```

**NOT:**
```
Cannot GET /api/v1/message/get/test123
```

If you see "Cannot GET", the routes aren't loaded.

---

## After Restart

### Test in Browser

1. **Refresh your frontend** (Ctrl+R or Cmd+R)
2. **Select a chat**
3. **Check console** - should see messages loading
4. **Try sending a message**

---

## Verify Everything Works

**Console should show:**
```
✅ Socket connected successfully!
✅ No 404 errors
```

**Network tab should show:**
```
GET /api/v1/message/get/:chatId → 200 OK
POST /api/v1/message/send/:chatId → 201 Created
```

---

## Still Getting 404?

Check these:

### 1. Verify API URL in Frontend
```bash
cat frontend/.env | grep NEXT_PUBLIC_API_URL
```
Should show: `NEXT_PUBLIC_API_URL=http://localhost:4000`

### 2. Check Backend Port
```bash
cat backend/.env | grep PORT
```
Should show: `PORT="4000"`

### 3. Verify Routes File
```bash
cat backend/src/routes/message.routes.js
```
Should have all three routes.

### 4. Check Backend Logs
Look for any errors when backend starts.

---

Let me know if it works after restarting! 🚀

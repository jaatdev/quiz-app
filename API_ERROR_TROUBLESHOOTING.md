# Troubleshooting Guide: API Error Fix

## ✅ Linting Errors Fixed

All TypeScript and ESLint errors have been resolved:
- ✅ Fixed 'any' type errors with proper type definitions
- ✅ Removed unused imports (format, Filter, Eye, Bar, BarChart)
- ✅ Fixed apostrophe escaping issues  
- ✅ Added index signatures for Recharts compatibility

---

## 🔧 Fixing "API Error: Something went wrong"

### Root Cause
The frontend cannot connect to the backend API server. This happens when:
1. Backend server is not running
2. Backend is running on wrong port
3. CORS configuration issues
4. Database connection problems

---

## 🚀 Step-by-Step Fix

### **Step 1: Start the Backend Server**

Open a **new PowerShell terminal** and run:

```powershell
cd "C:\Users\Kapil Chaudhary\Desktop\quiz-app\backend"
npm run dev
```

**Expected Output:**
```
============================================================
🚀 Quiz API Server running on http://localhost:5000
============================================================

📚 Available Endpoints:
   GET  /api/health              - Health check
   GET  /api/subjects            - Get all subjects with topics
   GET  /api/topics/:topicId     - Get topic details
   GET  /api/quiz/session/:topicId?count=10 - Start quiz
   POST /api/quiz/submit         - Submit quiz answers
   POST /api/quiz/review         - Get review questions
============================================================
```

**If you see errors:**

#### **Error: "Cannot find module"**
```powershell
npm install
npm run dev
```

#### **Error: "Port 5000 is already in use"**
```powershell
# Find and kill the process
Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process -Force

# Then restart
npm run dev
```

#### **Error: "Database connection failed"**
Check your `.env` file has correct `DATABASE_URL`:
```powershell
cat .env
```

Should contain:
```
DATABASE_URL="postgresql://..."
```

---

### **Step 2: Verify Backend is Running**

Open a browser and test:
```
http://localhost:5000/api/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-15T10:00:00.000Z"
}
```

---

### **Step 3: Start the Frontend Server**

Open a **second PowerShell terminal** and run:

```powershell
cd "C:\Users\Kapil Chaudhary\Desktop\quiz-app\frontend"
npm run dev
```

**Expected Output:**
```
▲ Next.js 15.5.4 (Turbopack)
- Local:        http://localhost:3000
- Network:      http://10.30.154.132:3000

✓ Starting...
✓ Ready in 2.7s
```

---

### **Step 4: Test the Connection**

1. Open browser: `http://localhost:3000`
2. Check browser console (F12) - should see no errors
3. Try navigating to different pages
4. The API error should be gone!

---

## 🛠️ Advanced Troubleshooting

### **Check if Backend is Accessible**

Test each endpoint in browser or Postman:

```
# Health check
GET http://localhost:5000/api/health

# Get subjects
GET http://localhost:5000/api/subjects

# Get user stats (replace with your clerkId)
GET http://localhost:5000/api/user/stats/user_xxx

# Get leaderboard
GET http://localhost:5000/api/user/leaderboard
```

---

### **Check Frontend API Configuration**

Verify `frontend/.env.local`:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:5000
```

**If `NEXT_PUBLIC_API_URL` is missing, add it!**

---

### **Fix CORS Issues**

If you see CORS errors in console, update `backend/src/index.ts`:

```typescript
// More permissive CORS for development
app.use(cors({
  origin: ['http://localhost:3000', 'http://10.30.154.132:3000'],
  credentials: true
}));
```

---

### **Database Connection Issues**

Test database connectivity:

```powershell
cd backend
npx prisma db pull
```

**Expected:** No errors

**If errors:**
1. Check DATABASE_URL in `.env`
2. Verify database is accessible
3. Test connection manually

---

## 📋 Quick Checklist

Before starting, ensure:

- [x] Backend `.env` file exists with DATABASE_URL
- [x] Frontend `.env.local` exists with Clerk keys
- [x] Database is accessible (Neon/Supabase)
- [x] Node.js and npm are installed
- [x] Dependencies are installed (`npm install` in both folders)

---

## 🔄 Restart Both Servers Script

Save this as `start-servers.ps1`:

```powershell
# Start Backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\Kapil Chaudhary\Desktop\quiz-app\backend'; npm run dev"

# Wait 3 seconds for backend to start
Start-Sleep -Seconds 3

# Start Frontend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\Kapil Chaudhary\Desktop\quiz-app\frontend'; npm run dev"

Write-Host "✅ Both servers started!"
Write-Host "Backend:  http://localhost:5000"
Write-Host "Frontend: http://localhost:3000"
```

**Run with:**
```powershell
.\start-servers.ps1
```

---

## 🐛 Common Errors & Solutions

### **Error: "EADDRINUSE: Port already in use"**

**Solution:**
```powershell
# Kill process on port 5000 (backend)
Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process -Force

# Kill process on port 3000 (frontend)
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process -Force
```

---

### **Error: "Prisma Client validation failed"**

**Solution:**
```powershell
cd backend
npx prisma generate
npx prisma db push
npm run dev
```

---

### **Error: "Module not found" after updates**

**Solution:**
```powershell
# Backend
cd backend
rm -r node_modules
rm package-lock.json
npm install

# Frontend
cd ../frontend
rm -r node_modules
rm package-lock.json
npm install
```

---

### **Error: "Clerk authentication failed"**

**Solution:**
1. Go to https://dashboard.clerk.com
2. Copy fresh API keys
3. Update `frontend/.env.local`
4. Restart frontend server

---

## 📊 Expected Console Output (No Errors)

### **Backend Console:**
```
🚀 Quiz API Server running on http://localhost:5000
Prisma schema loaded from prisma\schema.prisma
Database connected successfully
```

### **Frontend Console (Browser F12):**
```
No errors - only info messages
```

---

## ✅ Success Indicators

You'll know it's working when:

1. ✅ Backend terminal shows "Quiz API Server running"
2. ✅ Frontend terminal shows "Ready in X seconds"
3. ✅ Browser shows homepage without errors
4. ✅ You can navigate between pages
5. ✅ Leaderboard and stats load data
6. ✅ No "API Error" messages in console

---

## 🎯 Testing Endpoints

Once both servers are running, test these URLs:

**Backend Health:**
```
http://localhost:5000/api/health
```

**Get Subjects:**
```
http://localhost:5000/api/subjects
```

**Frontend Homepage:**
```
http://localhost:3000
```

**Leaderboard:**
```
http://localhost:3000/leaderboard
```

**Dashboard:**
```
http://localhost:3000/dashboard
```

---

## 💡 Pro Tips

1. **Keep both terminals open** - Don't close them while testing
2. **Check ports** - Make sure 3000 and 5000 are free
3. **Clear browser cache** - Hard refresh (Ctrl+Shift+R)
4. **Check network tab** - See exactly which API calls are failing
5. **Enable verbose logging** - Add `console.log` statements to debug

---

## 📞 Still Having Issues?

If the API error persists:

1. **Check Backend Logs** - Look for error messages in backend terminal
2. **Check Browser Console** - Look for network errors (F12 → Network tab)
3. **Verify Environment Variables** - Double-check all `.env` files
4. **Test API Manually** - Use Postman or curl to test endpoints
5. **Restart Everything** - Close all terminals and start fresh

---

## 🎉 After Fixing

Once the API error is resolved:

1. ✅ All pages should load correctly
2. ✅ Leaderboard shows rankings
3. ✅ Dashboard displays user stats
4. ✅ Quiz taking works end-to-end
5. ✅ Achievements unlock properly

---

**Status:** Ready to test! Start both servers and the API error should be resolved. 🚀

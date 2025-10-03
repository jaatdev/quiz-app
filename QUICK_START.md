# 🚀 Quick Start Guide - Admin Panel Testing

## Current Status Check

Run this checklist before starting:

### 1. Database Status ✅
```powershell
cd backend
npx prisma db push
npx prisma generate
```
**Status:** ✅ Already completed (role field added)

### 2. Servers Running ❓
Check if your development servers are running:
- Backend: `http://localhost:5001/api/health`
- Frontend: `http://localhost:3000` or `http://localhost:3001`

**To start servers:**
```powershell
# Method 1: Run both together (from root)
npm run dev

# Method 2: Run separately
# Terminal 1:
cd backend
npm run dev

# Terminal 2:
cd frontend
npm run dev
```

---

## 🎯 Quick Testing Steps (3 Minutes)

### Step 1: Sign Up (1 minute)
1. Open browser: `http://localhost:3000` (or 3001)
2. Click "Sign Up" 
3. Enter email and password
4. Complete signup

**✅ Success:** You're logged in and see the dashboard

---

### Step 2: Make Yourself Admin (30 seconds)

Open a new terminal:
```powershell
# List users to verify your account
cd backend
npx tsx scripts/list-users.ts

# Copy your email from the output, then run:
npx tsx scripts/make-admin.ts your-email@example.com
```

**✅ Success:** Message shows "Successfully made [email] an admin!"

---

### Step 3: Access Admin Panel (30 seconds)

1. Go to: `http://localhost:3000/admin`
2. You should see the admin dashboard!

**✅ Success:** Dashboard loads with stats cards

---

### Step 4: Quick Feature Test (1 minute)

**Test 1 - Create a Subject:**
1. Click "Subjects" in sidebar
2. Click "Add Subject"
3. Enter name: "Programming"
4. Click "Save"

**Test 2 - Create a Topic:**
1. Click "Add Topic" on the subject
2. Enter name: "React Basics"
3. Click "Save"

**Test 3 - Create a Question:**
1. Click "Questions" in sidebar
2. Click "Add Question"
3. Select topic: "React Basics"
4. Enter question: "What is React?"
5. Enter options A-D
6. Select correct answer
7. Click "Save"

**✅ Success:** All items created and visible!

---

## 📋 Current User Info

You currently have **0 users** in the database.

### What You Need to Do:

1. **Start the servers** (if not running):
   ```powershell
   npm run dev
   ```

2. **Sign up in the app**:
   - Open `http://localhost:3000` (or 3001)
   - Create an account with your email
   - Remember this email!

3. **Make yourself admin**:
   ```powershell
   cd backend
   npx tsx scripts/make-admin.ts YOUR_EMAIL_HERE
   ```

4. **Access admin panel**:
   - Go to `http://localhost:3000/admin`
   - Start managing your quiz platform!

---

## 🔧 Useful Commands

### List all users:
```powershell
cd backend
npx tsx scripts/list-users.ts
```

### Make user admin:
```powershell
cd backend
npx tsx scripts/make-admin.ts email@example.com
```

### Check backend health:
```powershell
curl http://localhost:5001/api/health
```

### View database in Prisma Studio:
```powershell
cd backend
npx prisma studio
```

---

## 🎯 What to Test

Once you're an admin, test these features:

### Dashboard (`/admin`)
- [ ] View statistics
- [ ] See recent users
- [ ] See recent quizzes

### Questions (`/admin/questions`)
- [ ] Add a question
- [ ] Edit a question  
- [ ] Delete a question
- [ ] Search questions

### Subjects (`/admin/subjects`)
- [ ] Add a subject
- [ ] Add topics to subject
- [ ] Edit subject/topic
- [ ] Delete subject/topic

### Users (`/admin/users`)
- [ ] View all users
- [ ] Search users
- [ ] Change user role
- [ ] Filter by role

### Import (`/admin/import`)
- [ ] Download JSON template
- [ ] Download CSV template
- [ ] Upload and import file
- [ ] View import results

### Settings (`/admin/settings`)
- [ ] Change quiz settings
- [ ] Toggle features
- [ ] Save settings

---

## 🆘 Troubleshooting

### Servers not running?
```powershell
# Kill any processes on ports
# Then restart:
npm run dev
```

### Can't access /admin?
- Make sure you ran `make-admin.ts` with correct email
- Sign out and sign in again
- Clear browser cache

### API errors?
- Check backend is running on port 5001
- Check browser console for errors
- Verify Clerk auth is configured

---

## 📚 Full Documentation

For complete testing checklist, see: `TESTING_GUIDE.md`

For admin panel features, see: `ADMIN_PANEL_COMPLETE.md`

---

**Ready to test? Follow the 3-minute quick start above! 🚀**

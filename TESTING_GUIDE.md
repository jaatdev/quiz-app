# 🧪 Admin Panel Testing Guide

## Prerequisites Checklist

Before testing the admin panel, ensure:
- ✅ Backend server is running on port 5001
- ✅ Frontend server is running on port 3000 or 3001
- ✅ Database is connected and migrations are applied
- ✅ Prisma client is generated with role field

---

## 📋 Step-by-Step Testing Process

### Step 1: Sign Up in the Application

1. **Start your servers** (if not already running):
   ```powershell
   # Open terminal 1 - Backend
   cd backend
   npm run dev
   
   # Open terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

2. **Access the application**:
   - Open browser: `http://localhost:3000` (or 3001)
   - You should see the quiz app homepage

3. **Create an account**:
   - Click "Sign Up" button
   - Enter your email and password
   - Complete the Clerk authentication process
   - Remember the email you used!

4. **Verify sign up**:
   - You should be redirected to the dashboard
   - Your user account is now created in the database

---

### Step 2: Make Yourself Admin

1. **List existing users** (to verify your account was created):
   ```powershell
   cd backend
   npx tsx scripts/list-users.ts
   ```
   
   You should see output like:
   ```
   📋 Registered Users:
   
   1. your-email@example.com
      Name: Your Name
      Role: user
      Joined: Oct 3, 2025
   ```

2. **Make yourself admin**:
   ```powershell
   npx tsx scripts/make-admin.ts your-email@example.com
   ```
   
   Replace `your-email@example.com` with the email you used to sign up.

3. **Expected output**:
   ```
   ✅ Successfully made your-email@example.com an admin!
   ```

4. **Verify admin status**:
   ```powershell
   npx tsx scripts/list-users.ts
   ```
   
   You should now see:
   ```
   1. your-email@example.com
      Name: Your Name
      Role: admin  ← Should show "admin" now
   ```

---

### Step 3: Access Admin Panel

1. **Navigate to admin panel**:
   - Go to: `http://localhost:3000/admin` (or 3001)
   - Or click the admin link if you've added it to your navigation

2. **Expected behavior**:
   - ✅ If you're an admin: You'll see the admin dashboard
   - ❌ If you're not an admin: You'll see "Access Denied" or be redirected

---

## 🧪 Feature Testing Checklist

### 1. Admin Dashboard (`/admin`)

**Test:**
- [ ] Dashboard loads successfully
- [ ] Statistics cards show correct data:
  - [ ] Total Users count
  - [ ] Total Quizzes count
  - [ ] Total Questions count
  - [ ] Total Subjects count
  - [ ] Total Topics count
- [ ] Recent Users list displays (if any users exist)
- [ ] Recent Quizzes list displays (if any quizzes were taken)

**Expected Results:**
- All stats should display as numbers (may be 0 initially)
- No errors in browser console
- Page loads within 2 seconds

---

### 2. Question Management (`/admin/questions`)

**Test Add Question:**
1. [ ] Click "Add Question" button
2. [ ] Question form modal opens
3. [ ] Select a topic from dropdown
4. [ ] Enter question text: "What is React?"
5. [ ] Enter 4 options:
   - A: "A JavaScript library"
   - B: "A database"
   - C: "A CSS framework"
   - D: "A testing tool"
6. [ ] Select correct answer: A
7. [ ] Select difficulty: Easy
8. [ ] Add explanation (optional): "React is a JavaScript library for building UIs"
9. [ ] Click "Save"

**Expected Results:**
- [ ] Modal closes
- [ ] Question appears in the list
- [ ] Correct answer highlighted in green
- [ ] Success notification shown

**Test Edit Question:**
1. [ ] Click "Edit" button on a question
2. [ ] Modal opens with pre-filled data
3. [ ] Change question text
4. [ ] Click "Save"

**Expected Results:**
- [ ] Changes are saved
- [ ] Question list updates
- [ ] No errors shown

**Test Delete Question:**
1. [ ] Click "Delete" button on a question
2. [ ] Confirm deletion

**Expected Results:**
- [ ] Question removed from list
- [ ] Database updated

**Test Search:**
1. [ ] Enter search term in search box
2. [ ] Results filter in real-time

**Expected Results:**
- [ ] Only matching questions shown
- [ ] Search is case-insensitive

---

### 3. Subject & Topic Management (`/admin/subjects`)

**Test Add Subject:**
1. [ ] Click "Add Subject" button
2. [ ] Enter subject name: "Programming"
3. [ ] Click "Save"

**Expected Results:**
- [ ] New subject card appears
- [ ] Subject name displayed correctly

**Test Add Topic:**
1. [ ] Click "Add Topic" button on a subject
2. [ ] Enter topic name: "React Basics"
3. [ ] Click "Save"

**Expected Results:**
- [ ] New topic appears in subject's topic list
- [ ] Topic count updates

**Test Edit Subject/Topic:**
1. [ ] Click "Edit" button
2. [ ] Change name
3. [ ] Click "Save"

**Expected Results:**
- [ ] Name updates correctly
- [ ] No errors

**Test Delete Topic:**
1. [ ] Click "Delete" on a topic
2. [ ] Confirm deletion warning

**Expected Results:**
- [ ] Topic removed
- [ ] Warning about questions being deleted

**Test Delete Subject:**
1. [ ] Click "Delete" on a subject
2. [ ] Confirm deletion warning

**Expected Results:**
- [ ] Subject removed
- [ ] Warning about topics and questions being deleted

---

### 4. User Management (`/admin/users`)

**Test User List:**
- [ ] All registered users displayed
- [ ] User avatars shown
- [ ] Email addresses visible
- [ ] Role badges displayed (Admin/User)
- [ ] Quiz attempts count shown
- [ ] Achievements count shown
- [ ] Join dates formatted correctly

**Test Search:**
1. [ ] Enter name or email in search
2. [ ] Results filter

**Expected Results:**
- [ ] Only matching users shown
- [ ] Search works for both name and email

**Test Role Filter:**
1. [ ] Select "Admins Only" from dropdown
2. [ ] Select "Users Only"
3. [ ] Select "All Roles"

**Expected Results:**
- [ ] Users filtered by role correctly

**Test Make Admin:**
1. [ ] Click "Make Admin" on a user
2. [ ] Role changes to admin

**Expected Results:**
- [ ] Role badge updates to "admin"
- [ ] Button changes to "Remove Admin"
- [ ] Database updated

**Test Remove Admin:**
1. [ ] Click "Remove Admin" on an admin user
2. [ ] Role changes to user

**Expected Results:**
- [ ] Role badge updates to "user"
- [ ] Button changes to "Make Admin"

**Test Self-Protection:**
- [ ] Your own role toggle button should be disabled
- [ ] You cannot change your own role

---

### 5. Bulk Import (`/admin/import`)

**Test JSON Import:**
1. [ ] Select "JSON Format"
2. [ ] Click "Download JSON Template"
3. [ ] Open downloaded file
4. [ ] Edit the template:
   - Replace `YOUR_TOPIC_ID_HERE` with actual topic ID
   - Add more questions if desired
5. [ ] Click "Click to upload"
6. [ ] Select your JSON file
7. [ ] Review preview (first 3 questions shown)
8. [ ] Click "Import Questions"

**Expected Results:**
- [ ] Template downloads successfully
- [ ] File uploads and shows in preview
- [ ] Import completes successfully
- [ ] Success message shows number of imported questions
- [ ] Questions appear in question list

**Test CSV Import:**
1. [ ] Select "CSV Format"
2. [ ] Click "Download CSV Template"
3. [ ] Open in Excel/Google Sheets
4. [ ] Edit the template
5. [ ] Save as CSV
6. [ ] Upload the file
7. [ ] Click "Import Questions"

**Expected Results:**
- [ ] CSV template downloads
- [ ] File uploads successfully
- [ ] Questions imported correctly

**Test Error Handling:**
1. [ ] Upload invalid JSON file
2. [ ] Upload file with missing topicId

**Expected Results:**
- [ ] Error message displayed
- [ ] No questions imported
- [ ] Helpful error message shown

---

### 6. Settings Page (`/admin/settings`)

**Test Quiz Settings:**
1. [ ] Change time limit value
2. [ ] Change questions per quiz
3. [ ] Toggle negative marking
4. [ ] Change penalty value
5. [ ] Toggle other checkboxes
6. [ ] Click "Save Settings"

**Expected Results:**
- [ ] All inputs work correctly
- [ ] Save button shows "Saving..." state
- [ ] Success message shown
- [ ] Settings persist (currently demo - will show alert)

---

## 🔍 Browser Console Testing

**Open Developer Tools (F12) and check:**

### No Errors Should Appear
- [ ] No 404 errors for missing resources
- [ ] No CORS errors
- [ ] No authentication errors (401/403)
- [ ] No JavaScript runtime errors

### Network Tab
- [ ] API calls to `localhost:5001` succeed
- [ ] All requests return 200 status (or appropriate codes)
- [ ] Response times are reasonable (< 1s)

### Console Tab
- [ ] No red error messages
- [ ] Only expected log messages

---

## 🎯 End-to-End User Flow Test

### Complete Admin Workflow:

1. **Setup Content Structure:**
   - [ ] Create subject: "Computer Science"
   - [ ] Add topic: "React" under Computer Science
   - [ ] Add topic: "JavaScript" under Computer Science

2. **Add Questions:**
   - [ ] Add 3 questions to "React" topic
   - [ ] Add 2 questions to "JavaScript" topic
   - [ ] Verify all appear in question list

3. **Bulk Import:**
   - [ ] Download JSON template
   - [ ] Add 5 questions
   - [ ] Import successfully
   - [ ] Verify questions in list

4. **User Management:**
   - [ ] View all users
   - [ ] Search for a user
   - [ ] Change a user's role
   - [ ] Verify change persists

5. **Dashboard Check:**
   - [ ] Return to dashboard
   - [ ] Verify stats updated:
     - [ ] Question count increased
     - [ ] Subject count shows 1
     - [ ] Topic count shows 2

---

## 🐛 Common Issues & Solutions

### Issue: "Access Denied" when visiting /admin
**Solution:**
- Verify you ran `make-admin.ts` with correct email
- Check `npx tsx scripts/list-users.ts` shows role as "admin"
- Clear browser cache and refresh
- Sign out and sign in again

### Issue: API calls fail with 401/403
**Solution:**
- Check backend server is running on port 5001
- Verify Clerk authentication is working
- Check browser console for auth errors
- Ensure `x-clerk-user-id` header is being sent

### Issue: "No topics found" in question form
**Solution:**
- Go to `/admin/subjects` first
- Create at least one subject
- Add at least one topic to that subject
- Topics will now appear in dropdown

### Issue: Import fails with "Invalid file format"
**Solution:**
- Use the downloaded template as starting point
- Ensure JSON is valid (use JSONLint.com to validate)
- For CSV, ensure proper comma separation
- Don't include special characters in CSV without quotes

### Issue: Statistics show 0 for everything
**Solution:**
- This is normal for a new installation
- Add content (subjects, topics, questions)
- Dashboard will update automatically
- Stats are calculated in real-time

---

## ✅ Success Criteria

Your admin panel is working correctly if:

1. **Authentication:**
   - ✅ Only admin users can access `/admin` routes
   - ✅ Regular users are denied access
   - ✅ Unauthorized users are redirected

2. **CRUD Operations:**
   - ✅ Can create subjects, topics, questions
   - ✅ Can edit existing content
   - ✅ Can delete content with confirmations
   - ✅ Changes persist in database

3. **Bulk Import:**
   - ✅ JSON import works
   - ✅ CSV import works
   - ✅ Templates download correctly
   - ✅ Validation catches errors

4. **User Management:**
   - ✅ Can view all users
   - ✅ Can change user roles
   - ✅ Search and filtering work
   - ✅ Cannot change own role

5. **Dashboard:**
   - ✅ Statistics display correctly
   - ✅ Recent activity shows
   - ✅ No errors in console
   - ✅ Page loads quickly

6. **UI/UX:**
   - ✅ All pages are responsive
   - ✅ Forms validate input
   - ✅ Loading states show
   - ✅ Success/error messages display
   - ✅ Navigation works smoothly

---

## 📊 Test Results Template

Use this template to track your testing:

```
Admin Panel Testing - [Date]
============================

✅ PASSED | ❌ FAILED | ⚠️  PARTIAL

Dashboard:
[ ] Statistics load correctly
[ ] Recent activity displays
[ ] No console errors

Questions:
[ ] Add question works
[ ] Edit question works
[ ] Delete question works
[ ] Search functionality works

Subjects/Topics:
[ ] Add subject works
[ ] Add topic works
[ ] Edit works
[ ] Delete works with warnings

Users:
[ ] User list displays
[ ] Search works
[ ] Role toggle works
[ ] Self-protection active

Import:
[ ] JSON import works
[ ] CSV import works
[ ] Templates download
[ ] Validation works

Settings:
[ ] Form inputs work
[ ] Save functionality works
[ ] Toggles work correctly

Overall Status: [PASS/FAIL]
Notes: [Any issues or observations]
```

---

## 🎓 Next Steps After Testing

Once all tests pass:

1. **Add Sample Data:**
   - Create 3-5 subjects
   - Add 5-10 topics per subject
   - Add 20-50 questions
   - Test the quiz-taking experience

2. **Security Check:**
   - Try accessing `/admin` without being admin
   - Verify API endpoints reject non-admin users
   - Test with multiple user accounts

3. **Performance:**
   - Add 100+ questions
   - Test search performance
   - Check dashboard load time
   - Monitor database query performance

4. **Documentation:**
   - Document any custom processes
   - Create admin user guide
   - Note any configuration changes

5. **Ready for Production:**
   - All tests pass ✅
   - Sample data added ✅
   - Security verified ✅
   - Performance acceptable ✅

---

**Happy Testing! 🚀**

If you encounter any issues, check the console, verify your setup, and use the troubleshooting section above.

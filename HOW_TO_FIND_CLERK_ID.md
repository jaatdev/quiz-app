# 🔍 How to Find Your Clerk User ID

## Method 1: Visit /user-info Page (Easiest)
Go to: http://localhost:3001/user-info

The page will show all your info and give you a ready-to-copy command!

---

## Method 2: Browser Console

1. While signed in to your app, press **F12** to open Developer Tools
2. Click the **Console** tab
3. Paste this command and press Enter:

```javascript
console.log('Clerk ID:', window.Clerk?.user?.id);
console.log('Email:', window.Clerk?.user?.primaryEmailAddress?.emailAddress);
console.log('Name:', window.Clerk?.user?.fullName);
```

4. Copy the Clerk ID (starts with `user_`)

---

## Method 3: Network Tab

1. Press **F12** → **Network** tab
2. Refresh the page
3. Look for requests to Clerk API
4. Check the response - you'll see your user ID

---

**Once you have your Clerk ID, come back and I'll give you the exact command to run!**

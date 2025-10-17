# 🎴 Auth Guards Quick Reference Card

## 🚀 3-Step Setup

### Step 1: Protect Your Page
```tsx
'use client';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function MyPage() {
  return (
    <ProtectedRoute>
      {/* Your content */}
    </ProtectedRoute>
  );
}
```

### Step 2: Test
- Sign out → See lock icons ✓
- Click protected link → See modal ✓
- Click login → See redirect ✓

### Step 3: Done! ✅

---

## 📚 Core APIs

### `useAuth()` - Get Auth State
```tsx
import { useAuth } from '@/lib/hooks/useAuth';

const { 
  isSignedIn,      // boolean - is user logged in?
  isLoaded,        // boolean - is auth loaded?
  user,            // Clerk user object
  userId,          // string - user ID
  displayName,     // string - user's name
  signOut,         // function - sign out
} = useAuth();
```

### `<ProtectedRoute>` - Protect Pages
```tsx
import { ProtectedRoute } from '@/components/ProtectedRoute';

<ProtectedRoute>
  {/* Only shown to authenticated users */}
</ProtectedRoute>
```

### `<AdminRoute>` - Admin-Only Pages
```tsx
import { AdminRoute } from '@/components/ProtectedRoute';

<AdminRoute>
  {/* Only shown to admin users */}
</AdminRoute>
```

### `useAuthPrompt()` - Protect Features
```tsx
import { useAuthPrompt } from '@/lib/hooks/useAuthPrompt';
import { AuthModal } from '@/components/AuthModal';

const { requireAuth, modalState } = useAuthPrompt();

const handleClick = () => {
  if (requireAuth({ message: 'Sign in to do this!' })) {
    // User is authenticated - proceed
  }
};

return (
  <>
    <button onClick={handleClick}>Click Me</button>
    <AuthModal {...modalState} />
  </>
);
```

### `<AuthModal>` - Login Prompt
```tsx
import { AuthModal } from '@/components/AuthModal';

<AuthModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  title="Login Required"
  message="Please sign in to continue"
  feature="this feature"
/>
```

---

## 📁 Files You Need to Know

### New Files (Use These!)
```
lib/hooks/useAuth.ts           → Get auth state
lib/hooks/useAuthPrompt.ts     → Guard features
components/ProtectedRoute.tsx  → Wrap pages
components/AuthModal.tsx       → Show login modal
components/LoadingSpinner.tsx  → Loading state
```

### Updated Files
```
middleware.ts                → Route protection
components/layout/SiteHeader.tsx → Lock icons
```

### Documentation
```
README_AUTH_GUARDS.md       → Start here
QUICK_AUTH_SETUP.md        → Integration guide
COPY_PASTE_EXAMPLES.md     → Ready-to-use code
ARCHITECTURE.md            → How it works
QUICK_TEST.md             → Testing guide
```

---

## 🔐 Protection Levels

### Level 1: Protect Entire Page
```tsx
<ProtectedRoute>
  <YourPage />
</ProtectedRoute>
```
✅ Best for: Whole pages that need auth

### Level 2: Protect Admin Page
```tsx
<AdminRoute>
  <AdminPanel />
</AdminRoute>
```
✅ Best for: Admin-only functionality

### Level 3: Protect Individual Features
```tsx
const { requireAuth, modalState } = useAuthPrompt();

const handleAction = () => {
  if (requireAuth()) {
    // do something
  }
};
```
✅ Best for: Specific buttons or actions

---

## 🎨 Visual Indicators

### Lock Icons (SiteHeader)
```
NOT Logged In:
├─ 🔒 History
├─ 🔒 Leaderboard
├─ 🔒 Stats
└─ Login [Button]

Logged In:
├─ History ✓
├─ Leaderboard ✓
├─ Stats ✓
└─ Welcome, John!
```

### Auth Modal
```
┌─────────────────────────────┐
│  🔒 Lock Icon               │
│                             │
│ Authentication Required     │
│ Please sign in to access    │
│                             │
│ [Login] [Create Account]    │
│                             │
│ 🎯 Join to track progress   │
└─────────────────────────────┘
```

---

## ⚡ Quick Examples

### Example 1: Get User Name
```tsx
const { displayName } = useAuth();
return <div>Hello, {displayName}!</div>;
```

### Example 2: Conditional Rendering
```tsx
const { isSignedIn } = useAuth();
return isSignedIn ? <Content /> : <SignIn />;
```

### Example 3: Protect Button
```tsx
const { requireAuth, modalState } = useAuthPrompt();

return (
  <>
    <button onClick={() => {
      if (requireAuth()) startQuiz();
    }}>
      Start Quiz
    </button>
    <AuthModal {...modalState} />
  </>
);
```

### Example 4: Get User Email
```tsx
const { user } = useAuth();
const email = user?.primaryEmailAddress?.emailAddress;
return <p>Email: {email}</p>;
```

### Example 5: Logout
```tsx
const { signOut } = useAuth();
return <button onClick={() => signOut()}>Logout</button>;
```

---

## 🚨 Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| Lock icons not showing | Check `useAuth()` is in SiteHeader |
| Modal not appearing | Add `<AuthModal {...modalState} />` |
| Won't redirect after login | Check middleware.ts route patterns |
| User data undefined | Wait for `isLoaded` to be true |
| Component error | Add `'use client'` directive |

---

## 📋 Pages to Update

```
app/
  history/page.tsx          → Add <ProtectedRoute>
  leaderboard/page.tsx      → Add <ProtectedRoute>
  stats/page.tsx           → Add <ProtectedRoute>
  quiz/page.tsx            → Add <ProtectedRoute>
  admin/page.tsx           → Add <AdminRoute>
  user-info/page.tsx       → Add <ProtectedRoute>
```

Each takes 2 minutes! ⚡

---

## 🧪 Quick Test

```
1. Sign out
2. See lock icons ✓
3. Click protected link
4. See modal ✓
5. Click login
6. See redirect ✓
7. Sign in
8. Lock icons gone ✓
9. All links work ✓
```

Done! ✅

---

## 📚 Documentation Map

```
WHERE TO GO FOR WHAT?

Need overview?
  → README_AUTH_GUARDS.md

Need to integrate?
  → QUICK_AUTH_SETUP.md

Need code examples?
  → COPY_PASTE_EXAMPLES.md

Need to understand system?
  → ARCHITECTURE.md

Need to test?
  → QUICK_TEST.md

Need complete reference?
  → AUTH_GUARDS_IMPLEMENTATION.md

Need implementation checklist?
  → IMPLEMENTATION_CHECKLIST.md
```

---

## 💾 Copy These Code Snippets

### Protect Page
```tsx
'use client';
import { ProtectedRoute } from '@/components/ProtectedRoute';
export default function Page() {
  return <ProtectedRoute><YourContent /></ProtectedRoute>;
}
```

### Protect Feature
```tsx
'use client';
import { useAuthPrompt } from '@/lib/hooks/useAuthPrompt';
import { AuthModal } from '@/components/AuthModal';
export default function Component() {
  const { requireAuth, modalState } = useAuthPrompt();
  const handleClick = () => requireAuth() && doSomething();
  return (
    <>
      <button onClick={handleClick}>Action</button>
      <AuthModal {...modalState} />
    </>
  );
}
```

### Get User
```tsx
'use client';
import { useAuth } from '@/lib/hooks/useAuth';
export default function Component() {
  const { user, displayName, isSignedIn } = useAuth();
  return <div>{displayName}</div>;
}
```

---

## ✅ Checklist

- [ ] Read `README_AUTH_GUARDS.md`
- [ ] Update `/history` page
- [ ] Update `/leaderboard` page
- [ ] Update `/stats` page
- [ ] Update `/admin` page (use AdminRoute)
- [ ] Test with lock icons
- [ ] Test login redirect
- [ ] Done! 🎉

---

## 🎯 That's It!

You now have everything you need. Print this card, follow the setup, and you're done! 🚀

**Questions?** → Check the documentation files
**Code examples?** → Check `COPY_PASTE_EXAMPLES.md`
**Issues?** → Check `QUICK_TEST.md` troubleshooting

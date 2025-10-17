# 🔒 Authentication Guards Implementation - Next.js + Clerk

## Overview

This implementation provides a comprehensive authentication system for your Next.js quiz app using Clerk. It includes protected routes, auth modals, and client-side guards.

---

## 🎯 Components Created

### 1. **useAuth Hook** (`lib/hooks/useAuth.ts`)
Custom hook wrapping Clerk's authentication state.

```tsx
import { useAuth } from '@/lib/hooks/useAuth';

function MyComponent() {
  const { isSignedIn, isLoaded, user, displayName } = useAuth();
  
  if (!isLoaded) return <LoadingSpinner />;
  
  return <div>Welcome, {displayName}!</div>;
}
```

**Available Properties:**
- `userId` - Unique user ID from Clerk
- `isLoaded` - Whether auth state is initialized
- `isSignedIn` - Whether user is authenticated
- `user` - Full Clerk user object
- `signOut` - Function to sign out user
- `isAuthenticated` - Alias for isSignedIn
- `displayName` - User's display name

---

### 2. **ProtectedRoute Component** (`components/ProtectedRoute.tsx`)
Wrapper component for protecting routes at the component level.

```tsx
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function MyPage() {
  return (
    <ProtectedRoute>
      <div>This content is only visible to authenticated users</div>
    </ProtectedRoute>
  );
}
```

**Also includes:**
- `AdminRoute` - For admin-only pages (checks `user.unsafeMetadata.role === 'admin'`)
- Loading spinner while auth state is being checked
- Automatic redirect to `/sign-in` if not authenticated

---

### 3. **AuthModal Component** (`components/AuthModal.tsx`)
Beautiful, animated modal for prompting users to log in.

```tsx
import { AuthModal } from '@/components/AuthModal';
import { useState } from 'react';

function MyComponent() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button onClick={() => setShowModal(true)}>
        Try Protected Feature
      </button>
      
      <AuthModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Authentication Required"
        message="Please login to access this feature"
        feature="this feature"
      />
    </>
  );
}
```

**Features:**
- Smooth animations with Framer Motion
- Beautiful gradient UI
- Login and Sign Up buttons
- Close button and backdrop click to dismiss

---

### 4. **useAuthPrompt Hook** (`lib/hooks/useAuthPrompt.ts`)
Easy integration of auth prompts in components.

```tsx
import { useAuthPrompt } from '@/lib/hooks/useAuthPrompt';

function FeatureButton() {
  const { requireAuth, modalState } = useAuthPrompt();

  const handleClick = () => {
    if (requireAuth({ message: 'Login to use this feature' })) {
      // User is authenticated - proceed
      doSomething();
    }
  };

  return (
    <>
      <button onClick={handleClick}>Use Feature</button>
      <AuthModal {...modalState} />
    </>
  );
}
```

---

### 5. **LoadingSpinner Component** (`components/LoadingSpinner.tsx`)
Animated loading spinner for auth state checks.

```tsx
import { LoadingSpinner } from '@/components/LoadingSpinner';

function MyComponent() {
  const { isLoaded } = useAuth();
  
  return isLoaded ? <div>Content</div> : <LoadingSpinner />;
}
```

---

## 🛣️ Route Protection

### Server-Side (Middleware)
Middleware protects routes at the request level:

**Public Routes** (Anyone can access):
- `/` - Home
- `/sign-in` - Login page
- `/sign-up` - Signup page
- `/welcome` - Welcome page
- `/api/*` - API endpoints

**Protected Routes** (Require authentication):
- `/dashboard/*` - Dashboard
- `/quiz/*` - Quiz pages
- `/my-history/*` - Quiz history
- `/user-info/*` - User profile

**Admin Routes** (Require authentication + admin role):
- `/admin/*` - Admin panel

### Client-Side (Components)
For component-level protection:

```tsx
// Protect entire page
<ProtectedRoute>
  <YourPageContent />
</ProtectedRoute>

// Protect specific features
const { requireAuth, modalState } = useAuthPrompt();
if (requireAuth()) {
  // Proceed with feature
}
```

---

## 📱 Navigation Guards

The `SiteHeader` component shows lock icons for protected routes:

```tsx
// Protected routes show a lock icon when not authenticated
// Clicking them opens the auth modal
```

**Features:**
- Lock icons indicate protected routes
- Clicking protected links shows auth modal
- Links disabled for unauthenticated users
- Automatic loading state while checking auth

---

## 🎨 Usage Examples

### Example 1: Protect a Page with ProtectedRoute

**`app/dashboard/page.tsx`:**
```tsx
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <div className="p-8">
        <h1>Your Dashboard</h1>
        {/* Dashboard content */}
      </div>
    </ProtectedRoute>
  );
}
```

### Example 2: Show Auth Modal for Features

**`app/quiz/page.tsx`:**
```tsx
'use client';

import { useAuthPrompt } from '@/lib/hooks/useAuthPrompt';
import { AuthModal } from '@/components/AuthModal';

export default function QuizPage() {
  const { requireAuth, modalState } = useAuthPrompt();

  const handleStartQuiz = () => {
    if (!requireAuth({ 
      message: 'Sign in to start quizzes and track your progress!' 
    })) {
      return;
    }
    
    // Start quiz
    console.log('Quiz started!');
  };

  return (
    <>
      <button onClick={handleStartQuiz}>
        Start Quiz
      </button>
      <AuthModal {...modalState} />
    </>
  );
}
```

### Example 3: Admin-Only Page

**`app/admin/page.tsx`:**
```tsx
import { AdminRoute } from '@/components/ProtectedRoute';

export default function AdminPage() {
  return (
    <AdminRoute>
      <div className="p-8">
        <h1>Admin Panel</h1>
        {/* Admin content */}
      </div>
    </AdminRoute>
  );
}
```

### Example 4: Get Current User Info

**`app/user-profile/page.tsx`:**
```tsx
'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function ProfilePage() {
  const { user, displayName } = useAuth();

  return (
    <ProtectedRoute>
      <div className="p-8">
        <h1>Profile - {displayName}</h1>
        <p>Email: {user?.primaryEmailAddress?.emailAddress}</p>
      </div>
    </ProtectedRoute>
  );
}
```

---

## ✅ Testing Checklist

- [ ] Non-logged-in users see lock icons on protected nav links
- [ ] Clicking protected links shows auth modal
- [ ] Auth modal has working Login and Sign Up buttons
- [ ] Protected routes redirect to `/sign-in` when accessed directly
- [ ] After login, all features become accessible
- [ ] Logout clears all auth state
- [ ] Auth state persists on page refresh
- [ ] Loading spinner shows while checking auth
- [ ] Admin routes only accessible to admin users
- [ ] Redirect URL works after sign-in

---

## 🔧 Customization

### Change Protected Routes
Edit `middleware.ts`:
```ts
const isProtectedRoute = createRouteMatcher([
  '/your-protected-route(.*)',
  '/another-route(.*)',
]);
```

### Customize Auth Modal
Pass different props to `AuthModal`:
```tsx
<AuthModal
  isOpen={showModal}
  onClose={onClose}
  title="Custom Title"
  message="Custom message"
  feature="feature name"
/>
```

### Add Custom Auth Logic
The `useAuth()` hook provides direct access to Clerk:
```tsx
const { user, signOut } = useAuth();

// Access custom metadata
const userRole = user?.unsafeMetadata?.role;
```

---

## 📚 File Structure

```
lib/
  hooks/
    useAuth.ts              # Main auth hook
    useAuthPrompt.ts        # Auth modal hook

components/
  ProtectedRoute.tsx        # Protected/Admin route components
  AuthModal.tsx             # Auth modal component
  LoadingSpinner.tsx        # Loading spinner
  ProtectedPageLayout.tsx   # Page layout wrapper
  quiz/
    QuizStartButton.tsx     # Example: protected button
  layout/
    SiteHeader.tsx          # Updated navbar with auth guards

middleware.ts              # Route protection middleware
```

---

## 🚀 Next Steps

1. **Update your pages** to use `ProtectedRoute` or `useAuthPrompt`
2. **Test all protected routes** with the testing checklist
3. **Customize auth modal** styling to match your design
4. **Add role-based access** using `user.unsafeMetadata.role`
5. **Track user actions** in Clerk dashboard

---

## 🆘 Troubleshooting

**Modal not showing?**
- Ensure `<AuthModal {...modalState} />` is rendered
- Check that component is marked with `'use client'`

**Routes not protected?**
- Verify route matches in `middleware.ts`
- Check that page is wrapped with `<ProtectedRoute>`

**User not loading?**
- Wait for `isLoaded` to be true before using `user`
- Check Clerk is properly configured in `layout.tsx`

---

## 📖 References

- [Clerk Next.js Docs](https://clerk.com/docs/nextjs)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [Framer Motion](https://www.framer.com/motion)

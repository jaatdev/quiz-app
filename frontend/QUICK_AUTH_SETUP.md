# Quick Implementation Guide

## How to Apply Auth Guards to Your Existing Pages

### Option 1: Protect Entire Page with ProtectedRoute

**Before:**
```tsx
// app/dashboard/page.tsx
export default function DashboardPage() {
  return <div>Dashboard</div>;
}
```

**After:**
```tsx
// app/dashboard/page.tsx
'use client';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <div>Dashboard</div>
    </ProtectedRoute>
  );
}
```

---

### Option 2: Protect Specific Button/Feature

**Before:**
```tsx
export default function QuizPage() {
  const handleStart = () => {
    // Start quiz
  };

  return <button onClick={handleStart}>Start Quiz</button>;
}
```

**After:**
```tsx
'use client';
import { useAuthPrompt } from '@/lib/hooks/useAuthPrompt';
import { AuthModal } from '@/components/AuthModal';

export default function QuizPage() {
  const { requireAuth, modalState } = useAuthPrompt();

  const handleStart = () => {
    if (!requireAuth({ message: 'Sign in to start quizzes!' })) {
      return; // Not authenticated
    }
    // Start quiz
  };

  return (
    <>
      <button onClick={handleStart}>Start Quiz</button>
      <AuthModal {...modalState} />
    </>
  );
}
```

---

### Option 3: Display User Info

**Before:**
```tsx
export default function ProfilePage() {
  return <div>Profile</div>;
}
```

**After:**
```tsx
'use client';
import { useAuth } from '@/lib/hooks/useAuth';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function ProfilePage() {
  const { user, displayName } = useAuth();

  return (
    <ProtectedRoute>
      <div>
        <h1>Welcome, {displayName}!</h1>
        <p>Email: {user?.primaryEmailAddress?.emailAddress}</p>
      </div>
    </ProtectedRoute>
  );
}
```

---

## Files to Update

### 1. History Page (`app/history/page.tsx`)
```tsx
'use client';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function HistoryPage() {
  return (
    <ProtectedRoute>
      {/* Your existing history content */}
    </ProtectedRoute>
  );
}
```

### 2. Leaderboard Page (`app/leaderboard/page.tsx`)
```tsx
'use client';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function LeaderboardPage() {
  return (
    <ProtectedRoute>
      {/* Your existing leaderboard content */}
    </ProtectedRoute>
  );
}
```

### 3. Stats Page (`app/stats/page.tsx`)
```tsx
'use client';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function StatsPage() {
  return (
    <ProtectedRoute>
      {/* Your existing stats content */}
    </ProtectedRoute>
  );
}
```

### 4. Admin Page (`app/admin/page.tsx`)
```tsx
import { AdminRoute } from '@/components/ProtectedRoute';

export default function AdminPage() {
  return (
    <AdminRoute>
      {/* Your existing admin content */}
    </AdminRoute>
  );
}
```

---

## Summary of Files Created

✅ `lib/hooks/useAuth.ts` - Main auth hook
✅ `lib/hooks/useAuthPrompt.ts` - Auth prompt hook
✅ `components/ProtectedRoute.tsx` - Protected route components
✅ `components/AuthModal.tsx` - Auth modal
✅ `components/LoadingSpinner.tsx` - Loading spinner
✅ `components/ProtectedPageLayout.tsx` - Page layout wrapper
✅ `components/quiz/QuizStartButton.tsx` - Example protected button
✅ `middleware.ts` - Updated with new route patterns
✅ `components/layout/SiteHeader.tsx` - Updated navbar with guards
✅ `AUTH_GUARDS_IMPLEMENTATION.md` - Full documentation

---

## Next: Update Your Pages

Go through your existing pages and apply one of the three options above.

Start with:
1. `/history` - Add ProtectedRoute
2. `/leaderboard` - Add ProtectedRoute  
3. `/stats` - Add ProtectedRoute
4. `/dashboard` (if exists) - Add ProtectedRoute
5. `/admin` - Add AdminRoute
6. Individual buttons that need auth - Use useAuthPrompt

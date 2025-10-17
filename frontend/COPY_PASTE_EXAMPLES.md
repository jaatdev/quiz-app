# Copy-Paste Ready Auth Guard Examples

These are ready-to-use code snippets for your pages. Just copy and paste!

---

## 1. Protected History Page

**File:** `app/history/page.tsx`

```tsx
'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/lib/hooks/useAuth';

export default function HistoryPage() {
  const { user, displayName } = useAuth();

  return (
    <ProtectedRoute>
      <div className="container mx-auto py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Quiz History
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Welcome back, {displayName}! Here's your quiz history.
          </p>
        </div>

        {/* Your existing history content */}
        {/* Replace below with your actual history component */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <p className="text-gray-600 dark:text-gray-300">
            Your quiz history will appear here...
          </p>
        </div>
      </div>
    </ProtectedRoute>
  );
}
```

---

## 2. Protected Leaderboard Page

**File:** `app/leaderboard/page.tsx`

```tsx
'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/lib/hooks/useAuth';

export default function LeaderboardPage() {
  const { user } = useAuth();

  return (
    <ProtectedRoute>
      <div className="container mx-auto py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            🏆 Leaderboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            See how you rank against other users
          </p>
        </div>

        {/* Your existing leaderboard content */}
        {/* Replace below with your actual leaderboard component */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <p className="text-gray-600 dark:text-gray-300">
            Leaderboard rankings will appear here...
          </p>
        </div>
      </div>
    </ProtectedRoute>
  );
}
```

---

## 3. Protected Stats Page

**File:** `app/stats/page.tsx`

```tsx
'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/lib/hooks/useAuth';

export default function StatsPage() {
  const { user, displayName } = useAuth();

  return (
    <ProtectedRoute>
      <div className="container mx-auto py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            📊 Your Statistics
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track your progress and performance
          </p>
        </div>

        {/* Your existing stats content */}
        {/* Replace below with your actual stats component */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <p className="text-gray-600 dark:text-gray-300">
            Your statistics will appear here...
          </p>
        </div>
      </div>
    </ProtectedRoute>
  );
}
```

---

## 4. Protected Quiz Page with Button Guard

**File:** `app/quiz/page.tsx`

```tsx
'use client';

import { useState } from 'react';
import { useAuthPrompt } from '@/lib/hooks/useAuthPrompt';
import { AuthModal } from '@/components/AuthModal';
import { Button } from '@/components/ui/button';

export default function QuizPage() {
  const { requireAuth, modalState } = useAuthPrompt();
  const [quizStarted, setQuizStarted] = useState(false);

  const handleStartQuiz = () => {
    if (requireAuth({ 
      message: 'Sign in to start taking quizzes and track your progress!' 
    })) {
      // User is authenticated
      setQuizStarted(true);
      // Your quiz logic here
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          📝 Quiz Challenge
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Test your knowledge and improve your skills
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
        {!quizStarted ? (
          <>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Ready to test your knowledge?
            </p>
            <Button
              onClick={handleStartQuiz}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-lg transition-all"
              size="lg"
            >
              Start Quiz
            </Button>
          </>
        ) : (
          <>
            <p className="text-gray-600 dark:text-gray-300">
              Quiz in progress...
            </p>
            {/* Your quiz component here */}
          </>
        )}
      </div>

      <AuthModal {...modalState} />
    </div>
  );
}
```

---

## 5. Admin-Only Page

**File:** `app/admin/page.tsx`

```tsx
'use client';

import { AdminRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/lib/hooks/useAuth';

export default function AdminPage() {
  const { user, displayName } = useAuth();

  return (
    <AdminRoute>
      <div className="container mx-auto py-8">
        <div className="mb-6 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg p-6 text-white">
          <h1 className="text-3xl font-bold mb-2">👑 Admin Panel</h1>
          <p>Welcome, {displayName}! Only admins can access this page.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="font-bold text-lg mb-2">Users</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Manage users and roles
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="font-bold text-lg mb-2">Analytics</h3>
            <p className="text-gray-600 dark:text-gray-400">
              View app statistics
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="font-bold text-lg mb-2">Settings</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Configure app settings
            </p>
          </div>
        </div>

        {/* Your admin content here */}
      </div>
    </AdminRoute>
  );
}
```

---

## 6. User Profile Page

**File:** `app/user-info/page.tsx`

```tsx
'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/lib/hooks/useAuth';

export default function UserInfoPage() {
  const { user, displayName } = useAuth();

  return (
    <ProtectedRoute>
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
          👤 Your Profile
        </h1>

        <div className="max-w-2xl">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {displayName}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {user?.primaryEmailAddress?.emailAddress}
              </p>
            </div>

            <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-6">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  First Name
                </label>
                <p className="mt-1 text-gray-900 dark:text-white">
                  {user?.firstName || 'Not set'}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Last Name
                </label>
                <p className="mt-1 text-gray-900 dark:text-white">
                  {user?.lastName || 'Not set'}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email
                </label>
                <p className="mt-1 text-gray-900 dark:text-white">
                  {user?.primaryEmailAddress?.emailAddress}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Member Since
                </label>
                <p className="mt-1 text-gray-900 dark:text-white">
                  {user?.createdAt 
                    ? new Date(user.createdAt).toLocaleDateString() 
                    : 'Unknown'}
                </p>
              </div>
            </div>
          </div>

          {/* Additional profile sections */}
          <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              ℹ️ To edit your profile, visit your Clerk account settings.
            </p>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
```

---

## 7. Protected Component (Reusable)

**File:** `components/common/ProtectedAction.tsx`

```tsx
'use client';

import { ReactNode } from 'react';
import { useAuthPrompt } from '@/lib/hooks/useAuthPrompt';
import { AuthModal } from '@/components/AuthModal';

interface ProtectedActionProps {
  children: ReactNode;
  message?: string;
  feature?: string;
}

export function ProtectedAction({ 
  children, 
  message = 'You need to be logged in for this action',
  feature = 'this action'
}: ProtectedActionProps) {
  const { requireAuth, modalState } = useAuthPrompt();

  const handleClick = (e: React.MouseEvent) => {
    if (!requireAuth({ message, feature })) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <>
      <div onClick={handleClick}>
        {children}
      </div>
      <AuthModal {...modalState} />
    </>
  );
}
```

**Usage:**
```tsx
<ProtectedAction message="Sign in to submit your answer">
  <button onClick={submitAnswer}>Submit Answer</button>
</ProtectedAction>
```

---

## 8. Conditional Content Based on Auth

**File:** `components/common/ConditionalContent.tsx`

```tsx
'use client';

import { ReactNode } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';

interface ConditionalContentProps {
  authenticated: ReactNode;
  notAuthenticated: ReactNode;
}

export function ConditionalContent({ 
  authenticated, 
  notAuthenticated 
}: ConditionalContentProps) {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) return null;

  return isSignedIn ? authenticated : notAuthenticated;
}
```

**Usage:**
```tsx
<ConditionalContent
  authenticated={<div>Welcome back!</div>}
  notAuthenticated={<div>Please sign in</div>}
/>
```

---

## Quick Integration Steps

1. **Pick the file** you want to update from above
2. **Copy the code** from the relevant example
3. **Replace your existing code** or merge with existing logic
4. **Test by signing out** and verifying protection works

---

## ✅ All Examples Include

- ✨ Dark mode support
- 📱 Responsive design
- 🔐 Proper auth guards
- 💅 Tailwind styling
- 🎯 Proper TypeScript types
- 📚 Clear comments

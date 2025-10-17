# 🏗️ Authentication Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        User Browser                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                      Next.js Frontend                        │   │
│  │                                                              │   │
│  │  ┌────────────────────────────────────────────────────────┐ │   │
│  │  │            Components Layer                           │ │   │
│  │  ├────────────────────────────────────────────────────────┤ │   │
│  │  │ ProtectedRoute                useAuthPrompt Hook      │ │   │
│  │  │ ├─ Wraps pages          ├─ Protects features        │ │   │
│  │  │ ├─ Checks auth state    ├─ Shows auth modal         │ │   │
│  │  │ ├─ Shows loading        ├─ Returns boolean          │ │   │
│  │  │ └─ Redirects if needed  └─ Easy integration         │ │   │
│  │  │                                                       │ │   │
│  │  │ AuthModal               SiteHeader                  │ │   │
│  │  │ ├─ Beautiful UI         ├─ Lock icons visible      │ │   │
│  │  │ ├─ Animations           ├─ Protected links        │ │   │
│  │  │ ├─ Login/Signup         ├─ Auth guard checks      │ │   │
│  │  │ └─ Close options        └─ Responsive nav         │ │   │
│  │  └────────────────────────────────────────────────────────┘ │   │
│  │                                                              │   │
│  │  ┌────────────────────────────────────────────────────────┐ │   │
│  │  │            Hooks Layer                               │ │   │
│  │  ├────────────────────────────────────────────────────────┤ │   │
│  │  │ useAuth Hook (Clerk Integration)                     │ │   │
│  │  │ ├─ userId          ├─ user data                    │ │   │
│  │  │ ├─ isSignedIn      ├─ displayName                  │ │   │
│  │  │ ├─ isLoaded        └─ signOut function             │ │   │
│  │  └────────────────────────────────────────────────────────┘ │   │
│  │                                                              │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
                               ⬇
                         HTTP Request
                               ⬇
┌─────────────────────────────────────────────────────────────────────┐
│                      Next.js Server                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │           Middleware Layer (middleware.ts)                 │   │
│  │                                                              │   │
│  │  Check every request:                                       │   │
│  │  1. Is this a public route? ✓ Allow                        │   │
│  │  2. Is user authenticated? ✓ Allow / ✗ Redirect           │   │
│  │  3. Is this an admin route? (Check metadata) ✓ Allow       │   │
│  │                                                              │   │
│  │  Public Routes:         Protected Routes:    Admin Routes:  │   │
│  │  ├─ /                   ├─ /dashboard        ├─ /admin     │   │
│  │  ├─ /sign-in           ├─ /quiz             └─ ✓ Role OK   │   │
│  │  ├─ /sign-up           ├─ /my-history                     │   │
│  │  └─ /api/*             └─ /user-info                      │   │
│  │                                                              │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│                      Clerk Verification                             │
│                      (via SDK)                                      │
│                          ⬇                                          │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │         Generate Response with Auth State                   │   │
│  │         (Return to client)                                  │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
                               ⬇
                         HTTP Response
                               ⬇
         Client receives auth status and renders accordingly
```

---

## Request Flow

### 1️⃣ Unauthenticated User Clicks Protected Link

```
User → Click "History" link
         ↓
    Check Navbar
    (SiteHeader.tsx)
         ↓
    Is user signed in?
    [useAuth hook]
         ↓
         NO ↓
    Show lock icon ❌
    Disable link 🔒
    (Visual indicator)
         ↓
    User clicks anyway
         ↓
    handleProtectedClick
    called
         ↓
    Prevent default ✋
    Show AuthModal 📱
         ↓
    User clicks "Login"
         ↓
    Redirect to /sign-in
    with redirect_url
    parameter
```

### 2️⃣ Authenticated User Clicks Protected Link

```
User → Click "History" link
         ↓
    Check Navbar
    (SiteHeader.tsx)
         ↓
    Is user signed in?
    [useAuth hook]
         ↓
         YES ↓
    No lock icon ✓
    Link enabled ✓
         ↓
    User clicks link
         ↓
    Navigation allowed
    (normal link behavior)
         ↓
    Route loads
    (middleware allows)
         ↓
    Component renders
    (ProtectedRoute
     checks pass)
```

### 3️⃣ Direct URL Access (Unauthenticated)

```
User → Manually enters
       /history in URL
         ↓
    Browser makes
    request to server
         ↓
    Middleware runs
    (middleware.ts)
         ↓
    Check route pattern
    Is /history protected?
         ↓
         YES ↓
    Is user authenticated?
    [Clerk verification]
         ↓
         NO ↓
    Redirect to /sign-in
    with redirect_url
         ↓
    After login:
    Redirects back to
    /history (original
    URL they wanted)
```

### 4️⃣ Direct URL Access (Authenticated)

```
User → Manually enters
       /history in URL
         ↓
    Browser makes
    request to server
         ↓
    Middleware runs
         ↓
    Check route pattern
    Is /history protected?
         ↓
         YES ↓
    Is user authenticated?
    [Clerk verification]
         ↓
         YES ✓
    Allow request
    (NextResponse.next())
         ↓
    Page loads normally
         ↓
    Component checks:
    ProtectedRoute
    component also
    verifies auth
         ↓
    All checks pass ✓
    Content renders
```

---

## Feature Protection Flow

```
User wants to START QUIZ
        ↓
Click "Start Quiz" button
        ↓
handleStartQuiz()
called
        ↓
requireAuth({ message })
called
        ↓
Check: isSignedIn?
[useAuth hook]
        ↓
    ┌─────────────────┬──────────────────┐
    ↓                 ↓
NO (false)            YES (true)
    ↓                 ↓
Return false      Return true
    ↓                 ↓
Show AuthModal    Proceed with
📱 (prompt user)  quiz logic
    ↓                 ✓
User clicks       Quiz starts
"Login"           🎯
    ↓
Redirect to
/sign-in
    ↓
After sign-in:
Comes back and
can start quiz
```

---

## Authentication State Management

```
Clerk Servers (External)
    ↑        ↓
    │        │ (JWT token stored in secure cookie)
    │        │
    └────────┤
             ↓
        Browser
    (Secure Cookie)
             ↓
    ┌────────────────────┐
    │  Next.js Server    │
    │  Middleware Runs   │
    │  (verifies token)  │
    └────────────────────┘
             ↓
    ┌────────────────────┐
    │  Frontend Code     │
    │  useAuth Hook      │
    │  (reads auth state)│
    └────────────────────┘
             ↓
    Components make
    decisions based
    on auth status
```

---

## Security Layers

### Layer 1: Server-Side (Middleware)
```
Request comes in
         ↓
middleware.ts runs
         ↓
Verify JWT token with Clerk
         ↓
Check route patterns:
├─ Public? → Allow
├─ Protected + Auth? → Allow
├─ Protected + No Auth? → Redirect
├─ Admin + Auth + Role? → Allow
└─ Other combinations? → Redirect
         ↓
Send response to client
```

### Layer 2: Client-Side (Components)
```
Component mounts
         ↓
useAuth() checks token
(again on client)
         ↓
isSignedIn set
         ↓
ProtectedRoute wrapper
checks isSignedIn
         ↓
├─ Not signed? → Show spinner → Redirect
└─ Signed? → Render children
```

### Layer 3: UI Layer (Visual)
```
SiteHeader renders
         ↓
For each nav link:
├─ Is protected?
├─ Is user signed in?
└─ Show lock icon if not signed
         ↓
Lock icon = visual indicator
"you can't click this"
         ↓
Clicking triggers
event handler that
shows auth modal
```

---

## Files Involved in Each Step

### Step 1: User Visits App
- `app/layout.tsx` - Initializes Clerk
- `components/layout/ClientShell.tsx` - Sets up layout
- `components/layout/SiteHeader.tsx` - Renders navbar

### Step 2: User Clicks Protected Link
- `components/layout/SiteHeader.tsx` - Detects click
- `lib/hooks/useAuth.ts` - Checks auth status
- `components/AuthModal.tsx` - Shows modal if needed

### Step 3: User Signs In
- `app/sign-in` - Clerk sign-in page
- Redirect with `redirect_url` parameter

### Step 4: Protected Page Loads
- `middleware.ts` - Validates on server
- `components/ProtectedRoute.tsx` - Validates on client
- `lib/hooks/useAuth.ts` - Provides auth state
- Your page component - Renders if auth passes

---

## Key Components & Their Roles

| Component | Role | Runs Where |
|-----------|------|-----------|
| `middleware.ts` | Check every request | Server |
| `useAuth()` | Get auth state | Client |
| `ProtectedRoute` | Wrap protected pages | Client |
| `AuthModal` | Prompt to login | Client |
| `useAuthPrompt()` | Guard features | Client |
| `SiteHeader` | Show lock icons | Client |
| Clerk SDK | Manage tokens | Server + Client |

---

## Testing the Flow

```
1. Sign Out ✓
   └─ All lock icons appear

2. Try clicking protected link
   └─ Auth modal shows

3. Click "Login"
   └─ Goes to sign-in

4. Sign In
   └─ Returns to original page

5. Lock icons disappear
   └─ All links work normally

6. Refresh page
   └─ Auth state persists

7. Try direct URL to protected route
   └─ Loads normally

8. Try URL without signing in
   └─ Redirects to sign-in
```

---

## Environment Requirements

```
Frontend:
✓ Next.js 15.5.4
✓ React 19.1.0
✓ Clerk Next.js SDK
✓ Framer Motion (for animations)
✓ Lucide React (for icons)

Backend:
✓ Clerk API Keys (in env variables)
✓ CLERK_SECRET_KEY
✓ NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
```

---

## Summary

Your auth system has **three layers**:

1. **Server-Side Protection** (middleware.ts)
   - First line of defense
   - Validates every request
   - Redirects before rendering

2. **Component-Level Protection** (ProtectedRoute, useAuthPrompt)
   - Client-side verification
   - Prevents flash of content
   - Shows loading states

3. **UI/UX Protection** (SiteHeader, AuthModal)
   - Visual indicators (lock icons)
   - Beautiful prompts (auth modal)
   - Smooth redirects

Together, these create a **secure, user-friendly authentication system**! 🎉

# 🎓 QuizMaster Pro

A modern, full-stack quiz application built with Next.js, Express, PostgreSQL, and Clerk authentication.

![Next.js](https://img.shields.io/badge/Next.js-15.5.4-black)
![React](https://img.shields.io/badge/React-19-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Prisma](https://img.shields.io/badge/Prisma-ORM-green)
![Clerk](https://img.shields.io/badge/Clerk-Auth-purple)

## ✨ Features

### 🎯 Core Features
- **Multiple Quiz Topics** - Wide range of subjects and topics
- **Difficulty Levels** - Easy, Medium, Hard, Expert with unlock system
- **Timed Quizzes** - 10-minute countdown timer per quiz
- **Instant Results** - Immediate feedback with detailed scoring
- **Review Mode** - Review all questions with correct answers

### 📊 Analytics & Progress
- **Statistics Dashboard** - Comprehensive performance metrics
- **Quiz History** - Complete record of all attempts with CRUD operations
- **Leaderboard** - Competitive rankings and scores
- **Progress Tracking** - Monitor improvement over time
- **Performance Charts** - Visual representation of results

### 🎨 User Experience
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Dark Mode Ready** - Prepared for theme switching
- **Loading States** - Smooth submission with visual feedback
- **Search & Filter** - Find topics quickly
- **Keyboard Navigation** - Arrow keys for question navigation
- **Swipe Gestures** - Mobile-friendly touch controls

### 🔐 Authentication (Phase 1)
- **Clerk Integration** - Secure authentication system
- **Email Sign-up** - Primary authentication method
- **Social Login** - Google, GitHub (optional)
- **User Profiles** - Avatar and user management
- **Protected Routes** - Secure user data (coming in Phase 2)

---

## 🚀 Tech Stack

### Frontend
- **Framework**: Next.js 15.5.4 (App Router, Turbopack)
- **Language**: TypeScript 5
- **UI Library**: React 19
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Authentication**: Clerk
- **Icons**: Lucide React
- **HTTP Client**: Axios

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **ORM**: Prisma
- **Database**: PostgreSQL (Neon)
- **Validation**: Zod
- **CORS**: Enabled for local development

### Development Tools
- **Package Manager**: npm
- **Version Control**: Git
- **Code Quality**: ESLint
- **Hot Reload**: Turbopack (frontend), nodemon (backend)

---

## 📦 Installation

### Prerequisites
- Node.js 18+ installed
- PostgreSQL database (or Neon account)
- Clerk account (for authentication)
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/jaatdev/quiz-app.git
cd quiz-app
```

### 2. Backend Setup

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
```

**Configure `backend/.env`:**
```env
DATABASE_URL="your-postgresql-connection-string"
PORT=5001
NODE_ENV=development
```

**Run Prisma migrations:**
```bash
npx prisma generate
npx prisma db push
npx prisma db seed
```

**Start backend server:**
```bash
npm run dev
```
Backend runs on: http://localhost:5001

### 3. Frontend Setup

```bash
# Navigate to frontend (from root)
cd frontend

# Install dependencies
npm install

# Create .env.local file
cp .env.local.example .env.local
```

**Configure `frontend/.env.local`:**
```env
NEXT_PUBLIC_API_URL=http://localhost:5001/api

# Clerk Authentication (get from dashboard.clerk.com)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
CLERK_SECRET_KEY=sk_test_your_key_here

# Clerk URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
```

**Start frontend server:**
```bash
npm run dev
```
Frontend runs on: http://localhost:3000

---

## 🔧 Configuration

### Clerk Authentication Setup

1. **Create Clerk Account**
   - Go to https://clerk.com
   - Sign up for free account
   - Create new application

2. **Configure Authentication Methods**
   - Enable **Email** (required)
   - Enable **Google** (optional)
   - Enable **GitHub** (optional)
   - **Disable Phone** (not supported in India)

3. **Get API Keys**
   - Copy Publishable Key (starts with `pk_test_`)
   - Copy Secret Key (starts with `sk_test_`)
   - Add to `frontend/.env.local`

4. **Configure Redirects**
   - Sign-in URL: `/sign-in`
   - Sign-up URL: `/sign-up`
   - After sign-in: `/`
   - After sign-up: `/`

### Database Setup (Neon)

1. **Create Neon Account**
   - Go to https://neon.tech
   - Create free PostgreSQL database

2. **Get Connection String**
   - Copy connection string from Neon dashboard
   - Add to `backend/.env` as `DATABASE_URL`

3. **Run Migrations**
   ```bash
   cd backend
   npx prisma db push
   npx prisma db seed
   ```

---

## 📁 Project Structure

```
quiz-app/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma      # Database schema
│   │   └── seed.ts            # Sample data
│   ├── src/
│   │   ├── controllers/       # Route handlers
│   │   ├── routes/            # API routes
│   │   ├── services/          # Business logic
│   │   ├── types/             # TypeScript types
│   │   └── index.ts           # Server entry
│   └── package.json
│
├── frontend/
│   ├── app/
│   │   ├── quiz/              # Quiz pages
│   │   ├── stats/             # Statistics dashboard
│   │   ├── history/           # Quiz history
│   │   ├── leaderboard/       # Rankings
│   │   ├── sign-in/           # Auth pages
│   │   ├── sign-up/           # Auth pages
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Homepage
│   ├── components/
│   │   ├── quiz/              # Quiz components
│   │   └── ui/                # Reusable UI
│   ├── hooks/                 # Custom hooks
│   ├── services/              # API calls
│   ├── stores/                # Zustand stores
│   └── types/                 # TypeScript types
│
├── AUTH_PROGRESS.md           # Authentication docs
├── CLERK_PHONE_DISABLE.md     # Phone auth guide
├── ROLLBACK_GUIDE.md          # Rollback instructions
└── README.md                  # This file
```

---

## 🎮 Usage

### Taking a Quiz

1. **Browse Topics**
   - View all subjects on homepage
   - Use search to find specific topics
   - Filter by subject category

2. **Select Difficulty**
   - Choose: Easy, Medium, Hard, or Expert
   - Higher difficulties unlock with points
   - Earn more points for harder quizzes

3. **Complete Quiz**
   - Answer multiple-choice questions
   - Use keyboard arrows or buttons to navigate
   - Watch the timer countdown
   - Submit when finished

4. **View Results**
   - See your score and percentage
   - Review correct/incorrect answers
   - Check detailed explanations
   - Retake or try new topic

### Viewing Statistics

- Click **Stats** in header
- View overall performance metrics
- See topic-wise breakdown
- Track improvement over time
- Filter by date range

### Managing History

- Click **History** in header
- View all quiz attempts
- Search by topic or date
- Sort by score, date, or topic
- Delete old attempts

### Leaderboard

- Click **Leaderboard** in header
- See top performers
- View your ranking
- Filter by timeframe
- Compete with others

---

## 🔐 Authentication Flow

### Current State (Phase 1 - UI Only)
✅ Clerk authentication integrated  
✅ Sign-in/Sign-up pages created  
✅ User avatars in header  
✅ Email authentication enabled  
⏳ Data still in localStorage (not linked to users)

### Coming Soon (Phase 2 - Database Integration)
- [ ] Link quiz results to user accounts
- [ ] Save history to database with userId
- [ ] Real leaderboard with authenticated users
- [ ] User-specific statistics
- [ ] Cross-device data sync

---

## 🛠️ Development

### Run Both Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Database Commands

```bash
# Generate Prisma client
npx prisma generate

# Push schema changes
npx prisma db push

# Open Prisma Studio
npx prisma studio

# Run seed data
npx prisma db seed

# Reset database
npx prisma migrate reset
```

### Git Workflow

```bash
# Current branch
git branch                    # feature/authentication

# Safe rollback point
git checkout v1.0-working     # Restore to pre-auth state

# View changes
git status
git diff

# Commit changes
git add .
git commit -m "feat: your message"
git push origin feature/authentication
```

---

## 🐛 Troubleshooting

### Backend Issues

**Port 5001 already in use:**
```bash
# Find and kill process on port 5001
npx kill-port 5001

# Or change port in backend/.env
PORT=5002
```

**Database connection failed:**
- Check `DATABASE_URL` in `.env`
- Verify Neon database is active
- Run `npx prisma db push`

### Frontend Issues

**API calls failing:**
- Check backend is running on port 5001
- Verify `NEXT_PUBLIC_API_URL` in `.env.local`
- Check browser console for errors

**Clerk authentication errors:**
- Verify Clerk keys in `.env.local`
- Check Clerk dashboard is configured
- Hard refresh browser (Ctrl+Shift+R)

**Phone authentication showing (India issue):**
- Disable in Clerk Dashboard
- See `CLERK_PHONE_DISABLE.md` for guide

---

## 📊 Database Schema

### Current Tables

- `Subject` - Quiz subjects (Math, Science, etc.)
- `Topic` - Topics within subjects
- `Question` - Quiz questions
- `Option` - Answer options
- `QuizResult` - Submitted quiz results
- `DifficultyLevel` - Difficulty configurations

### Coming in Phase 2

- `User` - User accounts (linked to Clerk)
- Foreign keys linking results to users
- User preferences and settings

---

## 🚦 Roadmap

### ✅ Completed (Tier 1)
- [x] Core quiz functionality
- [x] Statistics dashboard
- [x] History management
- [x] Leaderboard
- [x] Difficulty system
- [x] Enhanced UI/UX
- [x] Loading states
- [x] Text readability improvements

### 🏗️ In Progress (Tier 2 - Phase 1)
- [x] Clerk authentication UI
- [x] Sign-in/Sign-up pages
- [x] User profiles in header
- [ ] Database integration with users
- [ ] User-specific data persistence

### 🔮 Future Features
- [ ] Real-time leaderboard updates
- [ ] Quiz creation interface
- [ ] Admin dashboard
- [ ] Badges and achievements
- [ ] Study mode
- [ ] Quiz sharing
- [ ] Analytics export

---

## 📝 License

This project is for educational purposes.

---

## 👥 Contributing

This is a personal learning project. Feel free to fork and experiment!

---

## 🙏 Acknowledgments

- **Clerk** - Authentication platform
- **Neon** - Serverless PostgreSQL
- **Vercel** - Next.js creators
- **Prisma** - Database ORM

---

## 📧 Support

For issues or questions:
- Check `ROLLBACK_GUIDE.md` for rollback instructions
- Review `AUTH_PROGRESS.md` for authentication status
- See `CLERK_PHONE_DISABLE.md` for phone auth removal

---

**Built with ❤️ for learning**

Last Updated: October 3, 2025

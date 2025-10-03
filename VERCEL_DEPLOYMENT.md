# 📝 Vercel Deployment Guide for Quiz App

## Project Structure

This is a monorepo with separate frontend and backend:

```
quiz-app/
├── frontend/          # Next.js application
│   ├── package.json
│   ├── app/
│   └── components/
├── backend/           # Express API
│   ├── package.json
│   └── src/
└── vercel.json       # Vercel configuration
```

## Vercel Deployment Setup

### Option 1: Using Vercel Dashboard (Recommended)

1. **Import Project**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New" → "Project"
   - Import your GitHub repository `jaatdev/quiz-app`

2. **Configure Build Settings**
   - **Framework Preset:** Next.js
   - **Root Directory:** `frontend` ⚠️ IMPORTANT!
   - **Build Command:** `npm run build` (auto-detected)
   - **Output Directory:** `.next` (auto-detected)
   - **Install Command:** `npm install` (auto-detected)

3. **Environment Variables**
   Add these environment variables in Vercel project settings:
   
   ```
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_API_URL=https://your-backend-url.com
   ```

4. **Deploy**
   - Click "Deploy"
   - Vercel will automatically deploy from the `frontend` directory

### Option 2: Using Vercel CLI

```bash
# Install Vercel CLI globally
npm i -g vercel

# Navigate to the project root
cd quiz-app

# Login to Vercel
vercel login

# Deploy (first time)
vercel --prod

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? [Your account]
# - Link to existing project? No
# - Project name? quiz-app
# - In which directory is your code located? ./frontend
```

### Option 3: Using vercel.json (Included)

The `vercel.json` file is already configured to:
- Point to the `frontend` directory
- Use Next.js framework
- Route all requests to the frontend

Just push to GitHub and Vercel will auto-deploy using this config.

## Backend Deployment

The backend (Express API) should be deployed separately:

### Recommended Backend Hosting Options:

1. **Railway.app** (Easiest)
   ```bash
   # Install Railway CLI
   npm i -g @railway/cli
   
   # Navigate to backend
   cd backend
   
   # Deploy
   railway up
   ```

2. **Render.com**
   - Create new Web Service
   - Connect GitHub repo
   - Set Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`

3. **Heroku**
   ```bash
   # From backend directory
   heroku create quiz-app-api
   git subtree push --prefix backend heroku master
   ```

4. **Fly.io**
   ```bash
   cd backend
   fly launch
   fly deploy
   ```

## Environment Variables

### Frontend (Vercel)
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_aW50ZW50LWxhY2V3aW5nLTI2LmNsZXJrLmFjY291bnRzLmRldiQ
CLERK_SECRET_KEY=sk_test_Li5zRWn9IqnUoSHxrVsPhmoDuHA2xFEXnaIQAfcv0V
NEXT_PUBLIC_API_URL=https://your-backend-api.railway.app
```

### Backend (Railway/Render)
```env
DATABASE_URL=postgresql://neondb_owner:npg_***@ep-steep-butterfly-af666vij-pooler.c-2.us-west-2.aws.neon.tech/neondb
PORT=5001
CLERK_SECRET_KEY=sk_test_Li5zRWn9IqnUoSHxrVsPhmoDuHA2xFEXnaIQAfcv0V
CLERK_WEBHOOK_SECRET=whsec_*** (get from Clerk dashboard)
```

## Troubleshooting Vercel Deployment

### Error: "No Next.js version detected"

**Solution:** Set Root Directory to `frontend` in Vercel project settings:
1. Go to Project Settings → General
2. Find "Root Directory"
3. Click "Edit" and enter `frontend`
4. Save and redeploy

### Error: "Module not found: Can't resolve '@/components/...'"

**Solution:** Ensure TypeScript paths are configured in `frontend/tsconfig.json`:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### Error: "CLERK_SECRET_KEY is not defined"

**Solution:** Add environment variables in Vercel dashboard:
1. Go to Project Settings → Environment Variables
2. Add all required variables
3. Redeploy

## Post-Deployment Checklist

- [ ] Frontend deployed to Vercel
- [ ] Backend deployed to Railway/Render
- [ ] Frontend can reach backend API
- [ ] Clerk authentication works
- [ ] Database connection successful
- [ ] Admin panel accessible
- [ ] Webhooks configured (if using)
- [ ] Custom domain configured (optional)

## Quick Links

- **Vercel Dashboard:** https://vercel.com/dashboard
- **Railway Dashboard:** https://railway.app/dashboard
- **Clerk Dashboard:** https://dashboard.clerk.com
- **Neon Database:** https://console.neon.tech

## Support

For deployment issues:
1. Check Vercel build logs
2. Verify environment variables
3. Test API endpoints
4. Check browser console for errors

---

**Current Status:**
- ✅ Frontend ready for Vercel deployment
- ✅ Backend running on local/production database
- ✅ Monorepo structure configured
- ✅ Environment variables documented

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

---

Frontend API client and DB access policy

This project centralizes frontend → backend HTTP calls. Please follow these rules to avoid accidental database access during server-side rendering:

- Use `frontend/lib/api-client.ts` (or `frontend/lib/api.ts`) for all calls to the backend API.
- Do NOT import `@prisma/client` or any database client inside `frontend/`. All database work must run in the backend service only.
- For admin operations that require authenticated server-to-server requests, use an app route under `app/api/*` that forwards the incoming auth header and `X-Clerk-User-Id` to the backend (see `app/api/admin/import-quiz/route.ts` for an example).

If you want this enforced automatically, add an ESLint rule (no-restricted-imports) that forbids `@prisma/client` under `frontend/`.


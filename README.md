# IRSimples

Professional tax submissions from your brokerage exports.

## Tech stack
- Next.js App Router (RSC + Client Components where needed)
- TypeScript, Tailwind CSS, Radix UI
- Prisma ORM (PostgreSQL)
- Auth: JWT (access/refresh) + Next middleware
- Emails: Nodemailer (SMTP)
- State in URL: `nuqs`
- Server Actions for form flows

## Key conventions
- App Router with `page.tsx` routes
- Prefer named exports for components (pages export default)
- Minimize `'use client'`; keep interactive parts in small client components
- Use Server Actions for mutations and `fetch` in server when possible
- Use URL search params for shareable state via `nuqs`

## Features
- Email/password auth with verification link
- Protected dashboard behind middleware
- Submission wizard (create → upload broker files → review → calculate)
- Dashboard filters with URL state (`q`, `status`, `page`) powered by `nuqs`

## Project layout (high-level)
```
app/
  api/                 # API routes (Next API)
  actions/             # Server Actions ("use server")
  (root)/              # App pages (dashboard, verify, wizard)
  layout.tsx           # Root providers + NuqsAdapter
components/            # Reusable UI (named exports)
lib/
  api/                 # ApiClient (pure HTTP)
  contexts/            # AuthProvider (client)
  repositories/        # Prisma access
  services/            # Business services (auth, email, submission)
  utils/               # JWT utils, seed, etc.
prisma/                # Prisma schema
```

## Environment variables
Create `.env.local` for local/dev; set equivalent variables in Vercel for production.

Required
- `DATABASE_URL` (e.g. `postgresql://postgres:password@localhost:5432/irsimples`)
- `NEXT_PUBLIC_BASE_URL` (e.g. `http://localhost:3000` or your Vercel domain)
- `JWT_ACCESS_SECRET` (strong secret)
- `JWT_REFRESH_SECRET` (strong secret)

Optional (defaults exist)
- `JWT_ACCESS_EXPIRY` (default: `30s` in dev; configure e.g. `15m`)
- `JWT_REFRESH_EXPIRY` (default: `7d`)

SMTP (for email verification)
- `SMTP_HOST`
- `SMTP_PORT` (e.g. 465)
- `SMTP_USER`
- `SMTP_PASS`

## Local development
- Run Postgres + Adminer (optional):
  ```bash
  npm run db:start
  # opens Postgres on 5432 and Adminer on 8081
  ```
- Sync database and generate client:
  ```bash
  npm run db:sync
  # or: npx prisma generate && npx prisma db push
  ```
- Seed basic data (optional):
  ```bash
  npm run db:seed
  ```
- Start the app:
  ```bash
  npm run dev
  ```
- Health check: GET `/api/health`

## Production build
```bash
npm run build
npm run start
```
The app uses `output: 'standalone'` for Docker/Vercel optimized output.

## Vercel deployment
- Deployed via Vercel GitHub integration
- Set Environment Variables in Vercel Project settings
- Configure a Postgres (e.g., Vercel Postgres or external) and set `DATABASE_URL`
- SMTP variables required for verification emails

## Authentication overview
- `lib/services/auth-service.ts` issues access/refresh tokens via `jose`
- `middleware.ts` protects `/dashboard` and all `/api` except a small public set
- Client state is managed by `AuthProvider` (tokens in localStorage + cookies for middleware)
- Access token refresh handled by `/api/auth/refresh`

## Server Actions
- `app/actions/*` contains actions for submissions and auth verification
- Pages call actions directly and pass tokens via form data when needed

## URL state with nuqs
- `app/(root)/dashboard/page.tsx` uses `useQueryStates` for:
  - `q`: search query
  - `status`: submission status filter (`all` or enum value)
  - `page`: pagination index
- `NuqsAdapter` is mounted in `app/layout.tsx`
- Page content wrapped to satisfy Suspense/CSR constraints

## API surface (selected)
- Auth
  - `POST /api/auth/login`
  - `POST /api/auth/refresh`
- Users
  - `POST /api/users` (register)
  - `POST /api/users/verify`
  - `POST /api/users/:userId/resend-verification`
  - `GET/PUT/DELETE /api/users/:userId`
- Submissions
  - `GET/POST /api/submissions`
  - `GET/PUT /api/submissions/:id`
  - `PUT /api/submissions/:id/status`
  - `GET/POST /api/submissions/:id/results`
  - `DELETE /api/submissions/:id/files` (body `{ broker_id }`)
  - `DELETE /api/submissions/:id/files/:fileId`
  - `POST /api/submissions/:id/calculate-taxes`
- Brokers
  - `GET /api/brokers`
  - `GET /api/brokers/manual_template`
  - `POST /api/brokers/upload`
- Health
  - `GET /api/health`

## Scripts
- `dev`: next dev (Turbopack)
- `build`: next build
- `start`: run standalone server output
- `lint`: next lint
- `db:start`: docker-compose Postgres+Adminer, then prisma generate/push and seed
- `db:sync`: prisma generate + db push
- `db:seed`: prisma generate + db push + run `lib/utils/seed.ts`
- `db:studio`: Prisma Studio

## Security
- Middleware enforces auth on `/dashboard` and private APIs
- JWT signing via `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET`
- Rotate secrets and tune expiries for production

## Notes & tips
- Update JWT expiries in env for production (defaults are dev-friendly)
- `NEXT_PUBLIC_BASE_URL` should match your deployment URL on Vercel
- The email sender address is set in `EmailServiceImpl` (`suporte@meuirs.pt`)

## License
MIT

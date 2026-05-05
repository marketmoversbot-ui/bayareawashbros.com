# Phase 1 — Foundation

This drop adds: Postgres + Prisma, NextAuth login, the admin shell with bottom nav, and PWA installability.

## 1. Copy these files into your project

The folder structure here mirrors your project root. Drop each file at the same relative path inside your existing `baayareabros/` folder. New files created:

```
prisma/schema.prisma
prisma/seed.ts
lib/db.ts
lib/auth.ts
middleware.ts
package.json                                    ← REPLACES the old one
.env.example
types/next-auth.d.ts
public/icon-192.png
public/icon-512.png
public/icon-512-maskable.png
public/apple-touch-icon.png
public/favicon-32.png
app/manifest.ts
app/admin/layout.tsx
app/admin/login/page.tsx
app/admin/(app)/layout.tsx
app/admin/(app)/page.tsx                        ← /admin (Inbox)
app/admin/(app)/schedule/page.tsx               ← /admin/schedule
app/admin/(app)/customers/page.tsx              ← /admin/customers
app/admin/(app)/more/page.tsx                   ← /admin/more
components/AdminBottomNav.tsx
components/AdminSessionProvider.tsx
components/AdminTopBar.tsx
```

## 2. Add a Postgres database to your Railway project

1. Open your Railway project → **+ New** → **Database** → **Add PostgreSQL**.
2. Once it provisions, click into the Postgres service → **Variables** tab → copy `DATABASE_URL`.
3. Go to your **web service** (the Next.js app) → **Variables** → add:
   - `DATABASE_URL` (paste from step 2)
   - `NEXTAUTH_SECRET` — generate locally with `openssl rand -base64 32`
   - `NEXTAUTH_URL` — your production URL (e.g. `https://bayareawashbros.com`)

Cost: Railway Postgres starts at $5/mo and includes 1 GB storage — plenty for years of bookings.

## 3. Install and run locally

From your project root:

```bash
npm install
cp .env.example .env.local
# edit .env.local — set DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL,
# ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME
```

Create the schema and seed the admin user:

```bash
npx prisma migrate dev --name init
npm run db:seed
```

Start the dev server:

```bash
npm run dev
```

Open `http://localhost:3000/admin` — you'll be redirected to `/admin/login`. Sign in with the email/password you put in `.env.local`.

## 4. Deploy to Railway

Push to `main`. Railway auto-deploys.

The first deploy will fail because it needs to create the database tables. Run the migration once against production:

```bash
# Option A — easiest: use Railway's web shell on the web service
npx prisma migrate deploy
ADMIN_EMAIL=... ADMIN_PASSWORD=... ADMIN_NAME=... npm run db:seed

# Option B — run from your laptop pointed at Railway's DB
# Pull DATABASE_URL from Railway, put it in .env.production, then:
DATABASE_URL='postgres://...' npx prisma migrate deploy
DATABASE_URL='postgres://...' ADMIN_EMAIL=... ADMIN_PASSWORD=... ADMIN_NAME=... npm run db:seed
```

After that, every push auto-runs `prisma generate` (in the build step). Future schema changes get a new migration committed in `prisma/migrations/` and deploy automatically.

## 5. Install on your son's phone (PWA)

1. He opens your production URL on his iPhone in **Safari** (not Chrome — iOS only allows PWA install from Safari).
2. Taps the Share icon → **Add to Home Screen** → Add.
3. The app icon (water droplet) lands on his home screen and launches full-screen. He logs in once and stays logged in for 30 days.

On Android: Chrome auto-prompts "Install app" or it's available under the ⋮ menu.

## What's working after Phase 1

- ✅ He can sign in at `/admin/login` from his phone.
- ✅ Bottom nav with Inbox / Schedule / Customers / More tabs.
- ✅ Database is live and seeded with default availability and starter quick replies.
- ✅ PWA installable on home screen, opens like a real app.
- ✅ Existing public site at `/` is untouched.

## What's still placeholder

The four admin tabs are stubs that say what's coming. Phases 2–5 fill them in.

## Next phase

Phase 2 — schedule manager. He'll get a calendar view of the next 4 weeks where he can tap any day to mark himself unavailable ("school field trip Friday"), edit weekly hours, and add one-off open slots. The public booking form will start reading availability from the database instead of the hardcoded values in `lib/availability.ts`.

Just say "ready for phase 2" when Phase 1 is deployed and you've signed in successfully.

# Bay Area Wash Bros

Next.js + Railway production site for a League City pressure-washing business.

## Stack

- Next.js 14 App Router (TypeScript)
- No Tailwind, no PostCSS — all styles inline or in `app/globals.css`
- Deployed on Railway with auto-deploy from `main`

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Production build

```bash
npm run build
npm start
```

The `start` script binds `0.0.0.0` and reads `PORT` from the env (Railway sets it
to 8080) — falling back to 3000 locally.

## Booking

The booking form (`components/BookingForm.tsx`) only accepts Thursday afternoon
and weekend slots, defined in `lib/availability.ts`. Submissions POST to
`app/api/stripe/create-checkout-session/route.ts`, which is a stub that logs the
payload — wire up Stripe + Calendar there when ready.

## Stripe / Calendar

Both are stubbed today. To enable:

- **Stripe**: replace the body of `app/api/stripe/create-checkout-session/route.ts`
  with a real Checkout Session call. Add `stripe` to `package.json` and set
  `STRIPE_SECRET_KEY` in Railway → Variables.
- **Google Calendar**: see `lib/calendar.ts` — restore the `googleapis` import
  from git history (commit `989306c`), add `googleapis` to `package.json`, and
  set the three env vars listed in that file.

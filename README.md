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

## Photo quote

`components/PhotoQuoteForm.tsx` lets visitors upload photos with their info.
Submissions POST to `app/api/photo-quote/route.ts`, which:

1. Saves photos to `/tmp/baw-photo-uploads/<sessionId>/` on the Railway
   container.
2. Logs the submission to Railway → Logs.
3. If Twilio env vars are set, sends an MMS to `TWILIO_TO_NUMBER` (default
   `+18328819960`) with the customer info as the body and the photos attached
   via media URLs served by `app/api/photo-quote/media/[...path]/route.ts`.

Required env vars (Railway → Variables):

- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_FROM_NUMBER` (your Twilio number, e.g. `+15125551234`)
- `TWILIO_TO_NUMBER` (optional; defaults to `+18328819960`)
- `PUBLIC_BASE_URL` (optional; e.g. `https://bayareawashbros.com`)

Without those env vars the form still works — submissions are just logged
instead of texted. This is single-replica only; if you scale Railway to >1
replica, swap `/tmp` storage for S3/R2.

## Stripe / Calendar

Both are stubbed today. To enable:

- **Stripe**: replace the body of `app/api/stripe/create-checkout-session/route.ts`
  with a real Checkout Session call. Add `stripe` to `package.json` and set
  `STRIPE_SECRET_KEY` in Railway → Variables.
- **Google Calendar**: see `lib/calendar.ts` — restore the `googleapis` import
  from git history (commit `989306c`), add `googleapis` to `package.json`, and
  set the three env vars listed in that file.

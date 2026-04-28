# Bay Area Wash Bros — Publishable Starter Site

A launch-ready Next.js starter for a League City pressure washing business.

## Included

- Public marketing homepage
- Services section
- Photo estimate assistant stub
- Booking form
- $25 refundable deposit checkout stub
- Stripe API route stub
- AI photo estimate API route stub
- Google Calendar event creation stub
- Railway deployment config
- GitHub-ready repo files
- Namecheap DNS instructions

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Calendar setup

The booking form only allows Thursday afternoon and weekend slots. Other days appear booked.

After a successful Stripe checkout, the Stripe webhook calls the Google Calendar helper and creates the job event on the connected calendar.

See `docs/calendar-setup.md`.

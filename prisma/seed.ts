/**
 * Seed script — runs once to:
 *   1. Create the son's admin user (email + password from env)
 *   2. Seed default weekly availability (Thu afternoons + weekends, matching the existing site)
 *   3. Seed a few starter quick-reply templates
 *
 * Usage:
 *   ADMIN_EMAIL=...  ADMIN_PASSWORD=...  ADMIN_NAME='...'  npm run db:seed
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL?.toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME ?? "Admin";

  if (!email || !password) {
    throw new Error(
      "Set ADMIN_EMAIL and ADMIN_PASSWORD env vars before running the seed."
    );
  }
  if (password.length < 10) {
    throw new Error("ADMIN_PASSWORD must be at least 10 characters.");
  }

  // ---- Admin user (idempotent: upserts on email) ----
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, name },
    create: { email, passwordHash, name },
  });
  console.log(`✓ Admin user ready: ${user.email}`);

  // ---- Default weekly availability ----
  // Thursdays 3:30pm – 7:30pm; Saturday & Sunday 8am – 6pm.
  // Mirrors the slots already in lib/availability.ts.
  const defaultRules = [
    { dayOfWeek: 4, startTime: "15:30", endTime: "19:30" }, // Thursday
    { dayOfWeek: 6, startTime: "08:00", endTime: "18:00" }, // Saturday
    { dayOfWeek: 0, startTime: "08:00", endTime: "18:00" }, // Sunday
  ];

  const existingRules = await prisma.availabilityRule.count();
  if (existingRules === 0) {
    await prisma.availabilityRule.createMany({ data: defaultRules });
    console.log(`✓ Seeded ${defaultRules.length} weekly availability rules`);
  } else {
    console.log(`• Skipped availability rules (${existingRules} already exist)`);
  }

  // ---- Starter quick replies ----
  const defaultReplies = [
    {
      label: "On my way",
      body: "Hey, this is from Bay Area Wash Bros — I'm on my way and should be there in about 15-20 min. Thanks!",
      sortOrder: 1,
    },
    {
      label: "Confirm tomorrow",
      body: "Hi, just confirming your wash for tomorrow. Reply YES to confirm or let me know if you need to reschedule. — Bay Area Wash Bros",
      sortOrder: 2,
    },
    {
      label: "Send pricing",
      body: "Standard driveway is $80, driveway + sidewalks $110, full house wash starts at $200. Want me to come take a look and give you an exact quote?",
      sortOrder: 3,
    },
    {
      label: "Thanks!",
      body: "Thank you! If you've got 30 seconds, a Google review really helps a small business like ours. — Bay Area Wash Bros",
      sortOrder: 4,
    },
  ];

  const existingReplies = await prisma.quickReply.count();
  if (existingReplies === 0) {
    await prisma.quickReply.createMany({ data: defaultReplies });
    console.log(`✓ Seeded ${defaultReplies.length} quick replies`);
  } else {
    console.log(`• Skipped quick replies (${existingReplies} already exist)`);
  }

  console.log("\nAll done. Sign in at /admin/login with the email + password you used.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

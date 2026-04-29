// Calendar integration stub.
//
// The previous version of this file imported `googleapis`, which is NOT in
// package.json. That worked only because nothing imported this file — the
// moment any code path imports it, the build would break.
//
// To keep dependencies minimal (per the stabilization rules), this is now a
// pure logging stub. When you're ready to wire up Google Calendar:
//   1. Add "googleapis" to package.json dependencies
//   2. Restore the implementation from git history (commit 989306c)
//   3. Set GOOGLE_CALENDAR_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY
//      in Railway → Variables.

export type CalendarEventInput = {
  name: string;
  phone: string;
  email?: string;
  address: string;
  service: string;
  date: string;
  time: string;
  notes?: string;
};

export async function createCalendarEvent(input: CalendarEventInput) {
  console.log("[calendar stub] would create event:", {
    name: input.name,
    date: input.date,
    time: input.time,
    service: input.service,
  });
}

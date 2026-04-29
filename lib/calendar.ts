import { google } from "googleapis";

export async function createCalendarEvent({
  name,
  phone,
  email,
  address,
  service,
  date,
  time,
  notes,
}: {
  name: string;
  phone: string;
  email?: string;
  address: string;
  service: string;
  date: string;
  time: string;
  notes?: string;
}) {
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!calendarId || !clientEmail || !privateKey) {
    console.log("Calendar stub event:", { name, date, time });
    return;
  }

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });

  const calendar = google.calendar({ version: "v3", auth });

  const start = new Date(`${date}T${time}:00`);
  const end = new Date(start.getTime() + 90 * 60 * 1000);

  await calendar.events.insert({
    calendarId,
    requestBody: {
      summary: `Wash Bros - ${service}`,
      location: address,
      description: `Customer: ${name}\nPhone: ${phone}\n${email ?? ""}\n${notes ?? ""}`,
      start: { dateTime: start.toISOString() },
      end: { dateTime: end.toISOString() },
    },
  });
}

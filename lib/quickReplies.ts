// Quick replies for the admin Inbox.
//
// These are canned text-message templates your son can tap to draft a
// reply with one tap. The templates can include placeholders that get
// substituted at click time with the active customer/booking values.
//
// Supported placeholders:
//   {first}     — customer's first name (split on the first space of name)
//   {name}      — customer's full name
//   {date}      — next upcoming booking, formatted "Sat Sep 13"
//   {time}      — next upcoming booking time, formatted "3:30 PM"
//
// Note: the actual sending is handled by the iOS Messages app (or default
// SMS app on Android) via an sms: deeplink. We just hand it the prefilled
// body text.

export type QuickReply = {
  id: string;
  label: string;       // short, what shows on the button
  template: string;    // the body of the SMS
};

export const QUICK_REPLIES: QuickReply[] = [
  {
    id: "on-my-way",
    label: "On my way",
    template:
      "Hi {first}, this is Oliver from Bay Area Wash Bros. I'm on my way to your place — should be there in about 15 min.",
  },
  {
    id: "running-late",
    label: "Running late",
    template:
      "Hi {first}, Oliver from Bay Area Wash Bros — running about 15 minutes behind. Sorry about that, I'll be there shortly.",
  },
  {
    id: "quote",
    label: "Quote is...",
    template:
      "Hi {first}, thanks for the photos! Looking at what you sent, I can do that job for $",
  },
  {
    id: "reschedule",
    label: "Reschedule?",
    template:
      "Hi {first}, this is Oliver — something came up and I need to reschedule {date}. Could we move it to a different day this week?",
  },
  {
    id: "thanks",
    label: "Thanks!",
    template:
      "Thanks so much {first}! Hope you're happy with how it turned out. If you'd be willing to leave us a Google review, it would mean the world.",
  },
];

// Substitute placeholders in a template. Missing placeholders are left
// in place so the user notices and edits them.
export function fillTemplate(
  template: string,
  vars: { first?: string | null; name?: string | null; date?: string | null; time?: string | null }
): string {
  let out = template;
  if (vars.first) out = out.split("{first}").join(vars.first);
  if (vars.name) out = out.split("{name}").join(vars.name);
  if (vars.date) out = out.split("{date}").join(vars.date);
  if (vars.time) out = out.split("{time}").join(vars.time);
  return out;
}

// Build an sms: deeplink that opens the device's messaging app with the
// destination + body prefilled. Encoding is critical — spaces, ampersands,
// and apostrophes can break the link otherwise.
export function smsDeeplink(toPhone: string, body: string): string {
  // iOS expects sms:NUMBER&body=... with an &, Android prefers ?body=...
  // Both platforms tolerate ?body= so we use that for max compatibility.
  return "sms:" + toPhone + "?body=" + encodeURIComponent(body);
}

import { redirect } from "next/navigation";

// The "Customers" tab in the bottom nav points here. Since the Inbox at
// /admin already shows the full customer list (all customers who've booked
// a job), this page just redirects to /admin so the nav still works without
// duplicating UI.

export const dynamic = "force-dynamic";

export default function CustomersPage() {
  redirect("/admin");
}

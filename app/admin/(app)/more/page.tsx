import { redirect } from "next/navigation";

// /admin/more was the placeholder for future features. Reports has taken
// over that slot in the bottom nav. Redirect any old links there.

export const dynamic = "force-dynamic";

export default function MorePage() {
  redirect("/admin/reports");
}

// Protects everything under /admin/* except /admin/login.
// Wraps NextAuth's middleware explicitly so Next.js 16 can detect
// the exported function (the bare `export { default } from ...` form
// works in Next 15 but Next 16 requires a real function export).
import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: { signIn: "/admin/login" },
});

export const config = {
  matcher: [
    // Protect all /admin routes EXCEPT the login page itself.
    "/admin/((?!login).*)",
  ],
};
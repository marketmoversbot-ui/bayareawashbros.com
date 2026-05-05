// Place this file at the project root: /middleware.ts
// Protects everything under /admin/* except /admin/login.

export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    // Protect all /admin routes EXCEPT the login page itself.
    "/admin/((?!login).*)",
  ],
};

import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bay Area Wash Bros | League City Pressure Washing",
  description:
    "Local student-owned pressure washing in League City, TX. Driveways, patios, sidewalks, trash cans, houses, and light commercial cleaning.",
  // Hint to iOS that the admin can be installed as a standalone PWA.
  appleWebApp: {
    capable: true,
    title: "Wash Bros",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0EA5E9",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}

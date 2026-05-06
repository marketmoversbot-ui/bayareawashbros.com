import type { Metadata, Viewport } from "next";
import { Anton } from "next/font/google";
import "./globals.css";
import WeatherStrip from "../components/WeatherStrip";

// Anton — heavy condensed display sans for the brand name.
// Loaded via next/font so it's self-hosted and doesn't FOIT (flash of
// invisible text) on slow connections.
const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-anton",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Bay Area Wash Bros. | League City Pressure Washing",
  description:
    "Local student-owned pressure washing in League City, TX. Driveways, patios, sidewalks, trash cans, houses, fences, mailboxes, and boat docks.",
  appleWebApp: {
    capable: true,
    title: "Wash Bros.",
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
    <html lang="en" className={anton.variable}>
      <head>
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
      </head>
      <body>
        <WeatherStrip />
        {children}
      </body>
    </html>
  );
}

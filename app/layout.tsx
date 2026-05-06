import type { Metadata, Viewport } from "next";
import { Paytone_One } from "next/font/google";
import "./globals.css";
import WeatherStrip from "../components/WeatherStrip";

// Paytone One — heavy modern friendly display font. Used for the brand name
// in the header. Reads warm and approachable, matches the cartoon mascot's
// energy without feeling childish.
const paytoneOne = Paytone_One({
  weight: ["400"],
  subsets: ["latin"],
  variable: "--font-paytone",
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
    <html lang="en" className={paytoneOne.variable}>
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

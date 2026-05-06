import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import WeatherStrip from "../components/WeatherStrip";

// Manrope — soft, approachable modern sans. Used for the brand name in
// the header. Weight 800 (ExtraBold) for confident presence without the
// "shouting display caps" feel.
const manrope = Manrope({
  weight: ["800"],
  subsets: ["latin"],
  variable: "--font-manrope",
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
    <html lang="en" className={manrope.variable}>
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

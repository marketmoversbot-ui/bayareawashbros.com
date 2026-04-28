import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bay Area Wash Bros | League City Pressure Washing",
  description:
    "Local student-owned pressure washing in League City, TX. Driveways, patios, sidewalks, trash cans, houses, and light commercial cleaning.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

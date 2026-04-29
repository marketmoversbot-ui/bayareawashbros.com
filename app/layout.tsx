import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bay Area Wash Bros | League City Pressure Washing",
  description:
    "Local student-owned pressure washing in League City, TX. Driveways, patios, sidewalks, trash cans, houses, and light commercial cleaning.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div
          role="alert"
          style={{
            background: "#FACC15",
            color: "#1F2937",
            padding: "12px 16px",
            textAlign: "center",
            fontWeight: 700,
            fontSize: "14px",
            lineHeight: 1.4,
            borderBottom: "2px solid #B45309",
            position: "sticky",
            top: 0,
            zIndex: 9999,
          }}
        >
          This is a public beta. Do not enter real payment info.
        </div>
        {children}
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import AdminSessionProvider from "../../components/AdminSessionProvider";

export const metadata: Metadata = {
  title: "Wash Bros Admin",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0EA5E9",
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <AdminSessionProvider>{children}</AdminSessionProvider>;
}

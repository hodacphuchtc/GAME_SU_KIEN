import type { Metadata, Viewport } from "next";

import { T } from "@/config/locale";
import "./globals.css";

export const metadata: Metadata = {
  title: T.appName,
  description: T.appDescription,
};

export const viewport: Viewport = {
  themeColor: "#0b0b0f",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className="h-full">
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}

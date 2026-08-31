import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro } from "next/font/google";

import { T } from "@/config/locale";
import "./globals.css";

/**
 * Be Vietnam Pro — font của bộ nhận diện SATA ROBO, hỗ trợ tiếng Việt đủ dấu.
 * Có dải chữ đậm tới 900 vì tiêu đề và chữ số cần Black.
 */
const chuChinh = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-chinh",
  display: "swap",
});

export const metadata: Metadata = {
  title: T.appName,
  description: T.appDescription,
};

export const viewport: Viewport = {
  themeColor: "#6B21A8",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className={`${chuChinh.variable} h-full`}>
      <body className="min-h-full font-[family-name:var(--font-chinh)] antialiased">
        {children}
      </body>
    </html>
  );
}

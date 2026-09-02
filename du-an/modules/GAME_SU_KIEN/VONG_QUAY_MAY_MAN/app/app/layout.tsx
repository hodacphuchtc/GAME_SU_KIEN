import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";

import { T } from "@/config/locale";
import "./globals.css";

// Font toàn hệ thống, đủ dấu tiếng Việt. Khai ở đây một lần để mọi trang dùng
// chung — đừng nạp lại font ở từng trang.
const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "600", "700", "900"],
  variable: "--font-chinh",
  display: "swap",
});

export const metadata: Metadata = {
  title: `${T.tenUngDung} — ${T.tenToChuc}`,
  description: T.cauDinhVi,
};

export default function BoCucGoc({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body className={`${beVietnamPro.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}

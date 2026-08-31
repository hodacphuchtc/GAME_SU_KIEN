import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Web tĩnh thuần: không server, không API route — deploy đâu cũng chạy,
  // và chạy được cả khi trung tâm mất mạng sau lần tải đầu.
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;

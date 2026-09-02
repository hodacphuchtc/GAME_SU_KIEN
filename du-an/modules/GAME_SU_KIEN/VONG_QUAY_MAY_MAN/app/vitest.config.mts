import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
      // `server-only` là chốt chặn lúc dựng, không phải logic — trong test thì
      // thay bằng module rỗng để chạy thẳng được hàm phía máy chủ.
      "server-only": fileURLToPath(new URL("./tests/ho-tro/rong.ts", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});

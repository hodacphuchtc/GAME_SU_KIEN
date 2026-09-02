import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // 🔴 `du-an/` là BỘ NÃO + MỐC LÙI, không phải mã đang chạy. Trong đó có trọn
    // mã nguồn app Vòng Quay CŨ — nó dùng cùng alias `@/` nhưng trỏ tới một cây
    // module khác hẳn, nên đem đi kiểm kiểu/lint ở đây là hàng trăm lỗi giả.
    // Cũng đã loại khỏi `tsconfig.json` vì lý do y hệt.
    "du-an/**",
  ]),
]);

export default eslintConfig;

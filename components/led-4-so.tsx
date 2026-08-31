import { memo } from "react";

/**
 * Bảng LED 4 chữ số kiểu 7 đoạn — dựng lại đúng bảng đèn đỏ gắn tường trong
 * video nguồn. Vẽ bằng SVG thuần: không tải font ngoài nên vẫn hiện đúng khi
 * trung tâm mất mạng, và nét chữ không bao giờ bị size giật giữa các khung hình.
 *
 * Các đoạn KHÔNG sáng vẫn được vẽ mờ — đúng như đèn LED thật, và nhờ vậy chữ số
 * không bị "nhảy khung" khi đổi từ 1 sang 8.
 */

const SEGMENTS_BY_DIGIT: Record<string, string[]> = {
  "0": ["a", "b", "c", "d", "e", "f"],
  "1": ["b", "c"],
  "2": ["a", "b", "g", "e", "d"],
  "3": ["a", "b", "g", "c", "d"],
  "4": ["f", "g", "b", "c"],
  "5": ["a", "f", "g", "c", "d"],
  "6": ["a", "f", "g", "e", "c", "d"],
  "7": ["a", "b", "c"],
  "8": ["a", "b", "c", "d", "e", "f", "g"],
  "9": ["a", "b", "c", "d", "f", "g"],
};

const HALF_THICKNESS = 9;

function horizontal(y: number): string {
  const x0 = 14;
  const x1 = 86;
  const h = HALF_THICKNESS;
  return `${x0},${y} ${x0 + h},${y - h} ${x1 - h},${y - h} ${x1},${y} ${x1 - h},${y + h} ${x0 + h},${y + h}`;
}

function vertical(x: number, ya: number, yb: number): string {
  const h = HALF_THICKNESS;
  return `${x},${ya} ${x + h},${ya + h} ${x + h},${yb - h} ${x},${yb} ${x - h},${yb - h} ${x - h},${ya + h}`;
}

const SEGMENT_SHAPE: Record<string, string> = {
  a: horizontal(14),
  g: horizontal(90),
  d: horizontal(166),
  f: vertical(14, 20, 84),
  b: vertical(86, 20, 84),
  e: vertical(14, 96, 160),
  c: vertical(86, 96, 160),
};

const ALL_SEGMENTS = Object.keys(SEGMENT_SHAPE);

const LedDigit = memo(function LedDigit({ digit }: { digit: string }) {
  const lit = new Set(SEGMENTS_BY_DIGIT[digit] ?? []);
  return (
    <svg
      viewBox="0 0 100 180"
      className="h-full w-auto"
      role="presentation"
      aria-hidden="true"
    >
      {/* Đoạn TẮT: vẽ trước, KHÔNG toả sáng — nếu cho nó sáng theo thì 0000 nhìn
          ra 8888, mà đọc được con số mới là toàn bộ trò chơi. */}
      <g>
        {ALL_SEGMENTS.filter((name) => !lit.has(name)).map((name) => (
          <polygon key={name} points={SEGMENT_SHAPE[name]} fill="var(--color-led-mo)" />
        ))}
      </g>
      {/* Đoạn SÁNG: chỉ riêng nhóm này mới có quầng sáng. */}
      <g className="led-sang">
        {ALL_SEGMENTS.filter((name) => lit.has(name)).map((name) => (
          <polygon key={name} points={SEGMENT_SHAPE[name]} fill="var(--color-led)" />
        ))}
      </g>
    </svg>
  );
});

export interface Led4DigitsProps {
  /** Chuỗi 4 ký tự đã căn đủ số 0 ở đầu, ví dụ "0211". */
  value: string;
  /** Nhãn đọc cho trình đọc màn hình. */
  label?: string;
  /** Cỡ bảng: "tv" màn hình LCD, "large" màn chơi, "medium" màn kết quả, "small" trang cài đặt. */
  size?: "tv" | "large" | "medium" | "small";
}

const HEIGHT_BY_SIZE: Record<NonNullable<Led4DigitsProps["size"]>, string> = {
  tv: "h-40 sm:h-56 lg:h-72 xl:h-80",
  large: "h-28 sm:h-36",
  medium: "h-20",
  small: "h-12",
};

export function Led4Digits({ value, label, size = "large" }: Led4DigitsProps) {
  const digit = value.padStart(4, "0").slice(-4).split("");
  return (
    <div
      className="inline-flex items-center justify-center rounded-2xl border border-vien bg-black px-4 py-3 shadow-[inset_0_2px_18px_rgba(0,0,0,0.9)]"
      role="img"
      aria-label={label ?? `Bảng số ${value}`}
    >
      <div className={`flex items-stretch gap-2 sm:gap-3 ${HEIGHT_BY_SIZE[size]}`}>
        {digit.map((char, i) => (
          <LedDigit key={i} digit={char} />
        ))}
      </div>
    </div>
  );
}

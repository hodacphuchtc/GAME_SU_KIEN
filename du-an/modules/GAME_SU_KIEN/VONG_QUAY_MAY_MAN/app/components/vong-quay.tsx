"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { GIAY_QUAY } from "@/config/vong-quay";
import { MAU_NET_VONG } from "@/config/thuong-hieu";
import { oTaiGoc, type Cung } from "@/lib/vong-quay/chia-o";
import { goc as gocTaiGiay } from "@/lib/vong-quay/goc";

/**
 * MẶT VÒNG QUAY — dùng chung cho màn hình LCD và điện thoại.
 *
 * 🔴 Thành phần này KHÔNG tự quyết kết quả. Nó nhận `gocDich` từ bên ngoài rồi
 * quay tới đó bằng `goc(t)` — đúng một hàm thuần của thời gian mà máy chủ, màn
 * LCD và điện thoại đều dùng. Nhờ vậy hai màn hình không cần truyền cho nhau
 * từng khung hình; chúng chỉ cần biết cùng một `gocDich` và cùng một mốc bắt đầu.
 */

const BAN_KINH = 150;
const TAM = 170;

/** Toạ độ một điểm trên vành, góc tính theo ĐỘ, chiều kim đồng hồ từ 12 giờ. */
function diem(gocDo: number, r: number): [number, number] {
  const rad = (gocDo * Math.PI) / 180;
  return [TAM + r * Math.sin(rad), TAM - r * Math.cos(rad)];
}

/** Đường bao một cung, vẽ từ tâm ra vành rồi khép lại. */
function duongCung(c: Cung): string {
  // Cung phủ trọn vòng thì không vẽ được bằng MỘT cung tròn (điểm đầu trùng
  // điểm cuối, trình duyệt vẽ ra số không) — phải ghép hai nửa hình tròn.
  if (c.doRong >= 359.999) {
    const [x1, y1] = diem(0, BAN_KINH);
    const [x2, y2] = diem(180, BAN_KINH);
    return `M ${x1} ${y1} A ${BAN_KINH} ${BAN_KINH} 0 1 1 ${x2} ${y2} A ${BAN_KINH} ${BAN_KINH} 0 1 1 ${x1} ${y1} Z`;
  }
  const [x1, y1] = diem(c.tu, BAN_KINH);
  const [x2, y2] = diem(c.den, BAN_KINH);
  const cungLon = c.doRong > 180 ? 1 : 0;
  return `M ${TAM} ${TAM} L ${x1} ${y1} A ${BAN_KINH} ${BAN_KINH} 0 ${cungLon} 1 ${x2} ${y2} Z`;
}

export interface VongQuayProps {
  cung: readonly Cung[];
  /** Góc phải dừng lại, [0,360). `null` = đứng yên chờ. */
  gocDich: number | null;
  /** Mốc bắt đầu quay, theo `performance.now()`. `null` = chưa quay. */
  batDauLuc: number | null;
  /** Gọi khi vòng dừng hẳn. Nhận ô đã trúng. */
  onDung?: (o: Cung) => void;
}

export function VongQuay({ cung, gocDich, batDauLuc, onDung }: VongQuayProps) {
  const [gocHienTai, setGocHienTai] = useState(0);
  const daBaoRef = useRef(false);
  const onDungRef = useRef(onDung);
  // Cập nhật trong EFFECT, không phải trong thân render: React coi việc đụng
  // `ref.current` lúc render là lỗi, vì component có thể render lại mà không
  // hề vẽ ra màn hình — khi đó ref đã đổi trong khi giao diện thì chưa.
  useEffect(() => {
    onDungRef.current = onDung;
  });

  useEffect(() => {
    if (gocDich === null || batDauLuc === null) return;
    daBaoRef.current = false;
    let khung = 0;

    const chay = () => {
      const t = (performance.now() - batDauLuc) / 1000;
      setGocHienTai(gocTaiGiay(t, gocDich, GIAY_QUAY));
      if (t < GIAY_QUAY) {
        khung = requestAnimationFrame(chay);
        return;
      }
      // Chỉ báo MỘT lần, kể cả khi React chạy lại effect.
      if (!daBaoRef.current) {
        daBaoRef.current = true;
        const o = oTaiGoc(cung, gocDich);
        if (o) onDungRef.current?.(o);
      }
    };

    khung = requestAnimationFrame(chay);
    return () => cancelAnimationFrame(khung);
  }, [cung, gocDich, batDauLuc]);

  return (
    <svg
      viewBox={`0 0 ${TAM * 2} ${TAM * 2}`}
      className="mx-auto block h-auto w-full max-w-md"
      role="img"
      aria-label="Vòng quay may mắn"
    >
      {/*
        Quay theo chiều ÂM để góc nằm dưới kim đúng bằng `goc(t)`: kim đứng yên ở
        12 giờ, nên khi xoay mặt vòng đi −R thì điểm ở góc +R trôi tới chỗ kim.
        Nhờ vậy `oTaiGoc(cung, gocDich)` khớp mà không cần một phép bù nào.
      */}
      <g transform={`rotate(${-gocHienTai} ${TAM} ${TAM})`}>
        {cung.map((c) => {
          const giua = c.tu + c.doRong / 2;
          const lat = giua > 180;
          return (
            <g key={c.oId}>
              <path d={duongCung(c)} fill={c.mau} stroke={MAU_NET_VONG.vien} strokeWidth={2} />
              <text
                transform={`rotate(${giua - 90} ${TAM} ${TAM}) translate(${TAM + BAN_KINH * 0.6} ${TAM})${lat ? " rotate(180)" : ""}`}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={MAU_NET_VONG.chu}
                fontSize={c.doRong < 25 ? 11 : 14}
                fontWeight={700}
                style={{ pointerEvents: "none" }}
              >
                {c.ten}
              </text>
            </g>
          );
        })}
      </g>

      {/* Trục giữa */}
      <circle
        cx={TAM}
        cy={TAM}
        r={18}
        fill={MAU_NET_VONG.vien}
        stroke={MAU_NET_VONG.vienTruc}
        strokeWidth={2}
      />

      {/* KIM đứng yên ở 12 giờ — vẽ SAU cùng để luôn nằm trên mặt vòng. */}
      <path
        d={`M ${TAM} ${TAM - BAN_KINH - 14} L ${TAM - 13} ${TAM - BAN_KINH + 16} L ${TAM + 13} ${TAM - BAN_KINH + 16} Z`}
        fill={MAU_NET_VONG.kim}
        stroke={MAU_NET_VONG.vien}
        strokeWidth={2}
      />
    </svg>
  );
}

/**
 * Móc tiện dụng cho trang TỰ quyết kết quả tại chỗ (trang thử, dựng lại ván).
 * Trang chơi THẬT không dùng cái này — ở đó máy chủ quyết và gửi `gocDich` xuống.
 */
export function useLuotQuay() {
  const [gocDich, setGocDich] = useState<number | null>(null);
  const [batDauLuc, setBatDauLuc] = useState<number | null>(null);

  const quay = useCallback((goc: number) => {
    setGocDich(goc);
    setBatDauLuc(performance.now());
  }, []);

  return { gocDich, batDauLuc, quay };
}

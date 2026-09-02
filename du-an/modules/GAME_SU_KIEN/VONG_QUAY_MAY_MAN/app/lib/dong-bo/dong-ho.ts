/*
 * NGUỒN: chép từ `modules/GAME_SU_KIEN/app/lib/dong-bo/dong-ho.ts` @ 3d96358.
 * Giữ NGUYÊN — thuật toán Cristian không khác nhau giữa hai app.
 */

/**
 * Canh đồng hồ giữa máy khách và máy chủ (thuật toán Cristian).
 *
 * Vì sao cần: màn hình LCD và điện thoại phải cùng biết "lượt quay bắt đầu lúc
 * nào". Đồng hồ hai máy lệch nhau vài giây là chuyện thường, và độ trễ mạng lại
 * cộng thêm vào. Không canh thì hai vòng quay chạy lệch nhịp thấy rõ.
 *
 * Cách đo: bấm giờ lúc gửi (t0) và lúc nhận (t1), máy chủ trả về giờ của nó (S).
 * Coi như đường đi và đường về mất thời gian bằng nhau ⇒ lúc t1 máy chủ đang ở
 * S + rtt/2, nên `lech = (S + rtt/2) − t1`, và `giờ máy chủ ≈ Date.now() + lech`.
 */

export interface MauDo {
  /** Giờ máy khách lúc gửi. */
  gui: number;
  /** Giờ máy khách lúc nhận. */
  nhan: number;
  /** Giờ máy chủ trả về. */
  gioMayChu: number;
}

export interface KetQuaCanhDongHo {
  lech: number;
  rtt: number;
  soMauDung: number;
}

function trungVi(cac: number[]): number {
  const sap = [...cac].sort((a, b) => a - b);
  const giua = Math.floor(sap.length / 2);
  return sap.length % 2 ? sap[giua] : (sap[giua - 1] + sap[giua]) / 2;
}

/**
 * Tính độ lệch từ nhiều lượt đo.
 *
 * Bỏ những lượt có đường truyền chậm bất thường (rtt hơn gấp đôi lượt nhanh
 * nhất): một lượt vấp mạng làm sai lệch hẳn con số, mà wifi trung tâm thì vấp
 * luôn.
 */
export function tinhLech(cacMau: MauDo[]): KetQuaCanhDongHo {
  if (cacMau.length === 0) return { lech: 0, rtt: 0, soMauDung: 0 };

  const kem = cacMau.map((m) => ({ ...m, rtt: m.nhan - m.gui }));
  const rttNhanhNhat = Math.min(...kem.map((m) => m.rtt));
  const dung = kem.filter((m) => m.rtt <= rttNhanhNhat * 2);
  const dungCuoi = dung.length > 0 ? dung : kem;

  return {
    lech: Math.round(trungVi(dungCuoi.map((m) => m.gioMayChu + m.rtt / 2 - m.nhan))),
    rtt: Math.round(trungVi(dungCuoi.map((m) => m.rtt))),
    soMauDung: dungCuoi.length,
  };
}

/** Đo thật với máy chủ. Hỏng mạng thì trả lệch 0 — thà lệch còn hơn không chạy. */
export async function doLechDongHo(soLuot = 3): Promise<KetQuaCanhDongHo> {
  const cacMau: MauDo[] = [];
  for (let i = 0; i < soLuot; i += 1) {
    const gui = Date.now();
    try {
      const res = await fetch("/api/gio", { cache: "no-store" });
      const nhan = Date.now();
      const body = (await res.json()) as { gio: number };
      if (typeof body.gio === "number") {
        cacMau.push({ gui, nhan, gioMayChu: body.gio });
      }
    } catch {
      // Bỏ lượt đo này, thử lượt sau.
    }
  }
  return tinhLech(cacMau);
}

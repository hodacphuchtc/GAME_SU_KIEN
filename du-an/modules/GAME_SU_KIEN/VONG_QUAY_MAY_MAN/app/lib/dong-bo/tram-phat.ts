import "server-only";

/*
 * NGUỒN: chép từ `modules/GAME_SU_KIEN/app/lib/dong-bo/tram-phat.ts` @ 3d96358.
 * ĐÃ SỬA: đổi khoá Symbol sang `vong-quay.tram-phat` — hai app chạy song song
 * trên cùng một máy, dùng chung khoá là hai trạm phát giẫm lên nhau.
 */

/**
 * Trạm phát tin trong bộ nhớ — nối màn hình LCD với điện thoại phụ huynh.
 *
 * Vì sao tự viết thay vì dùng dịch vụ ngoài: ứng dụng phải TỰ CHỨA. Đây chỉ là
 * cái loa nối hai màn hình đang cùng xem một ván, không phải cái sổ — không ghi
 * gì xuống đĩa, tắt máy là sạch. Cái gì cần nhớ thì đã nằm ở SQLite.
 *
 * Giữ ở `globalThis`: `next dev` nạp lại module mỗi lần sửa code, để ở biến
 * module thì mỗi lần lưu file là mất sạch người đang nghe.
 */

type Gui = (tin: string) => void;

const KHOA = Symbol.for("vong-quay.tram-phat");

type Kho = typeof globalThis & { [KHOA]?: Map<string, Set<Gui>> };

function cacPhong(): Map<string, Set<Gui>> {
  const kho = globalThis as Kho;
  if (!kho[KHOA]) kho[KHOA] = new Map();
  return kho[KHOA];
}

/** Đăng ký nghe một phòng. Trả về hàm rời phòng — PHẢI gọi khi ngắt kết nối. */
export function dangKy(phong: string, gui: Gui): () => void {
  const phongs = cacPhong();
  let nguoiNghe = phongs.get(phong);
  if (!nguoiNghe) {
    nguoiNghe = new Set();
    phongs.set(phong, nguoiNghe);
  }
  nguoiNghe.add(gui);

  return () => {
    const hienTai = phongs.get(phong);
    if (!hienTai) return;
    hienTai.delete(gui);
    // Phòng rỗng thì bỏ hẳn khỏi bản đồ, nếu không mỗi mã chương trình từng mở
    // sẽ để lại một Set rỗng nằm đó tới khi khởi động lại máy chủ.
    if (hienTai.size === 0) phongs.delete(phong);
  };
}

/** Phát một tin cho đúng phòng đó. Trả về số máy đã nhận. */
export function phat(phong: string, tin: unknown): number {
  const nguoiNghe = cacPhong().get(phong);
  if (!nguoiNghe || nguoiNghe.size === 0) return 0;
  const chuoi = JSON.stringify(tin);
  let daGui = 0;
  for (const gui of [...nguoiNghe]) {
    try {
      gui(chuoi);
      daGui += 1;
    } catch {
      // Máy đã ngắt giữa chừng — bỏ ra, không để một kết nối chết chặn cả phòng.
      nguoiNghe.delete(gui);
    }
  }
  return daGui;
}

export function soNguoiNghe(phong: string): number {
  return cacPhong().get(phong)?.size ?? 0;
}

export function soPhongDangMo(): number {
  return cacPhong().size;
}

/** Chỉ dùng trong test — quên sạch mọi phòng. */
export function donTramPhat(): void {
  cacPhong().clear();
}

"use server";

import { GIAY_DEM_LUOT, GIAY_QUAY, GIAY_XEM_KET_QUA } from "@/config/vong-quay";
import { T } from "@/config/locale";
import { csdl } from "@/lib/db/ket-noi";
import { ngayVietNam } from "@/lib/db/thoi-gian";
import { timTheoMaCongKhai } from "@/lib/chuong-trinh/kho";
import { phat } from "@/lib/dong-bo/tram-phat";
import { tenRutGon } from "@/lib/nguoi-choi/nhan-dien";
import { nhanDienNguoiChoi } from "@/app/actions/choi";
import { conLuotHomNay } from "@/lib/vong-quay/gioi-han";
import { danhSachO, phienBanO } from "@/lib/vong-quay/kho-o";
import { chiaCung, type Cung } from "@/lib/vong-quay/chia-o";
import { chamKetQua, hatGiongMoi } from "@/lib/vong-quay/cham";
import { maXacThuc } from "@/lib/vong-quay/ma-xac-thuc";
import { chay, layMot } from "@/lib/db/truy-van";

/**
 * MỞ MỘT LƯỢT QUAY — nơi quyết định ai nhận gì.
 *
 * Máy chủ quyết kết quả TRƯỚC, rồi phát `(gocDung, thoiLuong, cung)` cho cả hai
 * màn hình; mỗi máy tự chạy `goc(t)` theo đồng hồ của mình. Không truyền từng
 * khung hình qua mạng — đó là thứ khiến LCD và điện thoại dừng cùng một ô.
 *
 * 🔴 Chuyển từ app Vòng Quay riêng sang app chung (ADR-011). Khác bản cũ ở đúng
 * ba chỗ: đọc chương trình qua `timTheoMaCongKhai` của app đích và **tự kiểm
 * `troChoi`**; dùng `ngayVietNam` thay `ngayVN`; và PHÁT TIN cho màn LCD.
 */

export interface KetQuaQuay {
  loi?: string;
  luot?: {
    id: number;
    gocDung: number;
    thoiLuong: number;
    batDauLuc: number;
    phienBanO: number;
    cung: Cung[];
    oTen: string;
    oMau: string;
    maXacThuc: string;
  };
}

/**
 * MỘT LÚC MỘT LƯỢT cho mỗi chương trình.
 *
 * 🔴 Khoá bằng chính bảng `luot_quay` trong MỘT giao dịch `BEGIN IMMEDIATE`,
 * KHÔNG bằng một biến trong bộ nhớ: biến bộ nhớ chết theo mỗi lần `next dev`
 * nạp lại module, và nó không sống sót qua một lần khởi động lại máy chủ giữa
 * giờ cao điểm. Bảng thì sống.
 *
 * Vì sao phải khoá: hai lượt song song có thể CÙNG thấy ô cuối còn hàng rồi
 * cùng thắng nó — và không một bài kiểm đơn lẻ nào bắt được chuyện đó.
 */
function coLuotDangChay(chuongTrinhId: number, bayGio: number): boolean {
  const han = bayGio - (GIAY_QUAY + GIAY_DEM_LUOT) * 1000;
  const d = layMot<{ id: number }>(
    `select id from luot_quay
      where chuong_trinh_id = ? and ket_thuc_luc is null and bat_dau_luc > ?
      limit 1`,
    chuongTrinhId,
    han,
  );
  // 🔴 `layMot` trả `undefined` khi không có dòng, KHÔNG phải `null`. So `!== null`
  // ở đây làm hàm này trả TRUE ngay từ lượt đầu và khoá chặt cả chương trình mà
  // không một dòng lỗi nào. Đã trả giá thật, xem CLAUDE.md.
  return d != null;
}

export async function quayMot(
  ma: string,
  nguoiChoiId: number,
  hoTen = "",
): Promise<KetQuaQuay> {
  const ct = timTheoMaCongKhai(ma);
  if (!ct) return { loi: T.phoneEnded };
  // 🔴 Tự kiểm game: `timTheoMaCongKhai` cố ý KHÔNG lọc (phụ huynh quét QR thì
  // lấy đâu ra phạm vi). Thiếu dòng này thì mã của Trúng Số mở được đường quay,
  // và lượt sẽ ghi vào một chương trình chưa từng khai ô quà nào.
  if (ct.troChoi !== "vong_quay") return { loi: T.phoneEnded };
  if (ct.trangThai !== "dang_chay") return { loi: T.phoneEnded };
  if (!conLuotHomNay(ct.id, nguoiChoiId)) return { loi: T.quayHetLuot };

  const db = csdl();
  const bayGio = Date.now();

  // MỘT giao dịch: kiểm khoá · chia cung · chấm · ghi lượt · gắn mã xác thực.
  // Tách ra nhiều giao dịch là mở lại đúng cái khe mà phép khoá sinh ra để bịt.
  db.exec("BEGIN IMMEDIATE");
  try {
    if (coLuotDangChay(ct.id, bayGio)) {
      db.exec("ROLLBACK");
      return { loi: T.quayDangCoNguoi };
    }

    const dsO = danhSachO(ct.id);
    if (dsO.length === 0) {
      db.exec("ROLLBACK");
      return { loi: T.quayChuaCoO };
    }

    const cung = chiaCung(dsO);
    if (cung.length === 0) {
      db.exec("ROLLBACK");
      return { loi: T.quayHetQua };
    }

    // 🔴 Ca này phải nói thành lời. `chamKetQua` trả `null` cho cả hai chuyện
    // "vòng rỗng" lẫn "không ô nào có tỉ lệ dương"; gộp chúng vào một câu "hết
    // quà" là bắt người vận hành đi tìm trong kho một thứ không nằm ở kho.
    if (!cung.some((c) => c.tiLeTrung > 0)) {
      db.exec("ROLLBACK");
      return { loi: T.quayChuaKhaiTiLe };
    }

    const hatGiong = hatGiongMoi();
    const cham = chamKetQua({ hatGiong, cung });
    if (cham === null) {
      db.exec("ROLLBACK");
      return { loi: T.quayHetQua };
    }

    const phienBan = phienBanO(ct.id);
    // 🔴 Lưu ẢNH CHỤP mặt vòng (`cung_json`) và ảnh chụp TÊN + MÀU ô, không chỉ
    // số phiên bản. Số phiên bản nói được "mặt vòng đã đổi" nhưng KHÔNG nói nó
    // cũ trông thế nào — mà đó mới là thứ nút "Dựng lại ván" cần. Và tên ô chụp
    // sẵn là thứ giữ cho sổ đối soát khỏi đổi theo lần sửa danh mục sau này.
    db.prepare(
      `insert into luot_quay (chuong_trinh_id, nguoi_choi_id, o_qua_id, ngay,
                              hat_giong, goc_dung, phien_ban_o, cung_json,
                              o_ten, o_mau, bat_dau_luc)
       values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      ct.id,
      nguoiChoiId,
      cham.o.oId,
      ngayVietNam(bayGio),
      hatGiong,
      cham.gocDung,
      phienBan,
      JSON.stringify(cung),
      cham.o.ten,
      cham.o.mau,
      bayGio,
    );

    // Mã gieo bằng id ô + id lượt nên chỉ sinh được SAU khi có id — vẫn nằm
    // trong cùng giao dịch, nên không tồn tại khoảnh khắc nào dòng lượt có mặt
    // mà thiếu mã.
    const luotId = layMot<{ id: number }>("select last_insert_rowid() as id")!.id;
    const ma4 = maXacThuc(cham.o.oId, luotId);
    db.prepare("update luot_quay set ma_xac_thuc = ? where id = ?").run(ma4, luotId);

    db.exec("COMMIT");

    const ten = hoTen ? tenRutGon(hoTen) : "";
    phat(ma, {
      loai: "bat-dau-quay",
      luotId,
      batDauLuc: bayGio,
      gocDung: cham.gocDung,
      thoiLuong: GIAY_QUAY,
      phienBanO: phienBan,
      cung,
      tenRutGon: ten,
    });
    return {
      luot: {
        id: luotId,
        gocDung: cham.gocDung,
        thoiLuong: GIAY_QUAY,
        batDauLuc: bayGio,
        phienBanO: phienBan,
        cung,
        oTen: cham.o.ten,
        oMau: cham.o.mau,
        maXacThuc: ma4,
      },
    };
  } catch (loi) {
    db.exec("ROLLBACK");
    throw loi;
  }
}

/**
 * Đóng lượt khi vòng đã dừng trên màn hình, VÀ phát kết quả cho màn LCD.
 *
 * 🔴 Tin `ket-qua-quay` phát Ở ĐÂY chứ KHÔNG ở `quayMot`. Phát lúc mở lượt thì
 * màn LCD hiện thẻ "Chúc mừng — phần quà là X" trong khi vòng còn đang quay:
 * cả sảnh biết kết quả trước người đang chơi, và năm giây quay thành vô nghĩa.
 *
 * Không đóng thì lượt tiếp theo phải chờ hết đệm `GIAY_DEM_LUOT`. Gọi lại lần
 * hai vô hại: câu cập nhật chỉ chạm dòng còn `ket_thuc_luc` rỗng, và tin chỉ
 * phát khi câu đó thật sự đổi một dòng.
 */
export async function ketThucLuot(luotId: number): Promise<void> {
  const soDong = chay(
    "update luot_quay set ket_thuc_luc = ? where id = ? and ket_thuc_luc is null",
    Date.now(),
    luotId,
  );
  if (soDong === 0) return;

  const d = layMot<{
    ma: string;
    o_ten: string | null;
    o_mau: string | null;
    ma_xac_thuc: string | null;
    ho_ten: string | null;
  }>(
    `select c.ma, l.o_ten, l.o_mau, l.ma_xac_thuc, n.ho_ten
       from luot_quay l
       join chuong_trinh c on c.id = l.chuong_trinh_id
       left join nguoi_choi n on n.id = l.nguoi_choi_id
      where l.id = ?`,
    luotId,
  );
  if (d == null) return;

  phat(d.ma, {
    loai: "ket-qua-quay",
    luotId,
    oTen: d.o_ten ?? "",
    oMau: d.o_mau ?? "",
    maXacThuc: d.ma_xac_thuc ?? "",
    tenRutGon: d.ho_ten ? tenRutGon(d.ho_ten) : "",
    giayXemKetQua: GIAY_XEM_KET_QUA,
  });
}

/**
 * Người chơi rời trang — trả màn LCD về mã QR ngay, đừng bắt người kế tiếp chờ.
 *
 * 🔴 Màn LCD ĐÃ xử lý tin roi-di từ lâu, nhưng KHÔNG một nơi nào phát nó cho
 * Vòng Quay: nhánh xử lý đó chưa từng chạy lần nào. Đây là dây bị hụt, không
 * phải tính năng mới.
 *
 * Cố ý KHÔNG đòi token: Vòng Quay không có cơ chế giữ chỗ như Trúng Số, và tin
 * này chỉ làm đúng một việc — đưa màn hình về trạng thái mời quét mã.
 */
export async function roiDiQuay(ma: string): Promise<void> {
  const ct = timTheoMaCongKhai(ma);
  if (!ct || ct.troChoi !== "vong_quay") return;
  phat(ma, { loai: "roi-di" });
}

export interface KetQuaVaoChoiQuay {
  ok: boolean;
  nguoiChoiId?: number;
  hoTen?: string;
  loi?: string;
}

/**
 * Bước 1 trên điện thoại: nhận diện phụ huynh TRƯỚC khi cho quay.
 *
 * 🔴 Form họ tên + SĐT chạy TRƯỚC ván chơi, không phải sau. Màn không-trúng
 * không tặng gì cả, nên để form sau ván là người không trúng bỏ đi và ta mất
 * luôn thông tin — trong khi đó chính là thứ chương trình này tồn tại để thu.
 *
 * 🔴 Gọi thẳng `nhanDienNguoiChoi` của app đích chứ KHÔNG viết lại: hàm đó đã
 * lo phân giải cơ sở và **sinh khách tiềm năng**. Viết một đường nhận diện thứ
 * hai là dựng một kho khách thứ hai — đúng thứ ADR-011 gộp app để xoá bỏ.
 */
export async function vaoChoiVongQuay(
  ma: string,
  hoTen: string,
  soDienThoai: string,
  dongYTuVan: boolean,
  coSoKhai: number | null = null,
): Promise<KetQuaVaoChoiQuay> {
  const ct = timTheoMaCongKhai(ma);
  if (!ct || ct.troChoi !== "vong_quay") return { ok: false, loi: T.phoneEnded };
  if (ct.trangThai !== "dang_chay") return { ok: false, loi: T.phoneEnded };

  const kq = await nhanDienNguoiChoi(ma, hoTen, soDienThoai, dongYTuVan, coSoKhai);
  if (!kq.ok || kq.nguoiChoiId == null) return { ok: false, loi: kq.loi };

  // 🔴 Kiểm giới hạn SAU khi đã nhận diện, không phải trước: phải biết đây là AI
  // thì mới đếm được lượt của họ. Và hồ sơ vẫn được ghi kể cả khi hết lượt —
  // người đã tới quầy thì thông tin của họ vẫn có giá trị.
  if (!conLuotHomNay(ct.id, kq.nguoiChoiId)) {
    // 🔴 `nhanDienNguoiChoi` đã phát `vao-choi` trước khi tới đây, nên màn LCD
    // đang hiện tên người này. Hết lượt mà không trả màn về mã QR là để nó treo
    // tên một người sắp bỏ đi, và người kế tiếp không quét được.
    phat(ma, { loai: "roi-di" });
    return { ok: false, loi: T.quayHetLuot };
  }

  return { ok: true, nguoiChoiId: kq.nguoiChoiId, hoTen };
}

"use server";

import { LCD_RESULT_SECONDS } from "@/config/game";
import { T } from "@/config/locale";
import { nhipCua } from "@/lib/chon-so/vong-so";
import { doiTrangThai, timTheoMaCongKhai } from "@/lib/chuong-trinh/kho";
import { soConLai, type KeoChonSo } from "@/lib/tro-choi/luat-chon-so";
import { luatCua } from "@/lib/tro-choi/luat";
import { phat } from "@/lib/dong-bo/tram-phat";
import { kiemGioiHan } from "@/lib/luot/gioi-han";
import { batDauLuot, dungLuot, type ThietBiBam } from "@/lib/luot/luot-service";
import { nhanDien, tenRutGon } from "@/lib/nguoi-choi/nhan-dien";
import { sinhLead } from "@/lib/lead/kho";
import { timCoSo } from "@/lib/co-so/kho";
import { giaHanCho, giuCho, nhaCho, nhaChoBatKe, type LoaiCho } from "@/lib/phien/giu-cho";

/**
 * Cửa vào duy nhất cho mọi thao tác của một ván chơi.
 *
 * Máy khách KHÔNG được tự ghi cơ sở dữ liệu; nó chỉ gọi mấy hàm ở đây, và mọi
 * luật (giữ chỗ, ai bấm trước, số mili-giây có hợp lý không) đều nằm phía máy chủ.
 */

export interface TraLoiGiuCho {
  duoc: boolean;
  conBanBao?: number;
  /**
   * VÌ SAO cần: trước đây `duoc: false` dùng chung cho hai ca hoàn toàn khác
   * nhau, nên màn "Chưa chơi được" luôn hiển thị sai một trong hai — phụ huynh
   * đọc "màn hình đang có người chơi" trong khi thật ra chẳng có ai.
   */
  lyDo?: "da-ket-thuc" | "dang-ban";
  /** Có sẵn để màn hình vẽ ngay mà không phải gọi thêm lượt nữa. */
  soTrung?: number;
  tenTrungTam?: string;
  tenGiaiThuong?: string;
}

export async function xinCho(
  ma: string,
  loai: LoaiCho,
  token: string,
): Promise<TraLoiGiuCho> {
  const ct = timTheoMaCongKhai(ma);
  if (!ct || ct.trangThai !== "dang_chay") return { duoc: false, lyDo: "da-ket-thuc" };

  // 🔴 Chế độ ONLINE KHÔNG giữ chỗ. Giữ chỗ sinh ra vì "một màn hình LCD chỉ
  // chiếu được một ván"; chơi online thì mỗi người một màn hình của chính họ,
  // và một hàng đợi ở đây nghĩa là quảng cáo kéo về 50 người thì 49 người thấy
  // câu "đang có người chơi" rồi bỏ đi.
  if (ct.cheDo === "online") {
    return {
      duoc: true,
      soTrung: ct.soTrung,
      tenTrungTam: ct.tenTrungTam,
      tenGiaiThuong: ct.tenGiaiThuong,
    };
  }

  const kq = giuCho(ma, loai, token);
  if (!kq.duoc) return { duoc: false, lyDo: "dang-ban", conBanBao: kq.conBanBao };

  if (loai === "nguoi_choi") {
    phat(ma, { loai: "nguoi-choi-vao", tenRutGon: "" });
  }
  return {
    duoc: true,
    soTrung: ct.soTrung,
    tenTrungTam: ct.tenTrungTam,
    tenGiaiThuong: ct.tenGiaiThuong,
  };
}

export async function giaHan(ma: string, loai: LoaiCho, token: string): Promise<boolean> {
  return giaHanCho(ma, loai, token);
}

export async function roiDi(ma: string, loai: LoaiCho, token: string): Promise<void> {
  if (nhaCho(ma, loai, token) && loai === "nguoi_choi") {
    phat(ma, { loai: "roi-di" });
  }
}

export interface TraLoiMoLuot {
  ok: boolean;
  luotId?: number;
  /** Ván mà lần bấm này thuộc về — máy khách giữ để bấm tiếp đúng ván. */
  vanId?: number;
  lanThu?: number;
  soLanChoPhep?: number;
  batDauLuc?: number;
  /** Giờ máy chủ lúc trả lời — máy khách dùng để canh lại đồng hồ. */
  gioMayChu?: number;
  loi?: string;
  /** Hết quà trong ngày: vẫn chơi được, nhưng không còn giải để trao. */
  chiVui?: boolean;
}

export async function moLuot(
  ma: string,
  nguoiChoiId: number | null,
  vanIdMuonTiep: number | null = null,
  coSoDaPhanGiai: number | null = null,
): Promise<TraLoiMoLuot> {
  const ct = timTheoMaCongKhai(ma);
  if (!ct || ct.trangThai !== "dang_chay") return { ok: false, loi: T.phoneEnded };

  const gioiHan = kiemGioiHan(ct.id, nguoiChoiId, ct.tranGiaiMoiNgay);
  if (!gioiHan.choPhep) return { ok: false, loi: gioiHan.lyDo, chiVui: gioiHan.chiVui };

  // Luật của game có quyền chặn trước cả khi mở lượt. Hỏi ở ĐÂY chứ không chỉ
  // trong `batDauLuot`, vì chỗ này là nơi duy nhất còn cầm được CÂU LỖI để đưa
  // lên màn hình — `batDauLuot` chỉ trả null.
  if (ct.troChoi === "chon_so") {
    const truoc = luatCua("chon_so").truocKhiMo(ct);
    if (truoc.loi !== undefined) {
      // Hết sạch số thì đóng chương trình luôn, và báo cho cả phòng biết. Để nó
      // "đang chạy" trong khi không còn số nào là mời người tiếp theo quét mã
      // rồi mới nói không.
      if (truoc.loi === T.chonSoHetSo && ct.trangThai === "dang_chay") {
        doiTrangThai(ma, "ket_thuc");
        phat(ma, { loai: "trang-thai", dangChay: false });
      }
      return { ok: false, loi: truoc.loi };
    }
  }

  const luot = batDauLuot(ma, nguoiChoiId, vanIdMuonTiep, coSoDaPhanGiai);
  if (!luot) return { ok: false };

  // Hai game phát hai loại tin khác nhau. Đây là tầng PHÁT TIN, không phải tầng
  // chấm điểm — chấm điểm đã gom vào một lớp luật duy nhất ở `lib/tro-choi`.
  if (ct.troChoi === "chon_so") {
    const keo = luot.keo as KeoChonSo | undefined;
    phat(ma, {
      loai: "bat-dau-chon-so",
      luotId: luot.luotId,
      batDauLuc: luot.batDauLuc,
      nhip: nhipCua({ tu: ct.daiTu, den: ct.daiDen }),
      dai: keo?.dai ?? { tu: ct.daiTu, den: ct.daiDen },
      daRa: keo?.daRa ?? [],
    });
  } else {
    phat(ma, {
      loai: "bat-dau",
      luotId: luot.luotId,
      batDauLuc: luot.batDauLuc,
      thamSo: luot.thamSo,
    });
  }
  return {
    ok: true,
    luotId: luot.luotId,
    vanId: luot.vanId,
    lanThu: luot.lanThu,
    soLanChoPhep: luot.soLanChoPhep,
    batDauLuc: luot.batDauLuc,
    gioMayChu: Date.now(),
    chiVui: gioiHan.chiVui,
  };
}

export interface TraLoiNhanDien {
  ok: boolean;
  nguoiChoiId?: number;
  /** Cơ sở ĐÃ PHÂN GIẢI — máy khách giữ để ghi vào ván, không tự khai lại. */
  coSoId?: number;
  tenRutGon?: string;
  loi?: string;
}

/**
 * Cơ sở của ván này là cơ sở nào.
 *
 * 🔴 `gan_san`: LUÔN lấy cơ sở của chương trình, KHÔNG bao giờ nhận từ máy
 * khách — nhận là để người ta tự khai mình thuộc cơ sở nào, và mọi báo cáo
 * "lead theo cơ sở" thành vô nghĩa.
 * `phu_huynh_chon`: bắt buộc chọn, và cơ sở đó phải TỒN TẠI và đang BẬT.
 */
function phanGiaiCoSo(
  ct: { coSoId: number | null; nguonCoSo: string },
  coSoKhai: number | null,
): { coSoId: number } | { loi: string } {
  if (ct.nguonCoSo !== "phu_huynh_chon") {
    // 🔴 Chương trình không có cơ sở thì CHẶN, không cho chơi tiếp.
    //
    // Cho chơi mà bỏ qua việc tạo khách tiềm năng nghe có vẻ tử tế hơn với
    // người đang đứng trước mặt, nhưng nó âm thầm vứt MỌI khách của cả buổi
    // chiều và không ai biết. Chặn thì lỗi cấu hình lộ ra trong một phút và
    // nhân viên sửa được ngay — câu báo dưới đây nói thẳng phải làm gì.
    return ct.coSoId === null ? { loi: T.onlineChuaGanCoSo } : { coSoId: ct.coSoId };
  }
  if (coSoKhai === null) return { loi: T.onlineThieuCoSo };
  const cs = timCoSo(coSoKhai);
  if (!cs || cs.trangThai !== "bat") return { loi: T.onlineCoSoSai };
  return { coSoId: cs.id };
}

/**
 * Bước 1 trên điện thoại: nhận diện phụ huynh trước khi cho chơi.
 *
 * 🔴 Khách tiềm năng sinh NGAY TẠI ĐÂY — trước cả khi biết người này có được
 * chơi hay không. Người bị luật "1 ván/ngày" chặn thì ĐÃ ĐƯA SỐ RỒI, và họ
 * chính là nhóm quay lại lần thứ hai, tức nhóm quan tâm nhất. Chỉ tạo lead khi
 * chơi thành công là tự tay vứt đúng nhóm đó đi.
 */
export async function nhanDienNguoiChoi(
  ma: string,
  hoTen: string,
  soDienThoai: string,
  dongYTuVan: boolean,
  coSoKhai: number | null = null,
): Promise<TraLoiNhanDien> {
  const ct = timTheoMaCongKhai(ma);
  if (!ct) return { ok: false, loi: T.phoneEnded };

  const coSo = phanGiaiCoSo(ct, coSoKhai);
  if ("loi" in coSo) return { ok: false, loi: coSo.loi };

  const kq = nhanDien(hoTen, soDienThoai, dongYTuVan);
  if (!kq.nguoiChoi) return { ok: false, loi: kq.loi };

  // Số của người chơi online là số họ TỰ GÕ, chưa có mã xác minh nào (xem N.9).
  sinhLead(coSo.coSoId, kq.nguoiChoi.id, ct.id, ct.cheDo === "online");

  return {
    ok: true,
    nguoiChoiId: kq.nguoiChoi.id,
    coSoId: coSo.coSoId,
    tenRutGon: tenRutGon(kq.nguoiChoi.hoTen),
  };
}

export interface TraLoiChotLuot {
  ok: boolean;
  soDaDung?: number;
  trung?: boolean;
  khoangLech?: number;
  hetGio?: boolean;
  maXacThuc?: string;
  /** Ván đã chốt hẳn chưa, và nếu chưa thì còn mấy lần bấm. */
  vanXong?: boolean;
  conLan?: number;
  lanDaDung?: number;
  soLanChoPhep?: number;
  lechTotNhat?: number | null;
  soTotNhat?: number | null;
  tenQuaTang?: string | null;
}

/**
 * Chốt ván. Trả `ok: false` khi máy kia bấm trước — nơi gọi cứ im lặng chờ tin
 * `ket-qua` từ kênh đồng bộ, KHÔNG báo lỗi cho người chơi.
 */
export async function chotLuot(
  ma: string,
  luotId: number,
  soMiliGiayDaTroi: number,
  thietBi: ThietBiBam,
): Promise<TraLoiChotLuot> {
  const kq = dungLuot(luotId, soMiliGiayDaTroi, thietBi);
  if (!kq) return { ok: false };

  const ct = timTheoMaCongKhai(ma);

  // Nhả chỗ NGAY khi VÁN chốt hẳn: giữ thêm hai phút nữa thì người đang xếp
  // hàng phía sau quét mã chỉ thấy "đang có người chơi" mà chẳng hiểu vì sao.
  // Ván còn lần bấm thì PHẢI giữ — nhả giữa ván là người khác chen vào và
  // người đang chơi mất nốt hai lần bấm còn lại.
  // Chế độ online không có chỗ nào để mà nhả.
  if (kq.van.vanXong && ct?.cheDo !== "online") nhaChoBatKe(ma, "nguoi_choi");

  if (ct?.troChoi === "chon_so") {
    phat(ma, {
      loai: "ket-qua-chon-so",
      luotId: kq.luotId,
      so: kq.value,
      maXacThuc: kq.maXacThuc,
      tenRutGon: "",
      conLai: soConLai(ct),
      giayXemKetQua: LCD_RESULT_SECONDS.win,
    });
    return {
      ok: true,
      soDaDung: kq.value,
      trung: false,
      maXacThuc: kq.maXacThuc,
      vanXong: true,
      conLan: 0,
      lanDaDung: 1,
      soLanChoPhep: 1,
    };
  }

  // LUÔN phát, kể cả giữa ván — xem chú thích `vanXong` ở `kenh.ts`.
  phat(ma, {
    loai: "ket-qua",
    luotId: kq.luotId,
    soDaDung: kq.value,
    trung: kq.win,
    khoangLech: kq.distance,
    hetGio: kq.timedOut,
    maXacThuc: kq.maXacThuc,
    tenRutGon: "",
    // Tên quà THẬT ĐÃ BỐC, không phải tên giải khai lúc tạo chương trình:
    // kho nhiều loại thì hai người trúng nhận hai thứ khác nhau, và màn hình
    // phải nói đúng thứ nhân viên sắp đưa cho họ. Chưa khai kho thì rơi về tên
    // giải cũ — chương trình từ v1 vẫn chạy y như trước.
    tenGiaiThuong: kq.van.tenQuaTang ?? ct?.tenGiaiThuong ?? "",
    giayXemKetQua: kq.win ? LCD_RESULT_SECONDS.win : LCD_RESULT_SECONDS.lose,
    vanXong: kq.van.vanXong,
    lanDaDung: kq.van.soLanDaDung,
    soLanChoPhep: kq.van.soLanDaDung + kq.van.conLan,
    lechTotNhat: kq.van.lechTotNhat,
    soTotNhat: kq.van.soTotNhat,
  });

  return {
    ok: true,
    soDaDung: kq.value,
    trung: kq.win,
    khoangLech: kq.distance,
    hetGio: kq.timedOut,
    maXacThuc: kq.maXacThuc,
    vanXong: kq.van.vanXong,
    conLan: kq.van.conLan,
    lanDaDung: kq.van.soLanDaDung,
    soLanChoPhep: kq.van.soLanDaDung + kq.van.conLan,
    lechTotNhat: kq.van.lechTotNhat,
    soTotNhat: kq.van.soTotNhat,
    tenQuaTang: kq.van.tenQuaTang,
  };
}

/*
 * ĐÃ GỠ `quanTamHocThu` (01/09/2026 — GĐ 8.1).
 *
 * Nút "NHẬN BUỔI HỌC THỬ" ở màn thua bị bỏ vì không trúng thì không nhận quà.
 * Nhưng gỡ nút KHÔNG đủ: mọi hàm export trong file "use server" là một endpoint
 * HTTP công khai có action-id ổn định. Để lại `quanTamHocThu(id: number)` mà
 * không còn giao diện nghĩa là ai cũng POST được id bất kỳ để bật cờ quan tâm
 * cho bất kỳ phụ huynh nào. Hàm thư viện `danhDauQuanTamHocThu` thì GIỮ — nó
 * không phải endpoint, và màn "nhân viên đánh dấu tại quầy" sau này cần tới.
 */

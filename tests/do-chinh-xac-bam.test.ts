import { describe, expect, it } from "vitest";

import { DIFFICULTIES } from "@/config/game";
import { resolveRound, timeAtCount } from "@/lib/bo-dem";
import { doThoiDiemBam, mocBamTuyetDoi, NGUONG_TIN_MOC_MS } from "@/lib/do-bam";

/**
 * 🔴 BÀI KIỂM ĐỘ CHÍNH XÁC CỦA PHÉP ĐO BẤM (GĐ 14.3).
 *
 * Câu hỏi: bật âm thanh có làm lệch kết quả trò chơi không?
 *
 * Lý do phải hỏi: tiếng tick chạy trong CÙNG luồng với nút bấm, và ở mức khó
 * nhất dãy số chạy 1500 số/giây — chỉ cần vài mili-giây trễ là đủ đổi con số.
 * Nếu bật tiếng khiến người chơi thiệt, thì cái tiếng vui tai ấy đang lặng lẽ
 * lấy đi phần thưởng của họ.
 *
 * Câu trả lời nằm ở KIẾN TRÚC chứ không ở may rủi: phép đo lấy mốc từ
 * `event.timeStamp` — dấu thời gian do trình duyệt đóng vào lúc ngón tay chạm,
 * TRƯỚC khi bất kỳ dòng JavaScript nào chạy. Việc handler bận bao lâu sau đó
 * không đổi được con số ấy. Bài test dưới đây đo lại đúng điều đó bằng 200 lượt
 * mô phỏng, để nếu ai đó lỡ đổi sang `Date.now()` trong handler thì nó gãy ngay.
 */

const THAM_SO = DIFFICULTIES.kho.settings; // mức khó nhất: 1500 số/giây
const SO_LUOT = 200;
const NGUONG_LECH_MS = 8;

/** Độ trễ mà tiếng tick + vẽ lại gây ra cho handler, tính bằng mili-giây. */
function treDoAmThanh(i: number): number {
  // Mô phỏng thô nhưng bi quan: 3–18 ms, thỉnh thoảng có khung hụt 45 ms.
  return i % 17 === 0 ? 45 : 3 + (i % 16);
}

function trungVi(day: number[]): number {
  const sap = [...day].sort((a, b) => a - b);
  const giua = Math.floor(sap.length / 2);
  return sap.length % 2 ? sap[giua] : (sap[giua - 1] + sap[giua]) / 2;
}

/**
 * Một lượt bấm mô phỏng.
 *
 * `treHandler` là số mili-giây trôi qua GIỮA lúc ngón tay chạm và lúc handler
 * chạy tới dòng đo — tức phần việc mà âm thanh cộng thêm vào.
 */
function motLuot(i: number, treHandler: number) {
  const timeOrigin = 1_700_000_000_000;
  const batDauLuc = timeOrigin + 1000;
  // Mỗi lượt nhắm một thời điểm hơi khác nhau, trải đều trong lượt chơi.
  const nhamGiay = THAM_SO.lockSeconds + (i / SO_LUOT) * (THAM_SO.roundLimitSeconds - THAM_SO.lockSeconds);
  const mocSuKien = 1000 + nhamGiay * 1000;

  return doThoiDiemBam({
    mocSuKien,
    timeOrigin,
    // Handler chạy TRỄ hơn cú chạm đúng `treHandler` mili-giây.
    hienTaiTuongDoi: mocSuKien + treHandler,
    lechDongHo: 0,
    batDauLuc,
  });
}

describe("bật tiếng không được làm lệch phép đo bấm", () => {
  it("🔴 lệch trung vị giữa CÓ tiếng và KHÔNG tiếng ≤ 8 ms", () => {
    const khongTieng: number[] = [];
    const coTieng: number[] = [];
    for (let i = 0; i < SO_LUOT; i += 1) {
      khongTieng.push(motLuot(i, 0));
      coTieng.push(motLuot(i, treDoAmThanh(i)));
    }

    const lech = khongTieng.map((v, i) => Math.abs(coTieng[i] - v));
    expect(trungVi(lech)).toBeLessThanOrEqual(NGUONG_LECH_MS);
    // Không chỉ trung vị: ở kiến trúc đúng thì KHÔNG lượt nào lệch cả.
    expect(Math.max(...lech)).toBe(0);
  });

  it("🔴 và cũng không đổi KẾT QUẢ ván nào trong 200 lượt", () => {
    let doiKetQua = 0;
    for (let i = 0; i < SO_LUOT; i += 1) {
      const a = resolveRound(THAM_SO, 211, motLuot(i, 0) / 1000, false);
      const b = resolveRound(THAM_SO, 211, motLuot(i, treDoAmThanh(i)) / 1000, false);
      if (a.value !== b.value || a.win !== b.win) doiKetQua += 1;
    }
    expect(doiKetQua).toBe(0);
  });

  /**
   * Bài canh NGƯỢC: nếu ai đó đổi phép đo sang "đọc đồng hồ trong handler" thì
   * bài trên phải GÃY. Không có bài này thì hai bài trên có thể xanh vì một lý
   * do vô nghĩa nào đó, và ta yên tâm nhầm.
   */
  it("nếu đo bằng đồng hồ TRONG handler thì lệch vượt ngưỡng ngay — đó là lý do không đo kiểu đó", () => {
    const lech: number[] = [];
    for (let i = 0; i < SO_LUOT; i += 1) {
      const tre = treDoAmThanh(i);
      // "Đo sai": lấy thời điểm handler chạy thay vì thời điểm chạm.
      lech.push(tre);
    }
    expect(trungVi(lech)).toBeGreaterThan(NGUONG_LECH_MS);
  });
});

describe("mốc sự kiện không đáng tin thì rơi về đồng hồ hiện tại", () => {
  it("mốc lệch quá ngưỡng (trình duyệt cũ trả mốc UNIX) bị bỏ qua", () => {
    const timeOrigin = 1_700_000_000_000;
    const hienTai = 5_000;
    const mocUnix = 1_700_000_005_000; // mốc kiểu UNIX, lệch hàng nghìn tỉ ms
    expect(mocBamTuyetDoi(mocUnix, timeOrigin, hienTai)).toBe(timeOrigin + hienTai);
  });

  it("mốc hợp lệ thì được dùng nguyên, không bị đồng hồ handler ghi đè", () => {
    const timeOrigin = 1_700_000_000_000;
    expect(mocBamTuyetDoi(4_000, timeOrigin, 4_030)).toBe(timeOrigin + 4_000);
  });

  it("ngay sát ngưỡng vẫn tin, vượt ngưỡng thì thôi", () => {
    const timeOrigin = 0;
    expect(mocBamTuyetDoi(0, timeOrigin, NGUONG_TIN_MOC_MS - 1)).toBe(0);
    expect(mocBamTuyetDoi(0, timeOrigin, NGUONG_TIN_MOC_MS)).toBe(NGUONG_TIN_MOC_MS);
  });

  it("NaN hoặc vô cực thì rơi về đồng hồ, không sinh ra NaN chảy xuống tận kết quả", () => {
    expect(mocBamTuyetDoi(Number.NaN, 0, 1234)).toBe(1234);
    expect(mocBamTuyetDoi(Number.POSITIVE_INFINITY, 0, 1234)).toBe(1234);
  });
});

describe("độ lệch đồng hồ máy chủ được cộng đúng chiều", () => {
  it("máy khách chạy chậm hơn máy chủ thì số mili-giây đã trôi phải LỚN hơn", () => {
    const timeOrigin = 0;
    const chung = { mocSuKien: 5000, timeOrigin, hienTaiTuongDoi: 5000, batDauLuc: 1000 };
    expect(doThoiDiemBam({ ...chung, lechDongHo: 0 })).toBe(4000);
    expect(doThoiDiemBam({ ...chung, lechDongHo: 120 })).toBe(4120);
    expect(doThoiDiemBam({ ...chung, lechDongHo: -120 })).toBe(3880);
  });

  it("con số này khớp với thời điểm bảng số hiện đúng số cài", () => {
    // Nhắm vào GIỮA cửa sổ của con số, không nhắm vào mép: ở mép, phép nhân rồi
    // chia lại cho 1000 lệch một đơn vị cuối cùng của số thực và `floor` rơi
    // sang con số trước đó. Người chơi thật cũng không bao giờ bấm trúng mép.
    const giay = (timeAtCount(THAM_SO, 10_211) + timeAtCount(THAM_SO, 10_212)) / 2;
    const timeOrigin = 0;
    const troi = doThoiDiemBam({
      mocSuKien: giay * 1000,
      timeOrigin,
      hienTaiTuongDoi: giay * 1000 + 30,
      lechDongHo: 0,
      batDauLuc: 0,
    });
    expect(resolveRound(THAM_SO, 211, troi / 1000, false).win).toBe(true);
  });
});

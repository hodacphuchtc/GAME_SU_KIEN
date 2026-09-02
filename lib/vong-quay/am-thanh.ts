/**
 * ÂM THANH VÒNG QUAY — tổng hợp bằng Web Audio, KHÔNG một tệp nhạc nào.
 *
 * Vì sao tự tổng hợp: kho nhạc và hiệu ứng sẵn có ngoài kia đều là tác phẩm có
 * bản quyền, mà một cái quầy chạy suốt ngày trong trung tâm thương mại là dùng
 * THƯƠNG MẠI — không có ngoại lệ "dùng cho vui" nào che được. Sinh tiếng bằng
 * bộ dao động cũng giữ đúng luật TỰ CHỨA của app: không thêm tệp vào `public/`,
 * không tải gì lúc chạy, mạng yếu vẫn kêu.
 *
 * 🔴 File chia làm HAI NỬA, cố ý không trộn:
 *
 *   1. **NHỊP** (`mocTick`, `giayTaiGoc`) — hàm THUẦN, suy thẳng ra từ `goc(t)`.
 *      Không đụng trình duyệt nên chạy được trong `vitest` môi trường `node`, và
 *      đó là điều kiện để kiểm được thứ sổ đòi: tick chậm dần ĐÚNG THEO vòng quay.
 *   2. **MÁY PHÁT** (`MayAmThanh`) — nơi DUY NHẤT chạm `AudioContext`, và mọi
 *      lần chạm đều nằm trong thân hàm. Không một dòng nào ở tầng module: file
 *      này bị `import` cả ở test lẫn phía máy chủ, nơi không hề có `window`.
 *
 * 🔴 Vì sao nhịp phải SUY RA từ `goc(t)` chứ không phải một dãy giảm dần tự chế:
 * hai thứ đó chắc chắn trôi khỏi nhau. Vòng chạy theo `1 − (1−x)³`; một nhịp
 * "gần giống" thì tới giây thứ tư tai còn nghe tách trong khi mắt đã thấy kim
 * nằm im — đúng cái làm người xem nghi vòng quay bị dàn xếp. Ở đây mốc tick là
 * NGHIỆM CHÍNH XÁC của phương trình `goc(t) = mép cung`, nên lệch là không thể.
 */

import { MU_GIAM_TOC } from "@/config/vong-quay";
import type { Cung } from "@/lib/vong-quay/chia-o";
import { chuanHoaGoc, tongGocQuay } from "@/lib/vong-quay/goc";

/* ------------------------------------------------------------------------- *
 * NỬA 1 — NHỊP TICK (thuần, kiểm được)
 * ------------------------------------------------------------------------- */

/**
 * Hai tiếng tách gần nhau hơn ngần này thì tai không tách nổi nữa — nó hoà
 * thành một tiếng rè, đúng thứ tai nghe được ở một vòng quay thật đang lao
 * nhanh. Ngưỡng còn để chặn việc xếp lịch hàng nghìn bộ dao động vô ích.
 *
 * 🔴 Đây là ngưỡng KỸ THUẬT của âm thanh (giới hạn của tai + của trình duyệt),
 * KHÔNG phải ngưỡng nghiệp vụ — nên nó ở đây chứ không ở `config/vong-quay.ts`.
 * Sửa nó không đổi ai nhận quà gì.
 */
export const GIAY_TICK_TOI_THIEU = 0.012;

/**
 * Trần phòng thân cho số mốc THÔ sinh ra trước khi lọc.
 *
 * Với `SO_O_TOI_DA = 12` và `VONG_TOI_THIEU = 4` thì con số thật chỉ khoảng 60.
 * Trần này chỉ để một danh sách cung dị dạng (nghìn phần tử) không kéo trình
 * duyệt đứng hình giữa lúc có phụ huynh đứng trước màn hình.
 */
const TOI_DA_MOC_THO = 4000;

/** Sai số dấu phẩy động khi so hai mép cung — dưới ngần này coi là một mép. */
const SAI_SO = 1e-9;

/**
 * Chỉ cần đúng hai trường này của `Cung`, nên nhận thẳng được kết quả
 * `chiaCung()` mà không buộc nơi gọi phải dựng cả đối tượng ô quà.
 */
export type CungTick = Readonly<Pick<Cung, "tu" | "doRong">>;

export interface MocTick {
  /** Thời điểm phát tiếng, giây kể từ lúc bắt đầu quay. */
  giay: number;
  /** Góc TUYỆT ĐỐI đã quay được tại mốc đó (cộng dồn cả mấy vòng đầu). */
  gocTuyetDoi: number;
  /** Mép cung trong [0,360) mà kim vừa đi qua. */
  mep: number;
  /**
   * Bề rộng (độ) của cung vừa đi HẾT để tới mép này — không phải cung sắp vào.
   *
   * Đây là số chia để ra "nhịp trên mỗi độ", tức nghịch đảo vận tốc. Mặt vòng
   * có cung rộng cung hẹp thì nhịp thô nhấp nhô theo bề rộng; chia cho nó mới
   * nhìn ra được đường chậm dần thật sự.
   */
  doRongVuaQua: number;
  /** `giay / thoiLuong`, trong [0,1] — dùng để hạ dần cao độ tiếng tách. */
  tienDo: number;
}

/**
 * NGHỊCH ĐẢO của `goc()`: quay được `gocTuyetDoi` độ thì lúc đó là giây thứ mấy.
 *
 * `goc(t) = tong · (1 − (1 − t/T)ⁿ)` giải ngược ra
 * `t = T · (1 − (1 − goc/tong)^(1/n))`. Vì `goc` đơn điệu tăng nên nghiệm là
 * duy nhất — không có chuyện một góc ứng với hai thời điểm.
 *
 * 🔴 Giải NGƯỢC chứ không dò từng khung hình: dò thì độ chính xác phụ thuộc tần
 * số quét của đúng cái máy đang chạy, và màn LCD 60Hz sẽ tick lệch với điện
 * thoại 120Hz dù cả hai cùng nhìn một ván.
 */
export function giayTaiGoc(
  gocTuyetDoi: number,
  gocDich: number,
  thoiLuong: number,
): number {
  const tong = tongGocQuay(gocDich);
  if (!(thoiLuong > 0) || !(tong > 0)) return 0;
  if (!(gocTuyetDoi > 0)) return 0;
  if (gocTuyetDoi >= tong) return thoiLuong;
  return thoiLuong * (1 - Math.pow(1 - gocTuyetDoi / tong, 1 / MU_GIAM_TOC));
}

/**
 * Danh sách mép cung, đã chuẩn hoá về [0,360), sắp tăng dần và gộp trùng.
 *
 * Gộp trùng vì một cung bề rộng 0 (cấu hình hỏng) sẽ đẻ ra hai mép chồng nhau,
 * và hai tiếng tách phát cùng một mốc chỉ nghe thành một tiếng to gấp đôi.
 */
function mepCung(cung: readonly CungTick[]): number[] {
  const tho: number[] = [];
  for (const c of cung) {
    const b = chuanHoaGoc(c.tu);
    if (Number.isFinite(b)) tho.push(b);
  }
  tho.sort((a, b) => a - b);

  const gon: number[] = [];
  for (const b of tho) {
    if (gon.length === 0 || b - gon[gon.length - 1] > SAI_SO) gon.push(b);
  }
  // Mép sát 360 CHÍNH LÀ mép 0 của vòng kế tiếp. Giữ cả hai là hai tiếng tách
  // dính nhau ngay chỗ giao vòng, cứ mỗi vòng một lần.
  if (gon.length > 1 && 360 - gon[gon.length - 1] <= SAI_SO && gon[0] <= SAI_SO) {
    gon.pop();
  }
  return gon;
}

/**
 * Mọi thời điểm kim đi qua một mép cung, trong trọn cú quay.
 *
 * Cách làm: mặt vòng có các mép `b` trong [0,360); kim đi qua mép đó ở MỌI vòng,
 * tức tại các góc tuyệt đối `360k + b`. Với từng góc ấy, `giayTaiGoc` cho ra
 * đúng giây phát tiếng. Nhịp chậm dần không phải do ai lập trình cho nó chậm —
 * nó chậm vì `goc(t)` chậm, và đó là toàn bộ ý đồ.
 *
 * 🔴 Lọc theo `GIAY_TICK_TOI_THIEU` được làm bằng cách CẮT ĐẦU, không phải bỏ
 * bớt ở giữa: bỏ giữa thì hai tiếng bị gộp tạo ra một khoảng dài rồi ngay sau
 * đó là một khoảng ngắn — nhịp đang chậm dần bỗng nhanh trở lại, tai bắt được
 * ngay. Cắt đầu thì phần giữ lại là một ĐOẠN LIỀN của dãy gốc, nên giữ nguyên
 * tính chậm dần. Giá phải trả: đoạn đầu (lúc vòng còn là một vệt mờ) im tiếng.
 *
 * Không bao giờ ném lỗi và luôn dừng: vòng rỗng, thời lượng 0 hay âm đều trả
 * mảng rỗng. Đây là mã chạy giữa lúc có phụ huynh đứng trước màn hình.
 */
export function mocTick(
  gocDich: number,
  thoiLuong: number,
  cung: readonly CungTick[],
): MocTick[] {
  const tong = tongGocQuay(gocDich);
  if (!(thoiLuong > 0) || !(tong > 0)) return [];

  const mep = mepCung(cung);
  if (mep.length === 0) return [];

  const tho: MocTick[] = [];
  const soVong = Math.ceil(tong / 360);

  for (let k = 0; k <= soVong && tho.length < TOI_DA_MOC_THO; k++) {
    for (let j = 0; j < mep.length; j++) {
      const gocTuyetDoi = k * 360 + mep[j];
      // Mốc 0 không phải một tiếng tách: lúc đó kim chưa đi qua gì cả.
      if (gocTuyetDoi <= 0) continue;
      if (gocTuyetDoi > tong) break;

      // Cung vừa đi hết là khoảng giữa mép này và mép LIỀN TRƯỚC nó trên vòng —
      // mép trước của mép đầu tiên nằm ở vòng trước, nên phải vòng ngược lại.
      const doRongVuaQua =
        mep.length === 1
          ? 360
          : j > 0
            ? mep[j] - mep[j - 1]
            : mep[0] + 360 - mep[mep.length - 1];

      const giay = giayTaiGoc(gocTuyetDoi, gocDich, thoiLuong);
      tho.push({
        giay,
        gocTuyetDoi,
        mep: mep[j],
        doRongVuaQua,
        tienDo: giay / thoiLuong,
      });
      if (tho.length >= TOI_DA_MOC_THO) break;
    }
  }

  // Vi phạm CUỐI CÙNG ở đâu thì cắt từ đó trở về trước. Khoảng của mốc đầu tiên
  // tính từ lúc bắt đầu quay (giây 0), vì đó cũng là một khoảng im mà tai nghe.
  let catToi = 0;
  for (let i = 0; i < tho.length; i++) {
    const khoang = tho[i].giay - (i > 0 ? tho[i - 1].giay : 0);
    if (khoang < GIAY_TICK_TOI_THIEU) catToi = i + 1;
  }
  return tho.slice(catToi);
}

/* ------------------------------------------------------------------------- *
 * NỬA 2 — MÁY PHÁT (nơi duy nhất chạm AudioContext)
 * ------------------------------------------------------------------------- */

/**
 * Một tệp WAV hợp lệ, 44 byte, KHÔNG có khung âm thanh nào.
 *
 * Chép từ `../../app/lib/am-thanh.ts` @ `3d96358` (app Trúng Số) — theo luật
 * "tái dùng giữa hai app = chép tay có ghi nguồn, cấm import xuyên".
 *
 * 🔴 Vì sao cần: trên iPhone, Web Audio chạy trong phiên âm thanh "ambient", mà
 * phiên đó bị CÔNG TẮC GẠT IM LẶNG ở cạnh máy tắt sạch — im hoàn toàn, không
 * một dòng lỗi nào. Phát một `HTMLAudioElement` ngay trong cú chạm của người
 * dùng đẩy phiên sang "playback", và từ đó Web Audio kêu cả khi máy đang gạt im.
 * Đừng tự sinh lại chuỗi này — sai một byte là tệp hỏng và iOS lặng lẽ bỏ qua.
 */
const WAV_IM_LANG =
  "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAgD4AAAB9AAACABAAZGF0YQAAAAA=";

type TaoContext = typeof AudioContext;

function lopAudioContext(): TaoContext | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & { webkitAudioContext?: TaoContext };
  return window.AudioContext ?? w.webkitAudioContext ?? null;
}

/**
 * Máy phát tiếng của một màn hình.
 *
 * 🔴 Toàn bộ cú quay được XẾP LỊCH TRƯỚC trên đồng hồ của `AudioContext`, ngay
 * lúc bấm QUAY, chứ không phát từng tiếng theo vòng lặp khung hình. Lý do: mốc
 * tick đã là hàm thuần biết trước, còn vòng lặp khung hình thì rớt nhịp mỗi khi
 * trình duyệt bận vẽ — và rớt nhịp ở đây nghe ra ngay thành tiếng vấp. Đồng hồ
 * âm thanh chạy riêng, chính xác tới mẫu, không quan tâm màn hình đang kẹt.
 */
export class MayAmThanh {
  private ctx: AudioContext | null = null;
  private tatTieng = false;
  private daMoKhoaIos = false;
  private dangXep: OscillatorNode[] = [];

  /**
   * Gọi TRONG chính sự kiện chạm/bấm của người dùng, nếu không trình duyệt chặn
   * mọi tiếng động và không báo gì cả.
   */
  moKhoa(): void {
    this.moKhoaIos();

    if (this.ctx) {
      if (this.ctx.state === "suspended") void this.ctx.resume();
      return;
    }
    const Lop = lopAudioContext();
    if (!Lop) return;
    try {
      this.ctx = new Lop();
      // 🔴 Context VỪA TẠO cũng có thể ở trạng thái `suspended` — quên resume ở
      // đây là mất tiếng đúng lần đầu tiên, mà lần đầu tiên chính là cú bấm QUAY.
      if (this.ctx.state === "suspended") void this.ctx.resume();
    } catch {
      // Máy không cho tạo context (chính sách quyền, chế độ riêng tư): chơi
      // không tiếng vẫn hơn là ngã cả trang.
      this.ctx = null;
    }
  }

  /** Đã có context để phát hay chưa — giao diện dùng để hiện đúng trạng thái nút. */
  daSanSang(): boolean {
    return this.ctx !== null;
  }

  /**
   * Tắt tiếng là phải im HẲN, kể cả những tiếng đã xếp lịch từ trước. Không huỷ
   * lịch thì bấm tắt giữa cú quay vẫn còn nghe tách thêm mấy giây.
   */
  datTatTieng(tat: boolean): void {
    this.tatTieng = tat;
    if (tat) this.huyLich();
  }

  dangTatTieng(): boolean {
    return this.tatTieng;
  }

  /**
   * Xếp lịch trọn một cú quay: tiếng tách theo mép cung + tiếng ăn mừng lúc dừng.
   *
   * `daChayGiay` cho màn hình vào xem GIỮA chừng (LCD bật sau, hoặc mạng trễ):
   * nó chỉ xếp phần tiếng còn lại, đúng theo kiến trúc "mỗi máy tự tính theo
   * đồng hồ của mình".
   *
   * Luôn trả về danh sách mốc — kể cả khi đang tắt tiếng — để giao diện còn dùng
   * được cùng một nhịp cho hiệu ứng nhìn.
   */
  datLichQuay(
    gocDich: number,
    thoiLuong: number,
    cung: readonly CungTick[],
    daChayGiay = 0,
  ): MocTick[] {
    const moc = mocTick(gocDich, thoiLuong, cung);
    this.huyLich();

    const ctx = this.ctx;
    if (!ctx || this.tatTieng) return moc;

    const goc0 = ctx.currentTime - Math.max(0, daChayGiay);
    for (const m of moc) {
      if (m.giay < daChayGiay) continue;
      this.tach(m, goc0);
    }
    if (thoiLuong >= daChayGiay) this.anMung(goc0 + thoiLuong);
    return moc;
  }

  /** Dừng mọi tiếng đã xếp lịch mà chưa kịp phát. */
  huyLich(): void {
    for (const osc of this.dangXep) {
      try {
        osc.stop();
      } catch {
        // Nút đã dừng hoặc context đã đóng — không có gì phải dọn thêm.
      }
    }
    this.dangXep = [];
  }

  /**
   * Tiếng ăn mừng lúc vòng dừng: bốn nốt đi lên rồi một hợp âm đóng.
   *
   * Đi LÊN vì đây là màn công bố phần quà; và cố ý không có bản "tiếng thua" —
   * vòng quay này luôn có ô đáy nên không ai ra về tay không.
   */
  anMung(batDauLuc?: number): void {
    const ctx = this.ctx;
    if (!ctx || this.tatTieng) return;
    const t = batDauLuc ?? ctx.currentTime;
    const not = [523.25, 659.25, 783.99, 1046.5];
    not.forEach((tanSo, i) => this.beep(tanSo, 0.26, 0.16, "triangle", t + i * 0.1));
    for (const tanSo of [523.25, 783.99, 1046.5]) {
      this.beep(tanSo, 0.75, 0.11, "triangle", t + 0.42);
    }
  }

  /** Đóng hẳn máy phát. Gọi khi rời trang, nếu không context còn treo lại. */
  dong(): void {
    this.huyLich();
    try {
      void this.ctx?.close();
    } catch {
      // Context đã đóng sẵn — bỏ qua.
    }
    this.ctx = null;
  }

  /**
   * Một tiếng tách.
   *
   * Cao độ TỤT dần theo tiến độ: vòng chậm lại thì tiếng nặng dần, cùng chiều
   * với thứ mắt đang thấy. Cung càng rộng thì tiếng càng chắc — nghe ra được
   * "vừa đi qua một ô to".
   */
  private tach(m: MocTick, goc0: number): void {
    const tanSo = 1250 - 480 * Math.min(1, Math.max(0, m.tienDo));
    const dinh = 0.05 + 0.03 * Math.min(1, m.doRongVuaQua / 60);
    this.beep(tanSo, 0.018, dinh, "square", goc0 + m.giay);
  }

  private beep(
    tanSo: number,
    keoDai: number,
    dinh: number,
    dang: OscillatorType,
    batDauLuc: number,
  ): void {
    const ctx = this.ctx;
    if (!ctx || this.tatTieng) return;
    // Mốc đã trôi qua thì phát ngay, đừng đưa số âm cho `start()` — nó ném lỗi
    // và giết luôn cả vòng lặp đang xếp lịch cho những tiếng còn lại.
    const bd = Math.max(ctx.currentTime, batDauLuc);
    const kt = bd + keoDai;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = dang;
      osc.frequency.setValueAtTime(tanSo, bd);
      // Lên/xuống theo hàm mũ chứ không bật tắt đột ngột: cắt vuông biên độ tạo
      // ra tiếng "cụp" ở hai đầu, nghe như loa bị rè.
      gain.gain.setValueAtTime(0.0001, bd);
      gain.gain.exponentialRampToValueAtTime(dinh, bd + Math.min(0.006, keoDai / 3));
      gain.gain.exponentialRampToValueAtTime(0.0001, kt);
      osc.connect(gain).connect(ctx.destination);
      osc.start(bd);
      osc.stop(kt + 0.02);
      this.dangXep.push(osc);
    } catch {
      // Hết tài nguyên âm thanh hoặc context vừa đóng — mất một tiếng tách thì
      // không sao, ngã cả ván quay thì có.
    }
  }

  /**
   * Đẩy phiên âm thanh của iOS sang "playback". Chỉ chạy MỘT lần: phát lại tệp
   * mồi ở mỗi cú chạm là việc thừa, và trên vài máy còn cắt ngang tiếng đang phát.
   */
  private moKhoaIos(): void {
    if (this.daMoKhoaIos) return;
    this.daMoKhoaIos = true;
    try {
      if (typeof Audio === "undefined") return;
      const the = new Audio(WAV_IM_LANG);
      // Thiếu `playsinline` thì iOS có thể mở trình phát toàn màn hình đè lên
      // vòng quay — người chơi mất luôn màn hình đang xem.
      the.setAttribute("playsinline", "");
      the.volume = 0.01;
      void the.play().catch(() => {
        // Trình duyệt từ chối tự phát là chuyện thường; Web Audio vẫn chạy.
      });
    } catch {
      // Máy không cho tạo `Audio` — bỏ qua, phần Web Audio bên dưới không phụ thuộc.
    }
  }
}

/** Tạo máy phát. Hàm này KHÔNG chạm `AudioContext` — `moKhoa()` mới chạm. */
export function taoMayAmThanh(): MayAmThanh {
  return new MayAmThanh();
}

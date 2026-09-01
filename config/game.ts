/**
 * Hằng số nghiệp vụ của trò chơi — nguồn DUY NHẤT, không hardcode ở nơi khác.
 * Lập luận vì sao chọn từng con số: `docs/brd/dem-so-bo-dem-may-man.md` § 5 (repo IDEA).
 */

/** Bảng số có 4 chữ số: 0000 … 9999. */
export const DIGITS = 4;
export const WHEEL_SIZE = 10 ** DIGITS;

/**
 * Độ lệch phản xạ của người thường (giây) — dùng để ƯỚC TÍNH tỉ lệ trúng.
 * Người chơi canh được thời điểm nhưng ngón tay luôn lệch chừng này.
 */
export const REACTION_JITTER_SECONDS = 0.08;

/** Màn TRÚNG chỉ có hiệu lực 60 giây — chống chụp màn hình đem khoe. */
export const WIN_VALID_SECONDS = 60;

export interface RoundSettings {
  /** Tốc độ lúc xuất phát (số/giây). */
  startSpeed: number;
  /** Tốc độ khi đã tăng hết cỡ (số/giây). */
  maxSpeed: number;
  /** Thời gian đi từ startSpeed lên maxSpeed (giây). */
  rampSeconds: number;
  /**
   * Khoá nút DỪNG bấy nhiêu giây kể từ lúc số bắt đầu chạy.
   * Đặt bằng rampSeconds để MỌI số cài đều chỉ gặp được ở tốc độ tối đa —
   * không khoá thì số cài nhỏ (0211) dễ hơn hẳn số cài lớn (9800).
   */
  lockSeconds: number;
  /** Quá bấy nhiêu giây chưa bấm thì tự dừng, tính là trượt. */
  roundLimitSeconds: number;
  /** Đếm ngược 3-2-1 trước khi số chạy (giây). */
  countdownSeconds: number;
}

export type DifficultyId = "thu" | "de" | "vua" | "kho";

export interface Difficulty {
  label: string;
  note: string;
  settings: RoundSettings;
}

/**
 * Bốn mức có sẵn cho nhân viên.
 *
 * Lưu ý quan trọng đã kiểm chứng bằng toán (xem `estimateWinChance`):
 * TỐC ĐỘ quyết định CẢM GIÁC (hai chữ số đầu còn đọc được hay không),
 * còn TỈ LỆ TRÚNG lại do (roundLimitSeconds − lockSeconds) quyết định.
 * Vì vậy các mức dưới đây khác nhau ở CẢ tốc độ lẫn thời gian một lượt.
 */
export const DIFFICULTIES: Record<DifficultyId, Difficulty> = {
  thu: {
    label: "Chế độ thử",
    note: "Số chạy chậm, đọc được từng con — dùng để xem trước màn TRÚNG hoặc demo cho khách. Chỉ chạy tới ~1440 nên số cài phải nhỏ hơn 1440; số càng nhỏ càng nhanh tới.",
    settings: {
      startSpeed: 8,
      maxSpeed: 8,
      rampSeconds: 0,
      lockSeconds: 0,
      roundLimitSeconds: 180,
      countdownSeconds: 3,
    },
  },
  de: {
    label: "Dễ",
    note: "Hàng trăm đổi 4 lần/giây — nhìn rõ, canh được. Lượt chơi dài nên nhiều cơ hội.",
    settings: {
      startSpeed: 150,
      maxSpeed: 400,
      rampSeconds: 6,
      lockSeconds: 6,
      roundLimitSeconds: 60,
      countdownSeconds: 3,
    },
  },
  vua: {
    label: "Trung bình",
    note: "Mức khuyên dùng. Hàng nghìn + hàng trăm còn đọc được để canh, hàng chục + đơn vị nhoè — người chơi tin là kỹ năng.",
    settings: {
      startSpeed: 250,
      maxSpeed: 800,
      rampSeconds: 6,
      lockSeconds: 6,
      roundLimitSeconds: 30,
      countdownSeconds: 3,
    },
  },
  kho: {
    label: "Khó",
    note: "Hàng trăm bắt đầu nhoè, lượt chơi ngắn. Dùng khi giải thưởng lớn.",
    settings: {
      startSpeed: 400,
      maxSpeed: 1500,
      rampSeconds: 6,
      lockSeconds: 6,
      roundLimitSeconds: 20,
      countdownSeconds: 3,
    },
  },
};

/** Ba mức đưa ra cho nhân viên chọn. Mức "thu" giữ lại chỉ để chạy test tự động. */
export const MUC_CHON: DifficultyId[] = ["de", "vua", "kho"];

export const DEFAULT_DIFFICULTY: DifficultyId = "vua";
export const DEFAULT_SETTINGS: RoundSettings = DIFFICULTIES[DEFAULT_DIFFICULTY].settings;

/** Khoảng cho phép khi nhân viên tự nhập ở chế độ Tuỳ chỉnh. */
export const LIMITS = {
  speed: { min: 2, max: 5000 },
  rampSeconds: { min: 0, max: 30 },
  lockSeconds: { min: 0, max: 30 },
  roundLimitSeconds: { min: 5, max: 180 },
  countdownSeconds: { min: 0, max: 10 },
} as const;

/** Giá trị mặc định khi URL không khai gì. */
export const DEFAULT_TARGET = 211;
export const DEFAULT_CENTER_NAME = "Trung tâm";
export const DEFAULT_PRIZE_NAME = "Phần quà";

/**
 * Dừng lệch trong khoảng này thì coi là "sát quá" và đổi lời động viên.
 * Đây chính là đòn bẩy "trượt trong gang tấc" của video nguồn — người chơi hụt
 * sát nút mới quay lại thử tiếp.
 */
export const NEAR_MISS_THRESHOLD = 10;

/* ------------------------------------------------------------------------- *
 * CHIẾU SONG SONG LÊN MÀN HÌNH LỚN (LCD đặt tại trung tâm)
 *
 * Màn hình LCD mở `/man-hinh`, tự sinh một MÃ PHÒNG rồi vẽ mã QR chứa mã đó.
 * Phụ huynh quét QR → điện thoại vào đúng phòng ấy → mọi diễn biến của ván
 * được chiếu song song lên LCD, và kết quả cuối luôn khớp tuyệt đối.
 *
 * Cách đồng bộ (quan trọng, đừng làm khác): KHÔNG truyền từng con số qua mạng.
 * Điện thoại chỉ báo "bắt đầu" rồi "kết quả"; LCD tự chạy bảng số bằng chính
 * công thức trong `lib/bo-dem.ts`, và khi nhận kết quả thì SNAP thẳng về đúng
 * con số điện thoại đã dừng. Nhờ vậy độ trễ mạng chỉ làm lệch phần NHOÈ ở giữa
 * — thứ không ai nhìn ra — còn con số cuối thì khớp 100%.
 * ------------------------------------------------------------------------- */

/** Bảng chữ cái mã phòng — bỏ ký tự dễ đọc nhầm để nhân viên đọc to được. */
export const ROOM_ALPHABET = "ACDEFGHJKLMNPQRTUVWXY3479";
export const ROOM_CODE_LENGTH = 4;

/** Giữ chỗ cho người đang chơi bấy nhiêu giây rồi tự nhả nếu họ bỏ đi. */
export const ROOM_HOLD_SECONDS = 120;

/** LCD hiện màn kết quả bao lâu rồi quay về mã QR chờ người tiếp theo. */
export const LCD_RESULT_SECONDS = { win: 25, lose: 8 } as const;

/**
 * Số VÁN ước tính mỗi ngày ở một quầy — mẫu số của dự báo tiền quà.
 *
 * Đây là một GIẢ ĐỊNH, không phải số đo: nó có mặt để câu "khoảng N giải/ngày"
 * nói ra được điều gì đó thay vì im lặng. Đo được lưu lượng thật ở quầy rồi thì
 * sửa đúng một chỗ này.
 */
export const VAN_UOC_TINH_MOI_NGAY = 40;

/**
 * Dự báo số giải/ngày vượt quá TRẦN đã khai thì đổi màu cảnh báo.
 * 1 = cảnh báo ngay khi dự báo chạm trần.
 */
export const NGUONG_CANH_BAO_TRAN = 1;

/** Không nhận được tin gì từ điện thoại quá lâu thì LCD tự về màn chờ. */
export const LCD_IDLE_TIMEOUT_SECONDS = 75;

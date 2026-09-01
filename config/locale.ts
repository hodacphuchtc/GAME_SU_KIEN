/**
 * Từ điển tiếng Việt DUY NHẤT của ứng dụng (rule `ngon-ngu-ui.md`).
 * Thêm chữ mới vào đây trước, không viết thẳng chuỗi vào component —
 * để mỗi khái niệm chỉ có đúng một cách gọi trên toàn bộ màn hình.
 */
export const T = {
  appName: "Bộ đếm may mắn",
  appDescription:
    "Bấm dừng dãy số 4 chữ số đúng lúc để trúng thưởng tại trung tâm.",

  // ---- Màn chơi ----
  targetLabel: "SỐ TRÚNG THƯỞNG",
  start: "BẮT ĐẦU",
  speedingUp: "ĐANG TĂNG TỐC…",
  stop: "DỪNG",
  playAgain: "CHƠI LẠI",
  tryAgain: "THỬ LẠI",
  ready: "Sẵn sàng chưa?",
  hint: "Bấm DỪNG đúng lúc bảng số hiện đúng con số ở trên",
  hintLocked: "Chờ bảng số tăng hết tốc, nút DỪNG sẽ sáng",
  timeLeft: "Còn",
  seconds: "giây",
  settingsLink: "Cài đặt",
  rulesLink: "Thể lệ",

  // ---- Màn thiết lập ----
  createTitle: "Tạo chương trình đếm số",
  createSubtitle:
    "Chọn số trúng thưởng và độ khó, bấm tạo là có ngay mã QR để in dán tại quầy.",
  createCenter: "Tên cơ sở / trung tâm",
  createTarget: "Số trúng thưởng (4 chữ số)",
  createPrize: "Tên phần thưởng",
  createCap: "Trần số giải mỗi ngày (0 = không giới hạn)",
  createSubmit: "TẠO CHƯƠNG TRÌNH",
  createBack: "Quay lại danh sách",
  createOddsTitle: "Tỉ lệ trúng ước tính",
  createWarnUnreachable:
    "⚠️ Với cấu hình này con số đã cài KHÔNG BAO GIỜ lướt qua trong một lượt — không ai trúng được.",

  // ---- Màn chi tiết ----
  detailQr: "Mã QR dán tại quầy",
  detailQrHint: "In tờ này và dán ở lễ tân. Phụ huynh quét là chơi được ngay.",
  detailPrint: "In mã QR",
  detailOpenScreen: "Mở màn hình LCD",
  detailStop: "TẮT CHƯƠNG TRÌNH",
  detailStopped: "Chương trình đã kết thúc",
  detailHistory: "Lịch sử quay số",
  detailHistoryEmpty: "Chưa có lượt chơi nào.",
  detailExport: "Xuất CSV",
  colTime: "Thời điểm",
  colPlayer: "Người chơi",
  colStopped: "Dừng ở",
  colResult: "Kết quả",
  colDevice: "Bấm từ",
  resultWin: "TRÚNG",
  resultLose: "Trượt",
  deviceScreen: "Màn hình",
  devicePhone: "Điện thoại",
  deviceTimeout: "Hết giờ",

  // ---- Khung quản trị ----
  adminBrandA: "Sata",
  adminBrandB: "Robo",
  adminBrandTag: "Đếm số",
  adminGroup: "CHƯƠNG TRÌNH",
  adminNavDemSo: "ĐẾM SỐ",
  adminSearch: "Tìm chương trình, cơ sở…",
  adminUserName: "Nhân viên trực quầy",
  adminUserRole: "Toàn quyền",
  adminFooter: "Đếm số may mắn · v1 · 2026",
  adminOpenMenu: "Mở thanh điều hướng",
  adminCloseMenu: "Đóng thanh điều hướng",

  // ---- Danh sách chương trình ----
  listTitle: "Đếm số may mắn",
  listSubtitle: "Toàn hệ thống · các chương trình đang chạy tại các cơ sở",
  listEmpty: "Chưa có chương trình nào. Bấm “Tạo chương trình” để mở màn đầu tiên.",
  listNew: "Tạo chương trình",
  colCenter: "Cơ sở",
  colTarget: "Số trúng",
  colLevel: "Độ khó",
  colPrize: "Phần thưởng",
  colPlays: "Lượt chơi",
  colWins: "Đã trúng",
  colStatus: "Trạng thái",
  statusRunning: "Đang chạy",
  statusEnded: "Đã kết thúc",
  totalPrograms: "Chương trình",
  totalPlays: "Tổng lượt chơi",
  totalWins: "Tổng giải đã trúng",

  // ---- Thước đo lead → ghi danh (GĐ 7.2) ----
  // Con số DUY NHẤT trả lời được câu "trò chơi này có ra tiền không". Mọi số
  // liệu khác chỉ là lượt chơi, mà lượt chơi thì không trả tiền cho ai.
  roiTitle: "Khách để lại số → đã ghi danh",
  roiEmpty: "Tháng này chưa có khách nào để lại số điện thoại.",
  roiDong: (khach: number, ghiDanh: number, phanTram: string) =>
    `Tháng này: ${khach} khách để lại số → ${ghiDanh} đã ghi danh (${phanTram})`,
  colEnrolled: "Đã ghi danh",
  colCode: "Mã xác thực",
  colAwarded: "Đã trao quà",
  awardToggle: "Đánh dấu đã trao quà cho khách này",
  detailStart: "BẬT LẠI CHƯƠNG TRÌNH",
  detailStopConfirm: "Tắt chương trình này? Người đang quét mã sẽ không chơi được nữa.",
  listTurnOn: "Bật",
  listTurnOff: "Tắt",
  phoneEnded: "Chương trình đã kết thúc. Bạn hỏi nhân viên lễ tân giúp nhé!",
  phoneRetry: "THỬ LẠI",
  enrollToggle: "Đánh dấu khách này đã ghi danh học",

  // ---- Màn điện thoại ----
  phoneConnecting: "Đang kết nối với màn hình…",
  phoneBusy: "Màn hình lớn đang có người chơi. Chờ một chút rồi quét lại nhé!",
  phoneLookAtScreen: "Nhìn màn hình lớn",
  phoneHint: (so: string) => `Bấm DỪNG đúng khoảnh khắc bảng số trên màn hình lớn hiện ${so}`,
  phoneWait: "CHỜ MỘT CHÚT…",

  // ---- Bước nhập thông tin trên điện thoại ----
  formTitle: "Trước khi chơi",
  formName: "Họ và tên",
  formNamePlaceholder: "Nguyễn Thị Hoa",
  formPhone: "Số điện thoại",
  formPhonePlaceholder: "0912345678",
  formConsent: "Tôi đồng ý nhận tư vấn khoá học từ trung tâm",
  formPrivacy:
    "Trung tâm lưu họ tên và số điện thoại của bạn để đối soát giải thưởng. Bạn có thể yêu cầu xoá bất cứ lúc nào tại quầy lễ tân.",
  formSubmit: "TIẾP TỤC",
  formOneADay: "Mỗi số điện thoại chơi một lượt mỗi ngày.",
  onlyFun: "Hôm nay đã hết quà — bạn vẫn chơi được cho vui nhé!",
  blocked: "Chưa chơi được",

  // ---- Mời học thử sau khi thua ----
  /** Lệch sát thì reo lên; lệch xa mà vẫn "thôi" thì đọc như trêu người ta. */

  // ---- Kết quả ----
  congrats: "CHÚC MỪNG!",
  wonExact: "Bạn đã dừng đúng số",
  lost: "KHÔNG TRÚNG THƯỞNG",
  // Người không trúng KHÔNG nhận gì. Câu này thay cho ưu đãi cũ: nói thật, nói
  // tử tế, và không hứa điều gì mà quầy không định trao.
  loseThanks: "Cảm ơn Quý Phụ huynh đã tham gia",
  youStoppedAt: "Bạn dừng ở",
  offByN: (n: number) => `lệch ${n} số`,
  soClose: "Sát quá! Thử lại ngay đi",
  stillFar: "Còn hơi xa — canh lại nhịp nhé",
  timedOut: "Hết giờ — lượt này tính là chưa trúng",
  prizeLabel: "Phần thưởng",
  showToStaff: "Đưa màn hình này cho nhân viên",
  validFor: "Có hiệu lực trong",
  verifyCode: "Mã xác thực",
  expired: "Đã hết hiệu lực — chơi lại để lấy mã mới",

  // ---- Trang cài đặt ----
  settingsTitle: "Cài đặt ván chơi",
  settingsIntro:
    "Dành cho nhân viên trực quầy. Chọn xong thì in mã QR dán tại quầy — phụ huynh quét là chơi được ngay, không cần cài gì.",
  targetField: "Số trúng thưởng (4 chữ số)",
  difficulty: "Độ khó",
  custom: "Tuỳ chỉnh",
  centerNameField: "Tên trung tâm",
  prizeNameField: "Tên phần thưởng",
  startSpeedField: "Tốc độ lúc xuất phát (số/giây)",
  maxSpeedField: "Tốc độ tối đa (số/giây)",
  rampField: "Thời gian tăng tốc (giây)",
  lockField: "Khoá nút DỪNG (giây)",
  roundLimitField: "Giới hạn một lượt (giây)",
  countdownField: "Đếm ngược trước khi chạy (giây)",
  oddsTitle: "Tỉ lệ trúng ước tính",
  perRound: "mỗi lượt",
  perPass: "mỗi lần số lướt qua",
  passCount: "Số lướt qua trong một lượt",
  times: "lần",
  atSecond: "tại giây",
  baseUrlField: "Địa chỉ máy chủ (địa chỉ mà ĐIỆN THOẠI sẽ mở)",
  baseUrlHint:
    "Mặc định lấy đúng địa chỉ bạn đang mở trang này. Sửa ở đây nếu muốn mã QR trỏ tới địa chỉ khác — ví dụ địa chỉ mạng LAN của máy, hay tên miền thật sau khi đưa lên mạng.",
  warnLocalhost:
    "⚠️ Bạn đang mở trang này bằng localhost, nên mã QR sinh ra CHỈ máy này quét được — điện thoại của phụ huynh sẽ báo không mở được trang. Hãy sửa ô địa chỉ bên trên thành địa chỉ mạng LAN của máy (dạng http://192.168.x.x:3000), hoặc mở lại chính trang này bằng địa chỉ đó.",
  playUrl: "Đường dẫn cho người chơi",
  copyUrl: "Chép đường dẫn",
  copied: "Đã chép!",
  openTest: "Mở thử",
  qrTitle: "Mã QR để in",
  qrHint: "Dán mã này tại quầy kèm con số trúng thưởng của ngày.",
  printPage: "In trang này",
  warnUnreachable:
    "⚠️ Với cấu hình này con số đã cài KHÔNG BAO GIỜ lướt qua trong một lượt — không ai trúng được. Hãy tăng giới hạn lượt, tăng tốc độ, hoặc chọn số nhỏ hơn.",
  warnTooEasy:
    "⚠️ Cấu hình này dễ trúng bất thường — chỉ nên dùng để xem thử hoặc demo, đừng treo giải thật.",
  oddsNote:
    "Ước tính dựa trên độ lệch phản xạ 0,08 giây của người thường. Tốc độ đổi CẢM GIÁC khó, còn tỉ lệ trúng chủ yếu do (giới hạn lượt − thời gian khoá nút) quyết định.",

  // ---- Chiếu lên màn hình LCD ----
  lcdTitle: "Màn hình trung tâm",
  lcdScanToPlay: "QUÉT MÃ ĐỂ CHƠI",
  lcdRoomCode: "Mã phòng",
  lcdWaiting: "Đang chờ người chơi…",
  lcdJoined: "Có người vừa quét mã — chuẩn bị!",
  lcdPlaying: "ĐANG CHƠI",
  lcdOffline:
    "⚠️ Chưa nối được máy chủ trung chuyển. Màn hình vẫn hiện mã QR và phụ huynh vẫn chơi được trên điện thoại, nhưng KHÔNG chiếu song song lên đây. Kiểm tra xem đã chạy `npm run trung-tam` chưa.",
  lcdOpenScreen: "Mở màn hình LCD",
  lcdOpenHint:
    "Mở trang này trên máy nối với LCD rồi bật toàn màn hình (F11 hoặc ⌃⌘F). Màn hình sẽ tự sinh mã phòng và vẽ mã QR — phụ huynh quét là ván chơi của họ hiện song song lên đây.",
  mirrorOn: "Đang chiếu lên màn hình lớn",
  mirrorBusy: "Màn hình lớn đang có người chơi — bạn vẫn chơi bình thường trên máy mình",
  mirrorOff: "Không nối được màn hình lớn — bạn vẫn chơi bình thường",

  // ---- Thể lệ ----
  rulesTitle: "Thể lệ",
  back: "Quay lại",
} as const;

/** Các bước thể lệ — sửa ở đây thì cả trang thể lệ lẫn màn chơi đổi theo. */
export const RULES = [
  "Bấm BẮT ĐẦU, chờ đếm ngược 3 – 2 – 1.",
  "Dãy 4 chữ số chạy từ 0000 và mỗi lúc một nhanh hơn.",
  "Nút DỪNG bị khoá trong lúc bảng số đang tăng tốc — chờ nút sáng đỏ.",
  "Bấm DỪNG đúng khoảnh khắc bảng số hiện đúng con số trúng thưởng.",
  "Trùng khít cả 4 chữ số mới tính trúng. Lệch một số cũng là chưa trúng.",
  "Hết giờ mà chưa bấm thì lượt đó tính là chưa trúng.",
  "Trúng rồi thì đưa màn hình đang chạy cho nhân viên trong 60 giây để nhận thưởng.",
] as const;

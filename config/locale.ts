/**
 * Từ điển tiếng Việt DUY NHẤT của ứng dụng (rule `ngon-ngu-ui.md`).
 * Thêm chữ mới vào đây trước, không viết thẳng chuỗi vào component —
 * để mỗi khái niệm chỉ có đúng một cách gọi trên toàn bộ màn hình.
 */
export const T = {
  appName: "Trúng Số",
  appDescription:
    "Bấm dừng dãy số 4 chữ số đúng lúc để trúng thưởng tại trung tâm.",

  // ---- Màn chơi ----
  targetLabel: "SỐ TRÚNG THƯỞNG",
  start: "BẮT ĐẦU",
  speedingUp: "ĐANG TĂNG TỐC…",
  stop: "DỪNG",
  playAgain: "CHƠI LẠI",
  tryAgain: "THỬ LẠI",
  hint: "Bấm DỪNG đúng lúc bảng số hiện đúng con số ở trên",
  seconds: "giây",

  // ---- Màn thiết lập ----
  createTitle: "Tạo chương trình đếm số",
  createSubtitle:
    "Chọn số trúng thưởng và độ khó, bấm tạo là có ngay mã QR để in dán tại quầy.",
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
  detailHistory: "Lịch sử quay số",
  detailHistoryEmpty: "Chưa có lượt chơi nào.",
  detailExport: "Xuất Excel",
  detailExportKho: "Xuất kho quà",
  leadExport: "Xuất Excel",
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
  adminBrandTag: "Game sự kiện",
  adminGroupGame: "GAME SỰ KIỆN",
  adminNavTrungSo: "Trúng Số",
  adminNavVongQuay: "Vòng Quay May Mắn",
  adminSearch: "Tìm chương trình, cơ sở…",
  adminUserName: "Nhân viên trực quầy",
  adminUserRole: "Toàn quyền",
  adminFooter: "Game sự kiện Sata Robo · v2 · 2026",
  adminOpenMenu: "Mở thanh điều hướng",
  adminCloseMenu: "Đóng thanh điều hướng",

  // ---- Danh sách chương trình ----
  listTitle: "Trúng Số",
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
  roiEmpty: "Tháng này chưa có khách nào để lại số điện thoại.",
  roiDong: (khach: number, ghiDanh: number, phanTram: string) =>
    `Tháng này: ${khach} khách để lại số → ${ghiDanh} đã ghi danh (${phanTram})`,
  colEnrolled: "Đã ghi danh",
  colCode: "Mã xác thực",
  colAwarded: "Đã trao quà",
  awardToggle: "Đánh dấu đã trao quà cho khách này",
  detailStart: "BẬT LẠI CHƯƠNG TRÌNH",
  detailStopConfirm: "Tắt chương trình này? Người đang quét mã sẽ không chơi được nữa.",
  // ---- Dọn dẹp: xoá / ẩn (GĐ 23) ----
  donXoa: "Xoá",
  donAn: "Ẩn khỏi danh sách",
  donHienCaDaAn: "Hiện cả mục đã ẩn",
  donNhanDaAn: "Đã ẩn",
  donXacNhanXoaCt: (ten: string) =>
    `Xoá hẳn chương trình "${ten}"? Chưa ai chơi ván nào nên không mất lịch sử gì. Kho quà đã khai của nó sẽ mất theo. Khách tiềm năng KHÔNG bị xoá.`,
  donXacNhanAnCt: (ten: string, van: number, giai: number) =>
    `Chương trình "${ten}" đã có ${van} ván chơi và ${giai} giải đã trao — KHÔNG xoá được, nó là sổ đối soát khi phụ huynh khiếu nại phần quà. Ẩn khỏi danh sách? Chương trình sẽ ngừng nhận lượt chơi, mã QR đã dán không dùng được nữa. Lấy lại bằng ô "Hiện cả mục đã ẩn".`,

  donXacNhanXoaCoSo: (ten: string) =>
    `Xoá hẳn cơ sở "${ten}"? Nó chưa gắn với khách, nhân viên, chương trình hay ván chơi nào nên không mất dữ liệu gì.`,
  donXacNhanAnCoSo: (ten: string, lead: number, nv: number, ct: number) =>
    `Cơ sở "${ten}" đang có ${lead} khách tiềm năng, ${nv} nhân viên và ${ct} chương trình — KHÔNG xoá được, vì xoá là mất theo cả danh bạ khách lẫn nhân viên. Ẩn khỏi danh sách? Mọi dữ liệu giữ nguyên, lấy lại bằng ô "Hiện cả mục đã ẩn".`,

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
  formOneADay: "Mỗi số điện thoại chơi một ván mỗi ngày.",
  onlyFun: "Hôm nay đã hết quà — bạn vẫn chơi được cho vui nhé!",
  blocked: "Chưa chơi được",

  // ---- Mời học thử sau khi thua ----
  /** Lệch sát thì reo lên; lệch xa mà vẫn "thôi" thì đọc như trêu người ta. */

  // ---- Kết quả ----
  congrats: "CHÚC MỪNG!",
  wonExact: "Bạn đã dừng đúng số",
  // --- GAME CHỌN SỐ (v3) ---
  // --- GAME CHỌN SỐ: quản trị ---
  // ── VÒNG QUAY MAY MẮN (ADR-011) ──────────────────────────────────────────
  vongQuayNav: "Vòng Quay",
  suaVongQuayTieuDe: "Sửa chương trình",
  suaVongQuayNut: "Lưu thay đổi",
  suaVongQuayDangLuu: "Đang lưu…",
  suaVongQuayXong: "Đã lưu. Mặt vòng trên màn LCD đổi ngay ở lần tải kế tiếp.",
  suaVongQuayKhongThay: "Không tìm thấy chương trình này trong phạm vi của bạn.",
  // 🔴 Nói THẲNG vì sao chặn, và chỉ luôn đường đi tiếp. Chặn mà im lặng là cách
  // chắc chắn để người vận hành tưởng máy hỏng.
  suaVongQuayODaTrao: (ten: string, soDaTrao: number) =>
    `Ô "${ten}" đã trao ${soDaTrao} phần quà — không xoá được, vì nó là chứng cứ đối soát khi phụ huynh khiếu nại. Muốn ngừng phát thì đặt SỐ LƯỢNG bằng đúng ${soDaTrao}: ô sẽ tự biến khỏi mặt vòng mà lịch sử vẫn còn nguyên.`,
  suaVongQuayCanhBaoO: (soDaTrao: number) =>
    `Đã trao ${soDaTrao} — không xoá được ô này.`,
  leadGameDau: "Game đầu tiên",
  khachChiTietTitle: "Hồ sơ khách",
  khachQuayLai: "← Khách tiềm năng",
  khachDaChoi: "Đã chơi",
  khachChuaChoi: "Khách này chưa có lượt chơi nào được ghi.",
  khachSoThayDoi: "Sổ thay đổi hồ sơ",
  khachSoThayDoiTrong: "Hồ sơ này chưa từng đổi thông tin lần nào.",
  khachSoThayDoiVi:
    "Máy ghi lại mỗi lần khách khai thông tin khác với bản đang lưu. Bản MỚI được lấy làm chuẩn; bản cũ giữ ở đây để còn đối soát.",
  khachTruongHoTen: "Họ tên",
  khachTungKhai: (ten: string) => `Từng khai: ${ten}`,
  khachLeadTieuDe: "Đầu mối chăm sóc",
  khachLeadNhieuCoSo:
    "Một người chơi ở hai cơ sở thì thành HAI đầu mối — cố ý, vì đó là hai đội sale khác nhau. Gộp lại là hai bên tranh một ô.",
  khachQuanTam: "Quan tâm học thử",
  khachTuNgay: "Để lại số từ",
  khachCotGame: "Game",
  khachCotDot: "Đợt",
  khachCotQua: "Phần quà",
  // Nhãn hiển thị của từng game. Kiểu Record để một game lạ (dữ liệu cũ, hoặc
  // game thứ tư chưa khai nhãn) KHÔNG làm vỡ trang — nó rơi về mã thô.
  tenTroChoi: {
    trung_so: "Trúng Số",
    chon_so: "Chọn Số",
    vong_quay: "Vòng Quay",
  } as Record<string, string>,
  leadGameLoc: "Game",
  leadGameTatCa: "Tất cả game",
  // 🔴 Nhãn cột nói rõ ĐẦU TIÊN. `chuong_trinh_id_dau` không bao giờ được cập nhật
  // khi khách chơi game thứ hai, nên một nhãn "Game" trần trụi là mời người đọc
  // kết luận sai về khách của chính mình.
  leadGameDauChuThich:
    "Cột \"Game đầu tiên\" ghi game của chương trình khách chơi LẦN ĐẦU, không phải mọi game họ đã chơi. Bấm vào tên khách để xem đủ.",
  leadGameTrong: "—",

  // ── Dựng lại ván đã quay (ADR-011) ──────────────────────────────────────
  ctCotMa: "Mã xác thực",
  dlGiaiThich:
    "Đây là chính vòng quay của lúc đó, dựng lại từ hạt giống đã lưu — kể cả những ô nay đã hết hàng hoặc đã bị sửa. Kim dừng đúng chỗ cũ.",
  dlGocDung: "Góc dừng",
  dlHatGiong: "Hạt giống",
  dlKhongDungDuoc:
    "Lượt này ghi trước khi hệ thống bắt đầu lưu ảnh chụp mặt vòng, nên không dựng lại được. Các thông số gốc vẫn còn nguyên bên dưới.",
  dlLucQuay: "Quay lúc",
  dlNguoiChoi: "Người chơi",
  dlOTrung: "Ô đã trúng",
  dlPhienBan: "Phiên bản mặt vòng",
  dlQuayLai: "← Về lịch sử",
  dlTieuDe: "Dựng lại ván quay",
  lcdBatDauChieu: "▶ BẮT ĐẦU CHIẾU",
  lcdBatDauChieuVi:
    "Chạm một lần để mở khoá âm thanh và bật toàn màn hình. Trình duyệt khoá tiếng cho tới khi có người chạm vào trang — mà màn LCD thì không ai chạm suốt buổi.",
  lcdChuaCoTieng: "Chưa có tiếng — chạm màn hình một lần để mở khoá âm thanh.",
  lcdQrSaiTieuDe: "⚠️ Mã QR này điện thoại quét sẽ KHÔNG vào được",
  lcdQrSaiVi: (dung: string) =>
    `Màn hình đang mở bằng localhost, nên mã QR mã hoá chính chữ "localhost" — điện thoại quét vào thì nó trỏ về chính chiếc điện thoại đó. Hãy đóng tab này và mở lại bằng ${dung}`,
  lcdQrSaiKhongBietIp:
    "Màn hình đang mở bằng localhost, nên mã QR mã hoá chính chữ \"localhost\" — điện thoại quét vào thì nó trỏ về chính chiếc điện thoại đó. Chạy `npm run trung-tam` rồi mở màn hình bằng địa chỉ IP mà nó in ra.",
  lcdQrSaiChep: "Chép địa chỉ đúng",
  lcdQrSaiDaChep: "Đã chép ✓",

  // ── Màn chơi + màn LCD của Vòng Quay (ADR-011) ───────────────────────────
  choiChaoLai: (ten: string) => `Chào ${ten}!`,
  choiDangGui: "Đang kiểm…",
  choiDongYTuVan: "Tôi đồng ý nhận tư vấn về khoá học của Sata Robo",
  choiHoTen: "Họ và tên phụ huynh",
  choiHoTenGoiY: "Ví dụ: Nguyễn Thị Hoa",
  choiMoiNhap: "Điền giúp thông tin để nhận quà nhé",
  choiNut: "Tiếp tục",
  choiSanSang: "Bấm QUAY để nhận phần quà của bạn.",
  choiSdt: "Số điện thoại",
  choiSdtGoiY: "Ví dụ: 0912345678",
  dlChayLai: "Chạy lại",
  lcdDangCho: "Đang chờ người chơi…",
  lcdHuongDan: "Dùng camera điện thoại quét mã QR bên dưới, điền tên rồi bấm QUAY.",
  lcdMaXacThuc: "Mã xác thực",
  lcdMatKetNoi: "Mất kết nối với máy chủ — đang thử nối lại…",
  lcdNguoiChoi: (ten: string) => `${ten} đang quay`,
  lcdQuetMa: "Quét mã để chơi",
  lcdTrungCua: (ten: string) => `${ten} nhận được`,
  lcdTrungTieuDe: "CHÚC MỪNG",
  quayDangQuay: "Đang quay…",
  quayHuongDanNhan: "Bạn đưa màn hình này cho nhân viên tại quầy để nhận quà nhé.",
  quayMaXacThuc: "Mã xác thực",
  quayNut: "QUAY",
  quayTrungO: (ten: string) => `Phần quà của bạn: ${ten}`,
  quayTrungTieuDe: "Chúc mừng bạn!",
  tenUngDung: "Vòng Quay May Mắn",
  vongQuayXuat: "Xuất Excel",
  vongQuayDangLuu: "Đang lưu…",
  vongQuayTitle: "Chương trình Vòng Quay",
  vongQuaySubtitle:
    "Phụ huynh quét QR, bấm QUAY, vòng quay chạy trên màn LCD và dừng ở một ô — ô đó là phần quà.",
  vongQuayEmpty: "Chưa có chương trình Vòng Quay nào. Bấm Tạo để mở đợt đầu tiên.",
  vongQuayTaoNut: "Tạo chương trình Vòng Quay",
  vongQuayCreateTitle: "Tạo chương trình Vòng Quay",
  vongQuayCreateSubtitle:
    "Khai danh sách ô quà và phần vòng dành cho ô an ủi. Mỗi ô là một loại quà.",
  vongQuayDot: "Tên đợt phát quà",
  vongQuayDotGoiY: "Ví dụ: Vòng quay Trung Thu 2026",
  vongQuayTiLeODay: "Phần vòng cho ô an ủi",
  vongQuayTiLeGoiY: (phanTram: number) =>
    `${phanTram}% mặt vòng dành cho ô không giới hạn. Đây là VAN NGÂN SÁCH: kéo xuống thì quà thật ra nhiều hơn và kho cạn nhanh hơn.`,
  vongQuayBangO: "Danh sách ô quà",
  vongQuayOTen: "Tên quà",
  vongQuayOSoLuong: "Số lượng",
  vongQuayOSoLuongGoiY: "Để TRỐNG = ô an ủi, không giới hạn",
  vongQuayOTran: "Trần mỗi ngày",
  vongQuayOTranGoiY: "0 = không chặn",
  vongQuayOMau: "Màu ô",
  vongQuayThemO: "+ Thêm ô",
  vongQuayXoaO: "Xoá ô này",
  vongQuayCanODay:
    "Vòng phải có ít nhất một ô để TRỐNG số lượng — đó là ô an ủi. Thiếu nó thì hết quà là hết trò.",
  vongQuayLuotDaQuay: "Lượt đã quay",
  vongQuayChuaCoLuot: "Chưa có ai quay lượt nào.",
  vongQuayCotO: "Phần quà",
  vongQuayKhoTieuDe: "Kho ô quà",
  vongQuayKhoConLai: (n: number) => `còn ${n}`,
  vongQuayKhoKhongGioiHan: "không giới hạn",
  vongQuayCanhBaoVang: "Có ô quà thật sắp hết — nhập thêm hàng.",
  vongQuayCanhBaoDo:
    "Không còn ô quà thật nào. Ai quay cũng chỉ nhận quà an ủi — vẫn chơi được, nhưng cần nhập hàng.",
  gameIndexTitle: "Game sự kiện",
  gameIndexSubtitle: "Ba trò chơi dùng chung một kho khách, một kho quà và một lần đăng nhập.",
  gameTrungSoMo: "Bấm dừng dãy số đúng lúc. Người bấm quyết kết quả.",
  gameChonSoMo: "Bấm dừng một dải số chạy xoay vòng. Người bấm quyết kết quả.",
  gameVongQuayMo: "Quét QR, bấm QUAY một lần. Máy bốc bằng góc ngẫu nhiên đều.",
  quayHetLuot:
    "Số điện thoại này đã quay trong hôm nay rồi. Mỗi người một lượt mỗi ngày — mời bạn quay lại vào ngày mai nhé.",
  quayChuaCoO: "Chương trình chưa khai ô quà nào. Bạn báo giúp nhân viên tại quầy nhé.",
  quayDangCoNguoi:
    "Đang có người quay. Bạn chờ vài giây rồi bấm lại giúp nhé — vòng quay phục vụ từng người một.",
  quayHetQua: "Chương trình đã hết quà cho hôm nay. Bạn báo giúp nhân viên tại quầy nhé.",

  chonSoNav: "Chọn Số",
  chonSoTitle: "Chương trình Chọn Số",
  chonSoSubtitle:
    "Phụ huynh bấm một lần, nhận một con số. Số đó ứng với phần quà đã đánh số bày sẵn ở quầy.",
  chonSoCreateTitle: "Tạo chương trình Chọn Số",
  chonSoCreateSubtitle: "Khai dải số và cách xử lý số đã phát. Không có kho quà trong máy.",
  chonSoEmpty: "Chưa có chương trình Chọn Số nào. Bấm Tạo để mở đợt đầu tiên.",
  chonSoTaoNut: "Tạo chương trình Chọn Số",
  chonSoDot: "Tên đợt phát quà",
  chonSoDotGoiY: "Ví dụ: Quà Tết 2026 — số 1 đến 100",
  chonSoDai: "Dải số",
  chonSoDaiTu: "Từ số",
  chonSoDaiDen: "Đến số",
  chonSoSoLuong: (n: number) => `Dải này có ${n} số — phục vụ được ${n} lượt.`,
  chonSoNhipQuay: (giay: string) => `Một vòng chạy hết khoảng ${giay} giây.`,
  chonSoLoaiTru: "Mỗi số chỉ ra một lần",
  chonSoLoaiTruMo:
    "Bật khi mỗi số ứng với MỘT phần quà. Số đã có người lấy sẽ biến mất khỏi vòng chạy, và hết số thì chương trình tự dừng.",
  chonSoLoaiTruTat:
    "Tắt khi mỗi số ứng với một LOẠI quà có nhiều món. Hai người ra trùng số là chuyện bình thường.",
  co: "Có",
  khong: "Không",
  chonSoManChoTieuDe: "Quét mã để chọn số may mắn",
  chonSoManChoNhac: "Mỗi người một lần bấm. Số dừng lại là số phần quà của bạn.",
  chonSoSanSang: "Bấm BẮT ĐẦU rồi nhìn lên màn hình lớn.",
  chonSoNhinLenLcd: "Nhìn màn hình lớn — bấm DỪNG khi thấy con số bạn thích!",
  chonSoDuaSoChoNhanVien: "Đưa con số này cho nhân viên để nhận phần quà cùng số.",
  chonSoChucMung: "🎉 Chúc mừng!",
  chonSoDayLaSoCuaBan: "Bạn đã chọn được dãy số may mắn này.",
  gyChonSoDai:
    "Dải quyết định có bao nhiêu phần quà phát được. 1 đến 100 nghĩa là 100 số, phục vụ đúng 100 lượt nếu bật loại trừ. Dải càng dài thì dãy số chạy càng nhanh — máy tự canh để một vòng luôn mất khoảng một giây rưỡi.",
  gyChonSoLoaiTru:
    "BẬT khi mỗi số ứng với MỘT phần quà: số đã có người lấy biến mất khỏi vòng chạy, và hết số thì chương trình tự dừng. TẮT khi mỗi số ứng với một LOẠI quà có nhiều món — lúc đó hai người ra trùng số là bình thường.",
  gyChonSoDot:
    "Tên này in trên tờ mã QR dán ở quầy và hiện trên màn hình lớn. Đặt tên nói rõ đợt nào, ví dụ \"Quà Tết 2026 — số 1 đến 100\", để sau này mở sổ đối soát còn biết là buổi nào.",
  chonSoTheLeTitle: "Thể lệ — Chọn Số",
  chonSoSuaTitle: "Sửa thiết lập",
  chonSoLuu: "Lưu thay đổi",
  chonSoDaLuu: "Đã lưu. Mã QR cũ vẫn dùng được.",
  chonSoCanhBaoThuHep: (daPhat: number, ngoai: number) =>
    `Đã phát ${daPhat} số, ${ngoai} trong đó nằm ngoài dải mới. Những số đó vẫn giữ nguyên trong sổ, nhưng không còn được tính vào phần "còn lại".`,
  chonSoCotSo: "Số may mắn",
  chonSoLichSu: "Số đã phát",
  chonSoXuat: "Xuất Excel",
  chonSoChuaCoVan: "Chưa có ai chơi.",
  chonSoConLai: "Còn lại",
  chonSoConLaiKhongApDung: "—",
  chonSoConLaiSo: (con: number, tong: number) => `${con}/${tong} số`,
  chonSoHetSachSo: "Đã phát hết số",
  chonSoErrDaiNguyen: "Hai đầu dải số phải là số nguyên.",
  chonSoErrDaiBien: (min: number, max: number) =>
    `Dải số phải nằm trong khoảng ${min} đến ${max} — bảng LED chỉ có 4 chữ số.`,
  chonSoErrDaiNguoc: "Số đầu dải phải nhỏ hơn hoặc bằng số cuối dải.",
  chonSoErrDaiNgan: (n: number) =>
    `Dải phải có ít nhất ${n} số, nếu không nút DỪNG chẳng để làm gì.`,
  chonSoHetSo: "Đã phát hết số của chương trình này. Mời bạn hỏi nhân viên tại quầy.",
  chonSoDangCoNguoiChoi: "Đang có người chơi. Bạn chờ một chút rồi bấm lại nhé.",

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

  // ---- Độ khó + bảng tỉ lệ (form tạo chương trình) ----
  // Trang /cai-dat đã bị xoá; những khoá còn lại ở đây phục vụ `components/form-tao.tsx`.
  difficulty: "Độ khó",
  custom: "Tuỳ chỉnh",
  passCount: "Số lướt qua trong một lượt",
  times: "lần",
  atSecond: "tại giây",
  oddsNote:
    "Ước tính dựa trên độ lệch phản xạ 0,08 giây của người thường. Tốc độ đổi CẢM GIÁC khó, còn tỉ lệ trúng chủ yếu do (giới hạn lượt − thời gian khoá nút) quyết định.",

  // ---- Chiếu lên màn hình LCD ----
  lcdScanToPlay: "QUÉT MÃ ĐỂ CHƠI",
  lcdRoomCode: "Mã phòng",
  lcdWaiting: "Đang chờ người chơi…",
  lcdJoined: "Có người vừa quét mã — chuẩn bị!",
  lcdPlaying: "ĐANG CHƠI",
  lcdOffline:
    "⚠️ Chưa nối được máy chủ trung chuyển. Màn hình vẫn hiện mã QR và phụ huynh vẫn chơi được trên điện thoại, nhưng KHÔNG chiếu song song lên đây. Kiểm tra xem đã chạy `npm run trung-tam` chưa.",

  // ---- Tạo chương trình: cơ sở + chế độ (GĐ 11.2) ----
  createBranch: "Cơ sở tổ chức",
  createBranchNone: "Chưa có cơ sở nào. Vào mục Cơ sở thêm một cái trước đã.",
  createBranchSkip: "— Không gán cơ sở —",
  createBranchSkipNote:
    "Phụ huynh sẽ TỰ CHỌN cơ sở ở bước nhập họ tên và số điện thoại, danh sách lấy từ mục Cơ sở. Dùng khi một mã QR chạy cho nhiều cơ sở, hoặc khi quảng cáo chưa biết khách ở gần chỗ nào.",
  chuaGanCoSo: "Chưa gán cơ sở",
  createBranchGo: "Mở mục Cơ sở",
  createMode: "Chế độ chơi",
  createModeCounter: "Tại quầy, có màn hình LCD",
  createModeCounterNote: "Điện thoại là nút bấm, dãy số chỉ hiện trên màn hình lớn.",
  createModeOnline: "Online, chơi một mình",
  createModeOnlineNote: "Dãy số hiện ngay trên điện thoại người chơi — dùng cho quảng cáo.",
  createBranchSource: "Cơ sở của người chơi",
  createBranchSourceFixed: "Gán sẵn cơ sở này",
  createBranchSourceAsk: "Để phụ huynh tự chọn",
  createTries: "Số lần bấm mỗi ván",
  createTriesNote: "Mỗi ván chỉ một phần quà. Bấm nhiều lần thì lấy lần lệch ít nhất, và trúng là dừng ngay.",
  // ---- Dấu ? giải thích thông số (GĐ 26) ----
  // Viết theo lối "đặt số này thì điều gì xảy ra", KHÔNG định nghĩa lại tên ô.
  // Một gợi ý chỉ nhắc lại cái nhãn là một gợi ý vô dụng.
  goiYNhan: "Xem giải thích",
  gySoTrung:
    "Con số phụ huynh phải bấm DỪNG đúng lúc bảng LED hiện ra. Trùng khít cả 4 chữ số mới " +
    "tính trúng, lệch một số cũng là chưa trúng. 🔴 Đổi số này KHÔNG làm đổi tỉ lệ trúng — " +
    "tỉ lệ do độ khó quyết định, không do con số. Chọn số dễ nhớ để in lên tờ QR là được.",
  gyDoKho:
    "Quyết định dãy số chạy nhanh cỡ nào và nút DỪNG bị khoá bao lâu. Đây mới là thứ đổi " +
    "tỉ lệ trúng — xem bảng ngay bên dưới, nó tính lại ngay khi bạn đổi mức. Mức càng khó " +
    "thì dãy chạy càng nhanh và cửa sổ bấm trúng càng hẹp.",
  gyTranGiai:
    "Số giải TỐI ĐA phát ra trong một ngày. Chạm trần thì người chơi vẫn chơi và vẫn thấy " +
    "mình dừng đúng số, nhưng màn kết quả báo hết quà hôm nay. Để 0 là không giới hạn — " +
    "khi đó thứ duy nhất chặn ngân sách là số lượng trong kho quà.",
  gySoLanBam:
    "Một VÁN được bấm mấy lần. Ván vẫn chỉ nhận MỘT phần quà: trúng là dừng ngay, không " +
    "trúng thì lấy lần lệch ít nhất. Tăng số này là tăng tỉ lệ trúng theo công thức " +
    "1−(1−p)^N — nhìn dòng dự báo tiền quà bên dưới trước khi chốt.",
  gyCheDo:
    "TẠI QUẦY: dãy số chỉ hiện trên màn hình LCD, điện thoại phụ huynh là nút bấm, một " +
    "lúc một người. ONLINE: điện thoại tự vẽ dãy số, ai vào cũng chơi ngay không phải xếp " +
    "hàng — dùng cho link quảng cáo.",
  gyCoSo:
    "Cơ sở đứng tên chương trình này. Mọi ván chơi và khách tiềm năng sinh ra sẽ gom về " +
    "đây để báo cáo. Chọn “Không gán cơ sở” khi một mã QR chạy cho nhiều cơ sở — lúc đó " +
    "phụ huynh tự chọn ở bước nhập số điện thoại.",
  gyKhoSoLuong:
    "Số phần quà loại này còn trong kho. Hết thì máy TỰ tụt xuống loại kế tiếp, người " +
    "chơi không hề biết. 🔴 Để TRỐNG = không giới hạn, và đó là loại ĐÁY KHO — kho phải " +
    "luôn có ít nhất một loại như vậy, nếu không hết hàng là người trúng chẳng nhận được gì.",
  gyKhoTranNgay:
    "Trần riêng cho LOẠI quà này trong một ngày, tách khỏi trần chung của chương trình. " +
    "Dùng để giữ món đắt tiền không bị phát hết trong buổi sáng. Để 0 là không giới hạn " +
    "trong ngày.",

  // ---- Sửa thiết lập chương trình (GĐ 24) ----
  suaMo: "Sửa thiết lập",
  suaDong: "Đóng",
  suaTieuDe: "Sửa thiết lập chương trình",
  suaLuu: "LƯU THAY ĐỔI",
  suaXongNhac: "Đã lưu. Mã QR đã in vẫn dùng được — mã phòng không đổi.",
  suaCanhBaoCoVan: (van: number, soCu: string) =>
    `Chương trình này đã có ${van} ván chơi, và chúng được chấm theo số cũ ${soCu}. Đổi số bây giờ thì cột "Kết quả" của những ván đó không còn khớp với con số đang hiện. Lịch sử giữ nguyên, không bị sửa lại.`,
  suaNhacKhongDoi: "Mã phòng, cơ sở và chế độ chơi KHÔNG đổi — đổi chúng là một chương trình khác.",

  createErrPrize: "Chưa điền tên phần thưởng.",
  createErrTarget: "Số trúng thưởng phải là 4 chữ số từ 0000 đến 9999.",
  createErrLevel: "Chưa chọn độ khó.",
  createErrCap: "Trần giải mỗi ngày không được là số âm.",
  createErrNoBranch: "Không tìm thấy cơ sở đã chọn. Chọn lại giúp mình nhé.",
  createErrBranchOff: "Cơ sở này đang tắt. Bật lại ở mục Cơ sở, hoặc chọn cơ sở khác.",
  createErrMode: "Chưa chọn chế độ chơi.",
  createErrBranchSource: "Chưa chọn cơ sở của người chơi.",
  createErrTries: (min: number, max: number) =>
    `Số lần bấm mỗi ván phải từ ${min} đến ${max}.`,

  detailTries: (n: number) => `${n} lần bấm mỗi ván`,

  // ---- Bảng tỉ lệ theo ván + dự báo ngân sách (GĐ 12.2) ----
  createOddsPerVan: "mỗi ván",
  createOddsPerPress: "mỗi lần bấm",
  createForecast: "Dự báo tiền quà",
  createForecastLine: (giai: string, van: number) =>
    `khoảng ${giai} giải mỗi ngày, tính trên ${van} ván/ngày`,
  createForecastCap: (tran: number) => `Trần bạn đặt là ${tran} giải/ngày`,
  createForecastNoCap: "Bạn đang để KHÔNG GIỚI HẠN số giải mỗi ngày.",
  createForecastOver:
    "⚠️ Dự báo đã chạm hoặc vượt trần bạn đặt. Giảm số lần bấm, chọn mức khó hơn, hoặc nâng trần cho khớp thực tế.",
  createTriesEffect: (lan: number, tu: string, den: string) =>
    `${lan} lần bấm mỗi ván đẩy tỉ lệ từ ${tu} lên ${den}.`,

  // ---- Ván nhiều lần bấm (GĐ 12) ----
  phoneOneVanADay: "Mỗi số điện thoại chơi một ván mỗi ngày. Hẹn bạn ngày mai nhé!",
  vanLanThu: (lan: number, tong: number) => `Lần ${lan}/${tong}`,
  vanTotNhat: (lech: number) => `tốt nhất đang là lệch ${lech}`,
  vanConLan: (con: number) => `Còn ${con} lần bấm`,
  vanBamTiep: "BẤM TIẾP",
  vanKetQuaTotNhat: "Lần lệch ít nhất trong ván",

  // ---- Khách tiềm năng + nhật ký + quyền riêng tư (GĐ 15.3) ----
  leadTitle: "Khách tiềm năng",
  leadSubtitle: "Phụ huynh đã để lại số khi chơi. Một người × một cơ sở = một dòng.",
  leadEmpty: "Chưa có khách nào trong phạm vi của bạn.",
  leadName: "Họ và tên",
  leadPhone: "Số điện thoại",
  leadBranch: "Cơ sở",
  leadOwner: "Ai chăm sóc",
  leadOwnerNone: "Chưa giao",
  leadState: "Trạng thái",
  leadConsent: "Đồng ý tư vấn",
  leadConsentYes: "Có",
  leadConsentNo: "Không",
  leadCreated: "Để lại số lúc",
  leadShowFull: "Hiện đầy đủ",
  leadHideFull: "Che lại",
  leadMaskNote: "Số điện thoại được che sẵn để người đi ngang qua quầy không đọc được. Bấm “Hiện đầy đủ” khi cần gọi.",
  leadCount: (n: number) => `${n} khách`,
  trangThaiLead: {
    moi: "Mới",
    da_lien_he: "Đã liên hệ",
    hen_hoc_thu: "Hẹn học thử",
    khong_nghe_may: "Không nghe máy",
    chot: "Đã chốt",
    bo: "Bỏ",
  } as Record<string, string>,

  leadLocMoi: "Tất cả",
  leadLocCoSo: "Cơ sở",
  leadLocTrangThai: "Trạng thái",
  leadLocSale: "Người chăm sóc",
  leadLocChuaGiao: "Chỉ khách chưa giao",
  leadLocDongY: "Chỉ người đồng ý nhận tư vấn",
  leadLocTuNgay: "Từ ngày",
  leadLocDenNgay: "Đến ngày",
  leadChia: "Chia luân phiên cho sale đang bật",
  leadChiaXacNhan: "Chia đều những khách CHƯA GIAO của cơ sở này cho các sale đang làm việc? Khách đã giao tay không bị đụng tới.",
  leadChiaXong: (n: number) => `Đã chia ${n} khách cho các sale đang làm việc.`,
  leadChiaChuaChonCoSo: "Chọn một cơ sở trước đã — chia luân phiên là việc của từng cơ sở.",
  leadChiaChuaCoSale: "Cơ sở này chưa có sale nào đang làm việc.",
  leadChiaHetLead: "Không còn khách nào chưa giao.",
  leadGhiChu: "Ghi chú",
  leadGhiChuPlaceholder: "hẹn thứ 7…",
  leadLuu: "Lưu",
  leadDaLuu: "Đã lưu",

  nkTitle: "Nhật ký truy cập",
  nkSubtitle: "Ai đã xem và mang dữ liệu cá nhân của phụ huynh ra ngoài, lúc nào. Chỉ quản trị xem được.",
  nkEmpty: "Chưa có dòng nào.",
  nkWho: "Ai",
  nkWhat: "Hành động",
  nkTarget: "Đối tượng",
  nkRows: "Số dòng",
  nkIp: "Địa chỉ IP",
  nkWhen: "Lúc",
  nkHanhDong: {
    dang_nhap: "Đăng nhập",
    xem_lead: "Xem danh sách khách",
    xuat_file: "Xuất file",
    gan_lead: "Gán khách cho sale",
    xoa_theo_sdt: "Xoá dữ liệu theo SĐT",
    canh_bao_kho: "Kho quà chạm ngưỡng",
    xoa_chuong_trinh: "Xoá chương trình",
    an_chuong_trinh: "Ẩn chương trình",
    xoa_co_so: "Xoá cơ sở",
    an_co_so: "Ẩn cơ sở",
    sua_chuong_trinh: "Sửa thiết lập chương trình",
  } as Record<string, string>,
  nkHeThong: "Hệ thống",

  riengTuTitle: "Quyền riêng tư dữ liệu",
  riengTuHan: (thang: number, so: number) =>
    `Hạn lưu trữ ${thang} tháng. Đang có ${so} khách quá hạn.`,
  riengTuHanKhong: (thang: number) => `Hạn lưu trữ ${thang} tháng. Chưa có khách nào quá hạn.`,
  riengTuXoaNhan: "Xoá sạch dữ liệu của một số điện thoại",
  riengTuXoaHint: "Xoá hồ sơ phụ huynh và mọi dòng khách tiềm năng của số này. Lịch sử ván chơi được giữ lại nhưng thành ẩn danh — đó là sổ đối soát giải thưởng đã trao.",
  riengTuXoaNut: "XOÁ",
  riengTuXoaXacNhan: "Xoá sạch dữ liệu của số điện thoại này? Không hoàn tác được.",
  riengTuXoaXong: (nguoi: number, lead: number) =>
    `Đã xoá ${nguoi} hồ sơ phụ huynh và ${lead} dòng khách tiềm năng.`,
  riengTuXoaKhongThay: "Không tìm thấy số điện thoại này.",
  riengTuXoaSaiSo: "Số điện thoại không hợp lệ.",
  adminGroupKhach: "KHÁCH HÀNG",
  adminNavKhach: "Khách tiềm năng",

  // ---- Nhân viên & phân quyền (GĐ 15.2) ----
  nvTitle: "Nhân viên",
  nvSubtitle: "Vừa là danh sách sale để gán khách, vừa là tài khoản đăng nhập. Cho nghỉ chứ không xoá — khách cũ phải còn dấu vết ai phụ trách.",
  nvAdd: "Thêm nhân viên",
  nvName: "Họ và tên",
  nvBranch: "Cơ sở",
  nvBranchAll: "Toàn hệ thống",
  nvRole: "Vai trò",
  nvPhone: "Điện thoại",
  nvEmail: "Email",
  nvUser: "Tên đăng nhập",
  nvUserHint: "Để trống nếu người này chỉ nhận khách, chưa cần vào hệ thống.",
  nvPass: "Mật khẩu mới",
  nvPassHint: "Từ 8 ký tự. Để trống thì giữ nguyên mật khẩu cũ.",
  nvLogin: "Đăng nhập",
  nvLoginYes: "Đã cấp",
  nvLoginNo: "Chưa cấp",
  nvRevoke: "Thu hồi đăng nhập",
  nvRevokeConfirm: "Thu hồi quyền vào hệ thống của người này? Tên họ vẫn còn trong danh sách để gán khách.",
  nvStatus: "Trạng thái",
  nvWorking: "Đang làm",
  nvLeft: "Đã nghỉ",
  nvRetire: "Cho nghỉ",
  nvRetireConfirm: "Cho người này nghỉ? Họ sẽ không đăng nhập được nữa, nhưng khách cũ vẫn giữ dấu vết ai phụ trách.",
  nvBack: "Nhận lại",
  nvSave: "LƯU NHÂN VIÊN",
  nvUpdate: "LƯU THAY ĐỔI",
  nvCancel: "Huỷ",
  nvEdit: "Sửa",
  nvErrName: "Chưa điền họ và tên.",
  nvErrUserTaken: "Tên đăng nhập này đã có người dùng.",
  nvErrPass: "Mật khẩu phải từ 8 ký tự trở lên.",
  nvErrNoUser: "Muốn đặt mật khẩu thì phải có tên đăng nhập.",
  nvErrQuyen: "Bạn không có quyền làm việc này.",
  vaiTroQuanTri: "Toàn quyền",
  vaiTroQuanLy: "Quản lý cơ sở",
  vaiTroSale: "Chăm sóc khách",
  adminNavNhanVien: "Nhân viên",
  adminNavNhatKy: "Nhật ký",

  // ---- Đăng nhập quản trị (GĐ 15.1) ----
  vaoTitle: "Đăng nhập quản trị",
  vaoSubtitle: "Trang này chỉ dành cho nhân viên trung tâm.",
  vaoUser: "Tên đăng nhập",
  vaoPass: "Mật khẩu",
  vaoSubmit: "ĐĂNG NHẬP",
  vaoSai: "Tên đăng nhập hoặc mật khẩu không đúng.",
  vaoThieuKhoa:
    "Máy chủ chưa được đặt khoá ký phiên nên chưa ai đăng nhập được. Người quản trị máy cần đặt biến môi trường GAME_SU_KIEN_KHOA_PHIEN (chuỗi ngẫu nhiên từ 32 ký tự) rồi khởi động lại.",
  vaoChuaCoTaiKhoan:
    "Chưa có tài khoản nào. Chạy lệnh sau trong thư mục ứng dụng rồi tải lại trang:",
  vaoLenhTao: "npm run tao-quan-tri -- <tên đăng nhập>",
  vaoRa: "Đăng xuất",

  // ---- Nhận diện thương hiệu (GĐ 14.1 · 14.2) ----
  brandTagline: "Đào tạo tài năng công nghệ tương lai",
  brandLogoAlt: "SATA ROBO",
  brandMascotAlt: "Robot Sata Robo giơ cúp vàng ăn mừng",

  // ---- Chế độ chơi online (GĐ 17) ----
  onlineHint: (so: string) => `Bấm DỪNG đúng khoảnh khắc bảng số hiện ${so}`,
  onlineChonCoSo: "Bạn đang ở gần cơ sở nào?",
  onlineChonCoSoNhac: "Chọn cơ sở để trung tâm biết ai sẽ liên hệ với bạn.",
  onlineChonCoSoTrong: "— Chọn cơ sở —",
  onlineThieuCoSo: "Bạn chọn giúp cơ sở gần nhà nhé.",
  onlineCoSoSai: "Cơ sở này hiện không nhận lượt chơi. Bạn chọn cơ sở khác giúp nhé.",
  onlineChuaGanCoSo:
    "Chương trình này chưa gắn cơ sở nên chưa chơi được. Bạn báo giúp nhân viên lễ tân nhé!",
  leadChuaXacThuc: "Số chưa xác thực",
  leadChuaXacThucNhac: "Khách chơi online tự gõ số, hệ thống chưa gửi mã xác minh. Gọi thử trước khi tính vào chỉ tiêu.",

  // ---- Âm thanh (GĐ 14.3) ----
  tiengBat: "🔊 Bật tiếng",
  tiengTat: "🔇 Tắt tiếng",
  tiengNhac:
    "Bấm một lần đầu ca làm. Trình duyệt chỉ cho phát tiếng sau khi có người chạm vào trang.",

  // ---- Cảnh báo kho, 3 kênh (GĐ 13.2) ----
  canhBaoVang: (coSo: string, con: number, tong: number, ten: string) =>
    `${coSo}: còn ${con}/${tong} ${ten}`,
  canhBaoDoDay: (coSo: string, ten: string) =>
    `${coSo}: đã hết quà có hạn, đang trao "${ten}" — loại đáy kho`,
  canhBaoDoCan: (coSo: string) =>
    `${coSo}: KHO ĐÃ CẠN. Người trúng không nhận được gì — nhập hàng hoặc thêm một loại không giới hạn ngay`,
  canhBaoNhan: "Cảnh báo kho quà",

  // ---- Kho quà (GĐ 13) ----
  khoTitle: "Kho quà",
  khoSubtitle: "Bốc theo thứ tự từ trên xuống: hết loại trên mới sang loại dưới.",
  khoEmpty: "Chưa khai kho. Người trúng sẽ nhận đúng tên giải đã đặt lúc tạo chương trình.",
  khoAdd: "Thêm loại quà",
  khoName: "Tên phần quà",
  khoNamePlaceholder: "Balo STEM",
  khoQty: "Số lượng",
  khoQtyHint: "Để TRỐNG = không giới hạn. Loại không giới hạn là loại đáy kho.",
  khoQtyUnlimited: "Không giới hạn",
  khoCapDay: "Trần mỗi ngày",
  khoCapDayHint: "0 = không giới hạn trong ngày.",
  khoValue: "Giá trị mỗi phần (đ)",
  khoOrder: "Thứ tự",
  khoGiven: "Đã trao",
  khoLeft: "Còn lại",
  khoSave: "LƯU LOẠI QUÀ",
  khoUpdate: "LƯU THAY ĐỔI",
  khoCancel: "Huỷ",
  khoEdit: "Sửa",
  khoDelete: "Xoá",
  khoDeleteConfirm: "Xoá loại quà này khỏi kho?",
  khoUp: "Lên trên",
  khoDown: "Xuống dưới",
  khoErrName: "Chưa điền tên phần quà.",
  khoErrQty: "Số lượng phải là số không âm, hoặc để trống nếu không giới hạn.",
  khoErrCap: "Trần mỗi ngày không được là số âm.",
  khoErrGiven: "Loại quà này đã trao cho người chơi rồi nên không xoá được. Muốn ngừng phát thì đặt số lượng bằng đúng số đã trao.",
  khoWarnNoBottom:
    "⚠️ Kho chưa có loại nào ĐỂ TRỐNG số lượng. Hết hàng là người trúng không nhận được gì — hãy thêm một loại không giới hạn ở đáy kho (ví dụ “Buổi học thử”).",

  // ---- Cơ sở (GĐ 11) ----
  coSoTitle: "Cơ sở",
  coSoSubtitle: "Danh mục dùng chung cho mọi game. Chương trình, khách tiềm năng và báo cáo đều gom theo cơ sở ở đây.",
  coSoNew: "Thêm cơ sở",
  coSoEmpty: "Chưa có cơ sở nào. Bấm “Thêm cơ sở” để khai cái đầu tiên.",
  coSoCode: "Mã",
  coSoName: "Tên cơ sở",
  coSoAddress: "Địa chỉ",
  coSoPhone: "Điện thoại",
  coSoNamePlaceholder: "Trung tâm Sata Robo Hải Châu",
  coSoAddressPlaceholder: "114 Hoàng Diệu, Hải Châu, Đà Nẵng",
  coSoPhonePlaceholder: "0236 3888 999",
  coSoAddressHint: "Địa chỉ hiện ngay cạnh mã khi phụ huynh chọn cơ sở — để trống thì họ chỉ thấy tên.",
  coSoSave: "LƯU CƠ SỞ",
  coSoUpdate: "LƯU THAY ĐỔI",
  coSoCancel: "Huỷ",
  coSoEdit: "Sửa",
  coSoOn: "Đang hoạt động",
  coSoOff: "Đã tắt",
  coSoTurnOn: "Bật",
  coSoTurnOff: "Tắt",
  coSoTurnOffConfirm: "Tắt cơ sở này? Nó sẽ không hiện ra khi tạo chương trình mới. Chương trình đang chạy không bị ảnh hưởng.",
  coSoErrNameEmpty: "Chưa điền tên cơ sở.",
  coSoErrNameTaken: "Đã có cơ sở mang tên này rồi. Đặt tên khác để hai bên không lẫn nhau nhé.",
  coSoErrNotFound: "Không tìm thấy cơ sở này. Có thể ai đó vừa xoá nó.",
  coSoCount: (n: number) => `${n} cơ sở`,
  coSoCountOn: (n: number) => `${n} đang hoạt động`,
  adminGroupToChuc: "TỔ CHỨC",
  adminNavCoSo: "Cơ sở",

  // ---- Thể lệ ----
  rulesTitle: "Thể lệ",
  back: "Quay lại",
} as const;

/** Các bước thể lệ — sửa ở đây thì cả trang thể lệ lẫn màn chơi đổi theo. */
/** Thể lệ game CHỌN SỐ — khác Trúng Số ở chỗ KHÔNG có ai trượt. */
export const RULES_CHON_SO: readonly string[] = [
  "Quét mã QR dán tại quầy bằng điện thoại của bạn.",
  "Nhập họ tên và số điện thoại để trung tâm liên hệ khi cần.",
  "Bấm BẮT ĐẦU, rồi nhìn lên màn hình lớn — dãy số bắt đầu chạy.",
  "Bấm DỪNG khi bạn thấy con số mình thích. Mỗi người bấm MỘT lần.",
  "Số dừng lại là số may mắn của bạn — ai chơi cũng có một con số.",
  "Đưa con số đó cùng mã xác thực cho nhân viên để nhận phần quà mang đúng số ấy.",
  "Mỗi số điện thoại chơi một lần mỗi ngày.",
];

export const RULES = [
  "Bấm BẮT ĐẦU, chờ đếm ngược 3 – 2 – 1.",
  "Dãy 4 chữ số chạy từ 0000 và mỗi lúc một nhanh hơn.",
  "Nút DỪNG bị khoá trong lúc bảng số đang tăng tốc — chờ nút sáng đỏ.",
  "Bấm DỪNG đúng khoảnh khắc bảng số hiện đúng con số trúng thưởng.",
  "Trùng khít cả 4 chữ số mới tính trúng. Lệch một số cũng là chưa trúng.",
  "Hết giờ mà chưa bấm thì lượt đó tính là chưa trúng.",
  "Trúng rồi thì đưa màn hình đang chạy cho nhân viên trong 60 giây để nhận thưởng.",
] as const;

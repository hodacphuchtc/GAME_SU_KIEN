/**
 * MỌI chuỗi tiếng Việt hiển thị cho người dùng nằm ở đây — nguồn DUY NHẤT.
 *
 * Luật: thêm khoá vào đây TRƯỚC, rồi mới dùng trong component. Viết thẳng chuỗi
 * vào component thì cùng một khái niệm sẽ có ba cách gọi ở ba màn hình, và
 * không ai sửa nổi cho khớp về sau.
 *
 * Ngôn ngữ hiển thị: Tiếng Việt 100%, ĐÚNG DẤU.
 */
export const T = {
  // ── Chung ────────────────────────────────────────────────────────────────
  tenUngDung: "Vòng Quay May Mắn",
  tenToChuc: "SATA ROBO",
  cauDinhVi: "Đào tạo tài năng công nghệ tương lai",

  // ── Trang thử của V.0 (sẽ bị thay ở V.3) ────────────────────────────────
  thuTieuDe: "Khung ứng dụng đã dựng xong",
  thuMoTa:
    "Trang này chỉ để chứng minh máy chủ chạy và JavaScript tải được trên điện thoại thật. Nó sẽ bị thay bằng vòng quay ở hạng mục V.3.",
  thuNut: "Bấm thử",
  thuDaBam: (n: number) => `Đã bấm ${n} lần — JavaScript chạy tốt.`,
  thuChuaBam: "Chưa bấm lần nào.",
  thuGhiChu:
    "Mở được trang mà bấm không ăn nghĩa là allowedDevOrigins chưa khai đúng.",

  // ── Trang thử vòng quay của V.1 (sẽ bị thay ở GĐ 3) ─────────────────────
  thuVongTieuDe: "Thử vòng quay",
  thuVongMoTa:
    "Sáu ô dưới đây là dữ liệu cắm cứng, chưa có cơ sở dữ liệu. Trang này để bạn nhìn thấy vòng quay chạy thật và kiểm rằng ô cung rộng thì hay trúng hơn.",
  thuVongNut: "QUAY",
  thuVongDangQuay: "Đang quay…",
  thuVongKetQua: (ten: string) => `Kim dừng ở: ${ten}`,
  thuVongChuaQuay: "Bấm QUAY để bắt đầu.",
  thuVongThongKe: "Thống kê phiên này",
  thuVongChuaCoLuot: "Chưa có lượt nào.",
  thuVongCotO: "Ô",
  thuVongCotCung: "Cung",
  thuVongCotTrung: "Đã trúng",
  thuVongGhiChu:
    "Quay càng nhiều lượt thì cột “Đã trúng” càng bám sát cột “Cung” — đó là bằng chứng vòng quay không bị chỉnh.",

  // ── Trang quản trị ───────────────────────────────────────────────────────
  qtTieuDe: "Chương trình vòng quay",
  qtMoTa: "Mỗi cơ sở một chương trình. Quét mã QR của chương trình nào thì quay vòng của chương trình đó.",
  qtTaoMoi: "Tạo chương trình",
  qtChuaCo: "Chưa có chương trình nào. Bấm “Tạo chương trình” để bắt đầu.",
  qtCotCoSo: "Cơ sở",
  qtCotMa: "Mã",
  qtCotSoO: "Số ô",
  qtCotLuot: "Lượt quay",
  qtCotTrangThai: "Trạng thái",
  qtDangChay: "Đang chạy",
  qtKetThuc: "Đã kết thúc",
  qtKhoSapHet: "Kho sắp hết",
  qtKhoCan: "Hết quà thật",

  // ── Form tạo chương trình ────────────────────────────────────────────────
  taoTieuDe: "Tạo chương trình vòng quay",
  taoQuayLai: "Quay lại danh sách",
  taoTenCoSo: "Tên cơ sở",
  taoTenCoSoGoiY: "Ví dụ: Sata Robo Cầu Giấy",
  taoTiLeODay: "Phần vòng dành cho ô an ủi (%)",
  taoTiLeODayGiaiThich:
    "Đây là van ngân sách: để 50% thì trung bình một nửa số lượt nhận quà an ủi, nhờ vậy kho quà thật sống gấp đôi số lượng của nó.",
  taoTranGiai: "Trần giải mỗi ngày (0 = không giới hạn)",
  taoDanhSachO: "Danh sách ô quà",
  taoODayGiaiThich:
    "Để TRỐNG ô số lượng nghĩa là không giới hạn — đó là ô an ủi. Phải có ít nhất một ô như vậy, nếu không hết quà là vòng quay rỗng ngay giữa lúc có phụ huynh đứng trước màn hình.",
  taoCotTenO: "Tên phần quà",
  taoCotSoLuong: "Số lượng",
  taoCotTranNgay: "Trần/ngày",
  taoCotMau: "Màu",
  taoThemO: "+ Thêm ô",
  taoXoaO: "Xoá",
  taoNut: "Tạo chương trình",
  taoDangLuu: "Đang lưu…",
  taoLoiTieuDe: "Chưa lưu được — cần sửa những chỗ sau:",
  taoKhongGioiHan: "không giới hạn",
  // ── Đăng nhập quản trị (3.1) ─────────────────────────────────────────────
  vaoTieuDe: "Đăng nhập quản trị",
  vaoMoTa: "Trang dành cho người vận hành tại quầy. Phụ huynh không cần đăng nhập.",
  vaoMatKhau: "Mật khẩu quản trị",
  vaoNut: "Đăng nhập",
  vaoDangGui: "Đang kiểm…",
  vaoSai: "Mật khẩu không đúng.",
  vaoThieuKhoa:
    "Chưa cấu hình khoá phiên. Máy chủ từ chối mọi lần đăng nhập cho tới khi có khoá — đây là chủ ý, không phải lỗi.",
  vaoThieuMatKhau:
    "Chưa đặt mật khẩu quản trị. Chạy lệnh dưới đây rồi dán kết quả vào tệp .env.local:",
  vaoLenhTao: "npm run bam-mat-khau -- 'mật khẩu bạn chọn'",
  vaoHuongDanKhoa:
    "Khoá phiên đặt ở VONG_QUAY_KHOA_PHIEN (tối thiểu 32 ký tự). Sinh nhanh: npm run bam-mat-khau -- --khoa",
  qtDangXuat: "Đăng xuất",
  // ── Trang chơi (3.2) ─────────────────────────────────────────────────────
  choiTieuDe: "Vòng Quay May Mắn",
  choiMoiNhap: "Điền giúp thông tin để nhận quà nhé",
  choiHoTen: "Họ và tên phụ huynh",
  choiHoTenGoiY: "Ví dụ: Nguyễn Thị Hoa",
  choiSdt: "Số điện thoại",
  choiSdtGoiY: "Ví dụ: 0912345678",
  choiDongYTuVan: "Tôi đồng ý nhận tư vấn về khoá học của Sata Robo",
  choiNut: "Tiếp tục",
  choiDangGui: "Đang kiểm…",
  choiChaoLai: (ten: string) => `Chào ${ten}!`,
  choiSanSang: "Bấm QUAY để nhận phần quà của bạn.",
  choiHetLuot:
    "Số điện thoại này đã quay trong hôm nay rồi. Mỗi người một lượt mỗi ngày — mời bạn quay lại vào ngày mai nhé.",
  choiKhongThayChuongTrinh: "Không tìm thấy chương trình này. Bạn kiểm tra lại mã QR giúp nhé.",
  choiDaKetThuc: "Chương trình này đã kết thúc. Cảm ơn bạn đã quan tâm!",
  choiChuaCoO: "Chương trình chưa khai ô quà nào. Bạn báo giúp nhân viên tại quầy nhé.",
  // ── Lượt quay (3.3) ──────────────────────────────────────────────────────
  quayNut: "QUAY",
  quayDangQuay: "Đang quay…",
  quayDangCoNguoi:
    "Đang có người quay. Bạn chờ vài giây rồi bấm lại giúp nhé — vòng quay phục vụ từng người một.",
  quayHetQua:
    "Chương trình đã hết quà cho hôm nay. Bạn báo giúp nhân viên tại quầy nhé.",
  quayTrungTieuDe: "Chúc mừng bạn!",
  quayTrungO: (ten: string) => `Phần quà của bạn: ${ten}`,
  quayMaXacThuc: "Mã xác thực",
  quayHuongDanNhan: "Bạn đưa màn hình này cho nhân viên tại quầy để nhận quà nhé.",
  // ── Màn hình LCD (4.2) ───────────────────────────────────────────────────
  lcdQuetMa: "Quét mã để chơi",
  lcdHuongDan: "Dùng camera điện thoại quét mã QR bên dưới, điền tên rồi bấm QUAY.",
  lcdDangCho: "Đang chờ người chơi…",
  lcdNguoiChoi: (ten: string) => `${ten} đang quay`,
  lcdTrungTieuDe: "CHÚC MỪNG",
  lcdTrungCua: (ten: string) => `${ten} nhận được`,
  lcdMaXacThuc: "Mã xác thực",
  lcdMatKetNoi: "Mất kết nối với máy chủ — đang thử nối lại…",
  lcdDaKetThuc: "Chương trình đã kết thúc",
  lcdKhongThay: "Không tìm thấy chương trình này",
  // ── Trang chi tiết chương trình + lịch sử (5.1) ──────────────────────────
  ctQuayLai: "← Danh sách chương trình",
  ctTieuDe: (tenCoSo: string) => `Chương trình: ${tenCoSo}`,
  ctMaChuongTrinh: "Mã chương trình",
  ctManHinhLcd: "Mở màn hình LCD",
  ctLinkChoi: "Đường dẫn cho phụ huynh",
  ctKhoTieuDe: "Kho ô quà",
  ctKhoConLai: (n: number) => `còn ${n}`,
  ctKhoKhongGioiHan: "không giới hạn",
  ctCanhBaoVang: "Có ô sắp hết hàng — cần nhập thêm:",
  ctCanhBaoDo:
    "Đã hết sạch quà thật. Vòng quay hiện chỉ còn ô an ủi — người chơi vẫn quay được, nhưng ai cũng chỉ nhận quà an ủi.",
  ctLichSuTieuDe: "Lịch sử lượt quay",
  ctLichSuTrong: "Chưa có lượt quay nào.",
  ctCotGio: "Giờ",
  ctCotNguoi: "Người chơi",
  ctCotSdt: "Số điện thoại",
  ctCotO: "Ô trúng",
  ctCotMa: "Mã xác thực",
  ctCotTrao: "Đã trao",
  ctSoLuot: (n: number) => `${n} lượt`,
  ctDungLai: "Dựng lại",
  ctDangLuu: "Đang lưu…",
  // ── Dựng lại ván (5.2) ───────────────────────────────────────────────────
  dlTieuDe: "Dựng lại ván quay",
  dlQuayLai: "← Về lịch sử",
  dlGiaiThich:
    "Đây là chính vòng quay của lúc đó, dựng lại từ hạt giống đã lưu — kể cả những ô nay đã hết hàng hoặc đã bị sửa. Kim dừng đúng chỗ cũ.",
  dlLucQuay: "Quay lúc",
  dlNguoiChoi: "Người chơi",
  dlOTrung: "Ô đã trúng",
  dlHatGiong: "Hạt giống",
  dlGocDung: "Góc dừng",
  dlPhienBan: "Phiên bản mặt vòng",
  dlChayLai: "Chạy lại",
  dlKhongDungDuoc:
    "Lượt này ghi trước khi hệ thống bắt đầu lưu ảnh chụp mặt vòng, nên không dựng lại được. Các thông số gốc vẫn còn nguyên bên dưới.",
  // ── Xuất Excel (5.3) ─────────────────────────────────────────────────────
  //
  // 🔴 Đây là bản DUY NHẤT mang họ tên và số điện thoại ĐẦY ĐỦ. Nó đi qua lớp
  // chắn 401 của `proxy.ts` và dùng để đối soát trao thưởng. Màn hình quản trị
  // thì che (`ctCotSdt` bên trên) — hai chỗ, hai luật, đừng gộp.
  ctXuatExcel: "Xuất Excel",
  xuatTenTrang: (ma: string) => `Lịch sử ${ma}`,
  xuatTenTep: (ma: string) => `lich-su-${ma}.xlsx`,
  xuatCotGio: "Giờ quay",
  xuatCotHoTen: "Họ và tên",
  xuatCotSdt: "Số điện thoại",
  xuatCotO: "Ô trúng",
  xuatCotMa: "Mã xác thực",
  xuatCotTrao: "Đã trao thưởng",
  xuatCotTuVan: "Đồng ý nhận tư vấn",
  xuatCotHatGiong: "Hạt giống",
  xuatCoDau: "x",
  xuatDongY: "Có",
  xuatKhongDongY: "Không",
  xuatChuaDangNhap: "Chưa đăng nhập",
  xuatKhongThayChuongTrinh: "Không tìm thấy chương trình",
  // ── Nhận diện thương hiệu (6.2) ──────────────────────────────────────────
  nhanDienLogoAlt: "Logo Sata Robo",
  nhanDienLinhVatAlt: "Linh vật robot của Sata Robo",

  // ── Âm thanh (6.1) ───────────────────────────────────────────────────────
  amTatTieng: "Tắt tiếng",
  amBatTieng: "Bật tiếng",
} as const;

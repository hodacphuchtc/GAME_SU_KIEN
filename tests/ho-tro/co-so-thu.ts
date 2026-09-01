import { danhSachCoSo, taoCoSo } from "@/lib/co-so/kho";
import { khoaTenCoSo } from "@/lib/co-so/nhan";

/**
 * Lấy id cơ sở mang tên này, tạo nếu chưa có.
 *
 * Dùng lại theo tên chứ không tạo mù: nhiều ca test dựng hai chương trình "cùng
 * một cơ sở", và nếu helper đẻ hai dòng co_so trùng tên thì bài test tưởng mình
 * đang kiểm chuyện A trong khi dữ liệu nền đã sai từ đầu.
 */
export function coSoThu(ten = "Cơ sở thử"): number {
  const khoa = khoaTenCoSo(ten);
  const cu = danhSachCoSo().find((c) => khoaTenCoSo(c.ten) === khoa);
  return cu ? cu.id : taoCoSo({ ten }).id;
}

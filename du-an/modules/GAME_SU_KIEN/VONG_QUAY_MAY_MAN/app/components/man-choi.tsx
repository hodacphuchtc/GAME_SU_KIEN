"use client";

import { useCallback, useState } from "react";

import { T } from "@/config/locale";
import { ketThucLuot, quayMot, type KetQuaQuay } from "@/app/actions/quay";
import type { NguoiChoi } from "@/lib/nguoi-choi/nhan-dien";
import type { Cung } from "@/lib/vong-quay/chia-o";
import { phatTin } from "@/lib/dong-bo/kenh";
import { tenRutGon } from "@/lib/nguoi-choi/so-dien-thoai";
import { FormNhanDien } from "./form-nhan-dien";
import { LogoSata } from "./nhan-dien-sata";
import { VongQuay } from "./vong-quay";

/**
 * MÀN CHƠI trên điện thoại phụ huynh: nhận diện → quay → nhận quà.
 *
 * 🔴 Máy chủ quyết kết quả TRƯỚC khi vòng bắt đầu chạy. Thành phần này chỉ nhận
 * `gocDung` rồi quay tới đó. Không có một dòng nào ở đây ảnh hưởng được kết quả
 * — kể cả người dùng mở công cụ nhà phát triển và sửa mã trên máy họ.
 */
export function ManChoi({ ma, cungBanDau }: { ma: string; cungBanDau: Cung[] }) {
  const [nguoiChoi, setNguoiChoi] = useState<NguoiChoi | null>(null);
  const [luot, setLuot] = useState<KetQuaQuay["luot"] | null>(null);
  const [loi, setLoi] = useState<string | null>(null);
  const [dangQuay, setDangQuay] = useState(false);
  const [daDung, setDaDung] = useState(false);
  const [batDauLuc, setBatDauLuc] = useState<number | null>(null);

  const nhanNguoiChoi = useCallback(
    (n: NguoiChoi) => {
      setNguoiChoi(n);
      // Màn LCD đổi từ "đang chờ" sang tên người đang đứng ở quầy. Phát hụt thì
      // LCD vẫn ở màn chờ — khó chịu, nhưng không chặn ai chơi.
      void phatTin(ma, { loai: "nguoi-choi-vao", tenRutGon: tenRutGon(n.hoTen) });
    },
    [ma],
  );

  async function bamQuay() {
    if (!nguoiChoi || dangQuay) return;
    setDangQuay(true);
    setLoi(null);

    const kq = await quayMot(ma, nguoiChoi.id);
    if (kq.loi || !kq.luot) {
      setLoi(kq.loi ?? T.quayHetQua);
      setDangQuay(false);
      return;
    }
    setLuot(kq.luot);
    // 🔴 Phát MỐC CỦA MÁY CHỦ (`batDauLuc`), không phát `performance.now()` của
    // máy này: hai máy có hai gốc thời gian khác nhau, LCD quy đổi bằng độ lệch
    // nó tự đo được ở `/api/gio`.
    void phatTin(ma, {
      loai: "bat-dau-quay",
      luotId: kq.luot.id,
      batDauLuc: kq.luot.batDauLuc,
      gocDung: kq.luot.gocDung,
      thoiLuong: kq.luot.thoiLuong,
      phienBanO: kq.luot.phienBanO,
      cung: kq.luot.cung,
      tenRutGon: tenRutGon(nguoiChoi.hoTen),
    });
    // Mốc bắt đầu lấy theo đồng hồ CỦA MÁY NÀY: `performance.now()` là thứ
    // `VongQuay` đo, còn `batDauLuc` của máy chủ là mốc để LCD bắt nhịp ở 4.1.
    setBatDauLuc(performance.now());
  }

  const khiDung = useCallback(async () => {
    setDaDung(true);
    setDangQuay(false);
    if (!luot) return;
    void phatTin(ma, {
      loai: "ket-qua-quay",
      luotId: luot.id,
      oTen: luot.oTen,
      oMau: luot.oMau,
      maXacThuc: luot.maXacThuc,
      tenRutGon: nguoiChoi ? tenRutGon(nguoiChoi.hoTen) : "",
    });
    await ketThucLuot(luot.id);
  }, [luot, ma, nguoiChoi]);

  if (!nguoiChoi) {
    return (
      <>
        <div className="mb-4 flex justify-center">
          <LogoSata chieuCao={40} sizes="140px" preload />
        </div>
        <p className="mb-4 text-center text-sm text-chi">{T.choiMoiNhap}</p>
        <FormNhanDien ma={ma} onXong={nhanNguoiChoi} />
      </>
    );
  }

  return (
    <div className="flex flex-col items-center">
      {!daDung && (
        <p className="mb-3 text-center text-base font-black text-muc">
          {T.choiChaoLai(nguoiChoi.hoTen)}
        </p>
      )}

      <VongQuay
        cung={luot?.cung ?? cungBanDau}
        gocDich={luot?.gocDung ?? null}
        batDauLuc={batDauLuc}
        onDung={khiDung}
      />

      {daDung && luot ? (
        <div className="mt-5 w-full rounded-2xl border border-ke bg-white p-6 text-center">
          <p className="text-xl font-black text-tim">{T.quayTrungTieuDe}</p>
          <p className="mt-2 text-lg font-black text-muc">{T.quayTrungO(luot.oTen)}</p>
          <p className="mt-4 text-xs uppercase tracking-wide text-chi">{T.quayMaXacThuc}</p>
          <p className="font-mono text-3xl font-black tracking-[0.3em] text-cam">
            {luot.maXacThuc}
          </p>
          <p className="mt-4 text-sm text-chi">{T.quayHuongDanNhan}</p>
        </div>
      ) : (
        <>
          {loi && (
            <p
              role="alert"
              className="mt-4 rounded-xl bg-do/10 p-3 text-center text-sm font-semibold text-do"
            >
              {loi}
            </p>
          )}
          <button
            type="button"
            onClick={bamQuay}
            disabled={dangQuay}
            className="mt-5 w-full rounded-2xl bg-cam px-8 py-5 text-2xl font-black tracking-wide text-white disabled:opacity-60"
          >
            {dangQuay ? T.quayDangQuay : T.quayNut}
          </button>
          <p className="mt-3 text-center text-sm text-chi">{T.choiSanSang}</p>
        </>
      )}
    </div>
  );
}

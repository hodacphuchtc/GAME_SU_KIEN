"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent } from "react";

import { NEAR_MISS_THRESHOLD, WIN_VALID_SECONDS, type RoundSettings } from "@/config/game";
import { T } from "@/config/locale";
import { chotLuot, moLuot, roiDi, xinCho } from "@/app/actions/van-choi";
import { canStop, formatNumber } from "@/lib/bo-dem";
import { doLechDongHo } from "@/lib/dong-bo/dong-ho";
import { moKenh, type TinTrongPhong } from "@/lib/dong-bo/kenh";
import { VIBRATE_LOSE, VIBRATE_PRESS, VIBRATE_WIN, vibrate } from "@/lib/rung";
import { useClientString } from "@/lib/tren-may-khach";

/**
 * Màn hình trên điện thoại phụ huynh — CHỈ LÀ NÚT BẤM, không hiện dãy số.
 *
 * Người chơi nhìn màn hình lớn ở lễ tân rồi bấm nút trên máy mình. Nhờ vậy
 * không có hai màn hình để mà lệch nhau, và độ trễ mạng không ảnh hưởng tới
 * kết quả: chính máy này đóng dấu thời gian lúc ngón tay chạm.
 */

type Buoc = "dang-noi" | "ban" | "san-sang" | "cho-chay" | "dang-chay" | "ket-qua";

export interface ManDienThoaiProps {
  ma: string;
  soTrung: number;
  tenTrungTam: string;
  tenGiaiThuong: string;
  thamSo: RoundSettings;
}

interface KetQuaHienThi {
  soDaDung: number;
  trung: boolean;
  khoangLech: number;
  hetGio: boolean;
  maXacThuc: string;
}

export function ManDienThoai({
  ma,
  soTrung,
  tenTrungTam,
  tenGiaiThuong,
  thamSo,
}: ManDienThoaiProps) {
  const [buoc, setBuoc] = useState<Buoc>("dang-noi");
  const [coTheDung, setCoTheDung] = useState(false);
  const [ketQua, setKetQua] = useState<KetQuaHienThi | null>(null);
  const [conHieuLuc, setConHieuLuc] = useState(WIN_VALID_SECONDS);

  const token = useClientString(tokenPhien);

  const lechRef = useRef(0);
  const batDauLucRef = useRef(0);
  const luotIdRef = useRef<number | null>(null);
  const thamSoRef = useRef<RoundSettings>(thamSo);
  const nhipRef = useRef(0);

  // --- Canh đồng hồ + xin chỗ chơi ---
  useEffect(() => {
    if (token === "") return;
    let huy = false;
    void (async () => {
      const [lech, cho] = await Promise.all([
        doLechDongHo(),
        xinCho(ma, "nguoi_choi", token),
      ]);
      if (huy) return;
      lechRef.current = lech.lech;
      setBuoc(cho.duoc ? "san-sang" : "ban");
    })();
    return () => {
      huy = true;
    };
  }, [ma, token]);

  // Nhả chỗ khi đóng tab, để người sau quét được ngay.
  useEffect(() => {
    if (token === "") return;
    const roi = () => void roiDi(ma, "nguoi_choi", token);
    window.addEventListener("pagehide", roi);
    return () => {
      window.removeEventListener("pagehide", roi);
      roi();
    };
  }, [ma, token]);

  const theoDoiMoKhoa = useCallback(() => {
    window.clearInterval(nhipRef.current);
    nhipRef.current = window.setInterval(() => {
      const troi = (Date.now() + lechRef.current - batDauLucRef.current) / 1000;
      setCoTheDung(canStop(thamSoRef.current, troi));
      if (troi >= thamSoRef.current.roundLimitSeconds) {
        window.clearInterval(nhipRef.current);
      }
    }, 100);
  }, []);

  const nhanTin = useCallback(
    (tin: TinTrongPhong) => {
      switch (tin.loai) {
        case "bat-dau":
          luotIdRef.current = tin.luotId;
          batDauLucRef.current = tin.batDauLuc;
          thamSoRef.current = tin.thamSo;
          setCoTheDung(false);
          setKetQua(null);
          setBuoc("dang-chay");
          theoDoiMoKhoa();
          return;
        case "ket-qua":
          window.clearInterval(nhipRef.current);
          luotIdRef.current = null;
          setKetQua({
            soDaDung: tin.soDaDung,
            trung: tin.trung,
            khoangLech: tin.khoangLech,
            hetGio: tin.hetGio,
            maXacThuc: tin.maXacThuc,
          });
          setConHieuLuc(WIN_VALID_SECONDS);
          setBuoc("ket-qua");
          vibrate(tin.trung ? VIBRATE_WIN : VIBRATE_LOSE);
          return;
        default:
          return;
      }
    },
    [theoDoiMoKhoa],
  );

  useEffect(() => moKenh(ma, nhanTin), [ma, nhanTin]);

  useEffect(() => () => window.clearInterval(nhipRef.current), []);

  // Đồng hồ hiệu lực của màn trúng.
  useEffect(() => {
    if (buoc !== "ket-qua" || !ketQua?.trung) return;
    const batDau = Date.now();
    const nhip = window.setInterval(() => {
      const daTroi = Math.floor((Date.now() - batDau) / 1000);
      setConHieuLuc(Math.max(0, WIN_VALID_SECONDS - daTroi));
    }, 500);
    return () => window.clearInterval(nhip);
  }, [buoc, ketQua]);

  const batDau = useCallback(async () => {
    vibrate(VIBRATE_PRESS);
    setBuoc("cho-chay");
    const kq = await moLuot(ma, null);
    if (!kq.ok) setBuoc("san-sang");
    else if (kq.gioMayChu !== undefined) lechRef.current = kq.gioMayChu - Date.now();
  }, [ma]);

  const dung = useCallback(
    (moc: number) => {
      const id = luotIdRef.current;
      if (id === null) return;
      const bayGio = performance.timeOrigin + performance.now();
      const mocTin = Number.isFinite(moc) && Math.abs(moc - performance.now()) < 5000
        ? performance.timeOrigin + moc
        : bayGio;
      const troi = mocTin + lechRef.current - batDauLucRef.current;
      if (!canStop(thamSoRef.current, troi / 1000)) return;
      luotIdRef.current = null;
      vibrate(VIBRATE_PRESS);
      void chotLuot(ma, id, troi, "dien_thoai");
    },
    [ma],
  );

  const bamNut = useCallback(
    (e: PointerEvent<HTMLButtonElement>) => {
      if (buoc === "san-sang") void batDau();
      // 🔴 Lấy mốc của CHÍNH sự kiện chạm, không lấy lúc React chạy tới đây.
      else if (buoc === "dang-chay") dung(e.nativeEvent.timeStamp);
    },
    [buoc, batDau, dung],
  );

  const choiLai = useCallback(() => {
    setKetQua(null);
    setBuoc("san-sang");
  }, []);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-white">
      <header className="px-5 pt-5">
        <p className="text-sm font-semibold text-chi">{tenTrungTam}</p>
        <p className="mt-3 text-xs font-bold uppercase tracking-[0.28em] text-tim">
          {T.targetLabel}
        </p>
        <p className="font-mono text-5xl font-black tracking-[0.15em] text-cam">
          {formatNumber(soTrung)}
        </p>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-5 py-6 text-center">
        {buoc === "dang-noi" && <p className="text-chi">{T.phoneConnecting}</p>}

        {buoc === "ban" && (
          <p className="rounded-2xl bg-vang/15 p-5 text-base font-semibold text-muc">
            {T.phoneBusy}
          </p>
        )}

        {(buoc === "san-sang" || buoc === "cho-chay" || buoc === "dang-chay") && (
          <>
            <p className="text-xl font-black text-muc">{T.phoneLookAtScreen}</p>
            <p className="text-sm leading-relaxed text-chi">
              {T.phoneHint(formatNumber(soTrung))}
            </p>
            <p className="mt-2 text-lg font-bold text-tim">
              {T.prizeLabel}: <span className="text-cam">{tenGiaiThuong}</span>
            </p>
          </>
        )}

        {buoc === "ket-qua" && ketQua && (
          <div className="flex w-full flex-col items-center gap-3">
            {ketQua.trung ? (
              <>
                <p className="text-4xl font-black text-cam">{T.congrats}</p>
                <p className="text-chi">{T.wonExact}</p>
                <p className="font-mono text-5xl font-black text-muc">
                  {formatNumber(ketQua.soDaDung)}
                </p>
                <div
                  className={[
                    "w-full rounded-2xl border p-4",
                    conHieuLuc > 0 ? "border-luc/40 bg-luc/10" : "border-ke bg-suong",
                  ].join(" ")}
                >
                  {conHieuLuc > 0 ? (
                    <>
                      <p className="text-sm font-semibold text-muc">{T.showToStaff}</p>
                      <p className="mt-1 text-sm text-chi">
                        {T.validFor}{" "}
                        <span className="font-mono text-lg font-bold text-muc">
                          {conHieuLuc}
                        </span>{" "}
                        {T.seconds}
                      </p>
                      <p className="mt-3 text-xs uppercase tracking-widest text-chi">
                        {T.verifyCode}
                      </p>
                      <p className="font-mono text-3xl font-black tracking-[0.35em] text-luc">
                        {ketQua.maXacThuc}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-chi">{T.expired}</p>
                  )}
                </div>
              </>
            ) : (
              <>
                <p className="text-3xl font-black text-chi">{T.lost}</p>
                <p className="text-chi">{ketQua.hetGio ? T.timedOut : T.youStoppedAt}</p>
                <p className="font-mono text-5xl font-black text-muc">
                  {formatNumber(ketQua.soDaDung)}
                </p>
                <p
                  className={
                    ketQua.khoangLech <= NEAR_MISS_THRESHOLD
                      ? "text-2xl font-black text-cam"
                      : "text-2xl font-bold text-muc"
                  }
                >
                  {T.offByN(ketQua.khoangLech)}
                </p>
                <p className="text-chi">
                  {ketQua.khoangLech <= NEAR_MISS_THRESHOLD ? T.soClose : T.stillFar}
                </p>
              </>
            )}
          </div>
        )}
      </div>

      <div className="px-5 pb-8">
        {buoc === "ket-qua" ? (
          <button
            type="button"
            onPointerDown={choiLai}
            className="w-full rounded-3xl bg-cam py-6 text-2xl font-black text-white active:scale-[0.99]"
          >
            {T.tryAgain}
          </button>
        ) : (
          <button
            type="button"
            // pointerdown chứ không phải click: click chỉ nổ khi NHẤC ngón tay,
            // tức cộng cả thời gian giữ nút vào độ trễ.
            onPointerDown={bamNut}
            disabled={buoc !== "san-sang" && !(buoc === "dang-chay" && coTheDung)}
            className={[
              "w-full rounded-3xl py-10 text-3xl font-black tracking-widest transition",
              "active:scale-[0.99] disabled:cursor-not-allowed",
              buoc === "dang-chay" && coTheDung
                ? "nhip-tim bg-cam text-white"
                : buoc === "san-sang"
                  ? "bg-tim text-white"
                  : "bg-suong text-chi",
            ].join(" ")}
          >
            {buoc === "san-sang"
              ? T.start
              : buoc === "dang-chay"
                ? coTheDung
                  ? T.stop
                  : T.speedingUp
                : T.phoneWait}
          </button>
        )}
      </div>
    </main>
  );
}

let tokenDaSinh: string | null = null;
function tokenPhien(): string {
  if (tokenDaSinh === null) tokenDaSinh = Math.random().toString(36).slice(2, 12);
  return tokenDaSinh;
}

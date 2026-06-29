"use client";

import React from "react";

// ============================================================
// 建具詳細コンポーネント
// LDK・洋室共通で使用。prefix="ldk" or "yoshitsu" で識別。
// ============================================================

interface TateguDetailProps {
  spec: string; // 片開き / 片引き / 2枚引き違い戸 / 2枚片引き / 3枚引き違い戸 / 3枚片引き
  // --- 共通 ---
  dansa: string;
  setDansa: (v: string) => void;
  dansaKubun: string;
  setDansaKubun: (v: string) => void;
  dansaCustomMm: number | undefined;
  setDansaCustomMm: (v: number | undefined) => void;
  // --- 片開き ---
  katabiraki_w: string; setKatabiraki_w: (v: string) => void;
  katabiraki_h: string; setKatabiraki_h: (v: string) => void;
  katabiraki_mikomi: string; setKatabiraki_mikomi: (v: string) => void;
  katabiraki_tsurimoto: string; setKatabiraki_tsurimoto: (v: string) => void;
  katabiraki_todomatari: string; setKatabiraki_todomatari: (v: string) => void;
  katabiraki_w_custom: number | undefined; setKatabiraki_w_custom: (v: number | undefined) => void;
  katabiraki_h_custom: number | undefined; setKatabiraki_h_custom: (v: number | undefined) => void;
  katabiraki_photo: string; setKatabiraki_photo: (v: string) => void;
  katabiraki_tsurimoto_photo: string; setKatabiraki_tsurimoto_photo: (v: string) => void;
  katabiraki_todomatari_photo: string; setKatabiraki_todomatari_photo: (v: string) => void;
  // --- 片引き ---
  katahiki_method: string; setKatahiki_method: (v: string) => void;
  katahiki_w: string; setKatahiki_w: (v: string) => void;
  katahiki_h: string; setKatahiki_h: (v: string) => void;
  katahiki_mikomi: string; setKatahiki_mikomi: (v: string) => void;
  katahiki_hikite: string; setKatahiki_hikite: (v: string) => void;
  katahiki_w_custom: number | undefined; setKatahiki_w_custom: (v: number | undefined) => void;
  katahiki_h_custom: number | undefined; setKatahiki_h_custom: (v: number | undefined) => void;
  katahiki_method_photo: string; setKatahiki_method_photo: (v: string) => void;
  katahiki_hikite_photo: string; setKatahiki_hikite_photo: (v: string) => void;
  // --- 2枚引き違い戸 ---
  nimai_hiki_method: string; setNimai_hiki_method: (v: string) => void;
  nimai_hiki_w: string; setNimai_hiki_w: (v: string) => void;
  nimai_hiki_h: string; setNimai_hiki_h: (v: string) => void;
  nimai_hiki_mikomi: string; setNimai_hiki_mikomi: (v: string) => void;
  nimai_hiki_hikite: string; setNimai_hiki_hikite: (v: string) => void;
  nimai_hiki_w_custom: number | undefined; setNimai_hiki_w_custom: (v: number | undefined) => void;
  nimai_hiki_h_custom: number | undefined; setNimai_hiki_h_custom: (v: number | undefined) => void;
  nimai_hiki_method_photo: string; setNimai_hiki_method_photo: (v: string) => void;
  nimai_hiki_hikite_photo: string; setNimai_hiki_hikite_photo: (v: string) => void;
  // --- 3枚引き違い戸 ---
  sanmai_hiki_method: string; setSanmai_hiki_method: (v: string) => void;
  sanmai_hiki_w: string; setSanmai_hiki_w: (v: string) => void;
  sanmai_hiki_h: string; setSanmai_hiki_h: (v: string) => void;
  sanmai_hiki_hikite: string; setSanmai_hiki_hikite: (v: string) => void;
  sanmai_hiki_w_custom: number | undefined; setSanmai_hiki_w_custom: (v: number | undefined) => void;
  sanmai_hiki_h_custom: number | undefined; setSanmai_hiki_h_custom: (v: number | undefined) => void;
  sanmai_hiki_method_photo: string; setSanmai_hiki_method_photo: (v: string) => void;
  sanmai_hiki_hikite_photo: string; setSanmai_hiki_hikite_photo: (v: string) => void;
  // --- 3枚片引き ---
  sanmai_kata_method: string; setSanmai_kata_method: (v: string) => void;
  sanmai_kata_w: string; setSanmai_kata_w: (v: string) => void;
  sanmai_kata_h: string; setSanmai_kata_h: (v: string) => void;
  sanmai_kata_mikomi: string; setSanmai_kata_mikomi: (v: string) => void;
  sanmai_kata_hikite: string; setSanmai_kata_hikite: (v: string) => void;
  sanmai_kata_w_custom: number | undefined; setSanmai_kata_w_custom: (v: number | undefined) => void;
  sanmai_kata_h_custom: number | undefined; setSanmai_kata_h_custom: (v: number | undefined) => void;
  sanmai_kata_method_photo: string; setSanmai_kata_method_photo: (v: string) => void;
  sanmai_kata_hikite_photo: string; setSanmai_kata_hikite_photo: (v: string) => void;
  // --- 2枚片引き（UI最小限）---
  nimai_kata_photo: string; setNimai_kata_photo: (v: string) => void;
  nimai_kata_w?: string; setNimai_kata_w?: (v: string) => void;
  nimai_kata_h?: string; setNimai_kata_h?: (v: string) => void;
  nimai_kata_w_custom?: number | undefined; setNimai_kata_w_custom?: (v: number | undefined) => void;
  nimai_kata_h_custom?: number | undefined; setNimai_kata_h_custom?: (v: number | undefined) => void;
  nimai_kata_hikite?: string; setNimai_kata_hikite?: (v: string) => void;
  nimai_kata_hikite_photo?: string; setNimai_kata_hikite_photo?: (v: string) => void;
}

// 共通UIパーツ
function OptionButtons({ label, options, value, onChange }: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground block">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(value === o.value ? "" : o.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              value === o.value
                ? "bg-primary text-primary-foreground"
                : "border border-input text-foreground hover:bg-accent"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

const METHOD_IMAGE: Record<string, string> = {
  utsuri: "/images/吊元/uwaturi.png",
  yguruma: "/images/吊元/Ytoguruma.png",
};
const HIKITE_IMAGE = "/images/吊元/hikidoturimoto.png";
const HIRAKI_TSURIMOTO_IMAGE = "/images/吊元/hirakidoturimoto.png";
const YUKA_TODOMATARI_IMAGE = "/images/吊元/yuka-todomatari.jpg";
const ARM_STOPPER_IMAGE = "/images/吊元/arm-stopper.jpg";

function ReferenceImage({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="border border-dashed border-input rounded-lg p-4 text-center">
      <img src={src} alt={alt} className="max-h-40 mx-auto rounded" />
    </div>
  );
}

function MethodReferenceImages() {
  return (
    <div className="grid grid-cols-2 gap-3">
      <ReferenceImage src={METHOD_IMAGE.utsuri} alt="上吊" />
      <ReferenceImage src={METHOD_IMAGE.yguruma} alt="Y戸車引き戸" />
    </div>
  );
}

function NumberInput({ label, value, onChange }: {
  label: string;
  value: number | undefined;
  onChange: (v: number | undefined) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground block">{label}</label>
      <input
        type="number"
        min="0"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
        className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      />
    </div>
  );
}

const MIKOMI_OPTIONS = [
  { value: "90", label: "90" },
  { value: "110", label: "110" },
  { value: "140", label: "140" },
  { value: "155", label: "155" },
  { value: "172", label: "172" },
];

const H_OPTIONS = [
  { value: "2035", label: "2035（既成高さ）" },
  { value: "order", label: "オーダー" },
];

const HIKITE_OPTIONS = [
  { value: "right", label: "右引手" },
  { value: "left", label: "左引手" },
];

const METHOD_OPTIONS = [
  { value: "utsuri", label: "上吊" },
  { value: "yguruma", label: "Y戸車引き戸" },
];

const DANSA_KUBUN_OPTIONS = [
  { value: "1-10", label: "1〜10" },
  { value: "11-50", label: "11〜50" },
  { value: "51-100", label: "51〜100" },
  { value: "100+", label: "100以上" },
  { value: "custom", label: "手入力" },
];

export function TateguDetail(props: TateguDetailProps) {
  const { spec } = props;

  return (
    <div className="space-y-4">
      {/* 入口段差（共通） */}
      <OptionButtons
        label="入口段差"
        options={[{ value: "yes", label: "あり" }, { value: "no", label: "なし" }]}
        value={props.dansa}
        onChange={props.setDansa}
      />
      {props.dansa === "yes" && (
        <>
          <OptionButtons
            label="段差区分"
            options={DANSA_KUBUN_OPTIONS}
            value={props.dansaKubun}
            onChange={props.setDansaKubun}
          />
          {props.dansaKubun === "custom" && (
            <NumberInput label="段差（mm）手入力" value={props.dansaCustomMm} onChange={props.setDansaCustomMm} />
          )}
        </>
      )}

      {/* ===== 片開き ===== */}
      {spec === "片開き" && (
        <div className="space-y-4">
          <OptionButtons
            label="W"
            options={[735, 755, 780, 825, 875].map((v) => ({ value: String(v), label: String(v) })).concat([{ value: "order", label: "オーダー" }])}
            value={props.katabiraki_w}
            onChange={props.setKatabiraki_w}
          />
          {props.katabiraki_w === "order" && (
            <NumberInput label="W 実寸（mm）" value={props.katabiraki_w_custom} onChange={props.setKatabiraki_w_custom} />
          )}
          <OptionButtons label="H" options={H_OPTIONS} value={props.katabiraki_h} onChange={props.setKatabiraki_h} />
          {props.katabiraki_h === "order" && (
            <NumberInput label="H 実寸（mm）" value={props.katabiraki_h_custom} onChange={props.setKatabiraki_h_custom} />
          )}
          <OptionButtons label="枠見込み" options={MIKOMI_OPTIONS} value={props.katabiraki_mikomi} onChange={props.setKatabiraki_mikomi} />
          <OptionButtons
            label="吊元"
            options={[{ value: "right", label: "右" }, { value: "left", label: "左" }]}
            value={props.katabiraki_tsurimoto}
            onChange={props.setKatabiraki_tsurimoto}
          />
          <ReferenceImage src={HIRAKI_TSURIMOTO_IMAGE} alt="吊元" />
          <OptionButtons
            label="戸当たり"
            options={[{ value: "yuka", label: "床戸当たり" }, { value: "arm", label: "アームストッパー" }]}
            value={props.katabiraki_todomatari}
            onChange={props.setKatabiraki_todomatari}
          />
          {props.katabiraki_todomatari === "yuka" && <ReferenceImage src={YUKA_TODOMATARI_IMAGE} alt="床戸当たり" />}
          {props.katabiraki_todomatari === "arm" && <ReferenceImage src={ARM_STOPPER_IMAGE} alt="アームストッパー" />}
        </div>
      )}

      {/* ===== 片引き ===== */}
      {spec === "片引き" && (
        <div className="space-y-4">
          <OptionButtons label="方式" options={METHOD_OPTIONS} value={props.katahiki_method} onChange={props.setKatahiki_method} />
          <MethodReferenceImages />
          <OptionButtons
            label="W"
            options={[1445, 1645].map((v) => ({ value: String(v), label: String(v) })).concat([{ value: "order", label: "オーダー" }])}
            value={props.katahiki_w}
            onChange={props.setKatahiki_w}
          />
          {props.katahiki_w === "order" && (
            <NumberInput label="W 実寸（mm）" value={props.katahiki_w_custom} onChange={props.setKatahiki_w_custom} />
          )}
          <OptionButtons label="H" options={H_OPTIONS} value={props.katahiki_h} onChange={props.setKatahiki_h} />
          {props.katahiki_h === "order" && (
            <NumberInput label="H 実寸（mm）" value={props.katahiki_h_custom} onChange={props.setKatahiki_h_custom} />
          )}
          <OptionButtons label="枠見込み" options={MIKOMI_OPTIONS} value={props.katahiki_mikomi} onChange={props.setKatahiki_mikomi} />
          <OptionButtons label="引手" options={HIKITE_OPTIONS} value={props.katahiki_hikite} onChange={props.setKatahiki_hikite} />
          <ReferenceImage src={HIKITE_IMAGE} alt="引手" />
        </div>
      )}

      {/* ===== 2枚引き違い戸 ===== */}
      {spec === "2枚引き違い戸" && (
        <div className="space-y-4">
          <OptionButtons label="方式" options={METHOD_OPTIONS} value={props.nimai_hiki_method} onChange={props.setNimai_hiki_method} />
          <MethodReferenceImages />
          <OptionButtons
            label="W"
            options={[{ value: "1645", label: "1645" }, { value: "order", label: "オーダー" }]}
            value={props.nimai_hiki_w}
            onChange={props.setNimai_hiki_w}
          />
          {props.nimai_hiki_w === "order" && (
            <NumberInput label="W 実寸（mm）" value={props.nimai_hiki_w_custom} onChange={props.setNimai_hiki_w_custom} />
          )}
          <OptionButtons label="H" options={H_OPTIONS} value={props.nimai_hiki_h} onChange={props.setNimai_hiki_h} />
          {props.nimai_hiki_h === "order" && (
            <NumberInput label="H 実寸（mm）" value={props.nimai_hiki_h_custom} onChange={props.setNimai_hiki_h_custom} />
          )}
          <OptionButtons label="枠見込み" options={MIKOMI_OPTIONS} value={props.nimai_hiki_mikomi} onChange={props.setNimai_hiki_mikomi} />
          <OptionButtons label="引手" options={HIKITE_OPTIONS} value={props.nimai_hiki_hikite} onChange={props.setNimai_hiki_hikite} />
          <ReferenceImage src={HIKITE_IMAGE} alt="引手" />
        </div>
      )}

      {/* ===== 3枚引き違い戸 ===== */}
      {spec === "3枚引き違い戸" && (
        <div className="space-y-4">
          <OptionButtons label="方式" options={METHOD_OPTIONS} value={props.sanmai_hiki_method} onChange={props.setSanmai_hiki_method} />
          <MethodReferenceImages />
          <OptionButtons
            label="W"
            options={[{ value: "2430", label: "2430" }, { value: "order", label: "オーダー" }]}
            value={props.sanmai_hiki_w}
            onChange={props.setSanmai_hiki_w}
          />
          {props.sanmai_hiki_w === "order" && (
            <NumberInput label="W 実寸（mm）" value={props.sanmai_hiki_w_custom} onChange={props.setSanmai_hiki_w_custom} />
          )}
          <OptionButtons label="H" options={H_OPTIONS} value={props.sanmai_hiki_h} onChange={props.setSanmai_hiki_h} />
          {props.sanmai_hiki_h === "order" && (
            <NumberInput label="H 実寸（mm）" value={props.sanmai_hiki_h_custom} onChange={props.setSanmai_hiki_h_custom} />
          )}
          {/* 3枚引き違い戸は枠見込み155固定 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground block">枠見込み</label>
            <p className="text-sm text-foreground px-1">155（固定）</p>
          </div>
          <OptionButtons label="引手" options={HIKITE_OPTIONS} value={props.sanmai_hiki_hikite} onChange={props.setSanmai_hiki_hikite} />
          <ReferenceImage src={HIKITE_IMAGE} alt="引手" />
        </div>
      )}

      {/* ===== 3枚片引き ===== */}
      {spec === "3枚片引き" && (
        <div className="space-y-4">
          <OptionButtons label="方式" options={METHOD_OPTIONS} value={props.sanmai_kata_method} onChange={props.setSanmai_kata_method} />
          <MethodReferenceImages />
          <OptionButtons
            label="W"
            options={[
              { value: props.sanmai_kata_method === "yguruma" ? "3217" : "3198", label: props.sanmai_kata_method === "yguruma" ? "3217" : "3198" },
              { value: "order", label: "オーダー" },
            ]}
            value={props.sanmai_kata_w}
            onChange={props.setSanmai_kata_w}
          />
          {props.sanmai_kata_w === "order" && (
            <NumberInput label="W 実寸（mm）" value={props.sanmai_kata_w_custom} onChange={props.setSanmai_kata_w_custom} />
          )}
          <OptionButtons label="H" options={H_OPTIONS} value={props.sanmai_kata_h} onChange={props.setSanmai_kata_h} />
          {props.sanmai_kata_h === "order" && (
            <NumberInput label="H 実寸（mm）" value={props.sanmai_kata_h_custom} onChange={props.setSanmai_kata_h_custom} />
          )}
          <OptionButtons
            label="枠見込み"
            options={[{ value: "155", label: "155" }, { value: "192", label: "192" }]}
            value={props.sanmai_kata_mikomi}
            onChange={props.setSanmai_kata_mikomi}
          />
          <OptionButtons label="引手" options={HIKITE_OPTIONS} value={props.sanmai_kata_hikite} onChange={props.setSanmai_kata_hikite} />
          <ReferenceImage src={HIKITE_IMAGE} alt="引手" />
        </div>
      )}

      {/* ===== 2枚片引き ===== */}
      {spec === "2枚片引き" && (
        <div className="space-y-4">
          {props.setNimai_kata_w && (
            <>
              <OptionButtons
                label="W"
                options={[{ value: "2430", label: "2430" }, { value: "order", label: "オーダー" }]}
                value={props.nimai_kata_w ?? ""}
                onChange={props.setNimai_kata_w}
              />
              {props.nimai_kata_w === "order" && props.setNimai_kata_w_custom && (
                <NumberInput label="W 実寸（mm）" value={props.nimai_kata_w_custom} onChange={props.setNimai_kata_w_custom} />
              )}
              {props.setNimai_kata_h && (
                <OptionButtons
                  label="H"
                  options={[{ value: "2035", label: "2035（既成高さ）" }, { value: "order", label: "オーダー" }]}
                  value={props.nimai_kata_h ?? ""}
                  onChange={props.setNimai_kata_h}
                />
              )}
              {props.nimai_kata_h === "order" && props.setNimai_kata_h_custom && (
                <NumberInput label="H 実寸（mm）" value={props.nimai_kata_h_custom} onChange={props.setNimai_kata_h_custom} />
              )}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground block">枠見込み</label>
                <p className="text-sm text-foreground px-1">155（固定）</p>
              </div>
              {props.setNimai_kata_hikite && (
                <OptionButtons
                  label="引手"
                  options={[{ value: "right", label: "右引手" }, { value: "left", label: "左引手" }]}
                  value={props.nimai_kata_hikite ?? ""}
                  onChange={props.setNimai_kata_hikite}
                />
              )}
              <ReferenceImage src={HIKITE_IMAGE} alt="引手" />
            </>
          )}
        </div>
      )}
    </div>
  );
}

import React from "react";
import type { LuuDisplayOptions } from "../lib/types";

export function LuuStarOptions({
  value,
  onChange,
}: {
  value: LuuDisplayOptions;
  onChange: (next: LuuDisplayOptions) => void;
}) {
  const set = (key: keyof LuuDisplayOptions, checked: boolean) => onChange({ ...value, [key]: checked });

  return (
    <div className="luu-star-options">
      <label>
        <input type="checkbox" checked={value.showLuuTuHoa} onChange={(e) => set("showLuuTuHoa", e.target.checked)} />
        Lưu tứ hóa
      </label>

      <label>
        <input type="checkbox" checked={value.showLuuTuDuc} onChange={(e) => set("showLuuTuDuc", e.target.checked)} />
        Lưu tứ đức
      </label>

      <label>
        <input type="checkbox" checked={value.showLuuDaiVan} onChange={(e) => set("showLuuDaiVan", e.target.checked)} />
        Lưu đại vận
      </label>

      <label>
        <input
          type="checkbox"
          checked={value.showLuuOtherStars}
          onChange={(e) => set("showLuuOtherStars", e.target.checked)}
        />
        Lưu các sao khác
      </label>

      <label>
        <input type="checkbox" checked={value.showLocKyNhap} onChange={(e) => set("showLocKyNhap", e.target.checked)} />
        Lộc Kỵ nhập
      </label>

      <label>
        <input
          type="checkbox"
          checked={value.showLuuTuanTriet}
          onChange={(e) => set("showLuuTuanTriet", e.target.checked)}
        />
        Lưu Tuần Triệt
      </label>
    </div>
  );
}

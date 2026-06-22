import React from "react";
import type { BirthInput } from "../lib/types";

export type SampleChartPreset = {
  id: string;
  label: string;
  subtitle: string;
  input: BirthInput;
};

type Props = {
  presets: SampleChartPreset[];
  onSelect: (preset: SampleChartPreset) => void;
};

export default function SampleChartsSection({ presets, onSelect }: Props) {
  return (
    <section className="content-section" id="la-so-mau">
      <div className="section-heading">
        <p className="eyebrow">Lá Số Mẫu</p>
        <h2>Xem Trước Một Số Lá Số Mẫu</h2>
        <p>
          Tham khảo cách hiển thị lá số và nội dung luận giải trước khi tạo lá số của riêng bạn.
        </p>
      </div>

      <div className="sample-grid">
        {presets.map((preset) => (
          <article key={preset.id} className="sample-card">
            <p className="sample-card-kicker">{preset.label}</p>
            <h3>{preset.subtitle}</h3>
            <p>Năm sinh: {preset.input.year}</p>
            <p>Giới tính: {preset.input.gender === "male" ? "Nam" : "Nữ"}</p>
            <button type="button" className="ghost-button" onClick={() => onSelect(preset)}>
              Xem lá số mẫu
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}


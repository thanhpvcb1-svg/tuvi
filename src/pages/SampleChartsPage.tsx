import React from "react";
import { useNavigate } from "react-router-dom";
import SampleChartsSection, { type SampleChartPreset } from "../components/SampleChartsSection";
import SEOHead from "../components/SEOHead";
import { organizationSchema, breadcrumbSchema } from "../schemas/seoSchemas";
import type { BirthInput } from "../lib/types";

const currentYear = new Date().getFullYear();

const sampleCharts: SampleChartPreset[] = [
  {
    id: "sample-1",
    label: "Lá số mẫu 1",
    subtitle: "Người sinh năm 1996 · Nam",
    input: {
      fullName: "Lá số mẫu 1",
      year: "1996",
      month: "8",
      day: "17",
      birthHour: "9",
      birthMinute: "30",
      gender: "male",
      calendarType: "solar",
      horoscopeYear: String(currentYear),
      unknownBirthTime: false,
    },
  },
  {
    id: "sample-2",
    label: "Lá số mẫu 2",
    subtitle: "Người sinh năm 1989 · Nữ",
    input: {
      fullName: "Lá số mẫu 2",
      year: "1989",
      month: "12",
      day: "4",
      birthHour: "15",
      birthMinute: "0",
      gender: "female",
      calendarType: "solar",
      horoscopeYear: String(currentYear),
      unknownBirthTime: false,
    },
  },
  {
    id: "sample-3",
    label: "Lá số mẫu 3",
    subtitle: "Người sinh năm 2001 · Chưa rõ giờ sinh",
    input: {
      fullName: "Lá số mẫu 3",
      year: "2001",
      month: "3",
      day: "22",
      birthHour: "",
      birthMinute: "",
      gender: "female",
      calendarType: "solar",
      horoscopeYear: String(currentYear),
      unknownBirthTime: true,
    },
  },
];

type Props = {
  onNavigateChartForm: () => void;
  onGenerateFromInput: (input: BirthInput) => void;
};

export default function SampleChartsPage({ onNavigateChartForm, onGenerateFromInput }: Props) {
  const navigate = useNavigate();

  return (
    <div className="home-page">
      <SEOHead
        title="Lá Số Tử Vi Mẫu | Xem Demo 12 Cung Trước Khi Lập | TuViPhongLam"
        description="Xem lá số tử vi mẫu miễn phí. Hiểu cách hiển thị Mệnh, Thân, 12 cung, đại vận trước khi lập lá số của bạn."
        canonicalPath="/la-so-mau"
        schema={[
          organizationSchema,
          breadcrumbSchema([{ name: "Trang chủ", path: "/" }, { name: "Lá số mẫu", path: "/la-so-mau" }]),
        ]}
      />

      <section className="content-section">
        <div className="section-heading">
          <p className="eyebrow">Lá số mẫu</p>
          <h1>Lá số tử vi mẫu</h1>
          <p>Trang này giúp bạn hình dung cách lá số hiển thị Mệnh, Thân, 12 cung, đại vận và tiểu vận trước khi tạo lá số riêng.</p>
        </div>
      </section>

      <SampleChartsSection
        presets={sampleCharts}
        onSelect={(preset) => onGenerateFromInput(preset.input)}
      />

      <section className="content-section">
        <div className="seo-copy-grid">
          <article className="seo-copy-card">
            <h3>Mẫu đọc phần nền</h3>
            <p>Dùng để xem cách Mệnh, Thân, Cục và 12 cung được trình bày trước khi bạn nhập dữ liệu thật của mình.</p>
          </article>
          <article className="seo-copy-card">
            <h3>Mẫu theo dõi vận năm</h3>
            <p>Phù hợp nếu bạn muốn hiểu cách năm đang xem được đặt trong đại vận, tiểu vận và các cung liên quan.</p>
          </article>
          <article className="seo-copy-card">
            <h3>Mẫu chưa rõ giờ sinh</h3>
            <p>Giúp bạn thấy phần nào vẫn có thể tham khảo và phần nào nên đọc dè dặt khi chưa có giờ sinh chính xác.</p>
          </article>
          <article className="seo-copy-card">
            <h3>Mẫu đặt câu hỏi sâu</h3>
            <p>Sau khi xem mẫu, bạn có thể hình dung nên hỏi theo một vấn đề cụ thể thay vì yêu cầu luận toàn bộ lá số cùng lúc.</p>
          </article>
        </div>
      </section>

      <section className="content-section">
        <div className="placeholder-card">
          <h2>Bạn muốn xem lá số của chính mình?</h2>
          <p>Chỉ cần nhập ngày giờ sinh để tạo lá số miễn phí và xem nhanh các cung quan trọng.</p>
          <div className="home-hero-actions">
            <button type="button" className="primary-button" onClick={onNavigateChartForm}>Lập lá số của tôi</button>
            <button type="button" className="ghost-button" onClick={() => navigate("/bang-gia")}>Hỏi 1 câu về lá số của tôi</button>
          </div>
        </div>
      </section>
    </div>
  );
}

import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ResultSummaryCards from "../components/ResultSummaryCards";
import SampleChartsSection, { type SampleChartPreset } from "../components/SampleChartsSection";
import SEOHead from "../components/SEOHead";
import StreamingAnalysis from "../components/StreamingAnalysis";
import TuviChart from "../components/TuviChart";
import { getActivePalaceIndexes } from "../components/VanHanhSelector";
import { currentYear, getDefaultLuuOptions, loadChartModules, normalizeBirthInput } from "../context/AppContext";
import { buildSummaryCards } from "../lib/chartUi";
import type { BirthInput, ChartView, PalaceView, StarView } from "../lib/types";
import { breadcrumbSchema, organizationSchema } from "../schemas/seoSchemas";

/**
 * /la-so-mau/ - Demo luận giải Tử Vi Bắc phái trên MỘT lá số mẫu cố định.
 * Lá số được tạo bằng đúng pipeline của trang /lap-la-so (normalizeBirthInput -> createChart),
 * phần luận giải dùng lại StreamingAnalysis (tri thức đã khớp + AI) - không có nội dung dựng sẵn.
 */

// Lá số minh họa, không phải người thật.
const DEMO_INPUT: BirthInput = {
  fullName: "Lá số mẫu",
  year: "1990",
  month: "5",
  day: "12",
  birthHour: "13",
  birthMinute: "0",
  gender: "male",
  calendarType: "solar",
  horoscopeYear: String(currentYear),
  unknownBirthTime: false,
  hidePersonalInfo: false,
};
const DEMO_BIRTH_YEAR = Number(DEMO_INPUT.year);
const DEMO_LABEL = "Nam, sinh ngày 12/5/1990 (dương lịch), giờ Mùi";

// Các lá số mẫu khác để thử nhanh trên trang lập lá số (cố định, không ngẫu nhiên mỗi lần tải).
const OTHER_PRESETS: SampleChartPreset[] = [
  {
    id: "sample-female",
    label: "Lá số mẫu nữ",
    subtitle: "Nữ, sinh 1985 · giờ Dần",
    input: { ...DEMO_INPUT, fullName: "Lá số mẫu nữ", year: "1985", month: "9", day: "3", birthHour: "4", gender: "female" },
  },
  {
    id: "sample-young",
    label: "Lá số mẫu 2000",
    subtitle: "Nam, sinh 2000 · giờ Tuất",
    input: { ...DEMO_INPUT, fullName: "Lá số mẫu 2000", year: "2000", month: "2", day: "8", birthHour: "19" },
  },
  {
    id: "sample-unknown",
    label: "Chưa rõ giờ sinh",
    subtitle: "Nữ, sinh 1978 · chưa rõ giờ sinh",
    input: { ...DEMO_INPUT, fullName: "Chưa rõ giờ sinh", year: "1978", month: "11", day: "20", birthHour: "", birthMinute: "", gender: "female", unknownBirthTime: true },
  },
];

const PALACE_ORDER = ["Mệnh", "Phụ Mẫu", "Phúc Đức", "Điền Trạch", "Quan Lộc", "Nô Bộc", "Thiên Di", "Tật Ách", "Tài Bạch", "Tử Tức", "Phu Thê", "Huynh Đệ"];

const isNatal = (star: StarView) => !star.scope || star.scope === "origin";

function describeMainStars(palace: PalaceView | undefined): string {
  const stars = (palace?.majorStars ?? []).filter(isNatal);
  if (!stars.length) return "vô chính diệu";
  return stars
    .map((s) => `${s.name}${s.brightnessFull ? ` (${s.brightnessFull.toLowerCase()})` : ""}${s.mutagen ? ` hóa ${s.mutagen}` : ""}`)
    .join(", ");
}

function findPalaceByName(chart: ChartView, name: string) {
  return chart.palaces.find((p) => p.name === name);
}

type Props = {
  onNavigateChartForm: () => void;
  onGenerateFromInput: (input: BirthInput) => void;
};

export default function SampleChartsPage({ onNavigateChartForm, onGenerateFromInput }: Props) {
  const [chart, setChart] = useState<ChartView | null>(null);
  const [chartError, setChartError] = useState(false);
  const [showReading, setShowReading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const normalized = normalizeBirthInput(DEMO_INPUT);
    if (!normalized) return;
    loadChartModules()
      .then(({ createChart }) => {
        if (cancelled) return;
        setChart(
          createChart(normalized, "tuvichancoCompatible", {
            luuOptions: getDefaultLuuOptions(),
            horoscopeDate: new Date(currentYear, 5, 15),
          }),
        );
      })
      .catch(() => !cancelled && setChartError(true));
    return () => {
      cancelled = true;
    };
  }, []);

  const derived = useMemo(() => {
    if (!chart) return null;
    const menh = findPalaceByName(chart, "Mệnh");
    const than = chart.palaces.find((p) => p.isBodyPalace);
    const age = currentYear - DEMO_BIRTH_YEAR;
    const active = getActivePalaceIndexes(chart.palaces, age, menh?.earthlyBranch, chart.profile.fiveElementsClass, chart.profile.yinYangLabel);

    const tuHoa = chart.palaces
      .flatMap((palace) => (palace.majorStars ?? []).concat(palace.minorStars ?? []).filter((s) => isNatal(s) && s.mutagen).map((s) => ({ star: s, palace })))
      .sort((a, b) => ["Lộc", "Quyền", "Khoa", "Kỵ"].indexOf(a.star.mutagen!) - ["Lộc", "Quyền", "Khoa", "Kỵ"].indexOf(b.star.mutagen!));

    const daiVan = chart.palaces
      .map((palace) => ({ palace, start: Number(palace.decadalRange) }))
      .filter((d) => Number.isFinite(d.start) && d.start > 0)
      .sort((a, b) => a.start - b.start);

    return { menh, than, active, tuHoa, daiVan, age };
  }, [chart]);

  return (
    <div className="app workspace-page sample-demo-page">
      <SEOHead
        title="Demo Luận Giải Tử Vi Bắc Phái Trên Lá Số Mẫu | Tử Vi Phong Lam"
        description="Xem cách Tử Vi Phong Lam đọc một lá số mẫu theo Bắc phái: Mệnh – Thân, Mệnh Tài Quan, 12 cung, Tứ Hóa, đại vận và luận giải dựa trên tri thức đã khớp."
        canonicalPath="/la-so-mau"
        schema={[organizationSchema, breadcrumbSchema([{ name: "Trang chủ", path: "/" }, { name: "Lá số mẫu", path: "/la-so-mau" }])]}
      />

      <section className="page-intro">
        <h1>Demo luận giải Tử Vi Bắc phái</h1>
        <p>
          Một lá số mẫu được an bằng đúng công cụ lập lá số của Tử Vi Phong Lam, rồi đọc theo thứ tự Bắc phái: Mệnh – Thân,
          Mệnh – Tài – Quan, 12 cung, Tứ Hóa, đại vận và luận giải dựa trên tri thức khớp với chính lá số này.
        </p>
        <p className="sample-demo__label">Lá số minh họa (không phải người thật): {DEMO_LABEL}. Năm xem {currentYear}.</p>
        <div className="page-intro-cta">
          <button type="button" className="primary-button" onClick={onNavigateChartForm}>
            Lập lá số của tôi
          </button>
          <a href="#luan-giai-mau" className="ghost-button">
            Xem luận giải mẫu
          </a>
        </div>
      </section>

      {chartError ? (
        <section className="content-section">
          <p role="alert">Không tải được lá số mẫu. Vui lòng tải lại trang.</p>
        </section>
      ) : null}

      {!chart || !derived ? (
        <section className="content-section" aria-busy="true">
          <p>Đang an lá số mẫu…</p>
        </section>
      ) : (
        <>
          <section className="content-section" aria-labelledby="demo-tong-quan">
            <div className="section-heading section-heading--compact">
              <h2 id="demo-tong-quan">Tổng quan</h2>
              <p>Các thông số nền của lá số mẫu, lấy trực tiếp từ kết quả an sao.</p>
            </div>
            <ResultSummaryCards items={buildSummaryCards(chart, currentYear, DEMO_BIRTH_YEAR)} hideHeading />
          </section>

          <section className="content-section" aria-labelledby="demo-menh-than">
            <div className="section-heading section-heading--compact">
              <h2 id="demo-menh-than">Mệnh – Thân</h2>
            </div>
            <ul className="demo-facts">
              <li>
                <strong>Cung Mệnh</strong> an tại {derived.menh?.earthlyBranch}, chính tinh: {describeMainStars(derived.menh)}.
              </li>
              <li>
                <strong>Thân cư {derived.than?.name}</strong> tại {derived.than?.earthlyBranch}, chính tinh: {describeMainStars(derived.than)}.
              </li>
              <li>
                <strong>Cục:</strong> {chart.profile.fiveElementsClass} · <strong>Mệnh chủ:</strong> {chart.profile.soul} · <strong>Thân chủ:</strong> {chart.profile.body}
              </li>
            </ul>
            <p className="demo-note">
              Mệnh cho biết nền tảng khí chất, Thân cho biết nơi dồn sức khi trưởng thành - hai cung luôn đọc cùng nhau.{" "}
              <Link to="/bai-viet/cung-than-la-gi">Cung Thân và Thân cư là gì?</Link>
            </p>
          </section>

          <section className="content-section" aria-labelledby="demo-menh-tai-quan">
            <div className="section-heading section-heading--compact">
              <h2 id="demo-menh-tai-quan">Mệnh – Tài – Quan</h2>
              <p>Tam phương tứ chính của cung Mệnh: bản thân, tiền bạc, sự nghiệp và cung xung chiếu Thiên Di.</p>
            </div>
            <div className="seo-copy-grid seo-copy-grid--compact">
              {["Mệnh", "Tài Bạch", "Quan Lộc", "Thiên Di"].map((name) => {
                const palace = findPalaceByName(chart, name);
                return (
                  <article key={name} className="seo-copy-card seo-copy-card--compact">
                    <h3>
                      {name} · {palace?.earthlyBranch}
                    </h3>
                    <p>{describeMainStars(palace)}</p>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="content-section" aria-labelledby="demo-12-cung">
            <div className="section-heading section-heading--compact">
              <h2 id="demo-12-cung">12 cung</h2>
              <p>
                Lá số mẫu đầy đủ với chính tinh, phụ tinh, độ sáng, Tứ Hóa và Phi Hóa can cung.{" "}
                <Link to="/bai-viet/12-cung-trong-la-so-tu-vi">Cách đọc 12 cung</Link>
              </p>
            </div>
            <TuviChart chart={chart} hasRequestedChart activePalaceIndexes={derived.active} showPhiHoaCanCung />
          </section>

          <section className="content-section" aria-labelledby="demo-tu-hoa">
            <div className="section-heading section-heading--compact">
              <h2 id="demo-tu-hoa">Tứ Hóa sinh niên</h2>
              <p>Bốn Hóa phát sinh từ can năm sinh {chart.profile.yearStem}, gắn vào bốn sao cụ thể trên lá số.</p>
            </div>
            <table className="demo-table">
              <thead>
                <tr>
                  <th scope="col">Hóa</th>
                  <th scope="col">Sao</th>
                  <th scope="col">Cung</th>
                </tr>
              </thead>
              <tbody>
                {derived.tuHoa.map(({ star, palace }) => (
                  <tr key={`${star.mutagen}-${star.name}`}>
                    <td>Hóa {star.mutagen}</td>
                    <td>{star.name}</td>
                    <td>
                      {palace.name} ({palace.earthlyBranch})
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="demo-note">
              <Link to="/bai-viet/loc-quyen-khoa-ky-co-y-nghia-gi">Lộc - Quyền - Khoa - Kỵ có ý nghĩa gì?</Link>
            </p>
          </section>

          <section className="content-section" aria-labelledby="demo-dai-van">
            <div className="section-heading section-heading--compact">
              <h2 id="demo-dai-van">Đại vận</h2>
              <p>
                Mỗi đại vận 10 năm đi qua một cung. Năm {currentYear} lá số mẫu {derived.age} tuổi
                {derived.active.daiVanLabel ? `, đang ở đại vận ${derived.active.daiVanLabel}` : ""}.
              </p>
            </div>
            <table className="demo-table">
              <thead>
                <tr>
                  <th scope="col">Tuổi</th>
                  <th scope="col">Cung</th>
                  <th scope="col">Chính tinh</th>
                </tr>
              </thead>
              <tbody>
                {derived.daiVan.map(({ palace, start }) => {
                  const isActive = derived.active.daiVan === palace.index;
                  return (
                    <tr key={palace.name} className={isActive ? "is-active" : undefined} aria-current={isActive ? "true" : undefined}>
                      <td>
                        {start}-{start + 9}
                      </td>
                      <td>
                        {palace.name} ({palace.earthlyBranch})
                      </td>
                      <td>{describeMainStars(palace)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="demo-note">
              <Link to="/bai-viet/dai-van-va-luu-nien-trong-bac-phai">Đại vận và lưu niên trong Bắc phái</Link>
            </p>
          </section>

          <section id="luan-giai-mau" className="content-section" aria-labelledby="demo-luan-giai">
            <div className="section-heading section-heading--compact">
              <h2 id="demo-luan-giai">Luận giải mẫu</h2>
              <p>
                Mỗi cung hiển thị các đoạn tri thức <strong>khớp với chính lá số mẫu</strong> (vị trí cung, sao, độ sáng, Tứ Hóa,
                Phi Hóa...) kèm lý do khớp. Bấm "Giải nghĩa chi tiết" ở một cung hoặc "Luận tổng hợp Bắc Phái" để AI tổng hợp
                từ dữ liệu này; AI được yêu cầu không tự tạo quy tắc và ghi rõ phần thiếu dữ liệu, nhưng vẫn có thể sai sót.
              </p>
            </div>
            {showReading ? (
              <StreamingAnalysis
                chart={chart}
                isActive
                userContext={{ gender: "Nam", yearToView: currentYear, birthYear: DEMO_BIRTH_YEAR }}
              />
            ) : (
              <button type="button" className="primary-button" onClick={() => setShowReading(true)}>
                Xem luận giải mẫu
              </button>
            )}
          </section>
        </>
      )}

      <section className="content-section bottom-cta-section" aria-labelledby="demo-cta">
        <h2 id="demo-cta">Lập lá số của tôi</h2>
        <p>Nhập ngày giờ sinh để an Mệnh, Thân, 12 cung, Tứ Hóa và xem luận giải theo đúng lá số của bạn.</p>
        <button type="button" className="primary-button" onClick={onNavigateChartForm}>
          Lập lá số của tôi
        </button>
      </section>

      <SampleChartsSection presets={OTHER_PRESETS} onSelect={(preset) => onGenerateFromInput(preset.input)} />
    </div>
  );
}

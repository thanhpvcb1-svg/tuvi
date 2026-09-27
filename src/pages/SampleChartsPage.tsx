import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import EvidencePanel from "../components/EvidencePanel";
import ResultSummaryCards from "../components/ResultSummaryCards";
import SampleChartsSection, { type SampleChartPreset } from "../components/SampleChartsSection";
import SEOHead from "../components/SEOHead";
import StreamingAnalysis from "../components/StreamingAnalysis";
import TuviChart from "../components/TuviChart";
import { getActivePalaceIndexes } from "../components/VanHanhSelector";
import { currentYear, getDefaultLuuOptions, loadChartModules, normalizeBirthInput } from "../context/AppContext";
import { buildSummaryCards } from "../lib/chartUi";
import type { BirthInput, ChartView } from "../lib/types";
import { DEMO_BIRTH_YEAR, DEMO_HOUR_LABEL, DEMO_LABEL, demoInput, deriveDemoData } from "../content/demoChart";
import { breadcrumbSchema, organizationSchema } from "../schemas/seoSchemas";

/**
 * /la-so-mau/ - Demo luận giải Tử Vi Bắc phái trên MỘT lá số mẫu cố định.
 * Lá số được tạo bằng đúng pipeline của trang /lap-la-so (normalizeBirthInput -> createChart),
 * phần luận giải dùng lại StreamingAnalysis (tri thức đã khớp + AI) - không có nội dung dựng sẵn.
 */

const DEMO_INPUT: BirthInput = demoInput(currentYear);

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

type Props = {
  onNavigateChartForm: () => void;
  onGenerateFromInput: (input: BirthInput) => void;
};

export default function SampleChartsPage({ onNavigateChartForm, onGenerateFromInput }: Props) {
  const [chart, setChart] = useState<ChartView | null>(null);
  const [chartError, setChartError] = useState(false);
  const [showReading, setShowReading] = useState(false);
  // Tải kho tri thức chỉ khi người xem yêu cầu (không nằm trong initial load)
  const [showEvidence, setShowEvidence] = useState(false);

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

  const demo = useMemo(() => (chart ? deriveDemoData(chart, currentYear) : null), [chart]);
  // Chỉ dùng cho tô sáng cung đại vận / tiểu vận trên bàn lá số (cùng hàm với trang lập lá số)
  const active = useMemo(() => {
    if (!chart) return {};
    const menhBranch = chart.palaces.find((p) => p.name === "Mệnh")?.earthlyBranch;
    return getActivePalaceIndexes(chart.palaces, currentYear - DEMO_BIRTH_YEAR, menhBranch, chart.profile.fiveElementsClass, chart.profile.yinYangLabel);
  }, [chart]);

  return (
    <div className="app workspace-page sample-demo-page">
      <SEOHead
        title="Lá Số Tử Vi Mẫu – Demo Luận Giải Tử Vi Bắc Phái | Tử Vi Phong Lam"
        description="Demo luận giải một lá số mẫu theo Tử Vi Bắc phái: Mệnh – Thân, tam phương tứ chính, 12 cung, Tứ Hóa, Phi Hóa, đại vận và tri thức khớp kèm lý do."
        canonicalPath="/la-so-mau"
        schema={[organizationSchema, breadcrumbSchema([{ name: "Trang chủ", path: "/" }, { name: "Lá số mẫu", path: "/la-so-mau" }])]}
      />

      <section className="page-intro">
        <h1>Lá Số Tử Vi Mẫu – Demo Luận Giải Tử Vi Bắc Phái</h1>
        <p>
          Một lá số mẫu được an bằng đúng công cụ lập lá số của Tử Vi Phong Lam, rồi đọc theo thứ tự Bắc phái: Mệnh – Thân,
          tam phương tứ chính, 12 cung, Tứ Hóa, Phi Hóa, đại vận và luận giải dựa trên tri thức khớp với chính lá số này.
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

      {!chart || !demo ? (
        <section className="content-section" aria-busy="true">
          <p>Đang an lá số mẫu…</p>
        </section>
      ) : (
        <>
          <section className="content-section" aria-labelledby="demo-thong-tin">
            <div className="section-heading section-heading--compact">
              <h2 id="demo-thong-tin">Thông tin lá số</h2>
              <p>Dữ liệu đầu vào của lá số minh họa và kết quả quy đổi lịch.</p>
            </div>
            <table className="demo-table">
              <tbody>
                <tr><th scope="row">Giới tính</th><td>{chart.profile.gender}</td></tr>
                <tr><th scope="row">Ngày sinh dương lịch</th><td>{chart.profile.solarDate}</td></tr>
                <tr><th scope="row">Ngày sinh âm lịch</th><td>{chart.profile.lunarDate}</td></tr>
                <tr><th scope="row">Giờ sinh</th><td>{DEMO_HOUR_LABEL}</td></tr>
                <tr><th scope="row">Can Chi (năm - tháng - ngày - giờ)</th><td>{chart.profile.chineseDate}</td></tr>
                <tr><th scope="row">Năm xem</th><td>{currentYear}</td></tr>
              </tbody>
            </table>
          </section>

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
                <strong>Cung Mệnh</strong> an tại {demo.menh.branch}, chính tinh: {demo.menh.stars}.
              </li>
              <li>
                <strong>Thân cư {demo.than.name}</strong> tại {demo.than.branch}, chính tinh: {demo.than.stars}.
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
              <h2 id="demo-menh-tai-quan">Tam phương tứ chính</h2>
              <p>
                Tam phương tứ chính của cung Mệnh: Mệnh, Tài Bạch, Quan Lộc và cung xung chiếu Thiên Di - khung lớn của bản thân,
                tiền bạc và sự nghiệp.
              </p>
            </div>
            <div className="seo-copy-grid seo-copy-grid--compact">
              {demo.tamPhuong.map((row) => (
                <article key={row.name} className="seo-copy-card seo-copy-card--compact">
                  <h3>
                    {row.name} · {row.branch}
                  </h3>
                  <p>{row.stars}</p>
                </article>
              ))}
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
            <TuviChart chart={chart} hasRequestedChart activePalaceIndexes={active} showPhiHoaCanCung />
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
                {demo.tuHoa.map((row) => (
                  <tr key={`${row.hoa}-${row.star}`}>
                    <td>Hóa {row.hoa}</td>
                    <td>{row.star}</td>
                    <td>
                      {row.palace} ({row.branch})
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="demo-note">
              <Link to="/bai-viet/loc-quyen-khoa-ky-co-y-nghia-gi">Lộc - Quyền - Khoa - Kỵ có ý nghĩa gì?</Link>
            </p>
          </section>

          <section className="content-section" aria-labelledby="demo-phi-hoa">
            <div className="section-heading section-heading--compact">
              <h2 id="demo-phi-hoa">Phi Hóa can cung</h2>
              <p>Can của mỗi cung hóa ra Lộc, Quyền, Khoa, Kỵ bay sang cung khác (phi nhập) hoặc hóa ngay tại cung (tự hóa).</p>
            </div>
            <table className="demo-table">
              <thead>
                <tr>
                  <th scope="col">Cung (can)</th>
                  <th scope="col">Hóa Lộc</th>
                  <th scope="col">Hóa Quyền</th>
                  <th scope="col">Hóa Khoa</th>
                  <th scope="col">Hóa Kỵ</th>
                </tr>
              </thead>
              <tbody>
                {demo.phiHoa.map((row) => (
                  <tr key={row.name}>
                    <th scope="row">
                      {row.name} ({row.stem})
                    </th>
                    {(["loc", "quyen", "khoa", "ky"] as const).map((type) => (
                      <td key={type}>{row.targets[type] || "–"}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="demo-note">
              <Link to="/bai-viet/phi-nhap-va-phi-xuat-la-gi">Phi nhập và phi xuất là gì?</Link> ·{" "}
              <Link to="/bai-viet/tu-hoa-la-gi">Tự hóa là gì?</Link>
            </p>
          </section>

          <section className="content-section" aria-labelledby="demo-dai-van">
            <div className="section-heading section-heading--compact">
              <h2 id="demo-dai-van">Đại vận</h2>
              <p>
                Mỗi đại vận 10 năm đi qua một cung. Năm {currentYear} lá số mẫu {demo.age} tuổi
                {demo.activeDaiVan ? `, đang ở đại vận ${demo.activeDaiVan}` : ""}.
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
                {demo.daiVan.map((row) => (
                  <tr key={row.palace} className={row.active ? "is-active" : undefined} aria-current={row.active ? "true" : undefined}>
                    <td>
                      {row.start}-{row.end}
                    </td>
                    <td>
                      {row.palace} ({row.branch})
                    </td>
                    <td>{row.stars}</td>
                  </tr>
                ))}
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
                Phi Hóa...) kèm lý do khớp. Bấm "Giải nghĩa chi tiết" ở một cung hoặc "Luận tổng hợp Bắc Phái" để hệ thống tổng hợp
                tự động từ dữ liệu này; phần tổng hợp không tự tạo quy tắc và ghi rõ phần thiếu dữ liệu, nhưng vẫn có thể sai sót.
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

          <section id="co-so-tri-thuc" className="content-section" aria-labelledby="demo-evidence">
            <div className="section-heading section-heading--compact">
              <h2 id="demo-evidence">Cơ sở tri thức</h2>
              <p>
                Các đoạn tri thức đã khớp với lá số mẫu ở từng cung và lý do khớp - bấm vào một cung để xem. Đây cũng là dữ liệu dùng để
                tổng hợp phần luận giải.
              </p>
            </div>
            {showEvidence ? (
              <EvidencePanel chart={chart} yearToView={currentYear} birthYear={DEMO_BIRTH_YEAR} />
            ) : (
              <button type="button" className="ghost-button" onClick={() => setShowEvidence(true)}>
                Xem cơ sở tri thức
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

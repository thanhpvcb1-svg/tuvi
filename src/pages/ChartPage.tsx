import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { toBlob, toJpeg } from "html-to-image";
import BirthForm from "../components/BirthForm";
import ExportActions from "../components/ExportActions";
import FAQSection from "../components/FAQSection";
import InterpretationCards from "../components/InterpretationCards";
import { LuuStarOptions } from "../components/LuuStarOptions";
import PrivacyNotice from "../components/PrivacyNotice";
import QuickInputSection from "../components/QuickInputSection";
import ResultSummaryCards from "../components/ResultSummaryCards";
import SEOHead from "../components/SEOHead";
import SolarNoonCalculator from "../components/SolarNoonCalculator";
import StreamingAnalysis from "../components/StreamingAnalysis";
import TuviChart from "../components/TuviChart";
import VanHanhSelector, { getActivePalaceIndexes } from "../components/VanHanhSelector";
import { useAppContext } from "../context/AppContext";
import { buildSummaryCards } from "../lib/chartUi";
import { organizationSchema, softwareAppSchema, breadcrumbSchema, faqSchema } from "../schemas/seoSchemas";
import {
  buildCopyableChartJson,
  buildConsultationBrief,
  chartReadingSteps,
  deserializeInputFromSearch,
  downloadBlob,
  openBlobInNewTab,
  isMobileViewport,
  getRuntimeProfile,
  knowledgeHubItems,
  lapLaSoFaqs,
  laSoOverviewCards,
  serializeInputToSearch,
  twelvePalaces,
} from "../utils/appUtils";

export default function ChartPage() {
  const navigate = useNavigate();
  const {
    birthInput,
    submittedInput,
    chart,
    hasRequestedChart,
    fieldErrors,
    shareMessage,
    toastMessage,
    showReading,
    isGenerating,
    isDownloadingImage,
    quickReadings,
    luuOptions,
    horoscopeYear,
    hasDirtyChanges,
    chartCaptureRef,
    resultRef,
    setBirthInput,
    setFieldErrors,
    setShareMessage,
    setShowReading,
    setLuuOptions,
    setHoroscopeYear,
    setIsDownloadingImage,
    showToast,
    handleGenerateFromInput,
    handleGenerateChart,
    handleResetChart,
  } = useAppContext();

  const [expandedPalace, setExpandedPalace] = React.useState<string | null>(null);

  // Khôi phục lá số từ link chia sẻ (xem handleCopyLink bên dưới). Chỉ chạy 1 lần lúc mount,
  // và chỉ khi query string thực sự chứa dữ liệu sinh (year/month/day) - tránh generate nhầm
  // khi người dùng chỉ mở "/lap-la-so" bình thường không có query.
  const hasRestoredFromLinkRef = React.useRef(false);
  React.useEffect(() => {
    if (hasRestoredFromLinkRef.current) return;
    hasRestoredFromLinkRef.current = true;
    if (hasRequestedChart || !window.location.search) return;

    const restoredInput = deserializeInputFromSearch(window.location.search, birthInput);
    if (!restoredInput) return;

    handleGenerateFromInput(restoredInput);
    // Xoá query string khỏi URL để dữ liệu sinh không tiếp tục hiển thị/lưu trong lịch sử trình duyệt.
    window.history.replaceState(null, "", window.location.pathname);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCopyChartJson = async () => {
    if (!chart || !submittedInput) return;

    try {
      const payload = buildCopyableChartJson(chart, submittedInput, luuOptions);
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      showToast("Copy thành công");
    } catch (error) {
      console.error(error);
      setShareMessage("Không thể sao chép JSON lá số trên trình duyệt hiện tại.");
    }
  };

  const handleCopyConsultationBrief = async () => {
    if (!chart || !submittedInput) return;

    try {
      await navigator.clipboard.writeText(buildConsultationBrief(chart, submittedInput, horoscopeYear));
      showToast("Đã copy brief liên hệ");
    } catch (error) {
      console.error(error);
      setShareMessage("Không thể sao chép brief liên hệ trên trình duyệt hiện tại.");
    }
  };

  const handleLuanGiai = () => {
    if (!chart || !submittedInput) return;
    setShowReading((prev) => !prev);
  };

  const handleDownloadImage = async () => {
    if (!chartCaptureRef.current || !chart) return;

    setIsDownloadingImage(true);

    try {
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      });

      const target = chartCaptureRef.current;
      const chartElement =
        (target.querySelector(".chart-export-frame") as HTMLElement | null) ??
        (target.querySelector(".chart-export-content") as HTMLElement | null) ??
        (target.querySelector(".chart") as HTMLElement | null) ??
        target;
      const mobile = isMobileViewport();
      const fileBaseName =
        (chart.profile.fullName || "la-so-tu-vi")
          .trim()
          .replace(/[\\/:*?"<>|]+/g, "-")
          .replace(/\s+/g, "-") || "la-so-tu-vi";

      const exportOptions = {
        cacheBust: true,
        backgroundColor: "#fffdf5",
        pixelRatio: mobile ? 1.2 : 2,
        canvasWidth: chartElement.scrollWidth,
        canvasHeight: chartElement.scrollHeight,
        style: {
          margin: "0",
          width: `${chartElement.scrollWidth}px`,
          minWidth: `${chartElement.scrollWidth}px`,
          maxWidth: `${chartElement.scrollWidth}px`,
          height: `${chartElement.scrollHeight}px`,
          overflow: "visible",
        },
      } as const;

      const shareOrDownload = async (blob: Blob, fileName: string) => {
        const file = new File([blob], fileName, { type: blob.type || "image/png" });

        if (mobile && navigator.canShare?.({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: "Lá số Tử Vi",
            text: "Xuất ảnh lá số Tử Vi",
          });
          return;
        }

        try {
          downloadBlob(blob, fileName);
        } catch (downloadError) {
          console.warn(downloadError);
          openBlobInNewTab(blob);
        }
      };

      try {
        const pngBlob = await toBlob(chartElement, exportOptions);
        if (!pngBlob) throw new Error("Không tạo được PNG từ lá số.");
        await shareOrDownload(pngBlob, `${fileBaseName}.png`);
        return;
      } catch (pngError) {
        console.warn(pngError);
      }

      const jpegDataUrl = await toJpeg(chartElement, {
        ...exportOptions,
        quality: mobile ? 0.9 : 0.96,
      });

      const jpegResponse = await fetch(jpegDataUrl);
      const jpegBlob = await jpegResponse.blob();
      await shareOrDownload(jpegBlob, `${fileBaseName}.jpg`);
    } catch (error) {
      console.error(error);
      setFieldErrors({ form: "Không thể tải ảnh lá số. Nếu trình duyệt chặn tải trực tiếp, hãy mở ảnh ở tab mới rồi lưu thủ công." });
    } finally {
      setIsDownloadingImage(false);
    }
  };

  const handleCopyLink = async () => {
    const sourceInput = submittedInput ?? birthInput;
    const url = `${window.location.origin}${window.location.pathname}?${serializeInputToSearch(sourceInput)}`;

    try {
      await navigator.clipboard.writeText(url);
      setShareMessage("Đã sao chép liên kết lá số.");
    } catch (error) {
      console.error(error);
      setShareMessage("Không thể sao chép liên kết trên trình duyệt hiện tại.");
    }
  };

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleHeroInterpretCta = () => {
    if (chart && submittedInput) {
      if (!showReading) setShowReading(true);
      scrollToSection("la-so");
    } else {
      scrollToSection("lap-la-so-form");
    }
  };

  return (
    <div className="app workspace-page">
      <SEOHead
        title="Lập Lá Số Tử Vi Online Miễn Phí Theo Ngày Giờ Sinh | Tử Vi Phong Lam"
        description="Lập lá số tử vi online theo ngày tháng năm giờ sinh. An Mệnh, Thân, 12 cung, chính tinh, phụ tinh, Tứ Hóa, đại vận và tiểu vận, hỗ trợ luận giải theo Tử Vi Bắc phái."
        canonicalPath="/lap-la-so"
        schema={[
          organizationSchema,
          softwareAppSchema,
          breadcrumbSchema([{ name: "Trang chủ", path: "/" }, { name: "Lập lá số", path: "/lap-la-so" }]),
          faqSchema(lapLaSoFaqs),
        ]}
      />

      <section className="page-intro">
        <h1>Lập Lá Số Tử Vi Online Miễn Phí</h1>
        <p>
          Nhập ngày giờ sinh để an lá số và khám phá Mệnh, Thân, 12 cung, Tứ Hóa và các yếu tố Tử Vi Bắc phái.
        </p>
        <div className="page-intro-cta">
          <button type="button" className="primary-button" onClick={() => scrollToSection("lap-la-so-form")}>
            ✨ Lập Lá Số Ngay
          </button>
          <button type="button" className="ghost-button" onClick={() => scrollToSection("bac-phai-ai")}>
            Tìm hiểu Tử Vi Bắc phái
          </button>
        </div>
      </section>

      <section id="lap-la-so-form" className="top-hero-row">
        <section className="top-left-panel">
          <SolarNoonCalculator />
        </section>
        <section className="form-panel">
          <QuickInputSection
            currentValues={birthInput}
            onFill={(values) => setBirthInput((prev) => ({ ...prev, ...values }))}
            onSubmit={handleGenerateFromInput}
          />
          <BirthForm
            value={birthInput}
            onChange={setBirthInput}
            onSubmit={handleGenerateChart}
            canPrint={Boolean(chart)}
            fieldErrors={fieldErrors}
            isSubmitting={isGenerating}
            hasDirtyChanges={hasDirtyChanges}
          />
          <PrivacyNotice />
        </section>
      </section>

      <section ref={resultRef} className="chart-panel result-panel">
        {shareMessage ? <div className="result-status result-status--muted">{shareMessage}</div> : null}
        {toastMessage ? <div className="copy-toast" role="status">{toastMessage}</div> : null}

        {hasRequestedChart && chart ? (
          <div className="chart-tools">
            <LuuStarOptions value={luuOptions} onChange={setLuuOptions} />
          </div>
        ) : null}

        {hasRequestedChart && chart && submittedInput ? (
          <>
            <ResultSummaryCards
              items={buildSummaryCards(chart, horoscopeYear, parseInt(submittedInput.year, 10) || horoscopeYear)}
            />

            <section id="la-so" className="result-block">
              <div className="section-heading section-heading--compact">
                <p className="eyebrow">Mệnh - Thân - 12 cung - Tứ Hóa</p>
                <h2>Biểu đồ 12 cung</h2>
              </div>
              <VanHanhSelector
                year={horoscopeYear}
                birthYear={parseInt(submittedInput.year, 10) || horoscopeYear}
                chart={chart}
                onChange={setHoroscopeYear}
              />
              <div ref={chartCaptureRef}>
                <TuviChart
                  chart={chart}
                  hasRequestedChart={hasRequestedChart}
                  showTieuVanHighlight={!isDownloadingImage}
                  showLocKyNhap={luuOptions.showLocKyNhap}
                  showPhiHoaCanCung={luuOptions.showPhiHoaCanCung}
                  hidePersonalInfo={submittedInput.hidePersonalInfo}
                  activePalaceIndexes={(() => {
                    const age = horoscopeYear - (parseInt(submittedInput.year, 10) || horoscopeYear);
                    const menhBranch = chart.palaces.find((p) => p.name === "Mệnh")?.earthlyBranch;
                    return getActivePalaceIndexes(
                      chart.palaces,
                      age,
                      menhBranch,
                      chart.profile.fiveElementsClass,
                      chart.profile.yinYangLabel,
                    );
                  })()}
                />
              </div>
            </section>

            <ExportActions
              onInterpret={handleLuanGiai}
              onDownloadImage={handleDownloadImage}
              onCopyLink={handleCopyLink}
              onReset={handleResetChart}
              isInterpreting={false}
              isReadingOpen={showReading}
              isDownloadingImage={isDownloadingImage}
            />

            {showReading && chart ? (
              <StreamingAnalysis chart={chart} isActive={showReading} />
            ) : null}

            <div className="result-disclaimer">
              Kết quả chỉ mang tính tham khảo, chiêm nghiệm và giải trí. Không thay thế tư vấn chuyên môn về y tế, tài chính, pháp lý hoặc các quyết định quan trọng.
            </div>

            <section id="luan-giai" className="result-block">
              <InterpretationCards items={quickReadings} />
            </section>

            <section id="van-han" className="result-block">
              <div className="section-heading section-heading--compact">
                <p className="eyebrow">Vận hạn</p>
                <h2>Theo dõi năm xem hạn</h2>
              </div>
              <div className="placeholder-card placeholder-card--inline">
                <p>
                  Khu vực này đang ưu tiên phần theo dõi dữ liệu vận năm trên lá số. Bạn đã có thanh chọn năm và điểm nhấn tiểu vận để tự đối chiếu theo từng giai đoạn.
                </p>
              </div>
            </section>

            <section id="hanh-dong" className="result-block">
              <div className="premium-upsell-card">
                <div>
                  <p className="eyebrow">Cần xem sâu hơn?</p>
                  <h2>Hỏi 1 câu theo lá số hoặc đặt lịch tư vấn trực tiếp</h2>
                  <p className="result-note">
                    Sau khi đã có lá số cơ bản, bạn có thể hỏi thêm một vấn đề cụ thể với mức 50.000đ hoặc chọn tư vấn trực tiếp khi cần định hướng nghiêm túc.
                  </p>
                </div>
                <div className="premium-upsell-actions">
                  <button type="button" className="primary-button" onClick={() => navigate("/bang-gia")}>Hỏi 1 câu về lá số này — 50.000đ</button>
                  <button type="button" className="ghost-button" onClick={handleCopyConsultationBrief}>Copy brief lá số</button>
                  <button type="button" className="ghost-button" onClick={() => navigate("/lien-he")}>Đi tới trang liên hệ</button>
                </div>
              </div>
            </section>
          </>
        ) : isGenerating ? (
          <section className="result-skeleton">
            <div className="skeleton-header">
              <div className="skeleton-line skeleton-line--short" />
              <div className="skeleton-line skeleton-line--medium" />
            </div>
            <div className="skeleton-chart">
              <div className="skeleton-grid">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="skeleton-cell">
                    <div className="skeleton-line skeleton-line--short" />
                    <div className="skeleton-line" />
                    <div className="skeleton-line skeleton-line--medium" />
                  </div>
                ))}
              </div>
              <div className="skeleton-center">
                <div className="skeleton-line skeleton-line--short" />
                <div className="skeleton-line" />
                <div className="skeleton-line skeleton-line--medium" />
                <div className="skeleton-line skeleton-line--short" />
              </div>
            </div>
            <p className="skeleton-message">Đang lập lá số, vui lòng chờ...</p>
          </section>
        ) : (
          <section className="result-empty-card">
            <div className="result-empty-icon" aria-hidden="true">✨</div>
            <p className="eyebrow">Sẵn sàng</p>
            <h2>Lá số sẽ xuất hiện sau khi bạn bấm "Lập lá số ngay"</h2>
            <p>Hệ thống sẽ hiển thị biểu đồ 12 cung, luận giải nhanh và phần chi tiết từng cung ngay bên dưới.</p>
          </section>
        )}
      </section>

      <section className="content-section">
        <div className="section-heading section-heading--compact">
          <p className="eyebrow">Cách đọc kết quả</p>
          <h2>Sau khi lập lá số, nên đọc theo 3 bước</h2>
          <p>Đi theo thứ tự này sẽ giúp bạn tránh bị ngợp bởi quá nhiều sao và cung cùng lúc.</p>
        </div>
        <div className="seo-copy-grid">
          {chartReadingSteps.map((step) => (
            <article key={step.title} className="seo-copy-card">
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="content-section">
        <div className="section-heading section-heading--compact">
          <p className="eyebrow">Kiến thức nền tảng</p>
          <h2>Lá Số Tử Vi Là Gì?</h2>
        </div>
        <p>
          Lá số tử vi là bản đồ tổng hợp theo ngày giờ sinh, trình bày trên 12 cung để thể hiện tính cách, xu hướng phát
          triển và các giai đoạn vận hành nổi bật trong cuộc đời một người. Đây là công cụ chiêm nghiệm truyền thống,
          không phải một dự đoán khẳng định tuyệt đối.
        </p>
      </section>

      <section className="content-section">
        <div className="section-heading section-heading--compact">
          <p className="eyebrow">Chuẩn bị dữ liệu</p>
          <h2>Lập Lá Số Tử Vi Cần Những Thông Tin Gì?</h2>
        </div>
        <p>Để an lá số chính xác, bạn cần chuẩn bị:</p>
        <ul className="seo-info-list">
          <li>Ngày, tháng, năm sinh (dương lịch hoặc âm lịch)</li>
          <li>Giờ sinh theo 12 khung giờ (Tý - Hợi) - càng chính xác, vị trí cung và sao càng sát</li>
          <li>Giới tính</li>
          <li>Năm muốn xem vận hạn (mặc định là năm hiện tại)</li>
        </ul>
        <p>
          Nếu không nhớ chính xác giờ sinh, bạn vẫn có thể lập lá số bằng cách tick "Không rõ giờ sinh" - hệ thống sẽ
          lập lá số dựa trên các dữ liệu còn lại và ghi chú rằng kết quả mang tính tham khảo.
        </p>
      </section>

      <section className="content-section">
        <div className="section-heading section-heading--compact">
          <p className="eyebrow">Cấu trúc kết quả</p>
          <h2>Lá Số Của Bạn Có Gì?</h2>
          <p>
            Sau khi nhập dữ liệu sinh, hệ thống an lá số và hiển thị đầy đủ cung Mệnh - Thân, 12 cung, chính - phụ
            tinh, Tứ Hóa, đại vận và tiểu vận trên cùng một biểu đồ trực quan.
          </p>
        </div>
        <div className="feature-overview-grid feature-overview-grid--six">
          {laSoOverviewCards.map((card) => (
            <article key={card.title} className="feature-card feature-card--landing feature-card--with-icon">
              <span className="feature-card__icon" style={{ backgroundColor: `${card.color}15`, color: card.color }}>
                {card.icon}
              </span>
              <h3>{card.title}</h3>
              <p>{card.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="bac-phai-ai" className="content-section bac-phai-ai-section">
        <div className="section-heading section-heading--compact">
          <p className="eyebrow">✨ USP - Tử Vi Phong Lam</p>
          <h2>Luận Giải Tử Vi Theo Phương Pháp Bắc Phái</h2>
          <p>
            Hệ thống kết hợp dữ liệu lá số với kho tri thức Tử Vi chuyên sâu để phân tích Mệnh - Thân, cung vị, tam
            hợp, xung chiếu, Tứ Hóa, Phi Hóa và các yếu tố thời vận khi có đủ dữ liệu.
          </p>
        </div>

        <div className="bac-phai-ai-flow" aria-label="Quy trình phân tích lá số">
          <span className="bac-phai-ai-flow__step">Lá số</span>
          <span className="bac-phai-ai-flow__arrow" aria-hidden="true">↓</span>
          <span className="bac-phai-ai-flow__step">Phân tích cấu trúc</span>
          <span className="bac-phai-ai-flow__arrow" aria-hidden="true">↓</span>
          <span className="bac-phai-ai-flow__step">Knowledge Base</span>
          <span className="bac-phai-ai-flow__arrow" aria-hidden="true">↓</span>
          <span className="bac-phai-ai-flow__step">Tử Vi Bắc phái</span>
          <span className="bac-phai-ai-flow__arrow" aria-hidden="true">↓</span>
          <span className="bac-phai-ai-flow__step bac-phai-ai-flow__step--highlight">AI luận giải</span>
        </div>

        <p>
          Tử Vi Bắc phái đọc lá số theo mạch vận động thay vì xét từng sao độc lập. Tứ Hóa (Hóa Lộc, Hóa Quyền, Hóa
          Khoa, Hóa Kỵ) phát sinh từ Thiên Can năm sinh; Phi Hóa là khi lấy Thiên Can của một cung bất kỳ để tạo Tứ
          Hóa mới bay sang cung khác, từ đó thấy được mối quan hệ động giữa các cung với nhau.{" "}
          <Link to="/bai-viet/tu-vi-bac-phai-la-gi">Tìm hiểu chi tiết về Tử Vi Bắc phái</Link>.
        </p>

        <button type="button" className="primary-button" onClick={handleHeroInterpretCta}>
          ✨ Luận giải lá số chuyên sâu
        </button>
      </section>

      <section className="content-section">
        <div className="section-heading section-heading--compact">
          <p className="eyebrow">Bố cục lá số</p>
          <h2>Khám Phá 12 Cung Trong Lá Số Tử Vi</h2>
          <p>Bấm vào một cung để xem mô tả chi tiết hơn.</p>
        </div>
        <div className="seo-copy-grid seo-copy-grid--compact">
          {twelvePalaces.map((palace) => {
            const isOpen = expandedPalace === palace.name;
            return (
              <article
                key={palace.name}
                className={`seo-copy-card seo-copy-card--compact seo-copy-card--clickable${isOpen ? " is-open" : ""}`}
                role="button"
                tabIndex={0}
                aria-expanded={isOpen}
                onClick={() => setExpandedPalace(isOpen ? null : palace.name)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setExpandedPalace(isOpen ? null : palace.name);
                  }
                }}
              >
                <h3>{palace.name}</h3>
                <p>{palace.description}</p>
                {isOpen && <p className="seo-copy-card__detail">{palace.detail}</p>}
              </article>
            );
          })}
        </div>
      </section>

      <section className="content-section">
        <div className="section-heading section-heading--compact">
          <p className="eyebrow">📚 Kiến thức Tử Vi</p>
          <h2>Khám Phá Kiến Thức Tử Vi</h2>
          <p>Các chủ đề nền tảng để đọc lá số theo Tử Vi Bắc phái.</p>
        </div>
        <ul className="knowledge-hub-list">
          {knowledgeHubItems.map((item) =>
            item.path ? (
              <li key={item.title}>
                <Link to={item.path}>{item.title}</Link>
              </li>
            ) : (
              <li key={item.title} className="knowledge-hub-list__soon">
                {item.title} <span>Sắp ra mắt</span>
              </li>
            ),
          )}
        </ul>
      </section>

      <FAQSection
        id="lap-la-so-faq"
        eyebrow="❓ Câu hỏi thường gặp"
        title="Câu Hỏi Thường Gặp"
        description="Những thắc mắc phổ biến khi lập lá số và đọc theo Tử Vi Bắc phái."
        faqs={lapLaSoFaqs}
      />

      <section className="content-section bottom-cta-section">
        <h2>Sẵn sàng khám phá lá số của bạn?</h2>
        <p>Chỉ mất chưa đến 1 phút để an Mệnh, Thân, 12 cung và Tứ Hóa theo ngày giờ sinh của bạn.</p>
        <button type="button" className="primary-button" onClick={() => scrollToSection("lap-la-so-form")}>
          ✨ Lập Lá Số Ngay
        </button>
      </section>
    </div>
  );
}

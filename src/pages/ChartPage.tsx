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
  lapLaSoContent as content,
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
        description="Lập lá số tử vi online miễn phí theo ngày tháng năm giờ sinh. An Mệnh, Thân, 12 cung, chính tinh, phụ tinh, Tứ Hóa, đại vận và tiểu vận. Khám phá luận giải Tử Vi theo phương pháp Bắc phái."
        canonicalPath="/lap-la-so"
        schema={[
          organizationSchema,
          softwareAppSchema,
          breadcrumbSchema([{ name: "Trang chủ", path: "/" }, { name: "Lập lá số", path: "/lap-la-so" }]),
          faqSchema(lapLaSoFaqs),
        ]}
      />

      <section className="page-intro">
        <h1>{content.hero.title}</h1>
        <p>{content.hero.subtitle}</p>
        <div className="page-intro-cta">
          <button type="button" className="primary-button" onClick={() => scrollToSection("lap-la-so-form")}>
            Lập lá số ngay
          </button>
          <Link to="/la-so-mau" className="ghost-button">
            Xem lá số mẫu
          </Link>
        </div>
      </section>

      <section id="lap-la-so-form" className="top-hero-row">
        <section className="top-left-panel">
          <SolarNoonCalculator />
        </section>
        <section className="form-panel">
          <div className="form-panel__heading">
            <h2>{content.formSection.heading}</h2>
            <p>{content.formSection.intro}</p>
          </div>
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
              <StreamingAnalysis
                chart={chart}
                isActive={showReading}
                userContext={{
                  gender: submittedInput.gender === "female" ? "Nữ" : "Nam",
                  yearToView: horoscopeYear,
                  birthYear: parseInt(submittedInput.year, 10) || undefined,
                }}
              />
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
            <h3>Lá số sẽ xuất hiện sau khi bạn bấm "Lập lá số ngay"</h3>
            <p>Hệ thống sẽ hiển thị biểu đồ 12 cung, luận giải nhanh và phần chi tiết từng cung ngay bên dưới.</p>
          </section>
        )}
      </section>

      <section className="content-section" aria-labelledby="la-so-co-gi">
        <div className="section-heading section-heading--compact">
          <h2 id="la-so-co-gi">{content.overview.heading}</h2>
          <p>{content.overview.intro}</p>
        </div>
        <div className="feature-overview-grid feature-overview-grid--six">
          {laSoOverviewCards.map((card) => (
            <article key={card.title} className="feature-card feature-card--landing feature-card--with-icon">
              <span className="feature-card__icon" aria-hidden="true" style={{ backgroundColor: `${card.color}15`, color: card.color }}>
                {card.icon}
              </span>
              <h3>{card.title}</h3>
              <p>{card.description}</p>
            </article>
          ))}
        </div>
        <h3 className="content-subheading">{content.overview.readingHeading}</h3>
        <ol className="reading-steps">
          {chartReadingSteps.map((step) => (
            <li key={step.title}>
              <strong>{step.title}</strong>
              <span>{step.description}</span>
            </li>
          ))}
        </ol>
      </section>

      <section id="bac-phai-ai" className="content-section bac-phai-ai-section" aria-labelledby="bac-phai-heading">
        <div className="section-heading section-heading--compact">
          <p className="eyebrow">Tử Vi Phong Lam</p>
          <h2 id="bac-phai-heading">{content.bacPhai.heading}</h2>
          <p>{content.bacPhai.intro}</p>
        </div>

        <ol className="bac-phai-ai-flow" aria-label="Thứ tự phân tích lá số">
          {content.bacPhai.flow.map((step, index) => (
            <li key={step} className="bac-phai-ai-flow__item">
              <span className={`bac-phai-ai-flow__step${index === content.bacPhai.flow.length - 1 ? " bac-phai-ai-flow__step--highlight" : ""}`}>
                {step}
              </span>
              {index < content.bacPhai.flow.length - 1 ? (
                <span className="bac-phai-ai-flow__arrow" aria-hidden="true">↓</span>
              ) : null}
            </li>
          ))}
        </ol>

        <p className="bac-phai-ai-note">{content.bacPhai.aiNote}</p>
        <p>
          {content.bacPhai.matching}{" "}
          <Link to="/bai-viet/tu-vi-bac-phai-la-gi">Tìm hiểu thêm về Tử Vi Bắc phái</Link>.
        </p>

        <button type="button" className="primary-button" onClick={handleHeroInterpretCta}>
          Luận giải lá số của tôi
        </button>
      </section>

      <section id="12-cung" className="content-section" aria-labelledby="muoi-hai-cung-heading">
        <div className="section-heading section-heading--compact">
          <h2 id="muoi-hai-cung-heading">{content.twelvePalacesSection.heading}</h2>
          <p>
            {content.twelvePalacesSection.intro}{" "}
            <Link to={content.twelvePalacesSection.link.path}>{content.twelvePalacesSection.link.title}</Link>
          </p>
        </div>
        <div className="seo-copy-grid seo-copy-grid--compact">
          {twelvePalaces.map((palace, index) => {
            const isOpen = expandedPalace === palace.name;
            const detailId = `cung-detail-${index}`;
            return (
              <article key={palace.name} className={`seo-copy-card seo-copy-card--compact${isOpen ? " is-open" : ""}`}>
                <h3>
                  <button
                    type="button"
                    className="palace-toggle"
                    aria-expanded={isOpen}
                    aria-controls={detailId}
                    onClick={() => setExpandedPalace(isOpen ? null : palace.name)}
                  >
                    Cung {palace.name}
                  </button>
                </h3>
                <p>{palace.description}</p>
                <p id={detailId} className="seo-copy-card__detail" hidden={!isOpen}>
                  {palace.detail}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      <section id="tu-hoa-phi-hoa" className="content-section" aria-labelledby="tu-hoa-heading">
        <div className="section-heading section-heading--compact">
          <h2 id="tu-hoa-heading">{content.tuHoa.heading}</h2>
          <p>{content.tuHoa.intro}</p>
        </div>
        <div className="seo-copy-grid seo-copy-grid--compact tu-hoa-grid">
          {content.tuHoa.items.map((item) => (
            <article key={item.title} className="seo-copy-card seo-copy-card--compact">
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
        <p>{content.tuHoa.phiHoa}</p>
        <ul className="knowledge-hub-list">
          {content.tuHoa.links.map((link) => (
            <li key={link.path}>
              <Link to={link.path}>{link.title}</Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="content-section" aria-labelledby="kien-thuc-heading">
        <div className="section-heading section-heading--compact">
          <h2 id="kien-thuc-heading">{content.knowledgeSection.heading}</h2>
          <p>{content.knowledgeSection.intro}</p>
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
        eyebrow="Hỏi đáp"
        title={content.faqSection.heading}
        description={content.faqSection.intro}
        faqs={lapLaSoFaqs}
      />

      <section className="content-section bottom-cta-section" aria-labelledby="cta-heading">
        <h2 id="cta-heading">{content.bottomCta.heading}</h2>
        <p>{content.bottomCta.text}</p>
        <button type="button" className="primary-button" onClick={() => scrollToSection("lap-la-so-form")}>
          Lập lá số ngay
        </button>
      </section>
    </div>
  );
}

import React from "react";
import { useNavigate } from "react-router-dom";
import { toBlob, toJpeg } from "html-to-image";
import BirthForm from "../components/BirthForm";
import ExportActions from "../components/ExportActions";
import InterpretationCards from "../components/InterpretationCards";
import { LuuStarOptions } from "../components/LuuStarOptions";
import PrivacyNotice from "../components/PrivacyNotice";
import QuickInputSection from "../components/QuickInputSection";
import SEOHead from "../components/SEOHead";
import SolarNoonCalculator from "../components/SolarNoonCalculator";
import StreamingAnalysis from "../components/StreamingAnalysis";
import TuviChart from "../components/TuviChart";
import VanHanhSelector, { getActivePalaceIndexes } from "../components/VanHanhSelector";
import { useAppContext } from "../context/AppContext";
import { organizationSchema, softwareAppSchema, breadcrumbSchema } from "../schemas/seoSchemas";
import { 
  buildCopyableChartJson, 
  buildConsultationBrief, 
  chartReadingSteps,
  downloadBlob,
  openBlobInNewTab,
  isMobileViewport,
  getRuntimeProfile,
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
    const params = new URLSearchParams();
    Object.entries(sourceInput).forEach(([key, value]) => {
      params.set(key, String(value));
    });
    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;

    try {
      await navigator.clipboard.writeText(url);
      setShareMessage("Đã sao chép liên kết lá số.");
    } catch (error) {
      console.error(error);
      setShareMessage("Không thể sao chép liên kết trên trình duyệt hiện tại.");
    }
  };

  return (
    <div className="app workspace-page">
      <SEOHead
        title="Lập Lá Số Tử Vi Online - Xem Mệnh Thân 12 Cung Miễn Phí | TuViPhongLam"
        description="Công cụ lập lá số tử vi miễn phí theo ngày giờ sinh. Xem Mệnh, Thân, 12 cung, đại vận, tiểu vận. Luận giải Bắc Phái chuẩn xác."
        canonicalPath="/lap-la-so"
        schema={[
          organizationSchema,
          softwareAppSchema,
          breadcrumbSchema([{ name: "Trang chủ", path: "/" }, { name: "Lập lá số", path: "/lap-la-so" }]),
        ]}
      />

      <section className="top-hero-row">
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
            <section id="la-so" className="result-block">
              <div className="section-heading section-heading--compact">
                <p className="eyebrow">Lá số trực quan</p>
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

      <section className="content-section lap-la-so-seo">
        <div className="section-heading section-heading--compact">
          <p className="eyebrow">Nền tảng Bắc Phái</p>
          <h2>Lập lá số tử vi online miễn phí theo ngày giờ sinh</h2>
          <p>
            Nhập ngày sinh, giờ sinh, giới tính và năm muốn xem để hệ thống an lá số, xác định Mệnh, Thân, 12 cung, chính tinh,
            phụ tinh, đại vận và tiểu vận.
          </p>
        </div>
        <div className="seo-copy-grid">
          <article className="seo-copy-card">
            <h3>Lá số tử vi là gì?</h3>
            <p>
              Lá số tử vi là bản đồ tổng hợp thông tin theo ngày giờ sinh để giúp người xem có một góc nhìn hệ thống về tính
              cách, xu hướng phát triển và các giai đoạn vận hành nổi bật trong cuộc sống.
            </p>
          </article>
          <article className="seo-copy-card">
            <h3>Công cụ lập lá số tính những gì?</h3>
            <p>
              Sau khi nhập dữ liệu sinh, hệ thống sẽ an lá số dựa trên thông tin ngày giờ và năm đang xem. Từ đó, bạn có thể
              thấy Mệnh, Thân, 12 cung, các chính tinh, phụ tinh, đại vận và tiểu vận hiển thị trên cùng một giao diện.
            </p>
          </article>
          <article className="seo-copy-card">
            <h3>Vì sao giờ sinh quan trọng?</h3>
            <p>
              Giờ sinh ảnh hưởng trực tiếp tới cách an cung và vị trí một số sao trong lá số. Vì vậy, nếu có giờ sinh chính xác,
              kết quả thường rõ hơn và giúp việc đọc Mệnh, Thân cũng như các cung khác sát hơn.
            </p>
          </article>
          <article className="seo-copy-card">
            <h3>Lập lá số miễn phí khác gì luận giải chuyên sâu?</h3>
            <p>
              Bản miễn phí phù hợp để bạn nhìn tổng quan lá số, xác định các cung nổi bật và hiểu bố cục chính. Trong khi đó,
              luận giải sâu phù hợp khi bạn cần trả lời một câu hỏi cụ thể hoặc cần một góc nhìn có cấu trúc hơn.
            </p>
          </article>
        </div>
      </section>
    </div>
  );
}

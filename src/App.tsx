import React, { useEffect, useMemo, useRef, useState } from "react";
import { toBlob, toJpeg } from "html-to-image";
import { useLocation, useNavigate } from "react-router-dom";
import BirthForm from "./components/BirthForm";
import ChartReading from "./components/ChartReading";
import EducationSection from "./components/EducationSection";
import ExportActions from "./components/ExportActions";
import FAQSection from "./components/FAQSection";
import FloatingContactLinks from "./components/FloatingContactLinks";
import SocialProofPopup from "./components/SocialProofPopup";
import HomeShowcase from "./components/HomeShowcase";
import InterpretationCards from "./components/InterpretationCards";
import { LuuStarOptions } from "./components/LuuStarOptions";
import PalaceAccordion from "./components/PalaceAccordion";
import PrivacyNotice from "./components/PrivacyNotice";
import PremiumPlans from "./components/PremiumPlans";
import SampleChartsSection, { type SampleChartPreset } from "./components/SampleChartsSection";
import SiteFooter from "./components/SiteFooter";
import SolarNoonCalculator from "./components/SolarNoonCalculator";
import TrustBadges from "./components/TrustBadges";
import TuviChart from "./components/TuviChart";
import VanHanhSelector, { getActivePalaceIndexes } from "./components/VanHanhSelector";
import { buildQuickReadings } from "./lib/chartUi";
import { createChart } from "./lib/iztroEngine";
import type { BirthInput, ChartView, LuuDisplayOptions, NormalizedBirthInput, PalaceView, StarView } from "./lib/types";

type MainPageId = "home" | "lap-la-so";
type HomeSectionId = "la-so-mau" | "kien-thuc" | "faq" | "premium" | "hop-tuoi" | "lien-he";
type FormErrors = Partial<Record<keyof BirthInput, string>> & { form?: string };

const currentYear = new Date().getFullYear();

const homeSectionRoutes: Record<HomeSectionId, string> = {
  "la-so-mau": "/la-so-mau",
  "kien-thuc": "/blog",
  premium: "/bang-gia",
  faq: "/faq",
  "hop-tuoi": "/hop-tuoi",
  "lien-he": "/lien-he",
};

const routeToHomeSection: Record<string, HomeSectionId> = {
  "/la-so-mau": "la-so-mau",
  "/blog": "kien-thuc",
  "/kien-thuc": "kien-thuc",
  "/bang-gia": "premium",
  "/premium": "premium",
  "/faq": "faq",
  "/hop-tuoi": "hop-tuoi",
  "/lien-he": "lien-he",
};

const defaultInput: BirthInput = {
  fullName: "",
  year: "",
  month: "",
  day: "",
  birthHour: "",
  birthMinute: "",
  gender: "male",
  calendarType: "solar",
  horoscopeYear: String(currentYear),
  unknownBirthTime: false,
};

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

const parseRequiredNumber = (value: string, min: number, max: number) => {
  const parsed = Number(value.trim());

  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    return null;
  }

  return parsed;
};

const toBirthHourIndex = (hour: number) => {
  if (hour === 23) {
    return 12;
  }

  return Math.floor((hour + 1) / 2);
};

const isValidCalendarDate = (year: number, month: number, day: number) => {
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
};

const normalizeBirthInput = (input: BirthInput): NormalizedBirthInput | null => {
  const year = parseRequiredNumber(input.year, 1900, 2100);
  const month = parseRequiredNumber(input.month, 1, 12);
  const day = parseRequiredNumber(input.day, 1, 31);
  const birthHour = input.unknownBirthTime ? 12 : parseRequiredNumber(input.birthHour, 0, 23);
  const birthMinute = input.unknownBirthTime ? 0 : parseRequiredNumber(input.birthMinute || "0", 0, 59);

  if (
    year === null ||
    month === null ||
    day === null ||
    birthHour === null ||
    birthMinute === null ||
    !isValidCalendarDate(year, month, day)
  ) {
    return null;
  }

  return {
    ...input,
    year,
    month,
    day,
    birthHour,
    birthMinute,
    birthHourIndex: toBirthHourIndex(birthHour),
  };
};

const getHoroscopeYear = (input: BirthInput) => parseRequiredNumber(input.horoscopeYear, 1900, 2100) ?? currentYear;

const validateBirthInput = (input: BirthInput): FormErrors => {
  const errors: FormErrors = {};
  const year = parseRequiredNumber(input.year, 1900, 2100);
  const month = parseRequiredNumber(input.month, 1, 12);
  const day = parseRequiredNumber(input.day, 1, 31);
  const horoscopeYear = parseRequiredNumber(input.horoscopeYear, 1900, 2100);

  if (!input.fullName.trim()) {
    errors.fullName = "Vui lòng nhập tên hiển thị.";
  }

  if (!input.day.trim() || !input.month.trim() || !input.year.trim()) {
    errors.day = "Vui lòng chọn đầy đủ ngày sinh.";
    errors.month = "Vui lòng chọn đầy đủ ngày sinh.";
    errors.year = "Vui lòng chọn đầy đủ ngày sinh.";
  } else if (year === null || month === null || day === null || !isValidCalendarDate(year, month, day)) {
    errors.day = "Ngày sinh không hợp lệ, vui lòng kiểm tra lại.";
  }

  if (!input.unknownBirthTime) {
    const birthHour = parseRequiredNumber(input.birthHour, 0, 23);
    const birthMinute = input.birthMinute.trim() ? parseRequiredNumber(input.birthMinute, 0, 59) : 0;

    if (birthHour === null) {
      errors.birthHour = "Vui lòng chọn giờ sinh hoặc chọn 'Không rõ giờ sinh'.";
    }

    if (birthMinute === null) {
      errors.birthMinute = "Phút sinh không hợp lệ.";
    }
  }

  if (horoscopeYear === null) {
    errors.horoscopeYear = "Vui lòng nhập năm hợp lệ.";
  }

  return errors;
};

const buildInputSignature = (input: BirthInput) => JSON.stringify(input);

const clampScore = (value: number) => Math.max(35, Math.min(95, Math.round(value)));

const calculatePalaceScore = (chart: ChartView | null, palaceNames: string[]) => {
  if (!chart) {
    return 50;
  }

  const palace = chart.palaces.find((item) => palaceNames.includes(item.name));
  if (!palace) {
    return 50;
  }

  const goodStars = palace.goodStars?.length ?? 0;
  const badStars = palace.badStars?.length ?? 0;
  const majorStars = palace.majorStars?.length ?? 0;

  return clampScore(58 + goodStars * 7 - badStars * 5 + majorStars * 2);
};

const downloadBlob = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const openBlobInNewTab = (blob: Blob) => {
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener,noreferrer");
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
};

const isMobileViewport = () => window.matchMedia("(max-width: 760px)").matches;

const simplifyStar = (star: StarView) => ({
  name: star.name,
  display: star.display,
  brightness: star.brightness,
  brightnessFull: star.brightnessFull,
  source: star.source,
  scope: star.scope,
  category: star.category,
  nature: star.nature,
  colorGroup: star.colorGroup,
  targetStar: star.targetStar,
});

const simplifyPalace = (palace: PalaceView) => ({
  name: palace.name,
  branch: palace.earthlyBranch,
  stem: palace.heavenlyStem,
  isBodyPalace: palace.isBodyPalace,
  decadalRange: palace.decadalRange,
  ages: palace.ages,
  changsheng12: palace.changsheng12,
  boshi12: palace.boshi12,
  suiqian12: palace.suiqian12,
  jiangqian12: palace.jiangqian12,
  majorStars: palace.majorStars.map(simplifyStar),
  visibleStars: palace.visibleStars.map(simplifyStar),
  goodStars: palace.goodStars.map(simplifyStar),
  badStars: palace.badStars.map(simplifyStar),
  specialMarkers: palace.specialMarkers,
});

const buildLuanGiaiPayload = (chart: ChartView, input: BirthInput, luuOptions: LuuDisplayOptions) => ({
  profile: chart.profile,
  input,
  luuOptions,
  palaces: chart.palaces.map(simplifyPalace),
  palaceStemMap: chart.palaceStemMap,
  laiNhanCung: chart.laiNhanCung,
  luuWarnings: chart.luuWarnings,
  normalized: chart.normalized,
});

const readLuanGiaiResponse = async (response: Response) => {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return {
      error: text,
      isNonJsonResponse: true,
    };
  }
};

const getLuanGiaiErrorMessage = (response: Response, data: any) => {
  if (typeof data?.error === "string" && data.error.trim()) {
    return data.error;
  }

  if (response.status === 404) {
    return "Không tìm thấy Netlify Function luận giải.";
  }

  if (response.status === 500) {
    return "Server luận giải chưa sẵn sàng.";
  }

  if (response.status === 502) {
    return "Dịch vụ AI đang tạm thời lỗi. Hãy thử lại sau ít phút.";
  }

  return `Không thể luận giải lá số lúc này. Mã lỗi HTTP ${response.status}.`;
};

const serializeInputToSearch = (input: BirthInput) => {
  const params = new URLSearchParams();

  Object.entries(input).forEach(([key, value]) => {
    params.set(key, String(value));
  });

  return params.toString();
};

const readInputFromSearch = () => {
  const params = new URLSearchParams(window.location.search);
  if (!params.toString()) {
    return null;
  }

  return {
    ...defaultInput,
    fullName: params.get("fullName") ?? defaultInput.fullName,
    year: params.get("year") ?? defaultInput.year,
    month: params.get("month") ?? defaultInput.month,
    day: params.get("day") ?? defaultInput.day,
    birthHour: params.get("birthHour") ?? defaultInput.birthHour,
    birthMinute: params.get("birthMinute") ?? defaultInput.birthMinute,
    gender: (params.get("gender") as BirthInput["gender"]) ?? defaultInput.gender,
    calendarType: (params.get("calendarType") as BirthInput["calendarType"]) ?? defaultInput.calendarType,
    horoscopeYear: params.get("horoscopeYear") ?? defaultInput.horoscopeYear,
    unknownBirthTime: params.get("unknownBirthTime") === "true",
  } satisfies BirthInput;
};

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activePage, setActivePage] = useState<MainPageId>("home");
  const [pendingSection, setPendingSection] = useState<HomeSectionId | null>(null);
  const [birthInput, setBirthInput] = useState<BirthInput>(defaultInput);
  const [submittedInput, setSubmittedInput] = useState<BirthInput | null>(null);
  const [chart, setChart] = useState<ChartView | null>(null);
  const [hasRequestedChart, setHasRequestedChart] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
  const [statusMessage, setStatusMessage] = useState("");
  const [shareMessage, setShareMessage] = useState("");
  const [showChartJson, setShowChartJson] = useState(false);
  const [showReading, setShowReading] = useState(false);
  const [readingResult, setReadingResult] = useState("");
  const [readingError, setReadingError] = useState("");
  const [isReadingLoading, setIsReadingLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloadingImage, setIsDownloadingImage] = useState(false);
  const [luuOptions, setLuuOptions] = useState<LuuDisplayOptions>({
    showLuuTuHoa: false,
    showLuuTuDuc: false,
    showLuuDaiVan: false,
    showLuuOtherStars: false,
    showLocKyNhap: false,
    showLuuTuanTriet: false,
  });
  const [horoscopeYear, setHoroscopeYear] = useState(currentYear);
  const [lastSubmittedSignature, setLastSubmittedSignature] = useState<string | null>(null);
  const chartCaptureRef = useRef<HTMLDivElement | null>(null);
  const resultRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const section = routeToHomeSection[location.pathname];

    if (section) {
      setActivePage("home");
      setPendingSection(section);
      return;
    }

    if (location.pathname === "/lap-la-so") {
      setActivePage("lap-la-so");
      setPendingSection(null);
      return;
    }

    setActivePage("home");
    setPendingSection(null);
  }, [location.pathname]);

  useEffect(() => {
    const inputFromSearch = readInputFromSearch();
    if (!inputFromSearch) {
      return;
    }

    setBirthInput(inputFromSearch);
    navigate(`/lap-la-so${location.search}`, { replace: true });
  }, []);

  useEffect(() => {
    if (activePage !== "home" || !pendingSection) {
      return;
    }

    window.requestAnimationFrame(() => {
      document.getElementById(pendingSection)?.scrollIntoView({ behavior: "smooth", block: "start" });
      setPendingSection(null);
    });
  }, [activePage, pendingSection]);

  useEffect(() => {
    if (!submittedInput) {
      return;
    }

    const normalizedInput = normalizeBirthInput(submittedInput);
    if (!normalizedInput) {
      return;
    }

    setChart(createChart(normalizedInput, "tuvichancoCompatible", { luuOptions, horoscopeDate: new Date(horoscopeYear, 5, 15) }));
    setReadingResult("");
    setReadingError("");
    setShowReading(false);
  }, [submittedInput, luuOptions, horoscopeYear]);

  const hasDirtyChanges = useMemo(() => {
    if (!lastSubmittedSignature) {
      return false;
    }

    return buildInputSignature(birthInput) !== lastSubmittedSignature;
  }, [birthInput, lastSubmittedSignature]);

  const quickReadings = useMemo(() => {
    if (!chart) {
      return [];
    }

    return buildQuickReadings(chart);
  }, [chart]);

  const navigateHomeSection = (section: HomeSectionId) => {
    const route = homeSectionRoutes[section];

    if (location.pathname !== route) {
      setPendingSection(section);
      navigate(route);
      return;
    }

    document.getElementById(section)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const navigateHome = () => {
    navigate("/");
  };

  const navigateChartForm = () => {
    navigate("/lap-la-so");
  };

  const getNavLinkClass = (route: string) => `site-nav-link${location.pathname === route ? " is-active" : ""}`;

  const handleGenerateFromInput = (nextInput: BirthInput) => {
    const errors = validateBirthInput(nextInput);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setStatusMessage("");
      return;
    }

    setFieldErrors({});
    setShareMessage("");
    setStatusMessage("");
    setIsGenerating(true);
    navigate("/lap-la-so");

    window.setTimeout(() => {
      const normalizedInput = normalizeBirthInput(nextInput);

      if (!normalizedInput) {
        setFieldErrors({ form: "Không thể lập lá số từ dữ liệu hiện tại. Vui lòng kiểm tra lại thông tin sinh." });
        setIsGenerating(false);
        return;
      }

      const nextYear = getHoroscopeYear(nextInput);
      setHoroscopeYear(nextYear);
      setSubmittedInput(nextInput);
      setChart(createChart(normalizedInput, "tuvichancoCompatible", { luuOptions, horoscopeDate: new Date(nextYear, 5, 15) }));
      setHasRequestedChart(true);
      setShowChartJson(false);
      setShowReading(false);
      setReadingResult("");
      setReadingError("");
      setLastSubmittedSignature(buildInputSignature(nextInput));
      setStatusMessage("Lá số của bạn đã được tạo.");
      navigate(`/lap-la-so?${serializeInputToSearch(nextInput)}`, { replace: true });
      setIsGenerating(false);

      window.requestAnimationFrame(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }, 40);
  };

  const handleGenerateChart = () => {
    handleGenerateFromInput(birthInput);
  };

  const handleToggleChartJson = () => {
    if (!chart) {
      return;
    }

    setShowChartJson((current) => !current);
  };

  const handleLuanGiai = async () => {
    if (!chart || !submittedInput || isReadingLoading) {
      return;
    }

    setShowReading(true);
    setReadingError("");
    setReadingResult("");
    setIsReadingLoading(true);

    try {
      const response = await fetch("/.netlify/functions/luan-giai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chart: buildLuanGiaiPayload(chart, submittedInput, luuOptions),
        }),
      });
      const data = await readLuanGiaiResponse(response);

      if (!response.ok) {
        throw new Error(getLuanGiaiErrorMessage(response, data));
      }

      if (!data?.result) {
        if (data?.isNonJsonResponse) {
          throw new Error("Chưa kết nối được Netlify Function luận giải. Nếu đang chạy local, hãy dùng netlify dev thay vì npm run dev.");
        }

        throw new Error("AI chưa trả về nội dung luận giải. Vui lòng thử lại.");
      }

      setReadingResult(data.result);
    } catch (error) {
      console.error(error);
      setReadingError(error instanceof Error ? error.message : "Không thể luận giải lá số lúc này. Vui lòng thử lại sau.");
    } finally {
      setIsReadingLoading(false);
    }
  };

  const handleDownloadImage = async () => {
    if (!chartCaptureRef.current || !chart) {
      return;
    }

    setIsDownloadingImage(true);

    try {
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
        if (!pngBlob) {
          throw new Error("Không tạo được PNG từ lá số.");
        }

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

  const handleResetChart = () => {
    setBirthInput(defaultInput);
    setSubmittedInput(null);
    setChart(null);
    setHasRequestedChart(false);
    setFieldErrors({});
    setStatusMessage("");
    setShareMessage("");
    setShowChartJson(false);
    setShowReading(false);
    setReadingResult("");
    setReadingError("");
    setHoroscopeYear(currentYear);
    setLastSubmittedSignature(null);
    navigate("/lap-la-so", { replace: true });
  };

  const chartJson = chart
    ? JSON.stringify(
        {
          mapped: chart,
          raw: chart.raw,
        },
        null,
        2,
      )
    : "";

  const homePage = (
    <div className="home-page">
      <section className="home-hero home-hero--focused">
        <div className="home-hero-copy">
          <p className="eyebrow">Trung Tâm Luận Giải Tử Vi</p>
          <h1>Khám Phá Vận Mệnh Qua Lá Số Tử Vi</h1>
          <p>
            Xem Mệnh, Thân, 12 cung và nhận các luận giải chuyên sâu về tài lộc, sự nghiệp, tình duyên và vận hạn dựa trên ngày giờ sinh.
          </p>
          <div className="home-hero-actions">
            <button type="button" className="primary-button" onClick={navigateChartForm}>
              Lập Lá Số Miễn Phí
            </button>
            <button type="button" className="ghost-button" onClick={() => navigateHomeSection("la-so-mau")}>
              Xem Lá Số Mẫu
            </button>
          </div>
          <TrustBadges />
        </div>
      </section>

      <HomeShowcase />
      <SampleChartsSection
        presets={sampleCharts}
        onSelect={(preset) => {
          setBirthInput(preset.input);
          handleGenerateFromInput(preset.input);
        }}
      />
      <section id="hop-tuoi" className="content-section">
        <div className="placeholder-card">
          <p className="eyebrow">Hợp Tuổi & Tương Hợp</p>
          <h2>Luận Giải Hợp Tuổi & Tình Duyên</h2>
          <p>Đánh giá mức độ hòa hợp giữa hai lá số trong hôn nhân, tình cảm và hợp tác làm ăn. Tính năng sẽ sớm ra mắt.</p>
          <button type="button" className="ghost-button" onClick={navigateChartForm}>
            Lập lá số để bắt đầu
          </button>
        </div>
      </section>
      <EducationSection />
      <PremiumPlans />
      <FAQSection />
      <PrivacyNotice />
    </div>
  );

  const workspace = (
    <div className="app workspace-page">
      <section className="top-hero-row">
        <section className="top-left-panel">
          <SolarNoonCalculator />
        </section>
        <section className="form-panel">
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
        {statusMessage ? <div className="result-status" role="status">{statusMessage}</div> : null}
        {shareMessage ? <div className="result-status result-status--muted">{shareMessage}</div> : null}

        <div className="chart-tools">
          <LuuStarOptions value={luuOptions} onChange={setLuuOptions} />
          <div className="chart-tools-actions">
            <button type="button" className="debug-button" onClick={handleLuanGiai} disabled={!chart || isReadingLoading}>
              {isReadingLoading ? "Đang luận giải..." : "Luận giải"}
            </button>
            <button type="button" className="debug-button" onClick={handleToggleChartJson} disabled={!chart}>
              {showChartJson ? "Ẩn JSON" : "Xem JSON"}
            </button>
          </div>
        </div>

        {showChartJson ? <pre className="debug-json">{chartJson}</pre> : null}
        {showReading ? <ChartReading result={readingResult} isLoading={isReadingLoading} error={readingError} /> : null}

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
                  showLocKyNhap={luuOptions.showLocKyNhap}
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

            <section id="luan-giai" className="result-block">
              <InterpretationCards items={quickReadings} />
            </section>
            <PalaceAccordion chart={chart} />

            <section id="van-han" className="result-block">
              <div className="section-heading section-heading--compact">
                <p className="eyebrow">Vận hạn</p>
                <h2>Theo dõi năm xem hạn</h2>
              </div>
              <div className="placeholder-card placeholder-card--inline">
                <p>
                  Phần luận vận hạn chi tiết sẽ được bổ sung trong phiên bản tiếp theo. Hiện tại bạn đã có thanh chọn năm và highlight tiểu vận trực tiếp trên lá số.
                </p>
              </div>
            </section>

            <section id="hanh-dong" className="result-block">
              <div className="premium-upsell-card">
                <div>
                  <p className="eyebrow">Luận Giải Chuyên Sâu</p>
                  <h2>Mở Khóa Luận Giải Chuyên Sâu, Báo Cáo PDF & Tư Vấn Chuyên Gia</h2>
                  <p className="result-note">
                    Nhận báo cáo chuyên sâu về tài lộc, sự nghiệp, tình duyên và các giai đoạn quan trọng. Hoặc đặt lịch tư vấn trực tiếp với chuyên gia.
                  </p>
                </div>
                <div className="premium-upsell-actions">
                  <button type="button" className="primary-button" onClick={() => navigateHomeSection("premium")}>Xem Bảng Giá</button>
                  <button type="button" className="ghost-button" onClick={handleLuanGiai} disabled={isReadingLoading}>
                    Luận giải ngay
                  </button>
                </div>
              </div>

              <ExportActions
                onDownloadImage={handleDownloadImage}
                onCopyLink={handleCopyLink}
                onReset={handleResetChart}
                isDownloadingImage={isDownloadingImage}
              />
            </section>

            <div className="result-disclaimer">
              Kết quả chỉ mang tính tham khảo, chiêm nghiệm và giải trí. Không thay thế tư vấn chuyên môn về y tế, tài chính, pháp lý hoặc các quyết định quan trọng.
            </div>
          </>
        ) : (
          <section className="result-empty-card">
            <p className="eyebrow">Sẵn sàng</p>
            <h2>Lá số sẽ xuất hiện sau khi bạn bấm “Lập lá số ngay”</h2>
            <p>Hệ thống sẽ hiển thị biểu đồ 12 cung, luận giải nhanh và phần chi tiết từng cung ngay bên dưới.</p>
          </section>
        )}
      </section>
    </div>
  );

  return (
    <div className="site-shell">
      <header className="site-header">
        <div className="site-header-inner">
          <button type="button" className="site-brand" onClick={navigateHome}>
            <span className="site-brand-mark">L</span>
            <span className="site-brand-copy">
              <strong>LaSoTuVi</strong>
              <small>Luận Giải Vận Mệnh</small>
            </span>
          </button>

          <nav className="site-nav" aria-label="Điều hướng chính">
            <button type="button" className={getNavLinkClass("/")} onClick={navigateHome}>
              Trang chủ
            </button>
            <button type="button" className={getNavLinkClass("/lap-la-so")} onClick={navigateChartForm}>
              Lập lá số
            </button>
            <button type="button" className={getNavLinkClass("/la-so-mau")} onClick={() => navigateHomeSection("la-so-mau")}>
              Lá số mẫu
            </button>
            <button type="button" className={getNavLinkClass("/hop-tuoi")} onClick={() => navigateHomeSection("hop-tuoi")}>
              Hợp tuổi
            </button>
            <button type="button" className={getNavLinkClass("/blog")} onClick={() => navigateHomeSection("kien-thuc")}>
              Kiến thức
            </button>
            <button type="button" className={getNavLinkClass("/bang-gia")} onClick={() => navigateHomeSection("premium")}>
              Bảng giá
            </button>
            <button type="button" className={getNavLinkClass("/lien-he")} onClick={() => navigateHomeSection("lien-he")}>
              Liên hệ
            </button>
          </nav>

          <div className="site-auth">
            <button type="button" className="primary-button site-login-button" onClick={navigateChartForm}>
              Lập Lá Số Miễn Phí
            </button>
          </div>
        </div>
      </header>

      <main className="site-main">
        {activePage === "home" ? homePage : workspace}
      </main>

      <SocialProofPopup />
      <FloatingContactLinks />
      <SiteFooter />
    </div>
  );
}

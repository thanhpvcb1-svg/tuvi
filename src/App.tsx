import React, { useEffect, useMemo, useRef, useState } from "react";
import { toBlob, toJpeg } from "html-to-image";
import { useLocation, useNavigate } from "react-router-dom";
import BirthForm from "./components/BirthForm";
import ChartReading from "./components/ChartReading";
import ExportActions from "./components/ExportActions";
import FAQSection from "./components/FAQSection";
import FloatingContactLinks from "./components/FloatingContactLinks";
import FloatingPaymentCard from "./components/FloatingPaymentCard";
import HomeShowcase from "./components/HomeShowcase";
import InterpretationCards from "./components/InterpretationCards";
import { LuuStarOptions } from "./components/LuuStarOptions";
import PalaceAccordion from "./components/PalaceAccordion";
import PrivacyNotice from "./components/PrivacyNotice";
import PremiumPlans from "./components/PremiumPlans";
import SampleChartsSection, { type SampleChartPreset } from "./components/SampleChartsSection";
import SEOHead from "./components/SEOHead";
import SiteFooter from "./components/SiteFooter";
import SolarNoonCalculator from "./components/SolarNoonCalculator";
import TrustBadges from "./components/TrustBadges";
import TuviChart from "./components/TuviChart";
import VanHanhSelector, { getActivePalaceIndexes } from "./components/VanHanhSelector";
import { buildQuickReadings } from "./lib/chartUi";
import { createChart } from "./lib/iztroEngine";
import type { BirthInput, ChartView, LuuDisplayOptions, NormalizedBirthInput, PalaceView, StarView } from "./lib/types";

type MainPageId = "home" | "lap-la-so" | "bang-gia" | "la-so-mau" | "blog" | "faq" | "hop-tuoi" | "lien-he";
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

const siteUrl = "https://tuvi.pages.dev";

const homeFaqs = [
  {
    question: "Lập lá số tử vi online có miễn phí không?",
    answer: "Có. Bạn có thể lập lá số cơ bản miễn phí để xem nhanh Mệnh, Thân, 12 cung và tổng quan ban đầu.",
  },
  {
    question: "Có cần giờ sinh chính xác không?",
    answer: "Có giờ sinh chính xác sẽ giúp hệ thống an cung và đọc lá số sát hơn. Nếu chưa chắc, bạn vẫn có thể xem bản tham khảo.",
  },
  {
    question: "Không nhớ giờ sinh thì có xem được không?",
    answer: "Có. Bạn có thể chọn chế độ không rõ giờ sinh để xem tổng quan, nhưng mức độ chi tiết sẽ hạn chế hơn.",
  },
  {
    question: "Dữ liệu ngày giờ sinh được dùng để làm gì?",
    answer: "Dữ liệu được dùng để an lá số, xác định Mệnh, Thân, 12 cung và các thông tin liên quan trong quá trình xem lá số.",
  },
  {
    question: "Gói hỏi 1 câu 50.000đ nhận được gì?",
    answer: "Bạn gửi một câu hỏi cụ thể theo lá số và nhận phần trả lời tập trung đúng vấn đề đang quan tâm như công việc, tài lộc, tình duyên hoặc vận hạn.",
  },
  {
    question: "Khi nào nên chọn tư vấn trực tiếp với thầy?",
    answer: "Phù hợp khi bạn cần nhìn toàn diện hơn về lá số hoặc cần định hướng nghiêm túc cho một giai đoạn quan trọng.",
  },
];

const pricingFaqs = [
  {
    question: "Tôi có thể xem miễn phí trước không?",
    answer: "Có. Bạn có thể lập lá số cơ bản miễn phí trước khi quyết định chọn gói hỏi 1 câu hoặc tư vấn trực tiếp.",
  },
  {
    question: "Thanh toán xong nhận luận giải như thế nào?",
    answer: "Sau khi thanh toán, bạn sẽ được hướng dẫn gửi câu hỏi hoặc đặt lịch trao đổi để nhận phần luận giải phù hợp với gói đã chọn.",
  },
  {
    question: "Hỏi 1 câu có giới hạn nội dung không?",
    answer: "Gói này phù hợp nhất khi bạn tập trung vào một vấn đề rõ ràng, ví dụ công việc, tài lộc, tình duyên hoặc vận hạn trong năm.",
  },
  {
    question: "Gói tư vấn trực tiếp phù hợp với ai?",
    answer: "Phù hợp với người cần góc nhìn chuyên sâu, cần định hướng rõ ràng hoặc muốn trao đổi trực tiếp về nhiều khía cạnh trong lá số.",
  },
  {
    question: "Có cần lập lá số trước khi hỏi không?",
    answer: "Nên lập lá số trước để câu hỏi bám đúng dữ liệu cá nhân và giúp phần trả lời tập trung hơn vào trường hợp của bạn.",
  },
];

const blogPosts = [
  {
    slug: "/blog/menh-va-than-trong-tu-vi-la-gi",
    title: "Mệnh và Thân trong tử vi là gì?",
    description: "Hiểu vai trò của Mệnh và Thân để đọc lá số dễ hơn và biết nên bắt đầu từ đâu.",
  },
  {
    slug: "/blog/dai-van-va-tieu-van-la-gi",
    title: "Đại vận và tiểu vận là gì?",
    description: "Phân biệt hai lớp vận trình quan trọng để theo dõi từng giai đoạn cuộc sống rõ ràng hơn.",
  },
  {
    slug: "/blog/cung-quan-loc-noi-gi-ve-su-nghiep",
    title: "Cung Quan Lộc nói gì về sự nghiệp?",
    description: "Khám phá cách cung Quan Lộc phản ánh hướng phát triển nghề nghiệp và cơ hội thăng tiến.",
  },
  {
    slug: "/blog/cung-tai-bach-noi-gi-ve-tai-loc",
    title: "Cung Tài Bạch nói gì về tài lộc?",
    description: "Tìm hiểu cách xem xu hướng tiền bạc, tích lũy và các điểm cần thận trọng trong tài chính.",
  },
  {
    slug: "/blog/khong-nho-gio-sinh-co-lap-la-so-duoc-khong",
    title: "Không nhớ giờ sinh có lập lá số tử vi được không?",
    description: "Xem trường hợp chưa rõ giờ sinh nên hiểu kết quả như thế nào và cách giảm sai lệch khi đọc lá số.",
  },
  {
    slug: "/blog/cung-phu-the-noi-gi-ve-tinh-duyen",
    title: "Cung Phu Thê nói gì về tình duyên?",
    description: "Hiểu vai trò của cung Phu Thê khi xem xu hướng gắn kết, hôn nhân và cách xây dựng mối quan hệ.",
  },
  {
    slug: "/blog/cach-xac-dinh-gio-sinh-trong-tu-vi",
    title: "Cách xác định giờ sinh trong tử vi",
    description: "Một vài gợi ý thực tế để đối chiếu thông tin và giảm sai lệch khi bạn chưa chắc giờ sinh của mình.",
  },
  {
    slug: "/blog/la-so-tu-vi-gom-nhung-phan-nao",
    title: "Lá số tử vi gồm những phần nào?",
    description: "Tìm hiểu các phần nền tảng như Mệnh, Thân, 12 cung, chính tinh, phụ tinh, đại vận và tiểu vận.",
  },
  {
    slug: "/blog/chinh-tinh-va-phu-tinh-la-gi",
    title: "Chính tinh và phụ tinh là gì?",
    description: "Phân biệt hai nhóm sao thường gặp khi bắt đầu đọc lá số tử vi và cách hiểu vai trò của chúng.",
  },
  {
    slug: "/blog/xem-van-han-nam-2026-theo-la-so-tu-vi",
    title: "Xem vận hạn năm 2026 theo lá số tử vi",
    description: "Cách tiếp cận năm đang xem trong lá số để nhận diện những giai đoạn cần chủ động hơn về công việc và tài chính.",
  },
];

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
    if (location.pathname === "/lap-la-so") {
      setActivePage("lap-la-so");
      return;
    }
    if (location.pathname === "/bang-gia" || location.pathname === "/premium") {
      setActivePage("bang-gia");
      return;
    }
    if (location.pathname === "/la-so-mau") {
      setActivePage("la-so-mau");
      return;
    }
    if (location.pathname === "/blog" || location.pathname === "/kien-thuc") {
      setActivePage("blog");
      return;
    }
    if (location.pathname === "/faq") {
      setActivePage("faq");
      return;
    }
    if (location.pathname === "/hop-tuoi") {
      setActivePage("hop-tuoi");
      return;
    }
    if (location.pathname === "/lien-he") {
      setActivePage("lien-he");
      return;
    }
    setActivePage("home");
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
    navigate(route);
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

  const faqSchema = (items: typeof homeFaqs) => ({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  });

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "LaSoTuVi",
    url: siteUrl,
  };

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "LaSoTuVi",
    url: siteUrl,
  };

  const pageSeo = (() => {
    switch (activePage) {
      case "lap-la-so":
        return {
          title: "Lập Lá Số Tử Vi Online Miễn Phí Theo Ngày Giờ Sinh",
          description:
            "Công cụ lập lá số tử vi online miễn phí theo ngày giờ sinh. Xem Mệnh, Thân, 12 cung, chính tinh, phụ tinh, đại vận và tiểu vận.",
          canonicalPath: "/lap-la-so",
        };
      case "bang-gia":
        return {
          title: "Bảng Giá Luận Giải Tử Vi - Hỏi 1 Câu Từ 50.000đ",
          description:
            "Xem các gói luận giải tử vi: lập lá số miễn phí, hỏi 1 câu theo lá số 50.000đ và tư vấn trực tiếp với thầy 999.000đ.",
          canonicalPath: "/bang-gia",
        };
      case "la-so-mau":
        return {
          title: "Lá Số Tử Vi Mẫu - Xem Cách Luận Giải Lá Số",
          description:
            "Xem giao diện lá số tử vi mẫu, cách hiển thị Mệnh, Thân, 12 cung, đại vận và tiểu vận trước khi lập lá số của riêng bạn.",
          canonicalPath: "/la-so-mau",
        };
      case "blog":
        return {
          title: "Blog Tử Vi - Kiến Thức Lá Số, Đại Vận, Tiểu Vận",
          description:
            "Khám phá các bài viết cơ bản về lá số tử vi, Mệnh, Thân, đại vận, tiểu vận, cung Quan Lộc và cung Tài Bạch.",
          canonicalPath: "/blog",
        };
      default:
        return {
          title: "LaSoTuVi - Lập Lá Số Tử Vi Online & Luận Giải Theo Lá Số",
          description:
            "Lập lá số tử vi online miễn phí, xem Mệnh, Thân, 12 cung, đại vận, tiểu vận và hỏi thêm theo lá số về sự nghiệp, tài lộc, tình duyên.",
          canonicalPath: "/",
        };
    }
  })();

  const homePage = (
    <div className="home-page">
      <SEOHead
        title={pageSeo.title}
        description={pageSeo.description}
        canonicalPath={pageSeo.canonicalPath}
        schema={[websiteSchema, organizationSchema, faqSchema(homeFaqs)]}
      />
      <section className="home-hero home-hero--focused">
        <div className="home-hero-copy">
          <p className="eyebrow">LaSoTuVi</p>
          <h1>Lập lá số tử vi online theo ngày giờ sinh</h1>
          <p>
            Tạo lá số miễn phí, xem nhanh Mệnh, Thân, 12 cung, đại vận, tiểu vận và nhận luận giải dễ hiểu về sự nghiệp, tài lộc, tình duyên.
          </p>
          <div className="home-hero-actions">
            <button type="button" className="primary-button" onClick={navigateChartForm}>
              Lập lá số miễn phí
            </button>
            <button type="button" className="ghost-button" onClick={() => navigateHomeSection("la-so-mau")}>
              Xem lá số mẫu
            </button>
          </div>
          <TrustBadges />
        </div>
      </section>

      <HomeShowcase />
      <PremiumPlans
        eyebrow="Bảng giá trên trang chủ"
        title="Bắt đầu miễn phí, sau đó chọn đúng mức hỗ trợ bạn cần"
        description="Mô hình bán hàng được giữ đơn giản: lập lá số miễn phí, hỏi 1 câu theo lá số với 50.000đ hoặc đặt lịch tư vấn trực tiếp khi cần phân tích sâu."
        compact
      />
      <FAQSection
        faqs={homeFaqs}
        eyebrow="FAQ"
        title="Giải đáp nhanh trước khi bạn bắt đầu"
        description="Những câu hỏi phổ biến nhất khi lập lá số hoặc chọn gói luận giải."
      />
      <PrivacyNotice />
    </div>
  );

  const workspace = (
    <div className="app workspace-page">
      <SEOHead
        title={pageSeo.title}
        description={pageSeo.description}
        canonicalPath={pageSeo.canonicalPath}
        schema={[organizationSchema]}
      />
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
                  <p className="eyebrow">Cần xem sâu hơn?</p>
                  <h2>Hỏi 1 câu theo lá số hoặc đặt lịch tư vấn trực tiếp với thầy</h2>
                  <p className="result-note">
                    Sau khi đã có lá số cơ bản, bạn có thể hỏi thêm một vấn đề cụ thể với mức 50.000đ hoặc chọn tư vấn trực tiếp khi cần định hướng nghiêm túc.
                  </p>
                </div>
                <div className="premium-upsell-actions">
                  <button type="button" className="primary-button" onClick={() => navigate("/bang-gia")}>Hỏi 1 câu về lá số này — 50.000đ</button>
                  <button type="button" className="ghost-button" onClick={() => navigate("/bang-gia")}>Đặt lịch tư vấn trực tiếp với thầy</button>
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

      <section className="content-section lap-la-so-seo">
        <div className="section-heading section-heading--compact">
          <p className="eyebrow">Kiến thức nền</p>
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
              cách, xu hướng phát triển và các giai đoạn vận hành nổi bật trong cuộc sống. Khi lập lá số, người dùng thường
              quan tâm tới Mệnh, Thân, 12 cung cùng các sao chính và sao phụ đi kèm. Mục tiêu của công cụ trên trang là giúp
              bạn xem phần nền tảng này một cách dễ tiếp cận hơn, không quá khó hiểu với người mới bắt đầu.
            </p>
            <p>
              Với trải nghiệm online, bạn có thể nhập dữ liệu ngay trên trình duyệt để xem lá số cơ bản miễn phí trước. Đây là
              bước phù hợp để kiểm tra bố cục lá số, nhận các gợi ý tổng quan và xác định xem mình cần đọc sâu thêm ở mảng nào
              như sự nghiệp, tài lộc, tình duyên hay vận hạn theo năm.
            </p>
          </article>
          <article className="seo-copy-card">
            <h3>Công cụ lập lá số tính những gì?</h3>
            <p>
              Sau khi nhập dữ liệu sinh, hệ thống sẽ an lá số dựa trên thông tin ngày giờ và năm đang xem. Từ đó, bạn có thể
              thấy Mệnh, Thân, 12 cung, các chính tinh, phụ tinh, đại vận và tiểu vận hiển thị trên cùng một giao diện. Đây là
              phần cốt lõi để bạn có một cái nhìn trực quan trước khi đi vào luận giải sâu hơn.
            </p>
            <p>
              Ngoài phần biểu đồ, LaSoTuVi còn bổ sung lớp diễn giải ngắn, giúp người dùng mới hiểu nhanh ý nghĩa của từng khu
              vực trong lá số. Khi cần, bạn có thể chuyển sang gói hỏi 1 câu để nhận câu trả lời tập trung vào đúng vấn đề đang
              phân vân, thay vì đọc một lượng nội dung quá dài ngay từ đầu.
            </p>
          </article>
          <article className="seo-copy-card">
            <h3>Vì sao giờ sinh quan trọng?</h3>
            <p>
              Giờ sinh ảnh hưởng trực tiếp tới cách an cung và vị trí một số sao trong lá số. Vì vậy, nếu có giờ sinh chính xác,
              kết quả thường rõ hơn và giúp việc đọc Mệnh, Thân cũng như các cung khác sát hơn. Tuy nhiên, trong trường hợp chưa
              nhớ rõ giờ sinh, bạn vẫn có thể dùng chế độ tham khảo để xem tổng quan ban đầu.
            </p>
            <p>
              Điều quan trọng là hiểu đúng giới hạn của bản xem tham khảo. Khi chưa chắc giờ sinh, bạn nên dùng kết quả để định
              hướng câu hỏi, sau đó chỉ đi sâu vào các quyết định lớn khi đã có thêm dữ liệu hoặc chọn tư vấn trực tiếp để được
              hỗ trợ đọc theo bối cảnh thực tế của mình.
            </p>
          </article>
          <article className="seo-copy-card">
            <h3>Lập lá số miễn phí khác gì luận giải chuyên sâu?</h3>
            <p>
              Bản miễn phí phù hợp để bạn nhìn tổng quan lá số, xác định các cung nổi bật và hiểu bố cục chính. Trong khi đó,
              luận giải sâu phù hợp khi bạn cần trả lời một câu hỏi cụ thể hoặc cần một góc nhìn có cấu trúc hơn về một giai
              đoạn quan trọng như đổi việc, chuyển hướng công việc, tài chính hoặc chuyện tình cảm.
            </p>
            <p>
              Vì vậy, hành trình hợp lý thường là: lập lá số miễn phí trước, xem phần nền, sau đó mới quyết định có cần hỏi thêm
              một vấn đề theo lá số với mức 50.000đ hay đặt lịch tư vấn trực tiếp nếu tình huống phức tạp hơn.
            </p>
          </article>
        </div>
      </section>
    </div>
  );

  const samplePage = (
    <div className="home-page">
      <SEOHead
        title={pageSeo.title}
        description={pageSeo.description}
        canonicalPath={pageSeo.canonicalPath}
        schema={[organizationSchema]}
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
        onSelect={(preset) => {
          setBirthInput(preset.input);
          handleGenerateFromInput(preset.input);
        }}
      />
      <section className="content-section">
        <div className="seo-copy-grid">
          <article className="seo-copy-card">
            <h3>Mệnh, Thân và Cục</h3>
            <p>Người dùng có thể xem cách các phần nền tảng của lá số được trình bày trước, từ đó hiểu nhanh mình cần đọc gì sau khi lập lá số thật.</p>
          </article>
          <article className="seo-copy-card">
            <h3>Đại vận và tiểu vận</h3>
            <p>Bố cục ví dụ giúp hình dung cách theo dõi vận trình theo giai đoạn và cách năm đang xem được đặt trong toàn bộ hành trình lá số.</p>
          </article>
          <article className="seo-copy-card">
            <h3>Ví dụ luận giải sự nghiệp và tài lộc</h3>
            <p>LaSoTuVi ưu tiên cách diễn giải ngắn gọn, dễ hiểu và tập trung vào điều người dùng cần nhất trước khi quyết định hỏi sâu hơn.</p>
          </article>
          <article className="seo-copy-card">
            <h3>Ví dụ luận giải tình duyên</h3>
            <p>Trang mẫu giúp tăng niềm tin bằng cách cho người dùng thấy trước phong cách trình bày, thay vì chỉ yêu cầu nhập dữ liệu rồi mới hiển thị kết quả.</p>
          </article>
        </div>
      </section>
      <section className="content-section">
        <div className="placeholder-card">
          <h2>Bạn muốn xem lá số của chính mình?</h2>
          <p>Chỉ cần nhập ngày giờ sinh để tạo lá số miễn phí và xem nhanh các cung quan trọng.</p>
          <div className="home-hero-actions">
            <button type="button" className="primary-button" onClick={navigateChartForm}>Lập lá số của tôi</button>
            <button type="button" className="ghost-button" onClick={() => navigate("/bang-gia")}>Hỏi 1 câu về lá số của tôi</button>
          </div>
        </div>
      </section>
    </div>
  );

  const pricingPage = (
    <div className="home-page">
      <SEOHead
        title={pageSeo.title}
        description={pageSeo.description}
        canonicalPath={pageSeo.canonicalPath}
        schema={[organizationSchema, faqSchema(pricingFaqs)]}
      />
      <section className="content-section">
        <div className="section-heading">
          <p className="eyebrow">Bảng giá</p>
          <h1>Bảng giá luận giải tử vi</h1>
          <p>
            Bạn có thể lập lá số miễn phí trước, sau đó chọn hỏi 1 câu theo lá số hoặc tư vấn trực tiếp khi cần phân tích sâu hơn.
          </p>
        </div>
      </section>
      <PremiumPlans
        eyebrow="Luận giải & tư vấn"
        title="Bảng giá dịch vụ theo lá số"
        description="Rõ ràng, gọn và tập trung vào hành trình thực tế: xem miễn phí trước, hỏi 1 câu khi cần quyết định nhanh, hoặc tư vấn trực tiếp khi cần định hướng sâu."
      />
      <section className="content-section">
        <div className="section-heading">
          <p className="eyebrow">Chọn đúng gói</p>
          <h2>Mỗi mức hỗ trợ phù hợp với một nhu cầu khác nhau</h2>
        </div>
        <div className="seo-copy-grid">
          <article className="seo-copy-card">
            <h3>Miễn phí phù hợp với ai?</h3>
            <p>Phù hợp với người mới bắt đầu, muốn xem bố cục lá số, Mệnh, Thân và 12 cung trước khi quyết định có cần đọc sâu hơn hay không.</p>
          </article>
          <article className="seo-copy-card">
            <h3>Gói 50.000đ phù hợp với ai?</h3>
            <p>Phù hợp khi bạn đang phân vân một quyết định rõ ràng, ví dụ đổi việc, tài chính, tình duyên hoặc vận hạn của năm đang xem.</p>
          </article>
          <article className="seo-copy-card">
            <h3>Gói 999.000đ phù hợp với ai?</h3>
            <p>Phù hợp với người cần một buổi trao đổi nghiêm túc, muốn nhìn toàn diện hơn về lá số và cần định hướng theo từng giai đoạn.</p>
          </article>
        </div>
      </section>
      <FAQSection
        id="pricing-faq"
        eyebrow="FAQ bảng giá"
        title="Những điều người dùng thường hỏi trước khi chọn gói"
        description="Các câu hỏi thực tế về cách nhận luận giải và phạm vi từng dịch vụ."
        faqs={pricingFaqs}
      />
    </div>
  );

  const blogPage = (
    <div className="home-page">
      <SEOHead
        title={pageSeo.title}
        description={pageSeo.description}
        canonicalPath={pageSeo.canonicalPath}
        schema={[organizationSchema]}
      />
      <section className="content-section">
        <div className="section-heading">
          <p className="eyebrow">Blog tử vi</p>
          <h1>Kiến thức lá số, đại vận và tiểu vận</h1>
          <p>Các bài viết nền tảng giúp người mới hiểu cách đọc lá số dễ hơn trước khi đi sâu vào phần luận giải.</p>
        </div>
        <div className="blog-card-grid">
          {blogPosts.map((post) => (
            <article key={post.slug} className="product-card">
              <h3>{post.title}</h3>
              <p>{post.description}</p>
              <span className="blog-card-slug">{post.slug}</span>
              <div className="home-hero-actions">
                <a href="/blog" className="ghost-button" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                  Xem thêm
                </a>
                <a href="/lap-la-so" className="primary-button" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                  Lập lá số miễn phí
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );

  const faqPage = (
    <div className="home-page">
      <SEOHead title={pageSeo.title} description={pageSeo.description} canonicalPath="/faq" schema={[faqSchema(homeFaqs)]} />
      <FAQSection
        faqs={homeFaqs}
        eyebrow="FAQ"
        title="Câu hỏi thường gặp khi lập lá số"
        description="Tập hợp các thắc mắc phổ biến nhất trước khi tạo lá số hoặc chọn gói hỗ trợ."
      />
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
        {activePage === "home"
          ? homePage
          : activePage === "lap-la-so"
            ? workspace
            : activePage === "bang-gia"
              ? pricingPage
              : activePage === "la-so-mau"
                ? samplePage
                : activePage === "blog"
                  ? blogPage
                  : faqPage}
      </main>

      <FloatingPaymentCard onClick={() => navigate("/bang-gia")} />
      <FloatingContactLinks />
      <SiteFooter />
    </div>
  );
}

import React, { useEffect, useMemo, useRef, useState } from "react";
import { toBlob, toJpeg } from "html-to-image";
import { useLocation, useNavigate } from "react-router-dom";
import AIAnalysisPanel from "./components/AIAnalysisPanel";
import BacPhaiArticlePage from "./components/BacPhaiArticlePage";
import BacPhaiLibraryPage from "./components/BacPhaiLibraryPage";
import BirthForm from "./components/BirthForm";
import ExportActions from "./components/ExportActions";
import FAQSection from "./components/FAQSection";
import FloatingContactLinks from "./components/FloatingContactLinks";
import HomeShowcase from "./components/HomeShowcase";
import InterpretationCards from "./components/InterpretationCards";
import { LuuStarOptions } from "./components/LuuStarOptions";
import PalaceAccordion from "./components/PalaceAccordion";
import PrivacyNotice from "./components/PrivacyNotice";
import PremiumPlans, { primaryPlans, type PricingPlan } from "./components/PremiumPlans";
import SampleChartsSection, { type SampleChartPreset } from "./components/SampleChartsSection";
import SEOHead from "./components/SEOHead";
import SocialProofPopup from "./components/SocialProofPopup";
import SiteFooter from "./components/SiteFooter";
import SolarNoonCalculator from "./components/SolarNoonCalculator";
import TrustBadges from "./components/TrustBadges";
import TuviChart from "./components/TuviChart";
import VanHanhSelector, { getActivePalaceIndexes } from "./components/VanHanhSelector";
import VideoLessonsPage from "./components/VideoLessonsPage";
import { findKnowledgeArticleByPath, knowledgeArticles } from "./content/bacPhaiLibrary";
import {
  buildAIAnalysisCacheKey,
  buildOfflineAIAnalysis,
  buildAIAnalysisPayload,
  canGenerateNewAIAnalysisToday,
  consumeAIAnalysisQuota,
  generateLuanGiai,
  getCachedAIAnalysis,
  getRemainingAIAnalysisQuota,
  hasLimitedBacPhaiData,
  setCachedAIAnalysis,
  type AIAnalysisResult,
} from "./lib/aiLuanGiai";
import type { BirthInput, ChartView, LuuDisplayOptions, NormalizedBirthInput, PalaceView, StarView } from "./lib/types";
import type { QuickReadingCard } from "./lib/chartUi";

type MainPageId = "home" | "lap-la-so" | "bang-gia" | "la-so-mau" | "blog" | "faq" | "hop-tuoi" | "lien-he" | "video";
type HomeSectionId = "la-so-mau" | "kien-thuc" | "faq" | "premium" | "hop-tuoi" | "lien-he";
type FormErrors = Partial<Record<keyof BirthInput, string>> & { form?: string };

const currentYear = new Date().getFullYear();

const homeSectionRoutes: Record<HomeSectionId, string> = {
  "la-so-mau": "/la-so-mau",
  "kien-thuc": "/bai-viet",
  premium: "/bang-gia",
  faq: "/faq",
  "hop-tuoi": "/hop-tuoi",
  "lien-he": "/lien-he",
};

const siteUrl = "https://tuvi.pages.dev";
const contactEmail = import.meta.env.VITE_CONTACT_EMAIL?.trim() || "";
const contactSmsNumber = import.meta.env.VITE_CONTACT_SMS_NUMBER?.trim() || "";
const contactZaloUrl = import.meta.env.VITE_CONTACT_ZALO_URL?.trim() || "https://zalo.me/";
const contactFacebookUrl = import.meta.env.VITE_CONTACT_FACEBOOK_URL?.trim() || "https://www.facebook.com/";
const defaultLuuOptions: LuuDisplayOptions = {
  showLuuTuHoa: false,
  showPhiHoaCanCung: true,
  showLuuTuDuc: false,
  showLuuDaiVan: false,
  showLuuOtherStars: false,
  showLocKyNhap: false,
  showLuuTuanTriet: false,
};

let chartModulesPromise: Promise<{
  createChart: typeof import("./lib/iztroEngine").createChart;
  buildQuickReadings: typeof import("./lib/chartUi").buildQuickReadings;
}> | null = null;

const loadChartModules = async () => {
  if (!chartModulesPromise) {
    chartModulesPromise = Promise.all([
      import("./lib/iztroEngine"),
      import("./lib/chartUi"),
    ]).then(([iztroEngine, chartUi]) => ({
      createChart: iztroEngine.createChart,
      buildQuickReadings: chartUi.buildQuickReadings,
    }));
  }

  return chartModulesPromise;
};

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
    question: "Khi nào nên chọn tư vấn trực tiếp?",
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

const compatFaqs = [
  {
    question: "Xem hợp tuổi có cần lập lá số trước không?",
    answer: "Nên có lá số trước để việc đối chiếu đi theo đúng dữ liệu cá nhân thay vì chỉ dừng ở mức xem tuổi cơ bản.",
  },
  {
    question: "Trang hợp tuổi hiện hỗ trợ phần nào?",
    answer: "Trang hỗ trợ chuẩn bị dữ liệu, xác định câu hỏi và hướng đọc quan hệ theo lá số. Khi cần xem sâu, bạn có thể gửi brief để được hướng dẫn theo trường hợp cụ thể.",
  },
  {
    question: "Nếu cần xem sớm thì nên làm gì?",
    answer: "Bạn nên lập lá số cá nhân trước, ghi rõ câu hỏi và gửi brief liên hệ để được hướng dẫn chọn hướng xem phù hợp.",
  },
];

const contactFaqs = [
  {
    question: "Tôi nên gửi gì khi muốn hỏi theo lá số?",
    answer: "Bạn nên gửi ngày giờ sinh, năm muốn xem, câu hỏi chính và bối cảnh ngắn gọn để phần phản hồi đi đúng trọng tâm hơn.",
  },
  {
    question: "Có thể liên hệ khi chưa có lá số không?",
    answer: "Có, nhưng hiệu quả nhất vẫn là lập lá số miễn phí trước để hai bên nhìn cùng một dữ liệu nền.",
  },
  {
    question: "Nên chọn hỏi 1 câu hay tư vấn trực tiếp?",
    answer: "Nếu bạn đang cần giải một vấn đề rõ ràng, gói hỏi 1 câu thường phù hợp hơn. Nếu cần góc nhìn toàn diện theo giai đoạn, tư vấn trực tiếp sẽ hợp hơn.",
  },
];

const chartReadingSteps = [
  {
    title: "1. Kiểm tra dữ liệu nền",
    description: "Xem lại ngày sinh, loại lịch, giờ sinh và năm đang xem trước khi đọc kết quả.",
  },
  {
    title: "2. Đọc Mệnh, Thân và các cung trọng tâm",
    description: "Bắt đầu từ Mệnh - Thân, sau đó đi vào Quan Lộc, Tài Bạch, Phu Thê hoặc cung đúng với câu hỏi của bạn.",
  },
  {
    title: "3. Đặt vận năm vào toàn cục",
    description: "Dùng thanh chọn năm để xem tiểu vận, rồi đối chiếu với đại vận và các cung liên quan.",
  },
];

const pricingGuides = [
  {
    title: "Chọn gói miễn phí khi",
    description: "Bạn mới muốn xem bố cục lá số, kiểm tra giờ sinh hoặc hiểu các cung cơ bản trước khi hỏi sâu.",
  },
  {
    title: "Chọn gói 1 câu khi",
    description: "Bạn đang phân vân một vấn đề rõ như đổi việc, tài chính, tình cảm, hợp tác hoặc vận hạn của một năm cụ thể.",
  },
  {
    title: "Chọn tư vấn trực tiếp khi",
    description: "Bạn cần nhìn toàn diện nhiều mảng cùng lúc, hoặc muốn trao đổi theo bối cảnh thực tế trong một giai đoạn quan trọng.",
  },
];

const goodQuestionExamples = [
  "Năm 2026 tôi có nên đổi việc hay nên giữ hướng hiện tại?",
  "Giai đoạn này nên ưu tiên tích lũy hay mở rộng kinh doanh?",
  "Mối quan hệ hiện tại cần lưu ý điều gì để bớt lệch nhịp?",
];

const weakQuestionExamples = [
  "Lá số này tốt hay xấu?",
  "Bao giờ tôi giàu?",
  "Nói hết tương lai của tôi.",
];

const compatibilityBriefItems = [
  "Ngày giờ sinh và giới tính của từng người.",
  "Mối quan hệ muốn xem: yêu đương, hôn nhân, hợp tác hay gia đình.",
  "Câu hỏi chính: giao tiếp, tài chính, nhịp sống, mục tiêu dài hạn hoặc thời điểm quyết định.",
  "Bối cảnh ngắn 2-3 dòng để phần đối chiếu không bị quá chung.",
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

type RuntimeChartProfile = {
  fullName?: string;
  gender?: string;
  yinyangGender?: string;
  solarDate?: string;
  lunarDate?: string;
  birthHour?: string;
  ageSymbol?: string;
  ageCycle?: string;
  menhElement?: string;
  cucElement?: string;
  fiveElementsClass?: string;
  menhChu?: string;
  thanChu?: string;
  bodyPalace?: string;
};

const getRuntimeProfile = (chart: ChartView) => chart.profile as unknown as RuntimeChartProfile;

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

const buildCopyableChartJson = (chart: ChartView, input: BirthInput, luuOptions: LuuDisplayOptions) => {
  const payload = buildLuanGiaiPayload(chart, input, luuOptions);
  const profile = payload.profile as unknown as RuntimeChartProfile;

  return {
    profile: {
      fullName: profile.fullName,
      gender: profile.gender,
      yinyangGender: profile.yinyangGender,
      solarDate: profile.solarDate,
      lunarDate: profile.lunarDate,
      birthHour: profile.birthHour,
      ageSymbol: profile.ageSymbol,
      ageCycle: profile.ageCycle,
      menhElement: profile.menhElement,
      cucElement: profile.cucElement,
      fiveElementsClass: profile.fiveElementsClass,
      menhChu: profile.menhChu,
      thanChu: profile.thanChu,
      bodyPalace: profile.bodyPalace,
    },
    input: payload.input,
    luuOptions: payload.luuOptions,
    laiNhanCung: payload.laiNhanCung,
    luuWarnings: payload.luuWarnings,
    palaces: payload.palaces.map((palace) => ({
      name: palace.name,
      branch: palace.branch,
      stem: palace.stem,
      isBodyPalace: palace.isBodyPalace,
      decadalRange: palace.decadalRange,
      ages: palace.ages,
      changsheng12: palace.changsheng12,
      boshi12: palace.boshi12,
      suiqian12: palace.suiqian12,
      jiangqian12: palace.jiangqian12,
      majorStars: palace.majorStars,
      visibleStars: palace.visibleStars,
      goodStars: palace.goodStars,
      badStars: palace.badStars,
      specialMarkers: palace.specialMarkers,
    })),
    focusPalaces: payload.palaces
      .filter((palace) => ["Mệnh", "Phúc Đức", "Quan Lộc", "Tài Bạch", "Phu Thê", "Thiên Di", "Tật Ách"].includes(palace.name))
      .map((palace) => ({
        name: palace.name,
        majorStars: palace.majorStars,
        visibleStars: palace.visibleStars,
        goodStars: palace.goodStars,
        badStars: palace.badStars,
      })),
  };
};

const getPalaceHeadline = (chart: ChartView, palaceName: string) => {
  const palace = chart.palaces.find((item) => item.name === palaceName);

  if (!palace) {
    return "";
  }

  const stars = palace.majorStars.length > 0 ? palace.majorStars : palace.visibleStars.slice(0, 2);
  const starNames = stars
    .slice(0, 2)
    .map((star) => star.display || star.name)
    .filter(Boolean);

  return starNames.length > 0 ? `${palace.name}: ${starNames.join(", ")}` : palace.name;
};

const buildConsultationBrief = (chart: ChartView, input: BirthInput, horoscopeYear: number) => {
  const profile = getRuntimeProfile(chart);
  const highlights = ["Mệnh", "Quan Lộc", "Tài Bạch", "Phu Thê", "Thiên Di"]
    .map((palaceName) => getPalaceHeadline(chart, palaceName))
    .filter(Boolean);

  return [
    "BRIEF LIÊN HỆ LUẬN GIẢI LÁ SỐ",
    `Họ tên: ${profile.fullName || input.fullName || "Chưa cung cấp"}`,
    `Giới tính: ${profile.gender || (input.gender === "male" ? "Nam" : "Nữ")}`,
    `Ngày dương lịch: ${profile.solarDate || `${input.day}/${input.month}/${input.year}`}`,
    `Ngày âm lịch: ${profile.lunarDate || "Đang cập nhật từ lá số"}`,
    `Giờ sinh: ${profile.birthHour || (input.unknownBirthTime ? "Không rõ giờ sinh" : `${input.birthHour}:${input.birthMinute || "00"}`)}`,
    `Năm đang xem: ${horoscopeYear}`,
    `Mệnh chủ: ${profile.menhChu || "Chưa có"}`,
    `Thân chủ: ${profile.thanChu || "Chưa có"}`,
    `Thân cư: ${profile.bodyPalace || "Chưa có"}`,
    `Lai Nhân Cung: ${String(chart.laiNhanCung || "Chưa có")}`,
    "",
    "Các điểm nổi bật để bắt đầu trao đổi:",
    ...highlights.map((item) => `- ${item}`),
    "",
    "Câu hỏi tôi muốn được hỗ trợ:",
    "- Công việc / sự nghiệp:",
    "- Tài chính / dòng tiền:",
    "- Tình cảm / quan hệ:",
    "- Vận hạn năm hiện tại:",
  ].join("\n");
};

const serializeInputToSearch = (input: BirthInput) => {
  const params = new URLSearchParams();

  Object.entries(input).forEach(([key, value]) => {
    params.set(key, String(value));
  });

  return params.toString();
};

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentKnowledgeArticle = findKnowledgeArticleByPath(location.pathname);
  const relatedKnowledgeArticles = currentKnowledgeArticle
    ? knowledgeArticles.filter((article) => article.id !== currentKnowledgeArticle.id).slice(0, 3)
    : [];
  const [activePage, setActivePage] = useState<MainPageId>("home");
  const [birthInput, setBirthInput] = useState<BirthInput>(defaultInput);
  const [submittedInput, setSubmittedInput] = useState<BirthInput | null>(null);
  const [chart, setChart] = useState<ChartView | null>(null);
  const [hasRequestedChart, setHasRequestedChart] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
  const [shareMessage, setShareMessage] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [showReading, setShowReading] = useState(false);
  const [readingResult, setReadingResult] = useState<AIAnalysisResult | null>(null);
  const [readingError, setReadingError] = useState("");
  const [isReadingLoading, setIsReadingLoading] = useState(false);
  const [remainingAiQuota, setRemainingAiQuota] = useState(() => getRemainingAIAnalysisQuota());
  const [isCopyingJson, setIsCopyingJson] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloadingImage, setIsDownloadingImage] = useState(false);
  const [quickReadings, setQuickReadings] = useState<QuickReadingCard[]>([]);
  const [luuOptions, setLuuOptions] = useState<LuuDisplayOptions>(defaultLuuOptions);
  const [horoscopeYear, setHoroscopeYear] = useState(currentYear);
  const [lastSubmittedSignature, setLastSubmittedSignature] = useState<string | null>(null);
  const chartCaptureRef = useRef<HTMLDivElement | null>(null);
  const resultRef = useRef<HTMLElement | null>(null);
  const readingRef = useRef<HTMLDivElement | null>(null);

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
    if (
      location.pathname === "/blog" ||
      location.pathname === "/kien-thuc" ||
      location.pathname === "/bai-viet" ||
      location.pathname.startsWith("/blog/") ||
      location.pathname.startsWith("/kien-thuc/") ||
      location.pathname.startsWith("/bai-viet/")
    ) {
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
    if (location.pathname === "/video" || location.pathname === "/bai-hoc-ngan") {
      setActivePage("video");
      return;
    }
    setActivePage("home");
  }, [location.pathname]);

  useEffect(() => {
    if (!submittedInput) {
      return;
    }

    const normalizedInput = normalizeBirthInput(submittedInput);
    if (!normalizedInput) {
      return;
    }

    let cancelled = false;

    const refreshChart = async () => {
      const { createChart, buildQuickReadings } = await loadChartModules();
      if (cancelled) {
        return;
      }

      const nextChart = createChart(normalizedInput, "tuvichancoCompatible", { luuOptions, horoscopeDate: new Date(horoscopeYear, 5, 15) });
      if (cancelled) {
        return;
      }

      setChart(nextChart);
      setQuickReadings(buildQuickReadings(nextChart));
      setReadingResult(null);
      setReadingError("");
      setShowReading(false);
    };

    refreshChart();

    return () => {
      cancelled = true;
    };
  }, [submittedInput, luuOptions, horoscopeYear]);

  useEffect(() => {
    if (!toastMessage) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setToastMessage("");
    }, 1800);

    return () => window.clearTimeout(timeoutId);
  }, [toastMessage]);

  const showToast = (message: string) => {
    setToastMessage("");
    window.setTimeout(() => {
      setToastMessage(message);
    }, 10);
  };

  const hasDirtyChanges = useMemo(() => {
    if (!lastSubmittedSignature) {
      return false;
    }

    return buildInputSignature(birthInput) !== lastSubmittedSignature;
  }, [birthInput, lastSubmittedSignature]);

  const navigateHomeSection = (section: HomeSectionId) => {
    const route = homeSectionRoutes[section];
    navigate(route);
  };

  const navigateHome = () => {
    navigate("/");
  };

  const resetWorkspace = (targetPath = "/lap-la-so") => {
    setBirthInput(defaultInput);
    setSubmittedInput(null);
    setChart(null);
    setHasRequestedChart(false);
    setFieldErrors({});
    setShareMessage("");
    setToastMessage("");
    setShowReading(false);
    setQuickReadings([]);
    setReadingResult(null);
    setReadingError("");
    setLuuOptions(defaultLuuOptions);
    setRemainingAiQuota(getRemainingAIAnalysisQuota());
    setHoroscopeYear(currentYear);
    setLastSubmittedSignature(null);
    navigate(targetPath, { replace: true });
  };

  const navigateChartForm = () => {
    resetWorkspace("/lap-la-so");
  };

  const navigateContactPage = () => {
    navigate("/lien-he");
  };

  const handleSelectPlan = (plan: PricingPlan) => {
    if (plan.price === "0đ") {
      navigateChartForm();
      return;
    }

    navigateContactPage();
  };

  const getNavLinkClass = (route: string) =>
    `site-nav-link${location.pathname === route || (route !== "/" && location.pathname.startsWith(`${route}/`)) ? " is-active" : ""}`;

  const handleGenerateFromInput = (nextInput: BirthInput) => {
    const errors = validateBirthInput(nextInput);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setShareMessage("");
    setLuuOptions((current) => ({
      ...current,
      showPhiHoaCanCung: true,
    }));
    setIsGenerating(true);
    navigate("/lap-la-so");

    window.setTimeout(async () => {
      const normalizedInput = normalizeBirthInput(nextInput);

      if (!normalizedInput) {
        setFieldErrors({ form: "Không thể lập lá số từ dữ liệu hiện tại. Vui lòng kiểm tra lại thông tin sinh." });
        setIsGenerating(false);
        return;
      }

      const { createChart, buildQuickReadings } = await loadChartModules();
      const nextYear = getHoroscopeYear(nextInput);
      const nextChart = createChart(normalizedInput, "tuvichancoCompatible", { luuOptions, horoscopeDate: new Date(nextYear, 5, 15) });
      setHoroscopeYear(nextYear);
      setSubmittedInput(nextInput);
      setChart(nextChart);
      setQuickReadings(buildQuickReadings(nextChart));
      setHasRequestedChart(true);
      setShowReading(false);
      setReadingResult(null);
      setReadingError("");
      setLastSubmittedSignature(buildInputSignature(nextInput));
      navigate("/lap-la-so", { replace: true });
      setIsGenerating(false);
      showToast("Lập lá số thành công");

      window.requestAnimationFrame(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }, 40);
  };

  const handleGenerateChart = () => {
    handleGenerateFromInput(birthInput);
  };

  const handleCopyChartJson = async () => {
    if (!chart || !submittedInput || isCopyingJson) {
      return;
    }

    setIsCopyingJson(true);

    try {
      const payload = buildCopyableChartJson(chart, submittedInput, luuOptions);
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      showToast("Copy thành công");
    } catch (error) {
      console.error(error);
      setShareMessage("Không thể sao chép JSON lá số trên trình duyệt hiện tại.");
    } finally {
      setIsCopyingJson(false);
    }
  };

  const handleCopyConsultationBrief = async () => {
    if (!chart || !submittedInput) {
      return;
    }

    try {
      await navigator.clipboard.writeText(buildConsultationBrief(chart, submittedInput, horoscopeYear));
      showToast("Đã copy brief liên hệ");
    } catch (error) {
      console.error(error);
      setShareMessage("Không thể sao chép brief liên hệ trên trình duyệt hiện tại.");
    }
  };

  const handleLuanGiai = async () => {
    if (!chart || !submittedInput || isReadingLoading) {
      return;
    }

    if (showReading) {
      setShowReading(false);
      return;
    }

    setShowReading(true);
    const payload = buildAIAnalysisPayload(chart, submittedInput, horoscopeYear, "bac-phai");
    const cacheKey = buildAIAnalysisCacheKey(payload);
    const cachedResult = getCachedAIAnalysis(cacheKey);

    if (cachedResult) {
      setReadingError("");
      setReadingResult(cachedResult);
      return;
    }

    if (!canGenerateNewAIAnalysisToday()) {
      setReadingError("Bạn đã dùng hết 3 lượt tạo luận giải mới hôm nay trên trình duyệt này. Bạn vẫn có thể xem lại kết quả đã cache hoặc thử lại vào ngày mai.");
      setReadingResult(null);
      return;
    }

    setReadingError("");
    setReadingResult(null);
    setIsReadingLoading(true);

    try {
      const data = await generateLuanGiai(payload);
      setReadingResult(data);
      setCachedAIAnalysis(cacheKey, data);
      consumeAIAnalysisQuota();
      setRemainingAiQuota(getRemainingAIAnalysisQuota());
    } catch (error) {
      console.error(error);
      const fallbackResult = buildOfflineAIAnalysis(chart, payload);
      setReadingError("");
      setReadingResult(fallbackResult);
      setCachedAIAnalysis(cacheKey, fallbackResult);
    } finally {
      setIsReadingLoading(false);
    }
  };

  const handleRegenerateLuanGiai = async () => {
    if (!chart || !submittedInput || isReadingLoading) {
      return;
    }

    if (!canGenerateNewAIAnalysisToday()) {
      setReadingError("Bạn đã dùng hết 3 lượt tạo luận giải mới hôm nay trên trình duyệt này. Vui lòng thử lại vào ngày mai.");
      setShowReading(true);
      return;
    }

    setShowReading(true);
    setReadingError("");
    setReadingResult(null);
    setIsReadingLoading(true);

    try {
      const payload = buildAIAnalysisPayload(chart, submittedInput, horoscopeYear, "bac-phai");
      const cacheKey = buildAIAnalysisCacheKey(payload);
      const data = await generateLuanGiai(payload);
      setReadingResult(data);
      setCachedAIAnalysis(cacheKey, data);
      consumeAIAnalysisQuota();
      setRemainingAiQuota(getRemainingAIAnalysisQuota());
    } catch (error) {
      console.error(error);
      const payload = buildAIAnalysisPayload(chart, submittedInput, horoscopeYear, "bac-phai");
      const cacheKey = buildAIAnalysisCacheKey(payload);
      const fallbackResult = buildOfflineAIAnalysis(chart, payload);
      setReadingError("");
      setReadingResult(fallbackResult);
      setCachedAIAnalysis(cacheKey, fallbackResult);
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
    resetWorkspace("/lap-la-so");
  };

  const readingDataJson = chart && submittedInput
    ? JSON.stringify(buildAIAnalysisPayload(chart, submittedInput, horoscopeYear, "bac-phai"), null, 2)
    : "";
  const isReadingDataLimited = chart && submittedInput
    ? hasLimitedBacPhaiData(buildAIAnalysisPayload(chart, submittedInput, horoscopeYear, "bac-phai"))
    : false;

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
    inLanguage: "vi-VN",
  };

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "LaSoTuVi",
    url: siteUrl,
    description: "Nền tảng lập lá số tử vi online và hỗ trợ luận giải theo câu hỏi cụ thể.",
    ...(contactEmail ? { email: contactEmail } : {}),
  };

  const contactPageSchema = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: "Liên hệ luận giải lá số",
    url: `${siteUrl}/lien-he`,
    about: {
      "@type": "Service",
      name: "Hỗ trợ luận giải lá số tử vi",
    },
  };

  const pricingServiceSchemas = primaryPlans
    .filter((plan) => plan.price !== "0đ")
    .map((plan) => ({
      "@context": "https://schema.org",
      "@type": "Service",
      name: plan.name,
      description: plan.description,
      provider: {
        "@type": "Organization",
        name: "LaSoTuVi",
        url: siteUrl,
      },
      offers: {
        "@type": "Offer",
        priceCurrency: "VND",
        price: plan.price.replace(/[^\d]/g, ""),
        availability: "https://schema.org/InStock",
        url: `${siteUrl}/bang-gia`,
      },
    }));

  const compatibilityGuideSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Hướng dẫn xem hợp tuổi theo lá số",
    description: "Trang hướng dẫn chuẩn bị dữ liệu và câu hỏi trước khi dùng công cụ hợp tuổi theo lá số.",
    provider: {
      "@type": "Organization",
      name: "LaSoTuVi",
      url: siteUrl,
    },
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
            "Xem các gói luận giải tử vi: lập lá số miễn phí, hỏi 1 câu theo lá số 50.000đ và tư vấn trực tiếp 999.000đ.",
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
        if (currentKnowledgeArticle) {
          return {
            title: `${currentKnowledgeArticle.title} | Bài viết`,
            description: currentKnowledgeArticle.summary,
            canonicalPath: `/bai-viet/${currentKnowledgeArticle.slug}`,
          };
        }
        return {
          title: "Bài viết",
          description:
            "Những bài đọc nền tảng về Tử Vi Bắc Phái, Tứ Hóa Phi Tinh, can cung, đại vận và lưu niên.",
          canonicalPath: "/bai-viet",
        };
      case "faq":
        return {
          title: "FAQ Lập Lá Số Tử Vi - Giải Đáp Câu Hỏi Thường Gặp",
          description:
            "Giải đáp nhanh các câu hỏi thường gặp khi lập lá số tử vi online, chọn gói luận giải và sử dụng dữ liệu ngày giờ sinh.",
          canonicalPath: "/faq",
        };
      case "hop-tuoi":
        return {
          title: "Hợp Tuổi Theo Lá Số - Chuẩn Bị Dữ Liệu So Khớp Quan Hệ",
          description:
            "Hướng dẫn chuẩn bị dữ liệu hai người, câu hỏi và bối cảnh trước khi so khớp tình cảm, hôn nhân hoặc hợp tác theo lá số.",
          canonicalPath: "/hop-tuoi",
        };
      case "lien-he":
        return {
          title: "Liên Hệ - Nhận Hướng Dẫn Chọn Gói Luận Giải",
          description:
            "Liên hệ để được hướng dẫn chọn gói phù hợp, gửi câu hỏi theo lá số hoặc đặt lịch tư vấn trực tiếp.",
          canonicalPath: "/lien-he",
        };
      case "video":
        return {
          title: "Video Học Tử Vi Bắc Phái",
          description: "Tổng hợp video ngắn về Tử Vi, Bắc Phái, Tứ Hóa Phi Tinh và cách đọc lá số theo hướng dễ tiếp cận.",
          canonicalPath: "/video",
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

  const articleSchema = currentKnowledgeArticle
    ? {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: currentKnowledgeArticle.title,
        description: currentKnowledgeArticle.summary,
        mainEntityOfPage: `${siteUrl}/bai-viet/${currentKnowledgeArticle.slug}`,
        author: {
          "@type": "Organization",
          name: "LaSoTuVi",
        },
        publisher: {
          "@type": "Organization",
          name: "LaSoTuVi",
          logo: {
            "@type": "ImageObject",
            url: `${siteUrl}/favicon.svg`,
          },
        },
      }
    : null;

  const breadcrumbSchema = (items: Array<{ name: string; path: string }>) => ({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${siteUrl}${item.path}`,
    })),
  });

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
            Tạo lá số miễn phí, xem nhanh Mệnh, Thân, 12 cung, đại vận, tiểu vận và biết nên đọc tiếp phần nào theo câu hỏi của bạn.
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
        eyebrow="Luận giải theo nhu cầu"
        title="Bắt đầu miễn phí, sau đó chọn đúng mức hỗ trợ bạn cần"
        description="Bạn có thể xem phần nền trước, rồi chỉ chọn hỏi sâu khi đã có một vấn đề đủ rõ để đối chiếu với lá số."
        compact
        onSelectPlan={handleSelectPlan}
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
        {shareMessage ? <div className="result-status result-status--muted">{shareMessage}</div> : null}
        {toastMessage ? <div className="copy-toast" role="status">{toastMessage}</div> : null}

        {hasRequestedChart && chart ? (
          <div className="chart-tools">
            <LuuStarOptions value={luuOptions} onChange={setLuuOptions} />
            <div className="chart-tools-actions">
              <button type="button" className="debug-button" onClick={handleCopyConsultationBrief} disabled={!chart || !submittedInput}>
                Copy brief
              </button>
              <button type="button" className="debug-button" onClick={handleCopyChartJson} disabled={!chart || !submittedInput || isCopyingJson}>
                {isCopyingJson ? "Đang copy JSON..." : "Copy JSON"}
              </button>
            </div>
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
              isInterpreting={isReadingLoading}
              isReadingOpen={showReading}
              isDownloadingImage={isDownloadingImage}
            />

            {showReading ? (
              <div ref={readingRef}>
                <AIAnalysisPanel
                  result={readingResult}
                  isLoading={isReadingLoading}
                  error={readingError}
                  analysisData={readingDataJson}
                  onRegenerate={handleRegenerateLuanGiai}
                  remainingQuota={remainingAiQuota}
                  hasLimitedBacPhaiData={isReadingDataLimited}
                />
              </div>
            ) : null}

            <div className="result-disclaimer">
              Kết quả chỉ mang tính tham khảo, chiêm nghiệm và giải trí. Không thay thế tư vấn chuyên môn về y tế, tài chính, pháp lý hoặc các quyết định quan trọng.
            </div>

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
        ) : (
          <section className="result-empty-card">
            <p className="eyebrow">Sẵn sàng</p>
            <h2>Lá số sẽ xuất hiện sau khi bạn bấm “Lập lá số ngay”</h2>
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
        schema={[
          organizationSchema,
          faqSchema(pricingFaqs),
          breadcrumbSchema([{ name: "Trang chủ", path: "/" }, { name: "Bảng giá", path: "/bang-gia" }]),
          ...pricingServiceSchemas,
        ]}
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
        description="Mỗi gói đi theo một mức nhu cầu khác nhau: xem nền, hỏi một vấn đề cụ thể, hoặc trao đổi sâu theo giai đoạn."
        onSelectPlan={handleSelectPlan}
      />
      <section className="content-section">
        <div className="section-heading">
          <p className="eyebrow">Chọn đúng gói</p>
          <h2>Chọn theo tình huống hiện tại của bạn</h2>
        </div>
        <div className="seo-copy-grid">
          {pricingGuides.map((guide) => (
            <article key={guide.title} className="seo-copy-card">
              <h3>{guide.title}</h3>
              <p>{guide.description}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="content-section">
        <div className="section-heading">
          <p className="eyebrow">Đặt câu hỏi</p>
          <h2>Một câu hỏi rõ giúp phần luận giải đi đúng trọng tâm</h2>
          <p>Gói 1 câu hiệu quả nhất khi bạn mô tả vấn đề cụ thể, có thời gian hoặc bối cảnh đi kèm.</p>
        </div>
        <div className="seo-copy-grid">
          <article className="seo-copy-card">
            <h3>Câu hỏi nên gửi</h3>
            <ul className="plan-feature-list">
              {goodQuestionExamples.map((question) => (
                <li key={question}>{question}</li>
              ))}
            </ul>
          </article>
          <article className="seo-copy-card">
            <h3>Câu hỏi nên tránh</h3>
            <ul className="plan-feature-list">
              {weakQuestionExamples.map((question) => (
                <li key={question}>{question}</li>
              ))}
            </ul>
          </article>
          <article className="seo-copy-card">
            <h3>Sau khi thanh toán</h3>
            <p>Bạn gửi lá số hoặc brief liên hệ, nêu câu hỏi chính và nhận hướng dẫn theo đúng gói đã chọn. Nếu thiếu giờ sinh, phần phản hồi sẽ nói rõ giới hạn cần đọc dè dặt.</p>
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
        schema={[
          organizationSchema,
          breadcrumbSchema([{ name: "Trang chủ", path: "/" }, { name: "Bài viết", path: "/bai-viet" }]),
        ]}
      />
      <BacPhaiLibraryPage articles={knowledgeArticles} />
    </div>
  );

  const blogArticlePage = currentKnowledgeArticle ? (
    <div className="home-page">
      <SEOHead
        title={pageSeo.title}
        description={pageSeo.description}
        canonicalPath={pageSeo.canonicalPath}
        schema={[
          organizationSchema,
          articleSchema!,
          breadcrumbSchema([
            { name: "Trang chủ", path: "/" },
            { name: "Bài viết", path: "/bai-viet" },
            { name: currentKnowledgeArticle.title, path: `/bai-viet/${currentKnowledgeArticle.slug}` },
          ]),
        ]}
      />
      <BacPhaiArticlePage article={currentKnowledgeArticle} relatedArticles={relatedKnowledgeArticles} />
    </div>
  ) : null;

  const faqPage = (
    <div className="home-page">
      <SEOHead
        title={pageSeo.title}
        description={pageSeo.description}
        canonicalPath="/faq"
        schema={[
          faqSchema(homeFaqs),
          breadcrumbSchema([{ name: "Trang chủ", path: "/" }, { name: "FAQ", path: "/faq" }]),
        ]}
      />
      <FAQSection
        faqs={homeFaqs}
        eyebrow="FAQ"
        title="Câu hỏi thường gặp khi lập lá số"
        description="Tập hợp các thắc mắc phổ biến nhất trước khi tạo lá số hoặc chọn gói hỗ trợ."
      />
    </div>
  );

  const compatPage = (
    <div className="home-page">
      <SEOHead
        title={pageSeo.title}
        description={pageSeo.description}
        canonicalPath="/hop-tuoi"
        schema={[
          organizationSchema,
          compatibilityGuideSchema,
          faqSchema(compatFaqs),
          breadcrumbSchema([{ name: "Trang chủ", path: "/" }, { name: "Hợp tuổi", path: "/hop-tuoi" }]),
        ]}
      />
      <section className="content-section">
        <div className="section-heading">
          <p className="eyebrow">Hợp tuổi</p>
          <h1>So khớp quan hệ theo lá số</h1>
          <p>Chuẩn bị dữ liệu cho hai người và xác định câu hỏi chính trước khi đối chiếu: tình cảm, hôn nhân, hợp tác, tài chính hay nhịp sống.</p>
        </div>
        <div className="seo-copy-grid">
          <article className="seo-copy-card">
            <h3>Dữ liệu nên có trước</h3>
            <p>Nên có ngày sinh, giờ sinh và năm muốn xem của từng người. Nếu thiếu giờ sinh, bạn vẫn có thể bắt đầu ở mức tổng quan nhưng phần đối chiếu chi tiết sẽ bị giới hạn.</p>
          </article>
          <article className="seo-copy-card">
            <h3>Nên dùng cho câu hỏi nào?</h3>
            <p>Phù hợp khi bạn muốn xem mức độ hòa hợp trong giao tiếp, nhịp sống, công việc, tài chính hoặc định hướng mối quan hệ dựa trên dữ liệu lá số thay vì chỉ xem tuổi nhanh.</p>
          </article>
          <article className="seo-copy-card">
            <h3>Nên đọc theo hướng nào?</h3>
            <p>Đọc hợp tuổi như một bản đối chiếu xu hướng và điểm cần trao đổi, không nên dùng như một kết luận tuyệt đối về việc nên hay không nên gắn bó.</p>
          </article>
        </div>
        <div className="contact-brief-card">
          <div className="contact-brief-head">
            <div>
              <p className="eyebrow">Brief hợp tuổi</p>
              <h2>Thông tin nên chuẩn bị trước khi so khớp</h2>
              <p className="result-note">Một brief rõ giúp phần đối chiếu bám đúng mối quan hệ thật, thay vì chỉ dừng ở tuổi năm sinh.</p>
            </div>
          </div>
          <div className="seo-copy-card">
            <ul className="plan-feature-list">
              {compatibilityBriefItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
        <div className="placeholder-card">
          <h2>Bạn có thể chuẩn bị dữ liệu từ bây giờ</h2>
          <p>Lập lá số của mình trước, sau đó ghi rõ trường hợp muốn đối chiếu hoặc copy brief liên hệ. Cách này giúp việc so khớp sau đó đi nhanh hơn và ít mơ hồ hơn.</p>
          <div className="home-hero-actions">
            <button type="button" className="primary-button" onClick={navigateChartForm}>Lập lá số miễn phí</button>
            <button type="button" className="ghost-button" onClick={() => navigate("/lien-he")}>Chuẩn bị brief liên hệ</button>
          </div>
        </div>
        <FAQSection
          faqs={compatFaqs}
          eyebrow="FAQ hợp tuổi"
          title="Câu hỏi thường gặp về hợp tuổi theo lá số"
          description="Những điều nên biết trước khi dùng công cụ so khớp khi tính năng được mở đầy đủ."
        />
      </section>
    </div>
  );

  const contactPage = (
    <div className="home-page">
      <SEOHead
        title={pageSeo.title}
        description={pageSeo.description}
        canonicalPath="/lien-he"
        schema={[
          organizationSchema,
          contactPageSchema,
          faqSchema(contactFaqs),
          ...pricingServiceSchemas,
          breadcrumbSchema([{ name: "Trang chủ", path: "/" }, { name: "Liên hệ", path: "/lien-he" }]),
        ]}
      />
      <section className="content-section">
        <div className="section-heading">
          <p className="eyebrow">Liên hệ</p>
          <h1>Nhận hướng dẫn chọn gói và gửi câu hỏi theo lá số</h1>
          <p>Trang này dành cho người đã có lá số và muốn được hướng dẫn bước tiếp theo: hỏi 1 câu, đặt lịch tư vấn hoặc chuẩn bị thông tin trước khi trao đổi.</p>
        </div>
        <div className="seo-copy-grid">
          <article className="seo-copy-card">
            <h3>Khi nào nên liên hệ?</h3>
            <p>Khi bạn đã xem lá số cơ bản nhưng cần hỏi sâu hơn về công việc, tài lộc, tình duyên hoặc vận hạn của năm đang xem.</p>
          </article>
          <article className="seo-copy-card">
            <h3>Nên chuẩn bị gì?</h3>
            <p>Chuẩn bị ngày giờ sinh, năm muốn xem và câu hỏi chính bạn đang quan tâm. Càng cụ thể, phần phản hồi sau đó càng dễ đi đúng trọng tâm.</p>
          </article>
          <article className="seo-copy-card">
            <h3>Bắt đầu nhanh</h3>
            <p>Nếu chưa có lá số, hãy lập lá số miễn phí trước. Nếu đã có lá số, bạn có thể đi thẳng sang bảng giá để chọn mức hỗ trợ phù hợp.</p>
          </article>
        </div>
        <div className="contact-brief-card">
          <div className="contact-brief-head">
            <div>
              <p className="eyebrow">Mẫu nội dung</p>
              <h2>Gửi đủ thông tin để được hỗ trợ nhanh hơn</h2>
              <p className="result-note">Bạn có thể dùng cấu trúc này khi nhắn Zalo, Facebook hoặc email.</p>
            </div>
          </div>
          <div className="seo-copy-card">
            <p>
              Họ tên hoặc biệt danh: ...<br />
              Ngày giờ sinh: ...<br />
              Giới tính: ...<br />
              Năm muốn xem: ...<br />
              Câu hỏi chính: ...<br />
              Bối cảnh ngắn: ...
            </p>
          </div>
        </div>
        {chart && submittedInput ? (
          <div className="contact-brief-card">
            <div className="contact-brief-head">
              <div>
                <p className="eyebrow">Đã có lá số</p>
                <h2>Brief liên hệ của bạn đã sẵn sàng</h2>
                <p className="result-note">Hệ thống có thể gom các thông tin nền quan trọng của lá số hiện tại để bạn gửi nhanh qua Zalo, Facebook hoặc email.</p>
              </div>
              <div className="premium-upsell-actions">
                <button type="button" className="primary-button" onClick={handleCopyConsultationBrief}>Copy brief liên hệ</button>
                <button type="button" className="ghost-button" onClick={handleCopyChartJson}>Copy JSON lá số</button>
              </div>
            </div>
            <div className="contact-brief-grid">
              <div className="seo-copy-card">
                <h3>Thông tin hiện tại</h3>
                <div className="inline-pills">
                  <span className="inline-pill">{getRuntimeProfile(chart).fullName || submittedInput.fullName}</span>
                  <span className="inline-pill">{getRuntimeProfile(chart).gender || (submittedInput.gender === "male" ? "Nam" : "Nữ")}</span>
                  <span className="inline-pill">Năm xem {horoscopeYear}</span>
                  <span className="inline-pill">Thân cư {getRuntimeProfile(chart).bodyPalace || "đang cập nhật"}</span>
                </div>
              </div>
              <div className="seo-copy-card">
                <h3>Gợi ý nội dung nên gửi</h3>
                <p>Nêu rõ một vấn đề chính, ví dụ đổi việc, mở rộng kinh doanh, quản lý tài chính, mối quan hệ hoặc vận hạn năm đang xem. Một câu hỏi rõ thường cho phản hồi tốt hơn một yêu cầu quá rộng.</p>
              </div>
            </div>
          </div>
        ) : null}
        <div className="seo-copy-grid contact-channel-grid">
          <article className="seo-copy-card contact-channel-card">
            <h3>Xem bảng giá trước</h3>
            <p>Phù hợp nếu bạn muốn so sánh nhanh các mức hỗ trợ trước khi gửi câu hỏi.</p>
            <button type="button" className="ghost-button" onClick={() => navigate("/bang-gia")}>Mở bảng giá</button>
          </article>
          <article className="seo-copy-card contact-channel-card">
            <h3>Nhắn Zalo</h3>
            <p>Kênh nhanh để gửi brief đã copy và nhận hướng dẫn bước tiếp theo.</p>
            <a className="ghost-button contact-channel-link" href={contactZaloUrl} target="_blank" rel="noreferrer">Mở Zalo</a>
          </article>
          <article className="seo-copy-card contact-channel-card">
            <h3>Nhắn Facebook</h3>
            <p>Phù hợp nếu bạn đã quen trao đổi qua fanpage hoặc Messenger.</p>
            <a className="ghost-button contact-channel-link" href={contactFacebookUrl} target="_blank" rel="noreferrer">Mở Facebook</a>
          </article>
          {contactEmail ? (
            <article className="seo-copy-card contact-channel-card">
              <h3>Gửi email</h3>
              <p>Dùng khi bạn muốn mô tả kỹ bối cảnh và lưu lại toàn bộ trao đổi bằng văn bản.</p>
              <a className="ghost-button contact-channel-link" href={`mailto:${contactEmail}`}>Gửi email</a>
            </article>
          ) : null}
          {contactSmsNumber ? (
            <article className="seo-copy-card contact-channel-card">
              <h3>Nhắn SMS</h3>
              <p>Tuỳ chọn tối giản để gửi lời nhắn ngắn hoặc xin hướng dẫn kênh trao đổi phù hợp hơn.</p>
              <a className="ghost-button contact-channel-link" href={`sms:${contactSmsNumber}`}>Mở SMS</a>
            </article>
          ) : null}
        </div>
        <div className="placeholder-card">
          <h2>Bạn muốn đi theo hướng nào?</h2>
          <p>Chọn bước phù hợp với tình huống hiện tại để tiếp tục hành trình một cách rõ ràng hơn.</p>
          <div className="home-hero-actions">
            <button type="button" className="primary-button" onClick={() => navigate("/bang-gia")}>Xem bảng giá</button>
            <button type="button" className="ghost-button" onClick={navigateChartForm}>Lập lá số miễn phí</button>
          </div>
        </div>
        <FAQSection
          faqs={contactFaqs}
          eyebrow="FAQ liên hệ"
          title="Cách liên hệ để nhận hỗ trợ nhanh hơn"
          description="Các câu hỏi phổ biến khi gửi lá số và chọn hình thức tư vấn."
        />
      </section>
    </div>
  );

  const videoLessonsPage = (
    <>
      <SEOHead
        title={pageSeo.title}
        description={pageSeo.description}
        canonicalPath="/video"
        schema={[
          organizationSchema,
          breadcrumbSchema([{ name: "Trang chủ", path: "/" }, { name: "Video", path: "/video" }]),
        ]}
      />
      <VideoLessonsPage />
    </>
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
            <button type="button" className={getNavLinkClass("/bai-viet")} onClick={() => navigateHomeSection("kien-thuc")}>
              Bài viết
            </button>
            <button type="button" className={getNavLinkClass("/video")} onClick={() => navigate("/video")}>
              Video
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
                  ? (currentKnowledgeArticle ? blogArticlePage : blogPage)
                  : activePage === "hop-tuoi"
                    ? compatPage
                    : activePage === "lien-he"
                      ? contactPage
                      : activePage === "video"
                        ? videoLessonsPage
                        : faqPage}
      </main>

      <FloatingContactLinks />
      <SocialProofPopup />
      <SiteFooter />
    </div>
  );
}

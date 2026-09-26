/**
 * App utilities and constants
 */

import type { BirthInput, ChartView, PalaceView, StarView } from "../lib/types";
import lapLaSoContent from "../content/lapLaSoContent.json";

// ============ CONSTANTS ============

export const siteUrl = "https://tuviphonglam.com";
export const contactEmail = import.meta.env.VITE_CONTACT_EMAIL?.trim() || "";
export const contactSmsNumber = import.meta.env.VITE_CONTACT_SMS_NUMBER?.trim() || "";
export const contactZaloUrl = import.meta.env.VITE_CONTACT_ZALO_URL?.trim() || "https://zalo.me/";
export const contactFacebookUrl = import.meta.env.VITE_CONTACT_FACEBOOK_URL?.trim() || "https://www.facebook.com/";

// ============ FAQ DATA ============

export const homeFaqs = [
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

export const pricingFaqs = [
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

export const compatFaqs = [
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

export const contactFaqs = [
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

// ============ GUIDE DATA ============

export const chartReadingSteps = [
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

// Nội dung tĩnh trang /lap-la-so dùng chung với scripts/prerender-pages.mjs (HTML tĩnh cho crawler).
// Sửa nội dung tại src/content/lapLaSoContent.json để React và bản prerender luôn khớp nhau.
// knowledgeHubItems: `path` chỉ gán khi bài viết CÓ THẬT (xem src/content/bacPhaiLibrary.ts); null = "Sắp ra mắt".
export const { twelvePalaces, laSoOverviewCards, knowledgeHubItems, lapLaSoFaqs } = lapLaSoContent;

export const pricingGuides = [
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

export const goodQuestionExamples = [
  "Năm 2026 tôi có nên đổi việc hay nên giữ hướng hiện tại?",
  "Giai đoạn này nên ưu tiên tích lũy hay mở rộng kinh doanh?",
  "Mối quan hệ hiện tại cần lưu ý điều gì để bớt lệch nhịp?",
];

export const weakQuestionExamples = [
  "Lá số này tốt hay xấu?",
  "Bao giờ tôi giàu?",
  "Nói hết tương lai của tôi.",
];

export const compatibilityBriefItems = [
  "Ngày giờ sinh và giới tính của từng người.",
  "Mối quan hệ muốn xem: yêu đương, hôn nhân, hợp tác hay gia đình.",
  "Câu hỏi chính: giao tiếp, tài chính, nhịp sống, mục tiêu dài hạn hoặc thời điểm quyết định.",
  "Bối cảnh ngắn 2-3 dòng để phần đối chiếu không bị quá chung.",
];

// ============ CHART HELPERS ============

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

export const getRuntimeProfile = (chart: ChartView) => chart.profile as unknown as RuntimeChartProfile;

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

export const buildCopyableChartJson = (chart: ChartView, input: any, luuOptions: any) => {
  const profile = getRuntimeProfile(chart);

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
    input,
    luuOptions,
    laiNhanCung: chart.laiNhanCung,
    luuWarnings: chart.luuWarnings,
    palaces: chart.palaces.map(simplifyPalace),
    focusPalaces: chart.palaces
      .filter((palace) => ["Mệnh", "Phúc Đức", "Quan Lộc", "Tài Bạch", "Phu Thê", "Thiên Di", "Tật Ách"].includes(palace.name))
      .map((palace) => ({
        name: palace.name,
        majorStars: palace.majorStars.map(simplifyStar),
        visibleStars: palace.visibleStars.map(simplifyStar),
        goodStars: palace.goodStars.map(simplifyStar),
        badStars: palace.badStars.map(simplifyStar),
      })),
  };
};

const getPalaceHeadline = (chart: ChartView, palaceName: string) => {
  const palace = chart.palaces.find((item) => item.name === palaceName);
  if (!palace) return "";

  const stars = palace.majorStars.length > 0 ? palace.majorStars : palace.visibleStars.slice(0, 2);
  const starNames = stars.slice(0, 2).map((star) => star.display || star.name).filter(Boolean);

  return starNames.length > 0 ? `${palace.name}: ${starNames.join(", ")}` : palace.name;
};

export const buildConsultationBrief = (chart: ChartView, input: any, horoscopeYear: number) => {
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

// Field nào KHÔNG được đưa vào link chia sẻ khi "Ẩn thông tin cá nhân" đang bật -
// tránh việc bật toggle ẩn trên giao diện nhưng link copy ra vẫn lộ họ tên thật.
const PERSONAL_FIELDS: Array<keyof BirthInput> = ["fullName"];

export const serializeInputToSearch = (input: BirthInput) => {
  const params = new URLSearchParams();
  const shouldHidePersonal = Boolean(input.hidePersonalInfo);
  Object.entries(input).forEach(([key, value]) => {
    if (shouldHidePersonal && PERSONAL_FIELDS.includes(key as keyof BirthInput)) return;
    params.set(key, String(value));
  });
  return params.toString();
};

const BIRTH_INPUT_STRING_FIELDS = [
  "fullName",
  "year",
  "month",
  "day",
  "birthHour",
  "birthMinute",
  "horoscopeYear",
] as const satisfies ReadonlyArray<keyof BirthInput>;

// Đọc lại 1 lá số đã chia sẻ qua "Copy link" (serializeInputToSearch ở trên).
// Trả về null nếu query string không chứa đủ dữ liệu sinh tối thiểu (year/month/day),
// để tránh cố generate 1 lá số rỗng/không hợp lệ khi người dùng chỉ mở link gốc không có query.
export const deserializeInputFromSearch = (search: string, defaults: BirthInput): BirthInput | null => {
  const params = new URLSearchParams(search);
  if (!params.get("year") || !params.get("month") || !params.get("day")) return null;

  const result: BirthInput = { ...defaults };
  for (const field of BIRTH_INPUT_STRING_FIELDS) {
    const value = params.get(field);
    if (value != null) result[field] = value;
  }

  const gender = params.get("gender");
  if (gender === "male" || gender === "female") result.gender = gender;

  const calendarType = params.get("calendarType");
  if (calendarType === "solar" || calendarType === "lunar") result.calendarType = calendarType;

  result.unknownBirthTime = params.get("unknownBirthTime") === "true";
  result.hidePersonalInfo = params.get("hidePersonalInfo") === "true";

  return result;
};

// ============ IMAGE EXPORT ============

export const downloadBlob = (blob: Blob, fileName: string) => {
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

export const openBlobInNewTab = (blob: Blob) => {
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener,noreferrer");
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
};

export const isMobileViewport = () => window.matchMedia("(max-width: 760px)").matches;

export const clampScore = (value: number) => Math.max(35, Math.min(95, Math.round(value)));

export const calculatePalaceScore = (chart: ChartView | null, palaceNames: string[]) => {
  if (!chart) return 50;

  const palace = chart.palaces.find((item) => palaceNames.includes(item.name));
  if (!palace) return 50;

  const goodStars = palace.goodStars?.length ?? 0;
  const badStars = palace.badStars?.length ?? 0;
  const majorStars = palace.majorStars?.length ?? 0;

  return clampScore(58 + goodStars * 7 - badStars * 5 + majorStars * 2);
};

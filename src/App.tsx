import React, { useEffect, useMemo, useRef, useState } from "react";
import { toBlob, toJpeg } from "html-to-image";
import { useLocation, useNavigate } from "react-router-dom";
import AIAnalysisPanel from "./components/AIAnalysisPanel";
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

const compatFaqs = [
  {
    question: "Xem hợp tuổi có cần lập lá số trước không?",
    answer: "Nên có lá số trước để việc đối chiếu đi theo đúng dữ liệu cá nhân thay vì chỉ dừng ở mức xem tuổi cơ bản.",
  },
  {
    question: "Hợp tuổi trên trang này đã mở chính thức chưa?",
    answer: "Phần engine so khớp đầy đủ vẫn đang được hoàn thiện. Hiện tại trang tập trung vào hướng dẫn, nội dung nền và luồng chuẩn bị dữ liệu.",
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

const blogPosts = [
  {
    slug: "/blog/menh-va-than-trong-tu-vi-la-gi",
    title: "Mệnh và Thân trong tử vi là gì?",
    description: "Hiểu vai trò của Mệnh và Thân để đọc lá số dễ hơn và biết nên bắt đầu từ đâu.",
    content: [
      "Mệnh và Thân là hai điểm nền rất thường được người mới chú ý đầu tiên khi xem lá số. Mệnh nghiêng về khí chất, cách vận hành và nền tính cách, còn Thân thường được dùng để quan sát nơi năng lượng của người đó dễ dồn nhiều vào hơn theo thời gian.",
      "Khi đọc thực tế, không nên tách Mệnh và Thân thành hai phần đối lập hoàn toàn. Cách an cung, bố cục sao, đối cung và tam hợp mới là lớp giúp người xem hiểu hai điểm này liên hệ với nhau như thế nào.",
      "Nếu bạn mới bắt đầu, hãy xem Mệnh, Thân và các cung liên quan trước, sau đó mới mở rộng sang Quan Lộc, Tài Bạch, Phu Thê hay lớp vận hạn của năm đang xem.",
    ],
  },
  {
    slug: "/blog/dai-van-va-tieu-van-la-gi",
    title: "Đại vận và tiểu vận là gì?",
    description: "Phân biệt hai lớp vận trình quan trọng để theo dõi từng giai đoạn cuộc sống rõ ràng hơn.",
    content: [
      "Đại vận giúp người xem nhìn một giai đoạn dài hơn trong hành trình phát triển, còn tiểu vận cho thấy điểm nhấn của từng năm cụ thể trong cùng giai đoạn đó.",
      "Khi xem lá số online, hai lớp này nên được đọc cùng nhau. Đại vận cho biết bối cảnh dài hơi, còn tiểu vận giúp xác định năm nào cần chủ động hơn về công việc, tài chính hoặc các quyết định cá nhân.",
      "Việc hiểu đúng đại vận và tiểu vận giúp người dùng tránh kỳ vọng rằng một năm đơn lẻ có thể nói hết mọi thứ. Đây là cách tiếp cận cân bằng và thực tế hơn khi đọc vận trình.",
    ],
  },
  {
    slug: "/blog/cung-quan-loc-noi-gi-ve-su-nghiep",
    title: "Cung Quan Lộc nói gì về sự nghiệp?",
    description: "Khám phá cách cung Quan Lộc phản ánh hướng phát triển nghề nghiệp và cơ hội thăng tiến.",
    content: [
      "Cung Quan Lộc thường được xem như một đầu mối quan trọng khi đọc câu chuyện nghề nghiệp, vị trí công việc, cách phát triển chuyên môn và mức độ phù hợp với môi trường làm việc.",
      "Tuy vậy, chỉ nhìn riêng Quan Lộc là chưa đủ. Nên đọc cùng Mệnh, Thiên Di và Tài Bạch để thấy vừa năng lực nội tại, vừa hoàn cảnh vận động bên ngoài và khả năng chuyển hóa thành kết quả thực tế.",
      "Cách dùng phù hợp nhất là xem Quan Lộc như một trục định hướng, sau đó đối chiếu với thời điểm năm xem và các cung liên quan trước khi đưa ra quyết định lớn.",
    ],
  },
  {
    slug: "/blog/cung-tai-bach-noi-gi-ve-tai-loc",
    title: "Cung Tài Bạch nói gì về tài lộc?",
    description: "Tìm hiểu cách xem xu hướng tiền bạc, tích lũy và các điểm cần thận trọng trong tài chính.",
    content: [
      "Cung Tài Bạch giúp người xem có một góc nhìn về cách tiền bạc vận động, khả năng tích lũy, cách tiếp cận nguồn thu và những điểm cần theo dõi kỹ hơn trong tài chính.",
      "Đây không phải là công cụ để kết luận thu nhập theo kiểu cố định. Thực tế vẫn cần đọc cùng Mệnh, Quan Lộc và vận hạn năm xem để hiểu tiền đến từ đâu, giữ được ra sao và áp lực tài chính nằm ở điểm nào.",
      "Khi dùng trong môi trường online, Tài Bạch phù hợp nhất để giúp người dùng đặt câu hỏi rõ hơn về dòng tiền, kế hoạch và thời điểm nên thận trọng.",
    ],
  },
  {
    slug: "/blog/khong-nho-gio-sinh-co-lap-la-so-duoc-khong",
    title: "Không nhớ giờ sinh có lập lá số tử vi được không?",
    description: "Xem trường hợp chưa rõ giờ sinh nên hiểu kết quả như thế nào và cách giảm sai lệch khi đọc lá số.",
    content: [
      "Bạn vẫn có thể lập lá số khi chưa chắc giờ sinh, nhưng nên hiểu đây là bản xem tham khảo thay vì bản đọc chi tiết sâu.",
      "Giờ sinh ảnh hưởng đến cách an cung và vị trí một số sao, vì vậy thiếu dữ liệu này có thể làm thay đổi cách đọc Mệnh, Thân hoặc các cung quan trọng khác.",
      "Cách tiếp cận hợp lý là dùng bản tham khảo để nhìn tổng quan trước, sau đó thu hẹp câu hỏi và bổ sung dữ liệu nếu bạn cần đi sâu hơn vào quyết định quan trọng.",
    ],
  },
  {
    slug: "/blog/cung-phu-the-noi-gi-ve-tinh-duyen",
    title: "Cung Phu Thê nói gì về tình duyên?",
    description: "Hiểu vai trò của cung Phu Thê khi xem xu hướng gắn kết, hôn nhân và cách xây dựng mối quan hệ.",
    content: [
      "Cung Phu Thê thường được dùng để đọc xu hướng gắn kết, cách bước vào quan hệ và kiểu tương tác dễ lặp lại trong chuyện tình cảm.",
      "Tuy nhiên, không nên xem đây là nơi đưa ra kết luận cứng về hôn nhân. Cần đối chiếu thêm với Mệnh, Phúc Đức, Thiên Di và các lớp vận hạn theo năm để có góc nhìn cân bằng hơn.",
      "Trên sản phẩm online, cung Phu Thê phù hợp để giúp người dùng nhận diện chủ đề quan hệ của mình, từ đó hỏi sâu hơn nếu có một vấn đề thực tế đang cần làm rõ.",
    ],
  },
  {
    slug: "/blog/cach-xac-dinh-gio-sinh-trong-tu-vi",
    title: "Cách xác định giờ sinh trong tử vi",
    description: "Một vài gợi ý thực tế để đối chiếu thông tin và giảm sai lệch khi bạn chưa chắc giờ sinh của mình.",
    content: [
      "Khi chưa chắc giờ sinh, bạn có thể đối chiếu từ giấy tờ cũ, hỏi lại người thân hoặc dùng các mốc sự kiện đời sống để thu hẹp khoảng thời gian hợp lý.",
      "Đây không phải là cách thay thế hoàn toàn dữ liệu gốc, nhưng có thể giúp bạn giảm sai lệch ban đầu trước khi lập lá số hoặc đi vào phần đọc sâu hơn.",
      "Nếu vẫn chưa xác định được, nên dùng bản xem tổng quan và tránh đặt kỳ vọng quá cao vào các kết luận rất chi tiết theo từng cung hay từng năm.",
    ],
  },
  {
    slug: "/blog/la-so-tu-vi-gom-nhung-phan-nao",
    title: "Lá số tử vi gồm những phần nào?",
    description: "Tìm hiểu các phần nền tảng như Mệnh, Thân, 12 cung, chính tinh, phụ tinh, đại vận và tiểu vận.",
    content: [
      "Một lá số tử vi thường gồm phần nền như Mệnh, Thân, 12 cung, các chính tinh, phụ tinh, đại vận và tiểu vận theo năm đang xem.",
      "Với người mới, không cần đọc tất cả cùng lúc. Cách tiếp cận hiệu quả hơn là nhìn bố cục tổng thể trước, sau đó đi vào từng nhóm nội dung theo mục tiêu như sự nghiệp, tài lộc hay tình duyên.",
      "Giao diện online nên làm tốt vai trò trực quan hóa phần nền này, để người dùng hiểu mình đang nhìn gì trước khi nhận luận giải sâu hơn.",
    ],
  },
  {
    slug: "/blog/chinh-tinh-va-phu-tinh-la-gi",
    title: "Chính tinh và phụ tinh là gì?",
    description: "Phân biệt hai nhóm sao thường gặp khi bắt đầu đọc lá số tử vi và cách hiểu vai trò của chúng.",
    content: [
      "Chính tinh thường là nhóm sao nền có vai trò lớn trong việc định hình cách đọc một cung, còn phụ tinh giúp bổ sung sắc thái, điều chỉnh hoặc làm rõ cách chủ đề đó biểu hiện ra ngoài.",
      "Người mới thường bị ngợp vì số lượng sao trên lá số. Cách tốt hơn là nhìn chính tinh trước, sau đó mới dùng phụ tinh như lớp chi tiết để hiểu sâu hơn về cùng một chủ đề.",
      "Trong sản phẩm số, phần hiển thị sao nên ưu tiên sự rõ ràng, tránh biến lá số thành một khối chữ dày khiến người dùng khó tiếp cận.",
    ],
  },
  {
    slug: "/blog/xem-van-han-nam-2026-theo-la-so-tu-vi",
    title: "Xem vận hạn năm 2026 theo lá số tử vi",
    description: "Cách tiếp cận năm đang xem trong lá số để nhận diện những giai đoạn cần chủ động hơn về công việc và tài chính.",
    content: [
      "Khi xem vận hạn theo năm, điều quan trọng là đặt năm đang xem trong bối cảnh toàn lá số thay vì chỉ nhìn một chỉ báo đơn lẻ.",
      "Năm 2026 nên được đọc cùng tiểu vận, cung được kích hoạt, các lớp sao lưu và câu hỏi thực tế mà người dùng đang quan tâm, như công việc, tài chính hay mối quan hệ.",
      "Cách dùng phù hợp là xem năm như một điểm cần chủ động hơn ở một số chủ đề, thay vì coi đó là kết luận cứng cho toàn bộ trải nghiệm của năm.",
    ],
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
  const currentBlogPost = blogPosts.find((post) => post.slug === location.pathname) ?? null;
  const relatedBlogPosts = currentBlogPost
    ? blogPosts.filter((post) => post.slug !== currentBlogPost.slug).slice(0, 3)
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
    if (location.pathname === "/blog" || location.pathname === "/kien-thuc" || location.pathname.startsWith("/blog/")) {
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

  const getNavLinkClass = (route: string) => `site-nav-link${location.pathname === route ? " is-active" : ""}`;

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
      const message = error instanceof Error ? error.message : "Không thể luận giải lá số lúc này. Vui lòng thử lại sau.";
      if (message.includes("User location is not supported") || message.includes("Khu vực máy chủ hiện tại chưa được dịch vụ AI hỗ trợ")) {
        const fallbackResult = buildOfflineAIAnalysis(chart, payload);
        setReadingError("");
        setReadingResult(fallbackResult);
        setCachedAIAnalysis(cacheKey, fallbackResult);
      } else {
        setReadingError(message);
      }
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
      const message = error instanceof Error ? error.message : "Không thể tạo lại luận giải lúc này. Vui lòng thử lại sau.";
      const payload = buildAIAnalysisPayload(chart, submittedInput, horoscopeYear, "bac-phai");
      const cacheKey = buildAIAnalysisCacheKey(payload);
      if (message.includes("User location is not supported") || message.includes("Khu vực máy chủ hiện tại chưa được dịch vụ AI hỗ trợ")) {
        const fallbackResult = buildOfflineAIAnalysis(chart, payload);
        setReadingError("");
        setReadingResult(fallbackResult);
        setCachedAIAnalysis(cacheKey, fallbackResult);
      } else {
        setReadingError(message);
      }
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
        if (currentBlogPost) {
          return {
            title: `${currentBlogPost.title} | Blog Tử Vi`,
            description: currentBlogPost.description,
            canonicalPath: currentBlogPost.slug,
          };
        }
        return {
          title: "Blog Tử Vi - Kiến Thức Lá Số, Đại Vận, Tiểu Vận",
          description:
            "Khám phá các bài viết cơ bản về lá số tử vi, Mệnh, Thân, đại vận, tiểu vận, cung Quan Lộc và cung Tài Bạch.",
          canonicalPath: "/blog",
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
          title: "Hợp Tuổi - Nội Dung Đang Hoàn Thiện",
          description:
            "Trang hợp tuổi đang được hoàn thiện để cung cấp trải nghiệm rõ ràng và nhất quán với hệ thống lá số hiện tại.",
          canonicalPath: "/hop-tuoi",
        };
      case "lien-he":
        return {
          title: "Liên Hệ - Nhận Hướng Dẫn Chọn Gói Luận Giải",
          description:
            "Liên hệ để được hướng dẫn chọn gói phù hợp, gửi câu hỏi theo lá số hoặc đặt lịch tư vấn trực tiếp.",
          canonicalPath: "/lien-he",
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

  const articleSchema = currentBlogPost
    ? {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: currentBlogPost.title,
        description: currentBlogPost.description,
        mainEntityOfPage: `${siteUrl}${currentBlogPost.slug}`,
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
        description="Rõ ràng, gọn và tập trung vào hành trình thực tế: xem miễn phí trước, hỏi 1 câu khi cần quyết định nhanh, hoặc tư vấn trực tiếp khi cần định hướng sâu."
        onSelectPlan={handleSelectPlan}
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
        schema={[organizationSchema, breadcrumbSchema([{ name: "Trang chủ", path: "/" }, { name: "Blog", path: "/blog" }])]}
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
                <a href={post.slug} className="ghost-button" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                  Đọc bài viết
                </a>
                <a href="/lap-la-so" className="primary-button" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                  Lập lá số miễn phí
                </a>
              </div>
            </article>
          ))}
        </div>
        <div className="placeholder-card blog-hub-cta">
          <h2>Bạn muốn chuyển từ kiến thức sang lá số thực tế?</h2>
          <p>Đọc bài để hiểu khái niệm trước, sau đó lập lá số cá nhân để đối chiếu trực tiếp với dữ liệu của chính bạn.</p>
          <div className="home-hero-actions">
            <button type="button" className="primary-button" onClick={navigateChartForm}>Lập lá số miễn phí</button>
            <button type="button" className="ghost-button" onClick={() => navigate("/bang-gia")}>Xem bảng giá</button>
          </div>
        </div>
      </section>
    </div>
  );

  const blogArticlePage = currentBlogPost ? (
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
            { name: "Blog", path: "/blog" },
            { name: currentBlogPost.title, path: currentBlogPost.slug },
          ]),
        ]}
      />
      <section className="content-section">
        <div className="section-heading article-hero">
          <p className="eyebrow">Bài viết kiến thức</p>
          <h1>{currentBlogPost.title}</h1>
          <p>{currentBlogPost.description}</p>
        </div>
        <div className="article-layout">
          <article className="article-content-card">
            {currentBlogPost.content.map((paragraph, index) => (
              <p key={`${currentBlogPost.slug}-${index}`}>{paragraph}</p>
            ))}

            <div className="article-inline-links">
              <a href="/lap-la-so">Lập lá số miễn phí</a>
              <a href="/bang-gia">Xem bảng giá luận giải</a>
              <a href="/faq">Đọc câu hỏi thường gặp</a>
            </div>
          </article>

          <aside className="article-sidebar">
            <div className="article-side-card">
              <p className="eyebrow">Liên kết nhanh</p>
              <h3>Từ bài viết sang hành động</h3>
              <a href="/lap-la-so" className="primary-button" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                Lập lá số miễn phí
              </a>
              <a href="/bang-gia" className="ghost-button" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                Xem bảng giá
              </a>
            </div>

            <div className="article-side-card">
              <p className="eyebrow">Bài liên quan</p>
              <h3>Đọc tiếp</h3>
              <div className="article-related-list">
                {relatedBlogPosts.map((post) => (
                  <a key={post.slug} href={post.slug} className="article-related-link">
                    <strong>{post.title}</strong>
                    <span>{post.description}</span>
                  </a>
                ))}
              </div>
            </div>
          </aside>
        </div>
        <div className="placeholder-card">
          <h2>Bạn muốn áp dụng ngay vào lá số của mình?</h2>
          <p>Lập lá số miễn phí để xem dữ liệu cá nhân trước, sau đó mới đọc sâu hơn theo đúng câu hỏi bạn đang quan tâm.</p>
          <div className="home-hero-actions">
            <button type="button" className="primary-button" onClick={navigateChartForm}>Lập lá số miễn phí</button>
            <button type="button" className="ghost-button" onClick={() => navigate("/blog")}>Quay lại blog</button>
          </div>
        </div>
      </section>
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
          <h1>Hợp tuổi theo lá số: đang mở dần theo hướng đúng dữ liệu</h1>
          <p>Trang này hiện đóng vai trò hướng dẫn chuẩn bị dữ liệu, câu hỏi và bối cảnh để khi mở engine hợp tuổi, trải nghiệm sẽ rõ ràng và dùng được ngay cho tình huống thực tế.</p>
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
            <h3>Vì sao mở chậm hơn?</h3>
            <p>Phần hợp tuổi cần logic so khớp nhiều lớp hơn một công cụ xem nhanh. Ưu tiên hiện tại là bảo đảm phần giải thích dễ hiểu và không đẩy người dùng vào kết luận quá cứng.</p>
          </article>
        </div>
        <div className="placeholder-card">
          <h2>Bạn có thể chuẩn bị trước ngay từ bây giờ</h2>
          <p>Lập lá số của mình trước, sau đó copy brief hoặc liên hệ để mô tả rõ trường hợp bạn muốn xem. Đây là cách tốt nhất để sẵn sàng khi công cụ hợp tuổi được mở đầy đủ.</p>
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
                  ? (currentBlogPost ? blogArticlePage : blogPage)
                  : activePage === "hop-tuoi"
                    ? compatPage
                    : activePage === "lien-he"
                      ? contactPage
                      : faqPage}
      </main>

      <FloatingContactLinks />
      <SocialProofPopup />
      <SiteFooter />
    </div>
  );
}

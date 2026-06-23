import type { BirthInput, ChartView, PalaceView, StarView } from "./types";

export type AIAnalysisMode = "basic" | "bac-phai";

export type AIAnalysisResult = {
  tongQuanMenhCuc: string;
  luanMenhThan: string;
  trongTamBacPhai: string;
  tuHoaNamSinh: {
    hoaLoc: string;
    hoaQuyen: string;
    hoaKhoa: string;
    hoaKy: string;
  };
  phiHoaCanCung: Array<{
    fromPalace: string;
    toPalace: string;
    transformation: string;
    analysis: string;
  }>;
  tuHoa: Array<{
    palace: string;
    transformation: string;
    analysis: string;
  }>;
  thaiTueNhapQuai: string;
  daiVan: string;
  luuNien: string;
  suNghiepTaiLoc: string;
  tinhDuyenGiaDao: string;
  diemManh: string[];
  diemCanLuuY: string[];
  goiYHanhDong: string[];
  disclaimer: string;
};

type PalaceSummary = {
  key: string;
  name: string;
  branch?: string;
  stem?: string;
  mainStars?: string[];
  auxiliaryStars?: string[];
  normalStars?: string[];
  badStars?: string[];
  transformers?: string[];
  notes?: string[];
};

type NatalTransformation = {
  stem: string;
  star: string;
  transformation: "loc" | "quyen" | "khoa" | "ky";
  fromPalace?: string;
  toPalace?: string;
  meaning?: string;
};

export type AIAnalysisPayload = {
  analysisMode: AIAnalysisMode;
  profile?: {
    gender?: string;
    birthDate?: string;
    birthTime?: string;
    calendarType?: "solar" | "lunar";
    yearToView?: number;
  };
  basicChart?: {
    menh?: string;
    than?: string;
    cuc?: string;
    amDuong?: string;
    menhChu?: string;
    thanChu?: string;
  };
  palaces?: PalaceSummary[];
  bacPhai?: {
    natalFourTransformations?: NatalTransformation[];
    palaceStemMap?: Record<string, string>;
    laiNhanCung?: string;
    palaceStemTransformations?: Array<Record<string, unknown>>;
    selfTransformations?: Array<Record<string, unknown>>;
    transformationFlows?: Array<Record<string, unknown>>;
    keyPalaceRelations?: Array<{
      groupName: string;
      palaces: string[];
      observation?: string;
    }>;
  };
  thaiTueNhapQuai?: {
    method?: string;
    yearBranch?: string;
    thaiTuePalace?: string;
    activatedPalaces?: string[];
    activatedStars?: string[];
    observations?: Array<{
      palace: string;
      topic?: string;
      meaning?: string;
    }>;
  };
  periods?: {
    daiVan?: {
      ageRange?: string;
      palace?: string;
      stem?: string;
      branch?: string;
      notes?: string[];
    };
    luuNien?: {
      year?: number;
      stem?: string;
      branch?: string;
      thaiTuePalace?: string;
      notes?: string[];
    };
  };
  userQuestion?: string;
};

type RuntimeChartProfile = {
  gender?: string;
  menhElement?: string;
  menhChu?: string;
  bodyPalace?: string;
  thanChu?: string;
  cucElement?: string;
  fiveElementsClass?: string;
  yinYangLabel?: string;
  yinyangGender?: string;
  ageCycle?: string;
  yearStem?: string;
  yearBranch?: string;
  birthTime?: string;
  zodiac?: string;
  fullName?: string;
};

type AIAnalysisApiResponse = {
  ok: true;
  data: AIAnalysisResult;
};

const DEFAULT_DISCLAIMER =
  "Nội dung chỉ mang tính tham khảo, không thay thế tư vấn chuyên môn về tài chính, y tế, pháp lý hoặc các quyết định quan trọng.";

const DAILY_LIMIT = 3;
const DAILY_LIMIT_STORAGE_KEY = "ai-luan-giai-daily-limit";

const safeWindow = () => (typeof window !== "undefined" ? window : null);

const getLocalDateKey = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const cleanText = (value: unknown) => (typeof value === "string" ? value.trim() : "");

const cleanList = (value: unknown, limit = 6) =>
  Array.isArray(value)
    ? value
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter(Boolean)
      .slice(0, limit)
    : [];

const getRuntimeProfile = (chart: ChartView) => chart.profile as unknown as RuntimeChartProfile;
const getStarLabel = (item: Pick<StarView, "name" | "display">) => item.display || item.name;

const normalizeTransformationLabel = (value: string) => {
  if (value === "Lộc" || value.toLowerCase() === "loc") return "Lộc";
  if (value === "Quyền" || value.toLowerCase() === "quyen") return "Quyền";
  if (value === "Khoa" || value.toLowerCase() === "khoa") return "Khoa";
  return "Kỵ";
};

const normalizeTransformationKey = (value: string): NatalTransformation["transformation"] => {
  if (value === "Lộc") return "loc";
  if (value === "Quyền") return "quyen";
  if (value === "Khoa") return "khoa";
  return "ky";
};

const getPalace = (chart: ChartView, palaceName: string) => chart.palaces.find((item) => item.name === palaceName);

const mapPalace = (palace: PalaceView): PalaceSummary => {
  const mainStars = palace.majorStars.map(getStarLabel).filter(Boolean);
  const auxiliaryStars = palace.goodStars.map(getStarLabel).filter(Boolean);
  const badStars = palace.badStars.map(getStarLabel).filter(Boolean);
  const known = new Set([...mainStars, ...auxiliaryStars, ...badStars]);
  const normalStars = palace.visibleStars
    .map(getStarLabel)
    .filter(Boolean)
    .filter((star) => !known.has(star))
    .slice(0, 16);
  const transformers = palace.visibleStars
    .filter((star) => star.mutagen)
    .map((star) => `${getStarLabel(star)} (${normalizeTransformationLabel(star.mutagen || "")})`)
    .slice(0, 8);

  return {
    key: palace.name,
    name: palace.name,
    branch: palace.earthlyBranch,
    stem: palace.heavenlyStem,
    mainStars: mainStars.slice(0, 8),
    auxiliaryStars: auxiliaryStars.slice(0, 10),
    normalStars,
    badStars: badStars.slice(0, 10),
    transformers,
    notes: palace.specialMarkers.map((item) => String(item)).slice(0, 6),
  };
};

const collectNatalFourTransformations = (chart: ChartView): NatalTransformation[] => {
  const profile = getRuntimeProfile(chart);
  const yearStem = cleanText(profile.yearStem);
  const results: NatalTransformation[] = [];

  chart.palaces.forEach((palace) => {
    palace.visibleStars.forEach((star) => {
      if (star.source !== "mutagen" || !star.mutagen) {
        return;
      }

      const starName = getStarLabel(star);
      if (!starName) {
        return;
      }

      results.push({
        stem: yearStem,
        star: starName,
        transformation: normalizeTransformationKey(star.mutagen),
        fromPalace: palace.name,
        toPalace: palace.name,
      });
    });
  });

  return results
    .filter(
      (item, index, array) =>
        array.findIndex(
          (candidate) =>
            candidate.star === item.star &&
            candidate.transformation === item.transformation &&
            candidate.fromPalace === item.fromPalace,
        ) === index,
    )
    .slice(0, 8);
};

const parseAgeRange = (value?: string) => {
  if (!value) {
    return null;
  }

  const match = value.match(/(\d+)\s*[–-]\s*(\d+)/);
  if (!match) {
    return null;
  }

  return {
    fromAge: Number(match[1]),
    toAge: Number(match[2]),
  };
};

const getActivePeriodPalaces = (chart: ChartView, yearToView: number, birthYear: number) => {
  const age = yearToView - birthYear;
  const daiVanPalace = chart.palaces.find((palace) => {
    const range = parseAgeRange(palace.decadalRange);
    return range ? age >= range.fromAge && age <= range.toAge : false;
  });
  const tieuVanPalace = chart.palaces.find((palace) => Array.isArray(palace.ages) && palace.ages.includes(age));

  return { age, daiVanPalace, tieuVanPalace };
};

export const hasLimitedBacPhaiData = (payload: AIAnalysisPayload) => {
  const natal = payload.bacPhai?.natalFourTransformations?.length ?? 0;
  const stemMap = Object.keys(payload.bacPhai?.palaceStemMap ?? {}).length;
  const laiNhan = cleanText(payload.bacPhai?.laiNhanCung);
  return natal === 0 || stemMap === 0 || !laiNhan;
};

export const normalizeAIAnalysisResult = (value: unknown): AIAnalysisResult => {
  const input = typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
  const oldTongQuan = cleanText(input.tongQuan);
  const oldTinhCach = cleanText(input.tinhCach);
  const oldSuNghiep = cleanText(input.suNghiep);
  const oldTaiLoc = cleanText(input.taiLoc);
  const oldTinhDuyen = cleanText(input.tinhDuyen);
  const oldDaiVan = cleanText(input.daiVan);
  const oldTieuVan = cleanText(input.tieuVanNam);
  const tuHoaNamSinh = (input.tuHoaNamSinh && typeof input.tuHoaNamSinh === "object"
    ? input.tuHoaNamSinh
    : {}) as Record<string, unknown>;

  return {
    tongQuanMenhCuc: cleanText(input.tongQuanMenhCuc) || oldTongQuan,
    luanMenhThan: cleanText(input.luanMenhThan) || oldTinhCach,
    trongTamBacPhai: cleanText(input.trongTamBacPhai),
    tuHoaNamSinh: {
      hoaLoc: cleanText(tuHoaNamSinh.hoaLoc),
      hoaQuyen: cleanText(tuHoaNamSinh.hoaQuyen),
      hoaKhoa: cleanText(tuHoaNamSinh.hoaKhoa),
      hoaKy: cleanText(tuHoaNamSinh.hoaKy),
    },
    phiHoaCanCung: Array.isArray(input.phiHoaCanCung)
      ? input.phiHoaCanCung
        .map((item) => {
          const row = item as Record<string, unknown>;
          return {
            fromPalace: cleanText(row.fromPalace),
            toPalace: cleanText(row.toPalace),
            transformation: cleanText(row.transformation),
            analysis: cleanText(row.analysis),
          };
        })
        .filter((item) => item.analysis || item.fromPalace || item.toPalace)
      : [],
    tuHoa: Array.isArray(input.tuHoa)
      ? input.tuHoa
        .map((item) => {
          const row = item as Record<string, unknown>;
          return {
            palace: cleanText(row.palace),
            transformation: cleanText(row.transformation),
            analysis: cleanText(row.analysis),
          };
        })
        .filter((item) => item.analysis || item.palace)
      : [],
    thaiTueNhapQuai: cleanText(input.thaiTueNhapQuai),
    daiVan: oldDaiVan,
    luuNien: cleanText(input.luuNien) || oldTieuVan,
    suNghiepTaiLoc: cleanText(input.suNghiepTaiLoc) || [oldSuNghiep, oldTaiLoc].filter(Boolean).join("\n\n"),
    tinhDuyenGiaDao: cleanText(input.tinhDuyenGiaDao) || oldTinhDuyen,
    diemManh: cleanList(input.diemManh, 3),
    diemCanLuuY: cleanList(input.diemCanLuuY, 3),
    goiYHanhDong: cleanList(input.goiYHanhDong, 3),
    disclaimer: cleanText(input.disclaimer) || DEFAULT_DISCLAIMER,
  };
};

export const buildAIAnalysisPayload = (
  chart: ChartView,
  input: BirthInput,
  yearToView: number,
  analysisMode: AIAnalysisMode = "bac-phai",
): AIAnalysisPayload => {
  const profile = getRuntimeProfile(chart);
  const birthYear = Number(input.year) || yearToView;
  const { daiVanPalace, tieuVanPalace } = getActivePeriodPalaces(chart, yearToView, birthYear);
  const natalFourTransformations = collectNatalFourTransformations(chart);

  return {
    analysisMode,
    profile: {
      gender: profile.gender || (input.gender === "male" ? "Nam" : "Nữ"),
      birthDate: `${input.year.padStart(4, "0")}-${input.month.padStart(2, "0")}-${input.day.padStart(2, "0")}`,
      birthTime: input.unknownBirthTime ? "Không rõ giờ sinh" : `${input.birthHour.padStart(2, "0")}:${(input.birthMinute || "0").padStart(2, "0")}`,
      calendarType: input.calendarType,
      yearToView,
    },
    basicChart: {
      menh: profile.menhElement || profile.menhChu || "",
      than: profile.bodyPalace || profile.thanChu || "",
      cuc: profile.cucElement || profile.fiveElementsClass || "",
      amDuong: profile.yinYangLabel || profile.yinyangGender || "",
      menhChu: profile.menhChu || "",
      thanChu: profile.thanChu || "",
    },
    palaces: chart.palaces.map(mapPalace),
    bacPhai: {
      natalFourTransformations,
      palaceStemMap: chart.palaceStemMap,
      laiNhanCung: String(chart.laiNhanCung || ""),
      palaceStemTransformations: [],
      selfTransformations: [],
      transformationFlows: [],
      keyPalaceRelations: [
        { groupName: "Mệnh-Tài-Quan", palaces: ["Mệnh", "Tài Bạch", "Quan Lộc"] },
        { groupName: "Phúc-Phối-Di", palaces: ["Phúc Đức", "Phu Thê", "Thiên Di"] },
      ],
    },
    periods: {
      daiVan: daiVanPalace
        ? {
          ageRange: daiVanPalace.decadalRange,
          palace: daiVanPalace.name,
          stem: daiVanPalace.heavenlyStem,
          branch: daiVanPalace.earthlyBranch,
          notes: [],
        }
        : undefined,
      luuNien: {
        year: yearToView,
        stem: cleanText(profile.yearStem),
        branch: cleanText(profile.yearBranch),
        notes: [
          ...(tieuVanPalace ? [`Tiểu vận năm xem rơi vào cung ${tieuVanPalace.name}.`] : []),
          ...((chart.luuWarnings ?? []).slice(0, 4)),
        ],
      },
    },
  };
};

export const buildAIAnalysisCacheKey = (
  payload: Pick<AIAnalysisPayload, "analysisMode" | "profile">,
) =>
  `ai-luan-giai:${payload.analysisMode}:${payload.profile?.birthDate || ""}:${payload.profile?.birthTime || ""}:${payload.profile?.gender || ""}:${payload.profile?.yearToView || ""}`;

export const getCachedAIAnalysis = (cacheKey: string): AIAnalysisResult | null => {
  const browserWindow = safeWindow();
  if (!browserWindow) {
    return null;
  }

  const raw = browserWindow.localStorage.getItem(cacheKey);
  if (!raw) {
    return null;
  }

  try {
    return normalizeAIAnalysisResult(JSON.parse(raw));
  } catch {
    browserWindow.localStorage.removeItem(cacheKey);
    return null;
  }
};

export const setCachedAIAnalysis = (cacheKey: string, result: AIAnalysisResult) => {
  const browserWindow = safeWindow();
  if (!browserWindow) {
    return;
  }

  browserWindow.localStorage.setItem(cacheKey, JSON.stringify(result));
};

const readDailyLimitState = () => {
  const browserWindow = safeWindow();
  if (!browserWindow) {
    return { date: getLocalDateKey(), count: 0 };
  }

  const raw = browserWindow.localStorage.getItem(DAILY_LIMIT_STORAGE_KEY);
  if (!raw) {
    return { date: getLocalDateKey(), count: 0 };
  }

  try {
    const parsed = JSON.parse(raw) as { date?: string; count?: number };
    if (parsed.date !== getLocalDateKey()) {
      return { date: getLocalDateKey(), count: 0 };
    }

    return {
      date: parsed.date || getLocalDateKey(),
      count: typeof parsed.count === "number" ? parsed.count : 0,
    };
  } catch {
    return { date: getLocalDateKey(), count: 0 };
  }
};

const writeDailyLimitState = (count: number) => {
  const browserWindow = safeWindow();
  if (!browserWindow) {
    return;
  }

  browserWindow.localStorage.setItem(
    DAILY_LIMIT_STORAGE_KEY,
    JSON.stringify({
      date: getLocalDateKey(),
      count,
    }),
  );
};

export const getRemainingAIAnalysisQuota = () => {
  const state = readDailyLimitState();
  return Math.max(0, DAILY_LIMIT - state.count);
};

export const canGenerateNewAIAnalysisToday = () => getRemainingAIAnalysisQuota() > 0;

export const consumeAIAnalysisQuota = () => {
  const state = readDailyLimitState();
  writeDailyLimitState(Math.min(DAILY_LIMIT, state.count + 1));
};

export const generateLuanGiai = async (payload: AIAnalysisPayload) => {
  const response = await fetch("/api/ai/luan-giai", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const text = await response.text();
  let data: Record<string, unknown> = {};

  if (text) {
    try {
      data = JSON.parse(text) as Record<string, unknown>;
    } catch {
      throw new Error("Phản hồi từ API luận giải AI không hợp lệ.");
    }
  }

  if (!response.ok) {
    throw new Error(cleanText(data.error) || "Chưa thể tạo luận giải. Vui lòng thử lại sau.");
  }

  const apiResponse = data as Partial<AIAnalysisApiResponse>;
  if (!apiResponse.ok || !apiResponse.data) {
    throw new Error("API luận giải AI chưa trả về dữ liệu hợp lệ.");
  }

  return normalizeAIAnalysisResult(apiResponse.data);
};

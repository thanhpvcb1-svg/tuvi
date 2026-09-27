/**
 * Lá số minh họa cho /la-so-mau - dùng chung cho trang React (SampleChartsPage) và HTML prerender
 * (scripts/prerender-pages.mjs tính lá số lúc build bằng cùng engine), để hai bản luôn cùng dữ liệu.
 * Chỉ đọc kết quả an sao, không tính lại sao.
 */
import type { BirthInput, ChartView, NormalizedBirthInput, PalaceView, StarView } from "../lib/types";
import { branchKey, computePeriod } from "../lib/tuvi/knowledge/conditionMatcher";

// Lá số minh họa, không phải người thật.
export const DEMO_BIRTH_YEAR = 1990;
export const DEMO_LABEL = "Nam, sinh ngày 12/5/1990 (dương lịch), giờ Mùi";
export const DEMO_HOUR_LABEL = "Giờ Mùi (13h-15h)";

export const demoInput = (horoscopeYear: number): BirthInput => ({
  fullName: "Lá số mẫu",
  year: String(DEMO_BIRTH_YEAR),
  month: "5",
  day: "12",
  birthHour: "13",
  birthMinute: "0",
  gender: "male",
  calendarType: "solar",
  horoscopeYear: String(horoscopeYear),
  unknownBirthTime: false,
  hidePersonalInfo: false,
});

/** Dạng đã chuẩn hóa - trùng với normalizeBirthInput(demoInput(...)) của AppContext (giờ 13 -> chỉ số giờ Mùi 7). */
export const DEMO_NORMALIZED_INPUT = {
  ...demoInput(DEMO_BIRTH_YEAR),
  year: DEMO_BIRTH_YEAR,
  month: 5,
  day: 12,
  birthHour: 13,
  birthMinute: 0,
  birthHourIndex: 7,
} as unknown as NormalizedBirthInput;

export const PALACE_ORDER = ["Mệnh", "Phụ Mẫu", "Phúc Đức", "Điền Trạch", "Quan Lộc", "Nô Bộc", "Thiên Di", "Tật Ách", "Tài Bạch", "Tử Tức", "Phu Thê", "Huynh Đệ"];
const HOA_ORDER = ["Lộc", "Quyền", "Khoa", "Kỵ"];
export type HoaKey = "loc" | "quyen" | "khoa" | "ky";

const isNatal = (star: StarView) => !star.scope || star.scope === "origin";

export function describeMainStars(palace: PalaceView | undefined): string {
  const stars = (palace?.majorStars ?? []).filter(isNatal);
  if (!stars.length) return "vô chính diệu";
  return stars
    .map((s) => `${s.name}${s.brightnessFull ? ` (${s.brightnessFull.toLowerCase()})` : ""}${s.mutagen ? ` hóa ${s.mutagen}` : ""}`)
    .join(", ");
}

export function deriveDemoData(chart: ChartView, yearToView: number) {
  const byName = (name: string) => chart.palaces.find((p) => p.name === name);
  const menh = byName("Mệnh");
  const than = chart.palaces.find((p) => p.isBodyPalace);
  const period = computePeriod(chart, yearToView, DEMO_BIRTH_YEAR);
  const stemMap = ((chart as any).palaceStemMap ?? {}) as Record<string, string>;

  const tamPhuong = ["Mệnh", "Tài Bạch", "Quan Lộc", "Thiên Di"].map((name) => {
    const palace = byName(name);
    return { name, branch: palace?.earthlyBranch ?? "", stars: describeMainStars(palace) };
  });

  const tuHoa = chart.palaces
    .flatMap((palace) =>
      (palace.majorStars ?? [])
        .concat(palace.minorStars ?? [])
        .filter((s) => isNatal(s) && s.mutagen)
        .map((s) => ({ hoa: s.mutagen as string, star: s.name, palace: palace.name, branch: palace.earthlyBranch ?? "" })),
    )
    .sort((a, b) => HOA_ORDER.indexOf(a.hoa) - HOA_ORDER.indexOf(b.hoa));

  const phiHoa = PALACE_ORDER.map((name) => {
    const palace = byName(name);
    const targets: Record<HoaKey, string> = { loc: "", quyen: "", khoa: "", ky: "" };
    for (const flow of ((palace as any)?.phiTuHoa?.flows ?? []) as Array<{ type: HoaKey; relation?: string; targetPalaceName?: string }>) {
      if (!(flow.type in targets)) continue;
      targets[flow.type] = flow.relation === "tu_hoa" ? "Tự hóa" : flow.targetPalaceName ?? "";
    }
    return { name, stem: palace?.earthlyBranch ? stemMap[palace.earthlyBranch] ?? "" : "", targets };
  });

  const daiVan = chart.palaces
    .map((palace) => ({ palace, start: Number((palace as any).decadalRange) }))
    .filter((d) => Number.isFinite(d.start) && d.start > 0)
    .sort((a, b) => a.start - b.start)
    .map(({ palace, start }) => ({
      start,
      end: start + 9,
      palace: palace.name,
      index: palace.index,
      branch: palace.earthlyBranch ?? "",
      stars: describeMainStars(palace),
      active: Boolean(period?.daiVan && palace.earthlyBranch && period.daiVan === branchKey(palace.earthlyBranch)),
    }));

  return {
    profile: chart.profile,
    age: yearToView - DEMO_BIRTH_YEAR,
    menh: { branch: menh?.earthlyBranch ?? "", stars: describeMainStars(menh) },
    than: { name: than?.name ?? "", branch: than?.earthlyBranch ?? "", stars: describeMainStars(than) },
    tamPhuong,
    tuHoa,
    phiHoa,
    daiVan,
    activeDaiVan: period?.label ?? "",
  };
}

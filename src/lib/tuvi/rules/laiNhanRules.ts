import type { LaiNhanCung, LaiNhanProfileName, NormalizedPalace } from "../config/types";

export const STEMS = ["Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý"] as const;
export const PALACES = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"] as const;

export const TIGER_STEM_BY_YEAR_STEM: Record<string, (typeof STEMS)[number]> = {
  Giáp: "Bính",
  Kỷ: "Bính",
  Ất: "Mậu",
  Canh: "Mậu",
  Bính: "Canh",
  Tân: "Canh",
  Đinh: "Nhâm",
  Nhâm: "Nhâm",
  Mậu: "Giáp",
  Quý: "Giáp",
};

function nextIndex<T>(items: readonly T[], item: T, step = 1) {
  const index = items.indexOf(item);
  if (index < 0) {
    throw new Error(`Invalid item: ${String(item)}`);
  }

  return (index + step + items.length * 100) % items.length;
}

export function nextStem(stem: string, step = 1) {
  const normalizedStem = STEMS.find((item) => item === stem);
  if (!normalizedStem) {
    throw new Error(`Invalid stem: ${stem}`);
  }

  return STEMS[nextIndex(STEMS, normalizedStem, step)];
}

export function getPalaceStemMap(yearStem: string) {
  const tigerStem = TIGER_STEM_BY_YEAR_STEM[yearStem];
  if (!tigerStem) {
    throw new Error(`Invalid year stem: ${yearStem}`);
  }

  const result: Record<string, string> = {};
  const tigerIndex = PALACES.indexOf("Dần");

  for (let offset = 0; offset < 12; offset += 1) {
    const palace = PALACES[(tigerIndex + offset) % 12];
    result[palace] = nextStem(tigerStem, offset);
  }

  return result;
}

export function enrichPalacesWithStem<T extends { earthlyBranch?: string; name?: string; heavenlyStem?: string }>(palaces: T[], yearStem: string) {
  const palaceStemMap = getPalaceStemMap(yearStem);

  return palaces.map((palace) => {
    const palaceBranch = palace.earthlyBranch && PALACES.includes(palace.earthlyBranch as (typeof PALACES)[number]) ? palace.earthlyBranch : undefined;
    const palaceStem = palaceBranch ? palaceStemMap[palaceBranch] : undefined;

    return {
      ...palace,
      heavenlyStem: palaceStem ?? palace.heavenlyStem,
      palaceStem,
      palaceBranch,
      palaceStemBranch: palaceStem && palaceBranch ? `${palaceStem} ${palaceBranch}` : undefined,
    };
  });
}

export function findLaiNhanCung(
  yearStem: string,
  palaces: Array<Pick<NormalizedPalace, "name" | "palaceStem" | "palaceBranch" | "palaceStemBranch">>,
  options: { profile?: LaiNhanProfileName } = {},
): LaiNhanCung | null {
  const { profile = "standard" } = options;

  let candidates = palaces.filter((palace) => palace.palaceStem === yearStem);

  if (profile === "khamThienExcludeTySuu") {
    candidates = candidates.filter((palace) => !["Tý", "Sửu"].includes(palace.palaceBranch ?? ""));
  }

  if (candidates.length === 0) {
    return null;
  }

  if (candidates.length > 1) {
    const narrowedCandidates = candidates.filter((palace) => !["Tý", "Sửu"].includes(palace.palaceBranch ?? ""));

    if (narrowedCandidates.length === 1) {
      candidates = narrowedCandidates;
    } else {
      console.warn(
        `Unable to resolve Lai Nhân Cung uniquely for yearStem ${yearStem}: ${candidates
          .map((palace) => palace.palaceStemBranch || palace.palaceBranch || palace.name)
          .join(", ")}`,
      );
      return null;
    }
  }

  const laiNhan = candidates[0];

  return {
    palace: laiNhan.palaceBranch ?? "",
    palaceStem: laiNhan.palaceStem ?? "",
    palaceBranch: laiNhan.palaceBranch ?? "",
    palaceStemBranch: laiNhan.palaceStemBranch ?? "",
    functionalPalace: laiNhan.name,
    profile,
  };
}

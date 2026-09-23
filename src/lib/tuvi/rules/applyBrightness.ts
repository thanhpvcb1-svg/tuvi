import type { Branch } from "../../../config/starBrightness";
import type { BrightnessShort, DisplayPalace, DisplayStar, NormalizedChart, NormalizedPalace, NormalizedStar } from "../config/types";
import { brightnessDisplayCode, brightnessFullFromShort, normalizeBrightnessCode } from "../normalize/normalizeBrightness";
import { resolveStarIdFromName } from "../../../config/starBrightness";

type StarLike = {
  starId?: string;
  name: string;
  brightness?: string;
  brightnessFull?: string;
  display?: string;
};

const NORMALIZED_STAR_ARRAYS: Array<keyof NormalizedPalace> = [
  "majorStars",
  "minorStars",
  "adjectiveStars",
  "cycleStars",
  "mutagenStars",
  "extraStars",
  "annualStars",
  "analysisStars",
  "visibleStars",
];

const DISPLAY_STAR_ARRAYS: Array<keyof DisplayPalace> = [
  "majorStars",
  "minorStars",
  "adjectiveStars",
  "specialStars",
  "centerStars",
  "leftStars",
  "rightStars",
  "bottomStars",
  "goodStars",
  "badStars",
  "displayStars",
  "visibleStars",
  "analysisStars",
];

function normalizeDisplayName(name: string, brightness?: BrightnessShort) {
  const displayCode = brightnessDisplayCode(brightness);
  return displayCode ? `${name}(${displayCode})` : name;
}

function isStableBrightnessCode(value: string | undefined) {
  return value === "M" || value === "V" || value === "Đ" || value === "H" || value === "BH";
}

function resolveBrightness(_starId: string | undefined, _branch: Branch | string | undefined, oldBrightness?: string, oldBrightnessFull?: string) {
  const normalized = normalizeBrightnessCode(oldBrightness || oldBrightnessFull);
  const brightness = isStableBrightnessCode(normalized) ? normalized : undefined;

  if (!brightness) {
    return {
      brightness: undefined,
      brightnessFull: "",
    };
  }

  return {
    brightness,
    brightnessFull: brightnessFullFromShort(brightness),
  };
}

export function applyBrightnessToStar<T extends StarLike>(star: T, palaceBranch: Branch | string | undefined): T {
  const starId = star.starId ?? resolveStarIdFromName(star.name);
  const resolved = resolveBrightness(starId, palaceBranch, star.brightness, star.brightnessFull);

  return {
    ...star,
    starId,
    brightness: resolved.brightness,
    brightnessFull: resolved.brightnessFull,
    display: normalizeDisplayName(star.name, resolved.brightness),
  };
}

export function applyBrightnessToNormalizedStar(star: NormalizedStar, palaceBranch: Branch | string | undefined): NormalizedStar {
  const resolved = resolveBrightness(resolveStarIdFromName(star.name), palaceBranch, star.brightness, star.brightnessFull || star.rawBrightness);

  return {
    ...star,
    brightness: resolved.brightness,
    brightnessFull: resolved.brightnessFull,
  };
}

export function applyBrightnessToPalace(palace: NormalizedPalace) {
  const branch = palace.earthlyBranch;
  const nextPalace = { ...palace } as NormalizedPalace;

  for (const key of NORMALIZED_STAR_ARRAYS) {
    const value = (nextPalace as any)[key] as unknown;
    if (Array.isArray(value)) {
      (nextPalace as any)[key] = (value as NormalizedStar[]).map((star) => applyBrightnessToNormalizedStar(star, branch));
    }
  }

  return nextPalace;
}

export function applyBrightnessToChart(chart: NormalizedChart): NormalizedChart {
  return {
    ...chart,
    palaces: chart.palaces.map(applyBrightnessToPalace),
  };
}

export function applyBrightnessToDisplayPalace(palace: DisplayPalace) {
  const branch = palace.earthlyBranch;
  const nextPalace = { ...palace } as DisplayPalace;

  for (const key of DISPLAY_STAR_ARRAYS) {
    const value = (nextPalace as any)[key] as unknown;
    if (Array.isArray(value)) {
      (nextPalace as any)[key] = (value as DisplayStar[]).map((star) => applyBrightnessToStar(star, branch));
    }
  }

  return nextPalace;
}

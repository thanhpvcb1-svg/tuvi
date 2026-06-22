import displayRulesJson from "../data/display_rules.json";
import starsMasterJson from "../data/stars.master.json";
import type {
  DisplayColumn,
  DisplayStar,
  FiveElement,
  NormalizedStar,
  StarCategory,
  StarColorGroup,
  StarNature,
} from "../config/types";
import { brightnessDisplayCode } from "../normalize/normalizeBrightness";
import { toPreferredStarName } from "../rules/preferredStarNames";
import { normalizeLookupKey } from "../utils";

type StarMasterRecord = {
  id: string;
  name_vi: string;
  aliases?: string[];
  category: StarCategory;
  groups: string[];
  element?: FiveElement | null;
  nature: StarNature;
  display_column?: DisplayColumn;
  has_brightness: boolean;
  priority: number;
  color_override?: string;
};

type DisplayRules = {
  element_colors: Record<FiveElement, string>;
  nature_colors: Record<string, string>;
  column_order: Record<DisplayColumn, number>;
  category_order: Record<StarCategory, number>;
  default_column: DisplayColumn;
};

const starsMaster = starsMasterJson as StarMasterRecord[];
const displayRules = displayRulesJson as DisplayRules;

const VALID_COLUMNS = new Set<DisplayColumn>(["center", "left", "right", "bottom"]);
const LEFT_NATURES = new Set(["cat", "loc", "quy_nhan", "van_tinh"]);

function normalizeId(value: string) {
  return normalizeLookupKey(value).replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
}

function stripStarScopePrefix(value: string) {
  return value
    .replace(/^L\./i, "")
    .replace(/^Lưu\s+/i, "")
    .replace(/^Vận\s+/i, "")
    .trim();
}

const starById = new Map<string, StarMasterRecord>();
const starByName = new Map<string, StarMasterRecord>();

for (const star of starsMaster) {
  starById.set(star.id, star);
  starByName.set(normalizeLookupKey(star.name_vi), star);
  starByName.set(normalizeId(star.name_vi), star);

  for (const alias of star.aliases ?? []) {
    starByName.set(normalizeLookupKey(alias), star);
    starByName.set(normalizeId(alias), star);
  }
}

function getStarMeta(star: NormalizedStar): StarMasterRecord {
  if (star.horoscopeCategory === "loc-ky-nhap") {
    return {
      id: normalizeId(star.name),
      name_vi: star.name,
      category: "tap_dieu",
      groups: [],
      element: null,
      nature: "neutral",
      display_column: "bottom",
      has_brightness: false,
      priority: 5,
    };
  }

  const byKey = star.starKey ? starById.get(star.starKey) : undefined;
  if (byKey) {
    return byKey;
  }

  const baseName = stripStarScopePrefix(star.name);
  const byBaseId = baseName !== star.name ? starById.get(normalizeId(baseName)) : undefined;
  if (byBaseId) {
    return byBaseId;
  }

  const byName = starByName.get(normalizeLookupKey(star.name)) ?? starByName.get(normalizeId(star.name));

  if (byName) {
    return byName;
  }

  const byBaseName =
    baseName !== star.name ? starByName.get(normalizeLookupKey(baseName)) ?? starByName.get(normalizeId(baseName)) : undefined;

  if (byBaseName) {
    return byBaseName;
  }

  const fallbackId = normalizeId(star.name);
  return {
    id: fallbackId,
    name_vi: star.name,
    category: star.source === "major" ? "main_star" : "tap_dieu",
    groups: [],
    element: null,
    nature: "neutral",
    display_column: star.source === "major" ? "center" : displayRules.default_column,
    has_brightness: Boolean(star.brightness),
    priority: 999,
  };
}

function colorGroupFromElement(element?: FiveElement | null): StarColorGroup {
  if (!element) {
    return "gray";
  }

  return element;
}

export function getStarColor(meta: StarMasterRecord): string {
  if (meta.color_override) {
    return meta.color_override;
  }

  if (meta.id === "hoa_ky") {
    return "#111827";
  }

  if (meta.id === "hoa_loc" || meta.id === "hoa_khoa") {
    return "#16a34a";
  }

  if (meta.id === "hoa_quyen") {
    return "#16a34a";
  }

  if (meta.element && displayRules.element_colors[meta.element]) {
    return displayRules.element_colors[meta.element];
  }

  return displayRules.nature_colors[meta.nature] ?? displayRules.nature_colors.neutral;
}

function resolveDisplayColumn(meta: StarMasterRecord): DisplayColumn {
  if (meta.display_column && VALID_COLUMNS.has(meta.display_column)) {
    return meta.display_column;
  }

  if (meta.category === "main_star") {
    return "center";
  }

  if (meta.category === "sat_dieu" || meta.nature === "sat" || meta.groups.includes("luc_sat") || meta.id === "hoa_ky") {
    return "right";
  }

  if (
    meta.groups.includes("luc_cat") ||
    meta.category === "phu_dieu" ||
    meta.category === "ta_dieu" ||
    LEFT_NATURES.has(meta.nature)
  ) {
    return "left";
  }

  return displayRules.default_column;
}

function getDisplayOrder(meta: StarMasterRecord, column: DisplayColumn) {
  const columnOrder = displayRules.column_order[column] ?? 99;
  const rightCategoryOrder: Partial<Record<StarCategory, number>> = {
    sat_dieu: 10,
    hoa_dieu: 20,
    vong_sao: 30,
    tap_dieu: 40,
  };
  const leftCategoryOrder: Partial<Record<StarCategory, number>> = {
    phu_dieu: 10,
    ta_dieu: 15,
    hoa_dieu: 20,
    vong_sao: 25,
    tap_dieu: 30,
    luu_tinh: 80,
  };
  const categoryOrder =
    column === "right"
      ? rightCategoryOrder[meta.category] ?? displayRules.category_order[meta.category] ?? 999
      : column === "left"
        ? leftCategoryOrder[meta.category] ?? displayRules.category_order[meta.category] ?? 999
        : displayRules.category_order[meta.category] ?? 999;

  return columnOrder * 10000 + categoryOrder * 100 + meta.priority;
}

function getDisplayText(star: NormalizedStar) {
  const preferredName = toPreferredStarName(star.name);
  if (star.horoscopeCategory === "loc-ky-nhap") {
    return preferredName;
  }
  const brightness = brightnessDisplayCode(star.brightness);
  return `${preferredName}${brightness ? `(${brightness})` : ""}`;
}

export function enrichPlacedStar(star: NormalizedStar): DisplayStar {
  const meta = getStarMeta(star);
  const displayColumn = resolveDisplayColumn(meta);
  const preferredName = toPreferredStarName(star.name);

  return {
    starId: meta.id,
    starKey: star.starKey,
    name: preferredName,
    displayName: preferredName,
    originalName: star.originalName,
    ringName: star.ringName,
    side: star.side,
    scope: star.scope,
    targetStar: star.targetStar,
    brightness: meta.has_brightness ? star.brightness || undefined : star.brightness || undefined,
    brightnessFull: star.brightnessFull,
    mutagen: star.mutagen,
    colorGroup: colorGroupFromElement(meta.element),
    color: getStarColor(meta),
    category: meta.category,
    groups: meta.groups,
    element: meta.element ?? undefined,
    nature: meta.nature,
    displayColumn,
    display: getDisplayText(star),
    priority: meta.priority,
    order: getDisplayOrder(meta, displayColumn),
    source: star.source,
  };
}

function sortStars(stars: DisplayStar[]) {
  return [...stars].sort((a, b) => (a.order ?? 999999) - (b.order ?? 999999) || a.name.localeCompare(b.name, "vi"));
}

export function groupStarsByColumn(stars: DisplayStar[]) {
  const grouped: Record<DisplayColumn, DisplayStar[]> = {
    center: [],
    left: [],
    right: [],
    bottom: [],
  };

  for (const star of stars) {
    grouped[star.displayColumn ?? "left"].push(star);
  }

  return {
    center: sortStars(grouped.center),
    left: sortStars(grouped.left),
    right: sortStars(grouped.right),
    bottom: sortStars(grouped.bottom),
  };
}

export function validateStarDisplayConfig() {
  const errors: string[] = [];
  const seenIds = new Set<string>();
  const validElements = new Set(Object.keys(displayRules.element_colors));

  for (const star of starsMaster) {
    if (seenIds.has(star.id)) {
      errors.push(`${star.id}: duplicate star_id`);
    }
    seenIds.add(star.id);

    if (star.display_column && !VALID_COLUMNS.has(star.display_column)) {
      errors.push(`${star.id}: invalid display_column ${star.display_column}`);
    }

    if (star.element && !validElements.has(star.element)) {
      errors.push(`${star.id}: missing color for element ${star.element}`);
    }

    if (!displayRules.category_order[star.category]) {
      errors.push(`${star.id}: missing category_order for ${star.category}`);
    }

    if (star.category === "main_star" && !star.has_brightness) {
      errors.push(`${star.id}: main_star must have has_brightness=true`);
    }
  }

  return errors;
}

export function hasStarMasterId(starId: string) {
  return starById.has(starId);
}

import type { BrightnessInspectionReport, BrightnessRule, ResolvedBrightness, SchoolConfig, StarScope } from "../config/types";
import { brightnessFullFromShort, normalizeBrightnessCode } from "../normalize/normalizeBrightness";
import { normalizeBranch } from "../normalize/normalizeBranch";
import { normalizeLookupKey, safeText } from "../utils";

type ResolveBrightnessParams = {
  starName: string;
  palaceName: string;
  branch: string;
  scope: StarScope;
  iztroBrightness?: string;
  config: SchoolConfig;
};

function sortRulesByPriority(rules: BrightnessRule[]) {
  return [...rules].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
}

function isStableRawBrightness(value: string | undefined) {
  return value === "M" || value === "V" || value === "Đ" || value === "H" || value === "BH";
}

function matchesRule(params: ResolveBrightnessParams, rule: BrightnessRule) {
  if (normalizeLookupKey(rule.star) !== normalizeLookupKey(params.starName)) {
    return false;
  }

  if (rule.branches?.length) {
    const branch = normalizeBranch(params.branch);
    const allowed = rule.branches.map((item) => normalizeBranch(item));
    if (!allowed.includes(branch)) {
      return false;
    }
  }

  if (rule.palaces?.length) {
    const palaceKey = normalizeLookupKey(params.palaceName);
    if (!rule.palaces.some((item) => normalizeLookupKey(item) === palaceKey)) {
      return false;
    }
  }

  if (rule.scopes?.length && !rule.scopes.includes(params.scope)) {
    return false;
  }

  return true;
}

export function resolveBrightness(params: ResolveBrightnessParams): ResolvedBrightness {
  const matchedRules = sortRulesByPriority(params.config.brightnessRules.filter((rule) => matchesRule(params, rule)));
  const matchedRule = matchedRules[0];

  if (matchedRule) {
    return {
      brightness: matchedRule.brightness,
      brightnessFull: matchedRule.brightnessFull,
      source: matchedRule.source === "override" ? "manual-config" : matchedRule.source === "derived" ? "fallback-rule" : "school-rule",
      matchedRule,
    };
  }

  const rawBrightness = normalizeBrightnessCode(safeText(params.iztroBrightness));
  if (isStableRawBrightness(rawBrightness)) {
    return {
      brightness: rawBrightness,
      brightnessFull: brightnessFullFromShort(rawBrightness),
      source: "iztro",
    };
  }

  return {
    brightness: "",
    brightnessFull: "",
    source: "none",
  };
}

export function createBrightnessInspectionReport(params: ResolveBrightnessParams): BrightnessInspectionReport {
  const resolved = resolveBrightness(params);
  return {
    star: params.starName,
    palaceName: params.palaceName,
    branch: normalizeBranch(params.branch),
    scope: params.scope,
    iztroBrightness: safeText(params.iztroBrightness),
    finalBrightness: resolved.brightness,
    source: resolved.source,
    ruleNote: resolved.matchedRule?.note,
  };
}

import type { SchoolConfig } from "./types";
import { defaultVietnameseConfig } from "./defaultVietnamese.config";
import { TUVICHANCO_BRIGHTNESS_RULES } from "../rules/brightnessRules";

export const tuvichancoCompatibleConfig: SchoolConfig = {
  ...defaultVietnameseConfig,
  id: "tuvichancoCompatible",
  name: "Tuvichanco Compatible",
  brightnessRules: TUVICHANCO_BRIGHTNESS_RULES,
  khoiVietProfile: "tuvichanco",
  khocHuProfile: "tuvichanco",
};

export const aituvicompatibleConfig = tuvichancoCompatibleConfig;

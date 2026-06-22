import type { SchoolConfig } from "./types";
import { tuvichancoCompatibleConfig } from "./tuvichancoCompatible.config";
import { AITUVI_BRIGHTNESS_RULES } from "../rules/brightnessRules";

export const aituvicompatibleConfig: SchoolConfig = {
  ...tuvichancoCompatibleConfig,
  id: "aituvicompatible",
  name: "AltUvi Compatible",
  brightnessRules: AITUVI_BRIGHTNESS_RULES,
};

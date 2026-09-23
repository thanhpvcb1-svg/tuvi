import type { SchoolConfig } from "./types";
import { defaultVietnameseConfig } from "./defaultVietnamese.config";

export const iztroRawConfig: SchoolConfig = {
  ...defaultVietnameseConfig,
  id: "iztroRaw",
  name: "Iztro Raw",
  brightnessRules: [],
  mutagenRules: [],
  extraStarRules: [],
  annualStarRules: [],
  visibleStarPolicy: {
    ...defaultVietnameseConfig.visibleStarPolicy,
    mode: "full",
    showAllRawStars: true,
    showCycleStars: "all",
    cycleStarMode: "all",
    hiddenFromVisible: [],
    showAnnualStars: true,
  },
};

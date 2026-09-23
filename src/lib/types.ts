import type {
  BrightnessShort,
  DisplayChart,
  DisplayPalace,
  DisplayStar,
  Gender,
  LuuDisplayOptions,
  NormalizedBirthInput,
  SpecialMarker,
  StarColorGroup,
} from "./tuvi/config/types";

export type { BrightnessShort, Gender, LuuDisplayOptions, NormalizedBirthInput, SpecialMarker, StarColorGroup };

export type BirthInput = {
  fullName: string;
  year: string;
  month: string;
  day: string;
  birthHour: string;
  birthMinute: string;
  gender: Gender;
  calendarType: "solar" | "lunar";
  horoscopeYear: string;
  unknownBirthTime: boolean;
};

export type StarView = DisplayStar;

export type PalaceView = DisplayPalace;

export type ChartView = DisplayChart;

import { astro } from "iztro";
import type { ChartView, NormalizedBirthInput } from "./types";
import { createDisplayChart } from "./tuvi/createDisplayChart";
import { aituvicompatibleConfig } from "./tuvi/config/aituvicompatible.config";
import { defaultVietnameseConfig } from "./tuvi/config/defaultVietnamese.config";
import { fullDebugConfig } from "./tuvi/config/fullDebug.config";
import { iztroRawConfig } from "./tuvi/config/iztroRaw.config";
import type { ChartFactoryOptions, SchoolConfig, TuViProfileId } from "./tuvi/config/types";
import { tuvichancoCompatibleConfig } from "./tuvi/config/tuvichancoCompatible.config";

const CONFIG_BY_PROFILE: Record<TuViProfileId, SchoolConfig> = {
  iztroRaw: iztroRawConfig,
  tuvichancoCompatible: tuvichancoCompatibleConfig,
  aituvicompatible: aituvicompatibleConfig,
  fullDebug: fullDebugConfig,
  defaultVietnamese: defaultVietnameseConfig,
};

export function createChart(
  input: NormalizedBirthInput,
  profileId: TuViProfileId = "tuvichancoCompatible",
  options?: ChartFactoryOptions,
): ChartView {
  const { year, month, day, gender, calendarType, birthHourIndex } = input;
  const date = `${year}-${month}-${day}`;
  const apiGender = gender === "male" ? "男" : "女";
  const astroApi: any = astro;

  let raw: any = {};

  try {
    if (calendarType === "solar") {
      raw =
        typeof astroApi?.astrolabeBySolarDate === "function"
          ? astroApi.astrolabeBySolarDate(date, birthHourIndex, apiGender, true, "vi-VN")
          : {};
    } else {
      raw =
        typeof astroApi?.astrolabeByLunarDate === "function"
          ? astroApi.astrolabeByLunarDate(date, birthHourIndex, apiGender, false, true, "vi-VN")
          : {};
    }
  } catch (error) {
    raw = {};
    console.error("iztro error", error);
  }

  let horoscopeData: unknown = options?.horoscopeData;
  try {
    if (horoscopeData === undefined && typeof raw?.horoscope === "function" && options?.horoscopeDate) {
      horoscopeData = raw.horoscope(options.horoscopeDate, birthHourIndex);
    }
  } catch (error) {
    console.error("iztro horoscope error", error);
  }

  return createDisplayChart(raw, input, CONFIG_BY_PROFILE[profileId], {
    ...options,
    horoscopeData,
  });
}

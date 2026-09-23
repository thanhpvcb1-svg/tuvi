export type TimezoneInfo = {
  timezone: string;
  utcOffset: number;
  isSupported: boolean;
  note?: string;
};

export type SolarNoonDebugInfo = {
  equationOfTime: number;
  longitudeCorrection: number;
  rawSolarNoonMinutes: number;
  timezoneOffset: number;
};

const MINUTES_IN_DAY = 24 * 60;

function normalizeMinutes(totalMinutes: number) {
  return ((totalMinutes % MINUTES_IN_DAY) + MINUTES_IN_DAY) % MINUTES_IN_DAY;
}

export function getDayOfYear(date: Date) {
  const start = new Date(date.getFullYear(), 0, 0);
  const current = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diff = current.getTime() - start.getTime();
  return Math.floor(diff / 86_400_000);
}

export function equationOfTime(date: Date) {
  const dayOfYear = getDayOfYear(date);
  const b = (2 * Math.PI * (dayOfYear - 81)) / 364;
  return 9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b);
}

export function calculateSolarNoon(date: Date, longitude: number, timezoneOffset: number) {
  const eot = equationOfTime(date);
  const solarNoonMinutes = 720 - 4 * longitude - eot + 60 * timezoneOffset;
  return normalizeMinutes(solarNoonMinutes);
}

export function calculateSolarNoonDebug(date: Date, longitude: number, timezoneOffset: number): SolarNoonDebugInfo {
  const eot = equationOfTime(date);
  const longitudeCorrection = 4 * longitude;
  const rawSolarNoonMinutes = 720 - longitudeCorrection - eot + 60 * timezoneOffset;

  return {
    equationOfTime: eot,
    longitudeCorrection,
    rawSolarNoonMinutes,
    timezoneOffset,
  };
}

export function formatMinutesToHHMM(totalMinutes: number) {
  const roundedMinutes = Math.round(totalMinutes);
  const normalized = normalizeMinutes(roundedMinutes);
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function formatUtcOffset(offset: number) {
  const sign = offset >= 0 ? "+" : "-";
  const absolute = Math.abs(offset);
  const hours = Math.floor(absolute);
  const minutes = Math.round((absolute - hours) * 60);
  return minutes === 0
    ? `${sign}${hours}`
    : `${sign}${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function isWithinVietnamBounds(lat: number, lon: number) {
  return lat >= 8 && lat <= 24 && lon >= 102 && lon <= 110;
}

function estimateUtcOffsetFromLongitude(longitude: number) {
  return Math.max(-12, Math.min(14, Math.round(longitude / 15)));
}

export function getTimezoneForLocation(lat: number, lon: number): TimezoneInfo {
  if (isWithinVietnamBounds(lat, lon)) {
    return {
      timezone: "Asia/Ho_Chi_Minh",
      utcOffset: 7,
      isSupported: true,
    };
  }

  return {
    timezone: "UTC (estimated from longitude)",
    utcOffset: estimateUtcOffsetFromLongitude(lon),
    isSupported: false,
    note: "Ngoài Việt Nam, múi giờ đang được ước lượng theo kinh độ vì project chưa tích hợp timezone API quốc tế.",
  };
}

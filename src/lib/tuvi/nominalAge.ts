/**
 * Tuổi dùng cho vận hạn (đại vận, tiểu vận, lưu niên): TUỔI MỤ theo năm âm lịch.
 *
 * Dữ liệu lá số (palace.ages của tiểu hạn, decadalRange của đại hạn) tính theo tuổi mụ: sinh ra là 1 tuổi, qua Tết âm lịch
 * thêm 1 tuổi; cung khởi tiểu hạn là "1 tuổi" (tuổi Tỵ Dậu Sửu khởi tại Mùi...). Năm xem hạn là năm âm lịch (năm 2026 = Bính Ngọ).
 *   tuổi mụ = năm âm lịch xem - năm âm lịch sinh + 1
 * Người sinh trước Tết (tháng 1-2 dương lịch) có năm âm lịch sinh = năm dương lịch - 1, nên phải lấy năm âm lịch từ lá số.
 */
import type { ChartView } from "../types";

/** Năm âm lịch sinh, đọc từ profile.lunarDate của lá số ("30/11/1984 (âm lịch)"). */
export function lunarBirthYear(chart: Pick<ChartView, "profile"> | null | undefined): number | null {
  const match = String(chart?.profile?.lunarDate ?? "").match(/(\d{4})/);
  const year = match ? Number(match[1]) : NaN;
  return Number.isFinite(year) && year > 0 ? year : null;
}

/**
 * Tuổi mụ ở năm xem. `fallbackBirthYear` (năm sinh người dùng nhập) chỉ dùng khi lá số không có ngày âm lịch.
 * Trả về undefined khi thiếu dữ liệu.
 */
export function nominalAge(chart: Pick<ChartView, "profile"> | null | undefined, yearToView: number | undefined, fallbackBirthYear?: number): number | undefined {
  if (!yearToView) return undefined;
  const birth = lunarBirthYear(chart) ?? (fallbackBirthYear || undefined);
  return birth ? yearToView - birth + 1 : undefined;
}

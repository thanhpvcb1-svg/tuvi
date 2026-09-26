/**
 * CORS whitelist cho các API AI.
 * Trước đây các endpoint dùng "Access-Control-Allow-Origin: *", cho phép
 * bất kỳ website nào cũng gọi được API và tiêu tốn quota/chi phí AI của chúng ta.
 * Giờ chỉ cho phép domain chính thức + preview deploy của Cloudflare Pages + localhost khi dev.
 */

const ALLOWED_ORIGIN_PATTERNS: RegExp[] = [
  /^https:\/\/(www\.)?tuviphonglam\.com$/,
  /^https:\/\/[a-z0-9-]+\.tuvi\.pages\.dev$/,
  /^https:\/\/tuvi\.pages\.dev$/,
  /^http:\/\/localhost(:\d+)?$/,
  /^http:\/\/127\.0\.0\.1(:\d+)?$/,
];

export function buildCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get("Origin") || "";
  const isAllowed = ALLOWED_ORIGIN_PATTERNS.some((pattern) => pattern.test(origin));

  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : "https://tuviphonglam.com",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
}

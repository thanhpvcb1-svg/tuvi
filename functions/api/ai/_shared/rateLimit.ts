/**
 * Rate limiting theo IP cho các API AI, dùng Cloudflare KV làm bộ đếm dùng chung
 * giữa các edge location (bộ nhớ trong Worker không được chia sẻ giữa các request).
 *
 * QUAN TRỌNG: để có hiệu lực trong production, cần tạo 1 KV namespace và bind
 * vào Pages project với tên biến "RATE_LIMIT_KV" (Cloudflare Dashboard >
 * Pages project > Settings > Functions > KV namespace bindings, hoặc khai báo
 * trong wrangler.toml nếu deploy bằng wrangler). Nếu chưa bind, hàm này sẽ
 * không chặn request nào (fail-open) để tránh làm sập tính năng khi thiếu cấu hình,
 * nhưng sẽ log cảnh báo ra console mỗi lần.
 */

export interface RateLimitEnv {
  RATE_LIMIT_KV?: KVNamespace;
}

export interface RateLimitOptions {
  /** Tiền tố để phân biệt giới hạn theo từng endpoint, ví dụ "chat" hoặc "tonghop" */
  keyPrefix: string;
  /** Số request tối đa cho phép trong 1 cửa sổ thời gian */
  limit: number;
  /** Độ dài cửa sổ thời gian, tính bằng giây */
  windowSeconds: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
}

export async function checkRateLimit(
  env: RateLimitEnv,
  request: Request,
  options: RateLimitOptions,
): Promise<RateLimitResult> {
  const kv = env.RATE_LIMIT_KV;
  if (!kv) {
    console.warn(
      `[rateLimit] RATE_LIMIT_KV chưa được bind - bỏ qua giới hạn cho "${options.keyPrefix}". ` +
        "Hãy tạo và bind KV namespace này trên Cloudflare Pages để bật rate limiting.",
    );
    return { allowed: true, remaining: options.limit };
  }

  const ip = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || "unknown";
  const windowId = Math.floor(Date.now() / (options.windowSeconds * 1000));
  const key = `ratelimit:${options.keyPrefix}:${ip}:${windowId}`;

  const current = parseInt((await kv.get(key)) || "0", 10);
  if (current >= options.limit) {
    return { allowed: false, remaining: 0 };
  }

  await kv.put(key, String(current + 1), { expirationTtl: options.windowSeconds + 60 });
  return { allowed: true, remaining: options.limit - current - 1 };
}

export function rateLimitResponse(corsHeaders: Record<string, string>): Response {
  return new Response(
    JSON.stringify({ success: false, error: "Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau ít phút." }),
    { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } },
  );
}

/**
 * Tải trang "lịch sự": User-Agent thật có thông tin liên hệ, giãn cách theo max(khai báo nguồn, Crawl-delay của
 * robots.txt), timeout, thử lại khi lỗi mạng / 5xx. KHÔNG vượt cơ chế chống bot: gặp 401/403/429 hoặc trang
 * CAPTCHA / đăng nhập thì dừng hẳn nguồn đó (StopSourceError), không đổi User-Agent, không chờ để thử lại.
 */
export class StopSourceError extends Error {}

export type FetchResult = { url: string; finalUrl: string; status: number; contentType: string; body: string };

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class PoliteFetcher {
  private lastRequestAt = 0;
  constructor(private userAgent: string, private delayMs: number, private timeoutMs = 20000, private retries = 2) {}

  async get(url: string): Promise<FetchResult> {
    for (let attempt = 0; ; attempt++) {
      const wait = this.lastRequestAt + this.delayMs - Date.now();
      if (wait > 0) await sleep(wait);
      this.lastRequestAt = Date.now();
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeoutMs);
      try {
        const res = await fetch(url, {
          headers: { "User-Agent": this.userAgent, Accept: "text/html,application/xml;q=0.9,*/*;q=0.5", "Accept-Language": "vi,en;q=0.5" },
          redirect: "follow",
          signal: controller.signal,
        });
        const body = await res.text();
        if ([401, 403, 429].includes(res.status)) throw new StopSourceError(`HTTP ${res.status} tại ${url} - dừng nguồn (không vượt giới hạn truy cập)`);
        if (/captcha|cf-challenge|verify you are human|đăng nhập để xem/i.test(body.slice(0, 5000)) && res.status !== 200) {
          throw new StopSourceError(`Trang yêu cầu xác minh / đăng nhập tại ${url} - dừng nguồn`);
        }
        if (res.status >= 500 && attempt < this.retries) {
          await sleep(this.delayMs * (attempt + 1));
          continue;
        }
        return { url, finalUrl: res.url || url, status: res.status, contentType: res.headers.get("content-type") ?? "", body };
      } catch (error) {
        if (error instanceof StopSourceError) throw error;
        if (attempt < this.retries) {
          await sleep(this.delayMs * (attempt + 1));
          continue;
        }
        throw error;
      } finally {
        clearTimeout(timer);
      }
    }
  }
}

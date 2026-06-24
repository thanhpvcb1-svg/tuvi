type PagesContext = {
  request: Request;
  waitUntil: (promise: Promise<unknown>) => void;
};

type CloudflareCacheStorage = CacheStorage & { default: Cache };

const CACHE_MAX_AGE_SECONDS = 60 * 60 * 8;
const CACHE_STALE_SECONDS = 60 * 60 * 24;

const ALLOWED_HOSTS = new Set(["tiktok.com", "www.tiktok.com", "vt.tiktok.com"]);

const buildJsonResponse = (status: number, body: Record<string, unknown>, cacheControl = "no-store") =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": cacheControl,
    },
  });

const isAllowedHost = (value: string) => ALLOWED_HOSTS.has(value.toLowerCase());

const normalizeUrl = (value: string) => {
  const parsed = new URL(value);

  if (!isAllowedHost(parsed.hostname)) {
    throw new Error("Domain TikTok không hợp lệ.");
  }

  parsed.hash = "";
  return parsed.toString();
};

const resolveTikTokUrl = async (inputUrl: string) => {
  try {
    const headResponse = await fetch(inputUrl, {
      method: "HEAD",
      redirect: "follow",
      headers: {
        "user-agent": "Mozilla/5.0",
      },
    });

    if (headResponse.url) {
      return normalizeUrl(headResponse.url);
    }
  } catch {
    // Fallback to GET below when HEAD is not supported.
  }

  const getResponse = await fetch(inputUrl, {
    method: "GET",
    redirect: "follow",
    headers: {
      "user-agent": "Mozilla/5.0",
    },
  });

  return normalizeUrl(getResponse.url || inputUrl);
};

export const onRequestGet = async ({ request, waitUntil }: PagesContext) => {
  try {
    const requestUrl = new URL(request.url);
    const rawUrl = requestUrl.searchParams.get("url")?.trim();

    if (!rawUrl) {
      return buildJsonResponse(400, { error: "Thiếu query url." });
    }

    const normalizedInputUrl = normalizeUrl(rawUrl);
    const cache = (globalThis.caches as CloudflareCacheStorage).default;
    const cacheKey = new Request(requestUrl.toString(), { method: "GET" });
    const cachedResponse = await cache.match(cacheKey);

    if (cachedResponse) {
      return cachedResponse;
    }

    const resolvedUrl = await resolveTikTokUrl(normalizedInputUrl);
    const oembedUrl = new URL("https://www.tiktok.com/oembed");
    oembedUrl.searchParams.set("url", resolvedUrl);

    const upstreamResponse = await fetch(oembedUrl.toString(), {
      headers: {
        accept: "application/json",
        "user-agent": "Mozilla/5.0",
      },
    });

    if (!upstreamResponse.ok) {
      return buildJsonResponse(502, { error: "Không thể lấy TikTok oEmbed." });
    }

    const payload = (await upstreamResponse.json()) as Record<string, unknown>;
    const response = buildJsonResponse(
      200,
      {
        title: payload.title || "",
        author_name: payload.author_name || "",
        author_url: payload.author_url || "",
        thumbnail_url: payload.thumbnail_url || "",
        html: payload.html || "",
        provider_name: payload.provider_name || "TikTok",
        provider_url: payload.provider_url || "https://www.tiktok.com",
        resolved_url: resolvedUrl,
      },
      `public, max-age=0, s-maxage=${CACHE_MAX_AGE_SECONDS}, stale-while-revalidate=${CACHE_STALE_SECONDS}`,
    );

    waitUntil(cache.put(cacheKey, response.clone()));
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Không thể xử lý TikTok oEmbed lúc này.";
    return buildJsonResponse(500, { error: message });
  }
};

export const onRequest = onRequestGet;

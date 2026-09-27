type Env = {
  YOUTUBE_LESSONS_CHANNEL_ID?: string;
};

type PagesContext = {
  request: Request;
  env: Env;
  waitUntil: (promise: Promise<unknown>) => void;
};

type LessonItem = {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
  publishedAt: string;
  description: string;
};

type CloudflareCacheStorage = CacheStorage & { default: Cache };

const CACHE_MAX_AGE_SECONDS = 60 * 60 * 8;
const CACHE_STALE_SECONDS = 60 * 60 * 24;

const buildJsonResponse = (status: number, body: Record<string, unknown>, cacheControl = "no-store") =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": cacheControl,
    },
  });

const cleanText = (value: string | null | undefined) => value?.replace(/\s+/g, " ").trim() || "";

const decodeXmlEntities = (value: string) =>
  value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");

const stripHtml = (value: string) => value.replace(/<[^>]+>/g, " ");

const extractTagValue = (input: string, tagName: string) => {
  const directPattern = new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`, "i");
  const namespacePattern = new RegExp(`<[^\\s>:]+:${tagName}>([\\s\\S]*?)<\\/[^\\s>:]+:${tagName}>`, "i");
  const match = directPattern.exec(input) || namespacePattern.exec(input);

  return cleanText(decodeXmlEntities(match?.[1] || ""));
};

const extractAttributeValue = (input: string, tagName: string, attributeName: string) => {
  const directPattern = new RegExp(`<${tagName}\\b[^>]*\\s${attributeName}="([^"]+)"[^>]*\\/?>`, "i");
  const namespacePattern = new RegExp(`<[^\\s>:]+:${tagName}\\b[^>]*\\s${attributeName}="([^"]+)"[^>]*\\/?>`, "i");
  const match = directPattern.exec(input) || namespacePattern.exec(input);

  return cleanText(decodeXmlEntities(match?.[1] || ""));
};

const parseLessonsFeed = (xml: string): LessonItem[] => {
  const entries = xml.match(/<entry\b[\s\S]*?<\/entry>/gi) || [];

  return entries
    .map((entry) => {
      const id = extractTagValue(entry, "videoId") || extractTagValue(entry, "id").split(":").pop() || "";
      const title = extractTagValue(entry, "title");
      const url = extractAttributeValue(entry, "link", "href") || (id ? `https://www.youtube.com/watch?v=${id}` : "");
      const thumbnail = extractAttributeValue(entry, "thumbnail", "url") || (id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : "");
      const publishedAt = extractTagValue(entry, "published");
      const description = cleanText(stripHtml(extractTagValue(entry, "description")));

      return {
        id,
        title,
        url,
        thumbnail,
        publishedAt,
        description,
      };
    })
    .filter((item) => item.id && item.title && item.url);
};

export const onRequestGet = async ({ request, env, waitUntil }: PagesContext) => {
  try {
    const channelId = env.YOUTUBE_LESSONS_CHANNEL_ID?.trim();

    if (!channelId) {
      return buildJsonResponse(500, { error: "Thiếu cấu hình YOUTUBE_LESSONS_CHANNEL_ID." });
    }

    const cache = (globalThis.caches as CloudflareCacheStorage).default;
    const cacheKey = new Request(request.url, { method: "GET" });
    const cachedResponse = await cache.match(cacheKey);

    if (cachedResponse) {
      return cachedResponse;
    }

    const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channelId)}`;
    const upstreamResponse = await fetch(rssUrl, {
      headers: {
        accept: "application/xml,text/xml;q=0.9,*/*;q=0.8",
      },
    });

    if (!upstreamResponse.ok) {
      return buildJsonResponse(502, { error: "Không thể lấy dữ liệu video từ YouTube RSS." });
    }

    const xml = await upstreamResponse.text();
    const items = parseLessonsFeed(xml);
    const response = buildJsonResponse(
      200,
      { items },
      `public, max-age=0, s-maxage=${CACHE_MAX_AGE_SECONDS}, stale-while-revalidate=${CACHE_STALE_SECONDS}`,
    );

    waitUntil(cache.put(cacheKey, response.clone()));
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Không thể xử lý danh sách video lúc này.";
    return buildJsonResponse(500, { error: message });
  }
};

export const onRequest = onRequestGet;

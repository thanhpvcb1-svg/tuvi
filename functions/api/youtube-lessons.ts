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

type XmlParent = Document | Element;
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

const getFirstByLocalName = (parent: XmlParent, localName: string) => {
  const matches = Array.from(parent.getElementsByTagNameNS("*", localName));
  return matches[0] ?? null;
};

const getTextByLocalName = (parent: XmlParent, localName: string) => cleanText(getFirstByLocalName(parent, localName)?.textContent);

const getAttributeByLocalName = (parent: XmlParent, localName: string, attribute: string) =>
  cleanText(getFirstByLocalName(parent, localName)?.getAttribute(attribute));

const parseLessonsFeed = (xml: string): LessonItem[] => {
  const document = new DOMParser().parseFromString(xml, "application/xml");
  const parseError = document.querySelector("parsererror");

  if (parseError) {
    throw new Error("RSS từ YouTube không hợp lệ.");
  }

  return Array.from(document.getElementsByTagNameNS("*", "entry")).map((entry) => {
    const id = getTextByLocalName(entry, "videoId") || getTextByLocalName(entry, "id").split(":").pop() || "";
    const title = getTextByLocalName(entry, "title");
    const url = getAttributeByLocalName(entry, "link", "href") || (id ? `https://www.youtube.com/watch?v=${id}` : "");
    const thumbnail = getAttributeByLocalName(entry, "thumbnail", "url") || (id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : "");
    const publishedAt = getTextByLocalName(entry, "published");
    const description = getTextByLocalName(entry, "description");

    return {
      id,
      title,
      url,
      thumbnail,
      publishedAt,
      description,
    };
  }).filter((item) => item.id && item.title && item.url);
};

export const onRequestGet = async ({ request, env, waitUntil }: PagesContext) => {
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
};

export const onRequest = onRequestGet;

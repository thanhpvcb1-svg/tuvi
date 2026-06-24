import React, { useEffect, useMemo, useState } from "react";
import { manualVideoLessons } from "../data/videoLessons";

type YouTubeLesson = {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
  publishedAt: string;
  description: string;
};

type YouTubeLessonsResponse = {
  items?: YouTubeLesson[];
  error?: string;
};

type TikTokOEmbedResponse = {
  title?: string;
  author_name?: string;
  author_url?: string;
  thumbnail_url?: string;
  html?: string;
  provider_name?: string;
  provider_url?: string;
  resolved_url?: string;
  error?: string;
};

type VideoPlatformFilter = "all" | "youtube" | "tiktok";

type UnifiedVideoLesson = {
  id: string;
  platform: "youtube" | "tiktok";
  title: string;
  url: string;
  category: string;
  source: string;
  author: string;
  isFeatured: boolean;
  thumbnail?: string;
  publishedAt?: string;
  description?: string;
};

type TikTokModalState = {
  lesson: UnifiedVideoLesson | null;
  isLoading: boolean;
  error: string;
  embedHtml: string;
  resolvedUrl: string;
};

const defaultLoadError = "Chưa thể tải danh sách video lúc này.";
const defaultTikTokError = "Chưa thể tải phần xem trước TikTok lúc này.";
const platformFilters: Array<{ id: VideoPlatformFilter; label: string }> = [
  { id: "all", label: "Tất cả" },
  { id: "youtube", label: "YouTube" },
  { id: "tiktok", label: "TikTok" },
];

let tiktokEmbedScriptPromise: Promise<void> | null = null;

const ensureTikTokEmbedScript = () => {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }

  if (tiktokEmbedScriptPromise) {
    return tiktokEmbedScriptPromise;
  }

  tiktokEmbedScriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>('script[data-tiktok-embed-script="true"]');

    if (existingScript) {
      if (existingScript.dataset.loaded === "true") {
        resolve();
      } else {
        existingScript.addEventListener("load", () => resolve(), { once: true });
        existingScript.addEventListener("error", () => reject(new Error("Không thể tải TikTok embed script.")), { once: true });
      }
      return;
    }

    const script = document.createElement("script");
    script.src = "https://www.tiktok.com/embed.js";
    script.async = true;
    script.dataset.tiktokEmbedScript = "true";
    script.addEventListener(
      "load",
      () => {
        script.dataset.loaded = "true";
        resolve();
      },
      { once: true },
    );
    script.addEventListener("error", () => reject(new Error("Không thể tải TikTok embed script.")), { once: true });
    document.body.appendChild(script);
  });

  return tiktokEmbedScriptPromise;
};

const stripScriptTags = (html: string) => html.replace(/<script[\s\S]*?<\/script>/gi, "").trim();

const formatPublishedAt = (value?: string) => {
  if (!value) {
    return "";
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parsed);
};

const trimDescription = (value?: string, maxLength = 180) => {
  const normalized = value?.replace(/\s+/g, " ").trim() || "";

  if (!normalized) {
    return "Xem video để theo dõi nội dung Tử Vi, Bắc Phái và Tứ Hóa Phi Tinh.";
  }

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength).trimEnd()}...`;
};

const getYouTubeVideoFormatLabel = (url: string) => (url.includes("/shorts/") ? "Shorts" : "YouTube");

export default function VideoLessonsPage() {
  const [youtubeItems, setYoutubeItems] = useState<UnifiedVideoLesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [platformFilter, setPlatformFilter] = useState<VideoPlatformFilter>("all");
  const [modalState, setModalState] = useState<TikTokModalState>({
    lesson: null,
    isLoading: false,
    error: "",
    embedHtml: "",
    resolvedUrl: "",
  });
  const [tiktokEmbedCache, setTikTokEmbedCache] = useState<Record<string, TikTokOEmbedResponse>>({});

  const loadLessons = async (signal?: AbortSignal) => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/youtube-lessons", { signal });
      const contentType = response.headers.get("content-type") || "";
      const rawText = await response.text();
      let payload: YouTubeLessonsResponse = {};

      if (rawText) {
        if (contentType.includes("application/json")) {
          payload = JSON.parse(rawText) as YouTubeLessonsResponse;
        } else if (rawText.trim().startsWith("<")) {
          throw new Error("API video chưa hoạt động ở môi trường này hoặc đang bị route SPA ghi đè.");
        } else {
          throw new Error(defaultLoadError);
        }
      }

      if (!response.ok) {
        throw new Error(payload.error || defaultLoadError);
      }

      const normalizedYoutubeItems = Array.isArray(payload.items)
        ? payload.items.map((item) => ({
            id: item.id,
            platform: "youtube" as const,
            title: item.title,
            url: item.url,
            category: "Video",
            source: "YouTube",
            author: "Thiên Ngân Tử",
            isFeatured: false,
            thumbnail: item.thumbnail,
            publishedAt: item.publishedAt,
            description: item.description,
          }))
        : [];

      setYoutubeItems(normalizedYoutubeItems);
    } catch (caughtError) {
      if (signal?.aborted) {
        return;
      }

      const message = caughtError instanceof Error ? caughtError.message : defaultLoadError;
      setError(message);
      setYoutubeItems([]);
    } finally {
      if (!signal?.aborted) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    void loadLessons(controller.signal);

    return () => {
      controller.abort();
    };
  }, []);

  useEffect(() => {
    if (!modalState.embedHtml) {
      return;
    }

    void ensureTikTokEmbedScript().then(() => {
      const maybeReload = (window as Window & { tiktokEmbedLoad?: () => void }).tiktokEmbedLoad;

      if (typeof maybeReload === "function") {
        maybeReload();
      }
    });
  }, [modalState.embedHtml]);

  const allItems = useMemo<UnifiedVideoLesson[]>(
    () =>
      [
        ...manualVideoLessons,
        ...youtubeItems,
      ].sort((left, right) => {
        if (left.isFeatured !== right.isFeatured) {
          return left.isFeatured ? -1 : 1;
        }

        return right.title.localeCompare(left.title, "vi");
      }),
    [youtubeItems],
  );

  const filteredItems = useMemo(() => {
    if (platformFilter === "all") {
      return allItems;
    }

    return allItems.filter((item) => item.platform === platformFilter);
  }, [allItems, platformFilter]);

  const openTikTokModal = async (lesson: UnifiedVideoLesson) => {
    const cachedPayload = tiktokEmbedCache[lesson.url];

    if (cachedPayload) {
      setModalState({
        lesson,
        isLoading: false,
        error: cachedPayload.error || "",
        embedHtml: stripScriptTags(cachedPayload.html || ""),
        resolvedUrl: cachedPayload.resolved_url || lesson.url,
      });
      return;
    }

    setModalState({
      lesson,
      isLoading: true,
      error: "",
      embedHtml: "",
      resolvedUrl: lesson.url,
    });

    try {
      const response = await fetch(`/api/tiktok-oembed?url=${encodeURIComponent(lesson.url)}`);
      const contentType = response.headers.get("content-type") || "";
      const rawText = await response.text();
      let payload: TikTokOEmbedResponse = {};

      if (rawText) {
        if (contentType.includes("application/json")) {
          try {
            payload = JSON.parse(rawText) as TikTokOEmbedResponse;
          } catch {
            throw new Error("API TikTok trả về JSON không hợp lệ.");
          }
        } else if (rawText.trim().startsWith("<")) {
          throw new Error("API TikTok chưa hoạt động ở môi trường này hoặc đang bị route SPA ghi đè.");
        } else {
          throw new Error(defaultTikTokError);
        }
      }

      if (!response.ok) {
        throw new Error(payload.error || defaultTikTokError);
      }

      setTikTokEmbedCache((current) => ({ ...current, [lesson.url]: payload }));
      setModalState({
        lesson,
        isLoading: false,
        error: "",
        embedHtml: stripScriptTags(payload.html || ""),
        resolvedUrl: payload.resolved_url || lesson.url,
      });
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : defaultTikTokError;
      setTikTokEmbedCache((current) => ({ ...current, [lesson.url]: { error: message } }));
      setModalState({
        lesson,
        isLoading: false,
        error: message,
        embedHtml: "",
        resolvedUrl: lesson.url,
      });
    }
  };

  const closeModal = () => {
    setModalState({
      lesson: null,
      isLoading: false,
      error: "",
      embedHtml: "",
      resolvedUrl: "",
    });
  };

  return (
    <div className="home-page">
      <section className="content-section">
        <div className="section-heading bai-hoc-ngan-hero">
          <p className="eyebrow">Video</p>
          <h1>Video</h1>
          <p>Tổng hợp video ngắn về Tử Vi, Bắc Phái, Tứ Hóa Phi Tinh và luận giải mệnh bàn.</p>
        </div>

        <div className="video-platform-filters" aria-label="Lọc theo nền tảng">
          {platformFilters.map((filter) => (
            <button
              key={filter.id}
              type="button"
              className={`video-platform-filter${platformFilter === filter.id ? " is-active" : ""}`}
              onClick={() => setPlatformFilter(filter.id)}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {isLoading ? <div className="youtube-lessons-feedback youtube-lessons-feedback--loading">Đang tải danh sách video mới nhất...</div> : null}

        {!isLoading && error ? (
          <div className="youtube-lessons-feedback youtube-lessons-feedback--error" role="alert">
            <p>{error}</p>
            <button type="button" className="primary-button youtube-lessons-retry" onClick={() => void loadLessons()}>
              Thử tải lại
            </button>
          </div>
        ) : null}

        {!isLoading && !error && filteredItems.length === 0 ? (
          <div className="youtube-lessons-feedback" role="status">
            Chưa có video nào phù hợp với bộ lọc hiện tại.
          </div>
        ) : null}

        {!error && filteredItems.length > 0 ? (
          <div className="youtube-lessons-grid">
            {filteredItems.map((item) => (
              <article key={item.id} className="youtube-lesson-card">
                {item.platform === "youtube" ? (
                  <a
                    className="youtube-lesson-thumb"
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Mở video ${item.title} trên YouTube`}
                  >
                    <span className="youtube-lesson-format">{getYouTubeVideoFormatLabel(item.url)}</span>
                    <span className="youtube-lesson-play" aria-hidden="true">
                      Xem
                    </span>
                    <img src={item.thumbnail} alt={item.title} loading="lazy" />
                  </a>
                ) : (
                  <div className="youtube-lesson-thumb youtube-lesson-thumb--tiktok" aria-hidden="true">
                    <span className="youtube-lesson-format youtube-lesson-format--tiktok">TikTok</span>
                    <span className="youtube-lesson-play" aria-hidden="true">
                      Video ngắn
                    </span>
                    <div className="youtube-lesson-tiktok-mark">
                      <strong>TikTok</strong>
                      <span>Thiên Ngân Tử</span>
                    </div>
                  </div>
                )}

                <div className="youtube-lesson-body">
                  <div className="youtube-lesson-meta">
                    <p className="youtube-lesson-date">
                      {item.platform === "youtube"
                        ? formatPublishedAt(item.publishedAt) || "Đang cập nhật ngày đăng"
                        : item.category}
                    </p>
                    <span className="youtube-lesson-source">{item.author}</span>
                  </div>
                  <div className="youtube-lesson-pill-row">
                    <span className={`youtube-lesson-platform-badge youtube-lesson-platform-badge--${item.platform}`}>
                      {item.platform === "youtube" ? "YouTube" : "TikTok"}
                    </span>
                    <span className="youtube-lesson-category">{item.category}</span>
                  </div>
                  <h2>{item.title}</h2>
                  <p className="youtube-lesson-description">{trimDescription(item.description)}</p>
                  <div className="youtube-lesson-actions">
                    {item.platform === "tiktok" ? (
                      <>
                        <button type="button" className="youtube-lesson-link" onClick={() => void openTikTokModal(item)}>
                          Xem video
                        </button>
                        <a className="youtube-lesson-link youtube-lesson-link--secondary" href={item.url} target="_blank" rel="noreferrer">
                          Mở trên TikTok
                        </a>
                      </>
                    ) : (
                      <a className="youtube-lesson-link" href={item.url} target="_blank" rel="noreferrer">
                        Xem trên YouTube
                      </a>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : null}

        <div className="youtube-lessons-note">
          <p>Video được dẫn nguồn từ kênh YouTube Thiên Ngân Tử. Nội dung thuộc về chủ sở hữu kênh.</p>
          <p>Video được dẫn nguồn từ TikTok. Nội dung thuộc về chủ sở hữu kênh.</p>
        </div>
      </section>

      {modalState.lesson ? (
        <div className="video-embed-modal" role="dialog" aria-modal="true" aria-label={modalState.lesson.title}>
          <div className="video-embed-backdrop" onClick={closeModal} />
          <div className="video-embed-panel">
            <button type="button" className="video-embed-close" onClick={closeModal} aria-label="Đóng cửa sổ video">
              ×
            </button>
            <div className="video-embed-header">
              <span className="youtube-lesson-platform-badge youtube-lesson-platform-badge--tiktok">TikTok</span>
              <h2>{modalState.lesson.title}</h2>
              <p>{modalState.lesson.author}</p>
            </div>

            {modalState.isLoading ? <div className="video-embed-feedback">Đang tải TikTok oEmbed...</div> : null}

            {!modalState.isLoading && modalState.error ? (
              <div className="video-embed-feedback video-embed-feedback--error">
                <p>{modalState.error}</p>
                <a className="youtube-lesson-link" href={modalState.lesson.url} target="_blank" rel="noreferrer">
                  Mở trên TikTok
                </a>
              </div>
            ) : null}

            {!modalState.isLoading && !modalState.error && modalState.embedHtml ? (
              <div className="video-embed-body">
                <div
                  className="video-embed-html"
                  dangerouslySetInnerHTML={{ __html: modalState.embedHtml }}
                />
                <a className="youtube-lesson-link youtube-lesson-link--secondary" href={modalState.resolvedUrl || modalState.lesson.url} target="_blank" rel="noreferrer">
                  Mở trên TikTok
                </a>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

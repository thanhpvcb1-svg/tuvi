import React, { useEffect, useState } from "react";

export type YouTubeLesson = {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
  publishedAt: string;
  description: string;
};

type LessonsResponse = {
  items?: YouTubeLesson[];
  error?: string;
};

const defaultLoadError = "Chưa thể tải danh sách video lúc này.";

const formatPublishedAt = (value: string) => {
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

const trimDescription = (value: string, maxLength = 180) => {
  const normalized = value.replace(/\s+/g, " ").trim();

  if (!normalized) {
    return "Xem video để theo dõi bài học ngắn về Tử Vi, Bắc Phái và Tứ Hóa Phi Tinh.";
  }

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength).trimEnd()}...`;
};

export default function YouTubeLessonsPage() {
  const [items, setItems] = useState<YouTubeLesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadLessons = async (signal?: AbortSignal) => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/youtube-lessons", { signal });
      const contentType = response.headers.get("content-type") || "";
      const rawText = await response.text();
      let payload: LessonsResponse = {};

      if (rawText) {
        if (contentType.includes("application/json")) {
          try {
            payload = JSON.parse(rawText) as LessonsResponse;
          } catch {
            throw new Error("API bài học ngắn trả về JSON không hợp lệ.");
          }
        } else if (rawText.trim().startsWith("<")) {
          throw new Error("API bài học ngắn chưa hoạt động ở môi trường này hoặc đang bị route SPA ghi đè.");
        } else {
          throw new Error(defaultLoadError);
        }
      }

      if (!response.ok) {
        throw new Error(payload.error || defaultLoadError);
      }

      setItems(Array.isArray(payload.items) ? payload.items : []);
    } catch (caughtError) {
      if (signal?.aborted) {
        return;
      }

      const message = caughtError instanceof Error ? caughtError.message : defaultLoadError;
      setError(message);
      setItems([]);
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

  return (
    <div className="home-page">
      <section className="content-section">
        <div className="section-heading bai-hoc-ngan-hero">
          <p className="eyebrow">Bài học ngắn</p>
          <h1>Bài học ngắn về Tử Vi</h1>
          <p>Tổng hợp video học Tử Vi, Bắc Phái, Tứ Hóa Phi Tinh và các ghi chú thực hành ngắn gọn để bạn xem nhanh theo từng chủ đề.</p>
        </div>

        {isLoading ? (
          <div className="youtube-lessons-feedback youtube-lessons-feedback--loading" role="status">
            Đang tải danh sách video mới nhất...
          </div>
        ) : null}

        {!isLoading && error ? (
          <div className="youtube-lessons-feedback youtube-lessons-feedback--error" role="alert">
            <p>{error}</p>
            <button type="button" className="primary-button youtube-lessons-retry" onClick={() => void loadLessons()}>
              Thử tải lại
            </button>
          </div>
        ) : null}

        {!isLoading && !error && items.length === 0 ? (
          <div className="youtube-lessons-feedback" role="status">
            Chưa có video nào để hiển thị. Vui lòng quay lại sau.
          </div>
        ) : null}

        {!error && items.length > 0 ? (
          <div className="youtube-lessons-grid">
            {items.map((item) => (
              <article key={item.id} className="youtube-lesson-card">
                <a
                  className="youtube-lesson-thumb"
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Mở video ${item.title} trên YouTube`}
                >
                  <img src={item.thumbnail} alt={item.title} loading="lazy" />
                </a>
                <div className="youtube-lesson-body">
                  <p className="youtube-lesson-date">{formatPublishedAt(item.publishedAt) || "Đang cập nhật ngày đăng"}</p>
                  <h2>{item.title}</h2>
                  <p>{trimDescription(item.description)}</p>
                  <a className="youtube-lesson-link" href={item.url} target="_blank" rel="noreferrer">
                    Xem trên YouTube
                  </a>
                </div>
              </article>
            ))}
          </div>
        ) : null}

        <div className="youtube-lessons-note">
          Video được dẫn nguồn từ kênh YouTube Thiên Ngân Tử. Nội dung thuộc về chủ sở hữu kênh.
        </div>
      </section>
    </div>
  );
}

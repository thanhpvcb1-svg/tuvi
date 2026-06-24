import React from "react";
import { getKnowledgeArticleHref, type KnowledgeArticle } from "../content/bacPhaiLibrary";

type Props = {
  article: KnowledgeArticle;
  relatedArticles: KnowledgeArticle[];
};

const splitParagraphs = (value: string) =>
  value
    .split("\n\n")
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

export default function BacPhaiArticlePage({ article, relatedArticles }: Props) {
  return (
    <section className="content-section">
      <div className="section-heading article-hero library-article-hero">
        <p className="eyebrow">{article.category}</p>
        <h1>{article.title}</h1>
        <p>{article.summary}</p>
        <div className="library-article-meta">
          <span>{article.level}</span>
          <span>{article.readingTime}</span>
          <span>{article.tags.slice(0, 2).join(" · ")}</span>
        </div>
      </div>

      <div className="article-layout">
        <article className="article-content-card library-article-content">
          <div className="library-read-why">
            <p className="eyebrow">Vì sao bài này đáng đọc?</p>
            <p>{article.curiosityHook}</p>
          </div>

          {article.content.map((section) => (
            <section key={`${article.id}-${section.heading}`} className="library-content-section">
              <h2>{section.heading}</h2>
              {splitParagraphs(section.body).map((paragraph) => (
                <p key={`${article.id}-${section.heading}-${paragraph.slice(0, 24)}`}>{paragraph}</p>
              ))}
            </section>
          ))}

          <div className="library-application-box">
            <p className="eyebrow">{article.applicationBox.title}</p>
            <p>{article.applicationBox.body}</p>
          </div>

          <div className="library-source-box">
            <p className="eyebrow">Tài liệu dẫn</p>
            <div className="library-source-list">
              {article.sourceRefs.map((source) => (
                <article key={`${article.id}-${source.title}`} className="library-source-item">
                  {source.href ? (
                    <a href={source.href} target="_blank" rel="noreferrer">
                      {source.title}
                    </a>
                  ) : (
                    <strong>{source.title}</strong>
                  )}
                  <p>{source.note}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="library-cta-box">
            <h3>Muốn đối chiếu lý thuyết với lá số thật?</h3>
            <p>Mở lá số của bạn để xem các điểm trong bài viết xuất hiện như thế nào trên đúng dữ liệu sinh cá nhân.</p>
            <a href={article.cta.href} className="primary-button">
              {article.cta.label}
            </a>
          </div>
        </article>

        <aside className="article-sidebar">
          <div className="article-side-card">
            <p className="eyebrow">Liên kết nhanh</p>
            <h3>Tiếp tục trong thư viện</h3>
            <a
              href="/bai-viet"
              className="ghost-button"
              style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
            >
              Quay lại bài viết
            </a>
            <a
              href="/lap-la-so"
              className="primary-button"
              style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
            >
              Lập lá số miễn phí
            </a>
          </div>

          <div className="article-side-card">
            <p className="eyebrow">Đọc tiếp</p>
            <h3>Bài cùng mạch</h3>
            <div className="article-related-list">
              {relatedArticles.map((relatedArticle) => (
                <a key={relatedArticle.id} href={getKnowledgeArticleHref(relatedArticle.slug)} className="article-related-link">
                  <strong>{relatedArticle.title}</strong>
                  <span>{relatedArticle.summary}</span>
                </a>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

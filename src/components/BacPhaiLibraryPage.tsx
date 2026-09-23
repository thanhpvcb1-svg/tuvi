import React, { useMemo, useState } from "react";
import {
  getKnowledgeArticleHref,
  knowledgeCategories,
  knowledgeLevels,
  type KnowledgeArticle,
} from "../content/bacPhaiLibrary";

type Props = {
  articles: KnowledgeArticle[];
};

const normalizeSearch = (value: string) => value.trim().toLowerCase();

const learningPaths = [
  {
    title: "Người mới bắt đầu",
    description: "Đọc các bài nhập môn để hiểu Mệnh, Thân, 12 cung và cách đặt câu hỏi khi xem lá số.",
  },
  {
    title: "Muốn đọc vận hạn",
    description: "Ưu tiên các bài về đại vận, lưu niên, Tứ Hóa và cách đặt năm đang xem vào bối cảnh toàn cục.",
  },
  {
    title: "Tìm hiểu Bắc Phái",
    description: "Đi sâu vào can cung, Phi Hóa, Lai Nhân Cung và các quy tắc cần đọc cùng nhau.",
  },
];

export default function BacPhaiLibraryPage({ articles }: Props) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Tất cả");
  const [level, setLevel] = useState("Tất cả");

  const filteredArticles = useMemo(() => {
    const normalizedQuery = normalizeSearch(query);

    return articles.filter((article) => {
      const matchesQuery =
        !normalizedQuery ||
        [
          article.title,
          article.summary,
          article.curiosityHook,
          article.category,
          article.level,
          article.tags.join(" "),
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);

      const matchesCategory = category === "Tất cả" || article.category === category;
      const matchesLevel = level === "Tất cả" || article.level === level;

      return matchesQuery && matchesCategory && matchesLevel;
    });
  }, [articles, category, level, query]);

  return (
    <section className="content-section">
      <div className="library-hero">
        <p className="eyebrow">Bài viết</p>
        <h1>Thư viện bài viết</h1>
        <p>Những bài đọc nền tảng về Tử Vi Bắc Phái, Tứ Hóa Phi Tinh, can cung, đại vận và lưu niên.</p>
      </div>

      <div className="seo-copy-grid library-path-grid">
        {learningPaths.map((path) => (
          <article key={path.title} className="seo-copy-card">
            <h2>{path.title}</h2>
            <p>{path.description}</p>
          </article>
        ))}
      </div>

      <div className="library-toolbar">
        <label className="library-search">
          <span>Tìm bài đọc</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm theo tiêu đề, chủ đề, từ khóa..."
          />
        </label>
        <label className="library-filter">
          <span>Phân loại</span>
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="Tất cả">Tất cả</option>
            {knowledgeCategories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label className="library-filter">
          <span>Cấp độ</span>
          <select value={level} onChange={(event) => setLevel(event.target.value)}>
            <option value="Tất cả">Tất cả</option>
            {knowledgeLevels.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="library-results-bar">
        <strong>{filteredArticles.length}</strong>
        <span>bài đang hiển thị</span>
        <p>Thư viện đi theo lối viết dễ đọc, nhấn vào quy tắc và cách áp dụng vào lá số thay vì đưa ra kết luận tuyệt đối.</p>
      </div>

      {filteredArticles.length === 0 ? (
        <div className="library-empty-state">Không tìm thấy bài phù hợp với bộ lọc hiện tại. Hãy thử đổi từ khóa hoặc chọn lại cấp độ đọc.</div>
      ) : (
        <div className="library-card-grid">
          {filteredArticles.map((article) => (
            <a key={article.id} href={getKnowledgeArticleHref(article.slug)} className="library-card-link">
              <article className="library-card">
                <div className="library-card-meta">
                  <span>{article.category}</span>
                  <span>{article.level}</span>
                  <span>{article.readingTime}</span>
                </div>
                <h2>{article.title}</h2>
                <p className="library-card-summary">{article.summary}</p>
                <div className="library-curiosity-box">
                  <strong>Gợi mở</strong>
                  <p>{article.curiosityHook}</p>
                </div>
                <div className="library-tag-list">
                  {article.tags.map((tag) => (
                    <span key={`${article.id}-${tag}`} className="library-tag">
                      {tag}
                    </span>
                  ))}
                </div>
              </article>
            </a>
          ))}
        </div>
      )}
    </section>
  );
}

import React from "react";
import { useLocation } from "react-router-dom";
import BacPhaiArticlePage from "../components/BacPhaiArticlePage";
import BacPhaiLibraryPage from "../components/BacPhaiLibraryPage";
import SEOHead from "../components/SEOHead";
import { findKnowledgeArticleByPath, knowledgeArticles } from "../content/bacPhaiLibrary";
import { organizationSchema, articleListSchema, breadcrumbSchema, articleSchema } from "../schemas/seoSchemas";

export default function BlogPage() {
  const location = useLocation();
  const currentArticle = findKnowledgeArticleByPath(location.pathname);
  const relatedArticles = currentArticle
    ? knowledgeArticles.filter((article) => article.id !== currentArticle.id).slice(0, 3)
    : [];

  if (currentArticle) {
    return (
      <div className="home-page">
        <SEOHead
          title={`${currentArticle.title} | Kiến Thức Tử Vi | TuViPhongLam`}
          description={currentArticle.summary}
          canonicalPath={`/bai-viet/${currentArticle.slug}`}
          schema={[
            organizationSchema,
            articleSchema(currentArticle),
            breadcrumbSchema([
              { name: "Trang chủ", path: "/" },
              { name: "Bài viết", path: "/bai-viet" },
              { name: currentArticle.title, path: `/bai-viet/${currentArticle.slug}` },
            ]),
          ]}
        />
        <BacPhaiArticlePage article={currentArticle} relatedArticles={relatedArticles} />
      </div>
    );
  }

  return (
    <div className="home-page">
      <SEOHead
        title="Kiến Thức Tử Vi Bắc Phái - Tứ Hóa Phi Tinh | TuViPhongLam"
        description="Tổng hợp bài viết chuyên sâu về Tử Vi Bắc Phái, Tứ Hóa Phi Tinh, cách đọc Mệnh Thân, đại vận lưu niên."
        canonicalPath="/bai-viet"
        schema={[
          organizationSchema,
          articleListSchema,
          breadcrumbSchema([{ name: "Trang chủ", path: "/" }, { name: "Bài viết", path: "/bai-viet" }]),
        ]}
      />
      <BacPhaiLibraryPage articles={knowledgeArticles} />
    </div>
  );
}

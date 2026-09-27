import React from "react";
import { useLocation } from "react-router-dom";
import BacPhaiArticlePage from "../components/BacPhaiArticlePage";
import BacPhaiLibraryPage from "../components/BacPhaiLibraryPage";
import Breadcrumb from "../components/Breadcrumb";
import SEOHead from "../components/SEOHead";
import NotFoundPage from "./NotFoundPage";
import { articleMetaDescription, articlePageTitle, findKnowledgeArticleByPath, getRelatedArticles, knowledgeArticles } from "../content/bacPhaiLibrary";
import { organizationSchema, articleListSchema, breadcrumbSchema, articleSchema } from "../schemas/seoSchemas";

export default function BlogPage() {
  const location = useLocation();
  const currentArticle = findKnowledgeArticleByPath(location.pathname);
  const relatedArticles = currentArticle ? getRelatedArticles(currentArticle) : [];

  const isArticlePath = /^\/(bai-viet|blog|kien-thuc)\/[^/]+/.test(location.pathname);
  if (!currentArticle && isArticlePath) {
    return <NotFoundPage />;
  }

  if (currentArticle) {
    return (
      <div className="home-page">
        <SEOHead
          title={articlePageTitle(currentArticle)}
          description={articleMetaDescription(currentArticle)}
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
        <Breadcrumb items={[
          { label: "Trang chủ", path: "/" },
          { label: "Bài viết", path: "/bai-viet" },
          { label: currentArticle.title },
        ]} />
        <BacPhaiArticlePage article={currentArticle} relatedArticles={relatedArticles} />
      </div>
    );
  }

  return (
    <div className="home-page">
      <SEOHead
        title="Kiến Thức Tử Vi Bắc Phái - Tứ Hóa Phi Tinh | Tử Vi Phong Lam"
        description="Bài viết nền tảng về Tử Vi Bắc Phái: 12 cung, cung Mệnh, cung Thân, Tứ Hóa Phi Tinh, tự hóa, đại vận và lưu niên."
        canonicalPath="/bai-viet"
        schema={[
          organizationSchema,
          articleListSchema,
          breadcrumbSchema([{ name: "Trang chủ", path: "/" }, { name: "Bài viết", path: "/bai-viet" }]),
        ]}
      />
      <Breadcrumb items={[
        { label: "Trang chủ", path: "/" },
        { label: "Bài viết" },
      ]} />
      <BacPhaiLibraryPage articles={knowledgeArticles} />
    </div>
  );
}

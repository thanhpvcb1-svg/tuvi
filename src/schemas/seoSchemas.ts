/**
 * SEO Schema definitions for structured data
 */

import { knowledgeArticles } from "../content/bacPhaiLibrary";
import { primaryPlans } from "../components/PremiumPlans";

const siteUrl = "https://tuviphonglam.com";
// URL trang luôn có "/" cuối để khớp canonical (xem SEOHead.tsx).
const pageUrl = (path: string) => `${siteUrl}${path.endsWith("/") ? path : `${path}/`}`;
// @id chung để Google gộp Organization/WebSite khai báo ở index.html và ở từng trang thành một thực thể.
const organizationId = `${siteUrl}/#organization`;
const contactEmail = import.meta.env.VITE_CONTACT_EMAIL?.trim() || "";

// ============ BASE SCHEMAS ============

export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${siteUrl}/#website`,
  name: "Tử Vi Phong Lam",
  url: siteUrl,
  inLanguage: "vi-VN",
  description: "Lập lá số tử vi online miễn phí theo ngày giờ sinh",
};

export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": organizationId,
  name: "Tử Vi Phong Lam",
  url: siteUrl,
  logo: `${siteUrl}/favicon.svg`,
  description: "Nền tảng lập lá số tử vi online và luận giải theo Bắc Phái.",
  ...(contactEmail ? { email: contactEmail } : {}),
};

// ============ PAGE SCHEMAS ============

export const contactPageSchema = {
  "@context": "https://schema.org",
  "@type": "ContactPage",
  name: "Liên hệ luận giải lá số",
  url: pageUrl(`/lien-he`),
  about: {
    "@type": "Service",
    name: "Hỗ trợ luận giải lá số tử vi",
  },
};

export const softwareAppSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Công Cụ Lập Lá Số Tử Vi Online",
  applicationCategory: "LifestyleApplication",
  operatingSystem: "Web Browser",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "VND",
  },
  description: "Công cụ lập lá số tử vi online miễn phí theo ngày giờ sinh. Xem Mệnh, Thân, 12 cung, đại vận, tiểu vận.",
  url: pageUrl(`/lap-la-so`),
  provider: {
    "@type": "Organization",
    name: "Tử Vi Phong Lam",
    url: siteUrl,
  },
};

export const compatibilityGuideSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Xem Hợp Tuổi Vợ Chồng Theo Lá Số Tử Vi",
  description: "So khớp hợp tuổi tình cảm, hôn nhân, hợp tác theo lá số tử vi. Đối chiếu Mệnh, Thân, cung Phu Thê.",
  provider: {
    "@type": "Organization",
    name: "Tử Vi Phong Lam",
    url: siteUrl,
  },
  serviceType: "Tư vấn hợp tuổi tử vi",
  areaServed: "VN",
};

export const articleListSchema = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Kiến Thức Tử Vi Bắc Phái - Tứ Hóa Phi Tinh",
  description: "Tổng hợp bài viết chuyên sâu về Tử Vi Bắc Phái, Tứ Hóa Phi Tinh, cách đọc Mệnh Thân, đại vận lưu niên.",
  url: pageUrl(`/bai-viet`),
  mainEntity: {
    "@type": "ItemList",
    itemListElement: knowledgeArticles.slice(0, 10).map((article, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: pageUrl(`/bai-viet/${article.slug}`),
      name: article.title,
    })),
  },
};

export const videoGallerySchema = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Video Học Tử Vi Bắc Phái - Tứ Hóa Phi Tinh",
  description: "Tổng hợp video ngắn hướng dẫn Tử Vi Bắc Phái, Tứ Hóa Phi Tinh, cách đọc lá số dễ hiểu cho người mới.",
  url: pageUrl(`/video`),
};

// ============ DYNAMIC SCHEMAS ============

export const pricingServiceSchemas = primaryPlans
  .filter((plan) => plan.price !== "0đ")
  .map((plan) => ({
    "@context": "https://schema.org",
    "@type": "Service",
    name: plan.name,
    description: plan.description,
    provider: {
      "@type": "Organization",
      name: "Tử Vi Phong Lam",
      url: siteUrl,
    },
    offers: {
      "@type": "Offer",
      priceCurrency: "VND",
      price: plan.price.replace(/[^\d]/g, ""),
      availability: "https://schema.org/InStock",
      url: pageUrl(`/bang-gia`),
    },
  }));

export const productSchemas = primaryPlans.map((plan) => ({
  "@context": "https://schema.org",
  "@type": "Product",
  name: plan.name,
  description: plan.description,
  brand: {
    "@type": "Brand",
    name: "Tử Vi Phong Lam",
  },
  offers: {
    "@type": "Offer",
    price: plan.price.replace(/[^\d]/g, "") || "0",
    priceCurrency: "VND",
    availability: "https://schema.org/InStock",
    url: pageUrl(`/bang-gia`),
    seller: {
      "@type": "Organization",
      name: "Tử Vi Phong Lam",
    },
  },
}));

// ============ HELPER FUNCTIONS ============

export type FaqItem = { question: string; answer: string };

export const faqSchema = (items: FaqItem[]) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: items.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer,
    },
  })),
});

export const breadcrumbSchema = (items: Array<{ name: string; path: string }>) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    item: pageUrl(item.path),
  })),
});

export const articleSchema = (article: { title: string; summary: string; slug: string }) => ({
  "@context": "https://schema.org",
  "@type": "Article",
  headline: article.title,
  description: article.summary,
  mainEntityOfPage: pageUrl(`/bai-viet/${article.slug}`),
  author: {
    "@type": "Organization",
    name: "Tử Vi Phong Lam",
  },
  publisher: {
    "@type": "Organization",
    name: "Tử Vi Phong Lam",
    logo: {
      "@type": "ImageObject",
      url: `${siteUrl}/favicon.svg`,
    },
  },
});

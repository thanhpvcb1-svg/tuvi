import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { buildSync } from "esbuild";

const distDir = path.resolve("dist");
const indexPath = path.join(distDir, "index.html");
const siteUrl = "https://tuviphonglam.com";
const organizationId = `${siteUrl}/#organization`;

// Cloudflare Pages 308-redirect "/x" -> "/x/" cho route có dist/x/index.html,
// nên canonical/og:url/hreflang dùng dạng có "/" cuối (khớp SEOHead.tsx).
const pageUrl = (route) => `${siteUrl}${route.endsWith("/") ? route : `${route}/`}`;

const escapeHtml = (value) =>
  String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Cùng nguồn dữ liệu với src/utils/appUtils.ts -> ChartPage, để HTML tĩnh không lệch với bản React.
const lapLaSoContent = JSON.parse(fs.readFileSync(path.resolve("src/content/lapLaSoContent.json"), "utf8"));

// Nạp module TypeScript của src/ lúc build (esbuild) để HTML tĩnh dùng đúng dữ liệu / engine của bản React.
const loadTsModule = (buildOptions) => {
  const result = buildSync({
    bundle: true,
    platform: "node",
    format: "cjs",
    write: false,
    logLevel: "silent",
    define: { "import.meta.env": "{}" },
    ...buildOptions,
  });
  const module = { exports: {} };
  new Function("module", "exports", "require", result.outputFiles[0].text)(module, module.exports, createRequire(import.meta.url));
  return module.exports;
};
const library = loadTsModule({ entryPoints: [path.resolve("src/content/bacPhaiLibrary.ts")] });
const knowledgeArticles = library.knowledgeArticles ?? [];
const { articlePageTitle, articleMetaDescription, formatArticleDate, getRelatedArticles } = library;
const { homeFaqs, faqPageGroups, faqPageItems } = loadTsModule({ entryPoints: [path.resolve("src/utils/appUtils.ts")] });
const { manualVideoLessons } = loadTsModule({ entryPoints: [path.resolve("src/data/videoLessons.ts")] });

// Trang pháp lý: render đúng component React ra HTML tĩnh (một nguồn nội dung)
const legalModule = loadTsModule({
  stdin: {
    contents: `import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import PrivacyPolicyPage from "./src/components/PrivacyPolicyPage";
import TermsPage from "./src/components/TermsPage";
export const privacyHtml = renderToStaticMarkup(React.createElement(PrivacyPolicyPage));
export const termsHtml = renderToStaticMarkup(React.createElement(TermsPage));`,
    resolveDir: path.resolve("."),
    loader: "tsx",
  },
  jsx: "automatic",
});

// Ngày cập nhật nội dung các trang không phải bài viết (dùng cho sitemap lastmod) - đổi khi sửa nội dung trang
const PAGES_UPDATED = "2026-09-27";
const homeContent = JSON.parse(fs.readFileSync(path.resolve("src/content/homeContent.json"), "utf8"));

// Lá số mẫu /la-so-mau: an bằng đúng engine của trang lập lá số (chỉ đọc kết quả, không tính lại sao)
const demoModule = loadTsModule({
  stdin: {
    contents: `export { createChart } from "./src/lib/iztroEngine";
export { deriveDemoData, describeMainStars, DEMO_NORMALIZED_INPUT, DEMO_LABEL, DEMO_HOUR_LABEL, PALACE_ORDER } from "./src/content/demoChart";`,
    resolveDir: path.resolve("."),
    loader: "ts",
  },
});


const paragraphs = (text) =>
  String(text || "")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${escapeHtml(p)}</p>`)
    .join("\n          ");

const renderArticleBody = (article) => {
  return `
      <main class="prerender-shell">
        <article class="prerender-hero">
          <h1>${escapeHtml(article.title)}</h1>
          <p>${escapeHtml(article.summary)}</p>
          ${(article.content ?? []).map((block) => `<h2>${escapeHtml(block.heading)}</h2>\n          ${paragraphs(block.body)}`).join("\n          ")}
          <h2>${escapeHtml(article.applicationBox?.title ?? "Ứng dụng vào lá số")}</h2>
          ${paragraphs(article.applicationBox?.body)}
          <p>Biên soạn: Tử Vi Phong Lam · Đăng <time datetime="${article.publishedAt}">${formatArticleDate(article.publishedAt)}</time>${article.updatedAt !== article.publishedAt ? ` · Cập nhật <time datetime="${article.updatedAt}">${formatArticleDate(article.updatedAt)}</time>` : ""} · Nội dung mang tính tham khảo, chưa thay thế ý kiến chuyên gia.</p>
          <div class="prerender-actions">
            <a href="${escapeHtml(article.cta?.href ?? "/lap-la-so")}/">${escapeHtml(article.cta?.label ?? "Lập lá số miễn phí")}</a>
            <a href="/bai-viet/" class="secondary">Các bài viết khác</a>
          </div>
        </article>
        <section class="prerender-section">
          <h2>Đọc tiếp</h2>
          <ul>
            ${articleLinks(getRelatedArticles(article))}
          </ul>
        </section>
      </main>
    `;
};

const buildWebPageSchema = (page) =>
  page.article
    ? {
        // Khớp articleSchema (src/schemas/seoSchemas.ts)
        "@context": "https://schema.org",
        "@type": "Article",
        headline: page.article.title,
        description: page.article.summary,
        url: pageUrl(page.route),
        mainEntityOfPage: pageUrl(page.route),
        inLanguage: "vi-VN",
        datePublished: page.article.publishedAt,
        dateModified: page.article.updatedAt,
        image: `${siteUrl}/og-image.png`,
        author: { "@type": "Organization", name: "Tử Vi Phong Lam", url: siteUrl },
        publisher: { "@id": organizationId },
        isPartOf: { "@id": `${siteUrl}/#website` },
      }
    : {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: page.title,
        description: page.description,
        url: pageUrl(page.route),
        inLanguage: "vi-VN",
        isPartOf: { "@id": `${siteUrl}/#website` },
        publisher: { "@id": organizationId },
      };

const lapLaSoSchemas = [
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Công Cụ Lập Lá Số Tử Vi Online",
    applicationCategory: "LifestyleApplication",
    operatingSystem: "Web Browser",
    offers: { "@type": "Offer", price: "0", priceCurrency: "VND" },
    description: "Công cụ lập lá số tử vi online miễn phí theo ngày giờ sinh. Xem Mệnh, Thân, 12 cung, đại vận, tiểu vận.",
    url: pageUrl("/lap-la-so"),
    provider: { "@id": organizationId },
  },
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Trang chủ", item: pageUrl("/") },
      { "@type": "ListItem", position: 2, name: "Lập lá số", item: pageUrl("/lap-la-so") },
    ],
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: lapLaSoContent.lapLaSoFaqs.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  },
];

const c = lapLaSoContent;
const li = (items) => items.join("\n            ");
const lapLaSoBody = `
      <main class="prerender-shell">
        <section class="prerender-hero">
          <h1>${escapeHtml(c.hero.title)}</h1>
          <p>${escapeHtml(c.hero.subtitle)}</p>
          <div class="prerender-actions">
            <a href="#lap-la-so-form">Lập lá số ngay</a>
            <a href="/la-so-mau/" class="secondary">Xem lá số mẫu</a>
          </div>
        </section>
        <section id="lap-la-so-form" class="prerender-section">
          <h2>${escapeHtml(c.formSection.heading)}</h2>
          <p>${escapeHtml(c.formSection.intro)}</p>
          <p>${escapeHtml(c.formSection.unknownTimeNote)}</p>
        </section>
        <section class="prerender-section">
          <h2>${escapeHtml(c.overview.heading)}</h2>
          <p>${escapeHtml(c.overview.intro)}</p>
          <ul>
            ${li(c.laSoOverviewCards.map((card) => `<li><strong>${escapeHtml(card.title)}</strong>: ${escapeHtml(card.description)}</li>`))}
          </ul>
          <h3>${escapeHtml(c.overview.readingHeading)}</h3>
          <ol>
            ${li(c.overview.readingSteps.map((step) => `<li><strong>${escapeHtml(step.title)}</strong>: ${escapeHtml(step.description)}</li>`))}
          </ol>
        </section>
        <section id="bac-phai-ai" class="prerender-section">
          <h2>${escapeHtml(c.bacPhai.heading)}</h2>
          <p>${escapeHtml(c.bacPhai.intro)}</p>
          <ol>
            ${li(c.bacPhai.flow.map((step) => `<li>${escapeHtml(step)}</li>`))}
          </ol>
          <p>${escapeHtml(c.bacPhai.aiNote)}</p>
          <p>${escapeHtml(c.bacPhai.matching)} <a href="/bai-viet/tu-vi-bac-phai-la-gi/">Tìm hiểu thêm về Tử Vi Bắc phái</a> · <a href="${escapeHtml(c.bacPhai.methodLink.path)}/">${escapeHtml(c.bacPhai.methodLink.title)}</a>.</p>
        </section>
        <section id="12-cung" class="prerender-section">
          <h2>${escapeHtml(c.twelvePalacesSection.heading)}</h2>
          <p>${escapeHtml(c.twelvePalacesSection.intro)} <a href="${escapeHtml(c.twelvePalacesSection.link.path)}/">${escapeHtml(c.twelvePalacesSection.link.title)}</a></p>
          <ul>
            ${li(c.twelvePalaces.map((palace) => `<li><strong>Cung ${escapeHtml(palace.name)}</strong>: ${escapeHtml(palace.description)}</li>`))}
          </ul>
        </section>
        <section id="tu-hoa-phi-hoa" class="prerender-section">
          <h2>${escapeHtml(c.tuHoa.heading)}</h2>
          <p>${escapeHtml(c.tuHoa.intro)}</p>
          <ul>
            ${li(c.tuHoa.items.map((item) => `<li><strong>${escapeHtml(item.title)}</strong>: ${escapeHtml(item.description)}</li>`))}
          </ul>
          <p>${escapeHtml(c.tuHoa.phiHoa)}</p>
          <ul>
            ${li(c.tuHoa.links.map((link) => `<li><a href="${escapeHtml(link.path)}/">${escapeHtml(link.title)}</a></li>`))}
          </ul>
        </section>
        <section class="prerender-section">
          <h2>${escapeHtml(c.knowledgeSection.heading)}</h2>
          <p>${escapeHtml(c.knowledgeSection.intro)}</p>
          <ul>
            ${li(c.knowledgeHubItems.filter((item) => item.path).map((item) => `<li><a href="${escapeHtml(item.path)}/">${escapeHtml(item.title)}</a></li>`))}
          </ul>
        </section>
        <section class="prerender-section">
          <h2>${escapeHtml(c.faqSection.heading)}</h2>
          ${c.lapLaSoFaqs.map((faq) => `<h3>${escapeHtml(faq.question)}</h3>\n          <p>${escapeHtml(faq.answer)}</p>`).join("\n          ")}
        </section>
        <section class="prerender-section">
          <h2>${escapeHtml(c.bottomCta.heading)}</h2>
          <p>${escapeHtml(c.bottomCta.text)}</p>
          <div class="prerender-actions">
            <a href="#lap-la-so-form">Lập lá số ngay</a>
          </div>
        </section>
      </main>
    `;

const articleLinks = (articles) =>
  articles.map((a) => `<li><a href="/bai-viet/${a.slug}/">${escapeHtml(a.title)}</a> - ${escapeHtml(a.summary)}</li>`).join("\n            ");

const homeFaqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: homeFaqs.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })),
};

const h = homeContent;
const homeBody = `
      <main class="prerender-shell">
        <section class="prerender-hero">
          <p class="prerender-kicker">${escapeHtml(h.hero.eyebrow)}</p>
          <h1>${escapeHtml(h.hero.title)}</h1>
          <p>${escapeHtml(h.hero.subtitle)}</p>
          <div class="prerender-actions">
            <a href="/lap-la-so/">Lập lá số miễn phí</a>
            <a href="/la-so-mau/" class="secondary">Xem lá số mẫu</a>
          </div>
        </section>
        <section class="prerender-section">
          <h2>${escapeHtml(h.difference.heading)}</h2>
          <p>${escapeHtml(h.difference.intro)}</p>
          <ul>
            ${li(h.difference.items.map((i) => `<li><strong>${escapeHtml(i.title)}</strong>${i.status === "partial" ? " (đang bổ sung)" : ""}: ${escapeHtml(i.description)}</li>`))}
          </ul>
        </section>
        <section class="prerender-section">
          <h2>${escapeHtml(h.aiFlow.heading)}</h2>
          <p>${escapeHtml(h.aiFlow.intro)}</p>
          <ol>
            ${li(h.aiFlow.steps.map((step) => `<li>${escapeHtml(step)}</li>`))}
          </ol>
          <p>${escapeHtml(h.aiFlow.note)} <a href="/bai-viet/phuong-phap-luan-giai/">Phương pháp luận giải</a></p>
        </section>
        <section class="prerender-section">
          <h2>${escapeHtml(h.chartContents.heading)}</h2>
          <p>${escapeHtml(h.chartContents.intro)}</p>
          <ul>
            ${li(h.chartContents.items.map((i) => `<li><strong>${escapeHtml(i.title)}</strong>: ${escapeHtml(i.description)}</li>`))}
          </ul>
        </section>
        <section class="prerender-section">
          <h2>${escapeHtml(h.sample.heading)}</h2>
          <p>${escapeHtml(h.sample.text)}</p>
          <div class="prerender-actions"><a href="/la-so-mau/">${escapeHtml(h.sample.cta)}</a></div>
        </section>
        <section class="prerender-section">
          <h2>${escapeHtml(h.knowledge.heading)}</h2>
          <p>${escapeHtml(h.knowledge.intro)}</p>
          <ul>
            ${articleLinks(knowledgeArticles)}
          </ul>
        </section>
        <section class="prerender-section">
          <h2>Bảng giá</h2>
          <p>Lập lá số cơ bản miễn phí; các gói hỏi theo lá số và tư vấn trực tiếp xem tại <a href="/bang-gia/">bảng giá</a>.</p>
        </section>
        <section class="prerender-section">
          <h2>${escapeHtml(h.faqHeading)}</h2>
          ${homeFaqs.map((f) => `<h3>${escapeHtml(f.question)}</h3><p>${escapeHtml(f.answer)}</p>`).join("\n          ")}
        </section>
      </main>
    `;

const buildDemoBody = () => {
  const { createChart, deriveDemoData, describeMainStars, DEMO_NORMALIZED_INPUT, DEMO_LABEL, DEMO_HOUR_LABEL, PALACE_ORDER } = demoModule;
  const buildYear = new Date().getFullYear();
  const chart = createChart(DEMO_NORMALIZED_INPUT, "tuvichancoCompatible", { horoscopeDate: new Date(buildYear, 5, 15) });
  const d = deriveDemoData(chart, buildYear);
  const pf = chart.profile;
  const e = escapeHtml;
  const byName = (name) => chart.palaces.find((x) => x.name === name);
  const minor = (palace) =>
    (palace?.minorStars ?? []).filter((st) => (!st.scope || st.scope === "origin") && !/^Hóa /.test(st.name)).map((st) => st.name).join(", ") || "–";
  // Không in "năm xem" / đại vận hiện hành: bản tĩnh build một lần, phần phụ thuộc năm do React tính lúc chạy.
  return `
      <main class="prerender-shell">
        <section class="prerender-hero">
          <h1>Lá Số Tử Vi Mẫu – Demo Luận Giải Tử Vi Bắc Phái</h1>
          <p>Một lá số mẫu được an bằng đúng công cụ lập lá số của Tử Vi Phong Lam, rồi đọc theo thứ tự Bắc phái: Mệnh – Thân, tam phương tứ chính, 12 cung, Tứ Hóa, Phi Hóa, đại vận và luận giải dựa trên tri thức khớp với chính lá số này.</p>
          <p>Lá số minh họa (không phải người thật): ${e(DEMO_LABEL)}.</p>
          <div class="prerender-actions">
            <a href="/lap-la-so/">Lập lá số của tôi</a>
            <a href="#luan-giai-mau" class="secondary">Xem luận giải mẫu</a>
          </div>
        </section>
        <section class="prerender-section">
          <h2>Thông tin lá số</h2>
          <table><tbody>
            <tr><th scope="row">Giới tính</th><td>${e(pf.gender)}</td></tr>
            <tr><th scope="row">Ngày sinh dương lịch</th><td>${e(pf.solarDate)}</td></tr>
            <tr><th scope="row">Ngày sinh âm lịch</th><td>${e(pf.lunarDate)}</td></tr>
            <tr><th scope="row">Giờ sinh</th><td>${e(DEMO_HOUR_LABEL)}</td></tr>
            <tr><th scope="row">Can Chi (năm - tháng - ngày - giờ)</th><td>${e(pf.chineseDate)}</td></tr>
          </tbody></table>
        </section>
        <section class="prerender-section">
          <h2>Tổng quan</h2>
          <p>Cục: ${e(pf.fiveElementsClass)} · Mệnh chủ: ${e(pf.soul)} · Thân chủ: ${e(pf.body)}.</p>
        </section>
        <section class="prerender-section">
          <h2>Mệnh – Thân</h2>
          <ul>
            <li><strong>Cung Mệnh</strong> an tại ${e(d.menh.branch)}, chính tinh: ${e(d.menh.stars)}.</li>
            <li><strong>Thân cư ${e(d.than.name)}</strong> tại ${e(d.than.branch)}, chính tinh: ${e(d.than.stars)}.</li>
          </ul>
          <p><a href="/bai-viet/cung-menh-la-gi/">Cung Mệnh là gì?</a> · <a href="/bai-viet/cung-than-la-gi/">Cung Thân và Thân cư là gì?</a></p>
        </section>
        <section class="prerender-section">
          <h2>Tam phương tứ chính</h2>
          <p>Mệnh, Tài Bạch, Quan Lộc và cung xung chiếu Thiên Di - khung lớn của bản thân, tiền bạc và sự nghiệp.</p>
          <ul>
            ${li(d.tamPhuong.map((r) => `<li><strong>${e(r.name)} · ${e(r.branch)}</strong>: ${e(r.stars)}</li>`))}
          </ul>
        </section>
        <section class="prerender-section">
          <h2>12 cung</h2>
          <table>
            <thead><tr><th scope="col">Cung</th><th scope="col">Chính tinh</th><th scope="col">Phụ tinh</th></tr></thead>
            <tbody>
            ${li(PALACE_ORDER.map((name) => { const pl = byName(name); return `<tr><th scope="row">${e(name)} (${e(pl?.earthlyBranch ?? "")})</th><td>${e(describeMainStars(pl))}</td><td>${e(minor(pl))}</td></tr>`; }))}
            </tbody>
          </table>
          <p><a href="/bai-viet/12-cung-trong-la-so-tu-vi/">Cách đọc 12 cung</a></p>
        </section>
        <section class="prerender-section">
          <h2>Tứ Hóa sinh niên</h2>
          <table>
            <thead><tr><th scope="col">Hóa</th><th scope="col">Sao</th><th scope="col">Cung</th></tr></thead>
            <tbody>
            ${li(d.tuHoa.map((r) => `<tr><td>Hóa ${e(r.hoa)}</td><td>${e(r.star)}</td><td>${e(r.palace)} (${e(r.branch)})</td></tr>`))}
            </tbody>
          </table>
          <p><a href="/bai-viet/loc-quyen-khoa-ky-co-y-nghia-gi/">Lộc - Quyền - Khoa - Kỵ có ý nghĩa gì?</a></p>
        </section>
        <section class="prerender-section">
          <h2>Phi Hóa can cung</h2>
          <table>
            <thead><tr><th scope="col">Cung (can)</th><th scope="col">Hóa Lộc</th><th scope="col">Hóa Quyền</th><th scope="col">Hóa Khoa</th><th scope="col">Hóa Kỵ</th></tr></thead>
            <tbody>
            ${li(d.phiHoa.map((r) => `<tr><th scope="row">${e(r.name)} (${e(r.stem)})</th>${["loc", "quyen", "khoa", "ky"].map((k) => `<td>${e(r.targets[k] || "–")}</td>`).join("")}</tr>`))}
            </tbody>
          </table>
          <p><a href="/bai-viet/phi-nhap-va-phi-xuat-la-gi/">Phi nhập và phi xuất là gì?</a> · <a href="/bai-viet/tu-hoa-la-gi/">Tự hóa là gì?</a></p>
        </section>
        <section class="prerender-section">
          <h2>Đại vận</h2>
          <table>
            <thead><tr><th scope="col">Tuổi</th><th scope="col">Cung</th><th scope="col">Chính tinh</th></tr></thead>
            <tbody>
            ${li(d.daiVan.map((r) => `<tr><td>${r.start}-${r.end}</td><td>${e(r.palace)} (${e(r.branch)})</td><td>${e(r.stars)}</td></tr>`))}
            </tbody>
          </table>
          <p><a href="/bai-viet/dai-van-va-luu-nien-trong-bac-phai/">Đại vận và lưu niên trong Bắc phái</a></p>
        </section>
        <section id="luan-giai-mau" class="prerender-section">
          <h2>Luận giải mẫu</h2>
          <p>Mỗi cung hiển thị các đoạn tri thức khớp với chính lá số mẫu kèm lý do khớp; AI tổng hợp từ dữ liệu này, được yêu cầu không tự tạo quy tắc và ghi rõ phần thiếu dữ liệu.</p>
        </section>
        <section class="prerender-section">
          <h2>Cơ sở tri thức</h2>
          <p>Các đoạn tri thức đã khớp với lá số mẫu ở từng cung và lý do khớp - cũng là dữ liệu mà AI nhận được khi luận giải.</p>
        </section>
        <section class="prerender-section">
          <h2>Lập lá số của tôi</h2>
          <p>Nhập ngày giờ sinh để an Mệnh, Thân, 12 cung, Tứ Hóa và xem luận giải theo đúng lá số của bạn.</p>
          <div class="prerender-actions"><a href="/lap-la-so/">Lập lá số của tôi</a></div>
        </section>
      </main>
    `;
};

const breadcrumb = (items) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map(([name, route], i) => ({ "@type": "ListItem", position: i + 1, name, item: pageUrl(route) })),
});

const pricingServiceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Luận giải tử vi theo lá số",
  description: "Lập lá số tử vi miễn phí theo ngày giờ sinh; hỏi một câu theo lá số hoặc tư vấn trực tiếp.",
  provider: { "@id": organizationId },
  areaServed: "VN",
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Dịch vụ luận giải tử vi",
    itemListElement: [
      { "@type": "Offer", name: "Lập lá số cơ bản", price: "0", priceCurrency: "VND" },
      { "@type": "Offer", name: "Hỏi 1 câu theo lá số", price: "50000", priceCurrency: "VND" },
      { "@type": "Offer", name: "Tư vấn trực tiếp", price: "999000", priceCurrency: "VND" },
    ],
  },
};

const routes = [
  {
    route: "/",
    title: "Tử Vi Phong Lam – Luận Giải Tử Vi Bắc Phái Theo Lá Số Của Bạn",
    description:
      "Lập lá số tử vi online miễn phí, xem Mệnh, Thân, 12 cung, Tứ Hóa, Phi Hóa, đại vận. Luận giải theo Tử Vi Bắc phái, đối chiếu kho tri thức có điều kiện.",
    body: homeBody,
    extraSchemas: [homeFaqSchema],
  },
  {
    route: "/lap-la-so",
    title: "Lập Lá Số Tử Vi Online Miễn Phí Theo Ngày Giờ Sinh | Tử Vi Phong Lam",
    description:
      "Lập lá số tử vi online miễn phí theo ngày giờ sinh: Mệnh, Thân, 12 cung, chính tinh, phụ tinh, Tứ Hóa, đại vận. Luận giải theo Tử Vi Bắc phái.",
    body: lapLaSoBody,
    extraSchemas: lapLaSoSchemas,
  },
  {
    route: "/bang-gia",
    title: "Bảng Giá Luận Giải Tử Vi | Hỏi 1 Câu 50K | Tử Vi Phong Lam",
    description:
      "Lập lá số miễn phí, hỏi 1 câu theo lá số 50.000đ, tư vấn trực tiếp 999.000đ. Luận giải tử vi theo phương pháp Bắc phái.",
    body: `
      <main class="prerender-shell">
        <section class="prerender-hero">
          <h1>Bảng giá luận giải tử vi</h1>
          <p>Mỗi gói đi theo một mức nhu cầu khác nhau: xem nền, hỏi một vấn đề cụ thể, hoặc trao đổi sâu theo giai đoạn.</p>
          <ul>
            <li>Lập lá số cơ bản: miễn phí.</li>
            <li>Hỏi 1 câu theo lá số: 50.000đ.</li>
            <li>Tư vấn trực tiếp: 999.000đ.</li>
          </ul>
          <div class="prerender-actions"><a href="/lap-la-so/">Lập lá số miễn phí</a><a href="/lien-he/" class="secondary">Chuẩn bị câu hỏi</a></div>
          <p>Xem thêm: <a href="/faq/">Câu hỏi thường gặp</a> · <a href="/la-so-mau/">Lá số mẫu</a></p>
        </section>
      </main>
    `,
    extraSchemas: [pricingServiceSchema],
  },
  {
    route: "/la-so-mau",
    title: "Lá Số Tử Vi Mẫu – Demo Luận Giải Tử Vi Bắc Phái | Tử Vi Phong Lam",
    description:
      "Demo luận giải một lá số mẫu theo Tử Vi Bắc phái: Mệnh – Thân, tam phương tứ chính, 12 cung, Tứ Hóa, Phi Hóa, đại vận và tri thức khớp kèm lý do.",
    body: buildDemoBody(),
    extraSchemas: [breadcrumb([["Trang chủ", "/"], ["Lá số mẫu", "/la-so-mau"]])],
  },
  {
    route: "/bai-viet",
    title: "Kiến Thức Tử Vi Bắc Phái - Tứ Hóa Phi Tinh | Tử Vi Phong Lam",
    description:
      "Bài viết nền tảng về Tử Vi Bắc Phái: 12 cung, cung Mệnh, cung Thân, Tứ Hóa Phi Tinh, tự hóa, đại vận và lưu niên.",
    body: `
      <main class="prerender-shell">
        <section class="prerender-hero">
          <p class="prerender-kicker">Bài viết</p>
          <h1>Kiến thức Tử Vi Bắc phái</h1>
          <p>Những bài đọc nền tảng về Tử Vi Bắc Phái, Tứ Hóa Phi Tinh, can cung, đại vận và lưu niên.</p>
          <div class="prerender-actions">
            <a href="/lap-la-so/">Lập lá số miễn phí</a>
          </div>
        </section>
        <section class="prerender-section">
          <h2>Tất cả bài viết</h2>
          <ul>
            ${articleLinks(knowledgeArticles)}
          </ul>
        </section>
      </main>
    `,
  },
  {
    route: "/video",
    title: "Video Học Tử Vi Bắc Phái - Tứ Hóa Phi Tinh | Tử Vi Phong Lam",
    description:
      "Tổng hợp video ngắn hướng dẫn Tử Vi Bắc Phái, Tứ Hóa Phi Tinh, cách đọc lá số dễ hiểu cho người mới.",
    body: `
      <main class="prerender-shell">
        <section class="prerender-hero">
          <p class="prerender-kicker">Video</p>
          <h1>Video học Tử Vi Bắc Phái</h1>
          <p>Các video ngắn được gom theo nền tảng để bạn học nhanh một khái niệm, rồi quay lại đối chiếu trên lá số của mình.</p>
          <div class="prerender-actions"><a href="/lap-la-so/">Lập lá số miễn phí</a><a href="/bai-viet/" class="secondary">Đọc bài viết</a></div>
        </section>
        <section class="prerender-section">
          <h2>Video ngắn</h2>
          <ul>
            ${li(manualVideoLessons.map((v) => `<li><a href="${escapeHtml(v.url)}" rel="noreferrer">${escapeHtml(v.title)}</a> (${escapeHtml(v.source)})</li>`))}
          </ul>
          <p>Video được dẫn nguồn từ kênh YouTube và TikTok của Thiên Ngân Tử. Quyền nội dung thuộc về chủ sở hữu kênh.</p>
        </section>
      </main>
    `,
  },
  {
    route: "/faq",
    extraSchemas: [
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqPageItems.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })),
      },
      breadcrumb([["Trang chủ", "/"], ["FAQ", "/faq"]]),
    ],
    title: "Câu Hỏi Thường Gặp Về Lập Lá Số Tử Vi Online | Tử Vi Phong Lam",
    description:
      "Giải đáp thắc mắc về lập lá số tử vi online, giờ sinh, Tứ Hóa, Phi Hóa, cách AI luận giải và các gói hỏi theo lá số.",
    body: `
      <main class="prerender-shell">
        <section class="prerender-hero">
          <p class="prerender-kicker">FAQ</p>
          <h1>Câu hỏi thường gặp khi lập lá số tử vi</h1>
          <p>Tập hợp các thắc mắc phổ biến trước khi tạo lá số hoặc chọn gói hỗ trợ. Chưa có lá số? <a href="/lap-la-so/">Lập lá số miễn phí</a> hoặc <a href="/la-so-mau/">xem một lá số mẫu</a>.</p>
        </section>
        ${faqPageGroups.map((g) => `<section class="prerender-section">
          <h2>${escapeHtml(g.title)}</h2>
          <p>${escapeHtml(g.description)}</p>
          ${g.faqs.map((f) => `<h3>${escapeHtml(f.question)}</h3><p>${escapeHtml(f.answer)}</p>`).join("\n          ")}
        </section>`).join("\n        ")}
      </main>
    `,
  },
  {
    route: "/lien-he",
    title: "Liên Hệ Tư Vấn Luận Giải Tử Vi | Tử Vi Phong Lam",
    description:
      "Liên hệ để hỏi 1 câu theo lá số, đặt lịch tư vấn trực tiếp hoặc nhận hướng dẫn chọn gói luận giải phù hợp.",
    body: `
      <main class="prerender-shell">
        <section class="prerender-hero">
          <p class="prerender-kicker">Liên hệ</p>
          <h1>Nhận hướng dẫn chọn gói và gửi câu hỏi theo lá số</h1>
          <p>Trang này dành cho người đã có lá số và muốn được hướng dẫn bước tiếp theo: hỏi 1 câu, đặt lịch tư vấn hoặc chuẩn bị thông tin trước khi trao đổi.</p>
          <div class="prerender-actions"><a href="/bang-gia/">Xem bảng giá</a><a href="/lap-la-so/" class="secondary">Lập lá số miễn phí</a></div>
        </section>
        <section class="prerender-section">
          <h2>Nên chuẩn bị gì?</h2>
          <ul>
            <li>Ngày, tháng, năm, giờ sinh và giới tính (ghi rõ dương lịch hay âm lịch).</li>
            <li>Năm muốn xem và một câu hỏi chính.</li>
            <li>Bối cảnh ngắn 2-3 dòng để phần trả lời bám đúng trường hợp.</li>
          </ul>
        </section>
      </main>
    `,
  },
  {
    route: "/ve-chung-toi",
    title: "Về Tử Vi Phong Lam – Lập Lá Số và Luận Giải Tử Vi Bắc Phái",
    description:
      "Tử Vi Phong Lam lập lá số tử vi online và luận giải theo Bắc phái: đối chiếu hơn 20.000 đoạn tri thức có điều kiện, AI chỉ tổng hợp từ phần khớp với lá số.",
    extraSchemas: [breadcrumb([["Trang chủ", "/"], ["Về chúng tôi", "/ve-chung-toi"]])],
    body: `
      <main class="prerender-shell">
        <article class="prerender-hero">
          <h1>Về Tử Vi Phong Lam</h1>
          <h2>Tử Vi Phong Lam làm gì</h2>
          <p>Tử Vi Phong Lam là công cụ lập lá số Tử Vi Đẩu Số online và luận giải theo lối đọc Bắc phái. Mục tiêu là giúp bạn đọc lá số của chính mình có căn cứ: thấy rõ cung nào, sao nào, Hóa nào dẫn tới một nhận định, thay vì nhận một đoạn văn mẫu dùng chung cho mọi người.</p>
          <h2>Cách đọc theo Bắc phái</h2>
          <ul>
            <li>Mệnh – Thân và tam phương tứ chính làm khung nền.</li>
            <li>Tứ Hóa sinh niên và Phi Hóa can cung để thấy cung nào phát lực, cung nào nhận lực.</li>
            <li>Đại vận, tiểu vận để xem chủ đề nào được kích hoạt theo từng giai đoạn.</li>
          </ul>
          <p>Tử Vi là công cụ tham khảo về xu hướng, không phải lời phán định chắc chắn về tương lai. <a href="/bai-viet/tu-vi-bac-phai-la-gi/">Tử Vi Bắc phái là gì?</a></p>
          <h2>Kho tri thức và AI</h2>
          <ul>
            <li>Lá số được an ngay trên trình duyệt của bạn; cùng ngày giờ sinh luôn cho cùng một lá số.</li>
            <li>Kho hơn 20.000 đoạn tri thức, mỗi đoạn gắn điều kiện áp dụng và chỉ hiển thị khi khớp với lá số của bạn, kèm lý do khớp.</li>
            <li>AI chỉ tổng hợp từ các đoạn đã khớp, được yêu cầu không tự tạo quy tắc và ghi rõ phần chưa đủ dữ liệu - nhưng vẫn có thể sai sót.</li>
          </ul>
          <p><a href="/bai-viet/phuong-phap-luan-giai/">Phương pháp luận giải</a> · <a href="/la-so-mau/">Xem một lá số mẫu</a></p>
          <div class="prerender-actions"><a href="/lap-la-so/">Lập lá số miễn phí</a></div>
        </article>
      </main>
    `,
  },
  {
    route: "/hop-tuoi",
    title: "So Khớp Hai Lá Số Tử Vi – Chuẩn Bị Xem Hợp Tuổi | Tử Vi Phong Lam",
    description:
      "Tính năng so khớp hai lá số đang được hoàn thiện. Hướng dẫn chuẩn bị ngày giờ sinh hai người và câu hỏi chính để đối chiếu Mệnh, Thân, cung Phu Thê.",
    body: `
      <main class="prerender-shell">
        <section class="prerender-hero">
          <p class="prerender-kicker">Hợp tuổi</p>
          <h1>So khớp quan hệ theo lá số</h1>
          <p>Chuẩn bị dữ liệu cho hai người và xác định câu hỏi chính trước khi đối chiếu: tình cảm, hôn nhân, hợp tác, tài chính hay nhịp sống.</p>
          <div class="prerender-actions"><a href="/lap-la-so/">Lập lá số miễn phí</a><a href="/lien-he/" class="secondary">Chuẩn bị brief liên hệ</a></div>
        </section>
      </main>
    `,
  },
  {
    route: "/dieu-khoan-su-dung",
    title: "Điều Khoản Sử Dụng Dịch Vụ | Tử Vi Phong Lam",
    description: "Điều khoản và điều kiện sử dụng dịch vụ lập lá số tử vi online trên Tử Vi Phong Lam.",
    body: `<main class="prerender-shell">${legalModule.termsHtml}</main>`,
  },
  {
    route: "/chinh-sach-bao-mat",
    title: "Chính Sách Bảo Mật Thông Tin | Tử Vi Phong Lam",
    description: "Chính sách bảo mật và cách Tử Vi Phong Lam bảo vệ thông tin cá nhân của bạn.",
    body: `<main class="prerender-shell">${legalModule.privacyHtml}</main>`,
  },
  ...knowledgeArticles.map((article) => ({
    route: `/bai-viet/${article.slug}`,
    // Khớp title/description React (BlogPage) để HTML ban đầu và sau khi chạy JS giống nhau
    title: articlePageTitle(article),
    description: articleMetaDescription(article),
    article,
    body: renderArticleBody(article),
    extraSchemas: [breadcrumb([["Trang chủ", "/"], ["Bài viết", "/bai-viet"], [article.title, `/bai-viet/${article.slug}`]])],
  })),
];

const prerenderStyles = `
<style id="prerender-css">
  .prerender-shell{padding:24px;font-family:"Be Vietnam Pro",sans-serif;color:#211A13;background:#FFF8ED}
  .prerender-hero,.prerender-section{max-width:980px;margin:0 auto 24px}
  .prerender-kicker{font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:#8B672C}
  .prerender-hero h1,.prerender-section h2{font-family:"Cormorant Garamond",serif}
  .prerender-hero h1{font-size:48px;line-height:1.05;margin:0 0 12px}
  .prerender-hero p,.prerender-section p,.prerender-section li{font-size:18px;line-height:1.7;color:#6F6254}
  .prerender-section ul{padding-left:20px}
  .prerender-section h3{font-size:20px;margin:18px 0 6px}
  .prerender-section table{width:100%;border-collapse:collapse;font-size:15px;display:block;overflow-x:auto}
  .prerender-section th,.prerender-section td{border:1px solid #E8D9C1;padding:6px 8px;text-align:left;vertical-align:top}
  .prerender-actions{display:flex;gap:12px;flex-wrap:wrap;margin-top:20px}
  .prerender-actions a{display:inline-flex;align-items:center;justify-content:center;padding:12px 20px;border-radius:999px;background:#8F3D2F;color:#FFFDF8;text-decoration:none;font-weight:600}
  .prerender-actions a.secondary{background:#FFFDF8;color:#8F3D2F;border:1px solid #E8D9C1}
</style>`;

const template = fs.readFileSync(indexPath, "utf8");

const replaceTag = (html, pattern, replacement) => {
  if (!pattern.test(html)) {
    return html;
  }

  return html.replace(pattern, replacement);
};

for (const page of routes) {
  let html = template;

  html = replaceTag(html, /<title>[\s\S]*?<\/title>/, `<title>${page.title}</title>`);
  html = replaceTag(html, /<meta\s+name="description"[\s\S]*?\/>/, `<meta name="description" content="${page.description}" />`);
  html = replaceTag(html, /<meta\s+name="robots"[\s\S]*?\/>/, `<meta name="robots" content="${page.noindex ? "noindex,nofollow" : "index,follow"}" />`);
  html = replaceTag(html, /<meta\s+property="og:title"[\s\S]*?\/>/, `<meta property="og:title" content="${page.title}" />`);
  html = replaceTag(html, /<meta\s+property="og:description"[\s\S]*?\/>/, `<meta property="og:description" content="${page.description}" />`);
  html = replaceTag(html, /<meta\s+property="og:url"[\s\S]*?\/>/, `<meta property="og:url" content="${pageUrl(page.route)}" />`);
  html = replaceTag(html, /<meta\s+name="twitter:title"[\s\S]*?\/>/, `<meta name="twitter:title" content="${page.title}" />`);
  html = replaceTag(html, /<meta\s+name="twitter:description"[\s\S]*?\/>/, `<meta name="twitter:description" content="${page.description}" />`);
  html = replaceTag(html, /<link\s+rel="canonical"[\s\S]*?>/, `<link rel="canonical" href="${pageUrl(page.route)}" />`);
  html = html.replace(/(<link\s+rel="alternate"\s+hreflang="[^"]+"\s+href=")[^"]*(")/g, `$1${pageUrl(page.route)}$2`);
  const routeSchemas = [buildWebPageSchema(page), ...(page.extraSchemas ?? [])];
  html = html.replace(
    "</head>",
    `<script id="route-structured-data" type="application/ld+json">${JSON.stringify(routeSchemas).replace(/</g, "\\u003c")}</script></head>`,
  );
  html = html.replace("</head>", `${prerenderStyles}</head>`);
  html = html.replace('<div id="root"></div>', `<div id="root">${page.body}</div>`);

  if (page.route === "/") {
    fs.writeFileSync(indexPath, html, "utf8");
    continue;
  }

  const routeDir = path.join(distDir, page.route.slice(1));
  fs.mkdirSync(routeDir, { recursive: true });
  fs.writeFileSync(path.join(routeDir, "index.html"), html, "utf8");
}

// 404: Cloudflare Pages trả dist/404.html với status 404 cho URL không tồn tại (không còn fallback SPA "/* /index.html 200")
{
  let html = template;
  html = replaceTag(html, /<title>[\s\S]*?<\/title>/, "<title>Không tìm thấy trang | Tử Vi Phong Lam</title>");
  html = replaceTag(html, /<meta\s+name="robots"[\s\S]*?\/>/, '<meta name="robots" content="noindex,follow" />');
  html = html.replace(/<link\s+rel="canonical"[\s\S]*?>\s*/, "").replace(/<link\s+rel="alternate"\s+hreflang="[^"]+"[^>]*>\s*/g, "");
  html = html.replace("</head>", `${prerenderStyles}</head>`);
  html = html.replace(
    '<div id="root"></div>',
    `<div id="root">
      <main class="prerender-shell">
        <section class="prerender-hero">
          <h1>Trang không tồn tại</h1>
          <p>Trang bạn tìm không tồn tại hoặc đã được di chuyển.</p>
          <div class="prerender-actions"><a href="/">Về trang chủ</a><a href="/lap-la-so/" class="secondary">Lập lá số miễn phí</a><a href="/bai-viet/" class="secondary">Kiến thức Tử Vi</a></div>
        </section>
      </main></div>`,
  );
  fs.writeFileSync(path.join(distDir, "404.html"), html, "utf8");
}

// sitemap.xml sinh từ danh sách route (không lệch với trang thật)
const sitemapPriority = (route) => (route === "/" ? "1.0" : route === "/lap-la-so" ? "0.9" : route.startsWith("/bai-viet/") ? "0.7" : route === "/dieu-khoan-su-dung" || route === "/chinh-sach-bao-mat" ? "0.3" : "0.8");
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
  .filter((page) => !page.noindex)
  .map((page) => `  <url>
    <loc>${pageUrl(page.route)}</loc>
    <lastmod>${page.article?.updatedAt ?? PAGES_UPDATED}</lastmod>
    <priority>${sitemapPriority(page.route)}</priority>
  </url>`)
  .join("\n")}
</urlset>
`;
fs.writeFileSync(path.join(distDir, "sitemap.xml"), sitemap, "utf8");

console.log(`Prerendered ${routes.length} routes + 404.html + sitemap.xml into dist`);

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

const loadKnowledgeArticles = () => {
  const result = buildSync({
    entryPoints: [path.resolve("src/content/bacPhaiLibrary.ts")],
    bundle: true,
    platform: "node",
    format: "cjs",
    write: false,
    logLevel: "silent",
  });
  const module = { exports: {} };
  new Function("module", "exports", "require", result.outputFiles[0].text)(module, module.exports, createRequire(import.meta.url));
  return module.exports.knowledgeArticles ?? [];
};
const knowledgeArticlesBySlug = new Map(loadKnowledgeArticles().map((article) => [article.slug, article]));

const paragraphs = (text) =>
  String(text || "")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${escapeHtml(p)}</p>`)
    .join("\n          ");

const renderArticleBody = (post) => {
  const article = knowledgeArticlesBySlug.get(post.route.replace("/bai-viet/", ""));
  const heading = post.title.replace(" | Bài viết", "");
  if (!article) {
    return `
      <main class="prerender-shell">
        <section class="prerender-hero">
          <h1>${escapeHtml(heading)}</h1>
          <p>${escapeHtml(post.description)}</p>
        </section>
      </main>
    `;
  }
  const sources = (article.sourceRefs ?? [])
    .map((ref) => (ref.href ? `<li><a href="${escapeHtml(ref.href)}" rel="nofollow noopener">${escapeHtml(ref.title)}</a></li>` : `<li>${escapeHtml(ref.title)}</li>`))
    .join("\n            ");
  return `
      <main class="prerender-shell">
        <article class="prerender-hero">
          <h1>${escapeHtml(article.title)}</h1>
          <p>${escapeHtml(article.summary)}</p>
          ${(article.content ?? []).map((block) => `<h2>${escapeHtml(block.heading)}</h2>\n          ${paragraphs(block.body)}`).join("\n          ")}
          <h2>${escapeHtml(article.applicationBox?.title ?? "Ứng dụng vào lá số")}</h2>
          ${paragraphs(article.applicationBox?.body)}
          ${sources ? `<h2>Nguồn tham khảo</h2>\n          <ul>\n            ${sources}\n          </ul>` : ""}
          <div class="prerender-actions">
            <a href="${escapeHtml(article.cta?.href ?? "/lap-la-so")}/">${escapeHtml(article.cta?.label ?? "Lập lá số miễn phí")}</a>
            <a href="/bai-viet/" class="secondary">Các bài viết khác</a>
          </div>
        </article>
      </main>
    `;
};

const articlePosts = [
  {
    route: "/bai-viet/tu-vi-bac-phai-la-gi",
    title: "Tử Vi Bắc Phái là gì? | Bài viết",
    description: "Bài mở cửa để hiểu Bắc Phái, can cung, Tứ Hóa Phi Tinh và lý do vì sao lối đọc này nhấn vào mạch vận động của lá số.",
  },
  {
    route: "/bai-viet/tu-hoa-phi-tinh-la-gi",
    title: "Tứ Hóa Phi Tinh là gì? | Bài viết",
    description: "Giải thích nền tảng về Lộc, Quyền, Khoa, Kỵ và vì sao Tứ Hóa làm lá số chuyển từ tĩnh sang động.",
  },
  {
    route: "/bai-viet/loc-quyen-khoa-ky-co-y-nghia-gi",
    title: "Lộc - Quyền - Khoa - Kỵ có ý nghĩa gì? | Bài viết",
    description: "Đọc bốn Hóa như bốn kiểu vận động khác nhau thay vì tách đơn giản thành tốt hay xấu.",
  },
  {
    route: "/bai-viet/phi-nhap-va-phi-xuat-la-gi",
    title: "Phi nhập và phi xuất là gì? | Bài viết",
    description: "Hiểu cung phát lực, cung nhận lực và cách lần mạch phi hóa trong Bắc Phái.",
  },
  {
    route: "/bai-viet/tu-hoa-la-gi",
    title: "Tự hóa là gì? | Bài viết",
    description: "Một bài nền tảng về tự hóa và những chủ đề có xu hướng tự khởi, tự vướng hoặc tự thúc đẩy.",
  },
  {
    route: "/bai-viet/dai-van-va-luu-nien-trong-bac-phai",
    title: "Đại vận và lưu niên trong Bắc Phái | Bài viết",
    description: "Cách đọc đại vận và lưu niên cùng Tứ Hóa để thấy năm nào thật sự chạm mạch trọng yếu của lá số.",
  },
  {
    route: "/bai-viet/12-cung-trong-la-so-tu-vi",
    title: "12 cung trong lá số Tử Vi | Bài viết",
    description: "Thứ tự an 12 cung, ý nghĩa khái quát từng cung, sáu trục đối cung và tam phương tứ chính - khung để đọc mọi lá số.",
  },
  {
    route: "/bai-viet/cung-menh-la-gi",
    title: "Cung Mệnh là gì? | Bài viết",
    description: "Cách an cung Mệnh, cung Mệnh nói gì, bộ Mệnh - Tài - Quan - Thiên Di và góc nhìn Bắc Phái về can cung Mệnh.",
  },
  {
    route: "/bai-viet/cung-than-la-gi",
    title: "Cung Thân và Thân cư là gì? | Bài viết",
    description: "Cung Thân luôn đồng cung với một trong sáu cung theo giờ sinh; vị trí Thân cư cho biết trọng tâm đời sống khi trưởng thành.",
  },
];

const buildWebPageSchema = (page) => ({
  "@context": "https://schema.org",
  "@type": page.route.startsWith("/bai-viet/") ? "Article" : "WebPage",
  name: page.title,
  headline: page.route.startsWith("/bai-viet/") ? page.title.replace(" | Bài viết", "") : undefined,
  description: page.description,
  url: pageUrl(page.route),
  inLanguage: "vi-VN",
  isPartOf: { "@id": `${siteUrl}/#website` },
  publisher: { "@id": organizationId },
});

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
          <p>${escapeHtml(c.bacPhai.matching)} <a href="/bai-viet/tu-vi-bac-phai-la-gi/">Tìm hiểu thêm về Tử Vi Bắc phái</a>.</p>
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

const routes = [
  {
    route: "/",
    title: "Tử Vi Phong Lam - Lập Lá Số Tử Vi Online & Luận Giải Theo Lá Số",
    description:
      "Lập lá số tử vi online miễn phí, xem Mệnh, Thân, 12 cung, đại vận, tiểu vận và hỏi thêm theo lá số về sự nghiệp, tài lộc, tình duyên.",
    body: `
      <main class="prerender-shell">
        <section class="prerender-hero">
          <p class="prerender-kicker">Tử Vi Phong Lam</p>
          <h1>Lập lá số tử vi online theo ngày giờ sinh</h1>
          <p>Tạo lá số miễn phí, xem nhanh Mệnh, Thân, 12 cung, đại vận, tiểu vận và biết nên đọc tiếp phần nào theo câu hỏi của bạn.</p>
          <div class="prerender-actions">
            <a href="/lap-la-so/">Lập lá số miễn phí</a>
            <a href="/la-so-mau/" class="secondary">Xem lá số mẫu</a>
          </div>
        </section>
      </main>
    `,
  },
  {
    route: "/lap-la-so",
    title: "Lập Lá Số Tử Vi Online Miễn Phí Theo Ngày Giờ Sinh | Tử Vi Phong Lam",
    description:
      "Lập lá số tử vi online miễn phí theo ngày tháng năm giờ sinh. An Mệnh, Thân, 12 cung, chính tinh, phụ tinh, Tứ Hóa, đại vận và tiểu vận. Khám phá luận giải Tử Vi theo phương pháp Bắc phái.",
    body: lapLaSoBody,
    extraSchemas: lapLaSoSchemas,
  },
  {
    route: "/bang-gia",
    title: "Bảng Giá Luận Giải Tử Vi - Hỏi 1 Câu Từ 50.000đ",
    description:
      "Xem các gói luận giải tử vi: lập lá số miễn phí, hỏi 1 câu theo lá số 50.000đ và tư vấn trực tiếp 999.000đ.",
    body: `
      <main class="prerender-shell">
        <section class="prerender-hero">
          <h1>Bảng giá luận giải tử vi</h1>
          <p>Mỗi gói đi theo một mức nhu cầu khác nhau: xem nền, hỏi một vấn đề cụ thể, hoặc trao đổi sâu theo giai đoạn.</p>
        </section>
      </main>
    `,
  },
  {
    route: "/la-so-mau",
    title: "Demo Luận Giải Tử Vi Bắc Phái Trên Lá Số Mẫu | Tử Vi Phong Lam",
    description:
      "Xem cách Tử Vi Phong Lam đọc một lá số mẫu theo Bắc phái: Mệnh – Thân, Mệnh Tài Quan, 12 cung, Tứ Hóa, đại vận và luận giải dựa trên tri thức đã khớp.",
    body: `
      <main class="prerender-shell">
        <section class="prerender-hero">
          <h1>Demo luận giải Tử Vi Bắc phái</h1>
          <p>Một lá số mẫu được an bằng đúng công cụ lập lá số của Tử Vi Phong Lam, rồi đọc theo thứ tự Bắc phái: Mệnh – Thân, Mệnh – Tài – Quan, 12 cung, Tứ Hóa, đại vận và luận giải dựa trên tri thức khớp với chính lá số này.</p>
          <p>Lá số minh họa (không phải người thật): Nam, sinh ngày 12/5/1990 (dương lịch), giờ Mùi.</p>
          <div class="prerender-actions">
            <a href="/lap-la-so/">Lập lá số của tôi</a>
            <a href="#luan-giai-mau" class="secondary">Xem luận giải mẫu</a>
          </div>
        </section>
        <section class="prerender-section"><h2>Tổng quan</h2><p>Các thông số nền của lá số mẫu: Mệnh, Thân, Cục, Âm dương, Ngũ hành, năm xem.</p></section>
        <section class="prerender-section"><h2>Mệnh – Thân</h2><p>Cung Mệnh, Thân cư, Cục, Mệnh chủ và Thân chủ. <a href="/bai-viet/cung-menh-la-gi/">Cung Mệnh là gì?</a> · <a href="/bai-viet/cung-than-la-gi/">Cung Thân và Thân cư là gì?</a></p></section>
        <section class="prerender-section"><h2>Mệnh – Tài – Quan</h2><p>Tam phương tứ chính của cung Mệnh: Mệnh, Tài Bạch, Quan Lộc và cung xung chiếu Thiên Di.</p></section>
        <section class="prerender-section"><h2>12 cung</h2><p>Lá số đầy đủ với chính tinh, phụ tinh, độ sáng, Tứ Hóa và Phi Hóa can cung. <a href="/bai-viet/12-cung-trong-la-so-tu-vi/">Cách đọc 12 cung</a></p></section>
        <section class="prerender-section"><h2>Tứ Hóa sinh niên</h2><p>Hóa Lộc, Hóa Quyền, Hóa Khoa, Hóa Kỵ phát sinh từ can năm sinh và gắn vào bốn sao cụ thể. <a href="/bai-viet/loc-quyen-khoa-ky-co-y-nghia-gi/">Lộc - Quyền - Khoa - Kỵ có ý nghĩa gì?</a></p></section>
        <section class="prerender-section"><h2>Đại vận</h2><p>Bảng 12 đại vận 10 năm và đại vận của năm xem. <a href="/bai-viet/dai-van-va-luu-nien-trong-bac-phai/">Đại vận và lưu niên trong Bắc phái</a></p></section>
        <section id="luan-giai-mau" class="prerender-section"><h2>Luận giải mẫu</h2><p>Mỗi cung hiển thị các đoạn tri thức khớp với chính lá số mẫu kèm lý do khớp; AI tổng hợp từ dữ liệu này, không tự tạo quy tắc và ghi rõ phần thiếu dữ liệu.</p></section>
        <section class="prerender-section"><h2>Lập lá số của tôi</h2><p>Nhập ngày giờ sinh để an Mệnh, Thân, 12 cung, Tứ Hóa và xem luận giải theo đúng lá số của bạn.</p><div class="prerender-actions"><a href="/lap-la-so/">Lập lá số của tôi</a></div></section>
      </main>
    `,
  },
  {
    route: "/bai-viet",
    title: "Bài viết",
    description:
      "Những bài đọc nền tảng về Tử Vi Bắc Phái, Tứ Hóa Phi Tinh, can cung, đại vận và lưu niên.",
    body: `
      <main class="prerender-shell">
        <section class="prerender-hero">
          <p class="prerender-kicker">Bài viết</p>
          <h1>Bài viết</h1>
          <p>Những bài đọc nền tảng về Tử Vi Bắc Phái, Tứ Hóa Phi Tinh, can cung, đại vận và lưu niên.</p>
          <div class="prerender-actions">
            <a href="/bai-viet/">Mở danh sách bài viết</a>
            <a href="/lap-la-so/" class="secondary">Lập lá số miễn phí</a>
          </div>
        </section>
      </main>
    `,
  },
  {
    route: "/video",
    title: "Video Học Tử Vi Bắc Phái",
    description:
      "Tổng hợp video ngắn về Tử Vi, Bắc Phái, Tứ Hóa Phi Tinh và cách đọc lá số theo hướng dễ tiếp cận.",
    body: `
      <main class="prerender-shell">
        <section class="prerender-hero">
          <h1>Video học Tử Vi Bắc Phái</h1>
          <p>Các video ngắn được gom theo nền tảng để bạn học nhanh một khái niệm, rồi quay lại đối chiếu trên lá số của mình.</p>
          <div class="prerender-actions">
            <a href="/video/">Xem danh sách video</a>
            <a href="/lap-la-so/" class="secondary">Lập lá số miễn phí</a>
          </div>
        </section>
      </main>
    `,
  },
  {
    route: "/faq",
    title: "FAQ Lập Lá Số Tử Vi - Giải Đáp Câu Hỏi Thường Gặp",
    description:
      "Giải đáp nhanh các câu hỏi thường gặp khi lập lá số tử vi online, chọn gói luận giải và sử dụng dữ liệu ngày giờ sinh.",
    body: `
      <main class="prerender-shell">
        <section class="prerender-hero">
          <h1>FAQ lập lá số tử vi</h1>
          <p>Câu hỏi thường gặp về cách lập lá số, mức độ chính xác, dữ liệu ngày giờ sinh và các bước tiếp theo sau khi xem miễn phí.</p>
        </section>
      </main>
    `,
  },
  {
    route: "/lien-he",
    title: "Liên Hệ - Nhận Hướng Dẫn Chọn Gói Luận Giải",
    description:
      "Liên hệ để được hướng dẫn chọn gói phù hợp, gửi câu hỏi theo lá số hoặc đặt lịch tư vấn trực tiếp.",
    body: `
      <main class="prerender-shell">
        <section class="prerender-hero">
          <h1>Liên hệ</h1>
          <p>Trang này giúp bạn chọn bước tiếp theo sau khi đã có lá số: xem bảng giá, gửi câu hỏi hoặc chuẩn bị trước khi tư vấn trực tiếp.</p>
        </section>
      </main>
    `,
  },
  {
    route: "/ve-chung-toi",
    title: "Về Chúng Tôi - Tử Vi Phong Lam | Chuyên Gia Tử Vi Bắc Phái",
    description:
      "Tử Vi Phong Lam - Nền tảng lập lá số tử vi online và luận giải theo phương pháp Bắc Phái chính thống.",
    body: `
      <main class="prerender-shell">
        <section class="prerender-hero">
          <h1>Về Tử Vi Phong Lam</h1>
          <p>Nền tảng lập lá số tử vi online và luận giải theo phương pháp Bắc Phái chính thống với hơn 30,000 luận giải tri thức.</p>
        </section>
      </main>
    `,
  },
  {
    route: "/hop-tuoi",
    title: "Hợp Tuổi Theo Lá Số - Chuẩn Bị Dữ Liệu So Khớp Quan Hệ",
    description:
      "Hướng dẫn chuẩn bị dữ liệu hai người, câu hỏi và bối cảnh trước khi so khớp tình cảm, hôn nhân hoặc hợp tác theo lá số.",
    body: `
      <main class="prerender-shell">
        <section class="prerender-hero">
          <h1>So khớp quan hệ theo lá số</h1>
          <p>Chuẩn bị dữ liệu cho hai người và xác định câu hỏi chính trước khi đối chiếu: tình cảm, hôn nhân, hợp tác, tài chính hay nhịp sống.</p>
        </section>
      </main>
    `,
  },
  ...articlePosts.map((post) => ({
    route: post.route,
    title: post.title,
    description: post.description,
    body: renderArticleBody(post),
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

console.log(`Prerendered ${routes.length} routes into dist`);

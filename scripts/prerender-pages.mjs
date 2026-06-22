import fs from "node:fs";
import path from "node:path";

const distDir = path.resolve("dist");
const indexPath = path.join(distDir, "index.html");
const siteUrl = "https://tuvi.pages.dev";

const blogPosts = [
  {
    route: "/blog/menh-va-than-trong-tu-vi-la-gi",
    title: "Mệnh và Thân trong tử vi là gì? | Blog Tử Vi",
    description: "Hiểu vai trò của Mệnh và Thân để đọc lá số dễ hơn và biết nên bắt đầu từ đâu.",
  },
  {
    route: "/blog/dai-van-va-tieu-van-la-gi",
    title: "Đại vận và tiểu vận là gì? | Blog Tử Vi",
    description: "Phân biệt hai lớp vận trình quan trọng để theo dõi từng giai đoạn cuộc sống rõ ràng hơn.",
  },
  {
    route: "/blog/cung-quan-loc-noi-gi-ve-su-nghiep",
    title: "Cung Quan Lộc nói gì về sự nghiệp? | Blog Tử Vi",
    description: "Khám phá cách cung Quan Lộc phản ánh hướng phát triển nghề nghiệp và cơ hội thăng tiến.",
  },
  {
    route: "/blog/cung-tai-bach-noi-gi-ve-tai-loc",
    title: "Cung Tài Bạch nói gì về tài lộc? | Blog Tử Vi",
    description: "Tìm hiểu cách xem xu hướng tiền bạc, tích lũy và các điểm cần thận trọng trong tài chính.",
  },
  {
    route: "/blog/khong-nho-gio-sinh-co-lap-la-so-duoc-khong",
    title: "Không nhớ giờ sinh có lập lá số tử vi được không? | Blog Tử Vi",
    description: "Xem trường hợp chưa rõ giờ sinh nên hiểu kết quả như thế nào và cách giảm sai lệch khi đọc lá số.",
  },
  {
    route: "/blog/cung-phu-the-noi-gi-ve-tinh-duyen",
    title: "Cung Phu Thê nói gì về tình duyên? | Blog Tử Vi",
    description: "Hiểu vai trò của cung Phu Thê khi xem xu hướng gắn kết, hôn nhân và cách xây dựng mối quan hệ.",
  },
  {
    route: "/blog/cach-xac-dinh-gio-sinh-trong-tu-vi",
    title: "Cách xác định giờ sinh trong tử vi | Blog Tử Vi",
    description: "Một vài gợi ý thực tế để đối chiếu thông tin và giảm sai lệch khi bạn chưa chắc giờ sinh của mình.",
  },
  {
    route: "/blog/la-so-tu-vi-gom-nhung-phan-nao",
    title: "Lá số tử vi gồm những phần nào? | Blog Tử Vi",
    description: "Tìm hiểu các phần nền tảng như Mệnh, Thân, 12 cung, chính tinh, phụ tinh, đại vận và tiểu vận.",
  },
  {
    route: "/blog/chinh-tinh-va-phu-tinh-la-gi",
    title: "Chính tinh và phụ tinh là gì? | Blog Tử Vi",
    description: "Phân biệt hai nhóm sao thường gặp khi bắt đầu đọc lá số tử vi và cách hiểu vai trò của chúng.",
  },
  {
    route: "/blog/xem-van-han-nam-2026-theo-la-so-tu-vi",
    title: "Xem vận hạn năm 2026 theo lá số tử vi | Blog Tử Vi",
    description: "Cách tiếp cận năm đang xem trong lá số để nhận diện những giai đoạn cần chủ động hơn về công việc và tài chính.",
  },
];

const routes = [
  {
    route: "/",
    title: "LaSoTuVi - Lập Lá Số Tử Vi Online & Luận Giải Theo Lá Số",
    description:
      "Lập lá số tử vi online miễn phí, xem Mệnh, Thân, 12 cung, đại vận, tiểu vận và hỏi thêm theo lá số về sự nghiệp, tài lộc, tình duyên.",
    body: `
      <main class="prerender-shell">
        <section class="prerender-hero">
          <p class="prerender-kicker">LaSoTuVi</p>
          <h1>Lập lá số tử vi online theo ngày giờ sinh</h1>
          <p>Tạo lá số miễn phí, xem nhanh Mệnh, Thân, 12 cung, đại vận, tiểu vận và nhận luận giải dễ hiểu về sự nghiệp, tài lộc, tình duyên.</p>
          <div class="prerender-actions">
            <a href="/lap-la-so">Lập lá số miễn phí</a>
            <a href="/la-so-mau" class="secondary">Xem lá số mẫu</a>
          </div>
        </section>
      </main>
    `,
  },
  {
    route: "/lap-la-so",
    title: "Lập Lá Số Tử Vi Online Miễn Phí Theo Ngày Giờ Sinh",
    description:
      "Công cụ lập lá số tử vi online miễn phí theo ngày giờ sinh. Xem Mệnh, Thân, 12 cung, chính tinh, phụ tinh, đại vận và tiểu vận.",
    body: `
      <main class="prerender-shell">
        <section class="prerender-hero">
          <h1>Lập lá số tử vi online miễn phí theo ngày giờ sinh</h1>
          <p>Nhập ngày sinh, giờ sinh, giới tính và năm muốn xem để hệ thống an lá số, xác định Mệnh, Thân, 12 cung, chính tinh, phụ tinh, đại vận và tiểu vận.</p>
        </section>
      </main>
    `,
  },
  {
    route: "/bang-gia",
    title: "Bảng Giá Luận Giải Tử Vi - Hỏi 1 Câu Từ 50.000đ",
    description:
      "Xem các gói luận giải tử vi: lập lá số miễn phí, hỏi 1 câu theo lá số 50.000đ và tư vấn trực tiếp với thầy 999.000đ.",
    body: `
      <main class="prerender-shell">
        <section class="prerender-hero">
          <h1>Bảng giá luận giải tử vi</h1>
          <p>Bạn có thể lập lá số miễn phí trước, sau đó chọn hỏi 1 câu theo lá số hoặc tư vấn trực tiếp khi cần phân tích sâu hơn.</p>
        </section>
      </main>
    `,
  },
  {
    route: "/la-so-mau",
    title: "Lá Số Tử Vi Mẫu - Xem Cách Luận Giải Lá Số",
    description:
      "Xem lá số tử vi mẫu để hiểu cách trình bày Mệnh, Thân, 12 cung, đại vận, tiểu vận và các phần luận giải.",
    body: `
      <main class="prerender-shell">
        <section class="prerender-hero">
          <h1>Lá số tử vi mẫu</h1>
          <p>Xem trước cách LaSoTuVi trình bày Mệnh, Thân, 12 cung, đại vận, tiểu vận và các phần luận giải trước khi lập lá số của riêng bạn.</p>
        </section>
      </main>
    `,
  },
  {
    route: "/blog",
    title: "Blog Tử Vi - Kiến Thức Lá Số, Đại Vận, Tiểu Vận",
    description:
      "Kiến thức tử vi dễ hiểu về lá số, Mệnh, Thân, 12 cung, đại vận, tiểu vận, sự nghiệp, tài lộc và tình duyên.",
    body: `
      <main class="prerender-shell">
        <section class="prerender-hero">
          <h1>Blog tử vi</h1>
          <p>Kiến thức dễ hiểu về lá số tử vi, Mệnh, Thân, 12 cung, đại vận, tiểu vận và cách ứng dụng khi xem sự nghiệp, tài lộc, tình duyên.</p>
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
    route: "/hop-tuoi",
    title: "Hợp Tuổi - Nội Dung Đang Hoàn Thiện",
    description:
      "Trang hợp tuổi đang được hoàn thiện để cung cấp trải nghiệm rõ ràng và nhất quán với hệ thống lá số hiện tại.",
    noindex: true,
    body: `
      <main class="prerender-shell">
        <section class="prerender-hero">
          <h1>Hợp tuổi đang được hoàn thiện</h1>
          <p>Tính năng này sẽ được mở khi có đủ dữ liệu và luồng giải thích rõ ràng cho người dùng.</p>
        </section>
      </main>
    `,
  },
  ...blogPosts.map((post) => ({
    route: post.route,
    title: post.title,
    description: post.description,
    body: `
      <main class="prerender-shell">
        <section class="prerender-hero">
          <h1>${post.title.replace(" | Blog Tử Vi", "")}</h1>
          <p>${post.description}</p>
          <div class="prerender-actions">
            <a href="/lap-la-so">Lập lá số miễn phí</a>
            <a href="/blog" class="secondary">Quay lại blog</a>
          </div>
        </section>
      </main>
    `,
  })),
];

const prerenderStyles = `
<style id="prerender-css">
  .prerender-shell{padding:24px;font-family:"Be Vietnam Pro",sans-serif;color:#211A13;background:#FFF8ED}
  .prerender-hero,.prerender-section{max-width:980px;margin:0 auto 24px}
  .prerender-kicker{font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:#6B567A}
  .prerender-hero h1,.prerender-section h2{font-family:"Cormorant Garamond",serif}
  .prerender-hero h1{font-size:48px;line-height:1.05;margin:0 0 12px}
  .prerender-hero p,.prerender-section p,.prerender-section li{font-size:18px;line-height:1.7;color:#6F6254}
  .prerender-section ul{padding-left:20px}
  .prerender-actions{display:flex;gap:12px;flex-wrap:wrap;margin-top:20px}
  .prerender-actions a{display:inline-flex;align-items:center;justify-content:center;padding:12px 20px;border-radius:999px;background:#2E1748;color:#FFFDF8;text-decoration:none;font-weight:600}
  .prerender-actions a.secondary{background:#FFFDF8;color:#2E1748;border:1px solid #E8D9C1}
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
  html = replaceTag(html, /<meta\s+property="og:url"[\s\S]*?\/>/, `<meta property="og:url" content="${siteUrl}${page.route}" />`);
  html = replaceTag(html, /<meta\s+name="twitter:title"[\s\S]*?\/>/, `<meta name="twitter:title" content="${page.title}" />`);
  html = replaceTag(html, /<meta\s+name="twitter:description"[\s\S]*?\/>/, `<meta name="twitter:description" content="${page.description}" />`);
  html = replaceTag(html, /<link\s+rel="canonical"[\s\S]*?>/, `<link rel="canonical" href="${siteUrl}${page.route}" />`);
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

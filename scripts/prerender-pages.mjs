import fs from "node:fs";
import path from "node:path";

const distDir = path.resolve("dist");
const indexPath = path.join(distDir, "index.html");
const siteUrl = "https://tuvi.pages.dev";

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
        <section class="prerender-section">
          <h2>LaSoTuVi giúp bạn xem gì?</h2>
          <ul>
            <li>Tổng quan Mệnh - Thân</li>
            <li>Sự nghiệp và Quan Lộc</li>
            <li>Tài lộc và dòng tiền</li>
            <li>Tình duyên và hôn nhân</li>
            <li>Vận hạn theo năm</li>
          </ul>
        </section>
        <section class="prerender-section">
          <h2>Câu hỏi thường gặp</h2>
          <p>Lập lá số tử vi online có miễn phí không? Có. Bạn có thể xem lá số cơ bản miễn phí trước khi chọn gói hỏi sâu hơn theo nhu cầu.</p>
          <p>Không nhớ giờ sinh thì có xem được không? Có thể xem bản tham khảo tổng quan, nhưng độ chi tiết sẽ thấp hơn khi có giờ sinh cụ thể.</p>
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
        <section class="prerender-section">
          <h2>Lá số tử vi là gì?</h2>
          <p>Lá số tử vi là bố cục thông tin theo ngày giờ sinh giúp người xem có cái nhìn hệ thống về Mệnh, Thân, các cung và những giai đoạn vận hành nổi bật trong cuộc sống.</p>
          <h2>Vì sao giờ sinh quan trọng?</h2>
          <p>Giờ sinh ảnh hưởng trực tiếp tới cách an cung và vị trí sao. Khi có dữ liệu chính xác hơn, phần xem lá số và diễn giải thường sát hơn.</p>
          <h2>Lập lá số miễn phí khác gì luận giải chuyên sâu?</h2>
          <p>Bản miễn phí phù hợp để xem nền tảng lá số. Khi cần đi sâu vào một quyết định cụ thể, bạn có thể chọn hỏi 1 câu theo lá số hoặc đặt lịch tư vấn trực tiếp.</p>
        </section>
        <section class="prerender-section">
          <h2>Liên kết nội bộ</h2>
          <p><a href="/bang-gia">Xem bảng giá luận giải tử vi</a></p>
          <p><a href="/la-so-mau">Xem lá số tử vi mẫu</a></p>
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
        <section class="prerender-section">
          <h2>Các gói chính</h2>
          <ul>
            <li>0đ - Lập lá số miễn phí</li>
            <li>50.000đ - Hỏi 1 câu theo lá số</li>
            <li>999.000đ - Tư vấn trực tiếp với thầy</li>
          </ul>
        </section>
        <section class="prerender-section">
          <h2>FAQ bảng giá</h2>
          <p>Tôi có thể xem miễn phí trước không? Có, đây là bước phù hợp để xem bố cục lá số trước khi chọn dịch vụ trả phí.</p>
          <p>Có cần lập lá số trước khi hỏi không? Nên có, để phần trả lời bám đúng dữ liệu cá nhân của bạn.</p>
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
        <section class="prerender-section">
          <h2>Nội dung mẫu</h2>
          <ul>
            <li>Mệnh, Thân và Cục</li>
            <li>Đại vận, tiểu vận</li>
            <li>Ví dụ luận giải sự nghiệp, tài lộc, tình duyên</li>
          </ul>
          <p><a href="/lap-la-so">Lập lá số của tôi</a></p>
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
        <section class="prerender-section">
          <h2>Bài viết nổi bật</h2>
          <ul>
            <li>Mệnh và Thân trong tử vi là gì?</li>
            <li>Đại vận và tiểu vận là gì?</li>
            <li>Cung Quan Lộc nói gì về sự nghiệp?</li>
            <li>Cung Tài Bạch nói gì về tài lộc?</li>
          </ul>
          <p><a href="/lap-la-so">Lập lá số miễn phí</a></p>
        </section>
      </main>
    `,
  },
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

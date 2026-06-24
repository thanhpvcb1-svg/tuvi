import fs from "node:fs";
import path from "node:path";

const distDir = path.resolve("dist");
const indexPath = path.join(distDir, "index.html");
const siteUrl = "https://tuvi.pages.dev";

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
            <a href="/bai-viet">Mở danh sách bài viết</a>
            <a href="/lap-la-so" class="secondary">Lập lá số miễn phí</a>
          </div>
        </section>
      </main>
    `,
  },
  {
    route: "/video",
    title: "video",
    description:
      "Tổng hợp video ngắn về Tử Vi, Bắc Phái, Tứ Hóa Phi Tinh và luận giải mệnh bàn.",
    body: `
      <main class="prerender-shell">
        <section class="prerender-hero">
          <h1>Video</h1>
          <p>Tổng hợp video ngắn về Tử Vi, Bắc Phái, Tứ Hóa Phi Tinh và luận giải mệnh bàn từ YouTube và TikTok của Thiên Ngân Tử.</p>
          <div class="prerender-actions">
            <a href="/video">Xem danh sách video</a>
            <a href="/lap-la-so" class="secondary">Lập lá số miễn phí</a>
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
  ...articlePosts.map((post) => ({
    route: post.route,
    title: post.title,
    description: post.description,
    body: `
      <main class="prerender-shell">
        <section class="prerender-hero">
          <h1>${post.title.replace(" | Bài viết", "")}</h1>
          <p>${post.description}</p>
          <div class="prerender-actions">
            <a href="/bai-viet">Vào bài viết</a>
            <a href="/lap-la-so" class="secondary">Lập lá số miễn phí</a>
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
  .prerender-kicker{font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:#8B672C}
  .prerender-hero h1,.prerender-section h2{font-family:"Cormorant Garamond",serif}
  .prerender-hero h1{font-size:48px;line-height:1.05;margin:0 0 12px}
  .prerender-hero p,.prerender-section p,.prerender-section li{font-size:18px;line-height:1.7;color:#6F6254}
  .prerender-section ul{padding-left:20px}
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

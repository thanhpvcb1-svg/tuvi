/**
 * Script tự động generate sitemap.xml với lastmod = ngày hiện tại
 * Chạy: node scripts/generate-sitemap.mjs
 */

import fs from 'fs';
import path from 'path';

const DOMAIN = 'https://tuviphonglam.com';
const TODAY = new Date().toISOString().split('T')[0];

const pages = [
  { url: '/', changefreq: 'weekly', priority: '1.0' },
  { url: '/lap-la-so', changefreq: 'weekly', priority: '0.9' },
  { url: '/bang-gia', changefreq: 'monthly', priority: '0.8' },
  { url: '/la-so-mau', changefreq: 'monthly', priority: '0.7' },
  { url: '/bai-viet', changefreq: 'weekly', priority: '0.8' },
  { url: '/video', changefreq: 'weekly', priority: '0.6' },
  { url: '/hop-tuoi', changefreq: 'monthly', priority: '0.6' },
  { url: '/faq', changefreq: 'monthly', priority: '0.5' },
  { url: '/lien-he', changefreq: 'monthly', priority: '0.7' },
  { url: '/ve-chung-toi', changefreq: 'monthly', priority: '0.6' },
  { url: '/dieu-khoan-su-dung', changefreq: 'yearly', priority: '0.3' },
  { url: '/chinh-sach-bao-mat', changefreq: 'yearly', priority: '0.3' },
  // Blog articles
  { url: '/bai-viet/tu-vi-bac-phai-la-gi', changefreq: 'monthly', priority: '0.7' },
  { url: '/bai-viet/tu-hoa-phi-tinh-la-gi', changefreq: 'monthly', priority: '0.7' },
  { url: '/bai-viet/loc-quyen-khoa-ky-co-y-nghia-gi', changefreq: 'monthly', priority: '0.7' },
  { url: '/bai-viet/phi-nhap-va-phi-xuat-la-gi', changefreq: 'monthly', priority: '0.7' },
  { url: '/bai-viet/tu-hoa-la-gi', changefreq: 'monthly', priority: '0.7' },
  { url: '/bai-viet/dai-van-va-luu-nien-trong-bac-phai', changefreq: 'monthly', priority: '0.7' },
];

function generateSitemap() {
  const urls = pages.map(page => `  <url>
    <loc>${DOMAIN}${page.url}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n');

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

  const outputPath = path.join(process.cwd(), 'sitemap.xml');
  fs.writeFileSync(outputPath, sitemap, 'utf-8');
  console.log(`✅ Sitemap generated: ${outputPath}`);
  console.log(`   Last modified: ${TODAY}`);
  console.log(`   Total URLs: ${pages.length}`);
}

generateSitemap();

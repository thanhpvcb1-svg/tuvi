# Deploy React Vite len Cloudflare Pages

## Cau hinh build

- Framework preset: `Vite`
- Build command: `npm run build`
- Build output directory: `dist`
- Production branch: `main`

## Cac buoc deploy

1. Mo `Cloudflare Dashboard`
2. Vao `Workers & Pages`
3. Chon `Create application`
4. Chon `Pages`
5. Chon `Import Git repository`
6. Chon dung repository cua project
7. Chon `Framework preset: Vite`
8. Nhap `Build command: npm run build`
9. Nhap `Build output directory: dist`
10. Chon `Production branch: main`
11. Bam `Save and Deploy`

## SPA routing

Project da co file `public/_redirects` voi noi dung:

```txt
/*    /index.html   200
```

Muc dich la de cac route SPA nhu `/lap-la-so`, `/bang-gia`, `/la-so-mau`, `/blog` khi refresh truc tiep se khong bi `404`.

## Robots va sitemap

- `public/robots.txt` dang tro toi sitemap tam:
  - `https://tuvi-demo.pages.dev/sitemap.xml`
- `public/sitemap.xml` dang khai bao cac route chinh:
  - `/`
  - `/lap-la-so`
  - `/bang-gia`
  - `/la-so-mau`
  - `/blog`

Khi co domain that, hay doi tat ca URL `https://tuvi-demo.pages.dev` thanh domain production.

## Bien moi truong

- Frontend chi nen dung bien moi truong bat dau bang `VITE_`
- Khong dua API key bi mat vao frontend
- Hien tai project co Netlify Function dung `GEMINI_API_KEY`; phan nay khong hoat dong tren Cloudflare Pages static neu chua chuyen sang backend hoac Cloudflare Functions

## Kiem tra local

```bash
npm install
npm run build
```

Neu can kiem tra type:

```bash
npm run typecheck
```

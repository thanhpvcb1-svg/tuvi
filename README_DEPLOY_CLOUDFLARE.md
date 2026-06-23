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
- Cloudflare Pages Function `functions/api/ai/luan-giai.ts` doc secret server-side tu `GEMINI_API_KEY`
- Khong commit `.dev.vars`, `.env` hoac bat ky secret nao vao repository

## AI Pages Function

- Endpoint noi bo: `/api/ai/luan-giai`
- Method: `POST`
- Secret can cau hinh tren Cloudflare Pages Production/Preview:

```txt
GEMINI_API_KEY=your_real_key
```

- Frontend khong duoc dung `VITE_GEMINI_API_KEY`

## Chay local voi Pages Function

1. Tao file `.dev.vars` o root project:

```txt
GEMINI_API_KEY=your_local_key_here
```

2. Build frontend:

```bash
npm run build
```

3. Chay local bang Cloudflare Pages:

```bash
npx wrangler pages dev dist
```

4. Test endpoint local:

```bash
curl -X POST http://127.0.0.1:8788/api/ai/luan-giai \
  -H "content-type: application/json" \
  -d "{\"gender\":\"Nam\",\"birthDate\":\"1995-08-12\",\"birthTime\":\"23:30\",\"yearToView\":2026,\"menh\":\"Kim\",\"than\":\"Thân cư Mệnh\"}"
```

## Kiem tra local

```bash
npm install
npm run build
```

Neu can kiem tra type:

```bash
npm run typecheck
```

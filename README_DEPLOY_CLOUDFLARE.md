# Deploy React Vite len Cloudflare Pages

## Cau hinh build

- Framework preset: `Vite` (hoặc `None` nếu gặp lỗi auto-detection)
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
- Cloudflare Pages Function `functions/api/youtube-lessons.ts` doc config server-side tu `YOUTUBE_LESSONS_CHANNEL_ID`
- Khong commit `.dev.vars`, `.env` hoac bat ky secret nao vao repository

## AI Pages Function

- Endpoint noi bo: `/api/ai/luan-giai`
- Method: `POST`
- Secret can cau hinh tren Cloudflare Pages Production/Preview:

```txt
GEMINI_API_KEY=your_real_key
YOUTUBE_LESSONS_CHANNEL_ID=your_youtube_channel_id
```

- Frontend khong duoc dung `VITE_GEMINI_API_KEY`

## Tri thuc luan giai tren server (tuy chon)

Mac dinh (`VITE_KNOWLEDGE_MODE` khong dat) kho tri thuc duoc tai ve trinh duyet (cac file `assets/k-*.js`, ~24 MB).
Che do server: trinh duyet chi gui du kien la so (~8 KB, khong co ho ten / ngay gio sinh) toi `/api/knowledge/query`,
kho khong nam trong bundle.

1. Can goi **Workers Paid** (gioi han 10 ms CPU cua goi Free khong du: moi la so ~0,6-1 s CPU).
2. Dat bien moi truong build tren Cloudflare Pages (Production + Preview): `VITE_KNOWLEDGE_MODE=server`, roi deploy lai.
3. `npm run build` luon sinh `dist/_kb/*` (cac manh kho theo dia chi); `functions/_kb/[[path]].ts` chan truy cap cong khai,
   chi Function doc qua `env.ASSETS`.
4. Kiem tra truoc khi bat: `npm run build && npm run test-knowledge-server` (ket qua server phai giong het trinh duyet).
5. Nen bind `RATE_LIMIT_KV` (xem `functions/api/ai/_shared/rateLimit.ts`) - endpoint gioi han 240 request/gio/IP.

Tat che do server: xoa bien `VITE_KNOWLEDGE_MODE` va deploy lai.

## Chay local voi Pages Function

1. Tao file `.dev.vars` o root project:

```txt
GEMINI_API_KEY=your_local_key_here
YOUTUBE_LESSONS_CHANNEL_ID=your_youtube_channel_id
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

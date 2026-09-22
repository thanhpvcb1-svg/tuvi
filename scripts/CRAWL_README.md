# Knowledge Crawler Scripts

Các script để crawl và import tri thức Tử Vi từ cohoc.net vào project.

## Vấn đề

Khi crawl toàn bộ tri thức cùng lúc, có thể gặp lỗi:
- "Too much context loaded"
- Memory overflow
- Request timeout

## Giải pháp

Sử dụng các script crawl **incremental/streaming** để xử lý từng phần nhỏ.

## Scripts

### 1. crawl-incremental.mjs

Crawl từng cung một, save ngay sau mỗi batch.

```bash
# Crawl tất cả cung
node scripts/crawl-incremental.mjs

# Chỉ crawl cung Mệnh
node scripts/crawl-incremental.mjs --palace menh

# Tiếp tục từ checkpoint (nếu bị gián đoạn)
node scripts/crawl-incremental.mjs --resume

# Test mode (không save file)
node scripts/crawl-incremental.mjs --dry-run
```

### 2. crawl-streaming.mjs

Import từ fixture đã crawl sẵn, xử lý theo kiểu streaming.

```bash
# Import từ fixture
node scripts/crawl-streaming.mjs --from-fixture 472159
```

### 3. import-cohoc-to-knowledge.mjs

Import từ file interpretations.json.

```bash
# Import tất cả (cách cũ)
node import-cohoc-to-knowledge.mjs 472159

# Import incremental (khuyến nghị)
node import-cohoc-to-knowledge.mjs 472159 --incremental

# Chỉ import 1 cung
node import-cohoc-to-knowledge.mjs 472159 --incremental --palace menh
```

## Workflow khuyến nghị

1. **Crawl fixture trước** (nếu chưa có):
   ```bash
   cd tuvi_crawler
   python crawler.py <chart_url>
   ```

2. **Import incremental**:
   ```bash
   node import-cohoc-to-knowledge.mjs 472159 --incremental
   ```

3. **Hoặc dùng streaming**:
   ```bash
   node scripts/crawl-streaming.mjs --from-fixture 472159
   ```

## Output

Files được save vào: `src/lib/tuvi/knowledge/cung/`

Format:
- `menh-cohoc-full.json` - Cung Mệnh
- `phu-the-cohoc-full.json` - Cung Phu Thê
- ...

## Checkpoint

Khi crawl bị gián đoạn, checkpoint được lưu tại `.crawl-checkpoint.json`.
Dùng `--resume` để tiếp tục từ vị trí đã dừng.

## Cấu hình

Trong mỗi script có thể điều chỉnh:
- `batchSize` / `chunkSize`: Số block xử lý mỗi lần
- `delayMs`: Delay giữa các request
- `maxBlockLength`: Giới hạn độ dài mỗi block

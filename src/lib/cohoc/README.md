# CoHoc.net Integration Module

Module lấy dữ liệu lá số Tử Vi từ `tuvi.cohoc.net`.

## Features

- ✅ Input dương lịch, tự động convert sang âm lịch
- ✅ Tự động lấy CSRF token
- ✅ Tự động tạo session
- ✅ Không hard-code cookie/token
- ✅ Error handling với retry
- ✅ TypeScript types đầy đủ

## Usage

### Frontend (React)

```typescript
import { fetchCoHocChart } from "../lib/cohoc";

const result = await fetchCoHocChart({
  name: "Thành",
  birthDate: "1998-10-26", // Solar date YYYY-MM-DD
  birthHour: 23,
  birthMinute: 30,
  gender: "male",
  targetYear: 2026,
});

if ("error" in result) {
  console.error(result.error.message);
} else {
  console.log(result.chart); // Mệnh, Thân, Cục...
  console.log(result.palaces); // 12 cung
}
```

### Cloudflare Pages Function API

```bash
POST /api/cohoc-fetch
Content-Type: application/json

{
  "name": "Thành",
  "birthDate": "1998-10-26",
  "birthHour": 23,
  "birthMinute": 30,
  "gender": "male",
  "targetYear": 2026
}
```

Response:
```json
{
  "success": true,
  "data": {
    "source": {
      "provider": "cohoc.net",
      "engine": "Core.html",
      "version": "20211215"
    },
    "input": { ... },
    "lunar": {
      "year": 1998,
      "month": 9,
      "day": 7,
      "hourBranch": "Tý"
    },
    "chart": {
      "menh": "...",
      "than": "...",
      "cuc": "..."
    },
    "palaces": { ... }
  }
}
```

## Architecture

```
src/lib/cohoc/
├── index.ts      # Main exports
├── types.ts      # TypeScript types
├── constants.ts  # Hour mapping, URLs
├── calendar.ts   # Solar → Lunar converter
├── client.ts     # HTTP client, CSRF handling
└── parser.ts     # HTML parser

functions/api/
└── cohoc-fetch.ts  # Serverless endpoint
```

## Development

### Capture HTML Fixture

```bash
npx ts-node scripts/capture-cohoc.ts
```

This saves HTML response to `tests/fixtures/cohoc/` for parser development.

### Update Parser

1. Run capture script
2. Open `tests/fixtures/cohoc/core-response-latest.html` in browser
3. Inspect DOM structure
4. Update `src/lib/cohoc/parser.ts` with correct selectors

## Hour Mapping

| Hour | Branch | CoHoc gio |
|------|--------|-----------|
| 23-00 | Tý | 1 |
| 01-02 | Sửu | 2 |
| 03-04 | Dần | 3 |
| 05-06 | Mão | 4 |
| 07-08 | Thìn | 5 |
| 09-10 | Tỵ | 6 |
| 11-12 | Ngọ | 7 |
| 13-14 | Mùi | 8 |
| 15-16 | Thân | 9 |
| 17-18 | Dậu | 10 |
| 19-20 | Tuất | 11 |
| 21-22 | Hợi | 12 |

## Error Codes

| Code | Description |
|------|-------------|
| `CSRF_ERROR` | Cannot get CSRF token |
| `NETWORK_ERROR` | Connection failed |
| `PARSE_ERROR` | Cannot parse HTML |
| `INVALID_INPUT` | Invalid input data |
| `SESSION_ERROR` | Session expired |

## Known Limitations

1. **Parser incomplete**: Cần HTML fixture thực tế để hoàn thiện parser
2. **Tý hour handling**: Cần xác định convention của cohoc.net cho giờ Tý (23:00-23:59)
3. **Rate limiting**: Không nên gọi quá nhiều request liên tục

## TODO

- [ ] Hoàn thiện parser sau khi có HTML fixture
- [ ] Thêm unit tests
- [ ] Xác định chính xác mapping giờ
- [ ] Xử lý tháng nhuận
- [ ] Cache lunar conversion

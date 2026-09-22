# TuVi Crawler

Crawler để crawl dữ liệu lá số tử vi từ tuvi.cohoc.net.

## Cài đặt

```bash
# Tạo virtual environment
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac

# Cài dependencies
pip install -r requirements.txt

# Cài Playwright browsers
playwright install chromium
```

## Sử dụng

### Cơ bản
```bash
python crawler.py "https://tuvi.cohoc.net/bac-phai-la-so-tu-vi-nam-mau-dan-thang-9-ngay-7-gio-ti-duong-nam-lid-472159.html"
```

### Với browser có giao diện (để debug)
```bash
python crawler.py URL --headed
```

### Debug mode (log chi tiết)
```bash
python crawler.py URL --debug
```

### Tăng thời gian chờ
```bash
python crawler.py URL --wait 20
```

### Kết hợp
```bash
python crawler.py URL --headed --debug --wait 30
```

## Output

```
output/
└── 472159/
    ├── page.html              # HTML cuối cùng
    ├── page.txt               # Text content
    ├── cookies.json           # Cookies
    ├── localStorage.json      # Local storage
    ├── sessionStorage.json    # Session storage
    ├── network.json           # Tất cả network requests
    ├── chart_candidates.json  # JSON có thể chứa lá số
    ├── normalized_chart.json  # Dữ liệu đã chuẩn hóa
    ├── raw_chart.json         # Dữ liệu gốc
    ├── scripts_analysis.json  # Phân tích JavaScript
    ├── tokens.json            # Tokens phát hiện được
    ├── metadata.json          # Metadata
    └── responses/             # Tất cả response bodies
        ├── response_001.json
        ├── response_002.js
        └── ...
```

## Cấu trúc project

```
tuvi_crawler/
├── crawler.py      # Main entry point
├── network.py      # Network interception
├── parser.py       # HTML/JS parsing
├── normalizer.py   # Data normalization
├── storage.py      # File storage
├── requirements.txt
└── README.md
```

## Xử lý Anti-bot

Nếu website redirect về 404 hoặc trang "robot":

1. Chạy với `--headed` để xem browser
2. Hoàn thành challenge thủ công nếu có
3. Nhấn ENTER để crawler tiếp tục
4. Kiểm tra `network.json` để phân tích

## Phân tích kết quả

### Nếu tìm được chart data:
- Xem `chart_candidates.json` để biết nguồn
- Xem `normalized_chart.json` cho dữ liệu đã chuẩn hóa
- Xem `raw_chart.json` cho dữ liệu gốc

### Nếu không tìm được:
1. Kiểm tra `page.html` - có thể data render server-side
2. Kiểm tra `scripts_analysis.json` - có thể data trong JS
3. Kiểm tra `network.json` - tìm request đáng nghi
4. Kiểm tra `localStorage.json` - có thể data cached

## Keywords tử vi

Crawler tự động phát hiện JSON chứa:
- 12 cung: Mệnh, Phụ Mẫu, Phúc Đức, Điền Trạch, Quan Lộc, Nô Bộc, Thiên Di, Tật Ách, Tài Bạch, Tử Tức, Phu Thê, Huynh Đệ
- Chính tinh: Tử Vi, Thiên Cơ, Thái Dương, Vũ Khúc, Thiên Đồng, Liêm Trinh, Thiên Phủ, Thái Âm, Tham Lang, Cự Môn, Thiên Tướng, Thiên Lương, Thất Sát, Phá Quân

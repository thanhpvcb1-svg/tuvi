# Template Luận Giải Bắc Phái

Các template dưới đây chỉ là khung câu để AI/engine sinh diễn giải ngắn, trung tính, có evidence. Không dùng để kết luận tuyệt đối.

## Sinh niên Tứ Hóa

### Input

- `sourceStem`
- `mutagenType`
- `targetStar`
- `targetPalaceName`
- `layer`

### Template

`Sinh niên {mutagenType} từ can {sourceStem} nhập {targetPalaceName} qua sao {targetStar}. Khi đọc theo Bắc Phái, đây là một tuyến nền cho thấy chủ đề của {targetPalaceName} dễ trở thành điểm được kích hoạt trong lá số gốc.`

## Phi Cung Tứ Hóa

### Input

- `sourcePalaceName`
- `sourceStem`
- `mutagenType`
- `targetStar`
- `targetPalaceName`

### Template

`{sourcePalaceName} lấy can {sourceStem} phát {mutagenType} tới sao {targetStar}, nhập {targetPalaceName}. Tuyến này cho thấy chủ đề của {sourcePalaceName} có liên hệ trực tiếp với phạm vi {targetPalaceName}.`

## Kỵ nhập

### Input

- `sourcePalaceName`
- `targetPalaceName`
- `clashPalaceName`
- `targetStar`

### Template

`{sourcePalaceName} Hóa Kỵ nhập {targetPalaceName}, đồng thời xung {clashPalaceName} qua sao {targetStar}. Khi đọc theo Bắc Phái, đây thường là tuyến cho thấy chủ đề của {sourcePalaceName} mang áp lực, điểm vướng hoặc trách nhiệm đi vào phạm vi {targetPalaceName}.`

## Kỵ xung

### Input

- `sourcePalaceName`
- `jiInPalaceName`
- `jiClashPalaceName`

### Template

`Do Hóa Kỵ nhập {jiInPalaceName}, trục đối cung {jiClashPalaceName} cũng bị tác động. Vì vậy khi đọc kết quả, nên xem đồng thời cả cung nhập và cung xung để tránh kết luận một chiều.`

## Tự Hóa

### Input

- `palaceName`
- `mutagenType`
- `targetStar`

### Template

`{palaceName} có {mutagenType} tại sao {targetStar}. Đây là dấu hiệu cung này tự phát sinh vòng tác động nội tại, dễ tạo cơ chế tự điều chỉnh, tự lặp hoặc tự gia tăng trọng số ở chính chủ đề của cung.`

## Lai Nhân Cung

### Input

- `palaceName`
- `stem`
- `branch`

### Template

`Lai Nhân Cung rơi vào {palaceName} ({stem} {branch}). Khi đọc theo lớp Bắc Phái/Khâm Thiên, đây có thể xem là một chủ đề nhân duyên trọng tâm và nên được đối chiếu với các tuyến phi hóa phát ra hoặc nhập vào cung này.`

## Thái Tuế Nhập Quái

### Input

- `year`
- `yearStem`
- `yearBranch`
- `targetPalaceName`

### Template

`Năm {year} ({yearStem} {yearBranch}), Thái Tuế nhập {targetPalaceName}. Trong lớp lưu niên, đây là một điểm dễ được kích hoạt mạnh hơn và nên đọc cùng các tuyến Tứ Hóa năm xem.`

## Lưu niên Tứ Hóa

### Input

- `year`
- `mutagenType`
- `targetStar`
- `targetPalaceName`

### Template

`Ở lớp lưu niên năm {year}, {mutagenType} qua sao {targetStar} nhập {targetPalaceName}. Điều này cho thấy phạm vi {targetPalaceName} là một điểm cần được theo dõi kỹ hơn trong năm xem hiện tại.`

## Truy Kỵ

### Input

- `startPalaceName`
- `chainLength`
- `stopReason`

### Template

`Chuỗi Truy Kỵ khởi từ {startPalaceName} kéo dài {chainLength} bước và dừng do {stopReason}. Cách đọc phù hợp là xem đây như một tuyến liên hoàn của áp lực hoặc điểm cần xử lý tuần tự, thay vì quy về một kết luận đơn lẻ.`

## Gợi ý ghép summary

- Ưu tiên nêu 3 đến 5 điểm nổi bật.
- Nên cân bằng giữa một điểm nền, một điểm động, một điểm cảnh báo.
- Có thể ưu tiên theo thứ tự:
  - Lai Nhân Cung
  - Sinh niên Hóa Kỵ
  - các Tự Hóa
  - Thái Tuế năm xem
  - Lưu niên Hóa Kỵ
  - Truy Kỵ quan trọng

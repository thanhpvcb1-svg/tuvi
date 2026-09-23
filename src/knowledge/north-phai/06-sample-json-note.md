# Ghi Chú Về JSON Lá Số Hiện Tại

Tài liệu này mô tả những điểm cần lưu ý khi đọc JSON lá số hiện có trong app để phục vụ engine Bắc Phái.

## Các điểm quan trọng

- `palaces[]` là nguồn chính.
  Đây là nơi phải dùng để chuẩn hóa 12 cung, stem, branch, sao nhìn thấy được, đối cung và các marker đặc biệt.

- `visibleStars[]` dùng để build `starIndex`.
  Khi cần tìm sao đích của Tứ Hóa, engine nên dò từ `palaces[].visibleStars[]` trước, vì đây là lớp sao thuận tiện nhất cho việc map sao -> cung.

- `focusPalaces` không dùng để tính.
  `focusPalaces` chỉ nên xem như subset hỗ trợ UI hoặc phần trình bày nhanh. Không dùng `focusPalaces` để build `starIndex` hay xác định cung chứa sao đích vì có thể gây duplicate hoặc thiếu dữ liệu.

- `stem` viết tắt cần normalize.
  Dữ liệu thực tế có thể dùng dạng viết tắt như `G`, `B`, `Đ`, `M`, `N`, `Q`. Engine cần map về dạng đầy đủ trước khi gọi adapter Tứ Hóa.

- `laiNhanCung` đã có sẵn.
  Nếu JSON đã cung cấp `laiNhanCung`, nên ưu tiên dùng chính field này và đánh dấu provenance là `json`.

- `horoscopeYear` dùng cho lưu niên.
  Lớp `Lưu Niên Tứ Hóa` và `Thái Tuế Nhập Quái` phải lấy mốc từ `horoscopeYear`, không lấy mặc định từ năm hệ thống nếu JSON đã có năm xem rõ ràng.

## Ý nghĩa thực thi

### 1. Vì sao `palaces[]` là nguồn chính

- Chứa đầy đủ 12 cung.
- Có thể giữ nguyên thứ tự cung để tính đối cung.
- Có branch và stem gắn trực tiếp trên từng cung.
- Là nguồn phù hợp để build `NormalizedChart`.

### 2. Vì sao `visibleStars[]` quan trọng

- Dễ tạo map `starName -> palace`.
- Thích hợp cho adapter và engine Bắc Phái vì Tứ Hóa cần tìm sao đích.
- Giảm khả năng sót sao hơn so với các tập con thiên về UI.

### 3. Vì sao không dùng `focusPalaces`

- Có nguy cơ chỉ là dữ liệu rút gọn.
- Có thể thiếu một số sao hoặc thiếu bối cảnh nguồn.
- Có thể làm `DUPLICATED_STAR_PLACEMENT` khó kiểm soát hơn.

## Ghi chú chuẩn hóa stem

Engine nên giữ cả hai giá trị:

- `originalStem`: giá trị gốc đọc từ JSON
- `stem`: giá trị đã normalize, ví dụ `M` -> `Mậu`

Điều này giúp:

- debug khi dữ liệu bất thường
- ghi evidence rõ hơn
- không sửa object gốc

## Ghi chú về Lai Nhân Cung

Nếu `laiNhanCung` đã có sẵn:

- coi đây là dữ liệu gốc đáng tin hơn so với compute fallback
- chỉ compute fallback khi field này vắng mặt
- giữ lại `source = "json"` trong output

## Ghi chú về năm xem

`horoscopeYear` là dữ liệu bắt buộc cho:

- `NORTH_TAI_SUI_ENTRY`
- `NORTH_ANNUAL_MUTAGENS`
- một phần summary theo lớp lưu niên

Nếu thiếu:

- phải warning `MISSING_HOROSCOPE_YEAR`
- không nên tự thay bằng năm hiện tại của máy chạy

## Nghi vấn dữ liệu cần để ý

- Nếu một giá trị thuộc `changsheng12` không nằm trong 12 trạng thái hợp lệ của vòng Tràng Sinh, engine nên phát warning.
- Một ví dụ điển hình là trường hợp `changsheng12` chứa tên sao thay vì tên trạng thái. Trường hợp này có thể là lỗi mapping hoặc lỗi lấy dữ liệu.

## Kết luận vận hành

Khi thiết kế engine Bắc Phái cho project này, trình tự đọc JSON nên là:

1. Lấy `palaces[]` để normalize.
2. Dùng `visibleStars[]` trong từng cung để build `starIndex`.
3. Dùng `laiNhanCung` có sẵn nếu tồn tại.
4. Dùng `horoscopeYear` cho lưu niên.
5. Bỏ qua `focusPalaces` trong tính toán lõi.

# Cấp Độ Kiến Thức Cho Engine Bắc Phái

## Level 1

### Thành phần

- Mệnh
- Thân
- Tam hợp
- Chính tinh
- Đối cung

### Mục tiêu

Xây nền nhận diện bố cục lá số trước khi đi vào tuyến phi hóa.

### Dữ liệu đầu vào

- `palaces[]`
- tên cung
- branch của cung
- nhóm sao chính, sao thấy được

### Dữ liệu đầu ra

- map cung chuẩn hóa
- đối cung
- các cụm cung nền để enrich interpretation

### Có thể code ngay hay cần bổ sung dữ liệu

Có thể code ngay từ JSON hiện tại. Đây là lớp nền bắt buộc.

## Level 2

### Thành phần

- Tứ Hóa năm sinh
- Vòng Thái Tuế
- Vòng Tràng Sinh

### Mục tiêu

Tạo lớp nền động tối thiểu để xác định các cung được kích hoạt bởi năm sinh và năm xem.

### Dữ liệu đầu vào

- năm sinh hoặc can năm sinh
- `horoscopeYear`
- `palaces[].changsheng12`
- rule Tứ Hóa hiện có của project

### Dữ liệu đầu ra

- `birthMutagens`
- `taiSuiEntry`
- warnings cho dữ liệu Tràng Sinh bất thường

### Có thể code ngay hay cần bổ sung dữ liệu

Có thể code ngay, nhưng phải reuse rule Tứ Hóa hiện có làm nguồn chuẩn.

## Level 3

### Thành phần

- Phi Cung Tứ Hóa
- Kỵ nhập
- Kỵ xung
- Tự Hóa

### Mục tiêu

Sinh mạng quan hệ Bắc Phái có thể đọc được bằng máy và có thể giải thích ngắn.

### Dữ liệu đầu vào

- 12 cung chuẩn hóa
- stem từng cung
- `visibleStars[]` để build `starIndex`
- rule Tứ Hóa hiện có

### Dữ liệu đầu ra

- `palaceFlyingMutagens`
- `jiInRelations`
- `jiClashRelations`
- `selfTransformations`

### Có thể code ngay hay cần bổ sung dữ liệu

Có thể code ngay nếu stem và star placement đã ổn định.

## Level 4

### Thành phần

- Phi Hóa Xuyên Cung
- Truy Kỵ
- Lai Nhân Cung
- Thái Tuế Nhập Quái

### Mục tiêu

Tạo lớp phân tích quan hệ sâu hơn và xác định trục nên ưu tiên đọc.

### Dữ liệu đầu vào

- kết quả Level 2 và Level 3
- `laiNhanCung`
- `horoscopeYear`
- star index

### Dữ liệu đầu ra

- `laiNhanCung`
- `jiChains`
- `taiSuiEntry`
- summary highlights

### Có thể code ngay hay cần bổ sung dữ liệu

Phần Lai Nhân Cung và Thái Tuế Nhập Quái có thể code ngay. Truy Kỵ cần cẩn thận vòng lặp và điều kiện dừng.

## Level 5

### Thành phần

- Hà Lạc
- Đại Vận Phi Hóa
- Lưu Niên Phi Hóa

### Mục tiêu

Mở rộng engine ra các lớp động và biến thể khó hơn.

### Dữ liệu đầu vào

- can đại vận hiện tại
- dữ liệu đại vận đang chạy
- `horoscopeYear`
- rule Tứ Hóa hiện có

### Dữ liệu đầu ra

- `annualMutagens`
- `decadeMutagens`
- warnings thiếu dữ liệu

### Có thể code ngay hay cần bổ sung dữ liệu

- Lưu niên Tứ Hóa: có thể code ngay nếu `horoscopeYear` có sẵn.
- Đại vận Tứ Hóa: chỉ nên code khi xác định được dữ liệu đại vận hiện tại.
- Hà Lạc: chưa nên trộn vào cùng engine nếu chưa có tài liệu và rule riêng.

## Thứ tự triển khai khuyến nghị

1. Normalize chart và palace map.
2. Build star index từ `palaces[].visibleStars`.
3. Sinh niên Tứ Hóa.
4. Phi Cung Tứ Hóa.
5. Kỵ nhập, Kỵ xung, Tự Hóa.
6. Lai Nhân Cung.
7. Thái Tuế Nhập Quái.
8. Lưu niên Tứ Hóa.
9. Đại vận Tứ Hóa nếu đủ dữ liệu.
10. Truy Kỵ và summary.

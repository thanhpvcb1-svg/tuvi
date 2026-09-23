# Cảnh Báo Trường Phái Và Giới Hạn Diễn Giải

## Mục đích

Tài liệu này ghi rõ các ranh giới để engine Bắc Phái không bị trộn nhầm giữa các dị bản, không tạo ra kết luận quá đà, và không mâu thuẫn với dữ liệu thực tế của project.

## Dị bản trường phái là có thật

- Bắc Phái không phải lúc nào cũng có một cách đọc duy nhất.
- Một số nhánh ưu tiên Sinh niên Tứ Hóa, một số nhánh nhấn mạnh Phi Cung Tứ Hóa, Lai Nhân Cung, hoặc lớp Khâm Thiên.
- Cách đặt trọng số giữa Kỵ nhập, Kỵ xung, Tự Hóa, Truy Kỵ có thể khác nhau giữa tài liệu và truyền thừa.

Vì vậy:

- Engine nên thiết kế theo hướng mở rộng được `schoolVariant`.
- Không nên hardcode một cách diễn giải duy nhất như thể đó là chuẩn tuyệt đối.

## Rule Tứ Hóa hiện có là nguồn chuẩn duy nhất

Trong project này, rule Tứ Hóa hiện có phải được xem là `single source of truth`.

Điều này có nghĩa là:

- Knowledge base không được tạo lại bảng Tứ Hóa.
- Engine không được tự dựng một bảng khác chỉ vì tham khảo bên ngoài nói khác.
- Nếu cần thay mapping, phải thay ở rule gốc hoặc adapter được duyệt rõ ràng.

## Không biến kỹ thuật thành khẳng định tuyệt đối

Các quan hệ như:

- Hóa Kỵ nhập
- Kỵ xung
- Tự Hóa Kỵ
- Truy Kỵ nhiều bước

chỉ nên được diễn giải như:

- điểm vướng
- áp lực
- trách nhiệm
- vùng cần theo dõi kỹ hơn
- xu hướng lặp hoặc tự điều chỉnh

Không nên viết như:

- `chắc chắn xảy ra`
- `định mệnh`
- `không tránh được`
- `xấu tuyệt đối`

## Evidence phải đi cùng mọi câu diễn giải

Mỗi đoạn mô tả nên có khả năng truy ngược ít nhất về:

- `ruleId`
- cung nguồn
- can nguồn
- sao hóa
- cung nhập
- cung xung nếu có
- layer: `birth`, `natal_palace`, `annual`, `decade`

Nếu không có evidence rõ, không nên phát câu kết luận mạnh.

## Cảnh báo khi thiếu dữ liệu

Một số phần không nên suy đoán nếu data chưa đủ:

- Đại vận hiện tại
- Lai Nhân Cung fallback khi thiếu cả JSON lẫn can năm sinh chắc chắn
- năm xem nếu `horoscopeYear` không có
- chuỗi Truy Kỵ khi thiếu sao đích hoặc gặp duplicate placement

Trong các trường hợp đó:

- trả warning
- giảm mức độ diễn giải
- tránh bịa chuỗi hay bịa cung đích

## Tách lớp kỹ thuật và lớp văn bản

Nên tách:

- lớp engine kỹ thuật
- lớp template diễn giải
- lớp UI hiển thị

Lý do:

- dễ kiểm thử hơn
- dễ thay trường phái hơn
- AI có thể viết lại văn phong mà không động vào logic lõi

## Cảnh báo khi mở rộng sang Khâm Thiên hoặc Hà Lạc

- Lai Nhân Cung có thể là cầu nối tự nhiên sang lớp Khâm Thiên.
- Tuy vậy, không nên coi toàn bộ logic Khâm Thiên là mặc định của engine Bắc Phái hiện tại.
- Hà Lạc là một nhánh có logic riêng, nên tách thành module hoặc variant riêng nếu sau này cần hỗ trợ.

## Khuyến nghị cho implementer

1. Luôn normalize trước rồi mới phân tích.
2. Luôn build `starIndex` từ `palaces[].visibleStars[]`.
3. Luôn reuse rule Tứ Hóa hiện có.
4. Luôn ghi warning khi dữ liệu thiếu hoặc nghi ngờ.
5. Luôn giữ câu diễn giải ở mức trung tính, có điều kiện, có evidence.

## Câu mẫu an toàn nên ưu tiên

- `cho thấy một xu hướng`
- `gợi ý rằng`
- `là điểm nên theo dõi`
- `có thể xem như`
- `nên đọc cùng các cung liên quan`

## Câu mẫu nên tránh

- `chắc chắn sẽ`
- `định sẵn`
- `không thể tránh`
- `nhất định xảy ra`
- `bắt buộc phải`

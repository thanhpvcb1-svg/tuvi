# Knowledge Base Bắc Phái / Phi Tinh Tứ Hóa

Thư mục này chứa tài liệu nội bộ phục vụ engine phân tích Tử Vi Bắc Phái / Phi Tinh Tứ Hóa và hỗ trợ AI/LLM diễn giải kết quả một cách nhất quán, có bằng chứng, tránh suy diễn quá mức.

## Mục tiêu

- Mô tả ngôn ngữ chung cho lớp phân tích Bắc Phái trong project.
- Chuẩn hóa cách hiểu dữ liệu đầu vào từ JSON lá số hiện có.
- Ghi rõ các rule có thể chuyển thành code hoặc map 1-1 với code hiện hữu.
- Cung cấp template diễn giải ngắn, trung tính, có evidence.
- Làm tài liệu tham chiếu nội bộ cho lập trình viên, AI agent, và tầng giải thích kết quả.

## Phạm vi

Knowledge base này tập trung vào:

- Sinh niên Tứ Hóa
- Phi Cung Tứ Hóa
- Kỵ nhập
- Kỵ xung
- Tự Hóa
- Lai Nhân Cung
- Thái Tuế Nhập Quái
- Lưu niên Tứ Hóa
- Đại vận Tứ Hóa nếu đủ dữ liệu
- Truy Kỵ

Không phải mọi điểm trong tài liệu đều đã được triển khai thành engine. Một số phần được viết theo hướng định nghĩa chuẩn để code dần theo từng lớp.

## Phân biệt với các hướng đọc khác

- Nam Phái / truyền thống an sao: ưu tiên bố cục cung, chính tinh, phụ tinh, tam hợp, đối cung, vòng sao và tổ hợp an sao.
- Bắc Phái / Phi Tinh Tứ Hóa: nhấn mạnh tuyến phi hóa từ can năm sinh, can cung, can lưu niên, can đại vận và các quan hệ nhập cung, xung cung, truy tuyến.
- Khâm Thiên: thường được dùng như một lớp diễn giải sâu hơn quanh Lai Nhân Cung, tuyến phi hóa và các trục kích hoạt ý nghĩa.
- Hà Lạc: là một nhánh khác, có thể cần thêm mô hình riêng; không nên trộn thẳng vào engine Bắc Phái hiện tại nếu chưa có adapter rõ ràng.

## Single Source Of Truth cho Tứ Hóa

Project đã có rule sinh Tứ Hóa hiện hữu. Đây là nguồn chuẩn duy nhất cho mapping Tứ Hóa và không được tái tạo lại trong knowledge base này.

Nguồn chuẩn hiện tại:

- [src/lib/tuvi/rules/mutagenRules.ts](/abs/path/C:/project/tuvi/src/lib/tuvi/rules/mutagenRules.ts)
- [src/lib/tuvi/rules/resolveNatalMutagens.ts](/abs/path/C:/project/tuvi/src/lib/tuvi/rules/resolveNatalMutagens.ts)
- [src/lib/tuvi/rules/phiCungTuHoa.ts](/abs/path/C:/project/tuvi/src/lib/tuvi/rules/phiCungTuHoa.ts)

Nguyên tắc:

- Không chép lại bảng Tứ Hóa vào Markdown này.
- Không tạo bảng Tứ Hóa mới trong engine nếu chưa có xác nhận rõ.
- Mọi rule Bắc Phái phải gọi adapter hoặc reuse rule hiện có.
- Nếu có mâu thuẫn giữa tài liệu và code rule hiện hành, code rule hiện hành là nguồn chuẩn.

## Cách dùng tài liệu

- `01-thuat-ngu.md`: từ điển thuật ngữ và ý nghĩa trong engine.
- `02-cap-do-kien-thuc.md`: phân lớp tri thức để triển khai theo mức độ.
- `03-rules-phi-hoa.md`: định nghĩa rule ở dạng gần với code.
- `04-template-luan-giai.md`: template câu diễn giải ngắn.
- `05-output-schema.md`: schema kết quả chuẩn cho tầng phân tích.
- `06-sample-json-note.md`: ghi chú về JSON lá số thực tế trong app.
- `07-canh-bao-truong-phai.md`: ranh giới, dị bản và cảnh báo khi mở rộng.

## Nguyên tắc diễn giải

- Mọi diễn giải phải đi kèm evidence.
- Không dùng ngôn ngữ tuyệt đối như `chắc chắn`, `định mệnh`, `không tránh được`.
- Không thay thế tư vấn chuyên môn ở các lĩnh vực y tế, tài chính, pháp lý.
- Nếu thiếu dữ liệu, phải phát warning thay vì bịa kết luận.

## Khả năng mở rộng

Tài liệu này nên được xem là nền cho các biến thể sau:

- `schoolVariant`
- `evidenceLevel`
- `strictMode`
- `annualOnly` / `natalOnly`
- adapter riêng cho Khâm Thiên hoặc các dị bản Bắc Phái khác

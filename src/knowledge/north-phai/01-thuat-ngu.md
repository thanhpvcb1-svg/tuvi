# Thuật Ngữ Bắc Phái / Phi Tinh Tứ Hóa

## Tứ Hóa

- Định nghĩa ngắn: nhóm bốn loại biến hóa dùng để theo dõi tuyến tác động của sao theo can.
- Ý nghĩa trong engine: là lớp relation trung tâm để sinh ra phân tích Bắc Phái.
- Input cần có: can nguồn hợp lệ và rule Tứ Hóa hiện có của project.
- Output sinh ra: danh sách quan hệ Lộc, Quyền, Khoa, Kỵ với sao đích và cung đích.

## Hóa Lộc

- Định nghĩa ngắn: một loại phi hóa biểu thị xu hướng tăng trưởng, khai mở, thu hút hoặc lợi ích tương đối.
- Ý nghĩa trong engine: tạo `NorthMutagenRelation` với `mutagenType = "Hóa Lộc"`.
- Input cần có: can nguồn, rule Tứ Hóa, vị trí sao đích.
- Output sinh ra: relation có `targetStar`, `targetPalace`, `evidence`.

## Hóa Quyền

- Định nghĩa ngắn: một loại phi hóa biểu thị xu hướng phát quyền, phát lực, chủ động hoặc tăng tính điều khiển.
- Ý nghĩa trong engine: tạo relation phục vụ đọc sức nặng và cách chủ đề vận hành.
- Input cần có: can nguồn, rule Tứ Hóa, star index.
- Output sinh ra: relation Quyền theo layer tương ứng.

## Hóa Khoa

- Định nghĩa ngắn: một loại phi hóa thường gợi ý tính sáng tỏ, danh nghĩa, điều tiết hoặc lớp bảo hộ tương đối.
- Ý nghĩa trong engine: relation Khoa thường được dùng trong phần tổng hợp điểm dịu hóa hoặc mở đường.
- Input cần có: can nguồn, rule Tứ Hóa, star index.
- Output sinh ra: relation Khoa với bằng chứng rõ nguồn.

## Hóa Kỵ

- Định nghĩa ngắn: một loại phi hóa biểu thị điểm vướng, áp lực, nút thắt, trách nhiệm hoặc khu vực cần theo dõi kỹ hơn.
- Ý nghĩa trong engine: là nguồn chính để sinh `Kỵ nhập`, `Kỵ xung`, `Truy Kỵ`.
- Input cần có: can nguồn, rule Tứ Hóa, star index, đối cung.
- Output sinh ra: relation Kỵ kèm `clashPalace` nếu tìm được cung đích.

## Sinh niên Tứ Hóa

- Định nghĩa ngắn: bộ Tứ Hóa phát sinh từ can năm sinh.
- Ý nghĩa trong engine: tạo `birthMutagens`, là một lớp nền cố định của lá số.
- Input cần có: năm sinh hoặc can năm sinh.
- Output sinh ra: 4 relation layer `birth`.

## Cung can Phi Hóa

- Định nghĩa ngắn: việc lấy can của một cung làm nguồn phát Tứ Hóa.
- Ý nghĩa trong engine: dùng để sinh `palaceFlyingMutagens`.
- Input cần có: 12 cung đã normalize, stem từng cung, rule Tứ Hóa chuẩn.
- Output sinh ra: tối đa 4 relation cho mỗi cung.

## Phi Cung Tứ Hóa

- Định nghĩa ngắn: tuyến phi hóa từ một cung đến cung chứa sao đích.
- Ý nghĩa trong engine: là lớp quan hệ động quan trọng của Bắc Phái.
- Input cần có: source palace, source stem, star index.
- Output sinh ra: relation `phi_nhap`, `tu_hoa`, hoặc warning `missing_star`.

## Kỵ nhập

- Định nghĩa ngắn: Hóa Kỵ nhập vào một cung đích.
- Ý nghĩa trong engine: là trục ưu tiên khi build phần đọc rủi ro, áp lực, nút thắt hoặc nghĩa vụ.
- Input cần có: relation Hóa Kỵ có cung đích.
- Output sinh ra: `jiInRelations`.

## Kỵ xung

- Định nghĩa ngắn: cung đối xứng với cung mà Hóa Kỵ nhập vào.
- Ý nghĩa trong engine: dùng để mô tả trục tác động hai đầu của Kỵ.
- Input cần có: `targetPalace` và `oppositePalaceId`.
- Output sinh ra: `NorthJiClashRelation` hoặc trường `clashPalace*` trong relation.

## Tự Hóa

- Định nghĩa ngắn: cung phát phi hóa quay về chính cung đó.
- Ý nghĩa trong engine: tạo `selfTransformations`, hữu ích cho nhận diện vòng lặp nội cung hoặc tính tự điều chỉnh.
- Input cần có: `sourcePalaceId === targetPalaceId`.
- Output sinh ra: đối tượng `NorthSelfTransformation`.

## Lai Nhân Cung

- Định nghĩa ngắn: cung được dùng như một điểm nhân duyên hoặc trục chủ đề trọng tâm trong lớp đọc Bắc Phái/Khâm Thiên.
- Ý nghĩa trong engine: là đối tượng độc lập để AI biết cung nào cần ưu tiên ghép với các tuyến phi hóa.
- Input cần có: `laiNhanCung` từ JSON hoặc logic compute fallback.
- Output sinh ra: `NorthLaiNhanCung`.

## Thái Tuế Nhập Quái

- Định nghĩa ngắn: cung được kích hoạt bởi chi năm xem.
- Ý nghĩa trong engine: là điểm mở đầu khi đọc lớp lưu niên theo Bắc Phái.
- Input cần có: `horoscopeYear`, can chi năm xem, branch của từng cung.
- Output sinh ra: `NorthTaiSuiEntry`.

## Phi Hóa Xuyên Cung

- Định nghĩa ngắn: chuỗi phi hóa đi tiếp từ cung đích thành nguồn kế tiếp.
- Ý nghĩa trong engine: là nền để dựng tuyến truy Kỵ hoặc chuỗi theo dõi nhiều bước.
- Input cần có: relation ban đầu, stem từng cung, rule Tứ Hóa chuẩn.
- Output sinh ra: một chuỗi relation hoặc warning dừng.

## Truy Kỵ

- Định nghĩa ngắn: lần theo đường Hóa Kỵ qua nhiều bước cho đến khi gặp điều kiện dừng.
- Ý nghĩa trong engine: giúp tìm tuyến áp lực lặp, vòng kín, hoặc điểm dừng tự Kỵ.
- Input cần có: start relation Hóa Kỵ, chart normalize, star index.
- Output sinh ra: `NorthJiChain`.

## Đại Vận Phi Hóa

- Định nghĩa ngắn: lớp phi hóa theo can đại vận hiện hành nếu xác định được đại vận đang chạy.
- Ý nghĩa trong engine: thêm layer `decade`.
- Input cần có: dữ liệu xác định đại vận hiện tại và stem liên quan.
- Output sinh ra: `decadeMutagens` hoặc warning thiếu dữ liệu.

## Lưu Niên Phi Hóa

- Định nghĩa ngắn: lớp phi hóa theo can năm xem.
- Ý nghĩa trong engine: thêm layer `annual`.
- Input cần có: `horoscopeYear` hoặc can năm xem.
- Output sinh ra: `annualMutagens`.

## Bản cung

- Định nghĩa ngắn: chính cung đang được xét như cung nguồn hoặc cung đích.
- Ý nghĩa trong engine: dùng để xác định context của relation.
- Input cần có: normalized palace.
- Output sinh ra: dữ liệu cung có `id`, `name`, `stem`, `branch`.

## Đối cung

- Định nghĩa ngắn: cung nằm đối xứng với một cung theo vòng 12 cung.
- Ý nghĩa trong engine: bắt buộc để suy ra `Kỵ xung`.
- Input cần có: thứ tự 12 cung chuẩn hóa.
- Output sinh ra: `oppositePalaceId`.

## Tam hợp

- Định nghĩa ngắn: nhóm ba cung cùng trục hỗ trợ nhau theo bố cục lá số.
- Ý nghĩa trong engine: chưa phải output bắt buộc của NorthAnalysisResult, nhưng có thể dùng ở lớp diễn giải sau.
- Input cần có: palace index hoặc palace id.
- Output sinh ra: tập cung liên hệ để enrich explanation.

## Cung nguồn

- Định nghĩa ngắn: cung phát ra phi hóa.
- Ý nghĩa trong engine: `sourcePalaceId`, `sourcePalaceName`, `sourceStem`.
- Input cần có: cung đã normalize.
- Output sinh ra: metadata của relation.

## Cung đích

- Định nghĩa ngắn: cung chứa sao đích mà phi hóa nhập vào.
- Ý nghĩa trong engine: `targetPalaceId`, `targetPalaceName`.
- Input cần có: star index từ `visibleStars[]`.
- Output sinh ra: metadata đích của relation.

## Evidence

- Định nghĩa ngắn: tập bằng chứng kỹ thuật làm nền cho câu diễn giải.
- Ý nghĩa trong engine: giúp AI không nói trôi mà bám sát dữ liệu.
- Input cần có: source palace, source stem, target star, target palace, layer, ruleId, warnings liên quan.
- Output sinh ra: `Record<string, any>` hoặc object có schema rõ ràng.

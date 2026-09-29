# Đối chiếu tri thức Bắc phái với kho hiện có

Sinh lúc 2026-09-29T10:34:13.083Z bởi `npm run kb:map`. Kho luận giải: 26600 đoạn; block đã crawl: 22818.

| Khái niệm | Trạng thái | Đoạn trong kho | Block nguồn (theo school) | Bộ khớp lá số |
|---|---|---|---|---|
| Tứ Hóa sinh niên | CORROBORATED | 16 | BAC_PHAI 1043, UNKNOWN 40 | hoa / starHoa |
| Phi Hóa (Can cung phi Tứ Hóa) | CORROBORATED | 379 | BAC_PHAI 3611, UNKNOWN 1882, OTHER 2 | flow |
| Tự Hóa ly tâm | CORROBORATED | 2 | BAC_PHAI 378 | selfHoa / selfHoaAny |
| Tự Hóa hướng tâm | CORROBORATED | 1 | BAC_PHAI 172 | ENGINE_GAP |
| Lộc tùy Kỵ tẩu | CORROBORATED | 15 | BAC_PHAI 216, UNKNOWN 2 | ENGINE_GAP |
| Kỵ chuyển Kỵ | CORROBORATED | 4 | BAC_PHAI 111, UNKNOWN 5 | ENGINE_GAP |
| Kỵ chuyển Lộc | GAP_KB | 0 | BAC_PHAI 84 | ENGINE_GAP |
| Lộc xuất / Lộc nhập | CORROBORATED | 1421 | BAC_PHAI 1373, UNKNOWN 550 | flow |
| Kỵ xuất / Kỵ nhập | CORROBORATED | 1512 | BAC_PHAI 1980, UNKNOWN 817 | flow |
| Ngã cung / Tha cung | CORROBORATED | 124 | BAC_PHAI 194, UNKNOWN 86 | ENGINE_GAP |
| Lai Nhân cung | CORROBORATED | 42 | BAC_PHAI 467, UNKNOWN 7 | laiNhan |
| Thái Tuế nhập quái | GAP_KB | 0 | BAC_PHAI 14, UNKNOWN 1, OTHER 9 | ENGINE_GAP |
| Thuận thủy Kỵ | CORROBORATED | 122 | BAC_PHAI 40 | flow (vận hạn) |
| Nghịch thủy Kỵ | CORROBORATED | 7 | BAC_PHAI 32, UNKNOWN 22 | ENGINE_GAP |
| Kỵ tróc Lộc | KB_ONLY | 47 | - | flow + hoa (vận hạn) |
| Song Kỵ | CORROBORATED | 228 | BAC_PHAI 228, UNKNOWN 57 | ENGINE_GAP |
| Củ triều Kỵ | NO_DATA | 0 | - | flow |
| Điệp xuất Lộc | CORROBORATED | 51 | BAC_PHAI 13 | flow + selfHoa (vận hạn) |
| Khoa Kỵ dây dưa | GAP_KB | 0 | BAC_PHAI 5 | ENGINE_GAP |
| Thể / Dụng | CORROBORATED | 1 | BAC_PHAI 223, UNKNOWN 5 | flowPeriodRole |
| Định ứng kỳ | GAP_KB | 0 | BAC_PHAI 169, UNKNOWN 4 | ENGINE_GAP |
| Tứ Hóa đại vận | CORROBORATED | 1 | UNKNOWN 13, BAC_PHAI 9 | periodRole / flowPeriodRole |
| Tứ Hóa lưu niên | GAP_KB | 0 | BAC_PHAI 19, UNKNOWN 7 | ENGINE_GAP |
| Khí số vị (cung vị chuyển) | CORROBORATED | 32 | BAC_PHAI 63, UNKNOWN 7 | ENGINE_GAP |

- CORROBORATED: kho có và có nguồn tự khai Bắc phái định nghĩa. KB_ONLY: kho có nhưng chưa có nguồn Bắc phái đối chiếu.
- GAP_KB: nguồn Bắc phái có, kho chưa có. ENGINE_GAP: bộ khớp lá số chưa kiểm được khái niệm này.

Đoạn trong kho có tham chiếu nguồn Bắc phái: 4639; trùng nguyên văn với block crawl: 1661; có đề xuất school (cần duyệt): 349.
school của đoạn trong kho KHÔNG bị đổi - file bac-phai-map.json chỉ là đề xuất.

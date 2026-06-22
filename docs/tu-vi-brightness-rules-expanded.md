# Bảng Đ/M/V/L/H Theo Vị Trí Cho Phụ Tinh, Sát Tinh, Bại Tinh

Dùng cho `schoolConfig.brightnessRules`.

Không hardcode theo lá số. Mọi ký hiệu `Đ/H/M/V/L` nên resolve theo:

```text
starName + earthlyBranch + scope + schoolProfile
```

## 0. Quy ước

| Ký hiệu | Nghĩa |
|---|---|
| M | Miếu |
| V | Vượng |
| Đ | Đắc |
| B | Bình |
| BH | Bình hòa |
| L | Lợi |
| H | Hãm |

## 1. Nguyên tắc nguồn

Không có một bảng duy nhất thống nhất cho tất cả trường phái. Vì vậy nên tách:

```text
raw iztro brightness
→ schoolConfig.brightnessRules
→ fallbackRules
→ unresolved nếu chưa có tài liệu chắc
```

Các rule dưới đây chia thành:

- `verified`: có nhiều nguồn hoặc nguồn rõ.
- `variant`: có dị bản hoặc trường phái khác nhau.
- `fallback`: dùng để hiển thị theo profile, cần ghi chú.
- `unresolved`: chưa đủ căn cứ, không nên ép Đ/H.

## 2. Bảng tổng hợp nhanh

| Sao | Rule ưu tiên đề xuất | Ghi chú |
|---|---|---|
| Địa Không | Đ: Dần, Thân, Tỵ, Hợi. H: còn lại | Có dị bản Miếu Tỵ/Hợi, Đắc Dần/Thân |
| Địa Kiếp | Đ: Dần, Thân, Tỵ, Hợi. H: còn lại | Có dị bản Miếu Tỵ/Hợi, Đắc Dần/Thân |
| Kình Dương | Đ: Thìn, Tuất, Sửu, Mùi. H: còn lại | Normalize theo tứ mộ |
| Đà La | Đ/M: Thìn, Tuất, Sửu, Mùi. H: còn lại hoặc H tứ sinh tùy profile | Cần tách profile |
| Hỏa Tinh | Variant A: Đ Dần, Mão, Thìn, Tỵ, Ngọ. H còn lại | Có variant cổ học khác |
| Linh Tinh | Variant A: Đ Dần, Mão, Thìn, Tỵ, Ngọ. H còn lại | Có variant cổ học khác |
| Bạch Hổ | Đ: Dần, Thân, Mão, Dậu. H: còn lại | Nên để rule riêng |
| Tang Môn | Đ: Dần, Thân, Mão, Dậu. H: còn lại | Đi cặp với Bạch Hổ |
| Thiên Khốc | Variant A: Đ Tý, Ngọ, Mão, Dậu, Sửu, Mùi. H còn lại | Có dị bản khác |
| Thiên Hư | Đ: Tý, Ngọ. H: còn lại | Nên xem là fallback nếu thiếu nguồn mạnh |
| Thiên Mã | M/V: Tỵ, Dần. Đ: Thân. H: Hợi | Thiên Mã chỉ an ở Dần, Thân, Tỵ, Hợi |
| Thiên Hình | V: Dần, Mão, Dậu, Tuất. H fallback: còn lại | Nguồn không đồng nhất hoàn toàn |
| Hóa Kỵ | Đ: Thìn, Tuất, Sửu, Mùi. H: còn lại | Nên cẩn trọng vì là tứ hóa |
| Thiếu Âm | Đ: Tý, Hợi, Thân, Dậu. H: Ngọ, Mùi, Thìn, Dần | Cần kiểm chứng thêm |

## 3. Rule chi tiết

### 3.1 Địa Không

#### Profile `aituvicompatible`

```ts
{
  star: "Địa Không",
  branches: ["Dần", "Thân", "Tỵ", "Hợi"],
  brightness: "Đ",
  brightnessFull: "Đắc",
  priority: 100,
  source: "school-rule",
  note: "Không/Kiếp đắc tại tứ sinh"
},
{
  star: "Địa Không",
  branches: ["Tý", "Sửu", "Mão", "Thìn", "Ngọ", "Mùi", "Dậu", "Tuất"],
  brightness: "H",
  brightnessFull: "Hãm",
  priority: 100,
  source: "school-rule"
}
```

#### Profile `cohoc_variant`

```ts
{
  star: "Địa Không",
  branches: ["Tỵ", "Hợi"],
  brightness: "M",
  brightnessFull: "Miếu",
  priority: 100,
  source: "school-rule"
},
{
  star: "Địa Không",
  branches: ["Dần", "Thân"],
  brightness: "Đ",
  brightnessFull: "Đắc",
  priority: 100,
  source: "school-rule"
}
```

### 3.2 Địa Kiếp

```ts
{
  star: "Địa Kiếp",
  branches: ["Dần", "Thân", "Tỵ", "Hợi"],
  brightness: "Đ",
  brightnessFull: "Đắc",
  priority: 100,
  source: "school-rule"
},
{
  star: "Địa Kiếp",
  branches: ["Tý", "Sửu", "Mão", "Thìn", "Ngọ", "Mùi", "Dậu", "Tuất"],
  brightness: "H",
  brightnessFull: "Hãm",
  priority: 100,
  source: "school-rule"
}
```

### 3.3 Kình Dương

```ts
{
  star: "Kình Dương",
  branches: ["Thìn", "Tuất", "Sửu", "Mùi"],
  brightness: "Đ",
  brightnessFull: "Đắc",
  priority: 100,
  source: "school-rule"
},
{
  star: "Kình Dương",
  branches: ["Tý", "Dần", "Mão", "Tỵ", "Ngọ", "Thân", "Dậu", "Hợi"],
  brightness: "H",
  brightnessFull: "Hãm",
  priority: 90,
  source: "school-rule"
}
```

### 3.4 Đà La

```ts
{
  star: "Đà La",
  branches: ["Thìn", "Tuất", "Sửu", "Mùi"],
  brightness: "Đ",
  brightnessFull: "Đắc",
  priority: 100,
  source: "school-rule"
},
{
  star: "Đà La",
  branches: ["Tý", "Dần", "Mão", "Tỵ", "Ngọ", "Thân", "Dậu", "Hợi"],
  brightness: "H",
  brightnessFull: "Hãm",
  priority: 90,
  source: "school-rule"
}
```

### 3.5 Hỏa Tinh

#### Profile `cohoc_simple`

```ts
{
  star: "Hỏa Tinh",
  branches: ["Dần", "Mão", "Thìn", "Tỵ", "Ngọ"],
  brightness: "Đ",
  brightnessFull: "Đắc",
  priority: 100,
  source: "school-rule"
},
{
  star: "Hỏa Tinh",
  branches: ["Tý", "Sửu", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"],
  brightness: "H",
  brightnessFull: "Hãm",
  priority: 100,
  source: "school-rule"
}
```

#### Profile `classical_huo_ling`

```ts
{
  star: "Hỏa Tinh",
  branches: ["Dần", "Ngọ", "Tuất"],
  brightness: "M",
  brightnessFull: "Miếu",
  priority: 100,
  source: "school-rule"
},
{
  star: "Hỏa Tinh",
  branches: ["Tỵ", "Dậu", "Sửu"],
  brightness: "Đ",
  brightnessFull: "Đắc",
  priority: 100,
  source: "school-rule"
},
{
  star: "Hỏa Tinh",
  branches: ["Hợi", "Mão", "Mùi"],
  brightness: "L",
  brightnessFull: "Lợi",
  priority: 100,
  source: "school-rule"
},
{
  star: "Hỏa Tinh",
  branches: ["Thân", "Tý", "Thìn"],
  brightness: "H",
  brightnessFull: "Hãm",
  priority: 100,
  source: "school-rule"
}
```

### 3.6 Linh Tinh

```ts
{
  star: "Linh Tinh",
  branches: ["Dần", "Mão", "Thìn", "Tỵ", "Ngọ"],
  brightness: "Đ",
  brightnessFull: "Đắc",
  priority: 100,
  source: "school-rule"
},
{
  star: "Linh Tinh",
  branches: ["Tý", "Sửu", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"],
  brightness: "H",
  brightnessFull: "Hãm",
  priority: 100,
  source: "school-rule"
}
```

### 3.7 Bạch Hổ

```ts
{
  star: "Bạch Hổ",
  branches: ["Dần", "Thân", "Mão", "Dậu"],
  brightness: "Đ",
  brightnessFull: "Đắc",
  priority: 100,
  source: "school-rule"
},
{
  star: "Bạch Hổ",
  branches: ["Tý", "Sửu", "Thìn", "Tỵ", "Ngọ", "Mùi", "Tuất", "Hợi"],
  brightness: "H",
  brightnessFull: "Hãm",
  priority: 100,
  source: "school-rule"
}
```

### 3.8 Tang Môn

```ts
{
  star: "Tang Môn",
  branches: ["Dần", "Thân", "Mão", "Dậu"],
  brightness: "Đ",
  brightnessFull: "Đắc",
  priority: 100,
  source: "school-rule"
},
{
  star: "Tang Môn",
  branches: ["Tý", "Sửu", "Thìn", "Tỵ", "Ngọ", "Mùi", "Tuất", "Hợi"],
  brightness: "H",
  brightnessFull: "Hãm",
  priority: 100,
  source: "school-rule"
}
```

### 3.9 Thiên Khốc

```ts
{
  star: "Thiên Khốc",
  branches: ["Tý", "Ngọ", "Mão", "Dậu", "Sửu", "Mùi"],
  brightness: "Đ",
  brightnessFull: "Đắc",
  priority: 100,
  source: "school-rule"
},
{
  star: "Thiên Khốc",
  branches: ["Dần", "Thìn", "Tỵ", "Thân", "Tuất", "Hợi"],
  brightness: "H",
  brightnessFull: "Hãm",
  priority: 100,
  source: "school-rule"
}
```

### 3.10 Thiên Hư

```ts
{
  star: "Thiên Hư",
  branches: ["Tý", "Ngọ"],
  brightness: "Đ",
  brightnessFull: "Đắc",
  priority: 100,
  source: "school-rule"
},
{
  star: "Thiên Hư",
  branches: ["Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"],
  brightness: "H",
  brightnessFull: "Hãm",
  priority: 80,
  source: "fallback-rule"
}
```

### 3.11 Thiên Mã

```ts
{
  star: "Thiên Mã",
  branches: ["Tỵ"],
  brightness: "M",
  brightnessFull: "Miếu",
  priority: 100,
  source: "school-rule"
},
{
  star: "Thiên Mã",
  branches: ["Dần"],
  brightness: "V",
  brightnessFull: "Vượng",
  priority: 100,
  source: "school-rule"
},
{
  star: "Thiên Mã",
  branches: ["Thân"],
  brightness: "Đ",
  brightnessFull: "Đắc",
  priority: 100,
  source: "school-rule"
},
{
  star: "Thiên Mã",
  branches: ["Hợi"],
  brightness: "H",
  brightnessFull: "Hãm",
  priority: 100,
  source: "school-rule"
}
```

### 3.12 Thiên Hình

```ts
{
  star: "Thiên Hình",
  branches: ["Dần", "Mão", "Dậu", "Tuất"],
  brightness: "V",
  brightnessFull: "Vượng",
  priority: 100,
  source: "school-rule"
},
{
  star: "Thiên Hình",
  branches: ["Tý", "Sửu", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Hợi"],
  brightness: "H",
  brightnessFull: "Hãm",
  priority: 70,
  source: "fallback-rule"
}
```

### 3.13 Hóa Kỵ

```ts
{
  star: "Hóa Kỵ",
  branches: ["Thìn", "Tuất", "Sửu", "Mùi"],
  brightness: "Đ",
  brightnessFull: "Đắc",
  priority: 100,
  source: "school-rule"
},
{
  star: "Hóa Kỵ",
  branches: ["Tý", "Dần", "Mão", "Tỵ", "Ngọ", "Thân", "Dậu", "Hợi"],
  brightness: "H",
  brightnessFull: "Hãm",
  priority: 100,
  source: "school-rule"
}
```

### 3.14 Thiếu Âm

```ts
{
  star: "Thiếu Âm",
  branches: ["Tý", "Hợi", "Thân", "Dậu"],
  brightness: "Đ",
  brightnessFull: "Đắc",
  priority: 70,
  source: "fallback-rule"
},
{
  star: "Thiếu Âm",
  branches: ["Ngọ", "Mùi", "Thìn", "Dần"],
  brightness: "H",
  brightnessFull: "Hãm",
  priority: 70,
  source: "fallback-rule"
}
```

## 4. Các sao không nên ép Đ/H nếu chưa có bảng rõ

```text
Đào Hoa
Hồng Loan
Thiên Hỷ
Hàm Trì
Thiên Diêu / Thiên Riêu
Giải Thần
Thiên Giải
Địa Giải
Ân Quang
Thiên Quý
Thiên Quan
Thiên Phúc
Long Đức
Nguyệt Đức
Thiên Đức
Hoa Cái
Long Trì
Phượng Các
Đài Phụ
Thai Phụ
Tấu Thư
Phi Liêm
Âm Sát
Đường Phù
Địa Võng
Quốc Ấn
Trực Phù
Đẩu Quân
```

Với các sao này, nếu profile chưa xác nhận rõ thì nên để:

```ts
brightness: ""
brightnessSource: "none"
```

## 5. Gợi ý thêm vào code

Có thể gom nhóm rule phụ này thành một file riêng, ví dụ:

- `src/lib/tuvi/rules/auxiliaryBrightnessRules.ts`
- hoặc giữ ngay trong `src/lib/tuvi/rules/brightnessRules.ts` nhưng tách section rõ ràng.

## 6. Tình trạng hiện tại trong repo

File hiện đang dùng để resolve:

- `src/lib/tuvi/rules/brightnessRules.ts`
- `src/lib/tuvi/rules/starBrightnessResolver.ts`
- `src/lib/tuvi/normalize/normalizeBrightness.ts`

Hiện code đã có một phần các rule:

- Phá Quân Tuất = Đ
- Văn Xương Tuất = Đ
- Thất Sát Ngọ = M
- Tham Lang Dần = Đ
- Thiên Cơ Mão = M
- Liêm Trinh Thân = V
- Thái Dương Sửu = Đ
- Thái Âm Sửu = Đ
- Thiên Đồng Hợi = Đ
- Địa Không, Địa Kiếp có rule Đ/H theo tứ sinh
- Một phần rule cho Kình Dương, Thiên Lương, Thiên Hình, Bạch Hổ, Thiên Mã, Thiên Hư, Hỏa Tinh, Đại Hao

Những mục trong tài liệu này nhưng repo chưa phủ hết nên xem là TODO:

- Đà La đủ bộ Đ/H
- Hỏa Tinh/Linh Tinh profile cổ học đầy đủ M/Đ/L/H
- Tang Môn đủ bộ Đ/H
- Thiên Khốc variant rõ theo profile
- Thiên Hư rule nguồn mạnh hơn thay vì fallback
- Thiên Mã đủ M/V/Đ/H
- Thiên Hình đủ profile
- Hóa Kỵ theo branch đầy đủ
- Thiếu Âm nếu muốn dùng phải xác nhận profile

## 7. Checklist review

- [ ] Mỗi profile có `brightnessRules` riêng.
- [ ] Không ép Đ/H cho sao chưa có bảng rõ.
- [ ] Rule có `note` nếu dùng fallback hoặc variant.
- [ ] `resolveBrightness()` báo rõ source: `iztro`, `school-rule`, `fallback-rule`, `manual-config`, `none`.
- [ ] `inspectResolvedBrightness()` in được raw vs final.
- [ ] Snapshot report chỉ ra brightness mismatch theo từng cung.

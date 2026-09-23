# Rules Bắc Phái / Phi Tinh Tứ Hóa

## Nguyên tắc chung

- Tất cả rule trong tài liệu này phải reuse rule Tứ Hóa hiện có của project.
- `single source of truth` cho Tứ Hóa là code hiện hành, không phải Markdown này.
- Adapter được phép đổi format output, không được đổi nội dung mapping.
- Khi thiếu dữ liệu, rule phải sinh warning thay vì tự lấp kết luận.

---

## NORTH_BIRTH_MUTAGENS

### Mô tả

Sinh bốn relation Tứ Hóa từ can năm sinh, sau đó map sao đích vào cung chứa sao trong lá số.

### Điều kiện

- Xác định được năm sinh hoặc can năm sinh.
- Có rule Tứ Hóa hiện có của project.
- Có `starIndex` dựng từ `palaces[].visibleStars`.

### Input

- `chart.profile`
- `chart.input`
- `normalizedChart.palaces`
- `starIndex.byName`
- adapter `resolveTuHoaByStem(stem)`

### Algorithm

```pseudo
birthStem = resolveBirthStem(chart.input, chart.profile)
if birthStem is missing:
  emit warning MISSING_BIRTH_STEM
  return []

tuHoa = resolveTuHoaByStem(birthStem)
if tuHoa is missing:
  emit warning MISSING_TU_HOA_RULE
  return []

relations = []
for each mutagenType in [loc, quyen, khoa, ky]:
  targetStar = tuHoa[mutagenType]
  targetPalace = starIndex.byName.get(normalizeStar(targetStar))
  if targetPalace missing:
    emit warning MISSING_TARGET_STAR
    continue

  relation = createBirthRelation(
    sourceStem = birthStem,
    mutagenType,
    targetStar,
    targetPalace
  )

  if mutagenType == ky:
    relation.clashPalace = opposite(targetPalace)

  relations.push(relation)

return relations
```

### Output schema

```json
{
  "id": "birth-ky-thien-co",
  "technique": "Sinh niên Tứ Hóa",
  "ruleId": "NORTH_BIRTH_MUTAGENS",
  "layer": "birth",
  "sourceStem": "Mậu",
  "mutagenType": "Hóa Kỵ",
  "targetStar": "Thiên Cơ",
  "targetPalaceId": "NO_BOC",
  "targetPalaceName": "Nô Bộc",
  "clashPalaceId": "HUYNH_DE",
  "clashPalaceName": "Huynh Đệ",
  "isSelfTransformation": false,
  "evidence": {}
}
```

### Ví dụ

- Năm sinh cho ra can nguồn `Mậu`.
- Adapter trả về bộ Tứ Hóa tương ứng cho `Mậu`.
- `Thiên Cơ` được tìm thấy trong `Nô Bộc`, vì vậy sinh relation Kỵ nhập `Nô Bộc`.

### Cảnh báo

- Không được viết lại bảng Tứ Hóa trong rule này.
- Nếu `visibleStars[]` thiếu sao mục tiêu, phải warning thay vì suy từ `focusPalaces`.

---

## NORTH_PALACE_FLYING

### Mô tả

Duyệt 12 cung, lấy can của từng cung làm nguồn để phát đủ bốn tuyến Tứ Hóa.

### Điều kiện

- Có đủ 12 cung đã normalize.
- Stem từng cung đã được normalize.
- Có `starIndex`.

### Input

- `normalizedChart.palaces`
- `starIndex.byName`
- `resolveTuHoaByStem(stem)`

### Algorithm

```pseudo
relations = []
for sourcePalace in normalizedChart.palaces:
  if sourcePalace.stem missing:
    emit warning UNKNOWN_STEM_ABBREVIATION
    continue

  tuHoa = resolveTuHoaByStem(sourcePalace.stem)
  if tuHoa missing:
    emit warning MISSING_TU_HOA_RULE
    continue

  for each mutagenType in [loc, quyen, khoa, ky]:
    targetStar = tuHoa[mutagenType]
    targetPalace = starIndex.byName.get(normalizeStar(targetStar))
    if targetPalace missing:
      emit warning MISSING_TARGET_STAR
      continue

    relation = createPalaceRelation(sourcePalace, targetPalace, mutagenType, targetStar)
    relation.isSelfTransformation = sourcePalace.id == targetPalace.id

    if mutagenType == ky:
      relation.clashPalace = opposite(targetPalace)

    relations.push(relation)

return relations
```

### Output schema

```json
{
  "id": "natal-palace-menh-loc",
  "technique": "Phi Cung Tứ Hóa",
  "ruleId": "NORTH_PALACE_FLYING",
  "layer": "natal_palace",
  "sourcePalaceId": "MENH",
  "sourcePalaceName": "Mệnh",
  "sourceStem": "Nhâm",
  "mutagenType": "Hóa Lộc",
  "targetStar": "Thiên Lương",
  "targetPalaceId": "PHUC_DUC",
  "targetPalaceName": "Phúc Đức",
  "isSelfTransformation": false,
  "evidence": {}
}
```

### Ví dụ

- Cung `Mệnh` có can `Nhâm`.
- Adapter trả về bộ Tứ Hóa cho `Nhâm`.
- Sao đích của Lộc nằm ở `Phúc Đức`, nên tạo relation từ `Mệnh` sang `Phúc Đức`.

### Cảnh báo

- Không dùng `focusPalaces` để tìm sao đích.
- Nếu cùng một sao xuất hiện nhiều cung, cần warning `DUPLICATED_STAR_PLACEMENT`.

---

## NORTH_JI_IN

### Mô tả

Lọc ra các relation Hóa Kỵ để tạo tập `Kỵ nhập`.

### Điều kiện

- Đã có `birthMutagens`, `palaceFlyingMutagens`, `annualMutagens`, hoặc `decadeMutagens`.

### Input

- danh sách `NorthMutagenRelation[]`

### Algorithm

```pseudo
jiInRelations = []
for relation in allMutagenRelations:
  if relation.mutagenType == "Hóa Kỵ" and relation.targetPalaceId exists:
    jiInRelations.push(relation)
return jiInRelations
```

### Output schema

```json
{
  "ruleId": "NORTH_JI_IN",
  "mutagenType": "Hóa Kỵ",
  "sourcePalaceName": "Tài Bạch",
  "targetPalaceName": "Nô Bộc",
  "targetStar": "Thiên Cơ"
}
```

### Ví dụ

- Tài Bạch phát Hóa Kỵ tới Thiên Cơ, nhập Nô Bộc.
- Relation này được đưa vào tập `jiInRelations`.

### Cảnh báo

- `Kỵ nhập` là lớp phân loại relation, không phải một bảng độc lập mới.

---

## NORTH_JI_CLASH

### Mô tả

Từ `Kỵ nhập`, suy ra cung bị xung là đối cung của cung đích.

### Điều kiện

- Có `jiInRelations`.
- `targetPalace` đã có `oppositePalaceId`.

### Input

- `jiInRelations`
- `normalizedChart.palaces`

### Algorithm

```pseudo
jiClashes = []
for jiRelation in jiInRelations:
  if jiRelation.targetPalaceId missing:
    continue

  clashPalace = opposite(jiRelation.targetPalaceId)
  jiClashes.push({
    sourcePalace = jiRelation.sourcePalace,
    jiInPalace = jiRelation.targetPalace,
    jiClashPalace = clashPalace,
    targetStar = jiRelation.targetStar
  })
return jiClashes
```

### Output schema

```json
{
  "ruleId": "NORTH_JI_CLASH",
  "sourcePalaceName": "Tài Bạch",
  "jiInPalaceName": "Nô Bộc",
  "jiClashPalaceName": "Huynh Đệ",
  "targetStar": "Thiên Cơ",
  "evidence": {}
}
```

### Ví dụ

- Hóa Kỵ nhập `Nô Bộc`.
- Đối cung của `Nô Bộc` là `Huynh Đệ`.
- Sinh relation `Kỵ xung Huynh Đệ`.

### Cảnh báo

- Không suy xung nếu `targetPalaceId` chưa chắc chắn.

---

## NORTH_SELF_TRANSFORMATION

### Mô tả

Nhận diện relation mà cung nguồn phát phi hóa quay về chính cung đó.

### Điều kiện

- Đã có `palaceFlyingMutagens`.

### Input

- `palaceFlyingMutagens`

### Algorithm

```pseudo
selfTransformations = []
for relation in palaceFlyingMutagens:
  if relation.sourcePalaceId == relation.targetPalaceId:
    selfTransformations.push(mapRelationToSelfTransformation(relation))
return selfTransformations
```

### Output schema

```json
{
  "id": "self-hoa-ky-dien-trach",
  "technique": "Tự Hóa",
  "ruleId": "NORTH_SELF_TRANSFORMATION",
  "palaceId": "DIEN_TRACH",
  "palaceName": "Điền Trạch",
  "stem": "Ất",
  "mutagenType": "Tự Hóa Kỵ",
  "targetStar": "Thái Âm",
  "evidence": {}
}
```

### Ví dụ

- `Điền Trạch` có can `Ất`.
- Rule hiện có cho `Ất` trỏ Kỵ tới `Thái Âm`.
- `Thái Âm` cũng nằm tại `Điền Trạch`, nên đây là `Tự Hóa Kỵ`.

### Cảnh báo

- Chỉ xác định `Tự Hóa` khi cung nguồn và cung đích thật sự trùng nhau sau normalize.

---

## NORTH_LAI_NHAN_CUNG

### Mô tả

Xác định Lai Nhân Cung từ JSON hiện có hoặc tính fallback khi thiếu dữ liệu trực tiếp.

### Điều kiện

- Có `laiNhanCung` trong JSON hoặc xác định được can năm sinh và danh sách cung.

### Input

- `rawChart.laiNhanCung`
- `normalizedChart.palaces`
- `birthYearStem`

### Algorithm

```pseudo
if rawChart.laiNhanCung exists:
  palace = mapRawLaiNhanToPalace(rawChart.laiNhanCung, normalizedChart)
  return buildLaiNhanResult(palace, source = "json")

if birthYearStem missing:
  emit warning MISSING_BIRTH_STEM
  return null

palace = find palace where palace.stem == birthYearStem
if palace missing:
  emit warning MISSING_LAI_NHAN_PALACE
  return null

return buildLaiNhanResult(palace, source = "computed")
```

### Output schema

```json
{
  "technique": "Lai Nhân Cung",
  "ruleId": "NORTH_LAI_NHAN_CUNG",
  "palaceId": "TAI_BACH",
  "palaceName": "Tài Bạch",
  "stem": "Mậu",
  "branch": "Ngọ",
  "source": "json",
  "evidence": {}
}
```

### Ví dụ

- JSON đã có sẵn `laiNhanCung`.
- Engine map giá trị này sang `Tài Bạch`.
- Kết quả giữ `source = "json"` để bảo toàn provenance.

### Cảnh báo

- Nếu JSON đã có sẵn `laiNhanCung`, không nên tự compute đè lên.

---

## NORTH_TAI_SUI_ENTRY

### Mô tả

Xác định cung được kích hoạt bởi chi của năm xem.

### Điều kiện

- Có `horoscopeYear`.
- Tính được can chi năm xem.
- Có branch của từng cung.

### Input

- `horoscopeYear`
- `normalizedChart.palaces`
- helper `getStemBranchByYear(year)`

### Algorithm

```pseudo
if horoscopeYear missing:
  emit warning MISSING_HOROSCOPE_YEAR
  return null

yearStem, yearBranch = getStemBranchByYear(horoscopeYear)
targetPalace = find palace where normalizeBranch(palace.branch) == normalizeBranch(yearBranch)

if targetPalace missing:
  emit warning MISSING_TAI_SUI_TARGET
  return null

return {
  year,
  yearStem,
  yearBranch,
  targetPalace
}
```

### Output schema

```json
{
  "technique": "Thái Tuế Nhập Quái",
  "ruleId": "NORTH_TAI_SUI_ENTRY",
  "year": 2026,
  "yearStem": "Bính",
  "yearBranch": "Ngọ",
  "targetPalaceId": "TAI_BACH",
  "targetPalaceName": "Tài Bạch",
  "evidence": {}
}
```

### Ví dụ

- `horoscopeYear = 2026`.
- Năm xem cho ra chi `Ngọ`.
- `Ngọ` rơi vào cung `Tài Bạch`.

### Cảnh báo

- Không suy nhánh năm xem bằng dữ liệu mơ hồ nếu helper can chi chưa chắc chắn.

---

## NORTH_ANNUAL_MUTAGENS

### Mô tả

Sinh bộ Tứ Hóa theo can năm xem và map vào cung chứa sao đích.

### Điều kiện

- Có `horoscopeYear`.
- Có rule Tứ Hóa chuẩn.
- Có `starIndex`.

### Input

- `horoscopeYear`
- `normalizedChart`
- `starIndex`
- `resolveTuHoaByStem(stem)`

### Algorithm

```pseudo
if horoscopeYear missing:
  emit warning MISSING_HOROSCOPE_YEAR
  return []

yearStem = getStemBranchByYear(horoscopeYear).stem
tuHoa = resolveTuHoaByStem(yearStem)
if tuHoa missing:
  emit warning MISSING_TU_HOA_RULE
  return []

relations = []
for each mutagenType in [loc, quyen, khoa, ky]:
  targetStar = tuHoa[mutagenType]
  targetPalace = starIndex.byName.get(normalizeStar(targetStar))
  if targetPalace missing:
    emit warning MISSING_TARGET_STAR
    continue

  relation = createAnnualRelation(yearStem, targetStar, targetPalace, mutagenType)
  if mutagenType == ky:
    relation.clashPalace = opposite(targetPalace)
  relations.push(relation)

return relations
```

### Output schema

```json
{
  "technique": "Lưu Niên Tứ Hóa",
  "ruleId": "NORTH_ANNUAL_MUTAGENS",
  "layer": "annual",
  "sourceStem": "Bính",
  "mutagenType": "Hóa Kỵ",
  "targetStar": "Liêm Trinh",
  "targetPalaceName": "Phu Thê",
  "clashPalaceName": "Quan Lộc",
  "evidence": {}
}
```

### Ví dụ

- `horoscopeYear = 2026`.
- Can năm xem được tính ra và adapter trả về bộ Tứ Hóa tương ứng.
- `Liêm Trinh` nằm ở `Phu Thê`, nên sinh relation Kỵ nhập `Phu Thê`.

### Cảnh báo

- `horoscopeYear` là đầu vào bắt buộc của lớp lưu niên.

---

## NORTH_DECADE_MUTAGENS

### Mô tả

Sinh bộ Tứ Hóa theo can đại vận hiện tại nếu project có đủ dữ liệu xác định đại vận đang chạy.

### Điều kiện

- Có dữ liệu xác định đại vận hiện hành.
- Có stem của cung hoặc lớp đại vận được chọn.
- Có `starIndex`.

### Input

- `currentDecadePalace` hoặc equivalent
- `normalizedChart`
- `starIndex`
- `resolveTuHoaByStem(stem)`

### Algorithm

```pseudo
currentDecade = resolveCurrentDecadeContext(rawChart, normalizedChart)
if currentDecade missing:
  emit warning MISSING_CURRENT_DECADE_DATA
  return []

decadeStem = currentDecade.stem
tuHoa = resolveTuHoaByStem(decadeStem)
if tuHoa missing:
  emit warning MISSING_TU_HOA_RULE
  return []

relations = mapTuHoaToRelations(
  layer = "decade",
  technique = "Đại Vận Phi Hóa",
  sourceStem = decadeStem
)
return relations
```

### Output schema

```json
{
  "technique": "Đại Vận Phi Hóa",
  "ruleId": "NORTH_DECADE_MUTAGENS",
  "layer": "decade",
  "sourceStem": "Ất",
  "mutagenType": "Hóa Lộc",
  "targetStar": "Thiên Cơ",
  "targetPalaceName": "Nô Bộc",
  "evidence": {}
}
```

### Ví dụ

- Nếu raw chart có `currentDecadePalace` và stem của đại vận hiện hành.
- Engine lấy stem đó và reuse adapter Tứ Hóa để sinh 4 relation.

### Cảnh báo

- Nếu không đủ dữ liệu đại vận hiện tại, trả `[]` và warning thay vì đoán.

---

## NORTH_JI_CHAIN

### Mô tả

Lần theo chuỗi Hóa Kỵ nhiều bước từ một relation khởi đầu để tìm tuyến áp lực, vòng lặp, hoặc điểm tự dừng.

### Điều kiện

- Có relation Hóa Kỵ ban đầu.
- Có `normalizedChart`, `starIndex`, `resolveTuHoaByStem`.

### Input

- `startJiRelation`
- `normalizedChart`
- `starIndex`
- `maxDepth`

### Algorithm

```pseudo
chain = []
visited = set()
currentRelation = startJiRelation

for step from 1 to maxDepth:
  chain.push(currentRelation)
  key = makeKey(currentRelation.sourcePalaceId, currentRelation.targetStar, currentRelation.targetPalaceId)
  if key in visited:
    return chainResult(stopReason = "loop_detected")
  visited.add(key)

  if currentRelation.targetPalaceId missing:
    return chainResult(stopReason = "missing_palace")

  nextSourcePalace = findPalace(currentRelation.targetPalaceId)
  nextStem = nextSourcePalace.stem
  tuHoa = resolveTuHoaByStem(nextStem)
  if tuHoa missing:
    return chainResult(stopReason = "completed")

  nextKyStar = tuHoa.ky
  nextTargetPalace = starIndex.byName.get(normalizeStar(nextKyStar))
  if nextTargetPalace missing:
    return chainResult(stopReason = "missing_star")

  nextRelation = createKyRelation(nextSourcePalace, nextTargetPalace, nextKyStar)
  if nextRelation.sourcePalaceId == nextRelation.targetPalaceId:
    chain.push(nextRelation)
    return chainResult(stopReason = "self_ji")

  currentRelation = nextRelation

return chainResult(stopReason = "max_depth")
```

### Output schema

```json
{
  "id": "ji-chain-1",
  "technique": "Truy Kỵ",
  "ruleId": "NORTH_JI_CHAIN",
  "startRelationId": "birth-ky-thien-co",
  "chain": [],
  "stopReason": "self_ji",
  "naturalLanguage": "Chuỗi Truy Kỵ dừng tại tự Hóa Kỵ."
}
```

### Ví dụ

- Bắt đầu từ một Kỵ nhập `Nô Bộc`.
- Lấy `Nô Bộc` làm cung nguồn tiếp theo.
- Từ stem của `Nô Bộc`, tiếp tục tìm sao Kỵ kế tiếp và cung chứa sao đó.
- Chuỗi dừng khi gặp tự Kỵ hoặc lặp.

### Cảnh báo

- Truy Kỵ là kỹ thuật dễ sinh loop. Phải luôn có `visited set` và `maxDepth`.
- Không dùng ngôn ngữ khẳng định tuyệt đối khi diễn giải chuỗi này.

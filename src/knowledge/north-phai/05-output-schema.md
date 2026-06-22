# Output Schema Chuẩn Cho North Analysis

Schema này là hợp đồng dữ liệu cho tầng phân tích Bắc Phái. Tên field có thể được tối ưu thêm khi triển khai thực tế, nhưng ý nghĩa nên giữ ổn định.

## Nguyên tắc

- `normalizedChart` là dữ liệu chuẩn hóa, không sửa object gốc.
- `birthMutagens`, `annualMutagens`, `decadeMutagens` là các lớp theo nguồn thời gian khác nhau.
- `palaceFlyingMutagens` là lớp phi hóa từ can cung.
- `warnings` bắt buộc có để AI biết khi nào cần nói dè dặt hơn.
- `summary` không thay thế evidence, chỉ là lớp tóm tắt đọc nhanh.

## TypeScript schema

```ts
interface NorthAnalysisResult {
  metadata: NorthAnalysisMetadata;
  normalizedChart: NormalizedChart;
  birthMutagens: NorthMutagenRelation[];
  palaceFlyingMutagens: NorthMutagenRelation[];
  jiInRelations: NorthMutagenRelation[];
  jiClashRelations: NorthJiClashRelation[];
  selfTransformations: NorthSelfTransformation[];
  laiNhanCung?: NorthLaiNhanCung;
  taiSuiEntry?: NorthTaiSuiEntry;
  annualMutagens: NorthMutagenRelation[];
  decadeMutagens: NorthMutagenRelation[];
  jiChains: NorthJiChain[];
  warnings: NorthAnalysisWarning[];
  summary: NorthAnalysisSummary;
}

interface NorthAnalysisMetadata {
  engine: string;
  school: string;
  version?: string;
  usesExistingTuHoaRule: boolean;
  tuHoaSource: string;
  generatedAt?: string;
}

interface NormalizedChart {
  palaces: NormalizedPalace[];
  horoscopeYear?: number;
  laiNhanCung?: string;
  warnings?: NorthAnalysisWarning[];
}

interface NormalizedPalace {
  id: PalaceId;
  name: string;
  branch: string;
  stem: string;
  originalStem: string;
  index: number;
  oppositePalaceId: PalaceId;
  majorStars: NormalizedStar[];
  visibleStars: NormalizedStar[];
  goodStars: NormalizedStar[];
  badStars: NormalizedStar[];
  specialMarkers: any[];
}

interface NormalizedStar {
  name: string;
  display?: string;
  brightness?: string;
  brightnessFull?: string;
  source?: string;
  scope?: string;
  category?: string;
  nature?: string;
  targetStar?: string;
}

interface NorthMutagenRelation {
  id: string;
  technique:
    | "Sinh niên Tứ Hóa"
    | "Phi Cung Tứ Hóa"
    | "Lưu Niên Tứ Hóa"
    | "Đại Vận Phi Hóa";
  ruleId: string;
  layer: "birth" | "natal_palace" | "annual" | "decade";
  sourcePalaceId?: PalaceId;
  sourcePalaceName?: string;
  sourceStem: string;
  mutagenType: "Hóa Lộc" | "Hóa Quyền" | "Hóa Khoa" | "Hóa Kỵ";
  targetStar: string;
  targetPalaceId?: PalaceId;
  targetPalaceName?: string;
  clashPalaceId?: PalaceId;
  clashPalaceName?: string;
  isSelfTransformation: boolean;
  evidence: Record<string, any>;
  naturalLanguage: string;
}

interface NorthJiClashRelation {
  ruleId: "NORTH_JI_CLASH";
  sourcePalaceId?: PalaceId;
  sourcePalaceName?: string;
  jiInPalaceId?: PalaceId;
  jiInPalaceName?: string;
  jiClashPalaceId?: PalaceId;
  jiClashPalaceName?: string;
  targetStar: string;
  evidence: Record<string, any>;
  naturalLanguage: string;
}

interface NorthSelfTransformation {
  id: string;
  technique: "Tự Hóa";
  ruleId: "NORTH_SELF_TRANSFORMATION";
  palaceId: PalaceId;
  palaceName: string;
  stem: string;
  mutagenType: "Tự Hóa Lộc" | "Tự Hóa Quyền" | "Tự Hóa Khoa" | "Tự Hóa Kỵ";
  targetStar: string;
  evidence: Record<string, any>;
  naturalLanguage: string;
}

interface NorthLaiNhanCung {
  technique: "Lai Nhân Cung";
  ruleId: "NORTH_LAI_NHAN_CUNG";
  palaceId: PalaceId;
  palaceName: string;
  stem: string;
  branch: string;
  source: "json" | "computed";
  evidence: Record<string, any>;
  naturalLanguage: string;
}

interface NorthTaiSuiEntry {
  technique: "Thái Tuế Nhập Quái";
  ruleId: "NORTH_TAI_SUI_ENTRY";
  year: number;
  yearStem: string;
  yearBranch: string;
  targetPalaceId?: PalaceId;
  targetPalaceName?: string;
  evidence: Record<string, any>;
  naturalLanguage: string;
}

interface NorthJiChain {
  id: string;
  technique: "Truy Kỵ";
  ruleId: "NORTH_JI_CHAIN";
  startRelationId: string;
  chain: NorthMutagenRelation[];
  stopReason:
    | "self_ji"
    | "loop_detected"
    | "max_depth"
    | "missing_star"
    | "missing_palace"
    | "completed";
  naturalLanguage: string;
}

interface NorthAnalysisWarning {
  code: string;
  message: string;
  context?: any;
}

interface NorthAnalysisSummary {
  highlights: string[];
  naturalLanguage: string;
  importantPalaces?: PalaceId[];
  importantRelations?: string[];
}
```

## JSON sketch

```json
{
  "metadata": {
    "engine": "north-phai-flying-v1",
    "school": "Bắc Phái / Phi Tinh Tứ Hóa",
    "usesExistingTuHoaRule": true,
    "tuHoaSource": "src/lib/tuvi/rules/mutagenRules.ts"
  },
  "normalizedChart": {
    "palaces": []
  },
  "birthMutagens": [],
  "palaceFlyingMutagens": [],
  "jiInRelations": [],
  "jiClashRelations": [],
  "selfTransformations": [],
  "laiNhanCung": {
    "technique": "Lai Nhân Cung",
    "ruleId": "NORTH_LAI_NHAN_CUNG",
    "palaceName": "Tài Bạch"
  },
  "taiSuiEntry": {
    "technique": "Thái Tuế Nhập Quái",
    "ruleId": "NORTH_TAI_SUI_ENTRY",
    "year": 2026
  },
  "annualMutagens": [],
  "decadeMutagens": [],
  "jiChains": [],
  "warnings": [],
  "summary": {
    "highlights": [],
    "naturalLanguage": ""
  }
}
```

## Ghi chú triển khai

- `focusPalaces` có thể hữu ích cho UI, nhưng không nên là nguồn tính toán chính trong schema phân tích.
- `evidence` nên ghi ít nhất:
  - `ruleId`
  - `sourceStem`
  - `sourcePalaceName`
  - `targetStar`
  - `targetPalaceName`
  - `layer`
  - `sourceDataPath`

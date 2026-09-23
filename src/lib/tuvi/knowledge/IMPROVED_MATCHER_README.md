# Improved Knowledge Matcher

## Tổng quan

Module cải thiện logic matching cho tính năng luận giải Tử Vi.

## Các file mới

| File | Mô tả |
|------|-------|
| `improvedMatcher.ts` | Core matching logic |
| `improvedKnowledgeService.ts` | Integration layer |
| `__tests__/improvedMatcher.test.ts` | Unit tests |
| `COMPARISON.ts` | So sánh logic cũ vs mới |

## Cải thiện chính

### 1. Star Name Normalization

```typescript
// Trước: Chỉ lowercase + remove diacritics
normalizeKey("Phá Quân") // "pha_quan"

// Sau: Full aliases support
normalizeStarName("Phá Quân")  // "pha_quan"
normalizeStarName("phá quân")  // "pha_quan"
normalizeStarName("Phá-Quân")  // "pha_quan"
```

### 2. Condition Text Parsing

```typescript
// Parse thông tin từ condition_text
parseConditionText("Cung Mệnh an tại Tuất có Phá quân")
// => { position: "tuat", requiredStars: ["pha_quan"] }

parseConditionText("Lộc nhập cung Tật ách")
// => { transformationType: "loc", transformationTarget: "tat_ach" }
```

### 3. Scoring System

| Match Type | Score cũ | Score mới |
|------------|----------|-----------|
| Star Combination (2+ sao) | 14-20 | 100-130 |
| Position + Stem | 5-8 | 70 |
| Main Star | 10 | 35 |
| Phi Hóa | 15-20 | 80 |
| Minor Star | 10 | 20 |

### 4. Match Types

```typescript
type MatchType =
  | "star_combination"  // Ưu tiên cao nhất
  | "position_stem"     // Vị trí + Can cung
  | "main_star"         // Chính tinh
  | "phi_hoa"           // Phi hóa
  | "m_code"            // M_CODE
  | "minor_star"        // Phụ tinh
  | "general";          // Tổng quan
```

## Cách sử dụng

### Basic Usage

```typescript
import { 
  queryPalaceKnowledgeImproved 
} from "./knowledge/improvedKnowledgeService";

const result = queryPalaceKnowledgeImproved(palace, {
  gender: "male",
  limit: 10,
  minScore: 20,
});

console.log(result.topKnowledge); // Top 3 tri thức
console.log(result.matches);      // Tất cả matches
```

### Advanced Usage

```typescript
import { 
  queryKnowledge, 
  buildMatchContext,
  getTopKnowledge,
} from "./knowledge/improvedMatcher";

// Build context
const context = buildMatchContext(palace, {
  allPalaces: chart.palaces,
  gender: "female",
});

// Query với custom options
const matches = queryKnowledge(blocks, context, {
  limit: 20,
  minScore: 15,
});

// Hoặc lấy top 3
const top = getTopKnowledge(blocks, context);
```

## Testing

```bash
npm test -- --testPathPattern=improvedMatcher
```

## Migration

Để migrate từ logic cũ sang mới:

```typescript
// TRƯỚC
import { queryPalaceKnowledge } from "./knowledgeService";
const results = queryPalaceKnowledge(context);

// SAU
import { queryPalaceKnowledgeImproved } from "./improvedKnowledgeService";
const results = queryPalaceKnowledgeImproved(palace, options);
```

## Roadmap

- [ ] Thêm support cho tam hợp, lục hợp
- [ ] Cải thiện phi hóa matching với chuyển cung
- [ ] Thêm weight cho accuracy từ source
- [ ] Cache kết quả matching

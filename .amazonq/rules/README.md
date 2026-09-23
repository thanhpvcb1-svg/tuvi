# LaSoTuVi Multi-Agent System

## Tổng quan

Hệ thống Multi-Agent cho dự án LaSoTuVi, giúp phát triển phần mềm theo quy trình chuyên nghiệp.

## Danh sách Agents

| # | Agent | File | Vai trò |
|---|-------|------|---------|
| 1 | **Orchestrator** | `01-orchestrator.md` | Điều phối tổng thể, phân task |
| 2 | **BA Agent** | `02-ba-agent.md` | Phân tích requirement |
| 3 | **UIUX Agent** | `03-uiux-agent.md` | Thiết kế UI/UX |
| 4 | **Frontend Agent** | `04-frontend-agent.md` | Code React/TypeScript |
| 5 | **Backend Agent** | `05-backend-agent.md` | Code API/Services |
| 6 | **Database Agent** | `06-database-agent.md` | Thiết kế data |
| 7 | **QA Agent** | `07-qa-agent.md` | Testing |
| 8 | **Review Agent** | `08-review-agent.md` | Code review |

## Workflow

```
                    ┌─────────────────────┐
                    │   ORCHESTRATOR      │
                    │   Agent             │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
          BA Agent          UI/UX Agent      DB Agent
              │                │                │
              │                ▼                │
              │          Frontend Agent        │
              │                │                │
              └──────────┬─────┴────────────────┘
                         ▼
                   Backend Agent
                         │
                         ▼
                     QA Agent
                         │
                         ▼
                  Code Review Agent
                         │
                    ┌────┴────┐
                    │         │
                  PASS       FAIL
                    │         │
                    ▼         └──────→ Coding Agent
                 RELEASE
```

### Giải thích Workflow

| Phase | Agents | Mô tả |
|-------|--------|--------|
| **Phase 1** | BA + UIUX + DB | Chạy song song, phân tích requirement |
| **Phase 2** | Frontend | Chờ UIUX spec |
| **Phase 3** | Backend | Chờ BA + DB |
| **Phase 4** | QA | Test toàn bộ |
| **Phase 5** | Review | Kiểm tra code quality |
| **Phase 6** | Release/Fix | PASS → Release, FAIL → Loop back |

## Cách sử dụng

### 1. Gọi Orchestrator
```
Tôi muốn [mô tả yêu cầu]
```

Orchestrator sẽ:
- Phân tích yêu cầu
- Tạo task breakdown
- Điều phối các agent

### 2. Gọi Agent cụ thể
```
[Tên Agent], hãy [task cụ thể]
```

Ví dụ:
- "UIUX Agent, thiết kế màn hình đăng nhập"
- "Frontend Agent, implement component DatePicker"
- "QA Agent, tạo test cases cho BirthForm"

### 3. Chuyển đổi vai trò
```
Chuyển sang vai trò [Tên Agent]
```

## Task Types

| Yêu cầu | Agents cần |
|---------|------------|
| Feature mới | BA → UIUX → Frontend/Backend → QA → Review |
| Bug fix | QA → Frontend/Backend → Review |
| UI improvement | UIUX → Frontend → Review |
| API mới | BA → DB → Backend → QA → Review |
| Refactoring | Review → Frontend/Backend → QA |

## Project Context

**Tech Stack:**
- React + TypeScript
- Vite
- CSS (custom)
- Cloudflare Pages Functions

**Structure:**
```
src/
├── components/    # React components
├── lib/          # Business logic
├── styles/       # CSS
└── App.tsx       # Main app
```

## Nguyên tắc

1. **Single Source of Truth** - Một nguồn cho mỗi loại artifact
2. **Context Propagation** - Truyền đủ context giữa agents
3. **No Hallucination** - Không tự bịa, hỏi nếu thiếu info
4. **Reuse** - Tái sử dụng code/component có sẵn
5. **Quality First** - Chất lượng trước tốc độ

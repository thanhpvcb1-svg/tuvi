/**
 * Chế độ tri thức luận giải (gán lúc build qua VITE_KNOWLEDGE_MODE, xem vite.config.ts):
 * - "bundled" (mặc định): kho tải về trình duyệt, khớp tại chỗ.
 * - "server": khớp trên /api/knowledge/query, kho không nằm trong bundle.
 * Script Node (esbuild) không có hằng này -> "bundled".
 */
export const KNOWLEDGE_MODE: "server" | "bundled" = typeof __KNOWLEDGE_MODE__ !== "undefined" && __KNOWLEDGE_MODE__ === "server" ? "server" : "bundled";

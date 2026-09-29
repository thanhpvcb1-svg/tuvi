/// <reference types="vite/client" />

declare module "*/cung/normalized/*.json" {
  const value: any;
  export default value;
}

/** Chế độ tri thức luận giải, gán lúc build (vite.config.ts define): "server" | "bundled". Không có khi chạy script Node. */
declare const __KNOWLEDGE_MODE__: "server" | "bundled";

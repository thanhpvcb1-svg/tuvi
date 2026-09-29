import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const knowledgeMode = (process.env.VITE_KNOWLEDGE_MODE || loadEnv(mode, process.cwd(), "VITE_").VITE_KNOWLEDGE_MODE) === "server" ? "server" : "bundled";
  return {
    plugins: [react()],
    base: "/",
    define: {
      // "server": tri thức khớp trên /api/knowledge/query, kho KHÔNG đóng vào bundle (cần Workers Paid).
      // "bundled" (mặc định): kho tải về trình duyệt theo từng file như trước.
      __KNOWLEDGE_MODE__: JSON.stringify(knowledgeMode),
    },
    build: {
      outDir: "dist",
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            // Vendor chunks
            if (id.includes("node_modules")) {
              if (id.includes("react") || id.includes("react-dom") || id.includes("react-router")) {
                return "vendor-react";
              }
              if (id.includes("iztro")) {
                return "vendor-iztro";
              }
              return "vendor";
            }
            
            // Knowledge data - split by file
            if (id.includes("/knowledge/cung/") && knowledgeMode === "bundled") {
              // Extract filename
              const match = id.match(/cung\/([^.]+)/);
              if (match) {
                const filename = match[1];
                // Group by palace type
                if (filename.includes("menh")) return "k-menh";
                if (filename.includes("quan-loc")) return "k-quan-loc";
                if (filename.includes("tai-bach")) return "k-tai-bach";
                if (filename.includes("phu-the")) return "k-phu-the";
                if (filename.includes("phuc-duc")) return "k-phuc-duc";
                if (filename.includes("thien-di")) return "k-thien-di";
                if (filename.includes("tat-ach")) return "k-tat-ach";
                if (filename.includes("dien-trach")) return "k-dien-trach";
                if (filename.includes("phu-mau")) return "k-phu-mau";
                if (filename.includes("huynh-de")) return "k-huynh-de";
                if (filename.includes("no-boc")) return "k-no-boc";
                if (filename.includes("tu-tuc")) return "k-tu-tuc";
                if (filename.includes("star-combination")) return "k-star-combo";
                return "k-other";
              }
            }
            
            // Tuvi lib
            if (id.includes("/lib/tuvi/")) {
              return "tuvi-lib";
            }
          },
        },
      },
    },
    server: {
      host: "localhost",
      port: 5173,
      strictPort: true,
    },
  };
});

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const distRoot = resolve("dist");
const indexPath = join(distRoot, "index.html");
const outputPath = join(distRoot, "standalone.html");

if (!existsSync(indexPath)) {
  console.error("Khong tim thay dist/index.html. Hay chay npm run build truoc.");
  process.exit(1);
}

const indexHtml = readFileSync(indexPath, "utf8");
const scriptMatch = indexHtml.match(/<script[^>]+src="([^"]+)"[^>]*><\/script>/);
const styleMatch = indexHtml.match(/<link[^>]+href="([^"]+)"[^>]*>/);

if (!scriptMatch || !styleMatch) {
  console.error("Khong doc duoc file JS/CSS trong dist/index.html.");
  process.exit(1);
}

const scriptPath = join(dirname(indexPath), scriptMatch[1]);
const stylePath = join(dirname(indexPath), styleMatch[1]);

if (!existsSync(scriptPath) || !existsSync(stylePath)) {
  console.error("Khong tim thay asset JS/CSS da build.");
  process.exit(1);
}

const script = readFileSync(scriptPath, "utf8");
const style = readFileSync(stylePath, "utf8");

const standaloneHtml = `<!doctype html>
<html lang="vi">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>LaSoTuVi</title>
    <style>
${style}
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module">
${script}
    </script>
  </body>
</html>
`;

writeFileSync(outputPath, standaloneHtml, "utf8");
console.log(`Da tao file chay doc lap: ${outputPath}`);

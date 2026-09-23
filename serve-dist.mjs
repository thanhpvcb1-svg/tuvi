import { appendFileSync, createReadStream, existsSync, statSync, writeFileSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";
import { createServer } from "node:http";
import { exec } from "node:child_process";

const root = resolve("dist");
const host = "127.0.0.1";
const preferredPort = 5173;
const maxPort = 5183;
const logFile = resolve("local-server.log");
const urlFile = resolve("local-url.txt");

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

function sendFile(response, filePath) {
  const extension = extname(filePath).toLowerCase();
  response.writeHead(200, {
    "Content-Type": contentTypes[extension] || "application/octet-stream",
    "Cache-Control": "no-store",
  });
  createReadStream(filePath).pipe(response);
}

function log(message) {
  const line = `[${new Date().toLocaleString()}] ${message}`;
  console.log(message);
  appendFileSync(logFile, `${line}\n`, "utf8");
}

function createStaticServer(port) {
  return createServer((request, response) => {
    const url = new URL(request.url || "/", `http://${host}:${port}`);
    const safePath = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, "");
    let filePath = join(root, safePath);

    if (!filePath.startsWith(root)) {
      response.writeHead(403);
      response.end("Forbidden");
      return;
    }

    if (!existsSync(filePath)) {
      filePath = join(root, "index.html");
    }

    if (existsSync(filePath) && statSync(filePath).isDirectory()) {
      filePath = join(filePath, "index.html");
    }

    if (!existsSync(filePath)) {
      response.writeHead(404);
      response.end("Not found. Hay chay npm run build truoc.");
      return;
    }

    sendFile(response, filePath);
  });
}

function listen(server, port) {
  return new Promise((resolveListen, rejectListen) => {
    server.once("error", rejectListen);
    server.listen(port, host, () => {
      server.off("error", rejectListen);
      resolveListen();
    });
  });
}

async function startServer() {
  writeFileSync(logFile, "", "utf8");

  if (!existsSync(join(root, "index.html"))) {
    console.error("Khong tim thay dist\\index.html. Hay chay npm run build truoc.");
    process.exit(1);
  }

  for (let port = preferredPort; port <= maxPort; port += 1) {
    const server = createStaticServer(port);

    try {
      await listen(server, port);
      const url = `http://127.0.0.1:${port}/`;
      const fileUrl = `file:///${join(root, "index.html").replace(/\\/g, "/")}`;
      writeFileSync(urlFile, `${url}\n${fileUrl}\n`, "utf8");

      log("");
      log(`Tu Vi local da chay: ${url}`);
      log(`Neu trinh duyet khong vao duoc, mo truc tiep: ${fileUrl}`);
      log("Neu can dung server, bam Ctrl + C trong cua so nay.");
      log("Giu cua so nay mo khi dang xem web.");
      log("");

      if (process.env.NO_OPEN !== "1") {
        exec(`start "" "${url}"`, (error) => {
          if (error) {
            log(`Khong tu mo duoc trinh duyet: ${error.message}`);
            log(`Hay copy link nay vao Chrome: ${url}`);
          }
        });
      }

      process.on("SIGINT", () => server.close(() => process.exit(0)));
      process.on("SIGTERM", () => server.close(() => process.exit(0)));
      setInterval(() => {}, 60_000);
      return;
    } catch (error) {
      server.close();

      if (error && error.code === "EADDRINUSE") {
        log(`Cong ${port} dang ban, thu cong tiep theo...`);
        continue;
      }

      throw error;
    }
  }

  console.error(`Khong tim thay cong trong tu ${preferredPort} den ${maxPort}.`);
  process.exit(1);
}

startServer().catch((error) => {
  console.error("Khong chay duoc server local:");
  console.error(error);
  process.exit(1);
});

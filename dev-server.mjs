import { createServer } from "vite";

const host = "0.0.0.0";
const port = 5173;

const server = await createServer({
  server: {
    host,
    port,
    strictPort: true,
  },
});

await server.listen();
server.printUrls();

console.log("");
console.log("Tu Vi dev server is running. Keep this process open.");

process.on("SIGINT", async () => {
  await server.close();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await server.close();
  process.exit(0);
});

setInterval(() => {
  // Keep the process alive when launched without an interactive stdin.
}, 60_000);

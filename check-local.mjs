import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { spawn, spawnSync } from "node:child_process";
import http from "node:http";

const root = resolve(".");
const nodePath = "C:\\Program Files\\nodejs\\node.exe";
const npmPath = "C:\\Program Files\\nodejs\\npm.cmd";

function ok(message) {
  console.log(`[OK] ${message}`);
}

function fail(message) {
  console.log(`[LOI] ${message}`);
}

function run(command, args) {
  const nodePathForEnv = `C:\\Program Files\\nodejs;${process.env.Path || process.env.PATH || ""}`;

  return spawnSync("cmd.exe", ["/c", command, ...args], {
    cwd: root,
    encoding: "utf8",
    env: {
      ...process.env,
      Path: nodePathForEnv,
      PATH: nodePathForEnv,
    },
  });
}

function request(url) {
  return new Promise((resolveRequest) => {
    const req = http.get(url, (response) => {
      response.resume();
      response.on("end", () => resolveRequest(response.statusCode));
    });

    req.on("error", (error) => resolveRequest(error.message));
    req.setTimeout(5000, () => {
      req.destroy();
      resolveRequest("timeout");
    });
  });
}

console.log("");
console.log("KIEM TRA PROJECT TU VI LOCAL");
console.log("===========================");

if (!existsSync(nodePath)) {
  fail(`Khong thay Node.js: ${nodePath}`);
  process.exit(1);
}
ok(`Node.js ton tai: ${nodePath}`);

if (!existsSync(npmPath)) {
  fail(`Khong thay npm: ${npmPath}`);
  process.exit(1);
}
ok(`npm ton tai: ${npmPath}`);

if (!existsSync(join(root, "node_modules"))) {
  fail("Chua co node_modules. Hay chay npm install.");
  process.exit(1);
}
ok("node_modules da co");

const build = run(npmPath, ["run", "build"]);
if (build.status !== 0) {
  fail("Build that bai:");
  console.log(build.stdout);
  console.log(build.stderr);
  process.exit(1);
}
ok("npm run build thanh cong");

const indexPath = join(root, "dist", "index.html");
if (!existsSync(indexPath)) {
  fail("Khong thay dist/index.html sau khi build");
  process.exit(1);
}
ok("dist/index.html da tao");

const indexHtml = readFileSync(indexPath, "utf8");
if (!indexHtml.includes("./assets/")) {
  fail("dist/index.html chua dung duong dan tuong doi ./assets/");
  process.exit(1);
}
ok("dist asset dung duong dan tuong doi");

const child = spawn(nodePath, ["serve-dist.mjs"], {
  cwd: root,
  env: { ...process.env, NO_OPEN: "1" },
  stdio: ["ignore", "pipe", "pipe"],
});

let output = "";
child.stdout.on("data", (chunk) => {
  output += chunk.toString();
});
child.stderr.on("data", (chunk) => {
  output += chunk.toString();
});

await new Promise((resolveDelay) => setTimeout(resolveDelay, 1500));

const urlMatch = output.match(/http:\/\/127\.0\.0\.1:\d+\//);
if (!urlMatch) {
  fail("Server khong in ra URL. Output:");
  console.log(output);
  child.kill();
  process.exit(1);
}

const status = await request(urlMatch[0]);
if (status !== 200) {
  fail(`Server khong tra 200 tai ${urlMatch[0]}: ${status}`);
  child.kill();
  process.exit(1);
}

ok(`Server local tra 200 tai ${urlMatch[0]}`);
child.kill();

console.log("");
console.log("KET LUAN: project build va server local OK.");
console.log("Chay run-local.cmd, giu cua so CMD mo, roi dung link in trong CMD.");
console.log("");

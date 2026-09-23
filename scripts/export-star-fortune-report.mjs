import fs from "node:fs";
import path from "node:path";

const configPath = path.resolve("src/lib/tuvi/config/starFortune.ts");
const outputPath = path.resolve("reports/star-fortune-check.md");
const source = fs.readFileSync(configPath, "utf8");

function extractArray(name) {
  const match = source.match(new RegExp(`${name}:\\s*\\[([\\s\\S]*?)\\]`, "m"));
  if (!match) {
    return [];
  }

  return [...match[1].matchAll(/"([^"]+)"/g)].map((item) => item[1]);
}

function section(title, items) {
  return [`## ${title}`, "", ...(items.length ? items.map((item) => `- ${item}`) : ["_Không có_"]), ""].join("\n");
}

const goodStarIds = extractArray("goodStarIds");
const badStarIds = extractArray("badStarIds");
const neutralStarIds = extractArray("neutralStarIds");
const goodNatures = extractArray("goodNatures");
const badNatures = extractArray("badNatures");
const goodGroups = extractArray("goodGroups");
const badGroups = extractArray("badGroups");

const report = [
  "# Star Fortune Check",
  "",
  "File này xuất từ `src/lib/tuvi/config/starFortune.ts` để kiểm tra nhanh sao tốt/sao xấu.",
  "",
  section("Sao Tốt", goodStarIds),
  section("Sao Xấu", badStarIds),
  section("Sao Trung Tính", neutralStarIds),
  section("Nature Tốt", goodNatures),
  section("Nature Xấu", badNatures),
  section("Group Tốt", goodGroups),
  section("Group Xấu", badGroups),
].join("\n");

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, report, "utf8");

console.log(outputPath);

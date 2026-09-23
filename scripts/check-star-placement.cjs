const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const Module = require("node:module");

Module._extensions[".ts"] = function compileTypeScript(module, filename) {
  const source = fs.readFileSync(filename, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
      target: ts.ScriptTarget.ES2020,
      resolveJsonModule: true,
    },
  }).outputText;
  module._compile(output, filename);
};

const { createChart } = require("../src/lib/iztroEngine.ts");
const { getStarFortuneType } = require("../src/lib/tuvi/config/starFortune.ts");

const allLuuOptions = {
  showLuuTuHoa: true,
  showLuuTuDuc: true,
  showLuuDaiVan: true,
  showLuuOtherStars: true,
  showLocKyNhap: true,
  showLuuTuanTriet: true,
};

const cases = [
  { label: "1982-10-04 12:30 Nam", year: 1982, month: 10, day: 4, birthHour: 12, birthMinute: 30, gender: "male" },
  { label: "1998-10-26 00:30 Nam", year: 1998, month: 10, day: 26, birthHour: 0, birthMinute: 30, gender: "male" },
  { label: "1988-04-09 11:30 Nam", year: 1988, month: 4, day: 9, birthHour: 11, birthMinute: 30, gender: "male" },
  { label: "2026-06-10 13:30 Nam", year: 2026, month: 6, day: 10, birthHour: 13, birthMinute: 30, gender: "male" },
  { label: "1990-06-11 10:30 Nam", year: 1990, month: 6, day: 11, birthHour: 10, birthMinute: 30, gender: "male" },
];

function toBirthHourIndex(hour) {
  return hour === 23 ? 12 : Math.floor((hour + 1) / 2);
}

function inspectCase(testCase) {
  const chart = createChart(
    {
      fullName: "",
      year: testCase.year,
      month: testCase.month,
      day: testCase.day,
      birthHour: testCase.birthHour,
      birthMinute: testCase.birthMinute,
      birthHourIndex: toBirthHourIndex(testCase.birthHour),
      gender: testCase.gender,
      calendarType: "solar",
    },
    "tuvichancoCompatible",
    { luuOptions: allLuuOptions, horoscopeDate: new Date("2026-06-11T00:00:00+07:00") },
  );

  const mismatches = [];
  for (const palace of chart.palaces) {
    for (const star of palace.visibleStars) {
      const fortune = getStarFortuneType(star);
      const expectedColumn = fortune === "good" ? "left" : fortune === "bad" ? "right" : undefined;
      if (expectedColumn && star.displayColumn !== expectedColumn) {
        mismatches.push({
          palace: palace.name,
          branch: palace.earthlyBranch,
          star: star.display || star.name,
          starId: star.starId,
          fortune,
          actualColumn: star.displayColumn,
          expectedColumn,
          nature: star.nature,
          groups: star.groups,
        });
      }
    }
  }

  return {
    label: testCase.label,
    palaceCount: chart.palaces.length,
    visibleStarCount: chart.palaces.reduce((sum, palace) => sum + palace.visibleStars.length, 0),
    mismatches,
  };
}

const results = cases.map(inspectCase);
const outputPath = path.resolve("reports/star-placement-check.md");
const lines = [
  "# Star Placement Check",
  "",
  "Quy ước kiểm tra: sao tốt phải ở cột trái, sao xấu phải ở cột phải. Sao trung tính không bắt buộc trái/phải.",
  "",
];

for (const result of results) {
  lines.push(`## ${result.label}`);
  lines.push("");
  lines.push(`- Số cung: ${result.palaceCount}`);
  lines.push(`- Số sao visible: ${result.visibleStarCount}`);
  lines.push(`- Lệch trái/phải: ${result.mismatches.length}`);
  lines.push("");

  if (!result.mismatches.length) {
    lines.push("_Không phát hiện lệch._");
    lines.push("");
    continue;
  }

  for (const item of result.mismatches) {
    lines.push(
      `- ${item.palace} ${item.branch || ""}: ${item.star} (${item.starId || "no-id"}) fortune=${item.fortune}, actual=${item.actualColumn}, expected=${item.expectedColumn}`,
    );
  }
  lines.push("");
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, lines.join("\n"), "utf8");
console.log(outputPath);

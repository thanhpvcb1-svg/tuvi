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
const { anTuan, anTriet } = require("../src/lib/tuvi/rules/generalRuleEngine.ts");

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

function markerRows(chart) {
  return chart.palaces.flatMap((palace) =>
    (palace.specialMarkers || []).map((marker) => ({
      marker: marker.name,
      palace: palace.name,
      branch: palace.earthlyBranch,
      between: marker.betweenPalaceIndexes?.map((index) => chart.palaces.find((item) => item.index === index)?.earthlyBranch).join("/") || "",
    })),
  );
}

const lines = [
  "# Tuần Triệt Check",
  "",
  "Marker được sinh bằng rule tổng quát `anTuan/anTriet`, không phụ thuộc raw iztro.",
  "",
];

for (const testCase of cases) {
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
    { horoscopeDate: new Date("2026-06-11T00:00:00+07:00") },
  );
  const { yearStem, yearBranch } = chart.profile;
  const expectedTuan = yearStem && yearBranch ? anTuan(yearStem, yearBranch).join("/") : "";
  const expectedTriet = yearStem ? anTriet(yearStem).join("/") : "";
  const rows = markerRows(chart);

  lines.push(`## ${testCase.label}`);
  lines.push("");
  lines.push(`- Năm: ${yearStem || "?"} ${yearBranch || "?"}`);
  lines.push(`- Tuần expected: ${expectedTuan}`);
  lines.push(`- Triệt expected: ${expectedTriet}`);
  lines.push("");

  for (const row of rows) {
    lines.push(`- ${row.marker}: hiển thị tại ${row.palace} (${row.branch}), giữa ${row.between}`);
  }

  if (!rows.length) {
    lines.push("- Không có marker.");
  }
  lines.push("");
}

const outputPath = path.resolve("reports/tuan-triet-check.md");
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, lines.join("\n"), "utf8");
console.log(outputPath);

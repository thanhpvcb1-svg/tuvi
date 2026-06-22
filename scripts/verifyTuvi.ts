import { createChart } from "../src/lib/iztroEngine";
import type { ChartView, NormalizedBirthInput } from "../src/lib/types";
import { hasStarMasterId, validateStarDisplayConfig } from "../src/lib/tuvi/display/starDisplay";
import {
  anDaoHoaHoaCaiThienMa,
  anLocTonKinhDa,
  anTriet,
  anTuan,
  anVongBacSi,
  anVongTrangSinh,
} from "../src/lib/tuvi/rules/generalRuleEngine";

declare const require: any;
declare const process: any;

const { readdirSync, readFileSync, statSync } = require("fs");
const { join } = require("path");

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function findPalace(chart: ChartView, name: string) {
  return chart.palaces.find((palace) => palace.name === name);
}

function findVisibleStar(chart: ChartView, name: string) {
  return chart.palaces.flatMap((palace) => palace.visibleStars.map((star) => ({ palace, star }))).find(({ star }) => star.name === name);
}

function assertNoBirthDateHardcode() {
  const sourceRoot = join(process.cwd(), "src");
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        walk(fullPath);
      } else if (/\.(ts|tsx)$/.test(entry)) {
        files.push(fullPath);
      }
    }
  };
  walk(sourceRoot);

  for (const file of files) {
    const content = readFileSync(file, "utf8");
    assert(!/birthDate\s*===/.test(content), `Không được hardcode birthDate trong ${file}`);
    assert(!content.includes("1998-10-26"), `Không được hardcode ngày 1998-10-26 trong ${file}`);
    assert(!content.includes("2026-06-10"), `Không được hardcode ngày 2026-06-10 trong ${file}`);
  }
}

const input2026: NormalizedBirthInput = {
  fullName: "verify-2026",
  year: 2026,
  month: 6,
  day: 10,
  birthHour: 13,
  birthMinute: 30,
  birthHourIndex: 7,
  gender: "male",
  calendarType: "solar",
};

assertNoBirthDateHardcode();
const displayConfigErrors = validateStarDisplayConfig();
assert(displayConfigErrors.length === 0, `Display config lỗi: ${displayConfigErrors.join("; ")}`);

const chart2026 = createChart(input2026, "tuvichancoCompatible");

for (const star of chart2026.palaces.flatMap((palace) => palace.visibleStars)) {
  assert(star.starId && hasStarMasterId(star.starId), `star_id không tồn tại master: ${star.starId ?? star.name}`);
}

const triet = anTriet("Bính");
assert(triet[0] === "Thìn" && triet[1] === "Tỵ", `2026 Triệt expected Thìn/Tỵ, got ${triet.join("/")}`);
const tuan = anTuan("Bính", "Ngọ");
assert(tuan[0] === "Dần" && tuan[1] === "Mão", `2026 Tuần expected Dần/Mão, got ${tuan.join("/")}`);

const locTon = anLocTonKinhDa("Bính");
assert(locTon.find((star) => star.starKey === "loc_ton")?.palace === "Tỵ", "2026 Lộc Tồn phải ở Tỵ");
assert(locTon.find((star) => star.starKey === "kinh_duong")?.palace === "Ngọ", "2026 Kình Dương phải ở Ngọ");
assert(locTon.find((star) => star.starKey === "da_la")?.palace === "Thìn", "2026 Đà La phải ở Thìn");

const tamHopStars = anDaoHoaHoaCaiThienMa("Ngọ");
assert(tamHopStars.find((star) => star.starKey === "dao_hoa")?.palace === "Mão", "2026 Đào Hoa phải ở Mão");
assert(tamHopStars.find((star) => star.starKey === "hoa_cai")?.palace === "Tuất", "2026 Hoa Cái phải ở Tuất");
assert(tamHopStars.find((star) => star.starKey === "thien_ma")?.palace === "Thân", "2026 Thiên Mã phải ở Thân");

const bacSiRing = anVongBacSi("Bính", "male");
assert(bacSiRing.find((star) => star.starKey === "bac_si")?.palace === "Tỵ", "2026 Bác Sĩ phải ở Tỵ");
assert(bacSiRing.find((star) => star.starKey === "luc_si")?.palace === "Ngọ", "2026 Lực Sĩ phải ở Ngọ");
assert(bacSiRing.find((star) => star.starKey === "thanh_long")?.palace === "Mùi", "2026 Thanh Long phải ở Mùi");
assert(bacSiRing.find((star) => star.starKey === "phi_liem")?.palace === "Hợi", "2026 Phi Liêm phải ở Hợi");
assert(bacSiRing.find((star) => star.starKey === "benh_phu")?.palace === "Sửu", "2026 Bệnh Phù phải ở Sửu");
assert(bacSiRing.find((star) => star.starKey === "quan_phu_bac_si")?.displayName === "Quan Phủ", "Vòng Bác Sĩ phải dùng Quan Phủ");

const trangSinh = anVongTrangSinh("Hỏa Lục Cục", "male", "Bính");
assert(trangSinh.find((star) => star.starKey === "trang_sinh")?.palace === "Dần", "2026 Trường Sinh phải ở Dần");
assert(trangSinh.find((star) => star.starKey === "thai")?.displayName === "Thai", "Tràng Sinh state thai phải hiển thị Thai");
assert(!trangSinh.some((star) => star.displayName === "Thái Dương"), "Tràng Sinh không được lẫn Thái Dương");

assert(chart2026.palaces.some((palace) => palace.specialMarkers.some((marker) => marker.name === "Tuần")), "Tuần phải là special marker");
assert(chart2026.palaces.some((palace) => palace.specialMarkers.some((marker) => marker.name === "Triệt")), "Triệt phải là special marker");
assert(chart2026.palaces.every((palace) => palace.displayStars.every((star) => star.name !== "Tuần" && star.name !== "Triệt")), "Tuần/Triệt không được render như sao thường");

assert(findVisibleStar(chart2026, "Hóa Lộc")?.palace.displayStars.some((star) => star.name === "Thiên Đồng"), "2026 Thiên Đồng Hóa Lộc");
assert(findVisibleStar(chart2026, "Hóa Quyền")?.palace.displayStars.some((star) => star.name === "Thiên Cơ"), "2026 Thiên Cơ Hóa Quyền");
assert(findVisibleStar(chart2026, "Hóa Khoa")?.palace.displayStars.some((star) => star.name === "Văn Xương"), "2026 Văn Xương Hóa Khoa");
assert(findVisibleStar(chart2026, "Hóa Kỵ")?.palace.displayStars.some((star) => star.name === "Liêm Trinh"), "2026 Liêm Trinh Hóa Kỵ");

console.log("verify:tuvi passed");

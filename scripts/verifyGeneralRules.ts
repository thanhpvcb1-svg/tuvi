import {
  anCoThanQuaTu,
  anDaoHoaHoaCaiThienMa,
  anKhocHu,
  anLocTonKinhDa,
  anMenhThan,
  anTuan,
  anTriet,
  anVongBacSi,
  anVongTrangSinh,
  getDirectionByYinYangGender,
  getYearStemYinYang,
} from "../src/lib/tuvi/rules/generalRuleEngine";
import { findLaiNhanCung, getPalaceStemMap } from "../src/lib/tuvi/rules/laiNhanRules";
import type { Gender, NormalizedPalace, NormalizedStar } from "../src/lib/tuvi/config/types";
import { TU_HOA_TABLE, generatePalaceStems, getStemByYearStemAndBranch } from "../src/lib/tuvi/constants/tuHoa";
import {
  findPalaceByOriginalStar,
  generatePhiTuHoaForChart,
  getPalaceShortName,
} from "../src/lib/tuvi/rules/phiCungTuHoa";
import { isOriginalNatalStar, normalizeStarName } from "../src/lib/tuvi/utils/starName";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function expectStar(stars: Array<{ starKey: string; displayName: string; palace: string }>, starKey: string, palace: string) {
  const star = stars.find((item) => item.starKey === starKey);
  assert(star, `Missing ${starKey}`);
  assert(star.palace === palace, `${starKey} expected ${palace}, got ${star.palace}`);
}

function validateDuplicateStars(stars: Array<{ source: string; starKey: string; displayName: string }>) {
  const seen = new Map<string, string>();
  for (const star of stars) {
    if (star.source !== "natal") {
      continue;
    }
    const key = `${star.source}:${star.starKey}`;
    assert(!seen.has(key), `Duplicate star: ${key}`);
    seen.set(key, star.displayName);
  }
}

function validateBacSiRing(stars: Array<{ source: string; starKey: string; ringName?: string }>) {
  const bacSiStars = stars.filter((star) => star.source === "natal" && star.ringName === "Vòng Bác Sĩ");
  const expectedKeys = [
    "bac_si",
    "luc_si",
    "thanh_long",
    "tieu_hao",
    "tuong_quan",
    "tau_thu",
    "phi_liem",
    "hy_than",
    "benh_phu",
    "dai_hao",
    "phuc_binh",
    "quan_phu_bac_si",
  ];
  const actualKeys = bacSiStars.map((star) => star.starKey);

  for (const key of expectedKeys) {
    assert(actualKeys.includes(key), `Missing Bác Sĩ ring star: ${key}`);
  }

  const tieuHao = bacSiStars.filter((star) => star.starKey === "tieu_hao");
  assert(tieuHao.length === 1, `Expected exactly 1 natal Tiểu Hao from Bác Sĩ ring, got ${tieuHao.length}`);
}

function testMenhThan() {
  const result = anMenhThan(1, "Tý");
  assert(result.menh === "Dần", `Expected menh Dần, got ${result.menh}`);
  assert(result.than === "Dần", `Expected than Dần, got ${result.than}`);
}

function testTuanTriet() {
  const trietCases: Array<[string, string, string, string]> = [
    ["Giáp", "Tý", "Thân", "Dậu"],
    ["Kỷ", "Tỵ", "Thân", "Dậu"],
    ["Ất", "Sửu", "Ngọ", "Mùi"],
    ["Bính", "Dần", "Thìn", "Tỵ"],
    ["Đinh", "Mão", "Dần", "Mão"],
    ["Mậu", "Thìn", "Tý", "Sửu"],
    ["Quý", "Hợi", "Tý", "Sửu"],
  ];

  for (const [stem, branch, first, second] of trietCases) {
    const triet = anTriet(stem);
    assert(triet[0] === first && triet[1] === second, `${stem} ${branch} Triệt expected ${first}/${second}, got ${triet.join("/")}`);
  }

  const tuanCases: Array<[string, string, string, string]> = [
    ["Giáp", "Tý", "Tuất", "Hợi"],
    ["Ất", "Sửu", "Tuất", "Hợi"],
    ["Quý", "Dậu", "Tuất", "Hợi"],
    ["Giáp", "Tuất", "Thân", "Dậu"],
    ["Bính", "Tý", "Thân", "Dậu"],
    ["Giáp", "Thân", "Ngọ", "Mùi"],
    ["Giáp", "Ngọ", "Thìn", "Tỵ"],
    ["Giáp", "Thìn", "Dần", "Mão"],
    ["Giáp", "Dần", "Tý", "Sửu"],
  ];

  for (const [stem, branch, first, second] of tuanCases) {
    const tuan = anTuan(stem, branch);
    assert(tuan[0] === first && tuan[1] === second, `${stem} ${branch} Tuần expected ${first}/${second}, got ${tuan.join("/")}`);
  }
}

function testLocTonAcrossStems() {
  const cases: Array<[string, string]> = [
    ["Giáp", "Dần"],
    ["Ất", "Mão"],
    ["Bính", "Tỵ"],
    ["Đinh", "Ngọ"],
    ["Mậu", "Tỵ"],
    ["Kỷ", "Ngọ"],
    ["Canh", "Thân"],
    ["Tân", "Dậu"],
    ["Nhâm", "Hợi"],
    ["Quý", "Tý"],
  ];

  for (const [stem, locTon] of cases) {
    const stars = anLocTonKinhDa(stem);
    expectStar(stars, "loc_ton", locTon);
    const kinh = stars.find((item) => item.starKey === "kinh_duong");
    const da = stars.find((item) => item.starKey === "da_la");
    assert(kinh && da, `Missing Kinh/Da for ${stem}`);
  }
}

function testDaoHoaHoaCaiThienMa() {
  const groups: Array<[string, string, string, string]> = [
    ["Thân", "Dậu", "Thìn", "Dần"],
    ["Tý", "Dậu", "Thìn", "Dần"],
    ["Thìn", "Dậu", "Thìn", "Dần"],
    ["Dần", "Mão", "Tuất", "Thân"],
    ["Ngọ", "Mão", "Tuất", "Thân"],
    ["Tuất", "Mão", "Tuất", "Thân"],
    ["Hợi", "Tý", "Mùi", "Tỵ"],
    ["Mão", "Tý", "Mùi", "Tỵ"],
    ["Mùi", "Tý", "Mùi", "Tỵ"],
    ["Tỵ", "Ngọ", "Sửu", "Hợi"],
    ["Dậu", "Ngọ", "Sửu", "Hợi"],
    ["Sửu", "Ngọ", "Sửu", "Hợi"],
  ];

  for (const [branch, daoHoa, hoaCai, thienMa] of groups) {
    const stars = anDaoHoaHoaCaiThienMa(branch);
    expectStar(stars, "dao_hoa", daoHoa);
    expectStar(stars, "hoa_cai", hoaCai);
    expectStar(stars, "thien_ma", thienMa);
  }
}

function testBacSiDirection() {
  const samples: Array<[Gender, string, string]> = [
    ["male", "Bính", "forward"],
    ["female", "Ất", "forward"],
    ["male", "Ất", "backward"],
    ["female", "Bính", "backward"],
  ];

  for (const [gender, stem, expected] of samples) {
    const direction = getDirectionByYinYangGender(gender === "male", getYearStemYinYang(stem));
    assert(direction === expected, `${gender}/${stem} expected ${expected}, got ${direction}`);
  }

  const ring = anVongBacSi("Bính", "male");
  expectStar(ring, "bac_si", "Tỵ");
  expectStar(ring, "luc_si", "Ngọ");
  expectStar(ring, "thanh_long", "Mùi");
  expectStar(ring, "phi_liem", "Hợi");
  expectStar(ring, "benh_phu", "Sửu");
  expectStar(ring, "quan_phu_bac_si", "Thìn");
  validateBacSiRing(ring);
}

function testTrangSinh() {
  const ring = anVongTrangSinh("Hỏa Lục Cục", "male", "Bính");
  expectStar(ring, "trang_sinh", "Dần");
  expectStar(ring, "moc_duc", "Mão");
  expectStar(ring, "quan_doi", "Thìn");
  expectStar(ring, "lam_quan", "Tỵ");
  expectStar(ring, "de_vuong", "Ngọ");
  expectStar(ring, "suy", "Mùi");
  expectStar(ring, "benh", "Thân");
  expectStar(ring, "tu", "Dậu");
  expectStar(ring, "mo", "Tuất");
  expectStar(ring, "tuyet", "Hợi");
  expectStar(ring, "thai", "Tý");
  expectStar(ring, "duong", "Sửu");
  assert(!ring.some((item) => item.displayName === "Thái Dương"), "Trang Sinh ring must not contain Thái Dương");
}

function testCoThanQuaTu() {
  const stars = anCoThanQuaTu("Ngọ");
  expectStar(stars, "co_than", "Thân");
  expectStar(stars, "qua_tu", "Thìn");
}

function testKhocHu() {
  const defaultRule = anKhocHu("Thìn");
  expectStar(defaultRule, "thien_khoc", "Dần");
  expectStar(defaultRule, "thien_hu", "Thân");

  const tuvichancoRule = anKhocHu("Thìn", "tuvichanco");
  expectStar(tuvichancoRule, "thien_khoc", "Dần");
  expectStar(tuvichancoRule, "thien_hu", "Thân");

  const suuRule = anKhocHu("Sửu");
  expectStar(suuRule, "thien_khoc", "Tỵ");
  expectStar(suuRule, "thien_hu", "Hợi");
}

function testDuplicateValidation() {
  validateDuplicateStars([
    ...anLocTonKinhDa("Bính").map((star) => ({ source: star.source, starKey: star.starKey, displayName: star.displayName })),
    ...anVongBacSi("Bính", "male").map((star) => ({ source: star.source, starKey: star.starKey, displayName: star.displayName })),
  ]);
}

function testLaiNhanCung() {
  const canhMap = getPalaceStemMap("Canh");
  assert(canhMap["Dần"] === "Mậu", `Canh/Dần expected Mậu, got ${canhMap["Dần"]}`);
  assert(canhMap["Mão"] === "Kỷ", `Canh/Mão expected Kỷ, got ${canhMap["Mão"]}`);
  assert(canhMap["Thìn"] === "Canh", `Canh/Thìn expected Canh, got ${canhMap["Thìn"]}`);
  assert(canhMap["Tỵ"] === "Tân", `Canh/Tỵ expected Tân, got ${canhMap["Tỵ"]}`);
  assert(canhMap["Ngọ"] === "Nhâm", `Canh/Ngọ expected Nhâm, got ${canhMap["Ngọ"]}`);
  assert(canhMap["Mùi"] === "Quý", `Canh/Mùi expected Quý, got ${canhMap["Mùi"]}`);
  assert(canhMap["Thân"] === "Giáp", `Canh/Thân expected Giáp, got ${canhMap["Thân"]}`);
  assert(canhMap["Dậu"] === "Ất", `Canh/Dậu expected Ất, got ${canhMap["Dậu"]}`);
  assert(canhMap["Tuất"] === "Bính", `Canh/Tuất expected Bính, got ${canhMap["Tuất"]}`);
  assert(canhMap["Hợi"] === "Đinh", `Canh/Hợi expected Đinh, got ${canhMap["Hợi"]}`);
  assert(canhMap["Tý"] === "Mậu", `Canh/Tý expected Mậu, got ${canhMap["Tý"]}`);
  assert(canhMap["Sửu"] === "Kỷ", `Canh/Sửu expected Kỷ, got ${canhMap["Sửu"]}`);

  const canhLaiNhan = findLaiNhanCung(
    "Canh",
    Object.entries(canhMap).map(([branch, stem]) => ({
      name: branch === "Thìn" ? "Điền Trạch" : `Cung ${branch}`,
      palaceStem: stem,
      palaceBranch: branch,
      palaceStemBranch: `${stem} ${branch}`,
    })),
  );
  assert(canhLaiNhan?.palace === "Thìn", `Canh Lai Nhân expected Thìn, got ${canhLaiNhan?.palace}`);
  assert(canhLaiNhan?.functionalPalace === "Điền Trạch", `Canh Lai Nhân expected Điền Trạch, got ${canhLaiNhan?.functionalPalace}`);

  const giapMap = getPalaceStemMap("Giáp");
  const giapLaiNhan = findLaiNhanCung(
    "Giáp",
    Object.entries(giapMap).map(([branch, stem]) => ({
      name: `Cung ${branch}`,
      palaceStem: stem,
      palaceBranch: branch,
      palaceStemBranch: `${stem} ${branch}`,
    })),
  );
  assert(giapLaiNhan?.palace === "Tuất", `Giáp Lai Nhân expected Tuất, got ${giapLaiNhan?.palace}`);

  const binhMap = getPalaceStemMap("Bính");
  const binhLaiNhan = findLaiNhanCung(
    "Bính",
    Object.entries(binhMap).map(([branch, stem]) => ({
      name: `Cung ${branch}`,
      palaceStem: stem,
      palaceBranch: branch,
      palaceStemBranch: `${stem} ${branch}`,
    })),
  );
  assert(binhLaiNhan?.palace === "Thân", `Bính Lai Nhân expected Thân, got ${binhLaiNhan?.palace}`);

  for (const yearStem of ["Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý"]) {
    const palaceStemMap = getPalaceStemMap(yearStem);
    const laiNhan = findLaiNhanCung(
      yearStem,
      Object.entries(palaceStemMap).map(([branch, stem]) => ({
        name: `Cung ${branch}`,
        palaceStem: stem,
        palaceBranch: branch,
        palaceStemBranch: `${stem} ${branch}`,
      })),
    );
    assert(laiNhan, `Expected exactly 1 Lai Nhân Cung for ${yearStem}`);
  }
}

function makeStar(name: string, source: NormalizedStar["source"] = "minor"): NormalizedStar {
  return {
    name,
    displayName: name,
    source,
    scope: "origin",
    brightness: "",
    brightnessFull: "",
    colorGroup: "black",
  };
}

function makePalace(name: string, branch: string, stem: string, stars: string[]): NormalizedPalace {
  return {
    index: 0,
    name,
    heavenlyStem: stem,
    earthlyBranch: branch,
    palaceStem: stem,
    palaceBranch: branch,
    palaceStemBranch: `${stem} ${branch}`,
    isBodyPalace: false,
    majorStars: [],
    minorStars: stars.map((star) => makeStar(star)),
    adjectiveStars: [],
    cycleStars: [],
    mutagenStars: [],
    extraStars: [],
    annualStars: [],
    specialMarkers: [],
    analysisStars: [],
    visibleStars: [],
  };
}

function buildPhiTuHoaFixture() {
  const palaceOrder: Array<[string, string]> = [
    ["Phụ Mẫu", "Hợi"],
    ["Phúc Đức", "Tý"],
    ["Điền Trạch", "Sửu"],
    ["Quan Lộc", "Dần"],
    ["Nô Bộc", "Mão"],
    ["Thiên Di", "Thìn"],
    ["Tật Ách", "Tỵ"],
    ["Tài Bạch", "Ngọ"],
    ["Tử Tức", "Mùi"],
    ["Phu Thê", "Thân"],
    ["Huynh Đệ", "Dậu"],
    ["Mệnh", "Tuất"],
  ];

  const stemMap = generatePalaceStems("Bính");
  const starsByBranch: Record<string, string[]> = {
    Hợi: ["Văn Khúc"],
    Tý: ["Vũ Khúc"],
    Dần: ["Tham Lang"],
    Mão: ["Cự Môn", "Văn Xương", "Thiên Cơ", "L.Văn Xương", "ĐV.Tham Lang"],
    Tỵ: [],
    Tuất: ["Phá Quân"],
  };

  return palaceOrder.map(([name, branch], index) => ({
    ...makePalace(name, branch, stemMap[branch], starsByBranch[branch] ?? []),
    index,
  }));
}

function testTuHoaTable() {
  const stems = ["Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý"];
  assert(Object.keys(TU_HOA_TABLE).length === 10, `Expected 10 stems in TU_HOA_TABLE, got ${Object.keys(TU_HOA_TABLE).length}`);

  for (const stem of stems) {
    const item = TU_HOA_TABLE[stem as keyof typeof TU_HOA_TABLE];
    assert(item, `Missing TU_HOA_TABLE for ${stem}`);
    assert(item.loc && item.quyen && item.khoa && item.ky, `Incomplete TU_HOA_TABLE for ${stem}`);
  }
}

function testNguHoDonBinhTan() {
  const stemMap = generatePalaceStems("Bính");
  const expected: Record<string, string> = {
    Dần: "Canh",
    Mão: "Tân",
    Thìn: "Nhâm",
    Tỵ: "Quý",
    Ngọ: "Giáp",
    Mùi: "Ất",
    Thân: "Bính",
    Dậu: "Đinh",
    Tuất: "Mậu",
    Hợi: "Kỷ",
    Tý: "Canh",
    Sửu: "Tân",
  };

  for (const [branch, stem] of Object.entries(expected)) {
    assert(stemMap[branch] === stem, `Bính/${branch} expected ${stem}, got ${stemMap[branch]}`);
    assert(getStemByYearStemAndBranch("Bính", branch) === stem, `getStemByYearStemAndBranch Bính/${branch} expected ${stem}`);
  }
}

function testPhiCungTuHoa() {
  const palaces = generatePhiTuHoaForChart(buildPhiTuHoaFixture(), "Bính");
  const menh = palaces.find((palace) => palace.name === "Mệnh");
  const tat = palaces.find((palace) => palace.name === "Tật Ách");
  const no = palaces.find((palace) => palace.name === "Nô Bộc");
  const phuMau = palaces.find((palace) => palace.name === "Phụ Mẫu");

  assert(menh?.phiTuHoa?.flows.length === 4, `Mệnh expected 4 phi flows, got ${menh?.phiTuHoa?.flows.length ?? 0}`);
  assert(tat?.phiTuHoa?.flows.length === 4, `Tật Ách expected 4 phi flows, got ${tat?.phiTuHoa?.flows.length ?? 0}`);

  const menhLoc = menh?.phiTuHoa?.flows.find((flow) => flow.type === "loc");
  const menhKy = menh?.phiTuHoa?.flows.find((flow) => flow.type === "ky");
  assert(menhLoc?.targetPalaceName === "Quan Lộc", `Mệnh Lộc expected Quan Lộc, got ${menhLoc?.targetPalaceName}`);
  assert(menhKy?.targetPalaceName === "Nô Bộc", `Mệnh Kỵ expected Nô Bộc, got ${menhKy?.targetPalaceName}`);
  assert(menh?.corner?.loc === "Quan", `Mệnh corner loc expected Quan, got ${menh?.corner?.loc}`);
  assert(menh?.corner?.ky === "Nô", `Mệnh corner ky expected Nô, got ${menh?.corner?.ky}`);

  const tatLoc = tat?.phiTuHoa?.flows.find((flow) => flow.type === "loc");
  const tatKy = tat?.phiTuHoa?.flows.find((flow) => flow.type === "ky");
  assert(tatLoc?.targetPalaceName === "Mệnh", `Tật Lộc expected Mệnh, got ${tatLoc?.targetPalaceName}`);
  assert(tatKy?.targetPalaceName === "Quan Lộc", `Tật Kỵ expected Quan Lộc, got ${tatKy?.targetPalaceName}`);
  assert(tat?.corner?.loc === "Mệnh", `Tật corner loc expected Mệnh, got ${tat?.corner?.loc}`);
  assert(tat?.corner?.ky === "Quan", `Tật corner ky expected Quan, got ${tat?.corner?.ky}`);

  const noLoc = no?.phiTuHoa?.flows.find((flow) => flow.type === "loc");
  const noKy = no?.phiTuHoa?.flows.find((flow) => flow.type === "ky");
  assert(noLoc?.relation === "tu_hoa", `Nô Lộc expected tu_hoa, got ${noLoc?.relation}`);
  assert(noKy?.relation === "tu_hoa", `Nô Kỵ expected tu_hoa, got ${noKy?.relation}`);
  assert(no?.corner?.loc === "Nô", `Nô corner loc expected Nô, got ${no?.corner?.loc}`);
  assert(no?.corner?.ky === "Nô", `Nô corner ky expected Nô, got ${no?.corner?.ky}`);

  const phuLoc = phuMau?.phiTuHoa?.flows.find((flow) => flow.type === "loc");
  const phuKy = phuMau?.phiTuHoa?.flows.find((flow) => flow.type === "ky");
  assert(phuLoc?.targetPalaceName === "Phúc Đức", `Phụ Mẫu Lộc expected Phúc Đức, got ${phuLoc?.targetPalaceName}`);
  assert(phuKy?.relation === "tu_hoa", `Phụ Mẫu Kỵ expected tu_hoa, got ${phuKy?.relation}`);
  assert(phuMau?.corner?.loc === "Phúc", `Phụ Mẫu corner loc expected Phúc, got ${phuMau?.corner?.loc}`);
  assert(phuMau?.corner?.ky === "P.Mẫu", `Phụ Mẫu corner ky expected P.Mẫu, got ${phuMau?.corner?.ky}`);
}

function testPhiCungFilters() {
  assert(normalizeStarName("Tham Lang(Đ)") === "Tham Lang", "Expected brightness suffix to be removed");
  assert(normalizeStarName("L.Văn Xương(Đ)") === "Văn Xương", "Expected derived prefix to be stripped during normalization");
  assert(normalizeStarName("Tả Phù") === "Tả Phụ", "Expected Tả Phù alias to normalize to Tả Phụ");

  assert(isOriginalNatalStar(makeStar("Thiên Cơ")), "Expected natal Thiên Cơ to be original");
  assert(!isOriginalNatalStar({ ...makeStar("L.Văn Xương"), originalName: "L.Văn Xương" }), "Expected L.Văn Xương to be excluded");
  assert(!isOriginalNatalStar({ ...makeStar("Thiên Cơ"), scope: "annual", source: "annual" }), "Expected annual star to be excluded");

  const found = findPalaceByOriginalStar(buildPhiTuHoaFixture(), "Văn Xương");
  assert(found?.palace.name === "Nô Bộc", `Expected Văn Xương to resolve to Nô Bộc, got ${found?.palace.name}`);

  const shortNames = {
    menh: getPalaceShortName("Mệnh"),
    phu: getPalaceShortName("Phụ Mẫu"),
    phuThe: getPalaceShortName("Phu Thê"),
    huynh: getPalaceShortName("Huynh Đệ"),
  };
  assert(shortNames.menh === "Mệnh", `Expected Mệnh short name, got ${shortNames.menh}`);
  assert(shortNames.phu === "P.Mẫu", `Expected P.Mẫu short name, got ${shortNames.phu}`);
  assert(shortNames.phuThe === "Phu", `Expected Phu short name, got ${shortNames.phuThe}`);
  assert(shortNames.huynh === "H.Đệ", `Expected H.Đệ short name, got ${shortNames.huynh}`);
}

function main() {
  testMenhThan();
  testTuanTriet();
  testLocTonAcrossStems();
  testDaoHoaHoaCaiThienMa();
  testBacSiDirection();
  testTrangSinh();
  testCoThanQuaTu();
  testKhocHu();
  testDuplicateValidation();
  testLaiNhanCung();
  testTuHoaTable();
  testNguHoDonBinhTan();
  testPhiCungTuHoa();
  testPhiCungFilters();
  console.log("General rules verified.");
}

main();

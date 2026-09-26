/**
 * Kiểm tra ĐỘC LẬP một điều kiện tri thức (chuỗi gốc crawl) trên lá số.
 *
 * Cố ý không dùng conditionMatcher: đọc thẳng dữ liệu thô của PalaceView (majorStars/minorStars,
 * vòng sao boshi12/suiqian12/jiangqian12, changsheng12, phiTuHoa.flows, palaceStemMap...) để bắt
 * lỗi của bộ so khớp chính. Trả về:
 *   { status: "ok" }                       điều kiện đúng trên lá số
 *   { status: "wrong", reason }            điều kiện SAI -> bộ so khớp trả về nhầm
 *   { status: "unchecked" }                dạng điều kiện script này không tự kiểm được
 */
import type { ChartView, PalaceView } from "../../src/lib/types";

export type CheckResult = { status: "ok" } | { status: "wrong"; reason: string } | { status: "unchecked" };

const OK: CheckResult = { status: "ok" };
const UNCHECKED: CheckResult = { status: "unchecked" };
const wrong = (reason: string): CheckResult => ({ status: "wrong", reason });

const lower = (v: string) => String(v || "").normalize("NFC").toLowerCase().replace(/\s+/g, " ").trim();
const BRANCHES = ["tý", "sửu", "dần", "mão", "thìn", "tỵ", "ngọ", "mùi", "thân", "dậu", "tuất", "hợi"];
const branchNorm = (v: string) => ({ tí: "tý", tị: "tỵ" } as Record<string, string>)[lower(v)] ?? lower(v);

const STAR_ALIASES: Record<string, string> = {
  "tả phụ": "tả phù", "thiên hỷ": "thiên hỉ", "thiên riêu": "thiên diêu", "đài phụ": "thai phụ", "bác sỹ": "bác sĩ",
  "lực sỹ": "lực sĩ", "phụng các": "phượng các", "hỉ thần": "hỷ thần", "thiên quí": "thiên quý",
};
const starNorm = (v: string) => STAR_ALIASES[lower(v)] ?? lower(v);

const PALACE_NAMES: Record<string, string> = { "giao hữu": "nô bộc", "tử nữ": "tử tức", "sự nghiệp": "quan lộc" };
const palaceNorm = (v: string) => PALACE_NAMES[lower(v)] ?? lower(v);
const ABBR: Record<string, string> = {
  "mệnh": "mệnh", "phụ": "phụ mẫu", "phúc": "phúc đức", "điền": "điền trạch", "quan": "quan lộc", "nô": "nô bộc",
  "di": "thiên di", "tật": "tật ách", "tài": "tài bạch", "tử": "tử tức", "phối": "phu thê", "bào": "huynh đệ",
};
const HOA: Record<string, string> = { "lộc": "loc", "quyền": "quyen", "khoa": "khoa", "kỵ": "ky", "kị": "ky" };
const MAIN = ["tử vi", "thiên cơ", "thái dương", "vũ khúc", "thiên đồng", "liêm trinh", "thiên phủ", "thái âm", "tham lang", "cự môn", "thiên tướng", "thiên lương", "thất sát", "phá quân"];
const CHANGSHENG: Record<string, string> = {
  "trường sinh": "trường sinh", "tràng sinh": "trường sinh", "mộc dục": "mục dục", "quan đới": "quan đới", "lâm quan": "lâm quan",
  "đế vượng": "đế vượng", "suy": "suy", "bệnh": "bệnh", "tử": "tử", "mộ": "mộ", "tuyệt": "tuyệt", "thai": "thai", "dưỡng": "dưỡng",
};

const natal = (p: PalaceView) =>
  [p.majorStars, p.minorStars, p.adjectiveStars, p.visibleStars, p.analysisStars].flatMap((l) => l ?? []).filter((s) => !s.scope || s.scope === "origin");

function starNames(p: PalaceView): Set<string> {
  const names = new Set(natal(p).map((s) => starNorm(s.name)));
  for (const ring of ["boshi12", "suiqian12", "jiangqian12"]) if ((p as any)[ring]) names.add(starNorm((p as any)[ring]));
  return names;
}
const mainStars = (p: PalaceView) => [...new Set(natal(p).map((s) => starNorm(s.name)).filter((name) => MAIN.includes(name)))];
const mutagensIn = (p: PalaceView) => new Set(natal(p).map((s) => lower(s.mutagen ?? "")).filter(Boolean).map((m) => HOA[m.replace(/^hóa /, "")]));
const flows = (p: PalaceView) => ((p as any).phiTuHoa?.flows ?? []) as Array<{ type: string; relation?: string; targetPalaceName?: string }>;

function findPalace(chart: ChartView, name: string): PalaceView | undefined {
  const key = palaceNorm(name);
  if (key === "thân") return chart.palaces.find((p) => p.isBodyPalace);
  return chart.palaces.find((p) => lower(p.name) === key);
}
const atOffset = (chart: ChartView, p: PalaceView, offset: number) => {
  const i = BRANCHES.indexOf(branchNorm(p.earthlyBranch));
  return chart.palaces.find((x) => branchNorm(x.earthlyBranch) === BRANCHES[(i + offset + 12) % 12]);
};
const tamPhuong = (chart: ChartView, p: PalaceView) => [p, atOffset(chart, p, 4), atOffset(chart, p, 6), atOffset(chart, p, 8)].filter(Boolean) as PalaceView[];

/** Kiểm một token trong phần "có ..." trên cung p (hoặc tập cung khi hội hợp). */
function checkToken(chart: ChartView, p: PalaceView, token: string, scope: PalaceView[]): CheckResult {
  const t = lower(token);
  let m: RegExpMatchArray | null;

  if ((m = t.match(/^hóa (lộc|quyền|khoa|kỵ|kị)$/))) {
    return scope.some((x) => mutagensIn(x).has(HOA[m![1]])) ? OK : wrong(`không có Hóa ${m[1]} sinh niên`);
  }
  if ((m = t.match(/^tự (lộc|quyền|khoa|kỵ|kị)$/))) {
    return flows(p).some((f) => f.relation === "tu_hoa" && f.type === HOA[m![1]]) ? OK : wrong(`không có tự Hóa ${m[1]}`);
  }
  if ((m = t.match(/^(lộc|quyền|khoa|kỵ|kị) (\S+)$/)) && ABBR[m[2]]) {
    const hit = flows(p).some((f) => f.relation !== "tu_hoa" && f.type === HOA[m![1]] && palaceNorm(f.targetPalaceName ?? "") === ABBR[m![2]]);
    return hit ? OK : wrong(`${p.name} không phi Hóa ${m[1]} nhập ${ABBR[m[2]]}`);
  }
  if ((m = t.match(/^(.+?) hóa (lộc|quyền|khoa|kỵ|kị)$/))) {
    const star = natal(p).find((s) => starNorm(s.name) === starNorm(m![1]));
    return star && HOA[lower(star.mutagen ?? "").replace(/^hóa /, "")] === HOA[m[2]] ? OK : wrong(`${m[1]} không hóa ${m[2]} tại ${p.name}`);
  }
  if (CHANGSHENG[t]) return lower((p as any).changsheng12 ?? "") === CHANGSHENG[t] ? OK : wrong(`Tràng Sinh là ${(p as any).changsheng12}, không phải ${token}`);
  if (t === "vô chính diệu" || t === "vcd") return mainStars(p).length === 0 ? OK : wrong(`cung có chính tinh ${mainStars(p).join(", ")}`);
  if (t === "tự hóa li tâm") return flows(p).some((f) => f.relation === "tu_hoa") ? OK : wrong("cung không có tự hóa");
  if ((m = t.match(/^chi (\S+)$/))) return branchNorm(p.earthlyBranch) === branchNorm(m[1]) ? OK : wrong(`cung ở ${p.earthlyBranch}`);
  if ((m = t.match(/^(giáp|ất|bính|đinh|mậu|kỷ|kỉ|canh|tân|nhâm|quý) (\S+)$/))) {
    const stem = lower((chart as any).palaceStemMap?.[p.earthlyBranch] ?? "");
    return stem === m[1].replace("kỉ", "kỷ") && branchNorm(p.earthlyBranch) === branchNorm(m[2]) ? OK : wrong(`Can Chi cung là ${stem} ${p.earthlyBranch}`);
  }
  if ((m = t.match(/^nạp âm (\S+)$/))) {
    const cuc = lower(String(chart.profile.fiveElementsClass || "").split(" ")[0]).replace("thuỷ", "thủy");
    return cuc === m[1].replace("thuỷ", "thủy") ? OK : wrong(`Cục là ${chart.profile.fiveElementsClass}`);
  }
  if (t === "tuần" || t === "tuần không" || t === "triệt" || t === "triệt không" || t === "tiệt không") {
    const want = t.startsWith("tuần") ? "tuần" : "triệt";
    return ((p as any).specialMarkers ?? []).some((x: any) => lower(x.name) === want) ? OK : wrong(`cung không có ${want}`);
  }
  if ((m = t.match(/^cung (.+)$/))) return lower(p.name) === palaceNorm(m[1]) ? OK : wrong(`cung là ${p.name}`);
  if (t === "lai nhân cung") return palaceNorm((chart as any).laiNhanCung?.functionalPalace ?? "") === lower(p.name) ? OK : wrong("không phải Lai nhân cung");
  if (["tứ bại", "tứ mộ", "tứ sinh", "tứ mã", "mệnh chủ", "thân chủ"].includes(t)) return UNCHECKED;

  // Còn lại coi là tên sao
  const key = starNorm(t);
  return scope.some((x) => starNames(x).has(key)) ? OK : wrong(`không có sao gốc "${token}" ${scope.length > 1 ? "trong tam phương" : `tại ${p.name}`}`);
}

function checkFlowClauses(chart: ChartView, text: string): CheckResult {
  const body = text.includes(":") ? text.slice(text.indexOf(":") + 1).trim() : text;
  let subject = "";
  for (const part of body.split(/,\s*(?:mà\s+)?/).map((s) => s.trim()).filter(Boolean)) {
    const m = part.match(/^(?:Cung (.+?) )?(?:phi )?hóa (lộc|quyền|khoa|kỵ|kị) (?:phi )?(?:nhập|vào|tới)(?: cung)? (.+)$/i);
    if (!m) return UNCHECKED;
    subject = m[1] ?? subject;
    const source = findPalace(chart, subject);
    if (!source) return wrong(`không tìm thấy cung ${subject}`);
    const hit = flows(source).some((f) => f.relation !== "tu_hoa" && f.type === HOA[lower(m[2])] && palaceNorm(f.targetPalaceName ?? "") === palaceNorm(m[3]));
    if (!hit) return wrong(`${source.name} không phi Hóa ${m[2]} nhập ${m[3]}`);
  }
  return OK;
}

export function checkConditionIndependently(chart: ChartView, condition: string): CheckResult {
  const c = String(condition || "").normalize("NFC").trim();
  let m: RegExpMatchArray | null;

  // Cung P [VCD ...] an tại B có ...
  if ((m = c.match(/^(Tam hợp )?[Cc]ung (.+?) an tại (\S+) có (.+)$/))) {
    const p = findPalace(chart, m[2]);
    if (!p) return wrong(`không tìm thấy cung ${m[2]}`);
    if (branchNorm(p.earthlyBranch) !== branchNorm(m[3])) return wrong(`cung ${p.name} ở ${p.earthlyBranch}, điều kiện đòi ${m[3]}`);

    let tail = m[4];
    const vcd = tail.match(/^sao Vô chính diệu tọa thủ và các sao (.+) xung chiếu$/);
    if (vcd) {
      if (mainStars(p).length) return wrong(`cung có chính tinh ${mainStars(p).join(", ")}`);
      const opposite = atOffset(chart, p, 6)!;
      for (const t of vcd[1].split(",")) {
        const r = checkToken(chart, opposite, t, [opposite]);
        if (r.status !== "ok") return r;
      }
      return OK;
    }
    tail = tail.replace(/^(các )?sao /i, "");
    const tpt = / hội hợp$/i.test(tail);
    const single = / (đơn thủ|độc tọa)$/i.test(tail);
    tail = tail.replace(/ hội hợp$| đơn thủ$| độc tọa$/i, "");
    const scope = tpt ? tamPhuong(chart, p) : [p];

    for (let token of tail.split(",")) {
      token = token.trim();
      if (/ và không tự hóa$/i.test(token)) {
        if (flows(p).some((f) => f.relation === "tu_hoa")) return wrong("cung có tự hóa");
        token = token.replace(/ và không tự hóa$/i, "");
      }
      const r = checkToken(chart, p, token, scope);
      if (r.status !== "ok") return r;
    }
    if (single) {
      const mains = mainStars(p);
      if (mains.length !== 1) return wrong(`cung có ${mains.length} chính tinh, không phải đơn thủ`);
    }
    return OK;
  }

  // Cung P an tại B giáp X và Y
  if ((m = c.match(/^Cung (.+?) an tại (\S+) giáp (.+?) và (.+)$/))) {
    const p = findPalace(chart, m[1]);
    if (!p || branchNorm(p.earthlyBranch) !== branchNorm(m[2])) return wrong(`cung ${m[1]} không ở ${m[2]}`);
    const [left, right] = [atOffset(chart, p, -1)!, atOffset(chart, p, 1)!];
    const has = (x: PalaceView, token: string) => checkToken(chart, x, token, [x]).status === "ok";
    return (has(left, m[3]) && has(right, m[4])) || (has(left, m[4]) && has(right, m[3])) ? OK : wrong(`không giáp ${m[3]} và ${m[4]}`);
  }

  // Cung P VCD tại B, khi mượn sao của đối cung thì có X
  if (
    (m = c.match(/^Cung (.+?) (?:Vô Chính Diệu|VCD) tại (\S+), khi mượn sao của đối cung thì có (.+)$/i)) ||
    (m = c.match(/^Cung (.+?) vô chính diệu ở (\S+), đối cung là (.+)$/i)) ||
    (m = c.match(/^Cung (.+?) vô chính diệu an tại (\S+) có các sao (.+) xung chiếu$/i))
  ) {
    const p = findPalace(chart, m[1]);
    if (!p || branchNorm(p.earthlyBranch) !== branchNorm(m[2])) return wrong(`cung ${m[1]} không ở ${m[2]}`);
    if (mainStars(p).length) return wrong(`cung có chính tinh ${mainStars(p).join(", ")}`);
    const opposite = atOffset(chart, p, 6)!;
    for (const t of m[3].split(",")) {
      const r = checkToken(chart, opposite, t, [opposite]);
      if (r.status !== "ok") return r;
    }
    return OK;
  }

  if ((m = c.match(/^Cung (.+?) tự Hóa (lộc|quyền|khoa|kỵ|kị)$/i))) {
    const p = findPalace(chart, m[1]);
    return p && flows(p).some((f) => f.relation === "tu_hoa" && f.type === HOA[lower(m![2])]) ? OK : wrong(`${m[1]} không tự Hóa ${m[2]}`);
  }
  if ((m = c.match(/^Cung Thân đồng cung với cung (.+)$/))) {
    const body = chart.palaces.find((p) => p.isBodyPalace);
    return body && lower(body.name) === palaceNorm(m[1]) ? OK : wrong(`Thân cư ${body?.name}`);
  }
  if ((m = c.match(/^Người tọa Mệnh ở cung (\S+)$/))) {
    const p = findPalace(chart, "Mệnh");
    return p && branchNorm(p.earthlyBranch) === branchNorm(m[1]) ? OK : wrong(`Mệnh ở ${p?.earthlyBranch}`);
  }
  if ((m = c.match(/^Lá số có (.+?) tại (\S+)$/))) {
    const p = chart.palaces.find((x) => branchNorm(x.earthlyBranch) === branchNorm(m![2]));
    return p && starNames(p).has(starNorm(m[1])) ? OK : wrong(`không có ${m[1]} tại ${m[2]}`);
  }
  if ((m = c.match(/^Lai Nhân Cung ở cung (.+)$/i))) {
    return palaceNorm((chart as any).laiNhanCung?.functionalPalace ?? "") === palaceNorm(m[1]) ? OK : wrong("Lai nhân cung khác");
  }
  if ((m = c.match(/^Cung (.+?) vô chính diệu$/i))) {
    const p = findPalace(chart, m[1]);
    return p && mainStars(p).length === 0 ? OK : wrong(`cung ${m[1]} có chính tinh`);
  }
  // "Cung X có sao A, cung Y có sao B" / "Cung Mệnh có ..." (star-combinations)
  if (/^Cung .+? có /.test(c) && !/ an tại /.test(c)) {
    for (const part of c.split(/,\s*(?=cung )/i)) {
      const pm = part.match(/^cung (.+?) có (.+)$/i);
      if (!pm) return UNCHECKED;
      const p = findPalace(chart, pm[1]);
      if (!p) return wrong(`không tìm thấy cung ${pm[1]}`);
      let tail = pm[2].replace(/^(các )?sao /i, "");
      const tpt = / hội hợp$/i.test(tail);
      const single = / (đơn thủ|độc tọa)$/i.test(tail);
      tail = tail.replace(/ hội hợp$| đơn thủ$| độc tọa$/i, "");
      for (const token of tail.split(",")) {
        const r = checkToken(chart, p, token.trim(), tpt ? tamPhuong(chart, p) : [p]);
        if (r.status !== "ok") return r;
      }
      if (single && mainStars(p).length !== 1) return wrong("không phải đơn thủ");
    }
    return OK;
  }
  if (/hóa (lộc|quyền|khoa|kỵ|kị)/i.test(c) && !/\[năm sinh\]/.test(c)) return checkFlowClauses(chart, c);
  return UNCHECKED;
}

// ============ PHẠM VI NỘI DUNG ============
//
// Điều kiện đúng chưa đủ: nội dung cũng phải nói về đúng lá số. Kiểm câu mở đầu của nội dung:
// giới tính ("Nam mệnh ..."), năm sinh ("Người sinh năm Giáp, Kỷ ..."), vị trí ("... ở hai cung Thìn
// hoặc Tuất") và chính tinh được nhắc phải khớp lá số.

const STEMS_RE = "Giáp|Ất|Bính|Đinh|Mậu|Kỷ|Kỉ|Canh|Tân|Nhâm|Quý|Quí";
const BR_RE = "Tý|Tí|Sửu|Dần|Mão|Thìn|Tỵ|Tị|Ngọ|Mùi|Thân|Dậu|Tuất|Hợi";
const PALACE_WORDS = /[Cc]ung (Mệnh|Phụ mẫu|Phúc đức|Điền trạch|Quan lộc|Nô bộc|Giao hữu|Thiên di|Tật ách|Tài bạch|Tử tức|Tử nữ|Phu thê|Huynh đệ|Thân|Sự nghiệp)/gi;

function firstSentence(text: string): string {
  const lines = text.split("\n").map((l) => l.replace(/^[\s\-•*\d.)]+/, "").trim()).filter(Boolean);
  let s = lines[0] ?? "";
  if (lines[1] && s.length < 120 && !/[.!?;]$/.test(s)) s += " " + lines[1];
  const cut = s.search(/[.!?;]\s/);
  return (cut >= 0 ? s.slice(0, cut + 1) : s).slice(0, 300);
}

export function checkTextScopeIndependently(chart: ChartView, cardPalace: string, condition: string, text: string): CheckResult {
  if (/^Lá số có/.test(condition)) return OK; // Tổng quan: bảng liệt kê 12 cung
  const lead = firstSentence(text);
  const gender = /nữ/i.test(String(chart.profile.gender)) ? "female" : "male";

  if (/^nam mệnh/i.test(lead) && !/nữ mệnh/i.test(lead) && gender !== "male") return wrong(`nội dung cho Nam mệnh, lá số là Nữ: "${lead.slice(0, 80)}"`);
  if (/^nữ mệnh/i.test(lead) && !/nam mệnh/i.test(lead) && gender !== "female") return wrong(`nội dung cho Nữ mệnh, lá số là Nam: "${lead.slice(0, 80)}"`);

  const year = lead.match(new RegExp(`(?:sinh năm|tuổi)\s+((?:${STEMS_RE})(?:\s*(?:,|hoặc|và|/)\s*(?:${STEMS_RE}))*)`, "i"));
  const yearStem = lower((chart.profile as any).yearStem ?? "");
  if (year && yearStem && !year[1].split(/\s*(?:,|hoặc|và|\/)\s*/).map((x) => lower(x).replace("kỉ", "kỷ").replace("quí", "quý")).includes(yearStem)) {
    return wrong(`nội dung cho người sinh năm ${year[1]}, lá số sinh năm ${yearStem}`);
  }

  const palaces = [cardPalace, ...[...condition.matchAll(PALACE_WORDS)].map((m) => m[1])]
    .map((name) => findPalace(chart, name))
    .filter(Boolean) as PalaceView[];

  const cleaned = lead.replace(/giờ\s+\S+(\s*(,|hoặc|và)\s*\S+)*/gi, " ").replace(/cung Thân|Thân cư|Mệnh,?\s*Thân|Thân,?\s*Mệnh/gi, " ");
  const loc = [...cleaned.matchAll(new RegExp(`(?:^|[^\p{L}])(?:ở|tại|cư|thủ|tọa|nhập|đóng|lâm)\s+(?:(?:hai|các|bốn|2|4)\s+)?(?:cung\s+|vị trí\s+)?((?:${BR_RE})(?:\s*(?:,|hoặc|và|/|-|~)\s*(?:${BR_RE}))*)(?![\p{L}])`, "giu"))]
    .flatMap((m) => m[1].split(/\s*(?:,|hoặc|và|\/|-|~)\s*/))
    .map(branchNorm);
  if (loc.length) {
    const allowed = new Set(palaces.flatMap((p) => (mainStars(p).length ? [branchNorm(p.earthlyBranch)] : [branchNorm(p.earthlyBranch), branchNorm(atOffset(chart, p, 6)!.earthlyBranch)])));
    if (!loc.some((b) => allowed.has(b))) return wrong(`nội dung nói vị trí ${[...new Set(loc)].join("/")}, cung ở ${palaces.map((p) => p.earthlyBranch).join("/")}: "${lead.slice(0, 90)}"`);
  }

  const leadLower = lower(lead).replace(/tử vi (đẩu số|bắc phái|nam phái|học)|(lá số|môn|khoa|sách) tử vi/g, " ");
  const mentioned = MAIN.filter((name) => leadLower.includes(name));
  if (mentioned.length) {
    const present = new Set(palaces.flatMap((p) => tamPhuong(chart, p)).flatMap(mainStars));
    const missing = mentioned.filter((name) => !present.has(name));
    if (missing.length) return wrong(`nội dung nhắc ${missing.join(", ")} nhưng tam phương không có: "${lead.slice(0, 90)}"`);
  }

  // Độ sáng: một chính tinh + chỉ "miếu/vượng/đắc" hoặc chỉ "hãm"
  const good = /nhập miếu|miếu địa|miếu vượng|vượng địa|đắc địa|(^|[^\p{L}])(miếu|vượng)([^\p{L}]|$)/iu.test(lead);
  const bad = /lạc hãm|hãm địa|(^|[^\p{L}])hãm([^\p{L}]|$)/iu.test(lead);
  if (mentioned.length === 1 && good !== bad) {
    const holders = palaces.flatMap((p) => [p, atOffset(chart, p, 6)!]);
    const star = holders.flatMap(natal).find((s) => starNorm(s.name) === mentioned[0] && s.brightness);
    const code = String(star?.brightness ?? "").toUpperCase();
    const ok = good ? ["M", "V", "Đ"].includes(code) : code === "H";
    if (!ok) return wrong(`nội dung nói ${mentioned[0]} ${good ? "miếu/vượng" : "hãm"} nhưng lá số là "${code || "?"}": "${lead.slice(0, 90)}"`);
  }
  return OK;
}

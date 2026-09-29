/** Chuẩn hóa văn bản + băm nội dung (không phụ thuộc thư viện ngoài - dùng chung cho crawler và normalizeKnowledge). */
import { createHash } from "node:crypto";

// Dấu thanh kiểu cũ ("hoá", "Thuỷ") -> kiểu dùng trong kho.
const TONE_OLD: Record<string, string> = { "oà": "òa", "oá": "óa", "oả": "ỏa", "oã": "õa", "oạ": "ọa", "uỳ": "ùy", "uý": "úy", "uỷ": "ủy", "uỹ": "ũy", "uỵ": "ụy" };

export const normalizeText = (text: string) =>
  String(text || "")
    .normalize("NFC")
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t ]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

/** Dạng so khớp: chữ thường, dấu thanh thống nhất, "kị" -> "kỵ", bỏ dấu câu - dùng cho normalized_hash và shingle. */
export const matchForm = (text: string) =>
  normalizeText(text)
    .toLowerCase()
    .replace(/(o[àáảãạ]|(?<!q)u[ỳýỷỹỵ])(?![\p{L}])/gu, (m) => TONE_OLD[m] ?? m) // "quý" giữ nguyên
    .replace(/(^|[^\p{L}])kị(?![\p{L}])/gu, "$1kỵ")
    .replace(/[^\p{L}\d]+/gu, " ")
    .trim();

export const sha256 = (text: string) => createHash("sha256").update(text).digest("hex");

/** Khóa ổn định của một đoạn tri thức trong kho luận giải (không đổi khi chạy lại normalize). */
export const kbKey = (text: string) => `kbx_${sha256(matchForm(text)).slice(0, 12)}`;

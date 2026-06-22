import type { SchoolConfig } from "../config/types";
import { normalizeLookupKey, safeText } from "../utils";

export function normalizePalaceName(value: unknown, config: SchoolConfig) {
  const text = safeText(value);
  if (!text) {
    return "";
  }

  return config.palaceAliases?.[text] ?? config.palaceAliases?.[normalizeLookupKey(text)] ?? text;
}

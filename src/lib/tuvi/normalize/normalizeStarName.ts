import { STAR_ALIAS_MAP } from "../rules/starAliases";
import { normalizeLookupKey, safeText } from "../utils";

export function normalizeStarName(
  value: unknown,
  aliases: Record<string, string> = {},
): { name: string; originalName: string } {
  const originalName = safeText(value);
  if (!originalName) {
    return { name: "", originalName: "" };
  }

  const normalizedKey = normalizeLookupKey(originalName);
  const mergedAliases = { ...STAR_ALIAS_MAP, ...aliases };
  const name =
    mergedAliases[originalName] ??
    mergedAliases[originalName.toLowerCase()] ??
    mergedAliases[normalizedKey] ??
    Object.entries(mergedAliases).find(([key]) => normalizeLookupKey(key) === normalizedKey)?.[1] ??
    originalName;

  return { name, originalName };
}

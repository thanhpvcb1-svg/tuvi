import { normalizeLookupKey, safeText } from "../utils";

export function normalizeStarName(
  value: unknown,
  aliases: Record<string, string>,
): { name: string; originalName: string } {
  const originalName = safeText(value);
  if (!originalName) {
    return { name: "", originalName: "" };
  }

  const normalizedKey = normalizeLookupKey(originalName);
  const name =
    aliases[originalName] ??
    aliases[originalName.toLowerCase()] ??
    aliases[normalizedKey] ??
    Object.entries(aliases).find(([key]) => normalizeLookupKey(key) === normalizedKey)?.[1] ??
    originalName;
  return { name, originalName };
}

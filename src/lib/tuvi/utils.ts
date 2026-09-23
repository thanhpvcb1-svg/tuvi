export function safeText(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.map(safeText).filter(Boolean).join(" ");
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;

    for (const key of ["name", "label", "text", "value", "title"]) {
      const text = safeText(record[key]);
      if (text) {
        return text;
      }
    }
  }

  return String(value);
}

export function normalizeLookupKey(value: unknown): string {
  return safeText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/Ä‘/g, "d")
    .replace(/Ä/g, "D")
    .toLowerCase()
    .trim();
}

export function dedupeBy<T>(items: T[], getKey: (item: T) => string) {
  return items.filter((item, index, collection) => {
    const key = getKey(item);
    return collection.findIndex((candidate) => getKey(candidate) === key) === index;
  });
}

/**
 * robots.txt tối giản theo RFC 9309: chọn nhóm của user-agent của mình (nếu có) hoặc "*",
 * luật dài nhất thắng, Allow thắng khi dài bằng nhau; hỗ trợ ký tự đại diện "*" và "$". Có Crawl-delay.
 */
export type RobotsRules = { rules: Array<{ allow: boolean; pattern: string }>; crawlDelaySec: number | null };

export function parseRobots(text: string, agentToken: string): RobotsRules {
  const groups: Array<{ agents: string[]; rules: RobotsRules["rules"]; delay: number | null }> = [];
  let current: (typeof groups)[number] | null = null;
  let lastWasAgent = false;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/#.*/, "").trim();
    const m = line.match(/^([A-Za-z-]+)\s*:\s*(.*)$/);
    if (!m) continue;
    const key = m[1].toLowerCase();
    const value = m[2].trim();
    if (key === "user-agent") {
      if (!current || !lastWasAgent) {
        current = { agents: [], rules: [], delay: null };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
      lastWasAgent = true;
      continue;
    }
    lastWasAgent = false;
    if (!current) continue;
    if (key === "allow" || key === "disallow") {
      if (value) current.rules.push({ allow: key === "allow", pattern: value });
    } else if (key === "crawl-delay") {
      const delay = Number(value);
      if (Number.isFinite(delay)) current.delay = delay;
    }
  }
  const token = agentToken.toLowerCase();
  const own = groups.filter((g) => g.agents.some((a) => a !== "*" && token.includes(a)));
  const chosen = own.length ? own : groups.filter((g) => g.agents.includes("*"));
  return {
    rules: chosen.flatMap((g) => g.rules),
    crawlDelaySec: chosen.map((g) => g.delay).find((d) => d != null) ?? null,
  };
}

// "*" = chuỗi bất kỳ; "$" ở cuối = khớp đến hết đường dẫn (các ký tự khác hiểu theo nghĩa đen).
const patternToRegex = (pattern: string) => {
  const anchored = pattern.endsWith("$");
  const body = (anchored ? pattern.slice(0, -1) : pattern).replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
  return new RegExp(`^${body}${anchored ? "$" : ""}`);
};

export function isAllowed(robots: RobotsRules, url: string): boolean {
  const u = new URL(url);
  const path = u.pathname + u.search;
  let best: { allow: boolean; length: number } | null = null;
  for (const rule of robots.rules) {
    if (!patternToRegex(rule.pattern).test(path)) continue;
    const length = rule.pattern.length;
    if (!best || length > best.length || (length === best.length && rule.allow)) best = { allow: rule.allow, length };
  }
  return best ? best.allow : true;
}

/** Parse LLM insight text into bullet strings. */
export function parseInsightBullets(text) {
  if (!text) return [];
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => l.replace(/^([-*•]|\d+[\.\)])\s*/, ""))
    .filter((l) => l.length > 0);
}

/** One-line teaser for dashboard — first bullet only, truncated. */
export function getDashboardInsightTeaser(text, { maxLength = 90 } = {}) {
  const [first] = parseInsightBullets(text);
  if (!first) return null;
  if (first.length <= maxLength) return first;
  return `${first.slice(0, maxLength - 1).trimEnd()}…`;
}

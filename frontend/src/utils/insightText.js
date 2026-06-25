import { EXPENSE_CATEGORIES, formatCategory } from "../styles/theme";

const SCREAMING_SNAKE = /\b[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+\b/g;
const LOWER_SNAKE = /\b[a-z][a-z0-9]*(?:_[a-z0-9]+)+\b/g;

/** Replace raw category keys in insight prose with friendly labels. */
export function humanizeInsightText(text) {
  if (!text) return text;

  let result = text;
  const sorted = [...EXPENSE_CATEGORIES].sort((a, b) => b.length - a.length);
  for (const cat of sorted) {
    const label = formatCategory(cat);
    const escaped = cat.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(
      `(?<![A-Za-z0-9_])${escaped}(?![A-Za-z0-9_])`,
      "gi",
    );
    result = result.replace(pattern, label);
  }

  const replaceSnake = (token) =>
    token.includes("_") ? formatCategory(token) : token;

  result = result.replace(SCREAMING_SNAKE, replaceSnake);
  result = result.replace(LOWER_SNAKE, replaceSnake);
  return result;
}

/** Parse LLM insight text into bullet strings. */
export function parseInsightBullets(text) {
  if (!text) return [];
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => l.replace(/^([-*•]|\d+[\.\)])\s*/, ""))
    .map((l) => humanizeInsightText(l))
    .filter((l) => l.length > 0);
}

/** One-line teaser for dashboard — first bullet only, truncated. */
export function getDashboardInsightTeaser(text, { maxLength = 90 } = {}) {
  const [first] = parseInsightBullets(text);
  if (!first) return null;
  if (first.length <= maxLength) return first;
  return `${first.slice(0, maxLength - 1).trimEnd()}…`;
}

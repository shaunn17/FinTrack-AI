import { formatCategory, formatDate, formatMoney } from "../styles/theme";

const USER_FIRST_NAME = import.meta.env.VITE_USER_NAME || "Shaun";

export function getGreeting() {
  const hour = new Date().getHours();
  let phrase;
  if (hour < 12) phrase = "Good morning";
  else if (hour < 17) phrase = "Good afternoon";
  else phrase = "Good evening";
  return `${phrase}, ${USER_FIRST_NAME}`;
}

export function getLargestCategory(categoryBreakdown) {
  if (!categoryBreakdown?.length) return null;
  const sorted = [...categoryBreakdown].sort(
    (a, b) => Number(b.total) - Number(a.total)
  );
  const top = sorted[0];
  const totalSpent = categoryBreakdown.reduce(
    (s, c) => s + Number(c.total),
    0
  );
  const pct = totalSpent > 0 ? (Number(top.total) / totalSpent) * 100 : 0;
  return {
    category: top.category,
    amount: Number(top.total),
    percentOfSpend: pct,
  };
}

export function percentIncomeSpent(income, spent) {
  const inc = Number(income ?? 0);
  if (inc <= 0) return null;
  return (Number(spent ?? 0) / inc) * 100;
}

export function formatMomDelta(current, previous, { invertTone = false } = {}) {
  if (previous == null || previous === undefined) return null;
  const diff = Number(current) - Number(previous);
  if (diff === 0) {
    return { text: "Same as last month", tone: "neutral" };
  }
  const sign = diff > 0 ? "+" : "";
  const text = `${sign}${formatMoney(diff)} vs last month`;
  const tone = invertTone
    ? diff > 0
      ? "loss"
      : "gain"
    : diff > 0
      ? "gain"
      : "loss";
  return { text, tone };
}

export function getCapUsageInsights(caps, summary) {
  const totals = new Map(
    (summary?.category_breakdown || []).map((c) => [
      c.category,
      Number(c.total),
    ])
  );
  const capRows = (caps || [])
    .map((c) => {
      const spent = totals.get(c.category) || 0;
      const cap = Number(c.cap_amount);
      const pct = cap > 0 ? (spent / cap) * 100 : 0;
      return { category: c.category, spent, cap, pct, over: spent > cap };
    })
    .filter((r) => r.cap > 0);

  const overCap = capRows.filter((r) => r.over);
  const topCap = [...capRows].sort((a, b) => b.pct - a.pct)[0] ?? null;
  return { overCap, topCap };
}

export function getSnapshotRecommendation({
  savingsRate,
  largestCategory,
  pctIncomeSpent,
  overCapCategories,
}) {
  if (overCapCategories?.length > 0) {
    const names = overCapCategories
      .slice(0, 2)
      .map((c) => formatCategory(c.category))
      .join(" and ");
    return `Review spending in ${names} — over budget cap this month.`;
  }
  if (savingsRate != null && savingsRate < 0) {
    return "Spending exceeded income. Trim discretionary categories or adjust caps.";
  }
  if (savingsRate != null && savingsRate < 10) {
    return "Savings rate is low. Look for cuts in your largest spending category.";
  }
  if (pctIncomeSpent != null && pctIncomeSpent > 80) {
    return `You've spent ${pctIncomeSpent.toFixed(0)}% of income — leave room for savings.`;
  }
  if (largestCategory) {
    return `${formatCategory(largestCategory.category)} is your top expense — set a cap if you want to limit it.`;
  }
  return "Keep logging expenses to unlock sharper recommendations.";
}

export function formatRelativeDate(value) {
  if (!value) return "";
  const [y, m, d] = String(value).slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return formatDate(value);
  const date = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  const diffDays = Math.round((today - date) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays > 1 && diffDays < 7) return `${diffDays} days ago`;
  return formatDate(value);
}

import {
  EXPENSE_CATEGORIES,
  formatCategory,
  formatMoney,
  theme,
} from "../../styles/theme";

export default function CategoryBreakdown({ summary, caps }) {
  const totals = new Map(
    (summary?.category_breakdown || []).map((c) => [c.category, Number(c.total)])
  );
  const capMap = new Map((caps || []).map((c) => [c.category, Number(c.cap_amount)]));

  const rows = EXPENSE_CATEGORIES.map((cat) => ({
    category: cat,
    spent: totals.get(cat) || 0,
    cap: capMap.get(cat) || null,
  })).filter((r) => r.spent > 0 || r.cap);

  if (rows.length === 0) {
    return (
      <div className="card p-5">
        <h3 className="font-semibold mb-2">Category Breakdown</h3>
        <p className="text-sm text-text-secondary">
          Log an expense or set a cap to see category breakdown.
        </p>
      </div>
    );
  }

  return (
    <div className="card p-5">
      <h3 className="font-semibold mb-4">Category Breakdown</h3>
      <ul className="space-y-3">
        {rows.map(({ category, spent, cap }) => {
          const color = theme.categoryColors[category];
          const pct = cap ? Math.min(100, (spent / cap) * 100) : null;
          const overBudget = cap && spent > cap;
          return (
            <li key={category}>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block w-2 h-2 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span>{formatCategory(category)}</span>
                </div>
                <div className="text-text-secondary">
                  <span className={overBudget ? "text-loss" : "text-text-primary"}>
                    {formatMoney(spent)}
                  </span>
                  {cap != null && (
                    <span className="text-text-muted"> / {formatMoney(cap)}</span>
                  )}
                </div>
              </div>
              {cap != null && (
                <div className="mt-1.5 h-1.5 w-full bg-bg rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: overBudget ? theme.colors.loss : color,
                    }}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

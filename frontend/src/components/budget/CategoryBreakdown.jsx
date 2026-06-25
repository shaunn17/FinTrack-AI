import {
  EXPENSE_CATEGORIES,
  formatCategory,
  formatMoney,
  theme,
} from "../../styles/theme";

export default function CategoryBreakdown({ summary, caps, loading = false }) {
  const totals = new Map(
    (summary?.category_breakdown || []).map((c) => [c.category, Number(c.total)])
  );
  const capMap = new Map((caps || []).map((c) => [c.category, Number(c.cap_amount)]));

  const rows = EXPENSE_CATEGORIES.map((cat) => ({
    category: cat,
    spent: totals.get(cat) || 0,
    cap: capMap.get(cat) || null,
  }))
    .filter((r) => r.spent > 0 || r.cap)
    .sort((a, b) => b.spent - a.spent);

  const overCount = rows.filter((r) => r.cap && r.spent > r.cap).length;

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">By category</h3>
        {!loading && overCount > 0 && (
          <span className="text-[10px] font-medium uppercase tracking-wide text-loss">
            {overCount} over cap
          </span>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-text-muted">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-text-secondary">
          Log an expense or set a cap to see breakdown.
        </p>
      ) : (
        <ul className="space-y-3.5">
          {rows.map(({ category, spent, cap }) => {
            const color = theme.categoryColors[category];
            const pct = cap ? Math.min(100, (spent / cap) * 100) : null;
            const overBudget = cap && spent > cap;
            return (
              <li key={category}>
                <div className="flex items-center justify-between gap-2 text-sm mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="inline-block w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span className="truncate">{formatCategory(category)}</span>
                  </div>
                  <div className="text-right shrink-0 tabular-nums">
                    <span
                      className={
                        overBudget ? "text-loss font-medium" : "text-text-primary"
                      }
                    >
                      {formatMoney(spent)}
                    </span>
                    {cap != null && (
                      <span className="text-text-muted text-xs">
                        {" "}
                        / {formatMoney(cap)}
                      </span>
                    )}
                  </div>
                </div>
                {cap != null && (
                  <div className="h-1.5 w-full bg-bg rounded-full overflow-hidden">
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
      )}
    </div>
  );
}

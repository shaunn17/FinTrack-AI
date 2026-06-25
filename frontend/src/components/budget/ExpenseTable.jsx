import { deleteExpense } from "../../services/api";
import { formatMoney } from "../../styles/theme";
import { formatRelativeDate } from "../../utils/dashboardMetrics";
import Badge from "../shared/Badge";

export default function ExpenseTable({ expenses, loading = false, onChanged }) {
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this expense?")) return;
    await deleteExpense(id);
    onChanged?.();
  };

  const count = expenses?.length ?? 0;

  return (
    <div className="card p-5 h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Expenses</h3>
        {!loading && count > 0 && (
          <span className="text-xs text-text-muted">
            {count} entr{count === 1 ? "y" : "ies"}
          </span>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-text-muted">Loading…</p>
      ) : count === 0 ? (
        <p className="text-sm text-text-secondary">
          No expenses logged for this month yet.
        </p>
      ) : (
        <ul className="space-y-1">
          {expenses.map((e) => (
            <li
              key={e.id}
              className="flex items-start justify-between gap-3 py-3 border-b border-border/40 last:border-0 group"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge category={e.category} />
                  <span className="text-[11px] text-text-muted">
                    {formatRelativeDate(e.date)}
                  </span>
                </div>
                {e.note && (
                  <p className="text-sm text-text-secondary truncate mt-1">
                    {e.note}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="font-medium tabular-nums text-text-primary">
                  {formatMoney(e.amount)}
                </span>
                <button
                  type="button"
                  onClick={() => handleDelete(e.id)}
                  className="text-[11px] text-text-muted hover:text-loss opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                  title="Delete expense"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

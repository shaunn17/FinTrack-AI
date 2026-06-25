import { useMemo, useState } from "react";
import { deleteTransaction } from "../../services/api";
import { formatMoney } from "../../styles/theme";
import { formatRelativeDate } from "../../utils/dashboardMetrics";

const PAGE_SIZE = 10;

function sortByDateDesc(items) {
  return [...items].sort((a, b) => {
    const da = new Date(a.date).getTime();
    const db = new Date(b.date).getTime();
    if (db !== da) return db - da;
    return String(b.id).localeCompare(String(a.id));
  });
}

export default function TransactionsTable({
  transactions,
  livePriceByTicker = {},
  loading = false,
  onChanged,
}) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const sortedTransactions = useMemo(
    () => sortByDateDesc(transactions || []),
    [transactions]
  );

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this transaction?")) return;
    await deleteTransaction(id);
    onChanged?.();
  };

  const count = sortedTransactions.length;
  const visibleTransactions = sortedTransactions.slice(0, visibleCount);
  const hasMore = visibleCount < count;

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">History</h3>
        {!loading && count > 0 && (
          <span className="text-xs text-text-muted">
            {count} transaction{count === 1 ? "" : "s"}
          </span>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-text-muted">Loading transactions…</p>
      ) : count === 0 ? (
        <p className="text-sm text-text-secondary">
          No transactions yet. Log one above or import a CSV.
        </p>
      ) : (
        <>
        <ul className="space-y-1">
          {visibleTransactions.map((t) => {
            const ticker = String(t.ticker || "").toUpperCase();
            const lastRaw = livePriceByTicker[ticker];
            const lastNum = lastRaw != null ? Number(lastRaw) : null;
            const lastOk = lastNum != null && Number.isFinite(lastNum);
            const qty = Number(t.quantity);
            const valueAtLast =
              lastOk && Number.isFinite(qty) ? qty * lastNum : null;

            const subParts = [
              `${Number(t.quantity).toLocaleString(undefined, {
                maximumFractionDigits: 6,
              })} sh @ ${formatMoney(t.buy_price)}`,
            ];
            if (lastOk) {
              subParts.push(`Last ${formatMoney(lastNum)}`);
            }
            if (valueAtLast != null) {
              subParts.push(`Value ${formatMoney(valueAtLast)}`);
            }

            return (
              <li
                key={t.id}
                className="flex items-start justify-between gap-3 py-3 border-b border-border/40 last:border-0 group"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-text-primary">
                      {t.ticker}
                    </span>
                    <span className="text-[11px] text-text-muted">
                      {formatRelativeDate(t.date)}
                    </span>
                  </div>
                  <p className="text-sm text-text-secondary truncate mt-1">
                    {subParts.join(" · ")}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-medium tabular-nums text-text-primary">
                    {formatMoney(t.total_cost)}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDelete(t.id)}
                    className="text-[11px] text-text-muted hover:text-loss opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                    title="Delete transaction"
                  >
                    Delete
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
        {count > PAGE_SIZE && (
          <div className="mt-4 flex flex-col items-center gap-2 border-t border-border/40 pt-4">
            <p className="text-xs text-text-muted">
              Showing {visibleTransactions.length} of {count}
            </p>
            {hasMore && (
              <button
                type="button"
                onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
                className="text-xs font-medium text-accent hover:underline"
              >
                View more
              </button>
            )}
          </div>
        )}
        </>
      )}
    </div>
  );
}

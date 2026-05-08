import { deleteTransaction } from "../../services/api";
import { formatDate, formatMoney } from "../../styles/theme";

export default function TransactionsTable({ transactions, livePriceByTicker = {}, onChanged }) {
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this transaction?")) return;
    await deleteTransaction(id);
    onChanged?.();
  };

  if (!transactions?.length) {
    return (
      <div className="card p-6 text-center text-text-secondary text-sm">
        No transactions in the database yet. Import a CSV or add one above.
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-3 border-b border-border flex items-center justify-between">
        <h3 className="font-semibold">All transactions ({transactions.length})</h3>
        <span className="text-xs text-text-secondary">Newest first</span>
      </div>
      <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="text-text-secondary text-xs uppercase tracking-wide sticky top-0 bg-surface z-10">
            <tr className="border-b border-border">
              <th className="text-left px-5 py-2.5 font-medium">Date</th>
              <th className="text-left px-5 py-2.5 font-medium">Ticker</th>
              <th className="text-right px-5 py-2.5 font-medium">Qty</th>
              <th className="text-right px-5 py-2.5 font-medium">Buy</th>
              <th className="text-right px-5 py-2.5 font-medium">Last</th>
              <th className="text-right px-5 py-2.5 font-medium">Value @ last</th>
              <th className="text-right px-5 py-2.5 font-medium">Total</th>
              <th className="px-5 py-2.5" />
            </tr>
          </thead>
          <tbody className="table-row-alt">
            {transactions.map((t) => {
              const ticker = String(t.ticker || "").toUpperCase();
              const lastRaw = livePriceByTicker[ticker];
              const lastNum = lastRaw != null ? Number(lastRaw) : null;
              const lastOk = lastNum != null && Number.isFinite(lastNum);
              const qty = Number(t.quantity);
              const valueAtLast =
                lastOk && Number.isFinite(qty) ? qty * lastNum : null;
              return (
              <tr key={t.id} className="border-b border-border/50 last:border-b-0">
                <td className="px-5 py-2.5 text-text-secondary whitespace-nowrap">
                  {formatDate(t.date)}
                </td>
                <td className="px-5 py-2.5 font-medium">{t.ticker}</td>
                <td className="px-5 py-2.5 text-right tabular-nums">
                  {Number(t.quantity).toLocaleString(undefined, { maximumFractionDigits: 6 })}
                </td>
                <td className="px-5 py-2.5 text-right tabular-nums">
                  {formatMoney(t.buy_price)}
                </td>
                <td className="px-5 py-2.5 text-right tabular-nums">
                  {lastOk ? formatMoney(lastNum) : "—"}
                </td>
                <td className="px-5 py-2.5 text-right tabular-nums">
                  {valueAtLast != null ? formatMoney(valueAtLast) : "—"}
                </td>
                <td className="px-5 py-2.5 text-right tabular-nums">
                  {formatMoney(t.total_cost)}
                </td>
                <td className="px-5 py-2.5 text-right">
                  <button
                    type="button"
                    onClick={() => handleDelete(t.id)}
                    className="text-loss/80 hover:text-loss text-xs"
                  >
                    Delete
                  </button>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { deleteExpense } from "../../services/api";
import { formatDate, formatMoney } from "../../styles/theme";
import Badge from "../shared/Badge";

export default function ExpenseTable({ expenses, onChanged }) {
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this expense?")) return;
    await deleteExpense(id);
    onChanged?.();
  };

  if (!expenses || expenses.length === 0) {
    return (
      <div className="card p-8 text-center text-text-secondary">
        No expenses logged for this month yet.
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-3 border-b border-border flex items-center justify-between">
        <h3 className="font-semibold">Expenses</h3>
        <span className="text-xs text-text-secondary">
          {expenses.length} entr{expenses.length === 1 ? "y" : "ies"}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-text-secondary text-xs uppercase tracking-wide">
            <tr className="border-b border-border">
              <th className="text-left px-5 py-2.5 font-medium">Date</th>
              <th className="text-left px-5 py-2.5 font-medium">Category</th>
              <th className="text-right px-5 py-2.5 font-medium">Amount</th>
              <th className="text-left px-5 py-2.5 font-medium">Note</th>
              <th className="px-5 py-2.5"></th>
            </tr>
          </thead>
          <tbody className="table-row-alt">
            {expenses.map((e) => (
              <tr
                key={e.id}
                className="border-b border-border/50 last:border-b-0"
              >
                <td className="px-5 py-3 text-text-secondary">
                  {formatDate(e.date)}
                </td>
                <td className="px-5 py-3">
                  <Badge category={e.category} />
                </td>
                <td className="px-5 py-3 text-right font-medium">
                  {formatMoney(e.amount)}
                </td>
                <td className="px-5 py-3 text-text-secondary">
                  {e.note || "—"}
                </td>
                <td className="px-5 py-3 text-right">
                  <button
                    onClick={() => handleDelete(e.id)}
                    className="text-loss/70 hover:text-loss text-xs"
                    title="Delete"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

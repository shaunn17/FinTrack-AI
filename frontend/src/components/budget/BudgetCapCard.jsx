import { useState } from "react";
import { upsertBudgetCap } from "../../services/api";
import {
  EXPENSE_CATEGORIES,
  formatCategory,
  formatMoney,
} from "../../styles/theme";
import Button from "../shared/Button";

export default function BudgetCapCard({ month, caps, onSaved }) {
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await upsertBudgetCap({
        month: `${month}-01`,
        category,
        cap_amount: parseFloat(amount),
      });
      setAmount("");
      onSaved?.();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card p-5">
      <h3 className="font-semibold mb-3">Budget Caps</h3>
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="label">Category</label>
          <select
            className="input"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {formatCategory(c)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Cap Amount</label>
          <input
            className="input"
            type="number"
            step="0.01"
            min="0"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
          />
        </div>
        <Button type="submit" size="sm" disabled={saving} className="w-full">
          {saving ? "Saving…" : "Set Cap"}
        </Button>
      </form>

      {caps && caps.length > 0 && (
        <div className="mt-5 pt-4 border-t border-border">
          <p className="label mb-2">Current Caps</p>
          <ul className="space-y-1 text-sm">
            {caps.map((c) => (
              <li
                key={c.id}
                className="flex justify-between text-text-secondary"
              >
                <span>{formatCategory(c.category)}</span>
                <span className="text-text-primary">
                  {formatMoney(c.cap_amount)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

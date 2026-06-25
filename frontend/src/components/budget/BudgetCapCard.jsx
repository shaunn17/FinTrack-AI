import { useState } from "react";
import { upsertBudgetCap } from "../../services/api";
import {
  EXPENSE_CATEGORIES,
  formatCategory,
  formatMoney,
} from "../../styles/theme";
import Button from "../shared/Button";

export default function BudgetCapCard({ month, caps, onSaved }) {
  const [expanded, setExpanded] = useState(false);
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
      setExpanded(false);
      onSaved?.();
    } finally {
      setSaving(false);
    }
  };

  const capCount = caps?.length ?? 0;

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Budget caps</h3>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-xs text-accent hover:underline"
        >
          {expanded ? "Cancel" : capCount > 0 ? "Update cap" : "Set cap"}
        </button>
      </div>

      {capCount > 0 && (
        <ul className="space-y-2 mb-4">
          {caps.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between text-sm py-1.5 border-b border-border/30 last:border-0"
            >
              <span className="text-text-secondary">
                {formatCategory(c.category)}
              </span>
              <span className="font-medium tabular-nums text-text-primary">
                {formatMoney(c.cap_amount)}
              </span>
            </li>
          ))}
        </ul>
      )}

      {capCount === 0 && !expanded && (
        <p className="text-sm text-text-secondary mb-1">
          Set monthly limits per category to track spending.
        </p>
      )}

      {expanded && (
        <form onSubmit={submit} className="space-y-3 pt-3 border-t border-border/40">
          <div>
            <label className="label text-[11px]">Category</label>
            <select
              className="input py-1.5 text-sm"
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
            <label className="label text-[11px]">Cap amount</label>
            <input
              className="input py-1.5 text-sm"
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
            {saving ? "Saving…" : "Save cap"}
          </Button>
        </form>
      )}
    </div>
  );
}

import { useState } from "react";
import { createExpense, getApiErrorMessage } from "../../services/api";
import { EXPENSE_CATEGORIES, formatCategory } from "../../styles/theme";
import Button from "../shared/Button";

const today = () => new Date().toISOString().slice(0, 10);

export default function ExpenseForm({ onCreated }) {
  const [date, setDate] = useState(today());
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await createExpense({
        date,
        category,
        amount: parseFloat(amount),
        note: note || null,
      });
      setAmount("");
      setNote("");
      onCreated?.();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Log Expense</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div>
          <label className="label">Date</label>
          <input
            className="input"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
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
          <label className="label">Amount</label>
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
        <div>
          <label className="label">Note (optional)</label>
          <input
            className="input"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Trader Joe's"
          />
        </div>
      </div>
      <div className="flex justify-end items-center gap-3">
        {error && <span className="text-loss text-xs">{error}</span>}
        <Button type="submit" disabled={saving}>
          {saving ? "Logging…" : "Log Expense"}
        </Button>
      </div>
    </form>
  );
}

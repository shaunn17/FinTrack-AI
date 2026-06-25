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
    <form onSubmit={submit} className="card p-4">
      <p className="text-[11px] uppercase tracking-wide text-text-secondary mb-3">
        Quick log
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div>
          <label className="label text-[11px]">Date</label>
          <input
            className="input py-1.5 text-sm"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
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
          <label className="label text-[11px]">Amount</label>
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
        <div>
          <label className="label text-[11px]">Note (optional)</label>
          <input
            className="input py-1.5 text-sm"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Trader Joe's"
          />
        </div>
      </div>
      <div className="flex justify-end items-center gap-3 mt-3 pt-3 border-t border-border/40">
        {error && <span className="text-loss text-xs mr-auto">{error}</span>}
        <Button type="submit" size="sm" disabled={saving}>
          {saving ? "Logging…" : "Log expense"}
        </Button>
      </div>
    </form>
  );
}

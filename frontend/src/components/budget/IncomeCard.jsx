import { useEffect, useState } from "react";
import { upsertIncome } from "../../services/api";
import { formatMoney } from "../../styles/theme";
import Button from "../shared/Button";

export default function IncomeCard({ month, income, onSaved }) {
  const [editing, setEditing] = useState(false);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (income) {
      setAmount(income.amount ?? "");
      setNote(income.note ?? "");
    } else {
      setAmount("");
      setNote("");
    }
  }, [income]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await upsertIncome({
        month: `${month}-01`,
        amount: parseFloat(amount || 0),
        note: note || null,
      });
      setEditing(false);
      onSaved?.();
    } finally {
      setSaving(false);
    }
  };

  const hasIncome = income && Number(income.amount) > 0;

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-text-secondary">
            Monthly Income
          </p>
          <p className="text-3xl font-semibold mt-1">
            {hasIncome ? formatMoney(income.amount) : "—"}
          </p>
          {income?.note && !editing && (
            <p className="text-xs text-text-secondary mt-1">{income.note}</p>
          )}
        </div>
        {!editing && (
          <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
            {hasIncome ? "Edit" : "Set Income"}
          </Button>
        )}
      </div>

      {editing && (
        <form onSubmit={handleSave} className="space-y-3 mt-3">
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
              placeholder="e.g. Salary, freelance gig…"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setEditing(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

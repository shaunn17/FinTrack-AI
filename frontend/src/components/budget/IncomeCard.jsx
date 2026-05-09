import { useEffect, useRef, useState } from "react";
import { addIncome, deleteIncomeEntry, getApiErrorMessage } from "../../services/api";
import { formatDate, formatMoney } from "../../styles/theme";
import Button from "../shared/Button";

/** Matches Budget.jsx SummaryStat compact footprint */
const COMPACT_CARD =
  "card p-5 h-full min-h-[8.5rem] flex flex-col";

/** When DB has no `source` column, API stores "Source: Name — note" in `note`. */
function incomeLineTitle(row) {
  if (row.source) return row.source;
  const n = row.note || "";
  const m = n.match(/^Source:\s*(.+?)(\s+—|$)/);
  if (m) return m[1].trim();
  return "Income";
}

function incomeLineNoteExtra(row) {
  if (row.source) return row.note || null;
  const n = row.note || "";
  if (!n.startsWith("Source:")) return n || null;
  const parts = n.split(/\s+—\s*/);
  if (parts.length < 2) return null;
  return parts.slice(1).join(" — ").trim() || null;
}

export default function IncomeCard({ month, income, onSaved, onPanelOpenChange }) {
  const [open, setOpen] = useState(false);
  const [source, setSource] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const rootRef = useRef(null);

  const total = income ? Number(income.total_amount || 0) : 0;
  const entries = income?.entries ?? [];
  const hasIncome = total > 0;

  useEffect(() => {
    onPanelOpenChange?.(open);
  }, [open, onPanelOpenChange]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await addIncome({
        month: `${month}-01`,
        amount: parseFloat(amount || 0),
        source: source.trim() || null,
        note: note.trim() || null,
      });
      setSource("");
      setAmount("");
      setNote("");
      onSaved?.();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this income line?")) return;
    setError(null);
    try {
      await deleteIncomeEntry(id);
      onSaved?.();
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  return (
    <div ref={rootRef} className="relative h-full min-h-0">
      <div className={COMPACT_CARD}>
        <div>
          <p className="text-xs uppercase tracking-wide text-text-secondary">
            Monthly income
          </p>
          <p className="text-3xl font-semibold mt-1 tabular-nums">
            {hasIncome ? formatMoney(total) : "—"}
          </p>
          <p className="text-xs text-text-secondary mt-1 line-clamp-1">
            {entries.length > 0
              ? `${entries.length} source${entries.length === 1 ? "" : "s"}`
              : "\u00a0"}
          </p>
        </div>
        <div className="mt-auto pt-3 min-h-[2.25rem] flex items-end">
          <button
            type="button"
            onClick={() => {
              setOpen((v) => !v);
              setError(null);
            }}
            className="text-xs font-medium text-accent hover:underline flex items-center gap-1"
            aria-expanded={open}
          >
            {open ? "Close" : "Add / manage income"}
            <span className="text-[10px] opacity-80" aria-hidden>
              {open ? "\u25b4" : "\u25be"}
            </span>
          </button>
        </div>
      </div>

      {open && (
        <div
          className="absolute z-50 left-0 right-0 top-full mt-2 sm:left-0 sm:right-auto sm:w-[min(100%,22rem)] lg:w-[min(100%,24rem)]"
          role="region"
          aria-label="Income details"
        >
          <div className="card p-4 border border-border shadow-xl bg-surface max-h-[min(70vh,28rem)] flex flex-col">
            {error && <p className="text-loss text-xs mb-2">{error}</p>}

            {entries.length > 0 && (
              <div className="mb-3 border border-border rounded-lg overflow-hidden shrink min-h-0">
                <div className="px-2.5 py-1.5 bg-surface2 border-b border-border text-[10px] uppercase tracking-wide text-text-secondary">
                  Income log
                </div>
                <ul className="divide-y divide-border/60 max-h-40 overflow-y-auto text-sm">
                  {entries.map((row) => (
                    <li
                      key={row.id}
                      className="px-2.5 py-2 flex items-start justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <p className="font-medium truncate text-xs">
                          {incomeLineTitle(row)}
                        </p>
                        <p className="text-text-secondary text-[11px] tabular-nums">
                          {formatMoney(row.amount)}
                          {incomeLineNoteExtra(row)
                            ? ` · ${incomeLineNoteExtra(row)}`
                            : ""}
                        </p>
                        {row.created_at && (
                          <p className="text-text-muted text-[10px] mt-0.5">
                            {formatDate(row.created_at.slice(0, 10))}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDelete(row.id)}
                        className="text-loss/80 hover:text-loss text-[11px] shrink-0"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <form onSubmit={handleAdd} className="space-y-2 border-t border-border pt-3 shrink-0">
              <p className="text-[11px] font-medium text-text-secondary uppercase tracking-wide">
                Add income
              </p>
              <div>
                <label className="label text-[11px]">Source</label>
                <input
                  className="input py-1.5 text-sm"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  placeholder="e.g. Indiana University"
                  required
                />
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
                  placeholder="Paycheck, stipend…"
                />
              </div>
              <div className="flex justify-end pt-1">
                <Button type="submit" size="sm" disabled={saving}>
                  {saving ? "Adding…" : "Add to total"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

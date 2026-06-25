import { useRef, useState } from "react";
import { getApiErrorMessage, importInvestmentsCsv } from "../../services/api";
import Button from "../shared/Button";

export default function CsvImportCard({ onImported }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);
  const [skippedPreview, setSkippedPreview] = useState(null);
  const dryRunNext = useRef(false);

  const run = async (file, dryRun) => {
    setBusy(true);
    setErr(null);
    setMsg(null);
    setSkippedPreview(null);
    try {
      const data = await importInvestmentsCsv(file, dryRun);
      setMsg(data.message);
      if (data.skipped?.length > 0) {
        setSkippedPreview(data.skipped.slice(0, 15));
      }
      if (!dryRun) {
        onImported?.();
      }
    } catch (e) {
      setErr(getApiErrorMessage(e));
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const onChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    run(file, dryRunNext.current);
    dryRunNext.current = false;
  };

  return (
    <div className="card p-4">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-wide text-text-secondary">
            CSV format
          </p>
          <p className="text-xs text-text-secondary mt-2 leading-relaxed max-w-xl">
            Columns: Date (DD/MM/YYYY), Name (ticker), Buy Price, Quantity, Total
            Cost. Rows with missing prices are skipped. Stock name defaults to
            the ticker.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={onChange}
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={busy}
            onClick={() => {
              dryRunNext.current = false;
              inputRef.current?.click();
            }}
          >
            {busy ? "Working…" : "Import CSV"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={busy}
            onClick={() => {
              dryRunNext.current = true;
              inputRef.current?.click();
            }}
          >
            Preview
          </Button>
        </div>
      </div>

      <p className="text-[11px] text-text-muted mt-3 pt-3 border-t border-border/40">
        Re-importing the same file duplicates rows. Use Preview to check skips
        before writing.
      </p>

      {msg && (
        <p className="text-sm text-accent bg-accent/5 border border-accent/20 rounded-lg px-3 py-2 mt-3">
          {msg}
        </p>
      )}
      {err && <p className="text-sm text-loss mt-3">{err}</p>}
      {skippedPreview && skippedPreview.length > 0 && (
        <div className="text-xs text-text-secondary border border-border/40 rounded-lg p-3 max-h-40 overflow-y-auto mt-3">
          <p className="font-medium text-text-primary mb-2">
            Skipped rows (first 15)
          </p>
          <ul className="space-y-1 font-mono">
            {skippedPreview.map((s, i) => (
              <li key={i}>
                Row {s.row}
                {s.ticker ? ` · ${s.ticker}` : ""}: {s.reason}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

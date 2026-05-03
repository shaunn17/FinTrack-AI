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
    <div className="card p-5 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="font-semibold">Import from CSV</h3>
          <p className="text-xs text-text-secondary mt-1 max-w-xl">
            Columns: <span className="text-text-primary">Date</span> (DD/MM/YYYY),{" "}
            <span className="text-text-primary">Name</span> (ticker),{" "}
            <span className="text-text-primary">Buy Price</span>,{" "}
            <span className="text-text-primary">Quantity</span>,{" "}
            <span className="text-text-primary">Total Cost</span>. Rows with missing
            prices are skipped. <span className="text-text-primary">Stock name</span> is set
            to the ticker (fast import; live portfolio still shows current prices).
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
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
            Preview (dry run)
          </Button>
        </div>
      </div>
      <p className="text-[11px] text-text-muted">
        Importing the same file twice will duplicate rows. Use Preview to see how many lines
        import vs skip before writing to the database.
      </p>
      {msg && (
        <p className="text-sm text-accent bg-accent/5 border border-accent/20 rounded-lg px-3 py-2">
          {msg}
        </p>
      )}
      {err && <p className="text-sm text-loss">{err}</p>}
      {skippedPreview && skippedPreview.length > 0 && (
        <div className="text-xs text-text-secondary border border-border rounded-lg p-3 max-h-40 overflow-y-auto">
          <p className="font-medium text-text-primary mb-2">Skipped rows (first 15)</p>
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

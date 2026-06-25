import { useState } from "react";
import { getApiErrorMessage, searchStock } from "../../services/api";

/**
 * Ticker input with on-blur / on-search lookup. When a valid ticker is found,
 * calls ``onResolved({ticker, name, current_price})``.
 */
export default function StockSearchInput({
  value,
  onChange,
  onResolved,
  compact = false,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const lookup = async () => {
    const t = (value || "").trim().toUpperCase();
    if (!t) return;
    setLoading(true);
    setError(null);
    try {
      const data = await searchStock(t);
      onResolved?.(data);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex gap-2">
        <input
          className={`input uppercase ${compact ? "py-1.5 text-sm" : ""}`}
          value={value || ""}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          onBlur={lookup}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              lookup();
            }
          }}
          placeholder="NVDA"
          maxLength={10}
        />
        <button
          type="button"
          onClick={lookup}
          disabled={loading || !value}
          className={`rounded-lg bg-accent/10 text-accent border border-accent/30 hover:bg-accent/20 disabled:opacity-50 text-xs font-medium ${
            compact ? "px-2 py-1.5" : "px-3 py-2"
          }`}
        >
          {loading ? "…" : "Lookup"}
        </button>
      </div>
      {error && <p className="text-loss text-xs mt-1">{error}</p>}
    </div>
  );
}

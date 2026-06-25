import { useEffect, useMemo, useState } from "react";
import { createTransaction, getApiErrorMessage } from "../../services/api";
import Button from "../shared/Button";
import StockSearchInput from "./StockSearchInput";

const today = () => new Date().toISOString().slice(0, 10);

export default function TransactionForm({ onCreated }) {
  const [date, setDate] = useState(today());
  const [ticker, setTicker] = useState("");
  const [stockName, setStockName] = useState("");
  const [buyPrice, setBuyPrice] = useState("");
  const [askPrice, setAskPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const totalCost = useMemo(() => {
    const bp = parseFloat(buyPrice);
    const q = parseFloat(quantity);
    if (Number.isFinite(bp) && Number.isFinite(q)) return (bp * q).toFixed(2);
    return "";
  }, [buyPrice, quantity]);

  // FUTURE SCOPE: voice-to-text entry
  useEffect(() => {}, []);

  const handleResolved = (info) => {
    if (info?.name) setStockName(info.name);
    if (info?.current_price && !askPrice) {
      setAskPrice(String(info.current_price.toFixed(2)));
    }
    if (info?.current_price && !buyPrice) {
      setBuyPrice(String(info.current_price.toFixed(2)));
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await createTransaction({
        date,
        ticker: ticker.toUpperCase(),
        stock_name: stockName || ticker.toUpperCase(),
        buy_price: parseFloat(buyPrice),
        ask_price: askPrice ? parseFloat(askPrice) : null,
        quantity: parseFloat(quantity),
        total_cost: totalCost ? parseFloat(totalCost) : null,
      });
      setTicker("");
      setStockName("");
      setBuyPrice("");
      setAskPrice("");
      setQuantity("");
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
          <label className="label text-[11px]">Ticker</label>
          <StockSearchInput
            value={ticker}
            onChange={setTicker}
            onResolved={handleResolved}
            compact
          />
        </div>
        <div className="sm:col-span-2 lg:col-span-1">
          <label className="label text-[11px]">Stock name</label>
          <input
            className="input py-1.5 text-sm"
            value={stockName}
            onChange={(e) => setStockName(e.target.value)}
            placeholder="Auto-filled from lookup"
            required
          />
        </div>
        <div>
          <label className="label text-[11px]">Buy price</label>
          <input
            className="input py-1.5 text-sm"
            type="number"
            step="0.0001"
            min="0"
            required
            value={buyPrice}
            onChange={(e) => setBuyPrice(e.target.value)}
            placeholder="0.00"
          />
        </div>
        <div>
          <label className="label text-[11px]">Ask price (optional)</label>
          <input
            className="input py-1.5 text-sm"
            type="number"
            step="0.0001"
            min="0"
            value={askPrice}
            onChange={(e) => setAskPrice(e.target.value)}
            placeholder="0.00"
          />
        </div>
        <div>
          <label className="label text-[11px]">Quantity</label>
          <input
            className="input py-1.5 text-sm"
            type="number"
            step="0.000001"
            min="0"
            required
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="0"
          />
        </div>
        <div>
          <label className="label text-[11px]">Total cost</label>
          <input
            className="input py-1.5 text-sm bg-surface-2 tabular-nums"
            value={totalCost ? `$${totalCost}` : ""}
            readOnly
            placeholder="Auto"
          />
        </div>
      </div>

      <div className="flex justify-end items-center gap-3 mt-3 pt-3 border-t border-border/40">
        <span className="text-[11px] text-text-muted mr-auto hidden sm:inline">
          Tab out of ticker to fetch name and price
        </span>
        {error && <span className="text-loss text-xs mr-auto sm:mr-0">{error}</span>}
        <Button type="submit" size="sm" disabled={saving}>
          {saving ? "Logging…" : "Log transaction"}
        </Button>
      </div>
    </form>
  );
}

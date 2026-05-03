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
  // "Add my investment in NVIDIA for $500 with 2 shares at $250 on April 1st"
  // would auto-populate every field below.
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
    <form onSubmit={submit} className="card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Log Transaction</h3>
        <span className="text-[11px] text-text-muted">
          Tab out of ticker to auto-fetch name & price
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
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
          <label className="label">Ticker</label>
          <StockSearchInput
            value={ticker}
            onChange={setTicker}
            onResolved={handleResolved}
          />
        </div>
        <div className="lg:col-span-2">
          <label className="label">Stock Name</label>
          <input
            className="input"
            value={stockName}
            onChange={(e) => setStockName(e.target.value)}
            placeholder="Auto-filled"
            required
          />
        </div>
        <div>
          <label className="label">Buy Price</label>
          <input
            className="input"
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
          <label className="label">Ask Price</label>
          <input
            className="input"
            type="number"
            step="0.0001"
            min="0"
            value={askPrice}
            onChange={(e) => setAskPrice(e.target.value)}
            placeholder="0.00"
          />
        </div>
        <div>
          <label className="label">Quantity</label>
          <input
            className="input"
            type="number"
            step="0.000001"
            min="0"
            required
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="0.0"
          />
        </div>
        <div>
          <label className="label">Total Cost</label>
          <input
            className="input bg-surface-2"
            value={totalCost ? `$${totalCost}` : ""}
            readOnly
            placeholder="Auto"
          />
        </div>
      </div>

      <div className="flex justify-end items-center gap-3">
        {error && <span className="text-loss text-xs">{error}</span>}
        <Button type="submit" disabled={saving}>
          {saving ? "Logging…" : "Log Transaction"}
        </Button>
      </div>
    </form>
  );
}

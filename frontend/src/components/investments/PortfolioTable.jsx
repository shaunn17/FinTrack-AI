import { formatMoney, formatPercent } from "../../styles/theme";

function formatQuotesFetchedAt(iso) {
  if (!iso) return null;
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleString(undefined, {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return null;
  }
}

function LivePriceCell({ price }) {
  if (price == null) {
    return (
      <span className="text-text-muted" title="Live quote unavailable">
        —
      </span>
    );
  }
  return <span className="tabular-nums">{formatMoney(price)}</span>;
}

function PositionRow({ p }) {
  const gainPositive = (p.net_gain ?? 0) >= 0;
  const gainTone = gainPositive ? "text-gain" : "text-loss";
  const hasLive = p.current_price != null;

  return (
    <tr className="border-b border-border/40 last:border-b-0">
      <td className="px-4 py-3">
        <p className="font-semibold text-text-primary">{p.ticker}</p>
        <p className="text-xs text-text-secondary truncate max-w-[10rem] sm:max-w-none">
          {p.stock_name}
        </p>
      </td>
      <td className="px-4 py-3 text-right tabular-nums text-sm">
        {Number(p.total_shares).toLocaleString(undefined, {
          maximumFractionDigits: 6,
        })}
      </td>
      <td className="px-4 py-3 text-right tabular-nums text-sm text-text-secondary hidden md:table-cell">
        {formatMoney(p.avg_buy_price)}
      </td>
      <td className="px-4 py-3 text-right tabular-nums text-sm hidden lg:table-cell">
        {formatMoney(p.total_cost)}
      </td>
      <td className="px-4 py-3 text-right text-sm">
        <LivePriceCell price={p.current_price} />
        {!hasLive && (
          <p className="text-[10px] text-text-muted mt-0.5">No quote</p>
        )}
      </td>
      <td className="px-4 py-3 text-right tabular-nums text-sm font-medium">
        {p.current_value != null ? formatMoney(p.current_value) : "—"}
      </td>
      <td className={`px-4 py-3 text-right tabular-nums text-sm font-medium ${gainTone}`}>
        {p.net_gain != null
          ? formatMoney(p.net_gain, { withSign: true })
          : "—"}
      </td>
      <td className={`px-4 py-3 text-right tabular-nums text-sm font-medium ${gainTone} hidden sm:table-cell`}>
        {p.return_pct != null ? formatPercent(p.return_pct) : "—"}
      </td>
    </tr>
  );
}

function PositionCard({ p }) {
  const gainPositive = (p.net_gain ?? 0) >= 0;
  const gainTone = gainPositive ? "text-gain" : "text-loss";

  return (
    <li className="p-4 border-b border-border/40 last:border-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold">{p.ticker}</p>
          <p className="text-xs text-text-secondary truncate">{p.stock_name}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="font-medium tabular-nums">
            {p.current_value != null ? formatMoney(p.current_value) : "—"}
          </p>
          <p className={`text-xs tabular-nums ${gainTone}`}>
            {p.net_gain != null
              ? formatMoney(p.net_gain, { withSign: true })
              : "—"}
            {p.return_pct != null && ` · ${formatPercent(p.return_pct)}`}
          </p>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-text-muted">
        <span>
          {Number(p.total_shares).toLocaleString(undefined, {
            maximumFractionDigits: 6,
          })}{" "}
          sh
        </span>
        <span>Avg {formatMoney(p.avg_buy_price)}</span>
        <span>
          Live{" "}
          {p.current_price != null ? formatMoney(p.current_price) : "—"}
        </span>
      </div>
    </li>
  );
}

export default function PortfolioTable({ positions, quotesFetchedAt, loading = false }) {
  const quotesLabel = formatQuotesFetchedAt(quotesFetchedAt);
  const count = positions?.length ?? 0;

  if (loading) {
    return (
      <div className="card p-5">
        <p className="text-sm text-text-muted">Loading holdings…</p>
      </div>
    );
  }

  if (!positions || count === 0) {
    return (
      <div className="card p-8 text-center">
        <p className="text-sm text-text-secondary">
          No positions yet. Log a transaction or import a CSV to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="px-4 py-3 border-b border-border/40 flex items-center justify-between gap-2">
        <span className="text-xs text-text-muted">
          {count} position{count === 1 ? "" : "s"}
        </span>
        {quotesLabel && (
          <span className="text-[11px] text-text-muted">
            Updated {quotesLabel}
          </span>
        )}
      </div>

      <ul className="lg:hidden">
        {positions.map((p) => (
          <PositionCard key={p.ticker} p={p} />
        ))}
      </ul>

      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] uppercase tracking-wide text-text-secondary border-b border-border/40">
              <th className="text-left px-4 py-2.5 font-medium">Ticker</th>
              <th className="text-right px-4 py-2.5 font-medium">Shares</th>
              <th className="text-right px-4 py-2.5 font-medium hidden md:table-cell">
                Avg buy
              </th>
              <th className="text-right px-4 py-2.5 font-medium hidden lg:table-cell">
                Cost basis
              </th>
              <th className="text-right px-4 py-2.5 font-medium">Live</th>
              <th className="text-right px-4 py-2.5 font-medium">Value</th>
              <th className="text-right px-4 py-2.5 font-medium">Gain</th>
              <th className="text-right px-4 py-2.5 font-medium hidden sm:table-cell">
                Return
              </th>
            </tr>
          </thead>
          <tbody>
            {positions.map((p) => (
              <PositionRow key={p.ticker} p={p} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

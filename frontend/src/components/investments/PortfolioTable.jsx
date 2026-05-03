import { formatMoney, formatPercent } from "../../styles/theme";

export default function PortfolioTable({ positions }) {
  if (!positions || positions.length === 0) {
    return (
      <div className="card p-8 text-center text-text-secondary">
        No positions yet. Log your first transaction to see your portfolio.
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-3 border-b border-border">
        <h3 className="font-semibold">Portfolio</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-text-secondary text-xs uppercase tracking-wide">
            <tr className="border-b border-border">
              <th className="text-left px-5 py-2.5 font-medium">Ticker</th>
              <th className="text-left px-5 py-2.5 font-medium">Name</th>
              <th className="text-right px-5 py-2.5 font-medium">Shares</th>
              <th className="text-right px-5 py-2.5 font-medium">Avg Buy</th>
              <th className="text-right px-5 py-2.5 font-medium">Total Cost</th>
              <th className="text-right px-5 py-2.5 font-medium">Live Price</th>
              <th className="text-right px-5 py-2.5 font-medium">Current Value</th>
              <th className="text-right px-5 py-2.5 font-medium">Net Gain</th>
              <th className="text-right px-5 py-2.5 font-medium">Return</th>
            </tr>
          </thead>
          <tbody className="table-row-alt">
            {positions.map((p) => {
              const gainPositive = (p.net_gain ?? 0) >= 0;
              const gainColor = gainPositive ? "text-gain" : "text-loss";
              return (
                <tr
                  key={p.ticker}
                  className="border-b border-border/50 last:border-b-0"
                >
                  <td className="px-5 py-3 font-semibold">{p.ticker}</td>
                  <td className="px-5 py-3 text-text-secondary">
                    {p.stock_name}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {Number(p.total_shares).toLocaleString(undefined, {
                      maximumFractionDigits: 6,
                    })}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {formatMoney(p.avg_buy_price)}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {formatMoney(p.total_cost)}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {p.current_price != null ? formatMoney(p.current_price) : "—"}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {p.current_value != null ? formatMoney(p.current_value) : "—"}
                  </td>
                  <td className={`px-5 py-3 text-right font-medium ${gainColor}`}>
                    {p.net_gain != null
                      ? `${gainPositive ? "+" : ""}${formatMoney(p.net_gain)}`
                      : "—"}
                  </td>
                  <td className={`px-5 py-3 text-right font-medium ${gainColor}`}>
                    {p.return_pct != null ? formatPercent(p.return_pct) : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

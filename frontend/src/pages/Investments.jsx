import { useMemo } from "react";
import CsvImportCard from "../components/investments/CsvImportCard";
import PortfolioTable from "../components/investments/PortfolioTable";
import TransactionForm from "../components/investments/TransactionForm";
import TransactionsTable from "../components/investments/TransactionsTable";
import Navbar from "../components/layout/Navbar";
import Button from "../components/shared/Button";
import { useInvestments } from "../hooks/useInvestments";
import { formatMoney, formatPercent } from "../styles/theme";

export default function Investments() {
  const { portfolio, transactions, loading, error, refresh } = useInvestments();

  const txInvested = transactions.reduce(
    (s, t) => s + Number(t.total_cost || 0),
    0
  );
  const totalInvested = portfolio
    ? Number(portfolio.total_invested)
    : txInvested;
  const positionCount = portfolio?.positions?.length ?? 0;
  const liveTotalsReady =
    Boolean(portfolio) &&
    (positionCount === 0 || portfolio.current_value != null);
  const currentValue =
    portfolio?.current_value != null ? Number(portfolio.current_value) : null;
  const totalGain =
    portfolio?.total_gain != null ? Number(portfolio.total_gain) : null;
  const overallReturn =
    portfolio?.overall_return_pct != null
      ? Number(portfolio.overall_return_pct)
      : null;
  const positiveGain = totalGain != null && totalGain >= 0;
  const portfolioUnavailable = !portfolio && transactions.length > 0;
  const missingLiveHint =
    portfolio?.unpriced_tickers?.length > 0
      ? `No live quote for: ${portfolio.unpriced_tickers.join(", ")}. Current value is live price × shares for all holdings — totals appear when every ticker prices.`
      : portfolio && !liveTotalsReady && positionCount > 0
        ? "Live market value unavailable for one or more holdings."
        : null;

  const livePriceByTicker = useMemo(() => {
    const m = {};
    for (const p of portfolio?.positions ?? []) {
      if (p?.ticker != null) {
        m[String(p.ticker).toUpperCase()] = p.current_price ?? null;
      }
    }
    return m;
  }, [portfolio?.positions]);

  return (
    <>
      <Navbar
        title="Investment Portfolio"
        subtitle="Log transactions, track live prices, and watch your gains."
        right={
          <Button variant="secondary" size="sm" onClick={refresh} disabled={loading}>
            {loading ? "Refreshing…" : "Refresh Prices"}
          </Button>
        }
      />

      {error && (
        <div className="card p-4 mb-4 text-loss text-sm border border-loss/30">
          {error}
        </div>
      )}

      {portfolioUnavailable && (
        <p className="text-xs text-text-secondary mb-2 -mt-2">
          Totals below use your transaction cost basis. Live value / gain needs the portfolio
          request to succeed (check the red message above or tap Refresh).
        </p>
      )}

      {missingLiveHint && (
        <p className="text-xs text-amber-200/90 mb-2 -mt-2">{missingLiveHint}</p>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat label="Total Invested" value={formatMoney(totalInvested)} />
        <Stat
          label="Current Value"
          value={
            !portfolio
              ? portfolioUnavailable
                ? "—"
                : formatMoney(0)
              : liveTotalsReady
                ? formatMoney(currentValue ?? 0)
                : "—"
          }
        />
        <Stat
          label="Total Gain / Loss"
          value={
            !portfolio
              ? portfolioUnavailable
                ? "—"
                : `${positiveGain ? "+" : ""}${formatMoney(0)}`
              : totalGain != null
                ? `${positiveGain ? "+" : ""}${formatMoney(totalGain)}`
                : "—"
          }
          tone={
            !portfolio || totalGain == null
              ? "neutral"
              : positiveGain
                ? "gain"
                : "loss"
          }
        />
        <Stat
          label="Overall Return"
          value={
            !portfolio
              ? portfolioUnavailable
                ? "—"
                : formatPercent(0)
              : overallReturn != null
                ? formatPercent(overallReturn)
                : "—"
          }
          tone={
            !portfolio || overallReturn == null
              ? "neutral"
              : overallReturn >= 0
                ? "gain"
                : "loss"
          }
        />
      </div>

      <div className="space-y-4">
        <CsvImportCard onImported={refresh} />
        <TransactionForm onCreated={refresh} />
        <TransactionsTable
          transactions={transactions}
          livePriceByTicker={livePriceByTicker}
          onChanged={refresh}
        />
        <PortfolioTable
          positions={portfolio?.positions || []}
          quotesFetchedAt={portfolio?.quotes_fetched_at}
        />
      </div>
    </>
  );
}

function Stat({ label, value, tone = "neutral" }) {
  const toneClass =
    tone === "gain"
      ? "text-gain"
      : tone === "loss"
      ? "text-loss"
      : "text-text-primary";
  return (
    <div className="card p-5">
      <p className="text-xs uppercase tracking-wide text-text-secondary">
        {label}
      </p>
      <p className={`text-2xl sm:text-3xl font-semibold mt-1 ${toneClass}`}>
        {value}
      </p>
    </div>
  );
}

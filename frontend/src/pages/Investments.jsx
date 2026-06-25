import { useMemo } from "react";
import CsvImportCard from "../components/investments/CsvImportCard";
import PortfolioTable from "../components/investments/PortfolioTable";
import TransactionForm from "../components/investments/TransactionForm";
import TransactionsTable from "../components/investments/TransactionsTable";
import StatCard from "../components/dashboard/StatCard";
import Navbar from "../components/layout/Navbar";
import Button from "../components/shared/Button";
import { useInvestments } from "../hooks/useInvestments";
import { formatMoney, formatPercent } from "../styles/theme";

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

export default function Investments() {
  const { portfolio, transactions, loading, refreshing, error, refresh } =
    useInvestments();

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
  const portfolioUnavailable = !portfolio && transactions.length > 0;
  const quotesLabel = formatQuotesFetchedAt(portfolio?.quotes_fetched_at);

  const unpricedHint =
    portfolio?.unpriced_tickers?.length > 0
      ? `No live price for: ${portfolio.unpriced_tickers.join(", ")}`
      : portfolio && !liveTotalsReady && positionCount > 0
        ? "Live market value unavailable for one or more holdings"
        : null;

  const costBasisHint =
    portfolioUnavailable && !loading
      ? "Totals use transaction cost basis until portfolio loads"
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

  const holdingsLabel =
    positionCount > 0
      ? `${positionCount} holding${positionCount === 1 ? "" : "s"}`
      : "No holdings";

  const statsLoading = loading;

  return (
    <>
      <Navbar
        title="Investments"
        subtitle="All-time portfolio with live market prices"
        right={
          <Button
            variant="primary"
            size="sm"
            onClick={refresh}
            disabled={loading || refreshing}
          >
            {refreshing ? "Refreshing…" : "Refresh prices"}
          </Button>
        }
      />

      {error && (
        <div className="card p-4 mb-4 text-loss text-sm border-loss/30">
          {error}
        </div>
      )}

      {(quotesLabel || unpricedHint || costBasisHint) && (
        <div className="mb-4 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-text-muted">
          {quotesLabel && <span>Live prices as of {quotesLabel}</span>}
          {unpricedHint && <span>{unpricedHint}</span>}
          {costBasisHint && <span>{costBasisHint}</span>}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        <StatCard
          label="Total Invested"
          value={totalInvested > 0 ? formatMoney(totalInvested) : "—"}
          loading={statsLoading}
        />
        <StatCard
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
          loading={statsLoading}
        />
        <StatCard
          label="Total Gain"
          value={
            !portfolio
              ? portfolioUnavailable
                ? "—"
                : formatMoney(0, { withSign: true })
              : totalGain != null
                ? formatMoney(totalGain, { withSign: true })
                : "—"
          }
          tone={
            !portfolio || totalGain == null
              ? "neutral"
              : totalGain >= 0
                ? "gain"
                : "loss"
          }
          loading={statsLoading}
        />
        <StatCard
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
          loading={statsLoading}
        />
        <StatCard
          label="Holdings"
          value={holdingsLabel}
          hint={positionCount > 0 ? "Open positions" : undefined}
          loading={statsLoading}
        />
      </div>

      <div className="space-y-8">
        <section className="space-y-4">
          <SectionHeading
            title="Holdings"
            description="Positions aggregated from your buy transactions."
          />
          <PortfolioTable
            positions={portfolio?.positions || []}
            quotesFetchedAt={portfolio?.quotes_fetched_at}
            loading={loading}
          />
        </section>

        <section className="space-y-4">
          <SectionHeading
            title="Transactions"
            description="Log a buy or review your full history."
          />
          <TransactionForm onCreated={refresh} />
          <TransactionsTable
            transactions={transactions}
            livePriceByTicker={livePriceByTicker}
            loading={loading}
            onChanged={refresh}
          />
        </section>

        <section className="space-y-4">
          <SectionHeading
            title="Import"
            description="Bulk load transactions from a CSV export."
          />
          <CsvImportCard onImported={refresh} />
        </section>
      </div>
    </>
  );
}

function SectionHeading({ title, description }) {
  return (
    <div>
      <h2 className="text-base font-semibold text-text-primary">{title}</h2>
      {description && (
        <p className="text-xs text-text-secondary mt-0.5">{description}</p>
      )}
    </div>
  );
}

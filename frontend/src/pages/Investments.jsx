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
  const currentValue = Number(portfolio?.current_value || 0);
  const totalGain = Number(portfolio?.total_gain || 0);
  const overallReturn = Number(portfolio?.overall_return_pct || 0);
  const positive = totalGain >= 0;
  const portfolioUnavailable = !portfolio && transactions.length > 0;

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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat label="Total Invested" value={formatMoney(totalInvested)} />
        <Stat
          label="Current Value"
          value={
            portfolio ? formatMoney(currentValue) : portfolioUnavailable ? "—" : formatMoney(0)
          }
        />
        <Stat
          label="Total Gain / Loss"
          value={
            portfolio
              ? `${positive ? "+" : ""}${formatMoney(totalGain)}`
              : portfolioUnavailable
              ? "—"
              : `${positive ? "+" : ""}${formatMoney(0)}`
          }
          tone={portfolio ? (positive ? "gain" : "loss") : "neutral"}
        />
        <Stat
          label="Overall Return"
          value={portfolio ? formatPercent(overallReturn) : portfolioUnavailable ? "—" : formatPercent(0)}
          tone={portfolio ? (positive ? "gain" : "loss") : "neutral"}
        />
      </div>

      <div className="space-y-4">
        <CsvImportCard onImported={refresh} />
        <TransactionForm onCreated={refresh} />
        <TransactionsTable transactions={transactions} onChanged={refresh} />
        <PortfolioTable positions={portfolio?.positions || []} />
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

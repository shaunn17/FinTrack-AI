import CsvImportCard from "../components/investments/CsvImportCard";
import PortfolioTable from "../components/investments/PortfolioTable";
import TransactionForm from "../components/investments/TransactionForm";
import Navbar from "../components/layout/Navbar";
import Button from "../components/shared/Button";
import { useInvestments } from "../hooks/useInvestments";
import { formatMoney, formatPercent } from "../styles/theme";

export default function Investments() {
  const { portfolio, loading, refresh } = useInvestments();

  const totalInvested = Number(portfolio?.total_invested || 0);
  const currentValue = Number(portfolio?.current_value || 0);
  const totalGain = Number(portfolio?.total_gain || 0);
  const overallReturn = Number(portfolio?.overall_return_pct || 0);
  const positive = totalGain >= 0;

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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat label="Total Invested" value={formatMoney(totalInvested)} />
        <Stat label="Current Value" value={formatMoney(currentValue)} />
        <Stat
          label="Total Gain / Loss"
          value={`${positive ? "+" : ""}${formatMoney(totalGain)}`}
          tone={positive ? "gain" : "loss"}
        />
        <Stat
          label="Overall Return"
          value={formatPercent(overallReturn)}
          tone={positive ? "gain" : "loss"}
        />
      </div>

      <div className="space-y-4">
        <CsvImportCard onImported={refresh} />
        <TransactionForm onCreated={refresh} />
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

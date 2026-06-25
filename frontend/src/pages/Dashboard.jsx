import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ActivityFeed from "../components/dashboard/ActivityFeed";
import MonthSnapshotCard from "../components/dashboard/MonthSnapshotCard";
import SpendingChartSection from "../components/dashboard/SpendingChartSection";
import StatCard from "../components/dashboard/StatCard";
import Navbar from "../components/layout/Navbar";
import EmptyMonthState from "../components/shared/EmptyMonthState";
import {
  canComparePrevMonth,
  hasMonthBudgetData,
  prettyMonth,
  prevMonth,
  useMonthYear,
} from "../context/MonthYearContext";
import {
  getApiErrorMessage,
  getBudgetCaps,
  getBudgetSummary,
  getExpenses,
  getIncome,
  getInsight,
  getPortfolio,
  getTransactions,
} from "../services/api";
import { formatMoney, formatPercent } from "../styles/theme";
import {
  formatMomDelta,
  getGreeting,
  percentIncomeSpent,
} from "../utils/dashboardMetrics";

export default function Dashboard() {
  const { month } = useMonthYear();
  const [income, setIncome] = useState(null);
  const [summary, setSummary] = useState(null);
  const [prevSummary, setPrevSummary] = useState(null);
  const [caps, setCaps] = useState([]);
  const [insight, setInsight] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [portfolio, setPortfolio] = useState(null);
  const [error, setError] = useState(null);
  const [budgetLoading, setBudgetLoading] = useState(true);
  const [portfolioLoading, setPortfolioLoading] = useState(true);

  const comparePrev = canComparePrevMonth(month);

  useEffect(() => {
    let cancelled = false;
    const errs = [];

    (async () => {
      setError(null);
      setBudgetLoading(true);
      setPortfolioLoading(true);

      try {
        const fetches = [
          getIncome(month),
          getBudgetSummary(month),
          getExpenses(month),
          getBudgetCaps(month),
          getInsight(month),
        ];
        if (comparePrev) {
          fetches.push(getBudgetSummary(prevMonth(month)));
        }
        const results = await Promise.all(fetches);
        if (!cancelled) {
          setIncome(results[0]);
          setSummary(results[1]);
          setExpenses(results[2]);
          setCaps(results[3]);
          setInsight(results[4]);
          setPrevSummary(comparePrev ? results[5] : null);
        }
      } catch (err) {
        if (!cancelled) errs.push(`Budget: ${getApiErrorMessage(err)}`);
      } finally {
        if (!cancelled) setBudgetLoading(false);
      }

      try {
        const tx = await getTransactions();
        if (!cancelled) setTransactions(tx);
      } catch (err) {
        if (!cancelled) errs.push(`Transactions: ${getApiErrorMessage(err)}`);
      }

      try {
        const pf = await getPortfolio();
        if (!cancelled) setPortfolio(pf);
      } catch (err) {
        if (!cancelled) {
          errs.push(`Portfolio (live prices): ${getApiErrorMessage(err)}`);
          setPortfolio(null);
        }
      } finally {
        if (!cancelled) setPortfolioLoading(false);
      }

      if (!cancelled) setError(errs.length > 0 ? errs.join(" · ") : null);
    })();

    return () => {
      cancelled = true;
    };
  }, [month, comparePrev]);

  const monthlyIncome = Number(income?.total_amount ?? income?.amount ?? 0);
  const totalSpent = Number(summary?.total_spent || 0);
  const savings = Number(summary?.savings || 0);
  const savingsRate = Number(summary?.savings_rate ?? 0);
  const pctSpent = percentIncomeSpent(monthlyIncome, totalSpent);

  const txCostBasis = transactions.reduce(
    (s, t) => s + Number(t.total_cost || 0),
    0
  );
  const invPositionCount = portfolio?.positions?.length ?? 0;
  const portfolioLiveValue =
    portfolio?.current_value != null ? Number(portfolio.current_value) : null;
  const portfolioReturn =
    portfolio?.overall_return_pct != null
      ? Number(portfolio.overall_return_pct)
      : null;
  const portfolioStatsPending = portfolioLoading && !portfolio;

  const hasBudgetData = hasMonthBudgetData({ income, expenses, summary });

  const spentDelta =
    comparePrev && prevSummary
      ? formatMomDelta(totalSpent, Number(prevSummary.total_spent || 0), {
          invertTone: true,
        })
      : null;
  const savingsDelta =
    comparePrev && prevSummary
      ? formatMomDelta(savings, Number(prevSummary.savings || 0))
      : null;

  return (
    <>
      <Navbar
        title={getGreeting()}
        subtitle={prettyMonth(month)}
      />

      {!budgetLoading && !hasBudgetData && (
        <EmptyMonthState month={month} />
      )}

      {error && (
        <div className="card p-4 mb-4 text-loss text-sm border-loss/30">
          {error}
        </div>
      )}

      <PortfolioCallout
        portfolio={portfolio}
        portfolioStatsPending={portfolioStatsPending}
        portfolioLiveValue={portfolioLiveValue}
        portfolioReturn={portfolioReturn}
        invPositionCount={invPositionCount}
        txCostBasis={txCostBasis}
      />

      {hasBudgetData && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              label="Income"
              value={formatMoney(monthlyIncome)}
              loading={budgetLoading}
            />
            <StatCard
              label="Spent"
              value={formatMoney(totalSpent)}
              delta={spentDelta}
              loading={budgetLoading}
            />
            <StatCard
              label="Savings"
              value={formatMoney(savings)}
              tone={savings >= 0 ? "gain" : "loss"}
              delta={savingsDelta}
              loading={budgetLoading}
            />
            <StatCard
              label="Savings Rate"
              value={`${savingsRate.toFixed(1)}%`}
              hint={
                pctSpent != null
                  ? `${pctSpent.toFixed(0)}% of income spent`
                  : undefined
              }
              tone={
                savingsRate >= 20
                  ? "gain"
                  : savingsRate >= 0
                    ? "neutral"
                    : "loss"
              }
              loading={budgetLoading}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4 items-stretch">
            <div className="lg:col-span-2 flex">
              <SpendingChartSection
                summary={summary}
                caps={caps}
                loading={budgetLoading}
              />
            </div>
            <MonthSnapshotCard
              summary={summary}
              caps={caps}
              income={income}
              insight={insight}
              loading={budgetLoading}
            />
          </div>

          <ActivityFeed
            expenses={expenses}
            transactions={transactions}
            loading={budgetLoading}
          />
        </>
      )}
    </>
  );
}

function PortfolioCallout({
  portfolio,
  portfolioStatsPending,
  portfolioLiveValue,
  portfolioReturn,
  invPositionCount,
  txCostBasis,
}) {
  const totalInvested = portfolio
    ? Number(portfolio.total_invested ?? 0)
    : txCostBasis;
  const totalGain =
    portfolio?.total_gain != null ? Number(portfolio.total_gain) : null;

  const valueDisplay = portfolioStatsPending
    ? "…"
    : portfolio
      ? portfolioLiveValue != null
        ? formatMoney(portfolioLiveValue)
        : invPositionCount > 0
          ? "—"
          : formatMoney(0)
      : txCostBasis > 0
        ? formatMoney(txCostBasis)
        : formatMoney(0);

  const returnDisplay =
    portfolioStatsPending
      ? "…"
      : portfolio && portfolioReturn != null
        ? formatPercent(portfolioReturn)
        : "—";

  const returnTone =
    portfolio && portfolioReturn != null
      ? portfolioReturn >= 0
        ? "text-gain"
        : "text-loss"
      : "text-text-secondary";

  const investedDisplay = portfolioStatsPending
    ? "…"
    : totalInvested > 0
      ? formatMoney(totalInvested)
      : "—";

  const gainDisplay = portfolioStatsPending
    ? "…"
    : totalGain != null
      ? formatMoney(totalGain, { withSign: true })
      : "—";

  const gainTone =
    totalGain != null
      ? totalGain >= 0
        ? "text-gain"
        : "text-loss"
      : "text-text-secondary";

  const positionsDisplay = portfolioStatsPending
    ? "…"
    : invPositionCount > 0
      ? `${invPositionCount} position${invPositionCount === 1 ? "" : "s"}`
      : "No positions";

  const quotesLabel = formatQuotesFetchedAt(portfolio?.quotes_fetched_at);

  const hint =
    portfolio && portfolioLiveValue == null && invPositionCount > 0
      ? portfolio.unpriced_tickers?.length
        ? `No live price for: ${portfolio.unpriced_tickers.join(", ")}`
        : "Live market value unavailable"
      : !portfolio && !portfolioStatsPending && txCostBasis > 0
        ? "Cost basis (portfolio request failed or timed out)"
        : null;

  return (
    <div className="card px-4 py-3 mb-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-4 gap-y-2 flex-1 text-sm">
          <PortfolioStat label="Value" value={valueDisplay} prominent />
          <PortfolioStat
            label="Return"
            value={returnDisplay}
            tone={returnTone}
          />
          <PortfolioStat label="Invested" value={investedDisplay} />
          <PortfolioStat label="Gain" value={gainDisplay} tone={gainTone} />
          <PortfolioStat label="Holdings" value={positionsDisplay} />
        </div>
        <Link
          to="/investments"
          className="text-xs text-accent hover:underline shrink-0 sm:ml-4"
        >
          View investments →
        </Link>
      </div>
      {(hint || quotesLabel) && (
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-text-muted">
          {quotesLabel && <span>Live prices as of {quotesLabel}</span>}
          {hint && <span>{hint}</span>}
        </div>
      )}
    </div>
  );
}

function PortfolioStat({ label, value, prominent = false, tone = "text-text-primary" }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] uppercase tracking-wide text-text-secondary mb-0.5">
        {label}
      </p>
      <p
        className={`tabular-nums truncate ${
          prominent ? "font-semibold text-base" : "font-medium text-sm"
        } ${tone}`}
      >
        {value}
      </p>
    </div>
  );
}

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

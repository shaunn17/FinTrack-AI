import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import HealthScoreCard from "../components/insights/HealthScoreCard";
import Navbar from "../components/layout/Navbar";
import Badge from "../components/shared/Badge";
import Chart from "../components/shared/Chart";
import EmptyMonthState from "../components/shared/EmptyMonthState";
import {
  hasMonthBudgetData,
  prettyMonth,
  useMonthYear,
} from "../context/MonthYearContext";
import {
  getApiErrorMessage,
  getBudgetSummary,
  getExpenses,
  getHealthScore,
  getIncome,
  getPortfolio,
  getTransactions,
} from "../services/api";
import { formatDate, formatMoney, formatPercent } from "../styles/theme";

export default function Dashboard() {
  const { month } = useMonthYear();
  const [income, setIncome] = useState(null);
  const [summary, setSummary] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [portfolio, setPortfolio] = useState(null);
  const [score, setScore] = useState(null);
  const [error, setError] = useState(null);
  const [portfolioLoading, setPortfolioLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const errs = [];

    (async () => {
      setError(null);
      setPortfolioLoading(true);

      try {
        const [inc, sum, exp] = await Promise.all([
          getIncome(month),
          getBudgetSummary(month),
          getExpenses(month),
        ]);
        if (!cancelled) {
          setIncome(inc);
          setSummary(sum);
          setExpenses(exp);
        }
      } catch (err) {
        if (!cancelled) errs.push(`Budget: ${getApiErrorMessage(err)}`);
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

      try {
        const sc = await getHealthScore(month);
        if (!cancelled) setScore(sc);
      } catch (err) {
        if (!cancelled) errs.push(`Health score: ${getApiErrorMessage(err)}`);
      }

      if (!cancelled) setError(errs.length > 0 ? errs.join(" · ") : null);
    })();

    return () => {
      cancelled = true;
    };
  }, [month]);

  const monthlyIncome = Number(income?.total_amount ?? income?.amount ?? 0);
  const totalSpent = Number(summary?.total_spent || 0);
  const savings = Number(summary?.savings || 0);
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

  const chartData = (summary?.category_breakdown || []).map((c) => ({
    name: c.category,
    value: Number(c.total),
  }));

  const recentExpenses = expenses.slice(0, 5);
  const recentTransactions = transactions.slice(0, 5);
  const hasBudgetData = hasMonthBudgetData({ income, expenses, summary });

  return (
    <>
      <Navbar
        title="Dashboard"
        subtitle={`Overview for ${prettyMonth(month)}`}
      />

      {!hasBudgetData && <EmptyMonthState month={month} />}

      {error && (
        <div className="card p-4 mb-4 text-loss text-sm border-loss/30">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <Stat label="Monthly Income" value={formatMoney(monthlyIncome)} />
        <Stat label="Total Spent" value={formatMoney(totalSpent)} />
        <Stat
          label="Savings"
          value={formatMoney(savings)}
          tone={savings >= 0 ? "gain" : "loss"}
        />
        <Stat
          label="Portfolio Value"
          value={
            portfolioStatsPending
              ? "…"
              : portfolio
                ? portfolioLiveValue != null
                  ? formatMoney(portfolioLiveValue)
                  : invPositionCount > 0
                    ? "—"
                    : formatMoney(0)
                : txCostBasis > 0
                  ? formatMoney(txCostBasis)
                  : formatMoney(0)
          }
          hint={
            portfolio && portfolioLiveValue == null && invPositionCount > 0
              ? portfolio.unpriced_tickers?.length
                ? `No live price for: ${portfolio.unpriced_tickers.join(", ")}`
                : "Live market value unavailable"
              : !portfolio && !portfolioStatsPending && txCostBasis > 0
                ? "Cost basis (portfolio request failed or timed out)"
                : undefined
          }
        />
        <Stat
          label="Portfolio Return"
          value={
            portfolioStatsPending
              ? "…"
              : portfolio && portfolioReturn != null
                ? formatPercent(portfolioReturn)
                : "—"
          }
          tone={
            portfolio && portfolioReturn != null
              ? portfolioReturn >= 0
                ? "gain"
                : "loss"
              : "neutral"
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Spending by Category</h3>
            <Link
              to="/budget"
              className="text-xs text-accent hover:underline"
            >
              View Budget →
            </Link>
          </div>
          <Chart type="donut" data={chartData} height={280} />
        </div>
        <div className="lg:col-span-1">
          <HealthScoreCard data={score} size={140} compact />
          {!score?.score && (
            <p className="text-[11px] text-text-muted mt-2 text-center">
              Visit{" "}
              <Link to="/insights" className="text-accent hover:underline">
                Insights
              </Link>{" "}
              to generate a score for this month.
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Recent Expenses</h3>
            <Link to="/budget" className="text-xs text-accent hover:underline">
              View All →
            </Link>
          </div>
          {recentExpenses.length === 0 ? (
            <p className="text-sm text-text-secondary">No expenses this month.</p>
          ) : (
            <ul className="divide-y divide-border/60">
              {recentExpenses.map((e) => (
                <li key={e.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge category={e.category} />
                      <span className="text-xs text-text-secondary">
                        {formatDate(e.date)}
                      </span>
                    </div>
                    {e.note && (
                      <p className="text-sm text-text-secondary truncate mt-0.5">
                        {e.note}
                      </p>
                    )}
                  </div>
                  <span className="font-medium tabular-nums">
                    {formatMoney(e.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Recent Transactions</h3>
            <Link to="/investments" className="text-xs text-accent hover:underline">
              View All →
            </Link>
          </div>
          {recentTransactions.length === 0 ? (
            <p className="text-sm text-text-secondary">No transactions logged.</p>
          ) : (
            <ul className="divide-y divide-border/60">
              {recentTransactions.map((t) => (
                <li key={t.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{t.ticker}</span>
                      <span className="text-xs text-text-secondary">
                        {formatDate(t.date)}
                      </span>
                    </div>
                    <p className="text-sm text-text-secondary truncate mt-0.5">
                      {Number(t.quantity)} sh @ {formatMoney(t.buy_price)}
                    </p>
                  </div>
                  <span className="font-medium tabular-nums">
                    {formatMoney(t.total_cost)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}

function Stat({ label, value, tone = "neutral", hint }) {
  const toneClass =
    tone === "gain"
      ? "text-gain"
      : tone === "loss"
      ? "text-loss"
      : "text-text-primary";
  return (
    <div className="card p-4">
      <p className="text-[11px] uppercase tracking-wide text-text-secondary">
        {label}
      </p>
      <p className={`text-xl sm:text-2xl font-semibold mt-1 ${toneClass}`}>
        {value}
      </p>
      {hint && (
        <p className="text-[10px] text-text-muted mt-1 leading-snug">{hint}</p>
      )}
    </div>
  );
}

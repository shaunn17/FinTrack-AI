import { useEffect, useMemo, useState } from "react";
import HealthScoreCard from "../components/insights/HealthScoreCard";
import InsightCard from "../components/insights/InsightCard";
import Navbar from "../components/layout/Navbar";
import Button from "../components/shared/Button";
import Chart from "../components/shared/Chart";
import EmptyMonthState from "../components/shared/EmptyMonthState";
import {
  hasMonthBudgetData,
  prettyMonth,
  useMonthYear,
} from "../context/MonthYearContext";
import {
  generateHealthScore,
  generateInsight,
  getApiErrorMessage,
  getBudgetSummary,
  getExpenses,
  getHealthScore,
  getIncome,
  getInsight,
} from "../services/api";
import { formatMoney } from "../styles/theme";

export default function Insights() {
  const { month } = useMonthYear();
  const [insight, setInsight] = useState(null);
  const [score, setScore] = useState(null);
  const [income, setIncome] = useState(null);
  const [summary, setSummary] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loadingRegenerate, setLoadingRegenerate] = useState(false);
  const [loadingBudget, setLoadingBudget] = useState(false);
  const [hasBudgetData, setHasBudgetData] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setLoadingBudget(true);
    Promise.all([
      getInsight(month),
      getHealthScore(month),
      getIncome(month),
      getExpenses(month),
      getBudgetSummary(month),
    ])
      .then(([ins, sc, inc, exp, sum]) => {
        if (cancelled) return;
        setInsight(ins);
        setScore(sc);
        setIncome(inc);
        setExpenses(exp);
        setSummary(sum);
        setHasBudgetData(hasMonthBudgetData({ income: inc, expenses: exp, summary: sum }));
      })
      .catch((err) => {
        if (cancelled) return;
        setError(getApiErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoadingBudget(false);
      });
    return () => {
      cancelled = true;
    };
  }, [month]);

  const monthlyIncome = Number(income?.total_amount ?? income?.amount ?? 0);
  const totalSpent = Number(summary?.total_spent || 0);
  const savings = Number(summary?.savings || 0);
  const savingsRate = Number(summary?.savings_rate || 0);

  const chartData = (summary?.category_breakdown || []).map((c) => ({
    name: c.category,
    value: Number(c.total),
  }));

  const hasAiContent = Boolean(insight?.insight_text || score?.score != null);

  const lastGenerated = useMemo(() => {
    const times = [insight?.generated_at, score?.generated_at]
      .filter(Boolean)
      .map((t) => new Date(t).getTime())
      .filter((t) => !Number.isNaN(t));
    if (times.length === 0) return null;
    return new Date(Math.max(...times));
  }, [insight?.generated_at, score?.generated_at]);

  const handleRegenerateAll = async () => {
    setLoadingRegenerate(true);
    setError(null);
    try {
      const [ins, sc] = await Promise.all([
        generateInsight(month),
        generateHealthScore(month),
      ]);
      setInsight(ins);
      setScore(sc);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoadingRegenerate(false);
    }
  };

  return (
    <>
      <Navbar
        title="AI Insights"
        subtitle={`LLM-powered analysis of your spending and financial health for ${prettyMonth(month)}.`}
      />

      {!loadingBudget && !hasBudgetData && <EmptyMonthState month={month} />}

      {error && (
        <div className="card p-4 mb-4 text-loss text-sm border-loss/30">
          {error}
        </div>
      )}

      {hasBudgetData && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <Stat label="Income" value={formatMoney(monthlyIncome)} />
            <Stat label="Spent" value={formatMoney(totalSpent)} />
            <Stat
              label="Savings"
              value={formatMoney(savings)}
              tone={savings >= 0 ? "gain" : "loss"}
            />
            <Stat
              label="Savings Rate"
              value={`${savingsRate.toFixed(1)}%`}
              tone={
                savingsRate >= 20 ? "gain" : savingsRate >= 0 ? "neutral" : "loss"
              }
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            {lastGenerated ? (
              <p className="text-[11px] text-text-muted">
                Last generated {lastGenerated.toLocaleString()}
              </p>
            ) : (
              <p className="text-[11px] text-text-muted">
                No AI analysis generated for this month yet.
              </p>
            )}
            <Button
              onClick={handleRegenerateAll}
              disabled={loadingRegenerate || loadingBudget}
              className="shrink-0 self-start sm:self-auto"
            >
              {loadingRegenerate && <Spinner />}
              {loadingRegenerate ? "Regenerating…" : "Regenerate all"}
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {!hasAiContent ? (
              <div className="card p-8 text-center lg:col-span-3 order-1">
                <p className="font-medium text-text-primary">
                  No AI analysis yet for {prettyMonth(month)}
                </p>
                <p className="text-sm text-text-secondary mt-2 max-w-md mx-auto">
                  Generate spending insights and a financial health score from your
                  budget data. Click Regenerate all above to get started.
                </p>
              </div>
            ) : (
              <>
                <div className="lg:col-span-2 order-1 space-y-2">
                  <h2 className="text-sm font-semibold">Spending Insights</h2>
                  {insight?.insight_text ? (
                    <InsightCard text={insight.insight_text} hideTitle />
                  ) : (
                    <div className="card p-6 text-sm text-text-secondary text-center">
                      Spending insights not generated yet. Use Regenerate all above.
                    </div>
                  )}
                </div>

                <div className="lg:col-span-1 order-3 lg:order-2 space-y-2">
                  <h2 className="text-sm font-semibold text-text-secondary">
                    Financial Health
                  </h2>
                  <HealthScoreCard
                    data={score}
                    size={120}
                    compact
                    hideTitle
                    showBreakdown
                    emptyMessage='No score yet. Click "Regenerate all" to generate one.'
                  />
                </div>
              </>
            )}

            <div className="card p-5 lg:col-span-2 order-2 lg:order-3">
              <h3 className="font-semibold mb-3">Spending by Category</h3>
              <Chart type="donut" data={chartData} height={280} />
            </div>
          </div>
        </>
      )}
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
    <div className="card p-4">
      <p className="text-[11px] uppercase tracking-wide text-text-secondary">
        {label}
      </p>
      <p className={`text-xl sm:text-2xl font-semibold mt-1 tabular-nums ${toneClass}`}>
        {value}
      </p>
    </div>
  );
}

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

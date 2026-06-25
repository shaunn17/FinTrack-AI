import { useEffect, useMemo, useState } from "react";
import StatCard from "../components/dashboard/StatCard";
import SpendingChartSection from "../components/dashboard/SpendingChartSection";
import HealthScoreCard from "../components/insights/HealthScoreCard";
import InsightCard from "../components/insights/InsightCard";
import Navbar from "../components/layout/Navbar";
import Button from "../components/shared/Button";
import EmptyMonthState from "../components/shared/EmptyMonthState";
import {
  canComparePrevMonth,
  hasMonthBudgetData,
  prettyMonth,
  prevMonth,
  useMonthYear,
} from "../context/MonthYearContext";
import {
  generateHealthScore,
  generateInsight,
  getApiErrorMessage,
  getBudgetCaps,
  getBudgetSummary,
  getExpenses,
  getHealthScore,
  getIncome,
  getInsight,
} from "../services/api";
import { formatMoney } from "../styles/theme";
import {
  formatMomDelta,
  percentIncomeSpent,
} from "../utils/dashboardMetrics";

function formatGeneratedAt(date) {
  if (!date) return null;
  try {
    const d = date instanceof Date ? date : new Date(date);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleString(undefined, {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return null;
  }
}

export default function Insights() {
  const { month } = useMonthYear();
  const [insight, setInsight] = useState(null);
  const [score, setScore] = useState(null);
  const [income, setIncome] = useState(null);
  const [summary, setSummary] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [caps, setCaps] = useState([]);
  const [prevSummary, setPrevSummary] = useState(null);
  const [loadingRegenerate, setLoadingRegenerate] = useState(false);
  const [loadingBudget, setLoadingBudget] = useState(true);
  const [hasBudgetData, setHasBudgetData] = useState(true);
  const [error, setError] = useState(null);

  const comparePrev = canComparePrevMonth(month);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setLoadingBudget(true);

    const fetches = [
      getInsight(month),
      getHealthScore(month),
      getIncome(month),
      getExpenses(month),
      getBudgetSummary(month),
      getBudgetCaps(month),
    ];
    if (comparePrev) {
      fetches.push(getBudgetSummary(prevMonth(month)));
    }

    Promise.all(fetches)
      .then((results) => {
        if (cancelled) return;
        const [ins, sc, inc, exp, sum, capList, prevSum] = results;
        setInsight(ins);
        setScore(sc);
        setIncome(inc);
        setExpenses(exp);
        setSummary(sum);
        setCaps(capList);
        setPrevSummary(comparePrev ? prevSum : null);
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
  }, [month, comparePrev]);

  const monthlyIncome = Number(income?.total_amount ?? income?.amount ?? 0);
  const totalSpent = Number(summary?.total_spent || 0);
  const savings = Number(summary?.savings || 0);
  const savingsRate = Number(summary?.savings_rate || 0);
  const pctSpent = percentIncomeSpent(monthlyIncome, totalSpent);
  const incomeSources = income?.entries?.length ?? 0;

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

  const hasAiContent = Boolean(insight?.insight_text || score?.score != null);

  const lastGenerated = useMemo(() => {
    const times = [insight?.generated_at, score?.generated_at]
      .filter(Boolean)
      .map((t) => new Date(t).getTime())
      .filter((t) => !Number.isNaN(t));
    if (times.length === 0) return null;
    return new Date(Math.max(...times));
  }, [insight?.generated_at, score?.generated_at]);

  const lastGeneratedLabel = formatGeneratedAt(lastGenerated);

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
        title="Insights"
        subtitle={prettyMonth(month)}
        right={
          hasBudgetData ? (
            <Button
              variant="primary"
              size="sm"
              onClick={handleRegenerateAll}
              disabled={loadingRegenerate || loadingBudget}
            >
              {loadingRegenerate ? "Regenerating…" : "Regenerate all"}
            </Button>
          ) : null
        }
      />

      {!loadingBudget && !hasBudgetData && <EmptyMonthState month={month} />}

      {error && (
        <div className="card p-4 mb-4 text-loss text-sm border-loss/30">
          {error}
        </div>
      )}

      {hasBudgetData && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              label="Income"
              value={formatMoney(monthlyIncome)}
              loading={loadingBudget}
            />
            <StatCard
              label="Spent"
              value={formatMoney(totalSpent)}
              delta={spentDelta}
              loading={loadingBudget}
            />
            <StatCard
              label="Savings"
              value={formatMoney(savings)}
              tone={savings >= 0 ? "gain" : "loss"}
              delta={savingsDelta}
              loading={loadingBudget}
            />
            <StatCard
              label="Savings Rate"
              value={`${savingsRate.toFixed(1)}%`}
              hint={
                pctSpent != null
                  ? `${pctSpent.toFixed(0)}% of income spent`
                  : incomeSources > 0
                    ? "Add income to track rate"
                    : undefined
              }
              tone={
                savingsRate >= 20
                  ? "gain"
                  : savingsRate >= 0
                    ? "neutral"
                    : "loss"
              }
              loading={loadingBudget}
            />
          </div>

          {!loadingBudget && (
            <p className="mb-6 text-[11px] text-text-muted">
              {lastGeneratedLabel
                ? `Analysis generated ${lastGeneratedLabel}`
                : "No AI analysis for this month yet."}
            </p>
          )}

          <section className="space-y-4 mb-6">
            <SectionHeading
              title="AI Analysis"
              description="Spending narrative and financial health score from your budget data."
            />

            {loadingBudget ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
                <div className="card p-6 lg:col-span-2 text-sm text-text-muted">
                  Loading insights…
                </div>
                <div className="card p-6 text-sm text-text-muted">
                  Loading health score…
                </div>
              </div>
            ) : !hasAiContent ? (
              <div className="card p-8 text-center border-dashed border-border/80">
                <p className="font-medium text-text-primary">
                  No AI analysis for {prettyMonth(month)}
                </p>
                <p className="text-sm text-text-secondary mt-2 max-w-md mx-auto">
                  Generate spending insights and a health score from your budget.
                  Use Regenerate all above.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
                <div className="lg:col-span-2 flex flex-col gap-2 min-h-0">
                  <ColumnLabel>Spending Insights</ColumnLabel>
                  {insight?.insight_text ? (
                    <InsightCard
                      text={insight.insight_text}
                      generatedAt={insight.generated_at}
                      hideTitle
                      className="flex-1"
                    />
                  ) : (
                    <PlaceholderCard>
                      Spending insights not generated yet. Use Regenerate all
                      above.
                    </PlaceholderCard>
                  )}
                </div>

                <div className="flex flex-col gap-2 min-h-0">
                  <ColumnLabel>Financial Health</ColumnLabel>
                  <HealthScoreCard
                    data={score}
                    size={112}
                    compact
                    hideTitle
                    showBreakdown
                    className="flex-1"
                    emptyMessage="No score yet. Use Regenerate all above."
                  />
                </div>
              </div>
            )}
          </section>

          <section className="space-y-4">
            <SpendingChartSection
              summary={summary}
              caps={caps}
              loading={loadingBudget}
            />
          </section>
        </>
      )}
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

function ColumnLabel({ children }) {
  return (
    <h3 className="text-sm font-semibold text-text-primary">{children}</h3>
  );
}

function PlaceholderCard({ children }) {
  return (
    <div className="card p-6 flex-1 text-sm text-text-secondary text-center flex items-center justify-center border-dashed border-border/80">
      {children}
    </div>
  );
}

import { useEffect, useState } from "react";
import HealthScoreCard from "../components/insights/HealthScoreCard";
import InsightCard from "../components/insights/InsightCard";
import Navbar from "../components/layout/Navbar";
import Button from "../components/shared/Button";
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

export default function Insights() {
  const { month } = useMonthYear();
  const [insight, setInsight] = useState(null);
  const [score, setScore] = useState(null);
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [loadingScore, setLoadingScore] = useState(false);
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

  const onGenerateInsight = async () => {
    setLoadingInsight(true);
    setError(null);
    try {
      const data = await generateInsight(month);
      setInsight(data);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoadingInsight(false);
    }
  };

  const onGenerateScore = async () => {
    setLoadingScore(true);
    setError(null);
    try {
      const data = await generateHealthScore(month);
      setScore(data);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoadingScore(false);
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm uppercase tracking-wide text-text-secondary">
              Spending Insights
            </h2>
            <Button onClick={onGenerateInsight} disabled={loadingInsight} size="sm">
              {loadingInsight
                ? "Generating…"
                : insight?.insight_text
                ? "Regenerate"
                : "Generate Insights"}
            </Button>
          </div>
          {insight?.insight_text ? (
            <InsightCard
              text={insight.insight_text}
              generatedAt={insight.generated_at}
            />
          ) : (
            <div className="card p-8 text-center text-text-secondary text-sm">
              No insights stored for this month yet.
            </div>
          )}
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm uppercase tracking-wide text-text-secondary">
              Financial Health Score
            </h2>
            <Button onClick={onGenerateScore} disabled={loadingScore} size="sm">
              {loadingScore
                ? "Calculating…"
                : score?.score != null
                ? "Recalculate"
                : "Calculate Score"}
            </Button>
          </div>
          <HealthScoreCard data={score} />
        </section>
      </div>
    </>
  );
}

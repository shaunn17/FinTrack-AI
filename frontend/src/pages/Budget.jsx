import { useEffect, useState } from "react";
import BudgetCapCard from "../components/budget/BudgetCapCard";
import CategoryBreakdown from "../components/budget/CategoryBreakdown";
import ExpenseForm from "../components/budget/ExpenseForm";
import ExpenseTable from "../components/budget/ExpenseTable";
import IncomeCard from "../components/budget/IncomeCard";
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
import { useBudget } from "../hooks/useBudget";
import { getBudgetSummary } from "../services/api";
import { formatMoney } from "../styles/theme";
import {
  formatMomDelta,
  percentIncomeSpent,
} from "../utils/dashboardMetrics";

export default function Budget() {
  const { month } = useMonthYear();
  const [incomePanelOpen, setIncomePanelOpen] = useState(false);
  const [prevSummary, setPrevSummary] = useState(null);
  const { income, expenses, caps, summary, loading, error, refresh } =
    useBudget(month);

  const comparePrev = canComparePrevMonth(month);

  useEffect(() => {
    if (!comparePrev) {
      setPrevSummary(null);
      return;
    }
    let cancelled = false;
    getBudgetSummary(prevMonth(month))
      .then((data) => {
        if (!cancelled) setPrevSummary(data);
      })
      .catch(() => {
        if (!cancelled) setPrevSummary(null);
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
  const hasBudgetData = hasMonthBudgetData({ income, expenses, summary });
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

  return (
    <>
      <Navbar title="Budget" subtitle={prettyMonth(month)} />

      {!loading && !hasBudgetData && <EmptyMonthState month={month} />}

      {error && (
        <div className="card p-4 mb-4 text-loss text-sm border-loss/30">
          {error}
        </div>
      )}

      <div
        className={`grid grid-cols-2 lg:grid-cols-4 gap-4 items-stretch relative transition-[margin] duration-200 ${
          incomePanelOpen ? "mb-[min(26rem,55vh)] sm:mb-[min(28rem,50vh)]" : "mb-6"
        }`}
      >
        <div className="min-h-0 h-full lg:min-w-0">
          <IncomeCard
            month={month}
            income={income}
            loading={loading}
            onSaved={refresh}
            onPanelOpenChange={setIncomePanelOpen}
          />
        </div>
        <StatCard
          label="Spent"
          value={formatMoney(totalSpent)}
          delta={spentDelta}
          loading={loading}
        />
        <StatCard
          label="Savings"
          value={formatMoney(savings)}
          tone={savings >= 0 ? "gain" : "loss"}
          delta={savingsDelta}
          loading={loading}
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
          loading={loading}
        />
      </div>

      <section className="space-y-4">
        <SectionHeading
          title="Spending"
          description="Log expenses and review category caps."
        />

        <ExpenseForm onCreated={refresh} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <ExpenseTable expenses={expenses} loading={loading} onChanged={refresh} />
          </div>
          <div className="space-y-4">
            <CategoryBreakdown summary={summary} caps={caps} loading={loading} />
            <BudgetCapCard month={month} caps={caps} onSaved={refresh} />
          </div>
        </div>
      </section>
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

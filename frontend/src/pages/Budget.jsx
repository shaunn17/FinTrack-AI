import { useState } from "react";
import BudgetCapCard from "../components/budget/BudgetCapCard";
import CategoryBreakdown from "../components/budget/CategoryBreakdown";
import ExpenseForm from "../components/budget/ExpenseForm";
import ExpenseTable from "../components/budget/ExpenseTable";
import IncomeCard from "../components/budget/IncomeCard";
import Navbar from "../components/layout/Navbar";
import { useBudget } from "../hooks/useBudget";
import { currentMonthString, formatMoney } from "../styles/theme";

export default function Budget() {
  const [month, setMonth] = useState(currentMonthString());
  const { income, expenses, caps, summary, loading, refresh } = useBudget(month);

  const totalSpent = Number(summary?.total_spent || 0);
  const savings = Number(summary?.savings || 0);
  const savingsRate = Number(summary?.savings_rate || 0);

  return (
    <>
      <Navbar
        title="Budget & Spending"
        subtitle="Track income, log expenses, and stay within your category caps."
        right={
          <input
            type="month"
            className="input w-44"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
        <IncomeCard month={month} income={income} onSaved={refresh} />
        <SummaryStat label="Total Spent" value={formatMoney(totalSpent)} />
        <SummaryStat
          label="Savings"
          value={formatMoney(savings)}
          tone={savings >= 0 ? "gain" : "loss"}
        />
        <SummaryStat
          label="Savings Rate"
          value={`${savingsRate.toFixed(1)}%`}
          tone={savingsRate >= 20 ? "gain" : savingsRate >= 0 ? "neutral" : "loss"}
        />
      </div>

      <div className="space-y-4">
        <ExpenseForm onCreated={refresh} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <ExpenseTable expenses={expenses} onChanged={refresh} />
          </div>
          <div className="space-y-4">
            <CategoryBreakdown summary={summary} caps={caps} />
            <BudgetCapCard month={month} caps={caps} onSaved={refresh} />
          </div>
        </div>
      </div>

      {loading && (
        <p className="text-xs text-text-muted mt-4">Refreshing data…</p>
      )}
    </>
  );
}

function SummaryStat({ label, value, tone = "neutral" }) {
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
      <p className={`text-3xl font-semibold mt-1 ${toneClass}`}>{value}</p>
    </div>
  );
}

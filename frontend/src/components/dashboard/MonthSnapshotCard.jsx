import { Link } from "react-router-dom";
import {
  formatCategory,
  formatMoney,
} from "../../styles/theme";
import {
  getCapUsageInsights,
  getLargestCategory,
  getSnapshotRecommendation,
  percentIncomeSpent,
} from "../../utils/dashboardMetrics";
import { getDashboardInsightTeaser } from "../../utils/insightText";

export default function MonthSnapshotCard({
  summary,
  caps,
  income,
  insight,
  loading,
}) {
  const monthlyIncome = Number(income?.total_amount ?? income?.amount ?? 0);
  const totalSpent = Number(summary?.total_spent || 0);
  const savingsRate = Number(summary?.savings_rate ?? 0);
  const largest = getLargestCategory(summary?.category_breakdown);
  const pctSpent = percentIncomeSpent(monthlyIncome, totalSpent);
  const { overCap } = getCapUsageInsights(caps, summary);
  const recommendation = getSnapshotRecommendation({
    savingsRate,
    largestCategory: largest,
    pctIncomeSpent: pctSpent,
    overCapCategories: overCap,
  });

  const aiTeaser = getDashboardInsightTeaser(insight?.insight_text);
  const hasAi = Boolean(aiTeaser);

  return (
    <div className="card p-5 h-full flex flex-col">
      <h3 className="font-semibold mb-4">Month Snapshot</h3>

      {loading ? (
        <p className="text-sm text-text-muted flex-1">Loading snapshot…</p>
      ) : (
        <>
          <dl className="space-y-3 text-sm">
            <SnapshotRow
              label="Savings rate"
              value={`${savingsRate.toFixed(1)}%`}
              tone={
                savingsRate >= 20
                  ? "gain"
                  : savingsRate >= 0
                    ? "neutral"
                    : "loss"
              }
            />
            {largest && (
              <SnapshotRow
                label="Top category"
                value={formatCategory(largest.category)}
                detail={`${largest.percentOfSpend.toFixed(0)}% of spend`}
              />
            )}
            {pctSpent != null && (
              <SnapshotRow
                label="Income spent"
                value={`${pctSpent.toFixed(0)}%`}
                detail={formatMoney(totalSpent)}
              />
            )}
          </dl>

          <div className="mt-4 pt-4 border-t border-border/60">
            <p className="text-[11px] uppercase tracking-wide text-text-secondary mb-2">
              Recommendation
            </p>
            <p className="text-sm text-text-primary leading-relaxed">
              {recommendation}
            </p>
          </div>

          {hasAi && (
            <div className="mt-4 pt-4 border-t border-border/60">
              <p className="text-[11px] uppercase tracking-wide text-text-secondary mb-1.5">
                AI highlight
              </p>
              <p className="text-xs text-text-muted leading-snug">{aiTeaser}</p>
              <Link
                to="/insights"
                className="inline-block mt-2 text-[11px] text-accent hover:underline"
              >
                See Insights →
              </Link>
            </div>
          )}

          {!hasAi && (
            <p className="text-[11px] text-text-muted mt-4">
              Generate AI insights on{" "}
              <Link to="/insights" className="text-accent hover:underline">
                Insights →
              </Link>
            </p>
          )}
        </>
      )}
    </div>
  );
}

function SnapshotRow({ label, value, detail, tone = "neutral" }) {
  const toneClass =
    tone === "gain"
      ? "text-gain"
      : tone === "loss"
        ? "text-loss"
        : "text-text-primary";

  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-text-secondary">{label}</dt>
      <dd className="text-right">
        <span className={`font-medium tabular-nums ${toneClass}`}>{value}</span>
        {detail && (
          <span className="block text-[11px] text-text-muted">{detail}</span>
        )}
      </dd>
    </div>
  );
}

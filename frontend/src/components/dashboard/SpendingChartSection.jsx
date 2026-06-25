import { Link } from "react-router-dom";
import Chart, { colorFor } from "../shared/Chart";
import {
  formatCategory,
  formatMoney,
  theme,
} from "../../styles/theme";
import { getCapUsageInsights, getLargestCategory } from "../../utils/dashboardMetrics";

export default function SpendingChartSection({ summary, caps, loading }) {
  const chartData = (summary?.category_breakdown || []).map((c) => ({
    name: c.category,
    value: Number(c.total),
  }));

  const totalSpend = chartData.reduce((s, c) => s + c.value, 0);
  const legendRows = chartData
    .map((c) => ({
      ...c,
      pct: totalSpend > 0 ? (c.value / totalSpend) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value);

  const largest = getLargestCategory(summary?.category_breakdown);
  const { overCap, topCap } = getCapUsageInsights(caps, summary);

  return (
    <div className="card p-5 h-full w-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Spending by Category</h3>
        <Link to="/budget" className="text-xs text-accent hover:underline">
          View Budget →
        </Link>
      </div>

      {loading ? (
        <div className="flex-1 min-h-[280px] flex items-center justify-center text-text-muted text-sm">
          Loading chart…
        </div>
      ) : chartData.length === 0 ? (
        <p className="text-sm text-text-secondary py-8 text-center flex-1">
          No spending logged this month.
        </p>
      ) : (
        <div className="flex-1 flex flex-col lg:flex-row gap-5 min-h-0">
          <div className="flex-1 min-h-[280px] flex items-center">
            <div className="w-full">
              <Chart
                type="donut"
                data={chartData}
                height={280}
                showPercentLabels
              />
            </div>
          </div>

          <div className="lg:w-[42%] flex flex-col gap-4 min-h-0">
            <div className="flex-1 min-h-0">
              <p className="text-[11px] uppercase tracking-wide text-text-secondary mb-2">
                Breakdown
              </p>
              <ul className="space-y-2 max-h-[200px] lg:max-h-none overflow-y-auto pr-1">
                {legendRows.map((row) => (
                  <li
                    key={row.name}
                    className="flex items-center gap-2.5 text-sm"
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: colorFor(row.name) }}
                    />
                    <span className="flex-1 min-w-0 text-text-primary truncate">
                      {formatCategory(row.name)}
                    </span>
                    <span className="text-text-secondary tabular-nums shrink-0">
                      {row.pct.toFixed(0)}%
                    </span>
                    <span className="text-text-muted tabular-nums shrink-0 w-[4.5rem] text-right">
                      {formatMoney(row.value)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {overCap.length > 0 ? (
              <div className="pt-3 border-t border-border/60">
                <p className="text-[11px] uppercase tracking-wide text-text-secondary mb-1.5">
                  Over budget cap
                </p>
                <ul className="space-y-1">
                  {overCap.map((row) => (
                    <li
                      key={row.category}
                      className="text-xs flex justify-between gap-2"
                    >
                      <span className="text-text-primary">
                        {formatCategory(row.category)}
                      </span>
                      <span className="text-loss tabular-nums shrink-0">
                        {formatMoney(row.spent)} / {formatMoney(row.cap)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : topCap ? (
              <div className="pt-3 border-t border-border/60">
                <p className="text-[11px] uppercase tracking-wide text-text-secondary mb-1">
                  Highest cap usage
                </p>
                <p className="text-xs text-text-primary">
                  {formatCategory(topCap.category)} ·{" "}
                  {formatMoney(topCap.spent)} of {formatMoney(topCap.cap)} (
                  {Math.min(100, topCap.pct).toFixed(0)}%)
                </p>
                <div className="mt-1.5 h-1.5 w-full bg-bg rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(100, topCap.pct)}%`,
                      backgroundColor:
                        topCap.pct > 100
                          ? theme.colors.loss
                          : theme.categoryColors[topCap.category] ||
                            theme.colors.accent,
                    }}
                  />
                </div>
              </div>
            ) : largest ? (
              <div className="pt-3 border-t border-border/60">
                <p className="text-xs text-text-muted">
                  Largest: {formatCategory(largest.category)} (
                  {largest.percentOfSpend.toFixed(0)}% of spend)
                </p>
              </div>
            ) : caps?.length > 0 ? (
              <p className="text-xs text-text-muted pt-3 border-t border-border/60">
                All categories within caps so far.
              </p>
            ) : (
              <p className="text-xs text-text-muted pt-3 border-t border-border/60">
                Set category caps on the{" "}
                <Link to="/budget" className="text-accent hover:underline">
                  Budget
                </Link>{" "}
                page to track usage.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

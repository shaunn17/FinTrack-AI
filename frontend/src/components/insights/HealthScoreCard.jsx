function colorForScore(score) {
  if (score == null) return "#475569";
  if (score < 40) return "#ef4444";
  if (score <= 70) return "#f59e0b";
  return "#22c55e";
}

function toneClassForScore(score) {
  if (score == null) return "text-text-muted";
  if (score < 40) return "text-loss";
  if (score <= 70) return "text-amber-400";
  return "text-gain";
}

function scoreLabel(score) {
  if (score == null) return null;
  if (score >= 70) return "Healthy";
  if (score >= 40) return "Fair";
  return "Needs attention";
}

function colorForMetric(value, max = 25) {
  const normalized = (Number(value ?? 0) / max) * 100;
  return colorForScore(normalized);
}

function toneClassForMetric(value, max = 25) {
  const normalized = (Number(value ?? 0) / max) * 100;
  return toneClassForScore(normalized);
}

function ScoreRing({ score, size = 160 }) {
  const numeric = Number(score ?? 0);
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(100, numeric)) / 100;
  const dash = circumference * pct;
  const color = colorForScore(numeric);

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#2a2d3e"
        strokeWidth={10}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={10}
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circumference}`}
        style={{ transition: "stroke-dasharray 0.6s ease, stroke 0.6s ease" }}
      />
    </svg>
  );
}

const ROWS = [
  {
    key: "savings_rate",
    label: "Savings Rate",
    hint: "Share of income left after expenses",
  },
  {
    key: "budget_adherence",
    label: "Budget Adherence",
    hint: "How well spending stays within caps",
  },
  {
    key: "expense_volatility",
    label: "Expense Volatility",
    hint: "How steady your spending is month to month",
  },
  {
    key: "portfolio_growth",
    label: "Portfolio Growth",
    hint: "Investment performance over time",
  },
];

function MetricRow({ label, hint, value, compact = false }) {
  const v = Number(value ?? 0);
  const pct = Math.max(0, Math.min(100, (v / 25) * 100));
  const barColor = colorForMetric(v);
  const scoreTone = toneClassForMetric(v);

  return (
    <div className={compact ? "space-y-2" : "space-y-2.5"}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p
            className={`font-medium text-text-primary ${
              compact ? "text-xs" : "text-sm"
            }`}
          >
            {label}
          </p>
          <p
            className={`text-text-muted leading-snug mt-0.5 ${
              compact ? "text-[10px]" : "text-[11px]"
            }`}
          >
            {hint}
          </p>
        </div>
        <span
          className={`shrink-0 tabular-nums font-semibold ${scoreTone} ${
            compact ? "text-xs" : "text-sm"
          }`}
        >
          {v.toFixed(1)}
          <span className="text-text-muted font-normal"> / 25</span>
        </span>
      </div>
      <div
        className={`w-full bg-bg rounded-full overflow-hidden ${
          compact ? "h-1" : "h-1.5"
        }`}
        role="progressbar"
        aria-valuenow={v}
        aria-valuemin={0}
        aria-valuemax={25}
        aria-label={label}
      >
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${pct}%`, backgroundColor: barColor }}
        />
      </div>
    </div>
  );
}

export default function HealthScoreCard({
  data,
  size = 160,
  compact = false,
  hideTitle = false,
  showBreakdown = false,
  emptyMessage = 'No score yet. Click "Calculate Score" to generate one.',
  className = "",
}) {
  if (!data || data.score == null) {
    return (
      <div
        className={`card p-6 h-full flex items-center justify-center text-text-secondary text-sm text-center border-dashed border-border/80 ${className}`.trim()}
      >
        {emptyMessage}
      </div>
    );
  }

  const rawBd = data.breakdown?.breakdown ?? data.breakdown;
  const breakdown =
    rawBd && typeof rawBd === "object" && !Array.isArray(rawBd) ? rawBd : {};
  const summary =
    typeof data.breakdown === "object" && data.breakdown && !Array.isArray(data.breakdown)
      ? String(data.breakdown.summary || "")
      : "";
  const score = Number(data.score ?? 0);
  const scoreTone = toneClassForScore(score);
  const label = scoreLabel(score);
  const scoreFont = size <= 120 ? "text-2xl" : "text-3xl";
  const showMetrics = !compact || showBreakdown;

  return (
    <div className={`card p-6 h-full flex flex-col ${className}`.trim()}>
      <div
        className={
          compact
            ? "flex flex-col items-center text-center gap-4 flex-1"
            : "flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8 flex-1"
        }
      >
        <div className="flex flex-col items-center shrink-0 gap-2">
          <div
            className="relative flex items-center justify-center"
            style={{ width: size, height: size }}
          >
            <ScoreRing score={score} size={size} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`${scoreFont} font-semibold tabular-nums ${scoreTone}`}>
                {Math.round(score)}
              </span>
              <span className="text-[10px] text-text-secondary uppercase tracking-wide mt-0.5">
                / 100
              </span>
            </div>
          </div>
          {label && (
            <span
              className={`text-xs font-medium uppercase tracking-wide ${scoreTone}`}
            >
              {label}
            </span>
          )}
        </div>

        <div className={`${compact ? "w-full" : "flex-1 w-full"} min-w-0 flex flex-col`}>
          {!hideTitle && (
            <h3 className="font-semibold text-text-primary mb-2">
              Financial Health Score
            </h3>
          )}

          {summary && (
            <p
              className={`text-sm text-text-secondary leading-relaxed ${
                compact ? "line-clamp-3 text-center" : "mb-5"
              }`}
            >
              {summary}
            </p>
          )}

          {showMetrics && (
            <div
              className={`${
                compact
                  ? "w-full pt-4 mt-1 border-t border-border/60"
                  : summary
                    ? ""
                    : "sm:pt-1"
              }`}
            >
              <p
                className={`uppercase tracking-wide text-text-secondary font-medium ${
                  compact
                    ? "text-[10px] mb-3 text-center"
                    : "text-[11px] mb-4"
                }`}
              >
                Score breakdown
              </p>
              <div className={compact ? "space-y-3.5" : "space-y-4"}>
                {ROWS.map(({ key, label: rowLabel, hint }) => (
                  <MetricRow
                    key={key}
                    label={rowLabel}
                    hint={hint}
                    value={breakdown?.[key]}
                    compact={compact}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export { colorForScore, ScoreRing };

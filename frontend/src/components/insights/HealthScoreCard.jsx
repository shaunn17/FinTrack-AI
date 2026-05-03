function colorForScore(score) {
  if (score == null) return "#475569";
  if (score < 40) return "#ef4444";
  if (score <= 70) return "#f59e0b";
  return "#22c55e";
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
  { key: "savings_rate", label: "Savings Rate" },
  { key: "budget_adherence", label: "Budget Adherence" },
  { key: "expense_volatility", label: "Expense Volatility" },
  { key: "portfolio_growth", label: "Portfolio Growth" },
];

export default function HealthScoreCard({ data, size = 160, compact = false }) {
  if (!data || data.score == null) {
    return (
      <div className="card p-5 text-text-secondary text-sm">
        No score yet. Click "Calculate Score" to generate one.
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
  const color = colorForScore(score);

  return (
    <div className="card p-5">
      <div className="flex flex-col sm:flex-row items-center sm:items-stretch gap-6">
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
          <ScoreRing score={score} size={size} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-semibold" style={{ color }}>
              {Math.round(score)}
            </span>
            <span className="text-[11px] text-text-secondary uppercase tracking-wide">
              / 100
            </span>
          </div>
        </div>
        <div className="flex-1 w-full">
          <h3 className="font-semibold mb-1">Financial Health Score</h3>
          {summary && (
            <p className="text-sm text-text-secondary mb-3">{summary}</p>
          )}
          {!compact && (
            <table className="w-full text-sm">
              <tbody>
                {ROWS.map(({ key, label }) => {
                  const v = Number(breakdown?.[key] ?? 0);
                  return (
                    <tr key={key} className="border-b border-border/50 last:border-b-0">
                      <td className="py-2 text-text-secondary">{label}</td>
                      <td className="py-2 text-right">
                        <div className="inline-flex items-center gap-2">
                          <div className="h-1.5 w-24 bg-bg rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${(v / 25) * 100}%`,
                                backgroundColor: color,
                              }}
                            />
                          </div>
                          <span className="font-medium tabular-nums w-12 text-right">
                            {v.toFixed(1)} <span className="text-text-muted">/ 25</span>
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export { colorForScore, ScoreRing };

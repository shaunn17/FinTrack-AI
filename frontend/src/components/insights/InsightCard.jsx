export default function InsightCard({ text, generatedAt }) {
  if (!text) return null;

  // Split the LLM output into bullet lines, tolerating "- ", "* ", or "1. " prefixes.
  const bullets = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => l.replace(/^([-*•]|\d+[\.\)])\s*/, ""))
    .filter((l) => l.length > 0);

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold flex items-center gap-2">
          <span className="text-accent">●</span> Spending Insights
        </h3>
        {generatedAt && (
          <span className="text-[11px] text-text-muted">
            Generated {new Date(generatedAt).toLocaleString()}
          </span>
        )}
      </div>
      <ul className="space-y-2.5">
        {bullets.map((b, i) => (
          <li key={i} className="flex gap-3 text-sm text-text-primary">
            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-accent shrink-0" />
            <span className="leading-relaxed">{b}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

import { parseInsightBullets } from "../../utils/insightText";

export default function InsightCard({
  text,
  generatedAt,
  hideTitle = false,
  className = "",
}) {
  if (!text) return null;

  const bullets = parseInsightBullets(text);

  return (
    <div className={`card p-5 h-full flex flex-col ${className}`.trim()}>
      {!hideTitle && (
        <div className="flex items-center justify-between gap-3 mb-4">
          <h3 className="font-semibold">Spending Insights</h3>
          {generatedAt && (
            <span className="text-[11px] text-text-muted shrink-0">
              {new Date(generatedAt).toLocaleString(undefined, {
                dateStyle: "short",
                timeStyle: "short",
              })}
            </span>
          )}
        </div>
      )}
      {hideTitle && generatedAt && (
        <p className="text-[11px] text-text-muted mb-3">
          Generated{" "}
          {new Date(generatedAt).toLocaleString(undefined, {
            dateStyle: "short",
            timeStyle: "short",
          })}
        </p>
      )}
      <ul className="space-y-3 flex-1">
        {bullets.map((b, i) => (
          <li key={i} className="flex gap-3 text-sm text-text-primary">
            <span className="mt-2 h-1.5 w-1.5 rounded-full bg-accent shrink-0" />
            <span className="leading-relaxed">{b}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

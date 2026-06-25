export default function StatCard({
  label,
  value,
  hint,
  delta,
  tone = "neutral",
  loading = false,
}) {
  const toneClass =
    tone === "gain"
      ? "text-gain"
      : tone === "loss"
        ? "text-loss"
        : "text-text-primary";

  const deltaToneClass =
    delta?.tone === "gain"
      ? "text-gain"
      : delta?.tone === "loss"
        ? "text-loss"
        : "text-text-muted";

  return (
    <div className="card p-4">
      <p className="text-[11px] uppercase tracking-wide text-text-secondary">
        {label}
      </p>
      <p
        className={`text-xl sm:text-2xl font-semibold mt-1 tabular-nums ${toneClass}`}
      >
        {loading ? "…" : value}
      </p>
      {hint && !loading && (
        <p className="text-[10px] text-text-muted mt-1 leading-snug">{hint}</p>
      )}
      {delta && !loading && (
        <p className={`text-[10px] mt-1 leading-snug ${deltaToneClass}`}>
          {delta.text}
        </p>
      )}
    </div>
  );
}

export function getFollowUpSuggestions(userQuestion = "", assistantContent = "") {
  const q = userQuestion.toLowerCase();
  const combined = `${q} ${assistantContent.toLowerCase()}`;

  if (/portfolio|stock|invest|holding|equity|share|ticker/.test(combined)) {
    return ["Best performing stock", "Total invested"];
  }

  if (/category|categories|breakdown|where.*money|biggest/.test(combined)) {
    return ["Compare to last month", "Spending this month"];
  }

  if (/spend|spent|expense|budget|month|income/.test(combined)) {
    return ["Break down by category", "Compare to last month"];
  }

  return ["Spending this month", "Portfolio summary"];
}

export default function FollowUpChips({
  userQuestion,
  assistantContent,
  onSelect,
  disabled = false,
}) {
  const suggestions = getFollowUpSuggestions(userQuestion, assistantContent).slice(
    0,
    3,
  );

  return (
    <div className="flex flex-wrap gap-2 mt-2 ml-9">
      {suggestions.map((text) => (
        <button
          key={text}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(text)}
          className="text-xs px-3 py-1.5 rounded-full border border-border bg-surface-2 text-text-secondary hover:text-text-primary hover:border-accent/40 transition disabled:opacity-50 disabled:pointer-events-none"
        >
          {text}
        </button>
      ))}
    </div>
  );
}

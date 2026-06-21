import { prettyMonth } from "../../context/MonthYearContext";

export default function EmptyMonthState({ month }) {
  return (
    <div className="card p-6 mb-6 text-center border-dashed border-border/80">
      <p className="text-text-secondary text-sm">
        No data recorded for {prettyMonth(month)}.
      </p>
      <p className="text-text-muted text-xs mt-1">
        Add income or expenses in Budget to get started.
      </p>
    </div>
  );
}

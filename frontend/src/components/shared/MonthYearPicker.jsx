import { useEffect, useState } from "react";
import {
  MIN_YEAR,
  parseMonthString,
  toMonthString,
  useMonthYear,
} from "../../context/MonthYearContext";

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export default function MonthYearPicker() {
  const { month, setMonth, isMonthEnabled } = useMonthYear();
  const { year, month: monthNum } = parseMonthString(month);
  const [yearInput, setYearInput] = useState(String(year));

  useEffect(() => {
    setYearInput(String(year));
  }, [year]);

  const commitYear = () => {
    let nextYear = parseInt(yearInput, 10);
    if (Number.isNaN(nextYear) || nextYear < MIN_YEAR) {
      nextYear = MIN_YEAR;
    }
    let nextMonth = monthNum;
    if (!isMonthEnabled(nextYear, nextMonth)) {
      nextMonth = 5;
    }
    setMonth(toMonthString(nextYear, nextMonth));
    setYearInput(String(nextYear));
  };

  return (
    <div
      className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5"
      aria-label="Select month and year"
    >
      <label className="sr-only" htmlFor="month-picker">
        Month
      </label>
      <select
        id="month-picker"
        className="bg-transparent text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 rounded cursor-pointer disabled:cursor-not-allowed"
        value={monthNum}
        onChange={(e) => setMonth(toMonthString(year, Number(e.target.value)))}
      >
        {MONTH_LABELS.map((label, idx) => {
          const m = idx + 1;
          const enabled = isMonthEnabled(year, m);
          return (
            <option
              key={label}
              value={m}
              disabled={!enabled}
              className={enabled ? "text-text-primary" : "text-text-muted"}
            >
              {label}
            </option>
          );
        })}
      </select>

      <span className="text-border select-none" aria-hidden>
        /
      </span>

      <label className="sr-only" htmlFor="year-picker">
        Year
      </label>
      <input
        id="year-picker"
        type="number"
        min={MIN_YEAR}
        className="w-16 bg-transparent text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 rounded tabular-nums"
        value={yearInput}
        onChange={(e) => setYearInput(e.target.value)}
        onBlur={commitYear}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commitYear();
          }
        }}
      />
    </div>
  );
}

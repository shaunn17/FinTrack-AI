import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { currentMonthString } from "../styles/theme";

const STORAGE_KEY = "fintrack-selected-month";

export const MIN_YEAR = 2026;
export const MIN_MONTH = 5; // May 2026

const MonthYearContext = createContext(null);

export function parseMonthString(monthStr) {
  const [y, m] = String(monthStr || "").split("-").map(Number);
  return { year: y, month: m };
}

export function toMonthString(year, month) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function isBeforeMinMonth(year, month) {
  return year < MIN_YEAR || (year === MIN_YEAR && month < MIN_MONTH);
}

export function isMonthSelectable(monthStr) {
  const { year, month } = parseMonthString(monthStr);
  if (!year || !month || month < 1 || month > 12) return false;
  return !isBeforeMinMonth(year, month);
}

function clampMonthString(monthStr) {
  if (isMonthSelectable(monthStr)) return monthStr;
  return toMonthString(MIN_YEAR, MIN_MONTH);
}

function readInitialMonth() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && isMonthSelectable(stored)) return stored;
  } catch {
    /* ignore */
  }
  return clampMonthString(currentMonthString());
}

export function prettyMonth(monthString) {
  const { year, month } = parseMonthString(monthString);
  const d = new Date(year, month - 1, 1);
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export function prevMonth(monthStr) {
  const { year, month } = parseMonthString(monthStr);
  if (month === 1) return toMonthString(year - 1, 12);
  return toMonthString(year, month - 1);
}

export function canComparePrevMonth(monthStr) {
  return isMonthSelectable(prevMonth(monthStr));
}

export function hasMonthBudgetData({ income, expenses, summary } = {}) {
  const incomeTotal = Number(income?.total_amount ?? income?.amount ?? 0);
  const hasIncomeEntries = (income?.entries?.length ?? 0) > 0;
  const hasExpenses = (expenses?.length ?? 0) > 0;
  const totalSpent = Number(summary?.total_spent ?? 0);
  return incomeTotal > 0 || hasIncomeEntries || hasExpenses || totalSpent > 0;
}

export function MonthYearProvider({ children }) {
  const [month, setMonthState] = useState(readInitialMonth);

  const setMonth = useCallback((next) => {
    const clamped = clampMonthString(next);
    setMonthState(clamped);
    try {
      localStorage.setItem(STORAGE_KEY, clamped);
    } catch {
      /* ignore */
    }
  }, []);

  const isMonthEnabled = useCallback((year, monthNum) => {
    return !isBeforeMinMonth(Number(year), Number(monthNum));
  }, []);

  const value = useMemo(
    () => ({ month, setMonth, isMonthEnabled, prettyMonth }),
    [month, setMonth, isMonthEnabled]
  );

  return (
    <MonthYearContext.Provider value={value}>
      {children}
    </MonthYearContext.Provider>
  );
}

export function useMonthYear() {
  const ctx = useContext(MonthYearContext);
  if (!ctx) {
    throw new Error("useMonthYear must be used within MonthYearProvider");
  }
  return ctx;
}

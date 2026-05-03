import { useCallback, useEffect, useState } from "react";
import {
  getBudgetCaps,
  getBudgetSummary,
  getExpenses,
  getIncome,
  getApiErrorMessage,
} from "../services/api";

export function useBudget(month) {
  const [income, setIncome] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [caps, setCaps] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (!month) return;
    setLoading(true);
    setError(null);
    try {
      const [inc, exp, cps, sum] = await Promise.all([
        getIncome(month),
        getExpenses(month),
        getBudgetCaps(month),
        getBudgetSummary(month),
      ]);
      setIncome(inc);
      setExpenses(exp);
      setCaps(cps);
      setSummary(sum);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { income, expenses, caps, summary, loading, error, refresh };
}

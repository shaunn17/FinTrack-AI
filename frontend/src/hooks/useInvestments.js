import { useCallback, useEffect, useState } from "react";
import { getPortfolio, getTransactions, getApiErrorMessage } from "../services/api";

export function useInvestments() {
  const [transactions, setTransactions] = useState([]);
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const refresh = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    const errs = [];
    try {
      const tx = await getTransactions();
      setTransactions(tx);
    } catch (err) {
      errs.push(`Transactions: ${getApiErrorMessage(err)}`);
      setTransactions([]);
    }
    try {
      const pf = await getPortfolio();
      setPortfolio(pf);
    } catch (err) {
      errs.push(`Portfolio / live prices: ${getApiErrorMessage(err)}`);
      setPortfolio(null);
    }
    setError(errs.length > 0 ? errs.join(" · ") : null);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    refresh(false);
  }, [refresh]);

  return {
    transactions,
    portfolio,
    loading,
    refreshing,
    error,
    refresh: () => refresh(true),
  };
}

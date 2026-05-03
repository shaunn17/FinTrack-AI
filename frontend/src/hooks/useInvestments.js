import { useCallback, useEffect, useState } from "react";
import { getPortfolio, getTransactions, getApiErrorMessage } from "../services/api";

export function useInvestments() {
  const [transactions, setTransactions] = useState([]);
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [tx, pf] = await Promise.all([getTransactions(), getPortfolio()]);
      setTransactions(tx);
      setPortfolio(pf);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { transactions, portfolio, loading, error, refresh };
}

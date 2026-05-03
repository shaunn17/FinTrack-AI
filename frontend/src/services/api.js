import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL,
  // Do not set Content-Type globally — it breaks multipart (CSV import).
  // JSON requests still get application/json when sending plain objects.
  timeout: 30000,
});

/** Maps axios/FastAPI errors to a single string for UI (incl. “Network Error”). */
export function getApiErrorMessage(error) {
  if (!error) return "Request failed.";
  const detail = error.response?.data?.detail;
  if (detail != null) {
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) {
      return detail.map((e) => e.msg || JSON.stringify(e)).join("; ");
    }
    return JSON.stringify(detail);
  }
  if (
    error.code === "ERR_NETWORK" ||
    error.code === "ECONNABORTED" ||
    error.message === "Network Error"
  ) {
    return `Cannot reach the API at ${baseURL}. Start the FinTrack backend (uvicorn on port 8000), check frontend/.env has VITE_API_BASE_URL=${baseURL}, then refresh this page.`;
  }
  return error.message || "Request failed.";
}

// ---------------------------------------------------------------------------
// Budget
// ---------------------------------------------------------------------------
export const upsertIncome = (payload) =>
  api.post("/api/budget/income", payload).then((r) => r.data);

export const getIncome = (month) =>
  api.get(`/api/budget/income/${month}`).then((r) => r.data);

export const createExpense = (payload) =>
  api.post("/api/budget/expenses", payload).then((r) => r.data);

export const getExpenses = (month) =>
  api.get(`/api/budget/expenses/${month}`).then((r) => r.data);

export const deleteExpense = (id) =>
  api.delete(`/api/budget/expenses/${id}`).then((r) => r.data);

export const getBudgetSummary = (month) =>
  api.get(`/api/budget/summary/${month}`).then((r) => r.data);

export const upsertBudgetCap = (payload) =>
  api.post("/api/budget/caps", payload).then((r) => r.data);

export const getBudgetCaps = (month) =>
  api.get(`/api/budget/caps/${month}`).then((r) => r.data);

// ---------------------------------------------------------------------------
// Investments
// ---------------------------------------------------------------------------
export const createTransaction = (payload) =>
  api.post("/api/investments/transactions", payload).then((r) => r.data);

export const getTransactions = () =>
  api.get("/api/investments/transactions").then((r) => r.data);

export const deleteTransaction = (id) =>
  api.delete(`/api/investments/transactions/${id}`).then((r) => r.data);

export const getPortfolio = () =>
  api
    .get("/api/investments/portfolio", { timeout: 120000 })
    .then((r) => r.data);

/** @param {File} file
 *  @param {boolean} [dryRun]
 */
export const importInvestmentsCsv = (file, dryRun = false) => {
  const form = new FormData();
  form.append("file", file);
  return api
    .post("/api/investments/import-csv", form, {
      params: { dry_run: dryRun },
    })
    .then((r) => r.data);
};

// ---------------------------------------------------------------------------
// Stocks
// ---------------------------------------------------------------------------
export const searchStock = (ticker) =>
  api
    .get(`/api/stocks/search`, { params: { ticker } })
    .then((r) => r.data);

// ---------------------------------------------------------------------------
// Insights
// ---------------------------------------------------------------------------
export const generateInsight = (month) =>
  api.post(`/api/insights/generate/${month}`).then((r) => r.data);

export const getInsight = (month) =>
  api.get(`/api/insights/${month}`).then((r) => r.data);

export const generateHealthScore = (month) =>
  api.post(`/api/insights/health-score/${month}`).then((r) => r.data);

export const getHealthScore = (month) =>
  api.get(`/api/insights/health-score/${month}`).then((r) => r.data);

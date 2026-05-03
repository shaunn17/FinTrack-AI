// Centralized design tokens. Mirror these in tailwind.config.js when changed.
export const theme = {
  colors: {
    bg: "#0f1117",
    surface: "#1a1d27",
    surface2: "#222633",
    border: "#2a2d3e",
    accent: "#2dd4bf",
    accent2: "#6366f1",
    gain: "#22c55e",
    loss: "#ef4444",
    text: {
      primary: "#f1f5f9",
      secondary: "#94a3b8",
      muted: "#475569",
    },
  },
  // Distinct subtle colors per expense category for badges/charts.
  categoryColors: {
    GROCERIES: "#22c55e",
    SUBSCRIPTIONS: "#6366f1",
    RENT: "#f59e0b",
    UTILITIES: "#06b6d4",
    TRANSPORT: "#3b82f6",
    DINING_OUT_FOOD: "#ec4899",
    ENTERTAINMENT: "#a855f7",
    STUDENT_LOANS_DEBT: "#ef4444",
    MISCELLANEOUS: "#94a3b8",
  },
};

export const EXPENSE_CATEGORIES = [
  "GROCERIES",
  "SUBSCRIPTIONS",
  "RENT",
  "UTILITIES",
  "TRANSPORT",
  "DINING_OUT_FOOD",
  "ENTERTAINMENT",
  "STUDENT_LOANS_DEBT",
  "MISCELLANEOUS",
];

export const formatCategory = (cat) =>
  cat
    .split("_")
    .map((w) => w[0] + w.slice(1).toLowerCase())
    .join(" ");

export const formatMoney = (value, { withSign = false } = {}) => {
  const n = Number(value ?? 0);
  const formatted = n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  if (withSign && n > 0) return `+$${formatted}`;
  if (n < 0) return `-$${Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `$${formatted}`;
};

export const formatPercent = (value) => {
  const n = Number(value ?? 0);
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
};

export const formatDate = (value) => {
  if (!value) return "";
  // Force parse as local date — avoids the day-shift caused by "YYYY-MM-DD" being read as UTC.
  const [y, m, d] = String(value).slice(0, 10).split("-");
  if (!y || !m || !d) return value;
  return `${m}/${d}/${y}`;
};

export const currentMonthString = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

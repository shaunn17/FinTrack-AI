import { useLocation } from "react-router-dom";
import MonthYearPicker from "../shared/MonthYearPicker";

const MONTH_FILTERED_ROUTES = new Set(["/", "/budget", "/insights"]);

export default function PageWrapper({ children }) {
  const { pathname } = useLocation();
  const showMonthPicker = MONTH_FILTERED_ROUTES.has(pathname);

  return (
    <main className="md:ml-60 min-h-screen pb-20 md:pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 animate-fade-in">
        {showMonthPicker && (
          <div className="flex items-center justify-end gap-3 mb-5 pb-4 border-b border-border/60">
            <span className="text-xs uppercase tracking-wide text-text-muted hidden sm:inline">
              Period
            </span>
            <MonthYearPicker />
          </div>
        )}
        {children}
      </div>
    </main>
  );
}

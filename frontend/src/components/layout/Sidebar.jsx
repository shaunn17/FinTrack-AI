import { NavLink } from "react-router-dom";

const NAV = [
  { to: "/", label: "Dashboard", icon: DashboardIcon },
  { to: "/budget", label: "Budget", icon: BudgetIcon },
  { to: "/investments", label: "Investments", icon: InvestmentsIcon },
  { to: "/insights", label: "Insights", icon: InsightsIcon },
  { to: "/ask", label: "Ask FinTrack", icon: AskIcon },
];

export default function Sidebar() {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed top-0 left-0 h-screen w-60 flex-col bg-surface border-r border-border z-40">
        <div className="px-6 py-5 flex items-center gap-2 border-b border-border">
          <LogoMark />
          <span className="text-lg font-semibold tracking-tight">FinTrack</span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                  isActive
                    ? "bg-accent/10 text-accent border border-accent/20"
                    : "text-text-secondary hover:bg-white/5 hover:text-text-primary border border-transparent"
                }`
              }
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="px-4 py-3 text-[11px] text-text-muted border-t border-border">
          v0.1.0 · Personal Finance
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-surface border-t border-border z-40">
        <div className="grid grid-cols-5">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-2 text-[11px] gap-1 transition ${
                  isActive ? "text-accent" : "text-text-secondary"
                }`
              }
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  );
}

function LogoMark() {
  return (
    <svg viewBox="0 0 64 64" className="h-7 w-7">
      <rect width="64" height="64" rx="14" fill="#0f1117" />
      <path
        d="M14 44 L26 28 L34 36 L50 18"
        fill="none"
        stroke="#2dd4bf"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="50" cy="18" r="3.5" fill="#2dd4bf" />
    </svg>
  );
}

function DashboardIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  );
}
function BudgetIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M3 6h18M3 12h18M3 18h12" strokeLinecap="round" />
    </svg>
  );
}
function InvestmentsIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M3 17l6-6 4 4 8-8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 7h7v7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function InsightsIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M12 3a7 7 0 00-4 12.74V18a2 2 0 002 2h4a2 2 0 002-2v-2.26A7 7 0 0012 3z" />
      <path d="M9 22h6" strokeLinecap="round" />
    </svg>
  );
}
function AskIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path
        d="M21 15a4 4 0 01-4 4H8l-5 3V7a4 4 0 014-4h10a4 4 0 014 4v8z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M9 10h6M9 14h4" strokeLinecap="round" />
    </svg>
  );
}

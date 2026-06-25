import { Link } from "react-router-dom";
import Badge from "../shared/Badge";
import { formatMoney } from "../../styles/theme";
import { formatRelativeDate } from "../../utils/dashboardMetrics";

export default function ActivityFeed({ expenses, transactions, loading }) {
  const recentExpenses = (expenses || []).slice(0, 5);
  const recentTransactions = (transactions || []).slice(0, 5);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <FeedCard
        title="Recent Expenses"
        linkTo="/budget"
        linkLabel="View all expenses"
        loading={loading}
        emptyMessage="No expenses this month."
      >
        {recentExpenses.map((e) => (
          <FeedItem
            key={e.id}
            primary={<Badge category={e.category} />}
            meta={formatRelativeDate(e.date)}
            sub={e.note}
            amount={formatMoney(e.amount)}
          />
        ))}
      </FeedCard>

      <FeedCard
        title="Recent Transactions"
        linkTo="/investments"
        linkLabel="View all transactions"
        loading={loading}
        emptyMessage="No transactions logged."
      >
        {recentTransactions.map((t) => (
          <FeedItem
            key={t.id}
            primary={
              <span className="font-semibold text-text-primary">{t.ticker}</span>
            }
            meta={formatRelativeDate(t.date)}
            sub={`${Number(t.quantity)} sh @ ${formatMoney(t.buy_price)}`}
            amount={formatMoney(t.total_cost)}
          />
        ))}
      </FeedCard>
    </div>
  );
}

function FeedCard({
  title,
  linkTo,
  linkLabel,
  loading,
  emptyMessage,
  children,
}) {
  const items = Array.isArray(children)
    ? children.filter(Boolean)
    : children
      ? [children]
      : [];
  const isEmpty = items.length === 0;

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">{title}</h3>
        <Link to={linkTo} className="text-xs text-accent hover:underline">
          {linkLabel} →
        </Link>
      </div>

      {loading ? (
        <p className="text-sm text-text-muted">Loading…</p>
      ) : isEmpty ? (
        <p className="text-sm text-text-secondary">{emptyMessage}</p>
      ) : (
        <ul className="space-y-1">{items}</ul>
      )}
    </div>
  );
}

function FeedItem({ primary, meta, sub, amount }) {
  return (
    <li className="flex items-start justify-between gap-3 py-3 border-b border-border/40 last:border-0">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          {primary}
          <span className="text-[11px] text-text-muted">{meta}</span>
        </div>
        {sub && (
          <p className="text-sm text-text-secondary truncate mt-1">{sub}</p>
        )}
      </div>
      <span className="font-medium tabular-nums text-text-primary shrink-0">
        {amount}
      </span>
    </li>
  );
}

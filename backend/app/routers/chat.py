"""Ask FinTrack — conversational Q&A over the user's financial data."""

from __future__ import annotations

import calendar
import logging
from datetime import date as DateType
from typing import List, Literal

from fastapi import APIRouter, HTTPException
from postgrest.exceptions import APIError
from pydantic import BaseModel, Field

from ..db.database import supabase
from ..routers.budget import get_summary
from ..routers.investments import get_portfolio
from ..services.ai_service import generate_chat_reply
from ..utils.category_labels import format_category

router = APIRouter(prefix="/chat", tags=["chat"])
logger = logging.getLogger(__name__)

MIN_DATA_YEAR = 2026
MIN_DATA_MONTH = 5
CONTEXT_MONTHS = 6
RECENT_EXPENSE_LIMIT = 100
MAX_INVESTMENT_TX_DISPLAY = 50


class ChatTurn(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=4000)
    history: List[ChatTurn] = Field(default_factory=list)


class ChatResponse(BaseModel):
    reply: str


def _month_key(year: int, month: int) -> str:
    return f"{year:04d}-{month:02d}"


def _prev_month(year: int, month: int) -> tuple[int, int]:
    if month == 1:
        return year - 1, 12
    return year, month - 1


def _context_months(today: DateType | None = None) -> list[str]:
    """Last N months, but not before May 2026."""
    today = today or DateType.today()
    y, m = today.year, today.month
    out: list[str] = []
    for _ in range(CONTEXT_MONTHS):
        if (y, m) >= (MIN_DATA_YEAR, MIN_DATA_MONTH):
            out.append(_month_key(y, m))
        y, m = _prev_month(y, m)
    return list(reversed(out))


def _money(val) -> str:
    try:
        return f"${float(val):,.2f}"
    except (TypeError, ValueError):
        return "$0.00"


def _pg_error_text(exc: APIError) -> str:
    parts = [exc.message or "", exc.details or "", exc.hint or ""]
    return " ".join(p for p in parts if p).strip().lower()


def _month_bounds(months: list[str]) -> tuple[str, str]:
    """Inclusive ISO date range covering all months in the list."""
    start_bound = f"{months[0]}-01"
    last_y, last_m = map(int, months[-1].split("-"))
    last_day = calendar.monthrange(last_y, last_m)[1]
    end_bound = DateType(last_y, last_m, last_day).isoformat()
    return start_bound, end_bound


def _fetch_income_rows(start_bound: str, end_bound: str) -> list[dict]:
    """Load income lines; tolerate DBs without the optional `source` column."""

    def query(cols: str):
        return (
            supabase.table("monthly_income")
            .select(cols)
            .gte("month", start_bound)
            .lte("month", end_bound)
            .order("month", desc=True)
            .execute()
        )

    try:
        resp = query("month, amount, source, note")
        return resp.data or []
    except APIError as exc:
        detail = _pg_error_text(exc)
        if "source" in detail or "42703" in detail or "column" in detail:
            logger.warning(
                "monthly_income.source column missing; loading income without source"
            )
            resp = query("month, amount, note")
            return resp.data or []
        raise


def _format_category_breakdown(breakdown: list) -> str:
    if not breakdown:
        return "  (no expenses)"
    lines = []
    for item in breakdown:
        if isinstance(item, dict):
            cat = item.get("category", "")
            total = item.get("total", 0)
        else:
            cat = getattr(item, "category", "")
            total = getattr(item, "total", 0)
        lines.append(f"  - {format_category(cat)}: {_money(total)}")
    return "\n".join(lines) if lines else "  (no expenses)"


def _build_financial_context() -> str:
    today = DateType.today()
    months = _context_months(today)
    sections: list[str] = []

    sections.append(f"Today's date: {today.isoformat()}")

    # Monthly budget summaries
    budget_lines: list[str] = []
    for month in months:
        try:
            summary = get_summary(month)
            budget_lines.append(
                f"{summary.month} ({month}):\n"
                f"  Income: {_money(summary.income)}\n"
                f"  Total spent: {_money(summary.total_spent)}\n"
                f"  Savings: {_money(summary.savings)} ({float(summary.savings_rate):.1f}% of income)\n"
                f"  By category:\n{_format_category_breakdown(summary.category_breakdown)}"
            )
        except Exception as exc:
            logger.exception("Budget summary failed for %s", month)
            budget_lines.append(f"{month}: (summary unavailable)")
    sections.append(
        "MONTHLY BUDGET SUMMARIES (income, spending, savings, categories):\n"
        + ("\n\n".join(budget_lines) if budget_lines else "(no months in range)")
    )

    # Monthly income line items
    if months:
        try:
            start_bound, end_bound = _month_bounds(months)
            income_rows = _fetch_income_rows(start_bound, end_bound)
            if income_rows:
                inc_lines = []
                for row in income_rows:
                    src = row.get("source") or "Income"
                    note = row.get("note")
                    extra = f" — {note}" if note else ""
                    inc_lines.append(
                        f"  {row.get('month')}: {_money(row.get('amount'))} ({src}{extra})"
                    )
                sections.append("MONTHLY INCOME ENTRIES:\n" + "\n".join(inc_lines))
            else:
                sections.append("MONTHLY INCOME ENTRIES: (none recorded)")
        except Exception:
            logger.exception("Failed to load income entries for chat context")
            sections.append("MONTHLY INCOME ENTRIES: (not loaded)")

    # Expenses in context months (line items for month/week/day questions)
    if months:
        try:
            range_start, range_end = _month_bounds(months)
            exp_resp = (
                supabase.table("expenses")
                .select("date, category, amount, note")
                .gte("date", range_start)
                .lte("date", range_end)
                .order("date", desc=True)
                .limit(RECENT_EXPENSE_LIMIT)
                .execute()
            )
            expenses = exp_resp.data or []
            if expenses:
                exp_lines = []
                for row in expenses:
                    note = row.get("note") or ""
                    note_bit = f" — {note}" if note else ""
                    exp_lines.append(
                        f"  {row.get('date')}: {format_category(row.get('category', ''))} "
                        f"{_money(row.get('amount'))}{note_bit}"
                    )
                sections.append(
                    f"EXPENSE LINE ITEMS ({months[0]} through {months[-1]}, "
                    f"up to {RECENT_EXPENSE_LIMIT} entries):\n" + "\n".join(exp_lines)
                )
            else:
                sections.append(
                    f"EXPENSE LINE ITEMS ({months[0]} through {months[-1]}): (none recorded)"
                )
        except Exception:
            logger.exception("Failed to load expenses for chat context")
            sections.append("EXPENSE LINE ITEMS: (not loaded)")

    # Investment transactions
    try:
        tx_resp = (
            supabase.table("investment_transactions")
            .select("date, ticker, stock_name, quantity, buy_price, total_cost")
            .order("date", desc=True)
            .limit(MAX_INVESTMENT_TX_DISPLAY)
            .execute()
        )
        txs = tx_resp.data or []
        if txs:
            tx_lines = []
            for row in txs:
                name = row.get("stock_name") or row.get("ticker")
                tx_lines.append(
                    f"  {row.get('date')}: {row.get('ticker')} ({name}) "
                    f"qty {row.get('quantity')} @ {_money(row.get('buy_price'))} "
                    f"total {_money(row.get('total_cost'))}"
                )
            sections.append(
                f"INVESTMENT TRANSACTIONS (most recent {len(txs)}):\n" + "\n".join(tx_lines)
            )
        else:
            sections.append("INVESTMENT TRANSACTIONS: (none recorded)")
    except Exception:
        logger.exception("Failed to load investment transactions for chat context")
        sections.append("INVESTMENT TRANSACTIONS: (not loaded)")

    # Portfolio summary
    try:
        portfolio = get_portfolio()
        pos_lines = []
        for pos in portfolio.positions:
            cv = pos.current_value
            cv_str = _money(cv) if cv is not None else "n/a (price unavailable)"
            ng = pos.net_gain
            ng_str = _money(ng) if ng is not None else "n/a"
            ret = pos.return_pct
            ret_str = f"{ret:.1f}%" if ret is not None else "n/a"
            pos_lines.append(
                f"  {pos.ticker} ({pos.stock_name}): {float(pos.total_shares):g} shares, "
                f"cost {_money(pos.total_cost)}, value {cv_str}, gain {ng_str} ({ret_str})"
            )
        cv_total = portfolio.current_value
        cv_total_str = _money(cv_total) if cv_total is not None else "n/a"
        gain_total = portfolio.total_gain
        gain_total_str = _money(gain_total) if gain_total is not None else "n/a"
        ret_total = portfolio.overall_return_pct
        ret_total_str = f"{ret_total:.1f}%" if ret_total is not None else "n/a"
        unpriced = portfolio.unpriced_tickers or []
        unpriced_note = (
            f"\n  Note: live prices unavailable for: {', '.join(unpriced)}"
            if unpriced
            else ""
        )
        sections.append(
            "PORTFOLIO SUMMARY:\n"
            f"  Total invested: {_money(portfolio.total_invested)}\n"
            f"  Current value: {cv_total_str}\n"
            f"  Total gain: {gain_total_str} ({ret_total_str} overall)\n"
            "  Positions:\n"
            + ("\n".join(pos_lines) if pos_lines else "  (no positions)")
            + unpriced_note
        )
    except Exception:
        logger.exception("Failed to load portfolio for chat context")
        sections.append("PORTFOLIO SUMMARY: (not loaded)")

    return "\n\n".join(sections)


@router.post("", response_model=ChatResponse)
def chat(request: ChatRequest):
    message = request.message.strip()
    if not message:
        raise HTTPException(status_code=400, detail="message is required")

    context = _build_financial_context()

    history = [{"role": t.role, "content": t.content} for t in request.history[-10:]]

    try:
        reply = generate_chat_reply(message, context, history)
    except RuntimeError as exc:
        if "GROQ_API_KEY" in str(exc):
            raise HTTPException(
                status_code=503,
                detail="AI chat is not configured (GROQ_API_KEY missing).",
            ) from exc
        raise HTTPException(status_code=500, detail=f"AI error: {exc}") from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"AI error: {exc}") from exc

    if not reply:
        reply = (
            "I couldn't generate a reply right now. Please try again in a moment."
        )

    return ChatResponse(reply=reply)

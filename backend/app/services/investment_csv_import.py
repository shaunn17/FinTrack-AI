"""Parse investment CSV exports (e.g. Date, Name/ticker, Buy Price, Quantity, Total Cost)."""

from __future__ import annotations

import csv
import io
from datetime import datetime
from decimal import Decimal, InvalidOperation
from typing import Any

# Flexible header aliases (normalized: lower strip spaces)
DATE_KEYS = frozenset({"date", "trade date", "purchase date"})
TICKER_KEYS = frozenset({"name", "ticker", "symbol", "stock", "ticker symbol"})
BUY_KEYS = frozenset({"buy price", "buy_price", "price", "cost per share", "share price"})
QTY_KEYS = frozenset({"quantity", "qty", "shares", "amount"})
TOTAL_KEYS = frozenset(
    {"total cost", "total cost price", "total_cost", "total", "cost", "amount total"}
)


def _norm_key(h: str) -> str:
    return " ".join(h.strip().lower().split())


def _parse_money(raw: Any) -> Decimal | None:
    if raw is None:
        return None
    s = str(raw).strip().replace("$", "").replace(",", "").strip()
    if not s or s in ("-", "—", "n/a", "na"):
        return None
    try:
        v = Decimal(s)
        return v if v >= 0 else None
    except (InvalidOperation, ValueError):
        return None


def _parse_quantity(raw: Any) -> Decimal | None:
    if raw is None:
        return None
    s = str(raw).strip().replace(",", "")
    if not s:
        return None
    try:
        v = Decimal(s)
        return v if v > 0 else None
    except (InvalidOperation, ValueError):
        return None


def _parse_date(raw: Any) -> datetime | None:
    if raw is None:
        return None
    s = str(raw).strip()
    if not s:
        return None
    for fmt in ("%d/%m/%Y", "%m/%d/%Y", "%Y-%m-%d"):
        try:
            return datetime.strptime(s, fmt)
        except ValueError:
            continue
    return None


def _pick_column(fieldnames: list[str], candidates: frozenset[str]) -> str | None:
    mapping = {_norm_key(f): f for f in fieldnames}
    for c in candidates:
        if c in mapping:
            return mapping[c]
    return None


def parse_investment_csv(
    content: bytes | str,
) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    """Return (rows_ready_for_db, skipped_rows_with_reason).

    Each ready row: date (iso), ticker, stock_name, buy_price, quantity, total_cost, ask_price None
    """
    if isinstance(content, bytes):
        text = content.decode("utf-8-sig", errors="replace")
    else:
        text = content
    reader = csv.DictReader(io.StringIO(text))
    if not reader.fieldnames:
        return [], [{"row": 0, "reason": "No CSV headers found"}]

    fn = list(reader.fieldnames)
    col_date = _pick_column(fn, DATE_KEYS)
    col_ticker = _pick_column(fn, TICKER_KEYS)
    col_buy = _pick_column(fn, BUY_KEYS)
    col_qty = _pick_column(fn, QTY_KEYS)
    col_total = _pick_column(fn, TOTAL_KEYS)

    missing = [k for k, v in [
        ("Date", col_date),
        ("Ticker/Name", col_ticker),
        ("Quantity", col_qty),
    ] if not v]
    if not col_buy and not col_total:
        missing.append("Buy Price or Total Cost")
    if missing:
        return [], [
            {
                "row": 0,
                "reason": f"Missing required columns: {', '.join(missing)}. Found: {fn}",
            }
        ]

    ready: list[dict[str, Any]] = []
    skipped: list[dict[str, Any]] = []

    for i, row in enumerate(reader, start=2):
        raw_ticker = (row.get(col_ticker) or "").strip() if col_ticker else ""
        if not raw_ticker:
            skipped.append({"row": i, "reason": "Empty ticker"})
            continue

        dt = _parse_date(row.get(col_date) if col_date else None)
        if not dt:
            skipped.append({"row": i, "reason": "Invalid or empty date", "ticker": raw_ticker})
            continue

        qty_raw = _parse_quantity(row.get(col_qty) if col_qty else None)
        if qty_raw is None:
            skipped.append({"row": i, "reason": "Invalid quantity", "ticker": raw_ticker})
            continue

        buy = _parse_money(row.get(col_buy) if col_buy else None)
        total = _parse_money(row.get(col_total) if col_total else None)

        if buy is None and total is not None and qty_raw > 0:
            buy = (total / qty_raw).quantize(Decimal("0.0001"))
        if total is None and buy is not None:
            total = (buy * qty_raw).quantize(Decimal("0.01"))

        if buy is None or buy <= 0:
            skipped.append(
                {"row": i, "reason": "Missing or invalid buy price", "ticker": raw_ticker}
            )
            continue
        if total is None or total <= 0:
            skipped.append(
                {"row": i, "reason": "Missing or zero total cost", "ticker": raw_ticker}
            )
            continue

        ticker = raw_ticker.upper()
        # Use ticker as display name for bulk import (Yahoo lookup per row hits rate limits).
        stock_name = ticker

        ready.append(
            {
                "date": dt.date().isoformat(),
                "ticker": ticker,
                "stock_name": stock_name,
                "buy_price": float(buy),
                "ask_price": None,
                "quantity": float(qty_raw),
                "total_cost": float(total),
            }
        )

    return ready, skipped


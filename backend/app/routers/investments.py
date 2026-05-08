"""Investment Portfolio router."""

from __future__ import annotations

from collections import defaultdict
import os
import time
from datetime import date as DateType
from datetime import datetime, timezone
from decimal import Decimal
from typing import Dict

from fastapi import APIRouter, File, HTTPException, UploadFile

from ..db.database import supabase
from ..models.investments import (
    CsvImportResult,
    PortfolioPosition,
    PortfolioSummary,
    TransactionIn,
)
from ..services.investment_csv_import import parse_investment_csv
from ..services.stock_service import get_current_price, invalidate_price_cache

router = APIRouter(prefix="/investments", tags=["investments"])


def _batch_prices(tickers: list[str]) -> Dict[str, float | None]:
    """Fetch live prices one-by-one with a short pause to reduce Yahoo 429 rate limits."""

    out: Dict[str, float | None] = {t: None for t in tickers}
    if not tickers:
        return out
    stagger = max(0.0, float(os.environ.get("QUOTE_FETCH_STAGGER_SEC", "0.25")))
    for i, t in enumerate(tickers):
        if i > 0 and stagger > 0:
            time.sleep(stagger)
        try:
            out[t] = get_current_price(t)
        except Exception:
            out[t] = None
    return out


def _serialize(payload: dict) -> dict:
    out: dict = {}
    for k, v in payload.items():
        if isinstance(v, DateType):
            out[k] = v.isoformat()
        elif isinstance(v, Decimal):
            out[k] = float(v)
        else:
            out[k] = v
    return out


@router.post("/transactions")
def create_transaction(payload: TransactionIn):
    body = payload.model_dump()
    if body.get("total_cost") is None:
        body["total_cost"] = body["buy_price"] * body["quantity"]
    body = _serialize(body)
    result = supabase.table("investment_transactions").insert(body).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create transaction")
    invalidate_price_cache([str(payload.ticker)])
    return result.data[0]


@router.get("/transactions")
def list_transactions():
    result = (
        supabase.table("investment_transactions")
        .select("*")
        .order("date", desc=True)
        .execute()
    )
    return result.data or []


@router.post("/import-csv", response_model=CsvImportResult)
async def import_transactions_csv(
    file: UploadFile = File(...),
    dry_run: bool = False,
):
    """Upload a CSV with columns like Date, Name (ticker), Buy Price, Quantity, Total Cost."""

    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Upload a .csv file.")

    raw = await file.read()
    if not raw or len(raw) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File empty or larger than 5 MB.")

    ready, skipped = parse_investment_csv(raw)
    if not ready and skipped and skipped[0].get("row") == 0:
        raise HTTPException(status_code=400, detail=skipped[0].get("reason", "Invalid CSV"))

    if dry_run:
        return CsvImportResult(
            imported=0,
            dry_run=True,
            ready_count=len(ready),
            skipped=skipped,
            message=f"Dry run: {len(ready)} row(s) would import, {len(skipped)} skipped.",
        )

    imported = 0
    batch: list[dict] = []
    batch_size = 75

    for row in ready:
        batch.append(row)
        if len(batch) >= batch_size:
            result = supabase.table("investment_transactions").insert(batch).execute()
            imported += len(result.data or batch)
            batch = []

    if batch:
        result = supabase.table("investment_transactions").insert(batch).execute()
        imported += len(result.data or batch)

    if imported > 0:
        invalidate_price_cache(
            sorted({str(r["ticker"]).strip().upper() for r in ready})
        )

    return CsvImportResult(
        imported=imported,
        dry_run=False,
        ready_count=len(ready),
        skipped=skipped,
        message=f"Imported {imported} transaction(s). {len(skipped)} row(s) skipped.",
    )


@router.delete("/transactions/{transaction_id}")
def delete_transaction(transaction_id: str):
    result = (
        supabase.table("investment_transactions")
        .delete()
        .eq("id", transaction_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return {"deleted": True, "id": transaction_id}


@router.get("/portfolio", response_model=PortfolioSummary)
def get_portfolio():
    result = supabase.table("investment_transactions").select("*").execute()
    rows = result.data or []

    by_ticker: Dict[str, dict] = defaultdict(
        lambda: {
            "ticker": "",
            "stock_name": "",
            "total_shares": Decimal("0"),
            "total_cost": Decimal("0"),
        }
    )

    for row in rows:
        ticker = str(row["ticker"]).strip().upper()
        bucket = by_ticker[ticker]
        bucket["ticker"] = ticker
        bucket["stock_name"] = row.get("stock_name") or ticker
        bucket["total_shares"] += Decimal(str(row["quantity"]))
        bucket["total_cost"] += Decimal(str(row["total_cost"]))

    positions: list[PortfolioPosition] = []
    total_invested = Decimal("0")
    sum_market_value = Decimal("0")
    unpriced: list[str] = []

    tickers = list(by_ticker.keys())
    prices = _batch_prices(tickers)
    quotes_fetched_at = datetime.now(timezone.utc) if tickers else None

    for ticker, bucket in by_ticker.items():
        shares: Decimal = bucket["total_shares"]
        cost: Decimal = bucket["total_cost"]
        avg_buy = (cost / shares) if shares > 0 else Decimal("0")

        live = prices.get(ticker)
        current_price = Decimal(str(live)) if live is not None else None
        current_value = (
            current_price * shares if current_price is not None else None
        )
        net_gain = (
            (current_value - cost) if current_value is not None else None
        )
        return_pct = (
            float((net_gain / cost) * 100)
            if (net_gain is not None and cost > 0)
            else None
        )

        if current_value is not None:
            sum_market_value += current_value
        else:
            unpriced.append(ticker)

        positions.append(
            PortfolioPosition(
                ticker=ticker,
                stock_name=bucket["stock_name"],
                total_shares=shares,
                avg_buy_price=avg_buy,
                total_cost=cost,
                current_price=current_price,
                current_value=current_value,
                net_gain=net_gain,
                return_pct=round(return_pct, 2) if return_pct is not None else None,
            )
        )

        total_invested += cost

    live_complete = len(unpriced) == 0 and len(by_ticker) > 0
    empty = len(by_ticker) == 0

    if empty:
        portfolio_current_value = Decimal("0")
        total_gain = Decimal("0")
        overall_return = 0.0
    elif live_complete:
        portfolio_current_value = sum_market_value
        total_gain = portfolio_current_value - total_invested
        overall_return = (
            float((total_gain / total_invested) * 100) if total_invested > 0 else 0.0
        )
    else:
        portfolio_current_value = None
        total_gain = None
        overall_return = None

    positions.sort(key=lambda p: p.ticker)

    return PortfolioSummary(
        total_invested=total_invested,
        current_value=portfolio_current_value,
        total_gain=total_gain,
        overall_return_pct=round(overall_return, 2)
        if overall_return is not None
        else None,
        positions=positions,
        quotes_fetched_at=quotes_fetched_at,
        unpriced_tickers=sorted(unpriced),
    )

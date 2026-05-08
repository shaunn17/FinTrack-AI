"""Pydantic models for the Investment Portfolio domain."""

from __future__ import annotations

from datetime import date as DateType
from datetime import datetime
from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel, Field, field_validator


class TransactionIn(BaseModel):
    date: DateType
    ticker: str
    stock_name: str
    buy_price: Decimal = Field(..., ge=0)
    ask_price: Optional[Decimal] = Field(default=None, ge=0)
    quantity: Decimal = Field(..., gt=0)
    total_cost: Optional[Decimal] = Field(default=None, ge=0)

    @field_validator("ticker")
    @classmethod
    def _normalize_ticker(cls, value: str) -> str:
        return value.strip().upper()


class TransactionOut(TransactionIn):
    id: str
    total_cost: Decimal


class PortfolioPosition(BaseModel):
    ticker: str
    stock_name: str
    total_shares: Decimal
    avg_buy_price: Decimal
    total_cost: Decimal
    current_price: Optional[Decimal] = None
    current_value: Optional[Decimal] = None
    net_gain: Optional[Decimal] = None
    return_pct: Optional[float] = None


class PortfolioSummary(BaseModel):
    total_invested: Decimal
    # Sum of (live_price × shares) across all positions — only set when every ticker has a quote.
    current_value: Optional[Decimal] = None
    total_gain: Optional[Decimal] = None
    overall_return_pct: Optional[float] = None
    positions: List[PortfolioPosition]
    quotes_fetched_at: Optional[datetime] = None
    unpriced_tickers: List[str] = Field(default_factory=list)


class StockInfo(BaseModel):
    ticker: str
    name: str
    current_price: Optional[float] = None
    error: Optional[str] = None


class CsvImportResult(BaseModel):
    imported: int
    dry_run: bool
    ready_count: int
    skipped: List[dict]
    message: str

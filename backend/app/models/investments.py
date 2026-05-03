"""Pydantic models for the Investment Portfolio domain."""

from __future__ import annotations

from datetime import date as DateType
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
    current_value: Decimal
    total_gain: Decimal
    overall_return_pct: float
    positions: List[PortfolioPosition]


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

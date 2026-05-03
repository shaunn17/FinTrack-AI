"""Pydantic models for the Budget & Spending domain."""

from __future__ import annotations

from datetime import date as DateType
from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel, Field, field_validator

# Canonical list of expense categories. Mirrors the constant on the frontend.
EXPENSE_CATEGORIES: List[str] = [
    "GROCERIES",
    "SUBSCRIPTIONS",
    "RENT",
    "UTILITIES",
    "TRANSPORT",
    "DINING_OUT_FOOD",
    "ENTERTAINMENT",
    "STUDENT_LOANS_DEBT",
    "MISCELLANEOUS",
]


def _validate_category(value: str) -> str:
    upper = value.upper()
    if upper not in EXPENSE_CATEGORIES:
        raise ValueError(
            f"Invalid category '{value}'. Must be one of: {', '.join(EXPENSE_CATEGORIES)}"
        )
    return upper


class IncomeIn(BaseModel):
    """Payload for creating or updating a monthly income entry."""

    month: DateType = Field(..., description="First day of the month, YYYY-MM-DD")
    amount: Decimal = Field(..., ge=0)
    note: Optional[str] = None


class IncomeOut(IncomeIn):
    id: str


class ExpenseIn(BaseModel):
    date: DateType
    category: str
    amount: Decimal = Field(..., ge=0)
    note: Optional[str] = None

    @field_validator("category")
    @classmethod
    def _check_category(cls, value: str) -> str:
        return _validate_category(value)


class ExpenseOut(ExpenseIn):
    id: str


class BudgetCapIn(BaseModel):
    month: DateType
    category: str
    cap_amount: Decimal = Field(..., ge=0)

    @field_validator("category")
    @classmethod
    def _check_category(cls, value: str) -> str:
        return _validate_category(value)


class BudgetCapOut(BudgetCapIn):
    id: str


class CategoryTotal(BaseModel):
    category: str
    total: Decimal


class BudgetSummary(BaseModel):
    month: str
    income: Decimal
    total_spent: Decimal
    savings: Decimal
    savings_rate: float
    category_breakdown: List[CategoryTotal]

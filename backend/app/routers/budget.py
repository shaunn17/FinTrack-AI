"""Budget & Spending router."""

from __future__ import annotations

import calendar
from collections import defaultdict
from datetime import date as DateType, datetime
from decimal import Decimal
from typing import List

from fastapi import APIRouter, HTTPException

from ..db.database import supabase
from ..models.budget import (
    EXPENSE_CATEGORIES,
    BudgetCapIn,
    BudgetSummary,
    CategoryTotal,
    ExpenseIn,
    IncomeIn,
)

router = APIRouter(prefix="/budget", tags=["budget"])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _parse_month(month: str) -> tuple[str, str]:
    """Return (start_iso, end_iso) inclusive bounds for a YYYY-MM string."""
    try:
        dt = datetime.strptime(month, "%Y-%m")
    except ValueError:
        raise HTTPException(status_code=400, detail="month must be in YYYY-MM format")
    last_day = calendar.monthrange(dt.year, dt.month)[1]
    start = DateType(dt.year, dt.month, 1).isoformat()
    end = DateType(dt.year, dt.month, last_day).isoformat()
    return start, end


def _month_first_day(month: str) -> str:
    start, _ = _parse_month(month)
    return start


def _serialize(payload: dict) -> dict:
    """Coerce date/Decimal types to JSON-friendly primitives."""
    out: dict = {}
    for key, value in payload.items():
        if isinstance(value, DateType):
            out[key] = value.isoformat()
        elif isinstance(value, Decimal):
            out[key] = float(value)
        else:
            out[key] = value
    return out


# ---------------------------------------------------------------------------
# Income
# ---------------------------------------------------------------------------

@router.post("/income")
def upsert_income(payload: IncomeIn):
    """Create or update the monthly income entry for a given month."""
    month_first = DateType(payload.month.year, payload.month.month, 1).isoformat()
    body = _serialize(payload.model_dump())
    body["month"] = month_first

    existing = (
        supabase.table("monthly_income")
        .select("id")
        .eq("month", month_first)
        .execute()
    )

    if existing.data:
        row_id = existing.data[0]["id"]
        result = (
            supabase.table("monthly_income")
            .update(body)
            .eq("id", row_id)
            .execute()
        )
        return result.data[0] if result.data else {"id": row_id, **body}

    result = supabase.table("monthly_income").insert(body).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create income entry")
    return result.data[0]


@router.get("/income/{month}")
def get_income(month: str):
    month_first = _month_first_day(month)
    result = (
        supabase.table("monthly_income")
        .select("*")
        .eq("month", month_first)
        .execute()
    )
    if not result.data:
        return {"month": month_first, "amount": 0, "note": None, "id": None}
    return result.data[0]


# ---------------------------------------------------------------------------
# Expenses
# ---------------------------------------------------------------------------

@router.post("/expenses")
def create_expense(payload: ExpenseIn):
    body = _serialize(payload.model_dump())
    result = supabase.table("expenses").insert(body).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create expense")
    return result.data[0]


@router.get("/expenses/{month}")
def list_expenses(month: str):
    start, end = _parse_month(month)
    result = (
        supabase.table("expenses")
        .select("*")
        .gte("date", start)
        .lte("date", end)
        .order("date", desc=True)
        .execute()
    )
    return result.data or []


@router.delete("/expenses/{expense_id}")
def delete_expense(expense_id: str):
    result = supabase.table("expenses").delete().eq("id", expense_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Expense not found")
    return {"deleted": True, "id": expense_id}


# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------

@router.get("/summary/{month}", response_model=BudgetSummary)
def get_summary(month: str):
    start, end = _parse_month(month)
    month_first = start

    income_resp = (
        supabase.table("monthly_income")
        .select("amount")
        .eq("month", month_first)
        .execute()
    )
    income = Decimal("0")
    if income_resp.data:
        income = Decimal(str(income_resp.data[0]["amount"]))

    expenses_resp = (
        supabase.table("expenses")
        .select("category, amount")
        .gte("date", start)
        .lte("date", end)
        .execute()
    )

    totals: dict[str, Decimal] = defaultdict(lambda: Decimal("0"))
    total_spent = Decimal("0")
    for row in expenses_resp.data or []:
        amt = Decimal(str(row["amount"]))
        totals[row["category"]] += amt
        total_spent += amt

    breakdown: List[CategoryTotal] = [
        CategoryTotal(category=cat, total=totals.get(cat, Decimal("0")))
        for cat in EXPENSE_CATEGORIES
        if totals.get(cat, Decimal("0")) > 0
    ]

    savings = income - total_spent
    savings_rate = float((savings / income) * 100) if income > 0 else 0.0

    return BudgetSummary(
        month=month_first,
        income=income,
        total_spent=total_spent,
        savings=savings,
        savings_rate=round(savings_rate, 2),
        category_breakdown=breakdown,
    )


# ---------------------------------------------------------------------------
# Budget caps
# ---------------------------------------------------------------------------

@router.post("/caps")
def upsert_cap(payload: BudgetCapIn):
    month_first = DateType(payload.month.year, payload.month.month, 1).isoformat()
    body = _serialize(payload.model_dump())
    body["month"] = month_first

    existing = (
        supabase.table("budget_caps")
        .select("id")
        .eq("month", month_first)
        .eq("category", payload.category)
        .execute()
    )

    if existing.data:
        row_id = existing.data[0]["id"]
        result = (
            supabase.table("budget_caps")
            .update(body)
            .eq("id", row_id)
            .execute()
        )
        return result.data[0] if result.data else {"id": row_id, **body}

    result = supabase.table("budget_caps").insert(body).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create budget cap")
    return result.data[0]


@router.get("/caps/{month}")
def list_caps(month: str):
    month_first = _month_first_day(month)
    result = (
        supabase.table("budget_caps")
        .select("*")
        .eq("month", month_first)
        .execute()
    )
    return result.data or []


@router.get("/categories")
def list_categories():
    """Expose the canonical category list to the frontend."""
    return EXPENSE_CATEGORIES

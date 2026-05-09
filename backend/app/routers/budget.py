"""Budget & Spending router."""

from __future__ import annotations

import calendar
from collections import defaultdict
from datetime import date as DateType, datetime
from decimal import Decimal
from typing import List

from fastapi import APIRouter, HTTPException
from postgrest.exceptions import APIError

from ..db.database import supabase
from ..models.budget import (
    EXPENSE_CATEGORIES,
    BudgetCapIn,
    BudgetSummary,
    CategoryTotal,
    ExpenseIn,
    IncomeIn,
    IncomeEntryOut,
    IncomeMonthOut,
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

def _pg_error_detail(exc: APIError) -> str:
    parts = [exc.message or "", exc.details or "", exc.hint or ""]
    return " ".join(p for p in parts if p).strip() or repr(exc)


def _income_insert_body(payload: IncomeIn) -> dict:
    month_first = DateType(payload.month.year, payload.month.month, 1).isoformat()
    body = _serialize(payload.model_dump())
    body["month"] = month_first
    if "source" in body and body["source"] is None:
        body.pop("source", None)
    if "note" in body and body["note"] is None:
        body.pop("note", None)
    return body


@router.post("/income")
def add_income(payload: IncomeIn):
    """Append one income line for the month (multiple employers / paychecks supported)."""

    body = _income_insert_body(payload)

    try:
        result = supabase.table("monthly_income").insert(body).execute()
    except APIError as exc:
        detail_l = _pg_error_detail(exc).lower()
        # Older DBs without `source` column: fold source into note and retry once.
        if body.get("source") and (
            "source" in detail_l
            or "column" in detail_l
            or "42703" in detail_l
            or "schema" in detail_l
        ):
            fb = {k: v for k, v in body.items() if k != "source"}
            src = body.get("source") or ""
            orig_note = fb.pop("note", None)
            merged = f"Source: {src}" + (f" — {orig_note}" if orig_note else "")
            fb["note"] = merged.strip()
            try:
                result = supabase.table("monthly_income").insert(fb).execute()
            except APIError as exc2:
                raise HTTPException(
                    status_code=502,
                    detail=_pg_error_detail(exc2)
                    + " If `monthly_income` is missing the `source` column, run: "
                    "ALTER TABLE monthly_income ADD COLUMN IF NOT EXISTS source TEXT;",
                ) from exc2
        else:
            raise HTTPException(status_code=502, detail=_pg_error_detail(exc)) from exc

    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create income entry")
    return result.data[0]


@router.get("/income/{month}", response_model=IncomeMonthOut)
def get_income(month: str):
    month_first = _month_first_day(month)
    try:
        result = (
            supabase.table("monthly_income")
            .select("*")
            .eq("month", month_first)
            .order("created_at", desc=True)
            .execute()
        )
    except APIError as exc:
        raise HTTPException(status_code=502, detail=_pg_error_detail(exc)) from exc
    rows = result.data or []
    total = Decimal("0")
    entries: List[IncomeEntryOut] = []
    for row in rows:
        amt = Decimal(str(row["amount"]))
        total += amt
        entries.append(
            IncomeEntryOut(
                id=str(row["id"]),
                month=str(row["month"]),
                amount=amt,
                source=row.get("source"),
                note=row.get("note"),
                created_at=row["created_at"] if row.get("created_at") else None,
            )
        )
    return IncomeMonthOut(month=month_first, total_amount=total, entries=entries)


@router.delete("/income/{entry_id}")
def delete_income_entry(entry_id: str):
    result = supabase.table("monthly_income").delete().eq("id", entry_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Income entry not found")
    return {"deleted": True, "id": entry_id}


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
    for row in income_resp.data or []:
        income += Decimal(str(row["amount"]))

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

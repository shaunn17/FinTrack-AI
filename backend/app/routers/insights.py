"""AI insights & financial health score router."""

from __future__ import annotations

import calendar
import json
from datetime import date as DateType, datetime
from decimal import Decimal

from fastapi import APIRouter, HTTPException

from ..db.database import supabase
from ..routers.budget import get_summary
from ..routers.investments import get_portfolio
from ..services.ai_service import generate_health_score, generate_spending_insights

router = APIRouter(prefix="/insights", tags=["insights"])


def _month_first_day(month: str) -> str:
    try:
        dt = datetime.strptime(month, "%Y-%m")
    except ValueError:
        raise HTTPException(status_code=400, detail="month must be in YYYY-MM format")
    return DateType(dt.year, dt.month, 1).isoformat()


def _to_jsonable(obj):
    if isinstance(obj, Decimal):
        return float(obj)
    if isinstance(obj, DateType):
        return obj.isoformat()
    if hasattr(obj, "model_dump"):
        return _to_jsonable(obj.model_dump())
    if isinstance(obj, dict):
        return {k: _to_jsonable(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_to_jsonable(v) for v in obj]
    return obj


# ---------------------------------------------------------------------------
# Spending insights
# ---------------------------------------------------------------------------

@router.post("/generate/{month}")
def generate_insight(month: str):
    month_first = _month_first_day(month)
    summary = get_summary(month)
    summary_dict = _to_jsonable(summary)
    summary_dict["month"] = month_first

    try:
        text = generate_spending_insights(summary_dict)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"AI error: {exc}")

    existing = (
        supabase.table("insights")
        .select("id")
        .eq("month", month_first)
        .execute()
    )

    body = {"month": month_first, "insight_text": text}
    if existing.data:
        row_id = existing.data[0]["id"]
        result = (
            supabase.table("insights")
            .update(body)
            .eq("id", row_id)
            .execute()
        )
        return result.data[0] if result.data else {"id": row_id, **body}

    result = supabase.table("insights").insert(body).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to store insight")
    return result.data[0]


@router.get("/{month}")
def get_insight(month: str):
    month_first = _month_first_day(month)
    result = (
        supabase.table("insights")
        .select("*")
        .eq("month", month_first)
        .order("generated_at", desc=True)
        .limit(1)
        .execute()
    )
    if not result.data:
        return {"month": month_first, "insight_text": None}
    return result.data[0]


# ---------------------------------------------------------------------------
# Health score
# ---------------------------------------------------------------------------

@router.post("/health-score/{month}")
def generate_health_score_for_month(month: str):
    month_first = _month_first_day(month)
    summary = _to_jsonable(get_summary(month))
    summary["month"] = month_first
    portfolio = _to_jsonable(get_portfolio())

    try:
        scored = generate_health_score(summary, portfolio)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"AI error: {exc}")

    body = {
        "month": month_first,
        "score": scored.get("score", 0),
        "breakdown": scored,
    }

    existing = (
        supabase.table("health_scores")
        .select("id")
        .eq("month", month_first)
        .execute()
    )

    if existing.data:
        row_id = existing.data[0]["id"]
        result = (
            supabase.table("health_scores")
            .update(body)
            .eq("id", row_id)
            .execute()
        )
        return result.data[0] if result.data else {"id": row_id, **body}

    result = supabase.table("health_scores").insert(body).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to store health score")
    return result.data[0]


@router.get("/health-score/{month}")
def get_health_score(month: str):
    month_first = _month_first_day(month)
    result = (
        supabase.table("health_scores")
        .select("*")
        .eq("month", month_first)
        .order("generated_at", desc=True)
        .limit(1)
        .execute()
    )
    if not result.data:
        return {"month": month_first, "score": None, "breakdown": None}
    row = result.data[0]
    if isinstance(row.get("breakdown"), str):
        try:
            row["breakdown"] = json.loads(row["breakdown"])
        except Exception:
            pass
    return row

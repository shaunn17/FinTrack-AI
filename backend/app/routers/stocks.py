"""Stock lookup router."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from ..services.stock_service import get_stock_info

router = APIRouter(prefix="/stocks", tags=["stocks"])


@router.get("/search")
def search_stock(ticker: str = Query(..., description="Stock ticker, e.g. NVDA")):
    info = get_stock_info(ticker)
    if info.get("error"):
        raise HTTPException(status_code=404, detail=info["error"])
    return info

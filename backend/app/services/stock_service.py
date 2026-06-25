"""Stock data service backed by Yahoo chart API with yfinance fallback."""

from __future__ import annotations

import os
import threading
import time
from typing import Dict, List, Optional

import yfinance as yf
from yfinance.data import YfData

_YAHOO_CHART_URL = "https://query1.finance.yahoo.com/v8/finance/chart/{symbol}"

# Short-lived server cache so portfolio loads stay fast and Yahoo isn't hammered.
_price_lock = threading.Lock()
_price_cache: dict[str, tuple[float, float]] = {}
_fail_cache: dict[str, float] = {}
_CACHE_TTL = max(15, int(os.environ.get("QUOTE_CACHE_TTL_SECONDS", "90")))
_FAIL_CACHE_TTL = max(3, int(os.environ.get("QUOTE_FAIL_CACHE_TTL_SECONDS", "5")))


def _yahoo_chart_quote(symbol: str) -> dict | None:
    """Fetch price + name from Yahoo chart API (one lightweight call)."""

    url = _YAHOO_CHART_URL.format(symbol=symbol)
    try:
        resp = YfData().get(
            url, params={"interval": "1d", "range": "1d"}, timeout=12
        )
        if resp.status_code != 200:
            return None
        payload = resp.json()
    except Exception:
        return None

    results = (payload.get("chart") or {}).get("result")
    if not results:
        return None

    meta = results[0].get("meta") or {}
    price = (
        meta.get("regularMarketPrice")
        or meta.get("previousClose")
        or meta.get("chartPreviousClose")
    )
    if price is None:
        return None

    try:
        price_f = float(price)
    except (TypeError, ValueError):
        return None

    name = meta.get("longName") or meta.get("shortName") or symbol
    return {"price": price_f, "name": name}


def _yfinance_quote(symbol: str) -> dict | None:
    """Single-shot yfinance fallback (fast_info only — no info/history chain)."""

    try:
        fi = yf.Ticker(symbol).fast_info
        price = (
            getattr(fi, "last_price", None)
            or getattr(fi, "regular_market_price", None)
            or getattr(fi, "previous_close", None)
        )
        if price is None:
            return None
        return {"price": float(price), "name": symbol}
    except Exception:
        return None


def _resolve_quote(symbol: str) -> dict | None:
    quote = _yahoo_chart_quote(symbol)
    if quote is not None:
        return quote
    return _yfinance_quote(symbol)


def get_stock_info(ticker: str) -> Dict:
    """Return ``{ticker, name, current_price}`` for the given symbol.

    On failure returns ``{ticker, name, current_price: None, error: <msg>}``.
    """

    symbol = (ticker or "").strip().upper()
    if not symbol:
        return {
            "ticker": "",
            "name": "",
            "current_price": None,
            "error": "Ticker is required.",
        }

    quote = _resolve_quote(symbol)
    if quote is None:
        return {
            "ticker": symbol,
            "name": symbol,
            "current_price": None,
            "error": f"Could not fetch a current price for '{symbol}'.",
        }

    return {
        "ticker": symbol,
        "name": quote["name"],
        "current_price": quote["price"],
    }


def invalidate_price_cache(symbols: Optional[List[str]] = None) -> None:
    """Clear cached quotes (all, or only the given tickers). Call after CSV import / new lots."""

    with _price_lock:
        if not symbols:
            _price_cache.clear()
            _fail_cache.clear()
            return
        for raw in symbols:
            sym = (raw or "").strip().upper()
            if sym:
                _price_cache.pop(sym, None)
                _fail_cache.pop(sym, None)


def get_current_price(ticker: str) -> float | None:
    """Convenience wrapper used by the portfolio aggregator (cached, TTL per env)."""
    symbol = (ticker or "").strip().upper()
    if not symbol:
        return None

    now = time.time()
    with _price_lock:
        hit = _price_cache.get(symbol)
        if hit is not None:
            cached_price, expires = hit
            if now < expires:
                return cached_price

        fail_exp = _fail_cache.get(symbol)
        if fail_exp is not None and now < fail_exp:
            return None

    quote = _resolve_quote(symbol)
    price = quote["price"] if quote else None

    with _price_lock:
        if price is not None:
            _price_cache[symbol] = (price, now + _CACHE_TTL)
            _fail_cache.pop(symbol, None)
        else:
            _price_cache.pop(symbol, None)
            _fail_cache[symbol] = now + _FAIL_CACHE_TTL

    return price

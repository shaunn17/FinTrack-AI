"""Stock data service backed by yfinance."""

from __future__ import annotations

import csv
import io
import os
import re
import threading
import time
from typing import Dict, List, Optional
from urllib.error import URLError
from urllib.request import Request, urlopen

import yfinance as yf

# Simple US ticker → Stooq symbol (e.g. AAPL → aapl.us). Skips dots/suffix tickers.
_US_TICKER = re.compile(r"^[A-Z]{1,5}$")

# Short-lived server cache so portfolio loads stay fast and Yahoo isn’t hammered.
_price_lock = threading.Lock()
_price_cache: dict[str, tuple[float | None, float]] = {}
_CACHE_TTL = max(15, int(os.environ.get("QUOTE_CACHE_TTL_SECONDS", "90")))


def _stooq_us_last_price(symbol: str) -> float | None:
    """Fallback last price via Stooq CSV (no API key). US symbols only."""

    if not _US_TICKER.match(symbol):
        return None
    stooq_sym = f"{symbol.lower()}.us"
    url = f"https://stooq.com/q/l/?s={stooq_sym}&f=sd2t2ohlcv&h&e=csv"
    req = Request(url, headers={"User-Agent": "FinTrack/1.0"})
    try:
        with urlopen(req, timeout=12) as resp:
            text = resp.read().decode("utf-8", errors="replace")
    except (URLError, OSError, TimeoutError, ValueError):
        return None

    rows = list(csv.reader(io.StringIO(text.strip())))
    if len(rows) < 2:
        return None
    header = [h.strip() for h in rows[0]]
    try:
        close_i = header.index("Close")
    except ValueError:
        return None
    data = rows[1]
    if close_i >= len(data):
        return None
    raw = data[close_i].strip()
    if not raw or raw in ("N/D", "-", "0"):
        return None
    try:
        return float(raw)
    except ValueError:
        return None


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

    try:
        stock = yf.Ticker(symbol)

        # ``fast_info`` is much cheaper than ``info`` and avoids many of the
        # rate-limit / scraping issues yfinance has had recently.
        current_price = None
        try:
            fi = stock.fast_info
            current_price = (
                getattr(fi, "last_price", None)
                or getattr(fi, "regular_market_price", None)
                or getattr(fi, "previous_close", None)
            )
        except Exception:
            current_price = None

        name = symbol
        try:
            info = stock.info or {}
            name = (
                info.get("longName")
                or info.get("shortName")
                or info.get("displayName")
                or symbol
            )
            if current_price is None:
                current_price = (
                    info.get("regularMarketPrice")
                    or info.get("currentPrice")
                    or info.get("previousClose")
                )
        except Exception:
            pass

        if current_price is None:
            try:
                hist = stock.history(period="1d")
                if not hist.empty:
                    current_price = float(hist["Close"].iloc[-1])
            except Exception:
                pass

        if current_price is None:
            stooq_price = _stooq_us_last_price(symbol)
            if stooq_price is not None:
                current_price = stooq_price

        if current_price is None:
            return {
                "ticker": symbol,
                "name": name,
                "current_price": None,
                "error": f"Could not fetch a current price for '{symbol}'.",
            }

        return {
            "ticker": symbol,
            "name": name,
            "current_price": float(current_price),
        }

    except Exception as exc:  # pragma: no cover - network-dependent
        stooq_price = _stooq_us_last_price(symbol)
        if stooq_price is not None:
            return {
                "ticker": symbol,
                "name": symbol,
                "current_price": float(stooq_price),
            }
        return {
            "ticker": symbol,
            "name": symbol,
            "current_price": None,
            "error": f"Failed to look up '{symbol}': {exc}",
        }


def invalidate_price_cache(symbols: Optional[List[str]] = None) -> None:
    """Clear cached quotes (all, or only the given tickers). Call after CSV import / new lots."""

    with _price_lock:
        if not symbols:
            _price_cache.clear()
            return
        for raw in symbols:
            sym = (raw or "").strip().upper()
            if sym:
                _price_cache.pop(sym, None)


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

    info = get_stock_info(symbol)
    price = info.get("current_price")
    resolved: float | None = float(price) if price is not None else None

    with _price_lock:
        _price_cache[symbol] = (resolved, now + _CACHE_TTL)

    return resolved

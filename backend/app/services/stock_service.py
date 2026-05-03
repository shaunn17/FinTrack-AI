"""Stock data service backed by yfinance."""

from __future__ import annotations

from typing import Dict

import yfinance as yf


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
        return {
            "ticker": symbol,
            "name": symbol,
            "current_price": None,
            "error": f"Failed to look up '{symbol}': {exc}",
        }


def get_current_price(ticker: str) -> float | None:
    """Convenience wrapper used by the portfolio aggregator."""
    info = get_stock_info(ticker)
    price = info.get("current_price")
    return float(price) if price is not None else None

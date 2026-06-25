"""Human-readable labels for expense category keys."""

from __future__ import annotations

import re

from ..models.budget import EXPENSE_CATEGORIES

_SCREAMING_SNAKE = re.compile(r"\b[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+\b")
_LOWER_SNAKE = re.compile(r"\b[a-z][a-z0-9]*(?:_[a-z0-9]+)+\b")


def format_category(cat: str) -> str:
    """Turn a category key into a display label (e.g. DINING_OUT_FOOD -> Dining out food)."""
    return " ".join(
        w[0] + w[1:].lower()
        for w in str(cat or "").split("_")
        if w
    )


def _category_pattern(cat: str) -> re.Pattern[str]:
    """Match a category key only as a whole token (not inside a longer snake_case key)."""
    return re.compile(
        rf"(?<![A-Za-z0-9_]){re.escape(cat)}(?![A-Za-z0-9_])",
        re.IGNORECASE,
    )


def humanize_insight_text(text: str) -> str:
    """Replace raw category keys in insight prose with friendly labels."""
    if not text:
        return text

    result = text
    for cat in sorted(EXPENSE_CATEGORIES, key=len, reverse=True):
        label = format_category(cat)
        result = _category_pattern(cat).sub(label, result)

    def _replace_token(match: re.Match[str]) -> str:
        token = match.group(0)
        if "_" not in token:
            return token
        return format_category(token)

    result = _SCREAMING_SNAKE.sub(_replace_token, result)
    result = _LOWER_SNAKE.sub(_replace_token, result)
    return result

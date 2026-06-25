"""AI service: spending insights + financial health score.

Uses **Groq** (default ``llama-3.3-70b-versatile``) via ``GROQ_API_KEY``.
Override with env ``GROQ_MODEL`` if Groq rotates IDs (see https://console.groq.com/docs/deprecations ).

Anthropic / Claude is **disabled** in this file to avoid paid API usage; see the
commented block below if you want to switch back later.
"""

from __future__ import annotations

import json
import os
import re
from typing import Any, Dict

from dotenv import load_dotenv

from ..utils.category_labels import format_category, humanize_insight_text

load_dotenv()

GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
# ANTHROPIC_MODEL = "claude-opus-4-5"


# ---------------------------------------------------------------------------
# Provider plumbing (Groq active; Anthropic commented out)
# ---------------------------------------------------------------------------

def _call_groq(prompt: str, *, json_mode: bool = False) -> str:
    from groq import Groq

    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise RuntimeError("GROQ_API_KEY is not set.")

    client = Groq(api_key=api_key)
    kwargs: Dict[str, Any] = {
        "model": GROQ_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.4,
        "max_tokens": 800,
    }
    if json_mode:
        kwargs["response_format"] = {"type": "json_object"}

    try:
        response = client.chat.completions.create(**kwargs)
        return response.choices[0].message.content or ""
    except Exception as e:
        err = str(e).lower()
        if "model" in err or "decommission" in err or "does not exist" in err:
            raise RuntimeError(
                f"{e}\n\nTip: Groq retires model IDs often. Set GROQ_MODEL in backend/.env "
                f"(see https://console.groq.com/docs/models ). Current default is {GROQ_MODEL}."
            ) from e
        raise


# def _call_anthropic(prompt: str, *, json_mode: bool = False) -> str:
#     """Claude — uncomment when you have Anthropic credits and wire _call_llm below."""
#     import anthropic
#
#     api_key = os.getenv("ANTHROPIC_API_KEY")
#     if not api_key:
#         raise RuntimeError("ANTHROPIC_API_KEY is not set.")
#
#     client = anthropic.Anthropic(api_key=api_key)
#     system = (
#         "You are a precise financial assistant. When asked for JSON, "
#         "respond with ONLY valid JSON and no surrounding prose."
#         if json_mode
#         else "You are a precise, concise personal finance advisor."
#     )
#     response = client.messages.create(
#         model=ANTHROPIC_MODEL,
#         max_tokens=800,
#         system=system,
#         messages=[{"role": "user", "content": prompt}],
#     )
#     parts = []
#     for block in response.content:
#         text = getattr(block, "text", None)
#         if text:
#             parts.append(text)
#     return "".join(parts)


def _call_llm(prompt: str, *, json_mode: bool = False) -> str:
    return _call_groq(prompt, json_mode=json_mode)
    # To use Anthropic: uncomment _call_anthropic above, then:
    # AI_PROVIDER = os.getenv("AI_PROVIDER", "groq").lower()
    # if AI_PROVIDER == "anthropic":
    #     return _call_anthropic(prompt, json_mode=json_mode)
    # return _call_groq(prompt, json_mode=json_mode)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def generate_spending_insights(month_summary: dict) -> str:
    """Return 4 bullet points of spending insights for the given month."""

    month = month_summary.get("month", "this month")
    income = month_summary.get("income", 0)
    savings = month_summary.get("savings", 0)
    savings_rate = month_summary.get("savings_rate", 0)
    breakdown = month_summary.get("category_breakdown", [])

    if isinstance(breakdown, list):
        category_breakdown = ", ".join(
            f"{format_category(c.get('category', ''))}: ${float(c.get('total', 0)):,.2f}"
            for c in breakdown
        ) or "no expenses recorded"
    else:
        category_breakdown = str(breakdown)

    prompt = (
        f"You are a personal finance advisor. Here is a summary of my spending for {month}:\n"
        f"Income: ${float(income):,.2f}\n"
        f"Expenses by category: {category_breakdown}\n"
        f"Savings: ${float(savings):,.2f} ({float(savings_rate):.1f}% of income)\n\n"
        "Give me exactly 4 bullet points:\n"
        "1. One observation about my biggest spending category\n"
        "2. One pattern or anomaly you notice\n"
        "3. One comparison to healthy benchmarks (e.g. 50/30/20 rule)\n"
        "4. One specific, actionable suggestion to improve next month\n"
        "Write in a conversational, natural tone. Refer to spending categories by their "
        "plain-English names exactly as shown above (never use ALL_CAPS, snake_case, or "
        "database-style keys). Be direct, specific, and use the actual numbers."
    )

    return humanize_insight_text(_call_llm(prompt).strip())


def _extract_json(text: str) -> Dict[str, Any]:
    """Best-effort extraction of a JSON object from an LLM response."""
    text = text.strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError:
            pass

    raise ValueError(f"AI response was not valid JSON:\n{text}")


def generate_health_score(month_summary: dict, portfolio_summary: dict) -> dict:
    """Score the user's financial health 0-100 using the strict 4-part rubric."""

    prompt = (
        "You are a financial health scoring engine. Score the following financial data on a 0-100 scale "
        "using this exact rubric:\n\n"
        "- Savings Rate (0-25 pts): 0 = no savings or negative, 25 = saving 20% or more of income. Scale linearly in between.\n"
        "- Budget Adherence (0-25 pts): 0 = overspent all category caps, 25 = within all caps. If no caps are set, score based on whether spending seems controlled relative to income.\n"
        "- Expense Volatility (0-25 pts): 0 = wildly inconsistent spending with large spikes, 25 = stable and predictable spending across categories.\n"
        "- Portfolio Growth (0-25 pts): 0 = negative overall return, 25 = 10% or greater overall return. Scale linearly in between.\n\n"
        "Data:\n"
        f"{json.dumps(month_summary, default=str)}\n"
        f"{json.dumps(portfolio_summary, default=str)}\n\n"
        "Return ONLY valid JSON in this exact format, no explanation:\n"
        "{\n"
        '  "score": <total 0-100>,\n'
        '  "breakdown": {\n'
        '    "savings_rate": <0-25>,\n'
        '    "budget_adherence": <0-25>,\n'
        '    "expense_volatility": <0-25>,\n'
        '    "portfolio_growth": <0-25>\n'
        "  },\n"
        '  "summary": "<one sentence summary of overall financial health>"\n'
        "}"
    )

    raw = _call_llm(prompt, json_mode=True)
    data = _extract_json(raw)

    breakdown = data.get("breakdown", {}) or {}
    cleaned = {
        "score": float(data.get("score", 0)),
        "breakdown": {
            "savings_rate": float(breakdown.get("savings_rate", 0)),
            "budget_adherence": float(breakdown.get("budget_adherence", 0)),
            "expense_volatility": float(breakdown.get("expense_volatility", 0)),
            "portfolio_growth": float(breakdown.get("portfolio_growth", 0)),
        },
        "summary": str(data.get("summary", "")),
    }
    return cleaned

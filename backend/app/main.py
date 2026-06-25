"""FastAPI entry point for the FinTrack backend."""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import budget, chat, insights, investments, stocks

app = FastAPI(
    title="FinTrack API",
    version="0.1.0",
    description="Personal finance dashboard backend (budget + investments + AI insights).",
)

# Permissive CORS for local development. Tighten for production.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    return {"status": "ok"}


app.include_router(budget.router, prefix="/api")
app.include_router(investments.router, prefix="/api")
app.include_router(stocks.router, prefix="/api")
app.include_router(insights.router, prefix="/api")
app.include_router(chat.router, prefix="/api")


# ---------------------------------------------------------------------------
# FUTURE SCOPE (do not implement now):
#   - Voice-to-text expense and investment entry
#   - Spending vs Investment correlation view
#   - Anomaly detection on transactions
#   - Natural language expense entry ("$12 coffee" -> auto-categorized)
#   - Migration off Supabase free tier when data grows
# ---------------------------------------------------------------------------

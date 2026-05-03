"""Supabase database client.

Loads credentials from environment variables and exposes a single
``supabase`` client instance that the rest of the app imports.
"""

from __future__ import annotations

import os
from functools import lru_cache

from dotenv import load_dotenv
from supabase import Client, create_client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")


@lru_cache(maxsize=1)
def get_client() -> Client:
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise RuntimeError(
            "SUPABASE_URL and SUPABASE_KEY must be set in the environment."
        )
    return create_client(SUPABASE_URL, SUPABASE_KEY)


# Lazy proxy: only instantiate on first attribute access so the app
# can still import this module in environments without credentials
# (e.g. running test discovery).
class _SupabaseProxy:
    def __getattr__(self, item):
        return getattr(get_client(), item)


supabase: Client = _SupabaseProxy()  # type: ignore[assignment]

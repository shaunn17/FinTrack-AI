# FinTrack

A modern, full-stack personal finance dashboard. Track income & expenses, manage an investment portfolio with live prices, and get LLM-powered monthly insights and a 0–100 financial health score.

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | React (Vite) + Tailwind CSS + Recharts |
| Backend | FastAPI (Python) |
| Database | Supabase (PostgreSQL) |
| Stock data | yfinance |
| AI (primary) | Groq — `llama-3.1-70b-versatile` |
| AI (secondary) | Anthropic — `claude-opus-4-5` |
| Frontend deploy | Vercel |
| Backend deploy | Render |

---

## Project structure

```
fintrack/
├── frontend/          # React + Vite + Tailwind app
└── backend/           # FastAPI app
    └── app/
        ├── routers/   # budget, investments, stocks, insights
        ├── models/    # Pydantic models + canonical category list
        ├── services/  # ai_service.py, stock_service.py
        └── db/        # Supabase client + schemas.sql
```

---

## Local development

After [backend](#2-backend) and [frontend](#3-frontend) setup, start both servers in one terminal:

```bash
chmod +x dev.sh   # once
./dev.sh
```

Preflight checks warn about missing `.env` files, dependencies, or ports already in use. Use `./dev.sh --force` to start when ports are busy.

---

## 1. Supabase setup

1. Create a new project at [supabase.com](https://supabase.com).
2. Open the SQL editor and run the contents of `backend/app/db/schemas.sql` to create all tables and indexes.
3. From **Project Settings → API**, copy:
   - `Project URL` → `SUPABASE_URL`
   - `anon` (or `service_role` for write access from a trusted backend) → `SUPABASE_KEY`

> The backend uses the standard PostgREST endpoints, so either key works for local dev. Use `service_role` only in trusted server environments.

---

## 2. Backend

### Install

```bash
cd backend
python -m venv .venv
source .venv/bin/activate         # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### Configure

```bash
cp .env.example .env
```

Fill in the values:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_supabase_key
GROQ_API_KEY=your_groq_api_key
```

- Get a free Groq API key at [console.groq.com](https://console.groq.com). The app uses Groq only by default (`app/services/ai_service.py`). To use Anthropic instead, uncomment the Claude code there and add `ANTHROPIC_API_KEY` to `.env`.

### Run

```bash
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`. Health check: `GET /health`. Interactive docs at `http://localhost:8000/docs`.

### REST endpoints (all prefixed with `/api`)

```
POST   /budget/income                 Create or update monthly income
GET    /budget/income/{YYYY-MM}       Get income for a month
POST   /budget/expenses               Log an expense
GET    /budget/expenses/{YYYY-MM}     List expenses for a month
DELETE /budget/expenses/{id}          Delete an expense
GET    /budget/summary/{YYYY-MM}      Income/spent/savings/breakdown
POST   /budget/caps                   Upsert a budget cap
GET    /budget/caps/{YYYY-MM}         List caps for a month
GET    /budget/categories             Canonical category list

POST   /investments/transactions
GET    /investments/transactions
DELETE /investments/transactions/{id}
GET    /investments/portfolio         Aggregated, live-priced positions

GET    /stocks/search?ticker=NVDA     Live ticker lookup

POST   /insights/generate/{YYYY-MM}   Generate + store spending insights
GET    /insights/{YYYY-MM}            Stored insights
POST   /insights/health-score/{YYYY-MM}
GET    /insights/health-score/{YYYY-MM}
```

---

## 3. Frontend

### Install

```bash
cd frontend
npm install
```

### Configure

```bash
cp .env.example .env
# .env content:
# VITE_API_BASE_URL=http://localhost:8000
```

### Run

```bash
npm run dev
```

App will open at [http://localhost:5173](http://localhost:5173).

### Pages

- **Dashboard** — top-level stats, donut chart, recent expenses & transactions, health score ring.
- **Budget** — income card, expense form, expense table, category breakdown with cap progress, cap manager. Month selector at the top.
- **Investments** — transaction form with live ticker lookup, full portfolio table with live prices and color-coded gain/loss, summary bar.
- **Insights** — generate / regenerate AI insights and the financial health score per month.

---

## 4. Deployment

Target stack: **Render Free** (backend) + **Vercel** (frontend). Push this repo to GitHub first (`shaunn17/FinTrack-AI`).

### Backend → Render

**Option A — Blueprint (recommended)** — uses `render.yaml` at the repo root:

1. Open [Render Blueprints](https://dashboard.render.com/blueprints) → **New Blueprint Instance**.
2. Connect `shaunn17/FinTrack-AI`, branch `master`. Blueprint path: `render.yaml`.
3. When prompted for secrets, set `SUPABASE_URL`, `SUPABASE_KEY`, and `GROQ_API_KEY`.
4. Deploy. Note the service URL (e.g. `https://fintrack-api.onrender.com`).

The blueprint sets `plan: free` so you are not billed for the web service. If Blueprint import asks for payment info, confirm `plan: free` is present in `render.yaml` and re-sync.

**Option B — Manual Web Service** (same settings, no Blueprint):

1. **New → Web Service** → connect the GitHub repo.
2. Root directory: `backend/`. Runtime: **Python 3**.
3. Instance type: **Free** (not Starter).
4. Build: `pip install -r requirements.txt`
5. Start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
6. Health check path: `/health`
7. Environment variables: `SUPABASE_URL`, `SUPABASE_KEY`, `GROQ_API_KEY` (plus `ANTHROPIC_API_KEY` only if you re-enable Claude in code).

Python version is pinned in `backend/runtime.txt` (`python-3.13.2`).

> **Free tier:** the API sleeps after ~15 minutes of inactivity; the first request after that may take 30–60s (cold start).

### Frontend → Vercel

1. Import the repo at [vercel.com](https://vercel.com), set the project root to `frontend/`.
2. Framework preset: **Vite**.
3. Build command: `npm run build`. Output directory: `dist`.
4. Environment variable: `VITE_API_BASE_URL=https://fintrack-api.onrender.com` (your Render URL, **no** `/api` suffix).
5. Redeploy after the backend URL is live. SPA routing is handled by `frontend/vercel.json`.

---

## 5. Categories

Hard-coded on both the frontend (`src/styles/theme.js`) and backend (`app/models/budget.py`):

```
GROCERIES, SUBSCRIPTIONS, RENT, UTILITIES, TRANSPORT,
DINING_OUT_FOOD, ENTERTAINMENT, STUDENT_LOANS_DEBT, MISCELLANEOUS
```

---

## 6. Future scope (not implemented)

- Voice-to-text expense and investment entry (e.g. *"Add my investment in NVIDIA for $500 with 2 shares at $250 on April 1st"*).
- Spending vs investment correlation view.
- Anomaly detection on transactions vs historical baseline.
- Natural language expense entry (*"$12 coffee this morning"* → auto-categorized).
- Migration from Supabase free tier when data grows.

---

## License

MIT — do whatever you want with it.

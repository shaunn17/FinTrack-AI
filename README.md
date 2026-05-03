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

### Backend → Render

1. Create a new **Web Service** from this repo, root `backend/`.
2. Build command: `pip install -r requirements.txt`
3. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Add environment variables: `SUPABASE_URL`, `SUPABASE_KEY`, `GROQ_API_KEY` (plus `ANTHROPIC_API_KEY` only if you re-enable Claude in code).

### Frontend → Vercel

1. Import the repo, set the project root to `frontend/`.
2. Framework preset: **Vite**.
3. Build command: `npm run build`. Output dir: `dist`.
4. Environment variable: `VITE_API_BASE_URL=https://your-render-app.onrender.com`.

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

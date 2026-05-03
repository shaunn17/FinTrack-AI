-- FinTrack Database Schema
-- Run this in the Supabase SQL editor to provision all required tables.

-- Monthly Income
CREATE TABLE IF NOT EXISTS monthly_income (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  month DATE NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  note TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Expenses
CREATE TABLE IF NOT EXISTS expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  category VARCHAR(50) NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  note TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Budget Caps (optional per category per month)
CREATE TABLE IF NOT EXISTS budget_caps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  month DATE NOT NULL,
  category VARCHAR(50) NOT NULL,
  cap_amount NUMERIC(12, 2) NOT NULL
);

-- Investment Transactions
CREATE TABLE IF NOT EXISTS investment_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  ticker VARCHAR(10) NOT NULL,
  stock_name VARCHAR(100) NOT NULL,
  buy_price NUMERIC(12, 4) NOT NULL,
  ask_price NUMERIC(12, 4),
  quantity NUMERIC(12, 6) NOT NULL,
  total_cost NUMERIC(12, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- AI Insights
CREATE TABLE IF NOT EXISTS insights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  month DATE NOT NULL,
  insight_text TEXT NOT NULL,
  generated_at TIMESTAMP DEFAULT NOW()
);

-- Financial Health Score
CREATE TABLE IF NOT EXISTS health_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  month DATE NOT NULL,
  score NUMERIC(5, 2) NOT NULL,
  breakdown JSONB,
  generated_at TIMESTAMP DEFAULT NOW()
);

-- Helpful indexes for month-scoped lookups
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses (date);
CREATE INDEX IF NOT EXISTS idx_monthly_income_month ON monthly_income (month);
CREATE INDEX IF NOT EXISTS idx_budget_caps_month ON budget_caps (month);
CREATE INDEX IF NOT EXISTS idx_investment_transactions_ticker ON investment_transactions (ticker);
CREATE INDEX IF NOT EXISTS idx_insights_month ON insights (month);
CREATE INDEX IF NOT EXISTS idx_health_scores_month ON health_scores (month);

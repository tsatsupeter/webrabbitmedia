alter table public.transactions
  add column if not exists provider_fee numeric,
  add column if not exists reversed_at timestamptz;
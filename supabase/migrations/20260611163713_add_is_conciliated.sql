ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS is_conciliated BOOLEAN DEFAULT false;
ALTER TABLE public.recurring_transactions ADD COLUMN IF NOT EXISTS is_conciliated BOOLEAN DEFAULT false;
ALTER TABLE public.parcelated_transactions ADD COLUMN IF NOT EXISTS is_conciliated BOOLEAN DEFAULT false;

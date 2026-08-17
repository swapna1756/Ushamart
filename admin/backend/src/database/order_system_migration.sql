-- Deprecated compatibility file. Use migrations/20260817_order_checkout.sql.
-- It is based on the inspected production schema (TEXT IDs) and also creates
-- order_items plus the required foreign keys and PostgREST schema reload.

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS firebase_uid text;

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_status text DEFAULT 'PLACED';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'PENDING';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_name text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_phone text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS address_id text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS address jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS status_history jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS idempotency_key text;

CREATE UNIQUE INDEX IF NOT EXISTS orders_user_idempotency_key_idx
  ON public.orders (user_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL AND idempotency_key <> '';

CREATE TABLE IF NOT EXISTS public.user_addresses (
  id text PRIMARY KEY,
  user_id text REFERENCES public.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  mobile_number text NOT NULL,
  house text NOT NULL,
  street text NOT NULL,
  landmark text,
  state text NOT NULL,
  district text NOT NULL,
  city text,
  pincode text NOT NULL,
  delivery_instructions text,
  address_text text,
  created_at bigint DEFAULT (extract(epoch from now()) * 1000)::bigint,
  updated_at bigint DEFAULT (extract(epoch from now()) * 1000)::bigint
);

ALTER TABLE public.user_addresses ENABLE ROW LEVEL SECURITY;

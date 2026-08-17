-- Production checkout repair for project xkooguvxhhempfpcmrjd.
--
-- The existing production primary keys are TEXT (not UUID), so every foreign
-- key below intentionally uses TEXT.  This migration is safe to run once and
-- preserves existing orders.

CREATE TABLE IF NOT EXISTS public.user_addresses (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  mobile_number TEXT NOT NULL,
  house TEXT NOT NULL,
  street TEXT NOT NULL,
  landmark TEXT,
  state TEXT NOT NULL,
  district TEXT NOT NULL,
  city TEXT,
  pincode TEXT NOT NULL,
  delivery_instructions TEXT,
  address_text TEXT NOT NULL,
  created_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  updated_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
);

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS address_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS address JSONB NOT NULL DEFAULT '{}'::JSONB;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_phone TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_status TEXT NOT NULL DEFAULT 'PLACED';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'PENDING';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS status_history JSONB NOT NULL DEFAULT '[]'::JSONB;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'orders_address_id_fkey'
      AND conrelid = 'public.orders'::regclass
  ) THEN
    ALTER TABLE public.orders
      ADD CONSTRAINT orders_address_id_fkey
      FOREIGN KEY (address_id) REFERENCES public.user_addresses(id) ON DELETE RESTRICT;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  product_name TEXT NOT NULL,
  product_image TEXT,
  variant_info TEXT,
  unit TEXT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC NOT NULL CHECK (unit_price >= 0),
  mrp NUMERIC NOT NULL DEFAULT 0 CHECK (mrp >= 0),
  subtotal NUMERIC NOT NULL CHECK (subtotal >= 0),
  created_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  updated_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
);

CREATE INDEX IF NOT EXISTS user_addresses_user_id_idx ON public.user_addresses(user_id);
CREATE INDEX IF NOT EXISTS orders_address_id_idx ON public.orders(address_id);
CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON public.order_items(order_id);
CREATE UNIQUE INDEX IF NOT EXISTS orders_user_id_idempotency_key_idx
  ON public.orders(user_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL AND idempotency_key <> '';

ALTER TABLE public.user_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- The deployed API uses the service role.  Do not add permissive anon policies.
-- Prompt PostgREST to reload immediately so the new columns are visible.
NOTIFY pgrst, 'reload schema';

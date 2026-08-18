-- ═══════════════════════════════════════════════════════════════════════════
-- UshaMart — Migration: create public.users (and all dependent tables)
-- ═══════════════════════════════════════════════════════════════════════════
-- Run this in: Supabase Dashboard → SQL Editor → New Query → Run
--
-- Safe to run on a fresh project AND on an existing project:
--   • Uses CREATE TABLE IF NOT EXISTS — never overwrites existing data
--   • Uses CREATE POLICY with DROP IF EXISTS guards
--   • Ends with NOTIFY pgrst to reload the PostgREST schema cache
--
-- Root cause of the error
-- ───────────────────────
-- "Could not find the table 'public.users' in the schema cache" means
-- PostgREST (the REST layer Supabase uses) has never seen a `public.users`
-- table.  This happens when the full schema.sql was never applied to the
-- Supabase project.  Running THIS file creates all required tables.
-- ═══════════════════════════════════════════════════════════════════════════

-- Enable uuid extension (used by future migrations)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── 1. public.users ───────────────────────────────────────────────────────────
-- This is a CUSTOM application profile table stored in the public schema.
-- It is NOT auth.users (Supabase Auth).  The id column stores the Firebase
-- UID or a generated application ID — it is a plain TEXT primary key.
CREATE TABLE IF NOT EXISTS public.users (
  id              TEXT PRIMARY KEY,
  name            TEXT,
  email           TEXT,
  password        TEXT,           -- bcrypt hash; NULL for Firebase-only users
  phone           TEXT,
  role            TEXT    NOT NULL DEFAULT 'customer',
  status          TEXT    NOT NULL DEFAULT 'active',
  firebase_uid    TEXT    UNIQUE,
  address_text    TEXT,
  pincode         TEXT,
  house           TEXT,
  street          TEXT,
  area            TEXT,
  landmark        TEXT,
  city            TEXT,
  state           TEXT,
  dob             TEXT,
  gender          TEXT,
  profile_pic     TEXT,
  wishlist        JSONB   DEFAULT '[]'::JSONB,
  total_orders    INTEGER DEFAULT 0,
  total_spent     NUMERIC DEFAULT 0,
  registered_at   BIGINT,
  last_login      BIGINT,
  created_at      BIGINT  NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  updated_at      BIGINT  NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
);

CREATE INDEX IF NOT EXISTS users_email_idx        ON public.users(email);
CREATE INDEX IF NOT EXISTS users_phone_idx        ON public.users(phone);
CREATE INDEX IF NOT EXISTS users_role_idx         ON public.users(role);
CREATE INDEX IF NOT EXISTS users_firebase_uid_idx ON public.users(firebase_uid);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_own_select"  ON public.users;
DROP POLICY IF EXISTS "users_own_update"  ON public.users;
DROP POLICY IF EXISTS "users_service_all" ON public.users;
-- Service-role key (used by the backend) bypasses RLS automatically.
-- These policies protect against accidental anon-key access.
CREATE POLICY "users_own_select"  ON public.users FOR SELECT
  USING (auth.uid()::text = id OR auth.role() = 'service_role');
CREATE POLICY "users_own_update"  ON public.users FOR UPDATE
  USING (auth.uid()::text = id OR auth.role() = 'service_role') WITH CHECK (true);
CREATE POLICY "users_service_all" ON public.users FOR ALL
  USING (auth.role() = 'service_role') WITH CHECK (true);

-- ── 2. public.categories ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.categories (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  description   TEXT,
  emoji_icon    TEXT,
  icon          TEXT,
  banner        TEXT,
  section       TEXT    NOT NULL DEFAULT 'Grocery & Kitchen',
  status        TEXT    NOT NULL DEFAULT 'published',
  featured      BOOLEAN NOT NULL DEFAULT FALSE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at    BIGINT  NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  updated_at    BIGINT  NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_select" ON public.categories;
CREATE POLICY "public_select" ON public.categories FOR SELECT USING (true);

-- ── 3. public.products ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.products (
  id                  TEXT PRIMARY KEY,
  name                TEXT NOT NULL,
  brand               TEXT,
  description         TEXT,
  category            TEXT REFERENCES public.categories(id) ON DELETE SET NULL,
  subcategory         TEXT,
  sku                 TEXT,
  barcode             TEXT,
  unit                TEXT,
  variants            TEXT,
  variant_list        JSONB   NOT NULL DEFAULT '[]'::JSONB,
  images              JSONB   NOT NULL DEFAULT '[]'::JSONB,
  mrp                 NUMERIC NOT NULL DEFAULT 0,
  price               NUMERIC NOT NULL DEFAULT 0,
  discount_percent    NUMERIC NOT NULL DEFAULT 0,
  stock               INTEGER NOT NULL DEFAULT 0,
  low_stock_alert     INTEGER NOT NULL DEFAULT 10,
  status              TEXT    NOT NULL DEFAULT 'draft',
  availability_status TEXT    NOT NULL DEFAULT 'draft',
  pincodes_available  JSONB   NOT NULL DEFAULT '[]'::JSONB,
  featured            BOOLEAN NOT NULL DEFAULT FALSE,
  best_seller         BOOLEAN NOT NULL DEFAULT FALSE,
  new_arrival         BOOLEAN NOT NULL DEFAULT FALSE,
  trending            BOOLEAN NOT NULL DEFAULT FALSE,
  today_offer         BOOLEAN NOT NULL DEFAULT FALSE,
  expiry_date         TEXT,
  gst                 TEXT    NOT NULL DEFAULT '5',
  delivery_time       TEXT    NOT NULL DEFAULT '1-2 Days',
  cod                 BOOLEAN NOT NULL DEFAULT TRUE,
  specifications      TEXT,
  created_at          BIGINT  NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  updated_at          BIGINT  NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
);
CREATE INDEX IF NOT EXISTS products_category_idx ON public.products(category);
CREATE INDEX IF NOT EXISTS products_status_idx   ON public.products(status);
CREATE INDEX IF NOT EXISTS products_updated_idx  ON public.products(updated_at DESC);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_select" ON public.products;
CREATE POLICY "public_select" ON public.products FOR SELECT USING (true);

-- ── 4. public.pincodes ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.pincodes (
  id            TEXT PRIMARY KEY,
  code          TEXT UNIQUE NOT NULL,
  area_name     TEXT,
  city          TEXT,
  district      TEXT,
  state         TEXT,
  latitude      NUMERIC,
  longitude     NUMERIC,
  charges       NUMERIC NOT NULL DEFAULT 0,
  delivery_time TEXT    NOT NULL DEFAULT '1-2 Days',
  enabled       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    BIGINT  NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  updated_at    BIGINT  NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
);
ALTER TABLE public.pincodes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_select" ON public.pincodes;
CREATE POLICY "public_select" ON public.pincodes FOR SELECT USING (true);

-- ── 5. public.user_addresses ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_addresses (
  id                    TEXT PRIMARY KEY,
  user_id               TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  full_name             TEXT NOT NULL,
  mobile_number         TEXT NOT NULL,
  house                 TEXT NOT NULL,
  street                TEXT NOT NULL,
  landmark              TEXT,
  state                 TEXT NOT NULL,
  district              TEXT NOT NULL,
  city                  TEXT,
  pincode               TEXT NOT NULL,
  delivery_instructions TEXT,
  address_text          TEXT,
  created_at            BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  updated_at            BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
);
CREATE INDEX IF NOT EXISTS user_addresses_user_id_idx ON public.user_addresses(user_id);
ALTER TABLE public.user_addresses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "addr_own_select" ON public.user_addresses;
DROP POLICY IF EXISTS "addr_own_insert" ON public.user_addresses;
DROP POLICY IF EXISTS "addr_own_update" ON public.user_addresses;
DROP POLICY IF EXISTS "addr_own_delete" ON public.user_addresses;
CREATE POLICY "addr_own_select" ON public.user_addresses FOR SELECT
  USING (auth.uid()::text = user_id OR auth.role() = 'service_role');
CREATE POLICY "addr_own_insert" ON public.user_addresses FOR INSERT
  WITH CHECK (auth.uid()::text = user_id OR auth.role() = 'service_role');
CREATE POLICY "addr_own_update" ON public.user_addresses FOR UPDATE
  USING (auth.uid()::text = user_id OR auth.role() = 'service_role') WITH CHECK (true);
CREATE POLICY "addr_own_delete" ON public.user_addresses FOR DELETE
  USING (auth.uid()::text = user_id OR auth.role() = 'service_role');

-- ── 6. public.orders ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.orders (
  id               TEXT PRIMARY KEY,
  order_number     TEXT,
  user_id          TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  user_name        TEXT,
  user_phone       TEXT,
  user_email       TEXT,
  customer_name    TEXT,
  customer_phone   TEXT,
  address_id       TEXT REFERENCES public.user_addresses(id) ON DELETE RESTRICT,
  address          JSONB   NOT NULL DEFAULT '{}'::JSONB,
  address_text     TEXT,
  pincode          TEXT,
  items            JSONB   NOT NULL DEFAULT '[]'::JSONB,
  subtotal         NUMERIC NOT NULL DEFAULT 0,
  delivery_charges NUMERIC NOT NULL DEFAULT 0,
  discount_amount  NUMERIC NOT NULL DEFAULT 0,
  total_amount     NUMERIC NOT NULL DEFAULT 0,
  coupon_code      TEXT,
  status           TEXT    NOT NULL DEFAULT 'PLACED',
  order_status     TEXT    NOT NULL DEFAULT 'PLACED',
  payment_method   TEXT    NOT NULL DEFAULT 'COD',
  payment_status   TEXT    NOT NULL DEFAULT 'PENDING',
  delivery_slot    TEXT,
  status_history   JSONB   NOT NULL DEFAULT '[]'::JSONB,
  idempotency_key  TEXT,
  created_at       BIGINT  NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  updated_at       BIGINT  NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
);
CREATE INDEX IF NOT EXISTS orders_user_id_idx  ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS orders_status_idx   ON public.orders(order_status);
CREATE INDEX IF NOT EXISTS orders_created_idx  ON public.orders(created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS orders_idempotency_idx
  ON public.orders(user_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL AND idempotency_key <> '';
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "orders_own_select" ON public.orders;
DROP POLICY IF EXISTS "orders_service"    ON public.orders;
CREATE POLICY "orders_own_select" ON public.orders FOR SELECT
  USING (auth.uid()::text = user_id OR auth.role() = 'service_role');
CREATE POLICY "orders_service" ON public.orders FOR ALL
  USING (auth.role() = 'service_role') WITH CHECK (true);

-- ── 7. public.order_items ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.order_items (
  id            TEXT PRIMARY KEY,
  order_id      TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id    TEXT NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  product_name  TEXT NOT NULL,
  product_image TEXT,
  variant_info  TEXT,
  unit          TEXT,
  quantity      INTEGER NOT NULL CHECK (quantity > 0),
  unit_price    NUMERIC NOT NULL CHECK (unit_price >= 0),
  mrp           NUMERIC NOT NULL DEFAULT 0 CHECK (mrp >= 0),
  subtotal      NUMERIC NOT NULL CHECK (subtotal >= 0),
  created_at    BIGINT  NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  updated_at    BIGINT  NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
);
CREATE INDEX IF NOT EXISTS order_items_order_id_idx   ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS order_items_product_id_idx ON public.order_items(product_id);
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "order_items_service" ON public.order_items;
CREATE POLICY "order_items_service" ON public.order_items FOR ALL
  USING (auth.role() = 'service_role') WITH CHECK (true);

-- ── 8. public.wishlists ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.wishlists (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  UNIQUE (user_id, product_id)
);
CREATE INDEX IF NOT EXISTS wishlists_user_id_idx    ON public.wishlists(user_id);
CREATE INDEX IF NOT EXISTS wishlists_product_id_idx ON public.wishlists(product_id);
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "wishlists_own_select" ON public.wishlists;
DROP POLICY IF EXISTS "wishlists_own_insert" ON public.wishlists;
DROP POLICY IF EXISTS "wishlists_own_delete" ON public.wishlists;
DROP POLICY IF EXISTS "wishlists_service"    ON public.wishlists;
CREATE POLICY "wishlists_own_select" ON public.wishlists FOR SELECT
  USING (auth.uid()::text = user_id OR auth.role() = 'service_role');
CREATE POLICY "wishlists_own_insert" ON public.wishlists FOR INSERT
  WITH CHECK (auth.uid()::text = user_id OR auth.role() = 'service_role');
CREATE POLICY "wishlists_own_delete" ON public.wishlists FOR DELETE
  USING (auth.uid()::text = user_id OR auth.role() = 'service_role');
CREATE POLICY "wishlists_service"    ON public.wishlists FOR ALL
  USING (auth.role() = 'service_role') WITH CHECK (true);

-- ── 9. public.cart_items ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cart_items (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  cart_key   TEXT NOT NULL,
  product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant    TEXT,
  quantity   INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at BIGINT  NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  updated_at BIGINT  NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  UNIQUE (user_id, cart_key)
);
CREATE INDEX IF NOT EXISTS cart_items_user_id_idx ON public.cart_items(user_id);
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cart_own_select" ON public.cart_items;
DROP POLICY IF EXISTS "cart_own_insert" ON public.cart_items;
DROP POLICY IF EXISTS "cart_own_update" ON public.cart_items;
DROP POLICY IF EXISTS "cart_own_delete" ON public.cart_items;
CREATE POLICY "cart_own_select" ON public.cart_items FOR SELECT
  USING (auth.uid()::text = user_id OR auth.role() = 'service_role');
CREATE POLICY "cart_own_insert" ON public.cart_items FOR INSERT
  WITH CHECK (auth.uid()::text = user_id OR auth.role() = 'service_role');
CREATE POLICY "cart_own_update" ON public.cart_items FOR UPDATE
  USING (auth.uid()::text = user_id OR auth.role() = 'service_role') WITH CHECK (true);
CREATE POLICY "cart_own_delete" ON public.cart_items FOR DELETE
  USING (auth.uid()::text = user_id OR auth.role() = 'service_role');

-- ── 10. public.banners ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.banners (
  id            TEXT PRIMARY KEY,
  title         TEXT NOT NULL,
  subtitle      TEXT,
  badge_text    TEXT,
  button_text   TEXT,
  button_dest   TEXT,
  bg_gradient   TEXT,
  bg_color      TEXT,
  image_url     TEXT,
  active        BOOLEAN NOT NULL DEFAULT TRUE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at    BIGINT  NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  updated_at    BIGINT  NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
);
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_select" ON public.banners;
CREATE POLICY "public_select" ON public.banners FOR SELECT USING (true);

-- ── 11. public.special_offers ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.special_offers (
  id             TEXT PRIMARY KEY,
  title          TEXT NOT NULL,
  subtitle       TEXT,
  badge_text     TEXT,
  button_text    TEXT,
  image_url      TEXT,
  bg_color       TEXT,
  offer_type     TEXT    NOT NULL DEFAULT 'general',
  linked_cat_id  TEXT,
  linked_prod_id TEXT,
  multi_prod_ids JSONB   NOT NULL DEFAULT '[]'::JSONB,
  start_date     TEXT,
  end_date       TEXT,
  status         TEXT    NOT NULL DEFAULT 'active',
  active         BOOLEAN NOT NULL DEFAULT TRUE,
  display_order  INTEGER NOT NULL DEFAULT 0,
  created_at     BIGINT  NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  updated_at     BIGINT  NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
);
ALTER TABLE public.special_offers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_select" ON public.special_offers;
CREATE POLICY "public_select" ON public.special_offers FOR SELECT USING (true);

-- ── 12. public.coupons ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.coupons (
  id          TEXT PRIMARY KEY,
  code        TEXT UNIQUE NOT NULL,
  type        TEXT    NOT NULL,
  value       NUMERIC NOT NULL,
  min_spend   NUMERIC NOT NULL DEFAULT 0,
  description TEXT,
  status      TEXT    NOT NULL DEFAULT 'published',
  created_at  BIGINT  NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  updated_at  BIGINT  NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
);
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_select" ON public.coupons;
CREATE POLICY "public_select" ON public.coupons FOR SELECT USING (true);

-- ── 13. public.notifications ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id         TEXT PRIMARY KEY,
  title      TEXT NOT NULL,
  content    TEXT,
  message    TEXT,
  type       TEXT    NOT NULL DEFAULT 'promotional',
  status     TEXT    NOT NULL DEFAULT 'published',
  sent_time  BIGINT  NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  created_at BIGINT  NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  updated_at BIGINT  NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_select" ON public.notifications;
CREATE POLICY "public_select" ON public.notifications FOR SELECT USING (true);

-- ── 14. public.support_tickets ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id         TEXT PRIMARY KEY,
  user_id    TEXT,
  user_name  TEXT,
  user_phone TEXT,
  type       TEXT,
  message    TEXT,
  status     TEXT    NOT NULL DEFAULT 'open',
  reply      TEXT,
  created_at BIGINT  NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  updated_at BIGINT  NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
);
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "support_service" ON public.support_tickets;
CREATE POLICY "support_service" ON public.support_tickets FOR ALL
  USING (auth.role() = 'service_role') WITH CHECK (true);

-- ── 15. public.ratings ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ratings (
  id         TEXT PRIMARY KEY,
  order_id   TEXT REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id    TEXT,
  ratings    JSONB   NOT NULL DEFAULT '{}'::JSONB,
  created_at BIGINT  NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  updated_at BIGINT  NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
);
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ratings_service" ON public.ratings;
CREATE POLICY "ratings_service" ON public.ratings FOR ALL
  USING (auth.role() = 'service_role') WITH CHECK (true);

-- ── 16. public.product_reviews ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.product_reviews (
  id         TEXT PRIMARY KEY,
  product_id TEXT REFERENCES public.products(id) ON DELETE CASCADE,
  user_id    TEXT,
  user_name  TEXT,
  rating     INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment    TEXT,
  verified   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at BIGINT  NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  updated_at BIGINT  NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
);
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_select" ON public.product_reviews;
CREATE POLICY "public_select" ON public.product_reviews FOR SELECT USING (true);

-- ── 17. public.sessions ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sessions (
  id         TEXT PRIMARY KEY,
  user_id    TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  token_hash TEXT,
  expires_at BIGINT,
  created_at BIGINT  NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
);
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sessions_service" ON public.sessions;
CREATE POLICY "sessions_service" ON public.sessions FOR ALL
  USING (auth.role() = 'service_role') WITH CHECK (true);

-- ── Storage buckets ───────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('ushamart', 'ushamart', true, 5242880,
        ARRAY['image/jpeg','image/png','image/webp','image/gif','image/svg+xml'])
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 5242880;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('category-images', 'category-images', true, 5242880,
        ARRAY['image/jpeg','image/png','image/webp','image/gif','image/svg+xml'])
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 5242880;

DROP POLICY IF EXISTS "storage_public_read"    ON storage.objects;
DROP POLICY IF EXISTS "storage_auth_insert"    ON storage.objects;
DROP POLICY IF EXISTS "storage_auth_update"    ON storage.objects;
DROP POLICY IF EXISTS "storage_service_delete" ON storage.objects;
CREATE POLICY "storage_public_read"    ON storage.objects FOR SELECT USING (true);
CREATE POLICY "storage_auth_insert"    ON storage.objects FOR INSERT
  WITH CHECK (auth.role() = 'service_role' OR auth.uid() IS NOT NULL);
CREATE POLICY "storage_auth_update"    ON storage.objects FOR UPDATE
  USING (auth.role() = 'service_role' OR auth.uid() IS NOT NULL) WITH CHECK (true);
CREATE POLICY "storage_service_delete" ON storage.objects FOR DELETE
  USING (auth.role() = 'service_role');

-- ═══════════════════════════════════════════════════════════════════════════
-- Tell PostgREST to reload its schema cache immediately.
-- Without this the new tables won't be visible until the next auto-reload
-- (which can take several minutes).
-- ═══════════════════════════════════════════════════════════════════════════
NOTIFY pgrst, 'reload schema';

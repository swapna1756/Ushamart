-- ═══════════════════════════════════════════════════════════════════════════
-- UshaMart — MASTER Supabase PostgreSQL Schema
-- Production-Ready, Safe, Idempotent Migration
-- ═══════════════════════════════════════════════════════════════════════════
-- HOW TO RUN:
--   1. Open Supabase Dashboard → SQL Editor
--   2. Create a new query, paste this entire file
--   3. Click "Run" — safe to run multiple times (uses IF NOT EXISTS / ON CONFLICT)
--   4. Verify completion: all tables/indexes/policies created without errors
--
-- This schema consolidates:
--   • schema.sql (v3) — normalized snake_case columns
--   • 20260817_order_checkout.sql — order/address tables
--   • All missing columns and RLS policies
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Enable extensions ─────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- for fuzzy search if needed

-- ════════════════════════════════════════════════════════════════════════════
-- 1. TABLES (CREATE IF NOT EXISTS — never drops existing data)
-- ════════════════════════════════════════════════════════════════════════════

-- ── 1. users ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.users (
  id              TEXT PRIMARY KEY,
  name            TEXT,
  email           TEXT,
  password        TEXT,                         -- bcrypt hash; null for Firebase users
  phone           TEXT,
  role            TEXT    NOT NULL DEFAULT 'customer',
  status          TEXT    NOT NULL DEFAULT 'active',
  firebase_uid    TEXT    UNIQUE,               -- Firebase UID when auth is via Firebase
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
  wishlist        JSONB   DEFAULT '[]'::JSONB, -- legacy column; new wishlists table used instead
  total_orders    INTEGER DEFAULT 0,
  total_spent     NUMERIC DEFAULT 0,
  registered_at   BIGINT,
  last_login      BIGINT,
  created_at      BIGINT  NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  updated_at      BIGINT  NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
);

-- ── 2. categories ─────────────────────────────────────────────────────────────
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

-- ── 3. products ───────────────────────────────────────────────────────────────
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

-- ── 4. pincodes ───────────────────────────────────────────────────────────────
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

-- ── 5. user_addresses ─────────────────────────────────────────────────────────
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

-- ── 6. orders ─────────────────────────────────────────────────────────────────
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

-- ── 7. order_items ────────────────────────────────────────────────────────────
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

-- ── 8. wishlists ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.wishlists (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  UNIQUE (user_id, product_id)
);

-- ── 9. cart_items ─────────────────────────────────────────────────────────────
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

-- ── 10. banners ───────────────────────────────────────────────────────────────
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

-- ── 11. special_offers ────────────────────────────────────────────────────────
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

-- ── 12. coupons ───────────────────────────────────────────────────────────────
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

-- ── 13. notifications ─────────────────────────────────────────────────────────
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

-- ── 14. support_tickets ───────────────────────────────────────────────────────
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

-- ── 15. ratings ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ratings (
  id         TEXT PRIMARY KEY,
  order_id   TEXT REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id    TEXT,
  ratings    JSONB   NOT NULL DEFAULT '{}'::JSONB,
  created_at BIGINT  NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  updated_at BIGINT  NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
);

-- ── 16. product_reviews ───────────────────────────────────────────────────────
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

-- ── 17. sessions ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sessions (
  id         TEXT PRIMARY KEY,
  user_id    TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  token_hash TEXT,
  expires_at BIGINT,
  created_at BIGINT  NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
);

-- ════════════════════════════════════════════════════════════════════════════
-- 2. INDEXES (all IF NOT EXISTS — safe to re-run)
-- ════════════════════════════════════════════════════════════════════════════

-- users
CREATE INDEX IF NOT EXISTS users_email_idx        ON public.users(email);
CREATE INDEX IF NOT EXISTS users_phone_idx        ON public.users(phone);
CREATE INDEX IF NOT EXISTS users_role_idx         ON public.users(role);
CREATE INDEX IF NOT EXISTS users_firebase_uid_idx ON public.users(firebase_uid);

-- products
CREATE INDEX IF NOT EXISTS products_category_idx  ON public.products(category);
CREATE INDEX IF NOT EXISTS products_status_idx    ON public.products(status);
CREATE INDEX IF NOT EXISTS products_featured_idx  ON public.products(featured) WHERE featured = TRUE;
CREATE INDEX IF NOT EXISTS products_updated_idx   ON public.products(updated_at DESC);

-- orders
CREATE INDEX IF NOT EXISTS orders_user_id_idx      ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS orders_status_idx       ON public.orders(order_status);
CREATE INDEX IF NOT EXISTS orders_created_idx      ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS orders_phone_idx        ON public.orders(user_phone);
CREATE UNIQUE INDEX IF NOT EXISTS orders_idempotency_idx
  ON public.orders(user_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL AND idempotency_key <> '';

-- order_items
CREATE INDEX IF NOT EXISTS order_items_order_id_idx   ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS order_items_product_id_idx ON public.order_items(product_id);

-- user_addresses
CREATE INDEX IF NOT EXISTS user_addresses_user_id_idx ON public.user_addresses(user_id);

-- wishlists
CREATE INDEX IF NOT EXISTS wishlists_user_id_idx    ON public.wishlists(user_id);
CREATE INDEX IF NOT EXISTS wishlists_product_id_idx ON public.wishlists(product_id);

-- cart_items
CREATE INDEX IF NOT EXISTS cart_items_user_id_idx ON public.cart_items(user_id);

-- pincodes
CREATE INDEX IF NOT EXISTS pincodes_enabled_idx ON public.pincodes(enabled) WHERE enabled = TRUE;

-- ════════════════════════════════════════════════════════════════════════════
-- 3. ROW LEVEL SECURITY
-- ════════════════════════════════════════════════════════════════════════════
-- The Express backend connects with SERVICE ROLE key (bypasses RLS).
-- RLS policies below protect direct Supabase client access (defense-in-depth).
-- ════════════════════════════════════════════════════════════════════════════

ALTER TABLE public.users             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pincodes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_addresses    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.special_offers    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_reviews   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions          ENABLE ROW LEVEL SECURITY;

-- ── Drop old permissive catch-all policies before recreating ──────────────────
DO $$
DECLARE tbl TEXT; pol TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'users','categories','products','pincodes','user_addresses','orders',
    'order_items','wishlists','cart_items','banners','special_offers',
    'coupons','notifications','support_tickets','ratings','product_reviews','sessions'
  ]) LOOP
    FOR pol IN SELECT policyname FROM pg_policies
               WHERE schemaname = 'public' AND tablename = tbl
                 AND (policyname LIKE 'allow_all_%' OR policyname LIKE 'Allow%')
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol, tbl);
    END LOOP;
  END LOOP;
END$$;

-- ── Public read-only catalog (SELECT for everyone) ────────────────────────────
DO $$
DECLARE
  tbl TEXT;
  pol TEXT := 'public_select';
BEGIN
  FOREACH tbl IN ARRAY ARRAY['categories','products','pincodes','banners',
                              'special_offers','coupons','notifications','product_reviews']
  LOOP
    EXECUTE format('
      DROP POLICY IF EXISTS %I ON public.%I;
      CREATE POLICY %I ON public.%I FOR SELECT USING (true);
    ', pol, tbl, pol, tbl);
  END LOOP;
END$$;

-- ── users: own row + service role sees all ────────────────────────────────────
DROP POLICY IF EXISTS "users_own_select"  ON public.users;
DROP POLICY IF EXISTS "users_own_update"  ON public.users;
DROP POLICY IF EXISTS "users_service_all" ON public.users;
CREATE POLICY "users_own_select"  ON public.users FOR SELECT USING (auth.uid()::text = id OR auth.role() = 'service_role');
CREATE POLICY "users_own_update"  ON public.users FOR UPDATE USING (auth.uid()::text = id OR auth.role() = 'service_role') WITH CHECK (true);
CREATE POLICY "users_service_all" ON public.users FOR ALL    USING (auth.role() = 'service_role') WITH CHECK (true);

-- ── user_addresses: own rows ──────────────────────────────────────────────────
DROP POLICY IF EXISTS "addr_own_select" ON public.user_addresses;
DROP POLICY IF EXISTS "addr_own_insert" ON public.user_addresses;
DROP POLICY IF EXISTS "addr_own_update" ON public.user_addresses;
DROP POLICY IF EXISTS "addr_own_delete" ON public.user_addresses;
DROP POLICY IF EXISTS "addr_service"    ON public.user_addresses;
CREATE POLICY "addr_own_select" ON public.user_addresses FOR SELECT USING (auth.uid()::text = user_id OR auth.role() = 'service_role');
CREATE POLICY "addr_own_insert" ON public.user_addresses FOR INSERT WITH CHECK (auth.uid()::text = user_id OR auth.role() = 'service_role');
CREATE POLICY "addr_own_update" ON public.user_addresses FOR UPDATE USING (auth.uid()::text = user_id OR auth.role() = 'service_role') WITH CHECK (true);
CREATE POLICY "addr_own_delete" ON public.user_addresses FOR DELETE USING (auth.uid()::text = user_id OR auth.role() = 'service_role');

-- ── orders: own rows ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "orders_own_select" ON public.orders;
DROP POLICY IF EXISTS "orders_own_insert" ON public.orders;
DROP POLICY IF EXISTS "orders_service"    ON public.orders;
CREATE POLICY "orders_own_select" ON public.orders FOR SELECT USING (auth.uid()::text = user_id OR auth.role() = 'service_role');
CREATE POLICY "orders_own_insert" ON public.orders FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "orders_service"    ON public.orders FOR ALL    USING (auth.role() = 'service_role') WITH CHECK (true);

-- ── order_items: visible to order owner ──────────────────────────────────────
DROP POLICY IF EXISTS "order_items_own_select" ON public.order_items;
DROP POLICY IF EXISTS "order_items_service"    ON public.order_items;
CREATE POLICY "order_items_own_select" ON public.order_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND (o.user_id = auth.uid()::text OR auth.role() = 'service_role')));
CREATE POLICY "order_items_service" ON public.order_items FOR ALL USING (auth.role() = 'service_role') WITH CHECK (true);

-- ── wishlists: own rows ───────────────────────────────────────────────────────
DROP POLICY IF EXISTS "wishlists_own_select" ON public.wishlists;
DROP POLICY IF EXISTS "wishlists_own_insert" ON public.wishlists;
DROP POLICY IF EXISTS "wishlists_own_delete" ON public.wishlists;
DROP POLICY IF EXISTS "wishlists_service"    ON public.wishlists;
CREATE POLICY "wishlists_own_select" ON public.wishlists FOR SELECT USING (auth.uid()::text = user_id OR auth.role() = 'service_role');
CREATE POLICY "wishlists_own_insert" ON public.wishlists FOR INSERT WITH CHECK (auth.uid()::text = user_id OR auth.role() = 'service_role');
CREATE POLICY "wishlists_own_delete" ON public.wishlists FOR DELETE USING (auth.uid()::text = user_id OR auth.role() = 'service_role');
CREATE POLICY "wishlists_service"    ON public.wishlists FOR ALL    USING (auth.role() = 'service_role') WITH CHECK (true);

-- ── cart_items: own rows ──────────────────────────────────────────────────────
DROP POLICY IF EXISTS "cart_own_select" ON public.cart_items;
DROP POLICY IF EXISTS "cart_own_insert" ON public.cart_items;
DROP POLICY IF EXISTS "cart_own_update" ON public.cart_items;
DROP POLICY IF EXISTS "cart_own_delete" ON public.cart_items;
DROP POLICY IF EXISTS "cart_service"    ON public.cart_items;
CREATE POLICY "cart_own_select" ON public.cart_items FOR SELECT USING (auth.uid()::text = user_id OR auth.role() = 'service_role');
CREATE POLICY "cart_own_insert" ON public.cart_items FOR INSERT WITH CHECK (auth.uid()::text = user_id OR auth.role() = 'service_role');
CREATE POLICY "cart_own_update" ON public.cart_items FOR UPDATE USING (auth.uid()::text = user_id OR auth.role() = 'service_role') WITH CHECK (true);
CREATE POLICY "cart_own_delete" ON public.cart_items FOR DELETE USING (auth.uid()::text = user_id OR auth.role() = 'service_role');

-- ── support_tickets: service role only ───────────────────────────────────────
DROP POLICY IF EXISTS "support_service" ON public.support_tickets;
CREATE POLICY "support_service" ON public.support_tickets FOR ALL USING (auth.role() = 'service_role') WITH CHECK (true);

-- ── ratings + sessions: service role only ────────────────────────────────────
DROP POLICY IF EXISTS "ratings_service"  ON public.ratings;
DROP POLICY IF EXISTS "sessions_service" ON public.sessions;
CREATE POLICY "ratings_service"  ON public.ratings  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (true);
CREATE POLICY "sessions_service" ON public.sessions FOR ALL USING (auth.role() = 'service_role') WITH CHECK (true);

-- ════════════════════════════════════════════════════════════════════════════
-- 4. STORAGE BUCKETS
-- ════════════════════════════════════════════════════════════════════════════
-- Single "ushamart" bucket for all uploads (products, categories, banners).
-- "category-images" kept for backward compat with old image URLs.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('ushamart', 'ushamart', true, 5242880,
        ARRAY['image/jpeg','image/png','image/webp','image/gif','image/svg+xml'])
ON CONFLICT (id) DO UPDATE SET
  public = true, file_size_limit = 5242880;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('category-images', 'category-images', true, 5242880,
        ARRAY['image/jpeg','image/png','image/webp','image/gif','image/svg+xml'])
ON CONFLICT (id) DO UPDATE SET
  public = true, file_size_limit = 5242880;

-- Drop old storage policies before recreating (safe)
DROP POLICY IF EXISTS "Allow public read access on storage objects"   ON storage.objects;
DROP POLICY IF EXISTS "Allow public insert access on storage objects" ON storage.objects;
DROP POLICY IF EXISTS "Allow public update access on storage objects" ON storage.objects;
DROP POLICY IF EXISTS "Allow public delete access on storage objects" ON storage.objects;
DROP POLICY IF EXISTS "storage_public_read"    ON storage.objects;
DROP POLICY IF EXISTS "storage_auth_insert"    ON storage.objects;
DROP POLICY IF EXISTS "storage_auth_update"    ON storage.objects;
DROP POLICY IF EXISTS "storage_service_delete" ON storage.objects;

-- Storage: public read; service role can write
CREATE POLICY "storage_public_read"    ON storage.objects FOR SELECT USING (true);
CREATE POLICY "storage_auth_insert"    ON storage.objects FOR INSERT WITH CHECK (
  auth.role() = 'service_role'
);
CREATE POLICY "storage_auth_update"    ON storage.objects FOR UPDATE USING (
  auth.role() = 'service_role'
) WITH CHECK (true);
CREATE POLICY "storage_service_delete" ON storage.objects FOR DELETE USING (
  auth.role() = 'service_role'
);

-- ════════════════════════════════════════════════════════════════════════════
-- 5. NOTIFY PostgREST to reload schema cache
-- ════════════════════════════════════════════════════════════════════════════
NOTIFY pgrst, 'reload schema';

-- ════════════════════════════════════════════════════════════════════════════
-- MIGRATION COMPLETE
-- ════════════════════════════════════════════════════════════════════════════
-- Verification Steps:
--   1. Check all tables exist: SELECT tablename FROM pg_tables WHERE schemaname = 'public';
--   2. Check RLS enabled: SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
--   3. Check storage buckets: SELECT * FROM storage.buckets;
--   4. Test backend connection with SERVICE_ROLE_KEY
-- ════════════════════════════════════════════════════════════════════════════

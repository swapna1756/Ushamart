-- ═══════════════════════════════════════════════════════════════════════════
-- UshaMart Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query → Run
-- ═══════════════════════════════════════════════════════════════════════════

-- Drop existing tables (clean slate)
DROP TABLE IF EXISTS public.ratings          CASCADE;
DROP TABLE IF EXISTS public.support_tickets  CASCADE;
DROP TABLE IF EXISTS public.product_reviews  CASCADE;
DROP TABLE IF EXISTS public.notifications    CASCADE;
DROP TABLE IF EXISTS public.orders           CASCADE;
DROP TABLE IF EXISTS public.special_offers   CASCADE;
DROP TABLE IF EXISTS public.banners          CASCADE;
DROP TABLE IF EXISTS public.coupons          CASCADE;
DROP TABLE IF EXISTS public.pincodes         CASCADE;
DROP TABLE IF EXISTS public.products         CASCADE;
DROP TABLE IF EXISTS public.categories       CASCADE;
DROP TABLE IF EXISTS public.users            CASCADE;
DROP TABLE IF EXISTS public.sessions         CASCADE;

-- ── 1. Users ─────────────────────────────────────────────────────────────────
CREATE TABLE public.users (
  id           TEXT PRIMARY KEY,
  name         TEXT,
  email        TEXT,
  password     TEXT,
  phone        TEXT,
  role         TEXT    DEFAULT 'customer',
  status       TEXT    DEFAULT 'active',
  address_text TEXT,
  pincode      TEXT,
  house        TEXT,
  street       TEXT,
  area         TEXT,
  landmark     TEXT,
  city         TEXT,
  state        TEXT,
  dob          TEXT,
  gender       TEXT,
  profile_pic  TEXT,
  total_orders INTEGER DEFAULT 0,
  total_spent  NUMERIC DEFAULT 0,
  registered_at BIGINT,
  last_login   BIGINT,
  created_at   BIGINT  DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  updated_at   BIGINT  DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
);

-- ── 2. Categories ─────────────────────────────────────────────────────────────
CREATE TABLE public.categories (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  description   TEXT,
  emoji_icon    TEXT,
  icon          TEXT,
  banner        TEXT,
  section       TEXT    DEFAULT 'Grocery & Kitchen',
  status        TEXT    DEFAULT 'published',
  featured      BOOLEAN DEFAULT FALSE,
  display_order INTEGER DEFAULT 0,
  created_at    BIGINT  DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  updated_at    BIGINT  DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
);

-- ── 3. Products ───────────────────────────────────────────────────────────────
CREATE TABLE public.products (
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
  variant_list        JSONB   DEFAULT '[]'::JSONB,
  images              JSONB   DEFAULT '[]'::JSONB,
  mrp                 NUMERIC DEFAULT 0,
  price               NUMERIC NOT NULL DEFAULT 0,
  discount_percent    NUMERIC DEFAULT 0,
  stock               INTEGER DEFAULT 0,
  low_stock_alert     INTEGER DEFAULT 10,
  status              TEXT    DEFAULT 'draft',
  availability_status TEXT    DEFAULT 'draft',
  pincodes_available  JSONB   DEFAULT '[]'::JSONB,
  featured            BOOLEAN DEFAULT FALSE,
  best_seller         BOOLEAN DEFAULT FALSE,
  new_arrival         BOOLEAN DEFAULT FALSE,
  trending            BOOLEAN DEFAULT FALSE,
  today_offer         BOOLEAN DEFAULT FALSE,
  expiry_date         TEXT,
  gst                 TEXT    DEFAULT '5',
  delivery_time       TEXT    DEFAULT '1-2 Days',
  cod                 BOOLEAN DEFAULT TRUE,
  specifications      TEXT,
  created_at          BIGINT  DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  updated_at          BIGINT  DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
);

-- ── 4. Pincodes ───────────────────────────────────────────────────────────────
CREATE TABLE public.pincodes (
  id            TEXT PRIMARY KEY,
  code          TEXT UNIQUE NOT NULL,
  area_name     TEXT,
  city          TEXT,
  state         TEXT,
  charges       NUMERIC DEFAULT 0,
  delivery_time TEXT    DEFAULT '1-2 Days',
  enabled       BOOLEAN DEFAULT TRUE,
  created_at    BIGINT  DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  updated_at    BIGINT  DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
);

-- ── 5. Orders ─────────────────────────────────────────────────────────────────
CREATE TABLE public.orders (
  id              TEXT PRIMARY KEY,
  order_number    TEXT,
  user_id         TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  user_name       TEXT,
  user_phone      TEXT,
  user_email      TEXT,
  address_text    TEXT,
  pincode         TEXT,
  items           JSONB   DEFAULT '[]'::JSONB,
  subtotal        NUMERIC DEFAULT 0,
  delivery_charges NUMERIC DEFAULT 0,
  discount_amount NUMERIC DEFAULT 0,
  total_amount    NUMERIC DEFAULT 0,
  coupon_code     TEXT,
  status          TEXT    DEFAULT 'Pending',
  payment_method  TEXT    DEFAULT 'COD',
  payment_status  TEXT    DEFAULT 'Pending',
  delivery_slot   TEXT,
  created_at      BIGINT  DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  updated_at      BIGINT  DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
);

-- ── 6. Banners ────────────────────────────────────────────────────────────────
CREATE TABLE public.banners (
  id            TEXT PRIMARY KEY,
  title         TEXT NOT NULL,
  subtitle      TEXT,
  badge_text    TEXT,
  button_text   TEXT,
  button_dest   TEXT,
  bg_gradient   TEXT,
  bg_color      TEXT,
  image_url     TEXT,
  active        BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_at    BIGINT  DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  updated_at    BIGINT  DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
);

-- ── 7. Special Offers ─────────────────────────────────────────────────────────
CREATE TABLE public.special_offers (
  id            TEXT PRIMARY KEY,
  title         TEXT NOT NULL,
  subtitle      TEXT,
  badge_text    TEXT,
  button_text   TEXT,
  image_url     TEXT,
  bg_color      TEXT,
  offer_type    TEXT    DEFAULT 'general',
  linked_cat_id TEXT,
  linked_prod_id TEXT,
  multi_prod_ids JSONB  DEFAULT '[]'::JSONB,
  start_date    TEXT,
  end_date      TEXT,
  status        TEXT    DEFAULT 'active',
  active        BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_at    BIGINT  DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  updated_at    BIGINT  DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
);

-- ── 8. Coupons ────────────────────────────────────────────────────────────────
CREATE TABLE public.coupons (
  id          TEXT PRIMARY KEY,
  code        TEXT UNIQUE NOT NULL,
  type        TEXT    NOT NULL,
  value       NUMERIC NOT NULL,
  min_spend   NUMERIC DEFAULT 0,
  description TEXT,
  status      TEXT    DEFAULT 'published',
  created_at  BIGINT  DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  updated_at  BIGINT  DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
);

-- ── 9. Notifications ──────────────────────────────────────────────────────────
CREATE TABLE public.notifications (
  id         TEXT PRIMARY KEY,
  title      TEXT NOT NULL,
  content    TEXT,
  message    TEXT,
  type       TEXT    DEFAULT 'promotional',
  status     TEXT    DEFAULT 'published',
  sent_time  BIGINT  DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  created_at BIGINT  DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  updated_at BIGINT  DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
);

-- ── 10. Support Tickets ───────────────────────────────────────────────────────
CREATE TABLE public.support_tickets (
  id           TEXT PRIMARY KEY,
  user_id      TEXT,
  user_name    TEXT,
  user_phone   TEXT,
  type         TEXT,
  message      TEXT,
  status       TEXT DEFAULT 'open',
  reply        TEXT,
  created_at   BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  updated_at   BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
);

-- ── 11. Ratings ───────────────────────────────────────────────────────────────
CREATE TABLE public.ratings (
  id         TEXT PRIMARY KEY,
  order_id   TEXT REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id    TEXT,
  ratings    JSONB DEFAULT '{}'::JSONB,
  created_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  updated_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
);

-- ── 12. Product Reviews ───────────────────────────────────────────────────────
CREATE TABLE public.product_reviews (
  id         TEXT PRIMARY KEY,
  product_id TEXT REFERENCES public.products(id) ON DELETE CASCADE,
  user_id    TEXT,
  user_name  TEXT,
  rating     INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment    TEXT,
  verified   BOOLEAN DEFAULT FALSE,
  created_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  updated_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
);

-- ── Row Level Security (allow all for now) ────────────────────────────────────
ALTER TABLE public.users             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pincodes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.special_offers    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_reviews   ENABLE ROW LEVEL SECURITY;

-- Open policies (backend uses service key — restrict in production)
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'users','categories','products','pincodes','orders','banners',
    'special_offers','coupons','notifications','support_tickets',
    'ratings','product_reviews'
  ] LOOP
    EXECUTE format('CREATE POLICY "allow_all_%s" ON public.%I FOR ALL USING (true) WITH CHECK (true)', t, t);
  END LOOP;
END$$;

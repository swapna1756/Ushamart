-- ═══════════════════════════════════════════════════════════════════════════
-- UshaMart Migration: Remove FK constraints that block product creation
-- Run this in: Supabase Dashboard → SQL Editor → New Query → Run
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Drop FK on products.category → allows products to use any category string
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_category_fkey;

-- 2. Drop FK on orders.user_id → allows orders from guest/Firebase users
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_user_id_fkey;

-- 3. Add wishlist column to users (if not already present)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS wishlist JSONB DEFAULT '[]'::JSONB;

-- 4. Add missing columns to notifications (if not already present)
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general';
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal';
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS target_audience TEXT DEFAULT 'all';
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS scheduled_at BIGINT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS expires_at BIGINT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS read_by JSONB DEFAULT '[]'::JSONB;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS message TEXT;

-- 5. Verify
SELECT 'products FK dropped, wishlist column added, notifications updated' AS result;

-- Supabase SQL Schema for UshaMart Grocery Delivery App MVP
-- Run this in your Supabase SQL Editor to set up the database tables

-- Clean Up existing tables (if any)
DROP TABLE IF EXISTS public.ratings CASCADE;
DROP TABLE IF EXISTS public.support_tickets CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.pincode_configs CASCADE;
DROP TABLE IF EXISTS public.pincodes CASCADE;
DROP TABLE IF EXISTS public.coupons CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.banners CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- 1. Users / Profiles Table
CREATE TABLE public.users (
  "id" text PRIMARY KEY, -- matches auth.users.id (uuid) or local session id
  "name" text,
  "phone" text,
  "email" text,
  "addressText" text,
  "status" text DEFAULT 'active', -- active, blocked
  "role" text DEFAULT 'customer', -- customer, super_admin, store_manager
  "totalOrders" integer DEFAULT 0,
  "totalSpent" numeric DEFAULT 0.00,
  "updatedAt" bigint DEFAULT (extract(epoch from now()) * 1000)::bigint
);

-- 2. Categories Table
CREATE TABLE public.categories (
  "id" text PRIMARY KEY,
  "name" text NOT NULL,
  "icon" text,
  "image" text, -- Category image URL
  "section" text DEFAULT 'Grocery & Kitchen', -- 'Grocery & Kitchen', 'Food & Beverages'
  "status" text DEFAULT 'published', -- published, draft
  "updatedAt" bigint DEFAULT (extract(epoch from now()) * 1000)::bigint
);

-- 3. Products Table
CREATE TABLE public.products (
  "id" text PRIMARY KEY,
  "name" text NOT NULL,
  "description" text,
  "category" text REFERENCES public.categories("id") ON DELETE SET NULL,
  "subcategory" text,
  "department" text DEFAULT 'Grocery',
  "brand" text,
  "variants" text,
  "variantList" jsonb DEFAULT '[]'::jsonb,
  "locationId" text,
  "specifications" text,
  "price" numeric NOT NULL DEFAULT 0,
  "mrp" numeric NOT NULL DEFAULT 0,
  "discountPercent" numeric DEFAULT 0,
  "stock" integer DEFAULT 0,
  "lowStockAlert" integer DEFAULT 10,
  "unit" text,
  "sku" text,
  "barcode" text,
  "expiryDate" text,
  "gst" text DEFAULT '5',
  "images" jsonb DEFAULT '[]'::jsonb,
  "status" text DEFAULT 'draft',
  "availabilityStatus" text DEFAULT 'draft',
  "pincodesAvailable" jsonb DEFAULT '[]'::jsonb,
  "featured" boolean DEFAULT false,
  "bestSeller" boolean DEFAULT false,
  "newArrival" boolean DEFAULT false,
  "trending" boolean DEFAULT false,
  "todayOffer" boolean DEFAULT false,
  "cod" boolean DEFAULT true,
  "deliveryTime" text DEFAULT '1-2 Days',
  "weight" text,
  "tags" jsonb DEFAULT '[]'::jsonb,
  "createdAt" bigint DEFAULT (extract(epoch from now()) * 1000)::bigint,
  "updatedAt" bigint DEFAULT (extract(epoch from now()) * 1000)::bigint
);

-- 4. Banners Table
CREATE TABLE public.banners (
  "id" text PRIMARY KEY,
  "title" text NOT NULL,
  "badge" text DEFAULT 'Special Offer',
  "image" text,
  "updatedAt" bigint DEFAULT (extract(epoch from now()) * 1000)::bigint
);

-- 5. Coupons Table
CREATE TABLE public.coupons (
  "id" text PRIMARY KEY,
  "code" text UNIQUE NOT NULL,
  "type" text NOT NULL, -- percentage, flat, free_delivery
  "value" numeric NOT NULL,
  "minSpend" numeric DEFAULT 0,
  "description" text,
  "status" text DEFAULT 'published', -- published, draft
  "updatedAt" bigint DEFAULT (extract(epoch from now()) * 1000)::bigint
);

-- 6. Pincodes Table
CREATE TABLE public.pincodes (
  "id" text PRIMARY KEY, -- the pincode itself (e.g. '560001')
  "code" text UNIQUE NOT NULL,
  "updatedAt" bigint DEFAULT (extract(epoch from now()) * 1000)::bigint
);

-- 7. Pincode Configs Table
CREATE TABLE public.pincode_configs (
  "id" text PRIMARY KEY,
  "code" text REFERENCES public.pincodes("code") ON DELETE CASCADE,
  "charges" numeric DEFAULT 0.00,
  "time" text DEFAULT '1-2 Days Delivery',
  "enabled" boolean DEFAULT true,
  "areaName" text,
  "city" text,
  "district" text,
  "state" text,
  "minOrder" numeric DEFAULT 0.00,
  "updatedAt" bigint DEFAULT (extract(epoch from now()) * 1000)::bigint
);

-- 8. Orders Table
CREATE TABLE public.orders (
  "id" text PRIMARY KEY,
  "userId" text REFERENCES public.users("id") ON DELETE SET NULL,
  "userName" text,
  "userPhone" text,
  "userEmail" text,
  "addressText" text,
  "pincode" text,
  "items" jsonb DEFAULT '[]'::jsonb, -- array of items purchased
  "subtotal" numeric,
  "deliveryCharges" numeric,
  "discountAmount" numeric DEFAULT 0.00,
  "totalAmount" numeric,
  "couponCode" text,
  "status" text DEFAULT 'Pending', -- Pending, Confirmed, Packed, Out for Delivery, Delivered, Cancelled
  "paymentMethod" text DEFAULT 'COD',
  "deliverySlot" text,
  "createdAt" bigint,
  "updatedAt" bigint DEFAULT (extract(epoch from now()) * 1000)::bigint
);

-- 9. Notifications Table
CREATE TABLE public.notifications (
  "id" text PRIMARY KEY,
  "title" text NOT NULL,
  "content" text,
  "type" text DEFAULT 'promotional', -- promotional, order_update
  "sentTime" bigint DEFAULT (extract(epoch from now()) * 1000)::bigint,
  "updatedAt" bigint DEFAULT (extract(epoch from now()) * 1000)::bigint
);

-- 10. Support Tickets Table
CREATE TABLE public.support_tickets (
  "id" text PRIMARY KEY,
  "userId" text,
  "userName" text,
  "userPhone" text,
  "subject" text,
  "message" text,
  "status" text DEFAULT 'open', -- open, resolved
  "reply" text,
  "updatedAt" bigint DEFAULT (extract(epoch from now()) * 1000)::bigint
);

-- 11. Ratings Table
CREATE TABLE public.ratings (
  "id" text PRIMARY KEY,
  "orderId" text REFERENCES public.orders("id") ON DELETE CASCADE,
  "rating" integer CHECK (rating >= 1 AND rating <= 5),
  "feedback" text,
  "updatedAt" bigint DEFAULT (extract(epoch from now()) * 1000)::bigint
);

-- Seed Default Database Values

-- Pincodes
INSERT INTO public.pincodes ("id", "code") VALUES 
('530001', '530001'),
('560001', '560001'),
('560002', '560002'),
('110001', '110001'),
('400001', '400001');

-- Pincode Configs
INSERT INTO public.pincode_configs ("id", "code", "charges", "time", "enabled") VALUES
('cfg_1', '530001', 0, 'Same Day Delivery', true),
('cfg_2', '560001', 0, 'Same Day Delivery', true),
('cfg_3', '560002', 2.50, '1-2 Days Delivery', true),
('cfg_4', '110001', 3.99, '2-3 Days Delivery', true),
('cfg_5', '400001', 1.99, '1-2 Days Delivery', true);

-- Coupons
INSERT INTO public.coupons ("id", "code", "type", "value", "minSpend", "description", "status") VALUES
('c1', 'WELCOME20', 'percentage', 20, 10, '20% off on orders above $10', 'published'),
('c2', 'USHA10', 'flat', 10, 40, 'Flat $10 off on orders above $40', 'published'),
('c3', 'FREESHIP', 'free_delivery', 0, 15, 'Free delivery on orders above $15', 'published');

-- Categories (Inspired by screenshot list)
INSERT INTO public.categories ("id", "name", "icon", "section", "status") VALUES
-- Section: Grocery & Kitchen
('cat_fruits_veg', 'Fruits & Vegetables', 'https://images.unsplash.com/photo-1610832958506-ee56336191a1?w=150&q=80', 'Grocery & Kitchen', 'published'),
('cat_oil_ghee', 'Oil & Ghee', 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=150&q=80', 'Grocery & Kitchen', 'published'),
('cat_atta_rice', 'Atta, Rice & Masala', 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=150&q=80', 'Grocery & Kitchen', 'published'),
('cat_dals_pulses', 'Dals & Pulses', 'https://images.unsplash.com/photo-1585993003614-b1433f800817?w=150&q=80', 'Grocery & Kitchen', 'published'),
('cat_kitchenware', 'Kitchenware', 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=150&q=80', 'Grocery & Kitchen', 'published'),
('cat_kitchen_appl', 'Kitchen Appliances', 'https://images.unsplash.com/photo-1621972750749-0fbb1abb7736?w=150&q=80', 'Grocery & Kitchen', 'published'),

-- Section: Food & Beverages
('cat_tea_coffee', 'Tea, Coffee & Milks', 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=150&q=80', 'Food & Beverages', 'published'),
('cat_beverages', 'Soft Drinks & Juices', 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=150&q=80', 'Food & Beverages', 'published'),
('cat_biscuits', 'Biscuits & Cookies', 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=150&q=80', 'Food & Beverages', 'published'),
('cat_snacks', 'Chips & Namkeen', 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=150&q=80', 'Food & Beverages', 'published');

-- Products
INSERT INTO public.products ("id", "name", "description", "category", "brand", "variants", "locationId", "price", "mrp", "stock", "unit", "images", "status", "pincodesAvailable") VALUES
-- Fruits & Vegetables
('prod_apple', 'Royal Gala Apples', 'Sweet, crisp and imported fresh apples.', 'cat_fruits_veg', 'Fresh Farms', '500g, 1kg', 'Aisle A-1', 4.50, 6.00, 30, '1kg', '["https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=150&q=80"]'::jsonb, 'published', '["530001", "560001", "560002", "110001", "400001"]'::jsonb),
('prod_broccoli', 'Fresh Organic Broccoli', 'Healthy green vegetable rich in fiber.', 'cat_fruits_veg', 'EcoFarms', '250g', 'Aisle A-2', 2.20, 2.80, 25, '250g', '["https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=150&q=80"]'::jsonb, 'published', '["530001", "560001", "560002", "110001", "400001"]'::jsonb),

-- Oil & Ghee
('prod_ghee', 'Pure Cow Ghee', 'Pure premium clarified cow ghee butter.', 'cat_oil_ghee', 'Amul', '500ml, 1L', 'Aisle B-1', 8.50, 10.00, 45, '500ml', '["https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=150&q=80"]'::jsonb, 'published', '["530001", "560001", "560002", "110001", "400001"]'::jsonb),
('prod_oil', 'Sunflower Refined Oil', 'Healthy cooking refined cooking sunflower oil.', 'cat_oil_ghee', 'Gold Winner', '1L', 'Aisle B-2', 3.20, 4.00, 50, '1L', '["https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=150&q=80"]'::jsonb, 'published', '["530001", "560001", "560002", "110001", "400001"]'::jsonb),

-- Atta, Rice & Masala
('prod_atta', 'Shudh Chakki Atta', 'Premium 100% whole wheat stone ground flour.', 'cat_atta_rice', 'Ashirvaad', '5kg, 10kg', 'Aisle C-1', 9.00, 11.50, 40, '5kg', '["https://images.unsplash.com/photo-1586201375761-83865001e31c?w=150&q=80"]'::jsonb, 'published', '["530001", "560001", "560002", "110001", "400001"]'::jsonb),
('prod_rice', 'Basmati Premium Rice', 'Long grain fragrant basmati rice.', 'cat_atta_rice', 'Fortune', '1kg', 'Aisle C-2', 4.80, 5.50, 60, '1kg', '["https://images.unsplash.com/photo-1586201375761-83865001e31c?w=150&q=80"]'::jsonb, 'published', '["530001", "560001", "560002", "110001", "400001"]'::jsonb),

-- Dals & Pulses
('prod_dal', ' टाटा सम्पन्न अरहर दाल', 'Tata Sampann unpolished split toor dal.', 'cat_dals_pulses', 'Tata', '1kg', 'Aisle D-1', 2.90, 3.50, 40, '1kg', '["https://images.unsplash.com/photo-1585993003614-b1433f800817?w=150&q=80"]'::jsonb, 'published', '["530001", "560001", "560002", "110001", "400001"]'::jsonb),

-- Kitchenware & Appliances
('prod_cooker', 'Hawkins Pressure Cooker', 'Premium quality classic aluminum cooker 3L.', 'cat_kitchenware', 'Hawkins', '3L', 'Aisle E-1', 25.00, 30.00, 15, '1 unit', '["https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=150&q=80"]'::jsonb, 'published', '["530001", "560001", "560002", "110001", "400001"]'::jsonb),
('prod_fryer', 'Philips Digital Air Fryer', 'Healthy digital air fryer for low oil frying.', 'cat_kitchen_appl', 'Philips', '4L', 'Aisle E-3', 89.00, 110.00, 10, '1 unit', '["https://images.unsplash.com/photo-1621972750749-0fbb1abb7736?w=150&q=80"]'::jsonb, 'published', '["530001", "560001", "560002", "110001", "400001"]'::jsonb),

-- Beverages
('prod_cola', 'Coca-Cola Can', 'Chilled refreshing carbonated soft drink.', 'cat_beverages', 'Coca-Cola', '330ml', 'Aisle F-1', 1.20, 1.50, 120, '330ml', '["https://images.unsplash.com/photo-1613478223719-2ab802602423?w=150&q=80"]'::jsonb, 'published', '["530001", "560001", "560002", "110001", "400001"]'::jsonb),
('prod_juice', 'Tropicana Orange Juice', '100% pure squeezed orange fruit juice.', 'cat_beverages', 'Tropicana', '1L', 'Aisle F-2', 3.80, 4.50, 50, '1L', '["https://images.unsplash.com/photo-1613478223719-2ab802602423?w=150&q=80"]'::jsonb, 'published', '["530001", "560001", "560002", "110001", "400001"]'::jsonb),

-- Biscuits & Cookies
('prod_oreo', 'Oreo Chocolate Biscuits', 'Vanilla creme filled sweet sandwich cookies.', 'cat_biscuits', 'Oreo', '120g', 'Aisle G-1', 1.00, 1.20, 80, '120g', '["https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=150&q=80"]'::jsonb, 'published', '["530001", "560001", "560002", "110001", "400001"]'::jsonb),

-- Chips & Namkeen
('prod_chips', 'Lays Classic Salted', 'Crispy potato chips with light classic salt flavor.', 'cat_snacks', 'Lays', '50g', 'Aisle H-1', 0.90, 1.00, 150, '50g', '["https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=150&q=80"]'::jsonb, 'published', '["530001", "560001", "560002", "110001", "400001"]'::jsonb);

-- Banners
INSERT INTO public.banners ("id", "title", "badge", "image") VALUES
('b1', '20% OFF ON STAPLES', 'OFFER', 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&q=80'),
('b2', 'FRESH VEGETABLES ZONE', '50% DEALS', 'https://images.unsplash.com/photo-1610832958506-ee56336191a1?w=600&q=80');

-- Notifications
INSERT INTO public.notifications ("id", "title", "content", "type") VALUES
('n1', 'First Order Offer!', 'Get 20% off on your first order. Use coupon WELCOME20.', 'promotional'),
('n2', 'Super Fast 30m Delivery active!', 'Delivering fresh items directly to you in 30 minutes!', 'promotional');

-- Row Level Security (RLS) policies setting
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pincodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pincode_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all actions public" ON public.users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all actions public" ON public.categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all actions public" ON public.products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all actions public" ON public.banners FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all actions public" ON public.coupons FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all actions public" ON public.pincodes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all actions public" ON public.pincode_configs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all actions public" ON public.orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all actions public" ON public.notifications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all actions public" ON public.support_tickets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all actions public" ON public.ratings FOR ALL USING (true) WITH CHECK (true);

# UshaMart — Supabase Production Setup Guide

This document is the single, authoritative reference for connecting UshaMart
to Supabase as its permanent production database.  Follow every step in order.

---

## Architecture Overview

```
┌─────────────────────┐     HTTPS/API      ┌──────────────────────────┐
│  User Portal        │ ──────────────────► │  Admin Backend           │
│  (Netlify)          │                     │  (Render — Node/Express) │
│  React + Firebase   │                     │                          │
│  Auth               │                     │  Uses SERVICE ROLE key   │
└─────────────────────┘                     │  → bypasses RLS          │
                                            └────────────┬─────────────┘
┌─────────────────────┐     HTTPS/API               service_role
│  Admin Portal       │ ──────────────────►               │
│  (Netlify)          │                     ┌─────────────▼─────────────┐
│  React only         │                     │  Supabase (PostgreSQL)    │
└─────────────────────┘                     │  Single source of truth   │
                                            │  for BOTH portals         │
                                            └───────────────────────────┘
```

**Key rule:** The frontend apps NEVER connect directly to Supabase. All database
access goes through the Express backend, which holds the service-role key.

---

## Step 1 — Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) → New Project.
2. Choose a region close to your users (India → `ap-south-1`).
3. Set a strong database password and save it.
4. Wait for provisioning (≈ 2 minutes).
5. **Note down:**
   - **Project URL** — looks like `https://xkooguvxhh.supabase.co`
   - **Service Role Key** — Settings → API → `service_role` (secret)

> ⚠  Never expose the service-role key in any frontend code, Git repo, or
> public URL. It bypasses all Row Level Security.

---

## Step 2 — Run the Schema SQL

1. In Supabase Dashboard → **SQL Editor** → **New Query**.
2. Open `admin/backend/src/database/schema.sql`.
3. Paste the entire file contents into the editor.
4. Click **Run**.

Expected output: `Success. No rows returned.`

The schema creates 17 tables, 20+ indexes, RLS policies, and two storage
buckets (`ushamart`, `category-images`). It is safe to re-run on an existing
database — it uses `CREATE TABLE IF NOT EXISTS` and `ON CONFLICT DO NOTHING`
throughout.

### Tables created

| Table | Purpose |
|---|---|
| `users` | All accounts — admins and customers |
| `categories` | Product categories |
| `products` | Products with variants, images, stock |
| `pincodes` | Serviceable delivery pincodes |
| `user_addresses` | Customer delivery addresses |
| `orders` | Order headers |
| `order_items` | Individual line items per order |
| `wishlists` | User × product wishlist rows |
| `cart_items` | Server-side cart (logged-in users) |
| `banners` | Home page promotional banners |
| `special_offers` | Home page offer cards |
| `coupons` | Discount coupon codes |
| `notifications` | Push/in-app notifications |
| `support_tickets` | Customer support requests |
| `ratings` | Order delivery ratings |
| `product_reviews` | Per-product customer reviews |
| `sessions` | Reserved — backend session tracking |

---

## Step 3 — Configure the Admin Backend

Copy `.env.example` to `.env` in `admin/backend/`:

```bash
cp admin/backend/.env.example admin/backend/.env
```

Fill in every value:

```env
PORT=5000
NODE_ENV=production

# JWT — generate with: openssl rand -base64 48
JWT_SECRET=<your-long-random-secret>
JWT_EXPIRES_IN=7d

# Supabase
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...YOUR_SERVICE_ROLE_KEY

# Firebase Admin (for verifying user login tokens)
# Paste the entire service-account JSON as a single line:
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"ushamart-wholesale",...}

# Admin seed credentials
ADMIN_EMAIL=admin@ushamart.in
ADMIN_PASSWORD=ChangeThisStrongPassword123!
```

### On Render (production)

Dashboard → Your Service → **Environment** → Add each variable:

| Key | Value |
|---|---|
| `SUPABASE_URL` | `https://YOUR_PROJECT_REF.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | the `service_role` secret key |
| `JWT_SECRET` | your 48-char random string |
| `JWT_EXPIRES_IN` | `7d` |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | full JSON on one line |
| `ADMIN_EMAIL` | your admin email |
| `ADMIN_PASSWORD` | strong password |
| `NODE_ENV` | `production` |

> After adding env vars, click **Manual Deploy → Deploy latest commit**.

---

## Step 4 — Seed Initial Data (first deployment only)

```bash
cd admin/backend
npm install
node src/database/seed.js
```

This creates:
- 1 super-admin user (from `ADMIN_EMAIL` / `ADMIN_PASSWORD`)
- 10 sample categories
- 14 sample products
- 5 serviceable pincodes
- 2 banners, 1 special offer, 3 coupons, 2 notifications

> Skip this step if you already have live data in Supabase.

---

## Step 5 — Migrate Existing Local Data (if applicable)

If you have existing data in the local JSON files (`admin/backend/src/database/data/*.json`):

```bash
cd admin/backend
node src/database/migrate.js
```

The migrate script:
- Upserts all tables (never deletes valid rows)
- Migrates `users[].wishlist[]` → `wishlists` table
- Migrates `orders[].items[]` → `order_items` table
- Prints a row-count verification at the end

---

## Step 6 — Configure the User Frontend

### Local development

```bash
cp user/frontend/.env.example user/frontend/.env
# Edit VITE_API_URL if your backend runs on a different port
```

### Netlify (production)

The `user/frontend/netlify.toml` already sets `VITE_API_URL=https://ushamart.onrender.com`.
If your backend URL is different, update it in:
- `user/frontend/netlify.toml` → `[build.environment]`
- Netlify Dashboard → Site Configuration → Environment Variables

No Supabase keys are needed in the user frontend.

---

## Step 7 — Configure the Admin Frontend

### Netlify (production)

The `admin/frontend/netlify.toml` already sets `VITE_API_URL=https://ushamart.onrender.com`.
If your backend URL is different, update `admin/frontend/netlify.toml`.

No Supabase keys are needed in the admin frontend.

---

## Step 8 — Verify the Connection

### Backend health check

```
GET https://ushamart.onrender.com/health
```

Expected response:
```json
{
  "status": "ok",
  "service": "UshaMart Admin API",
  "database": "ready",
  "timestamp": "..."
}
```

If `"database": "misconfigured"`, the `SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY`
env var is missing or wrong on Render.

### Admin login

1. Open the admin portal.
2. Login with `ADMIN_EMAIL` / `ADMIN_PASSWORD`.
3. Dashboard should show correct counts from Supabase.

### Product → User portal

1. In admin portal: create a product, set status = Published.
2. Open the user portal and refresh.
3. The new product should appear immediately (same Supabase database).

---

## Step 9 — End-to-End Test Checklist

Run through each flow after deployment:

### Admin → Supabase → User sync

- [ ] Create category in admin → visible in user portal category list
- [ ] Create product (status: published) → visible in user portal home/search
- [ ] Update product price → user portal shows updated price
- [ ] Update product stock to 0 → user portal shows out-of-stock
- [ ] Upload product image → image loads in user portal
- [ ] Create banner → banner appears on user portal home
- [ ] Create coupon → coupon works at checkout

### User portal flows

- [ ] Sign up (email + password) → verify email → login
- [ ] Add product to cart → refresh page → cart persists
- [ ] Login on different browser → cart from server appears
- [ ] Add to wishlist → refresh → wishlist persists
- [ ] Add delivery address → address saved in Supabase
- [ ] Proceed to checkout → select COD → place order
- [ ] Order confirmation screen shown
- [ ] Order appears in admin portal orders list
- [ ] Admin changes order status → status updates in user "My Orders"

### Data persistence

- [ ] Restart backend → cart, wishlist, orders still exist
- [ ] Redeploy backend → no data lost
- [ ] 24+ hours later → all data still present

---

## Troubleshooting

### `"database": "misconfigured"` on health check

The backend cannot connect to Supabase.

1. Check `SUPABASE_URL` starts with `https://` and ends with `.supabase.co`
2. Check `SUPABASE_SERVICE_ROLE_KEY` starts with `eyJ` and is the **service_role** key
   (not the `anon` key)
3. On Render, verify the env vars were saved and a new deploy was triggered

### `RLS policy violation` errors

The backend must use the **service-role** key, not the anon key. Service-role
bypasses RLS. If you see RLS errors, the wrong key is configured.

### `relation "public.wishlists" does not exist`

The schema SQL was not run or ran with errors. Re-run `schema.sql` in the
Supabase SQL Editor.

### `relation "public.order_items" does not exist`

Same as above — run the full `schema.sql`. The `order_items` table is defined
there. The old `migrations/20260817_order_checkout.sql` is superseded by
`schema.sql v3` and does not need to be run separately.

### `relation "public.cart_items" does not exist`

Same — run `schema.sql`. The `cart_items` table is new in schema v3.

### Cart not persisting across devices

Ensure the user is logged in (not a guest). Guest carts are localStorage-only.
After login, the frontend syncs the local cart to Supabase automatically.

### Images not loading after upload

Check that the `ushamart` bucket exists in Supabase Storage and is set to
**Public**. The `schema.sql` creates both `ushamart` and `category-images`
buckets with `public = true`.

---

## Security Notes

| Key | Where it lives | Exposed to browser? |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Render env var only | ❌ Never |
| `JWT_SECRET` | Render env var only | ❌ Never |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Render env var only | ❌ Never |
| Firebase web config (`apiKey` etc.) | User frontend bundle | ✅ Safe by design |
| `VITE_API_URL` | Both frontend bundles | ✅ Public |

RLS policies ensure that even if someone uses the Supabase anon key directly:
- Users can only see their own orders, addresses, cart, and wishlist
- Product/category catalog is read-only for anon
- No INSERT/UPDATE/DELETE is possible without the service-role key

---

## File Reference

```
admin/backend/
├── .env.example                          ← copy to .env, fill in values
├── src/database/
│   ├── schema.sql                        ← run this in Supabase SQL Editor
│   ├── seed.js                           ← initial data (first deploy only)
│   ├── migrate.js                        ← migrate local JSON → Supabase
│   ├── db.js                             ← unified DB adapter
│   └── supabase.js                       ← Supabase client + bucket init

user/frontend/
├── .env.example                          ← copy to .env for local dev
├── netlify.toml                          ← VITE_API_URL + SPA routing
└── src/
    ├── firebase.js                       ← Firebase auth (reads VITE_FIREBASE_*)
    ├── services/api.js                   ← all API calls including cartApi
    └── context/CartContext.jsx           ← dual-layer cart persistence

admin/frontend/
├── .env.example                          ← copy to .env for local dev
└── netlify.toml                          ← VITE_API_URL + SPA routing
```

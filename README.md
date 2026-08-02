# UshaMart — Full-Stack Grocery Delivery Platform

Two completely independent applications with a shared REST API backend.

---

## Project Structure

```
Ushamart/
├── admin/
│   ├── backend/          Node.js + Express REST API  (port 5000)
│   └── frontend/         React Admin Portal          (port 3000)
│
├── user/
│   └── frontend/         React User Application      (port 8080)
│
├── shared/
│   ├── api_docs/         REST API endpoint reference
│   └── common_models/    Shared data model definitions
│
└── Ushamart/             Legacy monorepo (reference only — DO NOT USE)
```

---

## Quick Start

### Step 1 — Start the Backend API

```bash
cd admin/backend
npm install
npm run seed          # seed database with default data (run once)
npm run dev           # http://localhost:5000
```

### Step 2 — Start the Admin Portal (new terminal)

```bash
cd admin/frontend
npm install
npm run dev           # http://localhost:3000
```

**Login:** admin@ushamart.com / Admin@123

### Step 3 — Start the User App (new terminal)

```bash
cd user/frontend
npm install
npm run dev           # http://localhost:8080
```

Each app runs on its own port and can be started/stopped independently.

---

## Architecture

```
┌─────────────────────┐          ┌──────────────────────────┐
│   Admin Portal       │          │   User Application        │
│   React (port 3000)  │          │   React (port 8080)       │
│                      │          │                           │
│  Login               │          │  Home / Categories        │
│  Dashboard           │          │  Search / Product Detail  │
│  Products CRUD       │          │  Cart / Checkout          │
│  Categories CRUD     │          │  Orders / Tracking        │
│  Orders Management   │          │  Profile / Wishlist       │
│  Users Management    │          │  Notifications            │
│  Inventory           │          │                           │
│  Special Offers      │          │  ← reads from API only    │
│  Pincodes            │          │  ← no direct DB access    │
│  Coupons             │          │  ← no hardcoded data      │
│  Notifications       │          │                           │
└──────────┬───────────┘          └────────────┬──────────────┘
           │  REST API calls                    │  REST API calls
           ▼                                    ▼
┌──────────────────────────────────────────────────────────────┐
│              Admin Backend API  (port 5000)                   │
│              Node.js + Express                                │
│                                                              │
│  /api/auth          /api/products      /api/categories        │
│  /api/orders        /api/users         /api/pincodes          │
│  /api/banners       /api/special-offers /api/coupons          │
│  /api/notifications /api/upload        /api/dashboard         │
│                                                              │
│  JSON file database (swappable for Postgres/MongoDB)         │
└──────────────────────────────────────────────────────────────┘
```

---

## Key Design Principles

| Principle                    | Implementation                                   |
|------------------------------|--------------------------------------------------|
| Single source of truth       | All data lives in the backend database           |
| Admin = full CRUD            | JWT-protected admin-only endpoints               |
| User = read-only             | Users fetch via public/authenticated GET routes  |
| No hardcoded data            | User app has zero hardcoded products/categories  |
| No phone frame               | User app is a responsive web app, not a mockup   |
| Independent applications     | Each app has its own package.json, port, startup |
| Permanent persistence        | All admin changes are stored in the database     |
| Real-time sync               | User app fetches latest data on every navigation |

---

## Product Synchronization

When admin creates/edits/deletes a product or changes stock/price/images:

1. Admin makes API call → `POST/PUT/PATCH/DELETE /api/products`
2. Backend updates the database immediately
3. User app fetches `GET /api/products` on next page load
4. User sees only: **published + in-stock + available in their pincode**

---

## Authentication

| App    | Method          | Storage                        |
|--------|-----------------|--------------------------------|
| Admin  | Email + Password → JWT | `localStorage` (admin token) |
| User   | Phone + OTP → JWT      | `localStorage` (user token)  |

Sessions are completely independent.

---

## Default Credentials

| Role        | Email                    | Password   |
|-------------|--------------------------|------------|
| Super Admin | admin@ushamart.com       | Admin@123  |

---

## API Documentation

See `shared/api_docs/endpoints.md` for the complete REST API reference.

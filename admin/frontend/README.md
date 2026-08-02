# UshaMart Admin Portal — React Frontend

Runs independently on **http://localhost:3000**

Connects to backend at **http://localhost:5000** (proxied via Vite in dev).

---

## Quick Start

```bash
cd admin/frontend
npm install
npm run dev     # Opens at http://localhost:3000
```

## Scripts

| Command         | Description              |
|-----------------|--------------------------|
| `npm run dev`   | Start dev server (port 3000) |
| `npm run build` | Build for production     |
| `npm run preview` | Preview production build |

## Features

- ✅ Admin Login (JWT auth, independent session)
- ✅ Dashboard — KPIs, order pipeline, revenue stats
- ✅ Products — Full CRUD, image upload, status toggle, stock update, search, filter, pagination
- ✅ Categories — Add/edit/delete, image, emoji, featured toggle
- ✅ Orders — Status pipeline, search, filter, inline status update
- ✅ Users — List, search, block/unblock, order history drawer
- ✅ Inventory — Stock levels, low stock alerts, inline update
- ✅ Special Offers — Carousel banners, linked to category/product
- ✅ Banners — Homepage banners management
- ✅ Pincodes — Add/configure serviceable delivery areas
- ✅ Coupons — Discount codes management
- ✅ Notifications — Send and manage store announcements

## Architecture

```
src/
├── App.jsx              — Router with auth-protected layout
├── main.jsx
├── index.css
├── context/
│   └── AuthContext.jsx  — Admin JWT auth state
├── services/
│   └── api.js           — All HTTP calls to backend (no Firebase/direct DB)
├── components/
│   ├── Sidebar.jsx      — Navigation sidebar
│   ├── Toast.jsx        — Notification toasts
│   └── ConfirmDialog.jsx
└── pages/               — One file per admin section
    ├── LoginPage.jsx
    ├── DashboardPage.jsx
    ├── ProductsPage.jsx
    ├── CategoriesPage.jsx
    ├── OrdersPage.jsx
    ├── UsersPage.jsx
    ├── InventoryPage.jsx
    ├── SpecialOffersPage.jsx
    ├── BannersPage.jsx
    ├── PincodesPage.jsx
    ├── CouponsPage.jsx
    └── NotificationsPage.jsx
```

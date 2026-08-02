# UshaMart User Application — React Frontend

Runs independently on **http://localhost:8080**

Fetches ALL data from the Admin Backend API at **http://localhost:5000**.
No database. No business logic. No hardcoded data.

---

## Quick Start

```bash
cd user/frontend
npm install
npm run dev     # Opens at http://localhost:8080
```

## Scripts

| Command         | Description               |
|-----------------|---------------------------|
| `npm run dev`   | Start dev server (port 8080) |
| `npm run build` | Build for production      |
| `npm run preview` | Preview production build |

## Features

- ✅ Responsive layout — works on mobile, tablet, and desktop
- ✅ No phone frame / device mockup (removed completely)
- ✅ Dynamic products — fetched from backend, never hardcoded
- ✅ Home — Carousel banners, categories, featured products, today's deals, new arrivals
- ✅ Categories — Split-screen with category sidebar and product grid
- ✅ Search — Instant search across name, brand, SKU, description
- ✅ Product Detail — Full details, image gallery, add to cart
- ✅ Cart — Item management, coupon validation, bill summary
- ✅ Checkout — Address, delivery slot, payment method, order placement
- ✅ My Orders — Order history with status badges
- ✅ Order Tracking — Visual timeline (Confirmed → Packed → Out for Delivery → Delivered)
- ✅ Wishlist — Save and manage favourite products
- ✅ Profile — View/edit name, email, address; sign out
- ✅ Notifications — Store announcements from admin
- ✅ Login — Phone OTP authentication (independent from admin)
- ✅ Pincode — Check serviceability, filter products by delivery area

## Architecture

```
src/
├── App.jsx                  — Routes with Layout wrapper
├── main.jsx
├── index.css
├── context/
│   ├── AuthContext.jsx      — User JWT session (localStorage)
│   └── CartContext.jsx      — Cart state + pincode (localStorage)
├── services/
│   └── api.js               — ALL backend calls (GET /products, POST /orders, etc.)
├── components/
│   ├── Layout.jsx           — Responsive nav (bottom on mobile, sidebar on desktop)
│   └── ProductCard.jsx      — Reusable product card with add-to-cart
└── pages/
    ├── LoginPage.jsx
    ├── HomePage.jsx
    ├── CategoriesPage.jsx
    ├── SearchPage.jsx
    ├── ProductDetail.jsx
    ├── CartPage.jsx
    ├── CheckoutPage.jsx
    ├── OrdersPage.jsx
    ├── OrderTracking.jsx
    ├── WishlistPage.jsx
    ├── ProfilePage.jsx
    └── NotificationsPage.jsx
```

## Data Flow

```
User App ──── GET /api/products ────► Admin Backend ──► JSON Database
         ◄─── product list ──────────
              (published, in-stock,
               matching pincode)

User App ──── POST /api/orders ────► Admin Backend ──► stores order
         ◄─── order confirmation ───           └──── deducts stock
```

Product changes made by Admin are immediately reflected in the User App
on the next API fetch (page load or navigation).

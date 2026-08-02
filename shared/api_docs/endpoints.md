# UshaMart REST API — Endpoint Reference

Base URL: `http://localhost:5000/api`

---

## Authentication

| Method | Endpoint              | Auth     | Description                   |
|--------|-----------------------|----------|-------------------------------|
| POST   | `/auth/admin/login`   | None     | Admin login (email + password)|
| POST   | `/auth/user/login`    | None     | User login (phone OTP)        |
| GET    | `/auth/me`            | Bearer   | Get current user profile      |

---

## Products (Public + Admin)

| Method | Endpoint                       | Auth         | Description                     |
|--------|--------------------------------|--------------|----------------------------------|
| GET    | `/products`                    | Optional     | List products (filters: pincode, category, search, featured, bestSeller, status) |
| GET    | `/products/:id`                | Optional     | Get single product               |
| POST   | `/products`                    | Admin        | Create product                   |
| PUT    | `/products/:id`                | Admin        | Full update product              |
| PATCH  | `/products/:id/status`         | Admin        | Toggle published/inactive        |
| PATCH  | `/products/:id/stock`          | Admin        | Update stock quantity            |
| DELETE | `/products/:id`                | Admin        | Permanently delete product       |

**Query Parameters for GET /products:**
- `pincode` — filter by serviceable pincode
- `category` — filter by category ID
- `search` — full-text search (name, brand, sku, description)
- `featured=true` — featured products only
- `bestSeller=true` — best sellers only
- `newArrival=true` — new arrivals only
- `trending=true` — trending products only
- `todayOffer=true` — today's deals only
- `status=all|published|draft|inactive` — admin use only

---

## Categories (Public + Admin)

| Method | Endpoint                        | Auth     | Description           |
|--------|---------------------------------|----------|-----------------------|
| GET    | `/categories`                   | Optional | List published categories |
| GET    | `/categories/:id`               | Optional | Get single category   |
| POST   | `/categories`                   | Admin    | Create category       |
| PUT    | `/categories/:id`               | Admin    | Update category       |
| PATCH  | `/categories/:id/status`        | Admin    | Toggle active/inactive|
| DELETE | `/categories/:id`               | Admin    | Delete category       |

---

## Orders (Auth Required)

| Method | Endpoint                        | Auth         | Description                      |
|--------|---------------------------------|--------------|-----------------------------------|
| GET    | `/orders`                       | Bearer       | Admin: all orders. User: own orders |
| GET    | `/orders/:id`                   | Bearer       | Get order details                 |
| POST   | `/orders`                       | Bearer       | Place order (User)                |
| PATCH  | `/orders/:id/status`            | Admin        | Update order status               |

**Order Status Pipeline:**
`Pending → Confirmed → Packed → Out for Delivery → Delivered`
Also: `Cancelled`

---

## Users (Admin)

| Method | Endpoint                  | Auth         | Description         |
|--------|---------------------------|--------------|---------------------|
| GET    | `/users`                  | Admin        | List all customers  |
| GET    | `/users/:id`              | Bearer       | Get user by ID      |
| PATCH  | `/users/:id/profile`      | Bearer (self)| Update own profile  |
| PATCH  | `/users/:id/block`        | Admin        | Block/unblock user  |

---

## Pincodes (Public + Admin)

| Method | Endpoint            | Auth     | Description                    |
|--------|---------------------|----------|--------------------------------|
| GET    | `/pincodes`         | None     | List enabled pincodes          |
| GET    | `/pincodes/all`     | Admin    | List all (including disabled)  |
| POST   | `/pincodes/check`   | None     | Check if pincode is serviceable|
| POST   | `/pincodes`         | Admin    | Add new pincode                |
| PUT    | `/pincodes/:code`   | Admin    | Update delivery config         |
| DELETE | `/pincodes/:code`   | Admin    | Remove pincode                 |

---

## Banners / Special Offers / Coupons / Notifications

| Method | Endpoint                    | Auth     | Description                  |
|--------|-----------------------------|----------|------------------------------|
| GET    | `/banners`                  | None     | Active banners (user app)    |
| GET    | `/banners/all`              | Admin    | All banners                  |
| POST   | `/banners`                  | Admin    | Create banner                |
| PUT    | `/banners/:id`              | Admin    | Update banner                |
| DELETE | `/banners/:id`              | Admin    | Delete banner                |
| GET    | `/special-offers`           | None     | Active offers (user app)     |
| GET    | `/special-offers/all`       | Admin    | All offers                   |
| POST   | `/special-offers`           | Admin    | Create offer                 |
| PUT    | `/special-offers/:id`       | Admin    | Update offer                 |
| DELETE | `/special-offers/:id`       | Admin    | Delete offer                 |
| GET    | `/coupons`                  | None     | Published coupons            |
| GET    | `/coupons/all`              | Admin    | All coupons                  |
| POST   | `/coupons/validate`         | Bearer   | Validate coupon code         |
| POST   | `/coupons`                  | Admin    | Create coupon                |
| GET    | `/notifications`            | None     | Published notifications      |
| GET    | `/notifications/all`        | Admin    | All notifications            |
| POST   | `/notifications`            | Admin    | Send notification            |

---

## Upload

| Method | Endpoint              | Auth     | Description                    |
|--------|-----------------------|----------|--------------------------------|
| POST   | `/upload/image`       | Admin    | Upload single image            |
| POST   | `/upload/images`      | Admin    | Upload multiple images (max 10)|

**Response:** `{ success: true, url: "http://localhost:5000/uploads/filename.jpg" }`

---

## Dashboard

| Method | Endpoint        | Auth   | Description              |
|--------|-----------------|--------|--------------------------|
| GET    | `/dashboard`    | Admin  | KPIs, inventory alerts, recent orders |

---

## Health Check

| Method | Endpoint   | Auth | Description  |
|--------|------------|------|--------------|
| GET    | `/health`  | None | Server status|

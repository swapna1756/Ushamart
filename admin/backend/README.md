# UshaMart Admin Backend — Node.js + Express REST API

Runs independently on **http://localhost:5000**

---

## Quick Start

```bash
cd admin/backend
npm install
npm run seed       # Populate database with initial data
npm run dev        # Start development server (auto-restart on changes)
```

## Scripts

| Command       | Description                              |
|---------------|------------------------------------------|
| `npm run dev` | Start with nodemon (hot reload)          |
| `npm start`   | Start in production mode                 |
| `npm run seed`| Seed database with default data          |

## Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```env
PORT=5000
JWT_SECRET=your_secret_key
ADMIN_EMAIL=admin@ushamart.com
ADMIN_PASSWORD=Admin@123
FIREBASE_STORAGE_BUCKET=usha-mart.firebasestorage.app
CORS_ORIGINS=http://localhost:3000,http://localhost:8080
```

## Architecture

```
src/
├── server.js           — Express app entry point
├── controllers/        — Business logic per resource
│   ├── auth.controller.js
│   ├── product.controller.js
│   ├── category.controller.js
│   ├── order.controller.js
│   ├── user.controller.js
│   ├── pincode.controller.js
│   ├── banner.controller.js
│   ├── specialOffer.controller.js
│   ├── coupon.controller.js
│   ├── notification.controller.js
│   ├── upload.controller.js
│   └── dashboard.controller.js
├── routes/             — Express routers (12 route files)
├── middleware/         — auth, upload, validate
└── database/
    ├── db.js           — JSON file database (swap for Postgres in production)
    ├── data/           — Auto-created JSON files (gitignored)
    └── seed.js         — Database seeder
uploads/                — Uploaded images served at /uploads/*
```

## Database

Uses a JSON file database by default (no setup needed). Each collection is stored in `src/database/data/*.json`.

**To switch to a real database:** Replace `src/database/db.js` with your preferred adapter (MongoDB, PostgreSQL, etc.). The controller layer is fully decoupled from the storage layer.

## Default Admin Credentials

```
Email:    admin@ushamart.com
Password: Admin@123
```

## API Documentation

See `../../shared/api_docs/endpoints.md` for the full API reference.

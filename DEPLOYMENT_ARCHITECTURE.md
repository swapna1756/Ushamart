# Ushamart Complete Deployment Architecture

This document describes the complete deployment configuration for the Ushamart e-commerce platform across multiple services.

## Overview

Ushamart is deployed as three independent services that communicate via APIs:

```
┌─────────────────────────────────────────────────────────────────┐
│                    USHAMART DEPLOYMENT ARCHITECTURE              │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ADMIN PORTAL (React + Vite)                                     │
│  Location: /admin/frontend/                                     │
│  Platform: Netlify                                               │
│  URL: ushamart-admin.netlify.app (or custom domain)             │
│  Docs: admin/frontend/NETLIFY_DEPLOYMENT.md                      │
│                       │                                           │
│                       └─── Backend API (REST)                     │
│                                                                   │
│  USER PORTAL (React + Vite)                                      │
│  Location: /user/frontend/                                      │
│  Platform: Hostinger                                             │
│  URL: ushamart-wholesale.in                                      │
│  Docs: user/frontend/HOSTINGER_DEPLOYMENT.md                     │
│                       │                                           │
│                       └─── Backend API (REST)                     │
│                                                                   │
│  BACKEND API (Node.js + Express)                                 │
│  Location: /admin/backend/                                      │
│  Platform: Render                                                │
│  URL: ushamart-admin-backend.onrender.com (or similar)          │
│  Database: Supabase (PostgreSQL)                                 │
│  Docs: RENDER_DEPLOYMENT.md                                      │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Deployment Summary

| Component | Location | Technology | Platform | Domain/URL |
|-----------|----------|-----------|----------|-----------|
| **Admin Frontend** | `/admin/frontend/` | React + Vite | Netlify | netlify.app or custom |
| **User Frontend** | `/user/frontend/` | React + Vite | Hostinger | ushamart-wholesale.in |
| **Backend API** | `/admin/backend/` | Node.js + Express | Render | onrender.com |
| **Database** | Cloud | Supabase (PostgreSQL) | Supabase | Cloud-hosted |
| **Storage** | Cloud | Firebase Storage | Firebase | Cloud-hosted |

## Architecture Details

### 1. Admin Portal (Netlify)

**Purpose**: Admin dashboard for managing products, orders, users, categories, etc.

**Technology Stack**:
- React 18.3.1
- Vite 5.4.10
- Tailwind CSS
- React Router DOM

**Build Process**:
```
netlify.toml configuration:
- Base directory: admin/frontend/
- Build command: npm install && npm run build
- Publish directory: admin/frontend/dist/
```

**Environment Variables** (set in Netlify):
```
VITE_API_URL=https://your-backend-url.onrender.com
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-key
VITE_MAPPLS_API_KEY=your-mappls-key
```

**Features**:
- Product management (CRUD, variants, categories)
- Order management and tracking
- User/admin management
- Banner and offer management
- Location/pincode management
- Wishlist management
- Dashboard and analytics
- Image upload to Firebase

**Deployment**: [See admin/frontend/NETLIFY_DEPLOYMENT.md](admin/frontend/NETLIFY_DEPLOYMENT.md)

---

### 2. User Portal (Hostinger)

**Purpose**: Customer-facing application for browsing products, shopping, and placing orders.

**Technology Stack**:
- React 18.3.1
- Vite 5.4.10
- Tailwind CSS
- React Router DOM
- Firebase Authentication
- Supabase Integration

**Build Process**:
```
Manual or git integration:
- Base directory: user/frontend/
- Build command: npm install && npm run build
- Deploy to: public_html/ on Hostinger
```

**Environment Variables** (set in Hostinger):
```
VITE_API_URL=https://your-backend-url.onrender.com
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-key
VITE_MAPPLS_API_KEY=your-mappls-key
```

**Features**:
- Product browsing and search
- Product variants (size, quantity)
- Shopping cart
- Wishlist
- User authentication
- Order placement and tracking
- Location-based delivery (pincodes)
- Product reviews and ratings

**Deployment**: [See user/frontend/HOSTINGER_DEPLOYMENT.md](user/frontend/HOSTINGER_DEPLOYMENT.md)

---

### 3. Backend API (Render)

**Purpose**: RESTful API serving both Admin and User portals.

**Technology Stack**:
- Node.js 24.14.1
- Express.js
- PostgreSQL (via Supabase)
- Firebase Storage
- JWT Authentication

**Build Process**:
```
Render Web Service:
- Root directory: admin/backend/
- Build command: npm install
- Start command: npm start
```

**Environment Variables** (set in Render):
```
PORT=5000
NODE_ENV=production
JWT_SECRET=your-secure-random-string-min-32-chars
JWT_EXPIRES_IN=7d
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SECRET=your-service-role-key
FIREBASE_STORAGE_BUCKET=your-bucket.firebasestorage.app
MAPPLS_API_KEY=your-mappls-key
CORS_ORIGINS=https://your-admin-url,https://your-user-url,https://ushamart-wholesale.in
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your-admin-password
```

**API Routes**:
- `/api/auth` - Authentication
- `/api/products` - Product management
- `/api/categories` - Categories
- `/api/orders` - Orders
- `/api/users` - User management
- `/api/wishlist` - Wishlist
- `/api/coupons` - Coupon management
- `/api/banners` - Banner management
- `/api/upload` - Image upload
- `/api/dashboard` - Analytics/dashboard
- `/api/pincodes` - Location/pincode management

**Deployment**: [See RENDER_DEPLOYMENT.md](RENDER_DEPLOYMENT.md)

---

### 4. Database (Supabase)

**Purpose**: Cloud PostgreSQL database for all application data.

**Tables**:
- users
- products
- categories
- orders
- wishlists
- coupons
- banners
- special_offers
- pincodes
- notifications
- variants (product variants)

**Access**:
- **Public (anon key)**: Read-only access to public tables
- **Private (service role key)**: Full access via backend (BACKEND ONLY)

**Security**:
- Service role key NEVER exposed to frontend
- Frontend uses anon key (limited permissions)
- RLS (Row-Level Security) policies restrict data access

**Backups**: Handled automatically by Supabase

---

### 5. File Storage (Firebase)

**Purpose**: Cloud storage for product images and uploads.

**Access**:
- Backend: Full access via Firebase Admin SDK
- Frontend: Read-only via Firebase Storage rules

**Security**:
- Firebase service account key ONLY on backend
- Frontend accesses via signed URLs
- Storage rules restrict access

---

## Data Flow

### Request Flow (Frontend → Backend → Database)

```
1. User Portal Request
   └─ /ushamart-wholesale.in/
      └─ API call to VITE_API_URL/api/products
         └─ https://backend.onrender.com/api/products
            └─ Express receives request
               └─ Authenticates JWT token (if needed)
                  └─ Queries Supabase PostgreSQL
                     └─ Returns JSON response
                        └─ Frontend displays data

2. Admin Portal Request
   └─ /admin-portal.netlify.app/
      └─ API call to VITE_API_URL/api/products
         └─ https://backend.onrender.com/api/products
            └─ [Same flow as above]
```

### File Upload Flow

```
1. Admin/User uploads image
   └─ Frontend sends to /api/upload
      └─ Backend receives file
         └─ Uploads to Firebase Storage
            └─ Returns signed URL
               └─ Frontend stores URL in database (Supabase)
                  └─ Image accessible via signed URL
```

---

## Environment Configuration

### Local Development

```bash
# Admin Frontend
admin/frontend/.env.local
  VITE_API_URL=http://localhost:5000
  VITE_SUPABASE_URL=...
  VITE_SUPABASE_ANON_KEY=...
  VITE_MAPPLS_API_KEY=...

# User Frontend
user/frontend/.env.local
  VITE_API_URL=http://localhost:5000
  VITE_SUPABASE_URL=...
  VITE_SUPABASE_ANON_KEY=...
  VITE_MAPPLS_API_KEY=...

# Backend
admin/backend/.env
  PORT=5000
  NODE_ENV=development
  SUPABASE_URL=...
  SUPABASE_KEY=...
  SUPABASE_SECRET=...
  ...
```

### Production (Netlify/Hostinger/Render)

All secrets managed via platform environment variables:
- **Netlify**: Site settings → Environment
- **Hostinger**: cPanel or control panel
- **Render**: Dashboard → Environment

`.env` files NEVER committed (listed in .gitignore)

---

## API Communication

### Cross-Origin Requests

Both frontends make requests to the backend on different domains:

```
User Portal (ushamart-wholesale.in)
  └─ Cross-origin request to backend (onrender.com)
     └─ Browser requires CORS headers
        └─ Backend responds with CORS headers
           └─ Browser allows response

Admin Portal (netlify.app)
  └─ Cross-origin request to backend (onrender.com)
     └─ Browser requires CORS headers
        └─ Backend responds with CORS headers
           └─ Browser allows response
```

**CORS Configuration** (Backend):
```
CORS_ORIGINS=https://admin.netlify.app,https://ushamart-wholesale.in,http://localhost:3000,http://localhost:8080
```

---

## Security Considerations

### 1. Secrets Management

✅ **DO**:
- Store all secrets in platform environment variables
- Use `.env.example` with placeholders only
- Add `.env` to `.gitignore`
- Rotate secrets regularly
- Use service role key only on backend

❌ **DON'T**:
- Commit `.env` files to GitHub
- Hardcode API keys in source code
- Expose service role key to frontend
- Use weak JWT secrets

### 2. Authentication

- **Frontend**: JWT tokens stored in localStorage
- **Backend**: JWT validation on protected routes
- **Supabase Auth**: Additional layer for user authentication
- **Firebase Auth**: Optional for user portal

### 3. Data Access

- **Public data** (products, categories): Accessible via anon key
- **Private data** (users, orders): Protected via JWT + RLS policies
- **Admin data**: JWT role-based access control
- **Sensitive data** (passwords, API keys): Hash stored on backend

### 4. Network Security

- HTTPS enforced on all domains
- CORS restricts cross-origin requests
- Supabase RLS policies restrict data rows
- Firebase Storage rules restrict file access

---

## Monitoring & Maintenance

### Health Checks

**Backend**:
```bash
curl https://your-backend.onrender.com/api/health
```

**Frontend** (Browser console):
- Check for CORS errors
- Verify API URLs in Network tab
- Check localStorage for tokens

### Logs

- **Netlify**: Deploys tab → Deploy logs
- **Hostinger**: cPanel error logs
- **Render**: Dashboard → Logs tab
- **Browser**: DevTools Console tab

### Regular Tasks

1. **Daily**: Monitor error logs
2. **Weekly**: Test critical user journeys
3. **Monthly**: Update dependencies, review security
4. **Quarterly**: Rotate API keys, test backups

---

## Deployment Workflow

### Initial Setup

1. Deploy Backend (Render)
2. Deploy Admin Frontend (Netlify)
3. Deploy User Frontend (Hostinger)

### Updating Application

```bash
# Make changes locally
git add .
git commit -m "feature: description"
git push origin main

# Automatic deployments trigger
# Admin: Netlify auto-builds admin/frontend/
# User: Hostinger auto-builds user/frontend/ (if git integration)
# Backend: Render auto-builds admin/backend/
```

### Rollback Process

Each platform maintains deployment history:
- **Netlify**: Deploys → click previous build → Publish deploy
- **Hostinger**: Re-upload previous version via FTP or git checkout
- **Render**: Dashboard → Logs → Restart service

---

## Troubleshooting Guide

### Common Issues

1. **API 404 errors**
   - Backend not running
   - Incorrect VITE_API_URL
   - Wrong backend port

2. **CORS errors**
   - Domain not in CORS_ORIGINS
   - Backend not setting headers
   - Preflight request failing

3. **Database connection errors**
   - SUPABASE_URL incorrect
   - SUPABASE_KEY/SECRET wrong
   - Supabase project not active

4. **Build failures**
   - Missing dependencies (npm install)
   - Wrong base directory
   - Environment variables not set

[See individual deployment guides for detailed troubleshooting]

---

## Quick Reference

### Important URLs

| Service | Environment | URL |
|---------|-------------|-----|
| Admin Frontend | Dev | http://localhost:3000 |
| Admin Frontend | Prod | netlify.app domain |
| User Frontend | Dev | http://localhost:8080 |
| User Frontend | Prod | ushamart-wholesale.in |
| Backend | Dev | http://localhost:5000 |
| Backend | Prod | your-render-url.onrender.com |
| Database | Any | Supabase dashboard |
| Storage | Any | Firebase console |

### Important Credentials Location

| Credential | Location | Platform |
|-----------|----------|----------|
| JWT_SECRET | Render Environment | Render |
| Supabase Keys | Render Environment | Render |
| Supabase Keys | Frontend .env | Supabase Dashboard |
| Firebase Keys | Backend only | Firebase Console |
| API URLs | Frontend .env | Deploy platform |
| CORS Origins | Render Environment | Render |

---

## Document References

- [Render Backend Deployment](RENDER_DEPLOYMENT.md)
- [Netlify Admin Frontend Deployment](admin/frontend/NETLIFY_DEPLOYMENT.md)
- [Hostinger User Frontend Deployment](user/frontend/HOSTINGER_DEPLOYMENT.md)
- [Repository Root README](README.md)

---

**Last Updated**: 2026-08-13  
**Architecture Version**: 1.0  
**Status**: Production Ready

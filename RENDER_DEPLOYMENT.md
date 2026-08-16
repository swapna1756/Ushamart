# Ushamart Render Deployment Guide

This guide covers deploying Ushamart to Render with secure Supabase credential management.

## Overview

- **Admin Backend**: Deployed to Render (Node.js)
- **Admin Frontend**: Deployed via Render Static Site
- **User Frontend**: Deployed via Render Static Site (or separate Render service)
- **Database**: Supabase (hosted)
- **Authentication**: Supabase Auth + JWT
- **Image Storage**: Firebase Storage

## Security - Never Commit Secrets

All sensitive credentials are stored **only** in Render's Environment Variables section—never in source code or `.env` files committed to GitHub.

### Local Development

1. Copy `.env.example` to `.env` in each folder:
   ```bash
   # Admin Backend
   cp admin/backend/.env.example admin/backend/.env
   
   # Admin Frontend
   cp admin/frontend/.env.example admin/frontend/.env
   
   # User Frontend
   cp user/frontend/.env.example user/frontend/.env
   ```

2. Fill in actual values in your local `.env` files (these are `.gitignored` and never committed).

3. `.env` files are listed in `.gitignore` and will never be pushed to GitHub.

## Backend Deployment (Render)

### 1. Create Render Web Service

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **New +** → **Web Service**
3. Connect your GitHub repository: `https://github.com/swapna1756/Ushamart`
4. Configure:
   - **Name**: `ushamart-admin-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node src/server.js`
   - **Plan**: Select appropriate plan (Standard or higher recommended for production)

### 2. Set Environment Variables in Render

In your Render service, go to **Environment** and add these variables:

```
PORT=5000
NODE_ENV=production

JWT_SECRET=your-secure-random-string-min-32-chars
JWT_EXPIRES_IN=7d

SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-supabase-anon-key
SUPABASE_SECRET=your-supabase-service-role-key

FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app

MAPPLS_API_KEY=your-mappls-api-key

CORS_ORIGINS=https://your-admin-frontend-url.onrender.com,https://your-user-frontend-url.onrender.com

ADMIN_EMAIL=your-admin-email@example.com
ADMIN_PASSWORD=your-admin-password
```

### 3. Get Supabase Credentials

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings → API**
4. Copy:
   - **Project URL** → `SUPABASE_URL`
   - **anon public** → `SUPABASE_KEY`
   - **service_role secret** → `SUPABASE_SECRET` (⚠️ **KEEP PRIVATE**)

### 4. Deploy

- Push your code to GitHub → Render auto-deploys
- Or manually deploy via Render Dashboard

### 5. Verify Deployment

After deployment, test the backend:

```bash
curl https://your-render-backend-url.onrender.com/api/health
```

You should see a response (adjust endpoint based on your API).

---

## Frontend Deployment (Render Static Site)

### Admin Frontend

1. In Render Dashboard, click **New +** → **Static Site**
2. Connect your GitHub repository
3. Configure:
   - **Name**: `ushamart-admin`
   - **Build Command**: `cd admin/frontend && npm install && npm run build`
   - **Publish Directory**: `admin/frontend/dist`

4. In **Environment**, add:
   ```
   VITE_API_URL=https://your-render-backend-url.onrender.com
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   VITE_MAPPLS_API_KEY=your-mappls-api-key
   ```

5. Deploy

### User Frontend

Repeat the same process for user frontend:
- **Build Command**: `cd user/frontend && npm install && npm run build`
- **Publish Directory**: `user/frontend/dist`
- Same environment variables, optionally point to a different backend if separate

---

## Environment Variables Reference

### Backend (admin/backend)

| Variable | Type | Security | Description |
|----------|------|----------|-------------|
| `PORT` | int | Public | Server port (usually 5000) |
| `NODE_ENV` | string | Public | `development` or `production` |
| `JWT_SECRET` | string | **SECRET** | Generate with: `openssl rand -base64 32` |
| `JWT_EXPIRES_IN` | string | Public | JWT expiration (e.g., `7d`, `30d`) |
| `SUPABASE_URL` | string | Public | Supabase project URL |
| `SUPABASE_KEY` | string | Public | Supabase anon key (for public queries) |
| `SUPABASE_SECRET` | string | **SECRET** | Service role key (backend queries only) |
| `FIREBASE_STORAGE_BUCKET` | string | Public | Firebase bucket URL |
| `MAPPLS_API_KEY` | string | **SECRET** | Mappls/MapmyIndia API key |
| `CORS_ORIGINS` | string | Public | Comma-separated allowed origins |
| `ADMIN_EMAIL` | string | **SECRET** | Default admin email |
| `ADMIN_PASSWORD` | string | **SECRET** | Default admin password |

### Frontend (admin/frontend, user/frontend)

| Variable | Type | Security | Description |
|----------|------|----------|-------------|
| `VITE_API_URL` | string | Public | Backend API URL (e.g., your Render service) |
| `VITE_SUPABASE_URL` | string | Public | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | string | Public | Supabase anon key (safe for frontend) |
| `VITE_MAPPLS_API_KEY` | string | **SECRET** | Mappls API key |

---

## Important Security Notes

### ✅ DO

- ✅ Store all secrets in Render Environment Variables
- ✅ Use `.env.example` files with placeholders
- ✅ Keep `.env` files in `.gitignore`
- ✅ Rotate `JWT_SECRET` and credentials regularly
- ✅ Use HTTPS for all production URLs
- ✅ Keep `SUPABASE_SECRET` (service role) private—never expose to frontend
- ✅ Verify credentials after each Render restart

### ❌ DON'T

- ❌ Commit `.env` files to GitHub
- ❌ Hardcode secrets in source code
- ❌ Print secrets in logs or error messages
- ❌ Use weak JWT secrets (min 32 chars recommended)
- ❌ Share service role key with frontend applications
- ❌ Use development credentials in production

---

## Database Connection Verification

After deployment, verify the Supabase connection:

1. Check Render service logs:
   - Go to Render Dashboard → your backend service → **Logs**
   - Look for successful connection messages

2. Test database queries via your API:
   ```bash
   curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     https://your-render-backend-url.onrender.com/api/products
   ```

3. Verify tables exist in Supabase:
   - Go to Supabase Dashboard → **SQL Editor**
   - Run: `SELECT * FROM products LIMIT 1;`

---

## Troubleshooting

### Issue: 500 Error After Deployment

**Cause**: Environment variables not set or incorrect values

**Solution**:
1. Check Render service → **Environment** section
2. Verify all required variables are present
3. Check logs for specific error messages
4. Verify Supabase credentials are correct

### Issue: Database Connection Refused

**Cause**: `SUPABASE_URL` or `SUPABASE_SECRET` incorrect

**Solution**:
1. Double-check values from Supabase Dashboard → Settings → API
2. Ensure you're using the **service_role** key for backend (not anon key)
3. Verify the Supabase project is running and accessible

### Issue: CORS Errors

**Cause**: Frontend URL not in `CORS_ORIGINS`

**Solution**:
1. Get exact frontend URL from Render (e.g., `https://ushamart-admin.onrender.com`)
2. Add to `CORS_ORIGINS` in backend environment variables
3. Restart the backend service

### Issue: Frontend Shows "Cannot Connect to API"

**Cause**: `VITE_API_URL` incorrect or firewall block

**Solution**:
1. Verify `VITE_API_URL` matches Render backend URL (without trailing slash)
2. Test backend directly: `curl https://your-backend-url.onrender.com/health`
3. Check browser DevTools → Network tab for actual API calls

---

## Monitoring & Maintenance

### Logs

- **Backend**: Render Dashboard → Service → **Logs**
- **Frontend**: Render Dashboard → Static Site → **Logs**

### Regular Tasks

1. **Monitor logs** for errors (daily for first week)
2. **Rotate JWT_SECRET** every 3-6 months
3. **Update dependencies**: `npm audit`, `npm update`
4. **Test database** quarterly
5. **Review CORS origins** when adding new frontends

---

## Rollback Plan

If deployment fails:

1. Render keeps previous builds—rollback via Render Dashboard
2. Git history is preserved—rollback to previous commit
3. Supabase data is persistent—never lost on rollback

---

## Next Steps

1. ✅ Set environment variables in Render
2. ✅ Deploy backend
3. ✅ Verify logs and database connection
4. ✅ Deploy frontends
5. ✅ Test full application flow
6. ✅ Monitor logs

---

## Support

For issues:
- **Render**: https://render.com/docs
- **Supabase**: https://supabase.com/docs
- **Firebase**: https://firebase.google.com/docs

---

**Last Updated**: 2026-08-13  
**Deployed By**: Secure Configuration Process

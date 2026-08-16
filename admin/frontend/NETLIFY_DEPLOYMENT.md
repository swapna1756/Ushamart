# Ushamart Admin Portal - Netlify Deployment Guide

This guide covers deploying the Ushamart Admin Portal (React + Vite application) to Netlify.

## Overview

- **Repository Location**: `/admin/frontend/`
- **Build System**: React + Vite (NOT Flutter)
- **Deployment Platform**: Netlify
- **Configuration File**: `admin/frontend/netlify.toml`

## Prerequisites

1. Netlify account (https://netlify.com)
2. GitHub repository connected to Netlify
3. Admin backend deployed on Render (or your server)

## How Netlify Builds This Project

The `netlify.toml` file in `admin/frontend/` tells Netlify:

```toml
[build]
base = "admin/frontend"
command = "npm install && npm run build"
publish = "admin/frontend/dist"
```

This configuration:
1. **Starts from** `admin/frontend/` directory (fixes the npm error)
2. **Runs build** with npm (Vite build process)
3. **Publishes** the `dist/` folder containing static files

## Local Setup

### Build Locally

```bash
cd admin/frontend

# Install dependencies
npm install

# Build for production
npm run build

# Verify output
ls dist/
```

### Test Build Locally

```bash
npm run preview
```

## Netlify Configuration

### Automatic (Using netlify.toml)

The `admin/frontend/netlify.toml` file already contains:

```toml
[build]
base = "admin/frontend"
command = "npm install && npm run build"
publish = "admin/frontend/dist"

[build.environment]
VITE_API_URL = "https://your-backend-url.onrender.com"
VITE_SUPABASE_URL = "https://your-project-id.supabase.co"
VITE_SUPABASE_ANON_KEY = "your-supabase-anon-key"
VITE_MAPPLS_API_KEY = "your-mappls-api-key"
```

### Manual Setup (If not using netlify.toml)

1. **Connect Repository**
   - Go to Netlify dashboard → **New site from Git**
   - Select your GitHub repository
   - Select branch: `main`

2. **Build Settings**
   - **Base directory**: `admin/frontend`
   - **Build command**: `npm install && npm run build`
   - **Publish directory**: `admin/frontend/dist`

3. **Environment Variables**
   - Go to **Site settings** → **Environment**
   - Add variables:
     ```
     VITE_API_URL=https://your-backend-url.onrender.com
     VITE_SUPABASE_URL=https://your-project-id.supabase.co
     VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
     VITE_MAPPLS_API_KEY=your-mappls-api-key
     ```

4. **Deploy**
   - Click **Deploy site**

## Environment Variables

### What Each Variable Does

| Variable | Purpose | Example |
|----------|---------|---------|
| `VITE_API_URL` | Backend API endpoint | `https://ushamart-admin-backend.onrender.com` |
| `VITE_SUPABASE_URL` | Supabase project URL | `https://xkooguvxhhempfpcmrjd.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Public Supabase key | `sb_publishable_...` |
| `VITE_MAPPLS_API_KEY` | MapmyIndia API key | Your API key |

### How to Get These Values

**VITE_API_URL**:
- Your Render backend URL (e.g., `https://ushamart-admin-backend.onrender.com`)
- Get from Render dashboard → Your service → URL

**VITE_SUPABASE_URL** & **VITE_SUPABASE_ANON_KEY**:
- Go to Supabase dashboard → Settings → API
- Project URL = `VITE_SUPABASE_URL`
- anon public = `VITE_SUPABASE_ANON_KEY`

**VITE_MAPPLS_API_KEY**:
- Get from https://mappls.com/api/dashboard

## Deployment Process

### First-Time Deploy

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "fix: deployment configuration for Netlify"
   git push origin main
   ```

2. **Connect to Netlify**
   - Go to netlify.com → **New site from Git**
   - Authorize GitHub
   - Select repository: `swapna1756/Ushamart`
   - Netlify automatically detects `admin/frontend/netlify.toml`

3. **Deploy**
   - Click **Deploy site**
   - Netlify builds from `admin/frontend/` directory
   - Publishes to Netlify domain (e.g., `ushamart-admin.netlify.app`)

### Automatic Deployments

Every push to `main` automatically triggers a new build and deployment.

### Manual Redeploy

In Netlify dashboard:
1. Go to **Deploys** tab
2. Click **Trigger deploy** → **Deploy site**

## Verify Deployment

### 1. Check Build Logs

In Netlify dashboard:
- Go to **Deploys** tab
- Click latest deploy
- Check **Deploy log** for any errors
- Should end with: `✓ Deployed successfully`

### 2. Test Application

Open your Netlify domain and verify:
- ✓ Page loads without errors
- ✓ Navigation works (React Router)
- ✓ Products load
- ✓ Admin functions accessible
- ✓ Login works

### 3. Check Network Requests

Open DevTools (F12) → Network tab:
- API requests should go to: `https://your-backend-url.onrender.com/api/...`
- No localhost requests
- CORS errors should not appear

### 4. Verify Supabase Connection

In admin dashboard:
- Products load from Supabase ✓
- Categories display ✓
- User list shows ✓
- Orders fetch ✓

## Custom Domain

### Connect Your Own Domain

1. In Netlify → **Site settings** → **Domain management**
2. Click **Add custom domain**
3. Enter your domain
4. Update DNS records with Netlify's nameservers

## Troubleshooting

### Issue: "npm error enoent Could not read package.json"

**Cause**: Netlify is using repo root instead of `admin/frontend/`

**Solution**:
- Ensure `netlify.toml` exists in `admin/frontend/`
- Check `base = "admin/frontend"` in netlify.toml
- Redeploy from Netlify dashboard

### Issue: Build fails with "Cannot find module"

**Cause**: Dependencies not installed or package.json not found

**Solution**:
1. Verify `admin/frontend/package.json` exists
2. Check `npm install` runs successfully:
   ```bash
   cd admin/frontend
   npm install
   ```
3. Clear Netlify cache: **Deploys** → **Clear cache and redeploy**

### Issue: API requests failing with CORS errors

**Cause**: Backend CORS not configured for Netlify domain

**Solution**:
1. Get your Netlify domain (e.g., `ushamart-admin.netlify.app`)
2. Update backend environment variable on Render:
   - `CORS_ORIGINS`: Add your Netlify domain
3. Restart Render backend
4. Redeploy Netlify

### Issue: API returns 404 (Cannot find module at backend)

**Cause**: Backend not running or wrong URL

**Solution**:
1. Verify backend is deployed and running
2. Test backend directly:
   ```bash
   curl https://your-backend-url.onrender.com/api/health
   ```
3. Check `VITE_API_URL` is set correctly in Netlify environment

### Issue: Supabase authentication fails

**Cause**: Wrong Supabase credentials

**Solution**:
1. Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
2. Check credentials in Supabase dashboard
3. Ensure Supabase project is active

## Monitoring

### View Logs

1. **Build logs**: **Deploys** tab → click deploy → **Deploy log**
2. **Function logs**: **Functions** tab (if using Netlify functions)
3. **Real-time logs**: **Log Drain** in site settings

### Performance

- **Lighthouse score**: Check via Netlify Analytics
- **Page speed**: Monitor via built-in analytics
- **Uptime**: Netlify Status page

## Security

### Environment Secrets

Netlify automatically encrypts sensitive environment variables. Never commit `.env` files:

```bash
# Do not commit
❌ .env
❌ .env.production

# This is OK
✅ .env.example (with placeholders only)
```

### HTTPS

- Netlify automatically provides HTTPS for all domains
- Redirects HTTP to HTTPS

### Content Security Policy

Netlify automatically handles security headers for Vite apps.

## Advanced Configuration

### Cache Optimization

The `netlify.toml` includes cache headers:

```toml
[[headers]]
for = "/*.html"
[headers.values]
Cache-Control = "public, max-age=0, must-revalidate"

[[headers]]
for = "/dist/*"
[headers.values]
Cache-Control = "public, max-age=31536000, immutable"
```

This ensures:
- HTML files are never cached (always fresh)
- Asset files are cached for 1 year (content-addressed)

### Redirects for React Router

The `netlify.toml` includes:

```toml
[[redirects]]
from = "/*"
to = "/index.html"
status = 200
```

This allows React Router to handle all routes correctly.

## References

- Netlify Docs: https://docs.netlify.com
- Vite Docs: https://vitejs.dev
- React Docs: https://react.dev

---

**Last Updated**: 2026-08-13  
**Frontend Type**: React + Vite  
**Deployment Target**: Netlify  
**Build Tool**: Vite

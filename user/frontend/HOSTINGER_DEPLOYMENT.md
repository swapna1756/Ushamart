# Ushamart User Portal - Hostinger Deployment Guide

This guide covers deploying the Ushamart User Portal (React + Vite application) to Hostinger with your custom domain: **ushamart-wholesale.in**

## Overview

- **Repository Location**: `/user/frontend/`
- **Build System**: React + Vite
- **Domain**: ushamart-wholesale.in
- **Backend API**: Connected via environment variables (not hardcoded)

## Prerequisites

1. Hostinger hosting account with access to cPanel or Hostinger control panel
2. Domain `ushamart-wholesale.in` configured and pointing to Hostinger
3. Node.js and npm installed locally for building
4. Git access to the repository

## Local Build & Test

Before deploying to Hostinger, build and test locally:

```bash
cd user/frontend

# Install dependencies
npm install

# Build for production
npm run build

# Preview the build
npm run preview
```

The build output will be in `user/frontend/dist/`.

## Environment Configuration

### Local Development (.env.local)

Create `.env.local` file in `user/frontend/`:

```
# No need to set VITE_API_URL for local dev
# Vite proxy will route /api to http://localhost:5000

# Supabase (public anon key only — safe to expose)
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# Mappls API
VITE_MAPPLS_API_KEY=your-mappls-api-key
```

### Production (Hostinger)

Set these environment variables in Hostinger cPanel or through your hosting control panel:

```
VITE_API_URL=https://your-backend-api.onrender.com
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_MAPPLS_API_KEY=your-mappls-api-key
```

**Important**: Get the actual backend URL from your Render deployment (e.g., `https://ushamart-admin-backend.onrender.com`)

## Deployment Steps

### Option 1: Using Hostinger's Git Integration

1. **Connect Repository**
   - Go to Hostinger cPanel → **Git** (or **Code Deployments**)
   - Connect your GitHub repository
   - Select branch: `main`

2. **Configure Build**
   - Base directory: `user/frontend/`
   - Build command: `npm install && npm run build`
   - Publish directory: `user/frontend/dist`

3. **Set Environment Variables**
   - In Hostinger cPanel, set:
     - `VITE_API_URL`: `https://your-backend-api.onrender.com`
     - `VITE_SUPABASE_URL`: `https://your-project-id.supabase.co`
     - `VITE_SUPABASE_ANON_KEY`: `your-supabase-anon-key`
     - `VITE_MAPPLS_API_KEY`: `your-mappls-api-key`

4. **Deploy**
   - Click **Deploy** or set up automatic deployment on push

### Option 2: Manual FTP Deployment

1. **Build Locally**
   ```bash
   cd user/frontend
   npm install
   npm run build
   ```

2. **Upload to Hostinger**
   - Connect via FTP/SFTP to your Hostinger account
   - Upload the contents of `user/frontend/dist/` to your public_html directory
   - Ensure `index.html` is in the root of public_html

3. **Configure Environment Variables**
   - Create `.env.production` or set via Hostinger control panel

### Option 3: SSH Deployment

1. **SSH into Hostinger**
   ```bash
   ssh user@ushamart-wholesale.in
   ```

2. **Clone and Build**
   ```bash
   cd public_html
   git clone https://github.com/swapna1756/Ushamart.git .
   cd user/frontend
   npm install
   npm run build
   cp -r dist/* ../../../public_html/
   ```

## Verify Deployment

After deployment, test the application:

### 1. Check Application Loads
```bash
curl https://ushamart-wholesale.in/
```

### 2. Verify API Connection
Open browser DevTools (F12) → Network tab and check:
- API requests go to: `https://your-backend-api.onrender.com/api/...`
- No errors in Console

### 3. Test Core Functionality
- Browse products ✓
- View product details ✓
- Search products ✓
- Add to cart ✓
- Login/authentication ✓
- Wishlist ✓
- Checkout ✓

### 4. Check for Hardcoded localhost
Search in the built application for any remaining localhost references:
```bash
grep -r "localhost:5000" dist/
grep -r "http://localhost" dist/
```
(Should return nothing)

## Troubleshooting

### Issue: "Cannot connect to server" error
**Cause**: API URL not set or incorrect
**Solution**:
1. Verify `VITE_API_URL` is set in Hostinger environment
2. Check that backend is running and accessible
3. Verify CORS is configured on backend to allow Hostinger domain

### Issue: API requests failing with CORS error
**Cause**: Backend CORS not configured for this domain
**Solution**:
1. Update backend environment variable `CORS_ORIGINS` in Render to include `https://ushamart-wholesale.in`
2. Restart the Render backend service

### Issue: Supabase errors
**Cause**: Supabase credentials incorrect or incomplete
**Solution**:
1. Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Hostinger environment
2. Check Supabase project is active and accessible
3. Ensure database tables exist (products, users, orders, etc.)

### Issue: Images not loading
**Cause**: Upload/images API endpoint not reachable
**Solution**:
1. Verify backend is running
2. Check CORS allows image upload requests
3. Ensure Firebase storage is configured on backend

## Maintenance

### Regular Tasks
1. **Monitor logs** - Check Hostinger error logs and browser console
2. **Update dependencies** - Periodically run `npm update` and rebuild
3. **Test after backend updates** - Redeploy if backend changes
4. **Rotate credentials** - Periodically update API keys

### Database Backup
Products, users, orders, and wishlist are stored in Supabase. Regular backups are handled by Supabase.

## Security Checklist

- ✅ No `.env` files with secrets committed to GitHub
- ✅ `VITE_API_URL` set to production backend (not localhost)
- ✅ No hardcoded secrets in source code
- ✅ Service role key (`SUPABASE_SECRET`) not exposed to frontend
- ✅ HTTPS enabled for ushamart-wholesale.in
- ✅ CORS configured to allow only your domains

## Support

For deployment issues:
- **Hostinger Support**: https://support.hostinger.com
- **Vite Docs**: https://vitejs.dev/guide/
- **React Docs**: https://react.dev

---

**Last Updated**: 2026-08-13  
**Frontend Type**: React + Vite  
**Deployment Target**: Hostinger  
**Domain**: ushamart-wholesale.in

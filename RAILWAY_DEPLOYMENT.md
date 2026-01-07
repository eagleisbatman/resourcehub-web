# Railway Deployment Guide

## Overview

This Next.js application is configured to deploy on Railway with automatic database migrations.

## Railway Configuration

The project includes `railway.json` and `railway.toml` files that configure:

- **Build Command**: `npm run db:deploy && npm run build`
  - Runs database migrations and seeds data before building
  - Idempotent - safe to run multiple times
  
- **Start Command**: `npm start`
  - Starts the Next.js production server

## Deployment Steps

### 1. Create Railway Project

1. Go to [Railway](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Connect your repository
5. Select the `web/` directory as the root

### 2. Add PostgreSQL Database

1. In Railway dashboard, click "New" → "Database" → "PostgreSQL"
2. Railway will automatically create a PostgreSQL database
3. The `DATABASE_URL` environment variable will be automatically set

### 3. Configure Environment Variables

In Railway dashboard, add these environment variables:

**Required:**
- `DATABASE_URL` - Automatically set by Railway PostgreSQL service
- `NEXTAUTH_URL` - Your Railway app URL (e.g., `https://your-app.railway.app`)
- `NEXTAUTH_SECRET` - Generate with: `openssl rand -base64 32`
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `ALLOWED_DOMAINS` - Comma-separated domains (e.g., `digitalgreen.org`)
- `SUPER_ADMIN_EMAIL` - Super admin email address
- `JWT_SECRET` - Generate with: `openssl rand -base64 32`

### 4. Deploy

1. Railway will automatically detect the Next.js project
2. Build will run automatically:
   - Installs dependencies
   - Runs `npm run db:deploy` (migrations + seed)
   - Runs `npm run build`
   - Starts the application

### 5. Monitor Deployment

- Check build logs in Railway dashboard
- Verify migrations ran successfully
- Check application logs for any errors

## Migration Behavior

- Migrations run **automatically** during every build
- Migrations are **idempotent** - safe to run multiple times
- Uses `CREATE TABLE IF NOT EXISTS` - won't fail if tables exist
- Seed data uses `ON CONFLICT DO NOTHING` - no duplicates

## Custom Domain

1. In Railway dashboard, go to your service
2. Click "Settings" → "Domains"
3. Add your custom domain
4. Update `NEXTAUTH_URL` environment variable

## Troubleshooting

### Migrations Not Running
- Check Railway build logs
- Verify `railway.json` exists in project root
- Ensure `DATABASE_URL` is set correctly

### Database Connection Issues
- Verify PostgreSQL service is running
- Check `DATABASE_URL` format
- Ensure database is accessible from Railway service

### Build Failures
- Check build logs for specific errors
- Verify all environment variables are set
- Ensure `package.json` scripts are correct

## Environment Variables Reference

```bash
# Database (auto-set by Railway PostgreSQL)
DATABASE_URL=postgresql://...

# NextAuth.js
NEXTAUTH_URL=https://your-app.railway.app
NEXTAUTH_SECRET=your-secret-here

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret

# Domain Restriction
ALLOWED_DOMAINS=digitalgreen.org
SUPER_ADMIN_EMAIL=admin@digitalgreen.org

# JWT for Mobile
JWT_SECRET=your-jwt-secret-here
```

## Railway CLI (Optional)

You can also deploy using Railway CLI:

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link project
railway link

# Deploy
railway up
```


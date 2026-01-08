# ResourceHub - Web Admin

> Internal resource tracking and management system

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle-ORM-orange)](https://orm.drizzle.team)
[![Railway](https://img.shields.io/badge/Deploy-Railway-blue)](https://railway.app)

## Overview

**ResourceHub** is a comprehensive resource tracking and management system. The **Web Admin Panel** provides administrators with powerful tools to manage projects, resources, allocations, and system configuration.

### Key Features

- 🔐 **Secure Authentication** - Google OAuth with domain restriction
- 📊 **Project Management** - Create, update, and archive projects with status tracking
- 👥 **Resource Management** - Manage team members, roles, and availability
- 📅 **Allocation Planning** - Monthly allocation grid with planned/actual hours tracking
- ⚙️ **System Configuration** - Manage statuses, flags, roles, and user permissions
- 🎨 **Modern UI** - Built with Next.js 14, Tailwind CSS, and shadcn/ui components

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: NextAuth.js (Google OAuth)
- **Styling**: Tailwind CSS + shadcn/ui
- **Deployment**: Railway

## Prerequisites

- Node.js 20+ 
- PostgreSQL database
- Google OAuth credentials

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file:

```env
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# NextAuth.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret

# Domain Restriction
ALLOWED_DOMAINS=yourdomain.com
SUPER_ADMIN_EMAIL=admin@yourdomain.com

# JWT for Mobile
JWT_SECRET=your-jwt-secret-here
```

### 3. Run Database Migrations

```bash
npm run db:push      # Run idempotent migrations
npm run db:seed      # Seed initial data (idempotent)
```

### 4. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
web/
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── (auth)/      # Authentication routes
│   │   ├── (dashboard)/ # Protected dashboard routes
│   │   └── api/         # API endpoints
│   ├── components/       # React components
│   │   ├── ui/          # shadcn/ui components
│   │   ├── forms/       # Form components
│   │   └── layout/      # Layout components
│   ├── lib/             # Utilities
│   │   └── db/         # Drizzle ORM schema & migrations
│   └── types/           # TypeScript types
├── drizzle/             # Database migrations (idempotent)
└── scripts/            # Deployment scripts
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:push` - Run database migrations
- `npm run db:seed` - Seed initial data
- `npm run db:generate` - Generate new migration
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## Database Migrations

Migrations are **idempotent** and run automatically on Railway deployment:

- Uses `CREATE TABLE IF NOT EXISTS` - safe to run multiple times
- Seed data uses `ON CONFLICT DO NOTHING` - prevents duplicates
- Migrations tracked in `drizzle/__drizzle_migrations` table

## Deployment

### Railway Deployment

1. Connect your GitHub repository to Railway
2. Add PostgreSQL database service
3. Configure environment variables in Railway dashboard
4. Migrations run automatically during build

See `docs/RAILWAY_DEPLOYMENT.md` for detailed deployment instructions (in parent `docs/` folder).

## API Documentation

All API endpoints follow RESTful conventions and return consistent JSON responses:

```typescript
// Success
{ "data": T, "meta"?: { pagination } }

// Error
{ "error": { "code": string, "message": string } }
```

See `docs/api.md` for complete API documentation (in parent `docs/` folder).

## Authentication

- **Web**: NextAuth.js session-based authentication with Google OAuth
- **Mobile**: JWT tokens issued via `/api/auth/google` endpoint
- **Domain Restriction**: Only allowed email domains can authenticate
- **Role-Based Access**: Super Admin and Admin roles

## Development Guidelines

- All files must stay under 300 lines
- Use TypeScript strict mode
- Follow the patterns in `.cursorrules`
- Write idempotent migrations
- Test locally before deploying

## License

Proprietary - Internal use only

## Support

For issues or questions, contact the development team.

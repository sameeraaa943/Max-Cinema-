# React + TypeScript + Vite
# 🎬 CineScope Admin Dashboard V2

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.
> **Production-Ready Administration Platform for CineScope**  
> Public Website: [https://cinescopecodespactor.netlify.app/](https://cinescopecodespactor.netlify.app/)

Currently, two official plugins are available:
A secure, luxury cinematic control dashboard built with **React, TypeScript, Tailwind CSS, Node.js/Express, Prisma ORM, and Supabase PostgreSQL**, designed for deployment on **Render.com**.

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)
---

## React Compiler
## 🏛️ System Architecture

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).
```text
┌───────────────────────────────────────────────────────────┐
│              CineScope Public Website                     │
│         https://cinescopecodespactor.netlify.app          │
└─────────────────────────────┬─────────────────────────────┘
                              │
               Runtime HTTPS API calls (/api/public/*)
               Custom Analytics Event Ingestion
                              ▼
┌───────────────────────────────────────────────────────────┐
│             CineScope Backend API (Express)               │
│               Hosted on Render.com Web Service            │
│                                                           │
│  - JWT Authentication & Bcrypt Hashing                    │
│  - TMDB v3 Server Proxy (Key securely hidden)             │
│  - Audit Logging Middleware                               │
│  - Rate Limiting & Helmet Security                        │
└─────────────────────────────┬─────────────────────────────┘
                              │
                Prisma 6 + PgBouncer Pooler
                              ▼
┌───────────────────────────────────────────────────────────┐
│               Supabase PostgreSQL Database                │
│  14 relational tables: Movies, TVShows, Collections,     │
│  FeaturedItems, TrendingItems, Ads, Analytics, Settings   │
└───────────────────────────────────────────────────────────┘
```

## Expanding the Oxlint configuration
---

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:
## ✨ Core Features

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
### 🔐 1. Authentication & Security
- Secure JWT-based session with HttpOnly cookies and Bearer fallback
- Passwords hashed with `bcryptjs` (salt rounds: 12)
- Rate-limited login endpoint to prevent brute-force attacks
- Role-based permissions (`SUPER_ADMIN` and `ADMIN`)
- Immutable audit trail recording every administrative CRUD operation with IP addresses

### 🎬 2. Movies & TV Shows Management
- Full CRUD with filters by Genre, Release Year, Catalog Status, and Featured/Trending flags
- **TMDB 1-Click Fast Import Engine:** Search any movie or television series from TMDB; auto-populates posters, backdrops, synopses, cast, creators, YouTube trailers, and genre mappings
- Duplicate detection preventing duplicate TMDB imports
- Live poster preview with rating badges

### ⭐ 3. Featured & Trending Content Curators
- Visual drag-and-drop reordering powered by `@dnd-kit`
- Instant toggle between active/disabled without deleting items
- Real-time ranking calculation (#1, #2, #3...) for trending marquee items
- Trending score editor for fine-grained ranking weight

### 📚 4. Curated Collections
- Franchise and festival playlist builder (e.g. "Christopher Nolan Universe", "Oscar Winners")
- Drag-and-drop title arrangement within collections
- Custom URL slugs and cover images
- Public vs. Private visibility toggles

### 🏠 5. Dynamic Homepage Builder
- Hero Spotlight headline, description, background image, and CTA links
- Real-time strip management: toggle section visibility and configure maximum item limits (Featured, Trending, Popular Movies, TV Shows, New Releases, Collections)

### 📊 6. Real Visitor Analytics
- **Zero fake data policy:** Real metric collection via custom lightweight event tracker
- Tracks page views, movie clicks, TV streams, searches, and referral metadata
- Audience engagement area charts across Today, 7 Days, 30 Days, 90 Days, and 1 Year
- Standalone tracker script (`/public/cinescope-analytics.js`) ready to drop into any website

### 💰 7. Advertisement Management
- Configured for CineScope's Google AdSense publisher: `ca-pub-1450329989131749`
- Placement zones: `HEADER`, `HOMEPAGE`, `MOVIE_PAGE`, `TV_PAGE`, `SEARCH_RESULTS`, `BETWEEN_CONTENT`, `FOOTER`
- Device-specific targeting: All, Desktop Only, Mobile Only, Tablet Only
- Start and end flight date scheduling with priority weighting

---

## 🚀 Getting Started (Local Development)

### 1. Prerequisites
- Node.js 18+
- npm 9+
- A Supabase PostgreSQL project (or local PostgreSQL instance)
- A TMDB API key (free from [themoviedb.org](https://www.themoviedb.org/settings/api))

---

### 2. Backend Setup (`server/`)

```bash
cd server
npm install

# Copy environment template
cp .env.example .env
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
Edit `server/.env` with your actual credentials:
```env
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"
AUTH_SECRET="your-super-long-random-secret-key"
TMDB_API_KEY="your-tmdb-v3-api-key"
PORT=3001
```

Apply database migrations and seed default data:
```bash
# Push schema to Supabase
npx prisma db push

# Seed default genres, homepage config, and Super Admin user
npm run seed

# Start server in development mode
npm run dev
```

> **Default Super Admin Login:**  
> Email: `admin@cinescope.com`  
> Password: `CineScope2026!`  
> *(Change password immediately in Settings after first login!)*

---

### 3. Frontend Setup (Root)

```bash
# In the root project directory:
npm install

# Start Vite development server
npm run dev
```

Visit: **[http://localhost:5173](http://localhost:5173)**

---

## 🌐 Production Deployment Guide

### Deploying Backend to Render.com

1. Create a new Web Service on [Render.com](https://render.com)
2. Connect your Git repository
3. Set **Root Directory** to `server`
4. Set **Build Command**:
   ```bash
   npm install && npx prisma generate && npm run build
   ```
5. Set **Start Command**:
   ```bash
   npm start
   ```
6. Add Environment Variables:
   - `DATABASE_URL`: Supabase connection pooler URL (port 6543)
   - `DIRECT_URL`: Supabase direct connection URL (port 5432)
   - `AUTH_SECRET`: Random 64-character secret
   - `TMDB_API_KEY`: Your TMDB API key
   - `CORS_ORIGINS`: `https://cinescopecodespactor.netlify.app,https://your-admin-app.netlify.app`
   - `NODE_ENV`: `production`

Alternatively, use the included `render.yaml` for 1-click blueprint deployment.

### Deploying Admin Frontend to Netlify / Vercel

1. Build Command: `npm run build`
2. Publish Directory: `dist`
3. Environment Variable:
   - `VITE_API_URL`: `https://your-cinescope-api.onrender.com`

---

## 🔗 Public Site Integration

See **[CINESCOPE_PUBLIC_INTEGRATION.md](./CINESCOPE_PUBLIC_INTEGRATION.md)** for complete JavaScript snippets and integration instructions for the public CineScope website.

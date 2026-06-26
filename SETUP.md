# Global Backend CMS — Project Setup Guide

This project consists of two Next.js applications:

- **`Global_backend/`** — Headless CMS backend & admin dashboard (port 3000)
- **`layman-litigation/`** — Public-facing frontend website (port 3001)

---

## Prerequisites

- **Node.js** >= 18
- **PostgreSQL** >= 14 running locally on port 5432
- **npm** or **pnpm**

---

## 1. Environment Variables

### Backend (`Global_backend/.env.local`)

```bash
# ── DATABASE ──────────────────────────────────────────────
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/global_backend

# ── NEXTAUTH ──────────────────────────────────────────────
NEXTAUTH_SECRET=generate_a_random_32_char_secret_here
NEXTAUTH_URL=http://localhost:3000

# ── APP CONFIG ────────────────────────────────────────────
NEXT_PUBLIC_APP_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3001
```

### Frontend (`layman-litigation/.env.local`)

```bash
# Backend CMS connection
NEXT_PUBLIC_CMS_BASE_URL=http://localhost:3000
NEXT_PUBLIC_SITE_ID=layman_litigation
NEXT_PUBLIC_APP_URL=http://localhost:3001

# SDK Integration Key (for route sync)
CMS_INTEGRATION_KEY=your_integration_key_here
```

---

## 2. Database Setup

### Create the database

```bash
psql -U postgres -c "CREATE DATABASE global_backend;"
```

### Install dependencies & generate Prisma client

```bash
cd Global_backend
npm install
npx prisma generate
```

### Run migrations

```bash
npx prisma migrate dev
```

### Seed the database

```bash
# Seed default admin user + site
node prisma/seed.js

# Seed Layman Litigation content
node scripts/seed-layman-litigation.js
```

Default admin credentials:
| Email | Password | Role |
|---|---|---|
| admin@example.com | Admin@123 | SUPERADMIN |
| admin@laymanlitigation.com | Admin123! | Site Admin |

---

## 3. Running the Project

### Terminal 1 — Backend (port 3000)

```bash
cd Global_backend
npm run dev
```

### Terminal 2 — Frontend (port 3001)

```bash
cd layman-litigation
npm run dev
```

---

## 4. Access the Applications

| Application | URL | Purpose |
|---|---|---|
| Admin Dashboard | http://localhost:3000/login | CMS admin panel |
| Frontend Website | http://localhost:3001 | Public-facing site |
| API Endpoints | http://localhost:3000/api/* | Headless CMS API |

---

## 5. Features

### Admin Dashboard
- **Pages** — Create, edit, publish pages with sections
- **Blogs** — Manage blog posts with categories
- **Navigation** — Configure main & footer menus (supports dropdowns)
- **Header/Footer Builder** — Design site header & footer layouts
- **Media Library** — Upload and manage images
- **Security** — 2FA authentication, login history, audit logs
- **Performance** — Site health diagnostics, caching config
- **Redirects** — Manage 301/302 redirects & custom 404 page
- **Dev Tools** — Integration key management, environment info

### Frontend Website
- Home page with hero, services, testimonials, team, blog sections
- Blog listing with pagination and category filtering
- Category pages showing filtered posts
- Legal pages (Privacy Policy, Terms of Service, etc.)
- Contact form with CMS integration
- Cookie consent banner
- CTA popups and floating buttons

---

## 6. Common Tasks

### Create a new site

```bash
cd Global_backend
node scratch/create-site.mjs "Site Name" "domain.com" "custom_site_id"
```

### Sync frontend routes to backend

```bash
cd layman-litigation
NEXT_PUBLIC_CMS_BASE_URL=http://localhost:3000 \
NEXT_PUBLIC_SITE_ID=layman_litigation \
CMS_INTEGRATION_KEY=your_key \
node node_modules/@yourcompany/global-backend-next/sync.js
```

### Reset database

```bash
cd Global_backend
npx prisma migrate reset --force
```

---

## 7. Troubleshooting

| Issue | Solution |
|---|---|
| `ETIMEDOUT` connecting to backend | Ensure backend is running on port 3000 |
| Prisma migration fails | Run `npx prisma migrate reset --force` |
| Login returns 401 | Check NEXTAUTH_SECRET is set in `.env.local` |
| Frontend shows blank page | Check browser console for API errors |

# DIFM LLC — Global Backend CMS · 5-Day Sprint Workflow

> **Stack:** Next.js 14 (JS, App Router) · PostgreSQL · Prisma · REST APIs  
> **Goal:** Reusable, multi-site CMS backend covering all 28 modules from the feature sheet  
> **Rule:** Every model has `siteId`. Every route reads it. That's what makes this multi-site.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Tech Stack Decisions](#tech-stack-decisions)
3. [Folder Structure](#folder-structure)
4. [Multi-Site Pattern](#multi-site-pattern)
5. [Feature Coverage Map](#feature-coverage-map)
6. [Day 1 — Setup, Auth, Admin, Infrastructure](#day-1--setup-auth-admin-infrastructure)
7. [Day 2 — Pages, Services, Blog, Media, Contact](#day-2--pages-services-blog-media-contact)
8. [Day 3 — SEO, Analytics, CTA, Testimonials, FAQ, Team, Legal, Settings, Nav](#day-3--seo-analytics-cta-testimonials-faq-team-legal-settings-nav)
9. [Day 4 — Email, Security, Backup, Leads, Notifications, Compliance, Header/Footer](#day-4--email-security-backup-leads-notifications-compliance-headerfooter)
10. [Day 5 — Testing, Hardening, Docs, Deployment](#day-5--testing-hardening-docs-deployment)
11. [Day 1 Install Commands](#day-1-install-commands)
12. [Prisma Schema — Core Pattern](#prisma-schema--core-pattern)
13. [Environment Variables Reference](#environment-variables-reference)
14. [API Response Standard](#api-response-standard)
15. [Daily Progress Tracker](#daily-progress-tracker)

---

## Architecture Overview

This backend is a **multi-tenant, multi-site CMS platform**. Every data model is scoped by `siteId`, so one deployment serves unlimited websites. The API layer is pure REST (Next.js App Router API Routes) — any frontend (Next.js, React, Vue, mobile) consumes it by passing `x-site-id` in headers.

```
Client (any website)
  → passes x-site-id: "site_01" header
  → hits Next.js API Route
  → siteGuard.js resolves siteId
  → Prisma query scoped to that siteId
  → returns JSON { success, data }
```

---

## Tech Stack Decisions

| Layer | Technology | Why |
|---|---|---|
| Framework | Next.js 14 (App Router, JS) | API Routes + future SSR in one repo |
| Database | PostgreSQL 16 | Relational, multi-tenant via siteId, JSONB for flex fields |
| ORM | Prisma | Schema-driven, migrations, readable queries |
| Auth | NextAuth.js + bcryptjs | Session management, RBAC, 2FA ready |
| File Storage | AWS S3 / Cloudinary | Media library, compress, rename, folders |
| Email | Nodemailer + SMTP | Auto-reply, admin alerts, form notifications |
| Validation | Zod | Schema validation on all API inputs |
| Rate Limiting | @upstash/ratelimit | Security controls, DDoS protection |
| Caching | node-cache | Live visitor dashboard, heavy read routes |
| Deployment | Vercel + Supabase/Railway PG | Free tier viable, scales to production |

---

## Folder Structure

```
global-backend/
├── prisma/
│   ├── schema.prisma          # All 28 module tables + multi-site schema
│   ├── seed.js                # Default superadmin + site seed
│   └── migrations/
├── src/
│   ├── app/
│   │   └── api/
│   │       ├── auth/          # Login, logout, 2FA, session, reset
│   │       ├── users/         # Add, edit, remove, roles
│   │       ├── pages/         # Sections, banners, hide/show, draft/publish
│   │       ├── services/      # CRUD + FAQs + CTA + sort order
│   │       ├── blog/          # Posts, categories, featured, schedule, SEO
│   │       ├── media/         # Upload, replace, delete, compress, rename
│   │       ├── contact/       # Phone, email, address, Maps, hours, social
│   │       ├── forms/         # Submissions, export CSV, spam, lead status
│   │       ├── cta/           # Text/link, floating buttons, popups, newsletter
│   │       ├── seo/           # Title, meta, slug, OG, sitemap, robots, schema, LLM.txt
│   │       ├── analytics/     # GA, Tag Manager, Pixel, Search Console integrations
│   │       ├── visitors/      # Live visitors, pages, location, session, logs
│   │       ├── testimonials/  # Add, edit, delete, rating, show/hide, sort
│   │       ├── faq/           # CRUD, assign to page, sort, schema markup
│   │       ├── team/          # Members, role, photo, bio, social, sort
│   │       ├── legal/         # Privacy, terms, cookie, disclaimer, refund
│   │       ├── settings/      # Logo, favicon, colors, header, footer, maintenance
│   │       ├── navigation/    # Menus, items, dropdowns, external links
│   │       ├── email/         # SMTP, templates, auto-reply, admin alerts
│   │       ├── security/      # Validation, reCAPTCHA, rate limit, IP block, audit
│   │       ├── backup/        # DB + media backup, restore, history
│   │       ├── performance/   # Lazy load config, site health, error logs
│   │       ├── redirects/     # 301/302, custom 404, broken links, URL map
│   │       ├── leads/         # Lead CRUD, contact info, status, notes, export
│   │       ├── notifications/ # New lead, dashboard, failed form, blog alerts
│   │       ├── compliance/    # Cookie/form/privacy/marketing consent, data deletion
│   │       ├── dev/           # API keys, integration keys, env, error logs, versioning
│   │       ├── header/        # Logo, menu, CTA, sticky, transparent, multi-layout
│   │       └── footer/        # Layout, columns, logo, links, newsletter, copyright
│   ├── lib/
│   │   ├── prisma.js          # Prisma client singleton
│   │   ├── auth.js            # NextAuth config
│   │   ├── siteGuard.js       # Multi-site resolver
│   │   ├── response.js        # ok() / err() helpers
│   │   ├── validate.js        # Zod schemas per module
│   │   ├── s3.js              # AWS S3 helpers
│   │   ├── email.js           # Nodemailer helpers
│   │   └── middleware.js      # Rate limit, IP check, session guard
│   └── middleware.js          # Next.js edge middleware (auth, CORS)
├── docs/
│   ├── API.md                 # Full endpoint reference (written Day 5)
│   └── NEW_SITE_INTEGRATION.md
├── .env.local                 # Never commit
├── .env.example               # Template for new site integrations
└── README.md
```

---

## Multi-Site Pattern

Every route uses this — no exceptions.

```js
// src/lib/siteGuard.js
export function getSiteId(req) {
  const siteId =
    req.headers.get('x-site-id') ||
    req.nextUrl.searchParams.get('site_id');
  if (!siteId) throw new Error('Missing site_id');
  return siteId;
}

// src/lib/response.js
export const ok  = (data, status = 200) => Response.json({ success: true, data }, { status });
export const err = (msg, code, status)  => Response.json({ success: false, error: msg, code }, { status });

// Usage in any route handler — src/app/api/blog/route.js
import { getSiteId } from '@/lib/siteGuard';
import { ok, err }   from '@/lib/response';
import prisma        from '@/lib/prisma';

export async function GET(req) {
  try {
    const siteId = getSiteId(req);
    const posts  = await prisma.blog.findMany({ where: { siteId } });
    return ok(posts);
  } catch (e) {
    return err(e.message, 'SERVER_ERROR', 500);
  }
}
```

To integrate a **new website**: add a row to the `Site` table, copy `.env.example`, point your frontend at this API, and pass `x-site-id` in every request. Done.

---

## Feature Coverage Map

All 28 modules from the sheet mapped to API endpoints. Use this as your acceptance checklist.

| # | Sheet Module | Features to Build |
|---|---|---|
| 1 | Admin Access & Roles | Add Users, Remove Users, Assign Roles, Password Mgmt, Password Reset, 2FA, Activity Log, Login History |
| 2 | Page Management | Edit Sections, Edit Content/Buttons, Add Sections, Remove Sections, Hide Sections, Change Banners, Draft/Publish, Preview |
| 3 | Service Management | Add/Edit/Delete Service, Title+Description, Upload Images, FAQs, CTA Button, Show/Hide, Sort Order |
| 4 | Blog / Resources | Add/Edit/Delete Blog, Categories, Featured Image, Author, Draft/Publish, Schedule, SEO Fields |
| 5 | Media Library | Upload, Replace, Delete, Alt Text, Compress Images, Folder Mgmt, File Info, Rename File |
| 6 | Contact Details | Phone, Email, Office Address, WhatsApp, Google Maps, Business Hours, Social Links |
| 7 | Contact Forms | View Submissions, Change Email, Auto Reply, Spam Protection, Export CSV, Lead Status, Notes |
| 8 | CTA / Lead Capture | Edit CTA Text/Link, Info+Subscription Popups, Newsletter, Lead Magnet Popups, Floating Buttons |
| 9 | SEO Management | Title, Meta Desc, URL Slug, Canonical, OG Image, Sitemap, Robots.txt, Schema, Redirects, LLM.txt |
| 10 | Analytics & Tracking | Google Analytics, Tag Manager, Clarity, Search Console, Meta Pixel, LinkedIn Tag |
| 11 | Live Visitor Dashboard | Live Visitors, Pages Viewed, Location, Device Info, Traffic Source, Session Duration, Visitor Logs |
| 12 | Testimonials | Add/Edit/Delete, Client Name, Client Image, Rating, Show/Hide, Sort Order |
| 13 | FAQ Management | Add/Edit/Delete, Assign to Page, Sort Order, Show/Hide, Schema Markup |
| 14 | Team Section | Add/Edit/Delete Member, Name/Role, Photo, Bio, Social Links, Sort Order |
| 15 | Legal Pages | Privacy Policy, Terms, Cookie Policy, Disclaimer, Refund Policy, Last Updated |
| 16 | Website Settings | Logo, Favicon, Brand Colors, Header Settings, Footer Settings, Maintenance Mode, Default Contact Info |
| 17 | Navigation / Menus | Edit Main/Footer Menu, Add/Remove Items, Reorder, Dropdowns, External Links |
| 18 | Email Settings | SMTP Setup, Form Email, Auto Reply Template, Admin Alerts, Failed Email Logs |
| 19 | Security Controls | Input Validation, reCAPTCHA, Rate Limiting, Session Timeout, Audit Logs, IP Blocking |
| 20 | Backup & Restore | Database Backup, Media Backup, Manual Download, Restore Backup, Backup History |
| 21 | Performance | Lazy Loading config, Site Health check, Error Logs |
| 22 | 404 & Redirects | Custom 404, 301/302 Redirects, Broken Links scanner, URL Mapping |
| 23 | Lead Management | Lead Name, Contact Info, Service Interest, Source Page, Status, Notes, Export |
| 24 | Notifications | New Lead Alert, Dashboard Alert, Failed Form Alert, Blog Alert |
| 25 | Compliance | Cookie Consent, Form Consent, Privacy Acceptance, Marketing Consent, Data Deletion |
| 26 | Dev/Admin Tools | API Keys, Integration Keys, Env Settings, Error Logs, Version History, Deployment Notes |
| 27 | Header Builder | Logo Control, Menu Selection, CTA Button, Sticky Toggle, Transparent Header, Multi Header Layouts, Mobile Menu Editor, Announcement Bar |
| 28 | Footer Builder | Footer Layout, Column Mgmt, Logo & Desc, Quick Links, Contact Info, Social Links, Newsletter Form, Copyright Text |

---

## Day 1 — Setup, Auth, Admin, Infrastructure

**Hours:** 8–9 | **Goal:** Repo running, DB connected, login working, roles enforced

### Morning (9am–1pm) — Project Init & Database

| # | Task | What to Build | Est. |
|---|---|---|---|
| 1.1 | Init Next.js project | `npx create-next-app@latest global-backend --js --app` | 30 min |
| 1.2 | Install all dependencies | prisma, next-auth, bcryptjs, zod, nodemailer, aws-sdk, sharp, speakeasy, upstash, node-cache, csv-stringify, archiver | 20 min |
| 1.3 | Setup `.env.local` | DATABASE_URL, NEXTAUTH_SECRET, S3 keys, SMTP, all third-party keys | 20 min |
| 1.4 | Prisma schema — Part 1 | Users, Roles, Sites, SiteUser, Sessions, AuditLog, TwoFA, LoginHistory | 60 min |
| 1.5 | Prisma schema — Part 2 | All remaining 26 module tables with `siteId` FK on every model | 90 min |
| 1.6 | Run first migration | `npx prisma migrate dev --name init`, verify all tables in Postgres | 20 min |
| 1.7 | Seed database | Default superadmin user, default site, seed roles (superadmin/admin/editor/viewer) | 40 min |

### Afternoon (2pm–7pm) — Auth + Admin Module

| # | Task | What to Build | Est. |
|---|---|---|---|
| 1.8 | Setup NextAuth.js | `src/lib/auth.js` — CredentialsProvider, bcrypt compare, session carries role + siteId | 45 min |
| 1.9 | Auth API Routes | POST `/api/auth/login`, POST `/api/auth/logout`, GET `/api/auth/session`, POST `/api/auth/reset-password` | 45 min |
| 1.10 | 2FA Implementation | POST `/api/auth/2fa/setup` (TOTP secret + QR), POST `/api/auth/2fa/verify`, GET `/api/auth/2fa/status` | 60 min |
| 1.11 | User Management APIs | GET/POST `/api/users`, GET/PUT/DELETE `/api/users/[id]`, POST `/api/users/[id]/role` | 60 min |
| 1.12 | Activity Log + Login History | GET `/api/admin/activity-log`, GET `/api/admin/login-history` — log every auth event | 45 min |
| 1.13 | Route middleware | `src/middleware.js` — protect `/api/*`, check session, check role, inject siteId | 45 min |
| 1.14 | siteGuard.js + validate.js + response.js | Multi-site resolver, Zod schemas, ok()/err() helpers | 30 min |

### ✅ Day 1 Definition of Done

- [ ] Next.js dev server running on `localhost:3000` with no errors
- [ ] All 28+ Prisma tables created in Postgres, migration clean
- [ ] `POST /api/auth/login` returns session for seeded admin user
- [ ] Role-based middleware blocks unauthorized `/api` calls with 401/403
- [ ] 2FA setup + verify endpoint returns correct TOTP validation
- [ ] User CRUD endpoints tested in Postman / Thunder Client

---

## Day 2 — Pages, Services, Blog, Media, Contact

**Hours:** 8–9 | **Goal:** All content management APIs live

### Morning (9am–1pm) — Pages, Services, Blog

| # | Task | What to Build | Est. |
|---|---|---|---|
| 2.1 | Page Management APIs | GET/POST `/api/pages`, sections CRUD, banners, hide/show sections, draft/publish, preview token endpoint | 75 min |
| 2.2 | Service Management APIs | Full CRUD `/api/services`, title+desc+images+FAQs per service, CTA button, show/hide, sort order (integer) | 75 min |
| 2.3 | Blog / Resources APIs | CRUD `/api/blog`, categories (separate table), featured image, author FK, draft/publish, `publishAt` DateTime, SEO fields per post | 90 min |

### Afternoon (2pm–7pm) — Media, Contact Details, Contact Forms

| # | Task | What to Build | Est. |
|---|---|---|---|
| 2.4 | Media Upload | `POST /api/media/upload` — multipart, upload to S3/Cloudinary, store metadata (name, size, type, siteId, folder) | 60 min |
| 2.5 | Media Management | `GET /api/media` (list + folder filter), `PUT /api/media/[id]` (rename, alt text, move folder), `DELETE /api/media/[id]` | 45 min |
| 2.6 | Media Compress + Info | `POST /api/media/compress` (sharp.js resize + WebP), `GET /api/media/[id]/info` (size, dimensions, created) | 45 min |
| 2.7 | Contact Details APIs | `GET/PUT /api/contact/details` — phone, email, address, WhatsApp, Maps embed URL, business hours (JSON), social links array | 40 min |
| 2.8 | Contact Forms APIs | `GET /api/forms/submissions`, `PUT /api/forms/submissions/[id]` (lead status + notes), `GET /api/forms/export` (CSV), spam config PUT | 60 min |
| 2.9 | Form Submission Receiver | `POST /api/forms/submit` — Zod validate, check spam rules, save to DB, trigger email notification | 45 min |

### ✅ Day 2 Definition of Done

- [ ] Page sections add/edit/hide/show/draft/publish all working
- [ ] Blog post with category + author + scheduled publish created via API
- [ ] File upload to S3 returns public URL, metadata saved in media table
- [ ] Image compress endpoint verifiably reduces file size
- [ ] Form submission saved to DB + email notification fires to SMTP
- [ ] CSV export of form submissions downloads with correct data

---

## Day 3 — SEO, Analytics, CTA, Testimonials, FAQ, Team, Legal, Settings, Nav

**Hours:** 8–9 | **Goal:** All site-configuration and content display modules done

### Morning (9am–1pm) — SEO, Analytics, CTA, Live Visitors

| # | Task | What to Build | Est. |
|---|---|---|---|
| 3.1 | SEO Management APIs | `GET/PUT /api/seo/[pageSlug]` (title, meta, slug, canonical, OG), `GET /api/seo/sitemap` (XML), `GET/PUT /api/seo/robots`, `GET/PUT /api/seo/schema` (JSON-LD), `GET/PUT /api/seo/redirects`, `GET/PUT /api/seo/llm-txt` | 90 min |
| 3.2 | Analytics & Tracking APIs | `GET/PUT /api/analytics/config` — store GA ID, Tag Manager ID, Clarity ID, Search Console meta, Meta Pixel ID, LinkedIn Tag ID per site | 45 min |
| 3.3 | Live Visitor Dashboard | `POST /api/visitors/ping` (client sends every 30s with page+device+location), `GET /api/visitors/live` (active in last 2min), `GET /api/visitors/logs` (paginated), session duration calc | 75 min |
| 3.4 | CTA / Lead Capture APIs | `GET/PUT /api/cta/main` (text+link), CRUD `/api/cta/floating-buttons`, `GET/PUT /api/cta/popups` (newsletter + info + subscription), `GET/PUT /api/cta/lead-magnet` | 60 min |

### Afternoon (2pm–7pm) — Content Display + Site Config

| # | Task | What to Build | Est. |
|---|---|---|---|
| 3.5 | Testimonials APIs | Full CRUD `/api/testimonials` — client name, image URL, rating (1–5), show/hide bool, sort order integer | 50 min |
| 3.6 | FAQ Management APIs | Full CRUD `/api/faq`, filter by `?page=services`, sort order, show/hide, schema markup flag | 50 min |
| 3.7 | Team Section APIs | Full CRUD `/api/team` — name, role, photo URL, bio, social links JSON, sort order | 45 min |
| 3.8 | Legal Pages APIs | `GET/PUT /api/legal/[type]` where type = `privacy \| terms \| cookie \| disclaimer \| refund` — content + last_updated timestamp | 40 min |
| 3.9 | Website Settings APIs | `GET/PUT /api/settings` — logo, favicon, brand colors JSON, maintenance mode bool, default contact info JSON | 50 min |
| 3.10 | Navigation / Menus APIs | `GET/PUT /api/navigation/main` + `/api/navigation/footer` — items array with label, href, dropdown children, external bool, sort_order | 55 min |

### ✅ Day 3 Definition of Done

- [ ] SEO endpoint returns proper JSON-LD + Sitemap XML response
- [ ] `robots.txt` and `LLM.txt` editable per site via API
- [ ] Visitor ping + live visitor count endpoint returns accurate count
- [ ] CTA floating button add/remove/edit all working
- [ ] Testimonials sort order updates persist correctly in DB
- [ ] Navigation menu reorder reflects updated sort_order in GET response

---

## Day 4 — Email, Security, Backup, Leads, Notifications, Compliance, Header/Footer

**Hours:** 8–9 | **Goal:** Infrastructure, security, and conversion modules complete

### Morning (9am–1pm) — Email, Security, Backup, Performance, Redirects

| # | Task | What to Build | Est. |
|---|---|---|---|
| 4.1 | Email Settings APIs | `GET/PUT /api/email/smtp` (host, port, user, pass — stored encrypted), `GET/PUT /api/email/templates`, `GET /api/email/failed-logs`, `POST /api/email/smtp/test` | 70 min |
| 4.2 | Security Controls APIs | `GET/PUT /api/security/recaptcha`, `GET/PUT /api/security/rate-limit`, `GET/PUT /api/security/session-timeout`, `GET /api/security/audit-logs`, `POST/DELETE /api/security/ip-block` | 75 min |
| 4.3 | Backup & Restore APIs | `POST /api/backup/database` (pg_dump → S3), `POST /api/backup/media` (zip S3 folder), `GET /api/backup/history`, `GET /api/backup/[id]/download` (presigned URL), `POST /api/backup/restore` | 80 min |
| 4.4 | Performance APIs | `GET /api/performance/site-health` (DB ping, S3 ping, SMTP ping, response time), `GET /api/performance/error-logs` | 40 min |
| 4.5 | 404 & Redirects APIs | `GET/POST/DELETE /api/redirects` (301/302, source, target), `GET/PUT /api/redirects/custom-404`, `GET /api/redirects/broken-links` | 50 min |

### Afternoon (2pm–7pm) — Leads, Notifications, Compliance, Dev Tools, Header, Footer

| # | Task | What to Build | Est. |
|---|---|---|---|
| 4.6 | Lead Management APIs | `GET /api/leads` (filter by status/service/source), `GET/PUT/DELETE /api/leads/[id]`, `GET /api/leads/export` (CSV), status: `new \| contacted \| qualified \| closed` | 60 min |
| 4.7 | Notifications APIs | `GET/PUT /api/notifications/config` — enable/disable per type (new_lead, dashboard, failed_form, blog_alert) and per channel (email/dashboard) | 40 min |
| 4.8 | Compliance APIs | `GET/PUT /api/compliance/consent-config`, `GET /api/compliance/consent-logs`, `POST /api/compliance/data-deletion` (GDPR delete by email across all tables) | 55 min |
| 4.9 | Dev / Admin Tools APIs | CRUD `/api/dev/api-keys`, CRUD `/api/dev/integration-keys`, `GET/PUT /api/dev/env-settings`, `GET /api/dev/error-logs`, `GET /api/dev/version-history`, `GET/PUT /api/dev/deployment-notes` | 60 min |
| 4.10 | Header Builder APIs | `GET/PUT /api/header` — logo_url, menu_id (FK navigation), cta_button JSON, sticky bool, transparent bool, layout_id, mobile_menu_type, announcement_bar `{text, link, active}` | 50 min |
| 4.11 | Footer Builder APIs | `GET/PUT /api/footer` — layout_type, columns JSON array, logo_url, description, contact_info JSON, social_links JSON, newsletter `{enabled, placeholder, action_url}`, copyright_text | 50 min |

### ✅ Day 4 Definition of Done

- [ ] SMTP test email sends successfully from `/api/email/smtp/test`
- [ ] IP block list rejects requests from blocked IPs with 403
- [ ] DB backup creates pg_dump, uploads to S3, appears in backup history
- [ ] Lead export CSV downloads with all fields correctly formatted
- [ ] GDPR data deletion removes all records for given email
- [ ] Header builder GET returns full config, PUT persists changes correctly

---

## Day 5 — Testing, Hardening, Docs, Deployment

**Hours:** 8 | **Goal:** Production-ready, documented, deployable

### Morning (9am–1pm) — Testing + Security Hardening

| # | Task | What to Build | Est. |
|---|---|---|---|
| 5.1 | Full API test pass | Test every endpoint in Postman/Thunder Client — happy path + error cases (missing siteId, invalid role, bad input) | 90 min |
| 5.2 | Multi-site isolation test | Create 2 sites in DB, call every content API with both site_ids, confirm zero data leakage | 45 min |
| 5.3 | Security hardening | CORS headers (allowlist origins), sanitize all inputs, confirm rate limiting fires, test reCAPTCHA on form submit | 60 min |
| 5.4 | Error handling audit | Every route must return `{success, error, code}` shape. Add try/catch to any route missing it | 45 min |
| 5.5 | Prisma query optimization | Add DB indexes on `siteId+status` on Blog, Leads, Visitors, Forms. Test query time | 40 min |

### Afternoon (2pm–7pm) — Docs, SDK, Deployment

| # | Task | What to Build | Est. |
|---|---|---|---|
| 5.6 | Generate API documentation | `docs/API.md` — for each module: URL, method, required headers, request body schema, response example | 90 min |
| 5.7 | Create integration SDK helper | `src/sdk/index.js` — thin JS wrapper around fetch: `import { getBlogs, getServices } from './sdk'` | 60 min |
| 5.8 | Write `.env.example` | Every env variable with description + example value. Future sites copy this | 20 min |
| 5.9 | Deploy to production | Push to GitHub → Vercel auto-deploy. Set up Supabase/Railway Postgres. Run `prisma migrate deploy`. Set env vars in Vercel dashboard | 60 min |
| 5.10 | Smoke test on production | Hit auth, blog GET, media upload, form submit on prod URL — confirm all working with real DB | 30 min |
| 5.11 | Write integration guide | `docs/NEW_SITE_INTEGRATION.md` — add site to Sites table, copy `.env.example`, pass `x-site-id` header | 20 min |

### ✅ Day 5 Definition of Done = Project Done

- [ ] All 28 module groups have working, tested API endpoints
- [ ] Multi-site isolation confirmed — Site A data never visible to Site B
- [ ] All routes return consistent `{success, data, error}` JSON shape
- [ ] Production URL live on Vercel, connecting to prod Postgres
- [ ] `docs/API.md` covers all endpoints with request/response examples
- [ ] Any new website can be integrated in under 15 minutes using the guide

---

## Day 1 Install Commands

Copy and paste in sequence. Do not skip the init step.

```bash
# 1. Create project
npx create-next-app@latest global-backend --js --app --no-tailwind
cd global-backend

# 2. Core dependencies
npm install prisma @prisma/client next-auth bcryptjs zod
npm install nodemailer @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
npm install sharp multer formidable
npm install speakeasy qrcode          # 2FA TOTP
npm install @upstash/ratelimit @upstash/redis  # Rate limiting
npm install node-cache                # In-memory cache for live visitors
npm install csv-stringify             # CSV export
npm install archiver                  # ZIP for backup

# 3. Init Prisma
npx prisma init --datasource-provider postgresql

# 4. After writing schema.prisma
npx prisma migrate dev --name init
npx prisma generate
node prisma/seed.js

# 5. Dev server
npm run dev
```

---

## Prisma Schema — Core Pattern

Every model must have `siteId`. This is non-negotiable — it's the foundation of multi-site.

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Site {
  id        String   @id @default(cuid())
  name      String
  domain    String   @unique
  createdAt DateTime @default(now())
  users     SiteUser[]
}

model User {
  id           String     @id @default(cuid())
  email        String     @unique
  passwordHash String
  globalRole   String     @default("viewer") // superadmin | admin | editor | viewer
  twoFASecret  String?
  twoFAEnabled Boolean    @default(false)
  createdAt    DateTime   @default(now())
  sites        SiteUser[]
  auditLogs    AuditLog[]
}

model SiteUser {
  id     String @id @default(cuid())
  siteId String
  userId String
  role   String @default("editor")  // per-site role override
  site   Site   @relation(fields: [siteId], references: [id])
  user   User   @relation(fields: [userId], references: [id])
  @@unique([siteId, userId])
}

model AuditLog {
  id        String   @id @default(cuid())
  siteId    String
  userId    String
  action    String
  meta      Json?
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id])
  @@index([siteId, createdAt])
}

// ── All 26 content models follow this exact pattern ──────────────────────────

model Blog {
  id          String    @id @default(cuid())
  siteId      String                          // ← REQUIRED on every model
  title       String
  slug        String
  content     String    @db.Text
  authorId    String
  categoryId  String?
  featuredImg String?
  status      String    @default("draft")    // draft | published
  publishAt   DateTime?
  seoTitle    String?
  seoDesc     String?
  ogImage     String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  @@unique([siteId, slug])
  @@index([siteId, status])
}

model Service {
  id          String   @id @default(cuid())
  siteId      String
  title       String
  description String   @db.Text
  images      Json     @default("[]")
  ctaText     String?
  ctaLink     String?
  showHide    Boolean  @default(true)
  sortOrder   Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  @@index([siteId, sortOrder])
}

model Media {
  id        String   @id @default(cuid())
  siteId    String
  name      String
  url       String
  altText   String?
  size      Int
  mimeType  String
  folder    String   @default("root")
  createdAt DateTime @default(now())
  @@index([siteId, folder])
}

model Lead {
  id              String   @id @default(cuid())
  siteId          String
  name            String
  email           String
  phone           String?
  serviceInterest String?
  sourcePage      String?
  status          String   @default("new") // new | contacted | qualified | closed
  notes           String?  @db.Text
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  @@index([siteId, status])
}

// Continue same pattern for:
// Testimonial, FAQ, TeamMember, LegalPage, Setting, Navigation,
// Redirect, Visitor, Notification, Compliance, DevKey, Header, Footer,
// SEO, Analytics, CTA, EmailTemplate, SecurityConfig, BackupHistory,
// FormSubmission, ContactDetail, PageSection, BlogCategory
```

---

## Environment Variables Reference

```bash
# ── DATABASE ──────────────────────────────────────────────
DATABASE_URL=postgresql://user:password@host:5432/global_backend

# ── NEXTAUTH ──────────────────────────────────────────────
NEXTAUTH_SECRET=your_random_32char_secret_here
NEXTAUTH_URL=http://localhost:3000

# ── AWS S3 (Media Library) ────────────────────────────────
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=
AWS_REGION=ap-south-1

# ── CLOUDINARY (Alternative to S3) ───────────────────────
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# ── EMAIL / SMTP ──────────────────────────────────────────
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@email.com
SMTP_PASS=your_app_password

# ── RECAPTCHA ─────────────────────────────────────────────
RECAPTCHA_SITE_KEY=
RECAPTCHA_SECRET_KEY=

# ── TOTP 2FA ──────────────────────────────────────────────
TOTP_ISSUER=DIFM_LLC_Backend

# ── RATE LIMITING (Upstash Redis) ─────────────────────────
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# ── APP CONFIG ────────────────────────────────────────────
NEXT_PUBLIC_APP_URL=http://localhost:3000
DEFAULT_SITE_ID=site_01    # change per deployment
```

---

## API Response Standard

Every single endpoint follows this shape — no exceptions.

```js
// src/lib/response.js
export const ok  = (data, status = 200) =>
  Response.json({ success: true, data }, { status });

export const err = (message, code = 'ERROR', status = 500) =>
  Response.json({ success: false, error: message, code }, { status });

// ── Response shapes ──────────────────────────────────────

// 200 Success
{ "success": true, "data": { ... } }

// 201 Created
{ "success": true, "data": { "id": "...", ... } }

// 404 Not Found
{ "success": false, "error": "Blog not found", "code": "NOT_FOUND" }

// 422 Validation Error
{ "success": false, "error": "Invalid input", "code": "VALIDATION_ERROR", "details": [ ... ] }

// 401 Unauthorized
{ "success": false, "error": "Unauthorized", "code": "AUTH_REQUIRED" }

// 403 Forbidden
{ "success": false, "error": "Insufficient permissions", "code": "FORBIDDEN" }

// ── Route template (copy for every new route) ────────────
import { getSiteId }     from '@/lib/siteGuard';
import { ok, err }       from '@/lib/response';
import { validateWith }  from '@/lib/validate';
import prisma            from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions }   from '@/lib/auth';

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return err('Unauthorized', 'AUTH_REQUIRED', 401);
    const siteId = getSiteId(req);
    const data = await prisma.yourModel.findMany({ where: { siteId } });
    return ok(data);
  } catch (e) {
    return err(e.message, 'SERVER_ERROR', 500);
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return err('Unauthorized', 'AUTH_REQUIRED', 401);
    const siteId = getSiteId(req);
    const body = await req.json();
    // const parsed = YourZodSchema.safeParse(body);
    // if (!parsed.success) return err('Invalid input', 'VALIDATION_ERROR', 422);
    const created = await prisma.yourModel.create({ data: { siteId, ...body } });
    return ok(created, 201);
  } catch (e) {
    return err(e.message, 'SERVER_ERROR', 500);
  }
}
```

---

## Daily Progress Tracker

Paste this in your project `README.md` and check off as you go.

```
DAY 1 ─ Setup + Auth + Admin
  [ ] 1.1  Next.js project initialized, dev server running
  [ ] 1.2  All npm packages installed with no peer dep errors
  [ ] 1.3  .env.local configured
  [ ] 1.4  Prisma schema Part 1 written (auth tables)
  [ ] 1.5  Prisma schema Part 2 written (all 26 content tables)
  [ ] 1.6  prisma migrate dev --name init ran clean
  [ ] 1.7  Seed complete — superadmin user + default site in DB
  [ ] 1.8  NextAuth CredentialsProvider working
  [ ] 1.9  Login/logout/session endpoints tested
  [ ] 1.10 2FA setup + verify working
  [ ] 1.11 User CRUD all methods tested
  [ ] 1.12 Activity log + login history endpoints return data
  [ ] 1.13 Middleware blocks unauthenticated /api calls
  [ ] 1.14 siteGuard.js + response.js helpers working

DAY 2 ─ Pages + Services + Blog + Media + Contact
  [ ] 2.1  Page sections CRUD + hide/show + draft/publish
  [ ] 2.2  Service CRUD + sort order + show/hide
  [ ] 2.3  Blog CRUD + categories + author + schedule + SEO fields
  [ ] 2.4  Media upload to S3 returning public URL
  [ ] 2.5  Media list + rename + delete working
  [ ] 2.6  Compress endpoint reduces file size (verified)
  [ ] 2.7  Contact details GET/PUT working
  [ ] 2.8  Form submissions list + status update + export CSV
  [ ] 2.9  Form submit endpoint saves + triggers email

DAY 3 ─ SEO + Analytics + CTA + Content Display + Site Config
  [ ] 3.1  SEO per page + sitemap XML + robots.txt + schema + LLM.txt
  [ ] 3.2  Analytics config stored per site
  [ ] 3.3  Visitor ping + live count + logs working
  [ ] 3.4  CTA main + floating buttons + popups CRUD
  [ ] 3.5  Testimonials CRUD + sort order + show/hide
  [ ] 3.6  FAQ CRUD + page assignment + schema markup flag
  [ ] 3.7  Team member CRUD + sort order
  [ ] 3.8  Legal pages GET/PUT for all 5 types
  [ ] 3.9  Website settings GET/PUT (logo, colors, maintenance)
  [ ] 3.10 Navigation main + footer menu reorder working

DAY 4 ─ Email + Security + Backup + Leads + Header/Footer
  [ ] 4.1  SMTP config + test email sends successfully
  [ ] 4.2  reCAPTCHA + rate limit + IP block + audit logs
  [ ] 4.3  DB backup → S3, history recorded, download presigned URL
  [ ] 4.4  Site health check + error logs endpoint
  [ ] 4.5  301/302 redirects + custom 404 working
  [ ] 4.6  Lead CRUD + status + CSV export
  [ ] 4.7  Notification config enable/disable per type
  [ ] 4.8  Compliance consent config + GDPR data deletion
  [ ] 4.9  Dev tools: API keys + integration keys CRUD
  [ ] 4.10 Header builder GET/PUT with all fields
  [ ] 4.11 Footer builder GET/PUT with all fields

DAY 5 ─ Testing + Hardening + Docs + Deploy
  [ ] 5.1  All endpoints tested — happy path + errors
  [ ] 5.2  Multi-site isolation confirmed (2 sites, zero leakage)
  [ ] 5.3  CORS + input sanitization + rate limit verified
  [ ] 5.4  Every route returns consistent {success, data/error, code}
  [ ] 5.5  DB indexes added, query performance verified
  [ ] 5.6  docs/API.md written for all modules
  [ ] 5.7  src/sdk/index.js integration helper created
  [ ] 5.8  .env.example documented
  [ ] 5.9  Deployed to Vercel + prod Postgres
  [ ] 5.10 Smoke tests pass on production URL
  [ ] 5.11 docs/NEW_SITE_INTEGRATION.md written
```

---

*DIFM LLC · Global Backend CMS · Next.js (JS) + PostgreSQL + Prisma · Multi-Site Architecture*

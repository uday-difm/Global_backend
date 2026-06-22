# Global Backend SDK & Multi-Tenant Integration Guide

This guide explains how the lightweight Next.js SDK interacts with the Global Backend CMS, how multi-tenant isolation is maintained, and how to verify the integration using the provided demo application configurations.

---

## 1. Architectural Overview & SDK Mechanics

The Global Backend platform uses a **headless** model, meaning the database and administrative dashboard (the backend) are decoupled from the public-facing client websites (the frontend). 

```
+--------------------------------------------------------------+
|                     Next.js Frontend Client                  |
|    CMSClient (siteId: 'site_alpha')                          |
+------------------------------+-------------------------------+
                               |
                               |  1. HTTP GET /api/posts
                               |     Headers: [x-site-id: site_alpha]
                               v
+--------------------------------------------------------------+
|                       Next.js API Gateway                    |
|    getSiteId(req) -> Extracts siteId context                 |
+------------------------------+-------------------------------+
                               |
                               |  2. Scoped Database Query
                               v
+--------------------------------------------------------------+
|                     PostgreSQL Database                      |
|    SELECT * FROM "Post" WHERE "siteId" = 'site_alpha'        |
+--------------------------------------------------------------+
```

### SDK Request Scoping
When initializing the client SDK in your frontend, you specify a `siteId` associated with your website tenant:
```javascript
import { CMSClient } from '@yourcompany/global-backend-next';

const cms = new CMSClient({
  baseUrl: 'https://cms-api.yourdomain.com',
  siteId: 'site_alpha_123'
});
```

Whenever you query content (e.g., `cms.getPosts()` or `cms.getServices()`), the internal SDK request interceptor inside [index.js](file:///c:/Users/udayv/Desktop/global_backend/src/sdk/index.js) automatically handles tenant isolation:
1. **Header Injection:** Sets the custom HTTP header `x-site-id: site_alpha_123`.
2. **Query Parameter Injection:** Appends `?siteId=site_alpha_123` to the query URL.

---

## 2. Multi-Tenant Verification (DB Isolation)

In a shared-database headless CMS, keeping one tenant's data isolated from another is critical. The platform achieves logical isolation through the following mechanisms:

### A. Foreign Key Partitioning
Every piece of content generated in the admin console is tagged with a `siteId` foreign key. For example, pages, posts, and forms have strict database relations:
```prisma
model Page {
  id     String @id @default(cuid())
  siteId String
  site   Site   @relation(fields: [siteId], references: [id], onDelete: Cascade)
  ...
}
```

### B. Index & Constraint Scoping
Uniqueness constraints (like page slugs and blog slugs) are indexed as composite unique keys:
```prisma
@@unique([siteId, slug])
```
This guarantees that **Site A** and **Site B** can both safely have a page with the slug `/about` without database collisions.

### C. Multi-User Access
Multiple users can be assigned to manage the same site. The junction table `SiteUser` defines this relationship:
* Multiple users can belong to the same `siteId`.
* A single user can have separate role permissions (e.g., `ADMIN`, `EDITOR`, `AUTHOR`) on different sites.
* The combination of `siteId` and `userId` must be unique (`@@unique([siteId, userId])`) to prevent conflicting profiles.

---

## 3. Site Provisioning & Workspace Setup

Before connecting your Next.js application, you must provision a site workspace in the CMS backend database. Two helper scripts are available to initialize site records, global configurations, and default draft pages:

### Option A: Interactive Wizard (Recommended)
Runs an interactive questionnaire in the terminal to guide you through site onboarding:
```bash
node --env-file=.env scratch/provision-wizard.mjs
```

### Option B: Quick CLI Command
Instantly registers a site workspace in one command:
```bash
node --env-file=.env scratch/create-site.mjs "My New Site" "mynewsite.local" "my_custom_site_id"
```
*(Only the first argument, Site Name, is required).*

### Automatic Manifest Generation
Both provisioning tools automatically generate an initial `IntegrationManifest` containing default routes (`/`, `/about`, `/services`, `/blog`, `/contact`) and register matching `DRAFT` Page records in the database. This allows Connected SDK frontends to access these routes immediately upon initialization.

## 4. Demo Application Walkthrough

The demo application, **"Global Backend Demo Site"**, represents a clean implementation of the SDK capabilities.

### 1. Build Phase: Automated Page Sync
When you trigger the build or pre-build process on the frontend, the scanner in [sync.js](file:///c:/Users/udayv/Desktop/global_backend/src/sdk/sync.js) runs:
1. Scans the frontend's directory `app/` folder.
2. Identifies pages like `/about/page.tsx` and dynamic templates like `/[...slug]/page.tsx`.
3. Dispatches a manifest POST to the backend with the API key (`x-integration-key`).
4. The backend registers these discovered paths as `DRAFT` pages in the admin console, ready for editing.

### 2. Runtime Phase: Layout & Analytics Rendering
In the root layout (`app/layout.jsx`), the SDK injects site-specific parameters globally:
* **Google Analytics & Microsoft Clarity:** Loaded via the `<GlobalAnalytics />` component based on settings.
* **Layout Builders:** The `<Header />` and `<Footer />` components load navigation menus and theme colors dynamically according to the active tenant's configurations.

### 3. Verification & Testing Flow
To run an end-to-end integration test:

```bash
# Step 1: Discover page paths and sync them to the CMS
node node_modules/@yourcompany/global-backend-next/sync

# Step 2: Access the CMS Dashboard, select your site, and publish the created pages.

# Step 3: Run the local site and check that pages load visual blocks dynamically.

# Step 4: Validate that SEO headers and JSON-LD structured tags are injected into the HTML.

# Step 5: Test form submissions and verify that records are captured in the leads console.
```

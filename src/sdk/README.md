# Global Backend Next.js SDK

Lightweight integration SDK wrapper to easily connect any Next.js application to the **Global Backend Headless CMS & Admin Console**. Enables plug-and-play route synchronization, dynamic layout elements, per-page SEO controls, and automated tracking script injection.

## Installation

Install the package directly into your Next.js project root:

```bash
npm install @yourcompany/global-backend-next
```

## Workspace Setup & Site Provisioning

Before configuring the client SDK, you must provision a site workspace in the CMS backend database. Two helper scripts are available in the backend workspace for this purpose:

### Option 1: Interactive Wizard (Recommended)
Runs an interactive questionnaire in the terminal that guides you through site creation:
```bash
node --env-file=.env scratch/provision-wizard.mjs
```

### Option 2: CLI Command
Instantly creates a site workspace with a single CLI command:
```bash
node --env-file=.env scratch/create-site.mjs "My New Site" "mynewsite.local" "my_custom_site_id"
```
*(Only the first argument, Site Name, is required).*

### Automatic Manifest & Draft Page Generation
Both setup scripts automatically initialize the site workspace with a default `IntegrationManifest`, 5 core draft pages (`Home`, `About`, `Services`, `Blog`, `Contact`), and their registered `SyncedRoute` mapping entries in the database.

## Configuration

Set the following environment variables in your frontend project's `.env.local`:

```env
NEXT_PUBLIC_CMS_BASE_URL=http://localhost:3000
NEXT_PUBLIC_SITE_ID=your_registered_site_id
CMS_INTEGRATION_KEY=your_site_integration_secret_key
```

## Features

### 1. Automated Page Route Discovery (Auto-Sync)

To automatically discover page routes in your Next.js App Router and sync them with the CMS as Draft pages:

Add the sync hook to your build lifecycle or run it directly:

```bash
node node_modules/@yourcompany/global-backend-next/sync.js
```

Upon execution, it scans the `app/` folder structure, detects static and dynamic parameters, and logs routes to your dashboard database.

### 2. Centralized Layout & Tracking Scripts Injection

In your frontend application's root layout (`app/layout.jsx`), import the `CMSClient` wrapper and `<GlobalAnalytics />` component:

```jsx
import { CMSClient } from "@yourcompany/global-backend-next";
import { GlobalAnalytics, Header, Footer } from "@yourcompany/global-backend-next/components";

// Initialize CMS Client
const cms = new CMSClient({
  baseUrl: process.env.NEXT_PUBLIC_CMS_BASE_URL,
  siteId: process.env.NEXT_PUBLIC_SITE_ID
});

export default async function RootLayout({ children }) {
  // Fetch site-wide layout and tracking settings
  const { settings } = await cms.getGlobalSettings();
  
  return (
    <html lang="en">
      <head>
        {/* Inject scripts like GTM, GA4, Clarity, Meta Pixel, and Custom Head Scripts */}
        <GlobalAnalytics settings={settings} />
      </head>
      <body>
        <Header 
          logoUrl={settings?.websiteSettings?.logoUrl} 
          siteName="My Website" 
          headerSettings={settings?.header}
          navigationLinks={settings?.navigation?.links || []}
        />
        
        {children}
        
        <Footer 
          siteName="My Website" 
          footerSettings={settings?.footer}
          navigationLinks={settings?.navigation?.links || []}
        />
      </body>
    </html>
  );
}
```

### 3. Dynamic Page Content Rendering

Render CMS visual layout blocks dynamically within catch-all dynamic route templates (`app/[...slug]/page.jsx`):

```jsx
import { notFound } from "next/navigation";
import { CMSClient } from "@yourcompany/global-backend-next";

const cms = new CMSClient({
  baseUrl: process.env.NEXT_PUBLIC_CMS_BASE_URL,
  siteId: process.env.NEXT_PUBLIC_SITE_ID
});

// Load Dynamic Page Metadata
export async function generateMetadata({ params }) {
  const { seo } = await cms.getPage(params.slug.join("/"));
  if (!seo) return {};
  
  return {
    title: seo.title,
    description: seo.description,
    alternates: {
      canonical: seo.canonical,
    },
    openGraph: {
      title: seo.title,
      description: seo.description,
      images: seo.ogImage ? [{ url: seo.ogImage }] : [],
    }
  };
}

export default async function CMSPage({ params }) {
  const { page, sections, jsonLd } = await cms.getPage(params.slug.join("/"));
  
  if (!page || page.status !== "PUBLISHED") {
    return notFound();
  }

  return (
    <div>
      {/* Safely Inject JSON-LD Schema */}
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      
      {/* Dynamic Sections Renderer */}
      {sections.map((section) => {
        if (section.type === 'HERO') return <Hero key={section.id} data={section.content} />;
        if (section.type === 'TEXT_BLOCK') return <TextBlock key={section.id} data={section.content} />;
        return <FallbackSection key={section.id} type={section.type} />;
      })}
    </div>
  );
}
```

### 4. Dynamic XML Sitemap Serving

Expose sitemaps automatically in Next.js by adding `app/sitemap.js`. The `getSitemap()` method accepts an optional domain URL string to automatically resolve relative paths into absolute URLs as required by search engines:

```javascript
import { CMSClient } from "@yourcompany/global-backend-next";

const cms = new CMSClient({
  baseUrl: process.env.NEXT_PUBLIC_CMS_BASE_URL,
  siteId: process.env.NEXT_PUBLIC_SITE_ID
});

export default async function sitemap() {
  const domain = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const sitemapItems = await cms.getSitemap(domain);
  return sitemapItems.map(item => ({
    url: item.url,
    lastModified: new Date(item.lastModified)
  }));
}
```

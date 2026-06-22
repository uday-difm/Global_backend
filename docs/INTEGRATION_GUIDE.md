# Universal Frontend & Tech Stack Integration Guide

This guide explains how to connect **any frontend framework, non-JS backend stack, or native mobile application** to the Global Backend Headless CMS, configure route synchronization, and dynamically retrieve page settings and layout block sections.

---

## 1. Core Integration Concepts

The CMS backend acts as a **headless API engine**. Every resource query is scoped to a specific site workspace using:
* **HTTP Header:** `x-site-id`
* **Query Parameter:** `siteId`
* **Secret Token authentication:** `x-integration-key` header (using your project's unique ApiKey or Site integration key).

### Universal Content Delivery Endpoints
* **Get Single Page Content:**
  `GET /api/content?slug=<path>&siteId=<your_site_id>`
* **Get Site-wide Layout Settings (Header/Footer):**
  `GET /api/global-settings?siteId=<your_site_id>`
* **Get Blog Posts Collection:**
  `GET /api/posts?siteId=<your_site_id>`
* **Submit Lead Contact Forms:**
  `POST /api/forms/submit` (Payload: `siteId`, `name`, `email`, `message`, `phone`)

---

## 2. Configuration for Route Syncing (`cms-sync.config.json`)

To synchronize routes from your local project with the CMS, create a `cms-sync.config.json` configuration file in your project's root folder:

```json
{
  "cmsBaseUrl": "http://localhost:3000",
  "siteId": "your_site_id",
  "framework": "next | nuxt | sveltekit | php | python | other",
  "routesDir": "./src/app",
  "extensions": [".js", ".jsx", ".tsx", ".vue", ".svelte", ".html", ".php"],
  "exclude": ["**/components/**", "**/layouts/**", "**/error.vue"],
  "staticRoutes": [
    { "slug": "/hardcoded-route", "path": "src/manual-pages/route", "title": "Hardcoded Page" }
  ]
}
```

Run the universal sync utility using Node:
```bash
node node_modules/@yourcompany/global-backend-next/sync-cli.js --config=cms-sync.config.json
```
*(Environment variables `CMS_BASE_URL`, `CMS_SITE_ID`, and `CMS_INTEGRATION_KEY` can be used to override config values).*

---

## 3. Technology Stack Integration Examples

### A. Next.js (App Router)
#### Route Synchronization:
```json
{
  "cmsBaseUrl": "http://localhost:3000",
  "siteId": "site_alpha_123",
  "framework": "next",
  "routesDir": "./src/app"
}
```
#### Content Rendering:
Use the client SDK to load page metadata and dynamic sections in catch-all route `src/app/[...slug]/page.jsx`:
```jsx
import { notFound } from "next/navigation";
import { CMSClient } from "@yourcompany/global-backend-next";

const cms = new CMSClient({
  baseUrl: process.env.NEXT_PUBLIC_CMS_BASE_URL,
  siteId: process.env.NEXT_PUBLIC_SITE_ID
});

export default async function CMSPage({ params }) {
  const { page, sections } = await cms.getPage(params.slug.join("/"));
  if (!page || page.status !== "PUBLISHED") return notFound();

  return (
    <main>
      {sections.map((sec) => {
        if (sec.type === "HERO") return <Hero key={sec.id} data={sec.content} />;
        if (sec.type === "TEXT_BLOCK") return <TextBlock key={sec.id} data={sec.content} />;
        return <FallbackSection key={sec.id} type={sec.type} />;
      })}
    </main>
  );
}
```

---

### B. Vue / Nuxt (pages/ directory)
#### Route Synchronization:
```json
{
  "cmsBaseUrl": "http://localhost:3000",
  "siteId": "site_alpha_123",
  "framework": "nuxt",
  "routesDir": "./pages"
}
```
#### Content Rendering (`pages/[...slug].vue`):
```html
<template>
  <div v-if="page">
    <div v-for="sec in sections" :key="sec.id">
      <Hero v-if="sec.type === 'HERO'" :content="sec.content" />
      <TextBlock v-else-if="sec.type === 'TEXT_BLOCK'" :content="sec.content" />
      <div v-else>Fallback: {{ sec.type }}</div>
    </div>
  </div>
</template>

<script setup>
const route = useRoute();
const slug = route.params.slug ? route.params.slug.join('/') : '/';

const { data: cmsPayload } = await useFetch(
  `http://localhost:3000/api/content?slug=${slug}&siteId=site_alpha_123`
);
const page = cmsPayload.value?.page;
const sections = cmsPayload.value?.sections || [];
</script>
```

---

### C. SvelteKit (src/routes/)
#### Route Synchronization:
```json
{
  "cmsBaseUrl": "http://localhost:3000",
  "siteId": "site_alpha_123",
  "framework": "sveltekit",
  "routesDir": "./src/routes"
}
```
#### Content Rendering (`src/routes/[...slug]/+page.server.js`):
```javascript
import { error } from '@sveltejs/kit';

export async function load({ params }) {
  const slug = params.slug || '';
  const res = await fetch(`http://localhost:3000/api/content?slug=${slug}&siteId=site_alpha_123`);
  
  if (!res.ok) throw error(404, 'Page not found');
  
  const { page, sections } = await res.json();
  return { page, sections };
}
```

---

### D. Non-JS Web Frameworks (PHP / Python / Go)
Non-JS web backends can perform route synchronization during deployment using a simple `cURL` POST.

#### Shell Command Deploy Route Sync:
```bash
curl -X POST http://localhost:3000/api/integrations/sync-routes \
  -H "Content-Type: application/json" \
  -H "x-integration-key: your_site_integration_key" \
  -d '{
    "siteId": "site_alpha_123",
    "framework": "php",
    "routes": [
      {"slug": "/", "path": "index.php", "title": "Home Page"},
      {"slug": "/about", "path": "about-us.php", "title": "About Us"},
      {"slug": "/contact", "path": "contact.php", "title": "Get In Touch"}
    ]
  }'
```

#### Server-Side PHP Content Rendering (`index.php`):
```php
<?php
$siteId = "site_alpha_123";
$slug = $_SERVER['REQUEST_URI']; // e.g. "/about"

// Fetch layout and content dynamically
$apiUrl = "http://localhost:3000/api/content?slug=" . urlencode($slug) . "&siteId=" . urlencode($siteId);
$ch = curl_init($apiUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
curl_close($ch);

$data = json_decode($response, true);
$page = $data['page'] ?? null;
$sections = $data['sections'] ?? [];

if (!$page || $page['status'] !== 'PUBLISHED') {
    header("HTTP/1.1 404 Not Found");
    echo "<h1>404 Page Not Found</h1>";
    exit;
}

// Loop and render template parts
foreach ($sections as $section) {
    if ($section['type'] === 'HERO') {
        include 'templates/hero.php'; // Renders $section['content']
    } elseif ($section['type'] === 'TEXT_BLOCK') {
        include 'templates/text-block.php';
    }
}
?>
```

---

### E. Native Mobile Applications (Android / iOS / Flutter)
Mobile applications use deep links or view controller names to dynamically configure app screens from the CMS.

#### Mobile Sync Registration (CLI or Deployment POST):
```bash
curl -X POST http://localhost:3000/api/integrations/sync-routes \
  -H "Content-Type: application/json" \
  -H "x-integration-key: your_key" \
  -d '{
    "siteId": "site_alpha_123",
    "framework": "android",
    "routes": [
      {"slug": "/home-screen", "path": "MainActivity.kt", "title": "App Main Dashboard"},
      {"slug": "/support-view", "path": "SupportActivity.kt", "title": "Help Center Screen"}
    ]
  }'
```

#### Native Android Layout Builder (Kotlin Retrofit / Jetpack Compose):
```kotlin
// Fetch app screen layout JSON
interface CmsApi {
    @GET("api/content")
    suspend fun getScreenLayout(
        @Query("slug") slug: String,
        @Query("siteId") siteId: String
    ): Response<CmsScreenResponse>
}

// Dynamically Render Jetpack Compose Views based on CMS Section payload
@Composable
fun RenderCmsScreen(sections: List<CmsSection>) {
    LazyColumn {
        items(sections) { section ->
            when (section.type) {
                "HERO" -> NativeHeroBanner(section.content)
                "SERVICES" -> NativeServicesCarousel(section.content.items)
                "FAQ" -> NativeFaqAccordionList(section.content.items)
                else -> Spacer(modifier = Modifier.height(16.dp))
            }
        }
    }
}
```

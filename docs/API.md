# API Reference Specification - Global Backend CMS

This document specifies the REST API endpoints exposed by the Global Backend CMS. 

All endpoints follow the **API Response Standard**:
- **200/201 Success:** `{ "success": true, "data": ... }`
- **4xx/5xx Failure:** `{ "success": false, "error": "Error message", "code": "ERROR_CODE", "details": ... }`

---

## Headers & Scoping

Client frontends must pass the `x-site-id` header in all requests, or specify the `siteId` parameter in the query string.

| Header | Description | Example |
|---|---|---|
| `x-site-id` | Scopes data queries and mutations to the specified tenant ID | `site_alpha_test_123` |
| `Content-Type` | Set to `application/json` for all payloads | `application/json` |

---

## Public Content APIs

Public routes do not require admin authentication. They read tenant ID from `siteId` query parameter or `x-site-id` header.

### 1. Retrieve Page & Sections
- **Endpoint:** `GET /api/content?slug=[pageSlug]`
- **Response:**
  ```json
  {
    "page": {
      "id": "page_id_1",
      "title": "Home",
      "slug": "/",
      "status": "PUBLISHED",
      "seoTitle": "Home SEO Title",
      "seoDescription": "SEO description text"
    },
    "sections": [
      {
        "id": "section_1",
        "type": "HERO",
        "order": 0,
        "content": {
          "title": "Welcome to our site",
          "subtitle": "Subtitle text",
          "imageUrl": "https://res.cloudinary.com/..."
        }
      }
    ],
    "seo": {
      "title": "Home SEO Title",
      "description": "SEO description text"
    }
  }
  ```

### 2. Submit Contact Form
- **Endpoint:** `POST /api/forms/submit`
- **Request Body:**
  ```json
  {
    "siteId": "site_alpha_test_123",
    "name": "Alice Smith",
    "email": "alice@example.com",
    "phone": "+1234567890",
    "message": "Interested in pricing info."
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Form submitted successfully",
    "submissionId": "sub_id_1",
    "leadId": "lead_id_1"
  }
  ```

### 3. Track Live Visitors (Ping)
- **Endpoint:** `POST /api/visitors/ping`
- **Request Body:**
  ```json
  {
    "siteId": "site_alpha_test_123",
    "visitorId": "cookie_visitor_token_123",
    "pageViewed": "/about",
    "location": "US",
    "deviceInfo": "Mobile - Chrome",
    "trafficSource": "Google Search"
  }
  ```

### 4. Fetch Testimonials
- **Endpoint:** `GET /api/testimonials`
- **Response:**
  ```json
  {
    "success": true,
    "testimonials": [
      { "id": "t1", "clientName": "John Doe", "content": "Awesome!", "rating": 5 }
    ]
  }
  ```

### 5. Fetch FAQs
- **Endpoint:** `GET /api/faq?page=[slug]`
- **Response:**
  ```json
  {
    "success": true,
    "faqs": [
      { "id": "faq1", "question": "What is the return policy?", "answer": "30 days." }
    ]
  }
  ```

### 6. Fetch Legal Pages
- **Endpoint:** `GET /api/legal/[type]` (Types: `privacy`, `terms`, `cookie`, `disclaimer`, `refund`)
- **Response:**
  ```json
  {
    "success": true,
    "legalPage": { "title": "Privacy Policy", "content": "Full text..." }
  }
  ```

---

## Admin Management APIs

Admin routes require admin authentication sessions. In development environments (`NODE_ENV === "development"`), the system defaults authorization check to the first available user in the database to allow local testing.

### 7. Manage Contact Details
- **Endpoint:** `PUT /api/admin/contact/details`
- **Request Body:**
  ```json
  {
    "phone": "+1999999",
    "email": "admin@site.com",
    "address": "123 Main St",
    "whatsapp": "https://wa.me/...",
    "businessHours": { "mon-fri": "9am-5pm" }
  }
  ```

### 8. Leads CRM Management
- **List Leads:** `GET /api/admin/leads?status=[new|contacted|qualified|closed]`
- **Update Lead Status:** `PUT /api/admin/leads/[id]`
- **Spreadsheet Export:** `GET /api/admin/leads/export` (Returns `text/csv` file)

### 9. DB Backup & Restore
- **Trigger Backup:** `POST /api/admin/backup/database` (Returns full site schema dump JSON)
- **Atomically Restore Backup:** `POST /api/admin/backup/restore`
  - **Request Body:** `{ "backup": { ... } }`

### 10. Site Health Checks
- **Endpoint:** `GET /api/admin/performance/site-health`
- **Response:**
  ```json
  {
    "success": true,
    "status": "healthy",
    "checks": {
      "database": { "status": "Connected", "latency": "12ms" },
      "cloudinary": { "status": "Configured" }
    },
    "responseTime": "15ms"
  }
  ```

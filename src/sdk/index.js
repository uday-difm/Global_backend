/**
 * Global Backend CMS Client SDK
 * Lightweight wrapper around fetch to fetch tenant-scoped resources.
 *
 * Usage:
 *   // Option A: API Key (recommended for new integrations)
 *   const cms = createCMS({ endpoint: "https://...", apiKey: "gkey_abc123" });
 *
 *   // Option B: Legacy constructor
 *   const cms = new CMSClient({ baseUrl: "https://...", siteId: "my_site" });
 */
export class CMSClient {
  /**
   * @param {object} options
   * @param {string} options.baseUrl  - CMS base URL
   * @param {string} [options.siteId] - Site ID (required if no apiKey)
   * @param {string} [options.apiKey] - API key (carries siteId internally)
   */
  constructor({ baseUrl, siteId, apiKey }) {
    if (!baseUrl) throw new Error("baseUrl is required");
    if (!siteId && !apiKey) throw new Error("siteId or apiKey is required");

    this.baseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
    this.siteId = siteId || null;
    this.apiKey = apiKey || null;
  }

  async _request(path, method = "GET", body = null, _retries = 2) {
    // Build URL — include siteId only if not using API key (key carries the site context)
    const siteParam = this.siteId
      ? `${path.includes("?") ? "&" : "?"}siteId=${encodeURIComponent(this.siteId)}`
      : "";
    const url = `${this.baseUrl}${path}${siteParam}`;

    const headers = {
      "Content-Type": "application/json",
      // Prevent stale keep-alive sockets causing ECONNRESET on server-to-server
      // fetches (common in local Next.js SSR → localhost backend setups).
      "Connection": "close",
    };
    if (this.siteId) headers["x-site-id"] = this.siteId;
    if (this.apiKey) headers["x-api-key"] = this.apiKey;

    const options = { method, headers, cache: "no-store" };

    if (body && (method === "POST" || method === "PUT" || method === "PATCH")) {
      options.body = JSON.stringify(body);
    }

    let res;
    try {
      res = await fetch(url, options);
    } catch (networkErr) {
      // Retry on transient network errors (ECONNRESET, ECONNREFUSED, etc.)
      const isTransient =
        networkErr?.cause?.code === "ECONNRESET" ||
        networkErr?.cause?.code === "ECONNREFUSED" ||
        networkErr?.cause?.code === "ETIMEDOUT" ||
        networkErr?.message?.includes("fetch failed");

      if (isTransient && _retries > 0) {
        // Brief back-off before retrying
        await new Promise((resolve) => setTimeout(resolve, 150));
        return this._request(path, method, body, _retries - 1);
      }
      throw networkErr;
    }

    const result = await res.json();

    if (!res.ok) {
      const msg =
        result.error || result.message || `HTTP error! status: ${res.status}`;
      const err = new Error(msg);
      err.code = result.code || "API_ERROR";
      err.status = res.status;
      err.details = result.details || null;
      throw err;
    }

    // Auto-unwrap the standard { data, meta, error } envelope.
    // Falls back gracefully for any endpoint not yet migrated.
    if (
      result &&
      typeof result === "object" &&
      "data" in result &&
      "error" in result
    ) {
      return result.data;
    }
    return result;
  }

  // --- Page Management ---
  async getPage(slug, preview = false) {
    return this._request(
      `/api/content?slug=${encodeURIComponent(slug)}&preview=${preview}`,
    );
  }

  // --- Services ---
  async getServices() {
    return this._request("/api/services");
  }

  // --- Blog / Posts ---
  async getPosts() {
    return this._request("/api/posts");
  }

  async getPost(postId) {
    return this._request(`/api/posts/${postId}`);
  }

  // --- Testimonials ---
  async getTestimonials() {
    return this._request("/api/testimonials");
  }

  // --- FAQs ---
  async getFaqs(pageSlug = null) {
    const path = pageSlug
      ? `/api/faq?page=${encodeURIComponent(pageSlug)}`
      : "/api/faq";
    return this._request(path);
  }

  // --- Team Members ---
  async getTeamMembers() {
    return this._request("/api/team");
  }

  // --- Legal Pages ---
  async getLegalPage(type) {
    return this._request(`/api/legal/${encodeURIComponent(type)}`);
  }

  // --- Contact Details ---
  async getContactDetails() {
    return this._request("/api/contact/details");
  }

  // --- Website Settings ---
  async getSettings() {
    return this._request("/api/settings");
  }

  // --- Menus & Navigation ---
  async getNavigation(menuType = "main") {
    return this._request(`/api/navigation/${encodeURIComponent(menuType)}`);
  }

  // --- CTA Layout ---
  async getCtaConfig() {
    return this._request("/api/cta");
  }

  // --- Header / Footer Builder ---
  async getHeaderLayout() {
    return this._request("/api/header");
  }

  async getFooterLayout() {
    return this._request("/api/footer");
  }

  // --- Forms & Leads ---
  async submitContactForm({ name, email, phone, message }) {
    return this._request("/api/forms/submit", "POST", {
      siteId: this.siteId,
      name,
      email,
      phone,
      message,
    });
  }

  // --- Visitor Tracker ---
  async pingVisitor({
    visitorId,
    pageViewed,
    location,
    deviceInfo,
    trafficSource,
    duration,
  }) {
    return this._request("/api/visitors/ping", "POST", {
      siteId: this.siteId,
      visitorId,
      pageViewed,
      location,
      deviceInfo,
      trafficSource,
      duration,
    });
  }

  // --- Compliance Consent ---
  async recordConsent({ visitorId, consentType, accepted }) {
    return this._request("/api/compliance/consent", "POST", {
      siteId: this.siteId,
      visitorId,
      consentType,
      accepted,
    });
  }

  async getComplianceConfig() {
    return this._request("/api/compliance/config");
  }

  // --- SEO Metadata ---
  async getSeoMetadata(pageSlug) {
    return this._request(`/api/seo/${encodeURIComponent(pageSlug)}`);
  }

  // --- Centralized Global Settings & Unified Layouts ---
  async getGlobalSettings() {
    return this._request("/api/global-settings");
  }

  // --- Dynamic XML Sitemap ---
  async getSitemap(domain = null) {
    const items = await this._request("/api/sitemap");
    if (!domain) return items;
    const cleanDomain = domain.endsWith("/") ? domain.slice(0, -1) : domain;
    return items.map((item) => ({
      ...item,
      url: item.url.startsWith("http")
        ? item.url
        : `${cleanDomain}${item.url.startsWith("/") ? "" : "/"}${item.url}`,
    }));
  }

  // --- Next.js Sync Manifest ---
  async syncRoutes(routes, integrationKey) {
    const url = `${this.baseUrl}/api/integrations/next-sync/manifest`;
    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-integration-key": integrationKey,
      },
      body: JSON.stringify({
        siteId: this.siteId,
        source: "client-sync-script",
        generatedAt: new Date().toISOString(),
        routes,
      }),
    };

    const res = await fetch(url, options);
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.error || `HTTP error! status: ${res.status}`);
    }
    return result;
  }

  // --- Robots.txt configuration ---
  async getRobotsTxt() {
    const url = `${this.baseUrl}/api/seo/robots?siteId=${encodeURIComponent(this.siteId)}`;
    const options = {
      method: "GET",
      headers: {
        "x-site-id": this.siteId,
      },
      cache: "no-store",
    };
    const res = await fetch(url, options);
    if (!res.ok) {
      return "User-agent: *\nAllow: /";
    }
    return res.text();
  }
}

/**
 * Factory function — recommended entry point for new integrations.
 *
 * @param {object} options
 * @param {string} options.endpoint  - CMS base URL (e.g. "https://cms.example.com")
 * @param {string} [options.apiKey]  - API key from the Dev Tools panel
 * @param {string} [options.siteId]  - Site ID (use this OR apiKey, not both)
 * @returns {CMSClient}
 *
 * @example
 *   import { createCMS } from "@yourcompany/cms-sdk";
 *   const cms = createCMS({ endpoint: process.env.CMS_URL, apiKey: process.env.CMS_API_KEY });
 *   const posts = await cms.getPosts();
 */
export function createCMS({ endpoint, apiKey, siteId } = {}) {
  if (!endpoint) throw new Error("createCMS: endpoint is required");
  return new CMSClient({ baseUrl: endpoint, siteId, apiKey });
}

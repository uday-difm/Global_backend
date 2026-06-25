/**
 * Global Backend CMS Client SDK
 * Lightweight wrapper around fetch to fetch tenant-scoped resources.
 */
export class CMSClient {
  constructor({ baseUrl, siteId }) {
    if (!baseUrl) throw new Error("baseUrl is required");
    if (!siteId) throw new Error("siteId is required");

    this.baseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
    this.siteId = siteId;
  }

  async _request(path, method = "GET", body = null) {
    const url = `${this.baseUrl}${path}${path.includes("?") ? "&" : "?"}siteId=${encodeURIComponent(this.siteId)}`;
    const options = {
      method,
      headers: {
        "Content-Type": "application/json",
        "x-site-id": this.siteId,
      },
      cache: "no-store",
    };

    if (body && (method === "POST" || method === "PUT" || method === "PATCH")) {
      options.body = JSON.stringify(body);
    }

    const res = await fetch(url, options);
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.error || `HTTP error! status: ${res.status}`);
    }
    return result;
  }

  // --- Page Management ---
  async getPage(slug) {
    return this._request(`/api/content?slug=${encodeURIComponent(slug)}`);
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
  }) {
    return this._request("/api/visitors/ping", "POST", {
      siteId: this.siteId,
      visitorId,
      pageViewed,
      location,
      deviceInfo,
      trafficSource,
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
}

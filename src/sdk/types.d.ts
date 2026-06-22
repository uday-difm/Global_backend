export interface CMSClientOptions {
  baseUrl: string;
  siteId: string;
}

export interface RouteSyncPayload {
  slug: string;
  path: string;
  type?: "static" | "dynamic";
  title?: string;
}

export class CMSClient {
  constructor(options: CMSClientOptions);

  protected _request<T = any>(path: string, method?: string, body?: any): Promise<T>;

  // --- Page Management ---
  getPage(slug: string): Promise<any>;

  // --- Services ---
  getServices(): Promise<any>;

  // --- Blog / Posts ---
  getPosts(): Promise<any>;
  getPost(postId: string): Promise<any>;

  // --- Testimonials ---
  getTestimonials(): Promise<any>;

  // --- FAQs ---
  getFaqs(pageSlug?: string | null): Promise<any>;

  // --- Team Members ---
  getTeamMembers(): Promise<any>;

  // --- Legal Pages ---
  getLegalPage(type: string): Promise<any>;

  // --- Contact Details ---
  getContactDetails(): Promise<any>;

  // --- Website Settings ---
  getSettings(): Promise<any>;

  // --- Menus & Navigation ---
  getNavigation(menuType?: string): Promise<any>;

  // --- CTA Layout ---
  getCtaConfig(): Promise<any>;

  // --- Header / Footer Builder ---
  getHeaderLayout(): Promise<any>;
  getFooterLayout(): Promise<any>;

  // --- Forms & Leads ---
  submitContactForm(data: {
    name: string;
    email: string;
    phone?: string;
    message: string;
  }): Promise<any>;

  // --- Visitor Tracker ---
  pingVisitor(data: {
    visitorId: string;
    pageViewed: string;
    location?: string;
    deviceInfo?: string;
    trafficSource?: string;
  }): Promise<any>;

  // --- Compliance Consent ---
  recordConsent(data: {
    visitorId: string;
    consentType: string;
    accepted: boolean;
  }): Promise<any>;
  getComplianceConfig(): Promise<any>;

  // --- SEO Metadata ---
  getSeoMetadata(pageSlug: string): Promise<any>;

  // --- Centralized Global Settings & Unified Layouts ---
  getGlobalSettings(): Promise<any>;

  // --- Dynamic XML Sitemap ---
  getSitemap(): Promise<any>;

  // --- Next.js Sync Manifest ---
  syncRoutes(routes: RouteSyncPayload[], integrationKey: string): Promise<any>;
}
export default CMSClient;

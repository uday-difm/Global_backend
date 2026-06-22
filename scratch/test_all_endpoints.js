require("dotenv").config();
const http = require("http");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL
});
const prisma = new PrismaClient({
  adapter
});

const BASE_URL = "http://localhost:3000";
const SITE_A = "site_alpha_test_123";
const SITE_B = "site_beta_test_456";

async function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method: method.toUpperCase(),
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        "Content-Type": "application/json",
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data, headers: res.headers });
        }
      });
    });

    req.on("error", (e) => reject(e));

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log("=== STARTING API ENPOINTS VERIFICATION ===");
  let failures = 0;

  const assert = (condition, message) => {
    if (condition) {
      console.log(`[PASS] ${message}`);
    } else {
      console.error(`[FAIL] ${message}`);
      failures++;
    }
  };

  try {
    // 1. Seed database with test sites and user role mappings
    console.log("Setting up DB test sites & user role mappings...");
    const firstUser = await prisma.user.findFirst();
    if (!firstUser) {
      throw new Error("No users found in database to run tests with.");
    }

    await prisma.site.upsert({
      where: { id: SITE_A },
      update: { name: "Site Alpha Test", isActive: true },
      create: { id: SITE_A, name: "Site Alpha Test", isActive: true }
    });

    await prisma.site.upsert({
      where: { id: SITE_B },
      update: { name: "Site Beta Test", isActive: true },
      create: { id: SITE_B, name: "Site Beta Test", isActive: true }
    });

    await prisma.siteUser.upsert({
      where: { siteId_userId: { siteId: SITE_A, userId: firstUser.id } },
      update: { role: "ADMIN" },
      create: { siteId: SITE_A, userId: firstUser.id, role: "ADMIN" }
    });

    await prisma.siteUser.upsert({
      where: { siteId_userId: { siteId: SITE_B, userId: firstUser.id } },
      update: { role: "ADMIN" },
      create: { siteId: SITE_B, userId: firstUser.id, role: "ADMIN" }
    });

    // 2. Contact Details
    console.log("\nTesting Contact Details...");
    const contactData = { phone: "123456", email: "test@example.com", social: ["fb", "tw"] };
    const putContact = await request("PUT", "/api/admin/contact/details", contactData, { "x-site-id": SITE_A });
    assert(putContact.status === 200 && putContact.data.success, "PUT /api/admin/contact/details site A success");

    const getContactA = await request("GET", `/api/contact/details?siteId=${SITE_A}`);
    assert(getContactA.status === 200 && getContactA.data.contactDetails.phone === "123456", "GET /api/contact/details site A matches input");

    // Multi-site isolation check: Site B contact details should be null
    const getContactB = await request("GET", `/api/contact/details?siteId=${SITE_B}`);
    assert(getContactB.status === 200 && !getContactB.data.contactDetails, "GET /api/contact/details site B is isolated (null)");

    // 3. Form Submissions & Leads
    console.log("\nTesting Forms & Submissions...");
    const submissionBody = { siteId: SITE_A, name: "Alice", email: "alice@test.com", message: "Hello Site A" };
    const submitForm = await request("POST", "/api/forms/submit", submissionBody);
    assert(submitForm.status === 200 && submitForm.data.success, "POST /api/forms/submit success");

    const getSubmissions = await request("GET", "/api/admin/forms/submissions", null, { "x-site-id": SITE_A });
    assert(getSubmissions.status === 200 && getSubmissions.data.submissions.length > 0, "GET /api/admin/forms/submissions lists entries");
    const subId = getSubmissions.data.submissions[0].id;

    // Update Submission
    const updateSub = await request("PUT", `/api/admin/forms/submissions/${subId}`, { status: "read", notes: "Reviewed" }, { "x-site-id": SITE_A });
    assert(updateSub.status === 200 && updateSub.data.submission.status === "read", "PUT /api/admin/forms/submissions/[id] updates status");

    // Leads CRM
    console.log("\nTesting Leads CRM...");
    const getLeads = await request("GET", "/api/admin/leads", null, { "x-site-id": SITE_A });
    assert(getLeads.status === 200 && getLeads.data.leads.length > 0, "GET /api/admin/leads gets lead entries");
    const leadId = getLeads.data.leads[0].id;

    const updateLead = await request("PUT", `/api/admin/leads/${leadId}`, { status: "qualified", notes: "Good lead" }, { "x-site-id": SITE_A });
    assert(updateLead.status === 200 && updateLead.data.lead.status === "qualified", "PUT /api/admin/leads/[id] updates lead status");

    // CSV Exports
    const exportSub = await request("GET", "/api/admin/forms/export", null, { "x-site-id": SITE_A });
    assert(exportSub.status === 200 && exportSub.headers["content-type"].includes("text/csv"), "GET /api/admin/forms/export returns CSV file");

    const exportLeads = await request("GET", "/api/admin/leads/export", null, { "x-site-id": SITE_A });
    assert(exportLeads.status === 200 && exportLeads.headers["content-type"].includes("text/csv"), "GET /api/admin/leads/export returns CSV file");

    // 4. CTA configs
    console.log("\nTesting CTA Toggles...");
    const ctaBody = { ctaConfig: { main: { text: "Click Here", link: "/apply" } } };
    const putCta = await request("PUT", "/api/admin/cta", ctaBody, { "x-site-id": SITE_A });
    assert(putCta.status === 200 && putCta.data.success, "PUT /api/admin/cta success");

    const getCta = await request("GET", `/api/cta?siteId=${SITE_A}`);
    assert(getCta.status === 200 && getCta.data.ctaConfig?.main?.text === "Click Here", "GET /api/cta retrieves config");

    // 5. Analytics
    console.log("\nTesting Analytics Config...");
    const analyticsBody = { googleAnalyticsId: "G-12345", clarityId: "clarity-123" };
    const putAnalytics = await request("PUT", "/api/admin/analytics/config", analyticsBody, { "x-site-id": SITE_A });
    assert(putAnalytics.status === 200 && putAnalytics.data.success, "PUT /api/admin/analytics/config success");

    const getAnalytics = await request("GET", `/api/analytics/config?siteId=${SITE_A}`);
    assert(getAnalytics.status === 200 && getAnalytics.data.analytics.googleAnalyticsId === "G-12345", "GET /api/analytics/config retrieves configs");

    // 6. Visitor log ping and live visitors count
    console.log("\nTesting Visitor Tracker...");
    const pingBody = { siteId: SITE_A, visitorId: "visitor_x_1", pageViewed: "home", location: "US", deviceInfo: "Desktop" };
    const ping = await request("POST", "/api/visitors/ping", pingBody);
    assert(ping.status === 200 && ping.data.success, "POST /api/visitors/ping success");

    const getLive = await request("GET", "/api/admin/visitors/live", null, { "x-site-id": SITE_A });
    assert(getLive.status === 200 && getLive.data.liveCount > 0, "GET /api/admin/visitors/live shows active visitors");

    const getLogs = await request("GET", "/api/admin/visitors/logs", null, { "x-site-id": SITE_A });
    assert(getLogs.status === 200 && getLogs.data.logs.length > 0, "GET /api/admin/visitors/logs returns traffic pings");

    // 7. Testimonials
    console.log("\nTesting Testimonials CRUD...");
    const testBody = { clientName: "John Doe", content: "Great service!", rating: 5, sortOrder: 1 };
    const createTestimonial = await request("POST", "/api/admin/testimonials", testBody, { "x-site-id": SITE_A });
    assert(createTestimonial.status === 201 && createTestimonial.data.success, "POST /api/admin/testimonials creates entry");
    const testId = createTestimonial.data.testimonial.id;

    const getPublicTestimonials = await request("GET", `/api/testimonials?siteId=${SITE_A}`);
    assert(getPublicTestimonials.status === 200 && getPublicTestimonials.data.testimonials.length > 0, "GET /api/testimonials returns active entries");

    const deleteTestimonial = await request("DELETE", `/api/admin/testimonials/${testId}`, null, { "x-site-id": SITE_A });
    assert(deleteTestimonial.status === 200 && deleteTestimonial.data.success, "DELETE /api/admin/testimonials/[id] removes entry");

    // 8. FAQs
    console.log("\nTesting FAQs CRUD...");
    const faqBody = { question: "Is this free?", answer: "Yes in development.", sortOrder: 2, showHide: true };
    const createFaq = await request("POST", "/api/admin/faq", faqBody, { "x-site-id": SITE_A });
    assert(createFaq.status === 201 && createFaq.data.success, "POST /api/admin/faq creates entry");
    const faqId = createFaq.data.faq.id;

    const getPublicFaq = await request("GET", `/api/faq?siteId=${SITE_A}`);
    assert(getPublicFaq.status === 200 && getPublicFaq.data.faqs.length > 0, "GET /api/faq returns active entries");

    const deleteFaq = await request("DELETE", `/api/admin/faq/${faqId}`, null, { "x-site-id": SITE_A });
    assert(deleteFaq.status === 200 && deleteFaq.data.success, "DELETE /api/admin/faq/[id] removes entry");

    // 9. Team members
    console.log("\nTesting Team Section CRUD...");
    const teamBody = { name: "Bob Smith", role: "Developer", sortOrder: 1 };
    const createTeam = await request("POST", "/api/admin/team", teamBody, { "x-site-id": SITE_A });
    assert(createTeam.status === 201 && createTeam.data.success, "POST /api/admin/team creates team member");
    const teamId = createTeam.data.teamMember.id;

    const getPublicTeam = await request("GET", `/api/team?siteId=${SITE_A}`);
    assert(getPublicTeam.status === 200 && getPublicTeam.data.teamMembers.length > 0, "GET /api/team returns team members");

    const deleteTeam = await request("DELETE", `/api/admin/team/${teamId}`, null, { "x-site-id": SITE_A });
    assert(deleteTeam.status === 200 && deleteTeam.data.success, "DELETE /api/admin/team/[id] removes team member");

    // 10. Legal Pages
    console.log("\nTesting Legal Pages...");
    const legalBody = { title: "Privacy Policy", content: "We protect your data." };
    const putLegal = await request("PUT", "/api/admin/legal/privacy", legalBody, { "x-site-id": SITE_A });
    assert(putLegal.status === 200 && putLegal.data.success, "PUT /api/admin/legal/privacy updates content");

    const getLegal = await request("GET", `/api/legal/privacy?siteId=${SITE_A}`);
    assert(getLegal.status === 200 && getLegal.data.legalPage.title === "Privacy Policy", "GET /api/legal/privacy retrieves content");

    // 11. Settings & Navigation
    console.log("\nTesting Website settings & Navigation...");
    const siteSettings = { logoUrl: "/logo.png", primaryColor: "#000" };
    const putSettings = await request("PUT", "/api/admin/settings", siteSettings, { "x-site-id": SITE_A });
    assert(putSettings.status === 200 && putSettings.data.success, "PUT /api/admin/settings updates settings");

    const getSettings = await request("GET", `/api/settings?siteId=${SITE_A}`);
    assert(getSettings.status === 200 && getSettings.data.websiteSettings.logoUrl === "/logo.png", "GET /api/settings retrieves settings");

    const menuItems = [{ label: "Home", href: "/" }, { label: "Services", href: "/services" }];
    const putNav = await request("PUT", "/api/admin/navigation/main", menuItems, { "x-site-id": SITE_A });
    assert(putNav.status === 200 && putNav.data.success, "PUT /api/admin/navigation/main updates menu structure");

    const getNav = await request("GET", `/api/navigation/main?siteId=${SITE_A}`);
    assert(getNav.status === 200 && getNav.data.items[1].label === "Services", "GET /api/navigation/main retrieves menu items");

    // 12. Security configs
    console.log("\nTesting Security configs...");
    const secConfig = { recaptchaSiteKey: "key_site", rateLimitRps: 10 };
    const putSec = await request("PUT", "/api/admin/security/config", secConfig, { "x-site-id": SITE_A });
    assert(putSec.status === 200 && putSec.data.success, "PUT /api/admin/security/config updates settings");

    // 13. Dev / Admin tools
    console.log("\nTesting Dev/Admin keys...");
    const makeKey = await request("POST", "/api/admin/dev/keys", { name: "Local Sync integration" }, { "x-site-id": SITE_A });
    assert(makeKey.status === 201 && makeKey.data.success, "POST /api/admin/dev/keys creates secure API key");
    const apiKeyId = makeKey.data.apiKey.id;

    const getKeys = await request("GET", "/api/admin/dev/keys", null, { "x-site-id": SITE_A });
    assert(getKeys.status === 200 && getKeys.data.apiKeys.length > 0, "GET /api/admin/dev/keys lists API keys");

    const deleteKey = await request("DELETE", `/api/admin/dev/keys?id=${apiKeyId}`, null, { "x-site-id": SITE_A });
    assert(deleteKey.status === 200 && deleteKey.data.success, "DELETE /api/admin/dev/keys revokes API key");

    const getEnv = await request("GET", "/api/admin/dev/env", null, { "x-site-id": SITE_A });
    assert(getEnv.status === 200 && getEnv.data.env.NODE_ENV !== undefined, "GET /api/admin/dev/env lists safe settings");

    // 14. Header / Footer layouts
    console.log("\nTesting Header / Footer Builder configs...");
    const headerLayout = { logoAlign: "left", sticky: true };
    const putHeader = await request("PUT", "/api/admin/header", headerLayout, { "x-site-id": SITE_A });
    assert(putHeader.status === 200 && putHeader.data.success, "PUT /api/admin/header updates header builder layout");

    const getHeader = await request("GET", `/api/header?siteId=${SITE_A}`);
    assert(getHeader.status === 200 && getHeader.data.header.logoAlign === "left", "GET /api/header retrieves config");

    // 15. Performance & health check
    console.log("\nTesting Site Health status...");
    const getHealth = await request("GET", "/api/admin/performance/site-health", null, { "x-site-id": SITE_A });
    assert(getHealth.status === 200 && getHealth.data.status === "healthy", "GET /api/admin/performance/site-health shows green");

    // 16. Backup and Restore integration test
    console.log("\nTesting Backup & Restore integration...");
    // 16a. Trigger database backup for SITE_A
    const backupDb = await request("POST", "/api/admin/backup/database", null, { "x-site-id": SITE_A });
    assert(backupDb.status === 200 && backupDb.data.success, "POST /api/admin/backup/database creates json backup");

    const backupPayload = backupDb.data.backup;
    assert(backupPayload.data.legalPages.length > 0, "Backup includes our legal page created in test");

    // 16b. Trigger database restore for SITE_A using the backup payload
    const restoreDb = await request("POST", "/api/admin/backup/restore", { backup: backupPayload }, { "x-site-id": SITE_A });
    assert(restoreDb.status === 200 && restoreDb.data.success, "POST /api/admin/backup/restore restores data atomically");

    // Verify data still exists after restore
    const getLegalAfterRestore = await request("GET", `/api/legal/privacy?siteId=${SITE_A}`);
    assert(getLegalAfterRestore.status === 200 && getLegalAfterRestore.data.legalPage.title === "Privacy Policy", "Verified restored data exists in database");

    // 17. Cleanup seeded test data
    console.log("\nCleaning up DB test sites & user role mappings...");
    await prisma.siteUser.deleteMany({ where: { siteId: { in: [SITE_A, SITE_B] } } });
    await prisma.site.deleteMany({ where: { id: { in: [SITE_A, SITE_B] } } });

  } catch (err) {
    console.error("Test execution encountered an error:", err);
    failures++;
  } finally {
    await prisma.$disconnect();
  }

  console.log(`\n=== VERIFICATION COMPLETED WITH ${failures} FAILURES ===`);
  process.exit(failures > 0 ? 1 : 0);
}

runTests();

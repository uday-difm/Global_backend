import { EventBus } from "./events";
import { emailService } from "@/services/email.service";
import { notificationService } from "@/services/notification.service";
import { webhookService } from "@/services/webhook.service";

console.log("🔔 Application event listeners initialized!");

// ---------------------------------------------------------------------------
// AUTH EVENTS
// ---------------------------------------------------------------------------
EventBus.on("auth.password_reset_requested", async ({ email, token }) => {
  try {
    await emailService.sendPasswordResetEmail(email, token);
  } catch (err) {
    console.error("Failed to send password reset email via listener:", err);
  }
});

// ---------------------------------------------------------------------------
// FORM / LEAD EVENTS
// ---------------------------------------------------------------------------
EventBus.on("contact_form.submitted", async ({ submission, lead, site }) => {
  try {
    await emailService.sendContactFormAlerts(submission, lead, site);
  } catch (err) {
    console.error("Failed to send contact form alerts via listener:", err);
  }
});

EventBus.on("lead.created", async ({ siteId, data }) => {
  try {
    await notificationService.notifyNewLead(siteId, data);
  } catch (err) {
    console.error("Failed to notify new lead:", err);
  }
});

EventBus.on("form.failed", async ({ siteId, data }) => {
  try {
    await notificationService.notifyFailedForm(siteId, data);
  } catch (err) {
    console.error("Failed to notify failed form submission:", err);
  }
});

// ---------------------------------------------------------------------------
// CONTENT EVENTS → Webhook Delivery (Automatic Website Synchronization)
// ---------------------------------------------------------------------------

/**
 * Helper: deliver a webhook event without blocking the main request.
 * Errors are caught and logged; they never propagate to the caller.
 */
async function deliverWebhook(siteId, eventType, data) {
  try {
    await webhookService.deliver(siteId, eventType, data);
  } catch (err) {
    console.error(`[Webhook Listener] Unhandled error for ${eventType}:`, err.message);
  }
}

// Pages
EventBus.on("page.created",  ({ siteId, data }) => deliverWebhook(siteId, "page.created",  data));
EventBus.on("page.updated",  ({ siteId, data }) => deliverWebhook(siteId, "page.updated",  data));
EventBus.on("page.deleted",  ({ siteId, data }) => deliverWebhook(siteId, "page.deleted",  data));

// Posts / Blog
EventBus.on("post.published", async ({ siteId, data }) => {
  try {
    await notificationService.notifyNewBlogPost(siteId, data);
  } catch (err) {
    console.error("Failed to notify new blog post:", err);
  }
  await deliverWebhook(siteId, "post.published", data);
});
EventBus.on("post.created", ({ siteId, data }) => deliverWebhook(siteId, "post.created", data));
EventBus.on("post.updated", ({ siteId, data }) => deliverWebhook(siteId, "post.updated", data));
EventBus.on("post.deleted", ({ siteId, data }) => deliverWebhook(siteId, "post.deleted", data));

// Services
EventBus.on("service.created", ({ siteId, data }) => deliverWebhook(siteId, "service.created", data));
EventBus.on("service.updated", ({ siteId, data }) => deliverWebhook(siteId, "service.updated", data));
EventBus.on("service.deleted", ({ siteId, data }) => deliverWebhook(siteId, "service.deleted", data));

// Global Settings (header, footer, navigation, branding, etc.)
EventBus.on("globalSettings.updated", ({ siteId, data }) => deliverWebhook(siteId, "global_settings.updated", data));

// Navigation / Menus
EventBus.on("navigation.updated", ({ siteId, data }) => deliverWebhook(siteId, "navigation.updated", data));

// Testimonials, FAQs, Team, Legal
EventBus.on("testimonial.created", ({ siteId, data }) => deliverWebhook(siteId, "testimonial.created", data));
EventBus.on("testimonial.updated", ({ siteId, data }) => deliverWebhook(siteId, "testimonial.updated", data));
EventBus.on("testimonial.deleted", ({ siteId, data }) => deliverWebhook(siteId, "testimonial.deleted", data));
EventBus.on("faq.created",        ({ siteId, data }) => deliverWebhook(siteId, "faq.created",         data));
EventBus.on("faq.updated",        ({ siteId, data }) => deliverWebhook(siteId, "faq.updated",         data));
EventBus.on("faq.deleted",        ({ siteId, data }) => deliverWebhook(siteId, "faq.deleted",         data));
EventBus.on("teamMember.created", ({ siteId, data }) => deliverWebhook(siteId, "team_member.created", data));
EventBus.on("teamMember.updated", ({ siteId, data }) => deliverWebhook(siteId, "team_member.updated", data));
EventBus.on("teamMember.deleted", ({ siteId, data }) => deliverWebhook(siteId, "team_member.deleted", data));
EventBus.on("legalPage.updated",  ({ siteId, data }) => deliverWebhook(siteId, "legal_page.updated",  data));

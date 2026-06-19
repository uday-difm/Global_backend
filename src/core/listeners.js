import { EventBus } from "./events";
import { emailService } from "@/services/email.service";
import { notificationService } from "@/services/notification.service";

console.log("🔔 Application event listeners initialized!");

EventBus.on("auth.password_reset_requested", async ({ email, token }) => {
  try {
    await emailService.sendPasswordResetEmail(email, token);
  } catch (err) {
    console.error("Failed to send password reset email via listener:", err);
  }
});

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

EventBus.on("post.published", async ({ siteId, data }) => {
  try {
    await notificationService.notifyNewBlogPost(siteId, data);
  } catch (err) {
    console.error("Failed to notify new blog post:", err);
  }
});

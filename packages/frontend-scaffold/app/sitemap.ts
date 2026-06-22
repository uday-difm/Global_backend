import { MetadataRoute } from "next";
import { GlobalBackendClient } from "@globalbackend/next";

const baseUrl = process.env.NEXT_PUBLIC_CMS_BASE_URL || "http://localhost:3000";
const siteId = process.env.NEXT_PUBLIC_SITE_ID || "";

const cms = new GlobalBackendClient({
  baseUrl,
  siteId,
});

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    if (!siteId) return [];

    // Retrieve global settings to get site domain prefix
    const settings = await cms.getGlobalSettings();
    const domain = settings?.websiteSettings?.domain || "http://localhost:3000";

    // Retrieve sitemap elements from Global Backend CMS
    const items = await cms.getSitemap(domain);

    return items.map((item: any) => ({
      url: item.url,
      lastModified: item.lastModified ? new Date(item.lastModified) : new Date(),
      changeFrequency: item.changeFreq || "weekly",
      priority: item.priority || 0.7,
    }));
  } catch (error) {
    console.error("Failed to generate sitemap:", error);
    return [];
  }
}
export const dynamic = "force-dynamic";
export const revalidate = 3600; // Cache sitemap for 1 hour

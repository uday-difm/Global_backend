import React from "react";
import { GlobalBackendClient } from "@globalbackend/next";
import { Header, Footer, GlobalAnalytics } from "@globalbackend/next/components";

const baseUrl = process.env.NEXT_PUBLIC_CMS_BASE_URL || "http://localhost:3000";
const siteId = process.env.NEXT_PUBLIC_SITE_ID || "";

const cms = new GlobalBackendClient({
  baseUrl,
  siteId,
});

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let globalSettings: any = null;
  
  try {
    if (siteId) {
      globalSettings = await cms.getGlobalSettings();
    }
  } catch (error) {
    console.error("Failed to load CMS global settings:", error);
  }

  // Extract variables with fallback configurations
  const siteName = globalSettings?.websiteSettings?.siteName || "Global Backend Demo";
  const logoUrl = globalSettings?.websiteSettings?.logoUrl || "";
  const headerSettings = globalSettings?.websiteSettings?.headerSettings || {};
  const footerSettings = globalSettings?.websiteSettings?.footerSettings || {};
  const navigationLinks = globalSettings?.navigation?.main || [];

  return (
    <html lang="en">
      <head>
        {globalSettings?.websiteSettings && (
          <GlobalAnalytics settings={globalSettings.websiteSettings} />
        )}
      </head>
      <body style={{ margin: 0, fontFamily: "system-ui, -apple-system, sans-serif", backgroundColor: "#f8fafc", color: "#0f172a" }}>
        <Header 
          logoUrl={logoUrl} 
          siteName={siteName} 
          headerSettings={headerSettings} 
          navigationLinks={navigationLinks} 
        />
        <main style={{ minHeight: "80vh" }}>
          {children}
        </main>
        <Footer 
          siteName={siteName} 
          footerSettings={footerSettings} 
          navigationLinks={navigationLinks} 
        />
      </body>
    </html>
  );
}
export const dynamic = "force-dynamic";
export const revalidate = 60; // ISR cache settings

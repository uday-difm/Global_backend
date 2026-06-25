import React from "react";
import Script from "next/script";
import DOMPurify from "isomorphic-dompurify";
/**
 * GlobalAnalytics Component
 * Injects Google Analytics, Microsoft Clarity, Facebook Pixel, LinkedIn Insight Tag, 
 * Google Tag Manager, and custom scripts dynamically from Global Settings.
 */
export function GlobalAnalytics({ settings }) {
  if (!settings) return null;

  const analytics = settings.analytics || {};
  const scripts = settings.scripts || {};

  return (
    <>
      {/* Raw HTML Head Scripts Injection */}
      {scripts.head && (
        <span
          style={{ display: "none" }}
          dangerouslySetInnerHTML={{
            __html: `<!-- Head Scripts -->\n${scripts.head}`,
          }}
        />
      )}

      {/* Google Search Console verification */}
      {analytics.searchConsoleId && (
        <meta name="google-site-verification" content={analytics.searchConsoleId} />
      )}

      {/* Google Tag Manager */}
      {analytics.googleTagManagerId && (
        <Script id="gtm-script" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','${analytics.googleTagManagerId}');`}
        </Script>
      )}

      {/* Google Analytics 4 */}
      {analytics.googleAnalyticsId && (
        <>
          <Script
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${analytics.googleAnalyticsId}`}
          />
          <Script id="ga4-script" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${analytics.googleAnalyticsId}');`}
          </Script>
        </>
      )}

      {/* Microsoft Clarity */}
      {analytics.clarityId && (
        <Script id="clarity-script" strategy="afterInteractive">
          {`(function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/v/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "${analytics.clarityId}");`}
        </Script>
      )}

      {/* Facebook Meta Pixel */}
      {analytics.metaPixelId && (
        <>
          <Script id="meta-pixel-script" strategy="afterInteractive">
            {`!function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${analytics.metaPixelId}');
            fbq('track', 'PageView');`}
          </Script>
          <noscript>
            <img
              height="1"
              width="1"
              style={{ display: "none" }}
              src={`https://www.facebook.com/tr?id=${analytics.metaPixelId}&ev=PageView&noscript=1`}
              alt=""
            />
          </noscript>
        </>
      )}

      {/* LinkedIn Insight Tag */}
      {analytics.linkedInTagId && (
        <>
          <Script id="linkedin-insight-script" strategy="afterInteractive">
            {`_linkedin_partner_id = "${analytics.linkedInTagId}";
            window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
            window._linkedin_data_partner_ids.push(_linkedin_partner_id);
            (function(l) {
            if (!l) {window._linkedin_data_partner_script_loaded = true;
            var d = document; var s = d.getElementsByTagName("script")[0];
            var b = d.createElement("script");
            b.type = "text/javascript";b.async = true;
            b.src = "https://snap.licdn.com/li.lms-analytics/insight.min.js";
            s.parentNode.insertBefore(b, s);}})(window._linkedin_data_partner_ids[0]);`}
          </Script>
          <noscript>
            <img
              height="1"
              width="1"
              style={{ display: "none" }}
              src={`https://px.ads.linkedin.com/collect/?pid=${analytics.linkedInTagId}&fmt=gif`}
              alt=""
            />
          </noscript>
        </>
      )}

      {/* Raw HTML Body Scripts Injection */}
      {scripts.body && (
        <span
          style={{ display: "none" }}
          dangerouslySetInnerHTML={{
            __html: `<!-- Body Scripts -->\n${scripts.body}`,
          }}
        />
      )}
    </>
  );
}

/**
 * Plug-and-Play Navigation Header Component
 */
export function Header({ logoUrl, siteName, headerSettings = {}, navigationLinks = [] }) {
  // Merge defaults
  const config = {
    layout: "logo-left",
    logoType: "image",
    logoText: siteName || "MySite",
    logoUrl: logoUrl || "/next.svg",
    logoWidth: 120,
    logoHeight: 40,
    sticky: true,
    transparent: false,
    paddingY: "medium",
    borderBottom: true,
    shadowSize: "small",
    ctaText: "",
    ctaLink: "",
    announcementBar: {
      enabled: false,
      text: "",
      link: "",
      bgColor: "#2563eb",
      textColor: "#ffffff"
    },
    ...headerSettings
  };

  const isSticky = config.sticky;
  const isTransparent = config.transparent;

  // Padding Y style values
  let paddingYVal = "1rem";
  if (config.paddingY === "small") paddingYVal = "0.5rem";
  if (config.paddingY === "large") paddingYVal = "1.5rem";

  // Shadow Size style values
  let shadowVal = "none";
  if (config.shadowSize === "small") shadowVal = "0 1px 2px 0 rgba(0, 0, 0, 0.05)";
  if (config.shadowSize === "medium") shadowVal = "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)";

  const headerStyle = {
    backgroundColor: isTransparent ? "transparent" : "#ffffff",
    borderBottom: config.borderBottom ? "1px solid #e2e8f0" : "none",
    width: "100%",
    zIndex: 50,
    position: isSticky ? "sticky" : "relative",
    top: 0,
    boxShadow: shadowVal,
    transition: "all 0.3s ease",
  };

  const navContainerStyle = {
    maxWidth: "80rem",
    margin: "0 auto",
    padding: `${paddingYVal} 1.5rem`,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "1rem",
    position: "relative",
  };

  const navLinksStyle = {
    display: "flex",
    gap: "1.5rem",
    fontSize: "0.85rem",
    fontWeight: 600,
    color: "#4a5568",
    alignItems: "center",
  };

  const renderLogo = () => {
    if (config.logoType === "text") {
      return (
        <span style={{ fontSize: "1.25rem", fontWeight: 800, color: "#1a202c" }}>
          {config.logoText}
        </span>
      );
    }
    return (
      <img
        src={config.logoUrl}
        alt="Logo"
        style={{
          width: config.logoWidth ? `${config.logoWidth}px` : "auto",
          height: config.logoHeight ? `${config.logoHeight}px` : "auto",
          objectFit: "contain",
        }}
      />
    );
  };

  let leftLinks = [];
  let rightLinks = [];
  if (config.layout === "logo-split") {
    const mid = Math.ceil(navigationLinks.length / 2);
    leftLinks = navigationLinks.slice(0, mid);
    rightLinks = navigationLinks.slice(mid);
  }

  const ctaBtnStyle = {
    padding: "0.5rem 1rem",
    backgroundColor: "#4f46e5",
    color: "#ffffff",
    borderRadius: "0.375rem",
    fontSize: "0.85rem",
    fontWeight: 600,
    textDecoration: "none",
    boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    display: "inline-block",
  };

  const announcementBarStyle = {
    backgroundColor: config.announcementBar?.bgColor || "#2563eb",
    color: config.announcementBar?.textColor || "#ffffff",
    padding: "0.5rem 1rem",
    textAlign: "center",
    fontSize: "0.75rem",
    fontWeight: 600,
    width: "100%",
    display: "block",
    textDecoration: "none",
  };

  const renderHeaderContent = () => {
    switch (config.layout) {
      case "logo-center":
        return (
          <>
            <nav style={navLinksStyle}>
              {navigationLinks.map((link, idx) => (
                <a key={idx} href={link.url} style={{ textDecoration: "none", color: "inherit" }}>
                  {link.label}
                </a>
              ))}
            </nav>
            <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)" }}>
              {renderLogo()}
            </div>
            <div>
              {config.ctaText && config.ctaLink && (
                <a href={config.ctaLink} style={ctaBtnStyle}>
                  {config.ctaText}
                </a>
              )}
            </div>
          </>
        );

      case "logo-split":
        return (
          <div style={{ display: "flex", width: "100%", alignItems: "center", justifyContent: "space-between" }}>
            <nav style={navLinksStyle}>
              {leftLinks.map((link, idx) => (
                <a key={idx} href={link.url} style={{ textDecoration: "none", color: "inherit" }}>
                  {link.label}
                </a>
              ))}
            </nav>
            <div>{renderLogo()}</div>
            <nav style={navLinksStyle}>
              {rightLinks.map((link, idx) => (
                <a key={idx} href={link.url} style={{ textDecoration: "none", color: "inherit" }}>
                  {link.label}
                </a>
              ))}
            </nav>
          </div>
        );

      case "logo-right":
        return (
          <>
            <div>
              {config.ctaText && config.ctaLink && (
                <a href={config.ctaLink} style={ctaBtnStyle}>
                  {config.ctaText}
                </a>
              )}
            </div>
            <nav style={navLinksStyle}>
              {navigationLinks.map((link, idx) => (
                <a key={idx} href={link.url} style={{ textDecoration: "none", color: "inherit" }}>
                  {link.label}
                </a>
              ))}
            </nav>
            <div>{renderLogo()}</div>
          </>
        );

      case "stacked":
        return (
          <div style={{ display: "flex", flexDirection: "column", width: "100%", alignItems: "center", gap: "1rem" }}>
            <div>{renderLogo()}</div>
            <div style={{ display: "flex", width: "100%", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f1f5f9", paddingTop: "0.75rem" }}>
              <nav style={navLinksStyle}>
                {navigationLinks.map((link, idx) => (
                  <a key={idx} href={link.url} style={{ textDecoration: "none", color: "inherit" }}>
                    {link.label}
                  </a>
                ))}
              </nav>
              <div>
                {config.ctaText && config.ctaLink && (
                  <a href={config.ctaLink} style={ctaBtnStyle}>
                    {config.ctaText}
                  </a>
                )}
              </div>
            </div>
          </div>
        );

      case "logo-left":
      default:
        return (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              {renderLogo()}
            </div>
            <nav style={navLinksStyle}>
              {navigationLinks.map((link, idx) => (
                <a key={idx} href={link.url} style={{ textDecoration: "none", color: "inherit" }}>
                  {link.label}
                </a>
              ))}
              {config.ctaText && config.ctaLink && (
                <a href={config.ctaLink} style={{ ...ctaBtnStyle, marginLeft: "1rem" }}>
                  {config.ctaText}
                </a>
              )}
            </nav>
          </>
        );
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
      {config.announcementBar?.enabled && config.announcementBar?.text && (
        <a href={config.announcementBar.link || "#"} style={announcementBarStyle}>
          {config.announcementBar.text}
        </a>
      )}
      <header style={headerStyle}>
        <div style={navContainerStyle}>
          {renderHeaderContent()}
        </div>
      </header>
    </div>
  );
}


/**
 * Plug-and-Play Footer Component
 */
export function Footer({ siteName, footerSettings = {}, navigationLinks = [] }) {
  const footerStyle = {
    backgroundColor: "#1a202c",
    color: "#a0aec0",
    padding: "3rem 1.5rem",
    borderTop: "1px solid #2d3748",
  };

  const footerContainerStyle = {
    maxWidth: "80rem",
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "2rem",
  };

  return (
    <footer style={footerStyle}>
      <div style={footerContainerStyle}>
        <div>
          <h4 style={{ color: "#ffffff", fontWeight: 700, margin: "0 0 1rem 0" }}>{siteName}</h4>
          <p style={{ fontSize: "0.75rem", lineHeight: "1.6" }}>
            High-performance modular pages served dynamically via backend integrations.
          </p>
        </div>
        <div>
          <h5 style={{ color: "#ffffff", fontWeight: 700, fontSize: "0.875rem", margin: "0 0 0.75rem 0" }}>Navigation</h5>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.75rem" }}>
            {navigationLinks.map((link, idx) => (
              <a key={idx} href={link.url} style={{ color: "inherit", textDecoration: "none" }}>
                {link.label}
              </a>
            ))}
          </div>
        </div>
        <div>
          <h5 style={{ color: "#ffffff", fontWeight: 700, fontSize: "0.875rem", margin: "0 0 0.75rem 0" }}>Connection</h5>
          <span style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.375rem",
            borderRadius: "9999px",
            backgroundColor: "#064e3b",
            padding: "0.25rem 0.625rem",
            fontSize: "0.7rem",
            fontWeight: 700,
            color: "#34d399",
            border: "1px solid #065f46"
          }}>
            CONNECTED
          </span>
        </div>
        <div>
          <h5 style={{ color: "#ffffff", fontWeight: 700, fontSize: "0.875rem", margin: "0 0 0.75rem 0" }}>Legal</h5>
          <p style={{ fontSize: "0.7rem", lineHeight: "1.5" }}>
            {footerSettings.copyright || `© ${new Date().getFullYear()} ${siteName}. All rights reserved.`}
          </p>
        </div>
      </div>
    </footer>
  );

}



// ... existing code (GlobalAnalytics, Header, Footer) ...

/**
 * RichTextRenderer Component
 * Takes raw HTML from the CMS (like BlockNote output), sanitizes it to prevent XSS,
 * and renders it beautifully using standard typography classes.
 */
export function RichTextRenderer({ content, className = "" }) {
  if (!content) return null;

  // 1. Ensure the content is a string
  const htmlString = typeof content === "string" ? content : String(content);

  // 2. Clean the HTML to ensure it's 100% secure
  const cleanHtml = DOMPurify.sanitize(htmlString);

  // 3. Render it
  return (
    <div
      className={`prose prose-slate prose-lg max-w-none space-y-4 ${className}`}
      dangerouslySetInnerHTML={{ __html: cleanHtml }}
    />
  );
}
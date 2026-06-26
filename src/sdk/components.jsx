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
        <meta
          name="google-site-verification"
          content={analytics.searchConsoleId}
        />
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
 * Helper SVG components
 */
function HamburgerIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: "block" }}
    >
      <line x1="4" x2="20" y1="12" y2="12" />
      <line x1="4" x2="20" y1="6" y2="6" />
      <line x1="4" x2="20" y1="18" y2="18" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: "block" }}
    >
      <line x1="18" x2="6" y1="6" y2="18" />
      <line x1="6" x2="18" y1="6" y2="18" />
    </svg>
  );
}

/**
 * Plug-and-Play Navigation Header Component
 */
export function Header({
  logoUrl,
  siteName,
  headerSettings = {},
  navigationLinks = [],
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

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
    bgColor: "#ffffff",
    textColor: "#4a5568",
    announcementBar: {
      enabled: false,
      text: "",
      link: "",
      bgColor: "#2563eb",
      textColor: "#ffffff",
    },
    mobileDrawerStyle: "slide-left",
    mobileDrawerBg: "#ffffff",
    mobileDrawerTextColor: "#1a202c",
    ...headerSettings,
  };

  const isSticky = config.sticky;
  const isTransparent = config.transparent;

  // Padding Y style values
  let paddingYVal = "1rem";
  if (config.paddingY === "small") paddingYVal = "0.5rem";
  if (config.paddingY === "large") paddingYVal = "1.5rem";

  // Shadow Size style values
  let shadowVal = "none";
  if (config.shadowSize === "small")
    shadowVal = "0 1px 2px 0 rgba(0, 0, 0, 0.05)";
  if (config.shadowSize === "medium")
    shadowVal =
      "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)";

  const headerStyle = {
    backgroundColor: isTransparent
      ? "transparent"
      : config.bgColor || "#ffffff",
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
    position: "relative",
  };

  const navLinksStyle = {
    display: "flex",
    gap: "1.5rem",
    fontSize: "0.85rem",
    fontWeight: 600,
    color: config.textColor || "#4a5568",
    alignItems: "center",
  };

  const renderLogo = () => {
    if (config.logoType === "text") {
      return (
        <span
          style={{
            fontSize: "1.25rem",
            fontWeight: 800,
            color: config.textColor || "#1a202c",
          }}
        >
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
            <nav style={navLinksStyle} className="sdk-desktop-only">
              {navigationLinks.map((link, idx) => (
                <a
                  key={idx}
                  href={link.url}
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  {link.label}
                </a>
              ))}
            </nav>
            <div
              style={{
                position: "absolute",
                left: "50%",
                transform: "translateX(-50%)",
              }}
            >
              {renderLogo()}
            </div>
            <div className="sdk-desktop-only">
              {config.ctaText && config.ctaLink && (
                <a href={config.ctaLink} style={ctaBtnStyle}>
                  {config.ctaText}
                </a>
              )}
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="sdk-hamburger-btn"
              aria-label="Open menu"
            >
              <HamburgerIcon />
            </button>
          </>
        );

      case "logo-split":
        return (
          <div
            style={{
              display: "flex",
              width: "100%",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <nav style={navLinksStyle} className="sdk-desktop-only">
              {leftLinks.map((link, idx) => (
                <a
                  key={idx}
                  href={link.url}
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  {link.label}
                </a>
              ))}
            </nav>
            <div>{renderLogo()}</div>
            <nav style={navLinksStyle} className="sdk-desktop-only">
              {rightLinks.map((link, idx) => (
                <a
                  key={idx}
                  href={link.url}
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  {link.label}
                </a>
              ))}
            </nav>
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="sdk-hamburger-btn"
              aria-label="Open menu"
            >
              <HamburgerIcon />
            </button>
          </div>
        );

      case "logo-right":
        return (
          <>
            <div className="sdk-desktop-only">
              {config.ctaText && config.ctaLink && (
                <a href={config.ctaLink} style={ctaBtnStyle}>
                  {config.ctaText}
                </a>
              )}
            </div>
            <nav style={navLinksStyle} className="sdk-desktop-only">
              {navigationLinks.map((link, idx) => (
                <a
                  key={idx}
                  href={link.url}
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  {link.label}
                </a>
              ))}
            </nav>
            <div>{renderLogo()}</div>
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="sdk-hamburger-btn"
              aria-label="Open menu"
            >
              <HamburgerIcon />
            </button>
          </>
        );

      case "stacked":
        return (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              width: "100%",
              alignItems: "center",
              gap: "1rem",
            }}
          >
            <div
              style={{
                display: "flex",
                width: "100%",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>{renderLogo()}</div>
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="sdk-hamburger-btn"
                aria-label="Open menu"
              >
                <HamburgerIcon />
              </button>
            </div>
            <div
              className="sdk-desktop-only"
              style={{
                display: "flex",
                width: "100%",
                justifyContent: "space-between",
                alignItems: "center",
                borderTop: "1px solid #f1f5f9",
                paddingTop: "0.75rem",
              }}
            >
              <nav style={navLinksStyle}>
                {navigationLinks.map((link, idx) => (
                  <a
                    key={idx}
                    href={link.url}
                    style={{ textDecoration: "none", color: "inherit" }}
                  >
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
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
            >
              {renderLogo()}
            </div>
            <nav style={navLinksStyle} className="sdk-desktop-only">
              {navigationLinks.map((link, idx) => (
                <a
                  key={idx}
                  href={link.url}
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  {link.label}
                </a>
              ))}
              {config.ctaText && config.ctaLink && (
                <a
                  href={config.ctaLink}
                  style={{ ...ctaBtnStyle, marginLeft: "1rem" }}
                >
                  {config.ctaText}
                </a>
              )}
            </nav>
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="sdk-hamburger-btn"
              aria-label="Open menu"
            >
              <HamburgerIcon />
            </button>
          </>
        );
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .sdk-desktop-only {
          display: flex !important;
        }
        .sdk-mobile-only {
          display: none !important;
        }
        @media (max-width: 768px) {
          .sdk-desktop-only {
            display: none !important;
          }
          .sdk-mobile-only {
            display: flex !important;
          }
        }

        .sdk-hamburger-btn {
          display: none;
          align-items: center;
          justify-content: center;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.5rem;
          color: ${config.textColor || "#4a5568"};
        }
        @media (max-width: 768px) {
          .sdk-hamburger-btn {
            display: flex;
          }
        }

        .sdk-drawer-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100vh;
          background-color: rgba(0, 0, 0, 0.4);
          z-index: 999;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.3s ease;
        }
        .sdk-drawer-overlay.open {
          opacity: 1;
          pointer-events: auto;
        }

        .sdk-drawer {
          position: fixed;
          top: 0;
          height: 100vh;
          width: 300px;
          max-width: 80%;
          background-color: ${config.mobileDrawerBg || "#ffffff"};
          color: ${config.mobileDrawerTextColor || "#1a202c"};
          z-index: 1000;
          box-shadow: -2px 0 10px rgba(0,0,0,0.1);
          padding: 2rem;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          transition: transform 0.3s ease, opacity 0.3s ease;
        }

        .sdk-drawer.style-slide-left {
          left: 0;
          transform: translateX(-100%);
        }
        .sdk-drawer.style-slide-left.open {
          transform: translateX(0);
        }

        .sdk-drawer.style-slide-right {
          right: 0;
          transform: translateX(100%);
        }
        .sdk-drawer.style-slide-right.open {
          transform: translateX(0);
        }

        .sdk-drawer.style-fade {
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%) scale(0.9);
          height: auto;
          max-height: 85vh;
          border-radius: 0.5rem;
          opacity: 0;
          pointer-events: none;
          box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        }
        .sdk-drawer.style-fade.open {
          opacity: 1;
          transform: translate(-50%, -50%) scale(1);
          pointer-events: auto;
        }

        .sdk-drawer-close {
          align-self: flex-end;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 1.5rem;
          color: inherit;
          padding: 0.5rem;
          line-height: 1;
        }

        .sdk-drawer-nav {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .sdk-drawer-link {
          text-decoration: none;
          color: inherit;
          font-size: 1.1rem;
          font-weight: 500;
          transition: opacity 0.2s;
        }
        .sdk-drawer-link:hover {
          opacity: 0.8;
        }
      `,
        }}
      />

      {config.announcementBar?.enabled && config.announcementBar?.text && (
        <a
          href={config.announcementBar.link || "#"}
          style={announcementBarStyle}
        >
          {config.announcementBar.text}
        </a>
      )}
      <header style={headerStyle}>
        <div style={navContainerStyle}>{renderHeaderContent()}</div>
      </header>

      {/* Mobile Drawer Overlay */}
      <div
        className={`sdk-drawer-overlay ${isMobileMenuOpen ? "open" : ""}`}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      {/* Mobile Drawer Container */}
      <div
        className={`sdk-drawer style-${config.mobileDrawerStyle || "slide-left"} ${isMobileMenuOpen ? "open" : ""}`}
        style={{
          backgroundColor: config.mobileDrawerBg || "#ffffff",
          color: config.mobileDrawerTextColor || "#1a202c",
        }}
      >
        <button
          onClick={() => setIsMobileMenuOpen(false)}
          className="sdk-drawer-close"
          aria-label="Close menu"
        >
          <CloseIcon />
        </button>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            marginBottom: "1rem",
          }}
        >
          {renderLogo()}
        </div>
        <nav className="sdk-drawer-nav">
          {navigationLinks.map((link, idx) => (
            <a
              key={idx}
              href={link.url}
              className="sdk-drawer-link"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {link.label}
            </a>
          ))}
          {config.ctaText && config.ctaLink && (
            <a
              href={config.ctaLink}
              style={{ ...ctaBtnStyle, textAlign: "center", marginTop: "1rem" }}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {config.ctaText}
            </a>
          )}
        </nav>
      </div>
    </div>
  );
}

/**
 * Plug-and-Play Footer Component
 */
export function Footer({
  siteName,
  footerSettings = {},
  navigationLinks = [],
}) {
  const config = {
    bgColor: "#1a202c",
    textColor: "#a0aec0",
    borderTopColor: "#2d3748",
    copyright: `© ${new Date().getFullYear()} ${siteName}. All rights reserved.`,
    ...footerSettings,
  };

  const columns = config.columns || [];

  const footerStyle = {
    backgroundColor: config.bgColor || "#1a202c",
    color: config.textColor || "#a0aec0",
    padding: "3rem 1.5rem",
    borderTop: `1px solid ${config.borderTopColor || "#2d3748"}`,
  };

  const headingColor =
    config.textColor === "#a0aec0" ? "#ffffff" : config.textColor;
  const linkColor = config.textColor || "#a0aec0";

  const renderColumnContent = (col, idx) => {
    switch (col.type) {
      case "logo_desc":
        return (
          <div key={idx}>
            {col.logoUrl ? (
              <img
                src={col.logoUrl}
                alt="Logo"
                style={{
                  height: "40px",
                  objectFit: "contain",
                  marginBottom: "1rem",
                }}
              />
            ) : (
              <h4
                style={{
                  color: headingColor,
                  fontWeight: 700,
                  margin: "0 0 1rem 0",
                }}
              >
                {col.title || siteName}
              </h4>
            )}
            <p style={{ fontSize: "0.75rem", lineHeight: "1.6" }}>
              {col.description || ""}
            </p>
          </div>
        );

      case "links":
        return (
          <div key={idx}>
            <h5
              style={{
                color: headingColor,
                fontWeight: 700,
                fontSize: "0.875rem",
                margin: "0 0 0.75rem 0",
              }}
            >
              {col.title || "Links"}
            </h5>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
                fontSize: "0.75rem",
              }}
            >
              {(col.links || []).map((link, i) => (
                <a
                  key={i}
                  href={link.url || "#"}
                  style={{ color: linkColor, textDecoration: "none" }}
                >
                  {link.label || link.text || link.name || "Link"}
                </a>
              ))}
            </div>
          </div>
        );

      case "contact":
        return (
          <div key={idx}>
            <h5
              style={{
                color: headingColor,
                fontWeight: 700,
                fontSize: "0.875rem",
                margin: "0 0 0.75rem 0",
              }}
            >
              {col.title || "Contact"}
            </h5>
            <div
              style={{
                fontSize: "0.75rem",
                lineHeight: "1.8",
                color: linkColor,
              }}
            >
              {col.phone && <p>📞 {col.phone}</p>}
              {col.email && <p>✉️ {col.email}</p>}
              {col.address && <p>📍 {col.address}</p>}
              {col.content && <p>{col.content}</p>}
            </div>
          </div>
        );

      case "newsletter":
        return (
          <div key={idx}>
            <h5
              style={{
                color: headingColor,
                fontWeight: 700,
                fontSize: "0.875rem",
                margin: "0 0 0.75rem 0",
              }}
            >
              {col.title || "Newsletter"}
            </h5>
            <p
              style={{
                fontSize: "0.75rem",
                lineHeight: "1.6",
                color: linkColor,
                marginBottom: "0.75rem",
              }}
            >
              {col.description || "Stay updated with our latest news."}
            </p>
          </div>
        );

      default:
        return (
          <div key={idx}>
            <h5
              style={{
                color: headingColor,
                fontWeight: 700,
                fontSize: "0.875rem",
                margin: "0 0 0.75rem 0",
              }}
            >
              {col.title || ""}
            </h5>
            {col.content && (
              <p style={{ fontSize: "0.75rem", color: linkColor }}>
                {col.content}
              </p>
            )}
          </div>
        );
    }
  };

  return (
    <footer style={footerStyle}>
      <div
        style={{
          maxWidth: "80rem",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: `repeat(${Math.min(columns.length || 4, 4)}, minmax(200px, 1fr))`,
          gap: "2rem",
        }}
      >
        {columns.length > 0 ? (
          columns.map((col, idx) => renderColumnContent(col, idx))
        ) : (
          <>
            <div>
              <h4
                style={{
                  color: headingColor,
                  fontWeight: 700,
                  margin: "0 0 1rem 0",
                }}
              >
                {siteName}
              </h4>
              <p style={{ fontSize: "0.75rem", lineHeight: "1.6" }}>
                High-performance modular pages served dynamically via backend
                integrations.
              </p>
            </div>
            <div>
              <h5
                style={{
                  color: headingColor,
                  fontWeight: 700,
                  fontSize: "0.875rem",
                  margin: "0 0 0.75rem 0",
                }}
              >
                Navigation
              </h5>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                  fontSize: "0.75rem",
                }}
              >
                {navigationLinks.slice(0, 4).map((link, idx) => (
                  <a
                    key={idx}
                    href={link.url}
                    style={{ color: "inherit", textDecoration: "none" }}
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
            <div>
              <h5
                style={{
                  color: headingColor,
                  fontWeight: 700,
                  fontSize: "0.875rem",
                  margin: "0 0 0.75rem 0",
                }}
              >
                Connection
              </h5>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.375rem",
                  borderRadius: "9999px",
                  backgroundColor: "#064e3b",
                  padding: "0.25rem 0.625rem",
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  color: "#34d399",
                  border: "1px solid #065f46",
                }}
              >
                CONNECTED
              </span>
            </div>
            <div>
              <h5
                style={{
                  color: headingColor,
                  fontWeight: 700,
                  fontSize: "0.875rem",
                  margin: "0 0 0.75rem 0",
                }}
              >
                Copyright
              </h5>
              <p style={{ fontSize: "0.7rem", lineHeight: "1.6" }}>
                {config.copyright}
              </p>
            </div>
          </>
        )}
      </div>
      <div
        style={{
          maxWidth: "80rem",
          margin: "2rem auto 0",
          paddingTop: "1.5rem",
          borderTop: "1px solid rgba(255,255,255,0.1)",
          textAlign: "center",
          fontSize: "0.7rem",
          color: linkColor,
        }}
      >
        {config.copyright}
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

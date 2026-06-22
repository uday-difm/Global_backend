import React from "react";
import { GlobalBackendClient } from "@globalbackend/next";
import { notFound } from "next/navigation";

const baseUrl = process.env.NEXT_PUBLIC_CMS_BASE_URL || "http://localhost:3000";
const siteId = process.env.NEXT_PUBLIC_SITE_ID || "";
const integrationKey = process.env.CMS_INTEGRATION_KEY || "";

const cms = new GlobalBackendClient({
  baseUrl,
  siteId,
});

interface PageProps {
  params: Promise<{ slug?: string[] }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug: rawSlug } = await params;
  const slug = rawSlug ? "/" + rawSlug.join("/") : "/";

  try {
    const data = await cms.getPage(slug);
    const seo = data?.seo || {};

    return {
      title: seo.title || data?.page?.title || "Welcome",
      description: seo.description || "",
      alternates: {
        canonical: seo.canonical || "",
      },
      openGraph: {
        title: seo.title || data?.page?.title,
        description: seo.description || "",
        images: seo.ogImage ? [{ url: seo.ogImage }] : [],
      },
    };
  } catch (error) {
    return {
      title: "CMS Page",
    };
  }
}

export default async function DynamicCMSPage({ params }: PageProps) {
  const { slug: rawSlug } = await params;
  const slug = rawSlug ? "/" + rawSlug.join("/") : "/";

  let pageData: any = null;
  try {
    if (siteId) {
      pageData = await cms.getPage(slug);
    }
  } catch (error) {
    console.error(`Error loading page content for slug: ${slug}`, error);
  }

  if (!pageData || !pageData.page) {
    notFound();
  }

  const { page, sections } = pageData;

  return (
    <div style={{ minHeight: "100vh" }}>
      {/* Dynamic Sections Loop */}
      {sections && sections.length > 0 ? (
        sections.map((section: any, idx: number) => {
          const type = String(section.type || "").toUpperCase();
          const content = section.content || {};

          switch (type) {
            case "HERO":
            case "BANNER":
              return (
                <section
                  key={idx}
                  style={{
                    position: "relative",
                    background: content.bannerUrl
                      ? `linear-gradient(rgba(15, 23, 42, 0.75), rgba(15, 23, 42, 0.75)), url(${content.bannerUrl})`
                      : "linear-gradient(135deg, #4f46e5, #312e81)",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    color: "#ffffff",
                    padding: "8rem 2rem",
                    textAlign: "center",
                  }}
                >
                  <div style={{ maxWidth: "56rem", margin: "0 auto" }}>
                    <h1 style={{ fontSize: "3rem", fontWeight: 800, marginBottom: "1.5rem" }}>
                      {content.title || page.title}
                    </h1>
                    <p style={{ fontSize: "1.25rem", color: "#e2e8f0", marginBottom: "2rem", lineHeight: "1.6" }}>
                      {content.subtitle || "Build and customize your web presence using modular components."}
                    </p>
                    {content.ctaLink && (
                      <a
                        href={content.ctaLink}
                        style={{
                          display: "inline-block",
                          backgroundColor: "#f43f5e",
                          color: "#ffffff",
                          fontWeight: 700,
                          padding: "0.75rem 2rem",
                          borderRadius: "0.5rem",
                          textDecoration: "none",
                          boxShadow: "0 10px 15px -3px rgba(244, 63, 94, 0.4)",
                        }}
                      >
                        {content.ctaText || "Get Started"}
                      </a>
                    )}
                  </div>
                </section>
              );

            case "SERVICES":
              return (
                <section key={idx} style={{ padding: "5rem 2rem", backgroundColor: "#ffffff" }}>
                  <div style={{ maxWidth: "80rem", margin: "0 auto" }}>
                    <div style={{ textAlign: "center", marginBottom: "3rem" }}>
                      <h2 style={{ fontSize: "2rem", fontWeight: 800, color: "#1e293b" }}>
                        {content.title || "Our Services"}
                      </h2>
                      <p style={{ color: "#64748b", marginTop: "0.5rem" }}>
                        {content.subtitle || "Solutions designed to help you succeed."}
                      </p>
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                        gap: "2rem",
                      }}
                    >
                      {content.items?.map((item: any, sIdx: number) => (
                        <div
                          key={sIdx}
                          style={{
                            border: "1px solid #f1f5f9",
                            padding: "2rem",
                            borderRadius: "0.75rem",
                            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
                            backgroundColor: "#f8fafc",
                          }}
                        >
                          <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#0f172a", marginBottom: "0.75rem" }}>
                            {item.title}
                          </h3>
                          <p style={{ color: "#475569", fontSize: "0.95rem", lineHeight: "1.6" }}>
                            {item.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              );

            case "TEAM":
              return (
                <section key={idx} style={{ padding: "5rem 2rem", backgroundColor: "#f8fafc" }}>
                  <div style={{ maxWidth: "80rem", margin: "0 auto" }}>
                    <div style={{ textAlign: "center", marginBottom: "3rem" }}>
                      <h2 style={{ fontSize: "2rem", fontWeight: 800, color: "#1e293b" }}>
                        {content.title || "Meet the Team"}
                      </h2>
                      <p style={{ color: "#64748b", marginTop: "0.5rem" }}>
                        {content.subtitle || "The talented people behind our platform."}
                      </p>
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                        gap: "2rem",
                      }}
                    >
                      {content.items?.map((item: any, tIdx: number) => (
                        <div
                          key={tIdx}
                          style={{
                            textAlign: "center",
                            backgroundColor: "#ffffff",
                            padding: "2rem",
                            borderRadius: "1rem",
                            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
                          }}
                        >
                          <div
                            style={{
                              width: "120px",
                              height: "120px",
                              borderRadius: "50%",
                              backgroundColor: "#e2e8f0",
                              margin: "0 auto 1.5rem auto",
                              backgroundSize: "cover",
                              backgroundPosition: "center",
                              backgroundImage: item.imageUrl ? `url(${item.imageUrl})` : "none",
                            }}
                          />
                          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0f172a" }}>
                            {item.name}
                          </h3>
                          <p style={{ color: "#4f46e5", fontSize: "0.85rem", fontWeight: 600, marginTop: "0.25rem" }}>
                            {item.role}
                          </p>
                          <p style={{ color: "#64748b", fontSize: "0.85rem", marginTop: "0.5rem", lineHeight: "1.5" }}>
                            {item.bio}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              );

            case "TESTIMONIALS":
              return (
                <section key={idx} style={{ padding: "5rem 2rem", backgroundColor: "#ffffff" }}>
                  <div style={{ maxWidth: "80rem", margin: "0 auto" }}>
                    <div style={{ textAlign: "center", marginBottom: "3rem" }}>
                      <h2 style={{ fontSize: "2rem", fontWeight: 800, color: "#1e293b" }}>
                        {content.title || "Client Testimonials"}
                      </h2>
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                        gap: "2rem",
                      }}
                    >
                      {content.items?.map((item: any, testIdx: number) => (
                        <div
                          key={testIdx}
                          style={{
                            border: "1px solid #e2e8f0",
                            borderRadius: "1rem",
                            padding: "2rem",
                            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.02)",
                          }}
                        >
                          <p style={{ fontStyle: "italic", color: "#475569", lineHeight: "1.6", marginBottom: "1.5rem" }}>
                            "{item.testimonial}"
                          </p>
                          <div>
                            <span style={{ fontWeight: 700, color: "#0f172a", display: "block" }}>
                              {item.name}
                            </span>
                            <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                              {item.designation || "Client"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              );

            case "FAQ":
              return (
                <section key={idx} style={{ padding: "5rem 2rem", backgroundColor: "#f8fafc" }}>
                  <div style={{ maxWidth: "48rem", margin: "0 auto" }}>
                    <div style={{ textAlign: "center", marginBottom: "3rem" }}>
                      <h2 style={{ fontSize: "2rem", fontWeight: 800, color: "#1e293b" }}>
                        {content.title || "Frequently Asked Questions"}
                      </h2>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                      {content.items?.map((item: any, faqIdx: number) => (
                        <div
                          key={faqIdx}
                          style={{
                            backgroundColor: "#ffffff",
                            padding: "1.5rem",
                            borderRadius: "0.75rem",
                            marginBottom: "1rem",
                            boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                          }}
                        >
                          <h4 style={{ fontWeight: 700, color: "#0f172a", marginBottom: "0.5rem" }}>
                            {item.question}
                          </h4>
                          <p style={{ color: "#475569", fontSize: "0.9rem", lineHeight: "1.6" }}>
                            {item.answer}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              );

            case "CONTACT_FORM":
              return (
                <section key={idx} style={{ padding: "5rem 2rem", backgroundColor: "#ffffff" }}>
                  <div style={{ maxWidth: "32rem", margin: "0 auto" }}>
                    <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
                      <h2 style={{ fontSize: "2rem", fontWeight: 800, color: "#1e293b" }}>
                        {content.title || "Get in Touch"}
                      </h2>
                      <p style={{ color: "#64748b", marginTop: "0.5rem" }}>
                        {content.subtitle || "Send us a message and we'll get back to you shortly."}
                      </p>
                    </div>
                    <form
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "1.25rem",
                        padding: "2.5rem",
                        border: "1px solid #e2e8f0",
                        borderRadius: "1rem",
                        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.05)",
                      }}
                    >
                      <div>
                        <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#334155", marginBottom: "0.5rem" }}>
                          Full Name
                        </label>
                        <input
                          type="text"
                          required
                          style={{
                            width: "100%",
                            padding: "0.75rem",
                            borderRadius: "0.375rem",
                            border: "1px solid #cbd5e1",
                            boxSizing: "border-box",
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#334155", marginBottom: "0.5rem" }}>
                          Email Address
                        </label>
                        <input
                          type="email"
                          required
                          style={{
                            width: "100%",
                            padding: "0.75rem",
                            borderRadius: "0.375rem",
                            border: "1px solid #cbd5e1",
                            boxSizing: "border-box",
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#334155", marginBottom: "0.5rem" }}>
                          Message
                        </label>
                        <textarea
                          rows={4}
                          required
                          style={{
                            width: "100%",
                            padding: "0.75rem",
                            borderRadius: "0.375rem",
                            border: "1px solid #cbd5e1",
                            boxSizing: "border-box",
                          }}
                        />
                      </div>
                      <button
                        type="submit"
                        style={{
                          backgroundColor: "#4f46e5",
                          color: "#ffffff",
                          fontWeight: 700,
                          padding: "0.75rem",
                          borderRadius: "0.375rem",
                          border: "none",
                          cursor: "pointer",
                          transition: "background 0.2s",
                        }}
                      >
                        Submit Message
                      </button>
                    </form>
                  </div>
                </section>
              );

            default:
              return (
                <section key={idx} style={{ padding: "3rem 2rem", borderBottom: "1px solid #e2e8f0" }}>
                  <div style={{ maxWidth: "80rem", margin: "0 auto" }}>
                    <h3 style={{ fontWeight: 700 }}>{section.title || "CMS Section"}</h3>
                    <p style={{ color: "#64748b", fontSize: "0.9rem" }}>Section Type: {type}</p>
                  </div>
                </section>
              );
          }
        })
      ) : (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
          <div style={{ textAlign: "center", padding: "3rem", border: "2px dashed #cbd5e1", borderRadius: "1rem" }}>
            <h2 style={{ fontWeight: 750, color: "#334155" }}>Welcome to {page.title}!</h2>
            <p style={{ color: "#64748b", marginTop: "0.5rem" }}>
              Add sections from the CMS admin dashboard to populate this page.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
export const dynamic = "force-dynamic";
export const revalidate = 60;

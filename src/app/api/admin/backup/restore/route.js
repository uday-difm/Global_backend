import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkSitePermission } from "@/lib/apiAuth";

export async function POST(req) {
  const auth = await checkSitePermission(req, "ADMIN");
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { backup } = await req.json();
    if (!backup || backup.siteId !== auth.siteId || !backup.data) {
      return NextResponse.json({ error: "Invalid backup payload or siteId mismatch" }, { status: 400 });
    }

    const { pages, posts, services, testimonials, faqs, teamMembers, legalPages, redirects, submissions, leads } = backup.data;

    // Use Prisma transaction to replace all data atomically
    await prisma.$transaction(async (tx) => {
      const siteId = auth.siteId;

      // 1. Delete existing records
      // Cascading deletes pages -> sections
      await tx.page.deleteMany({ where: { siteId } });
      await tx.post.deleteMany({ where: { siteId } });
      await tx.service.deleteMany({ where: { siteId } });
      await tx.testimonial.deleteMany({ where: { siteId } });
      await tx.faq.deleteMany({ where: { siteId } });
      await tx.teamMember.deleteMany({ where: { siteId } });
      await tx.legalPage.deleteMany({ where: { siteId } });
      await tx.redirect.deleteMany({ where: { siteId } });
      await tx.contactFormSubmission.deleteMany({ where: { siteId } });
      await tx.lead.deleteMany({ where: { siteId } });

      // 2. Re-create Pages and their Sections
      if (pages && Array.isArray(pages)) {
        for (const p of pages) {
          const { sections, ...pageProps } = p;
          const newPage = await tx.page.create({
            data: {
              ...pageProps
            }
          });

          if (sections && Array.isArray(sections)) {
            for (const sec of sections) {
              const { id, pageId, ...secProps } = sec;
              await tx.section.create({
                data: {
                  ...secProps,
                  pageId: newPage.id
                }
              });
            }
          }
        }
      }

      // 3. Re-create Posts
      if (posts && Array.isArray(posts)) {
        for (const p of posts) {
          // Exclude relational fields that can be re-resolved
          const { categories, tags, author, featuredImage, ...postProps } = p;
          await tx.post.create({ data: postProps });
        }
      }

      // 4. Re-create Services
      if (services && Array.isArray(services)) {
        for (const s of services) {
          const { featuredImage, ...serviceProps } = s;
          await tx.service.create({ data: serviceProps });
        }
      }

      // 5. Re-create Testimonials
      if (testimonials && Array.isArray(testimonials)) {
        for (const t of testimonials) {
          await tx.testimonial.create({ data: t });
        }
      }

      // 6. Re-create FAQs
      if (faqs && Array.isArray(faqs)) {
        for (const f of faqs) {
          await tx.faq.create({ data: f });
        }
      }

      // 7. Re-create Team Members
      if (teamMembers && Array.isArray(teamMembers)) {
        for (const tm of teamMembers) {
          await tx.teamMember.create({ data: tm });
        }
      }

      // 8. Re-create Legal Pages
      if (legalPages && Array.isArray(legalPages)) {
        for (const lp of legalPages) {
          await tx.legalPage.create({ data: lp });
        }
      }

      // 9. Re-create Redirects
      if (redirects && Array.isArray(redirects)) {
        for (const r of redirects) {
          await tx.redirect.create({ data: r });
        }
      }

      // 10. Re-create Form Submissions
      if (submissions && Array.isArray(submissions)) {
        for (const sub of submissions) {
          await tx.contactFormSubmission.create({ data: sub });
        }
      }

      // 11. Re-create Leads
      if (leads && Array.isArray(leads)) {
        for (const l of leads) {
          await tx.lead.create({ data: l });
        }
      }
    });

    return NextResponse.json({ success: true, message: "Site database restored successfully from backup" });
  } catch (err) {
    console.error("Backup restore transaction error:", err);
    return NextResponse.json({ error: "Internal Server Error", message: err.message }, { status: 500 });
  }
}

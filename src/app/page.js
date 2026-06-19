// src/app/page.js
import prisma from "@/lib/prisma";
import AnimatedCounter from "@/components/AnimatedCounter";
import SignInModal from "@/components/SignInModal";
import ThemeToggle from "@/components/ThemeToggle";
import FeatureCard from "@/components/FeatureCard";
import NewsletterForm from "@/components/NewsletterForm";
import Link from "next/link";

export default async function Home() {
  // Server-side: attempt to read a primary active site + some counts
  let site = null;
  let stats = { users: 0, sites: 0, leads: 0 };
  try {
    site = await prisma.site.findFirst({ where: { isActive: true } });
    const [users, sitesCount, leadsCount] = await Promise.all([
      prisma.user.count(),
      prisma.site.count(),
      prisma.lead.count().catch(() => 0),
    ]);
    stats = { users, sites: sitesCount, leads: leadsCount };
  } catch (err) {
    // If DB not configured, page still renders with zeros and no crashes
    console.error("Home page DB warning:", err?.message || err);
  }

  const features = [
    {
      icon: "🔐",
      title: "Authentication & Roles",
      desc: "NextAuth, RBAC, 2FA-ready flows.",
    },
    {
      icon: "✍️",
      title: "Content Management",
      desc: "Pages, blog, services, media library.",
    },
    {
      icon: "📣",
      title: "CTA & Lead Capture",
      desc: "Floating buttons, popups, newsletter forms.",
    },
    {
      icon: "📧",
      title: "Email & Notifications",
      desc: "SMTP or Resend support for transactional emails.",
    },
    {
      icon: "🛡️",
      title: "Security",
      desc: "Rate limits, audit logs, login history.",
    },
    {
      icon: "⚙️",
      title: "Extensible",
      desc: "Prisma models & modular API routes.",
    },
  ];

  return (
    <main className="min-h-screen bg-linear-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 transition-colors duration-200">
      <nav className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between text-slate-900 dark:text-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-linear-to-r from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold">
            GB
          </div>
          <div>
            <div className="font-semibold text-lg">Global Backend</div>
            <div className="text-xs text-slate-500 dark:text-slate-300">
              Headless CMS & Admin
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <SignInModal />
        </div>
      </nav>

      <section className="max-w-7xl mx-auto px-6 grid grid-cols-1 gap-8 lg:grid-cols-2 items-start">
        {/* Hero / left */}
        <div className="pt-6 pb-10">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-slate-100 leading-tight">
            Build admin backends faster — secure, extensible, and multi-site
            ready
          </h1>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-300 max-w-xl">
            Global Backend is a production scaffold (Next.js + Prisma +
            NextAuth) with admin UI, RBAC, 2FA, media management, CTA & lead
            capture, forms, and extensible APIs.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/api/auth/signin?callbackUrl=/dashboard"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-md bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-medium shadow transition"
            >
              Sign in
            </Link>

            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-md bg-white dark:bg-slate-800 border dark:border-slate-700 text-slate-800 dark:text-slate-100 font-medium hover:shadow-md transition"
            >
              Open Dashboard
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-8 bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm flex gap-6 items-center">
            <div>
              <div className="text-xs text-slate-400 dark:text-slate-300">
                Users
              </div>
              <AnimatedCounter value={stats.users ?? 0} />
            </div>

            <div className="border-l h-8 border-slate-200 dark:border-slate-700" />

            <div>
              <div className="text-xs text-slate-400 dark:text-slate-300">
                Sites
              </div>
              <AnimatedCounter value={stats.sites ?? 0} />
            </div>

            <div className="border-l h-8 border-slate-200 dark:border-slate-700" />

            <div>
              <div className="text-xs text-slate-400 dark:text-slate-300">
                Leads
              </div>
              <AnimatedCounter value={stats.leads ?? 0} />
            </div>
          </div>

          {/* Newsletter */}
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Newsletter
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-300 mb-3">
              Get updates, changelogs and deployment tips.
            </p>
            <div className="max-w-md">
              <NewsletterForm siteId={site?.id ?? ""} />
            </div>
          </div>
        </div>

        {/* Right promo / features */}
        <div className="py-6">
          <div className="rounded-2xl p-6 bg-white/90 dark:bg-slate-900/90 shadow-xl">
            <div className="grid gap-4 sm:grid-cols-2">
              {features.map((f) => (
                <FeatureCard key={f.title} icon={f.icon} title={f.title}>
                  {f.desc}
                </FeatureCard>
              ))}
            </div>

            <div className="mt-6">
              <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                Quickstart
              </h4>
              <ol className="list-decimal pl-5 text-sm text-slate-600 dark:text-slate-300 mt-2 space-y-1">
                <li>
                  Set up .env.local (DATABASE_URL, NEXTAUTH_SECRET, SMTP/RESEND
                  keys)
                </li>
                <li>
                  Run prisma generate & migrate:{" "}
                  <code className="bg-slate-100 px-1 rounded">
                    npx prisma generate
                  </code>
                  ,{" "}
                  <code className="bg-slate-100 px-1 rounded">
                    npx prisma migrate dev
                  </code>
                </li>
                <li>
                  Start the app:{" "}
                  <code className="bg-slate-100 px-1 rounded">npm run dev</code>
                </li>
              </ol>
            </div>

            <footer className="mt-6 text-xs text-slate-400 dark:text-slate-300">
              <div>
                Want additional pages (docs, API reference)? See{" "}
                <a
                  className="text-blue-600 dark:text-blue-400"
                  href="/docs/API.md"
                >
                  docs/API.md
                </a>
                .
              </div>
            </footer>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 mt-12 pb-12">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            Why use Global Backend?
          </h3>
          <p className="mt-2 text-slate-600 dark:text-slate-300">
            It’s built to be extended — replace storage, add integrations, or
            add custom APIs while keeping auth and RBAC.
          </p>
        </div>
      </section>
    </main>
  );
}

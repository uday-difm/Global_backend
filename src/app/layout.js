import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/providers/SessionProvider";
import prisma from "@/lib/prisma";
import AnalyticsScripts from "@/components/utils/AnalyticsScripts";
import ClientScripts from "@/components/utils/ClientScripts";
import { ThemeProvider } from "next-themes";
import SessionTimeoutHandler from "@/components/utils/SessionTimeoutHandler";
import { Toaster } from "sonner";

// Initialize event listeners for emails, notifications, and webhooks
import "@/core/listeners";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Global Backend",
  description: "Managing your applications",
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default async function RootLayout({ children }) {
  const site = await prisma.site.findFirst({ where: { isActive: true } });
  const settings = site
    ? await prisma.globalSettings.findUnique({ where: { siteId: site.id } })
    : null;

  const analytics = settings?.analytics || {};
  const scripts = settings?.scripts || {};
  const timeoutMinutes =
    settings?.securityControls?.sessionTimeoutMinutes || 30;
  const performanceConfig = settings?.performanceConfig || {};
  const deferScripts = performanceConfig.deferNonEssentialScripts ?? true;

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* The head scripts are now handled by the ClientScripts component below */}
        {analytics.searchConsoleId && (
          <meta
            name="google-site-verification"
            content={analytics.searchConsoleId}
          />
        )}
      </head>
      <body>
        {/* The ClientScripts component will inject scripts here and in the head */}
        <ClientScripts
          headScripts={scripts.head}
          bodyScripts={scripts.body}
          deferScripts={deferScripts}
        />

        {/* Analytics & tracking scripts — injected client-side to avoid React 19 script hydration warnings */}
        <AnalyticsScripts analytics={analytics} />

        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            <SessionTimeoutHandler timeoutMinutes={timeoutMinutes} />
            {children}
            <Toaster richColors position="top-right" closeButton />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

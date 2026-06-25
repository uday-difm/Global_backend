import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/providers/SessionProvider";
import prisma from "@/lib/prisma";
import Script from "next/script";
import ClientScripts from "@/components/utils/ClientScripts"; // Import the new component
import { ThemeProvider } from "next-themes";
import SessionTimeoutHandler from "@/components/utils/SessionTimeoutHandler";

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

        {/* Google Tag Manager */}
        {analytics.googleTagManagerId && (
          <Script id="google-tag-manager" strategy="afterInteractive">
            {`
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','${analytics.googleTagManagerId}');
            `}
          </Script>
        )}

        {/* Google Analytics (gtag.js) */}
        {analytics.googleAnalyticsId && (
          <>
            <Script
              strategy="afterInteractive"
              src={`https://www.googletagmanager.com/gtag/js?id=${analytics.googleAnalyticsId}`}
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${analytics.googleAnalyticsId}');
              `}
            </Script>
          </>
        )}

        {/* Microsoft Clarity */}
        {analytics.clarityId && (
          <Script id="microsoft-clarity" strategy="afterInteractive">
            {`
              (function(c,l,a,r,i,t,y){
                  c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                  t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/v/"+i;
                  y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "${analytics.clarityId}");
            `}
          </Script>
        )}

        {/* Meta Pixel (Facebook Pixel) */}
        {analytics.metaPixelId && (
          <>
            <Script id="meta-pixel" strategy="afterInteractive">
              {`
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window, document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '${analytics.metaPixelId}');
                fbq('track', 'PageView');
              `}
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

        {/* LinkedIn Partner Tag */}
        {analytics.linkedInTagId && (
          <>
            <Script id="linkedin-insight" strategy="afterInteractive">
              {`
                _linkedin_partner_id = "${analytics.linkedInTagId}";
                window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
                window._linkedin_data_partner_ids.push(_linkedin_partner_id);
                (function(l) {
                if (!l) {window._linkedin_data_partner_script_loaded = true;
                var d = document; var s = d.getElementsByTagName("script")[0];
                var b = d.createElement("script");
                b.type = "text/javascript";b.async = true;
                b.src = "https://snap.licdn.com/li.lms-analytics/insight.min.js";
                s.parentNode.insertBefore(b, s);}})(window._linkedin_data_partner_ids[0]);
              `}
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

        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            <SessionTimeoutHandler timeoutMinutes={timeoutMinutes} />
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

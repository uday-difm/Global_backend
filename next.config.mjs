/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactCompiler: true,
  allowedDevOrigins: ["192.168.29.15", "192.168.29.15:3000", "192.168.29.15:3001", "dyslexia-recital-area.ngrok-free.dev"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/frontend-assets/_next/:path*",
          destination: "http://localhost:3001/_next/:path*",
        },
        {
          source: "/:path((?!login|dashboard|pages|blogs|services|users|settings|media|sites|visitors|performance|security|legal|faq|testimonials|leads|newsletter|cta|forgot-password|reset-password|api|_next|header|footer|notifications|webhooks|redirects|seo|team|navigation|integrations|backup|compliance|contact|dev|email|favicon-16x16.png|favicon-32x32.png|apple-touch-icon.png|favicon.ico).*)",
          destination: "http://localhost:3001/:path*",
        },
      ],
    };
  },
};

export default nextConfig;

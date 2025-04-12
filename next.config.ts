import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: `
              default-src 'self';
              script-src 'self' 'unsafe-inline' 'strict-dynamic' https://cdn.vercel-insights.com https://www.googletagmanager.com;
              style-src 'self' 'unsafe-inline';
              font-src 'self' https: data:;
              connect-src *;
              img-src 'self' data: https:;
            `.replace(/\s{2,}/g, ' ').trim(),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
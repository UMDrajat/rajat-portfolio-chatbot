import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === 'development';

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
              script-src ${isDev ? "'self' 'unsafe-inline'" : "'self'"} https://cdn.vercel-insights.com https://www.googletagmanager.com;
              style-src 'self' 'unsafe-inline';
              font-src 'self' https: data:;
              connect-src ${isDev ? '*' : "'self' https://openrouter.ai"};
              img-src 'self' data: https:;
            `.replace(/\s{2,}/g, ' ').trim(),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
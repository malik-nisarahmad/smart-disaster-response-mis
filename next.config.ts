import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  // ── HTTPS Enforcement ──────────────────────────────────────────────────────
  // In production, redirect all HTTP traffic to HTTPS (308 = permanent redirect)
  async redirects() {
    if (!isProd) return [];
    return [
      {
        source: "/:path*",
        has: [{ type: "header", key: "x-forwarded-proto", value: "http" }],
        destination: "https://:host/:path*",
        permanent: true,
        statusCode: 308,
      } as any,
    ];
  },

  // ── Security Headers ──────────────────────────────────────────────────────
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Force HTTPS for 1 year, submit to preload list
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          // Prevent clickjacking via iframe embedding
          { key: "X-Frame-Options", value: "DENY" },
          // Prevent MIME-type sniffing
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Referrer policy
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Content Security Policy
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com",
              "font-src 'self' https://fonts.gstatic.com",
              // Allow OSM tile images + cdnjs marker icons + local blobs/data
              "img-src 'self' data: blob: https://*.tile.openstreetmap.org https://cdnjs.cloudflare.com https://unpkg.com",
              // Allow backend API + Nominatim geocoding + OSM tile servers
              "connect-src 'self' http://localhost:5000 https://localhost:5000 https://nominatim.openstreetmap.org https://*.tile.openstreetmap.org",
              // Leaflet loads marker images as workers/blobs in some builds
              "worker-src 'self' blob:",
            ].join("; "),
          },
          // Browser feature permissions
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self)",
          },
        ],
      },
    ];
  },
};

export default nextConfig;

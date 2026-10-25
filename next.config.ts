import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // AVIF/WebP jauh lebih kecil dari JPG/PNG; Next memilih otomatis sesuai browser.
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co" }],
  },
  serverExternalPackages: ["postgres"],
  async headers() {
    const week = "public, max-age=604800, stale-while-revalidate=86400";
    return [
      { source: "/images/:path*", headers: [{ key: "Cache-Control", value: week }] },
      { source: "/audio/:path*", headers: [{ key: "Cache-Control", value: week }] },
      { source: "/models/:path*", headers: [{ key: "Cache-Control", value: week }] },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Let other devices on the Wi-Fi open the dev server (e.g. http://192.168.1.7:3000).
  // Dev-only; if your Mac's network address changes, update it here.
  allowedDevOrigins: ["192.168.1.7"],
  cacheComponents: true,
  partialPrefetching: true,
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

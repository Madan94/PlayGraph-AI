import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [],
  experimental: {
    // Video uploads proxy through /api/v1/* — default 10MB truncates multipart bodies.
    proxyClientMaxBodySize: "500mb",
    middlewareClientMaxBodySize: "500mb",
  },
};

export default nextConfig;

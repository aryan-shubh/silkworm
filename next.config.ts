import type { NextConfig } from "next";

const config: NextConfig = {
  reactCompiler: false,
  // typedRoutes intentionally off — landing page has placeholder /docs, /pricing, etc.
  async redirects() {
    return [
      {
        source: "/p/:path*",
        destination: "/dashboard/p/:path*",
        permanent: true,
      },
    ];
  },
};

export default config;

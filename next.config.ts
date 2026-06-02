import type { NextConfig } from "next";

const config: NextConfig = {
  experimental: { reactCompiler: false },
  // typedRoutes intentionally off — landing page has placeholder /docs, /pricing, etc.
};

export default config;

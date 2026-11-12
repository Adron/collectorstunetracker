import type { NextConfig } from "next";

// Fully static: collectorstunetracker.com is plain HTML/CSS on the CDN.
const config: NextConfig = {
  output: "export",
  transpilePackages: ["@ctt/ui"],
  poweredByHeader: false,
  images: { unoptimized: true },
};

export default config;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  distDir: 'dist',
  images: {
    unoptimized: true,
  },
  // For GitHub User Pages, no basePath is needed
  // The site will be at https://owongy0.github.io/
};

export default nextConfig;

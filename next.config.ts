import type { NextConfig } from "next";
import path from "node:path";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  basePath: basePath || undefined,
  assetPrefix: basePath || undefined,
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;

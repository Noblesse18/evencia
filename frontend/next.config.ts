import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // Mode standalone pour Docker
  output: "standalone",
};

export default nextConfig;

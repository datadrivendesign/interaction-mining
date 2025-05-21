import { NextConfig } from "next";
import createMDX from "@next/mdx";

const nextConfig: NextConfig = {
  turbopack: {},
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "play-lh.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "*.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "*.mzstatic.com",
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "500mb",
    },
    reactCompiler: true,
  },
  webpack: (config) => {
    config.externals = [...config.externals, { canvas: "canvas" }];
    config.resolve.fallback = { fs: false };
    return config;
  },
};

const withMDX = createMDX({
  // Add markdown plugins here, as desired
});

// Merge MDX config with Next.js config
export default withMDX(nextConfig);

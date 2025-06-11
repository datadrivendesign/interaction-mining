import { NextConfig } from "next";
import createMDX from "@next/mdx";
import { RemotePattern } from "next/dist/shared/lib/image-config";

const remotePatterns: RemotePattern[] = [
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
  {
    protocol: "https",
    hostname: "d1nrlpeg5tvzyr.cloudfront.net"
  },
];
// Conditionally add MinIO endpoint if set
if (process.env.MINIO_ENDPOINT) {
  try {
    const minioHost = new URL(process.env.MINIO_ENDPOINT).hostname;
    remotePatterns.push({
      protocol: "http",
      hostname: minioHost,
    }, {
      protocol: "http",
      hostname: "localhost"
    });
  } catch (err) {
    console.warn("Invalid MINIO_ENDPOINT format in .env:", err);
  }
}

const nextConfig: NextConfig = {
  turbopack: {},
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  images: {
    remotePatterns
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "500mb",
    },
    nodeMiddleware: true,
    viewTransition: true,
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

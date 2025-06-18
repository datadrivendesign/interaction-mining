import { NextConfig } from "next";
import createMDX from "@next/mdx";
import { RemotePattern } from "next/dist/shared/lib/image-config";

const remotePatterns: RemotePattern[] = [
  {
    protocol: "https",
    hostname: "*.googleusercontent.com",
    pathname: "**",
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
    hostname: "d1nrlpeg5tvzyr.cloudfront.net",
  },
];
// Conditionally add MinIO endpoint if set
if (process.env.MINIO_ENDPOINT) {
  try {
    const minioHost = new URL(process.env.MINIO_ENDPOINT).hostname;
    remotePatterns.push(
      {
        protocol: "http",
        hostname: minioHost,
      },
      {
        protocol: "http",
        hostname: "localhost",
      }
    );
  } catch (err) {
    console.warn("Invalid MINIO_ENDPOINT format in .env:", err);
  }
}

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.svg": {
        loaders: ["@svgr/webpack"],
        as: "*.js",
      },
    },
  },
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  images: {
    remotePatterns,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "500mb",
    },
    viewTransition: true,
    reactCompiler: true,
  },
  webpack: (config) => {
    // Canvas is a Node.js package that needs to be polyfilled in the browser
    config.externals = [...config.externals, { canvas: "canvas" }];
    config.resolve.fallback = { fs: false };

    // Grab the existing rule that handles SVG imports
    const fileLoaderRule = config.module.rules.find((rule: any) =>
      rule.test?.test?.(".svg")
    );

    config.module.rules.push(
      // Reapply the existing rule, but only for svg imports ending in ?url
      {
        ...fileLoaderRule,
        test: /\.svg$/i,
        resourceQuery: /url/, // *.svg?url
      },
      // Convert all other *.svg imports to React components
      {
        test: /\.svg$/i,
        issuer: fileLoaderRule.issuer,
        resourceQuery: { not: [...fileLoaderRule.resourceQuery.not, /url/] }, // exclude if *.svg?url
        use: ["@svgr/webpack"],
      }
    );

    // Modify the file loader rule to ignore *.svg, since we have it handled now.
    fileLoaderRule.exclude = /\.svg$/i;

    return config;
  },
};

const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

const withMDX = createMDX({
  // Add markdown plugins here, as desired
});

// Merge MDX config with Next.js config
export default withBundleAnalyzer(withMDX(nextConfig));

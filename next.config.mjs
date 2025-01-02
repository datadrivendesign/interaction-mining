/** @type {import('next').NextConfig} */
import createMDX from '@next/mdx';

const nextConfig = {
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "play-lh.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "*.amazonaws.com"
      },
      {
        protocol: "https",
        hostname: "via.placeholder.com"
      }
    ],
  },
};

const withMDX = createMDX({
  // Add markdown plugins here, as desired
})

// Merge MDX config with Next.js config
export default withMDX(nextConfig);

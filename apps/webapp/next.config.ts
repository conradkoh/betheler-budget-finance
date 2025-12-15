import createMDX from '@next/mdx';
import type { NextConfig } from 'next';
import remarkGfm from 'remark-gfm';

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  // Configure `pageExtensions` to include markdown and MDX files
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
  // Enable typed routes for compile-time type safety (moved from experimental in Next.js 16)
  typedRoutes: true,
};

const withMDX = createMDX({
  // Add markdown plugins here, as desired
  options: {
    // Enable GitHub Flavored Markdown (tables, strikethrough, task lists, autolinks)
    // Note: Plugin references need to be serializable for Turbopack compatibility
    remarkPlugins: [remarkGfm],
    rehypePlugins: [],
  },
});

// Combine MDX and Next.js config
export default withMDX(nextConfig);

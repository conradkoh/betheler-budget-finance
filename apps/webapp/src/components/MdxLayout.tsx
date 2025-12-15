import type { ReactNode } from 'react';

/**
 * Props for the MDX layout component.
 */
export interface MdxLayoutProps {
  children: ReactNode;
}

/**
 * Provides consistent GitHub-style layout for MDX documentation pages.
 * Uses semantic colors and spacing that work perfectly with our custom MDX components.
 */
export default function MdxLayout({ children }: MdxLayoutProps) {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
      <article className="mdx-content space-y-0 w-full">{children}</article>
    </div>
  );
}

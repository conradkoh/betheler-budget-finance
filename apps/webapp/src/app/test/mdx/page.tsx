'use client';

import SampleMDX from './sample.mdx';

import MdxLayout from '@/components/MdxLayout';

/**
 * Test page for demonstrating MDX functionality and rendering capabilities.
 * Showcases various MDX features including component embedding, layout options,
 * and content styling with semantic colors for dark mode support.
 *
 * This page serves as:
 * - Development testing environment for MDX features
 * - Visual demonstration of markdown rendering
 * - Example implementation reference for developers
 * - UI/UX validation for typography and styling
 */
export default function MdxTestPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6 text-foreground">MDX Test Page</h1>

      <div className="space-y-8">
        {/* Real MDX File Example */}
        <div>
          <h2 className="text-xl font-semibold mb-4 text-foreground">Real MDX File (sample.mdx)</h2>
          <div className="border border-border rounded-lg p-6 bg-card">
            <div className="mdx-content">
              <SampleMDX />
            </div>
          </div>
        </div>

        {/* MDX with Layout Example */}
        <div>
          <h2 className="text-xl font-semibold mb-4 text-foreground">Same MDX with Layout</h2>
          <div className="border border-border rounded-lg bg-card">
            <MdxLayout>
              <SampleMDX />
            </MdxLayout>
          </div>
        </div>

        {/* Manual MDX Content for Comparison */}
        <div>
          <h2 className="text-xl font-semibold mb-4 text-foreground">
            Manual JSX (for comparison)
          </h2>
          <div className="border border-border rounded-lg p-6 bg-card">
            <SampleMDXContent />
          </div>
        </div>

        {/* Side-by-side MDX Comparison */}
        <div>
          <h2 className="text-xl font-semibold mb-4 text-foreground">Layout Comparison</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-2 text-foreground">Direct MDX</h3>
              <div className="border border-border rounded-lg p-4 bg-card">
                <div className="mdx-content">
                  <SampleMDX />
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2 text-foreground">With Layout Wrapper</h3>
              <div className="border border-border rounded-lg bg-card">
                <MdxLayout>
                  <SampleMDX />
                </MdxLayout>
              </div>
            </div>
          </div>
        </div>

        {/* Dark Mode Testing */}
        <div>
          <h2 className="text-xl font-semibold mb-4 text-foreground">Dark Mode Testing</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border border-border rounded-lg p-4 bg-card">
              <h3 className="text-lg font-medium mb-2 text-foreground">Semantic Colors</h3>
              <SemanticColorsMDX />
            </div>
            <div className="border border-border rounded-lg p-4 bg-muted">
              <h3 className="text-lg font-medium mb-2 text-foreground">Muted Background</h3>
              <SemanticColorsMDX />
            </div>
            <div className="border border-border rounded-lg p-4 bg-accent">
              <h3 className="text-lg font-medium mb-2 text-foreground">Accent Background</h3>
              <SemanticColorsMDX />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Sample MDX content for basic testing.
 */
function SampleMDXContent() {
  return (
    <div className="mdx-content">
      <h1>Basic MDX Content</h1>
      <p>
        This is <strong>basic MDX content</strong> with <em>formatting</em>.
      </p>
      <ul>
        <li>List item one</li>
        <li>List item two</li>
        <li>List item three</li>
      </ul>
      <p>
        <a href="/">Link to home</a>
      </p>
      <blockquote>
        <p>This is a clean blockquote without italic styling, following GitHub's approach.</p>
      </blockquote>
      <p>
        Here's some <code>inline code</code> that looks clean and readable.
      </p>
    </div>
  );
}

/**
 * MDX content specifically for testing semantic colors.
 */
function SemanticColorsMDX() {
  return (
    <div className="mdx-content">
      <p>Primary text with semantic colors</p>
      <p className="text-muted-foreground">Muted secondary text</p>
      <p>
        <a href="/">Clean primary link</a>
      </p>
      <p>
        <code>inline code</code> with proper contrast
      </p>
      <blockquote>
        <p>Clean blockquote styling</p>
      </blockquote>
    </div>
  );
}

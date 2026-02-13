# Adding New MDX Documents - Complete Guide

This guide provides step-by-step instructions for creating and rendering new MDX files in the webapp.

## Prerequisites

The webapp already has MDX support configured with:

- `@next/mdx` and `@mdx-js/react` packages installed
- Next.js config updated with MDX support
- Custom MDX components configured
- Tailwind Typography plugin enabled

## Step-by-Step Instructions

### 1. Choose Your Use Case

**Option A: Full Page MDX** (creates a route)
**Option B: Component MDX** (embeddable content)

### 2. Choose Your Location

**For Full Pages** - Place in `src/app/` directory:

```
src/app/docs/page.mdx           # Route: /docs
src/app/guides/setup/page.mdx   # Route: /guides/setup
```

**For Components** - Place in `src/content/` or anywhere:

```
src/
├── content/
│   ├── intro.mdx                   # Reusable content
│   ├── features.mdx                # Component content
│   └── help-text.mdx               # Embeddable content
└── components/
    └── sections/
        └── about.mdx               # Section content
```

### 3. Create Your MDX File

**For Full Pages:**

```bash
# Example: Creating a new guide page
mkdir -p src/app/guides/getting-started
touch src/app/guides/getting-started/page.mdx
```

**For Components:**

```bash
# Example: Creating reusable content
mkdir -p src/content
touch src/content/intro.mdx
```

### 4. MDX File Templates

#### Option A: Full Page Template (with layout)

```mdx
import MdxLayout from "../../../components/MdxLayout";

export const metadata = {
  title: "Your Page Title",
  description: "A brief description of your content",
};

# Your Page Title

Your content goes here with **markdown** syntax and _formatting_.

## Sections

You can use all standard markdown features:

- Lists
- Links to [other pages](/docs)
- Code blocks
  \`\`\`javascript
  const example = "syntax highlighting works";
  console.log(example);
  \`\`\`
```

> Blockquotes for important information

## Custom Components

You can also use React components when needed.

export default function MDXPage({ children }) {
return <MdxLayout>{children}</MdxLayout>
}

```mdx
#### Option B: Component Template (no layout)

# Reusable Content

This content can be **imported and used** anywhere in your app.

## Features

- No layout wrapper
- Inherits parent styling
- Can be embedded in any component

\`\`\`javascript
// Works great for documentation snippets
const example = "embedded content";
\`\`\`

> Perfect for reusable content blocks!
```

#### Option C: Using MDX Components in React

```tsx
// Import MDX as a component
import IntroContent from "../content/intro.mdx";
import FeaturesContent from "../content/features.mdx";

export default function MyPage() {
  return (
    <div className="container mx-auto p-8">
      <h1>My Page</h1>

      {/* Embed MDX content */}
      <div className="prose max-w-none">
        <IntroContent />
      </div>

      <div className="grid grid-cols-2 gap-8">
        <div className="prose prose-sm">
          <FeaturesContent />
        </div>
        <div>{/* Other React content */}</div>
      </div>
    </div>
  );
}
```

### 4. Key Components Explained

#### Import the Layout

```mdx
import MdxLayout from '../../../components/MdxLayout

'
```

- Adjust the path based on your file's location relative to `src/components/`
- From `src/app/docs/page.mdx`: `'../../components/MdxLayout'`
- From `src/app/docs/sub/page.mdx`: `'../../../components/MdxLayout'`

#### Add Metadata

```mdx
export const metadata = {
  title: 'Your Page Title',
  description: 'A brief description of your content',

}
```

- This sets the page title and meta description for SEO
- The title appears in the browser tab

#### Export the Layout Function

```mdx
export default function MDXPage({ children }) {
  return <MdxLayout>{children}</MdxLayout>

}
```

- This **must** be at the end of your file
- Wraps your content in the consistent layout

### 5. Available Styling Features

The MDX setup includes custom styled components:

- **Headings**: Automatically styled with proper hierarchy
- **Code blocks**: Syntax highlighting with proper theming
- **Links**: Hover effects and semantic colors
- **Blockquotes**: Styled with borders and muted colors
- **Lists**: Proper spacing and bullet styling
- **Dark mode**: All components respect theme changes

### 6. Testing Your New Page

1. **Type check**: Run `pnpm run typecheck` to ensure no TypeScript errors
2. **Start dev server**: Run `pnpm run dev` (if needed for testing)
3. **Visit your page**: Navigate to the route corresponding to your file location
4. **See examples**: Visit `/test/mdx` (development only) to see working examples

## Common Pitfalls and How to Avoid Them

### ❌ Pitfall 1: Server/Client Component Conflicts

**Problem**: Using React Context or client-side features directly in MDX

```mdx
// DON'T DO THIS - causes createContext errors
import { useState } from 'react'

# My Page

{useState(0)} // This breaks!
```

**Solution**: Keep MDX content simple, or create separate client components

```mdx
// DO THIS - import a client component instead
import MyInteractiveComponent from '../components/MyInteractiveComponent'

# My Page

<MyInteractiveComponent />
```

### ❌ Pitfall 2: Incorrect Import Paths

**Problem**: Wrong relative paths to components

```mdx
// Wrong path from src/app/docs/guide/page.mdx
import MdxLayout from '../../components/MdxLayout' // Missing ../
```

**Solution**: Count directory levels carefully

```mdx
// Correct path from src/app/docs/guide/page.mdx
import MdxLayout from '../../../components/MdxLayout'
// ^ ^ ^
// app docs guide
```

### ❌ Pitfall 3: Missing Layout Export

**Problem**: Forgetting the layout export function

```mdx
# My Content

Some content here...
// Missing export default function!
```

**Solution**: Always include the layout export at the end

```mdx
# My Content

Some content here...

export default function MDXPage({ children }) {
  return <MdxLayout>{children}</MdxLayout>

}
```

### ❌ Pitfall 4: File Naming Issues

**Problem**: Using incorrect file names

```bash
src/app/docs/index.mdx        # Wrong - use page.mdx
src/app/docs/readme.mdx       # Wrong - use page.mdx
src/app/docs/docs.mdx         # Wrong - use page.mdx
```

**Solution**: Always use `page.mdx` for route files

```bash
src/app/docs/page.mdx         # Correct - creates /docs route
src/app/guide/page.mdx        # Correct - creates /guide route
```

### ❌ Pitfall 5: JSX Syntax Errors

**Problem**: Mixing HTML and JSX incorrectly

```mdx
<div className="my-class">    <!-- Wrong quote style -->
<div class="my-class">        <!-- Wrong attribute name -->
```

**Solution**: Use proper JSX syntax

```mdx
<div className="my-class">    {/* Correct JSX */}
```

## Advanced Tips

### Custom Components in MDX

You can import and use React components:

```mdx
import CustomCard from "../components/CustomCard";

# My Guide

<CustomCard title="Important Note">
  This is a custom component within MDX content.
</CustomCard>
```

### Conditional Content

Use JavaScript expressions for dynamic content:

```mdx
export const isProduction = process.env.NODE_ENV === "production";

# My Guide

{!isProduction && (

{" "}

<div className="bg-yellow-100 p-4 rounded">
  This is development content only.
</div>
)}
```

### Multiple Layouts

Create different layouts for different content types:

```mdx
import BlogLayout from "../../../components/BlogLayout"; // Different layout

# Blog Post Title

Blog content here...

export default function BlogPage({ children }) {
  return <BlogLayout>{children}</BlogLayout>

}
```

## Troubleshooting

### Build Errors

- Run `pnpm run typecheck` to catch TypeScript issues
- Check that all import paths are correct
- Ensure the layout export function is present

### Styling Issues

- Verify `@tailwindcss/typography` is installed
- Check that `MdxLayout` component is imported correctly
- Ensure dark mode classes are working with semantic colors

### Route Not Found

- Confirm the file is named `page.mdx`
- Check the directory structure matches your intended route
- Restart the dev server if needed

## Quick Reference

```bash
# Create new MDX document
mkdir -p src/app/your-route-name
touch src/app/your-route-name/page.mdx

# Test compilation
pnpm run typecheck

# View your page
# Navigate to: http://localhost:3000/your-route-name
```

**Remember**: Every MDX file needs:

1. ✅ Import the layout component
2. ✅ Add metadata export
3. ✅ Include your markdown content
4. ✅ Export the layout function at the end
5. ✅ Use correct file naming (`page.mdx`)

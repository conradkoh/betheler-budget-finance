declare module '*.mdx' {
  import type * as React from 'react';

  const MDXComponent: (props: React.ComponentPropsWithoutRef<'div'>) => React.ReactNode;
  export default MDXComponent;
}

declare module '*.md' {
  import type * as React from 'react';

  const MDComponent: (props: React.ComponentPropsWithoutRef<'div'>) => React.ReactNode;
  export default MDComponent;
}

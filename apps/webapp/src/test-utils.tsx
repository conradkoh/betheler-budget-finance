import { type RenderOptions, render } from '@testing-library/react';
import type { ReactElement } from 'react';

/**
 * Custom render function that can be extended with providers, mocks, etc.
 * This is useful for wrapping components with context providers or other setup.
 *
 * @example
 * ```tsx
 * import { renderWithProviders } from '@/test-utils';
 *
 * test('my component', () => {
 *   renderWithProviders(<MyComponent />);
 * });
 * ```
 */
export function renderWithProviders(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return render(ui, {
    ...options,
  });
}

// Re-export everything from React Testing Library
export * from '@testing-library/react';

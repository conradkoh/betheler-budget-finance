import { featureFlags } from '@workspace/backend/config/featureFlags';
import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  const startUrl = featureFlags.disableLogin ? '/' : '/app';

  return {
    name: 'Budget',
    short_name: 'Budget',
    description: 'Budgeting and financial management application for Bethel ER',
    icons: [
      {
        src: '/appicon-16x16.png',
        sizes: '16x16',
        type: 'image/png',
      },
      {
        src: '/appicon-32x32.png',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        src: '/appicon-64x64.png',
        sizes: '64x64',
        type: 'image/png',
      },
      {
        src: '/appicon-96x96.png',
        sizes: '96x96',
        type: 'image/png',
      },
      {
        src: '/appicon-128x128.png',
        sizes: '128x128',
        type: 'image/png',
      },
      {
        src: '/appicon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/appicon-256x256.png',
        sizes: '256x256',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/appicon-384x384.png',
        sizes: '384x384',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/appicon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/appicon-1024x1024.png',
        sizes: '1024x1024',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    start_url: startUrl,
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#ffffff',
    orientation: 'portrait',
    scope: '/',
    prefer_related_applications: false,
  };
}

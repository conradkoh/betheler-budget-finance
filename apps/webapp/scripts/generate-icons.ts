#!/usr/bin/env bun

/**
 * App Icon Generator
 *
 * Generates all PWA app icons from a 1024x1024 PNG source.
 * Optionally generates favicon.ico from the app icons (use --favicon flag).
 *
 * Usage:
 *   bun scripts/generate-icons.ts              # Generate app icons only
 *   bun scripts/generate-icons.ts --favicon    # Also generate favicon.ico
 *
 * Source: public/appicon-1024x1024.png
 * Output:
 *   - public/appicon-{size}x{size}.png (all sizes for PWA manifest)
 *   - src/app/favicon.ico (only with --favicon flag)
 *
 * Note: If you have a custom favicon design (different from app icon),
 * place it directly at src/app/favicon.ico and don't use --favicon flag.
 *
 * For complete documentation on PWA setup, see:
 * guides/pwa/pwa-setup.md
 */

import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import pngToIco from 'png-to-ico';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Icon sizes to generate (matching manifest.ts)
const SIZES = [16, 32, 64, 96, 128, 192, 256, 384, 512, 1024] as const;

// Paths
const SOURCE_FILE = join(__dirname, '../public/appicon-1024x1024.png');
const PUBLIC_DIR = join(__dirname, '../public');
const FAVICON_OUTPUT = join(__dirname, '../src/app/favicon.ico');

// Check for --favicon flag
const shouldGenerateFavicon = process.argv.includes('--favicon');

async function generateAppIcons(): Promise<boolean> {
  console.log('🎨 Generating app icons from appicon-1024x1024.png...\n');

  try {
    // Load the source image
    const sourceImage = sharp(SOURCE_FILE);
    const metadata = await sourceImage.metadata();

    // Verify source image dimensions
    if (metadata.width !== 1024 || metadata.height !== 1024) {
      console.warn(
        `⚠️  Warning: Source image is ${metadata.width}x${metadata.height}, expected 1024x1024`
      );
    }

    // Generate each size
    for (const size of SIZES) {
      const outputFile = join(PUBLIC_DIR, `appicon-${size}x${size}.png`);

      // Skip if output file is the same as source file
      if (outputFile === SOURCE_FILE) {
        console.log(`⏭️  Skipped appicon-${size}x${size}.png (source file)`);
        continue;
      }

      await sharp(SOURCE_FILE)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png()
        .toFile(outputFile);

      console.log(`✅ Generated appicon-${size}x${size}.png`);
    }

    return true;
  } catch (error) {
    console.error(
      '❌ Error generating app icons:',
      error instanceof Error ? error.message : String(error)
    );
    return false;
  }
}

async function generateFavicon(): Promise<boolean> {
  console.log('\n🔷 Generating favicon.ico...\n');

  try {
    // Use 16, 32, 64 pixel icons for the favicon
    const sizes = [16, 32, 64];
    const pngFiles = sizes.map((size) => join(PUBLIC_DIR, `appicon-${size}x${size}.png`));

    // Check if all PNG files exist
    for (const file of pngFiles) {
      if (!existsSync(file)) {
        console.error(`❌ PNG file not found: ${file}`);
        return false;
      }
    }

    // Read PNG files
    const pngBuffers = await Promise.all(pngFiles.map((file) => readFile(file)));

    // Create ICO file - handle ESM default export
    const icoFn = (pngToIco as { default?: typeof pngToIco }).default || pngToIco;
    const icoBuffer = await icoFn(pngBuffers);

    // Write ICO file to src/app/ (Next.js App Router convention)
    await writeFile(FAVICON_OUTPUT, icoBuffer);

    console.log(`✅ Generated favicon.ico at src/app/favicon.ico`);
    return true;
  } catch (error) {
    console.error(
      '❌ Error generating favicon:',
      error instanceof Error ? error.message : String(error)
    );
    return false;
  }
}

async function main(): Promise<void> {
  // Check if source file exists
  if (!existsSync(SOURCE_FILE)) {
    console.error('❌ Error: Source file not found at:', SOURCE_FILE);
    console.error('Please ensure appicon-1024x1024.png exists in the public directory.');
    process.exit(1);
  }

  console.log('📦 Icon Generator\n');
  console.log(`Source: ${SOURCE_FILE}\n`);

  // Generate app icons
  const iconsSuccess = await generateAppIcons();
  if (!iconsSuccess) {
    process.exit(1);
  }

  // Generate favicon only if --favicon flag is passed
  if (shouldGenerateFavicon) {
    const faviconSuccess = await generateFavicon();
    if (!faviconSuccess) {
      process.exit(1);
    }
  } else {
    console.log('\n💡 Tip: Use --favicon flag to also generate favicon.ico from app icons');
  }

  console.log('\n🎉 All icons generated successfully!');
  console.log('\nOutput:');
  console.log('  - public/appicon-*.png (PWA manifest icons)');
  if (shouldGenerateFavicon) {
    console.log('  - src/app/favicon.ico (browser favicon)');
  }
}

main();

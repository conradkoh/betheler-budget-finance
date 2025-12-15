#!/usr/bin/env bun

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Icon sizes to generate (matching manifest.ts)
const SIZES = [16, 32, 64, 96, 128, 192, 256, 384, 512, 1024] as const;

// Source and output paths
const SOURCE_FILE = join(__dirname, '../public/appicon-1024x1024.png');
const OUTPUT_DIR = join(__dirname, '../public');

async function generateIcons(): Promise<void> {
  // Check if source file exists
  if (!existsSync(SOURCE_FILE)) {
    console.error('❌ Error: Source file not found at:', SOURCE_FILE);
    console.error('Please ensure appicon-1024x1024.png exists in the public directory.');
    process.exit(1);
  }

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
      const outputFile = join(OUTPUT_DIR, `appicon-${size}x${size}.png`);

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

    console.log('\n🎉 All icons generated successfully!');
  } catch (error) {
    console.error(
      '❌ Error generating icons:',
      error instanceof Error ? error.message : String(error)
    );
    process.exit(1);
  }
}

generateIcons();

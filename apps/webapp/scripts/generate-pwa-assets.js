#!/usr/bin/env node

const fs = require('node:fs');
const { promises: fsPromises } = require('node:fs');
const path = require('node:path');

const pngToIco = require('png-to-ico');
const sharp = require('sharp');

/**
 * PWA Asset Generator
 *
 * This script generates all necessary PWA assets (icons and favicon) from a single SVG source.
 * It is part of the PWA setup for Next.js projects.
 *
 * For complete documentation on PWA setup, see:
 * guides/pwa/pwa-setup.md
 */

// Check required dependencies
try {
  require.resolve('sharp');
  require.resolve('png-to-ico');
} catch (_e) {
  console.error('Required packages are missing. Please install them using:');
  console.error('pnpm add -D sharp png-to-ico');
  process.exit(1);
}

const PUBLIC_DIR = path.join(__dirname, '../public');
const SVG_DIR = path.join(__dirname, '../public/svg-sources');
const DEFAULT_SVG = path.join(SVG_DIR, 'app-icon.svg');

// Ensure SVG sources directory exists
if (!fs.existsSync(SVG_DIR)) {
  fs.mkdirSync(SVG_DIR, { recursive: true });
}

// Ensure app icon SVG exists
if (!fs.existsSync(DEFAULT_SVG)) {
  console.error(`Source SVG not found: ${DEFAULT_SVG}`);
  console.error('Please create an SVG icon file at public/svg-sources/app-icon.svg');
  process.exit(1);
}

// Array of icon sizes
const SIZES = [16, 32, 64, 96, 128, 192, 256, 384, 512, 1024];

// Function to generate a PNG icon of a specific size
async function generateIcon(size) {
  const outputFile = path.join(PUBLIC_DIR, `appicon-${size}x${size}.png`);

  try {
    await sharp(DEFAULT_SVG).resize(size, size).png().toFile(outputFile);

    console.log(`Generated: ${outputFile}`);
    return true;
  } catch (error) {
    console.error(`Error generating ${size}x${size} icon:`, error);
    return false;
  }
}

// Generate favicon.ico from PNG files
async function generateFavicon() {
  try {
    // Array of PNG files to include in the favicon
    const pngFiles = [16, 32, 64].map((size) =>
      path.join(PUBLIC_DIR, `appicon-${size}x${size}.png`)
    );

    // Check if all PNG files exist
    for (const file of pngFiles) {
      if (!fs.existsSync(file)) {
        console.error(`PNG file not found: ${file}`);
        return false;
      }
    }

    // Read PNG files
    const pngBuffers = await Promise.all(pngFiles.map((file) => fsPromises.readFile(file)));

    // Create ICO file
    const icoBuffer = await pngToIco(pngBuffers);

    // Write ICO file
    await fsPromises.writeFile(path.join(PUBLIC_DIR, 'favicon.ico'), icoBuffer);

    console.log('Generated: favicon.ico');
    return true;
  } catch (error) {
    console.error('Error generating favicon.ico:', error);
    return false;
  }
}

// Main execution
async function main() {
  console.log('Generating PWA icons from SVG...');
  console.log(`Source: ${DEFAULT_SVG}`);

  // Create all icons
  const iconResults = await Promise.all(SIZES.map((size) => generateIcon(size)));

  if (iconResults.every(Boolean)) {
    console.log('\nAll icons generated successfully!');

    // Generate favicon.ico
    const faviconResult = await generateFavicon();

    if (faviconResult) {
      console.log('\n✅ All PWA assets generated successfully!');
    } else {
      console.error('\n❌ Failed to generate favicon.ico');
    }

    console.log('\nNext steps:');
    console.log('1. Verify the generated icons have good padding and appearance');
    console.log('2. If needed, edit the source SVG file at public/svg-sources/app-icon.svg');
    console.log('3. Run this script again to regenerate all assets');
  } else {
    console.error('\n❌ Some icons failed to generate. Check the errors above.');
  }
}

main().catch((err) => {
  console.error('Unhandled error:', err);
  process.exit(1);
});

# Branding Setup Guide

This guide explains how the automated branding setup works in the Next Convex Starter App.

## Overview

The setup script (`pnpm run setup`) includes an intelligent branding detection and configuration system that helps you customize your app's identity across all files.

## Features

### 🔍 Automatic Detection

The script automatically detects whether you're using template branding by checking for these default values:

- **App Name**: "Next Convex App"
- **Short Name**: "Next Convex"
- **Description**: "A Next.js app with Convex backend"
- **Package Name**: "next-convex-starter-app"
- **Landing Page Title**: "Convex + Next Starter App"

### 📋 Status Display

When you run `pnpm run setup`, you'll see a status report like this:

```
📋 Current Branding Status:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  TEMPLATE PWA Manifest
   apps/webapp/src/app/manifest.ts
⚠️  TEMPLATE App Layout (Title & Description)
   apps/webapp/src/app/layout.tsx
⚠️  TEMPLATE Navigation Header
   apps/webapp/src/components/Navigation.tsx
⚠️  TEMPLATE Landing Page
   apps/webapp/src/app/page.tsx
⚠️  TEMPLATE Package Name
   package.json
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 🎨 Interactive Setup

If template values are detected, the script will prompt you to customize:

1. **Full Application Name** - Used in PWA manifest and metadata
   - Example: "My Awesome App"
   - Default suggestion: "My Awesome App"

2. **Short Application Name** - Used in navigation header and PWA
   - Example: "My App"
   - Default: Truncated version of full name (max 15 chars)

3. **Application Description** - Used in metadata and PWA manifest
   - Example: "My Awesome App - Built with Next.js and Convex"
   - Default: Generated from app name

4. **Landing Page Title** - Displayed on the home page
   - Example: "Welcome to My Awesome App"
   - Default: Same as full app name

5. **Package Name** - Used in package.json
   - Example: "my-awesome-app"
   - Default: Lowercase, hyphenated version of app name

### 🔄 Idempotent Operation

The script is designed to be run multiple times safely:

- ✅ **Already configured** items show as "CONFIGURED"
- ⚠️ **Template values** show as "TEMPLATE"
- Only prompts for updates when template values are detected
- You can skip the branding setup and run it again later

## Files Updated

The branding setup automatically updates these files:

### 1. PWA Manifest (`apps/webapp/src/app/manifest.ts`)

```typescript
return {
  name: 'Your App Name',           // ← Updated
  short_name: 'Your App',          // ← Updated
  description: 'Your description', // ← Updated
  // ... rest of manifest
};
```

### 2. App Layout (`apps/webapp/src/app/layout.tsx`)

```typescript
export const metadata: Metadata = {
  title: 'Your App Name',              // ← Updated
  description: 'Your description',     // ← Updated
  appleWebApp: {
    title: 'Your App Name',            // ← Updated
  },
  applicationName: 'Your App Name',    // ← Updated
};
```

### 3. Navigation Header (`apps/webapp/src/components/Navigation.tsx`)

```tsx
<span className="font-bold text-lg">Your App</span>  {/* ← Updated */}
```

### 4. Landing Page (`apps/webapp/src/app/page.tsx`)

```tsx
<main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
  Your Landing Page Title  {/* ← Updated */}
</main>
```

### 5. Package Name (`package.json`)

```json
{
  "name": "your-app-name"  // ← Updated
}
```

## Usage Modes

### Interactive Mode (Default)

Run the setup script without any flags to use interactive mode with prompts:

```bash
pnpm run setup
```

### Non-Interactive Mode

For CI/CD pipelines or automated setups, use non-interactive mode:

```bash
# With full branding configuration
node scripts/setup.js --non-interactive \
  --app-name "My Awesome App" \
  --app-short-name "MyApp" \
  --app-description "My app description" \
  --landing-page-title "Welcome to My App" \
  --package-name "my-awesome-app"

# Skip branding setup entirely
node scripts/setup.js --skip-branding

# Non-interactive mode without branding options (skips branding)
node scripts/setup.js -y
```

### Command Line Options

```
--help, -h                    Show help message
--skip-branding               Skip branding setup entirely
--non-interactive, -y         Run in non-interactive mode
--app-name <name>             Full application name
--app-short-name <name>       Short application name
--app-description <desc>      Application description
--landing-page-title <title>  Landing page title
--package-name <name>         Package name (lowercase, hyphens)
```

## Usage Examples

### First Time Setup (Interactive)

```bash
$ pnpm run setup

🔍 Checking application branding...

📋 Current Branding Status:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  TEMPLATE PWA Manifest
   apps/webapp/src/app/manifest.ts
⚠️  TEMPLATE App Layout (Title & Description)
   apps/webapp/src/app/layout.tsx
...

Would you like to update the branding now? (yes/no) [yes]: yes

🎨 Branding Setup
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Let's customize your app branding. Press Enter to keep the suggested values.

Full application name (for PWA & metadata) [My Awesome App]: Task Manager Pro
Short application name (for navigation & PWA) [Task Manager P]: TaskPro
Application description [Task Manager Pro - Built with Next.js and Convex]: 
Landing page title [Task Manager Pro]: Welcome to TaskPro
Package name (lowercase, hyphens only) [task-manager-pro]: 

📝 Updating branding across all files...
✅ Updated PWA manifest
✅ Updated app layout metadata
✅ Updated navigation header
✅ Updated landing page
✅ Updated package.json

✅ Branding setup completed successfully!
```

### Subsequent Runs (Already Configured)

```bash
$ pnpm run setup

🔍 Checking application branding...

📋 Current Branding Status:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ CONFIGURED PWA Manifest
   apps/webapp/src/app/manifest.ts
✅ CONFIGURED App Layout (Title & Description)
   apps/webapp/src/app/layout.tsx
✅ CONFIGURED Navigation Header
   apps/webapp/src/components/Navigation.tsx
✅ CONFIGURED Landing Page
   apps/webapp/src/app/page.tsx
✅ CONFIGURED Package Name
   package.json
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ All branding appears to be configured!

[... continues with Convex setup ...]
```

### Skipping Branding Setup (Interactive)

```bash
Would you like to update the branding now? (yes/no) [yes]: no

⏭️  Skipping branding setup. You can run this script again later to configure branding.

[... continues with Convex setup ...]
```

### Non-Interactive Mode Example

```bash
$ node scripts/setup.js --non-interactive \
    --app-name "Task Manager Pro" \
    --app-short-name "TaskPro" \
    --app-description "Professional task management" \
    --landing-page-title "Welcome to TaskPro" \
    --package-name "task-manager-pro"

🚀 Starting project setup...

🔍 Checking application branding...

📋 Current Branding Status:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  TEMPLATE PWA Manifest
   apps/webapp/src/app/manifest.ts
...

🎨 Branding Setup
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Running in non-interactive mode...

Using provided branding options:
  App Name: Task Manager Pro
  Short Name: TaskPro
  Description: Professional task management
  Landing Page Title: Welcome to TaskPro
  Package Name: task-manager-pro

📝 Updating branding across all files...
✅ Updated PWA manifest
✅ Updated app layout metadata
✅ Updated navigation header
✅ Updated landing page
✅ Updated package.json

✅ Branding setup completed successfully!

[... continues with Convex setup ...]
```

### CI/CD Pipeline Example

```yaml
# .github/workflows/setup.yml
name: Setup Project
on: [push]

jobs:
  setup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Setup project with branding
        run: |
          node scripts/setup.js --non-interactive \
            --app-name "${{ vars.APP_NAME }}" \
            --app-short-name "${{ vars.APP_SHORT_NAME }}" \
            --app-description "${{ vars.APP_DESCRIPTION }}" \
            --landing-page-title "${{ vars.LANDING_TITLE }}" \
            --package-name "${{ vars.PACKAGE_NAME }}"
```

## Manual Branding Updates

If you prefer to update branding manually, you can edit the files directly:

1. **PWA Manifest**: `apps/webapp/src/app/manifest.ts`
2. **Layout Metadata**: `apps/webapp/src/app/layout.tsx`
3. **Navigation**: `apps/webapp/src/components/Navigation.tsx`
4. **Landing Page**: `apps/webapp/src/app/page.tsx`
5. **Package Name**: `package.json`

After manual updates, running `pnpm run setup` again will show them as "CONFIGURED".

## Tips

- **Use descriptive names**: Choose names that clearly represent your app's purpose
- **Keep short names concise**: The short name appears in the navigation header
- **Package names**: Use lowercase with hyphens only (npm naming convention)
- **Run multiple times**: The script is safe to run repeatedly
- **Skip if needed**: You can always skip and configure branding later

## Troubleshooting

### Script detects template values after manual update

Make sure you've replaced ALL occurrences of the template values. The script checks for exact matches.

### Want to reset branding

Simply replace your customized values with the template values and run the script again:

- "Next Convex App"
- "Next Convex"
- "A Next.js app with Convex backend"
- "next-convex-starter-app"
- "Convex + Next Starter App"

### Need to update just one file

You can manually edit individual files. The script will still show the overall status correctly on the next run.


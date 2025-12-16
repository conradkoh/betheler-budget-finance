#!/usr/bin/env node

const { execSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const readline = require('node:readline');

const backendEnvPath = path.join(__dirname, '..', 'services', 'backend', '.env.local');
const webappEnvPath = path.join(__dirname, '..', 'apps', 'webapp', '.env.local');

// Parse command line arguments
const args = process.argv.slice(2);
const cliArgs = {
  skipBranding: args.includes('--skip-branding'),
  nonInteractive: args.includes('--non-interactive') || args.includes('-y'),
  appName: getArgValue(args, '--app-name'),
  appShortName: getArgValue(args, '--app-short-name'),
  appDescription: getArgValue(args, '--app-description'),
  landingPageTitle: getArgValue(args, '--landing-page-title'),
  packageName: getArgValue(args, '--package-name'),
  help: args.includes('--help') || args.includes('-h'),
};

/**
 * Get the value of a command line argument
 */
function getArgValue(args, flag) {
  const index = args.indexOf(flag);
  if (index !== -1 && index + 1 < args.length) {
    return args[index + 1];
  }
  return null;
}

/**
 * Show help message
 */
function showHelp() {
  console.log(`
Usage: node scripts/setup.js [OPTIONS]

Setup script for Next Convex Starter App. Initializes Convex backend and
configures application branding.

OPTIONS:
  --help, -h                    Show this help message
  --skip-branding               Skip branding setup entirely
  --non-interactive, -y         Run in non-interactive mode (skip prompts)
  
  Branding Options (requires --non-interactive):
  --app-name <name>             Full application name
  --app-short-name <name>       Short application name (for navigation)
  --app-description <desc>      Application description
  --landing-page-title <title>  Landing page title
  --package-name <name>         Package name (lowercase, hyphens only)

EXAMPLES:
  # Interactive mode (default)
  node scripts/setup.js
  
  # Skip branding setup
  node scripts/setup.js --skip-branding
  
  # Non-interactive mode with branding
  node scripts/setup.js --non-interactive \\
    --app-name "My Awesome App" \\
    --app-short-name "MyApp" \\
    --app-description "My app description" \\
    --landing-page-title "Welcome to My App" \\
    --package-name "my-awesome-app"
  
  # Non-interactive mode, skip branding if already configured
  node scripts/setup.js -y

NOTES:
  - The script is idempotent and safe to run multiple times
  - In non-interactive mode without branding options, branding setup is skipped
  - Branding is only updated if template values are detected
`);
}

// Create readline interface for user interaction
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Branding configuration
const BRANDING_CONFIG = {
  // Template values to detect
  templates: {
    appName: 'Next Convex App',
    appShortName: 'Next Convex',
    appDescription: 'A Next.js app with Convex backend',
    packageName: 'next-convex-starter-app',
    landingPageTitle: 'Convex + Next Starter App',
  },
  // Files to check and update
  files: {
    manifest: path.join(__dirname, '..', 'apps', 'webapp', 'src', 'app', 'manifest.ts'),
    layout: path.join(__dirname, '..', 'apps', 'webapp', 'src', 'app', 'layout.tsx'),
    navigation: path.join(__dirname, '..', 'apps', 'webapp', 'src', 'components', 'Navigation.tsx'),
    landingPage: path.join(__dirname, '..', 'apps', 'webapp', 'src', 'app', 'page.tsx'),
    rootPackageJson: path.join(__dirname, '..', 'package.json'),
    webappPackageJson: path.join(__dirname, '..', 'apps', 'webapp', 'package.json'),
  },
};

/**
 * Run Convex init command to initialize the backend without starting dev server
 */
function initConvexDirect() {
  console.log('⚙️  Initializing Convex backend...');
  console.log('This will prompt you to log in to Convex and create a new project if needed.');

  try {
    // Run updated one-time convex setup command
    const result = spawnSync('npx', ['convex', 'dev', '--once'], {
      cwd: path.join(__dirname, '..', 'services', 'backend'),
      stdio: 'inherit',
    });

    if (result.status === 0) {
      console.log('✅ Backend initialization completed successfully.');
      return true;
    }
    console.error('❌ Backend initialization failed.');
    return false;
  } catch (error) {
    console.error('❌ Error initializing Convex backend:', error.message);
    return false;
  }
}

/**
 * Extract CONVEX_URL from .env.local in the backend directory
 */
function getConvexUrl() {
  if (!fs.existsSync(backendEnvPath)) {
    console.error('❌ Error: Backend .env.local file not found.');
    console.error('Please run the initialization command in the services/backend directory first.');
    process.exit(1);
  }

  const envContent = fs.readFileSync(backendEnvPath, 'utf8');
  const match = envContent.match(/CONVEX_URL=(.+)/);

  if (!match || !match[1]) {
    console.error('❌ Error: CONVEX_URL not found in the backend .env.local file.');
    process.exit(1);
  }

  return match[1].trim();
}

/**
 * Generate a random port number in the development best practices range
 * Range: 3000-9999 (avoiding system ports and staying within common dev range)
 */
function generateRandomPort() {
  const MIN_PORT = 3000;
  const MAX_PORT = 9999;
  return Math.floor(Math.random() * (MAX_PORT - MIN_PORT + 1)) + MIN_PORT;
}

/**
 * Update or add an environment variable in the env content
 */
function updateEnvVariable(envContent, key, value) {
  const regex = new RegExp(`^${key}=.+$`, 'm');
  if (regex.test(envContent)) {
    return envContent.replace(regex, `${key}=${value}`);
  }
  // Add the variable (with newline if content doesn't end with one)
  const separator = envContent && !envContent.endsWith('\n') ? '\n' : '';
  return `${envContent}${separator}${key}=${value}\n`;
}

/**
 * Create or update the webapp's .env.local file with the CONVEX_URL and PORT
 */
function setupWebappEnv(convexUrl) {
  // Create the webapp directory if it doesn't exist
  const webappEnvDir = path.dirname(webappEnvPath);
  if (!fs.existsSync(webappEnvDir)) {
    fs.mkdirSync(webappEnvDir, { recursive: true });
  }

  let envContent = '';

  // If the webapp .env.local already exists, read its content
  if (fs.existsSync(webappEnvPath)) {
    envContent = fs.readFileSync(webappEnvPath, 'utf8');
  }

  // Update or add the NEXT_PUBLIC_CONVEX_URL
  envContent = updateEnvVariable(envContent, 'NEXT_PUBLIC_CONVEX_URL', convexUrl);

  // Generate and set a random port if PORT is not already set
  if (!envContent.match(/^PORT=/m)) {
    const randomPort = generateRandomPort();
    envContent = updateEnvVariable(envContent, 'PORT', randomPort);
    console.log(`🔧 Generated random port: ${randomPort}`);
  } else {
    console.log('✅ PORT already configured in .env.local');
  }

  // Write the content to the webapp .env.local file
  fs.writeFileSync(webappEnvPath, envContent);
}

/**
 * Add upstream remote repository
 */
function addUpstreamRemote() {
  console.log('🔗 Checking for existing upstream remote repository...');
  try {
    const remotes = execSync('git remote -v').toString();
    if (remotes.includes('upstream')) {
      console.log('⚠️ Upstream remote already exists. Skipping this step.');
      return;
    }

    execSync('git remote add upstream https://github.com/conradkoh/next-convex-starter-app', {
      stdio: 'inherit',
    });
    console.log('✅ Upstream remote added successfully.');
  } catch (error) {
    console.error('❌ Error adding upstream remote:', error.message);
  }
}

/**
 * Prompt user for input with a default value
 */
function promptUser(question, defaultValue) {
  return new Promise((resolve) => {
    rl.question(`${question} [${defaultValue}]: `, (answer) => {
      resolve(answer.trim() || defaultValue);
    });
  });
}

/**
 * Check if a file contains template branding
 */
function checkFileBranding(filePath, searchStrings) {
  if (!fs.existsSync(filePath)) {
    return { exists: false, hasTemplate: false };
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const hasTemplate = searchStrings.some((str) => content.includes(str));

  return { exists: true, hasTemplate, content };
}

/**
 * Detect current branding status
 */
function detectBrandingStatus() {
  const status = {
    manifest: checkFileBranding(BRANDING_CONFIG.files.manifest, [
      BRANDING_CONFIG.templates.appName,
      BRANDING_CONFIG.templates.appShortName,
      BRANDING_CONFIG.templates.appDescription,
    ]),
    layout: checkFileBranding(BRANDING_CONFIG.files.layout, [
      BRANDING_CONFIG.templates.appName,
      BRANDING_CONFIG.templates.appDescription,
    ]),
    navigation: checkFileBranding(BRANDING_CONFIG.files.navigation, [
      BRANDING_CONFIG.templates.appShortName,
    ]),
    landingPage: checkFileBranding(BRANDING_CONFIG.files.landingPage, [
      BRANDING_CONFIG.templates.landingPageTitle,
    ]),
    rootPackageJson: checkFileBranding(BRANDING_CONFIG.files.rootPackageJson, [
      BRANDING_CONFIG.templates.packageName,
    ]),
  };

  return status;
}

/**
 * Display branding status
 */
function displayBrandingStatus(status) {
  console.log('\n📋 Current Branding Status:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const items = [
    {
      label: 'PWA Manifest',
      status: status.manifest,
      file: 'apps/webapp/src/app/manifest.ts',
    },
    {
      label: 'App Layout (Title & Description)',
      status: status.layout,
      file: 'apps/webapp/src/app/layout.tsx',
    },
    {
      label: 'Navigation Header',
      status: status.navigation,
      file: 'apps/webapp/src/components/Navigation.tsx',
    },
    {
      label: 'Landing Page',
      status: status.landingPage,
      file: 'apps/webapp/src/app/page.tsx',
    },
    {
      label: 'Package Name',
      status: status.rootPackageJson,
      file: 'package.json',
    },
  ];

  for (const item of items) {
    const statusIcon = item.status.hasTemplate ? '⚠️  TEMPLATE' : '✅ CONFIGURED';
    const statusColor = item.status.hasTemplate ? '\x1b[33m' : '\x1b[32m';
    const resetColor = '\x1b[0m';

    console.log(`${statusColor}${statusIcon}${resetColor} ${item.label}`);
    console.log(`   ${item.file}`);
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

/**
 * Check if any branding needs to be updated
 */
function needsBrandingUpdate(status) {
  return Object.values(status).some((s) => s.hasTemplate);
}

/**
 * Update manifest.ts file
 */
function updateManifest(appName, appShortName, appDescription) {
  const filePath = BRANDING_CONFIG.files.manifest;
  let content = fs.readFileSync(filePath, 'utf8');

  content = content.replace(/name: ['"].*?['"]/, `name: '${appName}'`);
  content = content.replace(/short_name: ['"].*?['"]/, `short_name: '${appShortName}'`);
  content = content.replace(/description: ['"].*?['"]/, `description: '${appDescription}'`);

  fs.writeFileSync(filePath, content);
}

/**
 * Update layout.tsx file
 */
function updateLayout(appName, appDescription) {
  const filePath = BRANDING_CONFIG.files.layout;
  let content = fs.readFileSync(filePath, 'utf8');

  // Update metadata title
  content = content.replace(/title: ['"].*?['"]/, `title: '${appName}'`);

  // Update metadata description
  content = content.replace(/description: ['"].*?['"]/, `description: '${appDescription}'`);

  // Update appleWebApp title
  content = content.replace(/appleWebApp:\s*\{[^}]*title: ['"].*?['"]/s, (match) =>
    match.replace(/title: ['"].*?['"]/, `title: '${appName}'`)
  );

  // Update applicationName
  content = content.replace(/applicationName: ['"].*?['"]/, `applicationName: '${appName}'`);

  fs.writeFileSync(filePath, content);
}

/**
 * Update Navigation.tsx file
 */
function updateNavigation(appShortName) {
  const filePath = BRANDING_CONFIG.files.navigation;
  let content = fs.readFileSync(filePath, 'utf8');

  // Update the navigation title
  content = content.replace(
    /<span className="font-bold text-lg">.*?<\/span>/,
    `<span className="font-bold text-lg">${appShortName}</span>`
  );

  fs.writeFileSync(filePath, content);
}

/**
 * Update landing page
 */
function updateLandingPage(landingPageTitle) {
  const filePath = BRANDING_CONFIG.files.landingPage;
  let content = fs.readFileSync(filePath, 'utf8');

  // Update the landing page title (looking for the text between <main> tags)
  content = content.replace(
    /(<main[^>]*>[\s\S]*?)\bConvex \+ Next Starter App\b/,
    `$1${landingPageTitle}`
  );

  fs.writeFileSync(filePath, content);
}

/**
 * Update package.json name
 */
function updatePackageJson(packageName) {
  const filePath = BRANDING_CONFIG.files.rootPackageJson;
  const packageJson = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  packageJson.name = packageName;

  fs.writeFileSync(filePath, JSON.stringify(packageJson, null, 2) + '\n');
}

/**
 * Perform branding setup
 */
async function setupBranding(nonInteractive = false, brandingOptions = {}) {
  console.log('\n🎨 Branding Setup');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  if (nonInteractive) {
    console.log('Running in non-interactive mode...\n');
  } else {
    console.log("Let's customize your app branding. Press Enter to keep the suggested values.\n");
  }

  // Gather branding information
  let appName;
  let appShortName;
  let appDescription;
  let landingPageTitle;
  let packageName;

  if (nonInteractive && brandingOptions.appName) {
    // Use provided options
    appName = brandingOptions.appName;
    appShortName =
      brandingOptions.appShortName || (appName.length > 15 ? appName.substring(0, 15) : appName);
    appDescription = brandingOptions.appDescription || `${appName} - Built with Next.js and Convex`;
    landingPageTitle = brandingOptions.landingPageTitle || appName;
    packageName =
      brandingOptions.packageName ||
      appName
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-');

    console.log('Using provided branding options:');
    console.log(`  App Name: ${appName}`);
    console.log(`  Short Name: ${appShortName}`);
    console.log(`  Description: ${appDescription}`);
    console.log(`  Landing Page Title: ${landingPageTitle}`);
    console.log(`  Package Name: ${packageName}\n`);
  } else if (nonInteractive) {
    console.log('⚠️  Non-interactive mode requires branding options.');
    console.log('   Skipping branding setup. Run with --help for usage.\n');
    return;
  } else {
    // Interactive mode
    appName = await promptUser('Full application name (for PWA & metadata)', 'My Awesome App');

    appShortName = await promptUser(
      'Short application name (for navigation & PWA)',
      appName.length > 15 ? appName.substring(0, 15) : appName
    );

    appDescription = await promptUser(
      'Application description',
      `${appName} - Built with Next.js and Convex`
    );

    landingPageTitle = await promptUser('Landing page title', appName);

    packageName = await promptUser(
      'Package name (lowercase, hyphens only)',
      appName
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
    );
  }

  console.log('\n📝 Updating branding across all files...');

  try {
    updateManifest(appName, appShortName, appDescription);
    console.log('✅ Updated PWA manifest');

    updateLayout(appName, appDescription);
    console.log('✅ Updated app layout metadata');

    updateNavigation(appShortName);
    console.log('✅ Updated navigation header');

    updateLandingPage(landingPageTitle);
    console.log('✅ Updated landing page');

    updatePackageJson(packageName);
    console.log('✅ Updated package.json');

    console.log('\n✅ Branding setup completed successfully!');
  } catch (error) {
    console.error('\n❌ Error updating branding:', error.message);
    throw error;
  }
}

/**
 * Check and prompt for branding updates
 */
async function checkBranding() {
  // Skip branding if requested
  if (cliArgs.skipBranding) {
    console.log('\n⏭️  Skipping branding setup (--skip-branding flag).\n');
    return;
  }

  console.log('\n🔍 Checking application branding...');

  const status = detectBrandingStatus();
  displayBrandingStatus(status);

  if (needsBrandingUpdate(status)) {
    if (cliArgs.nonInteractive) {
      // Non-interactive mode
      const brandingOptions = {
        appName: cliArgs.appName,
        appShortName: cliArgs.appShortName,
        appDescription: cliArgs.appDescription,
        landingPageTitle: cliArgs.landingPageTitle,
        packageName: cliArgs.packageName,
      };

      if (cliArgs.appName) {
        await setupBranding(true, brandingOptions);
      } else {
        console.log('\n⏭️  Non-interactive mode without branding options.');
        console.log('   Skipping branding setup. Run with --help for usage.\n');
      }
    } else {
      // Interactive mode
      const answer = await promptUser(
        '\nWould you like to update the branding now? (yes/no)',
        'yes'
      );

      if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
        await setupBranding();
      } else {
        console.log(
          '\n⏭️  Skipping branding setup. You can run this script again later to configure branding.'
        );
      }
    }
  } else {
    console.log('✅ All branding appears to be configured!\n');
  }
}

// Main function to run the setup
async function setup() {
  // Show help if requested
  if (cliArgs.help) {
    showHelp();
    process.exit(0);
  }

  console.log('🚀 Starting project setup...');

  // Check branding first (always run, idempotent)
  await checkBranding();

  // Check if backend .env.local already exists
  if (!fs.existsSync(backendEnvPath)) {
    // Run one-time initialization
    const success = initConvexDirect();
    if (!success) {
      console.error('Could not initialize Convex. Please try running the setup manually.');
      process.exit(1);
    }
  } else {
    console.log('✅ Backend .env.local already exists.');
  }

  // Add upstream remote repository
  addUpstreamRemote();

  // Disable Next.js telemetry
  console.log('🔧 Disabling Next.js telemetry...');
  try {
    execSync('pnpm exec next telemetry disable', {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..', 'apps', 'webapp'),
    });
    console.log('✅ Next.js telemetry disabled successfully.');
  } catch (error) {
    console.error('❌ Error disabling Next.js telemetry:', error.message);
  }

  // Continue with the rest of the setup
  continueSetup();
}

function continueSetup() {
  // Get the CONVEX_URL from the backend .env.local
  console.log('📄 Extracting CONVEX_URL from backend .env.local...');
  const convexUrl = getConvexUrl();
  console.log(`✅ Found CONVEX_URL: ${convexUrl}`);

  // Set up the webapp .env.local file
  console.log('📄 Setting up webapp .env.local file...');
  setupWebappEnv(convexUrl);
  console.log('✅ Webapp .env.local file created/updated successfully.');

  console.log('\n🎉 Setup completed successfully!');
  console.log('You can now run "pnpm run dev" to start both the frontend and backend services.');

  rl.close();
}

// Run the setup function
setup();

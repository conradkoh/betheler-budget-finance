#!/usr/bin/env node

const { execSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const readline = require('node:readline');

const backendEnvPath = path.join(__dirname, '..', 'services', 'backend', '.env.local');
const webappEnvPath = path.join(__dirname, '..', 'apps', 'webapp', '.env.local');

// Create readline interface for user interaction
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

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

// Main function to run the setup
function setup() {
  console.log('🚀 Starting project setup...');

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

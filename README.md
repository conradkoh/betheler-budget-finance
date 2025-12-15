# Bethel ER Budget & Finance

This is a budgeting and financial management application for Bethel ER, built using NextJS and Convex, managed with NX for monorepo capabilities.

## Getting Started

### Pre-requisites

- Node.js 22 or later
- pnpm package manager
- Convex account - Register at https://www.convex.dev/

### Setup

1. Run `pnpm install` to install the dependencies
2. Run `pnpm run setup` to initialize the Convex backend and configure the webapp

   This script will:

   - Initialize the Convex backend using `npx convex dev --once`
   - Extract the CONVEX_URL from the backend's .env.local file
   - Create/update the webapp's .env.local file with the NEXT_PUBLIC_CONVEX_URL

3. Run `pnpm dev` in the root directory to start the NextJS application and Convex backend

#### Manual Setup (Alternative)

If you prefer to set up manually:

1. Go to `services/backend` and run `npx convex dev --once` - this should prompt you to login to Convex and create a new project.
   Note: This will create a .env.local file with the CONVEX_URL environment variable.
2. Create a `.env.local` file in the `apps/webapp` directory and add the following:
   ```sh
   NEXT_PUBLIC_CONVEX_URL=<your-convex-project-url> # copy this from the backend .env.local file
   ```
3. Run `pnpm dev` in the root directory to start both services

## System Administration Setup

To create a system administrator:

1. **Login anonymously** via the login page
2. **Set admin privileges** in [Convex Dashboard](https://dashboard.convex.dev):
   - Go to Data > `users` table
   - Find your user record and set `accessLevel` to `"system_admin"`
3. **Access admin dashboard** by clicking your username → "System Admin"

System admins can configure Google OAuth, manage authentication providers, and access system settings.

## Google Auth Setup

To enable Google OAuth authentication:

1. **Configure Google OAuth** in your app's admin dashboard:
   - Login with your system admin account
   - Go to your username → "System Admin" → "Google Auth Config"
   - Follow the instructions to set up Google OAuth credentials
2. **Transfer admin role to Google account** (Recommended):
   - After Google Auth is configured, sign in with your Google account
   - In [Convex Dashboard](https://dashboard.convex.dev), go to Data > `users` table
   - Find your Google account user record and set `accessLevel` to `"system_admin"`
   - Remove the `system_admin` access level from the temporary anonymous account

This ensures your system admin access is tied to a verified Google account for better security.

## Project Structure

- `apps/webapp`: The frontend NextJS application
- `services/backend`: The Convex backend service

## Development

To run both the frontend and backend in parallel:

```bash
pnpm run dev
```

This will start:

- The webapp at http://localhost:3000
- The Convex backend development server

## Testing

This project uses [Vitest](https://vitest.dev/) for testing across both frontend and backend.

### Quick Start

Run all tests:

```bash
pnpm test
```

Run tests in watch mode:

```bash
pnpm test:watch
```

For comprehensive testing guidelines, conventions, and examples, see the [Testing Guide](guides/testing/testing.md).

## NX Configuration

This project uses NX to manage the monorepo and run tasks in parallel. The main configuration files are:

- `nx.json`: Main NX configuration
- `apps/webapp/project.json`: Webapp project configuration
- `services/backend/project.json`: Backend project configuration

The dev command is configured to run both services in parallel without dependencies between them, allowing for independent development.

## Adding New Projects

To add a new project to the monorepo:

1. Create the project in the appropriate directory (`apps/` or `services/`)
2. Add a `project.json` file to define the project's targets
3. Update the root `package.json` to include the new project in the dev command if needed

## Deployment

### Convex Backend Deployment

To deploy your Convex backend to production:

1. Generate a deployment key from the Convex dashboard:

   - Go to your project in the [Convex dashboard](https://dashboard.convex.dev)
   - Navigate to Settings > URL & Deploy Key
   - Create a new deployment key

2. Add the deployment key to GitHub Secrets:

   - Go to your GitHub repository
   - Navigate to Settings > Secrets and variables > Actions
   - Click "New repository secret"
   - Name: `CONVEX_DEPLOY_KEY_PROD`
   - Value: Your deployment key from the Convex dashboard

3. The GitHub Action workflow included in this template will handle deployment of your Convex backend automatically when you push to the main branch.

This setup allows for secure automated deployments of your Convex functions and schema without exposing your credentials.

### Vercel Frontend Deployment

To deploy your NextJS frontend to Vercel:

1. Navigate to your Convex dashboard:

   - Go to [Convex dashboard](https://dashboard.convex.dev)
   - Navigate to Settings > URL & Deploy Key
   - Copy the Deployment URL

2. Set up the Vercel deployment

   - Go to the Vercel dashboard
   - Navigate to Project Settings > Build and Deployment > Root Directory
     - Set the Root Directory to `apps/webapp`
   - Navigate to Project Settings > Environment Variables
     - Add a new variable:
     - Name: `NEXT_PUBLIC_CONVEX_URL`
     - Value: Paste the Deployment URL you copied from Convex

3. Deploy your NextJS application to Vercel as usual.

<br/>

# FAQ

## Why Convex?

Convex is chosen as the backend service for the following reasons:

1. **Simplicity of code generation and architecture**

   Convex follows a reactive paradigm that allows reactive queries from the client to cause automatic re-renders when a dataset has been updated. This significantly reduces complexity and amount of code required, while solving the problem of cache invalidation.

   Simple and less code required for a feature also means fewer chances for AI generated code to be incorrect.

2. **Transactionality and consistency**

   All convex mutations run "inside" of the database. Any error thrown in the mutation will result in an automatic rollback. This ensures that we are able to use a single language for both querying data and business logic, while maintaining transactionality.

3. **Simple end to end reactivity**

   Many platforms offer subscription to DB events (e.g. firebase, supabase). However, it still leaves a significant amount of code to transform the event into the actual state for your application. Convex solves this by simply providing the full state for the query's data, and does a re-render of that state when the data has been updated.

4. **Single language for frontend and backend**

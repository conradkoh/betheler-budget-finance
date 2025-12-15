# Next Convex Starter App - Project Map

## Project Overview

A full-stack web application starter template built with Next.js and Convex, featuring real-time capabilities, authentication, and modern development tools. The project includes functionality for presentations, discussions, attendance tracking, checklists, and user management with a monorepo structure managed by NX and pnpm workspaces.

## Project Structure

### Root Configuration Files

- `package.json` - Root workspace configuration with development scripts, dependencies, and workspace orchestration
- `pnpm-workspace.yaml` - pnpm workspace configuration defining packages in `apps/*` and `services/*`
- `nx.json` - NX monorepo configuration for task orchestration and caching
- `eslint.config.mjs` - ESLint configuration for linting with strict TypeScript, React, and Convex rules
- `biome.json` - Biome configuration for code formatting (linting disabled, ESLint handles that)
- `.github/` - GitHub workflows, issue templates, and project automation

### Root Scripts

- `scripts/setup.js` - Automated project setup script that initializes Convex backend and configures environment variables
- `scripts/generate-pwa-assets.js` - PWA asset generation for the webapp

### Documentation Structure

#### Knowledge Management Directories

- `docs/` - Project documentation and guides including account recovery procedures
- `guides/` - Development guides and procedures including MDX rendering, PWA setup, and code quality routines
- `codemaps/` - Feature-specific code documentation and architectural mappings
  - `templates/` - Templates for codemaps and projectmaps
- `.github/instructions/` - AI coding assistant instructions for backend, frontend, and general development
- `.github/prompts/` - Structured prompts for code generation and project management

### Frontend Application (`apps/webapp/`)

#### Configuration Files

- `package.json` - Frontend dependencies including Next.js 15.5.2, React 19, and UI libraries
- `next.config.ts` - Next.js configuration with MDX support, typed routes
- `tsconfig.json` - TypeScript configuration with path aliases and strict type checking
- `postcss.config.mjs` - PostCSS configuration for TailwindCSS processing
- `components.json` - Shadcn UI configuration with New York style and Lucide icons

#### Routes Structure (`src/app/`)

- `/` - Public homepage and landing page
- `/login/` - Authentication routes
  - `/login/[loginRequestId]/` - Dynamic login request handling
  - `/login/code/` - Authentication code verification
  - `/login/google/` - Google OAuth callback
- `/recover/` - Account recovery flow
- `/app/` - Protected routes requiring authentication
  - `/app/admin/` - System administration dashboard
  - `/app/profile/` - User profile management
- `/test/` - Development and testing routes
  - `/test/attendance/` - Attendance system testing
  - `/test/checklist/` - Checklist functionality testing
  - `/test/discussion/` - Discussion features testing
- `/api/` - API routes for server-side functionality
  - `/api/auth/` - Authentication API endpoints
  - `/api/test/` - Testing API endpoints

#### UI Components (`src/components/`)

##### Core Components

- `Navigation.tsx` - Main navigation component with authentication state
- `ThemeToggle.tsx` - Dark/light mode toggle with system preference support
- `UserMenu.tsx` - User profile dropdown and authentication controls
- `UnauthorizedPage.tsx` - Access denied page for protected routes
- `CallbackErrorCard.tsx` - Error handling for authentication callbacks
- `CallbackSuccessCard.tsx` - Success handling for authentication callbacks
- `DateRangePicker.tsx` - Date selection component with calendar integration
- `MdxLayout.tsx` - Layout wrapper for MDX content rendering

##### UI Library (`src/components/ui/`)

- Shadcn UI component system with comprehensive form controls, navigation, feedback, and layout components including Alert Dialog, Badge, Button, Calendar, Card, Checkbox, Dialog, Dropdown Menu, Input, Select, and more

#### Frontend Utilities (`src/lib/`)

- `utils.ts` - Utility functions including Tailwind class merging and common helpers

#### Frontend Modules (`src/modules/`)

- `admin/` - System administration functionality and user management
- `app/` - Core application features and shared functionality
- `attendance/` - Attendance tracking and management system
- `auth/` - Authentication components, forms, and session management
- `checklist/` - Checklist creation, management, and tracking features
- `discussion/` - Real-time discussion threads and messaging
- `password-protection/` - Content access control and password protection
- `presentation/` - Presentation management and real-time slide control
- `profile/` - User profile editing and account settings
- `theme/` - Theme management and dark mode implementation

#### Frontend Scripts

- `scripts/generate-pwa-assets.js` - Progressive Web App asset generation and optimization

### Backend Services (`services/backend/`)

#### Configuration Files

- `package.json` - Backend dependencies including Convex 1.26.2, convex-helpers, and Zod validation
- `tsconfig.json` - TypeScript configuration for backend with strict settings
- `vitest.config.mts` - Vitest testing framework configuration
- `test.setup.ts` - Testing environment setup and global test configuration

#### Backend Functions (`convex/`)

##### Core Functions

- `auth.ts` - Authentication system with session management and user creation
- `appinfo.ts` - Application metadata and version tracking
- `schema.ts` - Database schema definitions and table structures
- `migration.ts` - Database migration utilities and versioning

##### Feature Areas

- `attendance.ts` - Attendance tracking and session management functionality
- `checklists.ts` - Checklist creation, management, and item tracking
- `discussions.ts` - Real-time discussion threads with message management
- `presentations.ts` - Presentation state management and slide synchronization
- `serviceDesk.ts` - Support ticket and help desk functionality
- `cleanupTasks.ts` - Background tasks and data maintenance operations
- `crypto.ts` - Cryptographic utilities and secure token generation

##### Generated Files (`_generated/`)

- Auto-generated Convex API types, server interfaces, and data model definitions

#### Backend Configuration (`config/`)

- `featureFlags.ts` - Feature flag definitions and runtime configuration

#### Database Schema & Data Layer

- `schema.ts` - Comprehensive database schema with tables for users, sessions, presentations, discussions, checklists, attendance, and application metadata
- Data model definitions include user authentication, real-time collaboration, and content management entities

#### Repository Layers (`auth/`)

- `google.ts` - Google OAuth integration and authentication provider
- Authentication modules with access control and user management

#### Backend Modules (`modules/`)

- `auth/` - Authentication business logic and access control
  - `accessControl.ts` - Permission and authorization patterns
  - `codeUtils.ts` - Authentication code generation and validation utilities
  - `getAuthUser.ts` - User session and authentication state management
  - `types/` - Authentication-related type definitions

#### Backend Testing

- `auth.spec.ts` - Authentication system test suites
- `test.setup.ts` - Test environment configuration and mocking setup

## Monorepo Workspaces

### Workspace Configuration

- **Package Manager**: pnpm (v8+) with workspace support and dependency hoisting
- **Workspace Root**: `/` (project root)
- **Workspace Packages**:
  - `apps/*` - Frontend applications and user-facing services
  - `services/*` - Backend services and API implementations

### Entry Points

- **Frontend**: `apps/webapp/` → `@workspace/webapp`
- **Backend**: `services/backend/` → `@workspace/backend`

### Workspace Scripts

- `dev` - Parallel development server startup for both frontend and backend
- `setup` - Automated project initialization and environment configuration
- `lint` / `lint:fix` - Code quality linting using ESLint across all workspace packages
- `format` / `format:fix` - Code formatting using Biome across all packages
- `typecheck` - TypeScript validation across frontend and backend

## Tech Stack

### Package Manager

- **pnpm** (v8+) - Fast, disk-efficient package manager with workspace support
- **Workspace Feature**: Multi-package monorepo with shared dependencies and cross-package linking

### Frontend Framework

- **Next.js** (v15.5.2) - React framework with App Router, typed routes, and server-side rendering
- **React** (v19.1.0) - UI library with concurrent features and modern hooks
- **TypeScript** (v5.3.3) - Static type checking with strict configuration

### Frontend UI & Styling

- **TailwindCSS** (v4) - Utility-first CSS framework with CSS variables and dark mode
- **Shadcn UI** - Component library built on Radix UI primitives with New York style
- **Radix UI** - Accessible, unstyled UI primitives for complex components

### Backend Framework

- **Convex** (v1.26.2) - Serverless backend platform with real-time sync and built-in database
- **convex-helpers** (v0.1.104) - Utility library for authentication, sessions, and common patterns
- **Zod** (v4.0.5) - Schema validation library for runtime type checking

### Development Tools

- **NX** (v21.4.1) - Build system and monorepo orchestration with caching and task scheduling
- **Vite** (v6.3.5) - Build tool and development server for fast hot module replacement
- **Vitest** (v3.1.3) - Testing framework with TypeScript support and Vite integration

### Code Quality Tools

#### Linting

- **ESLint** (v9.26.0) - Code quality and correctness linting
  - TypeScript-specific rules via @typescript-eslint
  - React and React Hooks rules
  - Convex-specific rules via @convex-dev/eslint-plugin
  - Import organization and validation
  - Detects unused variables, type issues, and code smells

#### Formatting

- **Biome** (v2.1.2) - Fast, opinionated code formatter
  - Handles code style (indentation, quotes, semicolons, line width)
  - Organizes imports automatically
  - Linting disabled (ESLint handles all linting)
  - Formats TypeScript, JavaScript, JSON, and Markdown

#### Quality Automation

- **Husky** (v9.1.7) - Git hooks for pre-commit and pre-push quality checks
- **lint-staged** (v15.5.0) - Runs linting and formatting on staged files only
  - TypeScript/JavaScript: ESLint (lint) → Biome (format)
  - JSON/Markdown: Biome (format only)

### Authentication & Security

- **Google OAuth** - OAuth 2.0 authentication with Google provider integration
- **Session Management** - Custom session handling with convex-helpers and secure token generation

### Content Management

- **MDX** - Markdown with JSX support for documentation and content authoring
- **remark-gfm** - GitHub Flavored Markdown support for tables, strikethrough, and task lists

### Build & Deployment

- **Next.js Build System** - Production optimization with static generation and server-side rendering
- **Convex Deployment** - Serverless backend deployment with global edge distribution
- **PWA Features** - Progressive Web App capabilities with asset generation and caching

### Core Libraries & Dependencies

- **React Hook Form** - Form handling with validation and performance optimization
- **Luxon** - Date manipulation and formatting with timezone support
- **Lucide React** - Icon library with tree-shaking and consistent design
- **React Icons** - Additional icon sets from popular icon libraries
- **Sonner** - Toast notification system with animations and accessibility
- **next-themes** - Theme management with dark mode and system preference detection

### Third-Party Service Clients

- **Google OAuth Client** - Google authentication service integration
- **Convex Real-time Client** - WebSocket-based real-time data synchronization
- **Sharp** - Image optimization and processing for production builds

### Testing Strategy

- **Vitest** - Unit and integration testing with TypeScript support and fast execution
- **Frontend Testing** - Component testing patterns with React Testing Library integration
- **Backend Testing** - Convex function testing with convex-test utilities and mocking
- **Integration Testing** - End-to-end testing strategies for authentication and real-time features
- **Type Checking** - Compile-time validation with strict TypeScript configuration
- **Quality Gates** - Pre-commit hooks enforcing:
  - Linting (ESLint) - Code quality and correctness
  - Formatting (Biome) - Consistent code style
  - Type checking (TypeScript) - Type safety validation

## Development Patterns

### Authentication & Authorization

- **Session-based Auth** - Custom session management using convex-helpers with SessionIdArg pattern
- **Session Handling** - Frontend uses useSessionQuery, useSessionMutation, and useSessionAction hooks
- **Access Control** - Role-based permissions with system admin, user, and guest access levels

### Code Organization & Quality

- **Feature Modules** - Domain-driven organization with modules for each major feature area
- **Code Quality** - ESLint for linting (correctness, best practices, type safety)
- **Code Formatting** - Biome for consistent code style (indentation, quotes, spacing)
- **Configuration Management** - Feature flags system for runtime behavior control

### User Experience & Interface

- **Design System** - Consistent UI patterns using Shadcn components with Radix UI primitives
- **Responsive Design** - Mobile-first approach with TailwindCSS utility classes
- **Theme Management** - Dark/light mode with system preference detection and persistence

### Cross-Cutting Concerns

- **Error Handling** - Structured error management with user-friendly feedback
- **Real-time Updates** - Convex-powered real-time synchronization for collaborative features
- **Performance** - Optimized bundle splitting, image optimization, and caching strategies

## Architecture Patterns

### Full-Stack Real-time Architecture

- **Frontend Layer**: Next.js App Router with React components and Convex client integration
- **API Layer**: Convex functions providing queries, mutations, and actions with real-time sync
- **Data Layer**: Convex database with schema-defined tables and automatic indexing
- **Authentication Layer**: Session-based authentication with Google OAuth integration

### Monorepo Organization

- **Application Workspace**: Frontend applications with shared component libraries
- **Service Workspace**: Backend services with shared utilities and configurations
- **Shared Resources**: Cross-workspace type definitions, configuration files, and development tools

### Feature-Driven Development

- **Vertical Slicing**: Features implemented across all layers (frontend components, backend functions, database schema)
- **Module Boundaries**: Clear separation between feature modules with defined interfaces
- **Real-time Integration**: Collaborative features with live updates and conflict resolution

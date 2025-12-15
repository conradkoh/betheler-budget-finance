# [Project Name] - Project Map

## Project Overview

[Brief description of the project, its purpose, and main functionality]

## Project Structure

### Root Configuration Files

- `package.json` - [Description of root workspace configuration]
- `[workspace-config]` - [e.g., pnpm-workspace.yaml, nx.json, etc.]
- `[linting-config]` - [e.g., eslint.config.js, biome.json, etc.]
- `[other-config-files]` - [Additional configuration files and their purposes]

### Root Scripts

- `scripts/[script-name].js` - [Purpose and functionality]
- `[other-scripts]` - [Additional scripts and automation]

### Documentation Structure

#### Knowledge Management Directories

- `docs/` - [Project documentation and guides]
- `guides/` - [Development guides and procedures]
- `[config-docs]/` - [Configuration and setup documentation]
- `[other-docs]/` - [Additional documentation directories]

### Frontend Application (`[frontend-path]/`)

#### Configuration Files

- `package.json` - [Frontend dependencies and scripts]
- `[framework-config]` - [e.g., next.config.ts, vite.config.ts, etc.]
- `tsconfig.json` - [TypeScript configuration]
- `[styling-config]` - [e.g., postcss.config.mjs, tailwind.config.js, etc.]
- `[ui-config]` - [e.g., components.json for UI library]

#### Routes Structure (`[routes-path]/`)

- `/` - [Homepage and main entry point]
- `/[route-name]/` - [Route purpose and functionality]
  - `/[route-name]/[subroute]/` - [Nested route descriptions]
- `/[protected-routes]/` - [Authentication-required routes]
- `/[api-routes]/` - [API endpoints if applicable]

#### UI Components (`[components-path]/`)

##### Core Components

- `[ComponentName].tsx` - [Component purpose and functionality]
- `[AnotherComponent].tsx` - [Component purpose and functionality]

##### UI Library (`[ui-library-path]/`)

- [Description of UI component system and organization]

#### Frontend Utilities (`[utils-path]/`)

- `[utility-file].ts` - [Utility functions and helpers]

#### Frontend Modules (`[modules-path]/`)

- `[module-name]/` - [Module purpose and functionality]
- `[another-module]/` - [Module purpose and functionality]

#### Frontend Scripts

- `scripts/[script-name].js` - [Frontend-specific scripts]

### Backend Services (`[backend-path]/`)

#### Configuration Files

- `package.json` - [Backend dependencies and configuration]
- `tsconfig.json` - [TypeScript configuration for backend]
- `[test-config]` - [e.g., vitest.config.mts, jest.config.js]
- `[other-config]` - [Additional backend configuration]

#### Backend Functions (`[functions-path]/`)

##### Core Functions

- `[function-name].ts` - [Function purpose and API endpoints]
- `[another-function].ts` - [Function purpose and functionality]

##### [Feature Area] (`[feature-path]/`)

- `[feature-file].ts` - [Feature-specific functionality]

##### Generated Files (`[generated-path]/`)

- [Description of auto-generated files and their purpose]

#### Backend Configuration (`[config-path]/`)

- `[config-file].ts` - [Configuration purpose]

#### Database Schema & Data Layer

- `[schema-file].ts` - [Database schema definitions and table structures]
- `[data-models]/` - [Data model definitions and entity types]

#### Repository Layers (`[repository-path]/`)

- `[repository-name].ts` - [Data access patterns and repository implementations]
- `[data-access]/` - [Data access layer organization and abstractions]

#### Backend Modules (`[backend-modules-path]/`)

- `[module-name]/` - [Backend module organization]
  - `[module-file].ts` - [Module functionality]
  - `types/` - [Type definitions]

#### Backend Testing

- `[test-files].spec.ts` - [Test suites and coverage]
- `[test-config].ts` - [Test environment configuration]

## Monorepo Workspaces

### Workspace Configuration

- **Package Manager**: [Package manager name and version]
- **Workspace Root**: `/` (project root)
- **Workspace Packages**:
  - `[package-pattern]/*` - [Package type description]
  - `[another-pattern]/*` - [Another package type]

### Entry Points

- **[Service Type]**: `[path]/` → `[workspace-name]`
- **[Another Service]**: `[path]/` → `[workspace-name]`

### Workspace Scripts

- `[script-name]` - [Script purpose and functionality]
- `[another-script]` - [Script purpose and functionality]

## Tech Stack

### Package Manager

- **[Package Manager]** (v[version]+) - [Description and features]
- **[Workspace Feature]**: [Workspace configuration details]

### Frontend Framework

- **[Frontend Framework]** (v[version]+) - [Framework description]
- **[UI Library]** (v[version]+) - [UI library description]
- **[Language]** (v[version]+) - [Language and type system]

### Frontend UI & Styling

- **[UI System]** - [UI component system description]
- **[Component Library]** - [Component library details]
- **[CSS Framework/Tool]** - [Styling approach and tools]

### Backend Framework

- **[Backend Framework]** (v[version]+) - [Backend platform description]
- **[Backend Tools]** - [Additional backend tooling]
- **[Validation Library]** (v[version]+) - [Schema validation tools]

### Development Tools

- **[Build System]** (v[version]+) - [Build and task orchestration]
- **[Build Tool]** (v[version]+) - [Build tool and development server]
- **[Testing Framework]** (v[version]+) - [Testing approach]

### Linting & Formatting

- **[Linter/Formatter]** (v[version]+) - [Code quality tools]
- **[Additional Linting]** (v[version]+) - [Additional linting tools]
- **[Git Hooks]** (v[version]+) - [Pre-commit quality checks]
- **[Staged Files Tool]** (v[version]+) - [Staged file processing]

### Authentication & Security

- **[Auth Provider]** - [Authentication approach]
- **[Session Management]** - [Session handling system]

### Content Management

- **[Content System]** - [Content authoring and management]

### Build & Deployment

- **[Build System]** - [Production build approach]
- **[Deployment Platform]** - [Deployment strategy]
- **[App Features]** - [Progressive Web App or other app features]

### Core Libraries & Dependencies

- **[Form Library]** - [Form handling and validation approach]
- **[Date Library]** - [Date manipulation and formatting tools]
- **[State Management]** - [Application state management solution]
- **[HTTP Client]** - [API communication and data fetching]
- **[Utility Libraries]** - [Common utilities and helper functions]

### Third-Party Service Clients

- **[External API Client]** - [Third-party service integration and API clients]
- **[Payment Service]** - [Payment processing and financial service integrations]
- **[Email Service]** - [Email delivery and communication service clients]
- **[Analytics Service]** - [Analytics and tracking service integrations]
- **[Other External Services]** - [Additional third-party service clients and SDKs]

### Testing Strategy

- **[Testing Framework]** - [Testing approach and tools]
- **[Frontend Testing]** - [Frontend testing frameworks and approaches, or note gaps]
- **[Backend Testing]** - [Backend-specific testing utilities and patterns]
- **[Integration Testing]** - [Cross-layer testing strategies]
- **[Type Checking]** - [Type safety and compile-time validation]
- **[Quality Gates]** - [Automated checks and validation pipeline]

## Development Patterns

### Authentication & Authorization

- **[Auth Pattern]** - [Authentication flow and session management approach]
- **[Session Handling]** - [Session lifecycle and state management]
- **[Access Control]** - [Permission and authorization patterns]

### Code Organization & Quality

- **[Module Organization]** - [Code structure and dependency management patterns]
- **[Quality Maintenance]** - [Code quality routines and cleanup processes]
- **[Configuration Management]** - [Feature flags and environment configuration]

### User Experience & Interface

- **[Design System]** - [UI/UX patterns and design conventions]
- **[Responsive Design]** - [Multi-device and accessibility approaches]
- **[Theme Management]** - [Styling and theming patterns]

### Cross-Cutting Concerns

- **[Error Handling]** - [Error management and user feedback patterns]
- **[Logging & Monitoring]** - [Application observability approaches]
- **[Performance]** - [Optimization and performance patterns]

## Architecture Patterns

### [Architecture Style]

- **[Layer 1]**: [Description of architectural layer]
- **[Layer 2]**: [Description of architectural layer]
- **[Layer 3]**: [Description of architectural layer]
- **[Layer 4]**: [Description of architectural layer]

### [Organization Pattern]

- **[Organization Type 1]**: [Organization approach]
- **[Organization Type 2]**: [Organization approach]
- **[Shared Resources]**: [Shared utilities and configurations]

### [Additional Patterns]

- **[Pattern 1]**: [Implementation approach]
- **[Pattern 2]**: [Implementation approach]
- **[Pattern 3]**: [End-to-end integration approach]

# [Feature Name] Codemap

<!-- Replace [Feature Name] with actual feature name, e.g. "Budget Management", "User Authentication" -->

## Title

[Concise Feature Title]

<!-- e.g. "Budget Creation and Management", "User Profile Management" -->

## Description

[Brief description of what this flow accomplishes and its purpose]

<!-- e.g. "Allows users to create, view, edit, and delete personal budgets with category-based expense tracking" -->

## Sequence Diagram

```plantuml
[Insert PlantUML sequence diagram here]
```

<!--
Sequence diagram should show:
1. User interaction with the page component
2. Page component calling the service layer hook
3. Hook calling the backend function with typed parameters
4. Backend processing and database operations
5. Response flow back through the layers
6. UI update to reflect changes

Use format: [Actor] -> [Target] : functionName(params: ParamType): ReturnType
Include all major function calls between layers with exact parameter and return types from the codebase
Examples: useHook(): HookReturnType, apiCall(args: ArgsType): ResponseType
Show error handling paths if applicable
Demonstrate the complete user journey for this specific flow
-->

## Frontend Entry Point / Route

<!-- List the main entry points and routes for this specific flow -->

- `apps/webapp/src/app/[route]/page.tsx` - <!-- Main page component, e.g. budget/page.tsx, profile/page.tsx -->
  - **URL Parameters**: `[paramName]` - <!-- e.g. budgetId from /budget/[budgetId] -->
  - **Search Parameters**: `[searchParam]` - <!-- e.g. ?category=food&month=2024-01 -->
- `apps/webapp/src/app/[route]/layout.tsx` - <!-- Feature layout if needed -->
- `apps/webapp/src/app/[route]/[param]/page.tsx` - <!-- Dynamic routes if needed, e.g. budget/[id]/page.tsx -->
  - **URL Parameters**: `[paramName]` - <!-- List all dynamic route parameters -->

## Frontend Components

<!-- List UI components for this specific flow only -->

- `apps/webapp/src/components/[ComponentName].tsx` - <!-- Primary component, e.g. BudgetDashboard, UserProfile -->
- `apps/webapp/src/components/ui/[DialogName].tsx` - <!-- Modal/dialog components if needed -->
- `apps/webapp/src/components/[ListName].tsx` - <!-- List components if needed -->
- `apps/webapp/src/components/[FormName].tsx` - <!-- Form components if needed -->

## Frontend Service Layer

<!-- List hooks and services for this specific flow with key function interfaces -->

- `apps/webapp/src/modules/[feature]/hooks/use[Feature].ts` - <!-- Main data hook, e.g. useBudget, useProfile -->
  - **Functions**:
    ```typescript
    use[Feature](): [Feature]HookReturn
    [actionFunction](params: [Action]Params): Promise<[Action]Return>
    ```
    <!-- e.g. useBudget(): BudgetHookReturn, createBudget(params: CreateBudgetParams): Promise<BudgetReturn> -->
- `apps/webapp/src/modules/[feature]/types.ts` - <!-- Frontend type definitions -->

  ```typescript
  // Copy actual interface definitions from the codebase
  // Example from actual implementation:
  export interface FeatureHookReturn {
    data: Entity[] | undefined;
    loading: boolean;
    error: string | null;
  }

  export interface ActionParams {
    // Define parameters as they exist in code
  }

  export interface ActionReturn {
    // Define return type as it exists in code
  }
  ```

- `apps/webapp/src/modules/[feature]/utils/[utilName].ts` - <!-- Utility functions if needed -->
  - **Functions**:
    ```typescript
    [functionName](input: InputType): OutputType
    ```
    <!-- e.g. formatCurrency(amount: Amount): FormattedCurrency -->

## Backend Function Entry Point

<!-- List Convex functions for this specific flow with function interfaces -->

- `services/backend/convex/[feature].ts` - <!-- Main backend file, e.g. budget.ts, auth.ts -->
  - **Functions**:
    ```typescript
    [queryName](args: QueryArgs): QueryReturn
    [mutationName](args: MutationArgs): MutationReturn
    ```
    <!-- e.g. getBudget(args: GetBudgetArgs): BudgetReturn, createBudget(args: CreateBudgetArgs): Id<"budgets"> -->

### Contracts

<!-- Define the exact API contracts for this flow -->

```typescript
// Copy actual interface definitions from the codebase with source file comments
// From path/to/source/file.ts
export interface Entity {
  _id: Id<"tableName">;
  // Copy actual entity structure from code
}

export interface FunctionNameArgs {
  sessionId: string;
  // Copy actual function parameters from code
}

export interface FunctionNameReturn {
  // Copy actual function return type from code
}

// API Functions (copy actual signatures)
export const functionName = query({
  args: {
    sessionId: v.string(),
    // Copy actual args from implementation
  },
  handler: async (ctx, args): Promise<FunctionNameReturn> => {
    // Implementation exists
  },
});
```

## Backend Usecase Layer (Optional)

<!-- List usecase files if complex business logic exists -->

- `services/backend/modules/[feature]/usecases/[usecaseName].ts` - <!-- Specific usecase, e.g. createBudget.ts -->
  - **Functions**:
    ```typescript
    [usecaseFunction](params: I[Usecase]Params): I[Usecase]Return
    ```
    <!-- e.g. validateBudgetLimits(params: IValidateBudgetParams): IValidationResult -->

## Backend Entity Layer (Optional)

<!-- List entity/domain files if using domain-driven design -->

- `services/backend/modules/[feature]/entities/[EntityName].ts` - <!-- Domain model -->
  - **Functions**:
    ```typescript
    create[Entity](data: I[Create]Data): I[Entity]
    [entityMethod](): I[Method]Return
    ```
    <!-- e.g. createBudget(data: ICreateBudgetData): IBudget, isValid(): IValidationResult -->

## Backend Schema

<!-- Database schema definitions for this flow -->

- `services/backend/convex/schema.ts` - <!-- Schema definitions -->
  - `[tableName]` table definition
  - Relevant indexes

```typescript
// Schema Definition
interface I[Entity]Doc {
  // Define document structure (matches database)
}

[tableName]: defineTable({
  // Define table structure matching I[Entity]Doc
})
.index("by_[field]", ["[field]"])
```

## External Services (Optional)

<!-- List external service integrations if needed -->

- `services/backend/modules/[feature]/external/[serviceName].ts` - <!-- Third-party integration -->
  - **Functions**:
    ```typescript
    [serviceFunction](params: I[Service]Params): Promise<I[Service]Return>
    ```
    <!-- e.g. sendEmail(params: IEmailParams): Promise<IEmailResult> -->

## Utility Functions (Optional)

<!-- List utility functions specific to this flow -->

- `apps/webapp/src/modules/[feature]/utils/[utilName].ts` - <!-- Frontend utilities -->
  ```typescript
  [utilFunction](input: I[Input]): I[Output]
  ```
- `services/backend/modules/[feature]/utils/[utilName].ts` - <!-- Backend utilities -->
  ```typescript
  [utilFunction](input: I[Input]): I[Output]
  ```

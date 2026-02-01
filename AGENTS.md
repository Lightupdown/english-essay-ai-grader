# AGENTS.md

This file contains guidelines and commands for agentic coding agents working on this repository.

## Build, Lint, and Test Commands

### Development
```bash
npm run dev              # Start dev server on port 3000
npm run build           # Production build
npm run preview         # Preview production build
```

### Testing
This project currently has no test framework configured. Before adding tests, consult with the project maintainer about the preferred testing approach (Vitest, Jest, etc.).

## Testing Protocol (Self-Healing Mode)

After completing any frontend code modifications, you MUST:

1. **Start Dev Server**: If not running, execute `npm run dev` (or equivalent command)
2. **Access & Test**: Use `playwright_navigate` to visit http://localhost:3001
3. **Check for Errors**:
   - Use `playwright_console_messages` to retrieve browser console errors
   - Use `playwright_screenshot` to capture current state
4. **Auto-Fix**:
   - If errors are found (red console output), analyze the error message
   - Locate the specific file and make fixes
   - After fixing, re-execute steps 2-3 until console has no errors
5. **Report Results**: Briefly describe the testing process and fixes applied

Note: Maximum 3 loops. If still failing, pause and report to the user.

### Code Quality
No linting or type checking commands are currently configured. Agents should:
- Run `tsc --noEmit` manually to check TypeScript types before committing
- Follow the code style guidelines below consistently

## Project Structure

```
/                      # Root: Vite + React + TypeScript app
├── App.tsx           # Main application with routing (HashRouter)
├── types.ts          # Shared TypeScript interfaces and types
├── views/            # Page-level components (Home, Result)
├── components/       # Reusable UI components (Header, ScoreCard)
├── services/         # External API integrations (Gemini AI)
└── utils/            # Pure utility functions (localStorage)
```

## Code Style Guidelines

### General Principles
- Use functional components with hooks exclusively
- Prefer composition over inheritance
- Keep components focused and single-responsibility
- All external API calls go in `services/`
- Pure utility functions go in `utils/`

### Imports and Dependencies

#### Import Order
1. React and third-party libraries
2. Project components and utilities (use relative imports)

#### Import Style
```typescript
// Third-party libraries - named imports
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Project files - relative imports with @/ alias
import Home from './views/Home';
import { EssayRecord } from './types';
import * as storage from '../utils/storage';
```

#### Rules
- Use named imports for React hooks: `import { useState } from 'react'`
- Use namespace imports for utility modules: `import * as storage from '../utils/storage'`
- Use default imports for components: `import Header from '../components/Header'`
- Avoid default imports from utility libraries that export named exports

### TypeScript and Types

#### Type Definitions
- All types defined in `types.ts` at root level
- Use interfaces for object shapes, type aliases for primitives/unions
- Props interfaces named with `Props` suffix: `HomeProps`, `HeaderProps`

#### Component Types
```typescript
// Props interface above component
interface HomeProps {
  history: EssayRecord[];
  onRefresh: () => void;
}

// Functional component with FC type
const Home: React.FC<HomeProps> = ({ history, onRefresh }) => {
  // Component implementation
};
```

#### Type Annotations
- Always type function parameters and return values
- Use optional fields with `?` for nullable props
- Use union types for status fields: `status: 'analyzed' | 'pending'`

### Component Conventions

#### Component Structure
```typescript
const ComponentName: React.FC<PropsType> = ({ prop1, prop2 = default }) => {
  // 1. Hooks (useState, useEffect, useRef, useMemo)
  const [state, setState] = useState<Type>(initial);
  
  // 2. Derived state and computations
  const derived = useMemo(() => compute(state), [state]);
  
  // 3. Event handlers
  const handleClick = () => { /* ... */ };
  
  // 4. Effects
  useEffect(() => { /* ... */ }, [deps]);
  
  // 5. Render
  return <JSX />;
};

export default ComponentName;
```

#### Rules
- Destructure props in function signature with default values inline
- Default values in params, not in component body: `prop: string = "default"`
- Extract handlers to separate functions, inline only simple arrow functions
- Use `useMemo` for expensive computations and derived state
- Use `useRef` for DOM references and values that persist across renders

### Naming Conventions

- **Components**: PascalCase - `Home`, `Header`, `ScoreCard`
- **Functions/Variables**: camelCase - `handleFileChange`, `refreshHistory`, `selectedFile`
- **Constants**: UPPER_SNAKE_CASE for module-level constants - `STORAGE_KEY`, `ITEMS_PER_PAGE`
- **Interfaces**: PascalCase with `Props` suffix for component props - `HomeProps`, `HeaderProps`
- **Enums**: PascalCase - `IssueType`, `FeedbackType`
- **Files**: PascalCase for components (`.tsx`), kebab-case for utilities (`.ts`)

### Error Handling

#### Try-Catch Pattern
```typescript
try {
  const result = await riskyOperation();
  return result;
} catch (e) {
  // User-friendly error messages only
  alert('分析遇到了问题，请检查网络后重试');
  // Log actual error for debugging
  console.error('Operation failed:', e);
  throw e; // or return fallback value
}
```

#### Rules
- Always catch errors from async operations
- Show user-friendly alerts, not stack traces
- Use console.error for debugging
- Provide fallback values when appropriate
- Handle null/undefined returns with optional chaining

### Styling with Tailwind CSS

#### Pattern
```tsx
<div className="base-classes hover:classes conditional-classes">
```

#### Rules
- Use utility classes exclusively, no custom CSS in components
- Keep className strings on a single line unless very long
- Use template literals for conditional classes: `${condition ? 'class-a' : 'class-b'}`
- Follow existing color palette (indigo-600, slate-900, emerald-500, rose-500)
- Use rounded-[value] for custom border radius: `rounded-[2.5rem]`, `rounded-xl`
- Maintain consistent spacing and sizing patterns

#### Common Utility Classes
- Layout: `flex`, `flex-col`, `grid`, `gap-x`
- Spacing: `p-6`, `py-4`, `mt-2`, `gap-8`
- Typography: `text-xl`, `font-bold`, `text-slate-900`
- States: `hover:`, `disabled:`, `group-hover:`
- Transitions: `transition-all`, `duration-500`, `ease-out`

### State Management

#### useState Pattern
```typescript
const [state, setState] = useState<Type>(initial);
```

#### Rules
- Always type state initial values
- Use primitives over complex objects when possible
- Derive state with `useMemo` instead of storing computed values
- Batch state updates when multiple related changes occur
- Use functional updates for derived state: `setCount(prev => prev + 1)`

### API and Services

#### Service Function Pattern
```typescript
// Export named async function
export const functionName = async (params: Type): Promise<ReturnType> => {
  // API call
  const response = await api.call(params);
  
  // Parse/transform response
  const data = transform(response);
  
  // Return typed result
  return data;
};
```

#### Rules
- All API calls in `services/` directory
- Use async/await, not raw promises
- Type all parameters and return values
- Export named functions, not default exports
- Handle errors at the service boundary

### Hooks and Effects

#### useEffect Rules
```typescript
// Mount or dependency changes
useEffect(() => {
  // Effect logic
  return () => {
    // Cleanup
  };
}, [deps]); // Always include all dependencies
```

- Always include all dependencies in the dependency array
- Return cleanup functions for subscriptions, timers, etc.
- Use useEffect for side effects only
- Separate concerns into multiple useEffects when needed

### File Organization

#### New Component
1. Create file in appropriate directory (`components/` for reusable, `views/` for pages)
2. Export default component at bottom
3. Keep component focused and under 300 lines if possible
4. Import from `@/` alias with relative paths

#### New Type
1. Add to `types.ts` if shared across components
2. Define within component file if component-specific only
3. Use descriptive names matching domain concepts

### Environment Configuration

This project uses environment variables for API keys:

**Backend (backend/.env):**
- `PORT` - Server port (default: 5000)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT secret for authentication
- `ZHIPU_API_KEY` - Zhipu AI API key (智谱AI)
- `DEEPSEEK_API_KEY` - DeepSeek API key

**Frontend (.env.local):**
- No API keys needed (all API calls go through backend)

Access via `process.env.VARIABLE_NAME` in backend code.

### React Router

- Uses `HashRouter` for client-side routing
- Define routes in `App.tsx`
- Use `useNavigate` hook for navigation
- Use `useParams` for route parameters

### Additional Notes

- No comments required unless explaining complex logic
- Prefer explicit code over comments
- Follow existing code patterns in the repository
- Keep component props minimal - pass objects if many related props
- Use TypeScript strict mode - avoid `any` type
- Prefer null over undefined for missing values

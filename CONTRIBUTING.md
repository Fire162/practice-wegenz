# Contributing to Wegenz Infinite Practice

Thank you for your interest in contributing to **Wegenz Infinite Practice**!

## Development Workflow

1. Fork or clone the repository:
   ```bash
   git clone https://github.com/Fire162/practice-wegenz.git
   cd practice-wegenz
   ```
2. Install dependencies using **pnpm**:
   ```bash
   pnpm install
   ```
3. Start local development server:
   ```bash
   pnpm run dev
   ```
4. Run static checks and type validation:
   ```bash
   pnpm run typecheck
   ```
5. Verify production compilation:
   ```bash
   pnpm run build
   ```

## Coding Standards

- Prefer clean, readable, maintainable TypeScript and React 19 components.
- Avoid introducing unnecessary heavy external dependencies.
- Ensure all mathematical and scientific expressions are properly formatted for KaTeX rendering.
- Keep components focused and reusable.

## Submitting Changes

- Create a feature or fix branch from `main`.
- Write concise, meaningful commit messages.
- Open a Pull Request clearly describing the changes made and any verification steps performed.

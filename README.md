# LINQ Relationship OS Monorepo

This repository contains the early MVP for the LINQ Relationship OS built with a Turborepo-based monorepo. It includes a Next.js web application, shared UI components, shared configuration, and a Prisma/PostgreSQL data layer.

## Project Structure

```
apps/
  web/            # Next.js 14 application (App Router)
packages/
  ui/             # Shared shadcn/ui-inspired component library
  config/         # Shared ESLint and TypeScript configuration
  db/             # Prisma schema and database scripts
```

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database URL available as `DATABASE_URL` in your environment

### 로컬 실행 방법

1. **Install dependencies and generate the Prisma client**
   ```bash
   npm run setup
   ```

2. **Start the development servers**
   ```bash
   npm run dev
   ```
   This runs all dev targets in parallel (e.g. `next dev`).

3. **Run type checks & linting**
   ```bash
   npm run lint
   ```

4. **Execute tests**
   ```bash
   npm run test
   ```

5. **Create a production build**
   ```bash
   npm run build
   ```

### Database Migrations

Prisma migrations can be managed from `packages/db`. For example, to create a new migration:

```bash
cd packages/db
npx prisma migrate dev --name your_migration_name
```

Ensure the `DATABASE_URL` environment variable is set before running Prisma commands.

## Tooling

- **Next.js 14 App Router** for the web application
- **Tailwind CSS + shadcn/ui** for styling
- **Prisma** for database access
- **ESLint, Prettier, Vitest** for linting, formatting, and testing
- **Turborepo** for task orchestration across packages

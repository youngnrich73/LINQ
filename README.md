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
- Supabase project with Authentication enabled (see instructions below)

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

## Supabase Authentication Configuration

This project uses Supabase Auth with Google as the social provider. Complete the steps below before attempting to sign in:

1. **Configure environment variables** – copy `apps/web/.env.local.example` to `apps/web/.env.local` and fill in the values:
   ```bash
   cp apps/web/.env.local.example apps/web/.env.local
   ```
   | Variable | Description |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (e.g. `https://<project-ref>.supabase.co`). |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public API key. |
   | `NEXT_PUBLIC_SITE_URL` | Base URL of the Next.js app (e.g. `http://localhost:3000`). |
   | `GOOGLE_CLIENT_ID` | OAuth 2.0 client ID from Google Cloud Console. |
   | `GOOGLE_CLIENT_SECRET` | Matching OAuth client secret. |

2. **Enable Google provider in Supabase Dashboard** – navigate to **Authentication → Providers → Google** and paste the client ID and secret. Make sure to add the redirect URLs:
   - Local development: `http://localhost:3000/auth/callback`
   - Production: `https://your-domain.com/auth/callback`

3. **Authorize your domains** – under **Authentication → URL Configuration** add:
   - `http://localhost:3000`
   - Your production domain (e.g. `https://your-domain.com`)

After saving these settings, restart the Next.js dev server so the environment variables are picked up. Clicking **Log in with Google** on `/login` will now complete the OAuth flow and create a Supabase session for the app.

## Tooling

- **Next.js 14 App Router** for the web application
- **Tailwind CSS + shadcn/ui** for styling
- **Prisma** for database access
- **ESLint, Prettier, Vitest** for linting, formatting, and testing
- **Turborepo** for task orchestration across packages

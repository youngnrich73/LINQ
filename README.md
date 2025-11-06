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

2. **Configure environment variables**
   - Copy the example environment file and populate it with your own values:
     ```bash
     cp apps/web/.env.example apps/web/.env.local
     ```
   - Create a [Supabase](https://supabase.com/) project and copy the project's URL and anon key into
     `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
   - Generate a service role key from the Supabase dashboard and set `SUPABASE_SERVICE_ROLE_KEY`. Keep this value secret
     and never expose it to the browser. If you prefer not to use the service role key locally, set `SUPABASE_ANON_KEY`
     (or rely on `NEXT_PUBLIC_SUPABASE_ANON_KEY`) so the server can still send magic links.
   - In Supabase Authentication settings, add `http://localhost:3000/api/auth/callback` (or your deployed domain) to the
     list of redirect URLs so magic links can return to the app.
   - Set `NEXT_PUBLIC_APP_URL` to the URL where the app runs and provide secure values for `AUTH_SECRET` and
     `DATABASE_URL`.

### Authentication environment variables

| Variable | Purpose | Scope |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Base URL of your Supabase project used by the browser and server. | Public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key used by the client to talk to Supabase Auth. | Public |
| `SUPABASE_ANON_KEY` | Optional server-side anon key. Set if you do not want to reuse the public key on the server. | Server |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional service role key for administrative tasks. Required only for endpoints that need elevated Supabase access. | Server (secret) |
| `NEXT_PUBLIC_APP_URL` | Fully-qualified origin of your deployment (e.g. `https://your-app.vercel.app`). Used to build redirect URLs. | Public |
| `AUTH_SECRET` | Secret string for signing LINQ session cookies. | Server (secret) |

### Google OAuth configuration

- Enable the Google provider inside Supabase Authentication and supply the Google client ID and secret in the Supabase dashboard.
- Ensure `NEXT_PUBLIC_APP_URL` matches the production domain (e.g. the Vercel deployment) so Supabase can redirect back to `/api/auth/callback`.
- Add the production callback URL (`https://your-domain/api/auth/callback`) to both Supabase and the Google Cloud console allowed redirect URL lists.

3. **Start the development servers**
   ```bash
   npm run dev
   ```
   This runs all dev targets in parallel (e.g. `next dev`).

4. **Run type checks & linting**
   ```bash
   npm run lint
   ```

5. **Execute tests**
   ```bash
   npm run test
   ```

6. **Create a production build**
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

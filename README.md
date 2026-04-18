# Logly

AI-powered changelog generator for GitHub repositories.

## Overview

Logly automatically generates beautiful changelogs from your GitHub commits using AI. It extracts commit messages, groups them by type, and creates well-formatted release notes.

## Tech Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS, Radix UI
- **Backend**: NestJS, Drizzle ORM
- **Database**: PostgreSQL (Supabase)
- **AI**: Mistral API
- **Monorepo**: Turborepo

## Project Structure

```
logly/
├── apps/
│   ├── api/         # NestJS backend API
│   ├── web/         # Next.js frontend
│   └── docs/        # Documentation site
└── packages/
    ├── ui/          # Shared UI components
    ├── eslint-config/
    └── typescript-config/
```

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 9.0+
- PostgreSQL database

### Installation

```bash
# Install dependencies
pnpm install
```

### Development

```bash
# Run all apps in development mode
pnpm dev

# Run specific app
pnpm --filter=web dev
pnpm --filter=api dev
```

### Build

```bash
# Build all apps
pnpm build
```

## Environment Variables

### Backend (apps/api/.env)

```
DATABASE_URL=postgresql://...
MISTRAL_API_KEY=...
ENCRYPTION_SECRET=...
PORT=3001
LOGLY_BASE_URL=http://localhost:3000
VERCEL_TOKEN=...
VERCEL_PROJECT_ID=...
VERCEL_TEAM_ID=... # optional
```

### Frontend (apps/web/.env.local)

```
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_BASE_DOMAIN=localhost:3000
```

## API Documentation

When running locally, API documentation is available at: `http://localhost:3001/api/docs`

## License

MIT License - see LICENSE file for details.

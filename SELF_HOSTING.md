# Self-Hosting Guide

This guide covers how to deploy your own instance of Logly.

## Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/loglyhq/logly.git
cd logly
pnpm install
```

### 2. Configure Environment

Create `apps/api/.env`:

```bash
# Required
DATABASE_URL=postgresql://user:password@localhost:5432/logly
MISTRAL_API_KEY=your-mistral-api-key
ENCRYPTION_SECRET=$(openssl rand -base64 32)

# App Config
LOGLY_BASE_URL=https://your-domain.com
PORT=3001
```

Create `apps/web/.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_BASE_DOMAIN=localhost:3000
```

### 3. Run

```bash
# Development
pnpm dev

# Production Build
pnpm build
```

## Deployment Options

### Vercel (Recommended)

1. Deploy `apps/api` to Vercel
2. Deploy `apps/web` to Vercel
3. Set environment variables in Vercel dashboard

### Docker (Coming Soon)

### Railway, Render, etc.

Deploy both apps as separate services with the same environment variables.

## Database Setup

Logly uses PostgreSQL with Drizzle ORM. Set up your PostgreSQL database and provide the connection string in `DATABASE_URL`.

Required tables will be created automatically on first run.

## Custom Domain

See [Custom Domains & Export](/docs/custom-domains) for hosting your changelog on your own domain.

## Support

- GitHub Issues: https://github.com/loglyhq/logly/issues
- Discussions: https://github.com/loglyhq/logly/discussions
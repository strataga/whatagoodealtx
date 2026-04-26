# What A Good Deal TX - Agent Guide

Vintage retail website for antiques, collectibles, and local business presence. The global Codex playbook applies; this file captures project-specific defaults.

## Project Shape

- Monorepo managed with Turborepo.
- Web app: Next.js 14 App Router, TypeScript, and React.
- Integrations include Resend and Instagram content.
- Deployment preference: Railway.
- Package manager: `package.json` pins `pnpm@9.0.0`; use pnpm even if older README commands mention npm.

## Common Commands

- `pnpm install`
- `pnpm dev`
- `pnpm build`
- `pnpm lint`

## Working Rules

- Preserve the vintage/local-shop brand feel while keeping the site fast, accessible, and easy to update.
- Treat product, event, contact, and business-hours content as user-facing business truth. Do not invent facts.
- Do not send real email through Resend, mutate production env vars, or deploy to Railway without explicit approval.
- Instagram/API integrations should degrade gracefully with cached or fallback content when external services are unavailable.
- Keep SEO metadata, structured data, and local-business discoverability healthy when changing pages.

## Verification

- Run the narrowest relevant pnpm script first, then `pnpm build` for route or config changes.
- For email/contact changes, use test/local paths and redact secrets from all output.

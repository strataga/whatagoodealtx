# WhataGoodealTX

A responsive vintage storefront and read-only shopping hub for the WhataGoodealTX eBay and Whatnot shops.

## Stack

- Turborepo monorepo
- Next.js 15 App Router with React and TypeScript
- Build-generated SQLite catalog via `better-sqlite3`
- Standards-compliant CSV parsing via `csv-parse`
- Railway deployment target

Use the exact pnpm version pinned in `package.json`.

```bash
pnpm install
pnpm dev
pnpm lint
pnpm build
```

## Catalog

The storefront catalog is generated from `apps/web/data/ebay-listings.csv` and the tracked, sanitized `apps/web/data/catalog-media.json` snapshot. Runtime pages open only the ignored, generated `apps/web/data/catalog.sqlite` database in read-only mode.

```bash
# Read-only eBay/ListBlaze sync; updates only the sanitized public snapshot.
pnpm catalog:sync

# Validate the CSV and atomically regenerate the local SQLite database.
pnpm catalog:build

# Run importer, provider-fixture, and catalog-query tests.
pnpm test:catalog
```

`catalog:sync` defaults to the ListBlaze database under macOS Application Support and `/Users/jason/projects/ebay-inserter/.env.local`. Use `--database` or `--env-file` to override those paths. Credentials are loaded only in memory; sync must never print them, modify ListBlaze, or mutate an eBay listing.

`pnpm build` runs `catalog:build` automatically. The generated database is ignored by Git and declared as a Turborepo build output.

## Content boundaries

- Purchases and checkout occur on eBay or Whatnot, not this website.
- Contact remains a direct email link; the unused public contact API and Resend dependency were removed.
- Legacy slideshow and mockup assets are preserved for rollback but are not rendered.
- Do not deploy to Railway or mutate production configuration without explicit approval.

# WhataGoodealTX web app

Next.js 15 App Router storefront for WhataGoodealTX. The homepage introduces the eBay and Whatnot shops; `/shop` queries a build-generated SQLite snapshot and sends customers to eBay for listing details and checkout.

Use the exact pnpm version pinned by the repository root.

```bash
pnpm install
pnpm --filter @whatagooddeal/web dev
```

## Catalog workflow

Run these commands from the repository root:

```bash
pnpm catalog:sync   # read-only provider/ListBlaze sync
pnpm catalog:build  # CSV + sanitized snapshot -> local SQLite
pnpm test:catalog
```

The generated `data/catalog.sqlite` file is ignored and opened read-only at runtime. `catalog:sync` may update only `data/catalog-media.json`; it must never modify ListBlaze or a live eBay listing.

## Verification

```bash
pnpm test:catalog
pnpm lint
pnpm build
git diff --check
```

`pnpm build` invokes catalog generation through `prebuild` and must finish with `/shop` reported as a dynamic server-rendered route. Contact is a direct email link; there is no public contact-mail API.

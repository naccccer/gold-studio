# Ovala Architecture

## Current Shape
- Single Next.js App Router repo.
- TypeScript and Tailwind.
- Prisma with MySQL.
- Prisma client generated to `src/generated/prisma`.
- Signed cookie auth with role-based admin access.
- Liara OpenAI-compatible image generation boundary.
- Local filesystem storage by default, optional S3-compatible storage.
- Local uploads under `public/uploads` are deployment data, not source, and are intentionally excluded from Git.

## Product Boundaries
- `ProductAsset`: uploaded source product photos owned by Gallery.
- `AssetCollection`: optional organization for source assets.
- `Project`: generated outputs, status, result image, retry/review/archive lifecycle.
- `GenerationBatch` and `GenerationBatchItem`: multi-source generation grouping.
- `CreativeStyle`, categories, variants, and controls: admin-managed style catalog.
- Billing models: packages, purchase requests, subscriptions, and credit events.
- Support models: FAQ, support settings, tickets, and ticket messages.
- Operational logs: admin audit events and provider events.

## Folder Boundaries
- Routes live in `src/app`.
- Shared UI lives in `src/components`.
- Feature code lives in `src/features`.
- Shared logic lives in `src/lib`.
- AI logic stays in `src/lib/ai`.
- Database schema and migrations live in `prisma`.
- Docs live in `docs`.

## Runtime Boundaries
- Sensitive operations stay server-side.
- Owner-scoped reads/writes are required for user assets, batches, projects, purchases, and support.
- Admin routes are separate from user routes and must not leak admin-only controls into normal user flows.
- Prompt-heavy and text-to-image controls stay admin/internal.
- Storage display should prefer storage-key-derived URLs when available.
- S3-compatible storage is optional and should be enabled only as an intentional deployment change.

## UI Architecture
- Route files stay thin.
- Screen components own composition.
- Business logic does not move into UI components.
- Navigation definitions should stay centralized and inspectable.
- Gallery source asset UI should stay separate from generated Project review UI where practical.

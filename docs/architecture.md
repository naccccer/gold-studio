# Gold Studio Architecture

## Current Shape
- Single Next.js App Router repo.
- TypeScript.
- Tailwind CSS.
- Prisma with MySQL.
- GapGPT OpenAI-compatible image API.
- Local filesystem upload storage for current MVP.

## Product Boundaries
- Gallery source assets are represented by `ProductAsset`.
- Optional source organization is represented by `AssetCollection`.
- Generated outputs are represented by `Project`.
- Batch generation is represented by `GenerationBatch` and `GenerationBatchItem`.
- Existing projects can still rely on `sourceImageUrl` without `sourceAssetId`.

## Folder Boundaries
- Routes live in `src/app`.
- Shared UI lives in `src/components`.
- Feature code lives in `src/features`.
- Shared logic lives in `src/lib`.
- AI logic stays in `src/lib/ai`.
- Database schema and migrations live in `prisma`.

## Preserved Contracts
- Signed cookie auth.
- Admin role redirect behavior.
- Owner-scoped project, asset, and batch reads.
- Server-side sensitive operations.
- Existing GapGPT boundary until intentionally migrated.

## Planned Architecture
- Style catalog as Prisma/MySQL records.
- DB-backed generation jobs before external queues.
- Storage adapter with local dev and S3-compatible production support.
- Provider-agnostic billing/access boundary for an Iran-friendly gateway.

## UI Architecture Rules
- Route files stay thin.
- Screen components own composition.
- Business logic does not move into UI components.
- Prompt text does not appear in user-facing UI.
- Navigation definitions should stay centralized and inspectable.

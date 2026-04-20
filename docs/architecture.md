# Gold Studio Architecture

## Current shape
- Single Next.js repo
- App Router
- TypeScript
- Tailwind CSS

## Planned core services
- Prisma ORM
- MySQL database
- Gemini integration for image generation workflows

## App boundaries
- User and admin flows live in the same app
- Separation happens by routes and feature folders
- Shared UI stays in `src/components`
- Feature logic stays in `src/features`
- Shared logic stays in `src/lib`
- AI code stays in `src/lib/ai`

## Implementation notes
- Prefer server-side handling for sensitive operations
- Keep business logic out of UI components
- Add new layers only when the MVP clearly needs them

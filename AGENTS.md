# Gold Studio Agent Rules

## Product
Gold Studio is a mobile-first Farsi RTL web app for turning low-quality jewelry/product photos into premium studio-style images.

## Architecture rules
- Keep the app in a single Next.js repo for MVP
- Use App Router
- Use TypeScript
- Use Tailwind
- Use Prisma with MySQL
- Keep business logic out of UI components
- Keep AI logic inside dedicated lib/ai files
- Keep admin and user flows in the same app, separated by routes and features

## Folder rules
- app routes in `src/app`
- shared UI in `src/components`
- feature code in `src/features`
- shared logic in `src/lib`
- database in `prisma`
- docs in `docs`

## Coding rules
- Prefer small components
- Prefer server-side logic for sensitive operations
- Do not hardcode secrets
- Do not introduce new architecture layers unless needed
- Do not create duplicate helpers
- Edit existing files before creating new ones
- Keep markdown docs short and current

## UX rules
- Farsi first
- RTL first
- Mobile-first
- Simple and low-friction
- Premium but minimal visual style

## Documentation rules
- Update `roadmap.md` when progress or scope changes
- Keep docs concise
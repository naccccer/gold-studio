# Gold Studio Roadmap

## Vision
A mobile-first Farsi AI studio for turning weak jewelry/product photos into premium studio-quality product images with minimal friction.

## Current phase
Phase 1 — MVP web app (mobile-first, tablet-friendly)

## Phase 1 scope
- Next.js app foundation
- Full Farsi + RTL
- Mobile-first layouts
- Auth
- User dashboard
- Project creation
- Image upload
- Style preset selection
- Gemini-based generation
- Result page
- Download result
- Admin dashboard
- Manual credit/subscription controls

## Not in Phase 1
- Native iOS app
- Native Android app
- Queue worker
- Redis
- Automated billing
- Bulk upload
- Team workspaces
- Advanced analytics

## Current checklist
- [x] GitHub repo created
- [x] Next.js + Tailwind scaffold created
- [x] RTL + Farsi foundation
- [x] Temporary homepage shell
- [x] Root docs created
- [x] Route groups created
- [x] Auth
- [x] Prisma + MySQL
- [x] Dashboard shell
- [x] Upload flow
- [x] Style presets
- [x] Gemini integration
- [x] Admin panel
- [x] MVP polish

## Phase 1 status
Core MVP journey is now implemented end-to-end in-app: signup/login, create project, upload image, choose style, run Gemini generation, view result, and download output. Remaining execution dependency is environment setup (`DATABASE_URL`, `AUTH_SECRET`, `GEMINI_API_KEY`) for runtime.

## Rule
This file must always be updated whenever scope, phases, or completed steps change.

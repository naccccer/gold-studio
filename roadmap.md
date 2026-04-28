# Gold Studio Roadmap

## Vision
A mobile-first Farsi AI studio for turning weak jewelry/product photos into premium studio-quality product images with minimal friction.

## Current phase
Phase 1 - MVP web app (mobile-first, tablet-friendly)

## Phase 1 scope
- Next.js app foundation
- Full Farsi + RTL
- Mobile-first layouts
- Auth
- User dashboard
- Project creation
- Image upload
- Style preset selection
- GapGPT Gemini-compatible image generation
- Result page
- Download result
- Admin dashboard
- Manual credit/subscription controls (temporary unlimited credits for MVP testing)

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
- [x] GapGPT image integration
- [x] Temporary unlimited credits bypass
- [x] Admin panel
- [x] MVP polish
- [x] UI redesign phase 3 (landing + dashboard home)
- [x] UI redesign phase 4 (new project workspace)

## Phase 1 status
Core MVP journey is now implemented end-to-end in-app: signup/login, create project, upload image, choose style, run GapGPT image generation, view result, and download output. Credits are temporarily unlimited for testing. Remaining execution dependency is environment setup (`DATABASE_URL`, `AUTH_SECRET`, `GAPGPT_API_KEY`) for runtime.

## Rule
This file must always be updated whenever scope, phases, or completed steps change.

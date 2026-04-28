# Gold Studio UI/UX Roadmap

## Visual Mission
Gold Studio is a mobile-first luxury AI product photo studio for Farsi/RTL users. The core experience is simple: upload a product image, choose a premium visual style, generate an enhanced advertising image, then review and download the result.

The product should feel like a private luxury creative atelier: calm, precise, editorial, and image-led. It must not feel like a generic startup SaaS dashboard, analytics admin panel, or Tailwind template.

## Progress
- [x] Phase 0A - AI coding foundation
  - Repository is organized for AI coding sessions: modular folders, thin route files, feature ownership, and clear architecture boundaries.
- [x] Phase 0B - Persian mojibake protection
  - UTF-8 Persian rules and mojibake checks are in place. Persian copy must remain direct UTF-8 and never be pasted in corrupted form.
- [x] Phase 1 - Visual foundation and shared luxury tokens
  - Shared tokens and primitives now establish the warm ivory, charcoal, muted stone, and restrained champagne-gold baseline.
- [ ] Phase 2 - App shell and navigation reframe
  - Rework the signed-in shell from dashboard chrome into a calm studio frame. Keep navigation minimal, mobile-first, and workflow-led.
- [ ] Phase 3 - Landing and dashboard home
  - Turn the public entry and user home into editorial, premium surfaces focused on starting a project, not showing metrics.
- [ ] Phase 4 - New project workspace
  - Make upload, style choice, and generation feel like one guided studio workflow with very few simultaneous decisions.
- [ ] Phase 5 - Result review room
  - Make generated images dominate the page. Provide clear status, comparison, download, and next-project actions.
- [ ] Phase 6 - Archive, auth, and admin polish
  - Polish project history, login/signup, and admin screens without turning them into heavy enterprise interfaces.
- [ ] Phase 7 - Demo QA and consistency hardening
  - Verify all core routes for visual consistency, Farsi/RTL behavior, mobile layout stability, and build health.

## Scope Boundaries
- Keep the MVP in one Next.js App Router repository.
- Keep business logic out of UI components.
- Keep AI logic inside dedicated `src/lib/ai` files.
- Keep route files thin; feature screens own screen composition.
- Prefer editing existing shared primitives before adding new components.
- Add new UI abstractions only when at least two screens need the same behavior or visual pattern.
- Update `roadmap.md` when product phase status or scope changes.

## Anti-Goals
- Do not build a generic SaaS dashboard.
- Do not introduce analytics-heavy cards as the main experience.
- Do not overuse amber, gradients, glows, neon, glassmorphism, or decorative effects.
- Do not create giant over-rounded white cards as the default layout.
- Do not make metrics visually stronger than upload, image preview, style choice, or result review.
- Do not add generic enterprise chrome, dense sidebars, large tables, or template-like component grids.
- Do not introduce duplicate helpers or screen-local styling hacks when a shared primitive should be improved.
- Do not paste corrupted Persian text or bypass mojibake checks.


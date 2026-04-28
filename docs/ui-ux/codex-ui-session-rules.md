# Codex UI Session Rules

## Required Reading Before UI Work
Before any UI or UX change, read:
- `docs/ui-ux/ui-ux-roadmap.md`
- `docs/ui-ux/design-language.md`
- `docs/ui-ux/component-principles.md`
- `docs/ui-ux/codex-ui-session-rules.md`

Also check `docs/conventions.md` for coding and Persian encoding rules.

## Operating Rules
- Preserve route behavior and business logic unless the user explicitly asks to change them.
- Inspect equivalent existing files before editing.
- Prefer shared primitives in `src/components/ui` over screen-local styling hacks.
- Keep feature-owned screen composition in `src/features`.
- Keep route files thin and App Router conventions intact.
- Do not introduce new architecture layers unless the current phase clearly requires them.
- Edit existing files before creating new components.
- Do not duplicate helpers, class builders, or UI primitives.
- Preserve UTF-8 Persian text. Never paste mojibake.
- If Persian appears corrupted, stop and fix encoding deliberately before continuing.
- Keep AI logic inside `src/lib/ai`.
- Keep sensitive operations server-side.

## Visual Rules For Every UI Phase
- Farsi-first, RTL-first, mobile-first.
- Calm luxury AI creative studio, not SaaS dashboard.
- Warm ivory and soft white backgrounds.
- Charcoal text and muted stone borders.
- Restrained champagne-gold accents only where useful.
- Strong whitespace and restrained geometry.
- Images and workflow dominate over metrics.
- No loud gradients, neon glows, amber-dashboard cliches, giant rounded cards, or generic enterprise chrome.
- Avoid screen-local one-off Tailwind inventions when a primitive or token should carry the visual language.

## Editing Workflow
1. Read the UI/UX docs listed above.
2. Inspect the current route, feature screen, and shared primitive files related to the task.
3. Identify whether the change belongs in a shared primitive, feature component, feature screen, or route layout.
4. Make the smallest coherent change that advances the approved phase.
5. Keep Persian copy short, direct, and UTF-8.
6. Avoid redesigning adjacent screens unless the phase explicitly includes them.
7. Do not touch unrelated dirty worktree files.

## Verification Required After Every UI Phase
Run:
```bash
npm run check:mojibake
npm run lint
npm run build
```

If any command fails, report the command, the failure, and whether it is caused by the current phase or pre-existing work.

## Mandatory Reporting Format
After each UI phase, report:
- Phase completed
- Files changed
- What changed, in 3-6 bullets
- Verification results for:
  - `npm run check:mojibake`
  - `npm run lint`
  - `npm run build`
- Any issues or pre-existing risks
- Any files intentionally not touched because they were outside scope

Keep the report concise, but include enough detail for the next AI coding session to continue without guessing.


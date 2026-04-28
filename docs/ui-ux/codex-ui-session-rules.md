# Codex UI Session Rules

## Required Reading Before UI Work
Before any UI or UX change, read these files in full:
- `docs/ui-ux/ui-ux-roadmap.md`
- `docs/ui-ux/design-language.md`
- `docs/ui-ux/component-principles.md`
- `docs/ui-ux/codex-ui-session-rules.md`

Also read `docs/conventions.md` before touching Persian copy or source files.

## Non-Negotiable Operating Rules
- Modify the smallest correct surface area for the requested phase.
- Preserve route behavior and business logic unless the user explicitly asks to change them.
- Preserve feature ownership boundaries:
  - routes stay in `src/app`
  - shared UI stays in `src/components`
  - feature UI stays in `src/features`
  - shared logic stays in `src/lib`
  - AI logic stays in `src/lib/ai`
- Keep route files thin.
- Inspect equivalent existing files before editing.
- Inspect shared primitives before introducing new screen-local classes.
- Prefer shared primitives over screen-local hacks.
- If a UI issue can be solved in one shared component, do not patch six screens manually.
- Do not introduce new architecture layers unless the current phase clearly requires them.
- Do not duplicate helpers, class builders, or UI primitives.
- Do not touch unrelated dirty worktree files.

## Styling Rules For Agents
- Avoid random inline Tailwind styling inside screens when the pattern belongs in a primitive.
- Do not invent a new local button, field, surface, or status style when `src/components/ui` already has one.
- Use tokens and existing primitives first.
- Add new feature components only when they clarify a feature-owned workflow.
- Do not redesign adjacent screens unless the active phase explicitly includes them.
- Do not create generic Tailwind component-library layouts.
- Do not add decorative pills, badges, gradients, glows, or icon rows unless required by the phase and consistent with `design-language.md`.

## Persian Copy Integrity
- Preserve UTF-8 Persian.
- Never paste already-corrupted mojibake text.
- If Persian appears as `Ãƒ`, `Ã‚`, `Ã˜`, `Ã™`, `Ã›`, `Ãš`, `Ã¢`, or `ï¿½`, stop and repair deliberately.
- Prefer direct UTF-8 Persian strings in TSX/TS/MD files.
- Do not convert Persian to escaped Unicode unless there is a technical reason.
- Keep Persian copy short, direct, and user-friendly.
- Avoid exposing technical AI/provider language to users unless the screen is admin or diagnostic.

## Visual Rules For Every UI Phase
- Farsi-first, RTL-first, mobile-first.
- Calm luxury AI creative studio, not SaaS dashboard.
- Warm ivory and soft white backgrounds.
- Charcoal text and muted stone borders.
- Restrained champagne-gold accents only where useful.
- Strong whitespace and restrained geometry.
- Images and workflow dominate over metrics.
- Shell/header visual weight stays lighter than page content.
- Accent gold must stay sparse.
- No loud gradients, neon glows, amber-dashboard cliches, giant rounded cards, or generic enterprise chrome.

## Required Editing Workflow
1. Read the required UI/UX docs.
2. Check `git status --short` and identify unrelated existing changes.
3. Inspect the current route, feature screen, shared primitive, and nearby files related to the task.
4. Decide the correct edit layer: token, primitive, feature component, feature screen, or route layout.
5. Make the smallest coherent change that completes the active phase.
6. Keep Persian copy UTF-8 and concise.
7. Preserve behavior unless explicitly asked to change it.
8. Run verification commands.
9. Report changed files, visual rationale, verification, and risks.

## Verification Required After Every UI Phase
Run:
```bash
npm run check:mojibake
npm run lint
npm run build
```

If any command fails:
- Report the exact command.
- Summarize the failure.
- State whether it appears caused by the current phase or by pre-existing work.
- Do not hide failures.

## Mandatory Reporting Format
After each UI phase, report:
- Phase completed.
- Files changed.
- Visual rationale: why the change supports Gold Studio's luxury studio direction.
- What changed in 3-6 bullets.
- Verification results:
  - `npm run check:mojibake`
  - `npm run lint`
  - `npm run build`
- Any issues or pre-existing risks.
- Any files intentionally not touched because they were outside scope.

Keep the report concise, but make it complete enough for the next AI coding session to continue without reading the chat history.


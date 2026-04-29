# Codex UI Session Rules (Greenfield Reset)

## Required Reading Before Any UI Work
Read these files first:
- `docs/ui-ux/ui-ux-roadmap.md` (single roadmap source of truth)
- `docs/ui-ux/design-language.md`
- `docs/ui-ux/component-principles.md`
- `docs/ui-ux/codex-ui-session-rules.md`

Also read `docs/conventions.md` before touching Persian copy.

## Mandatory Strategic Interpretation
- Treat old UI as non-authoritative.
- Do not continue or polish rejected roadmap assumptions.
- Do not perform incremental decoration of weak dashboard-like layouts.
- Prefer replacement over polishing when quality requires it.
- Preserve technical behavior only where useful for product flow.

## Execution Rules
- Keep business logic intact unless user asks for functional changes.
- Preserve Persian/RTL/UTF-8 integrity.
- Keep AI logic in `src/lib/ai` and business logic outside UI components.
- Make changes at the correct layer (tokens, primitives, feature components, screen composition).
- Avoid duplicate helpers/components.
- Keep edits scoped, but do not let scope protect low-quality legacy composition.

## Visual Reporting Requirement
When reporting a UI task, include:
- What visual decisions were made and why.
- How the dominant visual focus was strengthened.
- Which dashboard-like patterns were removed or avoided.
- What remained intentionally unchanged (if any) and why.

Do not report only file lists.

## Mandatory Self-Check Before Claiming Done
Before reporting done, answer internally:
- Does this still look like a dashboard?
- Does this still look like a beige Tailwind app?
- Is the first mobile viewport mostly text?
- Are there nested bordered cards?
- Is there one strong visual hero?
- Would this impress a luxury brand client?
- Is the core product flow simpler than before?

If any answer is wrong, continue improving.

## Verification Commands For UI Sessions
Run after UI changes:
```bash
npm run check:mojibake
npm run lint
```

Report failures explicitly with probable cause.

# Gold Studio Conventions

## Product
- Build mobile-first.
- Build Farsi-first.
- Treat RTL as the default.
- Keep the app image-led and low-friction.
- Gallery owns source photos.
- Projects own generated outputs.
- Avoid SaaS dashboards, admin-heavy user screens, and prompt-heavy workflows.

## Design
- Use Vazirmatn for UI/body text.
- Use Doran only for very short display titles.
- Use lucide icons consistently.
- Bottom nav is `خانه`, `گالری`, center `+`, `پروژه‌ها`, `حساب`.
- Prefer icon-led controls, but keep text plus icon for primary or risky actions.
- Use tiny info triggers only for complex moments.
- Keep champagne-gold sparse.

## Code
- Prefer small components.
- Keep route files thin.
- Edit existing files before creating new ones when practical.
- Avoid duplicate helpers.
- Keep secrets out of code.
- Keep AI logic in `src/lib/ai`.
- Keep business logic out of UI components.
- Keep Gallery asset logic out of generated Project UI where possible.

## Documentation
- Keep docs short and current.
- Update `roadmap.md` whenever scope, phase status, or product direction changes.

## Encoding And Persian Copy
- All source and docs files must be saved as UTF-8.
- Never paste already-corrupted mojibake text.
- If Persian appears as Ã, Â, Ø, Ù, Û, Ú, â, or �, stop and fix encoding before editing.
- Prefer direct UTF-8 Persian strings in TSX, TS, and MD files.
- Do not convert Persian text to escaped unicode unless technically required.

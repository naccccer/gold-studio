# Gold Studio Conventions

## Product
- Build mobile-first.
- Build Farsi-first.
- Treat RTL as the default.
- Keep the app image-led, low-friction, premium, and calm.
- Gallery owns source photos.
- Projects own generated outputs and generation status.
- Billing owns packages, credits, manual payment details, and receipt upload.
- Admin is a separate operational area, not the normal user experience.
- Avoid SaaS dashboards, prompt-heavy workflows, generic admin screens in user flows, and user-facing text-to-image controls.

## Design
- Use Vazirmatn for UI/body text.
- Use Doran only for very short display titles.
- Use lucide icons consistently.
- Mobile nav is `خانه`, `گالری`, center `پروژه جدید`, `پروژه‌ها`, `حساب`.
- Primary actions use text plus icon.
- Secondary familiar actions may be icon-only with accessible labels.
- Keep champagne-gold sparse.
- Avoid nested cards, noisy filters, random borders, heavy gradients, and one-off visual hacks.
- Do not use perfume/fragrance visual metaphors.

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
- Do not keep implementation diaries, phase histories, temporary QA notes, or stale warnings.
- Update `roadmap.md` whenever scope, progress, active priorities, or product direction changes.

## Encoding And Persian Copy
- Save source and docs as UTF-8.
- Never paste already-corrupted mojibake text.
- If Persian appears corrupted or unreadable, stop and fix encoding before editing.
- Prefer direct UTF-8 Persian strings in TSX, TS, and MD files.
- Do not convert Persian text to escaped Unicode unless technically required.

## Verification
Run after meaningful changes:

```powershell
npm run check:mojibake
npm run lint
npm run build
```

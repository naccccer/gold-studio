# Gold Studio Agent Rules

## Product
Gold Studio is a mobile-first Farsi RTL web app for turning low-quality jewelry, gold, watch, and luxury accessory photos into premium studio-style product images.

## Current Rebuild Direction
- Professional, minimal, premium, image-led, and easy for non-technical users.
- Farsi-first and RTL-first.
- Guided assistant, not a SaaS dashboard, form app, admin panel, or prompt-heavy AI tool.
- Default output path is clean catalog/product imagery.
- User-facing text-to-image is out of scope; keep it admin/internal only.
- Admin is a separate `/admin` route, entered from `/account` for admins.
- Mobile user nav is `خانه`, `گالری`, center `پروژه جدید`, `پروژه‌ها`, `حساب`.
- `گالری` owns uploaded source product photos.
- `پروژه‌ها` owns generated outputs and generation status.

## Architecture Rules
- Keep the app in a single Next.js repo for MVP.
- Use App Router.
- Use TypeScript.
- Use Tailwind.
- Use Prisma with MySQL.
- Keep business logic out of UI components.
- Keep AI logic inside dedicated `src/lib/ai` files.
- Keep admin and user flows in the same app, separated by routes and features.

## Folder Rules
- App routes in `src/app`.
- Shared UI in `src/components`.
- Feature code in `src/features`.
- Shared logic in `src/lib`.
- Database in `prisma`.
- Docs in `docs`.

## UI Rules
- Prefer small components and thin route files.
- Use Vazirmatn for UI/body text.
- Use Doran only for very short display titles.
- Use lucide icons consistently.
- Primary actions use text plus icon.
- Secondary familiar actions may be icon-only with accessible labels.
- Keep champagne-gold sparse.
- Avoid nested cards, noisy filters, random borders, and hardcoded one-off visual hacks.
- Use existing jewelry placeholder assets when useful.
- Do not use perfume/fragrance visual metaphors.
- Keep Gallery asset logic separate from generated Project review UI where possible.

## Coding Rules
- Prefer server-side logic for sensitive operations.
- Do not hardcode secrets.
- Do not introduce new architecture layers unless needed.
- Do not create duplicate helpers.
- Edit existing files before creating new ones when practical.
- Keep markdown docs short and current.
- Update `roadmap.md` when progress or scope changes.

## Verification
Every implementation phase should run:

```powershell
npm run check:mojibake
npm run lint
npm run build
```

If build fails only because of the known PrismaClient issue in `src/lib/db.ts`, report it clearly as unrelated and unchanged.

Screenshot-driven UI phases should capture mobile screenshots at `393x852` where relevant.

## Network/Proxy Rules
- The developer may be in Iran and using limited paid proxy bandwidth.
- Do not assume proxy is needed for local-only work.
- Try direct access first when an external service usually works.
- Use proxy only for blocked external services such as Prisma engine downloads, Gemini/GAPGPT API calls, or npm package downloads if npm fails.
- For v2rayN on `127.0.0.1:10808`, proxy env vars must include a scheme, e.g. `http://127.0.0.1:10808` or `socks5://127.0.0.1:10808`.
- See `docs/proxy.md` before changing network setup instructions.

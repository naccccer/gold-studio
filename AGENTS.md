# Ovala Agent Rules

## Product

Ovala is a mobile-first Farsi RTL web app for turning low-quality jewelry, gold, watch, and luxury accessory photos into premium studio-style product images.

## Collaboration Rules

- Be objective, outcome-focused, and optimization-minded. Do not act like a yes-man; challenge weak assumptions, point out better options, and prioritize the best result over agreement or reassurance.
- Assume the developer may be new to software/product work and may not know which questions to ask.
- Proactively explain missing concepts, hidden risks, tradeoffs, and likely next questions before giving commands or recommendations.
- Move step by step. Give one short, concrete action at a time when safety, complexity, cost, data, or production behavior matters.
- Before risky operations such as `git pull`, `npm install`, `prisma migrate deploy`, `npm run db:deploy`, `pm2 restart`, DNS changes, storage changes, or provider changes, first call out the risk, the rollback option, and the exact stop point.
- Always suggest both app-level backups and hosting/provider snapshots when available before production changes.
- Do not assume the user knows terms like snapshot, rollback, migration, PM2, DNS, proxy, worker, environment variables, build, lint, branch, merge, or cache; define them briefly when they become relevant.

## Current Direction

- Professional, minimal, premium, image-led, and easy for non-technical users.
- Farsi-first, RTL-first, and mobile-first.
- Guided assistant, not a SaaS dashboard, form app, admin panel, or prompt-heavy AI tool.
- Default output path is clean catalog/product imagery.
- User-facing text-to-image is out of scope; keep it admin/internal only.
- Admin is a separate `/admin` route, entered from `/account` for admins.
- Mobile user nav is `خانه`, `گالری`, center `پروژه جدید`, `پروژه‌ها`, `حساب`.
- `گالری` owns uploaded source product photos.
- `پروژه‌ها` owns generated outputs and generation status.
- `/billing` owns packages, standalone credits, card-to-card details, purchase status, and receipt upload.

## Architecture Rules

- Keep the app in a single Next.js repo for launch/current production.
- Use App Router, TypeScript, Tailwind, Prisma, and MySQL.
- Keep business logic out of UI components.
- Keep AI logic inside dedicated `src/lib/ai` files.
- Keep admin and user flows in the same app, separated by routes and features.
- Use local filesystem storage by default; use S3-compatible storage only when intentionally configured.

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
- Use Vuesax icons consistently for user-facing UI; keep existing lucide usage only until it is migrated deliberately.
- Primary actions use text plus icon.
- Secondary familiar actions may be icon-only with accessible labels.
- Keep champagne-gold sparse.
- Avoid nested cards, noisy filters, random borders, and hardcoded one-off visual hacks.
- Use existing jewelry placeholder assets when useful.
- Do not use perfume/fragrance visual metaphors.
- Keep Gallery asset logic separate from generated Project review UI where possible.
- Admin may be denser and more operational, but should remain visually related to Ovala.

## Design Skill Rules

- For UI/UX design, redesign, polish, audit, or frontend implementation work, use `impeccable` as the primary design quality skill.
- Also use `emil-design-eng` for interaction details, component feel, animation decisions, easing, active states, and invisible polish.

## Coding Rules

- Prefer server-side logic for sensitive operations.
- Do not hardcode secrets.
- Do not introduce new architecture layers unless needed.
- Do not create duplicate helpers.
- Edit existing files before creating new ones when practical.
- Keep markdown docs short and current.
- Update `roadmap.md` when progress or scope changes.
- Update launch/readiness docs when deploy, env, storage, worker, billing, SMS, provider, or operations behavior changes.

## Persian And Encoding

- Save source and docs as UTF-8.
- Keep Persian text as direct UTF-8, not escaped Unicode, unless technically required.
- Never paste already-corrupted mojibake text.
- If Persian appears corrupted or unreadable, stop and repair deliberately.

## Verification

Every implementation phase should run:

```powershell
npm run check:prompts
npm run check:model-routing
npm run check:readiness
npm run check:mojibake
npm run lint
npm run build
```

UI phases should consider the `393x852` mobile layout target, but do not capture screenshots unless explicitly requested.

## Network And Proxy Rules

- The developer may be in Iran and using limited paid proxy bandwidth.
- Do not assume proxy is needed for local-only work.
- Try direct access first when an external service usually works.
- Use proxy only for blocked external services such as Prisma downloads, Liara/Gemini API calls, or npm package downloads if npm fails.
- For v2rayN on `127.0.0.1:10808`, proxy env vars must include a scheme, e.g. `http://127.0.0.1:10808` or `socks5://127.0.0.1:10808`.
- See `docs/proxy.md` before changing network setup instructions.

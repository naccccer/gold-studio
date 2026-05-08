# Gold Studio Roadmap

## Direction
Gold Studio / Studio OVALA is now moving from the approved `/design/user-flow` prototype into the production app.

The next work is not to keep expanding the prototype. The prototype is the user-flow source of truth for visual direction, interaction rhythm, spacing, typography, image treatment, and mobile navigation.

Core product direction:
- Farsi-first and RTL-first.
- Mobile-first.
- Premium, minimal, calm, image-led, and trustworthy.
- Guided assistant experience, not a SaaS dashboard.
- Jewelry, gold, watches, and luxury accessories only.
- No user-facing prompt-heavy or text-to-image experience.
- Admin remains separate and should be redesigned as its own operational product area.

Primary user navigation:

```text
خانه | گالری | پروژه جدید | پروژه‌ها | حساب
```

Workspace ownership:
- `گالری`: uploaded source product photos.
- `پروژه‌ها`: generated outputs and generation status.
- `حساب`: identity, credits/subscription, support, FAQ, referral code, admin entry, logout.

## Phase 1 - Freeze Prototype And Extract UI System
Goal: turn the current `/design/user-flow` prototype into a practical implementation reference.

Status: Completed on 2026-05-06. The approved prototype remains available at `/design/user-flow`; production now has shared UI primitives for brand logo usage, RTL top bars, mobile navigation active states, button treatments, image frames, auth image backdrops, bottom action docks, and processing canvases.

Tasks:
- Treat `src/app/design/user-flow/page.tsx` as the approved user-flow design reference.
- Extract shared UI decisions into reusable app patterns:
  - mobile phone-shell proportions translated into real responsive screens
  - bottom navigation behavior and active states
  - primary/secondary button styles
  - RTL top bars and back-button placement
  - image-led card/frame treatment
  - auth full-bleed image style
  - processing and result action alignment
- Keep existing Studio OVALA logo assets from `public/brand`.
- Keep Vazirmatn as the app UI font.
- Keep champagne gold sparse.
- Do not carry prototype-only wrapper UI into production routes.

Acceptance criteria:
- Implementation has a small shared UI foundation instead of copy-pasted prototype markup.
- Production pages can match the prototype without duplicating the prototype route structure.
- `/design/user-flow` remains available as a review reference.

Verification:

```powershell
npm run check:mojibake
npm run lint
npm run build
```

## Phase 2 - Apply Prototype To Auth And App Shell
Goal: make the first real app surfaces match the approved direction.

Status: Completed on 2026-05-06. Login/signup now use full-bleed product imagery with solid bottom action panels, the identity label is `موبایل / ایمیل`, phone examples render LTR, and the signed-in shell uses the shared RTL top bar plus the approved five-part navigation.

Routes:
- `src/app/(auth)/login`
- `src/app/(auth)/signup`
- signed-in shell/navigation used by dashboard routes

Tasks:
- Rebuild login and signup with full-bleed product imagery, no text over images, and clear bottom actions.
- Use `موبایل / ایمیل` as the primary identity field label.
- Ensure phone-number examples render LTR.
- Remove generic dashboard feel from the signed-in shell.
- Implement mobile nav exactly as:

```text
خانه | گالری | پروژه جدید | پروژه‌ها | حساب
```

Acceptance criteria:
- Auth screens feel premium and image-led.
- Mobile nav labels, active states, and center project action match the prototype.
- Back buttons sit correctly for RTL screens.
- No mojibake in touched files.

Verification:

```powershell
npm run check:mojibake
npm run lint
npm run build
```

Screenshot QA:
- Capture `393x852` screenshots for login, signup, and one signed-in route.

## Phase 3 - Apply Prototype To User Creation Flow
Goal: rebuild the core user journey around the approved guided flow.

Status: Completed on 2026-05-07. Home, Gallery, New Project, processing/result states, and Projects now follow the guided RTL flow with bottom-aligned primary actions, style-card-only selection, dedicated processing canvas behavior, hold-to-preview for source image comparison, and clearer separation between source assets and generated outputs.

Routes:
- home/dashboard route
- `/gallery`
- `/projects/new`
- project processing state
- project result/review route
- `/projects`

Tasks:
- Home: image-led Studio OVALA entry with a clear `پروژه جدید` action.
- Gallery: source-photo workspace with upload actions, image grid, left-side thumbnail controls, and bottom-aligned `ادامه` CTA.
- New Project: selected image preview, clear aspect ratio options:

```text
پست ۱:۱ | استوری ۹:۱۶ | بنر ۱۶:۹
```

- Style selection: visual style cards only; no prompt text in user-facing UI.
- Processing: calm loading canvas, one animated status line at a time, visible loading motion, stable bottom actions.
- Result: no watermark label, no `نگه‌دار: قبل` badge, fullscreen affordance, hold/hover before-image behavior, bottom-aligned `ذخیره` and `نسخه دیگر`.
- Projects: keep generated outputs/status separate from Gallery source assets.

Acceptance criteria:
- Core journey matches the prototype behaviorally and visually.
- Gallery and Projects remain clearly separated.
- All primary actions align consistently near the bottom of mobile screens.
- No user-facing text-to-image or prompt controls.

Verification:

```powershell
npm run check:mojibake
npm run lint
npm run build
```

Screenshot QA:
- Capture `393x852` screenshots for home, gallery, new project, processing, result, and projects.

## Phase 4 - Apply Prototype To Account And Billing Groundwork
Goal: turn Account into the production membership/profile hub.

Status: Completed on 2026-05-07. Account now presents identity, phone/email identifier, current plan and remaining credits, includes the required action list with admin-only admin entry, keeps billing details abstract, and uses a muted destructive logout treatment.

Route:
- `/account`

Tasks:
- Show identity, phone/email, current plan, remaining credits.
- Include actions:
  - خرید اعتبار یا اشتراک
  - ورود به بخش ادمین for admins only
  - پشتیبانی
  - سوالات پرتکرار
  - مشخصات
  - دریافت کد معرف
  - تنظیمات خروجی
  - امنیت حساب
  - خروج از حساب with a muted red warning style
- Do not duplicate Gallery navigation inside Account.
- Keep billing/provider details abstract until payment provider selection.

Acceptance criteria:
- Account feels like a calm profile/membership hub.
- Admin entry is visible only for admin users.
- Logout is visually distinct and mildly destructive.
- Credit/subscription UI can later connect to billing without redesign.

Verification:

```powershell
npm run check:mojibake
npm run lint
npm run build
```

Screenshot QA:
- Capture `393x852` screenshot for account.

## Phase 5 - Admin Redesign As Separate Product Area
Goal: redesign admin intentionally after the user flow lands.

Status: Completed on 2026-05-07. Admin routes now use a separate operational layout with denser project/status visibility, clearer access-credit management, and internal style catalog controls while keeping admin-only responsibilities isolated from user-facing creation flows.

Routes:
- `/admin`
- `/admin/access`
- `/admin/projects`
- `/admin/styles`

Tasks:
- Do not force the user-app image-led design onto admin.
- Use a calm operational layout with denser information, clearer tables/lists, filters, and status handling.
- Preserve admin responsibilities:
  - style catalog management
  - project/job inspection
  - access/subscription/credit management
  - internal controls and debugging
- Keep text-to-image or prompt-heavy controls admin/internal only.
- Ensure `/account` remains the admin entry point for admin users.

Acceptance criteria:
- Admin is usable for repeated operational work.
- Admin does not feel like a marketing page or decorative prototype.
- Admin remains visually related to Studio OVALA but more functional and dense.

Verification:

```powershell
npm run check:mojibake
npm run lint
npm run build
```

Screenshot QA:
- Capture `393x852` and desktop screenshots for key admin routes.

## Phase 6 - Final QA And Hardening
Goal: catch visual, RTL, route, and state issues before calling the rebuild complete.

Status: Completed on 2026-05-07. Final pass completed across user and admin routes with no mojibake, lint-clean and build-clean output, consistent mobile-first action alignment, and additional hardening to keep text-to-image generation restricted to admin/internal usage.

2026-05-08 follow-up polish:
- Fixed dark project-detail top-bar contrast on mobile so the title stays readable over dark processing/result backgrounds.
- Removed the `محصول | زمینه | نور` processing chip row from both production and the `/design/user-flow` reference.
- Gallery uploads now auto-submit immediately after file selection and show explicit upload feedback in the picker area.
- Gallery intake now separates `دوربین` from `آپلود`, opens a dedicated crop step immediately after selection, and keeps the raw upload running in the background.
- Gallery crop now opens as a modal on top of `/gallery`, and saving or skipping the crop keeps the user inside Gallery instead of redirecting into project creation.

Tasks:
- Full route pass across auth, home, gallery, project creation, processing, result, projects, account, and admin.
- Check loading, empty, failed, completed, and access-blocked states.
- Check mobile overflow at `393x852`.
- Check desktop does not look broken, even though mobile is primary.
- Remove prototype-only labels, unused UI fragments, and duplicated helpers.
- Keep docs short and current.

Acceptance criteria:
- No obvious visual drift from the approved prototype on user routes.
- No mojibake.
- No mobile overflow.
- No prompt text in user-facing creation flow.
- Admin remains separate and operational.

Verification:

```powershell
npm run check:mojibake
npm run lint
npm run build
```

If build fails only because of the known PrismaClient issue in `src/lib/db.ts`, report it as unrelated and unchanged.

## Current Priority
Start with Phase 1, then implement Phases 2-4 before redesigning admin.

Do not expand `/design/user-flow` into every app page. Use it as the approved reference and move the real product forward.

## Local Dev Notes
- Added isolated local MariaDB helper scripts for this project to avoid dependency on broken global XAMPP data:
  - `npm run db:start`
  - `npm run db:stop`
- The isolated DB uses `.local-mariadb` and `127.0.0.1:3307` as configured in `.env`.

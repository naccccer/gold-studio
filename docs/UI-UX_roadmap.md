# Ovala UI/UX Roadmap

## Purpose

Ovala is a Farsi-first, RTL-first, mobile-first product-photo studio for jewelry, gold, watches, and luxury accessories. For the MVP, the user app stays phone-width even on desktop. Desktop should present the same focused mobile workspace inside an intentional premium stage, not expand into a SaaS dashboard.

Primary visual approval size: `393x852`.

## Direction Check

Good plan:

- Phone-width user UI protects the guided assistant experience.
- Shared primitives before screen polish is the right order.
- Ovala already has strong ingredients: warm ivory, dark studio mode, jewelry imagery, logo variants, and five-item mobile navigation.
- Scrolling policy is important: focused task screens should feel composed, while content-heavy screens can scroll naturally.

Risks:

- A centered phone app can feel cheap on desktop unless the surrounding stage is designed.
- A burger menu must not hide the main product path; use it for secondary actions only.
- Dark studio mode can become theatrical if it hurts clarity.
- Premium motion can become decoration. Use it to clarify state, progress, and reveal.
- Mojibake repair is foundation work, not copy polish.

## Product Identity Rules

- Product name: Ovala.
- Remove legacy user-facing product naming.
- Keep Persian text direct UTF-8. Never paste corrupted Persian.
- Avoid generic SaaS panels, magic-wand AI language, robot metaphors, perfume/fragrance cues, neon gradients, heavy black/gold cliches, noisy nested cards, and decorative filler.
- Use jewelry, gold, watch, and luxury accessory imagery as the visual anchor.

## Global Execution Rules

- Read this roadmap, `AGENTS.md`, `DESIGN.md`, `docs/brand-identity.md`, and current artifacts before each phase.
- Execute one phase at a time. If a phase exposes a blocker from an earlier phase, fix only the blocker and explain why.
- Prefer shared primitives and tokens over screen-local restyling.
- Keep user-side routes phone-width on desktop unless a phase explicitly says otherwise.
- Treat `393x852` as the main user-side layout target, but do not capture screenshots unless explicitly requested.
- Keep natural scrolling on content-heavy screens; remove accidental scrolling only on focused task screens.
- If mojibake appears, stop and repair it deliberately before visual polish.
- Update this roadmap after each completed phase with status, key changes, verification, and known caveats.
- Screenshots are intentionally skipped for Phase 4 and all later UI phases unless the user explicitly asks for them.

## Global Verification

Run after every implementation phase:

```powershell
npm run check:mojibake
npm run lint
npm run build
```

If build fails only because of the known Prisma engine/client issue, report it clearly as unrelated.

## Scrolling Policy

Eliminate accidental scrolling on focused task screens when content is normal length:

- Login
- Signup
- Home
- New project source step
- New project size step
- New project style step, if style count is curated
- Processing
- Completed result review
- Failed result review, if copy remains short

Allow natural scrolling where content is inherently variable:

- Gallery grid
- Gallery asset detail
- Projects list
- Account settings
- Billing packages, receipts, and history
- Support and FAQ
- Admin routes, tables, forms, provider events, users, and support

Focused screens need stable layout math: masthead height, image frame height, progress area, bottom action height, and safe-area padding.

## Navigation, Masthead, And Logo Strategy

User shell:

- Keep one centered phone-width shell for user routes.
- On desktop, surround it with a quiet Ovala stage: warm ivory, subtle depth, no dashboard columns.
- Keep bottom nav for primary routes: خانه، گالری، پروژه جدید، پروژه‌ها، حساب.

Masthead:

- `brand`: primary logo centered for login/signup/home brand moments.
- `context`: compact mark or wordmark with title/back/action.
- `studio`: dark mode with light mark, back/title, and no bright credit pill.
- `minimal`: focused task screens with only back and step context.
- Use burger/compact menu for secondary actions only: settings, support, FAQ, billing, logout.

Bottom nav:

- Normal mode: warm translucent nav, clear active state, strong center creation action.
- Studio mode: no bright ivory nav on black. Use a dark/subdued variant only when navigation matters; otherwise let the focused action dock own the bottom area.

Logo usage:

- Primary/full: login, signup, home, empty brand moments.
- Wordmark: normal mastheads with tight vertical space.
- Mark: compact route mastheads.
- Light/dark variants: dark studio surfaces and dark auth imagery.
- Watermark: generated preview/export only, quiet and low opacity.

## Shared UI And Motion Strategy

Required primitives:

- `OvalaShell`, `StudioShell`, `OvalaMasthead`, `BottomNav`
- `Button`, `IconButton`, `ActionDock`
- `ImageFrame`, `MediaGridCard`
- `Field`, `SegmentedControl`, `StatusPill`, `EmptyState`, `Menu`

Token work:

- Promote missing `DESIGN.md` tokens into CSS variables.
- Reduce hardcoded one-off colors, radii, shadows, gradients, and repeated heights.
- Define studio tokens separately.
- Keep champagne gold sparse and functional.

Motion:

- Premium motion should be calm, smooth, and useful.
- Use opacity, transform, reveal, and subtle blur; avoid bounce and "AI magic".
- Suggested durations: `160ms-220ms` for micro interactions, `260ms-380ms` for screen/dock entrance, `500ms-700ms` for studio/result reveal, `6s-12s` for rare decorative loops.
- Respect `prefers-reduced-motion`.

## Phase QA Protocol

For each phase:

- Inspect affected screens before editing.
- Implement only the phase scope.
- Do not capture screenshots unless explicitly requested; use code/layout inspection and verification commands instead.
- Manually review visible Persian text. Automated mojibake checks are not enough.
- Report screenshots skipped, checks run, known failures, and remaining visual risks.

## Phase 0: Foundation, Naming, And Encoding

Status: Done on 2026-05-10.

Goal: make the project consistently Ovala and remove corrupted Persian before visual polish.

Completion notes:

- Replaced legacy product naming with Ovala in app metadata, visible admin labels, tests, Remotion launch copy, and foundation docs.
- Repaired corrupted Persian mojibake in source and docs while keeping Persian as direct UTF-8.
- Strengthened `npm run check:mojibake` to catch representative Latin-1/Windows-1252 mojibake sequences.
- Verification: `npm run check:mojibake` passed, `npm run lint` passed, and `npm run build` reached the known Prisma engine file-lock failure during `prisma generate`.
- Screenshots were not captured because Phase 0 did not include visual redesign work.

Scope:

- App metadata and shared labels.
- User route strings.
- Admin route strings where visible.
- `AGENTS.md`, `DESIGN.md`, `docs/brand-identity.md`, `roadmap.md` only if scope text needs alignment.
- Mojibake checking script.

Must pass:

- No visible mojibake in user-facing `393x852` screenshots.
- Product name appears as Ovala in user-facing UI.
- Admin remains operational but does not feel like a separate brand.
- `npm run check:mojibake` catches representative Latin-1 mojibake markers in source/docs where Persian is expected.

Screenshots: login, signup, home, gallery, new project, processing, result, account.

## Phase 1: Mobile Shell, Masthead, Navigation, And Logo System

Status: Done on 2026-05-10.

Goal: make the phone-width MVP feel intentional on desktop and standardize route mode, masthead, nav, and logo behavior.

Completion notes:

- Kept user routes phone-width on desktop and wrapped them in a deliberate centered Ovala stage.
- Unified the dashboard masthead path across mobile and desktop instead of widening into a desktop dashboard header.
- Kept the normal bottom navigation available for primary user routes and removed the bright bottom nav from studio routes.
- Standardized predictable logo variants for brand, context, and studio masthead moments.
- Login and signup use the same light jewelry hero image.
- Login secondary actions use light text on the dark lower scrim.
- Password recovery is intentionally deferred until SMS provider setup; track it as auth debt instead of shipping an incomplete flow.
- Auth form icons now use `vuesax-icons-react`; remaining user-facing lucide icons should be migrated deliberately in the UI primitives/token phase.
- Screenshots captured in `output/playwright/phase-1`: login, signup, home/dashboard, new project, processing, result, and desktop centered shell.
- Verification: `npm run check:mojibake` passed, `npm run lint` passed, and `npm run build` reached the known Prisma engine file-lock failure during `prisma generate`.

Scope: user shell, dashboard frame, masthead/top bar, bottom nav, brand logo component, auth/home shell behavior, studio shell behavior.

Must pass:

- User app is phone-width and centered in a deliberate Ovala stage on desktop.
- Normal routes use light bottom nav consistently.
- Studio routes do not show a bright bottom nav.
- Logo variants are predictable by route mode.
- Masthead does not clip, disappear, or become low contrast.
- Focused screens fit `393x852` unless dynamic content requires scroll.

Screenshots: login, signup, home, new project, processing, result, one desktop centered-shell view.

## Phase 2: UI Primitives And Token Consolidation

Status: Done on 2026-05-10.

Goal: replace one-off styling with shared primitives, tokens, and consistent action hierarchy.

Completion notes:

- Promoted missing action, image, overlay, danger, accent, radius, shadow, and studio values from `DESIGN.md` into shared CSS variables.
- Expanded shared primitives for consistent primary, secondary, danger, ghost, studio-primary, and studio-secondary buttons, including icon buttons with 44px tap targets.
- Standardized fields, menu items, status pills, image frames, media overlays, selectable media states, segmented controls, and empty states.
- Applied the primitives to gallery cards and menus, project cards, new-project controls, account rows/actions, billing tabs, receipt controls, and safe shared navigation icons.
- Migrated touched user-facing icon usage in these shared/user surfaces from lucide to `vuesax-icons-react`.
- Kept admin changes out of scope for this phase except for shared primitives remaining compatible.
- Screenshots captured in `output/playwright/phase-2`: `login-fields-buttons.png`, `gallery-cards-menu.png`, `new-project-segmented-controls.png`, `projects-cards-or-empty-status.png`, `account-rows-status.png`, and `billing-fields-status.png`.
- Follow-up fixes: increased shared page and masthead breathing room, reduced media-card context menu button size, kept gallery/project action docks and account/billing utility actions clear of the bottom nav, and removed the credit badge from the home masthead.
- Project-list follow-up: matched project thumbnail rhythm to gallery spacing, removed date overlays from project thumbnails, reduced action-dock distance from the bottom nav, and softened the desktop phone-frame corner radius so margins read more clearly.
- Follow-up screenshots captured in `output/playwright/phase-2-followup`: `home-no-credit.png`, `gallery-spacing-menu-dock.png`, `account-logout-spacing.png`, and `projects-gallery-spacing-no-dates.png`.
- Verification: `npm run check:mojibake` passed and `npm run lint` passed.
- Build caveat: `npm run build` still fails during `prisma generate` with Windows `EPERM rename query_engine-windows.dll.node`, before Next compilation; this matches the known Prisma engine/client issue and is unrelated to Phase 2 UI changes.

Scope: shared UI components, gallery/projects cards, new project controls, account rows, billing controls, safe admin reuse.

Must pass:

- Primary, secondary, danger, ghost, studio-primary, and studio-secondary buttons are consistent.
- Image frames share radius, border, shadow, overlays, and selectable states.
- Fields have consistent labels, focus, disabled, and error states.
- Tap targets are at least 44px where applicable.
- Hardcoded visual values are materially reduced in feature screens.

Screenshots: real screens showing buttons, cards, fields, segmented controls, menus, empty states, and status pills.

## Phase 2.5: Responsive Layout Rhythm And Shell QA

Status: Implemented on 2026-05-10.

Goal: make spacing, responsive card sizing, masthead balance, bottom docks, and desktop phone-frame behavior feel intentional across common mobile and desktop viewports.

Scope: user shell spacing, desktop phone stage, page gutters, masthead alignment, gallery/projects responsive media grids, bottom nav and sticky action dock collision rules, account/billing long-page bottom spacing, context menu placement, and tap target balance.

Must pass:

- Page gutters feel consistent: not cramped, not overly narrow, and aligned with masthead content.
- Media cards scale by container and aspect ratio instead of brittle fixed heights.
- Gallery and projects feel like sibling systems, with differences only where ownership requires them.
- Bottom actions never hide under bottom nav and do not float too far above it.
- Masthead title, logo, back affordance, and action placement feel balanced in RTL.
- Desktop shell preserves phone rhythm without rounded corners visually eating content margins.
- Context menus stay inside media frames visually while retaining accessible tap targets.
- No individual screen redesign or copy rewrite beyond layout fixes.

Screenshots: home, gallery populated, projects populated, projects empty if easy, new project source, new project size, account, billing, and one desktop centered-shell view at `393x852`, `360x800`, `430x932`, and desktop where relevant.

Completion notes:

- Aligned the mobile page gutter, masthead gutter, bottom nav gutter, and desktop phone-stage content rhythm around the same shell spacing.
- Adjusted the desktop user frame to keep phone rhythm while giving rounded frame corners enough breathing room around content.
- Tuned sticky action docks so bottom actions sit just above the tab bar, with slightly narrower width and a small extra lift for the `ادامه` action.
- Converted gallery/project thumbnail cards and home preview cards away from brittle fixed heights toward shared aspect-ratio sizing.
- Kept gallery and projects as sibling media-grid systems while preserving their ownership differences.
- Improved context-menu horizontal clamping against the phone frame and restored a full 44px tap target.
- Added long-page bottom breathing room for account, billing, gallery, and projects.
- Migrated touched home user-facing icons from lucide to `vuesax-icons-react`.
- Screenshot QA was started, then intentionally stopped and discarded after the follow-up request to skip screenshots for token budget.
- Verification: `npm run check:mojibake` passed and `npm run lint` passed.
- Build caveat: `npm run build` still fails during `prisma generate` with Windows `EPERM rename query_engine-windows.dll.node`, before Next compilation; this matches the known Prisma engine/client issue and is unrelated to Phase 2.5 layout changes.

## Phase 3: First Impression Screens

Status: Done on 2026-05-10.

Goal: make login, signup, and home immediately feel like Ovala.

Scope: login, signup, home.

Completion notes:

- Reviewed login and signup as regression-only surfaces; no redesign was needed.
- Made the signup consent sentence slightly more formal while keeping the existing auth layout, imagery, spacing, RTL behavior, and Vuesax icons intact.
- Kept the home screen close to the existing direction for later redesign, but removed the home-only accidental scroll source by disabling the general bottom padding/min-height behavior on the focused home surface.
- Increased the home hero height again after review feedback so the blank lower area is reduced while the screen still fits the intended phone viewport.
- Removed date tags from the home thumbnail previews.
- Restored the previous hero overlay text after review feedback and did not introduce new home copy.
- Screenshots were skipped per Phase 3 request because the change was intentionally small.
- Verification: `npm run check:mojibake` passed and `npm run lint` passed.
- Build caveat: `npm run build` still fails during `prisma generate` with Windows `EPERM rename query_engine-windows.dll.node`, before Next compilation; this matches the known Prisma engine/client issue and is unrelated to Phase 3.

Must pass:

- Auth screens fit `393x852` without accidental scroll.
- Home fits `393x852` or uses only intentional minimal scroll if real content requires it.
- Primary logo is used only where it earns the space.
- Forms feel calm, readable, and non-technical.
- Home has one clear next action.
- No generic SaaS cards, AI magic language, or decorative filler.

Screenshots: login, signup, home, empty and populated home states if available.

## Phase 4: Core Creation Flow

Status: Done on 2026-05-10.

Goal: make gallery to new project to processing feel like one coherent guided studio flow.

Scope: gallery, gallery crop overlay, new project source/size/style steps, processing.

Completion notes:

- Tightened the gallery intake block so upload, camera, and selection status read as one guided starting point instead of separate utilities.
- Improved gallery empty and populated states with clearer selection feedback, stronger source-image ownership cues, and more explicit continuation into project creation.
- Reworked the new-project source step around one dominant image object, added quick gallery selection inside the wizard, and removed the implicit auto-pick of the first gallery asset when users enter without a preselected source.
- Reworked the size step so output ratio selection is previewed inside one dominant framed studio object instead of a disconnected control set.
- Reworked the style step so the selected style gets a large visual preview with curated image-led style choices and the same clear bottom action pattern.
- Refined the active processing state into a calmer studio pipeline with visible step states and clearer navigation back to `پروژه‌ها`, while leaving completed and failed review behavior otherwise intact.
- Touched user-facing icons in the edited Phase 4 project-detail/processing surfaces were migrated to `vuesax-icons-react`.
- Gallery crop overlay was left functionally unchanged because no Phase 4 blocker required crop redesign.
- Screenshots were initially skipped per request; follow-up result-review debug screenshots were later captured in `output/playwright/phase-5-debug` to verify the mobile bottom overlay.
- Verification: `npm run check:mojibake` passed and `npm run lint` passed.
- Build caveat: `npm run build` still fails during `prisma generate` with Windows `EPERM rename query_engine-windows.dll.node`, before Next compilation; this matches the known Prisma engine/client issue and is unrelated to Phase 4 UI changes.

Must pass:

- Gallery can scroll naturally, but upload and selection actions are clear.
- New project steps fit `393x852`.
- Each step has one dominant visual object and one primary next action.
- Step progress is visible but quiet.
- Style selection is curated and image-led.
- Processing feels like a controlled studio process, not generic AI animation.

Screenshots: gallery empty, gallery populated, source step, size step, style step, processing.

## Phase 5: Result Review And Project Ownership

Status: Done on 2026-05-11.

Goal: make the completed result feel like the core value moment and keep project ownership clear.

Scope: project detail completed/processing/failed states, fullscreen result, projects list, project card menus.

Completion notes:

- Added a compact ownership strip to project detail so title, style, status, and created time stay visible in completed, processing, and failed states without crowding the image.
- Made before/after comparison more discoverable in completed review and fullscreen review with quiet hold-to-compare guidance while preserving the dark studio result focus.
- Kept save/download as the dominant completed-state action and kept new-version and retry actions visually secondary.
- Calmed the failed-state presentation by using the same ownership rhythm as completed review while preserving the retry path, support code, and credit reassurance.
- Improved project cards with clearer ready/processing/failed cues, stronger title/style/date ownership signals, and menu ordering that prioritizes viewing and saving before secondary actions.
- Screenshots were intentionally skipped for this phase per request.
- Verification: `npm run check:mojibake` passed and `npm run lint` passed.
- Build caveat: `npm run build` still fails during `prisma generate` with Windows `EPERM rename query_engine-windows.dll.node`, before Next compilation; this matches the known Prisma engine/client issue and is unrelated to Phase 5 UI changes.

Must pass:

- Completed result review fits `393x852`.
- Save/download is primary; retry/new version is secondary.
- Before/after compare is discoverable without clutter.
- Failed state is calm and recoverable.
- Projects list scrolls naturally and uses the shared media-card system.

Screenshots: completed result, fullscreen result, failed result, processing, projects list.

## Phase 6: Account, Billing, Support, And Settings

Status: Done on 2026-05-11.

Goal: make utility screens organized, premium, and trustworthy without pretending they are studio moments.

Scope: account, billing, profile, output settings, security, referral, FAQ, support.

Completion notes:

- Reworked the shared account subpage shell so Phase 6 pages use clearer header hierarchy, shared section headers, and calmer utility-card rhythm.
- Rebuilt the main account screen around clearer groupings for identity, credit/subscription, billing follow-up, support, settings, and the admin entry.
- Reworked billing into a clearer payment workflow with repaired Persian copy, stronger package/credit separation, calmer card-to-card presentation, and more explicit receipt status handling.
- Polished profile, security, output settings, referral, FAQ, and support with better section rhythm and migrated the touched user-facing icons to `vuesax-icons-react`.
- Repaired mojibake that was still present in the Phase 6 account and billing surfaces.
- Screenshots were intentionally skipped for this phase per request.
- Verification: `npm run check:mojibake` passed and `npm run lint` passed.
- Build caveat: `npm run build` still fails during `prisma generate` with Windows `EPERM rename query_engine-windows.dll.node`, before Next compilation; this matches the known Prisma engine/client issue and is unrelated to Phase 6 UI changes.

Must pass:

- Account clearly separates identity, credit, subscription, support, and settings.
- Billing clearly separates packages, credits, card-to-card details, receipt upload, and status.
- Forms use standardized fields and buttons.
- Long utility screens scroll naturally with clean section rhythm.
- Admin entry appears only for admins and is clear but not loud.

Screenshots: account, billing states/tabs, support, FAQ.

## Phase 7: Admin Alignment

Goal: make admin operational, compact, and visually related to Ovala.

Scope: admin layout, home, users, projects, assets, packages, styles, provider events, support, access/credits.

Must pass:

- Admin uses Ovala tokens and typography but stays denser than user app.
- Navigation is practical and does not mimic user bottom nav.
- Tables, lists, and forms are scannable on mobile and desktop.
- Provider/debug controls remain admin-only.
- Package and payment operations feel trustworthy, not decorative.

Screenshots: admin home, users, packages, projects, styles at `393x852`; desktop admin where density matters.

## Final UI Release Gate

- Screenshot capture is not required unless explicitly requested.
- No visible mojibake remains in user/admin UI.
- User routes feel phone-native and intentionally centered on desktop.
- Focused task screens do not accidentally scroll.
- Content-heavy screens scroll only where content requires it.
- Button hierarchy, logo usage, dark studio mode, and motion match this roadmap.
- User-facing text-to-image remains out of scope.

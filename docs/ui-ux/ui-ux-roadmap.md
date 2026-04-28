# Gold Studio UI/UX Greenfield Roadmap

## Source of Truth
This document replaces the previous phased UI roadmap.

The old Phase 1-7 execution plan is rejected as product direction and must not be continued.

## North Star
Gold Studio is a **greenfield premium mobile-first AI product photography studio** built inside the existing repository.

Target feeling:
- Luxury product photography atelier
- Apple-like creative tool quality
- Premium editorial image app
- Fashion/luxury brand production interface
- Calm cinematic studio

Must not feel like:
- SaaS dashboard
- Persian admin panel
- CRM/tooling console
- Form-builder app
- Generic Tailwind template
- Beige card/KPI dashboard

## Core Product Flow (Emotional Center)
1. Enter Gold Studio
2. Upload product image
3. Choose premium visual direction
4. Generate high-end product/ad image
5. Review result in a beautiful reveal room
6. Download or create another

Archive, admin, and auth exist as support systems, not the emotional core.

## Greenfield Implementation Boundaries
- Existing UI, layout, and screen composition are **not authoritative design references**.
- Existing screens are technical prototypes only.
- Agents may reconstruct composition and hierarchy from scratch when needed.
- Reuse existing code only when it preserves useful behavior or reduces risk.
- Preserve working generation capability where useful.
- Preserve Persian/RTL/UTF-8 integrity.

## GREENFIELD UI ROADMAP

### Phase 0 — Docs Reset + Greenfield Product Definition
- Clean old roadmap assumptions
- Define new north star
- Reject current UI as design reference
- Define technical reuse boundaries

### Phase 1 — Visual Foundation From Scratch
- Rebuild global tokens
- Rebuild typography scale
- Rebuild spacing system
- Establish black/ivory/editorial identity
- Remove beige SaaS visual baseline
- Define premium primitive layer

### Phase 2 — New App Shell + Information Architecture
- Rebuild app shell from scratch
- No dashboard chrome
- Minimal brand identity
- Mobile-first studio navigation
- Route experience decision:
  - `/` = premium landing/start
  - `/studio` or `/projects/new` = main creation studio
  - `/projects/[projectId]` = result reveal room
  - `/projects` = secondary archive
  - `/admin` = hidden utility

### Phase 3 — Main Studio Creation Flow
- Upload stage
- Style direction selection
- Prompt/refinement stage (if needed)
- Generation action
- Aggressive UX simplification
- Image-first, not form-first

### Phase 4 — Result Reveal Room
- Generated image dominates
- Source/result relationship is clear
- Download/create another actions are obvious
- Premium reveal composition
- Stable pending/failed states

### Phase 5 — Premium Motion System
- Apple-like smoothness
- Page transitions
- Upload preview transitions
- Style selection motion
- Result reveal motion
- Reduced-motion support

### Phase 6 — Archive/Auth/Admin Minimal Polish
- Only after core flow is visually outstanding
- Secondary screens remain quiet
- Prevent dashboard creep

### Phase 7 — Screenshot QA + Visual Hardening
- Mobile screenshots per core screen
- First viewport review
- Remove text clutter
- Remove nested card stacks
- Fix hierarchy and emphasis
- Final demo readiness

## Completion Gate Per Phase
No phase is complete until core screens are screenshot-worthy and align with this document.

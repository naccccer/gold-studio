# Gold Studio Design Language (Greenfield)

## Positioning
Gold Studio is a premium, mobile-first, Farsi-first, RTL-first AI product photography studio.

Design target: calm cinematic editorial production tool.

## Non-Negotiable Product Tone
Gold Studio should feel like:
- Luxury product photography atelier
- Apple-like creative production tool
- Premium editorial image workflow
- Minimal, confident, image-led studio

Gold Studio must not feel like:
- Dashboard SaaS
- Admin template
- KPI/analytics app
- Beige card stack UI
- Generic Tailwind catalog layout

## Hard Design Rules
1. Current UI is rejected as visual reference.
2. Existing screens are technical prototypes only.
3. Future agents may reconstruct screen composition from scratch.
4. Preserve working generation capability where useful.
5. Preserve Persian/RTL/UTF-8.
6. Do not build dashboard-first.
7. Do not use beige card stacks.
8. Do not use nav pill rows.
9. Do not make first viewport mostly text.
10. Do not use KPI cards unless explicitly requested.
11. Do not overuse borders.
12. Do not create generic Tailwind layouts.
13. Use image-led composition.
14. Use strong typography hierarchy.
15. Use black/charcoal as premium anchor.
16. Champagne/gold is sparse accent only.
17. Mobile-first means vertical storytelling, not stacked cards.
18. Every core screen needs one dominant visual focus.
19. Copy must be reduced aggressively.
20. UI must look screenshot-worthy before moving to the next phase.

## Core Flow Priority
The default hierarchy for product decisions is:
1. Upload product image
2. Choose visual direction
3. Generate premium output
4. Reveal result beautifully
5. Download or create another

Any UI element not helping this flow is secondary.

## Visual System Direction
- **Color anchor:** black/charcoal + ivory/soft-white foundation.
- **Accent:** sparse champagne/gold for selected/premium emphasis only.
- **Composition:** editorial whitespace, image-dominant, low-chrome shell.
- **Typography:** clear hierarchy; strong heading/body contrast without decorative noise.
- **Surfaces:** minimal, quiet, and few; avoid nested bordered containers.
- **Copy:** concise Persian microcopy; no verbose instructional blocks in first viewport.

## Motion Direction
- Smooth, calm, premium transitions (Apple-like quality, not imitation).
- Motion supports orientation, confidence, and reveal.
- No decorative bounce/noise patterns.
- Reduced-motion support is mandatory.

## Anti-Patterns (Banned By Default)
- Dashboard home grids
- KPI/stat cards in primary viewport
- Dense nav pills and badge rows
- Beige monochrome enterprise cards
- Generic marketing/SaaS section stacking
- Text-heavy hero blocks with weak image presence
- Border-heavy screen composition

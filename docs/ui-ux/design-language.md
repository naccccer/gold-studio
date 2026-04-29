# Gold Studio Design Language

## Core Principle
Gold Studio must look and feel like a calm luxury AI creative studio. Every screen should prioritize the user workflow and product images over system chrome, metrics, decoration, or generic components.

If a design choice makes the product feel like a startup SaaS dashboard, remove it.

## Emotional Brand Mood
- Private: the user feels they are entering a focused studio, not a public dashboard.
- Editorial: composition, whitespace, and image framing should feel intentional.
- Quietly premium: luxury comes from restraint, not ornament.
- Helpful: the interface should guide non-technical sellers through AI generation without exposing technical complexity.
- Confident: copy and hierarchy should be clear, short, and decisive.

## Typography Philosophy
- Use Vazirmatn as the default product UI/body typeface.
- Farsi is the primary language; RTL is the default layout direction.
- Typography hierarchy must rely on size, weight, spacing, and placement, not color noise.
- Headings should usually be medium weight, charcoal, and calm.
- Body text should be readable and concise.
- Labels and captions must remain legible; never shrink them into decorative microcopy.
- Buttons, inputs, tabs, status pills, and navigation must have deliberate typography.
- Do not use negative letter spacing.
- Use Doran only for short editorial display titles (usually 4-5 words max).
- Do not use Doran for paragraphs, labels, buttons, forms, navigation, metadata, or helper text.
- Do not use multiple font families to create drama.

Measurable tendency:
- App screen headers should usually feel lighter than the main content module.
- One screen should rarely need more than three visible text hierarchy levels above body/caption.
- Avoid using accent color as a substitute for hierarchy.

## Whitespace Philosophy
- Whitespace is a primary luxury signal.
- The eye should move through one decision at a time.
- Upload, image preview, style choice, and generated result need more room than metrics, navigation, or settings.
- Mobile screens should breathe vertically rather than compressing desktop density.
- Desktop screens may widen content, but should not become dense dashboards.

Measurable tendency:
- Content modules should not fill every available gap with cards.
- Related elements should be grouped by spacing before borders or shadows are added.
- If a screen feels busy on mobile, remove or defer secondary information before reducing spacing.

## Color Hierarchy
- Background: warm ivory.
- Main surface: soft white with warmth.
- Secondary surface: quiet ivory/stone.
- Primary text: charcoal.
- Secondary text: muted stone.
- Borders: muted stone.
- Accent: restrained champagne-gold.
- Danger: muted red.

Measurable tendency:
- Accent gold must be sparse and must never become the dominant fill color of a screen.
- Content surfaces should rarely exceed medium contrast from the page background.
- Borders should separate, not frame aggressively.
- Gold should mark focus, selected state, premium action, or subtle admin hint only.
- Avoid bright green success, bright red errors, and saturated blues/purples.

## Border And Radius Rules
- Borders create quiet structure; they should not make the UI feel boxed-in.
- Default radius should be restrained.
- Larger radius is allowed for major shells or image frames only when it supports the composition.
- `rounded-full` is reserved for true pills, tiny counters, and status pills.
- Nested card structures are strongly discouraged.
- Repeated list items should often use rows, spacing, or subtle dividers instead of heavy cards.

Measurable tendency:
- Shell/header visual weight must stay lighter than content.
- If everything is inside a rounded card, the screen is wrong.
- If the first impression is "cards" rather than "workflow" or "image", redesign the composition.

## Shadow And Material Rules
- Shadows are rare.
- Prefer borders and spacing over elevation.
- Use one soft shell shadow at most when needed.
- Repeated items should usually not have shadows.
- Do not use glow effects.
- Do not use glassmorphism or heavy backdrop blur as a default style.

Measurable tendency:
- A screen should not contain multiple competing elevated panels.
- A shadow should never be stronger than the content it supports.

## Iconography Rules
- Icons must clarify scanning or action.
- Icons are not decoration.
- Use simple line icons with consistent stroke and size when icons are introduced.
- Icon color follows text hierarchy: charcoal for primary, muted stone for secondary, champagne only for selected or premium emphasis.
- Do not create dense icon grids.
- Do not replace clear Farsi labels with unexplained icons.

## Image Treatment Philosophy
- Images are the product experience.
- Source and generated images should have stable, elegant frames.
- The generated image should dominate result review screens.
- Avoid unexpected crops that hide product identity.
- Use neutral studio-like framing around images.
- Empty states may use restrained visual samples, but must not look like stock art or placeholders.
- Product images should feel inspectable, not decorative.

Measurable tendency:
- On workflow and result screens, image-related modules should attract the eye before metrics or navigation.
- Image frames should be visually calmer than the image content.

## Interaction Tone
- Interactions should feel calm, precise, and reversible where possible.
- Hover and focus states must be visible but subtle.
- Selected states should be clear through border, surface, and sparse accent, not loud color fills.
- Loading states should keep layout stable and explain what is happening in simple Farsi.
- Errors should be readable and helpful without visual alarm.

## Motion Language
Motion should make Gold Studio feel slow, confident, tactile, and intentional. It should support the product photography flow, not decorate it.

Apple-like means polished, consistent, responsive, and calm. It does not mean copying Apple visuals, using glossy effects, or adding motion for spectacle.

Timing and easing:
- Microinteractions should usually feel quick but soft: about 120-180ms.
- Page, shell, modal, and image reveal transitions may be slower: about 220-360ms.
- Generation and result reveal motion may feel more cinematic when useful, but should still respect user control and perceived speed.
- Prefer smooth ease-out or custom luxury easing with a soft landing.
- Avoid bouncy, springy SaaS motion unless a very small tactile press state truly needs it.

Restraint and smoothness:
- Motion must clarify focus, selection, progress, hierarchy, and completion.
- Use fewer, better transitions rather than many small animated decorations.
- Hover states should not wiggle, pulse, shimmer, or compete with images.
- Loading should feel composed: progress, staged reveal, quiet skeleton, or image emergence before generic spinners.
- Motion should never hide important Persian copy, delay a primary action, or make the interface feel childish.

Measurable tendency:
- A screen should have one dominant motion idea at a time.
- Motion values should come from shared constants when implemented.
- Reduced-motion users should receive stable state changes with minimal or no movement.

## Forbidden SaaS Patterns
The following are banned unless the user explicitly asks for them and the design rationale is documented:

- KPI dashboard cards as the main home screen.
- Loud colored badges for normal statuses.
- Dark admin bars or heavy enterprise top bars.
- Oversized rounded CTA pills used everywhere.
- Dense icon grids or decorative icon rows.
- Startup gradient hero cliches.
- Purple/blue SaaS gradients.
- Glass panels and backdrop blur as a signature style.
- Fake analytics charts, fake metrics, or invented proof numbers.
- Enterprise sidebars for the MVP user flow.
- Pricing-card visual language for style selection.
- Marketing feature grids inside the actual app workflow.
- Repeated card stacks where an editorial layout or guided workflow is needed.

## Forbidden Visual Patterns
- Generic Tailwind component-library layouts.
- Amber dashboard cliches or gold overuse.
- Giant rounded cards everywhere.
- Decorative pills, badges, or eyebrow labels that do not serve workflow.
- Low-contrast beige monotone screens.
- Image placeholders that look unfinished or technical.
- Browser-default input/button typography.
- Dense enterprise tables as the primary user experience.

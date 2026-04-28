# Gold Studio Design Language

## Emotional Brand Mood
Gold Studio should feel like a quiet luxury creative studio: private, attentive, editorial, and confident. The interface should suggest care and taste without looking ornamental. It should guide small sellers through a premium AI workflow with calm assurance.

Use restraint as the main luxury signal. The best screen should feel intentionally composed, not decorated.

## Typography Philosophy
- Use Vazirmatn as the product typeface.
- Treat Farsi as the primary language and RTL as the native layout direction.
- Prefer clear hierarchy over dramatic size jumps.
- Use medium weight for headings and important controls; avoid heavy bold unless it marks a true primary action.
- Body copy should be short, warm, and useful.
- Labels and captions should be quiet and readable, not tiny decorative text.
- Do not use negative letter spacing.
- Do not rely on browser-default typography for buttons, inputs, tabs, or status elements.

## Whitespace Philosophy
- Whitespace is a core luxury material.
- Keep one primary decision visible at a time whenever possible.
- Give image previews, upload modules, and result areas more room than metrics or secondary navigation.
- Avoid dense card grids unless the content is truly an archive or repeated collection.
- On mobile, use vertical rhythm and section breathing room instead of squeezing desktop chrome into a narrow viewport.

## Color Hierarchy
- Background: warm ivory.
- Main surfaces: soft white with warmth, not pure clinical white.
- Secondary surfaces: quiet ivory/stone tones.
- Text: charcoal and warm dark neutrals.
- Muted text: stone gray/brown neutrals.
- Borders: muted stone, always soft.
- Accent: restrained champagne-gold for focus, selected state, premium actions, and subtle admin hints.
- Danger: muted red, never loud.

The accent color is not a theme flood. It should appear only where it helps hierarchy or interaction.

## Border and Radius Rules
- Use borders to create soft structure, not heavy boxes.
- Prefer muted stone borders over shadows for most separation.
- Use restrained radii by default: small to medium corners feel more premium than oversized blobs.
- Reserve larger radii for image frames or major shell containers only when the composition needs softness.
- Avoid `rounded-full` except for status pills, small counters, or intentionally pill-shaped controls.
- Avoid nested cards. If a surface already frames a section, inner content should usually be open, separated by spacing, rows, or subtle dividers.

## Shadow and Material Rules
- Shadows should be rare, soft, and shallow.
- Prefer paper-like surfaces over floating panels.
- Do not use glow effects as decoration.
- Do not use glassmorphism or heavy backdrop blur as a default visual language.
- Main shells may use one soft shadow; repeated items should usually use borders and spacing.

## Iconography Rules
- Use icons only when they clarify action or scanning.
- Prefer simple line icons with consistent stroke and size.
- Do not use icons as filler decoration.
- Buttons with common actions may use icons, but text should remain clear for Farsi users.
- Icon color should follow text hierarchy: charcoal for primary, muted stone for secondary, champagne only for selected or premium emphasis.

## Image Treatment Philosophy
- Images are the product. They should dominate workflow and result screens.
- Source and generated images need stable, elegant framing.
- Avoid cropping product photos unexpectedly unless the surrounding component clearly communicates it as a preview.
- Use neutral studio-like backgrounds around images.
- Result screens should feel closer to an editorial review room than a file manager.
- Empty states may use restrained visual samples, but never generic stock-like illustrations.

## Interaction Tone
- Interactions should feel calm and deliberate.
- Hover/focus states should be subtle but visible.
- Loading and generation states should reduce anxiety with clear progress language and stable layout.
- Selected states should be obvious through border, surface, and small accent use, not loud color fills.
- Error states should be helpful, human, and visually controlled.

## Forbidden Visual Patterns
- Startup SaaS dashboard templates.
- Analytics-first home screens.
- Loud radial gradients, neon glows, and decorative blobs.
- Amber dashboard cliches or gold overuse.
- Giant rounded cards everywhere.
- Dense enterprise tables as primary user experience.
- Generic Tailwind component-library layouts.
- Decorative pills, badges, or eyebrow labels that do not serve workflow.
- Low-contrast beige monotone screens.
- Image placeholders that look unfinished or technical.


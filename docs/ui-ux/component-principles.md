# Gold Studio Component Principles (Greenfield)

## Core Principle
Components exist to serve the premium studio flow, not to mimic dashboard UI kits.

## Dominance Rule (Per Core Screen)
Each core screen must have exactly one dominant visual focus:
- Upload screen: upload/preview module
- Style selection: style direction focus
- Generation state: progress/reveal focus
- Result screen: generated image focus

If attention is split across many equal cards, the screen is wrong.

## App Shell
- Shell must be quiet and minimal.
- No dashboard chrome.
- No heavy top bars or admin-like framing.
- Navigation supports flow orientation, not brand decoration.
- First viewport should prioritize product action/image context over text blocks.

## Navigation
- Keep route wayfinding simple and low-noise.
- No nav pill rows.
- No badge-heavy tabs.
- No dense multi-action command bars in the main mobile viewport.

## Typography and Copy
- Strong hierarchy with minimal levels.
- Farsi-first, RTL-first, concise copy.
- Remove non-essential helper text aggressively.
- Avoid long explanatory paragraphs in core creation steps.

## Surfaces, Borders, and Cards
- Prefer composition, spacing, and type hierarchy before adding containers.
- Avoid nested bordered cards.
- Avoid repeating generic card tiles for every block.
- Border usage should be sparse and structural only.

## Image-Led Composition
- Images are product value and must lead composition.
- Upload preview and generated result should receive largest visual area.
- Keep surrounding UI quiet so image quality is legible.
- Avoid tiny image thumbnails surrounded by dense form controls.

## Buttons and Actions
- One clearly primary action per step.
- Secondary actions are visually quiet.
- Do not turn all actions into equal CTA buttons.
- Keep action labels short and direct.

## Mobile-First Storytelling
- Mobile-first means intentional vertical narrative.
- It does **not** mean stacking many desktop cards vertically.
- Each scroll segment should represent one decision.

## Reuse Boundaries
- Reuse technical behavior and stable logic where beneficial.
- Do not preserve legacy composition because it already exists.
- Replacement is preferred over incremental decoration when quality is insufficient.

## Quality Gate
Before completing component work, validate:
- Is this image-first?
- Is hierarchy obvious in the first viewport?
- Does it avoid dashboard/card-template patterns?
- Is one dominant visual focus clear?

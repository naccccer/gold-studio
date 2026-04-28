# Gold Studio Component Principles

## App Shell
Visual dominance order:
1. Current workflow or primary content.
2. Primary action, usually starting a project.
3. Navigation and account/admin controls.

Mobile behavior:
- Use compact, wrapping or stacked navigation.
- Keep shell padding comfortable but not bulky.
- Do not let the header consume the first viewport.

Desktop behavior:
- Center content with a restrained max width.
- Shell/header should stay visually lighter than page content.
- Do not introduce a heavy sidebar unless a future product phase requires it.

Anti-patterns:
- Enterprise sidebars.
- Dark admin bars.
- Badge-heavy navigation.
- Header chrome that visually dominates images or workflow.

## Headers
Visual dominance order:
1. Screen title.
2. Short context or next-step guidance.
3. Secondary metadata.

Mobile behavior:
- Titles should wrap cleanly in Farsi.
- Support copy should be short enough to scan.
- Avoid multi-line decorative brand labels.

Desktop behavior:
- Headers may align with actions, but should not become dashboard mastheads.
- Keep vertical spacing calm and predictable.

Anti-patterns:
- Oversized dashboard headings inside app screens.
- Repeated brand eyebrows.
- Long explanatory paragraphs.
- Accent-colored headings used for decoration.

## Navigation
Visual dominance order:
1. Primary workflow route, especially `پروژه جدید`.
2. Current section orientation.
3. Secondary routes and logout.

Mobile behavior:
- Navigation must remain tappable and avoid crowded rows.
- Wrapping is acceptable if spacing remains composed.
- Avoid horizontal scrolling nav for the MVP.

Desktop behavior:
- Navigation can sit in the header but must stay quiet.
- Do not convert MVP navigation into a dense app console.

Anti-patterns:
- Full enterprise sidebars.
- Many equal-weight pills.
- Loud active states.
- Icons without clear labels.

## Buttons
Visual dominance order:
1. Primary action.
2. Secondary action.
3. Tertiary/navigation action.

Mobile behavior:
- Touch targets must be stable and comfortable.
- Full-width buttons are acceptable for primary form submission.
- Multiple buttons should stack when horizontal space is tight.

Desktop behavior:
- Buttons may be inline, but the primary action must remain obvious.
- Avoid oversized CTAs in app interiors.

Anti-patterns:
- Oversized rounded CTA pills everywhere.
- Champagne/gold filled buttons as the default.
- Too many primary buttons on one screen.
- Screen-local button styles that bypass `src/components/ui/button.tsx`.

## Fields
Visual dominance order:
1. Input task.
2. Label.
3. Hint or validation message.

Mobile behavior:
- Inputs must be easy to tap.
- Labels and error messages must not crowd the field.
- File inputs should be visually adapted into upload modules in workflow phases.

Desktop behavior:
- Fields should not stretch to unreadable widths without reason.
- Group related fields with spacing before adding containers.

Anti-patterns:
- Browser-default file/input styling as the final UI.
- Loud focus rings.
- Tiny labels.
- Technical validation language when user-friendly Persian is possible.

## Surfaces
Visual dominance order:
1. Content inside the surface.
2. Surface grouping.
3. Border/shadow.

Mobile behavior:
- Surfaces should not create nested scrolling or cramped cards.
- Use fewer, more purposeful surfaces.

Desktop behavior:
- Surfaces may align into columns only when it improves workflow scanning.
- Empty desktop space is acceptable and often desirable.

Anti-patterns:
- Cards inside cards.
- Every content block as a card.
- Strong shadows on repeated items.
- High-contrast panels that overpower images.

## Status Pills
Visual dominance order:
1. Status text.
2. Semantic tone.
3. Decorative shape, if any.

Mobile behavior:
- Pills must remain compact and readable.
- They should not push important titles or actions out of view.

Desktop behavior:
- Status can align with titles or rows, but should remain secondary.

Anti-patterns:
- Loud colored badges.
- Status pills used as decoration.
- Bright green/red status treatments.
- Many pills competing in the same header.

## Upload Modules
Visual dominance order:
1. Upload action or selected image preview.
2. File constraints and guidance.
3. Secondary replacement/removal controls.

Mobile behavior:
- Upload area should be large and obvious.
- Once selected, the image preview should become dominant.
- File guidance should remain visible but secondary.

Desktop behavior:
- Upload and preview may sit beside style choice only if the flow remains easy to follow.
- Do not create a dense two-column form just because space exists.

Anti-patterns:
- Raw technical file input as the main visual.
- Tiny upload targets.
- Upload modules that look like generic SaaS dropzones.
- Too many helper notes before the user chooses a file.

## Style Selector Cards
Visual dominance order:
1. Selected style.
2. Style name.
3. Short description or visual sample.

Mobile behavior:
- Style options should be easy to compare without overwhelming.
- Use vertical rhythm and clear selected states.
- Avoid showing too many competing details.

Desktop behavior:
- Grid layout is acceptable if each option remains calm and premium.
- Visual samples may be introduced later, but must stay consistent.

Anti-patterns:
- Pricing-card styling.
- Feature-card styling.
- Loud gold fills for selected state.
- Long descriptions or technical prompt language in the UI.

## Result Galleries
Visual dominance order:
1. Generated result.
2. Download/next action.
3. Source image and generation metadata.

Mobile behavior:
- Result image should be easy to inspect.
- Source and result can stack vertically.
- Download action should be visible after the result without hunting.

Desktop behavior:
- Before/after comparison may use columns if both images remain large enough.
- Generated result should still feel primary when complete.

Anti-patterns:
- Result page as a file details page.
- Tiny image thumbnails.
- Metadata stronger than image review.
- Cropping that hides product shape or material.

## Modals And Dialogs
Visual dominance order:
1. Required decision.
2. Consequence or context.
3. Secondary/cancel action.

Mobile behavior:
- Dialogs should fit comfortably and avoid hidden primary actions.
- Prefer inline flows when possible.

Desktop behavior:
- Dialog width should stay modest.
- Keep action hierarchy clear.

Anti-patterns:
- Dramatic overlays.
- Heavy shadows.
- Multi-step workflows hidden inside modals.
- Dialogs used as decoration or layout shortcuts.

## Admin Screens
Visual dominance order:
1. Operational task.
2. User/project data needed for that task.
3. Counts and secondary metadata.

Mobile behavior:
- Rows may stack.
- Forms must stay tappable.
- Admin density can be higher than user flow, but not cramped.

Desktop behavior:
- Tables/rows may be practical, but keep styling aligned with tokens.
- Admin screens should stay visibly secondary to the product workflow.

Anti-patterns:
- Dark admin chrome.
- Loud amber panels.
- Dense enterprise dashboards.
- Admin metrics treated as product hero content.
- Admin-specific styling that breaks the shared visual system.


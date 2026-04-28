# Gold Studio Component Principles

## App Shell
The app shell should feel like entering a private studio workspace. It should be quiet, mobile-first, and light on chrome. The shell may frame the experience, but it must not compete with the workflow or images.

Keep navigation visible enough to orient the user, but make the main action, usually creating a project, more prominent than browsing or metrics.

## Headers
Headers should establish context in a few words. Use concise Farsi titles and short supportive text only when it helps the next action.

Avoid large dashboard headers, decorative labels, or repeated brand badges. Header typography should be confident, calm, and not oversized inside app screens.

## Navigation
Navigation should be minimal and route-based. Prefer a small set of clear destinations: studio home, projects, new project, admin when applicable, and logout.

Navigation should not become a full enterprise sidebar unless the product scope truly grows. On mobile, nav items must wrap or stack cleanly without crowding.

## Buttons
Buttons should be restrained and intentional.

Primary buttons use charcoal surfaces and soft white text. Secondary buttons use soft surfaces, muted borders, and charcoal text. Ghost buttons should be quiet and suited for secondary navigation. Champagne accents may appear for focus, selected, or premium emphasis, but not as loud filled default buttons.

Use restrained radii. Avoid defaulting to pill buttons unless the component is intentionally pill-shaped.

## Fields
Fields should feel calm and trustworthy. Use soft white backgrounds, muted stone borders, readable labels, and clear focus states.

Inputs must be large enough for mobile touch, with stable height and no cramped text. Hints should be concise. Error messages should be gentle but clear, using muted danger colors.

## Surfaces
Surfaces are paper-like containers, not decorative cards. Use them to group related work, not to make every piece of content into a card.

Prefer soft borders and whitespace. Shadows should be rare. Avoid nested surfaces unless there is a real modal, repeated item, or framed tool.

## Status Pills
Status pills should be calm and scannable. The default state is neutral and token-based.

Future semantic states should remain restrained:
- pending: quiet waiting state, not warning-like
- completed: premium success, subtle champagne rather than bright green
- failed: muted danger, readable but not alarming

Status pills should never become decorative badges.

## Upload Modules
Upload modules should feel like the first studio action, not a technical file input. They need generous space, clear accepted file guidance, and a strong selected-file state.

The uploaded image preview should become more important than the form chrome once a file is selected. Keep validation and file constraints visible but secondary.

## Style Selector Cards
Style choices should feel like premium creative directions. Each option should be easy to compare, but the screen should not overwhelm users with too many simultaneous decisions.

Use concise Farsi labels, short descriptions, selected-state clarity, and restrained visual emphasis. In future phases, style cards may include visual samples, but they must not look like generic pricing or feature cards.

## Result Galleries
Result areas should prioritize visual review. Source and generated images need stable framing, clear labels, and enough space to inspect product quality.

The completed result should make download obvious. Pending and failed states should keep the frame stable and explain what happened without pushing users into technical details.

## Modals and Dialogs
Use dialogs sparingly. They should interrupt only for confirmation, destructive actions, or focused tasks that cannot live comfortably inline.

Dialogs should use the same soft surface, muted border, restrained radius, and clear action hierarchy as the rest of the system. Avoid dramatic overlays or heavy shadows.

## Admin Screens
Admin screens are operational, but they should still belong to Gold Studio. Keep them compact, readable, and calm.

Admin should not receive the same editorial polish priority as the core user flow, but it must avoid harsh dashboard styling, loud amber panels, and dense enterprise chrome. Use practical rows, clear forms, and restrained token-based styling.


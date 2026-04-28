# Gold Studio Conventions

## Product conventions
- Build mobile-first
- Build Farsi-first
- Treat RTL as the default layout direction
- Keep flows simple and low-friction

## Code conventions
- Prefer small components
- Edit existing files before adding new ones
- Avoid duplicate helpers
- Keep secrets out of code
- Preserve App Router conventions

## Agent conventions
- Make small, focused changes
- Keep docs short and current
- Prefer practical implementation over speculative architecture
- When scope or progress changes, update `roadmap.md`

## Encoding and Persian Copy Rules
- All source/docs files must be saved as UTF-8.
- Never paste already-corrupted mojibake text.
- If Persian appears as Ã, Â, Ø, Ù, Û, Ú, â, or �, stop and fix encoding before editing.
- Prefer direct UTF-8 Persian strings in TSX/TS/MD files.
- Do not convert Persian text to escaped unicode unless there is a technical reason.
- On Windows terminals, prefer UTF-8 mode before editing/copying Persian text.

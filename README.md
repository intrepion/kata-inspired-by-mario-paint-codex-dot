# Pollen & Paper

An original mouse-driven creative playground inspired by the creative workflow of **Mario Paint**. Paint a tiny world, design reusable pixel stamps, animate a four-frame flipbook over your picture, and compose an icon-based soundtrack.

## Play locally

Requires Node.js 22.12+ (Node 24 also supported).

```sh
npm ci
npm test
npm run build
npm run preview
```

Open **http://127.0.0.1:5224**. Use `npm run dev -- --port 5224 --strictPort` for development. The production preview binds loopback only; no website is deployed.

## Controls and workflow

- **Paint desk:** choose one of 16 colors; drag Pencil to draw with three brush sizes. Fill colors a connected area. Eraser restores paper. Pick a stamp and click to print it.
- **Stamp workshop:** choose any of four 8×8 prints; click or drag to change pixels. Eraser creates transparent pixels. Prints immediately become available in Paint and Flipbook.
- **Flipbook:** select one of four frames and draw above the shared painting. Copy to next frame duplicates its editable pixels. Select 1–12 frames/second and Play; optionally hear your own score. Stop or Escape ends playback. Switching rooms stops playback.
- **Music garden:** choose ● Dew, ◆ Seed, or ✳ Spark and click a grid cell. Horizontal position is one of 16 beats, vertical position is a C-major pitch from C4 to C5. Click an occupied cell to remove it. Each beat allows three notes. Set 60–200 BPM and Play to loop.
- **Undo:** click Undo or press ⌘Z / Ctrl Z. Thirty successful editing snapshots are retained for this session. Clear affects the current picture, stamp, frame, or score and requires confirmation; Undo reverses it.
- **Keep your work:** edits autosave in this browser under a project-specific key. Export project downloads editable JSON; Import validates and replaces the project with Undo available. Save picture downloads the current drawing/composite as PNG. Clear does not erase other rooms. Undo history and editor selection do not persist after reload.

Mouse/pointer input and a fixed 2D canvas are primary. Small screens stack the toolkit above the paper; they do not introduce a different camera.

## Research and scope

The [original instruction manual](https://www.mariomayhem.com/downloads/mario_instruction_booklets/Mario_Paint-snes.pdf) establishes paint tools, stamps, frame animation and icon-selected music. Nintendo’s [official overview](https://www.nintendo.com/us/whatsnew/mario-paint-scribbles-into-the-super-nes-collection/) emphasizes combining drawings, animation and music. [Research notes](docs/RESEARCH.md) map each supported mechanic to its implementation and distinguish simplifications.

This is a bounded creative slice: four frames, four stamps, 16 beats, three original synthesized voices. No motion paths, 6/9-frame layouts, original samples, text/pattern/shape tools, coloring book or insect-swatting game. Playback uses browser timers and Web Audio; it does not reproduce exact original sound or timing.

All project code and procedural art are original under [MIT](LICENSE). No Nintendo assets, characters, music or code are included. UI uses ordinary text symbols and optional Google Fonts (DM Sans and Outfit, SIL Open Font License; system fallbacks work offline). The official GitHub Global Linux, Windows and macOS ignore templates are retained verbatim in [.gitignore](.gitignore), followed by project exclusions.

## Engineering and verification

Strict TypeScript, Vite and Vitest. Model tests exercise real drawing/fill/stamp/chord operations, JSON validation, cross-mode undo, independent frame copying, room clearing and bounded history. CI runs tests and production build. See [QA](docs/QA.md), [specification](docs/SPEC.md) and [glossary](CONTEXT.md).

Native Chrome acceptance exercised drawing/fill/undo, stamp creation/use, two-frame authoring/playback, music authoring/visual playback, mode retention, clear safeguards, export/import, save/reload and narrow layout. Audible sound was not independently heard; visual playback is distinguished from acoustic acceptance.

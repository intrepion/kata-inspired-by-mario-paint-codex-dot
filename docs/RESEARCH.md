# Research and fidelity boundaries

Research conducted before implementation, 16 October 2026. No source art or audio is included in this repository.

## Primary manual

[Nintendo of America, Mario Paint instruction booklet (1992), archived scan](https://www.mariomayhem.com/downloads/mario_instruction_booklets/Mario_Paint-snes.pdf). Visually read scan PDF pages 4 and 12 (two printed pages per scan spread). Scan page 4 describes the palette, drawing toolbox, utility menu, left-button icon selection, 15 colors, 75 patterns and 120 stamps; its tool index includes undo, erasers, fill, stamp editing, music, animation, saving and Gnat Attack. Scan page 12 describes character-stamp note placement, up to three notes on a beat, play/stop/loop/tempo, and Animation Land with 4/6/9-frame choices and size/path controls. These observations establish the interaction priorities, not a claim that every listed tool is implemented.

## Official gameplay overview

[Nintendo, Mario Paint scribbles into the Super NES collection (28 July 2025)](https://www.nintendo.com/us/whatsnew/mario-paint-scribbles-into-the-super-nes-collection/) describes simple mouse drawing controls and combining pictures, animated sequences and composed music into a collage. That combination motivates the shared painting behind our animation, optional own-score playback and one project file.

## Corroboration

[The Verge, One of Nintendo’s most creative Super Nintendo games is now on the Switch (29 July 2025)](https://www.theverge.com/news/715104/nintendo-mario-paint-super-nintendo-switch-2-online-mouse-mode) corroborates the bundled two-button mouse and playful draw/animate/compose workflow. [Wikipedia gameplay synthesis](https://en.wikipedia.org/wiki/Mario_Paint) helped locate printed manual sections; detailed scope is grounded in the manual and official overview above.

## Implemented interpretation

| Original behavior supported by sources | Our bounded interpretation |
| --- | --- |
| Mouse selected paint tools, colors, fill, erasers, undo | Fixed 160×96 indexed canvas, 16 original palette colors, pencil/fill/eraser/stamp, 30-state undo |
| Character stamps and stamp editor | Four editable 8×8 original geometric prints; transparent erasing |
| Frame drawing, copying, playback; 4/6/9 frame layouts and motion paths | Four transparent full-canvas frames over the painting; copy next; selectable FPS; no paths or alternate layouts |
| Icon-selected sounds placed on a staff, three notes per beat; tempo/play/loop | Three geometric sound icons on a 16×8 diatonic grid; three-note chord cap; toggle delete; original oscillator sounds |
| Combining animation, picture and own music | Shared picture background and optional score during flipbook playback |
| Save/load and insect-swatting diversion | Browser autosave and JSON files; insect diversion omitted to prioritize creation |

No assertion of exact original audio, pitch range, timing, samples, screen layout or comprehensive tool parity. Browser timers and Web Audio provide approximate creative playback rather than archival emulation.

# Verification record

## Automated

- Strict TypeScript: `npm run build`.
- Seven Vitest model tests: connected bounded fill; continuous strokes and stamp clipping; three-note chord limits/toggle removal; project round trip and cross-mode undo; corrupt data rejection; independent frame copy and room clear; thirty-state history cap.
- Dependency audit after updating test tooling: zero reported vulnerabilities.

## Native Mac Chrome

Normal pointer and semantic button inputs were used on the production preview at 127.0.0.1:5224. Original blank project, no injected model state.

1. Drew a closed outline with four drag strokes, selected color/fill, used Undo and placed an original flower stamp.
2. Entered Stamp workshop and painted its first transparent cell. Returned to other rooms without losing edits.
3. Drew frame one, copied to frame two, added another stroke and ran the flipbook. Frame selection advanced; Stop returned control.
4. Placed three Dew icons and a Seed icon in the score, ran music playback and observed the beat highlight. Audio synthesis is implemented, but acoustic output was not independently heard.
5. Opened Clear score confirmation, cancelled, reopened, confirmed and undid. Reload displayed restored-project feedback and the authored notes remained visible.
6. Checked 390×844 viewport: stacked controls and canvas fit the narrow width. Restored normal viewport.
7. Exported through native Save dialog. Inspected only this task-created JSON: 14,619 non-paper painting pixels; transparent-frame nonempty counts [38, 78, 0, 0]; stamp 1 cell 0 became palette index 4; four notes at beats 1–4, pitches 7/6/5/4, voices 0/0/0/1. These are actual user-interface edits retained after reload.
8. Imported the same export through native Open dialog; UI confirmed successful import and available undo.

After export the browser extension debugger became unreliable. Native Chrome file dialogs and accessibility controls remained usable and completed import. No browser security settings were changed. No unrelated tabs, saves or preview processes were altered. Acoustic acceptance remains an explicit limitation.

## Independent reviews

Standards and fidelity were reviewed by separate agents against docs/SPEC.md and the research. Findings: pending audio startup cancellation, incorrect visual-only fallback status, rejected music clicks consuming undo, and a mismatch between an initial purity guideline and the intentional in-place pixel model. Fixed startup with cancellation generations, locked editing during pending playback, accurate audio readiness status and success-only history snapshots. Added frame-copy/clear operations and tests. Converted public drawing, note, clear and frame-copy operations to pure transformations; private raster helpers mutate only fresh output arrays. Added input-preservation assertions.

## Production preview

Detached Node/Vite production preview, loopback port 5224. `.preview.pid` and `.preview.log` are local-only ignored operational files. Preview was verified HTTP 200 and independent of the command session. It survives task completion while the Mac remains running; it is not a login service.

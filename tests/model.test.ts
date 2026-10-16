import { describe, it, expect } from "vitest";
import {
  createProject,
  fill,
  line,
  stamp,
  toggleNote,
  encode,
  decode,
  History,
  copyFrame,
  clearRoom,
} from "../src/model";
describe("creative operations", () => {
  it("fills only a connected enclosed area", () => {
    const g = [0, 1, 0, 0, 1, 0, 1, 1, 1];
    const result = fill(g, 3, 3, 0, 0, 2);
    expect(g).toEqual([0, 1, 0, 0, 1, 0, 1, 1, 1]);
    expect(result).toEqual([2, 1, 0, 2, 1, 0, 1, 1, 1]);
  });
  it("draws continuous strokes and clips stamps at the edge", () => {
    const p = createProject();
    p.painting = line(p.painting, 160, 96, [0, 0], [4, 0], 2, 1);
    expect(p.painting.slice(0, 6)).toEqual([2, 2, 2, 2, 2, 0]);
    p.painting = stamp(p.painting, Array(64).fill(3), 0, 0);
    expect(p.painting[0]).toBe(3);
    expect(p.painting[159]).toBe(0);
    expect(p.painting).toHaveLength(15360);
  });
  it("limits chords and toggles occupied notes", () => {
    let p = createProject();
    for (let pitch = 0; pitch < 3; pitch++)
      p = toggleNote(p, { beat: 0, pitch, voice: 0 });
    expect(p.notes).toHaveLength(3);
    expect(toggleNote(p, { beat: 0, pitch: 4, voice: 1 })).toBe(p);
    const next = toggleNote(p, { beat: 0, pitch: 1, voice: 0 });
    expect(next.notes).toHaveLength(2);
    expect(p.notes).toHaveLength(3);
  });
  it("undo restores all modes and serialization preserves actual edits", () => {
    const p = createProject(),
      h = new History();
    h.capture(p);
    p.painting[100] = 2;
    p.frames[1]![30] = 6;
    p.stamps[3]![0] = 8;
    p.notes.push({ beat: 2, pitch: 5, voice: 1 });
    const restored = decode(encode(p));
    expect(restored).toEqual(p);
    expect(h.undo()).toEqual(createProject());
  });
  it("rejects corrupt saves without accepting invalid indices", () => {
    const p = createProject();
    p.frames[0]![0] = 99;
    expect(() => decode(encode(p))).toThrow();
    expect(() => decode("{}")).toThrow();
  });
});

it("copies independent frames and clears only the selected room", () => {
  let p = createProject();
  p.painting[0] = 2;
  p.frames[0]![0] = 6;
  const original = p;
  p = copyFrame(p, 0);
  expect(original.frames[1]![0]).toBe(-1);
  p.frames[1]![0] = 8;
  expect(p.frames[0]![0]).toBe(6);
  p = clearRoom(p, "animate", 1);
  expect(p.frames[1]![0]).toBe(-1);
  expect(p.frames[0]![0]).toBe(6);
  expect(p.painting[0]).toBe(2);
  p.notes.push({ beat: 0, pitch: 2, voice: 1 });
  p = clearRoom(p, "music");
  expect(p.notes).toEqual([]);
});
it("keeps the most recent thirty reversible changes", () => {
  const p = createProject(),
    h = new History();
  for (let i = 0; i < 35; i++) {
    p.tempo = 60 + i;
    h.capture(p);
  }
  for (let i = 0; i < 30; i++) expect(h.undo()).toBeDefined();
  expect(h.undo()).toBeUndefined();
});

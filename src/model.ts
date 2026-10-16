export const W = 160,
  H = 96;
export const palette = [
  "#fffdf5",
  "#253c38",
  "#f05c45",
  "#f4a641",
  "#f8d969",
  "#78ad78",
  "#356f59",
  "#88c9c5",
  "#438ca6",
  "#565b9c",
  "#a180ba",
  "#e79aa7",
  "#9d674c",
  "#c7b89b",
  "#e0e7d6",
  "#ffffff",
];
export type Note = { beat: number; pitch: number; voice: number };
export type Project = {
  version: 1;
  painting: number[];
  frames: number[][];
  stamps: number[][];
  notes: Note[];
  tempo: number;
  fps: number;
};
export const blank = (w = W, h = H, value = 0) =>
  Array<number>(w * h).fill(value);
const seedStamp = (kind: number) =>
  Array.from({ length: 64 }, (_, i) => {
    const x = i % 8,
      y = Math.floor(i / 8);
    if (kind === 0)
      return (x === 3 || x === 4) && y > 3
        ? 6
        : (x - 3.5) ** 2 + (y - 2.5) ** 2 < 7
          ? 3
          : -1;
    if (kind === 1)
      return (x - 3.5) ** 2 / 12 + (y - 3.5) ** 2 / 5 < 1 ? 7 : -1;
    return Math.abs(x - 3.5) + Math.abs(y - 3.5) < 3.5 ? 2 : -1;
  });
export function createProject(): Project {
  return {
    version: 1,
    painting: blank(),
    frames: Array.from({ length: 4 }, () => blank(W, H, -1)),
    stamps: [seedStamp(0), seedStamp(1), seedStamp(2), blank(8, 8, -1)],
    notes: [],
    tempo: 120,
    fps: 4,
  };
}
function point(
  grid: number[],
  w: number,
  h: number,
  x: number,
  y: number,
  color: number,
  size = 1,
) {
  for (let dy = 0; dy < size; dy++)
    for (let dx = 0; dx < size; dx++) {
      const px = x + dx - Math.floor(size / 2),
        py = y + dy - Math.floor(size / 2);
      if (px >= 0 && px < w && py >= 0 && py < h) grid[py * w + px] = color;
    }
}
export function line(
  input: number[],
  w: number,
  h: number,
  a: [number, number],
  b: [number, number],
  color: number,
  size: number,
) {
  const grid = [...input];
  const steps = Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1]), 1);
  for (let i = 0; i <= steps; i++)
    point(
      grid,
      w,
      h,
      Math.round(a[0] + ((b[0] - a[0]) * i) / steps),
      Math.round(a[1] + ((b[1] - a[1]) * i) / steps),
      color,
      size,
    );
  return grid;
}
export function fill(
  input: number[],
  w: number,
  h: number,
  x: number,
  y: number,
  color: number,
) {
  const grid = [...input];
  if (x < 0 || y < 0 || x >= w || y >= h) return grid;
  const old = grid[y * w + x];
  if (old === color) return grid;
  const stack = [y * w + x];
  grid[y * w + x] = color;
  while (stack.length) {
    const i = stack.pop()!;
    for (const n of [
      i % w > 0 ? i - 1 : -1,
      i % w < w - 1 ? i + 1 : -1,
      i >= w ? i - w : -1,
      i < w * (h - 1) ? i + w : -1,
    ])
      if (n >= 0 && grid[n] === old) {
        grid[n] = color;
        stack.push(n);
      }
  }
  return grid;
}
export function stamp(input: number[], art: number[], x: number, y: number) {
  const grid = [...input];
  for (let sy = 0; sy < 8; sy++)
    for (let sx = 0; sx < 8; sx++) {
      const c = art[sy * 8 + sx]!;
      if (c >= 0) point(grid, W, H, x + sx - 4, y + sy - 4, c);
    }
  return grid;
}
export function toggleNote(p: Project, n: Note): Project {
  const i = p.notes.findIndex((v) => v.beat === n.beat && v.pitch === n.pitch);
  if (i >= 0) return { ...p, notes: p.notes.filter((_, index) => index !== i) };
  if (p.notes.filter((v) => v.beat === n.beat).length >= 3) return p;
  return { ...p, notes: [...p.notes, { ...n }] };
}
export function encode(p: Project) {
  return JSON.stringify(p);
}
export function decode(raw: string): Project {
  const p: unknown = JSON.parse(raw);
  if (!p || typeof p !== "object") throw Error("Invalid project");
  const v = p as Project;
  const grid = (g: unknown, n: number, transparent: boolean) =>
    Array.isArray(g) &&
    g.length === n &&
    g.every(
      (c) =>
        Number.isInteger(c) &&
        c >= (transparent ? -1 : 0) &&
        c < palette.length,
    );
  if (
    v.version !== 1 ||
    !grid(v.painting, W * H, false) ||
    !Array.isArray(v.frames) ||
    v.frames.length !== 4 ||
    !v.frames.every((g) => grid(g, W * H, true)) ||
    !Array.isArray(v.stamps) ||
    v.stamps.length !== 4 ||
    !v.stamps.every((g) => grid(g, 64, true)) ||
    !Array.isArray(v.notes) ||
    v.notes.length > 48 ||
    !v.notes.every(
      (n) =>
        n &&
        Number.isInteger(n.beat) &&
        n.beat >= 0 &&
        n.beat < 16 &&
        Number.isInteger(n.pitch) &&
        n.pitch >= 0 &&
        n.pitch < 8 &&
        Number.isInteger(n.voice) &&
        n.voice >= 0 &&
        n.voice < 3,
    ) ||
    !Number.isInteger(v.tempo) ||
    v.tempo < 60 ||
    v.tempo > 200 ||
    !Number.isInteger(v.fps) ||
    v.fps < 1 ||
    v.fps > 12
  )
    throw Error("Invalid project");
  for (let b = 0; b < 16; b++) {
    const notes = v.notes.filter((n) => n.beat === b);
    if (
      notes.length > 3 ||
      new Set(notes.map((n) => n.pitch)).size !== notes.length
    )
      throw Error("Invalid notes");
  }
  return v;
}
export class History {
  private past: string[] = [];
  capture(p: Project) {
    this.past.push(encode(p));
    if (this.past.length > 30) this.past.shift();
  }
  undo(): Project | undefined {
    const s = this.past.pop();
    return s ? decode(s) : undefined;
  }
  get available() {
    return this.past.length > 0;
  }
}

/** Copy frames without sharing their editable pixel arrays. */
export function copyFrame(p: Project, from: number): Project {
  const frames = [...p.frames];
  frames[(from + 1) % 4] = [...p.frames[from]!];
  return { ...p, frames };
}
export function clearRoom(
  p: Project,
  room: "paint" | "stamps" | "animate" | "music",
  selected = 0,
): Project {
  if (room === "music") return { ...p, notes: [] };
  if (room === "paint") return { ...p, painting: blank() };
  if (room === "stamps") {
    const stamps = [...p.stamps];
    stamps[selected] = blank(8, 8, -1);
    return { ...p, stamps };
  }
  const frames = [...p.frames];
  frames[selected] = blank(W, H, -1);
  return { ...p, frames };
}

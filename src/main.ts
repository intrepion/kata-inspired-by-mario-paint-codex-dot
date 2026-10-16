import "./style.css";
import {
  W,
  H,
  palette,
  createProject,
  line,
  fill,
  stamp,
  toggleNote,
  encode,
  decode,
  History,
  copyFrame,
  clearRoom,
  type Project,
} from "./model";
type Mode = "paint" | "stamps" | "animate" | "music";
type Tool = "pen" | "fill" | "erase" | "stamp";
let playbackGeneration = 0;
let strokeBefore: Project | undefined;
const KEY = "pollen-paper.project.v1";
let project = createProject(),
  mode: Mode = "paint",
  tool: Tool = "pen",
  color = 2,
  size = 2,
  selectedStamp = 0,
  frame = 0,
  playing = false,
  beat = -1,
  timer: number | undefined,
  audio: AudioContext | undefined;
const history = new History();
let initialMessage = "Your little world starts here.";
try {
  const saved = localStorage.getItem(KEY);
  if (saved) {
    project = decode(saved);
    initialMessage = "Welcome back. Your project is restored.";
  }
} catch {
  initialMessage =
    "Saved project could not be read. Export any recovery data before saving.";
}
const app = document.querySelector<HTMLDivElement>("#app")!;
app.innerHTML = `<header><a class="brand" href="#" aria-label="Pollen and Paper home"><span class="brand-flower">✳</span><span>Pollen <i>&</i> Paper<small>A LITTLE CREATIVE PLAYGROUND</small></span></a><div class="header-actions"><span id="save-state">Local studio · autosave</span><button id="export">↓ Export project</button><label class="button">↑ Import<input id="import" type="file" accept="application/json,.json" hidden></label></div></header><main><div class="intro"><div><span class="eyebrow">MAKE SOMETHING JUST BECAUSE.</span><h1>A small studio. Endless happy accidents.</h1></div><span class="edition">VOL. 01<br>THE GARDEN EDITION</span></div><nav aria-label="Creative modes">${(["paint", "stamps", "animate", "music"] as Mode[]).map((m, i) => `<button data-mode="${m}"><span>${["✎", "▦", "▱", "♫"][i]}</span> ${["Paint desk", "Stamp workshop", "Flipbook", "Music garden"][i]}<small>0${i + 1}</small></button>`).join("")}</nav><section class="studio"><aside><div class="section-label">YOUR TOOLKIT <span>↘</span></div><div id="tools" class="tools"></div><div id="paint-options"><div class="section-label">BRUSH SIZE</div><div class="sizes">${[1, 2, 4].map((s) => `<button data-size="${s}" aria-label="Brush size ${s}"><span style="font-size:${s * 5 + 8}px">●</span></button>`).join("")}</div></div><div id="color-label" class="section-label">PICK A COLOR</div><div class="palette">${palette.map((c, i) => `<button data-color="${i}" style="--swatch:${c}" aria-label="Color ${i + 1} ${c}"></button>`).join("")}</div><div id="stamp-picks"><div class="section-label">LITTLE PRINTS</div><div class="stamp-list">${project.stamps.map((_, i) => `<button data-stamp="${i}" aria-label="Select stamp ${i + 1}"><canvas width="8" height="8" id="stamp-${i}"></canvas></button>`).join("")}</div><p class="tiny">Make each print your own in the stamp workshop.</p></div><div id="voices" hidden><div class="section-label">SOUND CHARACTERS</div><button data-voice="0">● Dew · soft sine</button><button data-voice="1">◆ Seed · triangle</button><button data-voice="2">✳ Spark · square</button></div><div class="aside-bottom"><button id="undo">↶ Undo</button><button id="clear" class="danger">⌫ Clear this ${mode}</button></div></aside><div class="workspace"><div class="desk-heading"><div><h2 id="mode-title"></h2><p id="mode-help"></p></div><span id="dimensions" class="pill"></span></div><div class="paper-wrap"><canvas id="paper" width="160" height="96" aria-label="Drawing canvas" tabindex="0"></canvas><div class="paper-corner">P&P</div></div><div id="timeline"></div><div class="transport"><div id="playback-controls"><button id="play" class="primary">▶ Play</button><label id="speed-label">Frames / sec <input id="speed" type="range" min="1" max="12" value="4"><output id="speed-value">4</output></label><label id="with-music"><input id="soundtrack" type="checkbox" checked> With my music</label></div><span id="desk-note">A place for imperfect, wonderful things.</span><button id="png">↓ Save picture</button></div></div></section><footer><span id="status" role="status"></span><span>Draw a little. Play a little. Stay a while. <b>✳</b></span></footer><section class="howto"><span class="eyebrow">A POCKET GUIDE</span><div><h3>One project, four ways to play.</h3><p>Paint a world, print a character, make it move, give it a tune. Everything stays with you as you wander between rooms.</p></div><p><b>Mouse to make.</b> Drag to draw. Click to fill, stamp, or place a note. Click a note again to remove it. ⌘/Ctrl Z to undo.</p><p><b>Made to keep.</b> Changes save in this browser. Export a project file for a backup you can bring back later.</p></section></main><dialog id="confirm"><h2 id="confirm-title">Clear this work?</h2><p>This affects the current room only. You can undo it immediately.</p><div><button id="cancel-clear">Keep creating</button><button id="confirm-clear" class="primary">Yes, clear it</button></div></dialog>`;
const $ = <T extends HTMLElement = HTMLElement>(s: string) =>
  document.querySelector<T>(s)!;
const canvas = $<HTMLCanvasElement>("#paper"),
  ctx = canvas.getContext("2d")!;
let voice = 0,
  dragging = false,
  last: [number, number] = [0, 0],
  strokeDirty = false;
const metadata = {
  paint: [
    "Paint desk",
    "Pick a tool and let your mouse wander.",
    "160 × 96 • PIXEL PAPER",
  ],
  stamps: [
    "Stamp workshop",
    "Edit an 8 × 8 print. Eraser makes transparent pixels.",
    "8 × 8 • FOUR PRINTS",
  ],
  animate: [
    "Flipbook",
    "Paint transparent frames over your picture. Then press play.",
    "4 FRAMES • YOUR PICTURE BEHIND",
  ],
  music: [
    "Music garden",
    "Pick a sound. Click the grid: 16 beats, 8 pitches, 3 notes per beat.",
    "C MAJOR • 16 BEATS",
  ],
};
function status(message: string) {
  $("#status").textContent = message;
}
function save() {
  try {
    localStorage.setItem(KEY, encode(project));
    $("#save-state").textContent = "Saved in this browser";
  } catch {
    status("Storage unavailable or full. Export your project to keep it.");
    $("#save-state").textContent = "Export to save";
  }
}
function changed(message = "A happy little change, saved.") {
  save();
  status(message);
  render();
}
function grid() {
  return mode === "stamps"
    ? project.stamps[selectedStamp]!
    : mode === "animate"
      ? project.frames[frame]!
      : project.painting;
}
function paintPixels(
  context: CanvasRenderingContext2D,
  g: number[],
  w: number,
  h: number,
  checker = false,
) {
  if (checker) {
    context.fillStyle = "#eee9de";
    context.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++)
        if ((x + y) % 2 === 0) {
          context.fillStyle = "#fffdf5";
          context.fillRect(x, y, 1, 1);
        }
  }
  for (let i = 0; i < g.length; i++) {
    const c = g[i]!;
    if (c >= 0) {
      context.fillStyle = palette[c]!;
      context.fillRect(i % w, Math.floor(i / w), 1, 1);
    }
  }
}
function render() {
  document
    .querySelectorAll<HTMLButtonElement>("[data-mode]")
    .forEach((b) => b.classList.toggle("active", b.dataset.mode === mode));
  document
    .querySelectorAll<HTMLButtonElement>("[data-color]")
    .forEach((b) =>
      b.classList.toggle("selected", Number(b.dataset.color) === color),
    );
  document
    .querySelectorAll<HTMLButtonElement>("[data-size]")
    .forEach((b) =>
      b.classList.toggle("selected", Number(b.dataset.size) === size),
    );
  document
    .querySelectorAll<HTMLButtonElement>("[data-stamp]")
    .forEach((b) =>
      b.classList.toggle("selected", Number(b.dataset.stamp) === selectedStamp),
    );
  document
    .querySelectorAll<HTMLButtonElement>("[data-voice]")
    .forEach((b) =>
      b.classList.toggle("selected", Number(b.dataset.voice) === voice),
    );
  $("#undo").toggleAttribute("disabled", !history.available || playing);
  $("#clear").textContent =
    `⌫ Clear ${mode === "animate" ? "frame" : mode === "stamps" ? "stamp" : mode === "music" ? "score" : "picture"}`;
  const [title, help, dimensions] = metadata[mode];
  $("#mode-title").textContent = title!;
  $("#mode-help").textContent = help!;
  $("#dimensions").textContent = dimensions!;
  $("#color-label").hidden = mode === "music";
  $("#tools").innerHTML = (
    mode === "music"
      ? []
      : [
          ["pen", "✎", "Pencil"],
          ["fill", "◒", "Fill"],
          ["erase", "▱", "Eraser"],
          ...(mode === "stamps" ? [] : [["stamp", "✳", "Stamp"]]),
        ]
  )
    .map(
      ([id, icon, name]) =>
        `<button data-tool="${id}" class="${tool === id ? "selected" : ""}"><span>${icon}</span>${name}</button>`,
    )
    .join("");
  $("#paint-options").hidden = mode === "music" || mode === "stamps";
  $(".palette").hidden = mode === "music";
  $("#stamp-picks").hidden = mode === "music";
  $("#voices").hidden = mode !== "music";
  $("#playback-controls").hidden = mode !== "animate" && mode !== "music";
  $("#desk-note").hidden = mode === "animate" || mode === "music";
  $("#png").hidden = mode === "music";
  $("#with-music").hidden = mode !== "animate";
  for (let i = 0; i < 4; i++)
    paintPixels(
      $<HTMLCanvasElement>(`#stamp-${i}`).getContext("2d")!,
      project.stamps[i]!,
      8,
      8,
      true,
    );
  canvas.width = mode === "stamps" ? 8 : mode === "music" ? 640 : W;
  canvas.height = mode === "stamps" ? 8 : mode === "music" ? 320 : H;
  canvas.classList.toggle("stamp-editor", mode === "stamps");
  canvas.setAttribute(
    "aria-label",
    mode === "music"
      ? "Music grid"
      : mode === "stamps"
        ? "Stamp pixel editor"
        : mode === "animate"
          ? "Animation frame canvas"
          : "Drawing canvas",
  );
  if (mode === "music") drawMusic();
  else {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (mode === "animate") paintPixels(ctx, project.painting, W, H);
    paintPixels(ctx, grid(), canvas.width, canvas.height, mode === "stamps");
  }
  $("#timeline").innerHTML =
    mode === "animate"
      ? `<div class="frames">${project.frames.map((_, i) => `<button data-frame="${i}" class="${frame === i ? "selected" : ""}" aria-label="Frame ${i + 1}"><canvas width="160" height="96" id="frame-${i}"></canvas><span>FRAME 0${i + 1}</span></button>`).join("")}<button id="copy-frame" ${playing ? "disabled" : ""}>⇥ Copy to<br>next frame</button></div>`
      : "";
  if (mode === "animate")
    for (let i = 0; i < 4; i++) {
      const c = $<HTMLCanvasElement>(`#frame-${i}`).getContext("2d")!;
      paintPixels(c, project.painting, W, H);
      paintPixels(c, project.frames[i]!, W, H);
    }
  $("#play").textContent = playing ? "■ Stop" : "▶ Play";
  const speed = $<HTMLInputElement>("#speed");
  speed.min = mode === "music" ? "60" : "1";
  speed.max = mode === "music" ? "200" : "12";
  speed.value = String(mode === "music" ? project.tempo : project.fps);
  $("#speed-value").textContent = speed.value;
  $("#speed-label").firstChild!.textContent =
    mode === "music" ? "Tempo " : "Frames / sec ";
}
function drawMusic() {
  ctx.fillStyle = "#fffdf5";
  ctx.fillRect(0, 0, 640, 320);
  for (let y = 0; y < 8; y++)
    for (let x = 0; x < 16; x++) {
      ctx.fillStyle =
        x === beat ? "#f8d969" : x % 4 === 0 ? "#eeeadd" : "#fffdf5";
      ctx.fillRect(x * 40, y * 40, 40, 40);
      ctx.strokeStyle = "#d9ded3";
      ctx.strokeRect(x * 40, y * 40, 40, 40);
    }
  for (const n of project.notes) {
    ctx.fillStyle = ["#356f59", "#f05c45", "#565b9c"][n.voice]!;
    ctx.font = "26px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      ["●", "◆", "✳"][n.voice]!,
      n.beat * 40 + 20,
      (7 - n.pitch) * 40 + 20,
    );
  }
  ctx.font = "9px sans-serif";
  ctx.textAlign = "left";
  ctx.fillStyle = "#718276";
  for (let y = 0; y < 8; y++)
    ctx.fillText(
      ["C5", "B4", "A4", "G4", "F4", "E4", "D4", "C4"][y]!,
      2,
      y * 40 + 8,
    );
}
function coords(e: PointerEvent): [number, number] {
  const r = canvas.getBoundingClientRect();
  return [
    Math.max(
      0,
      Math.min(
        canvas.width - 1,
        Math.floor(((e.clientX - r.left) * canvas.width) / r.width),
      ),
    ),
    Math.max(
      0,
      Math.min(
        canvas.height - 1,
        Math.floor(((e.clientY - r.top) * canvas.height) / r.height),
      ),
    ),
  ];
}
function mark(at: [number, number]) {
  const g = grid(),
    w = mode === "stamps" ? 8 : W,
    h = mode === "stamps" ? 8 : H,
    c = tool === "erase" ? (mode === "paint" ? 0 : -1) : color;
  const result =
    tool === "fill"
      ? fill(g, w, h, ...at, c)
      : tool === "stamp" && mode !== "stamps"
        ? stamp(g, project.stamps[selectedStamp]!, ...at)
        : line(g, w, h, last, at, c, mode === "stamps" ? 1 : size);
  if (mode === "stamps")
    project = {
      ...project,
      stamps: project.stamps.map((g, i) => (i === selectedStamp ? result : g)),
    };
  else if (mode === "animate")
    project = {
      ...project,
      frames: project.frames.map((g, i) => (i === frame ? result : g)),
    };
  else project = { ...project, painting: result };
  last = at;
  render();
}
canvas.addEventListener("pointerdown", (e) => {
  if (e.button !== 0 || playing) return;
  e.preventDefault();
  const at = coords(e);
  const before = decode(encode(project));
  if (mode === "music") {
    const next = toggleNote(project, {
      beat: Math.floor(at[0] / 40),
      pitch: 7 - Math.floor(at[1] / 40),
      voice,
    });
    const accepted = next !== project;
    if (accepted) {
      history.capture(before);
      project = next;
    }
    changed(
      accepted
        ? "Note changed. Click it again to remove it."
        : "Three notes fit on a beat. Remove one first.",
    );
    return;
  }
  strokeBefore = before;
  canvas.setPointerCapture(e.pointerId);
  dragging = true;
  strokeDirty = true;
  last = at;
  mark(at);
});
canvas.addEventListener("pointermove", (e) => {
  if (dragging && (tool === "pen" || tool === "erase")) mark(coords(e));
});
function endStroke() {
  if (strokeDirty) {
    dragging = false;
    strokeDirty = false;
    if (strokeBefore && encode(strokeBefore) !== encode(project))
      history.capture(strokeBefore);
    strokeBefore = undefined;
    changed();
  }
}
canvas.addEventListener("pointerup", endStroke);
canvas.addEventListener("pointercancel", endStroke);
canvas.addEventListener("lostpointercapture", endStroke);
function stop() {
  playbackGeneration++;
  if (timer !== undefined) clearInterval(timer);
  timer = undefined;
  playing = false;
  beat = -1;
  if (audio) void audio.suspend();
  render();
}
const frequencies = [261.63, 293.66, 329.63, 349.23, 392, 440, 493.88, 523.25];
function playNotes(b: number) {
  if (!audio || audio.state !== "running") return;
  for (const n of project.notes.filter((n) => n.beat === b)) {
    const o = audio.createOscillator(),
      g = audio.createGain();
    o.type = (["sine", "triangle", "square"] as OscillatorType[])[n.voice]!;
    o.frequency.value = frequencies[n.pitch]!;
    g.gain.setValueAtTime(0, audio.currentTime);
    g.gain.linearRampToValueAtTime(0.065, audio.currentTime + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.23);
    o.connect(g);
    g.connect(audio.destination);
    o.start();
    o.stop(audio.currentTime + 0.25);
  }
}
async function play() {
  if (playing) {
    stop();
    return;
  }
  if (mode !== "music" && mode !== "animate") return;
  const generation = ++playbackGeneration;
  playing = true;
  render();
  const sound = mode === "music" || $<HTMLInputElement>("#soundtrack").checked;
  let audioReady = false;
  try {
    if (sound) {
      audio ??= new AudioContext();
      await audio.resume();
      audioReady = audio.state === "running";
    }
  } catch {
    audioReady = false;
  }
  if (generation !== playbackGeneration || document.hidden) return;
  playing = true;
  beat = 0;
  const start = performance.now();
  if (mode === "animate") frame = 0;
  if (audioReady) playNotes(0);
  render();
  timer = window.setInterval(() => {
    const elapsed = (performance.now() - start) / 1000;
    const nextBeat = Math.floor((elapsed * project.tempo) / 60) % 16;
    if (nextBeat !== beat) {
      beat = nextBeat;
      if (audioReady) playNotes(beat);
    }
    if (mode === "animate") {
      const next = Math.floor(elapsed * project.fps) % 4;
      if (next !== frame) {
        frame = next;
        render();
      }
    } else drawMusic();
  }, 20);
  status(
    audioReady
      ? "Playing your loop. Browser synthesis; use Stop to finish."
      : sound
        ? "Audio unavailable. Visual playback only."
        : "Playing your silent flipbook.",
  );
}
app.addEventListener("click", (e) => {
  const b = (e.target as HTMLElement).closest<HTMLElement>("button");
  if (!b) return;
  if (b.dataset.mode) {
    endStroke();
    stop();
    mode = b.dataset.mode as Mode;
    if (mode === "stamps" && tool === "stamp") tool = "pen";
    render();
    return;
  }
  if (playing && b.id !== "play") return;
  if (b.dataset.tool) {
    tool = b.dataset.tool as Tool;
    render();
  }
  if (b.dataset.color) {
    color = Number(b.dataset.color);
    render();
  }
  if (b.dataset.size) {
    size = Number(b.dataset.size);
    render();
  }
  if (b.dataset.stamp) {
    selectedStamp = Number(b.dataset.stamp);
    if (mode !== "stamps") tool = "stamp";
    render();
  }
  if (b.dataset.voice) {
    voice = Number(b.dataset.voice);
    render();
  }
  if (b.dataset.frame) {
    frame = Number(b.dataset.frame);
    render();
  }
  if (b.id === "copy-frame") {
    history.capture(project);
    project = copyFrame(project, frame);
    frame = (frame + 1) % 4;
    changed("Copied into the next frame. Edit it to make a little movement.");
  }
});
$("#undo").onclick = () => {
  if (playing) return;
  const previous = history.undo();
  if (previous) {
    project = previous;
    changed("Undone. A fresh start for that last idea.");
  }
};
$("#clear").onclick = () => {
  if (playing) return;
  $("#confirm-title").textContent =
    `Clear this ${mode === "music" ? "score" : mode === "stamps" ? "stamp" : mode === "animate" ? "frame" : "picture"}?`;
  $<HTMLDialogElement>("#confirm").showModal();
};
$("#cancel-clear").onclick = () => $<HTMLDialogElement>("#confirm").close();
$("#confirm-clear").onclick = () => {
  history.capture(project);
  project = clearRoom(project, mode, mode === "stamps" ? selectedStamp : frame);
  $<HTMLDialogElement>("#confirm").close();
  changed("Cleared this room. Undo is ready if you change your mind.");
};
$("#play").onclick = () => {
  void play();
};
$("#speed").oninput = () => {
  const value = Number($<HTMLInputElement>("#speed").value);
  if (mode === "music") project.tempo = value;
  else project.fps = value;
  $("#speed-value").textContent = String(value);
  save();
};
function download(content: Blob, name: string) {
  const a = document.createElement("a"),
    url = URL.createObjectURL(content);
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
$("#export").onclick = () =>
  download(
    new Blob([encode(project)], { type: "application/json" }),
    "pollen-paper-project.json",
  );
$("#png").onclick = () =>
  canvas.toBlob((blob) => {
    if (blob) download(blob, "pollen-paper-picture.png");
  });
$("#import").onchange = async () => {
  const input = $<HTMLInputElement>("#import"),
    file = input.files?.[0];
  if (!file) return;
  try {
    if (file.size > 2_000_000) throw Error("File too large");
    const imported = decode(await file.text());
    stop();
    history.capture(project);
    project = imported;
    changed("Project imported. Undo restores your previous project.");
  } catch {
    status(
      "Could not import: choose a valid Pollen & Paper project under 2 MB. Your work is safe.",
    );
  }
  input.value = "";
};
window.addEventListener("keydown", (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
    e.preventDefault();
    $("#undo").click();
  }
  if (e.key === "Escape" && playing) stop();
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden && playing) stop();
});
status(initialMessage);
render();

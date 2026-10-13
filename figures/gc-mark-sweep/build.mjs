import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../../.claude/skills/anatomy/kit/iso-kit.mjs";
import { kitScript } from "../../.claude/skills/anatomy/scripts/inline-kit.mjs";
import { COLS, ROWS, SLOTS, colRow, address, hex, allLinks, rootKey, startKeys, SCENARIOS, OBJECT_BYTES } from "./model.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const theme = process.argv.includes("--light") ? "light" : "dark";

const WIDTH = 600;
const HEIGHT = 390;

const PLATE = { x: -104, y: -72, w: 204, d: 144, r: 8 };
const PLATE_H = 10;
const FOOT_H = 5;

const TRAY = { x: -62, y: -46, w: 124, d: 92, r: 5 };
const TRAY_TOP = 8;
const PITCH = 30;
const BLOCK = 20;
const BLOCK_H = 9;
const TOP = TRAY_TOP + BLOCK_H;
const SOCKET = 22;
const SINK = BLOCK_H + 4;
const PIN = [5.5, 5.5];

const ROOT = { x: -92, y: -42, w: 20, d: 84, r: 3 };
const ROOT_H = 8;
const STUD_X = -80;

const RAIL_Y = 56;
const RAIL = { from: -74, to: 72 };
const LEG_TOP = 52;
const BEAM_Z = 52;
const BEAM_H = 4.5;
const BEAM_Y = 60;
const HEAD = { half: 5.5, z: 49.5, h: 9.5 };
const COLLAR_Z = 47;
const TIP_REST = 30;
const TIP_DIP = TOP + 0.6;
const ROD_LEN = 28;
const GX = { park: 60, start: -62, end: 60 };

const centre = (slot) => {
  const [c, r] = colRow(slot);
  return [-45 + PITCH * c, -30 + PITCH * r];
};

const P = k.fitProjection(
  [...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0), [GX.park, -BEAM_Y, BEAM_Z + BEAM_H], [GX.park, BEAM_Y, BEAM_Z + BEAM_H], [GX.start, -BEAM_Y, BEAM_Z + BEAM_H]],
  WIDTH,
  HEIGHT,
  { pad: 26, azimuth: 35 },
);

const at = (point) => k.iso(point, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);
const depth = ([x, y]) => k.depthOf([x, y, 0], P);
const byDepth = (points) => [...points].sort((a, b) => depth(a) - depth(b));

function plate() {
  const out = [`<path class="iso-halo" d="${k.haloOf(PLATE, -PLATE_H - FOOT_H, PLATE_H, P)}"/>`];
  for (const [x, y] of byDepth(k.corners(PLATE, 22))) {
    out.push(S(k.cylinder(x, y, 7, -PLATE_H - FOOT_H, 1.6, P, 28), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 5.4, -PLATE_H - FOOT_H + 1.6, FOOT_H - 1.6, P, 28), { tone: "mid" }));
  }
  out.push(S(k.slabOf(PLATE, -PLATE_H, PLATE_H, P, 8, 1.6), { tone: "mid", inner: L(k.sideSeam(PLATE, -4, P), { tone: "faint" }) }));
  out.push(L(k.planOutline(k.insetPlan(PLATE, 5), 0, P), { tone: "lo" }));
  const screws = k.corners(PLATE, 10);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 2.2, 0, P, 16)).join(""), { tone: "lo" }));
  out.push(D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.5 }));
  // Address ruler along the front: a major tick at every column boundary, 3 objects of 32 bytes per column.
  const strip = { x: TRAY.x - 1, y: 60, w: TRAY.w + 2, d: 5, r: 1 };
  out.push(S(k.slabOf(strip, 0, 0.6, P, 3), { tone: "lo", crease: "none" }));
  const ticks = k.topTicks(-60, 60, 5, 6, strip.y + 0.6, 0.6, [1.6, 3.2], P);
  out.push(L(ticks.minor, { tone: "lo" }), L(ticks.major, { tone: "mid" }));
  out.push(D([at([strip.x + 1.6, strip.y + 3.6, 0.6]), at([strip.x + strip.w - 1.6, strip.y + 3.6, 0.6])], { size: 0.4 }));
  // Label plate on the right.
  const label = { x: 80, y: 18, w: 13, d: 30, r: 1 };
  out.push(S(k.slabOf(label, 0, 0.8, P, 4), { tone: "lo" }));
  out.push(L(k.planOutline(k.insetPlan(label, 1.6), 0.8, P), { tone: "faint" }));
  for (const [x, from, to] of [[83.5, 21.5, 44], [86.5, 21.5, 38], [89.5, 21.5, 41]]) out.push(L(k.lineOnTop([x, from], [x, to], 0.8, P), { tone: "lo", free: true }));
  out.push(D([at([86.5, 19.6, 0.8]), at([86.5, 46.4, 0.8])], { size: 0.4 }));
  return out.join("");
}

function rail(y) {
  const out = [];
  const plan = { x: RAIL.from, y: y - 3, w: RAIL.to - RAIL.from, d: 6, r: 1 };
  out.push(S(k.slabOf(plan, 0, 3, P, 3, 0.4), { tone: "mid" }));
  out.push(L(k.lineOnTop([RAIL.from, y], [RAIL.to, y], 3, P), { tone: "faint" }));
  out.push(D([RAIL.from + 6, (RAIL.from + RAIL.to) / 2, RAIL.to - 6].map((x) => at([x, y - 1.6, 3])), { size: 0.4 }));
  for (const x of [RAIL.from - 5, RAIL.to]) {
    out.push(S(k.slabOf({ x, y: y - 5, w: 5, d: 10, r: 1.2 }, 0, 7, P, 3, 0.5), { tone: "mid" }));
    out.push(D([at([x + 2.5, y - 2.6, 7]), at([x + 2.5, y + 2.6, 7])], { size: 0.45 }));
  }
  return out.join("");
}

// One gantry upright, built at x = 0 and moved along the rail.
function leg(y) {
  const out = [];
  const shoe = { x: -9, y: y - 5, w: 18, d: 10, r: 1.5 };
  out.push(S(k.slabOf(shoe, 3, 4, P, 3, 0.5), { tone: "mid" }));
  out.push(D([at([-6, y, 7]), at([6, y, 7])], { size: 0.45 }));
  out.push(S(k.slabOf({ x: -2.5, y: y - 2.5, w: 5, d: 5, r: 0.8 }, 7, LEG_TOP - 7, P, 3, 0.3), { tone: "mid", inner: L(k.sideSeam({ x: -2.5, y: y - 2.5, w: 5, d: 5, r: 0.8 }, 30, P, 3), { tone: "faint" }) }));
  return out.join("");
}

function rootStrip() {
  const out = [];
  out.push(S(k.slabOf(ROOT, 0, ROOT_H, P, 5, 0.8), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(ROOT, 2.5), ROOT_H, P, 5), { tone: "faint" }));
  out.push(D([[ROOT.x + 5, ROOT.y + 5], [ROOT.x + 5, ROOT.y + ROOT.d - 5], [ROOT.x + ROOT.w - 5, ROOT.y + 5], [ROOT.x + ROOT.w - 5, ROOT.y + ROOT.d - 5]].map(([x, y]) => at([x, y, ROOT_H])), { size: 0.45 }));
  out.push(k.faceTextSvg(k.topMatrix([ROOT.x + 7.4, -24], ROOT_H, P, "y"), "ROOTS", { size: 2.6, tone: "lo" }));
  for (const row of [0, 1, 2]) {
    const y = -30 + PITCH * row;
    out.push(S(k.cylinder(STUD_X, y, 3.8, ROOT_H, 1.4, P, 28, 0.4), { tone: "mid" }));
    out.push(S(k.cylinder(STUD_X, y, 2.6, ROOT_H + 1.4, TOP - ROOT_H - 1.4, P, 24), { tone: "mid", crease: "none" }));
    out.push(L(k.sideArc(STUD_X, y, 2.6, TOP - 3.2, P, 16), { tone: "lo" }));
    out.push(L(k.knurl(STUD_X, y, 2.6, TOP - 3.2, TOP, 16, P), { tone: "lo" }));
    out.push(L(k.ring(STUD_X, y, 1.2, TOP, P, 14), { tone: "lo" }));
  }
  return out.join("");
}

function tray() {
  const out = [];
  out.push(S(k.slabOf(TRAY, 0, TRAY_TOP, P, 6, 1), { tone: "mid", inner: L(k.sideSeam(TRAY, 3, P, 6), { tone: "faint" }) }));
  out.push(L(k.planOutline(k.insetPlan(TRAY, 2.5), TRAY_TOP, P, 6), { tone: "faint" }));
  for (let slot = 0; slot < SLOTS; slot++) {
    const [x, y] = centre(slot);
    const socket = { x: x - SOCKET / 2, y: y - SOCKET / 2, w: SOCKET, d: SOCKET, r: 2.5 };
    out.push(`<path class="iso-halo" d="${k.planOutline(socket, TRAY_TOP, P, 4)}" style="opacity:.55"/>`);
    out.push(L(k.planOutline(socket, TRAY_TOP, P, 4), { tone: "lo" }));
    out.push(L(k.planOutline(k.insetPlan(socket, 1.3), TRAY_TOP, P, 4), { tone: "faint" }));
  }
  return out.join("");
}

// One heap object. Built in its slot and sunk into the socket when freed.
function block(slot) {
  const [x, y] = centre(slot);
  const plan = { x: x - BLOCK / 2, y: y - BLOCK / 2, w: BLOCK, d: BLOCK, r: 2 };
  const inset = k.insetPlan(plan, 2);
  const out = [];
  out.push(S(k.slabOf(plan, TRAY_TOP, BLOCK_H, P, 4, 0.6), { tone: "hi", crease: "lo", inner: L(k.sideSeam(plan, TRAY_TOP + 3, P, 4), { tone: "faint" }) }));
  out.push(L(k.planOutline(inset, TOP, P, 4), { tone: "faint" }));
  // Header strip: the first bytes of every object hold its type and the mark bit.
  out.push(L(k.lineOnTop([inset.x, y - 5], [inset.x + inset.w, y - 5], TOP, P), { tone: "faint" }));
  out.push(D([at([x - 5.5, y - 6.6, TOP]), at([x + 5.5, y - 6.6, TOP])], { size: 0.4, tone: "lo" }));
  const [px, py] = [x + PIN[0], y + PIN[1]];
  out.push(L(k.ring(px, py, 2.6, TOP, P, 20), { tone: "lo" }));
  out.push(`<g data-pin-down="${slot}">${S(k.cylinder(px, py, 1.9, TOP, 0.5, P, 20), { tone: "lo" })}</g>`);
  out.push(`<g data-pin-up="${slot}" style="opacity:0">${S(k.cylinder(px, py, 1.9, TOP, 4.2, P, 20, 0.3), { tone: "hi", lit: true })}</g>`);
  const clip = k.slabOf({ x: x - SOCKET / 2, y: y - SOCKET / 2, w: SOCKET, d: SOCKET, r: 2.5 }, TRAY_TOP, 40, P, 4).fill;
  return `<clipPath id="gc-slot-${slot}"><path d="${clip}"/></clipPath><g clip-path="url(#gc-slot-${slot})"><g data-block="${slot}">${out.join("")}</g></g>`;
}

// References: a short jumper from one object's top to its neighbour's. The far end, where the
// pointer lands, carries a ring.
function arcOf(from, to, lift) {
  const points = [];
  for (let i = 0; i <= 8; i++) {
    const t = i / 8;
    points.push(at([from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t, from[2] + (to[2] - from[2]) * t + Math.sin(Math.PI * t) * lift]));
  }
  return points;
}

function wire(key, from, to) {
  const points = arcOf(from, to, 2.4);
  return `<g data-wire="${key}" style="opacity:0">${k.wireSvg(points[0], points[points.length - 1], { via: points.slice(1, -1), tone: "mid", size: 0.8 })}${L(k.ring(to[0], to[1], 1.7, to[2], P, 16), { tone: "mid" })}</g>`;
}

function wires() {
  const out = [];
  const z = TOP + 0.25;
  const list = allLinks().map(([a, b]) => {
    const [ax, ay] = centre(a);
    const [bx, by] = centre(b);
    const ux = Math.sign(bx - ax);
    const uy = Math.sign(by - ay);
    const sideA = [ax + ux * 3.5 + uy * (a < b ? 1.6 : -1.6), ay + uy * 3.5 + ux * (a < b ? 1.6 : -1.6)];
    const sideB = [bx - ux * 3.5 + uy * (a < b ? 1.6 : -1.6), by - uy * 3.5 + ux * (a < b ? 1.6 : -1.6)];
    return { key: `${a}>${b}`, from: [...sideA, z], to: [...sideB, z], depth: depth([(ax + bx) / 2, (ay + by) / 2]) };
  });
  for (const row of [0, 1, 2]) {
    const slot = row * COLS;
    const [bx, by] = centre(slot);
    list.push({ key: rootKey(slot), from: [STUD_X, by, TOP + 0.1], to: [bx - 3.5, by, z], depth: depth([(STUD_X + bx) / 2, by]) });
  }
  list.sort((a, b) => a.depth - b.depth);
  for (const item of list) out.push(wire(item.key, item.from, item.to));
  return out.join("");
}

// The moving head: rod and tip slide in z, collar and carriage ride the beam in y.
function head() {
  const out = [];
  out.push(`<g data-rod>`);
  out.push(S(k.cylinder(0, 0, 1.1, TIP_REST + 1.4, ROD_LEN, P, 16), { tone: "hi", crease: "none" }));
  out.push(S(k.cylinder(0, 0, 1.7, TIP_REST, 1.4, P, 18), { tone: "hi", lit: true }));
  out.push(`</g>`);
  out.push(S(k.cylinder(0, 0, 2.6, COLLAR_Z, HEAD.z - COLLAR_Z, P, 22, 0.3), { tone: "mid" }));
  out.push(L(k.sideArc(0, 0, 2.6, COLLAR_Z + 1.4, P, 16), { tone: "faint" }));
  const body = { x: -HEAD.half, y: -HEAD.half, w: HEAD.half * 2, d: HEAD.half * 2, r: 2 };
  out.push(S(k.slabOf(body, HEAD.z, HEAD.h, P, 4, 0.6), { tone: "mid", inner: L(k.sideSeam(body, BEAM_Z, P, 4) + k.sideSeam(body, BEAM_Z + BEAM_H, P, 4), { tone: "faint" }) }));
  out.push(L(k.planOutline(k.insetPlan(body, 2), HEAD.z + HEAD.h, P, 4), { tone: "faint" }));
  out.push(D([[-3, -3], [3, -3], [-3, 3], [3, 3]].map(([x, y]) => at([x, y, HEAD.z + HEAD.h])), { size: 0.45 }));
  return out.join("");
}

const beamPiece = (from, to) => (to - from > 0.2 ? S(k.slabOf({ x: -2.5, y: from, w: 5, d: to - from, r: 1 }, BEAM_Z, BEAM_H, P, 3, 0.4), { tone: "mid" }) : "");

function beam(hy) {
  const cap = (y) => S(k.slabOf({ x: -4.5, y, w: 9, d: 2.4, r: 0.8 }, BEAM_Z - 1, BEAM_H + 2, P, 3, 0.3), { tone: "mid" });
  return [
    cap(-BEAM_Y - 2.4),
    `<g data-beam="back">${beamPiece(-BEAM_Y, hy - HEAD.half)}</g>`,
    `<g data-head transform="${k.translateAlong(P, [0, hy, 0])}">${head()}</g>`,
    `<g data-beam="front">${beamPiece(hy + HEAD.half, BEAM_Y)}</g>`,
    cap(BEAM_Y),
    D([at([0, -BEAM_Y + 3, BEAM_Z + BEAM_H]), at([0, BEAM_Y - 3, BEAM_Z + BEAM_H])], { size: 0.45 }),
  ].join("");
}

const order = Array.from({ length: SLOTS }, (_, slot) => slot).sort((a, b) => depth(centre(a)) - depth(centre(b)));
const gantryAt = (x) => k.translateAlong(P, [x, 0, 0]);

const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label:
    "A heap tray with twelve sockets. Each block in a socket is an object, and short jumper wires between blocks are references. Three root studs on the left stand for stack variables and globals. A gantry carries a probe that follows the references from the roots and raises a mark pin on every block it reaches; then it sweeps the tray in address order and every unmarked block sinks into its socket, freed. New blocks lift into the free sockets and the cycle repeats.",
  body: [
    plate(),
    rail(-RAIL_Y),
    `<g data-gantry transform="${gantryAt(GX.park)}">${leg(-RAIL_Y)}</g>`,
    rootStrip(),
    tray(),
    order.map(block).join(""),
    wires(),
    rail(RAIL_Y),
    `<g data-gantry transform="${gantryAt(GX.park)}">${leg(RAIL_Y)}</g>`,
    `<g data-gantry transform="${gantryAt(GX.park)}">${beam(0)}</g>`,
  ],
});

const slots = Array.from({ length: SLOTS }, (_, slot) => ({ c: colRow(slot)[0], x: centre(slot)[0], y: centre(slot)[1], addr: address(slot) }));

const live = `
const P = ${JSON.stringify(P)};
const SLOTS = ${JSON.stringify(slots)};
const SCEN = ${JSON.stringify(SCENARIOS)};
const START = ${JSON.stringify(startKeys())};
const GX = ${JSON.stringify(GX)};
const TIP_REST = ${TIP_REST}, TIP_DIP = ${TIP_DIP}, SINK = ${SINK}, PITCH = ${PITCH}, COLS = ${COLS}, ROWS = ${ROWS}, BYTES = ${OBJECT_BYTES};
const BEAM = ${JSON.stringify({ y: BEAM_Y, z: BEAM_Z, h: BEAM_H, half: HEAD.half })};
const beamPiece = ${beamPiece.toString().replace(/k\./g, "")};
const S = (paths, style) => solidSvg(paths, style);
const BEAM_Y = BEAM.y, BEAM_Z = BEAM.z, BEAM_H = BEAM.h;
const hex = (n) => "0x" + n.toString(16);

const stage = document.querySelector(".iso-stage");
const svg = stage.querySelector("svg");
const readout = document.querySelector("[data-readout]");
const still = matchMedia("(prefers-reduced-motion: reduce)");
const gantry = [...svg.querySelectorAll("[data-gantry]")];
const headEl = svg.querySelector("[data-head]");
const rodEl = svg.querySelector("[data-rod]");
const beamBack = svg.querySelector('[data-beam="back"]');
const beamFront = svg.querySelector('[data-beam="front"]');
const blocks = SLOTS.map((_, i) => svg.querySelector('[data-block="' + i + '"]'));
const pinUp = SLOTS.map((_, i) => svg.querySelector('[data-pin-up="' + i + '"]'));
const pinDown = SLOTS.map((_, i) => svg.querySelector('[data-pin-down="' + i + '"]'));
const wireEls = new Map([...svg.querySelectorAll("[data-wire]")].map((el) => [el.dataset.wire, el]));

const follow = (value, target, dt, tau) => (tau <= 0 ? target : value + (target - value) * (1 - Math.exp(-dt / tau)));
const near = (a, b, eps = 0.002) => Math.abs(a - b) < eps;

const lift = SLOTS.map(() => 1), liftT = SLOTS.map(() => 1), liftAt = SLOTS.map(() => 0);
const mark = SLOTS.map(() => 0), markT = SLOTS.map(() => 0);
const wire = new Map([...wireEls.keys()].map((key) => [key, START.includes(key) ? 1 : 0]));
const wireT = new Map(wire);
const wireAt = new Map();
let gx = GX.park, gxT = GX.park, hy = 0, hyT = 0, tip = TIP_REST, tipT = TIP_REST;
let scen = 0, beats = [], beat = -1, age = 0, freed = 0, sweeping = false;

function beatsOf(s) {
  const run = SCEN[s];
  return [
    { kind: "cut", dur: 2.4 },
    ...run.visits.map((visit) => ({ kind: "visit", visit, dur: 1.35 })),
    { kind: "marked", dur: 1.6 },
    { kind: "sweep", dur: 3.8 },
    { kind: "swept", dur: 2.2 },
    { kind: "alloc", dur: 2.6 },
  ];
}

const say = (text) => { if (readout.textContent !== text) readout.textContent = text; stage.setAttribute("aria-label", "Mark and sweep collector: " + text + ". Press the right arrow or space to step."); };
const plural = (n, word) => n + " " + word + (n === 1 ? "" : "s");

function enter() {
  const b = beats[beat], run = SCEN[scen];
  age = 0;
  if (b.kind === "cut") {
    for (const key of run.cut) wireT.set(key, 0);
    say(run.cutRoots ? "root goes out of scope · " + plural(run.cutLinks, "link") + " cut" : "program cuts " + plural(run.cutLinks, "reference"));
  } else if (b.kind === "visit") {
    const slot = SLOTS[b.visit.slot];
    gxT = slot.x; hyT = slot.y;
    say("mark · stack " + b.visit.stack + " · " + b.visit.marked + " marked");
  } else if (b.kind === "marked") {
    gxT = GX.start; hyT = 0; tipT = TIP_REST;
    say("mark done · " + run.live + " reachable");
  } else if (b.kind === "sweep") {
    sweeping = true; freed = 0;
  } else if (b.kind === "swept") {
    gxT = GX.park;
    say(run.live + " live · " + run.garbage.length + " freed");
  } else if (b.kind === "alloc") {
    run.garbage.forEach((slot, index) => { liftT[slot] = 1; liftAt[slot] = index * 0.22; });
    for (const key of run.added) { wireT.set(key, 1); wireAt.set(key, 0.5 + run.garbage.length * 0.22); }
    say("alloc · " + plural(run.garbage.length, "new object"));
  }
}

function freeColumn(c) {
  const run = SCEN[scen];
  for (const slot of run.garbage) if (SLOTS[slot].c === c && liftT[slot] === 1) { liftT[slot] = 0; liftAt[slot] = 0; freed++; }
  for (const key of run.freedLinks) {
    const [a, b] = key.split(">").map(Number);
    if (SLOTS[a].c <= c || SLOTS[b].c <= c) if (run.garbage.includes(a) ? SLOTS[a].c <= c : SLOTS[b].c <= c) wireT.set(key, 0);
  }
  SLOTS.forEach((slot, i) => { if (slot.c === c) markT[i] = 0; });
}

function leave() {
  const b = beats[beat];
  if (!b) return;
  if (b.kind === "visit") markT[b.visit.slot] = 1;
  if (b.kind === "sweep") { for (let c = 0; c < COLS; c++) freeColumn(c); sweeping = false; gx = GX.end; gxT = GX.end; }
  if (b.kind === "alloc") { liftAt.fill(0); wireAt.clear(); }
}

function next() {
  leave();
  beat++;
  if (beat >= beats.length) { scen = (scen + 1) % SCEN.length; beats = beatsOf(scen); beat = 0; }
  enter();
}

function update(dt, calm) {
  const b = beats[beat];
  age += dt;
  const k = calm ? 0 : 1;
  if (b && b.kind === "sweep" && sweeping) {
    const t = calm ? 1 : Math.min(1, age / (b.dur - 0.4));
    gx = GX.start + (GX.end - GX.start) * (t * t * (3 - 2 * t));
    gxT = gx;
    for (let c = 0; c < COLS; c++) if (gx >= -45 + PITCH * c) freeColumn(c);
    const c = Math.max(0, Math.min(COLS - 1, Math.floor((gx + 60) / PITCH)));
    say("sweep · " + hex(0x1000 + c * ROWS * BYTES) + " · " + freed + " freed");
  } else {
    gx = follow(gx, gxT, dt, 0.34 * k);
  }
  hy = follow(hy, hyT, dt, 0.3 * k);
  if (b && b.kind === "visit") {
    const there = Math.abs(gx - gxT) < 0.5 && Math.abs(hy - hyT) < 0.5;
    tipT = there && age < b.dur - 0.35 ? TIP_DIP : TIP_REST;
    if (calm) markT[b.visit.slot] = 1;
  } else if (!b || b.kind !== "marked") tipT = TIP_REST;
  tip = follow(tip, tipT, dt, 0.11 * k);
  if (b && b.kind === "visit" && tip < TIP_DIP + 0.4) markT[b.visit.slot] = 1;
  for (let i = 0; i < SLOTS.length; i++) {
    if (liftAt[i] > 0) { liftAt[i] = Math.max(0, liftAt[i] - dt); if (!calm) continue; }
    lift[i] = follow(lift[i], liftT[i], dt, 0.32 * k);
    mark[i] = follow(mark[i], markT[i], dt, 0.12 * k);
  }
  for (const [key, value] of wire) {
    const due = wireAt.get(key) || 0;
    if (due > 0 && !calm) { wireAt.set(key, Math.max(0, due - dt)); continue; }
    wire.set(key, follow(value, wireT.get(key), dt, 0.3 * k));
  }
}

const shown = { gx: NaN, hy: NaN, tip: NaN, lift: SLOTS.map(() => NaN), mark: SLOTS.map(() => NaN), wire: new Map() };
function draw() {
  if (!near(shown.gx, gx)) { const t = translateAlong(P, [gx, 0, 0]); for (const el of gantry) el.setAttribute("transform", t); shown.gx = gx; }
  if (!near(shown.hy, hy)) {
    headEl.setAttribute("transform", translateAlong(P, [0, hy, 0]));
    beamBack.innerHTML = beamPiece(-BEAM_Y, hy - BEAM.half);
    beamFront.innerHTML = beamPiece(hy + BEAM.half, BEAM_Y);
    shown.hy = hy;
  }
  if (!near(shown.tip, tip)) { rodEl.setAttribute("transform", translateAlong(P, [0, 0, tip - TIP_REST])); shown.tip = tip; }
  for (let i = 0; i < SLOTS.length; i++) {
    if (!near(shown.lift[i], lift[i])) { blocks[i].setAttribute("transform", translateAlong(P, [0, 0, -(1 - lift[i]) * SINK])); const o = Math.min(1, lift[i] * 2); blocks[i].style.opacity = (o * o * (3 - 2 * o)).toFixed(3); shown.lift[i] = lift[i]; }
    if (!near(shown.mark[i], mark[i])) { pinUp[i].style.opacity = mark[i].toFixed(3); pinDown[i].style.opacity = (1 - mark[i]).toFixed(3); shown.mark[i] = mark[i]; }
  }
  for (const [key, value] of wire) if (!near(shown.wire.get(key) ?? NaN, value)) { wireEls.get(key).style.opacity = value.toFixed(3); shown.wire.set(key, value); }
}

let frame = 0, last = 0, touring = true, visible = false, idleTimer = 0;
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  const calm = still.matches;
  update(dt, calm);
  if (touring && !calm && age >= beats[beat].dur) next();
  draw();
  frame = visible ? requestAnimationFrame(tick) : 0;
}
const run = () => { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } };
const step = () => {
  touring = false;
  next();
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => { touring = !still.matches; run(); }, 7000);
  run();
};
new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);
if (still.matches) touring = false;
stage.addEventListener("click", step);
stage.addEventListener("keydown", (event) => {
  if (!["ArrowRight", " ", "Enter"].includes(event.key)) return;
  event.preventDefault();
  step();
});
beats = beatsOf(0);
beat = -1;
if (still.matches) { say("12 objects · 0 free"); } else next();
draw();
`;

const body = k.plateHtml({
  fig: "Fig 1",
  title: "Mark and sweep",
  hint: "Click or press → to step",
  readout: "12 objects · 0 free",
  keys: [
    { mark: "lit", label: "Mark bit: raised by the probe on every object it reaches from a root" },
    { mark: "raised", label: "Heap objects, one per 32-byte slot; jumpers are references, the ringed end is the target" },
    { mark: "line", label: "Root studs: stack variables and globals, where every trace starts" },
  ],
  caption:
    "A tracing collector on a 12-slot heap. The program cuts some references; the probe then follows pointers depth-first from the roots and raises a mark bit on each object it reaches. The sweep passes over the heap in address order and frees every unmarked object, including the unreachable loop of four that a reference counter could never free. New objects are then allocated into the free slots.",
  body: `<div class="iso-stage" tabindex="0" role="button" aria-label="Mark and sweep collector: press the right arrow or space to step.">${svg}</div>`,
});

const file = theme === "light" ? "gc-mark-sweep-light.html" : "gc-mark-sweep.html";
writeFileSync(join(HERE, file), k.pageHtml({ title: "Mark and sweep", theme, body, script: kitScript() + live }));
console.log("wrote", file);

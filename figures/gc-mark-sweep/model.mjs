// The heap the figure draws, and the collector that runs on it. Pure: no drawing here.
//
// Twelve slots in a 4 × 3 tray. Slot i sits in column i % 4, row floor(i / 4), and is named
// by a letter A…L in reading order. Addresses run column by column, so the gantry sweeps
// the heap in address order as it moves along x.

export const COLS = 4;
export const ROWS = 3;
export const SLOTS = COLS * ROWS;
export const NAMES = "ABCDEFGHIJKL";
export const BASE = 0x1000;
export const OBJECT_BYTES = 0x20;

export const colRow = (slot) => [slot % COLS, Math.floor(slot / COLS)];
export const address = (slot) => {
  const [c, r] = colRow(slot);
  return BASE + (c * ROWS + r) * OBJECT_BYTES;
};
export const hex = (n) => "0x" + n.toString(16);
const slotOf = (name) => NAMES.indexOf(name);
const edges = (list) => list.split(" ").map((pair) => [slotOf(pair[0]), slotOf(pair[1])]);
export const keyOf = ([from, to]) => `${from}>${to}`;
export const rootKey = (slot) => `r${colRow(slot)[1]}`;

// Roots are the three studs on the left: stack slots and globals pointing at column 0.
// Two programs alternate. Each one cuts some references, the collector runs, and the
// next program allocates new objects into the slots the sweep freed.
const X = { roots: [slotOf("A"), slotOf("E"), slotOf("I")], edges: edges("AB BC EF FB IJ DC FG GH HL LK KG") };
const Y = { roots: [slotOf("A"), slotOf("E"), slotOf("I")], edges: edges("AB BC EF FB IJ CD FG GH JK KL") };
const CUTS = [
  { roots: [], edges: edges("FG") },
  { roots: [slotOf("I")], edges: edges("BC") },
];
export const HEAPS = [X, Y];

// Depth-first marking with an explicit mark stack, as real collectors do.
export function mark(roots, links) {
  const marked = new Set();
  const visits = [];
  const stack = [...roots].reverse();
  while (stack.length) {
    const slot = stack.pop();
    if (marked.has(slot)) continue;
    marked.add(slot);
    const children = links.filter(([from]) => from === slot).map(([, to]) => to).filter((to) => !marked.has(to));
    stack.push(...children.reverse());
    visits.push({ slot, stack: stack.length, marked: marked.size });
  }
  return { marked, visits };
}

export function scenario(index) {
  const heap = HEAPS[index];
  const next = HEAPS[(index + 1) % HEAPS.length];
  const cut = CUTS[index];
  const cutKeys = new Set(cut.edges.map(keyOf));
  const roots = heap.roots.filter((slot) => !cut.roots.includes(slot));
  const links = heap.edges.filter((edge) => !cutKeys.has(keyOf(edge)));
  const { marked, visits } = mark(roots, links);
  const garbage = Array.from({ length: SLOTS }, (_, slot) => slot).filter((slot) => !marked.has(slot));
  const survivors = links.filter(([from, to]) => marked.has(from) && marked.has(to));
  // A live object never points at garbage: if it did, the garbage would have been reached.
  for (const [from, to] of links) if (marked.has(from) && !marked.has(to)) throw new Error(`live ${from} points at garbage ${to}`);
  const kept = new Set(survivors.map(keyOf));
  for (const key of kept) if (!next.edges.some((edge) => keyOf(edge) === key)) throw new Error(`survivor link ${key} missing from the next heap`);
  return {
    cut: [...cut.roots.map(rootKey), ...cut.edges.map(keyOf)],
    cutRoots: cut.roots.length,
    cutLinks: cut.edges.length,
    visits,
    live: marked.size,
    garbage,
    freedLinks: links.filter(([from, to]) => !marked.has(from) || !marked.has(to)).map(keyOf),
    added: [
      ...next.roots.filter((slot) => !roots.includes(slot)).map(rootKey),
      ...next.edges.filter((edge) => !kept.has(keyOf(edge))).map(keyOf),
    ],
  };
}

export const SCENARIOS = HEAPS.map((_, index) => scenario(index));
export const allLinks = () => {
  const seen = new Map();
  for (const heap of HEAPS) for (const edge of heap.edges) seen.set(keyOf(edge), edge);
  return [...seen.values()];
};
export const startKeys = () => [...X.roots.map(rootKey), ...X.edges.map(keyOf)];

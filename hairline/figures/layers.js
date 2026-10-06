/**
 * Layers: a model as a stack of five plates. Each plate carries a 7 × 7 field
 * of dots: scattered noise on the input at the bottom, settling plate by
 * plate into a ring on the output at the top. The pointer picks a plate and
 * the plates above it lift open, staggered outwards from it, so its dots can
 * be read. At rest the stack is open above the input, the output bright. The
 * slider is the opening, in world units.
 *
 * Hit test: from the top plate down, each plate's TARGET top is tried with
 * unproj; the first whose footprint holds the pointer is the one it is over.
 */
const {
  Cam, clamp, facing, fit, prism, proj, rings, unproj,
  tdone, tset, tval, tween, flatDot, mk, place, pointer, put, register, disposer, solid,
} = HL;

const N = 5, S = 80, TH = 3, SP = 13, CELLS = 7, STEP = 40;
const NAMES = ["input", "layer 2", "layer 3", "layer 4", "output"];

/** The dots of plate k: noise at k = 0, a ring at k = N - 1. Integer LCG, so every load draws the same field. */
function field(k) {
  let h = 17 + k * 101;
  const rnd = () => ((h = (h * 1103515245 + 12345) >>> 0) % 1000) / 1000;
  const t = k / (N - 1), out = [];
  for (let i = 0; i < CELLS; i++) for (let j = 0; j < CELLS; j++) {
    const x = 10 + i * 10, y = 10 + j * 10, ring = Math.abs(Math.hypot(x - 40, y - 40) - 22) < 6;
    const keep = ring ? rnd() < 0.45 + 0.55 * t : rnd() < 0.55 * (1 - t);
    const jx = (rnd() - 0.5) * 7 * (1 - t), jy = (rnd() - 0.5) * 7 * (1 - t);
    if (keep) out.push([x + jx, y + jy]);
  }
  return out;
}

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let open = value;

  const C = Cam(45, 0.5, 1.95);
  const top = (N - 1) * SP + 46 + TH;
  fit(C, [[0, 0, 0], [S, S, 0], [S, 0, 0], [0, S, 0], [0, 0, top], [S, 0, top], [0, S, top]], 200, 166);
  const P = proj(C), front = facing(C);
  const [ring, inner] = rings(0, 0, S, S, 7, 1.8);

  const rest = (k) => k * SP + (k > 0 ? 0.6 * open : 0);
  const g = mk("g", {}, svg);
  // bottom to top: a higher plate covers a lower one
  const plates = Array.from({ length: N }, (_, k) => {
    const el = solid(g), pts = field(k);
    const dots = pts.map(() => flatDot(el.g, C, 1.15, "dot m"));
    return { k, el, pts, dots, to: rest(k), z: tween(rest(k)), last: NaN };
  });

  function draw(p, z) {
    if (z === p.last) return;
    p.last = z;
    put(p.el, prism(P, front, ring, inner, z, z + TH));
    p.dots.forEach((d, i) => place(d, P(p.pts[i][0], p.pts[i][1], z + TH)));
  }

  const L = register(stage, (_dt, now) => {
    let m = false;
    for (const p of plates) { draw(p, tval(p.z, now)); if (!tdone(p.z, now)) m = true; }
    return m;
  });
  bag.add(L.unregister);

  let act = -1;
  function light(a) { plates.forEach((p) => p.el.sil.classList.toggle("hi", p.k === (a < 0 ? N - 1 : a))); }
  light(-1);

  /** Opens the stack above plate a (-1: back to rest). The stagger spreads from the plate picked, or the one let go. */
  function retarget(a, force) {
    if (a === act && !force) return;
    const now = performance.now(), from = a >= 0 ? a : Math.max(act, 0);
    act = a;
    for (const p of plates) {
      p.to = a < 0 ? rest(p.k) : p.k * SP + (p.k > a ? open : 0);
      tset(p.z, p.to, now, Math.abs(p.k - from) * STEP);
    }
    light(a);
    read.textContent = a < 0 ? "rest" : NAMES[a];
    L.wake();
  }

  function hit([sx, sy]) {
    for (let k = N - 1; k >= 0; k--) {
      const [x, y] = unproj(C, sx, sy, plates[k].to + TH);
      if (x >= 0 && x <= S && y >= 0 && y <= S) return k;
    }
    return -1;
  }

  bag.add(pointer(stage, { move: (pt) => retarget(hit(pt)), leave: () => retarget(-1) }));
  bag.add(() => svg.replaceChildren());

  return { set: (v) => { open = clamp(v, 8, 60); retarget(act, true); }, destroy: bag.dispose };
}

hairline({
  name: "layers",
  means: "A model as a stack of plates, noise at the bottom and a ring at the top: the plates above the one under the pointer lift open.",
  rules: [1, 2, 5, 10],
  range: [18, 30, 46],
  mount,
});

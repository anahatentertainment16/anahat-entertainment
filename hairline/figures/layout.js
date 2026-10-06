/**
 * Layout: a web page laid flat on its browser window, built from its blocks:
 * nav, hero, three cards, footer. The pointer lifts the blocks near it off the
 * page for inspection, each on its own spring, falling off with distance. At
 * rest the hero stands proud and bright. The slider is the reach, in units.
 *
 * Hit test: from the front of the paint order back, each block's TARGET top is
 * tried with unproj; the first that holds the pointer is the field's centre,
 * else the page plane, which never moves.
 */
const {
  Cam, clamp, facing, fit, poly, prism, proj, rings, ringAt, rrect, unproj, spring, stepS,
  flatDot, mk, place, pointer, put, register, disposer, solid,
} = HL;

const W = 150, PZ = 5, LMAX = 22;
const PAGE = [-5, -5, W + 5, 163];

// [name, x0, y0, x1, y1, height, rest lift], in paint order: rows far to near, left to right
const BLOCKS = [
  ["nav", 6, 16, 144, 26, 2.5, 3],
  ["hero", 6, 32, 144, 82, 5, 12],
  ["card 1", 6, 90, 47, 136, 3.5, 6],
  ["card 2", 54.5, 90, 95.5, 136, 3.5, 3.5],
  ["card 3", 103, 90, 144, 136, 3.5, 1.5],
  ["footer", 6, 144, 144, 156, 2, 0.8],
];

/** Share of full lift at u reaches from the pointer: 1 → .31 at 42% → .09 beyond. */
const falloff = (u) =>
  u <= 0 ? 1 : u <= 0.417 ? 1 - (u / 0.417) * 0.6875 : u <= 1 ? 0.3125 - ((u - 0.417) / 0.583) * 0.2185 : 0.094;

/** The marks a block really carries, as rects [x0, y0, x1, y1, r] on its top: copy lines, a button, an image. */
function marks(name, x0, y0, x1, y1) {
  if (name === "nav") return [[x1 - 50, y0 + 4.2, x1 - 38, y0 + 5.8, 0.8], [x1 - 33, y0 + 4.2, x1 - 21, y0 + 5.8, 0.8], [x1 - 16, y0 + 4.2, x1 - 4, y0 + 5.8, 0.8]];
  if (name === "hero") return [[x0 + 10, y0 + 12, x0 + 92, y0 + 17, 2.5], [x0 + 10, y0 + 21, x0 + 70, y0 + 26, 2.5], [x0 + 10, y0 + 34, x0 + 36, y0 + 41, 3.5]];
  if (name === "footer") return [[x0 + 6, y0 + 5.2, x0 + 40, y0 + 6.8, 0.8], [x1 - 30, y0 + 5.2, x1 - 6, y0 + 6.8, 0.8]];
  return [[x0 + 4, y0 + 4, x1 - 4, y0 + 26, 2.5], [x0 + 4, y0 + 31, x1 - 10, y0 + 33, 1], [x0 + 4, y0 + 37, x1 - 18, y0 + 39, 1]];
}

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let reach = value, over = null;

  const C = Cam(45, 0.5, 1.42);
  fit(C, [[PAGE[0], PAGE[1], 0], [PAGE[2], PAGE[3], 0], [PAGE[2], PAGE[1], 0], [PAGE[0], PAGE[3], 0], [PAGE[0], PAGE[1], PZ + LMAX + 6], [PAGE[2], PAGE[1], PZ + LMAX + 6]], 200, 166);
  const P = proj(C), front = facing(C);

  const g = mk("g", {}, svg);
  // the window: a slab, its address bar, and three dots on the chrome
  const [wr, wi] = rings(...PAGE, 7, 1.6);
  put(solid(g), prism(P, front, wr, wi, 0, PZ));
  mk("path", { d: poly(ringAt(P, rrect(30, 2, 118, 9, 3.5, 4), PZ)), class: "nf lo" }, g);
  for (const x of [5, 11, 17]) place(flatDot(g, C, 1.1, "dot m"), P(x, 5.5, PZ));

  const blocks = BLOCKS.map(([name, x0, y0, x1, y1, h, rest]) => {
    const [ring, inner] = rings(x0, y0, x1, y1, 3, 1);
    const el = solid(g), mk2 = mk("path", { class: "nf lo" }, el.g);
    return { name, x0, y0, x1, y1, h, rest, ring, inner, el, mk2, rects: marks(name, x0, y0, x1, y1), sp: spring(rest, { eps: 0.03 }), drawn: NaN };
  });

  function draw(b) {
    const z = PZ + b.sp.x;
    if (z === b.drawn) return;
    b.drawn = z;
    put(b.el, prism(P, front, b.ring, b.inner, z, z + b.h));
    b.mk2.setAttribute("d", b.rects.map(([a, c, d, e, r]) => poly(ringAt(P, rrect(a, c, d, e, r, 4), z + b.h))).join(""));
  }

  const L = register(stage, (dt) => {
    let m = false;
    for (const b of blocks) { if (stepS(b.sp, dt)) m = true; draw(b); }
    return m;
  });
  bag.add(L.unregister);

  const dist = (b, [x, y]) => Math.hypot(Math.max(b.x0 - x, 0, x - b.x1), Math.max(b.y0 - y, 0, y - b.y1));
  let act = -1;
  function light(a) {
    blocks.forEach((b, i) => b.el.sil.classList.toggle("hi", i === (a < 0 ? 1 : a)));
  }
  light(-1);

  function retarget() {
    if (!over) {
      act = -1;
      blocks.forEach((b) => { b.sp.t = b.rest; });
      read.textContent = "rest";
    } else {
      act = blocks.reduce((best, b, i) => (dist(b, over) < dist(blocks[best], over) ? i : best), 0);
      blocks.forEach((b) => { b.sp.t = LMAX * falloff(dist(b, over) / reach); });
      read.textContent = blocks[act].name;
    }
    light(act);
    L.wake();
  }

  /** The field's centre: the nearest block's target top that holds the pointer, else the page plane. */
  function locate([sx, sy]) {
    for (let i = blocks.length - 1; i >= 0; i--) {
      const b = blocks[i], q = unproj(C, sx, sy, PZ + b.sp.t + b.h);
      if (dist(b, q) === 0) return q;
    }
    const q = unproj(C, sx, sy, PZ);
    return q[0] < PAGE[0] || q[0] > PAGE[2] || q[1] < PAGE[1] || q[1] > PAGE[3] ? null : q;
  }

  bag.add(pointer(stage, {
    move: (p) => { over = locate(p); retarget(); },
    leave: () => { over = null; retarget(); },
  }));
  bag.add(() => svg.replaceChildren());

  return { set: (v) => { reach = clamp(v, 10, 200); if (over) retarget(); }, destroy: bag.dispose };
}

hairline({
  name: "layout",
  means: "A web page laid flat in its window: the blocks near the pointer lift off the page, the farther the less.",
  rules: [1, 3, 5, 9],
  range: [30, 60, 110],
  mount,
});

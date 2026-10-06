/**
 * Ripple: a phone lying flat, showing a profile: avatar, stats, and a 3 × 4
 * grid of posts. The post under the pointer lifts, and the lift spreads to its
 * neighbours, staggered by grid distance on the 700ms curve: one post shared
 * outwards. At rest a share is caught mid-spread from one post, which is bright.
 * The slider is the stagger, in ms.
 *
 * Hit test: from the front of the paint order back, each tile's TARGET top is
 * tried with unproj, padded by half a gap so the gaps don't read as rest.
 */
const {
  Cam, circ, clamp, facing, fit, poly, prism, proj, rings, ringAt, rrect, unproj,
  tdone, tset, tval, tween, flatDot, mk, place, pointer, put, register, disposer, solid,
} = HL;

const COLS = 3, ROWS = 4, T = 31, GAP = 2, GY = 44, TH = 1.5, PZ = 6, LIFT = 28;
const BODY = [-7, -9, 3 * T + 2 * GAP + 7, GY + ROWS * (T + GAP) + 10];
const ORIGIN = [1, 1]; // the post the rest share spreads from: row, col

/** Share of full lift at grid distance d from the post shared. */
const reach = (d) => Math.max(0.08, 1 - 0.38 * d);

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let stag = value;

  const C = Cam(45, 0.5, 1.5);
  fit(C, [[BODY[0], BODY[1], 0], [BODY[2], BODY[3], 0], [BODY[2], BODY[1], 0], [BODY[0], BODY[3], 0], [BODY[0], BODY[1], PZ + LIFT + TH], [BODY[2], BODY[1], PZ + LIFT + TH]], 200, 166);
  const P = proj(C), front = facing(C);

  const g = mk("g", {}, svg);
  // the phone: body, the screen's edge, the camera island, the profile header
  const [br, bi] = rings(...BODY, 12, 1.8);
  put(solid(g), prism(P, front, br, bi, 0, PZ));
  mk("path", { d: poly(ringAt(P, rrect(BODY[0] + 3, BODY[1] + 3, BODY[2] - 3, BODY[3] - 3, 9, 6), PZ)), class: "nf lo" }, g);
  mk("path", { d: poly(ringAt(P, rrect(38, -4.5, 58, 0.5, 2.5, 4), PZ)), class: "nf" }, g);
  const ax = 14, ay = 22;
  mk("path", { d: poly(circ(10, 24).map((q) => P(ax + q.u, ay + q.v, PZ))), class: "nf" }, g);
  mk("path", { d: poly(circ(7.5, 24).map((q) => P(ax + q.u, ay + q.v, PZ))), class: "nf lo" }, g);
  for (let k = 0; k < 3; k++) {
    const x = 34 + k * 20;
    mk("path", { d: poly(ringAt(P, rrect(x, 15, x + 12, 19, 2, 3), PZ)), class: "nf lo" }, g);
    place(flatDot(g, C, 0.9, "dot off"), P(x + 6, 26, PZ));
  }

  // tiles, diagonal by diagonal from the far corner: painting back to front
  const tiles = [];
  for (let s = 0; s <= ROWS + COLS - 2; s++) for (let r = 0; r < ROWS; r++) {
    const c = s - r;
    if (c < 0 || c >= COLS) continue;
    const x0 = c * (T + GAP), y0 = GY + r * (T + GAP);
    const [ring, inner] = rings(x0, y0, x0 + T, y0 + T, 1.6, 0.7);
    const el = solid(g), frame = mk("path", { class: "nf lo" }, el.g);
    const d0 = Math.hypot(r - ORIGIN[0], c - ORIGIN[1]), rest = 1 + 18 * reach(Math.round(d0 * 10) / 10);
    tiles.push({ r, c, x0, y0, ring, inner, el, frame, rest, to: rest, z: tween(rest), last: NaN });
  }

  function draw(t, h) {
    if (h === t.last) return;
    t.last = h;
    const z = PZ + h;
    put(t.el, prism(P, front, t.ring, t.inner, z, z + TH));
    t.frame.setAttribute("d", poly(ringAt(P, rrect(t.x0 + 3, t.y0 + 3, t.x0 + T - 3, t.y0 + T - 3, 1, 3), z + TH)));
  }

  const L = register(stage, (_dt, now) => {
    let m = false;
    for (const t of tiles) { draw(t, tval(t.z, now)); if (!tdone(t.z, now)) m = true; }
    return m;
  });
  bag.add(L.unregister);

  let act = null;
  const origin = tiles.find((t) => t.r === ORIGIN[0] && t.c === ORIGIN[1]);
  origin.el.sil.classList.add("hi");

  /** Shares tile a (null: back to the rest spread). The lift spreads by grid distance from it, or from the one let go. */
  function setActive(a) {
    if (a === act) return;
    const now = performance.now(), from = a || act;
    act = a;
    for (const t of tiles) {
      const d = Math.hypot(t.r - from.r, t.c - from.c);
      t.to = a ? 1 + (LIFT - 1) * reach(Math.round(d * 10) / 10) : t.rest;
      tset(t.z, t.to, now, d * stag);
      t.el.sil.classList.toggle("hi", t === (a || origin));
    }
    read.textContent = a ? `post ${a.r + 1}·${a.c + 1}` : "rest";
    L.wake();
  }

  function hit([sx, sy]) {
    for (let i = tiles.length - 1; i >= 0; i--) {
      const t = tiles[i], [x, y] = unproj(C, sx, sy, PZ + t.to + TH), h = GAP / 2;
      if (x >= t.x0 - h && x <= t.x0 + T + h && y >= t.y0 - h && y <= t.y0 + T + h) return t;
    }
    return null;
  }

  bag.add(pointer(stage, { move: (p) => setActive(hit(p)), leave: () => setActive(null) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { stag = clamp(v, 0, 200); }, destroy: bag.dispose };
}

hairline({
  name: "ripple",
  means: "A phone's grid of posts: the one under the pointer lifts, and the lift spreads to its neighbours in turn.",
  rules: [1, 2, 5, 10],
  range: [0, 50, 100],
  mount,
});

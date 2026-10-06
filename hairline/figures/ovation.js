/**
 * Ovation: a cinema seen from behind its audience: three raked rows of seats
 * facing the screen, where the ad plays. People near the pointer stand up
 * from their seats, each on its
 * own spring, the farther the less. At rest one person in the middle is
 * already up, and the few around them are getting up: word of mouth. The
 * slider is the reach, in world units.
 *
 * Hit test: the tiers stand at different heights, so the pointer is projected
 * onto each seat's own head height at its TARGET pose, and the seat that puts
 * it nearest its middle wins.
 */
const {
  Cam, circ, clamp, facing, fit, prism, proj, rings, unproj, spring, stepS,
  mk, pointer, put, register, disposer, solid,
} = HL;

const ROWS = 3, SEATS = 5, PX = 17, PY = 19, RISE = 5, LMAX = 18;
const W = SEATS * PX, ORIGIN = [1, 2]; // row, seat of the first one up
const tierZ = (r) => r * RISE + 3;

/** Share of full rise at u reaches from the pointer: a straight fall to a floor of .09, so neighbours visibly get up. */
const falloff = (u) => Math.max(0.09, 1 - 0.75 * u);

/** A ring moved to (cx, cy). */
const at = (ring, cx, cy) => ring.map((q) => ({ ...q, u: q.u + cx, v: q.v + cy }));

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let reach = value, over = null;

  const C = Cam(45, 0.5, 2.25);
  const top = tierZ(ROWS - 1) + LMAX + 17, SZ = 50;
  fit(C, [[-5, -16, 0], [W + 5, ROWS * PY, 0], [W + 5, -16, 0], [-5, ROWS * PY, 0], [-5, -16, SZ], [W + 5, -16, SZ], [W + 5, ROWS * PY, top]], 200, 166);
  const P = proj(C), front = facing(C);
  const head = circ(3.2, 16), headIn = circ(2.5, 16);

  const g = mk("g", {}, svg), people = [];
  // the screen, at the far end: where the ad plays
  const [sr, si] = rings(4, -16, W - 4, -13, 1.2, 0.6);
  put(solid(g), prism(P, front, sr, si, 8, SZ));
  for (let r = 0; r < ROWS; r++) {
    const y0 = r * PY, tz = tierZ(r);
    const [tr, ti] = rings(-5, y0 - 3, W + 5, y0 + PY - 3, 2.5, 1);
    put(solid(g), prism(P, front, tr, ti, 0, tz));
    for (let i = 0; i < SEATS; i++) {
      const cx = i * PX + PX / 2, cy = y0 + 4.5;
      const [or, oi] = rings(cx - 5.5, y0 + 2, cx + 5.5, y0 + 7, 2.4, 0.8);
      const d0 = Math.hypot(r - ORIGIN[0], i - ORIGIN[1]);
      const rest = d0 === 0 ? LMAX : d0 < 1.5 ? LMAX * 0.45 : 0;
      people.push({
        r, i, cx, cy, tz, rest, or, oi, hr: at(head, cx, cy), hi: at(headIn, cx, cy),
        torso: solid(g), head: solid(g), sp: spring(rest, { eps: 0.03 }), drawn: NaN,
      });
      // the seat back, nearer than its sitter: seated, only the head shows over it
      const [br, bi] = rings(cx - 7, y0 + 8, cx + 7, y0 + 11, 1.2, 0.5);
      put(solid(g), prism(P, front, br, bi, tz, tz + 12));
    }
  }

  function draw(p) {
    const z = p.tz + Math.max(0, p.sp.x);
    if (z === p.drawn) return;
    p.drawn = z;
    put(p.torso, prism(P, front, p.or, p.oi, p.tz, z + 9));
    put(p.head, prism(P, front, p.hr, p.hi, z + 11, z + 17.5));
  }

  const L = register(stage, (dt) => {
    let m = false;
    for (const p of people) { if (stepS(p.sp, dt)) m = true; draw(p); }
    return m;
  });
  bag.add(L.unregister);

  const origin = people.find((p) => p.r === ORIGIN[0] && p.i === ORIGIN[1]);
  let lit = null;
  function light(p) {
    if (p === lit) return;
    if (lit) { lit.torso.sil.classList.remove("hi"); lit.head.sil.classList.remove("hi"); }
    lit = p;
    p.torso.sil.classList.add("hi"); p.head.sil.classList.add("hi");
  }
  light(origin);

  /** The seat whose head, at its target height, sits nearest the pointer; with the pointer's world point on that plane. */
  function locate([sx, sy]) {
    let best = null, bd = 11, bq = null;
    for (const p of people) {
      const q = unproj(C, sx, sy, p.tz + p.sp.t + 14), d = Math.hypot(q[0] - p.cx, q[1] - p.cy);
      if (d < bd) { bd = d; best = p; bq = q; }
    }
    return best && { p: best, q: bq };
  }

  function retarget() {
    if (!over) {
      for (const p of people) p.sp.t = p.rest;
      light(origin);
      read.textContent = "rest";
    } else {
      for (const p of people) p.sp.t = LMAX * falloff(Math.hypot(p.cx - over.q[0], p.cy - over.q[1]) / reach);
      light(over.p);
      read.textContent = `row ${over.p.r + 1}·seat ${over.p.i + 1}`;
    }
    L.wake();
  }

  bag.add(pointer(stage, {
    move: (pt) => { const hit = locate(pt); if (hit?.p !== over?.p) { over = hit; retarget(); } },
    leave: () => { over = null; retarget(); },
  }));
  bag.add(() => svg.replaceChildren());

  return { set: (v) => { reach = clamp(v, 8, 80); if (over) retarget(); }, destroy: bag.dispose };
}

hairline({
  name: "ovation",
  means: "A cinema audience facing the screen: people near the pointer stand up from their seats, the farther the less.",
  rules: [1, 3, 5, 9],
  range: [24, 40, 64],
  mount,
});

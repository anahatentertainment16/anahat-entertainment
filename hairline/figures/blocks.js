/**
 * Blocks: a segmented loading bar seen from above. Ten slots are cut into a
 * rounded tray; each loaded tile drops into its slot, staggered out from the
 * old fill edge, and the newest takes the bright stroke. Empty slots stay as
 * dim outlines, so the bar's full length always reads. The pointer lifts the
 * tiles near it, and the one under it takes the bright. The slider is how many
 * tiles are loaded.
 */
const {
  Cam, clamp, facing, fit, prism, proj, rings, rrect, ringAt, poly,
  spring, stepS, tween, tset, tval, tdone, mk, pointer, put, register, disposer, solid,
} = HL;

const N = 10, CELL = 14, FOOT = 11, DEPTH = 18, PAD = 6, TW = DEPTH + 8;
const LEN = N * CELL, H = 4, DROP = 26, LIFT = 8, REACH = 2.2;
const fall = (u) => (u >= 1 ? 0 : 1 - u * u); // lift share at u reaches from the pointer, 0 beyond

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  const C = Cam(45, 0.5, 2.1);
  fit(C, [[-PAD, -PAD, -5], [LEN + PAD, TW + PAD, -5], [LEN + PAD, -PAD, -5], [-PAD, TW + PAD, -5], [0, 4, DROP + H], [LEN, 4, DROP + H]], 200, 166);
  const P = proj(C), front = facing(C);

  const g = mk("g", {}, svg);
  const [pr, pi] = rings(-PAD, -PAD, LEN + PAD, TW + PAD, 9, 2);
  put(solid(g), prism(P, front, pr, pi, -5, 0));

  let n = clamp(Math.round(value), 0, N);
  let slots = "";
  const tiles = [];
  for (let i = 0; i < N; i++) {
    const x0 = i * CELL + (CELL - FOOT) / 2;
    slots += poly(ringAt(P, rrect(x0, 4, x0 + FOOT, 4 + DEPTH, 2.2, 3), 0));
    const [ring, inner] = rings(x0 + 0.6, 4.6, x0 + FOOT - 0.6, 3.4 + DEPTH, 2, 0.9);
    tiles.push({ ring, inner, drop: tween(i < n ? 0 : DROP), lift: spring(0, { eps: 0.04 }), el: null, drawn: NaN });
  }
  // The slots, painted before every tile, so a landed tile covers its own outline.
  mk("path", { class: "nf lo", d: slots }, g);
  tiles.forEach((t) => (t.el = solid(g)));

  let over = -1;
  function mark() {
    const on = over >= 0 && over < n ? over : n - 1;
    tiles.forEach((t, i) => t.el.sil.classList.toggle("hi", i === on));
  }

  const B = register(stage, (dt, now) => {
    let moving = false;
    tiles.forEach((t, i) => {
      if (stepS(t.lift, dt) || !tdone(t.drop, now)) moving = true;
      const z = tval(t.drop, now), lz = z + t.lift.x;
      // An unloaded tile that has risen out of view is not drawn at all.
      const key = i >= n && z >= DROP - 0.01 ? -1 : lz;
      if (key === t.drawn) return;
      t.drawn = key;
      put(t.el, key < 0 ? { sil: "", crease: "" } : prism(P, front, t.ring, t.inner, lz, lz + H));
    });
    return moving;
  });
  bag.add(B.unregister);

  // Hit test against each slot's resting top, never a lifted or falling tile:
  // the nearest centre in screen x, within a band around the tray.
  function hit([x, y]) {
    let best = -1, bd = Infinity;
    tiles.forEach((_, i) => {
      const c = P(i * CELL + CELL / 2, 4 + DEPTH / 2, i < n ? H : 0);
      const d = Math.abs(c[0] - x);
      if (d < bd && Math.abs(c[1] - y) < 60) { bd = d; best = i; }
    });
    return bd <= CELL * 1.2 ? best : -1;
  }

  function aim(a) {
    over = a;
    tiles.forEach((t, i) => { t.lift.t = a < 0 || i >= n ? 0 : LIFT * fall(Math.abs(i - a) / REACH); });
    read.textContent = a < 0 ? "rest" : `tile ${a + 1}`;
    mark();
    B.wake();
  }

  bag.add(pointer(stage, { move: (p) => aim(hit(p)), leave: () => aim(-1) }));
  bag.add(() => svg.replaceChildren());
  read.textContent = "rest";
  mark();
  B.wake();

  return {
    // The count changes: tiles that flip drop in or lift out, staggered out from the old fill edge.
    set: (v) => {
      const next = clamp(Math.round(v), 0, N);
      if (next === n) return;
      const now = performance.now(), edge = n;
      n = next;
      tiles.forEach((t, i) => tset(t.drop, i < n ? 0 : DROP, now, Math.abs(i - edge) * 45));
      if (over >= 0) aim(over);
      mark();
      B.wake();
    },
    destroy: bag.dispose,
  };
}

hairline({
  name: "blocks",
  means: "A segmented loading bar: tiles drop into a tray's slots one by one, the newest bright; the pointer lifts the ones near it.",
  rules: [1, 2, 5, 6],
  range: [3, 6, 10],
  mount,
});

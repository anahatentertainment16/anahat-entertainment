/**
 * Hinge: a laptop on the desk, lid half open, code half typed on its screen.
 * The pointer's x sets the lid's angle on one spring; the further it opens,
 * the more of the code is written, a cursor riding the end of it. Fully open,
 * the lid takes the bright edge: ship. The slider is the hinge's damping:
 * low lets the lid bounce.
 */
const {
  Cam, clamp, facing, fit, prism, proj, rings, rrect, run, hull, poly, open, seg, rad,
  spring, stepS, flatDot, mk, place, pointer, put, register, disposer, solid,
} = HL;

const DX = 88, DY = 130, BH = 6, L = 84, T = 3, HX = 2, MAX = 110, REST = 72, SHIP = 106;
const V = [0.612, 0.612, 0.5]; // toward the camera at Cam(45, 0.5)
// Code lines on the screen: [indent, length], top to bottom, in world units.
const CODE = [[0, 44], [8, 58], [16, 40], [16, 66], [8, 30], [0, 22], [8, 50]];
const TOTAL = CODE.reduce((s, c) => s + c[1], 0);

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  const C = Cam(45, 0.5, 1.5);
  const at = (th, a, y, w) => {
    const c = Math.cos(rad(th)), s = Math.sin(rad(th));
    return [HX + a * c - w * s, y, a * s + w * c];
  };
  fit(C, [[0, 0, -BH], [DX, 0, -BH], [0, DY, -BH], [DX, DY, -BH], at(118, L, 0, T), at(118, L, DY, T)], 200, 172);
  const P = proj(C), front = facing(C);
  const sp = spring(REST, { c: value, eps: 0.05 });
  let drawn = NaN, over = false;

  const g = mk("g", {}, svg);
  const [br, bi] = rings(0, 0, DX, DY, 8, 1.6);
  put(solid(g), prism(P, front, br, bi, -BH, 0));
  // Keyboard and trackpad: flat outlines on the deck, painted before the lid so a closed lid covers them.
  let keys = "";
  for (let r = 0; r < 4; r++) for (let k = 0; k < 11; k++) {
    const x0 = 12 + r * 10, y0 = 12 + k * 9.6;
    keys += poly(rrect(x0, y0, x0 + 8, y0 + 8, 1.6, 2).map((q) => P(q.u, q.v, 0)));
  }
  keys += poly(rrect(56, 40, 80, 90, 3, 3).map((q) => P(q.u, q.v, 0)));
  mk("path", { d: keys, class: "lo nf" }, g);

  const lid = solid(g);
  const code = mk("path", { class: "lo nf" }, g);
  const cursor = flatDot(g, C, 0.9, "dot");
  const outer = rrect(0, 0, L, DY, 7, 4), inner = rrect(1.4, 1.4, L - 1.4, DY - 1.4, 5.6, 4);
  const pane = rrect(8, 8, L - 6, DY - 8, 3, 3);

  function draw() {
    const th = clamp(sp.x, 0, 118);
    if (th === drawn) return;
    drawn = th;
    const c = Math.cos(rad(th)), s = Math.sin(rad(th));
    // The screen face looks along (sin, 0, -cos); the back along its opposite.
    const screen = V[0] * s - V[2] * c > 0, w = screen ? 0 : T;
    const ring = (rg, ww) => rg.map((q) => P(...at(th, q.u, q.v, ww)));
    const sil = poly(hull(ring(outer, 0).concat(ring(outer, T))));
    // A sample faces us when its in-plane normal, turned into the world, points at the camera.
    const sees = (q) => q.nu * (c * V[0] + s * V[2]) + q.nv * V[1] > 0;
    put(lid, { sil, crease: open(ring(run(inner, sees), w)) });
    lid.sil.classList.toggle("hi", sp.t >= SHIP);

    let d = "", left = TOTAL * clamp((th - 50) / (SHIP - 50), 0, 1), end = [10, 12];
    if (screen) {
      d = poly(ring(pane, 0));
      CODE.forEach(([ind, len], i) => {
        if (left <= 0) return;
        const a = L - 16 - i * 9, n = Math.min(len, left);
        d += seg(P(...at(th, a, 14 + ind, 0)), P(...at(th, a, 14 + ind + n, 0)));
        end = [a, 16 + ind + n];
        left -= n;
      });
    }
    code.setAttribute("d", d);
    // Screen turned away: tuck the cursor behind the lid, whose fill hides it (rule 06).
    if (screen) code.after(cursor); else lid.g.before(cursor);
    place(cursor, P(...at(th, end[0], end[1], 0)));
    cursor.setAttribute("class", sp.t >= SHIP ? "dot off" : "dot");
  }

  const B = register(stage, (dt) => { const m = stepS(sp, dt); draw(); return m; });
  bag.add(B.unregister);

  bag.add(pointer(stage, {
    // Angle from the pointer's screen x alone: nothing it reads ever moves (rule 01).
    move: (p) => {
      over = true;
      sp.t = MAX * clamp((p[0] - 80) / 240, 0, 1);
      read.textContent = sp.t >= SHIP ? "ship" : `${Math.round(sp.t)}°`;
      B.wake();
    },
    leave: () => { over = false; sp.t = REST; read.textContent = "rest"; B.wake(); },
  }));
  bag.add(() => svg.replaceChildren());
  read.textContent = "rest";
  draw();

  return {
    set: (v) => { sp.c = v; if (over) B.wake(); },
    destroy: bag.dispose,
  };
}

hairline({
  name: "hinge",
  means: "A laptop lid opens with the pointer; the further it opens, the more code is written, until it ships.",
  rules: [1, 5, 8, 9],
  range: [18, 10, 5],
  mount,
});

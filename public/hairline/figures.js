/* hairline kernel sha256:8e2abcbdf63c7755195ee942c39e9c8ea6a539d1147e986dd1c153559121f075 */
/*
 * HL: everything a figure may call. Read this index; the code under it is the
 * package's src/core, unchanged, and a figure should not need to read it.
 *
 * Every figure is drawn in a 400 × 320 viewBox. World space is x/y on the
 * ground and z up. Plates are filled with the ground colour and painted back
 * to front, so a nearer one covers a farther one: append in that order. At
 * the default camera, Cam(45, 0.5, S), +x runs down to the right and +y down
 * to the left, so the corner with the largest x and y is nearest the viewer:
 * append by ascending x + y, from the far corner (smallest x and y) to it.
 *
 * Camera
 *   Cam(azDeg, k, S)                       a camera: azimuth in degrees, k = sin(elevation) (0.5 is the 2:1 view), S = scale
 *   fit(C, points, cx, cy)                 centres the box of [x, y, z] points on (cx, cy); call it once, before proj
 *                                          it only centres, it never scales: choose S by trying values, with the most extreme pose in points.
 *                                          The six figures use S 1.42 to 2.12; the boxes they fit come out 230 to 310 wide and 180 to 245 tall
 *   proj(C)                                returns P(x, y, z), which gives [sx, sy]
 *   unproj(C, sx, sy, z)                   the world [x, y] under a screen point, on the plane at height z
 *   facing(C)                              returns front(sample): whether a ring sample faces the camera
 * Rounded solids
 *   rrect(u0, v0, u1, v1, r, n)            a rounded rectangle, as a ring of samples {u, v, nu, nv}
 *   circ(R, n)                             a circle, as a ring
 *   rings(x0, y0, x1, y1, r, b)            [ring, inner]: a rounded footprint and its crease ring, inset by b
 *                                          r, the corner radius, is cut to half the shorter side. b, the crease's inset in world units
 *                                          (0.6 to 2.2 in the figures), must stay under half the shorter side or the crease turns inside out
 *   prism(P, front, ring, inner, z0, z1)   {sil, crease}: a solid standing from z0 to z1, as two path strings
 *   ringAt(P, ring, z)                     the ring's points, projected at height z
 *   run(ring, keep)                        the one cyclic run of samples that pass keep
 *   hull(points)                           the convex hull of screen points
 *   extremes(P, ring)                      [left, right, nearest] samples: where dashed drops fall from
 *   fillet(points, radii, n)               rounds every vertex of a closed polygon; returns the new points
 *                                          radii is an array, one radius per vertex, each cut to half its shorter edge; a single number gives NaN.
 *                                          n is the steps round each corner, default 4: each vertex becomes n + 1 points
 *   ghost(P, front, ring, z0, depth)       a reflection's path {d, y0, y1}; reflect() draws it for you
 * Paths and numbers
 *   poly(points)                           a closed path string
 *   open(points)                           an open polyline string
 *   seg(a, b)                              one segment between two screen points [sx, sy], as its own subpath; project world points with P first
 *   clamp(v, a, b)
 *   lerp(a, b, t)
 *   rad(deg)
 *   r2(n)                                  two decimals
 * The continuous clock: one spring per moving number
 *   spring(x, opts)                        at rest on x; write .t to retarget; opts {k, c, m, eps}, default k 100, c 18, m 1
 *   stepS(sp, dt)                          advances by dt seconds; returns whether it is still moving
 * The discrete clock: a 700ms tween on (.32, .72, 0, 1)
 *   tween(v, dur)                          at rest on v; dur defaults to 700 (ms)
 *   tset(tw, to, now, delay)               retargets from where it is, after delay ms: the stagger
 *                                          the same target again does nothing, so calling it on every pointer move is safe
 *   tval(tw, now)                          its value at now
 *   tdone(tw, now)                         whether it has landed
 *   bezier(x1, y1, x2, y2)                 a CSS cubic-bezier, as a function of progress
 *   EASE_LIFT                              the lift curve itself
 *   reducedMotion()                        true when the reader asked for less motion; springs and tweens already land at once
 *   setReducedMotion(on)                   the loop's business, not a figure's
 * Drawing
 *   mk(tag, attrs, parent)                 one svg element: the only way a figure makes a node
 *   solid(parent)                          {g, sil, cr}: a group holding a silhouette path and a crease path
 *   put(solid, paths)                      writes prism()'s {sil, crease} into solid()'s {sil, cr}: sil into sil, crease into cr
 *   flatDot(parent, C, r, cls)             a dot lying on the ground plane; cls is "dot", "dot m" or "dot off"
 *   place(el, point)                       moves a dot or a circle to [sx, sy]
 *   reflect(svg, parent, P, front, ring, z0, depth)   a fading mirror under a solid
 *   fade(svg, y0, y1, a0)                  a vertical fade, as a mask; returns the value for a mask attribute
 * Life
 *   register(stage, tick)                  joins the one frame loop; tick(dt in seconds, now in ms) returns true to ask for another frame; gives {wake, unregister}
 *   pointer(stage, handlers)               {move(point), down(point), leave()}, points in viewBox units; returns its disposer
 *   disposer()                             {add, on, dispose}: collects tear-down, so destroy is bag.dispose
 * The bench's business, not a figure's
 *   css(lightDark)
 *   inject(root)
 *
 * Classes, on path, polygon, ellipse and line. They are the whole palette; a
 * figure sets no colour, width or fill of its own.
 *     (none)   filled with the ground colour, medium stroke
 *     sil      the silhouette's stroke        hi    the bright stroke: the only highlight
 *     lo       the dim stroke                 nf    no fill        fo   fill only, no stroke
 *     dash     a dashed guide
 *     dot      a bright dot                   dot m   a medium dot     dot off   a dim dot
 */
var HL = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // packages/hairline/src/core/kernel.ts
  var kernel_exports = {};
  __export(kernel_exports, {
    Cam: () => Cam,
    EASE_LIFT: () => EASE_LIFT,
    bezier: () => bezier,
    circ: () => circ,
    clamp: () => clamp,
    css: () => css,
    disposer: () => disposer,
    extremes: () => extremes,
    facing: () => facing,
    fade: () => fade,
    fillet: () => fillet,
    fit: () => fit,
    flatDot: () => flatDot,
    ghost: () => ghost,
    hull: () => hull,
    inject: () => inject,
    lerp: () => lerp,
    mk: () => mk,
    open: () => open,
    place: () => place,
    pointer: () => pointer,
    poly: () => poly,
    prism: () => prism,
    proj: () => proj,
    put: () => put,
    r2: () => r2,
    rad: () => rad,
    reducedMotion: () => reducedMotion,
    reflect: () => reflect,
    register: () => register,
    ringAt: () => ringAt,
    rings: () => rings,
    rrect: () => rrect,
    run: () => run,
    seg: () => seg,
    setReducedMotion: () => setReducedMotion,
    solid: () => solid,
    spring: () => spring,
    stepS: () => stepS,
    tdone: () => tdone,
    tset: () => tset,
    tval: () => tval,
    tween: () => tween,
    unproj: () => unproj
  });

  // packages/hairline/src/core/iso.ts
  var clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  var lerp = (a, b, t) => a + (b - a) * t;
  var rad = (d) => d * Math.PI / 180;
  var r2 = (n) => Math.round(n * 100) / 100;
  var poly = (pts) => "M" + pts.map((p) => r2(p[0]) + " " + r2(p[1])).join("L") + "Z";
  var seg = (a, b) => `M${r2(a[0])} ${r2(a[1])}L${r2(b[0])} ${r2(b[1])}`;
  var open = (pts) => pts.length < 2 ? "" : "M" + pts.map((p) => r2(p[0]) + " " + r2(p[1])).join("L");
  var Cam = (azDeg, k, S) => ({ az: rad(azDeg), k, S, ox: 0, oy: 0 });
  function proj(C) {
    const c = Math.cos(C.az), s = Math.sin(C.az), zf = Math.sqrt(1 - C.k * C.k);
    return (x, y, z) => {
      const X = x * c - y * s, Y = x * s + y * c;
      return [C.ox + C.S * X, C.oy + C.S * (Y * C.k - z * zf)];
    };
  }
  function unproj(C, sx, sy, z) {
    const c = Math.cos(C.az), s = Math.sin(C.az), zf = Math.sqrt(1 - C.k * C.k);
    const X = (sx - C.ox) / C.S, Y = ((sy - C.oy) / C.S + z * zf) / C.k;
    return [X * c + Y * s, -X * s + Y * c];
  }
  function fit(C, pts, cx, cy) {
    C.ox = 0;
    C.oy = 0;
    const P = proj(C);
    let a = 1e9, b = -1e9, c = 1e9, d = -1e9;
    for (const p of pts) {
      const q = P(p[0], p[1], p[2]);
      a = Math.min(a, q[0]);
      b = Math.max(b, q[0]);
      c = Math.min(c, q[1]);
      d = Math.max(d, q[1]);
    }
    C.ox = cx - (a + b) / 2;
    C.oy = cy - (c + d) / 2;
  }
  function rrect(u0, v0, u1, v1, r, n = 4) {
    r = Math.max(0, Math.min(r, (u1 - u0) / 2, (v1 - v0) / 2));
    const out = [];
    for (const [cu, cv, a0] of [[u1 - r, v1 - r, 0], [u0 + r, v1 - r, 90], [u0 + r, v0 + r, 180], [u1 - r, v0 + r, 270]])
      for (let k = 0; k <= n; k++) {
        const a = rad(a0 + 90 * k / n), ca = Math.cos(a), sa = Math.sin(a);
        out.push({ u: cu + r * ca, v: cv + r * sa, nu: ca, nv: sa });
      }
    return out;
  }
  function circ(R, n = 96) {
    const out = [];
    for (let k = 0; k < n; k++) {
      const a = k / n * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a);
      out.push({ u: R * ca, v: R * sa, nu: ca, nv: sa });
    }
    return out;
  }
  function hull(input) {
    const pts = input.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const x = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lo = [], up = [];
    for (const p of pts) {
      while (lo.length > 1 && x(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop();
      lo.push(p);
    }
    for (let i = pts.length - 1; i >= 0; i--) {
      const p = pts[i];
      while (up.length > 1 && x(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop();
      up.push(p);
    }
    lo.pop();
    up.pop();
    return lo.concat(up);
  }
  var ringAt = (P, ring, z) => ring.map((q) => P(q.u, q.v, z));
  var facing = (C) => {
    const s = Math.sin(C.az), c = Math.cos(C.az);
    return (q) => q.nu * s + q.nv * c >= -1e-6;
  };
  function run(ring, keep) {
    const n = ring.length;
    let s = -1;
    for (let i = 0; i < n; i++) if (keep(ring[i]) && !keep(ring[(i + n - 1) % n])) {
      s = i;
      break;
    }
    if (s < 0) return keep(ring[0]) ? ring.slice() : [];
    const out = [];
    for (let k = 0; k < n && keep(ring[(s + k) % n]); k++) out.push(ring[(s + k) % n]);
    return out;
  }
  function prism(P, front, ring, inner, z0, z1) {
    return {
      sil: poly(hull(ringAt(P, ring, z1).concat(ringAt(P, ring, z0)))),
      crease: inner ? open(ringAt(P, run(inner, front), z1)) : ""
    };
  }
  var rings = (x0, y0, x1, y1, r, b) => [
    rrect(x0, y0, x1, y1, r),
    rrect(x0 + b, y0 + b, x1 - b, y1 - b, Math.max(0.3, r - b))
  ];
  function extremes(P, ring) {
    const pr = ring.map((q) => P(q.u, q.v, 0));
    let a = 0, b = 0, c = 0;
    pr.forEach((p, k) => {
      if (p[0] < pr[a][0]) a = k;
      if (p[0] > pr[b][0]) b = k;
      if (p[1] > pr[c][1]) c = k;
    });
    return [ring[a], ring[b], ring[c]];
  }
  function fillet(pts, rs, n = 4) {
    const m = pts.length, out = [];
    for (let i = 0; i < m; i++) {
      const a = pts[(i + m - 1) % m], p = pts[i], b = pts[(i + 1) % m];
      const la = Math.hypot(a[0] - p[0], a[1] - p[1]), lb = Math.hypot(b[0] - p[0], b[1] - p[1]);
      const t = Math.min(rs[i], la / 2, lb / 2);
      const p1 = [p[0] + (a[0] - p[0]) / la * t, p[1] + (a[1] - p[1]) / la * t];
      const p2 = [p[0] + (b[0] - p[0]) / lb * t, p[1] + (b[1] - p[1]) / lb * t];
      for (let k = 0; k <= n; k++) {
        const s = k / n, w = 1 - s;
        out.push([w * w * p1[0] + 2 * w * s * p[0] + s * s * p2[0], w * w * p1[1] + 2 * w * s * p[1] + s * s * p2[1]]);
      }
    }
    return out;
  }
  function ghost(P, front, ring, z0, depth) {
    const f = run(ring, front), lowP = ringAt(P, f, z0 - depth);
    return {
      d: open(lowP) + [f[0], f[f.length - 1]].map((q) => seg(P(q.u, q.v, z0), P(q.u, q.v, z0 - depth))).join(""),
      y0: Math.min(...ringAt(P, f, z0).map((p) => p[1])),
      y1: Math.max(...lowP.map((p) => p[1])) + 2
    };
  }

  // packages/hairline/src/core/motion.ts
  var reduced = false;
  var setReducedMotion = (on) => {
    reduced = on;
  };
  var reducedMotion = () => reduced;
  function spring(x, o = {}) {
    return { x, v: 0, t: x, k: o.k ?? 100, c: o.c ?? 18, m: o.m ?? 1, eps: o.eps ?? 0.01 };
  }
  function stepS(sp, dt) {
    if (reduced) {
      sp.x = sp.t;
      sp.v = 0;
      return false;
    }
    const n = Math.max(1, Math.ceil(dt * 240)), h = dt / n;
    for (let i = 0; i < n; i++) {
      const a = (-sp.k * (sp.x - sp.t) - sp.c * sp.v) / sp.m;
      sp.v += a * h;
      sp.x += sp.v * h;
    }
    if (Math.abs(sp.x - sp.t) < sp.eps && Math.abs(sp.v) < sp.eps * 10) {
      sp.x = sp.t;
      sp.v = 0;
      return false;
    }
    return true;
  }
  function bezier(x1, y1, x2, y2) {
    const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
    const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    const X = (u) => ((ax * u + bx) * u + cx) * u;
    const Y = (u) => ((ay * u + by) * u + cy) * u;
    const dX = (u) => (3 * ax * u + 2 * bx) * u + cx;
    return (t) => {
      if (t <= 0) return 0;
      if (t >= 1) return 1;
      let u = t;
      for (let i = 0; i < 8; i++) {
        const e = X(u) - t;
        if (Math.abs(e) < 1e-5) break;
        const d = dX(u);
        if (Math.abs(d) < 1e-6) break;
        u -= e / d;
      }
      if (!(u >= 0 && u <= 1) || Math.abs(X(u) - t) > 1e-4) {
        let lo = 0, hi = 1;
        u = t;
        for (let i = 0; i < 24; i++) {
          if (X(u) < t) lo = u;
          else hi = u;
          u = (lo + hi) / 2;
        }
      }
      return Y(u);
    };
  }
  var EASE_LIFT = bezier(0.32, 0.72, 0, 1);
  var tween = (v, dur = 700) => ({ from: v, to: v, t0: -1e9, dur });
  var tval = (tw, now) => {
    const p = clamp((now - tw.t0) / tw.dur, 0, 1);
    return tw.from + (tw.to - tw.from) * (reduced ? 1 : EASE_LIFT(p));
  };
  var tset = (tw, to, now, delay) => {
    if (tw.to === to) return;
    tw.from = tval(tw, now);
    tw.to = to;
    tw.t0 = now + delay;
  };
  var tdone = (tw, now) => reduced || now >= tw.t0 + tw.dur;

  // packages/hairline/src/core/stage.ts
  var NS = "http://www.w3.org/2000/svg";
  function mk(tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    if (attrs) for (const k in attrs) e.setAttribute(k, String(attrs[k]));
    if (parent) parent.appendChild(e);
    return e;
  }
  function solid(parent) {
    const g = mk("g", {}, parent);
    return { g, sil: mk("path", { class: "sil" }, g), cr: mk("path", { class: "nf lo" }, g) };
  }
  var put = (el, s) => {
    el.sil.setAttribute("d", s.sil);
    el.cr.setAttribute("d", s.crease);
  };
  var flatDot = (parent, C, r, cls) => mk("ellipse", { rx: r2(r * C.S), ry: r2(r * C.S * C.k), class: cls }, parent);
  var place = (el, q) => {
    el.setAttribute("cx", String(r2(q[0])));
    el.setAttribute("cy", String(r2(q[1])));
  };
  var fid = 0;
  function fade(svg, y0, y1, a0 = 0.7) {
    const id = "hl-fd" + ++fid, defs = mk("defs", {}, svg);
    const lg = mk("linearGradient", { id: id + "g", gradientUnits: "userSpaceOnUse", x1: 0, y1: r2(y0), x2: 0, y2: r2(y1) }, defs);
    mk("stop", { offset: 0, "stop-color": "#fff", "stop-opacity": a0 }, lg);
    mk("stop", { offset: 1, "stop-color": "#fff", "stop-opacity": 0 }, lg);
    const m = mk("mask", { id, maskUnits: "userSpaceOnUse", x: 0, y: 0, width: 400, height: 320 }, defs);
    mk("rect", { x: 0, y: 0, width: 400, height: 320, fill: `url(#${id}g)` }, m);
    return `url(#${id})`;
  }
  function reflect(svg, parent, P, front, ring, z0, depth) {
    const r = ghost(P, front, ring, z0, depth);
    const gh = mk("g", { class: "ghost", mask: fade(svg, r.y0, r.y1) }, parent);
    mk("path", { d: r.d }, gh);
  }
  var boards = [];
  var byStage = /* @__PURE__ */ new Map();
  var raf = 0;
  var last = 0;
  var io = null;
  var rm = null;
  function frame(now) {
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1e3));
    last = now;
    let any = false;
    for (const b of boards.slice()) if (b.vis && b.awake) {
      b.awake = !!b.tick(dt, now);
      any = any || b.awake;
    }
    raf = any ? requestAnimationFrame(frame) : 0;
  }
  function wake(b) {
    b.awake = true;
    if (!raf) {
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }
  }
  var onMotion = () => {
    setReducedMotion(!!rm?.matches);
    boards.forEach(wake);
  };
  function start() {
    if (io) return;
    io = new IntersectionObserver((es) => {
      for (const e of es) {
        const b = byStage.get(e.target);
        if (!b) continue;
        b.vis = e.isIntersecting;
        if (b.vis) wake(b);
      }
    }, { rootMargin: "80px" });
    rm = matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(rm.matches);
    rm.addEventListener("change", onMotion);
  }
  function stop() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    io?.disconnect();
    io = null;
    rm?.removeEventListener("change", onMotion);
    rm = null;
  }
  function register(stage, tick) {
    start();
    const b = { stage, tick, vis: false, awake: true };
    boards.push(b);
    byStage.set(stage, b);
    io.observe(stage);
    tick(0, performance.now());
    let gone = false;
    return {
      wake: () => {
        if (!gone) wake(b);
      },
      unregister: () => {
        if (gone) return;
        gone = true;
        boards = boards.filter((x) => x !== b);
        if (byStage.get(stage) === b) {
          byStage.delete(stage);
          io?.unobserve(stage);
        }
        if (!boards.length) stop();
      }
    };
  }
  function pointer(stage, on) {
    let tm = 0;
    const pt = (e) => {
      const r = stage.getBoundingClientRect();
      return [(e.clientX - r.left) / r.width * 400, (e.clientY - r.top) / r.height * 320];
    };
    const move = (e) => {
      clearTimeout(tm);
      on.move(pt(e), e);
    };
    const down = (e) => {
      clearTimeout(tm);
      if (e.pointerType !== "mouse") stage.releasePointerCapture?.(e.pointerId);
      if (on.down) on.down(pt(e), e);
      else on.move(pt(e), e);
    };
    const leave = (e) => {
      clearTimeout(tm);
      tm = window.setTimeout(() => on.leave(e), e.pointerType === "mouse" ? 0 : 1400);
    };
    stage.addEventListener("pointermove", move);
    stage.addEventListener("pointerdown", down);
    stage.addEventListener("pointerleave", leave);
    return () => {
      clearTimeout(tm);
      stage.removeEventListener("pointermove", move);
      stage.removeEventListener("pointerdown", down);
      stage.removeEventListener("pointerleave", leave);
    };
  }
  function disposer() {
    let fns = [];
    return {
      add: (fn) => {
        fns.push(fn);
      },
      on: (target, type, fn, opts) => {
        const h = fn;
        target.addEventListener(type, h, opts);
        fns.push(() => target.removeEventListener(type, h, opts));
      },
      dispose: () => {
        const run2 = fns;
        fns = [];
        for (let i = run2.length - 1; i >= 0; i--) run2[i]();
      }
    };
  }

  // packages/hairline/src/core/styles.ts
  var LIGHT = { plate: "#ffffff", hi: "#232327", edge: "#a4a4ac", mid: "#c3c3c9", lo: "#e0e0e4" };
  var DARK = { plate: "#08090a", hi: "#d0d6e0", edge: "#5b5d64", mid: "#3e3e44", lo: "#29292d" };
  var KEYS = ["plate", "hi", "edge", "mid", "lo"];
  var vars = (p) => KEYS.map((k) => `--hl-${k}:var(--hairline-${k},${p[k]});`).join("");
  var EASE = "cubic-bezier(0.5,0,0.1,1)";
  var SVG = ":where([data-hairline]>svg)";
  function css(lightDark) {
    const both = Object.fromEntries(KEYS.map((k) => [k, `light-dark(${LIGHT[k]},${DARK[k]})`]));
    return [
      // the box, and the palette: light unless something below says otherwise
      `:where([data-hairline]){display:block;position:relative;aspect-ratio:5/4;touch-action:pan-y;user-select:none;-webkit-user-select:none;--hl-sw:var(--hairline-stroke,0.9);${vars(LIGHT)}}`,
      // the page's color-scheme
      lightDark ? `:where([data-hairline]){${vars(both)}}` : "",
      // an ancestor that says dark
      `:where(.dark,[data-theme="dark"]) :where([data-hairline]){${vars(DARK)}}`,
      // the figure's own theme option
      `:where([data-hairline][data-hairline-theme="light"]){${vars(LIGHT)}}`,
      `:where([data-hairline][data-hairline-theme="dark"]){${vars(DARK)}}`,
      `:where([data-hairline]:focus-visible){outline:1.5px solid var(--hl-hi);outline-offset:2px}`,
      `${SVG}{position:absolute;inset:0;width:100%;height:100%;display:block}`,
      // Riffle's live region: read, not seen
      `:where([data-hairline]>[data-hairline-live]){position:absolute;width:1px;height:1px;margin:-1px;padding:0;border:0;overflow:hidden;clip-path:inset(50%);white-space:nowrap}`,
      // the drawing: plates are filled with the plate colour and painted back to front
      `${SVG} :where(path,polygon,ellipse,line){fill:var(--hl-plate);stroke:var(--hl-mid);stroke-width:var(--hl-sw);vector-effect:non-scaling-stroke;stroke-linejoin:round;stroke-linecap:round;transition:stroke 260ms ${EASE}}`,
      `${SVG} :where(.nf){fill:none}`,
      `${SVG} :where(.fo){stroke:none}`,
      `${SVG} :where(.sil){stroke:var(--hl-edge)}`,
      `${SVG} :where(.hi){stroke:var(--hl-hi)}`,
      `${SVG} :where(.lo){stroke:var(--hl-lo)}`,
      `${SVG} :where(.dash){stroke-dasharray:1 3}`,
      `${SVG} :where(.dot){stroke:none;fill:var(--hl-hi);transition:fill 260ms ${EASE}}`,
      `${SVG} :where(.dot.m){fill:var(--hl-edge)}`,
      `${SVG} :where(.dot.off){fill:var(--hl-lo)}`,
      `${SVG} :where(.ghost path){fill:none;stroke:var(--hl-mid)}`
    ].join("");
  }
  var done = /* @__PURE__ */ new WeakSet();
  function inject(root) {
    if (done.has(root)) return;
    done.add(root);
    const doc = root.nodeType === 9 ? root : root.ownerDocument;
    const win = doc.defaultView;
    const text = css(!!win?.CSS?.supports?.("color", "light-dark(#000,#fff)"));
    if (win && "adoptedStyleSheets" in root) {
      try {
        const sheet = new win.CSSStyleSheet();
        sheet.replaceSync(text);
        root.adoptedStyleSheets = [...root.adoptedStyleSheets, sheet];
        return;
      } catch {
      }
    }
    const style = doc.createElement("style");
    style.setAttribute("data-hairline-style", "");
    style.textContent = text;
    (root.nodeType === 9 ? doc.head ?? doc.documentElement : root).appendChild(style);
  }
  return __toCommonJS(kernel_exports);
})();
/* /hairline kernel */
window.hairlineFigures = {}; var hairline = (f) => { window.hairlineFigures[f.name] = f; };
(() => {
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
})();
(() => {
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
})();
(() => {
/**
 * Inbox: a rounded letter tray holding eight envelopes, one already standing
 * up out of the stack: new mail. The envelope under the pointer stands up and
 * lifts; the ones in front lean forward and the ones behind lean back,
 * staggered outwards from it. Each envelope shows its flap, its address lines
 * and its number as a postmark of dots. The slider is the stagger, in ms.
 * Built on the Riffle example: same tray, hit bands and clock.
 */
const {
  Cam, clamp, facing, fillet, fit, hull, open, poly, proj, rad, ringAt, rrect, run, seg,
  tdone, tset, tval, tween, disposer, mk, place, pointer, reflect, register,
} = HL;

const N = 8, W = 84, H = 54, G = 13, TK = 1.4, NEW = 5, PEEK = 10;
const REST = -12, BACK = -24, FWD = 20, LIFT = 16;
const X0 = -5, X1 = W + 5, Y0 = -9, Y1 = (N - 1) * G + 9, WH = 20, WR = 6, WT = 2.4;

/** A run of points ordered left to right on screen. */
const LR = (pts) => (pts[0][0] <= pts[pts.length - 1][0] ? pts : pts.slice().reverse());

/** The tray, which never moves: `far` is painted before the cards, `near` after them; each entry is [d, class]. */
function tray(P, front, outer, inner) {
  // far half: body, the rim's inner edge, and the floor seam along the far walls
  const far = [
    [poly(hull(ringAt(P, outer, 0).concat(ringAt(P, outer, WH)))), "sil"],
    [poly(ringAt(P, inner, WH)), "nf"],
    [open(ringAt(P, run(inner, (q) => !front(q)), 2.5)), "nf lo"],
  ];
  // near half: one opaque piece from the rim's inner edge down to the floor
  const iF = LR(ringAt(P, run(inner, front), WH)), oT = LR(ringAt(P, run(outer, front), WH)), oB = LR(ringAt(P, run(outer, front), 0));
  // a finger pull, set into the front
  const hx = (X0 + X1) / 2, onFront = (ring) => ring.map((q) => P(q.u, Y1, q.v));
  const near = [
    [poly([...iF, oT[oT.length - 1], ...oB.slice().reverse(), oT[0]]), "fo"],
    [open(oT), "nf lo"],
    [open(iF), "nf"],
    [open([oT[0], ...oB, oT[oT.length - 1]]), "nf sil"],
    [poly(onFront(rrect(hx - 11, 6.5, hx + 11, 12.5, 3, 5))), "nf"],
    [poly(onFront(rrect(hx - 9.4, 8, hx + 9.4, 11, 1.5, 5))), "nf lo"],
  ];
  return { far, near };
}

/** Envelope i, back to front: its number (8 at the back) and its filleted outline, upright in its own plane. */
function card(i) {
  return { n: N - i, shape: fillet([[0, 0], [W, 0], [W, H], [0, H]], [3.2, 3.2, 3.2, 3.2]) };
}

/** Envelope i leaning th degrees (negative leans back) and lifted by `lift`: its paths, and where its eight postmark dots sit. */
function pose(P, i, shape, th, lift) {
  const yb = i * G, s = Math.sin(rad(th)), c = Math.cos(rad(th));
  const w = (u, v) => P(u, yb + v * s, v * c + lift);
  const wb = (u, v) => P(u, yb + v * s - TK * c, v * c + TK * s + lift);
  const punch = [];
  for (let k = 0; k < 8; k++) punch.push(w(12 + (k % 4) * 3.6, 13 + (0.5 - Math.floor(k / 4)) * 2.8));
  return {
    back: poly(shape.map((p) => wb(p[0], p[1]))),
    face: poly(shape.map((p) => w(p[0], p[1]))),
    head: open([w(4, H - 2), w(W / 2, H - 24), w(W - 4, H - 2)]),
    rules: [18, 12].map((v, k) => seg(w(32, v), w(68 - k * 10, v))).join(""),
    punch,
  };
}

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let stag = value;

  // The camera is fitted to the tray with a card lifted, so nothing leaves the frame in any pose.
  const C = Cam(45, 0.5, 1.62);
  fit(C, [[X0, Y0, 0], [X1, Y1, -8], [X1, Y0, 0], [X0, Y1, 0], [X0, Y0, H], [X1, Y0, H + LIFT]], 200, 166);
  const P = proj(C), front = facing(C);
  const outer = rrect(X0, Y0, X1, Y1, WR, 6), inner = rrect(X0 + WT, Y0 + WT, X1 - WT, Y1 - WT, WR - WT, 6);
  const paths = tray(P, front, outer, inner);

  const g = mk("g", {}, svg);
  reflect(svg, g, P, front, outer, 0, 14);
  for (const [d, cls] of paths.far) mk("path", { d, class: cls }, g);

  const cards = [];
  for (let i = 0; i < N; i++) {
    const { n, shape } = card(i);
    const grp = mk("g", {}, g);
    const back = mk("path", { class: "lo" }, grp), face = mk("path", { class: "sil" }, grp);
    const head = mk("path", { class: "nf" }, grp), rules = mk("path", { class: "nf lo" }, grp);
    // the envelope's number, as a postmark of dots in a 4 × 2 grid
    const punch = [];
    for (let k = 0; k < 8; k++) punch.push(mk("circle", { r: 1.05, class: "dot " + (k === n - 1 ? "m" : "off") }, grp));
    cards.push({ n, shape, back, face, head, rules, punch, a: tween(REST), z: tween(i === NEW ? PEEK : 0) });
  }

  for (const [d, cls] of paths.near) mk("path", { d, class: cls }, g);

  // hit bands: oblique strips along the RESTING top edges. They never move, and nothing draws them.
  const top = (i) => P(W / 2, i * G + H * Math.sin(rad(REST)), H * Math.cos(rad(REST)));
  const c0 = top(0), c1 = top(1), d = [c1[0] - c0[0], c1[1] - c0[1]];
  const px0 = P(0, 0, 0), px1 = P(1, 0, 0), ex = [px1[0] - px0[0], px1[1] - px0[1]];
  const HALF = W / 2 + 6, det = d[0] * ex[1] - d[1] * ex[0];

  /** The card whose band holds the point, in the band's own (s, r) coordinates; -1 outside. */
  function hit([x, y]) {
    const qx = x - c0[0], qy = y - c0[1];
    const s = (qx * ex[1] - qy * ex[0]) / det, r = (d[0] * qy - d[1] * qx) / det;
    if (Math.abs(r) > HALF || s < -0.5 || s > N + 1) return -1;
    return clamp(Math.round(s), 0, N - 1);
  }

  function draw(i, th, lift) {
    const cd = cards[i], q = pose(P, i, cd.shape, th, lift);
    cd.back.setAttribute("d", q.back);
    cd.face.setAttribute("d", q.face);
    cd.head.setAttribute("d", q.head);
    cd.rules.setAttribute("d", q.rules);
    cd.punch.forEach((el, k) => place(el, q.punch[k]));
  }

  const B = register(stage, (_dt, now) => {
    let moving = false;
    cards.forEach((cd, i) => { draw(i, tval(cd.a, now), tval(cd.z, now)); if (!tdone(cd.a, now) || !tdone(cd.z, now)) moving = true; });
    return moving;
  });
  bag.add(B.unregister);

  let act = -1;
  const caption = (a) => (a < 0 ? "rest" : String(N - a).padStart(2, "0"));
  /** Pulls card a (-1 puts them all back). The stagger spreads out from the card pulled, or the one let go. */
  function setActive(a) {
    if (a === act) return;
    const now = performance.now(), from = a >= 0 ? a : act;
    act = a;
    cards.forEach((cd, i) => {
      const delay = Math.abs(i - from) * stag;
      const th = a < 0 ? REST : i < a ? BACK : i > a ? FWD : 0, on = a < 0 ? i === NEW : i === a;
      // At rest the new envelope peeks up and holds the bright; a pull takes both from it.
      tset(cd.a, th, now, delay); tset(cd.z, a === i ? LIFT : a < 0 && i === NEW ? PEEK : 0, now, delay);
      cd.face.classList.toggle("hi", on); cd.head.classList.toggle("hi", on); cd.punch[cd.n - 1].classList.toggle("m", i !== a);
    });
    read.textContent = caption(a);
    B.wake();
  }

  cards[NEW].face.classList.add("hi"); cards[NEW].head.classList.add("hi");
  read.textContent = "rest";
  B.wake();
  bag.add(pointer(stage, { move: (p) => setActive(hit(p)), leave: () => setActive(-1) }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => { stag = v; },
    destroy: bag.dispose,
  };
}

hairline({
  name: "inbox",
  means: "A letter tray of eight envelopes, one new one peeking up; the one under the pointer stands, its neighbours lean away.",
  rules: [1, 2, 8, 10],
  range: [0, 40, 90],
  mount,
});
})();
(() => {
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
})();
(() => {
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
})();
(() => {
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
})();
(() => {
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
})();

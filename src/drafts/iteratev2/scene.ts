// /iteratev2 hero: three soft white crystal still lifes on charcoal, built in Three.js.
// 1. Projects: a faceted crystal pitch with etched lines and a crystal ball.
// 2. Resources: a closed crystal book with layered page edges.
// 3. Personal: a frosted crystal postcard with the Tabasco cathedral in low relief.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const rand = (seed: number) => () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let r = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
  return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
};

const ease = (k: number) => (k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
const clamp01 = (k: number) => Math.max(0, Math.min(1, k));

/* ---------- Materials ---------- */

// Fine noise used as a bump map: the "internal texture" / frosted sparkle of the crystal.
const noiseTexture = (size = 256) => {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d')!, img = g.createImageData(size, size), r = rand(9);
  for (let i = 0; i < img.data.length; i += 4) { const v = 110 + r() * 145; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 3);
  return t;
};
const noise = noiseTexture();

// MeshStandardMaterial keeps shaders light (no transmission pass), so the page compiles and renders fast.
const crystal = (extra: THREE.MeshStandardMaterialParameters = {}) => Object.assign(new THREE.MeshStandardMaterial({
  color: 0xc8cccf, roughness: .2, metalness: 0, flatShading: true, vertexColors: true,
  bumpMap: noise, bumpScale: .35,
  ...extra,
}), { userData: { crystal: true } });
const frosted = (extra: THREE.MeshStandardMaterialParameters = {}) => new THREE.MeshStandardMaterial({
  color: 0xc6c9cb, roughness: .62, metalness: 0,
  bumpMap: noise, bumpScale: .9,
  ...extra,
});

/* ---------- Geometry helpers ---------- */

type Tri = [THREE.Vector3, THREE.Vector3, THREE.Vector3];
// Non-indexed geometry with a slightly different brightness per facet, so flat-shaded faces read as cut crystal.
const facetGeometry = (tris: Tri[], uvOf: (v: THREE.Vector3) => [number, number], seed: number, range = .38) => {
  const r = rand(seed), pos: number[] = [], uv: number[] = [], col: number[] = [];
  tris.forEach((t) => {
    const b = 1 - r() * range;
    t.forEach((v) => { pos.push(v.x, v.y, v.z); uv.push(...uvOf(v)); col.push(b, b, b * .995); });
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.computeVertexNormals();
  return g;
};

// A faceted crystal slab: jittered triangulated top, chunky irregular edges (top → mid → bottom rings).
const slab = (o: { w: number; d: number; h: number; nx: number; nz: number; jit: number; bump: number; edge: number; seed: number; sideUv?: [number, number] }) => {
  const r = rand(o.seed), { w, d, h, nx, nz } = o;
  const top: THREE.Vector3[][] = [];
  for (let i = 0; i <= nx; i++) {
    top[i] = [];
    for (let j = 0; j <= nz; j++) {
      const edge = i === 0 || j === 0 || i === nx || j === nz;
      let x = -w / 2 + (i * w) / nx, z = -d / 2 + (j * d) / nz;
      if (!edge) { x += (r() - .5) * o.jit * (w / nx); z += (r() - .5) * o.jit * (d / nz); }
      else {
        // Push boundary points in/out for an organic outline; keep corners rounded-ish.
        const out = (r() - .35) * o.edge;
        if (i === 0) x -= out; if (i === nx) x += out; if (j === 0) z -= out; if (j === nz) z += out;
      }
      const y = edge ? h * (.8 + r() * .12) : h + (r() - .5) * o.bump;
      top[i][j] = new THREE.Vector3(x, y, z);
    }
  }
  const tris: Tri[] = [];
  for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
    const a = top[i][j], b = top[i + 1][j], c = top[i + 1][j + 1], e = top[i][j + 1];
    if ((i + j) % 2) { tris.push([a, e, b], [b, e, c]); } else { tris.push([a, e, c], [a, c, b]); }
  }
  // Boundary ring, counter-clockwise seen from above.
  const ring: THREE.Vector3[] = [];
  for (let i = 0; i < nx; i++) ring.push(top[i][0]);
  for (let j = 0; j < nz; j++) ring.push(top[nx][j]);
  for (let i = nx; i > 0; i--) ring.push(top[i][nz]);
  for (let j = nz; j > 0; j--) ring.push(top[0][j]);
  const mid = ring.map((v) => {
    const k = 1 + (.01 + r() * .025) * (o.edge > 0 ? 1.6 : .6);
    return new THREE.Vector3(v.x * k, h * (.35 + r() * .15), v.z * k);
  });
  const bot = ring.map((v) => new THREE.Vector3(v.x * .985, 0, v.z * .985));
  const n = ring.length, base = new THREE.Vector3(0, 0, 0);
  for (let k = 0; k < n; k++) {
    const k2 = (k + 1) % n;
    tris.push([ring[k], ring[k2], mid[k]], [mid[k], ring[k2], mid[k2]]);
    tris.push([mid[k], mid[k2], bot[k]], [bot[k], mid[k2], bot[k2]]);
    tris.push([bot[k2], bot[k], base]); // closed underside (seen when the book's cover swings open)
  }
  const side = o.sideUv ?? [.002, .002];
  const topSet = new Set(top.flat());
  return facetGeometry(tris, (v) => (topSet.has(v) ? [(v.x + w / 2) / w, 1 - (v.z + d / 2) / d] : side), o.seed + 1);
};

const facetize = (g: THREE.BufferGeometry, seed: number, range = .22) => {
  const ng = g.index ? g.toNonIndexed() : g, p = ng.getAttribute('position'), r = rand(seed), col: number[] = [];
  for (let i = 0; i < p.count; i += 3) { const b = 1 - r() * range; for (let k = 0; k < 3; k++) col.push(b, b, b); }
  ng.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  ng.computeVertexNormals();
  return ng;
};

/* ---------- 1. Projects: crystal pitch ---------- */

const pitchLines = (w: number, d: number) => {
  const W = 1400, H = Math.round((W * d) / w), c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d')!;
  g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  g.strokeStyle = '#fff'; g.lineWidth = 4.5; g.fillStyle = '#fff';
  const mx = W * .085, my = H * .11, L = W - 2 * mx, B = H - 2 * my; // pitch inside the slab, 105 × 68 m
  const sx = L / 105, sy = B / 68, cx = mx + L / 2, cy = my + B / 2;
  g.strokeRect(mx, my, L, B);
  g.beginPath(); g.moveTo(cx, my); g.lineTo(cx, my + B); g.stroke();
  g.beginPath(); g.arc(cx, cy, 9.15 * sx, 0, Math.PI * 2); g.stroke();
  g.beginPath(); g.arc(cx, cy, 5, 0, Math.PI * 2); g.fill();
  [0, 1].forEach((side) => {
    const x0 = side ? mx + L : mx, dir = side ? -1 : 1;
    g.strokeRect(Math.min(x0, x0 + dir * 16.5 * sx), cy - 20.15 * sy, 16.5 * sx, 40.3 * sy);
    g.strokeRect(Math.min(x0, x0 + dir * 5.5 * sx), cy - 9.16 * sy, 5.5 * sx, 18.32 * sy);
    const spot = x0 + dir * 11 * sx;
    g.beginPath(); g.arc(spot, cy, 4, 0, Math.PI * 2); g.fill();
    const a = Math.acos(5.5 / 9.15);
    g.beginPath(); g.arc(spot, cy, 9.15 * sx, side ? Math.PI - a : -a, side ? Math.PI + a : a); g.stroke();
    [my, my + B].forEach((y, k) => { g.beginPath(); g.arc(x0, y, 1 * sx, side ? (k ? Math.PI : Math.PI / 2) : (k ? -Math.PI / 2 : 0), side ? (k ? Math.PI * 1.5 : Math.PI) : (k ? 0 : Math.PI / 2)); g.stroke(); });
  });
  const t = new THREE.CanvasTexture(c); t.anisotropy = 8; t.colorSpace = THREE.SRGBColorSpace;
  return t;
};

const makePitch = () => {
  const w = 2.5, d = 1.65, h = .2, group = new THREE.Group();
  const lines = pitchLines(w, d);
  const mat = crystal({ emissive: new THREE.Color(0xffffff), emissiveMap: lines, emissiveIntensity: .35 });
  const body = new THREE.Mesh(slab({ w, d, h, nx: 16, nz: 11, jit: .75, bump: .035, edge: .09, seed: 11 }), mat);
  group.add(body);
  const ballR = .1;
  const ballMat = crystal({ roughness: .12, bumpScale: .2 });
  const ball = new THREE.Mesh(facetize(new THREE.IcosahedronGeometry(ballR, 1), 3, .2), ballMat);
  const from = new THREE.Vector3(-.62, h + ballR - .005, .18);
  ball.position.copy(from);
  group.add(ball);
  // Small crystal goals on both goal lines (exaggerated so they read at this scale), with frosted nets.
  const gx = w / 2 - w * .085, gw = .17, gh = .15, gd = .1, post = .014, net = frosted({ roughness: .9 });
  [-1, 1].forEach((side) => {
    const x = side * gx, back = x + side * gd;
    [-gw, gw].forEach((z) => {
      group.add(mesh(new THREE.CylinderGeometry(post, post, gh, 8), ballMat, x, h + gh / 2, z));
      group.add(mesh(new THREE.BoxGeometry(gd, .006, .006), ballMat, (x + back) / 2, h + gh, z));
    });
    group.add(mesh(new THREE.CylinderGeometry(post, post, gw * 2 + post * 2, 8).rotateX(Math.PI / 2), ballMat, x, h + gh, 0));
    group.add(mesh(new THREE.BoxGeometry(.006, gh, gw * 2), net, back, h + gh / 2, 0));
    group.add(mesh(new THREE.BoxGeometry(gd, .006, gw * 2), net, (x + back) / 2, h + gh, 0));
  });
  // p: 0 → 1, the ball is struck, arcs off the pitch toward the viewer and lands in the right-hand net, spinning.
  const to = new THREE.Vector3(gx + gd * .55, h + ballR + .01, 0);
  const open = (p: number) => {
    const u = ease(clamp01(p / .55));
    ball.position.lerpVectors(from, to, u);
    ball.position.y += Math.sin(Math.PI * u) * .38;
    ball.rotation.set(u * 5, 0, -u * 14);
  };
  const focus = new THREE.Object3D(); focus.position.set(gx, h, 0); group.add(focus);
  return { group, open, focus, zoom: [.8, .8] as [number, number] };
};

/* ---------- 2. Resources: crystal book ---------- */

const makeBook = () => {
  const w = 1.45, d = 1.1, group = new THREE.Group();
  const coverH = .07, pageH = .021, pages = 13, blockH = pages * pageH + .01;
  const cover = crystal();
  const bottom = new THREE.Mesh(slab({ w, d, h: coverH * .8, nx: 4, nz: 3, jit: .6, bump: .01, edge: 0, seed: 21 }), cover);
  group.add(bottom);
  // The cover and the top few pages hinge on the spine, so the book can open.
  const hinge = (y: number) => { const p = new THREE.Group(); p.position.set(-w / 2 + .02, y, 0); group.add(p); return p; };
  const pageMat = frosted({ color: 0xdcdedf, roughness: .55, bumpScale: 1.4 });
  const r = rand(5), leaves: THREE.Group[] = [];
  for (let i = 0; i < pages; i++) {
    const g = facetize(new THREE.BoxGeometry(w - .07 + (r() - .5) * .025, pageH * .82, d - .06 + (r() - .5) * .02), 30 + i, .08);
    const m = new THREE.Mesh(g, pageMat);
    m.position.set(.015 + (r() - .5) * .012, coverH * .8 + pageH * (i + .5) + .004, (r() - .5) * .01);
    if (i < pages - 3) { group.add(m); continue; }
    const leaf = hinge(m.position.y); m.position.x -= leaf.position.x; m.position.y = 0; leaf.add(m); leaves.unshift(leaf);
  }
  const topCover = new THREE.Mesh(slab({ w, d, h: coverH, nx: 5, nz: 4, jit: .85, bump: .028, edge: 0, seed: 22 }), cover);
  const coverHinge = hinge(coverH * .8 + blockH);
  topCover.position.x = w / 2 - .02;
  coverHinge.add(topCover);
  // Rounded, faceted spine wrapping the left edge.
  const totalH = coverH * .8 + blockH + coverH, spineR = totalH / 2;
  const spine = new THREE.Mesh(facetize(new THREE.CylinderGeometry(spineR, spineR, d, 8, 1, false, Math.PI, Math.PI), 41), cover);
  spine.rotation.x = Math.PI / 2;
  spine.position.set(-w / 2 + .02, spineR, 0);
  group.add(spine);
  group.position.x = spineR / 2;
  // p: 0 closed → 1 open. The cover swings first, then the top pages fan after it.
  const open = (p: number) => {
    coverHinge.rotation.z = ease(clamp01(p / .6)) * Math.PI * .94;
    leaves.forEach((l, j) => { l.rotation.z = ease(clamp01((p - .22 - j * .1) / .5)) * Math.PI * (.9 - j * .03); });
  };
  const focus = new THREE.Object3D(); focus.position.set(-w / 2, totalH / 2, 0); group.add(focus);
  return { group, open, focus, zoom: [2.3, 1.6] as [number, number] };
};

/* ---------- 3. Personal: crystal postcard with the cathedral in relief ---------- */

const rectShape = (x0: number, y0: number, x1: number, y1: number) => {
  const s = new THREE.Shape(); s.moveTo(x0, y0); s.lineTo(x1, y0); s.lineTo(x1, y1); s.lineTo(x0, y1); s.closePath(); return s;
};
const archPath = (cx: number, y0: number, w: number, h: number) => {
  const p = new THREE.Path(), r = w / 2;
  p.moveTo(cx - r, y0); p.lineTo(cx - r, y0 + h - r); p.absarc(cx, y0 + h - r, r, Math.PI, 0, true); p.lineTo(cx + r, y0); p.closePath();
  return p;
};
const polyShape = (pts: [number, number][]) => { const s = new THREE.Shape(); s.moveTo(...pts[0]); pts.slice(1).forEach((p) => s.lineTo(...p)); s.closePath(); return s; };
const domeShape = (cx: number, y: number, r: number) => { const s = new THREE.Shape(); s.moveTo(cx - r, y); s.absarc(cx, y, r, Math.PI, 0, true); s.closePath(); return s; };

const cathedral = () => {
  const parts: [THREE.Shape, number][] = []; // [shape, relief depth]
  const add = (s: THREE.Shape, depth: number, holes: THREE.Path[] = []) => { s.holes.push(...holes); parts.push([s, depth]); };
  add(rectShape(-.58, -.025, .56, 0), .01); // ground line
  const tower = (x0: number, x1: number) => {
    const cx = (x0 + x1) / 2, tw = x1 - x0;
    add(rectShape(x0, 0, x1, .5), .03, [archPath(cx, .1, tw * .3, .11), archPath(cx, .3, tw * .26, .1)]);
    add(rectShape(x0 - .006, .495, x1 + .006, .51), .036); // cornice
    add(rectShape(x0 + .016, .51, x1 - .016, .63), .04, [archPath(cx, .535, tw * .26, .075)]);
    add(rectShape(x0 + .01, .625, x1 - .01, .637), .044);
    add(rectShape(x0 + .036, .637, x1 - .036, .71), .046, [archPath(cx, .65, tw * .16, .045)]);
    const r = tw / 2 - .036;
    add(domeShape(cx, .71, r), .048);
    add(rectShape(cx - .011, .71 + r - .004, cx + .011, .71 + r + .035), .048);
    const top = .71 + r + .035;
    add(rectShape(cx - .0045, top, cx + .0045, top + .065), .048);
    add(rectShape(cx - .02, top + .038, cx + .02, top + .047), .048);
  };
  tower(-.5, -.32);
  tower(-.04, .14);
  // Central facade with door, window and pediment.
  add(rectShape(-.32, 0, -.04, .4), .022, [archPath(-.18, 0, .085, .18), archPath(-.18, .25, .05, .085), archPath(-.265, .14, .03, .07), archPath(-.095, .14, .03, .07)]);
  add(rectShape(-.33, .395, -.03, .412), .028);
  add(polyShape([[-.33, .412], [-.03, .412], [-.18, .5]]), .03);
  add(rectShape(-.185, .5, -.175, .545), .03);
  // Side nave and smaller chapel facade.
  add(rectShape(.14, 0, .54, .23), .016, [archPath(.19, .08, .035, .08), archPath(.5, .08, .035, .08)]);
  add(rectShape(.25, 0, .45, .3), .026, [archPath(.35, 0, .075, .15), archPath(.35, .19, .035, .06)]);
  add(rectShape(.243, .295, .457, .308), .03);
  add(polyShape([[.243, .308], [.457, .308], [.35, .37]]), .032);
  add(domeShape(.35, .37, .022), .032);
  add(rectShape(.346, .39, .354, .43), .032);

  const mat = frosted({ color: 0xdadcdd, roughness: .66, bumpScale: 1.1 });
  const g = new THREE.Group();
  parts.forEach(([shape, depth]) => {
    const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: .003, bevelSize: .0025, bevelSegments: 1, curveSegments: 12 });
    const m = new THREE.Mesh(geo, mat); m.castShadow = m.receiveShadow = true; g.add(m);
  });
  g.rotation.x = -Math.PI / 2; // lay the elevation flat on the card: shape y → away from the viewer
  return g;
};

const makePostcard = () => {
  const w = 1.75, d = 1.15, h = .075, group = new THREE.Group();
  const card = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 4, .025), frosted());
  card.position.y = h / 2;
  group.add(card);
  const church = cathedral();
  church.scale.setScalar(.95);
  church.position.set(.01, h, .42);
  group.add(church);
  return { group };
};

/* ---------- Resources view: museums, photos, podcasts, books, movies ---------- */

// Crystal meshes need per-facet colours; frosted ones don't.
const mesh = (geo: THREE.BufferGeometry, mat: THREE.Material, x = 0, y = 0, z = 0) => {
  const m = new THREE.Mesh(mat.userData.crystal && !geo.getAttribute('color') ? facetize(geo, Math.round(Math.abs(x * 97 + y * 53 + z * 31) * 100) + 1) : geo, mat);
  m.position.set(x, y, z);
  return m;
};

// Museums: a classical facade with steps, six columns, entablature and pediment.
const makeMuseum = () => {
  const g = new THREE.Group(), c = crystal(), f = frosted();
  [[2.1, .62], [1.96, .56], [1.82, .5]].forEach(([w, d], i) => g.add(mesh(new THREE.BoxGeometry(w, .07, d), c, 0, .035 + i * .07, 0)));
  const base = .21, colH = .8;
  g.add(mesh(new THREE.BoxGeometry(1.62, colH, .14), f, 0, base + colH / 2, -.16));
  g.add(mesh(new THREE.BoxGeometry(.32, .5, .03), frosted({ roughness: .8 }), 0, base + .25, -.08));
  for (let i = 0; i < 6; i++) {
    const x = -.75 + i * .3;
    g.add(mesh(new THREE.CylinderGeometry(.065, .075, colH - .08, 10), c, x, base + colH / 2, .1));
    g.add(mesh(new THREE.BoxGeometry(.19, .04, .19), c, x, base + .02, .1));
    g.add(mesh(new THREE.BoxGeometry(.19, .04, .19), c, x, base + colH - .02, .1));
  }
  const top = base + colH;
  g.add(mesh(new THREE.BoxGeometry(1.9, .14, .52), c, 0, top + .07, 0));
  g.add(mesh(new THREE.BoxGeometry(1.98, .03, .56), c, 0, top + .155, 0));
  const ped = new THREE.ExtrudeGeometry(polyShape([[-.99, 0], [.99, 0], [0, .38]]), { depth: .5, bevelEnabled: true, bevelThickness: .01, bevelSize: .01, bevelSegments: 1 });
  g.add(mesh(ped, c, 0, top + .17, -.25));
  g.add(mesh(new THREE.ExtrudeGeometry(polyShape([[-.78, 0], [.78, 0], [0, .28]]), { depth: .02, bevelEnabled: false }), f, 0, top + .2, .25));
  return { group: g };
};

// Photos: a disposable camera with its paper wrap, lens, viewfinder, flash and wind wheel.
const makeDisposable = () => {
  const g = new THREE.Group(), c = crystal(), f = frosted(), glass = crystal({ roughness: .05, bumpScale: 0 });
  g.add(mesh(new RoundedBoxGeometry(1.9, 1.1, .5, 2, .08), c));
  g.add(mesh(new RoundedBoxGeometry(1.94, .58, .54, 2, .03), f, 0, -.15, 0));
  g.add(mesh(new THREE.CylinderGeometry(.27, .31, .16, 14).rotateX(Math.PI / 2), c, .18, -.05, .32));
  g.add(mesh(new THREE.CylinderGeometry(.19, .19, .04, 28).rotateX(Math.PI / 2), glass, .18, -.05, .41));
  g.add(mesh(new THREE.BoxGeometry(.26, .17, .1), c, -.58, .33, .27));
  g.add(mesh(new THREE.BoxGeometry(.4, .2, .04), f, .58, .34, .27));
  g.add(mesh(new THREE.CylinderGeometry(.07, .07, .06, 12), c, .62, .58, .02));
  g.add(mesh(new THREE.CylinderGeometry(.16, .16, .1, 12), c, -.6, .6, -.04));
  return { group: g };
};

// Podcasts: a broadcast microphone in a yoke on a short stand.
const makeMic = () => {
  const g = new THREE.Group(), c = crystal(), f = frosted();
  g.add(mesh(new THREE.CapsuleGeometry(.3, .6, 6, 14), c, 0, .62, 0));
  [.42, .62, .82].forEach((y) => g.add(mesh(new THREE.TorusGeometry(.305, .018, 6, 28).rotateX(Math.PI / 2), f, 0, y, 0)));
  g.add(mesh(new THREE.TorusGeometry(.44, .04, 8, 24, Math.PI).rotateZ(Math.PI), c, 0, .5, 0));
  [-1, 1].forEach((side) => g.add(mesh(new THREE.CylinderGeometry(.06, .06, .1, 10).rotateZ(Math.PI / 2), f, side * .37, .5, 0)));
  g.add(mesh(new THREE.CylinderGeometry(.045, .05, .42, 10), c, 0, -.15, 0));
  g.add(mesh(new THREE.CylinderGeometry(.36, .42, .08, 20), c, 0, -.4, 0));
  return { group: g };
};

// Books: just a cover, with a raised frame and title plate.
const makeCover = () => {
  const g = new THREE.Group(), w = 1.05, d = 1.45, h = .08, f = frosted(), t = .025;
  g.add(new THREE.Mesh(slab({ w, d, h, nx: 4, nz: 5, jit: .8, bump: .02, edge: 0, seed: 101 }), crystal()));
  ([[0, -d / 2 + .12, w - .24, t], [0, d / 2 - .12, w - .24, t], [-w / 2 + .12, 0, t, d - .24], [w / 2 - .12, 0, t, d - .24]] as const)
    .forEach(([x, z, sx, sz]) => g.add(mesh(new THREE.BoxGeometry(sx, .02, sz), f, x, h + .005, z)));
  g.add(mesh(new THREE.BoxGeometry(.5, .02, .2), f, 0, h + .005, -.3));
  return { group: g };
};

// Movies: a film reel (two flanges with cut-outs, wound film) with a strip of film running off it.
const makeReel = () => {
  const g = new THREE.Group(), c = crystal(), f = frosted();
  const disc = new THREE.Shape(); disc.absarc(0, 0, .62, 0, Math.PI * 2, false);
  for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3 + .3, hole = new THREE.Path(); hole.absarc(Math.cos(a) * .36, Math.sin(a) * .36, .14, 0, Math.PI * 2, true); disc.holes.push(hole); }
  const hub = new THREE.Path(); hub.absarc(0, 0, .06, 0, Math.PI * 2, true); disc.holes.push(hub);
  const flange = new THREE.ExtrudeGeometry(disc, { depth: .05, bevelEnabled: true, bevelThickness: .012, bevelSize: .012, bevelSegments: 1, curveSegments: 28 });
  g.add(mesh(flange, c, 0, 0, .12));
  g.add(mesh(flange.clone(), c, 0, 0, -.1));
  g.add(mesh(new THREE.CylinderGeometry(.47, .47, .2, 40).rotateX(Math.PI / 2), f, 0, 0, .01));
  g.add(mesh(new THREE.CylinderGeometry(.1, .1, .3, 12).rotateX(Math.PI / 2), c, 0, 0, .02));
  const L = 1.25, W = .2, strip = new THREE.Shape();
  strip.moveTo(0, -W / 2); strip.lineTo(L, -W / 2); strip.lineTo(L, W / 2); strip.lineTo(0, W / 2); strip.closePath();
  for (let x = .06; x < L - .04; x += .11) [-1, 1].forEach((side) => {
    const y = side * .07, hole = new THREE.Path();
    hole.moveTo(x, y - .02); hole.lineTo(x + .05, y - .02); hole.lineTo(x + .05, y + .02); hole.lineTo(x, y + .02); hole.closePath();
    strip.holes.push(hole);
  });
  const film = mesh(new THREE.ExtrudeGeometry(strip, { depth: .015, bevelEnabled: false }), f, .2, -.4, .02);
  film.rotation.z = -.45;
  g.add(film);
  return { group: g };
};

/* ---------- Projects view ---------- */

// Business Analysis: a clipboard with an analysis sheet: title, notes, bar chart, trend line and a donut chart in relief.
const makeAnalysis = () => {
  const g = new THREE.Group(), w = 1.5, d = 1.12, c = crystal(), f = frosted();
  g.add(mesh(new RoundedBoxGeometry(w + .16, .05, d + .22, 3, .03), c, 0, .025, 0)); // clipboard board
  g.add(mesh(new RoundedBoxGeometry(w, .02, d, 2, .008), f, 0, .055, .04));
  const top = .066, z0 = -d / 2 + .04;
  g.add(mesh(new RoundedBoxGeometry(.44, .08, .16, 2, .03), c, 0, top + .03, -d / 2 - .03)); // clip
  g.add(mesh(new THREE.BoxGeometry(.56, .014, .07), c, -w / 2 + .38, top + .007, z0 + .2)); // title
  [.62, .5, .58, .44].forEach((len, i) => g.add(mesh(new THREE.BoxGeometry(len * .6, .008, .026), c, -w / 2 + .1 + len * .3, top + .004, z0 + .32 + i * .065)));
  // Bar chart, bottom left, with axes.
  const baseZ = d / 2 - .06, bx = -w / 2 + .14;
  g.add(mesh(new THREE.BoxGeometry(.66, .01, .014), c, bx + .31, top + .005, baseZ));
  g.add(mesh(new THREE.BoxGeometry(.014, .01, .5), c, bx - .02, top + .005, baseZ - .25));
  [.18, .3, .24, .38, .46].forEach((hgt, i) => g.add(mesh(new THREE.BoxGeometry(.075, .03, hgt), c, bx + .06 + i * .12, top + .015, baseZ - hgt / 2 - .01)));
  // Trend line with points, right side.
  const pts = [[.06, .4], [.18, .3], [.29, .34], [.4, .2], [.5, .14], [.6, .02]].map(([x, z]) => new THREE.Vector3(x, top + .014, z + .04));
  g.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, .013, 6), c));
  pts.forEach((p) => g.add(mesh(new THREE.IcosahedronGeometry(.026, 0), c, p.x, p.y + .006, p.z)));
  // Donut chart, top right.
  g.add(mesh(new THREE.TorusGeometry(.1, .036, 8, 28).rotateX(Math.PI / 2), c, .48, top + .02, z0 + .24));
  return { group: g };
};

// Portfolio: an open laptop, tilted toward the viewer; the screen shows a window bar, code lines and project cards in relief.
const makeLaptop = () => {
  const g = new THREE.Group(), c = crystal(), f = frosted(), W = 1.7, D = 1.05, T = .06, H = 1.05;
  // Base (keyboard deck) lies flat and reaches toward the viewer; the screen stands at its back edge.
  g.add(mesh(new RoundedBoxGeometry(W, T, D, 2, .025), c, 0, T / 2, D / 2));
  for (let row = 0; row < 4; row++) for (let k = 0; k < 11; k++) {
    g.add(mesh(new THREE.BoxGeometry(.11, .016, .1), f, -W / 2 + .2 + k * .13, T + .008, .14 + row * .13));
  }
  g.add(mesh(new THREE.BoxGeometry(.5, .01, .26), f, 0, T + .005, D - .2)); // trackpad
  const screen = new THREE.Group(); screen.position.set(0, T, .02); screen.rotation.x = -.12; g.add(screen);
  screen.add(mesh(new RoundedBoxGeometry(W, H, .05, 2, .025), c, 0, H / 2, 0));
  const face = .03;
  screen.add(mesh(new THREE.BoxGeometry(W - .14, H - .14, .01), f, 0, H / 2, face)); // display
  screen.add(mesh(new THREE.BoxGeometry(W - .2, .07, .012), c, 0, H - .14, face + .008)); // window bar
  [0, 1, 2].forEach((i) => screen.add(mesh(new THREE.CylinderGeometry(.016, .016, .012, 10).rotateX(Math.PI / 2), f, -W / 2 + .17 + i * .05, H - .14, face + .016)));
  [[.0, .5], [.06, .38], [.06, .44], [.12, .3], [.06, .36], [.0, .26]].forEach(([indent, len], i) =>
    screen.add(mesh(new THREE.BoxGeometry(len, .028, .01), c, -W / 2 + .14 + indent + len / 2, H - .27 - i * .075, face + .008)));
  [[.33, .62], [.62, .62], [.33, .36], [.62, .36]].forEach(([x, y]) => screen.add(mesh(new THREE.BoxGeometry(.24, .2, .014), c, x, y, face + .009)));
  g.rotation.x = .5; // tip it toward the viewer so the keyboard reads
  const wrap = new THREE.Group(); wrap.add(g);
  return { group: wrap };
};

/* ---------- Scene ---------- */

// open: 0 → 1 transition when clicked. focus/zoom: where the camera moves in, and how many object-widths/heights to frame.
type Piece = { group: THREE.Group; open?: (p: number) => void; focus?: THREE.Object3D; zoom?: [number, number] };
// flat: built lying down (face up), so it's stood up to face the viewer. href: clicking it opens that view.
type Item = { name: string; make: () => Piece; flat?: boolean; href?: string; to?: View };
const VIEWS = {
  home: [
    { name: 'Projects', make: makePitch, flat: true, href: '/iteratev2/projects', to: 'projects' },
    { name: 'Resources', make: makeBook, flat: true, href: '/iteratev2/resources', to: 'resources' },
    { name: 'Personal', make: makePostcard, flat: true },
  ] as Item[],
  projects: [
    { name: 'Business Analysis', make: makeAnalysis, flat: true },
    { name: 'Portfolio', make: makeLaptop },
  ] as Item[],
  resources: [
    { name: 'Museums', make: makeMuseum },
    { name: 'Photos', make: makeDisposable },
    { name: 'Podcasts', make: makeMic },
    { name: 'Books', make: makeCover, flat: true },
    { name: 'Movies', make: makeReel },
  ] as Item[],
};
export type View = 'home' | 'projects' | 'resources';

// Slot centres on the wall. Home: Projects in the middle. Resources: one row, 3 + 2, or 2 + 2 + 1 as the screen narrows.
const slotsFor = (view: View, aspect: number): [number, number][] => {
  if (view === 'projects') return aspect < .95 ? [[0, 1.08], [0, -1.08]] : [[-1.33, 0], [1.33, 0]];
  if (view === 'home') return aspect < .95 ? [[0, 0], [0, 2.05], [0, -2.05]] : [[0, 0], [-2.65, 0], [2.65, 0]];
  const rows = aspect >= 1.25 ? [5] : aspect >= .95 ? [3, 2] : [2, 2, 1], out: [number, number][] = [];
  rows.forEach((n, r) => { for (let j = 0; j < n; j++) out.push([(j - (n - 1) / 2) * 2.65, -(r - (rows.length - 1) / 2) * 2.15]); });
  return out;
};
const YAWS = [.1, -.14, .08, -.06, .12];

// Night: charcoal wall, as in the reference photos. Day: soft warm-grey wall, brighter fill.
const LOOKS = {
  // dark: 0 = white crystal objects, 1 = black / grey objects.
  night: { wall: 0x232323, bg: 0x141414, exposure: .95, env: .42, key: 1.9, hemi: .12, dark: 0 },
  day: { wall: 0xc9c4bc, bg: 0xd6d2cb, exposure: .95, env: .6, key: 2.1, hemi: .3, dark: 1 },
};
export type Look = keyof typeof LOOKS;

export type Options = {
  names?: HTMLElement; // container for the object names (built here, one per object)
  veil?: HTMLElement; // full-screen layer faded in/out between views
  look?: Look;
  view?: View;
  onNavigate?: (v: View) => void; // called when a click inside the scene changes the view
};

export function mountCrystals(canvas: HTMLCanvasElement, opts: Options = {}) {
  const { names, veil, onNavigate } = opts;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = .95;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap; // PCF honours shadow.radius → soft, studio-like edges

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture;
  scene.environmentIntensity = .42;
  scene.background = new THREE.Color(0x141414);
  scene.fog = new THREE.Fog(0x141414, 14, 34);

  const camera = new THREE.PerspectiveCamera(28, 1, .1, 100);

  // Quiet studio light: soft key from upper left in front, so shadows fall on the wall to the lower right.
  const key = new THREE.DirectionalLight(0xffffff, 1.9);
  key.position.set(-5, 3.6, 4.2); key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024); key.shadow.radius = 10; key.shadow.blurSamples = 10; key.shadow.bias = -.0004; key.shadow.normalBias = .02;
  Object.assign(key.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8, near: .5, far: 25 });
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xe8eeff, .9); rim.position.set(5, 3, 3); scene.add(rim);
  const hemi = new THREE.HemisphereLight(0xffffff, 0x111111, .12); scene.add(hemi);
  const glint = new THREE.PointLight(0xffffff, 3, 8, 2); glint.position.set(0, 1.5, 3); scene.add(glint);

  const edgeMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: .45 });
  // Charcoal paper wall: the objects are mounted on it, facing the viewer; it catches their shadows.
  const paper = noiseTexture(512); paper.repeat.set(36, 36);
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshStandardMaterial({ color: 0x232323, roughness: .95, bumpMap: paper, bumpScale: .5 }));
  wall.position.z = -.004; wall.receiveShadow = true; scene.add(wall);

  type Obj = Item & { piece: Piece; holder: THREE.Group; i: number; yaw: number; lift: number; box: THREE.Box3; frameBottom: number; standoff: number; label?: HTMLElement };
  const build = (v: View): Obj[] => VIEWS[v].map((item, i) => {
    const piece = item.make(), holder = new THREE.Group();
    holder.add(piece.group); holder.visible = false; scene.add(holder);
    if (item.flat) piece.group.rotation.x = Math.PI / 2;
    // Same size for every object: fit one 2.2 × 1.5 frame, centre it in its slot, back against the wall.
    const size = new THREE.Box3().setFromObject(piece.group).getSize(new THREE.Vector3());
    piece.group.scale.setScalar(Math.min(2.2 / size.x, 1.5 / size.y));
    const bb = new THREE.Box3().setFromObject(piece.group), c = bb.getCenter(new THREE.Vector3());
    piece.group.position.x -= c.x; piece.group.position.y -= c.y; piece.group.position.z -= bb.min.z;
    const meshes: THREE.Mesh[] = [];
    piece.group.traverse((m) => { if ((m as THREE.Mesh).isMesh) meshes.push(m as THREE.Mesh); });
    meshes.forEach((m) => {
      m.castShadow = true; m.receiveShadow = true;
      // Crisp, faint cut lines along the crystal facets.
      if ((m.material as THREE.Material).userData.crystal) m.add(new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry, 14), edgeMat));
    });
    const yaw = YAWS[i % YAWS.length];
    // Turned objects would swing one side into the wall; hold them just far enough off it (half-width 1.1, plus sway).
    const standoff = 1.1 * Math.sin(Math.abs(yaw) + .05) + .02;
    const o: Obj = { ...item, piece, holder, i, yaw, lift: 0, box: new THREE.Box3(), frameBottom: 0, standoff };
    if (names) {
      const el = document.createElement(item.href ? 'a' : 'span');
      el.className = 'name'; el.textContent = item.name; el.hidden = true;
      if (item.href) { (el as HTMLAnchorElement).href = item.href; el.addEventListener('click', (e) => { e.preventDefault(); open(o); }); }
      names.append(el); o.label = el;
    }
    return o;
  });
  const sets: Record<View, Obj[]> = { home: build('home'), projects: build('projects'), resources: build('resources') };
  let view: View = opts.view ?? 'home', objects = sets[view];

  // Layout + camera fit for the current view. camTarget/camDist are what's rendered (they ease during the book zoom).
  const dir = new THREE.Vector3(0, Math.sin(THREE.MathUtils.degToRad(4)), Math.cos(THREE.MathUtils.degToRad(4)));
  const target = new THREE.Vector3(), camTarget = new THREE.Vector3();
  let dist = 10, camDist = 10;
  let opening: { t0: number; book: Obj; to: View; fromT: THREE.Vector3; fromD: number; toT: THREE.Vector3; toD: number } | null = null;
  const layout = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const slots = slotsFor(view, camera.aspect);
    objects.forEach((o, i) => {
      o.holder.position.set(slots[i][0], slots[i][1], o.standoff); o.holder.rotation.set(0, o.yaw, 0);
      o.frameBottom = slots[i][1] - .75;
    });
    scene.updateMatrixWorld(true);
    const box = new THREE.Box3();
    objects.forEach((o) => {
      o.box.makeEmpty();
      o.holder.traverse((m) => { if ((m as THREE.Mesh).isMesh) o.box.expandByObject(m, false); });
      box.union(o.box);
    });
    // Names in a row share one baseline, just under the lowest object in that row.
    objects.forEach((o) => {
      const row = objects.filter((q) => Math.abs(q.holder.position.y - o.holder.position.y) < .01);
      o.frameBottom = Math.min(o.frameBottom, ...row.map((q) => q.box.min.y));
    });
    box.min.y = Math.min(box.min.y, ...objects.map((o) => o.frameBottom)) - .4; // room for the names
    // A view with only one or two objects keeps a minimum frame, so the camera doesn't come so close that perspective distorts them.
    const mid = box.getCenter(new THREE.Vector3());
    const mw = camera.aspect < .95 ? 1.35 : 2.4; // narrower minimum on tall screens
    box.expandByPoint(new THREE.Vector3(mid.x - mw, mid.y - 1.5, 0)).expandByPoint(new THREE.Vector3(mid.x + mw, mid.y + 1.5, 0));
    box.getCenter(target); target.z = 0;
    dist = 10;
    const corners = [0, 1, 2, 3, 4, 5, 6, 7].map((k) => new THREE.Vector3(k & 1 ? box.max.x : box.min.x, k & 2 ? box.max.y : box.min.y, k & 4 ? box.max.z : box.min.z));
    const right = new THREE.Vector3(), up = new THREE.Vector3(), fill = .9;
    for (let it = 0; it < 6; it++) {
      camera.position.copy(target).addScaledVector(dir, dist); camera.lookAt(target); camera.updateProjectionMatrix(); camera.updateMatrixWorld();
      const ps = corners.map((c) => c.clone().project(camera));
      const minX = Math.min(...ps.map((p) => p.x)), maxX = Math.max(...ps.map((p) => p.x));
      const minY = Math.min(...ps.map((p) => p.y)), maxY = Math.max(...ps.map((p) => p.y));
      const halfH = dist * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)), halfW = halfH * camera.aspect;
      right.setFromMatrixColumn(camera.matrixWorld, 0); up.setFromMatrixColumn(camera.matrixWorld, 1);
      target.addScaledVector(right, ((minX + maxX) / 2) * halfW).addScaledVector(up, ((minY + maxY) / 2) * halfH);
      dist *= Math.max((maxX - minX) / 2, (maxY - minY) / 2) / fill;
    }
    if (!opening) { camTarget.copy(target); camDist = dist; }
  };

  // Pointer: gentle camera parallax; the hovered object lifts; clicking one with an href opens it.
  const pointer = new THREE.Vector2(), smooth = new THREE.Vector2(), ray = new THREE.Raycaster();
  let hovered = -1;
  const pick = (e: PointerEvent | MouseEvent) => {
    const b = canvas.getBoundingClientRect();
    pointer.set(((e.clientX - b.left) / b.width) * 2 - 1, -((e.clientY - b.top) / b.height) * 2 + 1);
    ray.setFromCamera(pointer, camera);
    return opening ? -1 : objects.findIndex((o) => ray.ray.intersectsBox(o.box));
  };
  canvas.addEventListener('pointermove', (e) => {
    const i = pick(e);
    hovered = reduce ? -1 : i;
    canvas.style.cursor = i >= 0 && objects[i].href ? 'pointer' : '';
  });
  canvas.addEventListener('pointerleave', () => { hovered = -1; pointer.set(0, 0); });
  canvas.addEventListener('click', (e) => { const o = objects[pick(e)]; if (o?.href) open(o); });

  const show = (v: View) => {
    Object.values(sets).flat().forEach((o) => { o.holder.visible = false; if (o.label) o.label.hidden = true; });
    view = v; objects = sets[v]; hovered = -1; canvas.style.cursor = '';
    objects.forEach((o) => { o.holder.visible = true; o.holder.scale.setScalar(1); o.piece.open?.(0); o.lift = 0; if (o.label) o.label.hidden = false; });
    document.documentElement.dataset.view = v;
    layout();
  };

  // View changes: `go` cross-fades through the veil; `open` plays the book opening and zooms in first.
  let veilNow = 0, veilGoal = 0, pending: View | null = null;
  const go = (v: View) => {
    if (opening || (v === view && !pending)) return;
    if (reduce) { show(v); return; }
    pending = v; veilGoal = 1;
  };
  const open = (o: Obj) => {
    if (opening || pending || view !== 'home' || !o.to) return;
    if (reduce) { show(o.to); onNavigate?.(o.to); return; }
    const size = o.box.getSize(new THREE.Vector3()), [zw, zh] = o.piece.zoom ?? [1.4, 1.4];
    const toT = o.piece.focus ? o.piece.focus.getWorldPosition(new THREE.Vector3()) : o.box.getCenter(new THREE.Vector3());
    toT.z = 0;
    const tanH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const toD = Math.max((size.x * zw) / 2 / (tanH * camera.aspect), (size.y * zh) / 2 / tanH);
    opening = { t0: performance.now(), book: o, to: o.to, fromT: camTarget.clone(), fromD: camDist, toT, toD };
    hovered = -1;
  };


  new ResizeObserver(layout).observe(canvas);
  show(view);

  const clock = new THREE.Clock();
  let shown = false;
  // Day/night: current values ease toward the chosen look.
  const wallMat = wall.material as THREE.MeshStandardMaterial;
  const bg = scene.background as THREE.Color, fog = scene.fog as THREE.Fog;
  const goal = { wall: new THREE.Color(), bg: new THREE.Color(), exposure: 0, env: 0, key: 0, hemi: 0, dark: 0 };
  // Every object material, with its white (night) colour and its dark (day) colour: black crystal, grey frosted.
  const tints = new Map<THREE.MeshStandardMaterial, { light: THREE.Color; dark: THREE.Color }>();
  Object.values(sets).flat().forEach((o) => o.piece.group.traverse((m) => {
    const mat = (m as THREE.Mesh).material as THREE.MeshStandardMaterial;
    if ((m as THREE.Mesh).isMesh && mat.color && !tints.has(mat)) tints.set(mat, { light: mat.color.clone(), dark: new THREE.Color(mat.userData.crystal ? 0x1f2022 : 0x38393b) });
  }));
  const edgeLight = new THREE.Color(0xffffff), edgeDark = new THREE.Color(0x8c8c8c);
  let dark = -1;
  const applyDark = (d: number) => {
    dark = d;
    tints.forEach((c, mat) => mat.color.lerpColors(c.light, c.dark, d));
    edgeMat.color.lerpColors(edgeLight, edgeDark, d); edgeMat.opacity = .45 - d * .15;
  };
  const setLook = (l: Look, instant = false) => {
    const L = LOOKS[l];
    goal.wall.set(L.wall); goal.bg.set(L.bg); Object.assign(goal, { exposure: L.exposure, env: L.env, key: L.key, hemi: L.hemi, dark: L.dark });
    if (instant || reduce) {
      wallMat.color.copy(goal.wall); bg.copy(goal.bg); fog.color.copy(goal.bg);
      renderer.toneMappingExposure = goal.exposure; scene.environmentIntensity = goal.env; key.intensity = goal.key; hemi.intensity = goal.hemi;
      applyDark(goal.dark);
    }
  };
  setLook(opts.look ?? 'night', true);

  const at = new THREE.Vector3();
  renderer.setAnimationLoop(() => {
    const dt = Math.min(clock.getDelta(), .05), t = reduce ? 0 : clock.elapsedTime;
    const k = 1 - Math.exp(-dt * 4);
    wallMat.color.lerp(goal.wall, k); bg.lerp(goal.bg, k); fog.color.copy(bg);
    renderer.toneMappingExposure += (goal.exposure - renderer.toneMappingExposure) * k;
    scene.environmentIntensity += (goal.env - scene.environmentIntensity) * k;
    key.intensity += (goal.key - key.intensity) * k; hemi.intensity += (goal.hemi - hemi.intensity) * k;
    if (Math.abs(goal.dark - dark) > .001) applyDark(dark + (goal.dark - dark) * k);

    // Cross-fade between views: swap once the veil has covered the screen.
    veilNow += (veilGoal - veilNow) * (1 - Math.exp(-dt * 9));
    if (pending && veilNow > .97) { show(pending); pending = null; veilGoal = 0; }
    let namesFade = 1 - veilNow;
    if (opening) {
      const p = Math.min((performance.now() - opening.t0) / 1700, 1), book = opening.book;
      book.piece.open?.(p);
      book.lift += (1 - book.lift) * k;
      objects.forEach((o) => { if (o !== book) o.holder.scale.setScalar(Math.max(.001, 1 - ease(clamp01(p / .4)))); });
      const z = ease(clamp01((p - .1) / .9));
      camTarget.lerpVectors(opening.fromT, opening.toT, z); camDist = opening.fromD + (opening.toD - opening.fromD) * z;
      veilNow = Math.max(veilNow, clamp01((p - .72) / .28));
      namesFade = Math.min(namesFade, 1 - clamp01(p / .25));
      if (p >= 1) { const to = opening.to; opening = null; show(to); veilNow = 1; veilGoal = 0; onNavigate?.(to); }
    }
    if (veil) veil.style.opacity = veilNow.toFixed(3);
    if (names) names.style.opacity = namesFade.toFixed(3);

    smooth.lerp(pointer, 1 - Math.exp(-dt * 3));
    objects.forEach((o) => {
      if (!opening) o.lift += ((o.i === hovered ? 1 : 0) - o.lift) * (1 - Math.exp(-dt * 5));
      // Hovered piece comes off the wall a little and turns toward the pointer.
      o.holder.rotation.y = o.yaw + Math.sin(t * .25 + o.i * 2.1) * .035 + o.lift * smooth.x * .18;
      o.holder.rotation.x = o.lift * -smooth.y * .12;
      o.holder.position.z = o.standoff + o.lift * .18 + Math.sin(t * .6 + o.i) * .006;
    });
    glint.position.set(camTarget.x + Math.sin(t * .22) * 3.5, camTarget.y + Math.cos(t * .17) * 1.6, 2.6);
    camera.position.copy(camTarget).addScaledVector(dir, camDist);
    fog.near = camDist + 6; fog.far = camDist + 26; // fog only far behind the wall, never on the objects
    camera.position.x += smooth.x * camDist * .03; camera.position.y += smooth.y * camDist * .02;
    camera.lookAt(camTarget);
    renderer.render(scene, camera);
    const b = canvas.getBoundingClientRect();
    objects.forEach((o) => {
      if (!o.label) return;
      // Names sit on the wall under each slot, so a row shares one baseline.
      at.set((o.box.min.x + o.box.max.x) / 2, o.frameBottom - .22, 0).project(camera);
      o.label.style.transform = `translate(${((at.x + 1) / 2) * b.width}px, ${((1 - at.y) / 2) * b.height}px) translate(-50%, 0)`;
    });
    if (!shown) { shown = true; canvas.classList.add('ready'); }
  });
  return { setLook, go };
}

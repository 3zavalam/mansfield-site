// The Atlético analysis: one 3D world (a night stadium and the land around it) that changes as you scroll.
// Each text step on the page has a data-step name; KEYS below says where the camera sits and what the scene
// shows for that step. Between two steps every value is blended, so the scroll drives the whole film.
import * as THREE from 'three';

type V3 = [number, number, number];
type P = typeof DEFAULTS;
// inside: a close shot from within the stadium, never pulled back on phones. m: a phone-only camera for wide scenes.
type Key = { cam: V3; look: V3; p?: Partial<P>; inside?: boolean; m?: { cam: V3; look: V3 } };

const DEFAULTS = {
  orbit: 0, stands: 1, fill: 1, lights: 1, tl: 0, coins: 0, overflow: 0, cols: 0, rev: 0, debt: 0, fcf: 0, merge: 0, glass: 0,
  flow: 0, drain: 0, tower: 0, stairs: 0, guar: 0, tv: 0, players: 0, leave: 0, glow: 0, map: 0, apollo: 0, sim: 0, fade: 0,
};

const KEYS: Record<string, Key> = {
  hero: { cam: [0, 40, 70], look: [0, 9, 0], p: { orbit: 1, fade: 0.5 } }, // pulled back and dimmed behind the title
  hook: { cam: [0, 30, 52], look: [0, 4, 0], p: { orbit: 1, fade: 0.55 } },
  moved: { cam: [-140, 22, 132], look: [-108, 2, 76], p: { tl: 1 } },
  timeline: { cam: [-84, 18, 118], look: [-62, 3, 72], p: { tl: 1 } },
  calderon: { cam: [-29, 8, 114], look: [-29, 7, 72], p: { tl: 1 } , m: { cam: [-27, 9, 100], look: [-27, 6.5, 72] } },
  covid: { cam: [0, 21, 38], look: [0, 1, 0], p: { fill: 0, lights: 0.3 } },
  coins: { cam: [0, 15, 12], look: [0, 0, 0.5], p: { coins: 1, lights: 0.85 } },
  overflow: { cam: [0, 13, 16], look: [0, 0, 2.5], p: { coins: 1, overflow: 1, lights: 0.85 } },
  rev: { cam: [0, 6, 21], look: [0, 3.5, 0], p: { stands: 0, cols: 1, rev: 1 } },
  debt: { cam: [0, 8.5, 25], look: [0, 6, 0], p: { stands: 0, cols: 1, rev: 1, debt: 1 } },
  fcf: { cam: [0, 0.4, 19], look: [0, -2.2, 0], p: { stands: 0, cols: 1, rev: 1, debt: 1, fcf: 1, glass: 1 } },
  merge: { cam: [0, -0.5, 17], look: [0, -3.4, 0], p: { stands: 0, cols: 1, rev: 0, fcf: 1, merge: 1, glass: 1 } },
  cash: { cam: [0, 3.4, 27], look: [0, 3.4, 0], p: { stands: 0, flow: 1 } },
  cashwhy: { cam: [5.6, 7.2, 14], look: [5.6, 7.2, 0], p: { stands: 0, flow: 1 } , m: { cam: [6.5, 7.4, 17], look: [8, 7.2, 0] } },
  tower: { cam: [-1, 7.4, 27.5], look: [-0.5, 7.2, 0], p: { stands: 0, tower: 1 } },
  stairs: { cam: [6.5, 7, 28], look: [5.5, 5.8, 0], p: { stands: 0, tower: 1, stairs: 1 } , m: { cam: [-3, 8, 20], look: [9, 6, 0] } },
  shares: { cam: [-6, 12, 30], look: [2, 5, 0], p: { stands: 0, tower: 1, stairs: 1, lights: 0.7 } },
  guar: { cam: [1.2, 5.5, 28], look: [1.2, 3.6, 0], p: { stands: 0, guar: 1 } , m: { cam: [-22, 7, 15], look: [3, 3, -1] } },
  tv: { cam: [0, 8, 31], look: [0, 7, -4], p: { stands: 0, guar: 1, tv: 1 } , m: { cam: [-20, 9, 19], look: [0, 6, -5] } },
  works: { cam: [0, 2.2, 7], look: [0, 5, -16], p: { fill: 0.98 }, inside: true },
  members: { cam: [7, 2.6, -3], look: [-14, 5, 9], p: { fill: 0.98 }, inside: true },
  coach: { cam: [0, 3.2, 12], look: [0, 1, 0], p: { players: 1 }, inside: true },
  value: { cam: [0, 24, 36], look: [0, 0, 0], p: { players: 1, leave: 1, glow: 1 } },
  soriano: { cam: [-2, 7.5, -46], look: [-2, 5.4, -90], p: { stands: 0, map: 1 } },
  powers: { cam: [0, 95, 175], look: [0, 0, 0], p: { orbit: 1, fade: 0.7 } }, // far away and dim, so the cards read,
  apollo: { cam: [0, 62, 74], look: [0, 4, 0], p: { apollo: 1 } },
  bullbear: { cam: [44, 38, 56], look: [0, 0, 0], p: { apollo: 1, fade: 0.35 } },
  sim: { cam: [0, 44, 54], look: [0, 0, 0], p: { apollo: 0.5, sim: 1 } },
  deadline: { cam: [0, 22, 40], look: [0, 0, 0], p: { orbit: 1 } },
  lessons: { cam: [0, 60, 70], look: [0, 0, 0], p: { fade: 1 } },
  bts: { cam: [0, 60, 70], look: [0, 0, 0], p: { fade: 1 } },
};

const C = { red: 0xd2122e, white: 0xf4f4f1, navy: 0x2b3576, gold: 0xe8b84a, dark: 0x171b2b, grey: 0x5a6078 };
// Fonts come from the page's CSS variables, so the 3D labels follow whichever font set is chosen.
let FONT = '"Archivo Narrow", "Arial Narrow", sans-serif';
let DISPLAY = '"Instrument Serif", Georgia, serif';
let DW = '400';

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (v: number) => { const x = clamp(v); return x * x * (3 - 2 * x); };
// A value that switches on during part of a 0..1 range, so things inside one step can play in sequence.
const span = (v: number, a: number, b: number) => smooth((v - a) / (b - a));

// ---------- Small builders ----------

// Every label and logo, with its desktop scale and how much to enlarge it on a phone. Crowded scenes
// (timeline, spheres, loan steps, money flow) use a smaller factor so their labels don't collide.
const sprites: { s: THREE.Sprite; x: number; y: number; mk: number }[] = [];
// Phones get smaller label images (GPU memory is the limit there) without mipmaps.
const PHONE = typeof matchMedia !== 'undefined' && matchMedia('(max-width: 720px)').matches;

function label(lines: string[], o: { size?: number; color?: string; bg?: string; display?: boolean; align?: CanvasTextAlign; mk?: number } = {}) {
  const c = document.createElement('canvas');
  const g = c.getContext('2d')!;
  // Every label sits on a dark plate so it stays readable over the bright pitch and the stands.
  const bg = o.bg ?? 'rgba(10, 13, 24, 0.72)';
  const fs = PHONE ? 52 : 72, lh = fs * 1.12, pad = Math.round(fs * 0.36);
  const font = (i: number) => (o.display || i === 0 ? `${DW} ${fs}px ${DISPLAY}` : `500 ${fs * 0.62}px ${FONT}`);
  let w = 0;
  lines.forEach((l, i) => { g.font = font(i); w = Math.max(w, g.measureText(l).width); });
  c.width = Math.ceil(w + pad * 2);
  c.height = Math.ceil(lh * lines.length + pad * 2);
  g.fillStyle = bg;
  g.beginPath(); g.roundRect(0, 0, c.width, c.height, fs * 0.25); g.fill();
  g.textBaseline = 'top';
  g.textAlign = o.align ?? 'left';
  const x = o.align === 'center' ? c.width / 2 : pad;
  lines.forEach((l, i) => { g.font = font(i); g.fillStyle = i === 0 ? (o.color ?? '#f4f4f1') : 'rgba(244,244,241,.78)'; g.fillText(l, x, pad + i * lh + (i ? fs * 0.16 : 0)); });
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  if (PHONE) { tex.generateMipmaps = false; tex.minFilter = THREE.LinearFilter; }
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, depthTest: false }));
  s.renderOrder = 10;
  const h = (o.size ?? 1) * lines.length;
  s.scale.set((h * c.width) / c.height, h, 1);
  sprites.push({ s, x: s.scale.x, y: s.scale.y, mk: o.mk ?? 2 });
  return s;
}

// A logo on a white disc, so dark logos still read at night.
function logo(url: string, size: number, mk = 1.6) {
  const c = document.createElement('canvas');
  c.width = c.height = PHONE ? 256 : 512;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const img = new Image();
  img.onload = () => {
    const g = c.getContext('2d')!;
    g.fillStyle = '#f4f4f1';
    const R = c.width / 2;
    g.beginPath(); g.arc(R, R, R * 0.976, 0, Math.PI * 2); g.fill();
    const iw = img.naturalWidth || 300, ih = img.naturalHeight || 300, k = Math.min((R * 1.33) / iw, (R * 1.33) / ih);
    g.drawImage(img, R - (iw * k) / 2, R - (ih * k) / 2, iw * k, ih * k);
    tex.needsUpdate = true;
  };
  img.src = url;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, depthTest: false }));
  s.renderOrder = 10;
  s.scale.set(size, size, 1);
  sprites.push({ s, x: size, y: size, mk });
  return s;
}

const mat = (color: number, extra: THREE.MeshStandardMaterialParameters = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.1, ...extra });

// Fade a whole group: every material keeps its own base opacity and is multiplied by v.
function fade(group: THREE.Object3D, v: number) {
  group.visible = v > 0.004;
  if (!group.visible) return;
  group.traverse((o) => {
    const m = (o as THREE.Mesh).material as THREE.Material | undefined;
    if (!m) return;
    if (m.userData.base === undefined) { m.userData.base = m.opacity; m.transparent = true; }
    m.opacity = m.userData.base * v;
  });
}

// ---------- The world ----------

export function start(canvas: HTMLCanvasElement) {
  const cs = getComputedStyle(document.documentElement);
  DISPLAY = cs.getPropertyValue('--display').trim() || DISPLAY;
  FONT = cs.getPropertyValue('--label').trim() || FONT;
  DW = cs.getPropertyValue('--dw').trim() || DW;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !PHONE, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  // If iOS drops the GPU context under memory pressure, let three.js restore it instead of staying black.
  canvas.addEventListener('webglcontextlost', (e) => e.preventDefault());
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x0a0d18, 70, 230);
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 600);
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let seasons = 0;

  // Light: a dark sky, a cold moon, four floodlights on the roof.
  const hemi = new THREE.HemisphereLight(0x8fa3ff, 0x0b0d16, 0.5);
  const moon = new THREE.DirectionalLight(0xbfcaff, 0.6);
  moon.position.set(-40, 60, 30);
  scene.add(hemi, moon);
  const floods = [[-22, 14, -16], [22, 14, -16], [-22, 14, 16], [22, 14, 16]].map(([x, y, z]) => {
    const l = new THREE.PointLight(0xfff4e0, 0, 0, 1.4);
    l.position.set(x, y, z);
    scene.add(l);
    return l;
  });

  // Ground and city.
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(520, 520), mat(0x0d1120, { roughness: 1 }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.06;
  scene.add(ground);
  const bGeo = new THREE.BoxGeometry(1, 1, 1);
  bGeo.translate(0, 0.5, 0);
  const city = new THREE.InstancedMesh(bGeo, mat(0x141a2e, { roughness: 0.9, emissive: 0x1b2340, emissiveIntensity: 0.25 }), 260);
  const dm = new THREE.Matrix4();
  let n = 0;
  for (let i = 0; i < 2000 && n < 260; i++) {
    const a = Math.random() * Math.PI * 2, r = 42 + Math.random() * 150;
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (z > 35 && x < 5) continue; // keep the riverside timeline clear
    if (z < -30 && z > -125 && Math.abs(x) < 40) continue; // and the strategy map and its camera
    const w = 3 + Math.random() * 6;
    dm.compose(new THREE.Vector3(x, 0, z), new THREE.Quaternion(), new THREE.Vector3(w, 2 + Math.random() * 14, 3 + Math.random() * 6));
    city.setMatrixAt(n++, dm);
  }
  city.count = n;
  scene.add(city);

  // Pitch: 105 × 68 m at 1:5, mown stripes.
  const L = 21, W = 13.6;
  const tc = document.createElement('canvas');
  tc.width = 2100; tc.height = 1360;
  const g = tc.getContext('2d')!;
  for (let i = 0; i < 14; i++) { g.fillStyle = i % 2 ? '#1f5c2e' : '#246835'; g.fillRect((i * 2100) / 14, 0, 2100 / 14 + 1, 1360); }
  g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 6;
  g.strokeRect(3, 3, 2094, 1354);
  g.beginPath(); g.moveTo(1050, 0); g.lineTo(1050, 1360); g.stroke();
  g.beginPath(); g.arc(1050, 680, 183, 0, Math.PI * 2); g.stroke();
  g.strokeRect(3, 680 - 403, 330, 806); g.strokeRect(2100 - 333, 680 - 403, 330, 806);
  const ptex = new THREE.CanvasTexture(tc);
  ptex.colorSpace = THREE.SRGBColorSpace;
  ptex.anisotropy = 8;
  const pitchMat = mat(0xffffff, { map: ptex, roughness: 0.95, transparent: true });
  const pitch = new THREE.Mesh(new THREE.PlaneGeometry(L + 3, W + 3), pitchMat);
  pitch.rotation.x = -Math.PI / 2;
  scene.add(pitch);

  // Stands: three tiers of seats around an oval. Each seat is filled (red or white stripes) or empty.
  const seats: { x: number; y: number; z: number; rot: number; rank: number; stripe: number }[] = [];
  for (let t = 0; t < 3; t++) for (let row = 0; row < 6; row++) {
    const a = 15.5 + t * 4.2 + row * 0.62, b = 11 + t * 4.2 + row * 0.62, y = 0.4 + t * 3.1 + row * 0.42;
    const per = Math.floor((Math.PI * (a + b)) / 0.62);
    for (let i = 0; i < per; i++) {
      const ang = (i / per) * Math.PI * 2;
      seats.push({ x: Math.cos(ang) * a, y, z: Math.sin(ang) * b, rot: -ang, rank: Math.random(), stripe: Math.floor((ang / (Math.PI * 2)) * 48) % 2 });
    }
  }
  const seatMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(0.42, 0.34, 0.42), mat(0xffffff, { roughness: 0.7 }), seats.length);
  const q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), one = new THREE.Vector3(1, 1, 1);
  seats.forEach((s, i) => { q.setFromAxisAngle(up, s.rot); dm.compose(new THREE.Vector3(s.x, s.y, s.z), q, one); seatMesh.setMatrixAt(i, dm); });
  const bowl = new THREE.Group();
  bowl.add(seatMesh);
  scene.add(bowl);
  const cRed = new THREE.Color(C.red), cWhite = new THREE.Color(C.white), cEmpty = new THREE.Color(0x232838);
  let lastFill = -1;
  const paintSeats = (f: number) => {
    if (Math.abs(f - lastFill) < 0.004) return;
    lastFill = f;
    seats.forEach((s, i) => seatMesh.setColorAt(i, s.rank < f ? (s.stripe ? cRed : cWhite) : cEmpty));
    seatMesh.instanceColor!.needsUpdate = true;
  };
  // Bowl walls under the tiers and the roof ring, the Metropolitano's lit edge.
  for (let t = 0; t < 3; t++) {
    const wall = new THREE.Mesh(new THREE.CylinderGeometry(15.2 + t * 4.2, 15.2 + t * 4.2, 0.4 + t * 3.1, 96, 1, true), mat(0x1a1f33, { side: THREE.DoubleSide }));
    wall.scale.z = (10.7 + t * 4.2) / (15.2 + t * 4.2);
    wall.position.y = (0.4 + t * 3.1) / 2;
    bowl.add(wall);
  }
  const roofMat = mat(0xffffff, { emissive: 0xffffff, emissiveIntensity: 1 });
  const roof = new THREE.Mesh(new THREE.TorusGeometry(1, 0.012, 8, 160), roofMat);
  roof.rotation.x = -Math.PI / 2;
  roof.scale.set(27.5, 23, 27.5);
  roof.position.y = 12.4;
  bowl.add(roof);

  // ---------- Act I: the timeline by the river ----------
  const tl = new THREE.Group();
  const yearX = (y: number) => -122 + (y - 1966) * 1.72;
  const river = new THREE.Mesh(new THREE.PlaneGeometry(260, 7), mat(0x1d3a7a, { emissive: 0x1d3a7a, emissiveIntensity: 0.5, roughness: 0.2, metalness: 0.4 }));
  river.rotation.x = -Math.PI / 2;
  river.position.set(-80, 0, 94);
  tl.add(river);
  const stc = document.createElement('canvas');
  stc.width = 512; stc.height = 64;
  const sg0 = stc.getContext('2d')!;
  for (let i = 0; i < 32; i++) { sg0.fillStyle = i % 2 ? '#d2122e' : '#f4f4f1'; sg0.fillRect(i * 16, 0, 16, 64); }
  const stTex = new THREE.CanvasTexture(stc);
  stTex.colorSpace = THREE.SRGBColorSpace;
  const cald = new THREE.Mesh(new THREE.CylinderGeometry(7, 7, 4, 48, 1, true), mat(0xffffff, { map: stTex, side: THREE.DoubleSide, emissive: 0xffffff, emissiveMap: stTex, emissiveIntensity: 0.25 }));
  cald.position.set(-122, 2, 84);
  tl.add(cald);
  const caldL = label(['Vicente Calderón', '1966 – 2019 · by the river'], { size: 1.6 });
  caldL.position.set(-122, 9, 84);
  tl.add(caldL);
  const path = new THREE.Mesh(new THREE.BoxGeometry(110, 0.06, 0.25), mat(0xffffff, { emissive: 0xffffff, emissiveIntensity: 0.4 }));
  path.position.set(-70, 0.03, 72);
  tl.add(path);
  const events: [number, string[], boolean][] = [
    [1987, ['1987', 'The Gil family takes control', '(press)'], false],
    [2003, ['2003-04', '€154.9M gain booked on the', 'Calderón land'], true],
    [2017, ['2017', 'The Metropolitano opens'], false],
    [2019, ['2019', 'Calderón land handed over'], false],
    [2021, ['2021', '€300M loan against TV rights', '€120.3M of new shares'], true],
    [2022, ['2022', 'Impulso loan + land'], true],
    [2024, ['2024', 'The old crest returns', '€69.7M of new shares'], true],
    [2026, ['2026', 'Apollo takes control (press)'], true],
  ];
  events.forEach(([y, lines, money], i) => {
    // Post heights chosen so the labels in the busy 2017–2026 stretch never sit on top of each other.
    const x = yearX(y), h = ({ 1987: 3, 2003: 5, 2017: 3, 2019: 7.5, 2021: 11.5, 2022: 3, 2024: 6.6, 2026: 3 } as Record<number, number>)[y];
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.12, h, 0.12), mat(money ? C.red : C.white, { emissive: money ? C.red : C.white, emissiveIntensity: 0.6 }));
    post.position.set(x, h / 2, 72);
    const l = label(lines, { size: 1.5, color: money ? '#ff4b62' : '#f4f4f1', mk: 1.45 });
    l.center.set(0, 0);
    l.position.set(x + 0.2, h + 0.15, 72);
    tl.add(post, l);
  });
  scene.add(tl);

  // ---------- Act II: €100 of coins, and 19 more ----------
  const coinsG = new THREE.Group();
  const coinGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.12, 32);
  const coinMats = [mat(C.red, { metalness: 0.5, roughness: 0.35 }), mat(C.navy, { metalness: 0.5, roughness: 0.35 }), mat(C.grey, { metalness: 0.5, roughness: 0.4 }), mat(0xff2a45, { emissive: C.red, emissiveIntensity: 0.9 })];
  const coinList: { m: THREE.Mesh; home: THREE.Vector3; k: number }[] = [];
  for (let k = 0; k < 119; k++) {
    const kind = k < 67 ? 0 : k < 85 ? 1 : k < 100 ? 2 : 3;
    const m = new THREE.Mesh(coinGeo, coinMats[kind]);
    const home = k < 100
      ? new THREE.Vector3(((k % 10) - 4.5) * 0.86, 0.07, (Math.floor(k / 10) - 4.5) * 0.86)
      : new THREE.Vector3(((k - 100) % 7 - 3) * 0.95 + (Math.random() - 0.5) * 0.3, 0.07, 5.3 + Math.floor((k - 100) / 7) * 0.9);
    m.position.copy(home);
    coinsG.add(m);
    coinList.push({ m, home, k });
  }
  const tray = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(9, 0.3, 9)), new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 }));
  tray.position.y = 0.15;
  const l100 = label(['For every €100 it earns'], { size: 0.9, mk: 1.4 });
  l100.center.set(1, 0.5);
  l100.position.set(-4.9, 1.2, -4.4);
  // One line per coin colour, so the legend doubles as the key.
  const legend = ([['€67 goes to staff', '#ff4b62'], ['€18 to other clubs', '#9aa6ff'], ['€15 to everything else', '#c3c6d4']] as const).map(([t, c], i) => {
    const l = label([t], { size: 0.62, color: c, mk: 1.4 });
    l.center.set(1, 0.5);
    l.position.set(-4.9, 0.5, -2.6 + i * 1.25);
    return l;
  });
  const l19 = label(['…and it spends €19 more'], { size: 0.9, color: '#ff4b62' });
  l19.position.set(0, 1.6, 8.3);
  coinsG.add(tray, l100, ...legend, l19);
  scene.add(coinsG);

  // ---------- Act II: five years as columns ----------
  const years = ['20-21', '21-22', '22-23', '23-24', '24-25'];
  const revenue = [325.6, 377.8, 357.8, 395.1, 416.1];
  const netDebt = [1.6 * 325.6, 1.33 * 377.8, 1.44 * 357.8, 1.29 * 395.1, 469.4]; // ratio × revenue, see findings
  const fcf = [128.1, 110.1, 16.7, 34.0, 48.1];
  const kUp = 0.016, kDown = 0.02, colX = (i: number) => (i - 2) * 3.2;
  const colsG = new THREE.Group();
  const revCols = revenue.map((v, i) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(1.7, 1, 1.7), mat(C.white, { roughness: 0.3, metalness: 0.2 }));
    m.position.x = colX(i);
    const yl = label([years[i]], { size: 0.55 });
    yl.position.set(colX(i), -0.6, 1.4);
    const vl = label([`€${v.toFixed(0)}M`], { size: 0.6 });
    colsG.add(m, yl, vl);
    return { m, vl, yl, v };
  });
  const debtLift = 1.8; // drawn a little above scale so it clears the revenue labels
  const debtPts = netDebt.map((v, i) => new THREE.Vector3(colX(i), v * kUp + debtLift, 0));
  const debtLine = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(debtPts), 64, 0.11, 10), mat(C.red, { emissive: C.red, emissiveIntensity: 1.4 }));
  const debtL = label(['Net debt', 'what it owes lenders, minus cash'], { size: 0.62, color: '#ff4b62' });
  debtL.center.set(1, 0.5);
  debtL.position.set(colX(0) - 1.6, netDebt[0] * kUp + debtLift, 0);
  const debtG = new THREE.Group();
  debtG.add(debtLine, debtL);
  // A dot and a value on every year, so the line reads as a chart. Values ≈ net debt/revenue × revenue (LaLiga definition to 2024).
  debtPts.forEach((pt, i) => {
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.26, 20, 14), mat(C.red, { emissive: C.red, emissiveIntensity: 1.6 }));
    dot.position.copy(pt);
    const dl = label([`≈ €${Math.round(netDebt[i] / 10) * 10}M`], { size: 0.62, color: '#ff4b62' });
    dl.position.set(pt.x, pt.y + 0.8, 0);
    debtG.add(dot, dl);
  });
  colsG.add(debtG);
  const fcfCols = fcf.map((v, i) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(1.7, 1, 1.7), mat(C.red, { emissive: C.red, emissiveIntensity: 0.5 }));
    const vl = label([years[i], `−€${v.toFixed(1)}M`], { size: 0.5, color: '#ff4b62' });
    colsG.add(m, vl);
    return { m, vl, v };
  });
  const fill1 = new THREE.Mesh(new THREE.BoxGeometry(2.4, 192 * kDown, 2.4), mat(C.white, { roughness: 0.3 }));
  fill1.position.y = -(192 * kDown) / 2;
  const fill2 = new THREE.Mesh(new THREE.BoxGeometry(2.4, 169 * kDown, 2.4), mat(C.navy, { roughness: 0.3, emissive: C.navy, emissiveIntensity: 0.3 }));
  fill2.position.y = -192 * kDown - (169 * kDown) / 2;
  const fillL1 = label(['Shareholders €192M', '53% of the hole'], { size: 0.55 });
  fillL1.position.set(3.6, -1.9, 0);
  const fillL2 = label(['New debt €169M', '47%'], { size: 0.55 });
  fillL2.position.set(3.6, -5.3, 0);
  const totalL = label(['−€337M'], { size: 1.1, color: '#ff4b62' });
  totalL.position.set(0, 1.1, 0);
  const fillG = new THREE.Group();
  fillG.add(fill1, fill2, fillL1, fillL2, totalL);
  colsG.add(fillG);
  scene.add(colsG);

  // ---------- Act II: one summer in cash, as streams of money ----------
  // Seen straight on. Every dot is money: it comes in from four sources on the left, passes through the club
  // (the ring) and leaves to three uses on the right. More dots and a wider stream = more euros.
  const flowG = new THREE.Group();
  const club = new THREE.Vector3(0, 6, 0);
  const sources: [string, number, number, string][] = [['Players sold', 101.6, 0xff3550, '#ff4b62'], ['The business', 15.3, 0xb8bdcc, '#f4f4f1'], ['Shareholders', 69.7, 0xf4f4f1, '#f4f4f1'], ['Net new debt', 53.1, 0x8f9bff, '#9aa6ff']];
  const uses: [string, number, number, string][] = [['Cash left in the bank', 74.0, C.gold, '#e8b84a'], ['Players bought', 139.6, 0xff3550, '#ff4b62'], ['Facilities & other', 26.2, 0xb8bdcc, '#f4f4f1']];
  const flows: { a: THREE.Vector3; b: THREE.Vector3; amt: number; color: number }[] = [];
  const endpoint = (x: number, y: number, name: string, v: number, color: number, css: string, side: -1 | 1) => {
    const r = 0.18 + Math.sqrt(v) * 0.045;
    const dot = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 16), mat(color, { emissive: color, emissiveIntensity: 1.1 }));
    dot.position.set(x, y, 0);
    const l = label([`${name}  €${v}M`], { size: 0.75, color: css, mk: 1.5 });
    l.center.set(side === -1 ? 1 : 0, 0.5);
    l.position.set(x + side * (r + 0.5), y, 0);
    flowG.add(dot, l);
    return dot.position;
  };
  sources.forEach(([n, v, c, css], i) => flows.push({ a: endpoint(-6.8, 9 - i * 2, n, v, c, css, -1), b: club, amt: v, color: c }));
  uses.forEach(([n, v, c, css], i) => flows.push({ a: club, b: endpoint(6.8, 8.4 - i * 2.4, n, v, c, css, 1), amt: v, color: c }));
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.09, 16, 64), mat(0xffffff, { emissive: 0xffffff, emissiveIntensity: 0.9 }));
  ring.position.copy(club);
  const clubL = label(['The club', '€239.7M in · €239.7M out'], { size: 0.7, align: 'center' });
  clubL.position.set(0, club.y + 2.3, 0);
  flowG.add(ring, clubL);
  const NP = 1600, total = flows.reduce((sum, f) => sum + f.amt, 0);
  const pPos = new Float32Array(NP * 3), pCol = new Float32Array(NP * 3);
  const parts: { f: number; ph: number; sp: number; off: number }[] = [];
  let acc = 0, fi = 0;
  for (let i = 0; i < NP; i++) {
    while (fi < flows.length - 1 && i / NP > (acc + flows[fi].amt) / total) { acc += flows[fi].amt; fi++; }
    // Stream width grows with the amount.
    parts.push({ f: fi, ph: Math.random(), sp: 0.16 + Math.random() * 0.05, off: (Math.random() - 0.5) * (0.15 + flows[fi].amt * 0.009) });
    const c = new THREE.Color(flows[fi].color);
    pCol.set([c.r, c.g, c.b], i * 3);
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  pGeo.setAttribute('color', new THREE.BufferAttribute(pCol, 3));
  const points = new THREE.Points(pGeo, new THREE.PointsMaterial({ size: 0.13, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  flowG.add(points);
  scene.add(flowG);
  const pv = new THREE.Vector3();
  // Eased S-curve between two points, flat at both ends like a Sankey link.
  const sCurve = (a: THREE.Vector3, b: THREE.Vector3, u: number, off: number, out: THREE.Vector3) => {
    const e = smooth(u), taper = Math.sin(u * Math.PI) * 0.35 + 0.65;
    return out.set(a.x + (b.x - a.x) * u, a.y + (b.y - a.y) * e + off * taper, (Math.sin(u * 9 + off * 20) * 0.08));
  };

  // ---------- Act III: the debt tower and the staircase of extensions ----------
  const towerG = new THREE.Group();
  const kT = 0.02;
  const layers: [string, number, number, string][] = [['Refinancing loan', 392.4, C.red, 'pledged against LaLiga TV'], ['LaLiga Impulso', 146.2, C.white, '1.52% of LaLiga TV · 50 years'], ['Banks', 61.0, C.navy, '']];
  let base = 0;
  const towerParts = layers.map(([name, v, color, note], i) => {
    const h = v * kT;
    const m = new THREE.Mesh(new THREE.BoxGeometry(3.2, h, 3.2), mat(color, { roughness: 0.35, emissive: color, emissiveIntensity: i === 0 ? 0.25 : 0.08 }));
    const y0 = base;
    base += h;
    const l = label(note ? [`${name} €${v}M`, note] : [`${name} €${v}M`], { size: 0.68, mk: 1.5 });
    l.center.set(1, 0.5);
    l.position.set(-2, y0 + h / 2, 0);
    towerG.add(m, l);
    return { m, h, y0, l };
  });
  const towerL = label(['€599.6M owed to lenders', '30 June 2025'], { size: 0.75 });
  towerL.position.set(0, base + 1.4, 0);
  towerG.add(towerL);
  const stairsG = new THREE.Group();
  const steps: [string, number][] = [['2020-21 · €300M at 2.75%', 300], ['2022 · +€50M', 350], ['2023 · +€75M at 4.99%', 425], ['2025 · +€70M at 4.5%', 495]];
  const stairParts = steps.map(([name, v], i) => {
    const h = v * kT;
    const m = new THREE.Mesh(new THREE.BoxGeometry(1.5, h, 1.5), mat(i ? 0xff3550 : C.red, { emissive: C.red, emissiveIntensity: 0.2 + i * 0.12 }));
    m.position.set(5 + i * 2.7, h / 2, 0);
    const l = label([name], { size: 0.7, mk: 1.6 });
    l.center.set(0, 0);
    l.position.set(4.25 + i * 2.7, h + 0.3 + (i % 2) * 0.9, 0.8);
    stairsG.add(m, l);
    return { m, l };
  });
  const stairsL = label(['One loan, made bigger three times', 'signed amounts'], { size: 0.7 });
  stairsL.center.set(0, 0);
  stairsL.position.set(4.5, 12.2, 0);
  stairsG.add(stairsL);
  towerG.add(stairsG);
  scene.add(towerG);

  // ---------- Act III: personal guarantees shrinking into the TV rights ----------
  const guarG = new THREE.Group();
  const guars: [string, number, number][] = [['2020', 397, 3.3], ['2021', 134, 3.3], ['2022', 88.6, 0.9], ['2023', 69.2, 0.8], ['2024', 59.4, 0.7], ['2025', 36, 0.5]];
  const radii = guars.map(([, v]) => 0.19 * Math.sqrt(v));
  let gx = 0;
  const gxs = radii.map((r, i) => { gx += (i ? radii[i - 1] : 0) + r + (i ? 1.1 : 0); return gx; });
  const off = (gxs[5] + radii[5]) / 2 - radii[0] / 2;
  const spheres = guars.map(([y, v, fee], i) => {
    const r = radii[i];
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, 48, 32), mat(C.gold, { metalness: 0.75, roughness: 0.25 }));
    m.position.set(gxs[i] - off, r + 0.1, 0);
    const l = label([`€${v}M`, `${y} · fee €${fee}M`], { size: 0.78, align: 'center', mk: 1.55 });
    l.position.set(gxs[i] - off, r * 2 + 1.1, 0);
    guarG.add(m, l);
    return { m, l, r };
  });
  const guarL = label(['Debts guaranteed personally', 'by the CEO and a related company'], { size: 0.85 });
  guarL.position.set(0, 9.4, 0);
  guarG.add(guarL);
  const tvG = new THREE.Group();
  const sc = document.createElement('canvas');
  sc.width = 1024; sc.height = 576;
  const sg = sc.getContext('2d')!;
  const grad = sg.createLinearGradient(0, 0, 1024, 576);
  grad.addColorStop(0, '#2b3576'); grad.addColorStop(1, '#0e1430');
  sg.fillStyle = grad; sg.fillRect(0, 0, 1024, 576);
  sg.fillStyle = '#f4f4f1'; sg.font = `${DW} 92px ${DISPLAY}`; sg.fillText('LALIGA TV RIGHTS', 60, 200);
  sg.fillStyle = '#ff4b62'; sg.font = `600 46px ${FONT}`; sg.fillText('Pledged to the lenders of the €300M loan', 60, 290);
  sg.fillStyle = 'rgba(244,244,241,.7)'; sg.font = `500 36px ${FONT}`; sg.fillText('From 2020-21 the risk sits here', 60, 360);
  const stex = new THREE.CanvasTexture(sc);
  stex.colorSpace = THREE.SRGBColorSpace;
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(9, 5.06), new THREE.MeshBasicMaterial({ map: stex, transparent: true }));
  const tvFrame = new THREE.Mesh(new THREE.BoxGeometry(9.4, 5.4, 0.3), mat(0x0b0e18));
  tvFrame.position.z = -0.17;
  tvG.add(tvFrame, screen);
  tvG.position.set(0, 11, -9);
  tvG.scale.setScalar(1.3);
  guarG.add(tvG);
  scene.add(guarG);

  // ---------- Act IV: the players leave, the club stays ----------
  const playersG = new THREE.Group();
  const formation = [[-0.92, 0], [-0.55, -0.62], [-0.6, -0.22], [-0.6, 0.22], [-0.55, 0.62], [-0.15, -0.35], [-0.25, 0], [-0.15, 0.35], [0.3, -0.6], [0.38, 0], [0.3, 0.6]];
  const kit = mat(C.red, { roughness: 0.5 }), kit2 = mat(C.white, { roughness: 0.5 }), shorts = mat(C.navy);
  const players = formation.map(([fx, fz], i) => {
    const p = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.55, 6, 16), i % 2 ? kit : kit2);
    body.position.y = 0.72;
    const legs = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.18, 0.4, 16), shorts);
    legs.position.y = 0.25;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12), mat(0xd9b38c));
    head.position.y = 1.28;
    p.add(body, legs, head);
    const home = new THREE.Vector3((fx * L) / 2.2, 0, (fz * W) / 2.2);
    p.position.copy(home);
    playersG.add(p);
    return { p, home, dir: home.clone().setY(0).normalize() };
  });
  const leaveL = label(['Players take the value every season', 'wages and transfer fees'], { size: 0.9 });
  leaveL.position.set(0, 2.2, 10);
  const stayL = label(['What stays: fans, brand, stadium, land'], { size: 1.4, color: '#e8b84a' });
  stayL.position.set(0, 4, 0);
  const valueG = new THREE.Group();
  valueG.add(leaveL, stayL);
  scene.add(playersG, valueG);

  // ---------- Act IV: Soriano's map, ambition across and means up ----------
  const mapG = new THREE.Group();
  mapG.position.set(0, 0, -90);
  const grid = new THREE.GridHelper(40, 20, 0x8090c0, 0x2a3150);
  (grid.material as THREE.Material).transparent = true;
  (grid.material as THREE.Material).opacity = 0.6;
  mapG.add(grid);
  // Seen straight on: ambition runs left to right, means is the pole height. Names sit beside the crests so no
  // label ever crosses a pole.
  const clubs: [string, string | null, number, number][] = [
    ['Porto', '/img/atletico/porto.svg', -0.45, 0.22], ['Lyon', '/img/atletico/lyon.svg', -0.15, 0.2],
    ['Atlético', '/img/atletico/atletico.svg', 0.72, 0.4], ['Barcelona', '/img/atletico/barcelona.svg', 0.86, 0.78], ['Real Madrid', '/img/atletico/real-madrid.svg', 1, 1],
  ];
  clubs.forEach(([name, url, ax, means]) => {
    const x = ax * 16, h = 1 + means * 11, me = name === 'Atlético';
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(me ? 0.28 : 0.16, me ? 0.28 : 0.16, h, 16), mat(me ? C.red : C.white, { emissive: me ? C.red : 0xffffff, emissiveIntensity: me ? 0.6 : 0.15 }));
    pole.position.set(x, h / 2, 0);
    mapG.add(pole);
    const size = me ? 3.2 : 2.4;
    const top = url ? logo(url, size) : new THREE.Mesh(new THREE.SphereGeometry(0.5, 20, 14), mat(C.white, { emissive: 0xffffff, emissiveIntensity: 0.4 }));
    top.position.set(x, h + (url ? size / 2 : 0.5), 0);
    mapG.add(top);
    const nl = label([name], { size: me ? 1.5 : 1.15, color: me ? '#ff4b62' : '#f4f4f1', mk: 1.5 });
    nl.center.set(0, 0.5);
    nl.position.set(x + (url ? size / 2 + 0.2 : 0.8), h + (url ? size / 2 : 0.5), 0);
    mapG.add(nl);
  });
  const axX = label(['Ambition →'], { size: 1.1 }); axX.center.set(1, 0.5); axX.position.set(19, -1.1, 0); mapG.add(axX);
  const axY = label(['Height = means'], { size: 0.85 }); axY.center.set(1, 0.5); axY.position.set(19, -2.6, 0); mapG.add(axY);
  const ill = label(['Illustrative positions · our judgement'], { size: 0.7 }); ill.center.set(1, 0.5); ill.position.set(19, -3.8, 0); mapG.add(ill);
  scene.add(mapG);

  // ---------- Act V: Apollo above the stadium ----------
  const apolloG = new THREE.Group();
  const apLogo = logo('/img/atletico/apollo.svg', 13);
  apLogo.position.set(-8, 22, 0);
  const atLogo = logo('/img/atletico/atletico.svg', 13);
  atLogo.position.set(8, 22, 0);
  const apL = label(['~€2.5bn', 'valuation incl. debt, 2026 (press)'], { size: 1.8, align: 'center', color: '#e8b84a' });
  apL.position.set(0, 33, 0);
  apolloG.add(apLogo, atLogo, apL);
  scene.add(apolloG);

  // ---------- Scroll and frame ----------
  const stepEls = [...document.querySelectorAll<HTMLElement>('[data-step]')].filter((e) => KEYS[e.dataset.step!]);
  const cur = { ...DEFAULTS };
  const camPos = new THREE.Vector3(), camLook = new THREE.Vector3(), tmp = new THREE.Vector3();
  // Where the camera sits for a key on this screen: the phone angle if it has one, the desktop shot otherwise
  // (pulled back on phones so wide scenes fit, except close shots from inside the stadium).
  const ca = new THREE.Vector3(), cb = new THREE.Vector3(), la = new THREE.Vector3(), lb = new THREE.Vector3();
  const effCam = (k: Key, c: THREE.Vector3, l: THREE.Vector3) => {
    // Phone angles are framed for a wide screen, so they still step back part of the way.
    if (pull > 1 && k.m) { l.fromArray(k.m.look); c.fromArray(k.m.cam).sub(l).multiplyScalar(1 + (pull - 1) * 0.5).add(l); return; }
    l.fromArray(k.look);
    c.fromArray(k.cam).sub(l).multiplyScalar(k.inside ? 1 : pull).add(l);
  };
  let stepName = 'hero';
  const lerpKey = () => {
    const anchor = innerHeight * 0.55;
    let i = 0;
    stepEls.forEach((e, j) => { if (e.getBoundingClientRect().top <= anchor) i = j; });
    stepName = stepEls[i].dataset.step!;
    const a = KEYS[stepEls[i].dataset.step!], next = stepEls[i + 1], b = next ? KEYS[next.dataset.step!] : a;
    const top = stepEls[i].getBoundingClientRect().top, nTop = next ? next.getBoundingClientRect().top : top + innerHeight;
    // Hold the current view while you read, then travel to the next one.
    const e = smooth((((anchor - top) / Math.max(1, nTop - top)) - 0.45) / 0.55);
    effCam(a, ca, la); effCam(b, cb, lb);
    camPos.copy(ca).lerp(cb, e);
    camLook.copy(la).lerp(lb, e);
    for (const k of Object.keys(DEFAULTS) as (keyof P)[]) {
      const va = a.p?.[k] ?? DEFAULTS[k], vb = b.p?.[k] ?? DEFAULTS[k];
      cur[k] = va + (vb - va) * e;
    }
  };

  // Phones: pull the camera back so wide scenes fit, enlarge labels to stay readable, and shift the picture
  // up so the text box at the bottom of the screen doesn't cover it.
  let pull = 1;
  const resize = () => {
    const w = innerWidth, h = innerHeight, narrow = w / h < 0.8;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    pull = narrow ? Math.min(3.2, Math.pow(1.6 / camera.aspect, 0.9)) : 1;
    sprites.forEach(({ s, x, y, mk }) => { const k = narrow ? mk : 1; s.scale.set(x * k, y * k, 1); });
    if (narrow) camera.setViewOffset(w, h, 0, h * 0.17, w, h);
    else camera.clearViewOffset();
    camera.updateProjectionMatrix();
  };
  addEventListener('resize', resize);
  resize();

  const t0 = performance.now();
  let last = 0;
  const frame = (now = 0) => {
    requestAnimationFrame(frame);
    if (PHONE && now - last < 31) return; // phones: 30 fps is smooth enough and halves the GPU load
    last = now;
    const t = still ? 0 : (performance.now() - t0) / 1000;
    lerpKey();
    const p = cur;

    camera.position.copy(camPos);
    if (p.orbit > 0) camera.position.sub(camLook).applyAxisAngle(up, Math.sin(t * 0.05) * 0.45 * p.orbit).add(camLook);
    camera.lookAt(camLook);

    const lights = p.lights * (1 - p.sim * 0.27 * seasons);
    floods.forEach((l) => (l.intensity = 520 * lights));
    roofMat.emissiveIntensity = 0.25 + lights * 0.9 + p.glow * 1.6;
    roofMat.emissive.setHex(p.glow > 0.3 ? C.gold : 0xffffff);
    paintSeats(p.fill);
    // Data scenes: the stands sink into the ground and the pitch becomes a bare stage.
    bowl.visible = p.stands > 0.02;
    bowl.position.y = -(1 - p.stands) * 14;
    city.visible = p.stands > 0.02;
    city.position.y = -(1 - p.stands) * 22;
    pitchMat.opacity = 1 - p.glass * 0.85;
    (ground.material as THREE.Material).transparent = true;
    (ground.material as THREE.Material).opacity = 1 - p.glass * 0.92;

    fade(tl, p.tl);

    fade(coinsG, p.coins);
    if (coinsG.visible) coinList.forEach(({ m, home, k }) => {
      if (k < 100) { const s = span(p.coins, k / 140, k / 140 + 0.25); m.scale.setScalar(Math.max(s, 0.001)); m.position.copy(home); }
      else { const s = span(p.overflow, (k - 100) / 40, (k - 100) / 40 + 0.45); m.visible = s > 0.01; m.position.set(home.x, home.y + (1 - s) * 7, home.z); m.rotation.x = (1 - s) * 3; }
    });
    l19.visible = p.overflow > 0.3;

    fade(colsG, p.cols);
    if (colsG.visible) {
      revCols.forEach(({ m, vl, yl, v }, i) => {
        const h = Math.max(v * kUp * span(p.rev, i * 0.08, i * 0.08 + 0.6), 0.001);
        m.scale.y = h; m.position.y = h / 2;
        m.visible = p.rev > 0.02;
        vl.position.set(colX(i), h + 0.5, 0);
        vl.visible = p.rev > 0.5;
        yl.visible = p.rev > 0.5 && p.fcf < 0.3; // under the pitch, the red labels carry the year
      });
      fade(debtG, p.debt * p.cols);
      const m1 = span(p.merge, 0, 0.6), m2 = span(p.merge, 0.55, 1);
      let stack = 0;
      fcfCols.forEach(({ m, vl, v }, i) => {
        const h = Math.max(v * kDown * span(p.fcf, i * 0.08, i * 0.08 + 0.6), 0.001);
        const y = -h / 2 - stack * m1;
        stack += h;
        m.scale.y = h;
        m.position.set(colX(i) * (1 - m1), y, 0);
        const mm = m.material as THREE.Material;
        mm.opacity = (1 - m2) * p.cols;
        m.visible = p.fcf > 0.01 && m2 < 0.99;
        vl.position.set(colX(i), -h - 1.1, 1.2);
        vl.visible = m.visible && m1 < 0.2;
      });
      fade(fillG, m2 * p.cols);
    }

    fade(flowG, p.flow);
    if (flowG.visible) {
      // Inflows start first; outflows follow as the scene arrives.
      const inOn = span(p.flow, 0.05, 0.5), outOn = span(p.flow, 0.45, 0.95);
      parts.forEach((pt, i) => {
        const f = flows[pt.f], u = (pt.ph + t * pt.sp) % 1;
        const on = pt.f < sources.length ? inOn : outOn;
        sCurve(f.a, f.b, u * on, pt.off, pv);
        pPos[i * 3] = pv.x; pPos[i * 3 + 1] = pv.y; pPos[i * 3 + 2] = pv.z;
      });
      pGeo.attributes.position.needsUpdate = true;
      ring.rotation.y = Math.sin(t * 0.8) * 0.3;
    }

    fade(towerG, p.tower);
    if (towerG.visible) {
      towerParts.forEach(({ m, h, y0, l }, i) => {
        const s = Math.max(span(p.tower, i * 0.2, i * 0.2 + 0.5), 0.001);
        m.scale.y = s; m.position.y = y0 * s + (h * s) / 2;
        l.visible = s > 0.6;
      });
      fade(stairsG, p.stairs * p.tower);
      // When the staircase arrives, the €599.6M tower steps back so the loan's story leads.
      const back = 1 - 0.78 * p.stairs;
      [...towerParts.flatMap(({ m, l }) => [m, l]), towerL].forEach((o) => {
        const m = (o as THREE.Mesh).material as THREE.Material;
        m.opacity = (m.userData.base ?? 1) * p.tower * back;
      });
      stairParts.forEach(({ m }, i) => { m.scale.y = Math.max(span(p.stairs, i * 0.15, i * 0.15 + 0.4), 0.001); m.position.y = (steps[i][1] * kT * m.scale.y) / 2; });
    }

    fade(guarG, p.guar);
    if (guarG.visible) {
      spheres.forEach(({ m, l, r }, i) => {
        const s = Math.max(span(p.guar, i * 0.1, i * 0.1 + 0.4), 0.001);
        m.scale.setScalar(s); m.position.y = r * s + 0.1;
        l.visible = s > 0.7;
        m.rotation.y = t * 0.2;
      });
      fade(tvG, p.tv * p.guar);
      // The screen rises from behind the spheres; the 'personally' title gives way to it.
      tvG.position.y = 11 - (1 - p.tv) * 10;
      guarL.visible = p.tv < 0.4;
    }

    fade(playersG, p.players);
    fade(valueG, p.leave);
    if (playersG.visible) players.forEach(({ p: pl, home, dir }, i) => {
      const lv = span(p.leave, (i % 5) * 0.06, (i % 5) * 0.06 + 0.7);
      pl.position.copy(home).addScaledVector(dir, lv * 26);
      pl.position.x += Math.sin(t * 1.2 + i) * 0.1 * (1 - lv);
      pl.lookAt(tmp.copy(pl.position).add(dir));
    });

    fade(mapG, p.map);
    fade(apolloG, p.apollo);
    if (apolloG.visible) { apLogo.position.y = atLogo.position.y = 22 + Math.sin(t * 0.8) * 0.4; }

    // Phones only keep the 3D for the opening; after it the page uses flat charts, so stop drawing.
    if (PHONE && stepName !== 'hero' && stepName !== 'hook') { canvas.style.opacity = '0'; return; }
    canvas.style.opacity = String(1 - p.fade * 0.88);
    renderer.render(scene, camera);
  };
  requestAnimationFrame(frame);

  return { setSeasons: (v: number) => { seasons = v; } };
}

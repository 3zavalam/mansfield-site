// Shared three.js setup for the demo sites: renderer, camera, resize, pointer and a loop that only runs on screen.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export type Stage = { renderer: THREE.WebGLRenderer; scene: THREE.Scene; camera: THREE.PerspectiveCamera; pointer: { x: number; y: number }; size: { w: number; h: number } };
type Opts = { fov?: number; env?: boolean; shadows?: boolean; exposure?: number };

export function stage(canvas: HTMLCanvasElement, opts: Opts = {}, frame?: (t: number, s: Stage) => void): Stage {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = opts.exposure ?? 1;
  if (opts.shadows) {
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  }
  const scene = new THREE.Scene();
  if (opts.env !== false) scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
  const camera = new THREE.PerspectiveCamera(opts.fov ?? 35, 1, 0.1, 600);
  const s: Stage = { renderer, scene, camera, pointer: { x: 0, y: 0 }, size: { w: 1, h: 1 } };
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const t0 = performance.now();
  const draw = () => { frame?.((performance.now() - t0) / 1000, s); renderer.render(scene, camera); };
  const resize = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    s.size = { w, h };
    if (!on || still) draw();
  };
  let on = false, raf = 0;
  const loop = () => { draw(); if (on && !still) raf = requestAnimationFrame(loop); };
  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver(([e]) => {
    on = e.isIntersecting;
    cancelAnimationFrame(raf);
    if (on) raf = requestAnimationFrame(loop);
  }).observe(canvas);
  addEventListener('pointermove', (e) => { s.pointer.x = (e.clientX / innerWidth) * 2 - 1; s.pointer.y = (e.clientY / innerHeight) * 2 - 1; });
  return s;
}

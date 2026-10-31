/* THE WALKTHROUGH — Shield Point Strategies. A real 3D building in the browser (three.js / WebGL): spin it, scan it,
   tap the red points, build the list of what you want walked, send it to Brian. Accelerated Experiences LLC. */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const $ = (s) => document.querySelector(s), $$ = (s) => [...document.querySelectorAll(s)];
const DATA = JSON.parse($('#wt-data').textContent);
const LAYER = Object.fromEntries(DATA.layers.map((l) => [l.id, l]));
const SPS = window.SPS || {}; const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const stage = $('#stage'), canvas = $('#gl'), markersEl = $('#markers');
let building = DATA.buildings[0], spots = [], sel = null, tourT = null, layersOn = new Set(DATA.layers.map((l) => l.id));
const picked = new Map(); // id -> {name, building}

function webgl() { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } }

/* ---------- the scene ---------- */
let renderer, scene, camera, controls, group, clock = new THREE.Clock();
const RED = new THREE.Color('#ff2a37');
if (webgl()) init(); else fallback();

function init() {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  scene = new THREE.Scene(); scene.fog = new THREE.Fog(0x040506, 70, 150);
  camera = new THREE.PerspectiveCamera(42, 1, 0.1, 400);
  controls = new OrbitControls(camera, canvas);
  Object.assign(controls, { enableDamping: true, dampingFactor: 0.08, maxPolarAngle: Math.PI * 0.46, minDistance: 18, maxDistance: 110, enablePan: false, autoRotate: !RM, autoRotateSpeed: 0.55 });
  scene.add(new THREE.AmbientLight(0x8890a0, 0.55));
  const key = new THREE.DirectionalLight(0xffffff, 1.0); key.position.set(30, 50, 20); scene.add(key);
  const glow = new THREE.PointLight(0xff2a37, 60, 90, 1.6); glow.position.set(0, 14, 0); scene.add(glow);
  const grid = new THREE.GridHelper(160, 80, 0x2a1014, 0x14181e); grid.position.y = -0.02; scene.add(grid);
  const ground = new THREE.Mesh(new THREE.CircleGeometry(80, 64), new THREE.MeshBasicMaterial({ color: 0x07090c, transparent: true, opacity: 0.9 }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -0.05; scene.add(ground);
  build(building); size(); addEventListener('resize', size);
  ['pointerdown', 'wheel'].forEach((ev) => canvas.addEventListener(ev, userTouched, { passive: true }));
  renderer.setAnimationLoop(frame);
}
function size() {
  const w = stage.clientWidth, h = stage.clientHeight; renderer.setSize(w, h, false); camera.aspect = w / h;
  camera.fov = w < 700 ? 52 : 40; camera.updateProjectionMatrix();
  if (!size.done) { const d = w < 700 ? 64 : 52; camera.position.set(d * 0.62, d * 0.62, d * 0.78); controls.target.set(0, 0, 0); size.done = true; }
}

function label(text) {
  const c = document.createElement('canvas'), g = c.getContext('2d'); c.width = 256; c.height = 64;
  g.font = '600 26px "IBM Plex Mono", monospace'; g.fillStyle = 'rgba(160,168,180,.9)'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text.toUpperCase(), 128, 32);
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }));
  sp.scale.set(6, 1.5, 1); return sp;
}

function build(b) {
  if (group) { scene.remove(group); group.traverse((o) => { o.geometry && o.geometry.dispose(); }); }
  group = new THREE.Group(); scene.add(group);
  const glass = new THREE.MeshStandardMaterial({ color: 0x1a1f27, transparent: true, opacity: 0.42, roughness: 0.2, metalness: 0.6, side: THREE.DoubleSide, depthWrite: false });
  const floorM = new THREE.MeshStandardMaterial({ color: 0x0e1217, roughness: 0.9 });
  const edgeM = new THREE.LineBasicMaterial({ color: 0xff2a37, transparent: true, opacity: 0.9 });
  const edgeDim = new THREE.LineBasicMaterial({ color: 0x59606b, transparent: true, opacity: 0.8 });
  const T = 0.22;
  b.rooms.forEach((r, i) => {
    const h = r.h || 3.2, cx = r.x + r.w / 2, cz = r.z + r.d / 2;
    const floor = new THREE.Mesh(new THREE.BoxGeometry(r.w - 0.1, 0.12, r.d - 0.1), floorM); floor.position.set(cx, 0.06, cz); group.add(floor);
    [[r.w, T, cx, r.z], [r.w, T, cx, r.z + r.d], [T, r.d, r.x, cz], [T, r.d, r.x + r.w, cz]].forEach(([w, d, x, z]) => {
      const g = new THREE.BoxGeometry(w, h, d), m = new THREE.Mesh(g, glass); m.position.set(x, h / 2, z); group.add(m);
      const e = new THREE.LineSegments(new THREE.EdgesGeometry(g), i === 0 || r.h ? edgeM : edgeDim); e.position.copy(m.position); group.add(e);
    });
    const lb = label(r.label); lb.position.set(cx, h + 1.1, cz); group.add(lb);
  });
  /* the red points */
  spots = b.spots.map((s) => {
    const g = new THREE.Group(); g.position.set(s.x, 0, s.z);
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.45, 20, 16), new THREE.MeshBasicMaterial({ color: RED })); core.position.y = 1.4; g.add(core);
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.35, 7, 12, 1, true), new THREE.MeshBasicMaterial({ color: RED, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false }));
    beam.position.y = 3.5; g.add(beam);
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.8, 1.05, 40), new THREE.MeshBasicMaterial({ color: RED, transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = 0.15; g.add(ring);
    group.add(g);
    const el = document.createElement('button'); el.className = 'mk hid'; el.type = 'button';
    el.setAttribute('aria-label', s.name + ' — ' + LAYER[s.layer].name + ' layer'); el.innerHTML = '<i></i><span>' + s.name + '</span>';
    el.addEventListener('click', (e) => { e.stopPropagation(); stopTour(); select(s.id); });
    markersEl.appendChild(el);
    return { ...s, g, ring, beam, el, shown: false };
  });
  markersEl.querySelectorAll('.mk').forEach((m) => { if (!spots.some((s) => s.el === m)) m.remove(); });
  applyLayers(); closePanel();
}

/* ---------- per frame ---------- */
const v = new THREE.Vector3();
let fly = null;
function frame() {
  const t = clock.getElapsedTime();
  if (fly) { const k = Math.min(1, (performance.now() - fly.t0) / fly.ms), e = 1 - Math.pow(1 - k, 3);
    controls.target.lerpVectors(fly.ft, fly.tt, e); camera.position.lerpVectors(fly.fp, fly.tp, e); if (k >= 1) fly = null; }
  if (tilt.on && !fly) applyTilt();
  controls.update();
  spots.forEach((s, i) => {
    const ph = (t * 0.7 + i * 0.37) % 1; s.ring.scale.setScalar(1 + ph * 1.8); s.ring.material.opacity = 0.8 * (1 - ph);
    s.beam.material.opacity = (sel === s.id ? 0.55 : 0.2) + Math.sin(t * 3 + i) * 0.05;
    v.set(s.x, 1.4, s.z).project(camera);
    const x = (v.x * 0.5 + 0.5) * stage.clientWidth, y = (-v.y * 0.5 + 0.5) * stage.clientHeight;
    s.el.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)';
    s.el.classList.toggle('behind', v.z > 1);
  });
  renderer.render(scene, camera);
}

/* ---------- scan: a red line sweeps the screen and lights each point as it passes ---------- */
function scan() {
  const line = $('#scanline'); spots.forEach((s) => { s.el.classList.add('hid'); s.shown = false; });
  line.classList.remove('go'); void line.offsetWidth; line.classList.add('go'); SPS.buzz && SPS.buzz(12);
  const W = stage.clientWidth, t0 = performance.now(), ms = RM ? 1 : 2400;
  (function tick() {
    const k = Math.min(1, (performance.now() - t0) / ms), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2, xLine = e * W;
    spots.forEach((s) => { if (s.shown) return; const r = new DOMMatrix(getComputedStyle(s.el).transform); if (r.m41 <= xLine) { s.shown = true; s.el.classList.remove('hid'); SPS.buzz && SPS.buzz(6); } });
    if (k < 1) requestAnimationFrame(tick); else spots.forEach((s) => { s.shown = true; s.el.classList.remove('hid'); });
  })();
}

/* ---------- select a point: fly to it, open the card ---------- */
function select(id) {
  const s = spots.find((x) => x.id === id); if (!s) return; sel = id; userTouched();
  spots.forEach((x) => x.el.classList.toggle('sel', x.id === id));
  const L = LAYER[s.layer];
  $('#pLayer').textContent = 'Layer ' + L.n + ' · ' + L.name; $('#pName').textContent = s.name; $('#pLook').textContent = s.look; $('#pFix').textContent = s.fix;
  $('#pAdd').textContent = picked.has(s.id) ? 'On your list ✓' : 'Add to my walkthrough';
  $('#listp').hidden = true; $('#panel').hidden = false;
  if (controls) {
    const off = camera.position.clone().sub(controls.target).setLength(stage.clientWidth < 700 ? 30 : 26);
    const tt = new THREE.Vector3(s.x, 1, s.z);
    fly = { t0: performance.now(), ms: RM ? 1 : 900, ft: controls.target.clone(), tt, fp: camera.position.clone(), tp: tt.clone().add(off) };
  }
}
function closePanel() { sel = null; $('#panel').hidden = true; spots.forEach((x) => x.el.classList.remove('sel')); }
function visible() { return spots.filter((s) => layersOn.has(s.layer)); }
function nextSpot() { const vs = visible(); if (!vs.length) return; const i = vs.findIndex((s) => s.id === sel); select(vs[(i + 1) % vs.length].id); }

/* ---------- tour: it walks you point to point on its own ---------- */
function startTour() { stopTour(); $('#bTour').classList.add('on'); let i = -1; const go = () => { const vs = visible(); if (!vs.length) return stopTour(); i = (i + 1) % vs.length; select(vs[i].id); SPS.speak && SPS.speak(vs[i].name + '. ' + vs[i].look, false); }; go(); tourT = setInterval(go, 5200); }
function stopTour() { if (tourT) { clearInterval(tourT); tourT = null; } $('#bTour').classList.remove('on'); }

/* ---------- layers ---------- */
function applyLayers() { spots.forEach((s) => { const on = layersOn.has(s.layer); s.g.visible = on; s.el.classList.toggle('dim', !on); }); }
$$('.layers button').forEach((b) => b.addEventListener('click', () => {
  const l = b.dataset.l; if (layersOn.has(l) && layersOn.size > 1) layersOn.delete(l); else layersOn.add(l);
  $$('.layers button').forEach((x) => x.setAttribute('aria-pressed', String(layersOn.has(x.dataset.l)))); applyLayers();
  if (sel && !layersOn.has(spots.find((s) => s.id === sel).layer)) closePanel();
}));

/* ---------- buildings ---------- */
$$('.bld button').forEach((b) => b.addEventListener('click', () => {
  const nb = DATA.buildings.find((x) => x.id === b.dataset.b); if (!nb || nb === building) return;
  building = nb; $$('.bld button').forEach((x) => x.setAttribute('aria-selected', String(x === b))); stopTour();
  if (controls) build(nb); else fallback(); setTimeout(scan, 200);
}));

/* ---------- your list → Brian ---------- */
$('#pAdd').addEventListener('click', () => { const s = spots.find((x) => x.id === sel); if (!s) return;
  if (picked.has(s.id)) picked.delete(s.id); else picked.set(s.id, { name: s.name, b: building.name });
  s.el.classList.toggle('added', picked.has(s.id)); $('#pAdd').textContent = picked.has(s.id) ? 'On your list ✓' : 'Add to my walkthrough'; SPS.buzz && SPS.buzz([10, 40, 10]); paintList(); });
function paintList() {
  $('#nList').textContent = picked.size; const items = [...picked.values()];
  $('#lItems').innerHTML = items.map((p) => '<li>' + SPS.esc(p.name) + ' <small style="color:var(--muted)">(' + SPS.esc(p.b) + ')</small></li>').join(''); $('#lEmpty').hidden = items.length > 0;
  const msg = 'Hi Brian — I walked the Shield Point 3D building and want a real walkthrough of ours. Points I want you to look at: ' + (items.length ? items.map((p) => p.name).join('; ') : '(not picked yet)') + '.';
  $('#lSms').href = 'sms:' + (SPS.sms || '') + '?&body=' + encodeURIComponent(msg); $('#lMail').href = 'mailto:' + (SPS.email || '') + '?subject=' + encodeURIComponent('Walkthrough request') + '&body=' + encodeURIComponent(msg);
}
$('#bList').addEventListener('click', () => { paintList(); $('#panel').hidden = true; $('#listp').hidden = !$('#listp').hidden; userTouched(); });
$('#lClose').addEventListener('click', () => { $('#listp').hidden = true; });
$('#pClose').addEventListener('click', closePanel); $('#pNext').addEventListener('click', () => { stopTour(); nextSpot(); });
$('#bScan').addEventListener('click', () => { stopTour(); scan(); userTouched(); });
$('#bTour').addEventListener('click', () => (tourT ? stopTour() : startTour()));

/* ---------- tilt the phone to look around ---------- */
const tilt = { on: false, g: 0, base: null };
if ('DeviceOrientationEvent' in window && matchMedia('(pointer:coarse)').matches) $('#bTilt').hidden = false;
$('#bTilt').addEventListener('click', async () => {
  if (tilt.on) { tilt.on = false; $('#bTilt').classList.remove('on'); return; }
  try { if (typeof DeviceOrientationEvent.requestPermission === 'function' && (await DeviceOrientationEvent.requestPermission()) !== 'granted') return; } catch (e) { return; }
  tilt.on = true; tilt.base = null; $('#bTilt').classList.add('on'); controls && (controls.autoRotate = false);
});
addEventListener('deviceorientation', (e) => { if (!tilt.on || e.gamma == null) return; tilt.g = e.gamma; });
const sph = new THREE.Spherical();
function applyTilt() { const off = camera.position.clone().sub(controls.target); sph.setFromVector3(off); if (tilt.base == null) tilt.base = sph.theta;
  sph.theta += ((tilt.base + (tilt.g / 40) * 0.9) - sph.theta) * 0.08; off.setFromSpherical(sph); camera.position.copy(controls.target).add(off); }

function userTouched() { if (controls) controls.autoRotate = false; $('#intro').classList.add('gone'); }

/* no WebGL: the same points as a list, still useful */
function fallback() {
  $('#intro').classList.add('gone'); stage.innerHTML = '<div class="fallback">' + building.spots.map((s) => '<button data-id="' + s.id + '"><b style="color:var(--accent);font:600 11px var(--fm);letter-spacing:.2em">' + LAYER[s.layer].name.toUpperCase() + '</b><br>' + SPS.esc(s.name) + '</button>').join('') + '</div>';
  spots = building.spots.map((s) => ({ ...s, el: document.createElement('i') }));
  stage.querySelectorAll('[data-id]').forEach((b) => b.addEventListener('click', () => select(b.dataset.id)));
}

/* first scan once the opening clears (or straight away when there is no opening) */
if ($('#open')) document.addEventListener('sps:opened', () => setTimeout(scan, 150), { once: true }); else setTimeout(scan, 500);
setTimeout(() => { if (spots.some((s) => s.el.classList && s.el.classList.contains('hid'))) scan(); }, 3200);

// Scroll-driven homepage intro: the Loot Lab badge is a window onto a game
// world that builds itself (wireframe, materials, life, lighting) as you scroll.
import * as THREE from 'three';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
if (reduce) document.documentElement.classList.add('static');

const $ = (id) => document.getElementById(id);
const intro = $('intro'), glCanvas = $('gl'), knock = $('knock'), kctx = knock.getContext('2d');
const hud = $('hud'), editor = $('editor'), meter = $('meter');
const caps = [...document.querySelectorAll('[data-cap]')].map((el) => ({ el, r: el.dataset.cap.split(',').map(Number) }));
const stepEls = [...document.querySelectorAll('#steps li')];

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const range = (v, a, b) => clamp((v - a) / (b - a));
const ease = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const lerp = (a, b, t) => a + (b - a) * t;

// Scroll timeline (fractions of the pinned intro).
const T = { zoom: [0.06, 0.31], rise: [0.0, 0.26], mat: [0.47, 0.62], life: [0.62, 0.76], light: [0.76, 0.9] };

/* ---------------- 3D world ---------------- */
const renderer = new THREE.WebGLRenderer({ canvas: glCanvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, innerWidth < 900 ? 1.5 : 1.75));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const INK = new THREE.Color('#0f1424'), DUSK = new THREE.Color('#24365f'), GOLDEN = new THREE.Color('#4b3f7d');
scene.background = INK.clone();
scene.fog = new THREE.Fog(INK.clone(), 40, 120);
const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 400);

// Deterministic value noise so the island is identical on every visit.
const hash = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };
const smooth = (t) => t * t * (3 - 2 * t);
function noise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
  const u = smooth(xf), v = smooth(yf);
  return lerp(lerp(a, b, u), lerp(c, d, u), v);
}
const fbm = (x, y) => { let v = 0, amp = .5, f = 1; for (let o = 0; o < 5; o++) { v += noise(x * f + 11, y * f + 7) * amp; amp *= .5; f *= 2.03; } return v; };
const SIZE = 44, SEG = 110;
function heightAt(x, z) {
  const r = Math.hypot(x * 0.95, z * 1.1) / (SIZE * 0.42);
  const fall = Math.pow(clamp(1 - r), 1.3);
  const ridge = Math.pow(fbm(x * 0.07, z * 0.07), 1.6);
  return (ridge * 14 + 0.6) * fall - 1.1;
}

// Flat-shaded terrain: non-indexed so every face gets its own colour.
const base = new THREE.PlaneGeometry(SIZE, SIZE, SEG, SEG).toNonIndexed();
base.rotateX(-Math.PI / 2);
const pos = base.attributes.position;
for (let i = 0; i < pos.count; i++) pos.setY(i, heightAt(pos.getX(i), pos.getZ(i)));
base.computeVertexNormals();
const faceColor = new Float32Array(pos.count * 3);
const faceDist = new Float32Array(pos.count);
const SAND = new THREE.Color('#e9d49b'), GRASS = new THREE.Color('#5cb85a'), GRASS2 = new THREE.Color('#3f9a4f'), ROCK = new THREE.Color('#8b90a3'), SNOW = new THREE.Color('#f3f5fb'), SEABED = new THREE.Color('#2c4a6e');
for (let f = 0; f < pos.count; f += 3) {
  let h = 0, cx = 0, cz = 0;
  for (let k = 0; k < 3; k++) { h += pos.getY(f + k); cx += pos.getX(f + k); cz += pos.getZ(f + k); }
  h /= 3; cx /= 3; cz /= 3;
  const c = h < -0.3 ? SEABED : h < 0.35 ? SAND : h < 3.2 ? (hash(cx, cz) > .5 ? GRASS : GRASS2) : h < 6.2 ? ROCK : SNOW;
  const d = Math.hypot(cx, cz);
  for (let k = 0; k < 3; k++) { faceColor.set([c.r, c.g, c.b], (f + k) * 3); faceDist[f + k] = d; }
}
const colors = new Float32Array(pos.count * 3);
base.setAttribute('color', new THREE.BufferAttribute(colors, 3));

const terrain = new THREE.Group();
const solid = new THREE.Mesh(base, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: .92, metalness: 0, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 }));
const wireMat = new THREE.MeshBasicMaterial({ color: '#3fe0c5', wireframe: true, transparent: true, opacity: .45 });
const wire = new THREE.Mesh(base, wireMat);
terrain.add(solid, wire);
scene.add(terrain);

const grid = new THREE.GridHelper(220, 110, '#3fe0c5', '#2a3a66');
grid.material.transparent = true; grid.material.opacity = .35;
grid.position.y = -1.12;
scene.add(grid);

// Expanding scan ring that paints materials across the terrain.
const ring = new THREE.Mesh(new THREE.RingGeometry(0.98, 1, 128), new THREE.MeshBasicMaterial({ color: '#3fe0c5', transparent: true, opacity: .9, side: THREE.DoubleSide }));
ring.rotation.x = -Math.PI / 2; ring.position.y = 0.2;
scene.add(ring);

// Editor gizmo and selection box.
const gizmo = new THREE.Group();
const axis = (dir, color) => new THREE.ArrowHelper(dir, new THREE.Vector3(), 5, color, 1.1, .6);
gizmo.add(axis(new THREE.Vector3(1, 0, 0), '#ff5a6a'), axis(new THREE.Vector3(0, 1, 0), '#7be37b'), axis(new THREE.Vector3(0, 0, 1), '#5aa9ff'));
gizmo.position.set(0, heightAt(0, 0) + 1.5, 0);
scene.add(gizmo);
const box = new THREE.Box3(new THREE.Vector3(-SIZE * .42, -1.2, -SIZE * .38), new THREE.Vector3(SIZE * .42, 10, SIZE * .38));
const selection = new THREE.Box3Helper(box, '#3fe0c5');
selection.material.transparent = true;
scene.add(selection);

// Water.
const water = new THREE.Mesh(new THREE.PlaneGeometry(400, 400, 1, 1), new THREE.MeshStandardMaterial({ color: '#2f86d6', roughness: .25, metalness: .2, transparent: true, opacity: .82 }));
water.rotation.x = -Math.PI / 2;
scene.add(water);

// Trees and loot crates, placed deterministically on suitable ground.
const spots = [];
for (let i = 0; i < 4000 && spots.length < 170; i++) {
  const x = (hash(i, 1.3) - .5) * SIZE * .8, z = (hash(i, 7.7) - .5) * SIZE * .8, h = heightAt(x, z);
  if (h > 0.55 && h < 3.4 && hash(i, 3.1) > .35) spots.push({ x, z, h, d: Math.hypot(x, z), s: .7 + hash(i, 9.2) * .7, r: hash(i, 4.4) * 6.28 });
}
const treeGeo = new THREE.ConeGeometry(.55, 1.7, 6); treeGeo.translate(0, 1.25, 0);
const trunkGeo = new THREE.CylinderGeometry(.12, .16, .5, 5); trunkGeo.translate(0, .25, 0);
const trees = new THREE.InstancedMesh(treeGeo, new THREE.MeshStandardMaterial({ color: '#2f8a45', flatShading: true, roughness: .9 }), spots.length);
const trunks = new THREE.InstancedMesh(trunkGeo, new THREE.MeshStandardMaterial({ color: '#7a5434', flatShading: true }), spots.length);
scene.add(trees, trunks);
const crateSpots = [[-6, 4], [7, -3], [2, 8], [-9, -6], [11, 5], [-2, -10]].map(([x, z]) => ({ x, z, h: Math.max(heightAt(x, z), 0.2) }));
const crateMat = new THREE.MeshStandardMaterial({ color: '#ffc83d', emissive: '#ffb21a', emissiveIntensity: 0, roughness: .5 });
const crates = crateSpots.map((c) => { const m = new THREE.Mesh(new THREE.BoxGeometry(.9, .9, .9), crateMat); scene.add(m); return m; });
const crateLights = crateSpots.slice(0, 3).map(() => { const l = new THREE.PointLight('#ffbf47', 0, 9, 2); scene.add(l); return l; });

const hemi = new THREE.HemisphereLight('#bcd2ff', '#20263a', .25);
const sun = new THREE.DirectionalLight('#ffffff', .3);
sun.position.set(-20, 30, 10);
scene.add(hemi, sun);

const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), v3 = new THREE.Vector3(), sc = new THREE.Vector3();
let lastMat = -1;
function updateWorld(p, time) {
  // Starts part-raised so peaks already show through the title letters.
  const rise = lerp(0.4, 1, ease(range(p, ...T.rise)));
  const mat = range(p, ...T.mat);
  const life = range(p, ...T.life);
  const light = ease(range(p, ...T.light));

  terrain.scale.y = Math.max(0.02, rise);
  terrain.position.y = (1 - rise) * -1.1;

  // Paint faces as the scan ring passes.
  const R = mat * SIZE * 0.62;
  if (Math.abs(R - lastMat) > 0.01) {
    for (let i = 0; i < pos.count; i++) {
      const t = clamp((R - faceDist[i]) / 2.5);
      colors[i * 3] = lerp(0.07, faceColor[i * 3], t);
      colors[i * 3 + 1] = lerp(0.09, faceColor[i * 3 + 1], t);
      colors[i * 3 + 2] = lerp(0.16, faceColor[i * 3 + 2], t);
    }
    base.attributes.color.needsUpdate = true;
    lastMat = R;
  }
  ring.scale.setScalar(Math.max(R, 0.01));
  ring.material.opacity = mat > 0 && mat < 1 ? .9 : 0;
  wireMat.opacity = .45 * (1 - ease(range(p, T.mat[0] + .04, T.mat[1] + .02))) + .02;
  gizmo.scale.setScalar(Math.max(0.001, rise * (1 - range(p, T.mat[0], T.mat[0] + .06))));
  gizmo.rotation.y = time * .25;
  selection.material.opacity = rise * (1 - range(p, T.mat[0], T.mat[0] + .06));
  selection.visible = selection.material.opacity > .01;
  grid.material.opacity = .35 * (1 - range(p, T.life[0], T.life[0] + .06));

  water.position.y = lerp(-2.2, 0.05, ease(range(p, T.life[0], T.life[0] + .07))) + Math.sin(time * .8) * .03;
  water.visible = p > T.life[0];

  spots.forEach((s, i) => {
    const g = easeOut(clamp(life * 1.5 - (s.d / (SIZE * .45)) * .5));
    q.setFromAxisAngle(v3.set(0, 1, 0), s.r);
    sc.setScalar(Math.max(0.0001, g * s.s));
    m4.compose(v3.set(s.x, s.h * rise - .15, s.z), q, sc);
    trees.setMatrixAt(i, m4); trunks.setMatrixAt(i, m4);
  });
  trees.instanceMatrix.needsUpdate = true; trunks.instanceMatrix.needsUpdate = true;

  crates.forEach((m, i) => {
    const c = crateSpots[i];
    const g = easeOut(clamp(life * 1.4 - .3 - i * .06));
    m.scale.setScalar(Math.max(0.0001, g));
    m.position.set(c.x, c.h * rise + .55 + Math.sin(time * 1.6 + i) * .12 * g, c.z);
    m.rotation.y = time * .6 + i;
  });
  crateMat.emissiveIntensity = .15 + light * 1.4;
  crateLights.forEach((l, i) => { const c = crateSpots[i]; l.position.set(c.x, c.h + 1.4, c.z); l.intensity = light * 14; });

  hemi.intensity = lerp(.25, .55, ease(mat)) + light * .5;
  sun.intensity = lerp(.3, 1.4, ease(mat)) + light * 1.4;
  sun.color.set('#ffffff').lerp(new THREE.Color('#ffd0a0'), light);
  sun.position.set(lerp(-20, 26, light), lerp(30, 12, light), lerp(10, -14, light));
  const bg = INK.clone().lerp(DUSK, ease(range(p, T.mat[0], T.life[1]))).lerp(GOLDEN, light * .8);
  scene.background.copy(bg); scene.fog.color.copy(bg);

  // Camera: from a steep editor view down to a low hero angle.
  const tilt = ease(range(p, 0.2, 0.95));
  const ang = lerp(0.55, 2.25, ease(p)) + Math.sin(time * .15) * .02;
  const narrow = camera.aspect < 0.8;
  const rad = lerp(40, 31, tilt) * (narrow ? lerp(1.2, 1.9, tilt) : 1);
  const hgt = narrow ? lerp(40, 17, tilt) : lerp(34, 9, tilt);
  camera.position.set(Math.cos(ang) * rad, hgt, Math.sin(ang) * rad);
  camera.lookAt(0, lerp(0, 2.2, tilt), 0);

  const ents = Math.round(spots.length * clamp(life * 1.5)) + crates.filter((m) => m.scale.x > .01).length;
  return { tris: Math.round((pos.count / 3) * clamp(rise * 4)), ents, lights: 2 + (light > .02 ? crateLights.length : 0), build: Math.round(p * 100) };
}

/* ---------------- Logo window ---------------- */
// The Loot Lab badge is cut out of a dark, softly lit backdrop, so the world
// being built shows through it. Scrolling zooms into the badge's largest solid
// area until that window fills the screen.
const logo = new Image();
logo.src = '/brand/lootlab-logo-window.webp';
let W = 0, H = 0, dpr = 1, lr = { x: 0, y: 0, w: 0, h: 0 }, oc = { x: 0, y: 0 }, maxScale = 40;
let target = { u: .5, v: .5, r: .05 }; // zoom target in logo-normalised coordinates, r = inscribed radius / logo width
let halo = null;

function analyseLogo() {
  // Distance transform on a small copy of the alpha channel: the pixel furthest from
  // any transparent pixel is the centre of the largest solid area to zoom through.
  const sw = 160, sh = Math.round(sw * logo.naturalHeight / logo.naturalWidth);
  const c = document.createElement('canvas'); c.width = sw; c.height = sh;
  const x = c.getContext('2d', { willReadFrequently: true });
  x.drawImage(logo, 0, 0, sw, sh);
  const a = x.getImageData(0, 0, sw, sh).data;
  const INF = 1e9, d = new Float32Array(sw * sh);
  for (let i = 0; i < sw * sh; i++) d[i] = a[i * 4 + 3] > 200 ? INF : 0;
  const at = (i, j) => (i < 0 || j < 0 || i >= sw || j >= sh ? 0 : d[j * sw + i]);
  for (let j = 0; j < sh; j++) for (let i = 0; i < sw; i++) {
    const k = j * sw + i; if (!d[k]) continue;
    d[k] = Math.min(d[k], at(i - 1, j) + 1, at(i, j - 1) + 1, at(i - 1, j - 1) + 1.414, at(i + 1, j - 1) + 1.414);
  }
  let best = 0, bi = 0;
  for (let j = sh - 1; j >= 0; j--) for (let i = sw - 1; i >= 0; i--) {
    const k = j * sw + i; if (!d[k]) continue;
    d[k] = Math.min(d[k], at(i + 1, j) + 1, at(i, j + 1) + 1, at(i + 1, j + 1) + 1.414, at(i - 1, j + 1) + 1.414);
    if (d[k] > best) { best = d[k]; bi = k; }
  }
  target = { u: ((bi % sw) + .5) / sw, v: (Math.floor(bi / sw) + .5) / sh, r: best / sw };

  // Teal halo: a blurred, tinted copy of the badge drawn behind the cut-out.
  const hw = 420, hh = Math.round(hw * logo.naturalHeight / logo.naturalWidth), pad = 90;
  halo = document.createElement('canvas'); halo.width = hw + pad * 2; halo.height = hh + pad * 2;
  const hx = halo.getContext('2d');
  hx.filter = 'blur(28px)';
  hx.drawImage(logo, pad, pad, hw, hh);
  hx.filter = 'none';
  hx.globalCompositeOperation = 'source-in';
  hx.fillStyle = '#3fe0c5';
  hx.fillRect(0, 0, halo.width, halo.height);
  halo.pad = pad / hw;
}

// Four-point sparkles, echoing the stars in the badge.
const sparkles = Array.from({ length: 70 }, (_, i) => ({
  x: (hash(i, 2.1) - .5) * 2.2, y: (hash(i, 5.3) - .5) * 2.2, z: .35 + hash(i, 8.9) * .65,
  tw: hash(i, 1.7) * 6.28, sp: .6 + hash(i, 3.3) * 1.4,
}));

function layout() {
  dpr = Math.min(devicePixelRatio || 1, 2);
  W = innerWidth; H = intro.querySelector('.stage').clientHeight;
  knock.width = Math.round(W * dpr); knock.height = Math.round(H * dpr);
  renderer.setSize(W, H, false);
  camera.aspect = W / H; camera.fov = W / H < 0.8 ? 52 : 40; camera.updateProjectionMatrix();
  const ar = logo.naturalWidth / logo.naturalHeight;
  const h = Math.min(H * 0.6, (W * 0.72) / ar);
  lr = { w: h * ar, h, x: (W - h * ar) / 2, y: H * 0.45 - h / 2 };
  oc = { x: lr.x + target.u * lr.w, y: lr.y + target.v * lr.h };
  maxScale = (1.15 * Math.hypot(W, H) / 2) / Math.max(target.r * lr.w, 1);
}

let mx = .5, my = .4, tmx = .5, tmy = .4;
addEventListener('pointermove', (e) => { tmx = e.clientX / innerWidth; tmy = e.clientY / innerHeight; }, { passive: true });

function star(k, x, y, s, a) {
  k.globalAlpha = a;
  k.beginPath();
  k.moveTo(x, y - s); k.quadraticCurveTo(x, y, x + s, y); k.quadraticCurveTo(x, y, x, y + s);
  k.quadraticCurveTo(x, y, x - s, y); k.quadraticCurveTo(x, y, x, y - s);
  k.fill();
}

function drawKnock(z, time, wipe) {
  const k = kctx;
  k.setTransform(dpr, 0, 0, dpr, 0, 0);
  k.globalCompositeOperation = 'source-over';
  k.globalAlpha = 1;
  k.fillStyle = '#0b0f1c';
  k.fillRect(0, 0, W, H);

  // Slow aurora of teal and violet light.
  const glow = (cx, cy, r, col) => { const g = k.createRadialGradient(cx, cy, 0, cx, cy, r); g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)'); k.fillStyle = g; k.fillRect(0, 0, W, H); };
  const R = Math.max(W, H);
  glow(W * (.28 + Math.sin(time * .11) * .06), H * (.3 + Math.cos(time * .13) * .05), R * .55, 'rgba(63,224,197,0.10)');
  glow(W * (.74 + Math.cos(time * .09) * .06), H * (.68 + Math.sin(time * .12) * .05), R * .6, 'rgba(120,96,230,0.13)');
  glow(mx * W, my * H, R * .3, 'rgba(63,224,197,0.07)');

  const e = ease(z);
  const s = Math.pow(maxScale, e);
  k.save();
  k.translate(lerp(oc.x, W / 2, e), lerp(oc.y, H / 2, e)); k.scale(s, s); k.translate(-oc.x, -oc.y);
  // Breathing halo behind the badge.
  if (halo) {
    k.globalAlpha = (.42 + Math.sin(time * 1.2) * .1) * (1 - e);
    const p = halo.pad;
    k.drawImage(halo, lr.x - p * lr.w, lr.y - p * lr.w, lr.w * (1 + 2 * p), lr.h + 2 * p * lr.w);
    k.globalAlpha = 1;
  }
  k.globalCompositeOperation = 'destination-out';
  k.imageSmoothingQuality = 'high';
  k.drawImage(logo, lr.x, lr.y, lr.w, lr.h);
  // Faint glass tint so the badge always reads, whatever the world behind it shows.
  k.globalCompositeOperation = 'source-over';
  k.globalAlpha = .16 * (1 - e);
  k.drawImage(logo, lr.x, lr.y, lr.w, lr.h);
  k.globalAlpha = 1;
  // At rest the badge is plain white. As scrolling starts, a scan line sweeps down
  // it and turns everything above the line into the prototype view.
  if (wipe < 1) {
    const yLine = lr.y - lr.h * 0.04 + lr.h * 1.08 * ease(wipe);
    k.save();
    k.beginPath(); k.rect(lr.x - lr.w, yLine, lr.w * 3, lr.h * 2); k.clip();
    k.drawImage(logo, lr.x, lr.y, lr.w, lr.h);
    k.restore();
    if (wipe > 0) {
      k.save();
      k.shadowColor = 'rgba(63,224,197,0.9)'; k.shadowBlur = 18;
      k.fillStyle = '#c9fff5';
      k.fillRect(lr.x - lr.w * .08, yLine - 1 / s, lr.w * 1.16, 2 / s);
      k.restore();
    }
  }
  k.restore();

  // Sparkles drift and fly past as we zoom in.
  k.globalCompositeOperation = 'source-over';
  k.fillStyle = '#eafffb';
  const cx = W / 2, cy = H * .45;
  for (const p of sparkles) {
    const push = 1 + e * 6 / p.z;
    const x = cx + (p.x * W * .5 + Math.sin(time * .2 * p.sp + p.tw) * 12) * push;
    const y = cy + (p.y * H * .5 + Math.cos(time * .17 * p.sp + p.tw) * 10) * push;
    const tw = .35 + .65 * Math.max(0, Math.sin(time * p.sp + p.tw));
    star(k, x, y, (2 + 5 * p.z) * (1 + e * 3), tw * .55 * p.z * (1 - e * .6));
  }
  k.globalAlpha = 1;
}


/* ---------------- Loop ---------------- */
let sp = 0;
const statEls = { tris: $('sTris'), ents: $('sEnt'), lights: $('sLights'), build: $('sBuild') };
function progress() {
  const r = intro.getBoundingClientRect();
  return clamp(-r.top / (intro.offsetHeight - innerHeight));
}
const clock = new THREE.Clock();
function frame() {
  const target = reduce ? 1 : progress();
  sp += (target - sp) * 0.12;
  if (Math.abs(target - sp) < 0.0003) sp = target;
  mx += (tmx - mx) * 0.08; my += (tmy - my) * 0.08;
  const time = reduce ? 0 : clock.getElapsedTime();

  const inView = intro.getBoundingClientRect().bottom > 0;
  if (inView) {
    const stats = updateWorld(sp, time);
    renderer.render(scene, camera);
    const z = reduce ? 1 : range(sp, ...T.zoom);
    if (z < 1) drawKnock(z, time, reduce ? 1 : range(sp, 0.004, 0.085));
    knock.style.opacity = String(1 - range(z, 0.86, 1));
    knock.style.visibility = z >= 1 ? 'hidden' : 'visible';
    hud.style.opacity = String(1 - range(sp, 0.02, 0.1));
    editor.style.opacity = String(range(sp, 0.27, 0.32) * (1 - range(sp, 0.86, 0.9)));
    const stage = sp < T.mat[0] ? 0 : sp < T.life[0] ? 1 : sp < T.light[0] ? 2 : sp < 0.9 ? 3 : 4;
    stepEls.forEach((li, i) => { li.classList.toggle('on', i === stage); li.classList.toggle('done', i < stage); });
    statEls.tris.textContent = stats.tris.toLocaleString();
    statEls.ents.textContent = stats.ents;
    statEls.lights.textContent = stats.lights;
    statEls.build.textContent = stats.build + '%';
    for (const c of caps) {
      const [a, b, d, e] = c.r;
      const o = reduce ? (c.el.id === 'finale' ? 1 : 0) : range(sp, a, b) * (1 - range(sp, d, e));
      c.el.style.opacity = o;
      c.el.style.transform = `translateY(${(1 - o) * 22}px)`;
      c.el.classList.toggle('on', o > .5);
    }
    meter.style.transform = `scaleX(${sp})`;
  }
  requestAnimationFrame(frame);
}

addEventListener('resize', layout);
logo.decode().catch(() => {}).finally(() => { analyseLogo(); layout(); requestAnimationFrame(frame); });

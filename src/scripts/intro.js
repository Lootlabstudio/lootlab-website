// Scroll-driven homepage intro: the Loot Lab badge is a window onto a 3D
// workshop where a treasure chest is made from nothing (blockout, model,
// texture, animation, VFX) and finally lands in a mobile game on an iPhone.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

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
const easeOutBack = (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
const lerp = (a, b, t) => a + (b - a) * t;
const hash = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };

// Scroll timeline (fractions of the pinned intro).
const T = {
  zoom: [0.06, 0.31],   // through the badge
  block: [0.0, 0.28],   // blockout cube grows
  model: [0.33, 0.47],  // detailed parts snap in
  tex: [0.49, 0.61],    // materials sweep up the model
  anim: [0.63, 0.775],  // squash-and-stretch jiggle
  open: [0.785, 0.83],  // lid pops open
  vfx: [0.785, 0.9],    // coins, light and sparkles
  phone: [0.86, 0.95],  // the chest lands in the game on an iPhone
};

/* ---------------- Renderer and scene ---------------- */
const renderer = new THREE.WebGLRenderer({ canvas: glCanvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, innerWidth < 900 ? 2 : 1.75));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.localClippingEnabled = true;

const scene = new THREE.Scene();
const INK = new THREE.Color('#0b0f1c'), WARM = new THREE.Color('#1c1430'), DUSK = new THREE.Color('#141a33');
scene.background = INK.clone();
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.75;
const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 200);

const hemi = new THREE.HemisphereLight('#c9d6ff', '#2a1c14', .55);
const key = new THREE.DirectionalLight('#fff1dc', 2.3); key.position.set(4, 6, 5);
const rim = new THREE.DirectionalLight('#5fe3ff', 1.4); rim.position.set(-5, 3, -4);
scene.add(hemi, key, rim);

function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return t;
}
// Hand-painted style wood planks with grain; `vertical` runs the planks along the lid.
function woodPlanks(vertical) {
  return canvasTex(512, 512, (g, w, h) => {
    const n = 4, L = vertical ? w : h, M = vertical ? h : w;
    for (let i = 0; i < n; i++) {
      const tone = .82 + hash(i, vertical ? 3 : 1) * .3;
      g.fillStyle = `rgb(${Math.round(156 * tone)},${Math.round(90 * tone)},${Math.round(46 * tone)})`;
      vertical ? g.fillRect(i * w / n, 0, w / n, h) : g.fillRect(0, i * h / n, w, h / n);
    }
    g.lineWidth = 1.6;
    for (let k = 0; k < 150; k++) {
      const o = hash(k, 7.3) * L;
      g.strokeStyle = `rgba(70,32,12,${.1 + hash(k, 2.2) * .2})`;
      g.beginPath();
      for (let s = 0; s <= 32; s++) {
        const a = s / 32 * M, b = o + Math.sin(s * .5 + k) * 2.5 + Math.sin(s * .13 + k * 3) * 6;
        vertical ? (s ? g.lineTo(b, a) : g.moveTo(b, a)) : (s ? g.lineTo(a, b) : g.moveTo(a, b));
      }
      g.stroke();
    }
    g.fillStyle = 'rgba(38,16,6,.9)';
    for (let i = 0; i <= n; i++) vertical ? g.fillRect(i * w / n - 4, 0, 8, h) : g.fillRect(0, i * h / n - 4, w, 8);
  });
}
const radial = (inner, outer) => canvasTex(128, 128, (g, w) => {
  const gr = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
  gr.addColorStop(0, inner); gr.addColorStop(1, outer);
  g.fillStyle = gr; g.fillRect(0, 0, w, w);
});
const starTex = canvasTex(64, 64, (g) => {
  g.fillStyle = '#fff'; g.beginPath();
  g.moveTo(32, 0); g.quadraticCurveTo(32, 32, 64, 32); g.quadraticCurveTo(32, 32, 32, 64);
  g.quadraticCurveTo(32, 32, 0, 32); g.quadraticCurveTo(32, 32, 32, 0); g.fill();
});

/* ---------------- The chest ---------------- */
const CW = 2.6, CH = 1.3, CD = 1.7, R = CD / 2;
const chest = new THREE.Group(); scene.add(chest);       // placement in the world
const rig = new THREE.Group(); chest.add(rig);           // squash and stretch
const lidPivot = new THREE.Group(); lidPivot.position.set(0, CH, -R); rig.add(lidPivot);
const lid = new THREE.Group(); lid.position.set(0, 0, R); lidPivot.add(lid);

// Materials are revealed by a plane sweeping upwards: solid below it, wireframe above.
const solidPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), -10);
const wirePlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 10);
const clip = { clippingPlanes: [solidPlane] };
const woodMat = new THREE.MeshStandardMaterial({ map: woodPlanks(false), roughness: .8, ...clip });
const lidWoodMat = new THREE.MeshStandardMaterial({ map: woodPlanks(true), roughness: .8, side: THREE.DoubleSide, ...clip });
const innerMat = new THREE.MeshStandardMaterial({ color: '#2b160a', roughness: .95, ...clip });
const goldMat = new THREE.MeshStandardMaterial({ color: '#ffc451', metalness: 1, roughness: .27, side: THREE.DoubleSide, ...clip });
const darkMat = new THREE.MeshStandardMaterial({ color: '#140a04', roughness: .6, ...clip });
const wireMat = new THREE.MeshBasicMaterial({ color: '#3fe0c5', wireframe: true, transparent: true, opacity: .55, depthWrite: false, clippingPlanes: [wirePlane] });

const parts = [];
function part(geo, mat, parent, order, pos = [0, 0, 0], rot = [0, 0, 0]) {
  const g = new THREE.Group(); g.position.set(...pos); g.rotation.set(...rot); parent.add(g);
  g.add(new THREE.Mesh(geo, mat), new THREE.Mesh(geo, wireMat));
  const tris = (geo.index ? geo.index.count : geo.attributes.position.count) / 3;
  parts.push({ g, order, tris });
}
const lidShell = (r, len, segs = 40) => { const g = new THREE.CylinderGeometry(r, r, len, segs, 4, true, 0, Math.PI); g.rotateZ(Math.PI / 2); return g; };
const halfDisc = (side) => { const g = new THREE.CircleGeometry(R, 40, 0, Math.PI); g.rotateY(side * Math.PI / 2); return g; };

// 0: body and lid
part(new THREE.BoxGeometry(CW, CH, CD, 4, 3, 3), [woodMat, woodMat, innerMat, woodMat, woodMat, woodMat], rig, 0, [0, CH / 2, 0]);
part(lidShell(R, CW), lidWoodMat, lid, 0);
part(halfDisc(1), lidWoodMat, lid, 0, [CW / 2, 0, 0]);
part(halfDisc(-1), lidWoodMat, lid, 0, [-CW / 2, 0, 0]);
// 1: metal straps over body and lid
for (const x of [-0.78, 0.78]) {
  part(new THREE.BoxGeometry(.22, CH, .05), goldMat, rig, 1, [x, CH / 2, R + .025]);
  part(new THREE.BoxGeometry(.22, CH, .05), goldMat, rig, 1, [x, CH / 2, -R - .025]);
  part(lidShell(R + .03, .22), goldMat, lid, 1, [x, 0, 0]);
}
// 2: rims and corner caps
for (const y of [.07, CH - .06]) {
  part(new THREE.BoxGeometry(CW + .06, .12, .06), goldMat, rig, 2, [0, y, R + .03]);
  part(new THREE.BoxGeometry(CW + .06, .12, .06), goldMat, rig, 2, [0, y, -R - .03]);
  part(new THREE.BoxGeometry(.06, .12, CD + .06), goldMat, rig, 2, [CW / 2 + .03, y, 0]);
  part(new THREE.BoxGeometry(.06, .12, CD + .06), goldMat, rig, 2, [-CW / 2 - .03, y, 0]);
}
for (const x of [-1, 1]) for (const z of [-1, 1]) part(new THREE.BoxGeometry(.14, CH + .02, .14), goldMat, rig, 2, [x * CW / 2, CH / 2, z * R]);
part(new THREE.BoxGeometry(CW + .06, .1, .07), goldMat, lid, 2, [0, .05, R + .02]);
// 3: lock and hasp
part(new THREE.BoxGeometry(.46, .52, .09), goldMat, rig, 3, [0, CH - .2, R + .06]);
part(new THREE.CylinderGeometry(.06, .06, .03, 20).rotateX(Math.PI / 2), darkMat, rig, 3, [0, CH - .14, R + .11]);
part(new THREE.BoxGeometry(.05, .12, .03), darkMat, rig, 3, [0, CH - .23, R + .11]);
part(new THREE.BoxGeometry(.26, .32, .07), goldMat, lid, 3, [0, .13, R + .04]);
const chestTris = parts.reduce((s, p) => s + p.tris, 0);

// Treasure inside: a mound of coins and a few gems.
const coinGeo = new THREE.CylinderGeometry(.15, .15, .04, 24);
const coinMat = new THREE.MeshStandardMaterial({ color: '#ffcb4a', metalness: 1, roughness: .22, emissive: '#ff9a1a', emissiveIntensity: .12 });
const treasure = new THREE.Group(); rig.add(treasure);
const PILE = 110, pile = new THREE.InstancedMesh(coinGeo, coinMat, PILE);
const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e3 = new THREE.Euler(), v3 = new THREE.Vector3(), sc = new THREE.Vector3();
for (let i = 0; i < PILE; i++) {
  const x = (hash(i, 1.1) - .5) * (CW - .4), z = (hash(i, 2.7) - .5) * (CD - .35);
  const mound = .38 * Math.max(0, 1 - (x / 1.25) ** 2 - (z / .8) ** 2);
  e3.set((hash(i, 3.3) - .5) * .9, hash(i, 4.4) * 6.28, (hash(i, 5.5) - .5) * .9);
  m4.compose(v3.set(x, CH + .02 + mound * hash(i, 6.6), z), q.setFromEuler(e3), sc.set(1, 1, 1));
  pile.setMatrixAt(i, m4);
}
treasure.add(pile);
const gemMat = (c) => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: .45, metalness: .1, roughness: .1, flatShading: true });
[[-.55, .2, '#3fe0c5', .2], [.5, -.15, '#9b7bff', .17], [.05, .25, '#ff5d8f', .14], [.85, .3, '#3fe0c5', .12]].forEach(([x, z, c, s], i) => {
  const gem = new THREE.Mesh(new THREE.OctahedronGeometry(s), gemMat(c));
  gem.position.set(x, CH + .3, z); gem.rotation.set(.3 * i, i, .2); gem.scale.y = 1.4;
  treasure.add(gem);
});

// Light from inside the chest.
const glowLight = new THREE.PointLight('#ffbf47', 0, 7, 2); glowLight.position.set(0, CH + .6, 0); rig.add(glowLight);
const glowSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: radial('rgba(255,214,120,1)', 'rgba(255,170,40,0)'), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0 }));
glowSprite.position.set(0, CH + .5, 0); glowSprite.scale.set(4.2, 3.4, 1); rig.add(glowSprite);
const beamAlpha = canvasTex(4, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#000'); gr.addColorStop(1, '#fff'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
const beam = new THREE.Mesh(new THREE.CylinderGeometry(1.35, .95, 3.6, 48, 1, true), new THREE.MeshBasicMaterial({ color: '#ffd27a', alphaMap: beamAlpha, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
beam.position.set(0, CH + 1.85, 0); rig.add(beam);

// Sparkles around the open chest.
const sparkGeo = new THREE.BufferGeometry();
const SPARKS = 150, sp3 = new Float32Array(SPARKS * 3);
for (let i = 0; i < SPARKS; i++) {
  const a = hash(i, 9.1) * 6.28, r = 1.2 + hash(i, 8.2) * 2.4;
  sp3.set([Math.cos(a) * r, .3 + hash(i, 7.3) * 3.6, Math.sin(a) * r], i * 3);
}
sparkGeo.setAttribute('position', new THREE.BufferAttribute(sp3, 3));
const sparkMat = new THREE.PointsMaterial({ map: starTex, color: '#ffe3a1', size: .16, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
const sparks = new THREE.Points(sparkGeo, sparkMat); chest.add(sparks);

// Coins that burst out when the lid pops (in world space).
const BURST = 42, burst = new THREE.InstancedMesh(coinGeo, coinMat, BURST);
burst.frustumCulled = false; scene.add(burst);
const burstSeeds = Array.from({ length: BURST }, (_, i) => ({
  a: i / BURST * 6.28 + hash(i, .7), vy: 4.6 + hash(i, 1.9) * 2.6, vh: 1.1 + hash(i, 2.8) * 1.8, spin: 6 + hash(i, 3.6) * 10, delay: hash(i, 4.2) * .12,
}));

/* ---------------- Editor chrome ---------------- */
const proxyMat = new THREE.MeshBasicMaterial({ color: '#3fe0c5', wireframe: true, transparent: true, opacity: .6, depthWrite: false });
const proxy = new THREE.Mesh(new THREE.BoxGeometry(CW, CH + R, CD, 3, 3, 3), proxyMat);
const proxyTris = 12 * 9;
scene.add(proxy);
const gizmo = new THREE.Group();
const axis = (dir, color) => new THREE.ArrowHelper(dir, new THREE.Vector3(), 1.3, color, .32, .17);
gizmo.add(axis(new THREE.Vector3(1, 0, 0), '#ff5a6a'), axis(new THREE.Vector3(0, 1, 0), '#7be37b'), axis(new THREE.Vector3(0, 0, 1), '#5aa9ff'));
gizmo.position.set(0, CH + R + .35, 0); scene.add(gizmo);
const selection = new THREE.Box3Helper(new THREE.Box3(new THREE.Vector3(-CW / 2 - .15, -.02, -R - .15), new THREE.Vector3(CW / 2 + .15, CH + R + .15, R + .15)), '#3fe0c5');
selection.material.transparent = true; scene.add(selection);
const grid = new THREE.GridHelper(10, 20, '#3fe0c5', '#26355c');
grid.material.transparent = true; grid.material.depthWrite = false; scene.add(grid);
const scanPts = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([x, z]) => new THREE.Vector3(x * (CW / 2 + .2), 0, z * (R + .2)));
const scan = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(scanPts), new THREE.LineBasicMaterial({ color: '#c9fff5', transparent: true, blending: THREE.AdditiveBlending }));
scene.add(scan);
const shadow = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 3.4), new THREE.MeshBasicMaterial({ map: radial('rgba(0,0,0,.65)', 'rgba(0,0,0,0)'), transparent: true, depthWrite: false, opacity: 0 }));
shadow.rotation.x = -Math.PI / 2; shadow.position.y = .005; chest.add(shadow);

/* ---------------- The iPhone ---------------- */
// Proportions follow a modern iPhone: flat titanium frame with softened edges,
// black glass with a thin even bezel, Dynamic Island and side buttons.
const PW = 3.2, PH = 6.65, PT = .3, BEZEL = .085, SW = PW - BEZEL * 2, SH = PH - BEZEL * 2, CORNER = .52;
const phone = new THREE.Group(); scene.add(phone);
function roundedShape(w, h, r) {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}
function roundedRect(w, h, r) {
  const g = new THREE.ShapeGeometry(roundedShape(w, h, r), 24), uv = g.attributes.uv, p = g.attributes.position;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (p.getX(i) + w / 2) / w, (p.getY(i) + h / 2) / h);
  return g;
}
const titanium = new THREE.MeshPhysicalMaterial({ color: '#7b7e86', metalness: 1, roughness: .3, clearcoat: .4, clearcoatRoughness: .2 });
const BEV = .06;
const bodyGeo = new THREE.ExtrudeGeometry(roundedShape(PW - BEV * 2, PH - BEV * 2, CORNER - BEV), { depth: PT - BEV * 2, bevelEnabled: true, bevelThickness: BEV, bevelSize: BEV, bevelSegments: 8, curveSegments: 32 });
bodyGeo.center();
phone.add(new THREE.Mesh(bodyGeo, titanium));
const glass = new THREE.Mesh(roundedRect(PW - .04, PH - .04, CORNER - .02), new THREE.MeshPhysicalMaterial({ color: '#020204', roughness: .06, metalness: 0, clearcoat: 1, clearcoatRoughness: .04 }));
glass.position.z = PT / 2 + .002; phone.add(glass);
const screenMat = new THREE.MeshBasicMaterial({ color: '#0b0f1c', toneMapped: false });
const screenMesh = new THREE.Mesh(roundedRect(SW, SH, CORNER - BEZEL), screenMat);
screenMesh.position.z = PT / 2 + .004; phone.add(screenMesh);
// A faint diagonal reflection across the glass.
const sheenTex = canvasTex(256, 512, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, w, h * .6);
  gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(.42, 'rgba(255,255,255,0)'); gr.addColorStop(.5, 'rgba(255,255,255,.9)');
  gr.addColorStop(.62, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
});
const sheen = new THREE.Mesh(roundedRect(SW, SH, CORNER - BEZEL), new THREE.MeshBasicMaterial({ map: sheenTex, transparent: true, opacity: .07, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
sheen.position.z = PT / 2 + .006; phone.add(sheen);
const island = new THREE.Mesh(roundedRect(.86, .25, .125), new THREE.MeshBasicMaterial({ color: '#000' }));
island.position.set(0, SH / 2 - .2, PT / 2 + .008); phone.add(island);
for (const [x, y, h] of [[-1, 2.05, .24], [-1, 1.5, .48], [-1, .92, .48], [1, 1.25, .72]]) {
  const b = new THREE.Mesh(new RoundedBoxGeometry(.05, h, .11, 3, .022), titanium);
  b.position.set(x * (PW / 2 + .012), y, 0); phone.add(b);
}
const phoneGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: radial('rgba(130,100,255,.55)', 'rgba(63,224,197,0)'), transparent: true, depthWrite: false, opacity: 0 }));
phoneGlow.scale.set(11, 11, 1); phoneGlow.position.z = -1.2; phone.add(phoneGlow);

// The chest stands on a small 3D pedestal floating just off the glass, so it
// always sits exactly in the middle of it.
const PEDESTAL_Y = -.92, PEDESTAL_Z = PT / 2 + .62;
const pedestal = new THREE.Group();
const pedInner = new THREE.Group(); pedInner.scale.z = .55; pedestal.add(pedInner);
pedInner.add(new THREE.Mesh(new THREE.CylinderGeometry(1, 1.07, .14, 72), new THREE.MeshStandardMaterial({ color: '#3d58c4', metalness: .25, roughness: .35 })));
const pedRim = new THREE.Mesh(new THREE.TorusGeometry(1, .034, 12, 96), new THREE.MeshStandardMaterial({ color: '#ffc451', metalness: 1, roughness: .25 }));
pedRim.rotation.x = Math.PI / 2; pedRim.position.y = .07; pedInner.add(pedRim);
pedestal.position.set(0, PEDESTAL_Y - .07, PEDESTAL_Z);
phone.add(pedestal);

// The mobile game UI drawn onto the screen.
function drawScreen() {
  // Drawn at 2x so text stays crisp on high-density phone screens.
  screenMat.map = canvasTex(1240, 2580, (g) => {
    g.scale(2, 2);
    const w = 620, h = 1290;
    const F = (wgt, size) => `${wgt} ${size}px "Archivo Variable", system-ui, sans-serif`;
    const bg = g.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#2c1e63'); bg.addColorStop(.55, '#173266'); bg.addColorStop(1, '#0b1630');
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    const cx = w / 2, cy = h * (.5 - PEDESTAL_Y / SH);
    g.save(); g.translate(cx, cy);
    for (let i = 0; i < 16; i++) { g.rotate(Math.PI * 2 / 16); g.fillStyle = 'rgba(255,220,140,.05)'; g.beginPath(); g.moveTo(0, 0); g.lineTo(-46, -h); g.lineTo(46, -h); g.fill(); }
    g.restore();
    const gl = g.createRadialGradient(cx, cy - 60, 0, cx, cy - 60, w * .75);
    gl.addColorStop(0, 'rgba(255,200,90,.5)'); gl.addColorStop(.45, 'rgba(255,170,60,.12)'); gl.addColorStop(1, 'rgba(255,170,60,0)');
    g.fillStyle = gl; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 70; i++) { g.fillStyle = `rgba(255,255,255,${.15 + hash(i, 4) * .5})`; g.beginPath(); g.arc(hash(i, 1) * w, hash(i, 2) * h * .5, 1 + hash(i, 3) * 1.8, 0, 7); g.fill(); }
    // Status bar
    g.fillStyle = '#fff'; g.textBaseline = 'middle'; g.font = F(700, 28); g.fillText('9:41', 64, 42);
    g.strokeStyle = '#fff'; g.lineWidth = 3; g.beginPath(); g.roundRect(w - 110, 31, 46, 22, 7); g.stroke();
    g.beginPath(); g.roundRect(w - 106, 35, 32, 14, 4); g.fill();
    for (let i = 0; i < 4; i++) g.fillRect(w - 186 + i * 12, 53 - (i + 1) * 5, 8, (i + 1) * 5);
    // Currency pills
    const pill = (x, label, icon) => {
      g.fillStyle = 'rgba(8,12,30,.55)'; g.beginPath(); g.roundRect(x, 118, 212, 62, 31); g.fill();
      icon(x + 34, 149); g.fillStyle = '#fff'; g.font = F(800, 30); g.textAlign = 'left'; g.fillText(label, x + 66, 150);
    };
    pill(34, '12,480', (x, y) => { g.fillStyle = '#ffc83d'; g.beginPath(); g.arc(x, y, 20, 0, 7); g.fill(); g.fillStyle = '#e09a17'; g.beginPath(); g.arc(x, y, 12, 0, 7); g.fill(); });
    pill(w - 246, '320', (x, y) => { g.fillStyle = '#3fe0c5'; g.beginPath(); g.moveTo(x, y - 22); g.lineTo(x + 18, y); g.lineTo(x, y + 22); g.lineTo(x - 18, y); g.fill(); });
    // Title
    g.textAlign = 'center';
    g.font = F(900, 74); g.lineWidth = 12; g.strokeStyle = '#3a1d05'; g.strokeText('LOOT CHEST', cx, 292);
    const tg = g.createLinearGradient(0, 256, 0, 330); tg.addColorStop(0, '#fff3c4'); tg.addColorStop(1, '#ffc23d');
    g.fillStyle = tg; g.fillText('LOOT CHEST', cx, 292);
    g.font = F(600, 30); g.fillStyle = 'rgba(255,255,255,.8)'; g.fillText('Daily reward unlocked!', cx, 362);
    // Soft shadow cast by the 3D pedestal floating above the glass.
    const sh = g.createRadialGradient(cx, cy + 40, 0, cx, cy + 40, 230);
    sh.addColorStop(0, 'rgba(0,0,0,.45)'); sh.addColorStop(1, 'rgba(0,0,0,0)');
    g.save(); g.translate(cx, cy + 40); g.scale(1, .3); g.translate(-cx, -(cy + 40)); g.fillStyle = sh; g.beginPath(); g.arc(cx, cy + 40, 230, 0, 7); g.fill(); g.restore();
    // Rewards row
    const items = [['x250', '#ffc83d'], ['x3', '#3fe0c5'], ['x1', '#ff5d8f']];
    items.forEach(([t, c], i) => {
      const x = cx + (i - 1) * 170 - 72, y = h * .77 - 72;
      g.fillStyle = 'rgba(255,255,255,.1)'; g.beginPath(); g.roundRect(x, y, 144, 144, 28); g.fill();
      g.strokeStyle = 'rgba(255,255,255,.18)'; g.lineWidth = 2; g.stroke();
      g.fillStyle = c; g.beginPath();
      if (i === 0) g.arc(x + 72, y + 58, 26, 0, 7);
      else if (i === 1) { g.moveTo(x + 72, y + 28); g.lineTo(x + 98, y + 58); g.lineTo(x + 72, y + 88); g.lineTo(x + 46, y + 58); }
      else { for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, r = k % 2 ? 13 : 30; g.lineTo(x + 72 + Math.cos(a) * r, y + 58 + Math.sin(a) * r); } }
      g.fill();
      g.fillStyle = '#fff'; g.font = F(800, 28); g.fillText(t, x + 72, y + 116);
    });
    // Button
    const by = h * .875 - 56;
    g.fillStyle = '#7a4a07'; g.beginPath(); g.roundRect(cx - 214, by + 10, 428, 112, 56); g.fill();
    const bg2 = g.createLinearGradient(0, by, 0, by + 112); bg2.addColorStop(0, '#ffe07a'); bg2.addColorStop(1, '#ffb52e');
    g.fillStyle = bg2; g.beginPath(); g.roundRect(cx - 214, by, 428, 112, 56); g.fill();
    g.fillStyle = '#3a1d05'; g.font = F(900, 44); g.fillText('COLLECT', cx, by + 58);
    g.fillStyle = 'rgba(255,255,255,.85)'; g.beginPath(); g.roundRect(cx - 90, h - 34, 180, 9, 5); g.fill();
  });
  screenMat.color.set('#ffffff');
  screenMat.needsUpdate = true;
}

/* ---------------- Per-frame update ---------------- */
const tanHalf = () => Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
const fitDist = (h, w, fh, fw) => Math.max(h / (2 * fh * tanHalf()), w / (2 * fw * tanHalf() * camera.aspect));
const camTarget = new THREE.Vector3(), anchor = new THREE.Vector3(), restQ = new THREE.Quaternion(), finalQ = new THREE.Quaternion(), yawQ = new THREE.Quaternion();
const coinRest = new THREE.Vector3(0, CH + .3, 0);

function updateWorld(p, time) {
  const narrow = camera.aspect < .8;
  const block = ease(range(p, ...T.block));
  const tex = ease(range(p, ...T.tex));
  const open = range(p, ...T.open);
  const vfx = ease(range(p, T.open[0], T.open[0] + .04));
  const ph = ease(range(p, ...T.phone));
  const texDone = p >= T.tex[1];

  // Blockout: a single primitive, the editor gizmo and a selection box.
  const proxyFade = 1 - range(p, T.model[0], T.model[0] + .05);
  proxy.visible = proxyFade > .01;
  proxy.scale.set(1, lerp(.35, 1, block), 1);
  proxy.position.y = (CH + R) * proxy.scale.y / 2;
  proxyMat.opacity = .6 * proxyFade;
  const chrome = (1 - range(p, T.tex[0], T.tex[0] + .05)) * (.4 + .6 * block);
  gizmo.visible = selection.visible = chrome > .01;
  gizmo.scale.setScalar(Math.max(.001, chrome));
  gizmo.rotation.y = time * .3;
  gizmo.position.y = (CH + R) * proxy.scale.y + .3;
  selection.material.opacity = chrome;
  grid.material.opacity = .32 * (1 - range(p, T.tex[0], T.tex[1]));
  grid.visible = grid.material.opacity > .01;

  // Model: detailed parts snap in, in order.
  let tris = proxy.visible ? proxyTris : 0;
  for (const part of parts) {
    const t = range(p, T.model[0] + part.order * .025, T.model[0] + part.order * .025 + .045);
    part.g.scale.setScalar(Math.max(.0001, easeOutBack(t)));
    part.g.visible = t > 0;
    if (t > 0) tris += part.tris;
  }

  // Texture: a scan line sweeps up, painting materials and erasing the wireframe.
  const level = p < T.tex[0] ? -.3 : texDone ? 60 : lerp(-.3, CH + R + .35, tex);
  solidPlane.constant = level; wirePlane.constant = -level;
  wireMat.visible = !texDone;
  scan.visible = p > T.tex[0] && !texDone;
  scan.position.y = level;
  treasure.visible = texDone;
  shadow.material.opacity = .9 * range(p, T.tex[0], T.tex[1]);

  // Animate: squash, stretch and rattle, building up to the pop.
  const amp = reduce ? 0 : range(p, T.anim[0], T.anim[0] + .03) * (1 - range(p, T.open[0] - .005, T.open[0] + .01)) * (.45 + .55 * range(p, ...T.anim));
  const wob = Math.sin(time * 10);
  const pop = Math.sin(range(p, T.open[0], T.open[0] + .03) * Math.PI);
  rig.scale.set(1 - .05 * amp * wob + .08 * pop, 1 + .09 * amp * wob - .14 * pop, 1 - .05 * amp * wob + .08 * pop);
  rig.position.y = Math.abs(Math.sin(time * 5)) * .22 * amp;
  rig.rotation.z = Math.sin(time * 5) * .06 * amp;
  const rattle = Math.max(0, Math.sin(time * 19)) * .14 * amp;

  // VFX: lid pops, light pours out, coins burst and sparkles drift.
  // Once on the phone the lid tilts back less, so it reads as a panel instead of an edge.
  const lidMax = lerp(1.95, 1.3, ease(range(p, T.phone[0] + .02, T.phone[1])));
  lidPivot.rotation.x = -(lidMax * easeOutBack(open) + rattle);
  glowLight.intensity = 22 * vfx;
  glowSprite.material.opacity = .85 * vfx;
  beam.material.opacity = .55 * vfx * (1 - range(p, T.phone[0], T.phone[0] + .04));
  beam.visible = beam.material.opacity > .01;
  sparkMat.opacity = vfx;
  sparks.rotation.y = time * .12;
  // Long enough for every coin to land; any still airborne vanish as the phone arrives.
  const bt = range(p, ...T.vfx) * 3.2;
  const burstOn = p < T.phone[0] + .03;
  let flying = 0;
  burstSeeds.forEach((s, i) => {
    const t = Math.max(0, bt - s.delay);
    const y = coinRest.y + s.vy * t - 4.9 * t * t;
    const live = burstOn && t > 0 && y > -.3;
    if (live) flying++;
    m4.compose(
      v3.set(Math.cos(s.a) * s.vh * t, y, Math.sin(s.a) * s.vh * t),
      q.setFromEuler(e3.set(t * s.spin, s.a, t * s.spin * .6)),
      sc.setScalar(live ? 1 : .0001),
    );
    burst.setMatrixAt(i, m4);
  });
  burst.instanceMatrix.needsUpdate = true;

  // Lighting mood shifts warmer once the chest opens.
  const bg = INK.clone().lerp(WARM, vfx * (1 - ph)).lerp(DUSK, ph);
  scene.background.copy(bg);
  hemi.intensity = lerp(.55, .8, vfx);

  // Camera during the build: orbit from a three-quarter editor view towards the front.
  const buildD = (narrow ? fitDist(2.6, 3.8, .4, .86) : fitDist(2.7, 3, .55, .45)) * lerp(1, 1.16, vfx);
  const az = lerp(.8, .28, ease(range(p, 0, T.open[1]))) + (reduce ? 0 : Math.sin(time * .2) * .03);
  const el = lerp(.5, .2, ease(range(p, .2, T.open[1])));
  const buildTarget = new THREE.Vector3(narrow ? 0 : -.35, (CH + R) / 2 + (narrow ? -.55 : .1) + vfx * .4, 0);

  // Final shot: the phone, facing the camera, to the right on wide screens and high on phones.
  const phoneD = narrow ? fitDist(PH, PW, .5, .74) : fitDist(PH, PW, .8, .3);
  const hh = phoneD * tanHalf(), hw = hh * camera.aspect;
  const phoneHome = new THREE.Vector3(narrow ? 0 : hw * .42, narrow ? hh * .3 : 0, 0);
  const rise = easeOut(range(p, T.phone[0], T.phone[0] + .065));
  phone.visible = p > T.phone[0];
  phone.position.copy(phoneHome).add(v3.set(0, lerp(-(hh * 2 + PH), 0, rise) + (reduce ? 0 : Math.sin(time * .9) * .06), 0));
  phone.rotation.set(.05 + (my - .4) * .1, -.16 + (mx - .5) * .22 + (reduce ? 0 : Math.sin(time * .5) * .025), 0);
  pedestal.scale.setScalar(Math.max(.001, easeOutBack(range(rise, .55, 1))));
  phoneGlow.material.opacity = rise;

  // The chest shrinks and flies onto the game screen.
  const move = ease(range(p, T.phone[0] + .02, T.phone[1]));
  phone.updateMatrixWorld();
  anchor.set(0, PEDESTAL_Y, PEDESTAL_Z);
  phone.localToWorld(anchor);
  chest.position.lerpVectors(v3.set(0, 0, 0), anchor, move);
  chest.scale.setScalar(lerp(1, .56, move));
  finalQ.copy(phone.quaternion).multiply(yawQ.setFromAxisAngle(v3.set(0, 1, 0), -.28));
  chest.quaternion.slerpQuaternions(restQ, finalQ, move);
  shadow.visible = move < .5;
  sparks.scale.setScalar(lerp(1, .5, move));

  // Blend the camera between the two shots.
  const buildPos = new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)).multiplyScalar(buildD).add(buildTarget);
  const finalPos = new THREE.Vector3(0, 0, phoneD);
  camera.position.lerpVectors(buildPos, finalPos, ph);
  camTarget.lerpVectors(buildTarget, v3.set(0, 0, 0), ph);
  camera.lookAt(camTarget);

  return {
    tris: Math.round(tris),
    keys: Math.round(48 * range(p, ...T.anim)),
    particles: p >= T.open[0] ? flying + SPARKS : 0,
    build: Math.round(p * 100),
  };
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
const statEls = { tris: $('sTris'), keys: $('sEnt'), particles: $('sLights'), build: $('sBuild') };
// The finished world and its closing caption stay pinned for this many extra
// screen heights, so visitors don't scroll straight past the call to action.
const HOLD = 1.2;
function progress() {
  const r = intro.getBoundingClientRect();
  return clamp(-r.top / (intro.offsetHeight - innerHeight * (1 + HOLD)));
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
    const stage = sp < T.model[0] ? 0 : sp < T.tex[0] ? 1 : sp < T.anim[0] ? 2 : sp < T.open[0] ? 3 : sp < T.phone[0] ? 4 : 5;
    stepEls.forEach((li, i) => { li.classList.toggle('on', i === stage); li.classList.toggle('done', i < stage); });
    statEls.tris.textContent = stats.tris.toLocaleString();
    statEls.keys.textContent = stats.keys;
    statEls.particles.textContent = stats.particles;
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
document.fonts.load('900 40px "Archivo Variable"').catch(() => {}).finally(drawScreen);
logo.decode().catch(() => {}).finally(() => { analyseLogo(); layout(); requestAnimationFrame(frame); });

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const WORLD_R = 82;

// ---------- 数学ユーティリティ ----------
export function mulberry32(a) {
  return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
const MOBILE0 = ((typeof matchMedia === 'function' && matchMedia('(pointer:coarse)').matches) || /[?&]touch/.test(location.search)) && !/[?&]hq/.test(location.search);
export const GFX_KEY = 'chinchilla-ranch-gfx';
const GFX = (() => { let v = null; try { if (localStorage.getItem('chinchilla-ranch-eco') === '1') return 'low'; } catch {} try { v = localStorage.getItem(GFX_KEY); } catch {} { const q = /[?&]gfx=(low|mid|high)/.exec(location.search); if (q) return q[1]; } if (/[?&]hq/.test(location.search)) return 'high'; if (v === 'low' || v === 'mid' || v === 'high') return v; return MOBILE0 ? 'mid' : 'high'; })();   // くさの りょう(せってい)
const GRASS = { low: { n: 7500, dist: 46, acc: 16 }, mid: { n: 12000, dist: 56, acc: 13 }, high: { n: 20000, dist: 72, acc: 11 } }[GFX];
const MOBILE = ((typeof matchMedia === 'function' && matchMedia('(pointer:coarse)').matches) || /[?&]touch/.test(location.search)) && !/[?&]hq/.test(location.search);   // スマホは草を減らして軽くする
const rnd = mulberry32(20261006);
const R = (a, b) => a + (b - a) * rnd();
const sstep = (a, b, x) => { x = Math.min(1, Math.max(0, (x - a) / (b - a))); return x * x * (3 - 2 * x); };

// 海: 南東(+x,+z)の入り江。浜は半径およそ66〜82、波打ちぎわは半径およそ83、その先が海
export const SEA_A = 0.46, SEA_W = 0.58, SEA_Y = -0.2;
export function seaMask(x, z) {   // 入り江の中心ほど 1
  if (x * x + z * z < 2500) return 0;
  let d = Math.atan2(z, x) - SEA_A; d = Math.atan2(Math.sin(d), Math.cos(d));
  return 1 - sstep(0.3, SEA_W, Math.abs(d));
}
// 川: 村の西をゆるくカーブして流れる。hw=川はばの半分、y=水面の高さ
export const RIVER = { hw: 3.0, y: -0.15, base: 0.35 };
const RIVER_PTS = new THREE.CatmullRomCurve3([[-73, 3], [-61, 12], [-51, 24], [-52, 38], [-60, 49], [-67, 56]].map(([x, z]) => new THREE.Vector3(x, 0, z))).getPoints(48);
export const riverPoints = RIVER_PTS;
export function riverDist(x, z) {
  let best = 1e9;
  for (let i = 0; i < RIVER_PTS.length - 1; i++) {
    const a = RIVER_PTS[i], b = RIVER_PTS[i + 1], vx = b.x - a.x, vz = b.z - a.z, t = Math.max(0, Math.min(1, ((x - a.x) * vx + (z - a.z) * vz) / (vx * vx + vz * vz))), d = Math.hypot(x - a.x - vx * t, z - a.z - vz * t);
    if (d < best) best = d;
  }
  return best;
}
// 村の「背の低い草」を、ほかのマップでも使えるようにした部品(葉1枚ずつ曲線で作った芝)
export function lawnKit() {
  const bladeTuft = (n, seed, { h0, h1, spread, lo, hi, wide }) => {
    const r2 = mulberry32(seed), pos = [], col = [], idx = [], c0 = new THREE.Color(lo), c1 = new THREE.Color(hi), tmp = new THREE.Color();
    for (let b = 0; b < n; b++) {
      const ang = r2() * 6.283, rad = Math.sqrt(r2()) * spread, bx = Math.cos(ang) * rad, bz = Math.sin(ang) * rad;
      const h = h0 + r2() * (h1 - h0), ww0 = (0.05 + r2() * 0.035) * wide, yaw = r2() * 6.283, bend = (0.12 + r2() * 0.5) * h, k = 0.82 + r2() * 0.36;
      const dx = Math.cos(yaw), dz = Math.sin(yaw), sx = -dz, sz = dx, base = pos.length / 3;
      for (let l = 0; l <= 3; l++) { const t = l / 3, y = h * t, lean = bend * t * t, ww = ww0 * (1 - t * t * 0.92) * 0.5; tmp.copy(c0).lerp(c1, Math.pow(t, 0.8)).multiplyScalar(k); for (const sd of [-1, 1]) { pos.push(bx + dx * lean + sx * ww * sd, y, bz + dz * lean + sz * ww * sd); col.push(tmp.r, tmp.g, tmp.b); } }
      for (let l = 0; l < 3; l++) { const q = base + l * 2; idx.push(q, q + 1, q + 2, q + 1, q + 3, q + 2, q + 2, q + 1, q, q + 2, q + 3, q + 1); }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    const nrm = new Float32Array(pos.length); for (let i = 0; i < nrm.length; i += 3) nrm[i + 1] = 1; g.setAttribute('normal', new THREE.BufferAttribute(nrm, 3)); g.setIndex(idx); return g;
  };
  const time = { value: 0 }, mat = new THREE.MeshLambertMaterial({ vertexColors: true });
  mat.onBeforeCompile = (sh) => { sh.uniforms.uTime = time; sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uTime;').replace('#include <begin_vertex>', '#include <begin_vertex>\n#ifdef USE_INSTANCING\nfloat ph=instanceMatrix[3].x*0.35+instanceMatrix[3].z*0.27;\nfloat hh=position.y*position.y;\ntransformed.x+=(sin(uTime*1.7+ph)*0.09+sin(uTime*3.3+ph*2.)*0.03)*hh;\ntransformed.z+=cos(uTime*1.3+ph*1.3)*0.06*hh;\n#endif'); };
  const LAW = { h0: 0.2, h1: 0.5, spread: 0.3, lo: '#557f30', hi: '#b4d860', wide: 0.8 };
  return { geos: [bladeTuft(15, 11, LAW), bladeTuft(15, 12, LAW), bladeTuft(15, 13, LAW), bladeTuft(12, 14, { ...LAW, h0: 0.15, h1: 0.34 })], mat, time };
}
export function heightAt(x, z) {
  const d = Math.hypot(x, z + 5), r = Math.hypot(x, z);
  const flat = sstep(32, 58, d);
  let h = (Math.sin(x * 0.045 + 1.3) * Math.cos(z * 0.04) * 2.4 + Math.sin(x * 0.11 + z * 0.09) * 0.6) * flat;
  h += sstep(74, 135, r) * 24;
  const m = seaMask(x, z) * sstep(46, 64, r);
  if (m > 0) { const beach = 0.9 * (1 - sstep(66, 84, r)) - 3.2 * sstep(80, 100, r); h = h * (1 - m) + beach * m; }
  const rd = riverDist(x, z);
  if (rd < 16) { const k = 1 - sstep(5, 16, rd), bed = RIVER.base - 1.05; h = h * (1 - k) + (bed + (RIVER.base - bed) * sstep(RIVER.hw - 0.6, RIVER.hw + 1.3, rd)) * k; }
  return h;
}
export const isWater = (x, z) => heightAt(x, z) < SEA_Y + 0.02;

// ---------- キャンバステクスチャ ----------
function canvasTex(w, h, draw, { repeat = null, srgb = true } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); draw(g, w, h);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  return t;
}
function speckle(g, w, h, n, cols, sz = 2, alpha = 0.5) {
  for (let i = 0; i < n; i++) {
    g.globalAlpha = alpha * Math.random();
    g.fillStyle = cols[(Math.random() * cols.length) | 0];
    g.fillRect(Math.random() * w, Math.random() * h, sz * (0.5 + Math.random()), sz * (0.5 + Math.random()));
  }
  g.globalAlpha = 1;
}
const grassTex = () => canvasTex(512, 512, (g, w, h) => {
  g.fillStyle = '#62903c'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 90; i++) { g.globalAlpha = 0.07; g.fillStyle = ['#7a9a3a', '#4f7a30', '#8aa845', '#5a8a44'][i % 4]; g.beginPath(); g.arc(Math.random() * w, Math.random() * h, 20 + Math.random() * 60, 0, 7); g.fill(); }
  g.globalAlpha = 1;
  speckle(g, w, h, 6000, ['#4f7e30', '#7aa648', '#456f2a', '#8cb458', '#5d8a38', '#9aa84a'], 3, 0.65);
  for (let i = 0; i < 2200; i++) {
    g.strokeStyle = ['#44712a', '#93bd5e', '#58863a', '#a0b858'][i % 4]; g.globalAlpha = 0.55; g.lineWidth = 1;
    const x = Math.random() * w, y = Math.random() * h; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (Math.random() - .5) * 5, y - 4 - Math.random() * 7); g.stroke();
  }
  g.globalAlpha = 1;
}, { repeat: [70, 70] });
const dirtTex = () => canvasTex(128, 256, (g, w, h) => {
  g.fillStyle = '#9b7a52'; g.fillRect(0, 0, w, h);
  speckle(g, w, h, 1800, ['#7d5f3c', '#b08c5e', '#8a6a44', '#c4a070', '#6e5232'], 3, 0.7);
  // 左右の縁を草になじませる
  const grd = g.createLinearGradient(0, 0, w, 0);
  grd.addColorStop(0, 'rgba(0,0,0,0)'); grd.addColorStop(0.18, 'rgba(0,0,0,1)'); grd.addColorStop(0.82, 'rgba(0,0,0,1)'); grd.addColorStop(1, 'rgba(0,0,0,0)');
  g.globalCompositeOperation = 'destination-in'; g.fillStyle = grd; g.fillRect(0, 0, w, h);
  g.globalCompositeOperation = 'source-over';
});
const plasterTex = () => canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#e8dcc0'; g.fillRect(0, 0, w, h);
  speckle(g, w, h, 1500, ['#d6c8a8', '#f2e8d0', '#cbbd9c'], 3, 0.5);
});
const plankTex = (base = '#8a5a36') => canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = base; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 8; i++) {
    g.fillStyle = `rgba(0,0,0,${0.08 + 0.1 * Math.random()})`; g.fillRect(i * 32, 0, 3, h);
    g.fillStyle = `rgba(255,255,255,${0.04 * Math.random()})`; g.fillRect(i * 32 + 3, 0, 29, h);
  }
  for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(40,20,5,${0.12 * Math.random()})`; g.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 2, 8 + Math.random() * 18); }
});
const thatchTex = () => canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#b8924a'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 2600; i++) {
    g.strokeStyle = ['#caa45a', '#a07c3a', '#d8b86c', '#8c6a30'][i % 4]; g.globalAlpha = 0.6; g.lineWidth = 1.2;
    const x = Math.random() * w, y = Math.random() * h; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (Math.random() - .5) * 3, y + 6 + Math.random() * 10); g.stroke();
  }
  g.globalAlpha = 1;
});
const hayTex = () => canvasTex(128, 128, (g, w, h) => {
  g.fillStyle = '#d8b44a'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 900; i++) { g.strokeStyle = ['#e8c85e', '#c09a34', '#f0d676'][i % 3]; g.globalAlpha = 0.7; g.beginPath(); const x = Math.random() * w, y = Math.random() * h; g.moveTo(x, y); g.lineTo(x + 10 + Math.random() * 14, y + (Math.random() - .5) * 3); g.stroke(); }
  g.globalAlpha = 1;
});
const stoneTex = () => canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#b9b2a4'; g.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 32) for (let x = (y / 32 % 2) * 24; x < w; x += 48) {
    g.fillStyle = `hsl(35,8%,${62 + Math.random() * 14}%)`; g.fillRect(x + 1, y + 1, 45, 29);
  }
});
const grassBladeTex = () => canvasTex(64, 64, (g, w, h) => {
  for (let i = 0; i < 16; i++) {
    const x = 6 + Math.random() * 52, tip = 6 + Math.random() * 30, lean = (Math.random() - .5) * 14;
    const grd = g.createLinearGradient(0, h, 0, tip); grd.addColorStop(0, '#3f7a28'); grd.addColorStop(1, '#a8d45c');
    g.fillStyle = grd; g.beginPath(); g.moveTo(x - 2.2, h); g.quadraticCurveTo(x, h * 0.5, x + lean, tip); g.quadraticCurveTo(x + 1, h * 0.5, x + 2.2, h); g.fill();
  }
});
const softTex = (inner = 'rgba(255,255,255,1)') => canvasTex(128, 128, (g, w, h) => {
  const grd = g.createRadialGradient(64, 64, 4, 64, 64, 62); grd.addColorStop(0, inner); grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd; g.fillRect(0, 0, w, h);
});

// ---------- 世界構築 ----------
export function buildWorld(scene) {
  const colliders = { boxes: [], circles: [] };
  const placed = []; // 配置禁止領域 {x,z,r}
  const pathPts = [];
  const world = { look: { sun: 1, hemi: 1, fog: 1 }, colliders, heightAt, spots: {}, windmill: null, lodChunks: [], focus: new THREE.Vector3() };

  const addBox = (cx, cz, w, d) => colliders.boxes.push({ minx: cx - w / 2, maxx: cx + w / 2, minz: cz - d / 2, maxz: cz + d / 2 });
  const addCircle = (x, z, r) => colliders.circles.push({ x, z, r });
  const keep = (x, z, r) => placed.push({ x, z, r });
  const nearPath = (x, z, w) => { if (riverDist(x, z) < RIVER.hw + 1.5) return true; for (const p of pathPts) if (Math.hypot(p.x - x, p.z - z) < w) return true; return false; };
  const free = (x, z, r = 1) => {
    if (Math.hypot(x, z) > 58 && seaMask(x, z) > 0.02) return false;
    if (nearPath(x, z, 2.6 + r)) return false;
    for (const p of placed) if (Math.hypot(p.x - x, p.z - z) < p.r + r) return false;
    return true;
  };
  world.free = free; world.keep = keep; world.nearPath = nearPath;

  // --- 空・光 ---
  const sky = new THREE.Mesh(new THREE.SphereGeometry(500, 24, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color('#3f86d6') }, hor: { value: new THREE.Color('#bcd8ee') }, sunDir: { value: new THREE.Vector3(0, 1, 0) }, sunCol: { value: new THREE.Color('#fff2c8') } },
    vertexShader: 'varying vec3 vP; void main(){ vP=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: 'uniform vec3 top,hor,sunCol,sunDir; varying vec3 vP; void main(){ float h=clamp(vP.y,0.,1.); vec3 c=mix(hor,top,pow(h,.55)); float s=max(dot(normalize(vP),normalize(sunDir)),0.); c+=sunCol*(pow(s,600.)*1.4+pow(s,12.)*.18); gl_FragColor=vec4(c,1.); }',
  }));
  sky.renderOrder = -10; scene.add(sky);
  const sun = new THREE.DirectionalLight(0xfff0d0, 2.6);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); world.sun = sun;
  const sc = sun.shadow.camera; sc.left = -34; sc.right = 34; sc.top = 34; sc.bottom = -34; sc.near = 1; sc.far = 160;
  sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.04;
  scene.add(sun, sun.target);
  const hemi = new THREE.HemisphereLight(0xcfe4ff, 0x7a8a50, 1.2); scene.add(hemi);
  scene.fog = new THREE.Fog('#bcd8ee', 90, 340);

  // 雲
  const cloudTex = softTex();
  const clouds = [];
  for (let i = 0; i < 16; i++) {
    const grp = new THREE.Group();
    for (let k = 0; k < 5; k++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: cloudTex, transparent: true, opacity: 0.85, depthWrite: false, fog: false }));
      s.scale.set(R(50, 90), R(22, 36), 1); s.position.set(R(-40, 40), R(-3, 5), R(-12, 12)); grp.add(s);
    }
    const a = R(0, 6.28), d = R(150, 330);
    grp.position.set(Math.cos(a) * d, R(95, 150), Math.sin(a) * d); grp.visible = false; scene.add(grp); clouds.push(grp);   // 3Dの雲が 読みこまれるまで かくす(仮の楕円が 見えてしまうため)
  }

  // --- 時刻ごとの空 ---
  const KEYS = [ // hour, top, horizon, sunIntensity, hemiIntensity, sunColor
    [0, '#0a1230', '#1a2646', 0.45, 0.6, '#8fa8ff'], [5, '#1c2850', '#5a5a80', 0.3, 0.6, '#ffb080'], [6.5, '#6f90c8', '#f0b890', 1.4, 0.8, '#ffc890'],
    [9, '#3f86d6', '#bcd8ee', 3.1, 0.85, '#fff0d0'], [16, '#3f86d6', '#bcd8ee', 3.1, 0.85, '#ffecc8'], [18, '#5b6fb0', '#f3a06a', 1.6, 0.8, '#ffb070'],
    [19.5, '#27325e', '#a06a70', 0.3, 0.45, '#ff9060'], [21, '#0c1534', '#1c2848', 0.4, 0.58, '#8fa8ff'], [24, '#0a1230', '#1a2646', 0.45, 0.6, '#8fa8ff'],
  ].map(k => ({ h: k[0], top: new THREE.Color(k[1]), hor: new THREE.Color(k[2]), si: k[3], hi: k[4], sc: new THREE.Color(k[5]) }));
  const tmpA = new THREE.Color();
  world.setTime = (hour, focus) => {
    world.hour = hour;
    let a = KEYS[0], b = KEYS[1];
    for (let i = 0; i < KEYS.length - 1; i++) if (hour >= KEYS[i].h && hour <= KEYS[i + 1].h) { a = KEYS[i]; b = KEYS[i + 1]; break; }
    const f = (hour - a.h) / (b.h - a.h || 1);
    sky.material.uniforms.top.value.copy(a.top).lerp(b.top, f);
    sky.material.uniforms.hor.value.copy(a.hor).lerp(b.hor, f);
    sky.material.uniforms.sunCol.value.copy(a.sc).lerp(b.sc, f);
    scene.fog.color.copy(sky.material.uniforms.hor.value);
    world.focus.copy(focus);
    sun.intensity = (a.si + (b.si - a.si) * f) * world.look.sun; sun.color.copy(a.sc).lerp(b.sc, f);
    hemi.intensity = (a.hi + (b.hi - a.hi) * f) * world.look.hemi; scene.fog.far = 340 * world.look.fog; scene.fog.near = 90 * Math.min(1, world.look.fog);
    const ang = (hour - 6) / 12 * Math.PI; // 6時に東、18時に西
    const dir = new THREE.Vector3(Math.cos(ang) * 0.9, Math.max(Math.sin(ang), 0.12) * 0.95 + (hour > 6 && hour < 18 ? 0 : 0.0), 0.35).normalize();
    if (hour < 6 || hour > 18) dir.set(-0.4, 0.5, 0.3).normalize();
    sky.material.uniforms.sunDir.value.copy(hour > 5.5 && hour < 18.5 ? new THREE.Vector3(Math.cos(ang), Math.sin(ang), 0.3) : new THREE.Vector3(0, -1, 0));
    sun.position.copy(focus).addScaledVector(dir, 90); sun.target.position.copy(focus);
    sky.position.copy(focus);
    hemi.color.copy(sky.material.uniforms.top.value).lerp(tmpA.set('#ffffff'), 0.5);
  };

  // --- 地形 ---
  {
    const geo = new THREE.PlaneGeometry(280, 280, 220, 220); geo.rotateX(-Math.PI / 2);
    const p = geo.attributes.position; const col = new Float32Array(p.count * 3);
    const cg = new THREE.Color(), grass = new THREE.Color('#ffffff'), rock = new THREE.Color('#8a8678'), snow = new THREE.Color('#f4f6fa'), dark = new THREE.Color('#5d7a3a');
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i), h = heightAt(x, z); p.setY(i, h);
      const n = 0.9 + 0.16 * (Math.sin(x * 0.21 + z * 0.13) * 0.5 + 0.5) * (Math.cos(z * 0.17 - x * 0.09) * 0.5 + 0.5) + (Math.random() - 0.5) * 0.06;
      cg.copy(grass).multiplyScalar(n);
      if (Math.hypot(x, z) > 50) cg.lerp(dark, sstep(50, 70, Math.hypot(x, z)) * 0.5);
      cg.lerp(rock, sstep(7, 16, h)); cg.lerp(snow, sstep(19, 24, h));
      col.set([cg.r, cg.g, cg.b], i * 3);
    }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ map: grassTex(), vertexColors: true }));
    m.receiveShadow = true; scene.add(m);
  }

  // --- 浜と海 ---
  {
    const sandTex = canvasTex(256, 256, (c, w, h) => {
      c.fillStyle = '#e6d6a6'; c.fillRect(0, 0, w, h);
      for (let i = 0; i < 2600; i++) { const l = 60 + Math.random() * 30; c.fillStyle = `hsla(${38 + Math.random() * 10},${40 + Math.random() * 20}%,${l}%,.35)`; c.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 2, 1 + Math.random() * 2); }
      for (let i = 0; i < 40; i++) { c.strokeStyle = 'rgba(190,165,110,.25)'; c.lineWidth = 1.2; c.beginPath(); const y = Math.random() * h; c.moveTo(0, y); for (let x = 0; x <= w; x += 16) c.lineTo(x, y + Math.sin(x * 0.07 + i) * 3); c.stroke(); }
    }, { repeat: [1, 1] });
    sandTex.wrapS = sandTex.wrapT = THREE.RepeatWrapping;
    // 砂の皮(地形の上に重ねる。内陸側はなじませて消える)
    const nR = 72, nT = 64, r0 = 54, r1 = 122, t0 = SEA_A - 0.72, t1 = SEA_A + 0.72, pos = [], col = [], uv = [], idx = [];
    for (let i = 0; i <= nR; i++) for (let j = 0; j <= nT; j++) {
      const r = r0 + (r1 - r0) * i / nR, a = t0 + (t1 - t0) * j / nT, x = Math.cos(a) * r, z = Math.sin(a) * r, h = heightAt(x, z);
      pos.push(x, h + 0.035, z); uv.push(x / 7, z / 7);
      const m = seaMask(x, z), alpha = sstep(0.0, 0.5, m) * sstep(60, 70, r);
      let c = [0.93, 0.86, 0.66]; const wet = sstep(0.55, -0.05, h);   // 水ぎわほど しっとり
      c = c.map((v, k) => v * (1 - wet * [0.3, 0.3, 0.25][k]));
      const foam = Math.max(0, 1 - Math.abs(h - (SEA_Y - 0.08)) / 0.22) * (0.55 + 0.45 * Math.sin(x * 0.9 + z * 0.7)); c = c.map(v => v + (1 - v) * foam * 0.8);
      col.push(c[0], c[1], c[2], alpha);
    }
    for (let i = 0; i < nR; i++) for (let j = 0; j < nT; j++) { const a = i * (nT + 1) + j, b = a + 1, c = a + nT + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); sg.setAttribute('color', new THREE.Float32BufferAttribute(col, 4)); sg.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); sg.setIndex(idx); sg.computeVertexNormals();
    const skin = new THREE.Mesh(sg, new THREE.MeshLambertMaterial({ map: sandTex, vertexColors: true, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 })); skin.receiveShadow = true; skin.renderOrder = 1; scene.add(skin);
    // 海面
    const rip = canvasTex(256, 256, (c, w, h) => {
      c.fillStyle = '#d9f0fb'; c.fillRect(0, 0, w, h);
      for (let i = 0; i < 70; i++) { c.strokeStyle = `rgba(255,255,255,${0.35 + Math.random() * 0.4})`; c.lineWidth = 1 + Math.random() * 2; c.beginPath(); const x = Math.random() * w, y = Math.random() * h, l = 14 + Math.random() * 30; c.moveTo(x, y); c.quadraticCurveTo(x + l / 2, y - 4, x + l, y); c.stroke(); }
      for (let i = 0; i < 50; i++) { c.fillStyle = 'rgba(120,180,215,.25)'; c.beginPath(); c.ellipse(Math.random() * w, Math.random() * h, 10 + Math.random() * 18, 3 + Math.random() * 3, 0, 0, 7); c.fill(); }
    });
    rip.wrapS = rip.wrapT = THREE.RepeatWrapping; rip.repeat.set(26, 26);
    const wg = new THREE.RingGeometry(58, 340, 56, 14, -(SEA_A + 0.85), 1.7); wg.rotateX(-Math.PI / 2);
    const wmat = new THREE.MeshPhongMaterial({ color: '#4fb0d6', map: rip, transparent: true, opacity: 0.8, shininess: 100, specular: '#e8f8ff', depthWrite: false });
    const water = new THREE.Mesh(wg, wmat); water.position.y = SEA_Y; water.renderOrder = 2; scene.add(water);
    world.water = { mesh: water, tex: rip };
    world.seaGlint = null;
  }

  // --- 川(水面のリボンと釣り場) ---
  {
    const hwv = RIVER.hw + 0.9, pos = [], uv = [], idx = [], P = RIVER_PTS; let len = 0;
    for (let i = 0; i < P.length; i++) {
      const a = P[Math.max(0, i - 1)], b = P[Math.min(P.length - 1, i + 1)], tx = b.x - a.x, tz = b.z - a.z, l = Math.hypot(tx, tz) || 1, nx = -tz / l, nz = tx / l;
      if (i) len += Math.hypot(P[i].x - P[i - 1].x, P[i].z - P[i - 1].z);
      pos.push(P[i].x + nx * hwv, RIVER.y, P[i].z + nz * hwv, P[i].x - nx * hwv, RIVER.y, P[i].z - nz * hwv); uv.push(0, len * 0.0064, 0.05, len * 0.0064);
      if (i < P.length - 1) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
    }
    const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); rg.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); rg.setIndex(idx);
    const rm = new THREE.Mesh(rg, new THREE.MeshPhongMaterial({ color: '#4fb0d6', map: world.water ? world.water.tex : null, transparent: true, opacity: 0.82, shininess: 100, specular: '#e8f8ff', depthWrite: false, side: THREE.DoubleSide })); rm.renderOrder = 2; scene.add(rm);
    // 釣りば(岸の上): 立つ場所と、うきを投げる先
    const spots = [];
    for (let i = 4; i < P.length - 4; i += 6) {
      const a = P[i - 1], b = P[i + 1], tx = b.x - a.x, tz = b.z - a.z, l = Math.hypot(tx, tz) || 1, nx = -tz / l, nz = tx / l;
      for (const s of [-1, 1]) { const ax = P[i].x + nx * s * (RIVER.hw + 1.7), az = P[i].z + nz * s * (RIVER.hw + 1.7); if (Math.hypot(ax, az) > WORLD_R - 3 || heightAt(ax, az) < RIVER.y + 0.1) continue; spots.push({ x: ax, z: az, tx: P[i].x + nx * s * 0.6, tz: P[i].z + nz * s * 0.6, y: RIVER.y }); }
    }
    const water = [];   // 水くみば(釣り場の あいだ)
    for (let i = 7; i < P.length - 4; i += 6) {
      const a = P[i - 1], b = P[i + 1], tx = b.x - a.x, tz = b.z - a.z, l = Math.hypot(tx, tz) || 1, nx = -tz / l, nz = tx / l;
      for (const s of [-1, 1]) { const ax = P[i].x + nx * s * (RIVER.hw + 1.4), az = P[i].z + nz * s * (RIVER.hw + 1.4); if (Math.hypot(ax, az) > WORLD_R - 3 || heightAt(ax, az) < RIVER.y + 0.1) continue; water.push({ x: ax, z: az }); }
    }
    world.spots.riverWater = water;
    world.spots.river = spots; world.riverPts = RIVER_PTS;
  }

  // --- 道 ---
  const dirt = dirtTex();
  const addPath = (pts, w = 3.2) => {
    const curve = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(p[0], 0, p[1])));
    const n = Math.ceil(curve.getLength() / 1.2), P = curve.getPoints(n);
    const pos = [], uv = [], idx = []; let dist = 0;
    for (let i = 0; i < P.length; i++) {
      const t = (P[Math.min(i + 1, P.length - 1)]).clone().sub(P[Math.max(i - 1, 0)]).normalize(); const sx = -t.z, sz = t.x;
      if (i) dist += P[i].distanceTo(P[i - 1]);
      const ww = w * (0.9 + 0.2 * Math.sin(i * 0.7));
      for (const s of [-1, 1]) { const x = P[i].x + sx * s * ww / 2, z = P[i].z + sz * s * ww / 2; pos.push(x, heightAt(x, z) + 0.05, z); uv.push(s < 0 ? 0 : 1, dist / 4); }
      if (i < P.length - 1) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
      pathPts.push({ x: P[i].x, z: P[i].z });
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    const mesh = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ map: dirt, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, side: THREE.DoubleSide }));
    mesh.receiveShadow = true; mesh.renderOrder = 1; scene.add(mesh);
    world.paths = (world.paths || []).concat([P]);
  };
  addPath([[-3, 66], [2, 44], [0, 22], [0, 6], [0, -4], [2, -12], [6, -20], [10, -30]]);
  addPath([[0, -3], [-8, -6], [-16, -8.6]], 2.6);
  addPath([[0, -3], [8, -3.4], [17, -2]], 2.6);
  addPath([[1, -1], [5, -4], [6, -6]], 2.2);
  addPath([[0, 15], [-12, 17], [-26, 20], [-38, 23], [-46, 25.5]], 2.8);   // 西の川べりへ のびる こみち(もりで ふさがれないように)

  // --- 建物 ---
  const walls = plasterTex(), planks = plankTex('#8a5a36'), redPlanks = plankTex('#9a4a32'), thatch = thatchTex(), stone = stoneTex(), hay = hayTex();
  walls.repeat.set(3, 1); walls.wrapS = walls.wrapT = THREE.RepeatWrapping; thatch.wrapS = thatch.wrapT = THREE.RepeatWrapping; thatch.repeat.set(3, 1);
  const M = (opts) => new THREE.MeshLambertMaterial(opts);
  const timber = M({ color: '#5a3a22' }), roofMat = M({ map: thatch, side: THREE.DoubleSide }), glass = M({ color: '#9fd0e8', emissive: '#f0c070', emissiveIntensity: 0.18 });
  const shade = (o) => { o.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } }); return o; };

  function gableHouse({ W, D, H, RH, wallMat, over = 0.7 }) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(W, H, D), wallMat); body.position.y = H / 2; g.add(body);
    // 屋根(棟はx方向)
    const roof = new THREE.Group(); roof.position.y = H;
    const sh = new THREE.Shape(); sh.moveTo(-D / 2, 0); sh.lineTo(D / 2, 0); sh.lineTo(0, RH); sh.closePath();
    const gp = new THREE.ExtrudeGeometry(sh, { depth: W, bevelEnabled: false }); gp.translate(0, 0, -W / 2);
    const gm = new THREE.Mesh(gp, wallMat); gm.rotation.y = Math.PI / 2; roof.add(gm);
    const ang = Math.atan2(RH, D / 2), sl = Math.hypot(D / 2, RH) + over;
    for (const s of [-1, 1]) {
      const b = new THREE.Mesh(new THREE.BoxGeometry(W + over * 1.6, 0.22, sl), roofMat);
      b.position.set(0, RH / 2 + 0.1, s * (D / 4 + over * 0.3)); b.rotation.x = s * ang; roof.add(b);
    }
    g.add(roof);
    // 柱・梁
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.28, H, 0.28), timber); p.position.set(sx * W / 2, H / 2, sz * D / 2); g.add(p); }
    const beam = new THREE.Mesh(new THREE.BoxGeometry(W + 0.1, 0.22, D + 0.1), timber); beam.position.y = H * 0.62; beam.scale.set(1, 1, 1); g.add(beam);
    return g;
  }
  const win = (w = 0.9, h = 0.9) => { const gp = new THREE.Group(); gp.add(new THREE.Mesh(new THREE.BoxGeometry(w + 0.16, h + 0.16, 0.12), timber)); const gl = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.16), glass); gp.add(gl); const bar = new THREE.Mesh(new THREE.BoxGeometry(0.06, h, 0.2), timber); gp.add(bar); const bar2 = new THREE.Mesh(new THREE.BoxGeometry(w, 0.06, 0.2), timber); gp.add(bar2); return gp; };

  // 農家(実体は attachModels() でMeshy製の農家を置く。当たり判定とドアの位置だけここで決める)
  {
    const hx = -16, hz = -14, W = 9, D = 7;
    world.spots.house = { x: hx, z: hz, scale: 4.3, rot: 0 };
    addBox(hx, hz, W + 0.4, D + 0.4); keep(hx, hz, 8);
    world.spots.houseDoor = new THREE.Vector3(hx, 0, hz + D / 2 + 1.4);
  }
  // 動物小屋(実体は attachModels() でMeshy製の納屋を置く)
  {
    const bx = 25.6, bz = -5.4; world.spots.barn = { x: bx, z: bz, scale: 3.4, rot: 0 };
    addBox(bx, bz, 6.2, 5.4);
  }
  // よろずや・たねや(同じ屋台モデルを2軒に使い回す。実体は attachModels() で配置)
  {
    world.spots.stalls = [{ id: 'yorozu', x: 6.5, z: -7.5, rot: 0.15, scale: 3.4, name: 'よろずや', tint: [1, 1, 1] }, { id: 'tane', x: -2.5, z: -8.5, rot: -0.1, scale: 3.4, name: 'たねや', tint: [0.78, 1.0, 0.82] }];
    for (const st of world.spots.stalls) { addBox(st.x, st.z, 3.6, 2.0); keep(st.x, st.z, 4); st.at = new THREE.Vector3(st.x + Math.sin(st.rot) * 1.7, 0, st.z + Math.cos(st.rot) * 1.7); }
    world.spots.shop = world.spots.stalls[0].at;
  }
  // 風車(実体は attachModels() でMeshy製の風車を置く。羽根は別メッシュで回す)
  {
    const wx = 46, wz = -38; world.spots.windmill = { x: wx, z: wz, scale: 6.2, rot: -0.5 };
    addCircle(wx, wz, 3.6); keep(wx, wz, 6);
  }

  // 井戸・農具・牛舎・街灯(実体は attachModels() で配置)
  keep(38.5, -2, 8); keep(2, -20, 6);   // 牛舎・鶏小屋を 建てられる あき地(はじめは なにも ない)
  world.spots.ship = { x: -2.5, z: 3.5, scale: 1.7, rot: 0.3 }; addBox(-2.5, 3.5, 2.6, 2.2); keep(-2.5, 3.5, 3);
  world.spots.lanterns = []; // 道ぞいの街灯(後で道ができてから位置を決める)

  // --- 柵 ---
  const fenceSegs = []; world.fenceSegs = fenceSegs;   // 実体は attachModels() でMeshy製の柵を並べる
  function fence(a, b, { collide = true } = {}) {
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    fenceSegs.push([a, b]);
    if (collide) { if (Math.abs(b[0] - a[0]) > Math.abs(b[1] - a[1])) addBox((a[0] + b[0]) / 2, a[1], len, 0.5); else addBox(a[0], (a[1] + b[1]) / 2, 0.5, len); }
  }
  // 牧場(x17..31 / z-9..3、西側に門の開口)
  world.pen = null;   // 牛舎を 建てると できる
  keep(24, -3, 11);
  // なかまの ぼくじょう(あずけた モンスターが くらす。西がわに 入り口)
  keep(14, 22, 10); world.pasture = { x: 14, z: 22, r: 8 };
  for (let k = 0; k < 8; k++) { if (k === 3) continue; const a0 = (k * 45 + 22.5) * Math.PI / 180, a1 = ((k + 1) * 45 + 22.5) * Math.PI / 180; fence([14 + Math.cos(a0) * 8, 22 + Math.sin(a0) * 8], [14 + Math.cos(a1) * 8, 22 + Math.sin(a1) * 8]); }
  // 畑のまわり
  world.plotPos = [];   // 畑は 自分で草を刈って つくる
  keep(-11, 4, 8);
  world.fieldCenter = new THREE.Vector3(-10.5, 0, 3.8);

  // --- Meshy製「草むら」貼り絵(6方向アトラス)の共通部品 ---
  // 元モデル(665万頂点)を直交投影でレンダリングしたもの。素材原本/make_impostor.py で生成。
  const grassAtlas = new THREE.TextureLoader().load('./assets/textures/grass_atlas.png'); grassAtlas.colorSpace = THREE.SRGBColorSpace; grassAtlas.anisotropy = 4;
  const TUFT_W = 1.99, TUFT_H = 1.32;
  const tuftGeo = (variant) => {
    const parts = [];
    for (let k = 0; k < 3; k++) {
      const view = variant * 3 + k, col = view % 3, row = Math.floor(view / 3);
      const g = new THREE.PlaneGeometry(TUFT_W, TUFT_H); g.translate(0, TUFT_H / 2 - 0.02, 0);
      const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, (col + uv.getX(i)) / 3, 1 - (row + 1 - uv.getY(i)) / 2);
      g.rotateY(-[0, 60, 120, 180, 240, 300][view] * Math.PI / 180); parts.push(g);
    }
    return mergeGeometries(parts);
  };
  const grassTime = { value: 0 }; world.grassTime = grassTime;
  const grassMat = new THREE.MeshLambertMaterial({ map: grassAtlas, alphaTest: 0.4, side: THREE.DoubleSide, alphaToCoverage: true });
  grassMat.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = grassTime;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uTime;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n#ifdef USE_INSTANCING\nfloat ph=instanceMatrix[3].x*0.35+instanceMatrix[3].z*0.27;\nfloat hh=position.y*position.y*0.5;\ntransformed.x+=(sin(uTime*1.5+ph)*0.07+sin(uTime*3.1+ph*2.)*0.025)*hh;\ntransformed.z+=cos(uTime*1.2+ph*1.3)*0.05*hh;\n#endif');
  };
  const tuftGeos = [tuftGeo(0), tuftGeo(1)];

  // 立体の草(葉1枚ずつ曲線で作った芝)。足元の芝・麦に使う
  function bladeTuft(n, seed, { h0 = 0.4, h1 = 0.9, spread = 0.26, lo = '#2f5a1c', hi = '#a6d04e', wide = 1 } = {}) {
    const r2 = mulberry32(seed), pos = [], col = [], idx = [], c0 = new THREE.Color(lo), c1 = new THREE.Color(hi), tmp = new THREE.Color();
    for (let b = 0; b < n; b++) {
      const ang = r2() * 6.283, rad = Math.sqrt(r2()) * spread, bx = Math.cos(ang) * rad, bz = Math.sin(ang) * rad;
      const h = h0 + r2() * (h1 - h0), w = (0.05 + r2() * 0.035) * wide, yaw = r2() * 6.283, bend = (0.12 + r2() * 0.5) * h, k = 0.82 + r2() * 0.36;
      const dx = Math.cos(yaw), dz = Math.sin(yaw), sx = -dz, sz = dx, base = pos.length / 3;
      for (let l = 0; l <= 3; l++) {
        const t = l / 3, y = h * t, lean = bend * t * t, ww = w * (1 - t * t * 0.92) * 0.5;
        tmp.copy(c0).lerp(c1, Math.pow(t, 0.8)).multiplyScalar(k);
        for (const sd of [-1, 1]) { pos.push(bx + dx * lean + sx * ww * sd, y, bz + dz * lean + sz * ww * sd); col.push(tmp.r, tmp.g, tmp.b); }
      }
      for (let l = 0; l < 3; l++) { const q = base + l * 2; idx.push(q, q + 1, q + 2, q + 1, q + 3, q + 2, q + 2, q + 1, q, q + 2, q + 3, q + 1); } // 表裏とも上向き法線で均一に照らす
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    const nrm = new Float32Array(pos.length); for (let i = 0; i < nrm.length; i += 3) nrm[i + 1] = 1; g.setAttribute('normal', new THREE.BufferAttribute(nrm, 3)); g.setIndex(idx);
    return g;
  }
  const swayPatch = (sh) => {
    sh.uniforms.uTime = grassTime;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uTime;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n#ifdef USE_INSTANCING\nfloat ph=instanceMatrix[3].x*0.35+instanceMatrix[3].z*0.27;\nfloat hh=position.y*position.y;\ntransformed.x+=(sin(uTime*1.7+ph)*0.09+sin(uTime*3.3+ph*2.)*0.03)*hh;\ntransformed.z+=cos(uTime*1.3+ph*1.3)*0.06*hh;\n#endif');
  };
  const bladeMat = new THREE.MeshLambertMaterial({ vertexColors: true }); bladeMat.onBeforeCompile = swayPatch;
  const LAW = { h0: 0.2, h1: 0.5, spread: 0.3, lo: '#557f30', hi: '#b4d860', wide: 0.8 };
  const lawnGeos = [bladeTuft(15, 11, LAW), bladeTuft(15, 12, LAW), bladeTuft(15, 13, LAW), bladeTuft(12, 14, { ...LAW, h0: 0.15, h1: 0.34 })];
  const wheatGeos = [0, 1, 2].map(i => bladeTuft(14, 30 + i, { h0: 0.95, h1: 1.5, spread: 0.3, lo: '#a8923a', hi: '#f0d468', wide: 0.9 }));

  // 範囲ごとにメッシュを分けて配置(視錐台カリングが効くように)
  function scatterChunked(pts, geos, material, { scale, tint, yScale = [0.85, 1.25], cell = 22, maxDist = GRASS.dist }) {
    const buckets = new Map();
    pts.forEach((p, i) => { const key = Math.floor(p[0] / cell) + ',' + Math.floor(p[1] / cell) + ',' + (i % geos.length); (buckets.get(key) || buckets.set(key, []).get(key)).push(p); });
    const out = [];
    for (const [key, arr] of buckets) {
      const gi = +key.split(',')[2], im = new THREE.InstancedMesh(geos[gi], material, arr.length), mt = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
      arr.forEach(([x, z], i) => { e.set(0, R(0, 6.28), 0); q.setFromEuler(e); const sc = R(scale[0], scale[1]); mt.compose(new THREE.Vector3(x, heightAt(x, z) - 0.01, z), q, new THREE.Vector3(sc, sc * R(yScale[0], yScale[1]), sc)); im.setMatrixAt(i, mt); im.setColorAt(i, tint()); });
      im.computeBoundingSphere(); im.receiveShadow = true; im.userData.grass = true; out.push(im);
      world.lodChunks.push({ m: im, c: im.boundingSphere.center, r: im.boundingSphere.radius, max: maxDist });
    }
    return out;
  }
  const scatterTufts = (pts, { scale, tint, material }) => scatterChunked(pts, tuftGeos, material, { scale, tint });

  // --- 干し草・荷車・麦畑 ---
  const bales = [];
  {
    const tl = new THREE.TextureLoader(); const hs = tl.load('./assets/textures/hay_side.jpg'), he = tl.load('./assets/textures/hay_end.jpg');
    for (const t of [hs, he]) { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; }
    hs.center.set(0.5, 0.5); hs.rotation = Math.PI / 2; hs.wrapS = hs.wrapT = THREE.RepeatWrapping; hs.repeat.set(1, 1);
    const bg = new THREE.CylinderGeometry(0.6, 0.6, 1.9, 24); const bmats = [M({ map: hs }), M({ map: he }), M({ map: he })];
    world.makeBale = () => { const m = new THREE.Mesh(bg, bmats); m.castShadow = m.receiveShadow = true; return m; };
    const spots = [[12.5, -19], [14.2, -20.5], [12.8, -22], [14.6, -17.6], [16.2, -22.4], [11.6, -24.4]];
    for (const [x, z] of spots) { const m = world.makeBale(); m.rotation.z = Math.PI / 2; m.rotation.y = R(0, 3); m.position.set(x, heightAt(x, z) + 0.6, z); scene.add(m); bales.push({ mesh: m, x, z, y: m.position.y }); keep(x, z, 1.9); }   // ほしくさロールは すりぬけられる(草の判定で うごけなくならないように)
    world.spots.bales = bales;
    // 荷車(実体は attachModels() でMeshy製の荷車を置く)
    const cx = 7.5, cz = -24; world.spots.cart = { x: cx, z: cz, rot: 0.5 }; addCircle(cx, cz, 1.9); keep(cx, cz, 3);
    // 麦畑(立体の麦。金色のグラデーション)
    const rows = []; for (let x = 16; x < 40; x += 0.8) for (let z = -44; z < -28; z += 0.8) rows.push([x + R(-.3, .3), z + R(-.3, .3)]);
    scene.add(...scatterChunked(rows, wheatGeos, bladeMat, { scale: [0.8, 1.15], tint: () => { const l = R(0.88, 1.12); return new THREE.Color(l, l * R(0.94, 1.02), l * R(0.85, 1)); }, cell: 16 })); keep(28, -36, 13);
  }
  // 干し草の塔(牧場近く)
  {
    for (const [x, z] of [[14, 6], [16, 6.8], [14.8, 8.6]]) { const m = world.makeBale(); m.rotation.z = Math.PI / 2; m.rotation.y = R(0, 3); m.position.set(x, heightAt(x, z) + 0.6, z); scene.add(m); keep(x, z, 1.9); }
  }

  // --- 草 ---
  {
    const pts = []; let tries = 0;
    while (pts.length < GRASS.n && tries++ < 140000) {
      const a = R(0, 6.28), d = 78 * Math.sqrt(rnd()); const x = Math.cos(a) * d, z = Math.sin(a) * d;
      if (Math.hypot(x, z + 5) > 42 && rnd() < 0.55) continue; // 村の周りを密に、遠くはまばらに
      if (nearPath(x, z, 1.5)) continue;
      if (d > 60 && rnd() < sstep(0.03, 0.4, seaMask(x, z))) continue;   // 浜は草を生やさない
      let bad = false; for (const b of colliders.boxes) if (x > b.minx - .4 && x < b.maxx + .4 && z > b.minz - .4 && z < b.maxz + .4) { bad = true; break; }
      if (bad) continue;
      if (x > -16 && x < -5 && z > 0.5 && z < 7.4) continue; // 畑
      if (x > 14 && x < 41 && z > -45 && z < -27) continue; // 麦畑
      pts.push([x, z]);
    }
    scene.add(...scatterChunked(pts, lawnGeos, bladeMat, { scale: [0.8, 1.35], tint: () => { const l = R(0.85, 1.12); return new THREE.Color(l * R(0.92, 1.06), l, l * R(0.78, 1)); } }));
    // Meshy製の草むら(アクセント)。まばらに置く
    const acc = pts.filter((_, i) => i % GRASS.acc === 0);
    scene.add(...scatterTufts(acc, { scale: [0.5, 0.95], tint: () => { const l = R(0.92, 1.1); return new THREE.Color(l, l, l * 0.92); }, material: grassMat }));
    // Meshy製の地面の草(牧草/クローバーと小石)を真上から撮った貼り絵。地面に寝かせて敷く
    const dtex = new THREE.TextureLoader().load('./assets/textures/ground_decals.png'); dtex.colorSpace = THREE.SRGBColorSpace; dtex.anisotropy = 8;
    const dmat = new THREE.MeshLambertMaterial({ map: dtex, alphaTest: 0.45, polygonOffset: true, polygonOffsetFactor: -1.5, polygonOffsetUnits: -1.5 });
    const dgeo = (k) => { const g = new THREE.PlaneGeometry(1, 1); g.rotateX(-Math.PI / 2); const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setX(i, (k + uv.getX(i)) / 2); return g; };
    const up = new THREE.Vector3(0, 1, 0), qa = new THREE.Quaternion(), qb = new THREE.Quaternion(), nv = new THREE.Vector3(), mt = new THREE.Matrix4();
    const decals = (list, k, size, tintFn) => {
      const cell = 24, buckets = new Map(); const g = dgeo(k);
      list.forEach(p => { const key = Math.floor(p[0] / cell) + ',' + Math.floor(p[1] / cell); (buckets.get(key) || buckets.set(key, []).get(key)).push(p); });
      for (const arr of buckets.values()) {
        const im = new THREE.InstancedMesh(g, dmat, arr.length);
        arr.forEach(([x, z], i) => {
          const e = 0.6; nv.set(heightAt(x - e, z) - heightAt(x + e, z), 2 * e, heightAt(x, z - e) - heightAt(x, z + e)).normalize(); qa.setFromUnitVectors(up, nv); qb.setFromAxisAngle(up, R(0, 6.28));
          const sc = R(size[0], size[1]); mt.compose(new THREE.Vector3(x, heightAt(x, z) + 0.035, z), qa.multiply(qb), new THREE.Vector3(sc, 1, sc)); im.setMatrixAt(i, mt); im.setColorAt(i, tintFn());
        });
        im.receiveShadow = true; im.userData.grass = true; im.computeBoundingSphere(); scene.add(im);
      }
    };
    decals(pts.filter((_, i) => i % 5 === 1), 0, [1.4, 2.8], () => { const l = R(0.85, 1.1); return new THREE.Color(l * 0.92, l, l * 0.8); });
    decals(pts.filter((_, i) => i % 13 === 4), 1, [1.1, 2.0], () => { const l = R(0.9, 1.1); return new THREE.Color(l, l, l); });
  }

  // --- 道の縁になじませる土パッチ(Meshy製・真上から撮った貼り絵) ---
  if (false) {   // 汚れて見えるので廃止(2026-10-10)
    const t = new THREE.TextureLoader().load('./assets/textures/dirt_decal.png'); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    const mat = new THREE.MeshLambertMaterial({ map: t, alphaTest: 0.4, polygonOffset: true, polygonOffsetFactor: -2.5, polygonOffsetUnits: -2.5 });
    const g = new THREE.PlaneGeometry(1.66, 1).rotateX(-Math.PI / 2);
    const list = []; for (let i = 3; i < pathPts.length - 3; i += 6) list.push(i);
    const im = new THREE.InstancedMesh(g, mat, list.length), up = new THREE.Vector3(0, 1, 0), mt = new THREE.Matrix4(), qa = new THREE.Quaternion(), qb = new THREE.Quaternion(), nv = new THREE.Vector3();
    list.forEach((idx, k) => {
      const p = pathPts[idx], n = pathPts[idx + 2], ang = Math.atan2(n.x - p.x, n.z - p.z), off = R(-0.7, 0.7), x = p.x + Math.cos(ang) * off, z = p.z - Math.sin(ang) * off, e = 0.6;
      nv.set(heightAt(x - e, z) - heightAt(x + e, z), 2 * e, heightAt(x, z - e) - heightAt(x, z + e)).normalize(); qa.setFromUnitVectors(up, nv); qb.setFromAxisAngle(up, ang + Math.PI / 2 + R(-0.5, 0.5));
      const sc = R(1.5, 2.3); mt.compose(new THREE.Vector3(x, heightAt(x, z) + 0.06, z), qa.multiply(qb), new THREE.Vector3(sc, 1, sc)); im.setMatrixAt(k, mt);
    });
    im.receiveShadow = true; scene.add(im);
  }

  // --- 花 ---
  {
    const paint = (g, col) => { const c = new THREE.Color(col), n = g.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) a.set([c.r, c.g, c.b], i * 3); g.setAttribute('color', new THREE.BufferAttribute(a, 3)); return g.toNonIndexed(); };
    const flowerGeo = (color) => {
      const stem = paint(new THREE.CylinderGeometry(0.006, 0.009, 0.3, 4).translate(0, 0.15, 0), '#4f8a34');
      const head = new THREE.SphereGeometry(0.05, 7, 4); head.scale(1, 0.4, 1); head.translate(0, 0.31, 0);
      const core = new THREE.SphereGeometry(0.02, 5, 3); core.translate(0, 0.325, 0);
      return mergeGeometries([stem, paint(head, color), paint(core, '#e8a020')]);
    };
    const fl = (n, color, cond) => {
      const m = new THREE.InstancedMesh(flowerGeo(color), new THREE.MeshLambertMaterial({ vertexColors: true }), n); const mt = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(); let k = 0, tr = 0;
      while (k < n && tr++ < n * 40) { const a = R(0, 6.28), d = 76 * Math.sqrt(rnd()); const x = Math.cos(a) * d, z = Math.sin(a) * d; if (!cond(x, z) || nearPath(x, z, 1.2)) continue; if (x > -17 && x < -4 && z > -1 && z < 8) continue; e.set(R(-.2, .2), 0, R(-.2, .2)); q.setFromEuler(e); const s = R(0.7, 1.5); mt.compose(new THREE.Vector3(x, heightAt(x, z), z), q, new THREE.Vector3(s, s, s)); m.setMatrixAt(k++, mt); }
      m.count = k; m.userData.grass = true; scene.add(m);
    };
    const meadow = (x, z) => Math.hypot(x + 4, z - 56) < 26;
    fl(1400, '#f4d43a', (x, z) => meadow(x, z) || rnd() < 0.2);
    fl(700, '#ffffff', (x, z) => rnd() < 0.4); fl(380, '#ee7aa6', (x, z) => rnd() < 0.2);
  }

  // --- 木 ---
  {
    const part = (geo, color, y, jitter = 0.08) => { const g = geo.clone(); g.translate(0, y, 0); const c = new THREE.Color(color), n = g.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const f = 1 + (Math.random() - 0.5) * jitter * 2 + (g.attributes.position.getY(i) - y) * 0.04; a.set([c.r * f, c.g * f, c.b * f], i * 3); } g.setAttribute('color', new THREE.BufferAttribute(a, 3)); return g.toNonIndexed(); };
    const pine = mergeGeometries([part(new THREE.CylinderGeometry(0.22, 0.34, 2, 7), '#5a3a22', 1), part(new THREE.ConeGeometry(2.0, 3.2, 8), '#2e6a3a', 3), part(new THREE.ConeGeometry(1.6, 2.8, 8), '#357a40', 4.6), part(new THREE.ConeGeometry(1.1, 2.4, 8), '#3f8a48', 6.1)]);
    const blob = (r, x, y, z, c) => { const g = new THREE.IcosahedronGeometry(r, 1); g.translate(x, y, z); const col = new THREE.Color(c), n = g.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const f = 0.85 + Math.random() * 0.3 + (g.attributes.position.getY(i) - y) * 0.05; a.set([col.r * f, col.g * f, col.b * f], i * 3); } g.setAttribute('color', new THREE.BufferAttribute(a, 3)); return g.toNonIndexed(); };
    const oak = mergeGeometries([part(new THREE.CylinderGeometry(0.3, 0.45, 3, 7), '#6a4a2a', 1.5), blob(2.2, 0, 4.4, 0, '#4f9a3a'), blob(1.6, 1.5, 3.8, 0.4, '#5aa842'), blob(1.6, -1.4, 3.9, -0.5, '#4a9238'), blob(1.4, 0.2, 5.5, 0.5, '#62b04a')]);
    const mat = new THREE.MeshLambertMaterial({ vertexColors: true });
    const make = (geo, n, cond, scale, trunkR) => {
      const pos = []; let tr = 0;
      while (pos.length < n && tr++ < n * 60) { const a = R(0, 6.28), d = 18 + 66 * Math.sqrt(rnd()); const x = Math.cos(a) * d, z = Math.sin(a) * d; if (Math.hypot(x, z) > 80 || !cond(x, z) || !free(x, z, 2.2)) continue; if (pos.some(p => Math.hypot(p[0] - x, p[1] - z) < 3.2)) continue; pos.push([x, z]); }
      if (!geo) { pos.forEach(([x, z]) => addCircle(x, z, trunkR * scale * 0.7)); return pos; }   // geo無し=位置だけ(白樺。後でMeshy製を配置)
      const im = new THREE.InstancedMesh(geo, mat, pos.length), mt = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
      pos.forEach(([x, z], i) => { const s = scale * R(0.8, 1.4); e.set(0, R(0, 6.28), 0); q.setFromEuler(e); mt.compose(new THREE.Vector3(x, heightAt(x, z) - 0.1, z), q, new THREE.Vector3(s, s * R(0.9, 1.25), s)); im.setMatrixAt(i, mt); im.setColorAt(i, new THREE.Color().setHSL(R(0.28, 0.36), 0.15, 0.97)); addCircle(x, z, trunkR * s * 0.7); });
      im.castShadow = true; im.receiveShadow = true; im.userData.tree = true; scene.add(im); return pos;
    };
    const farFromVillage = (x, z) => Math.hypot(x, z + 5) > 30;
    const pinePos = make(null, MOBILE ? 280 : 330, (x, z) => farFromVillage(x, z) && !(Math.hypot(x + 4, z - 56) < 22) && (Math.hypot(x, z) > 44 || rnd() < 0.25), 1.2, 0.5);
    const pineNear = pinePos.filter(([x, z]) => Math.hypot(x, z + 5) < 52), pineFar = pinePos.filter(([x, z]) => Math.hypot(x, z + 5) >= 52);
    world.spots.pinesNear = pineNear;
    world.spots.pinesFar = pineFar;   // 遠景の松も Meshy製(面数を減らした版)を attachModels() で置く
    const oakPos = make(null, MOBILE ? 46 : 55, (x, z) => Math.hypot(x, z + 5) > 22 && !(Math.hypot(x + 4, z - 56) < 20), 1.0, 0.7);
    for (const p of oakPos) keep(p[0], p[1], 2.4);
    world.spots.oaks = oakPos; world.spots.pines = pinePos; world.spots.birches = oakPos;
  }

  // --- 山 ---
  world.mountainMeshes = [];
  {
    const rock = new THREE.Color('#7b7a72'), green = new THREE.Color('#5a7a48'), snow = new THREE.Color('#f6f8fc');
    for (let i = 0; i < 16; i++) {
      const a = i / 16 * Math.PI * 2 + R(-0.12, 0.12), d = R(150, 200), h = R(60, 110), r = h * R(0.7, 0.95); if (seaMask(Math.cos(a) * 100, Math.sin(a) * 100) > 0.0 || Math.abs(Math.atan2(Math.sin(a - SEA_A), Math.cos(a - SEA_A))) < 0.75) continue;
      const g = new THREE.ConeGeometry(r, h, 7, 6, true); g.translate(0, h / 2, 0); const p = g.attributes.position, col = new Float32Array(p.count * 3), c = new THREE.Color();
      for (let k = 0; k < p.count; k++) { const y = p.getY(k) / h; const j = (Math.sin(p.getX(k) * 0.3 + p.getZ(k) * 0.2) + 1) * 0.04; if (y > 0.05) { p.setX(k, p.getX(k) + R(-.04, .04) * r * (1 - y)); p.setZ(k, p.getZ(k) + R(-.04, .04) * r * (1 - y)); } c.copy(green).lerp(rock, sstep(0.18, 0.5, y + j)).lerp(snow, sstep(0.55, 0.7, y + j)); col.set([c.r, c.g, c.b], k * 3); }
      g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.computeVertexNormals();
      const m = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true })); m.position.set(Math.cos(a) * d, -8, Math.sin(a) * d); scene.add(m); world.mountainMeshes.push(m);
    }
  }

  // --- 資源スポット(game.jsが実体を作る) ---
  const spots = world.spots;
  const scatter = (n, cond, minD = 1.5) => { const out = []; let tr = 0; while (out.length < n && tr++ < n * 80) { const a = R(0, 6.28), d = 76 * Math.sqrt(rnd()); const x = Math.cos(a) * d, z = Math.sin(a) * d; if (!cond(x, z) || !free(x, z, 1)) continue; if (out.some(p => Math.hypot(p[0] - x, p[1] - z) < minD)) continue; out.push([x, z]); } return out; };
  spots.dandelions = scatter(110, (x, z) => Math.hypot(x + 4, z - 56) < 24).concat(scatter(18, (x, z) => Math.hypot(x, z) > 20));
  spots.berries = scatter(9, (x, z) => Math.hypot(x, z + 5) > 24 && Math.hypot(x, z) < 70, 6);
  spots.legend = [-4, 60];
  spots.mushrooms = []; for (const [ox, oz] of (spots.oaks || []).slice(0, 14)) { const a = R(0, 6.28); spots.mushrooms.push([ox + Math.cos(a) * 2.8, oz + Math.sin(a) * 2.8]); }
  spots.acorns = []; for (const [ox, oz] of (spots.oaks || []).slice(14, 30)) { const a = R(0, 6.28); spots.acorns.push([ox + Math.cos(a) * 2.4, oz + Math.sin(a) * 2.4]); }

  // --- Meshy製の3Dモデル(柵・荷車・白樺)を読み込んで配置 ---
  // 1つの大きなInstancedMeshを、区画ごとの小さなInstancedMeshに分ける(視界外は描画されなくなる)
  const splitInstanced = (im, { cell = 36, max = 140, cast = true } = {}) => {
    const buckets = new Map(), mt = new THREE.Matrix4(), col = new THREE.Color();
    for (let i = 0; i < im.count; i++) { im.getMatrixAt(i, mt); const x = mt.elements[12], z = mt.elements[14], key = Math.floor(x / cell) + ',' + Math.floor(z / cell); (buckets.get(key) || buckets.set(key, []).get(key)).push(i); }
    for (const ids of buckets.values()) {
      const sub = new THREE.InstancedMesh(im.geometry, im.material, ids.length);
      ids.forEach((src, k) => { im.getMatrixAt(src, mt); sub.setMatrixAt(k, mt); if (im.instanceColor) { im.getColorAt(src, col); sub.setColorAt(k, col); } });
      sub.castShadow = cast; sub.receiveShadow = true; sub.userData.tree = true; sub.computeBoundingSphere(); scene.add(sub);
      world.lodChunks.push({ m: sub, c: sub.boundingSphere.center, r: sub.boundingSphere.radius, max });
    }
    scene.remove(im); im.dispose();
  };
  // 四角いはんい(x0..x1, z0..z1)の草・花を 消す。かった あとの 地面を すっきり見せる
  world.hideGrass = (x0, z0, x1, z1) => {
    const mt = new THREE.Matrix4(), zero = new THREE.Matrix4().makeScale(0, 0, 0);
    scene.traverse(o => {
      if (!o.isInstancedMesh || !o.userData.grass) return;
      if (!o.boundingSphere) o.computeBoundingSphere(); const bs = o.boundingSphere;
      if (bs.center.x + bs.radius < x0 || bs.center.x - bs.radius > x1 || bs.center.z + bs.radius < z0 || bs.center.z - bs.radius > z1) return;
      let ch = false;
      for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, mt); const x = mt.elements[12], z = mt.elements[14]; if (x >= x0 && x <= x1 && z >= z0 && z <= z1 && mt.elements[0] !== 0) { (world._hid ||= []).push({ o, i, m: mt.clone(), x, z }); zero.elements[12] = x; zero.elements[13] = mt.elements[13]; zero.elements[14] = z; o.setMatrixAt(i, zero); ch = true; } }
      if (ch) o.instanceMatrix.needsUpdate = true;
    });
  };
  // かった ばしょの 草を もとに もどす(hideGrass で けした ぶんを ふっかつ)
  world.showGrass = (x0, z0, x1, z1) => {
    const keep = [];
    for (const h of world._hid || []) {
      if (h.x >= x0 && h.x <= x1 && h.z >= z0 && h.z <= z1) { h.o.setMatrixAt(h.i, h.m); h.o.instanceMatrix.needsUpdate = true; } else keep.push(h);
    }
    world._hid = keep;
  };
  world.attachModels = async (loader) => {
    const load = async (name) => { const g = await loader.loadAsync(`./assets/${name}_lite.glb`); g.scene.traverse(o => { if (o.isMesh) { if (!o.geometry.attributes.normal) o.geometry.computeVertexNormals(); o.material.side = THREE.FrontSide; } }); return g.scene; };
    const firstMesh = (root) => { let m = null; root.traverse(o => { if (!m && o.isMesh) m = o; }); return m; };
    const mt = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), pv = new THREE.Vector3(), sv = new THREE.Vector3();
    // 柵(1区間=長さ約1.9。区間ごとに伸縮して並べる)
    try {
      const m = firstMesh(await load('fence')), bb = new THREE.Box3().setFromBufferAttribute(m.geometry.attributes.position), len0 = bb.max.x - bb.min.x, h0 = bb.max.y - bb.min.y;
      const cells = []; for (const [a, b] of fenceSegs) { const len = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.round(len / 2)); for (let i = 0; i < n; i++) { const t0 = i / n, t1 = (i + 1) / n; cells.push([a[0] + (b[0] - a[0]) * (t0 + t1) / 2, a[1] + (b[1] - a[1]) * (t0 + t1) / 2, Math.atan2(b[1] - a[1], b[0] - a[0]), len / n]); } }
      const im = new THREE.InstancedMesh(m.geometry, m.material, cells.length);
      cells.forEach(([x, z, ang, l], i) => { const sx = l / len0 * 1.04, sy = 1.15 / h0 * 1.0; e.set(0, -ang, 0); q.setFromEuler(e); mt.compose(pv.set(x, heightAt(x, z) + (-bb.min.y) * sy, z), q, sv.set(sx, sy, sx * 1.1)); im.setMatrixAt(i, mt); });
      im.castShadow = im.receiveShadow = true; im.computeBoundingSphere(); scene.add(im);
    } catch (err) { console.warn('fence model failed', err); }
    // 農家
    try {
      const m = firstMesh(await load('farmhouse')), bb = new THREE.Box3().setFromBufferAttribute(m.geometry.attributes.position), h = world.spots.house;
      const mesh = new THREE.Mesh(m.geometry, m.material); mesh.scale.setScalar(h.scale); mesh.position.set(h.x, heightAt(h.x, h.z) - bb.min.y * h.scale, h.z); mesh.rotation.y = h.rot; mesh.castShadow = mesh.receiveShadow = true; scene.add(mesh);
    } catch (err) { console.warn('farmhouse model failed', err); }
    // 納屋
    try {
      const m = firstMesh(await load('barn')), bb = new THREE.Box3().setFromBufferAttribute(m.geometry.attributes.position), c = world.spots.barn;
      const mesh = new THREE.Mesh(m.geometry, m.material); mesh.scale.setScalar(c.scale); mesh.position.set(c.x, heightAt(c.x, c.z) - bb.min.y * c.scale, c.z); mesh.rotation.y = c.rot; mesh.castShadow = mesh.receiveShadow = true; scene.add(mesh);
    } catch (err) { console.warn('barn model failed', err); }
    // 風車(塔 + 回る羽根)
    try {
      const tower = firstMesh(await load('windmill_tower')), blades = firstMesh(await load('windmill_blades')), c = world.spots.windmill;
      const hubInfo = await (await fetch('./assets/data/windmill_hub.json')).json();
      const bb = new THREE.Box3().setFromBufferAttribute(tower.geometry.attributes.position), sc = c.scale;
      const grp = new THREE.Group(); grp.position.set(c.x, heightAt(c.x, c.z) - bb.min.y * sc, c.z); grp.rotation.y = c.rot; scene.add(grp);
      const tm = new THREE.Mesh(tower.geometry, tower.material); tm.scale.setScalar(sc); tm.castShadow = tm.receiveShadow = true; grp.add(tm);
      const pivot = new THREE.Group(); pivot.position.set(hubInfo.hub[0] * sc, hubInfo.hub[1] * sc, 0); grp.add(pivot);
      const bm = new THREE.Mesh(blades.geometry, blades.material); bm.scale.setScalar(sc); bm.castShadow = true; pivot.add(bm); world.windmill = pivot;
    } catch (err) { console.warn('windmill model failed', err); }
    // --- 2026-10-07追加のMeshy素材 ---
    const placeStatic = async (name, x, z, scale, rot, extra) => {
      const m = firstMesh(await load(name)), bb = new THREE.Box3().setFromBufferAttribute(m.geometry.attributes.position);
      const mesh = new THREE.Mesh(m.geometry, m.material); mesh.scale.setScalar(scale); mesh.position.set(x, heightAt(x, z) - bb.min.y * scale, z); mesh.rotation.y = rot; mesh.castShadow = mesh.receiveShadow = true; scene.add(mesh); if (extra) extra(mesh, bb); return mesh;
    };
    // --- 海辺(桟橋・ボート・流木・釣りどうぐ・のりあみ) ---
    try {
      const A = SEA_A, dx = Math.cos(A), dz = Math.sin(A), px = -dz, pz = dx;   // 桟橋の向き と 横向き
      const pier = firstMesh(await load('pier')), pb = new THREE.Box3().setFromBufferAttribute(pier.geometry.attributes.position), sc = 2.9, segL = (pb.max.x - pb.min.x) * sc, N = 3, r0 = 73;
      const deckY = world.PIER_Y, width = (pb.max.z - pb.min.z) * sc;
      world.spots.pier = { r0, dx, dz, len: segL * N, w: width, end: { x: dx * (r0 + segL * N - 1.8), z: dz * (r0 + segL * N - 1.8) }, base: { x: dx * (r0 + 2), z: dz * (r0 + 2) } };
      const legMat = new THREE.MeshLambertMaterial({ color: '#4a3220' });
      for (let i = 0; i < N; i++) {
        const rr = r0 + segL * (i + 0.5), x = dx * rr, z = dz * rr, mesh = new THREE.Mesh(pier.geometry, pier.material);
        mesh.scale.setScalar(sc); mesh.rotation.y = -A; mesh.position.set(x, deckY + 0.03 * sc, z); mesh.castShadow = mesh.receiveShadow = true; scene.add(mesh);
        for (const sgn of [-1, 1]) for (const t of [-0.3, 0.3]) { const lx = x + px * sgn * (width / 2 - 0.25) + dx * segL * t, lz = z + pz * sgn * (width / 2 - 0.25) + dz * segL * t, ground = Math.min(heightAt(lx, lz), -0.5), h = deckY - ground + 0.3; const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.19, h, 7), legMat); leg.position.set(lx, ground + h / 2 - 0.1, lz); leg.castShadow = true; scene.add(leg); }
      }
      world.onPier = (x, z) => { const rx = x - 0, t = x * dx + z * dz - r0, perp = x * px + z * pz; return t > -1 && t < segL * N + 0.5 && Math.abs(perp) < width / 2 - 0.15; };
      // ボート(岸の水ぎわ)
      const boat = firstMesh(await load('rowboat')), bb = new THREE.Box3().setFromBufferAttribute(boat.geometry.attributes.position), bs = 1.9;
      { const rr = 82.8, ang = A + 0.2, x = Math.cos(ang) * rr, z = Math.sin(ang) * rr, m = new THREE.Mesh(boat.geometry, boat.material); m.scale.setScalar(bs); m.rotation.y = -ang + 0.5; m.position.set(x, Math.max(heightAt(x, z), SEA_Y) - bb.min.y * bs + 0.02, z); m.castShadow = m.receiveShadow = true; scene.add(m); world.spots.boat = { x, z }; addCircle(x, z, 1.5); }
      // 流木
      const dw = firstMesh(await load('driftwood')), db = new THREE.Box3().setFromBufferAttribute(dw.geometry.attributes.position);
      for (const [rr, da, s2, ry] of [[76, -0.2, 1.7, 0.4], [79.5, 0.28, 1.3, 2.0], [70, 0.12, 1.5, 4.2]]) { const ang = A + da, x = Math.cos(ang) * rr, z = Math.sin(ang) * rr, m = new THREE.Mesh(dw.geometry, dw.material); m.scale.setScalar(s2); m.rotation.y = ry; m.position.set(x, heightAt(x, z) - db.min.y * s2 + 0.02, z); m.castShadow = m.receiveShadow = true; scene.add(m); addCircle(x, z, 0.8); }
      // 釣りどうぐ(桟橋のつけねの脇)
      const fg = firstMesh(await load('fishing_gear')), fb = new THREE.Box3().setFromBufferAttribute(fg.geometry.attributes.position);
      { const x = dx * 70.5 + px * 3.4, z = dz * 70.5 + pz * 3.4, m = new THREE.Mesh(fg.geometry, fg.material); m.scale.setScalar(1.5); m.rotation.y = -A + 1.2; m.position.set(x, heightAt(x, z) - fb.min.y * 1.5, z); m.castShadow = m.receiveShadow = true; scene.add(m); addCircle(x, z, 0.8); }
      // のりあみ(浅い海に6つ)
      const nr = firstMesh(await load('nori_rack')), nb = new THREE.Box3().setFromBufferAttribute(nr.geometry.attributes.position), ns = 1.5;
      world.spots.nori = [];
      for (const rr of [82.8, 86.2, 89.4]) for (const sgn of [-1, 1]) {
        const x = dx * rr + px * sgn * 4.6, z = dz * rr + pz * sgn * 4.6, y = Math.max(heightAt(x, z), SEA_Y - 1.0);
        const m = new THREE.Mesh(nr.geometry, nr.material); m.scale.setScalar(ns * 1.5); m.rotation.y = -A; m.position.set(x, y - nb.min.y * ns * 1.5 + 0.25, z); m.castShadow = true; scene.add(m);
        world.spots.nori.push({ x, z, y: y + 0.25 + (nb.max.y - nb.min.y) * ns * 1.5 * 0.55, len: (nb.max.x - nb.min.x) * ns * 1.5, rot: -A });
      }
    } catch (err) { console.warn('seaside failed', err); }
    try { const c = world.spots.ship; await placeStatic('storage', c.x, c.z, c.scale, c.rot); } catch (err) { console.warn('ship failed', err); }
    try {
      for (const st of world.spots.stalls) {
        const mesh = await placeStatic('stall', st.x, st.z, st.scale, st.rot); mesh.material = mesh.material.clone(); mesh.material.color.setRGB(...st.tint);
        const cv = document.createElement('canvas'); cv.width = 256; cv.height = 96; const g = cv.getContext('2d'); g.fillStyle = '#5a3a22'; g.fillRect(0, 0, 256, 96); g.strokeStyle = '#e8c870'; g.lineWidth = 6; g.strokeRect(5, 5, 246, 86);
        g.fillStyle = '#f6e6b8'; g.font = 'bold 54px "Zen Maru Gothic", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(st.name, 128, 50);
        const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.64), new THREE.MeshLambertMaterial({ map: t }));
        sign.position.set(st.x + Math.sin(st.rot) * 1.5, heightAt(st.x, st.z) + 3.2, st.z + Math.cos(st.rot) * 1.5); sign.rotation.y = st.rot; scene.add(sign);
      }
    } catch (err) { console.warn('stall failed', err); }
    // 遠景の雪山(Meshy製。山脈を外周に、独立峰を手前に)
    if (!location.search.includes('oldmt')) try {   // Meshy製の雪山(?oldmt で従来の円錐山に戻せる)
      const ridge = firstMesh(await load('range')), peak = firstMesh(await load('peak')), rb = new THREE.Box3().setFromBufferAttribute(ridge.geometry.attributes.position), pb = new THREE.Box3().setFromBufferAttribute(peak.geometry.attributes.position);
      world.mountainMeshes.forEach(m => { scene.remove(m); });
      const put = (m, bb, x, z, sc, rot, sy = 1) => { const mat = m.material.clone(); mat.color.setRGB(1.55, 1.65, 1.9); mat.emissive = new THREE.Color('#9fb4d4'); mat.emissiveIntensity = 0.28; const o = new THREE.Mesh(m.geometry, mat); o.scale.set(sc, sc * sy, sc); o.position.set(x, -bb.min.y * sc * sy - 6, z); o.rotation.y = rot; o.matrixAutoUpdate = true; scene.add(o); return o; };
      for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + 0.3; if (Math.abs(Math.atan2(Math.sin(a - SEA_A), Math.cos(a - SEA_A))) < 0.85) continue; put(ridge, rb, Math.cos(a) * 400, Math.sin(a) * 400, 230, -a + Math.PI / 2 + R(-0.3, 0.3), 2.6); }
      for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2 + R(-0.2, 0.2), d = R(215, 250), sc = R(85, 125); if (Math.abs(Math.atan2(Math.sin(a - SEA_A), Math.cos(a - SEA_A))) < 0.8) continue; put(peak, pb, Math.cos(a) * d, Math.sin(a) * d, sc, R(0, 6.28)); }
    } catch (err) { console.warn('mountains failed', err); }
    // 松(近景はMeshy製)
    try {
      const m = firstMesh(await load('pine')), bb = new THREE.Box3().setFromBufferAttribute(m.geometry.attributes.position), pos = world.spots.pinesNear;
      const im = new THREE.InstancedMesh(m.geometry, m.material, pos.length);
      pos.forEach(([x, z], i) => { const sc = R(4.8, 7.2); e.set(0, R(0, 6.28), 0); q.setFromEuler(e); mt.compose(pv.set(x, heightAt(x, z) - bb.min.y * sc - 0.1, z), q, sv.set(sc * R(0.9, 1.15), sc * R(0.9, 1.1), sc * R(0.9, 1.15))); im.setMatrixAt(i, mt); im.setColorAt(i, new THREE.Color().setHSL(R(0.25, 0.33), 0.12, R(0.88, 1.05))); });
      im.castShadow = im.receiveShadow = true; im.userData.tree = true; im.computeBoundingSphere(); scene.add(im); splitInstanced(im, { cell: 34, max: MOBILE ? 90 : 120, cast: !MOBILE });
    } catch (err) { console.warn('pine failed', err); }
    // 雲(Meshy製。ふわふわ・細長い・入道雲、まれにチンチラ形)
    try {
      const kinds = [['cloud_fluffy', 6, 55, 80], ['cloud_long', 5, 90, 140], ['cloud_cumulo', 3, 50, 70], ['cloud_chin', 2, 65, 80]], bag = []; kinds.forEach(([n, c]) => { for (let i = 0; i < c; i++) bag.push(n); });
      const mods = {}, mats = []; world.cloudMats = mats;
      for (const [n] of kinds) { const m = firstMesh(await load(n)); const mat = new THREE.MeshBasicMaterial({ map: m.material.map, fog: false }); mats.push(mat); mods[n] = { geo: m.geometry, mat, bb: new THREE.Box3().setFromBufferAttribute(m.geometry.attributes.position) }; }
      world.clouds.forEach((grp, i) => {
        while (grp.children.length) { const c = grp.children[0]; grp.remove(c); if (c.material) c.material.dispose(); }
        const n = bag[i % bag.length], k = kinds.find(x => x[0] === n), mo = mods[n], sc = R(k[2], k[3]);
        const mesh = new THREE.Mesh(mo.geo, mo.mat); mesh.scale.setScalar(sc); mesh.rotation.y = R(0, 6.28); grp.add(mesh); grp.visible = true;
      });
    } catch (err) { console.warn('clouds failed', err); world.clouds.forEach(g => { g.visible = true; }); }
    // 遠景の松(軽量版)
    try {
      const m = firstMesh(await load('pine_far')), bb = new THREE.Box3().setFromBufferAttribute(m.geometry.attributes.position), pos = world.spots.pinesFar;
      const im = new THREE.InstancedMesh(m.geometry, m.material, pos.length);
      pos.forEach(([x, z], i) => { const sc = R(4.8, 7.2); e.set(0, R(0, 6.28), 0); q.setFromEuler(e); mt.compose(pv.set(x, heightAt(x, z) - bb.min.y * sc - 0.1, z), q, sv.set(sc * R(0.9, 1.15), sc * R(0.9, 1.1), sc * R(0.9, 1.15))); im.setMatrixAt(i, mt); im.setColorAt(i, new THREE.Color().setHSL(R(0.25, 0.33), 0.12, R(0.88, 1.05))); });
      im.castShadow = false; im.receiveShadow = true; im.userData.tree = true; im.computeBoundingSphere(); scene.add(im); splitInstanced(im, { cell: 40, max: 260, cast: false });
    } catch (err) { console.warn('pine far failed', err); }
    // 街灯(夜は灯りがともる)
    try {
      const m = firstMesh(await load('lantern')), bb = new THREE.Box3().setFromBufferAttribute(m.geometry.attributes.position), sc = 1.7, P = world.paths[0], list = [];
      for (let i = 14; i < P.length - 10; i += 14) { const a = P[i], b = P[i + 2], ang = Math.atan2(b.x - a.x, b.z - a.z), side = (list.length % 2 ? 1 : -1), x = a.x + Math.cos(ang) * 2.6 * side, z = a.z - Math.sin(ang) * 2.6 * side; if (!free(x, z, 0.6)) continue; list.push([x, z, ang, side]); }
      const glowTex = softTex('rgba(255,214,120,1)'); world.lanternGlows = [];
      for (const [x, z, ang, side] of list) {
        const mesh = new THREE.Mesh(m.geometry, m.material); mesh.scale.setScalar(sc); mesh.position.set(x, heightAt(x, z) - bb.min.y * sc, z); mesh.rotation.y = ang + (side > 0 ? Math.PI : 0); mesh.castShadow = true; scene.add(mesh); addCircle(x, z, 0.3);
        const g = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: '#ffcf70', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }));
        const lamp = new THREE.Vector3(-0.3 * sc, 0.5 * sc - bb.min.y * sc, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), mesh.rotation.y); g.position.set(x + lamp.x, heightAt(x, z) + lamp.y, z + lamp.z); g.scale.setScalar(2.6); scene.add(g); world.lanternGlows.push(g);
      }
    } catch (err) { console.warn('lantern failed', err); }
    // 荷車
    try {
      const m = firstMesh(await load('wagon')), bb = new THREE.Box3().setFromBufferAttribute(m.geometry.attributes.position), c = world.spots.cart, s = 1.9;
      const mesh = new THREE.Mesh(m.geometry, m.material); mesh.scale.setScalar(s); mesh.position.set(c.x, heightAt(c.x, c.z) - bb.min.y * s, c.z); mesh.rotation.y = c.rot; mesh.castShadow = mesh.receiveShadow = true; scene.add(mesh);
    } catch (err) { console.warn('wagon model failed', err); }
    // 白樺
    try {
      const m = firstMesh(await load('birch')), bb = new THREE.Box3().setFromBufferAttribute(m.geometry.attributes.position), pos = world.spots.birches;
      const im = new THREE.InstancedMesh(m.geometry, m.material, pos.length);
      pos.forEach(([x, z], i) => { const s = R(3.2, 4.8); e.set(0, R(0, 6.28), 0); q.setFromEuler(e); mt.compose(pv.set(x, heightAt(x, z) - bb.min.y * s - 0.05, z), q, sv.set(s, s * R(0.92, 1.12), s)); im.setMatrixAt(i, mt); im.setColorAt(i, new THREE.Color().setHSL(R(0.2, 0.3), 0.1, R(0.9, 1.05))); });
      im.castShadow = im.receiveShadow = true; im.userData.tree = true; im.computeBoundingSphere(); scene.add(im); splitInstanced(im, { cell: 34, max: MOBILE ? 100 : 130, cast: !MOBILE });
    } catch (err) { console.warn('birch model failed', err); }
  };

  world.clouds = clouds; world.PIER_Y = 0.55;

  // --- 更新 ---
  let lodT = 0;
  world.update = (dt, t) => {
    lodT -= dt; if (lodT <= 0) { lodT = 0.3; const f = world.focus; for (const c of world.lodChunks) { const d = Math.hypot(c.c.x - f.x, c.c.z - f.z) - c.r; c.m.visible = d < c.max; } }
    if (world.lanternGlows) { const h = world.hour ?? 12, n = h > 18.2 || h < 5.8 ? 1 : h > 17 ? (h - 17) / 1.2 : h < 7 ? (7 - h) / 1.2 : 0; for (const g of world.lanternGlows) g.material.opacity = n * (0.75 + Math.sin(t * 5 + g.position.x) * 0.06); }
    world.grassTime.value = t;
    if (world.water) { world.water.tex.offset.set(t * 0.012, t * 0.006); world.water.mesh.position.y = SEA_Y + Math.sin(t * 0.6) * 0.04; }
    if (world.windmill) world.windmill.rotation.z -= dt * 0.35;
    if (world.cloudMats) { const h = world.hour ?? 12, d = h > 7 && h < 17.5 ? 1 : h > 19.5 || h < 5 ? 0.22 : h >= 17.5 ? 1 - (h - 17.5) / 2 * 0.78 : 0.22 + (h - 5) / 2 * 0.78; const warm = (h > 16.5 && h < 19.5) || (h > 5 && h < 7.5) ? 0.12 : 0; for (const m of world.cloudMats) m.color.setRGB(d, d * (1 - warm * 0.5), d * (1 - warm)); }
    for (const c of clouds) { c.position.x += dt * 1.2; if (c.position.x > 340) c.position.x = -340; }
  };
  world.tex = { soft: softTex };
  return world;
}

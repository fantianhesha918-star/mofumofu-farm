// 「月」シリーズ ブロックの せかい(しさく): くぎり(チャンク)で ちけいを つくって、ちかくだけ えがく。こわす・おく・あつめる
import * as THREE from 'three';

const CS = 16, CH = 64, SEA = 20;   // くぎりの よこ、たかさ、うみの たかさ
const $ = (s) => document.querySelector(s);
const isTouch = matchMedia('(pointer:coarse)').matches || 'ontouchstart' in window;
const params = new URLSearchParams(location.search);
let RD = +(params.get('rd') || (isTouch ? 3 : 5));   // えんきょり(くぎりの かず)
const SAVE = 'mofu-voxel-v1';

// ---- ブロック ----
const B = { AIR: 0, GRASS: 1, DIRT: 2, STONE: 3, SAND: 4, LOG: 5, LEAVES: 6, PLANKS: 7, WATER: 8, GLASS: 9 };
const NAMES = { 1: 'くさ', 2: 'つち', 3: 'いし', 4: 'すな', 5: 'き', 6: 'は', 7: 'いた', 9: 'ガラス' };
const COLORS = { 1: '#6bbf4a', 2: '#8a5e3a', 3: '#8a8e96', 4: '#e6d596', 5: '#7a5430', 6: '#4f9a3a', 7: '#c89a58', 9: '#bfe8f4' };
const DROP = { 1: B.DIRT, 6: 0 };   // くさを こわすと つち、はは なにも でない
const HOT = [B.GRASS, B.DIRT, B.STONE, B.SAND, B.LOG, B.PLANKS, B.LEAVES, B.GLASS];
const solid = (b) => b !== B.AIR && b !== B.WATER;
const opaque = (b) => b !== B.AIR && b !== B.WATER && b !== B.LEAVES && b !== B.GLASS;

// ---- ようぐ(ノイズ) ----
const hash2 = (x, z, s = 0) => { let h = (x * 374761393 + z * 668265263 + s * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
function vnoise(x, z, s) { const xi = Math.floor(x), zi = Math.floor(z), xf = x - xi, zf = z - zi, u = xf * xf * (3 - 2 * xf), v = zf * zf * (3 - 2 * zf); const a = hash2(xi, zi, s), b = hash2(xi + 1, zi, s), c = hash2(xi, zi + 1, s), d = hash2(xi + 1, zi + 1, s); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; }
const fbm = (x, z, s) => vnoise(x / 64, z / 64, s) * 0.55 + vnoise(x / 28, z / 28, s + 1) * 0.3 + vnoise(x / 11, z / 11, s + 2) * 0.15;
const heightAt = (x, z) => Math.max(4, Math.min(CH - 14, Math.floor(SEA - 4 + (fbm(x, z, 7) - 0.3) * 46)));
const treeAt = (x, z) => { const h = heightAt(x, z); return h > SEA + 1 && hash2(x, z, 99) < 0.012 && vnoise(x / 40, z / 40, 5) > 0.35; };

// ---- せかい ----
const chunks = new Map();   // "cx,cz" -> { data, mesh, wmesh, dirty }
const edits = new Map();    // "cx,cz" -> Map(idx -> block)
const key = (cx, cz) => cx + ',' + cz, idx = (x, y, z) => (y * CS + z) * CS + x;
function genChunk(cx, cz) {
  const d = new Uint8Array(CS * CS * CH);
  for (let z = 0; z < CS; z++) for (let x = 0; x < CS; x++) {
    const wx = cx * CS + x, wz = cz * CS + z, h = heightAt(wx, wz), beach = h <= SEA + 1;
    for (let y = 0; y <= h; y++) d[idx(x, y, z)] = y === h ? (beach ? B.SAND : B.GRASS) : y >= h - 3 ? (beach ? B.SAND : B.DIRT) : B.STONE;
    for (let y = h + 1; y <= SEA; y++) d[idx(x, y, z)] = B.WATER;
  }
  for (let tz = cz * CS - 3; tz < cz * CS + CS + 3; tz++) for (let tx = cx * CS - 3; tx < cx * CS + CS + 3; tx++) {   // きを たてる(くぎりを またいでも きれない)
    if (!treeAt(tx, tz)) continue; const h = heightAt(tx, tz), th = 4 + Math.floor(hash2(tx, tz, 3) * 2);
    const put = (x, y, z, b) => { const lx = x - cx * CS, lz = z - cz * CS; if (lx < 0 || lz < 0 || lx >= CS || lz >= CS || y >= CH) return; const i = idx(lx, y, lz); if (b === B.LEAVES && d[i] !== B.AIR) return; d[i] = b; };
    for (let y = 1; y <= th; y++) put(tx, h + y, tz, B.LOG);
    for (let dy = th - 2; dy <= th + 1; dy++) { const r = dy >= th ? 1 : 2; for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) if (!(Math.abs(dx) === r && Math.abs(dz) === r && (dy >= th || hash2(tx + dx, tz + dz, dy) < 0.5)) && !(dx === 0 && dz === 0 && dy <= th)) put(tx + dx, h + dy, tz + dz, B.LEAVES); }
  }
  const e = edits.get(key(cx, cz)); if (e) for (const [i, b] of e) d[i] = b;
  return d;
}
function getChunk(cx, cz) { const k = key(cx, cz); let c = chunks.get(k); if (!c) { c = { data: genChunk(cx, cz), mesh: null, wmesh: null, dirty: true, cx, cz }; chunks.set(k, c); } return c; }
function getBlock(x, y, z) { if (y < 0) return B.STONE; if (y >= CH) return B.AIR; const cx = Math.floor(x / CS), cz = Math.floor(z / CS); return getChunk(cx, cz).data[idx(x - cx * CS, y, z - cz * CS)]; }
function setBlock(x, y, z, b, record = true) {
  if (y < 0 || y >= CH) return; const cx = Math.floor(x / CS), cz = Math.floor(z / CS), c = getChunk(cx, cz), lx = x - cx * CS, lz = z - cz * CS, i = idx(lx, y, lz);
  c.data[i] = b; c.dirty = true; if (lx === 0) getChunk(cx - 1, cz).dirty = true; if (lx === CS - 1) getChunk(cx + 1, cz).dirty = true; if (lz === 0) getChunk(cx, cz - 1).dirty = true; if (lz === CS - 1) getChunk(cx, cz + 1).dirty = true;
  if (record) { let e = edits.get(key(cx, cz)); if (!e) edits.set(key(cx, cz), e = new Map()); e.set(i, b); saveSoon(); }
}

// ---- テクスチャ(てがき ふうの ブロック) ----
const TILES = ['grass_top', 'grass_side', 'dirt', 'stone', 'sand', 'log_top', 'log_side', 'leaves', 'planks', 'water', 'glass'];
const atlas = (() => {
  const T = 16, cv = document.createElement('canvas'); cv.width = T * TILES.length; cv.height = T; const g = cv.getContext('2d');
  const rnd = (n, s) => hash2(n, s, 41);
  const px = (i, x, y, c) => { g.fillStyle = c; g.fillRect(i * T + x, y, 1, 1); };
  const shade = (hex, k) => { const n = parseInt(hex.slice(1), 16), r = Math.max(0, Math.min(255, ((n >> 16) & 255) * k)) | 0, gg = Math.max(0, Math.min(255, ((n >> 8) & 255) * k)) | 0, b = Math.max(0, Math.min(255, (n & 255) * k)) | 0; return `rgb(${r},${gg},${b})`; };
  const fill = (i, base, v = 0.14, extra) => { for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) { const k = 1 + (rnd(x + i * 17, y) - 0.5) * 2 * v; px(i, x, y, shade(base, k)); } if (extra) extra(i); };
  fill(0, '#6bbf4a', 0.16, (i) => { for (let n = 0; n < 10; n++) px(i, Math.floor(rnd(n, 7) * T), Math.floor(rnd(n, 8) * T), '#8bd860'); });
  fill(2, '#8a5e3a', 0.18, (i) => { for (let n = 0; n < 8; n++) px(i, Math.floor(rnd(n, 9) * T), Math.floor(rnd(n, 10) * T), '#6d472a'); });
  fill(1, '#8a5e3a', 0.18); for (let x = 0; x < T; x++) { const hh = 4 + Math.floor(rnd(x, 3) * 3); for (let y = 0; y < hh; y++) px(1, x, y, shade('#6bbf4a', 1 + (rnd(x, y + 20) - 0.5) * 0.3)); }
  fill(3, '#8a8e96', 0.12, (i) => { for (let n = 0; n < 6; n++) { const x = Math.floor(rnd(n, 11) * 13), y = Math.floor(rnd(n, 12) * 13); for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) if (rnd(a * 5 + b, n) > 0.3) px(i, x + a, y + b, '#6f737b'); } });
  fill(4, '#e6d596', 0.07, (i) => { for (let n = 0; n < 8; n++) px(i, Math.floor(rnd(n, 13) * T), Math.floor(rnd(n, 14) * T), '#d2c07e'); });
  fill(5, '#b08850', 0.08, (i) => { for (let r = 2; r < 8; r += 2) for (let a = 0; a < 40; a++) { const t = a / 40 * 6.283; px(i, Math.round(7.5 + Math.cos(t) * r), Math.round(7.5 + Math.sin(t) * r), '#8a6a3a'); } });
  fill(6, '#7a5430', 0.1, (i) => { for (let x = 0; x < T; x += 3) for (let y = 0; y < T; y++) px(i, x, y, '#5e3f20'); });
  fill(7, '#4f9a3a', 0.2, (i) => { for (let n = 0; n < 30; n++) px(i, Math.floor(rnd(n, 15) * T), Math.floor(rnd(n, 16) * T), '#3a7a2a'); for (let n = 0; n < 6; n++) { const x = Math.floor(rnd(n, 17) * T), y = Math.floor(rnd(n, 18) * T); g.clearRect(i * T + x, y, 1, 1); } });
  fill(8, '#c89a58', 0.08, (i) => { for (let y = 3; y < T; y += 4) for (let x = 0; x < T; x++) px(i, x, y, '#a67a3e'); for (let x = 0; x < T; x++) px(i, x, 0, '#e0b878'); });
  fill(9, '#3a7ad0', 0.05);
  g.clearRect(10 * T, 0, T, T); g.strokeStyle = '#ffffffcc'; g.lineWidth = 1; g.strokeRect(10 * T + 0.5, 0.5, T - 1, T - 1); g.fillStyle = '#bfe8f466'; g.fillRect(10 * T + 1, 1, T - 2, T - 2); g.fillStyle = '#fff'; g.fillRect(10 * T + 3, 3, 3, 1); g.fillRect(10 * T + 3, 3, 1, 3);
  const t = new THREE.CanvasTexture(cv); t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.colorSpace = THREE.SRGBColorSpace; t.generateMipmaps = false; return t;
})();
const TILE_OF = { [B.GRASS]: [1, 1, 0, 2, 1, 1], [B.DIRT]: [2, 2, 2, 2, 2, 2], [B.STONE]: [3, 3, 3, 3, 3, 3], [B.SAND]: [4, 4, 4, 4, 4, 4], [B.LOG]: [6, 6, 5, 5, 6, 6], [B.LEAVES]: [7, 7, 7, 7, 7, 7], [B.PLANKS]: [8, 8, 8, 8, 8, 8], [B.WATER]: [9, 9, 9, 9, 9, 9], [B.GLASS]: [10, 10, 10, 10, 10, 10] };
// 面の ならび: +x, -x, +y, -y, +z, -z
const FACES = [
  { n: [1, 0, 0], v: [[1, 0, 1], [1, 0, 0], [1, 1, 0], [1, 1, 1]], s: 0.82 }, { n: [-1, 0, 0], v: [[0, 0, 0], [0, 0, 1], [0, 1, 1], [0, 1, 0]], s: 0.82 },
  { n: [0, 1, 0], v: [[0, 1, 1], [1, 1, 1], [1, 1, 0], [0, 1, 0]], s: 1 }, { n: [0, -1, 0], v: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]], s: 0.55 },
  { n: [0, 0, 1], v: [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]], s: 0.9 }, { n: [0, 0, -1], v: [[1, 0, 0], [0, 0, 0], [0, 1, 0], [1, 1, 0]], s: 0.9 },
];
const matSolid = new THREE.MeshBasicMaterial({ map: atlas, vertexColors: true, alphaTest: 0.5 });
const matWater = new THREE.MeshBasicMaterial({ map: atlas, vertexColors: true, transparent: true, opacity: 0.62, depthWrite: false });
function buildMesh(c) {
  const pos = [], uv = [], col = [], ind = [], wpos = [], wuv = [], wcol = [], wind = [], N = TILES.length;
  const x0 = c.cx * CS, z0 = c.cz * CS;
  for (let y = 0; y < CH; y++) for (let z = 0; z < CS; z++) for (let x = 0; x < CS; x++) {
    const b = c.data[idx(x, y, z)]; if (b === B.AIR) continue; const water = b === B.WATER;
    for (let f = 0; f < 6; f++) {
      const F = FACES[f], nb = getBlock(x0 + x + F.n[0], y + F.n[1], z0 + z + F.n[2]);
      if (water ? nb !== B.AIR : (opaque(nb) || (nb === b && (b === B.LEAVES || b === B.GLASS)))) continue;
      if (water && f !== 2) continue;   // みずは うえの めんだけ
      const P = water ? wpos : pos, U = water ? wuv : uv, C = water ? wcol : col, I = water ? wind : ind, base = P.length / 3, t = TILE_OF[b][f];
      const sh = F.s * (f === 2 || !water ? 1 : 1);
      for (let k = 0; k < 4; k++) { const v = F.v[k]; P.push(x0 + x + v[0], y + v[1] - (water ? 0.12 : 0), z0 + z + v[2]); U.push((t + (k === 1 || k === 2 ? 1 : 0)) / N, k >= 2 ? 1 : 0); C.push(sh, sh, sh); }
      I.push(base, base + 1, base + 2, base, base + 2, base + 3);
    }
  }
  const mk = (P, U, C, I, mat) => { if (!I.length) return null; const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setIndex(I); g.computeBoundingSphere(); const m = new THREE.Mesh(g, mat); m.frustumCulled = true; return m; };
  if (c.mesh) { scene.remove(c.mesh); c.mesh.geometry.dispose(); } if (c.wmesh) { scene.remove(c.wmesh); c.wmesh.geometry.dispose(); }
  c.mesh = mk(pos, uv, col, ind, matSolid); c.wmesh = mk(wpos, wuv, wcol, wind, matWater);
  if (c.mesh) scene.add(c.mesh); if (c.wmesh) scene.add(c.wmesh); c.dirty = false; c.tris = ind.length / 3 + wind.length / 3;
}

// ---- シーン ----
const canvas = $('#c'), renderer = new THREE.WebGLRenderer({ canvas, antialias: !isTouch });
renderer.setPixelRatio(Math.min(devicePixelRatio, isTouch ? 1.25 : 2));
const scene = new THREE.Scene(), SKY = new THREE.Color('#1c2a5a'); scene.background = SKY;
const camera = new THREE.PerspectiveCamera(70, 1, 0.08, 400);
function resize() { renderer.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();
function applyFog() { const far = RD * CS * 0.92; scene.fog = new THREE.Fog(SKY, far * 0.45, far); camera.far = far + 20; camera.updateProjectionMatrix(); }
applyFog();
{ // 月と ほし
  const cv = document.createElement('canvas'); cv.width = cv.height = 128; const g = cv.getContext('2d'); g.fillStyle = '#fff6c8'; g.fillRect(24, 24, 80, 80); g.fillStyle = '#e8dc9c'; g.fillRect(40, 40, 16, 16); g.fillRect(72, 64, 20, 20);
  const t = new THREE.CanvasTexture(cv); t.magFilter = THREE.NearestFilter; const m = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshBasicMaterial({ map: t, transparent: true, fog: false, depthWrite: false })); m.name = 'moon'; scene.add(m);
  const sp = new Float32Array(300 * 3); for (let i = 0; i < 300; i++) { const a = Math.random() * 6.283, e = Math.random() * 1.3 + 0.1, r = 300; sp.set([Math.cos(a) * Math.cos(e) * r, Math.sin(e) * r, Math.sin(a) * Math.cos(e) * r], i * 3); }
  const gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.BufferAttribute(sp, 3)); const stars = new THREE.Points(gg, new THREE.PointsMaterial({ color: '#ffffff', size: 1.6, sizeAttenuation: false, fog: false })); stars.name = 'stars'; scene.add(stars);
}
const sel = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1.002, 1.002, 1.002)), new THREE.LineBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.8 })); sel.visible = false; scene.add(sel);

// ---- プレイヤー ----
const P = { x: 8.5, y: 60, z: 8.5, vx: 0, vy: 0, vz: 0, yaw: 0, pitch: -0.2, ground: false };
const W2 = 0.3, PH = 1.75, EYE = 1.6;
function boxHits(x, y, z) { for (let by = Math.floor(y); by <= Math.floor(y + PH); by++) for (let bz = Math.floor(z - W2); bz <= Math.floor(z + W2); bz++) for (let bx = Math.floor(x - W2); bx <= Math.floor(x + W2); bx++) if (solid(getBlock(bx, by, bz))) return true; return false; }
function physics(dt, mx, mz, jump) {
  const sp = 4.4, sy = Math.sin(P.yaw), cy = Math.cos(P.yaw);
  const wx = (mx * cy - mz * sy) * sp, wz = (-mx * sy - mz * cy) * sp;   // mz>0 が うしろ
  P.vx += (wx - P.vx) * Math.min(1, dt * 12); P.vz += (wz - P.vz) * Math.min(1, dt * 12);
  P.vy -= 24 * dt; if (P.vy < -40) P.vy = -40; if (jump && P.ground) { P.vy = 8.2; P.ground = false; }
  const inWater = getBlock(Math.floor(P.x), Math.floor(P.y + 0.5), Math.floor(P.z)) === B.WATER; if (inWater) { P.vy = Math.max(P.vy, -3); if (jump) P.vy = 4; }
  const mv = (ax, v) => { const step = v * dt, n = Math.max(1, Math.ceil(Math.abs(step) / 0.25)); for (let i = 0; i < n; i++) { const nx = P.x + (ax === 0 ? step / n : 0), ny = P.y + (ax === 1 ? step / n : 0), nz = P.z + (ax === 2 ? step / n : 0); if (boxHits(nx, ny, nz)) { if (ax === 1) { if (v < 0) P.ground = true; P.vy = 0; } else if (ax === 0) P.vx = 0; else P.vz = 0; return; } P.x = nx; P.y = ny; P.z = nz; } };
  P.ground = false; mv(0, P.vx); mv(2, P.vz); mv(1, P.vy);
  if (P.y < -20) { P.y = 60; P.vy = 0; }
}

// ---- こわす・おく ----
const inv = {}; let hotSel = 0, creative = false;
function raycast(maxD = 5.5) {
  const o = new THREE.Vector3(P.x, P.y + EYE, P.z), d = new THREE.Vector3(); camera.getWorldDirection(d);
  let x = Math.floor(o.x), y = Math.floor(o.y), z = Math.floor(o.z); const sx = Math.sign(d.x) || 1, sy = Math.sign(d.y) || 1, sz = Math.sign(d.z) || 1;
  const tdx = Math.abs(1 / (d.x || 1e-9)), tdy = Math.abs(1 / (d.y || 1e-9)), tdz = Math.abs(1 / (d.z || 1e-9));
  let tx = (sx > 0 ? x + 1 - o.x : o.x - x) * tdx, ty = (sy > 0 ? y + 1 - o.y : o.y - y) * tdy, tz = (sz > 0 ? z + 1 - o.z : o.z - z) * tdz, t = 0, face = null;
  for (let i = 0; i < 40 && t <= maxD; i++) {
    if (solid(getBlock(x, y, z))) return { x, y, z, face };
    if (tx < ty && tx < tz) { x += sx; t = tx; tx += tdx; face = [-sx, 0, 0]; } else if (ty < tz) { y += sy; t = ty; ty += tdy; face = [0, -sy, 0]; } else { z += sz; t = tz; tz += tdz; face = [0, 0, -sz]; }
  }
  return null;
}
function msg(t) { const m = $('#msg'); m.textContent = t; m.style.opacity = 1; clearTimeout(msg.t); msg.t = setTimeout(() => { m.style.opacity = 0; }, 1400); }
function doBreak() { const h = raycast(); if (!h) return; const b = getBlock(h.x, h.y, h.z); setBlock(h.x, h.y, h.z, B.AIR); const g = DROP[b] !== undefined ? DROP[b] : b; if (g) { inv[g] = (inv[g] || 0) + 1; refreshHot(); } }
function doPlace() {
  const h = raycast(); if (!h || !h.face) return; const px = h.x + h.face[0], py = h.y + h.face[1], pz = h.z + h.face[2], b = HOT[hotSel];
  if (!creative && !(inv[b] > 0)) { msg('ざいりょうが たりないよ'); return; }
  if (!(Math.floor(P.x - W2) > px || Math.floor(P.x + W2) < px || Math.floor(P.z - W2) > pz || Math.floor(P.z + W2) < pz || Math.floor(P.y + PH) < py || Math.floor(P.y) > py)) return;   // じぶんの いちには おけない
  setBlock(px, py, pz, b); if (!creative) { inv[b]--; refreshHot(); }
}
function refreshHot() {
  const h = $('#hot'); h.innerHTML = HOT.map((b, i) => `<button data-i="${i}" class="${i === hotSel ? 'on' : ''}"><i style="background:${COLORS[b]}"></i>${creative ? '∞' : (inv[b] || 0)}</button>`).join('');
  h.querySelectorAll('button').forEach(bt => bt.onpointerdown = (e) => { e.stopPropagation(); hotSel = +bt.dataset.i; refreshHot(); msg(NAMES[HOT[hotSel]]); });
  save();
}

// ---- セーブ ----
let saveT = 0;
function save() { try { const o = {}; for (const [k, m] of edits) o[k] = [...m]; localStorage.setItem(SAVE, JSON.stringify({ p: [P.x, P.y, P.z, P.yaw, P.pitch], inv, e: o, c: creative })); } catch { /* ほぞん できなくても つづける */ } }
function saveSoon() { clearTimeout(saveT); saveT = setTimeout(save, 1500); }
function load() { try { const d = JSON.parse(localStorage.getItem(SAVE) || 'null'); if (!d) return false; [P.x, P.y, P.z, P.yaw, P.pitch] = d.p; Object.assign(inv, d.inv || {}); for (const [k, a] of Object.entries(d.e || {})) edits.set(k, new Map(a)); creative = !!d.c; return true; } catch { return false; } }
const loaded = load(); if (!loaded) { P.y = heightAt(8, 8) + 3; } else P.y += 2;
addEventListener('pagehide', save);

// ---- そうさ ----
const keys = new Set(); let stick = { x: 0, z: 0 }, breaking = false;
addEventListener('keydown', (e) => { keys.add(e.code); if (/Digit[1-8]/.test(e.code)) { hotSel = +e.code.slice(5) - 1; refreshHot(); } if (e.code === 'KeyF') doPlace(); });
addEventListener('keyup', (e) => keys.delete(e.code));
let drag = null;
canvas.addEventListener('pointerdown', (e) => { if (e.target !== canvas) return; drag = { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now(), moved: 0 }; canvas.setPointerCapture(e.pointerId); });
canvas.addEventListener('pointermove', (e) => { if (!drag || e.pointerId !== drag.id) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.x = e.clientX; drag.y = e.clientY; drag.moved += Math.abs(dx) + Math.abs(dy); P.yaw -= dx * 0.0055; P.pitch = Math.max(-1.5, Math.min(1.5, P.pitch - dy * 0.0055)); });
canvas.addEventListener('pointerup', (e) => { if (drag && e.pointerId === drag.id) { if (!isTouch && drag.moved < 6 && performance.now() - drag.t < 300) { if (e.button === 2) doPlace(); else doBreak(); } drag = null; } });
canvas.addEventListener('contextmenu', (e) => { e.preventDefault(); });
{ // スティック
  const st = $('#stick'), kn = $('#knob'); let sid = null;
  const setK = (e) => { const r = st.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2; let dx = e.clientX - cx, dy = e.clientY - cy; const m = Math.hypot(dx, dy), R = 45; if (m > R) { dx = dx / m * R; dy = dy / m * R; } kn.style.left = 35 + dx + 'px'; kn.style.top = 35 + dy + 'px'; stick = { x: dx / R, z: dy / R }; };
  st.addEventListener('pointerdown', (e) => { sid = e.pointerId; st.setPointerCapture(sid); setK(e); }); st.addEventListener('pointermove', (e) => { if (e.pointerId === sid) setK(e); });
  const end = (e) => { if (e.pointerId === sid) { sid = null; stick = { x: 0, z: 0 }; kn.style.left = '35px'; kn.style.top = '35px'; } }; st.addEventListener('pointerup', end); st.addEventListener('pointercancel', end);
}
let jumpHeld = false;
$('#bJump').onpointerdown = (e) => { e.preventDefault(); jumpHeld = true; }; $('#bJump').onpointerup = $('#bJump').onpointerleave = () => { jumpHeld = false; };
$('#bBreak').onpointerdown = (e) => { e.preventDefault(); breaking = true; doBreak(); breakT = 0.28; }; $('#bBreak').onpointerup = $('#bBreak').onpointerleave = () => { breaking = false; };
$('#bPlace').onpointerdown = (e) => { e.preventDefault(); doPlace(); };
let breakT = 0;
$('#bDist').onclick = () => { RD = RD >= 6 ? 2 : RD + 1; applyFog(); msg('えんきょり ' + RD); };
$('#bMode').onclick = () => { creative = !creative; $('#bMode').textContent = creative ? 'クリエイティブ' : 'サバイバル'; refreshHot(); };
$('#bReset').onclick = () => { if (!confirm('ブロックの へんこうを ぜんぶ けして さいしょから はじめる?')) return; localStorage.removeItem(SAVE); location.reload(); };
$('#bMode').textContent = creative ? 'クリエイティブ' : 'サバイバル';
if (!isTouch) { $('#stick').style.display = 'none'; for (const id of ['#bBreak', '#bPlace', '#bJump']) $(id).style.display = 'none'; }
refreshHot();

// ---- ループ ----
let last = performance.now(), fps = 60, fAcc = 0, fN = 0;
function updateChunks() {
  const pcx = Math.floor(P.x / CS), pcz = Math.floor(P.z / CS); let built = 0;
  const want = []; for (let dz = -RD; dz <= RD; dz++) for (let dx = -RD; dx <= RD; dx++) if (dx * dx + dz * dz <= RD * RD + 1) want.push([pcx + dx, pcz + dz, dx * dx + dz * dz]);
  want.sort((a, b) => a[2] - b[2]);
  for (const [cx, cz] of want) { const c = getChunk(cx, cz); if (c.dirty && built < (isTouch ? 1 : 2)) { buildMesh(c); built++; } }
  for (const [k, c] of chunks) { if (Math.abs(c.cx - pcx) > RD + 2 || Math.abs(c.cz - pcz) > RD + 2) { if (c.mesh) { scene.remove(c.mesh); c.mesh.geometry.dispose(); } if (c.wmesh) { scene.remove(c.wmesh); c.wmesh.geometry.dispose(); } chunks.delete(k); } }
}
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - last) / 1000); last = now; fAcc += dt; fN++; if (fAcc > 0.5) { fps = fN / fAcc; fAcc = 0; fN = 0; }
  let mx = stick.x, mz = stick.z; if (keys.has('KeyA') || keys.has('ArrowLeft')) mx -= 1; if (keys.has('KeyD') || keys.has('ArrowRight')) mx += 1; if (keys.has('KeyW') || keys.has('ArrowUp')) mz -= 1; if (keys.has('KeyS') || keys.has('ArrowDown')) mz += 1;
  if (breaking) { breakT -= dt; if (breakT <= 0) { doBreak(); breakT = 0.28; } }
  updateChunks();
  physics(dt, mx, mz, jumpHeld || keys.has('Space'));
  camera.position.set(P.x, P.y + EYE, P.z); camera.rotation.set(P.pitch, P.yaw, 0, 'YXZ');
  const m = scene.getObjectByName('moon'); m.position.set(P.x - 110, P.y + 120, P.z - 170); m.quaternion.copy(camera.quaternion); scene.getObjectByName('stars').position.set(P.x, P.y, P.z);
  const h = raycast(); if (h) { sel.visible = true; sel.position.set(h.x + 0.5, h.y + 0.5, h.z + 0.5); } else sel.visible = false;
  renderer.render(scene, camera);
  $('#info').innerHTML = `FPS ${fps.toFixed(0)} ・ くぎり ${chunks.size} ・ ポリゴン ${[...chunks.values()].reduce((a, c) => a + (c.tris || 0), 0).toLocaleString()}<br>いち ${P.x.toFixed(0)}, ${P.y.toFixed(0)}, ${P.z.toFixed(0)} ・ えんきょり ${RD}`;
}
requestAnimationFrame(frame);
window.__vox = { P, getBlock, setBlock, chunks, inv };
if (params.has('shot')) setTimeout(() => { document.title = 'ready'; }, 1500);

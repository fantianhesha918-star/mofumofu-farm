import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FURNI, DECO } from './data.js';
import { healParty, questData } from './battle.js';
import { pastureDay, incomeText } from './pasture.js';
import { seasonOf, startSeasonFx } from './season.js';
import { playBgm } from './bgm.js';
import { budgetReport, disposeObject, BUDGET } from './mapmgr.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { initSwimFish, updateSwimFish } from './swimfish.js';
import { buildWorld, heightAt, WORLD_R, mulberry32, SEA_A, SEA_Y, seaMask, RIVER, riverDist } from './world.js';
import { ECO, state, bus, save, load, reset, hasSave, addItem, count, addStat, activeQuests, checkQuests, sellOf } from './state.js';
import { ITEMS, CROPS, QUESTS, DAY_SECONDS, BUCKET } from './data.js';
import { ui, itemIcon } from './ui.js';
import { input, pollInput, setupInput } from './input.js';
import { sfx, unlockAudio } from './audio.js';
import { STARTERS } from './monsters_extra.js';

const $ = (s) => document.querySelector(s);
const V3 = THREE.Vector3;
const params = new URLSearchParams(location.search);
const isTouch = matchMedia('(pointer:coarse)').matches || params.has('touch');
document.body.classList.toggle('touch', isTouch);

// ---------- レンダラ ----------
const canvas = $('#c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'default' });
renderer.setPixelRatio(Math.min(devicePixelRatio, ECO ? 1 : isTouch ? 1.25 : 2));
renderer.shadowMap.enabled = !ECO; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 700);
function resize() {
  const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h;
  camera.fov = w / h < 1 ? 66 : 52; camera.updateProjectionMatrix();
}
addEventListener('resize', resize); resize();

const villageRoot = new THREE.Group(); villageRoot.name = 'village'; scene.add(villageRoot);   // 村の持ちものは全部ここ(マップ入れ替えで丸ごと破棄できる)
const world = buildWorld(villageRoot); scene.fog = villageRoot.fog;
if (isTouch && !params.has('hq')) world.sun.shadow.mapSize.set(1024, 1024);   // スマホは影の解像度を下げて軽くする
const roomLight = new THREE.PointLight('#ffd9a0', 0, 16, 2); scene.add(roomLight);   // 室内用(部屋に入ったときだけ光る。灯りは1つに抑えて軽く)
ui.buildMinimap(world);
setupInput(canvas, ui);

// ---------- 小さな部品 ----------
const rng = mulberry32(777);
const rr = (a, b) => a + (b - a) * rng();
const angDiff = (a, b) => { let d = b - a; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return d; };
const lam = (k, dt) => 1 - Math.exp(-k * dt);
const L = (c, o = {}) => new THREE.MeshLambertMaterial({ color: c, ...o });

// ---------- パーティクル ----------
const ptex = {};
function mkTex(draw, w = 64) { const c = document.createElement('canvas'); c.width = c.height = w; draw(c.getContext('2d'), w); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
ptex.heart = mkTex((g, w) => { g.fillStyle = '#ff6a8a'; g.strokeStyle = '#fff'; g.lineWidth = 4; g.beginPath(); g.moveTo(w / 2, w * .85); g.bezierCurveTo(w * .05, w * .5, w * .15, w * .1, w / 2, w * .32); g.bezierCurveTo(w * .85, w * .1, w * .95, w * .5, w / 2, w * .85); g.fill(); g.stroke(); });
ptex.drop = mkTex((g, w) => { const r = g.createRadialGradient(w / 2, w / 2, 2, w / 2, w / 2, w / 2); r.addColorStop(0, '#d8f4ff'); r.addColorStop(1, '#5ab4e800'); g.fillStyle = r; g.fillRect(0, 0, w, w); });
ptex.spark = mkTex((g, w) => { g.fillStyle = '#fff6b0'; g.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, r = i % 2 ? w * .12 : w * .46; g.lineTo(w / 2 + Math.cos(a) * r, w / 2 + Math.sin(a) * r); } g.closePath(); g.fill(); });
ptex.dust = mkTex((g, w) => { const r = g.createRadialGradient(w / 2, w / 2, 2, w / 2, w / 2, w / 2); r.addColorStop(0, '#fff9'); r.addColorStop(1, '#fff0'); g.fillStyle = r; g.fillRect(0, 0, w, w); });
const parts = [];
function burst(kind, pos, n = 6, o = {}) {
  for (let i = 0; i < n; i++) {
    const m = new THREE.SpriteMaterial({ map: ptex[kind], transparent: true, depthWrite: false, fog: true });
    const s = new THREE.Sprite(m); const a = rng() * 6.28, v = (o.speed || 1.2) * (0.4 + rng());
    s.position.copy(pos).add(new V3(rr(-.2, .2), rr(0, .2), rr(-.2, .2)));
    const size = (o.size || 0.35) * rr(0.7, 1.2); s.scale.setScalar(size); scene.add(s);
    parts.push({ s, vel: new V3(Math.cos(a) * v * (o.spread ?? 0.6), (o.up ?? 1.5) * (0.6 + rng()), Math.sin(a) * v * (o.spread ?? 0.6)), life: 0, max: o.life || 1.1, g: o.g ?? 0, size });
  }
}
function updateParts(dt) {
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i]; p.life += dt; const k = p.life / p.max;
    if (k >= 1) { scene.remove(p.s); p.s.material.dispose(); parts.splice(i, 1); continue; }
    p.vel.y -= p.g * dt; p.s.position.addScaledVector(p.vel, dt); p.s.material.opacity = 1 - k * k; p.s.scale.setScalar(p.size * (1 + k * 0.3));
  }
}

// ---------- チンチラ ----------
const loader = new GLTFLoader();
let chinGLTF = null, animGLTF = null;
function makeChin(targetH, tint, gltf = chinGLTF) {
  const root = gltf.scene.clone(true);
  root.traverse(o => { if (o.isMesh) { o.material = o.material.clone(); if (tint) o.material.color.multiply(tint); o.castShadow = true; } });
  const box = new THREE.Box3().setFromObject(root), size = box.getSize(new V3()), c = box.getCenter(new V3()), s = targetH / size.y;
  root.scale.setScalar(s); root.position.set(-c.x * s, -box.min.y * s, -c.z * s);
  const inner = new THREE.Group(); inner.add(root); const outer = new THREE.Group(); outer.add(inner);
  return { outer, inner, h: targetH };
}
function hop(c, speed, t, ph = 0) {
  const w = Math.sin(t * 11 + ph);
  c.inner.position.y = Math.abs(w) * 0.13 * c.h * speed;
  c.inner.rotation.x = w * 0.09 * speed;
  c.inner.rotation.z = Math.sin(t * 5.5 + ph) * 0.05 * speed;
  const br = 1 + Math.sin(t * 2.2 + ph) * 0.012 * (1 - speed);
  c.inner.scale.set(br, br + Math.abs(w) * 0.04 * speed, br);
}

// ---------- プレイヤー ----------
const P = { room: null, pos: new V3(0, 0, 6), face: Math.PI, stam: 100, lock: false, regen: 0, sp: 0, chin: null, t: 0 };
const cam = { yaw: 0, pitch: 0.36, dist: 6.4, pos: new V3(), look: new V3(), shake: 0 };
let started = false;

// うみの みずが ある はんい(ただの ひくい土地は みずでは ないので、あるいて いける)
const inSeaArea = (x, z) => { if (x * x + z * z < 3364) return false; let d = Math.atan2(z, x) - SEA_A; d = Math.atan2(Math.sin(d), Math.cos(d)); return Math.abs(d) < 0.85; };
function collide(p, rad) {
  for (const b of world.colliders.boxes) {
    const cx = Math.max(b.minx, Math.min(p.x, b.maxx)), cz = Math.max(b.minz, Math.min(p.z, b.maxz)); const dx = p.x - cx, dz = p.z - cz, d = Math.hypot(dx, dz);
    if (d < rad) { if (d > 1e-5) { p.x = cx + dx / d * rad; p.z = cz + dz / d * rad; } else { p.x += rad; } }
  }
  for (const c of world.colliders.circles) {
    const dx = p.x - c.x, dz = p.z - c.z; if (Math.abs(dx) > 5 || Math.abs(dz) > 5) continue; const d = Math.hypot(dx, dz), m = rad + c.r;
    if (d < m && d > 1e-5) { p.x = c.x + dx / d * m; p.z = c.z + dz / d * m; }
  }
  const r = Math.hypot(p.x, p.z), lim = inSeaArea(p.x, p.z) ? WORLD_R + 14 : WORLD_R; if (r > lim && !(world.onPier && world.onPier(p.x, p.z))) { p.x *= lim / r; p.z *= lim / r; }
}

let moving = false, stepT = 0;
function updatePlayer(dt, t) {
  const blocked = ui.panelOpen() || !started || sleeping || furniMode || yardMode;
  let mx = blocked ? 0 : input.mx, mz = blocked ? 0 : input.mz;
  const sy = Math.sin(cam.yaw), cy = Math.cos(cam.yaw);
  let dx = -sy * mz + cy * mx, dz = -cy * mz - sy * mx; const mag = Math.min(1, Math.hypot(dx, dz));
  const wantDash = !blocked && input.dash && mag > 0.15 && !P.lock;
  const dashing = wantDash;   // ダッシュは スタミナを つかわない
  P.stam = 100; P.lock = false;   // スタミナ制度は廃止(つねに まんたん)
  const target = mag * (dashing ? 7.4 : 4.1);
  P.sp += (target - P.sp) * lam(10, dt);
  moving = P.sp > 0.3;
  if (mag > 0.05) { const a = Math.atan2(dx, dz); P.face += angDiff(P.face, a) * lam(14, dt); }
  if (P.sp > 0.01 && mag > 0.01) {
    const ox = P.pos.x, oz = P.pos.z;
    P.pos.x += dx / mag * P.sp * dt; P.pos.z += dz / mag * P.sp * dt; if (P.room) clampRoom(P.pos); else collide(P.pos, 0.34);
    const wet = (x, z) => !(world.onPier && world.onPier(x, z)) && ((inSeaArea(x, z) && heightAt(x, z) < SEA_Y) || riverDist(x, z) < RIVER.hw);
    if (!P.room && wet(P.pos.x, P.pos.z)) {   // 海・川には入れない(岸でとまらず、ふちに そって すべる)
      const mvx = P.pos.x - ox, mvz = P.pos.z - oz; let ok = false;
      for (const a of [0.45, -0.45, 0.9, -0.9, 1.3, -1.3, 1.6, -1.6]) { const c = Math.cos(a), s = Math.sin(a), tx = ox + mvx * c - mvz * s, tz = oz + mvx * s + mvz * c; if (!wet(tx, tz)) { P.pos.x = tx; P.pos.z = tz; ok = true; break; } }
      if (!ok) { P.pos.x = ox; P.pos.z = oz; }
    }
  }
  const gy = P.room ? P.room.y : (world.onPier && world.onPier(P.pos.x, P.pos.z) ? world.PIER_Y : heightAt(P.pos.x, P.pos.z)); P.pos.y += (gy - P.pos.y) * Math.min(1, dt * 20); if (Math.abs(gy - P.pos.y) > 1) P.pos.y = gy;
  P.t += dt * (0.6 + P.sp * 0.14);
  const c = P.chin; c.outer.position.copy(P.pos); c.outer.rotation.y = P.face;
  hop(c, Math.min(1, P.sp / 4.1) * (dashing ? 1.25 : 1), P.t * (dashing ? 1.15 : 1));
  if (moving) { stepT -= dt * (dashing ? 1.8 : 1); if (stepT <= 0) { stepT = 0.32; if (dashing || rng() < 0.5) burst('dust', P.pos.clone(), 1, { size: dashing ? 0.8 : 0.5, up: 0.4, speed: 0.3, life: 0.7 }); } }
  ui.setStamina(P.stam, P.lock || P.stam < 20);
}

function updateCamera(dt, instant = false) {
  if (!blockedCam()) { cam.yaw -= input.camDX * 0.0058; cam.pitch = THREE.MathUtils.clamp(cam.pitch + input.camDY * 0.0045, 0.08, 1.15); }
  input.camDX = input.camDY = 0;
  if (input.zoom) { cam.dist = THREE.MathUtils.clamp(cam.dist + input.zoom * 0.7, 3.4, 11); input.zoom = 0; }
  const tgt = furniMode ? new V3(ROOMS.house.cx, 0.3, ROOMS.house.cz + 0.3) : yardMode ? new V3(yardCenter.x, heightAt(yardCenter.x, yardCenter.z), yardCenter.z) : new V3(P.pos.x, P.pos.y + 1.15, P.pos.z);
  const cp = new V3(Math.sin(cam.yaw) * Math.cos(cam.pitch), Math.sin(cam.pitch), Math.cos(cam.yaw) * Math.cos(cam.pitch)).multiplyScalar(cam.dist).add(tgt);
  if (P.room) { const b = P.room.bounds; cp.x = Math.max(b.minx - 0.3, Math.min(b.maxx + 0.3, cp.x)); cp.z = Math.max(b.minz - 0.9, Math.min(b.maxz + 4.5, cp.z)); cp.y = Math.max(1.2, Math.min(furniMode ? 10 : 4.2, cp.y)); }
  else {
    if (!yardMode) {   // 木のみきが主人公との間に入ったら、カメラを主人公がわへ寄せる
      const vx = cp.x - tgt.x, vz = cp.z - tgt.z, len2 = vx * vx + vz * vz; let tmax = 1;
      if (len2 > 0.01) { const len = Math.sqrt(len2); for (const c of world.colliders.circles) {
        const ox = c.x - tgt.x, oz = c.z - tgt.z; if (Math.abs(ox) > 14 || Math.abs(oz) > 14 || Math.hypot(ox, oz) < c.r + 0.9) continue;
        const t = (ox * vx + oz * vz) / len2; if (t <= 0 || t >= 1.05) continue;
        if (Math.hypot(ox - vx * t, oz - vz * t) < c.r + 0.45) tmax = Math.min(tmax, Math.max(0.3, t - (c.r + 0.6) / len));
      } }
      if (tmax < 1) cp.set(tgt.x + (cp.x - tgt.x) * tmax, tgt.y + (cp.y - tgt.y) * tmax, tgt.z + (cp.z - tgt.z) * tmax);
    }
    const gy = heightAt(cp.x, cp.z) + 0.7; if (cp.y < gy) cp.y = gy;
  }
  if (instant) { cam.pos.copy(cp); cam.look.copy(tgt); } else { cam.pos.lerp(cp, lam(9, dt)); cam.look.lerp(tgt, lam(14, dt)); }
  camera.position.copy(cam.pos); camera.lookAt(cam.look);
}
const blockedCam = () => ui.panelOpen() || !started || furniMode || yardMode;

// ---------- 資源ノード(集めるもの) ----------
const nodes = [];
const G = {
  stem: new THREE.CylinderGeometry(0.012, 0.018, 0.55, 5).translate(0, 0.275, 0),
  puff: new THREE.IcosahedronGeometry(0.17, 2), halo: new THREE.SphereGeometry(0.27, 12, 8),
  berry: new THREE.SphereGeometry(0.075, 8, 6), bush: new THREE.IcosahedronGeometry(0.6, 1),
  cap: new THREE.SphereGeometry(0.2, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), mstem: new THREE.CylinderGeometry(0.05, 0.07, 0.2, 8).translate(0, 0.1, 0),
  acorn: new THREE.SphereGeometry(0.1, 8, 6), acap: new THREE.SphereGeometry(0.105, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2),
  fluff: new THREE.IcosahedronGeometry(0.26, 2),
  egg: (() => { const g = new THREE.SphereGeometry(0.15, 14, 10), p = g.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i); p.setY(i, y * 1.28); const k = y > 0 ? 1 - y * 0.55 : 1 - Math.abs(y) * 0.12; p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * k); } g.computeVertexNormals(); return g; })(),
};
const MAT = {
  stem: L('#7a9a4a'), puff: L('#f7f5ec', { emissive: '#8a8470', emissiveIntensity: 0.35 }), halo: new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.2, depthWrite: false }),
  gold: L('#ffd55a', { emissive: '#ffb020', emissiveIntensity: 0.9 }), goldHalo: new THREE.MeshBasicMaterial({ color: '#ffe48a', transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending }),
  berry: L('#d8344a'), bush: L('#3f8a3a'), mstem: L('#efe4cc'), capR: L('#c85a3a'), capB: L('#a8724a'), acorn: L('#a8743a'), acap: L('#6a4a28'), fluff: L('#e8e6ea', { emissive: '#706c78', emissiveIntensity: 0.3 }),
  egg: L('#f4e6cc', { emissive: '#4a3a24', emissiveIntensity: 0.25 }), egg2: L('#ffd55a', { emissive: '#ffb020', emissiveIntensity: 0.8 }),
};
const mk = (g, m) => { const o = new THREE.Mesh(g, m); o.castShadow = true; return o; };
const hayBlade = [0, 1, 2].map(i => new THREE.ConeGeometry(0.07, 1.0 + i * 0.25, 5)), hayMat = ['#d9bc4e', '#c9a93e', '#e6cc66'].map(c => L(c));
let MUSH = null;   // Blenderで つくった きのこの 3Dモデル(assets/mushroom_lite.glb)
const PROP = {};   // Blenderで つくった しげみ・タンポポ・どんぐりの 3Dモデル
async function loadProps() { for (const k of ['berrybush', 'dandelion', 'acorn', 'kelp']) { try { PROP[k] = (await loader.loadAsync(`./assets/${k}_lite.glb`)).scene; } catch (e) { console.warn('prop failed', k, e); } } }
function propModel(k, size, jit = 0.15) { const r = PROP[k].clone(true); r.traverse(o => { if (o.isMesh) o.castShadow = true; }); const bb = new THREE.Box3().setFromObject(r), sz = bb.getSize(new V3()), kk = size / Math.max(sz.x, sz.y, sz.z) * rr(1 - jit, 1 + jit), c = bb.getCenter(new V3()); r.scale.setScalar(kk); r.position.set(-c.x * kk, -bb.min.y * kk, -c.z * kk); if (k === 'dandelion') r.traverse(o => { if (o.isMesh && !o.userData.lit) { o.material = o.material.clone(); o.material.emissive = new THREE.Color('#8a8a92'); o.userData.lit = 1; } }); const o = new THREE.Group(); r.rotation.y = rr(0, 6.28); o.add(r); return o; }
async function loadMushroom() { try { const gl = await loader.loadAsync('./assets/mushroom_lite.glb'); MUSH = gl.scene; } catch (e) { console.warn('mushroom model failed', e); } }
const BUILD = {
  hayGrass() { const g = new THREE.Group(); for (let i = 0; i < 9; i++) { const b = new THREE.Mesh(hayBlade[i % 3], hayMat[i % 3]); b.position.set(rr(-0.45, 0.45), 0.55 + (i % 3) * 0.12, rr(-0.45, 0.45)); b.rotation.set(rr(-0.3, 0.3), 0, rr(-0.3, 0.3)); g.add(b); } g.userData.sway = rr(0, 6); return g; },
  dandelion() { if (PROP.dandelion) { const g = propModel('dandelion', 0.8); g.userData.sway = rr(0, 6); return g; } const g = new THREE.Group(); g.add(mk(G.stem, MAT.stem)); const p = mk(G.puff, MAT.puff); p.position.y = 0.6; p.scale.set(1, 1, 1); g.add(p); const h = new THREE.Mesh(G.halo, MAT.halo); h.position.y = 0.6; g.add(h); g.userData.sway = rr(0, 6); return g; },
  legend() {
    const g = new THREE.Group(); const st = mk(G.stem, MAT.stem); st.scale.set(2.2, 2.2, 2.2); g.add(st); const p = mk(G.puff, MAT.gold); p.position.y = 1.35; p.scale.setScalar(2.4); g.add(p);
    const h = new THREE.Mesh(G.halo, MAT.goldHalo); h.position.y = 1.35; h.scale.setScalar(3.4); g.add(h);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: ptex.dust, color: '#ffe070', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); sp.scale.setScalar(5); sp.position.y = 1.35; g.add(sp);
    g.userData.legend = true; return g;
  },
  berry() { if (PROP.berrybush) return propModel('berrybush', 1.45, 0.1); const g = new THREE.Group(); const b = mk(G.bush, MAT.bush); b.scale.set(1.1, 0.75, 1.1); b.position.y = 0.45; g.add(b); for (let i = 0; i < 9; i++) { const s = mk(G.berry, MAT.berry); const a = rr(0, 6.28), e = rr(0.2, 1.2); s.position.set(Math.cos(a) * 0.62 * Math.cos(e) * 1.1, 0.45 + Math.sin(e) * 0.45, Math.sin(a) * 0.62 * Math.cos(e) * 1.1); g.add(s); } return g; },
  mushroom() {
    if (MUSH) { const g = new THREE.Group(), r = MUSH.clone(true); r.traverse(o => { if (o.isMesh) o.castShadow = true; }); const bb = new THREE.Box3().setFromObject(r), k = 1.05 / (bb.max.y - bb.min.y); r.scale.setScalar(k * rr(0.85, 1.15)); r.position.y = -bb.min.y * k; r.rotation.y = rr(0, 6.28); g.add(r); return g; }
    const g = new THREE.Group(); for (let i = 0; i < 3; i++) { const s = rr(0.7, 1.2), m = new THREE.Group(); m.add(mk(G.mstem, MAT.mstem)); const c = mk(G.cap, i % 2 ? MAT.capB : MAT.capR); c.position.y = 0.19; m.add(c); m.scale.setScalar(s); m.position.set(rr(-.18, .18), 0, rr(-.18, .18)); g.add(m); } return g; },
  acorn() { if (PROP.acorn) return propModel('acorn', 0.55, 0.12); const g = new THREE.Group(); for (let i = 0; i < 2; i++) { const a = new THREE.Group(); const b = mk(G.acorn, MAT.acorn); b.scale.set(1, 1.3, 1); b.position.y = 0.1; a.add(b); const c = mk(G.acap, MAT.acap); c.position.y = 0.2; a.add(c); a.position.set(i * 0.2 - 0.1, 0, rr(-.1, .1)); a.rotation.z = rr(-1, 1); g.add(a); } return g; },
  shell() { const g = new THREE.Group(); if (RANCH.seashells) { const r = RANCH.seashells.scene.clone(true); r.traverse(o => { if (o.isMesh) o.castShadow = true; }); const bb = new THREE.Box3().setFromObject(r), s = 0.8 / Math.max(bb.max.x - bb.min.x, bb.max.z - bb.min.z); r.scale.setScalar(s); r.position.y = -bb.min.y * s; g.add(r); } else { const m = mk(G.acorn, MAT.egg); m.position.y = 0.1; g.add(m); } return g; },
  conch() { const g = new THREE.Group(); const c = mk(new THREE.ConeGeometry(0.17, 0.46, 10), L('#f4c0a4')); c.rotation.z = Math.PI / 2.6; c.position.y = 0.17; g.add(c); const t = mk(new THREE.SphereGeometry(0.15, 10, 8), L('#f8d4c0')); t.position.set(-0.14, 0.2, 0); g.add(t); const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: ptex.dust, color: '#ffe8c0', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); sp.scale.setScalar(1.1); sp.position.y = 0.3; g.add(sp); return g; },
  kelp() { if (PROP.kelp) { const m = propModel('kelp', 1.5, 0.15); m.rotation.y = rr(0, 6.28); return m; } const g = new THREE.Group(); for (let i = 0; i < 3; i++) { const m = mk(G.fluff, L(['#3f5a30', '#4a6a38', '#2f4a28'][i])); m.scale.set(1.5, 0.35, 1.1); m.position.set(rr(-0.2, 0.2), 0.08 + i * 0.05, rr(-0.2, 0.2)); m.rotation.y = rr(0, 6); g.add(m); } return g; },
  egg() { const g = new THREE.Group(); const e = mk(G.egg, MAT.egg); e.position.y = 0.17; e.rotation.z = rr(-0.5, 0.5); g.add(e); return g; },
  gegg() { const g = new THREE.Group(); const e = mk(G.egg, MAT.egg2); e.position.y = 0.17; g.add(e); const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: ptex.dust, color: '#ffe070', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); sp.scale.setScalar(1.6); sp.position.y = 0.3; g.add(sp); g.userData.bob = true; return g; },
  fluff() { const g = new THREE.Group(); const f = mk(G.fluff, MAT.fluff); f.position.y = 0.3; f.scale.set(1.3, 0.8, 1.1); g.add(f); g.userData.bob = true; return g; },
};
const NODE_DEF = {
  hayGrass: { item: 'hay', n: 2, label: 'ほしくさを かる', respawn: 0, regrowDays: 3, need: 'sickle', r: 1.7, sfx: 'plant' },
  dandelion: { item: 'dandelion', n: 1, label: 'タンポポを つむ', respawn: 150, r: 1.5, sfx: 'pick' },
  legend: { item: 'legend_dande', n: 1, label: 'でんせつのタンポポを つむ', respawn: 0, r: 2.2, sfx: 'quest' },
  berry: { item: 'berry', n: 2, label: 'きいちごを つむ', respawn: 100, r: 1.9 },
  mushroom: { item: 'mushroom', n: 1, label: 'きのこを とる', respawn: 160, r: 1.5 },
  acorn: { item: 'acorn', n: 2, label: 'どんぐりを ひろう', respawn: 160, r: 1.5 },
  fluff: { item: 'fluff', n: 1, label: 'ふわふわの毛を あつめる', respawn: 0, r: 1.7 },
  shell: { item: 'seashell', n: 1, label: 'かいがらを ひろう', respawn: 220, r: 1.6, sfx: 'pick' },
  conch: { item: 'conch', n: 1, label: 'ほらがいを ひろう', respawn: 420, r: 1.6, sfx: 'quest' },
  kelp: { item: 'seaweed', n: 1, label: 'かいそうを あつめる', respawn: 200, r: 1.8, sfx: 'pick' },
  egg: { item: 'egg', n: 1, label: 'たまごを ひろう', respawn: 0, r: 1.6, sfx: 'pick' },
  gegg: { item: 'golden_egg', n: 1, label: 'きんのたまごを ひろう', respawn: 0, r: 1.8, sfx: 'quest' },
};
function addNode(type, x, z, mesh, fixedY, parent = scene) {
  const d = NODE_DEF[type], m = mesh || BUILD[type](); const y = fixedY ?? heightAt(x, z);
  if (!mesh) { m.position.set(x, y, z); m.rotation.y = rr(0, 6.28); parent.add(m); }
  const n = { type, d, x, z, y, mesh: m, active: true, t: 0, ph: rr(0, 6.28) }; nodes.push(n); return n;
}
function placeNodes() {
  const S = world.spots;
  for (const [x, z] of S.dandelions) addNode('dandelion', x, z);
  if (!state.stats.legend) addNode('legend', S.legend[0], S.legend[1]);
  for (const [x, z] of S.berries) addNode('berry', x, z);
  for (const [x, z] of S.mushrooms) addNode('mushroom', x, z);
  for (const [x, z] of S.acorns) addNode('acorn', x, z);
  state.eggs.forEach(addNestEgg);
  [].forEach(([x, z], i) => {   // 草原に ほしくさが はえている(かまで かる。3日で もどる)
    const n = addNode('hayGrass', x + 1.7, z + 1.3); n.idx = i; n.mesh.scale.setScalar(1.15);
    if ((state.hayCut[i] || 0) > state.day) { n.active = false; n.mesh.visible = false; n.t = 1e9; n.regrow = state.hayCut[i]; }
  });
  { // 浜の貝がら・ほらがい・かいそう(桟橋まわりは避ける)
    const dxp = Math.cos(SEA_A), dzp = Math.sin(SEA_A), place = (type, n, r0, r1, spread) => { let c = 0, tries = 0; while (c < n && tries++ < 200) { const rrr = rr(r0, r1), a = SEA_A + rr(-spread, spread), x = Math.cos(a) * rrr, z = Math.sin(a) * rrr, perp = Math.abs(x * -dzp + z * dxp); if (perp < 3.4 || Math.hypot(x - world.spots.boat.x, z - world.spots.boat.z) < 2.5) continue; addNode(type, x, z); c++; } };
    place('shell', 10, 69, 80, 0.38); place('conch', 3, 71, 80, 0.36); place('kelp', 7, 80.6, 82, 0.4);
  }
  S.bales.forEach((b, bi) => { const n = { type: 'hay', idx: 'b' + bi, d: { item: 'hay', n: 2, label: 'ほしくさを あつめる', respawn: 0, regrowDays: 1, r: 2.1 }, x: b.x, z: b.z, y: b.y, mesh: b.mesh, active: true, t: 0, ph: 0 }; if ((state.hayCut[n.idx] || 0) > state.day) { n.active = false; n.mesh.visible = false; n.t = 1e9; n.regrow = state.hayCut[n.idx]; } nodes.push(n); });   // ほしくさロールは 1日たつと もどる
}
function collect(n) {
  const d = n.d; if (!n.egg) addStat('gather', 1); if (d.item === 'mushroom') addStat('mushroom', 1); addItem(d.item, d.n); ui.feed(d.item, d.n); sfx(d.sfx || 'pick'); burst('spark', new V3(n.x, n.y + 0.6, n.z), 7, { size: 0.28, up: 1.4, life: 0.9 });
  if (d.item === 'legend_dande') { addStat('legend', 1); ui.toast('ITEM GET!', 'でんせつのタンポポ × 1', '', 3600); burst('spark', new V3(n.x, n.y + 1.4, n.z), 24, { size: 0.5, up: 3, speed: 2.2, life: 1.8 }); }
  if (d.item === 'fluff') addStat('fluff', 1);
  if (d.item === 'seashell' || d.item === 'conch') addStat('shell', 1);
  if (n.egg) { const i = state.eggs.indexOf(n.egg); if (i >= 0) state.eggs.splice(i, 1); addStat('egg', 1); if (d.item === 'golden_egg') ui.toast('ITEM GET!', 'きんのたまご × 1', 'めずらしい!', 3200); }
  n.active = false; n.t = d.regrowDays ? 1e9 : d.respawn; n.mesh.visible = false;
  if (d.regrowDays) { n.regrow = state.day + d.regrowDays; state.hayCut[n.idx] = n.regrow; if (n.type === 'hayGrass') addStat('cut_hay', 1); }
  if (!d.respawn && !d.regrowDays) { scene.remove(n.mesh); nodes.splice(nodes.indexOf(n), 1); }
}
function updateNodes(dt, t) {
  for (const n of nodes) {
    if (!n.active) { n.t -= dt; if (n.t <= 0 && n.d.respawn) { n.active = true; n.mesh.visible = true; } continue; }
    const ud = n.mesh.userData;
    if (ud.sway !== undefined) { n.mesh.rotation.z = Math.sin(t * 1.4 + ud.sway) * 0.05; }
    if (ud.legend) { n.mesh.position.y = n.y + Math.sin(t * 1.6) * 0.08; n.mesh.rotation.y = t * 0.4; n.mesh.children[3].material.opacity = 0.7 + Math.sin(t * 3) * 0.3; if (rng() < dt * 6) burst('spark', new V3(n.x + rr(-.8, .8), n.y + rr(0.4, 2), n.z + rr(-.8, .8)), 1, { size: 0.22, up: 0.5, speed: 0.4, life: 1.4 }); }
    if (ud.bob) n.mesh.position.y = n.y + Math.sin(t * 2 + n.ph) * 0.04;
  }
}

// ---------- 畑 ----------
// ----- 畑: 耕す → 種を植える → 水やり(1日1回・数日)→ 収穫 -----
const FARM = { farmland: null, crops: {} };           // Meshy製モデル(読み込み後に入る)
const farmMat = new THREE.MeshLambertMaterial({ color: '#6a4a2e' });
const plots = [];
const PLOT_S = 3.2;
function attachSoil(pl) {
  if (!FARM.farmland || pl.soil) return;
  pl.g.remove(pl.base); pl.mat = FARM.farmland.mat.clone(); pl.soil = new THREE.Mesh(FARM.farmland.geo, pl.mat); pl.soil.scale.setScalar(1.62); pl.soil.position.y = -FARM.farmland.bb.min.y * 1.62; pl.soil.receiveShadow = true; pl.soil.castShadow = true; pl.g.add(pl.soil); pl.tilled = null; pl.crop = null;
}
function addPlotVisual(s) {   // state.plots の1つぶんの 見た目
  const i = plots.length, g = new THREE.Group(); g.position.set(s.x, heightAt(s.x, s.z), s.z);
  const base = new THREE.Mesh(new THREE.BoxGeometry(3, 0.1, 3), new THREE.MeshLambertMaterial({ color: '#7a5a3a' })); base.position.y = 0.03; base.receiveShadow = true; g.add(base); villageRoot.add(g);
  const pl = { i, g, base, soil: null, mat: null, rows: [], crop: null, tilled: null, pos: new V3(s.x, 0, s.z) }; plots.push(pl); attachSoil(pl); refreshPlot(i); return pl;
}
async function loadFarmModels() {
  const get = async (name) => { const g = await loader.loadAsync(`./assets/${name}_lite.glb`); let m = null; g.scene.traverse(o => { if (!m && o.isMesh) m = o; }); if (!m.geometry.attributes.normal) m.geometry.computeVertexNormals(); const bb = new THREE.Box3().setFromBufferAttribute(m.geometry.attributes.position); return { geo: m.geometry, mat: m.material, bb }; };
  try { FARM.farmland = await get('farmland'); } catch (e) { console.warn('farmland model failed', e); }
  for (const k of ['crop_sprout', 'crop_young']) { try { FARM.crops[k] = await get(k); } catch (e) { console.warn('stage model failed', k, e); } }
  for (const [id, d] of Object.entries(CROPS)) { try { FARM.crops[d.model] = await get(d.model); } catch (e) { console.warn('crop model failed', d.model, e); } }
  plots.forEach(attachSoil);
}
const need = (s) => CROPS[s.crop].days;
const isReady = (s) => s.crop && s.days >= need(s);
const growth = (s) => s.crop ? Math.min(1, (s.days + (s.watered ? 0.5 : 0)) / need(s)) : 0;
const ROW_Z = [-0.72, 0.72], seedGeo = new THREE.SphereGeometry(0.1, 7, 5);
function refreshPlot(i) {
  const s = state.plots[i], pl = plots[i];
  if (pl.soil) {   // 耕す前は低く乾いた土、耕すとふかふか、水をやると濃い色
    const tilled = !!s.tilled; pl.soil.scale.y = (tilled ? 1.62 : 0.5);
    pl.mat.color.setRGB(...(!tilled ? [1.5, 1.35, 1.15] : s.watered ? [0.62, 0.6, 0.6] : [1, 1, 1]));
  }
  const gr = growth(s), stage = !s.crop ? 0 : (!s.watered && s.days === 0) ? 4 : isReady(s) ? 3 : gr < 0.4 ? 1 : 2;   // 種(水待ち)→ 芽 → 若株 → 実った作物
  if (pl.crop !== s.crop || pl.stage !== stage) {
    pl.rows.forEach(r => pl.g.remove(r)); pl.rows = []; pl.crop = s.crop; pl.stage = stage;
    if (stage === 4) { const sm = new THREE.MeshLambertMaterial({ color: '#3a2616' }); for (const z of ROW_Z) for (let k = 0; k < 6; k++) { const m = new THREE.Mesh(seedGeo, sm); m.position.set(-1.05 + k * 0.42 + rr(-0.06, 0.06), 0.22, z + rr(-0.12, 0.12)); m.scale.set(1, 0.45, 1); pl.g.add(m); pl.rows.push(m); } }
    const cm = s.crop && stage !== 4 && FARM.crops[stage === 1 && FARM.crops.crop_sprout ? 'crop_sprout' : stage === 2 && FARM.crops.crop_young ? 'crop_young' : CROPS[s.crop].model];
    if (cm) for (const z of ROW_Z) { const r = new THREE.Mesh(cm.geo, cm.mat); r.castShadow = true; r.receiveShadow = true; r.userData.cm = cm; r.position.z = z; r.rotation.y = (z > 0 ? Math.PI : 0) + rr(-0.08, 0.08); pl.g.add(r); pl.rows.push(r); }
  }
  const g = growth(s);
  for (const r of pl.rows) {
    if (!r.userData.cm) continue;
    const cm = r.userData.cm, sc = 1.22, k = 1;
    r.scale.set(sc * (0.55 + 0.45 * k), sc * k, sc * (0.55 + 0.45 * k));
    r.position.y = 0.2 - cm.bb.min.y * sc * k;
  }
}
function newDay() {   // 朝になったとき: 水をあげた作物が1日ぶん育つ
  state.prevDaily = state.daily || {}; state.daily = {};
  state.plots.forEach((s, i) => {
    if (s.crop && !isReady(s) && s.watered) { s.days++; if (isReady(s)) { sfx('feed'); } }
    s.watered = false;
  });
  { const cnt = (k) => state.deco.filter(f => f.k === k).length, sc = cnt('scarecrow'), fb = Math.min(8, cnt('flowerbed'));
    if (sc > 0) state.plots.forEach((s) => { if (s.crop && !isReady(s) && s.watered && Math.random() < Math.min(0.6, sc * 0.25)) s.days++; });
    if (fb > 0) { const c = fb * 8; state.coins += c; bus.emit('coins'); setTimeout(() => ui.toast('はなだん', `きれいな はなが さいたよ。${c}コイン`, '', 3000), 2500); } }
  state.cows.forEach(a => { a.milked = false; });
  for (const n of nodes) if (n.regrow && state.day >= n.regrow) { n.regrow = 0; n.active = true; n.mesh.visible = true; delete state.hayCut[n.idx]; }
  state.nori.forEach(n => { if (n.crop && n.days < 3) n.days++; });
  const sum = Object.entries(state.ship).reduce((t, [id, n]) => t + sellOf(id) * n, 0);   // 出荷箱の精算
  if (sum > 0) { state.coins += sum; addStat('earned', sum); state.ship = {}; bus.emit('coins'); setTimeout(() => { sfx('coin'); ui.toast('SHIPPED', `しゅっかの うりあげ ${sum}コイン`, 'ゆうべの しゅっかばこ', 3800); }, 3200); }
  refreshVillagers();
  { const se = seasonOf(state.day);   // きせつの はじまり・おまつり
    if (se.first && state.day > 1) { const n = 1 + Math.floor(Math.random() * 2), coins = 100; addItem(se.gift, n); state.coins += coins; bus.emit('coins'); setTimeout(() => { sfx('quest'); ui.toast(`${se.name}に なった!`, `${ITEMS[se.gift].name}×${n} と ${coins}コインを もらった`, 'むらの いろが かわったよ', 5000); }, 1500); }
    else if (se.festival) setTimeout(() => { sfx('quest'); ui.toast('きょうは おまつり!', 'しゅっかや おみせの うりねが 25%ふえるよ', se.name + 'の まつり', 5000); }, 1500); }
  pastureDay().then(r => { if (!r) return; setTimeout(() => { sfx('coin'); ui.toast('ぼくじょう', `あずけた なかまが ${incomeText(r)} を もってきたよ`, (r.up.length ? r.up.join('・') + ' が レベルアップ! ' : '') + r.evo.map(([a, b]) => `${a}が ${b}に しんか!`).join(' '), 5200); }, 3600); });
  spawnEggs(); state.chickens.forEach(c => { c.fed = false; });   // えさを あげた つぎの あさに たまご。えさは 毎日
}
function updatePlots() { state.plots.forEach((s, i) => refreshPlot(i)); }
const clearedMeshes = [];
const clearedMat = new THREE.MeshLambertMaterial({ color: '#9a7a52', polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
function addCleared(c) { const m = new THREE.Mesh(new THREE.PlaneGeometry(PLOT_S, PLOT_S), clearedMat); m.rotation.x = -Math.PI / 2; m.position.set(c.x, heightAt(c.x, c.z) + 0.06, c.z); m.receiveShadow = true; villageRoot.add(m); clearedMeshes.push({ c, m }); }
function restoreGrass(c) {   // かった ばしょの 草を もとに もどす(となりの かった ばしょは そのまま)
  world.showGrass(c.x - 1.8, c.z - 1.8, c.x + 1.8, c.z + 1.8);
  for (const p of state.plots.concat(state.cleared)) if (Math.abs(p.x - c.x) < 5.5 && Math.abs(p.z - c.z) < 5.5) world.hideGrass(p.x - 1.8, p.z - 1.8, p.x + 1.8, p.z + 1.8);
}
function clearedTarget(c, tool) {
  if (tool === 'rake') return { label: '草地に もどす', sub: 'かった ばしょに 草が はえて もとに もどるよ', short: 'もどす', can: true, act: () => {
    const k = state.cleared.indexOf(c); if (k < 0) return; state.cleared.splice(k, 1);
    const j = clearedMeshes.findIndex(o => o.c === c); if (j >= 0) { villageRoot.remove(clearedMeshes[j].m); clearedMeshes.splice(j, 1); }
    restoreGrass(c); sfx('plant'); burst('dust', new V3(c.x, heightAt(c.x, c.z) + 0.4, c.z), 8, { size: 0.7, up: 0.8, life: 0.9 }); doSave();
  } };
  return { label: 'たがやして はたけに する', sub: 'くわで ふかふかの土にしよう', short: 'たがやす', can: P.stam >= 8, act: () => {
    const k = state.cleared.indexOf(c); if (k < 0) return; state.cleared.splice(k, 1);
    const j = clearedMeshes.findIndex(o => o.c === c); if (j >= 0) { villageRoot.remove(clearedMeshes[j].m); clearedMeshes.splice(j, 1); }
    const p = { x: c.x, z: c.z, tilled: true, crop: null, days: 0, watered: false }; state.plots.push(p); addPlotVisual(p);
    addStat('till', 1); P.stam = Math.max(0, P.stam - 8); P.regen = 1; sfx('plant'); burst('dust', new V3(c.x, heightAt(c.x, c.z) + 0.4, c.z), 9, { size: 0.7, up: 0.9, life: 0.9 });
  } };
}
function plotTarget(i, tool) {
  const s = state.plots[i];
  if (tool === 'rake') {
    if (s.crop) return { label: 'さくもつが そだっているよ', sub: 'しゅうかくしてから もどそう', short: 'もどせない', can: false };
    return { label: 'はたけを かった ばしょに もどす', sub: 'ふかふかの土を ならして、草を かっただけの ばしょに するよ', short: 'ならす', can: true, act: () => {
      const k = state.plots.indexOf(s); if (k < 0) return; const pl = plots[k]; villageRoot.remove(pl.g); plots.splice(k, 1); state.plots.splice(k, 1); plots.forEach((q, n) => { q.i = n; });
      const c = { x: s.x, z: s.z }; state.cleared.push(c); addCleared(c); sfx('plant'); burst('dust', new V3(s.x, heightAt(s.x, s.z) + 0.4, s.z), 9, { size: 0.7, up: 0.9, life: 0.9 }); doSave();
    } };
  }
  if (!s.tilled && count('hoe') < 1) return { label: '草を かった ばしょ', sub: 'くわが あれば たがやして はたけに できるよ(よろずやで かえるよ)', short: 'くわが ひつよう', can: false };
  if (!s.tilled) return { label: 'はたけを たがやす', sub: 'くわで ふかふかの土にしよう', short: 'たがやす', can: P.stam >= 8, act: () => { s.tilled = true; addStat('till', 1); P.stam = Math.max(0, P.stam - 8); P.regen = 1; sfx('plant'); burst('dust', plots[i].pos.clone().setY(0.4), 9, { size: 0.7, up: 0.9, life: 0.9 }); } };
  if (!s.crop) {
    ensureSeed(); const id = state.selSeed, n = count(id);
    if (n > 0) return { label: 'たねを まく', sub: `${ITEMS[id].name}(のこり${n})`, short: 'まく', can: true, act: () => { addItem(id, -1); s.crop = id; s.days = 0; s.watered = false; sfx('plant'); addStat('plant', 1); burst('dust', plots[i].pos.clone().setY(0.4), 6, { size: 0.5, up: 0.8 }); } };
    return { label: 'たがやした はたけ', sub: 'たねが ないよ。たねやで かえるよ', short: 'はたけ', can: false };
  }
  const def = CROPS[s.crop];
  if (isReady(s)) return { label: `${def.name}を しゅうかく`, sub: 'おいしそうに そだったよ', short: 'しゅうかく', can: true, act: () => { const n = def.yield[0] + Math.floor(rng() * (def.yield[1] - def.yield[0] + 1)); addItem(def.item, n); ui.feed(def.item, n); addStat('harvest', n); s.crop = null; s.days = 0; s.watered = false; sfx('harvest'); burst('spark', plots[i].pos.clone().setY(0.8), 12, { size: 0.35, up: 2, life: 1.2 }); } };
  const left = need(s) - s.days;
  if (!s.watered && count('bucket') < 1) return { label: `${def.name}を そだてちゅう`, sub: 'みずを やるには バケツが いるよ(よろずやで かえるよ)', short: 'バケツが ひつよう', can: false };
  if (!s.watered && state.water < 1) return { label: 'バケツが からっぽ', sub: 'かわや いどで みずを くんでこよう', short: 'みずが ない', can: false };
  if (!s.watered) return { label: 'みずを やる', sub: `${def.name} あと${left}日(1日1回) / バケツ のこり${state.water}`, short: 'みず', can: P.stam >= 5, act: () => { s.watered = true; state.water--; addStat('water', 1); P.stam = Math.max(0, P.stam - 5); P.regen = 1; sfx('water'); for (const z of ROW_Z) for (const ox of [-0.8, 0, 0.8]) burst('drop', plots[i].pos.clone().add(new V3(ox, 1.2, z)), 2, { size: 0.22, up: -0.2, g: 6, life: 0.7, spread: 0.2 }); } };
  return { label: `${def.name}は みずを のんだよ`, sub: `あした おおきくなるよ(あと${left}日)`, short: 'そだち中', can: false };
}
function ensureSeed() { if (count(state.selSeed) > 0) return; const alt = Object.keys(state.inv).find(k => k.startsWith('seed_') && state.inv[k] > 0); if (alt) state.selSeed = alt; }

// ---------- なまえ(じぶんで かえられる) ----------
const nm = (key, base) => (state.names && state.names[key]) || base;
const vN = (v) => nm('vil:' + v.d.id, v.d['name']), nN = (n) => nm('npc:' + n.d.id, n.d['name']);
// ---------- 牧場のチンチラ ----------
const ANIMAL_DEF = [
  { name: 'モカ', tint: new THREE.Color(1.28, 1.1, 0.85) }, { name: 'ユキ', tint: new THREE.Color(1.6, 1.6, 1.66) }, { name: 'クロ', tint: new THREE.Color(0.62, 0.62, 0.7) },
];
const animals = [];
const bubbleTex = mkTex((g, w) => { g.fillStyle = '#f4ead2'; g.strokeStyle = '#2c1f14'; g.lineWidth = 4; g.beginPath(); g.arc(w / 2, w / 2 - 3, w * .38, 0, 7); g.fill(); g.stroke(); g.beginPath(); g.moveTo(w * .42, w * .8); g.lineTo(w / 2, w * .95); g.lineTo(w * .58, w * .8); g.fillStyle = '#f4ead2'; g.fill(); g.strokeStyle = '#c9a840'; g.lineWidth = 4; g.lineCap = 'round'; for (const [a, b] of [[.34, .5], [.44, .42], [.54, .44], [.64, .5]]) { g.beginPath(); g.moveTo(w * a, w * .62); g.lineTo(w * b, w * .3); g.stroke(); } }, 96);
function housePoint() {   // 家の中の 家具が ない ところ
  const R = ROOMS.house, b = R.bounds;
  for (let k = 0; k < 25; k++) { const x = rr(b.minx + 0.5, b.maxx - 0.5), z = rr(b.minz + 0.5, b.maxz - 0.5); if (!(R.boxes || []).some(q => x > q.minx - 0.5 && x < q.maxx + 0.5 && z > q.minz - 0.5 && z < q.maxz + 0.5)) return [x, z]; }
  return [R.spawn.x, R.spawn.z];
}
function makeAnimals() { state.animals.forEach((_, i) => addAnimal(i)); }
function addAnimal(i) {
  if (!ROOMS.house || animals.some(a => a.i === i)) return;
  [ANIMAL_DEF[i]].forEach((d) => {
    const c = makeChin(0.92, d.tint, animGLTF); const [x, z] = housePoint(); c.outer.position.set(x, 0, z); villageRoot.add(c.outer);
    const b = new THREE.Sprite(new THREE.SpriteMaterial({ map: bubbleTex, transparent: true, depthWrite: false })); b.scale.setScalar(0.85); b.position.y = 1.7; b.visible = false; c.outer.add(b);
    animals.push({ i, base: d.name, name: nm('pet:' + i, d.name), c, bubble: b, x, z, tx: x, tz: z, face: rr(0, 6.28), wait: rr(0, 3), sp: 0, ph: rr(0, 6), petCd: 0, fluffT: 0, s: state.animals[i] });
  });
}
const PENS = [];
function penPoint(b = 0) {
  const pen = PENS[b]; if (!pen) return [0, 0];
  for (let k = 0; k < 20; k++) { const x = rr(pen.minx + 1.5, pen.maxx - 1.5), z = rr(pen.minz + 1.5, pen.maxz - 1.5); return [x, z]; }
  return [pen.minx + 3, pen.maxz - 2];
}
function updateAnimals(dt, t) {
  for (const a of animals) {
    a.s = state.animals[a.i]; a.s.hunger = Math.min(1, a.s.hunger + dt / 200); a.petCd -= dt;
    a.bubble.visible = a.s.hunger > 0.55; if (a.bubble.visible) a.bubble.position.y = 1.7 + Math.sin(t * 3 + a.ph) * 0.05;
    if (a.fluffT > 0) { a.fluffT -= dt; if (a.fluffT <= 0) { const bd = ROOMS.house.bounds, fx = Math.max(bd.minx, Math.min(bd.maxx, a.x + rr(-1, 1))), fz = Math.max(bd.minz, Math.min(bd.maxz, a.z + rr(-1, 1))); if (nodes.filter(n => n.type === 'fluff').length < 4) { const n = addNode('fluff', fx, fz, null, 0, ROOMS.house.group); burst('spark', new V3(fx, n.y + 0.5, fz), 6, { size: 0.25, life: 1 }); } } }
    const near = Math.hypot(a.x - P.pos.x, a.z - P.pos.z) < 2.2;
    if (a.wait > 0) { a.wait -= dt; a.sp *= 0.8; if (near) a.face += angDiff(a.face, Math.atan2(P.pos.x - a.x, P.pos.z - a.z)) * lam(5, dt); if (a.wait <= 0) { [a.tx, a.tz] = housePoint(); } }
    else {
      const dx = a.tx - a.x, dz = a.tz - a.z, d = Math.hypot(dx, dz);
      if (d < 0.3) { a.wait = rr(1.5, 5); } else { a.sp += (1.5 - a.sp) * lam(6, dt); a.face += angDiff(a.face, Math.atan2(dx, dz)) * lam(8, dt); a.x += dx / d * a.sp * dt; a.z += dz / d * a.sp * dt; }
    }
    a.c.outer.position.set(a.x, 0, a.z); a.c.outer.rotation.y = a.face; hop(a.c, Math.min(1, a.sp / 1.5) * 0.9, t * 0.9 + a.ph, a.ph);
  }
}
function animalTarget(a) {
  const hung = a.s.hunger > 0.3, lv = Math.floor(a.s.friend);
  const info = `なかよし度 ${lv}${hung ? '　おなかが すいている' : ''}`;
  if (hung) {
    if (count('hay') > 0) return { label: `${a.name}に ほしくさを あげる`, sub: info, short: 'あげる', can: true, act: () => { addItem('hay', -1); a.s.hunger = 0; a.s.friend += 1; a.fluffT = 18; addStat('feed', 1); sfx('feed'); burst('heart', a.c.outer.position.clone().setY(1.3), 6, { size: 0.4, life: 1.5 }); } };
    return { label: `${a.name}は おなかが ぺこぺこ`, sub: 'ほしくさを あつめてこよう(干し草の山)', short: 'ほしくさ', can: false };
  }
  return { label: `${a.name}を なでる`, sub: info, short: 'なでる', can: a.petCd <= 0, act: () => { a.petCd = 12; a.s.friend += 0.25; sfx('pet'); burst('heart', a.c.outer.position.clone().setY(1.2), 4, { size: 0.35, life: 1.3 }); a.wait = 3; } };
}




// ---------- 建物の中(鶏小屋。世界の外れに部屋を作り、出入りで移動する) ----------
const ROOMS = { coops: [] };
function buildCoopRoom(k) {
  const cx = 1000, cz = -40 * k, hw = 3.3, hd = 2.9, H = 3.1, g = new THREE.Group(); villageRoot.add(g);
  const tl = new THREE.TextureLoader(), tex = (f, rx, ry) => { const t = tl.load(f); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.anisotropy = 4; return t; };
  const wallMat = (w) => new THREE.MeshLambertMaterial({ map: tex('./assets/interior/wall_4.jpg', w / 3, 1) });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(hw * 2, hd * 2), new THREE.MeshLambertMaterial({ map: tex('./assets/interior/floor_5.jpg', 2.2, 1.8) })); floor.rotation.x = -Math.PI / 2; floor.position.set(cx, 0, cz); g.add(floor);
  const wall = (w, x, z, ry) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, H), wallMat(w)); m.position.set(x, H / 2, z); m.rotation.y = ry; g.add(m); return m; };
  wall(hw * 2, cx, cz - hd, 0); wall(hw * 2, cx, cz + hd, Math.PI); wall(hd * 2, cx - hw, cz, Math.PI / 2); wall(hd * 2, cx + hw, cz, -Math.PI / 2);
  const wood = L('#6a4a2e'), woodD = L('#4a3220'), straw = L('#e2c25a');
  const door = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 2.2), wood); door.position.set(cx, 1.1, cz + hd - 0.02); door.rotation.y = Math.PI; g.add(door);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), L('#d8b050')); knob.position.set(cx + 0.45, 1.0, cz + hd - 0.08); g.add(knob);
  const win = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.9), new THREE.MeshBasicMaterial({ color: '#d8ecff' })); win.position.set(cx - hw + 0.02, 1.9, cz - 0.4); win.rotation.y = Math.PI / 2; g.add(win);
  const fr = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.1, 1.2), woodD); fr.position.set(cx - hw + 0.04, 1.9, cz - 0.4); g.add(fr);
  const nests = [];
  for (let i = 0; i < 4; i++) {
    const x = cx - 2.1 + i * 1.4, z = cz - hd + 0.55;
    const box = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.5, 0.8), wood); box.position.set(x, 0.25, z); g.add(box);
    const inner = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.12, 0.62), straw); inner.position.set(x, 0.47, z); g.add(inner);
    for (const sx of [-0.5, 0.5]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.7, 0.88), woodD); p.position.set(x + sx, 0.35, z); g.add(p); }
    nests.push({ x, z: z + 0.02 });
  }
  const perch = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 4.4, 8), woodD); perch.rotation.z = Math.PI / 2; perch.position.set(cx, 1.0, cz - 0.4); g.add(perch);
  for (const sx of [-2.1, 2.1]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.0, 0.1), woodD); p.position.set(cx + sx, 0.5, cz - 0.4); g.add(p); }
  for (const [x, z, sc] of [[-2.4, 1.2, 1], [2.3, 0.6, 0.8], [1.6, 1.9, 0.6]]) { const h = new THREE.Mesh(new THREE.ConeGeometry(0.55 * sc, 0.38 * sc, 9), straw); h.position.set(cx + x, 0.19 * sc, cz + z); g.add(h); }
  return { group: g, bounds: { minx: cx - hw + 0.45, maxx: cx + hw - 0.45, minz: cz - hd + 1.25, maxz: cz + hd - 0.55 }, nests, nestY: 0.5, y: 0, exit: { x: cx, z: cz + hd - 0.5 }, spawn: { x: cx, z: cz + hd - 1.7 }, light: { x: cx, y: 2.4, z: cz + 0.3, i: 22 }, outPos: () => coopDoorPos(k), boxes: [] };
}

const HOUSE_MODELS = {}, ROOM_TEX = { wallMats: [], floorMat: null, tl: null, cache: {} };
function applyDecor() {   // かべがみ・ゆかを いまの設定に
  if (!ROOM_TEX.floorMat) return;
  const get = (f) => ROOM_TEX.cache[f] || (ROOM_TEX.cache[f] = (() => { const t = ROOM_TEX.tl.load(f); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; return t; })());
  for (const m of ROOM_TEX.wallMats) { const old = m.map, t = get(`./assets/interior/wall_${state.decor.wall}.jpg`).clone(); t.needsUpdate = true; t.repeat.copy(old.repeat); m.map = t; m.needsUpdate = true; }
  { const m = ROOM_TEX.floorMat, old = m.map, t = get(`./assets/interior/floor_${state.decor.floor}.jpg`).clone(); t.needsUpdate = true; t.repeat.copy(old.repeat); m.map = t; m.needsUpdate = true; }
}
async function buildHouseRoom() {
  const cx = 1000, cz = 30, hw = 4.6, hd = 3.7, H = 3.3, g = new THREE.Group(); villageRoot.add(g);
  const tl = new THREE.TextureLoader(), tex = (f, rx, ry) => { const t = tl.load(f); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.anisotropy = 4; return t; };
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(hw * 2, hd * 2), new THREE.MeshLambertMaterial({ map: tex('./assets/interior/floor_3.jpg', hw * 2 / 3.2, hd * 2 / 2.6) })); floor.rotation.x = -Math.PI / 2; floor.position.set(cx, 0, cz); g.add(floor);
  ROOM_TEX.wallMats = [];
  const wall = (w, x, z, ry) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, H), new THREE.MeshLambertMaterial({ map: tex('./assets/interior/wall_1.jpg', w / (H * 1.225), 1) })); ROOM_TEX.wallMats.push(m.material); m.position.set(x, H / 2, z); m.rotation.y = ry; g.add(m); };
  wall(hw * 2, cx, cz - hd, 0); wall(hw * 2, cx, cz + hd, Math.PI); wall(hd * 2, cx - hw, cz, Math.PI / 2); wall(hd * 2, cx + hw, cz, -Math.PI / 2);
  const wood = L('#6a4a2e');
  const door = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 2.4), wood); door.position.set(cx, 1.2, cz + hd - 0.02); door.rotation.y = Math.PI; g.add(door);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), L('#d8b050')); knob.position.set(cx + 0.5, 1.1, cz + hd - 0.08); g.add(knob);
  const winTex = mkTex((c, w) => { c.fillStyle = '#7a5230'; c.fillRect(0, 0, w, w); c.fillStyle = '#cfe6fb'; c.fillRect(6, 6, w - 12, w - 12); const gr = c.createLinearGradient(0, 0, 0, w); gr.addColorStop(0, '#8cc4f0'); gr.addColorStop(1, '#e8f4ff'); c.fillStyle = gr; c.fillRect(6, 6, w - 12, w - 12); c.fillStyle = '#7a5230'; c.fillRect(w / 2 - 3, 0, 6, w); c.fillRect(0, w / 2 - 3, w, 6); }, 128);
  for (const [wx, wz, ry] of [[cx - hw + 0.02, cz + 0.2, Math.PI / 2], [cx + hw - 0.02, cz + 1.9, -Math.PI / 2]]) { const w = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.2), new THREE.MeshBasicMaterial({ map: winTex })); w.position.set(wx, 1.9, wz); w.rotation.y = ry; g.add(w); }
  ROOM_TEX.floorMat = floor.material; ROOM_TEX.tl = tl;
  const boxes = [];
  const place = async (name, x, z, scale, ry, box) => {
    if (!HOUSE_MODELS[name]) { const gl = await loader.loadAsync(`./assets/${name}_lite.glb`); let m = null; gl.scene.traverse(o => { if (!m && o.isMesh) m = o; }); if (!m.geometry.attributes.normal) m.geometry.computeVertexNormals(); m.material.side = THREE.FrontSide; HOUSE_MODELS[name] = { geo: m.geometry, mat: m.material, bb: new THREE.Box3().setFromBufferAttribute(m.geometry.attributes.position) }; }
    const M = HOUSE_MODELS[name], mesh = new THREE.Mesh(M.geo, M.mat); mesh.scale.setScalar(scale); mesh.position.set(x, -M.bb.min.y * scale, z); mesh.rotation.y = ry; mesh.castShadow = false; g.add(mesh);
    if (box) boxes.push({ minx: x - box[0] / 2, maxx: x + box[0] / 2, minz: z - box[1] / 2, maxz: z + box[1] / 2 });
    return mesh;
  };
  const bx = cx - hw + 0.95, bz = cz - hd + 1.35;
  try {
    await place('bed', bx, bz, 1.25, 0, [1.6, 2.4]);
    await place('fireplace', cx + 1.3, cz - hd + 1.05, 1.5, 0, [2.3, 1.6]);
  } catch (err) { console.warn('house furniture failed', err); }
  const fixedBoxes = boxes.slice(), furniGroup = new THREE.Group(); g.add(furniGroup);
  // ならべ替えできる家具(state.furni から作り直す)
  const furniBox = (f, M) => { const F = FURNI[f.k], sc = F.scale || F.fit / Math.max(M.bb.max.x - M.bb.min.x, M.bb.max.z - M.bb.min.z), w0 = F.box ? F.box[0] : (M.bb.max.x - M.bb.min.x) * sc * 0.92, d0 = F.box ? F.box[1] : (M.bb.max.z - M.bb.min.z) * sc * 0.92, side = Math.round(Math.abs(f.ry) / (Math.PI / 2)) % 2 === 1, w = side ? d0 : w0, d = side ? w0 : d0; return { minx: f.x - w / 2, maxx: f.x + w / 2, minz: f.z - d / 2, maxz: f.z + d / 2, sc }; };
  const room = { group: g, bounds: { minx: cx - hw + 0.45, maxx: cx + hw - 0.45, minz: cz - hd + 0.45, maxz: cz + hd - 0.55 }, boxes, y: 0, exit: { x: cx, z: cz + hd - 0.5 }, spawn: { x: cx, z: cz + hd - 1.4 }, light: { x: cx, y: 2.6, z: cz + 0.3, i: 30 }, bed: { x: bx, z: bz + 0.2 }, kitchen: { x: cx + 1.3, z: cz - hd + 1.95 }, nests: [], nestY: 0, outPos: () => { const d = world.spots.houseDoor; return { x: d.x, z: d.z + 0.6 }; }, furniGroup, fixedBoxes, furniBox, cx, cz, hw, hd };
  room.ensure = async (F) => {
    if (HOUSE_MODELS[F.model]) return true;
    try { const gl = await loader.loadAsync(`./assets/${F.model}_lite.glb`); let m = null; gl.scene.traverse(o => { if (!m && o.isMesh) m = o; }); if (!m.geometry.attributes.normal) m.geometry.computeVertexNormals(); m.material.side = THREE.FrontSide; HOUSE_MODELS[F.model] = { geo: m.geometry, mat: m.material, bb: new THREE.Box3().setFromBufferAttribute(m.geometry.attributes.position) }; return true; } catch (e) { console.warn('furni load failed', F.model, e); return false; }
  };
  room.rebuild = async () => {
    while (furniGroup.children.length) furniGroup.remove(furniGroup.children[0]);
    boxes.length = 0; boxes.push(...fixedBoxes);
    for (let i = 0; i < state.furni.length; i++) {
      const f = state.furni[i], F = FURNI[f.k]; if (!F) continue;
      if (!(await room.ensure(F))) continue;
      const M = HOUSE_MODELS[F.model], b = furniBox(f, M), mesh = new THREE.Mesh(M.geo, M.mat);
      mesh.scale.setScalar(b.sc); mesh.position.set(f.x, -M.bb.min.y * b.sc, f.z); mesh.rotation.y = f.ry; mesh.userData.fi = i; furniGroup.add(mesh); boxes.push(b);
    }
  };
  await room.rebuild();
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: ptex.dust, color: '#ff9a40', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); glow.scale.set(2.2, 1.6, 1); glow.position.set(cx + 1.3, 0.7, cz - hd + 1.6); g.add(glow);
  room.glow = glow; return room;
}
const clampRoom = (p) => {
  const b = P.room.bounds; p.x = Math.max(b.minx, Math.min(b.maxx, p.x)); p.z = Math.max(b.minz, Math.min(b.maxz, p.z));
  for (const q of P.room.boxes || []) {   // 家具に ぶつかったら おし出す
    const cx = Math.max(q.minx, Math.min(p.x, q.maxx)), cz = Math.max(q.minz, Math.min(p.z, q.maxz)), dx = p.x - cx, dz = p.z - cz, d = Math.hypot(dx, dz);
    if (d < 0.4) { if (d > 1e-5) { p.x = cx + dx / d * 0.4; p.z = cz + dz / d * 0.4; } else { p.z += 0.4; } }
  }
};
function goRoom(room, pos, face, dist) {
  if (sleeping) return; sleeping = true; const f = $('#fade'); f.textContent = ''; f.classList.add('on'); sfx('ui');
  setTimeout(() => { P.room = room; if (room) { roomLight.position.set(room.light.x, room.light.y, room.light.z); roomLight.intensity = room.light.i; } else roomLight.intensity = 0; P.pos.set(pos.x, room ? room.y : heightAt(pos.x, pos.z), pos.z); P.face = face; if (room) { cam.yaw = 0; cam.pitch = 0.62; } else cam.pitch = 0.36; cam.dist = dist; updateCamera(0, true); }, 500);
  setTimeout(() => { f.classList.remove('on'); sleeping = false; }, 950);
}

// ---------- 牛・ニワトリ(Meshy製) ----------
const RANCH = { cow: null, chicken: null, chick: null, seashells: null };
async function loadRanchModels() {
  for (const k of Object.keys(RANCH)) { try { RANCH[k] = await loader.loadAsync(`./assets/${k}_lite.glb`); RANCH[k].scene.traverse(o => { if (o.isMesh) { if (!o.geometry.attributes.normal) o.geometry.computeVertexNormals(); o.material.side = THREE.FrontSide; } }); } catch (e) { console.warn('ranch model failed', k, e); } }
}
function makeCreature(gltf, len) {   // 長辺をlenに合わせ、足元を原点・中心をxz原点に
  const root = gltf.scene.clone(true); root.traverse(o => { if (o.isMesh) o.castShadow = true; });
  const box = new THREE.Box3().setFromObject(root), sz = box.getSize(new V3()), c = box.getCenter(new V3()), s = len / Math.max(sz.x, sz.z);
  root.scale.setScalar(s); root.position.set(-c.x * s, -box.min.y * s, -c.z * s);
  const inner = new THREE.Group(); inner.add(root); const outer = new THREE.Group(); outer.add(inner); villageRoot.add(outer);
  return { outer, inner, h: sz.y * s };
}
const milkMarkTex = mkTex((g, w) => { g.fillStyle = '#fffaf0'; g.strokeStyle = '#2c1f14'; g.lineWidth = 4; g.beginPath(); g.arc(w / 2, w / 2, w * .4, 0, 7); g.fill(); g.stroke(); g.fillStyle = '#e8f0ff'; g.strokeStyle = '#2c1f14'; g.lineWidth = 3; g.beginPath(); g.moveTo(w * .42, w * .22); g.lineTo(w * .58, w * .22); g.lineTo(w * .58, w * .32); g.lineTo(w * .66, w * .44); g.lineTo(w * .66, w * .74); g.lineTo(w * .34, w * .74); g.lineTo(w * .34, w * .44); g.lineTo(w * .42, w * .32); g.closePath(); g.fill(); g.stroke(); }, 96);
const eggMarkTex = mkTex((g, w) => { g.fillStyle = '#fffaf0'; g.strokeStyle = '#2c1f14'; g.lineWidth = 4; g.beginPath(); g.arc(w / 2, w / 2, w * .4, 0, 7); g.fill(); g.stroke(); g.fillStyle = '#f2dfc0'; g.lineWidth = 3; g.beginPath(); g.ellipse(w / 2, w * .54, w * .15, w * .21, 0, 0, 7); g.fill(); g.stroke(); }, 96);
const mark = (tex, y) => { const b = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false })); b.scale.setScalar(0.7); b.position.y = y; b.visible = false; return b; };

const cows = [];
const COW_DEF = [{ name: 'モー子', tint: new THREE.Color(1, 1, 1) }, { name: 'ブチ', tint: new THREE.Color(0.9, 0.86, 0.82) }, { name: 'ミルク', tint: new THREE.Color(0.96, 0.92, 0.86) }];
function makeCows() { state.cows.forEach((_, i) => addCow(i)); }
function addCow(i) {
  const cs = state.cows[i]; if (cs && cs.b == null) cs.b = 0;
  if (!RANCH.cow || !cs || !PENS[cs.b] || cows.some(a => a.i === i)) return; const pen = PENS[cs.b], j = state.cows.slice(0, i).filter(o => o.b === cs.b).length;
  [COW_DEF[i]].forEach((d) => {
    const c = makeCreature(RANCH.cow, 2.7); c.outer.traverse(o => { if (o.isMesh) { o.material = o.material.clone(); o.material.color.multiply(d.tint); } });
    const x = pen.minx + 3.5 + (j % 3) * 3.6, z = pen.minz + 3 + (j % 2) * 2.5; c.outer.position.set(x, heightAt(x, z), z);
    const m = mark(milkMarkTex, c.h + 0.9), hb = new THREE.Sprite(new THREE.SpriteMaterial({ map: bubbleTex, transparent: true, depthWrite: false })); hb.scale.setScalar(0.9); hb.position.y = c.h + 0.9; hb.visible = false; c.outer.add(m, hb);
    cows.push({ i, b: cs.b, base: d.name, name: nm('cow:' + i, d.name), c, mark: m, bubble: hb, x, z, tx: x, tz: z, face: rr(0, 6.28), wait: rr(0, 3), sp: 0, ph: rr(0, 6), petCd: 0 });
  });
}
function updateCows(dt, t) {
  for (const a of cows) {
    if (!PENS[a.b]) { a.c.outer.visible = false; continue; } a.c.outer.visible = true;
    const s = state.cows[a.i]; a.petCd -= dt; s.hunger = Math.min(1, s.hunger + dt / 260);
    if (s.hunger > 0.45) { const fd = feederFor(PENS[a.b]); if (fd) { fd.hay--; s.hunger = 0; s.friend += 0.5; feederPaint(); burst('heart', a.c.outer.position.clone().setY(a.c.h + 0.3), 4, { size: 0.4, life: 1.2 }); } }
    const ready = !s.milked && s.hunger <= 0.45; a.mark.visible = ready; a.bubble.visible = s.hunger > 0.55 && !ready;
    a.mark.position.y = a.c.h + 0.9 + Math.sin(t * 3 + a.ph) * 0.06; a.bubble.position.y = a.mark.position.y;
    const near = Math.hypot(a.x - P.pos.x, a.z - P.pos.z) < 3.2;
    if (a.wait > 0) { a.wait -= dt; a.sp *= 0.85; if (near) a.face += angDiff(a.face, Math.atan2(P.pos.x - a.x, P.pos.z - a.z)) * lam(3, dt); if (a.wait <= 0) [a.tx, a.tz] = penPoint(a.b); }
    else { const dx = a.tx - a.x, dz = a.tz - a.z, d = Math.hypot(dx, dz); if (d < 0.4) a.wait = rr(3, 9); else { a.sp += (0.75 - a.sp) * lam(4, dt); a.face += angDiff(a.face, Math.atan2(dx, dz)) * lam(3, dt); a.x += dx / d * a.sp * dt; a.z += dz / d * a.sp * dt; } }
    a.c.outer.position.set(a.x, heightAt(a.x, a.z), a.z); a.c.outer.rotation.y = a.face;
    const w = Math.sin(t * 5 + a.ph) * Math.min(1, a.sp / 0.75); a.c.inner.position.y = Math.abs(w) * 0.04; a.c.inner.rotation.z = w * 0.025; a.c.inner.rotation.x = Math.sin(t * 1.3 + a.ph) * 0.012;
  }
}
function cowTarget(a) {
  const s = state.cows[a.i], hung = s.hunger > 0.45, lv = Math.floor(s.friend), info = `なかよし度 ${lv}`;
  if (hung) {
    if (count('hay') > 0) return { label: `${a.name}に ほしくさを あげる`, sub: `${info}　おなかが すいている`, short: 'あげる', can: true, act: () => { addItem('hay', -1); s.hunger = 0; s.friend += 1; addStat('feed', 1); sfx('feed'); burst('heart', a.c.outer.position.clone().setY(a.c.h + 0.3), 6, { size: 0.45, life: 1.5 }); } };
    return { label: `${a.name}は おなかが すいている`, sub: 'ほしくさを あげると ぎゅうにゅうが しぼれるよ', short: 'ほしくさ', can: false };
  }
  if (!s.milked && count('milk_can') < 1) return { label: `${a.name}は ごきげん`, sub: 'ぎゅうにゅうを しぼるには ミルクかん(ブリキ缶)が ひつよう。よろずやで かえるよ', short: 'ミルクかん', can: false };
  if (!s.milked) return { label: `${a.name}の ぎゅうにゅうを しぼる`, sub: info, short: 'しぼる', can: true, act: () => { const n = 1 + (s.friend >= 6 && rng() < 0.5 ? 1 : 0) + (s.friend >= 15 ? 1 : 0); s.milked = true; s.friend += 0.5; addItem('milk', n); ui.feed('milk', n); addStat('milk', n); sfx('harvest'); a.wait = 3; burst('spark', a.c.outer.position.clone().setY(a.c.h * 0.6), 10, { size: 0.3, up: 1.6, life: 1.2 }); burst('heart', a.c.outer.position.clone().setY(a.c.h + 0.2), 3, { size: 0.35, life: 1.3 }); } };
  return { label: `${a.name}を なでる`, sub: `${info}　きょうは しぼったよ`, short: 'なでる', can: a.petCd <= 0, act: () => { a.petCd = 12; s.friend += 0.25; sfx('pet'); burst('heart', a.c.outer.position.clone().setY(a.c.h + 0.2), 4, { size: 0.35, life: 1.3 }); a.wait = 3; } };
}


// ----- ニワトリ・卵 -----
const hens = [];
const COOP_SPOTS = [];
function coopArea(k = 0) { const c = COOP_SPOTS[k]; return c ? { x: c.x, z: c.z + 3.2 } : null; }
function nestSlot(e) { const c = ROOMS.coops[e.c || 0].nests[e.nest]; return [c.x + (e.slot ? 0.2 : -0.2), c.z + 0.02]; }
function addNestEgg(e) {   // 小屋の中の巣に たまごを置く(ひろえる)
  if (!ROOMS.coops[e.c || 0]) return; const R = ROOMS.coops[e.c || 0], [x, z] = nestSlot(e), n = addNode(e.gold ? 'gegg' : 'egg', x, z, null, R.nestY, R.group); n.mesh.scale.setScalar(1.35); n.mesh.rotation.y = 0; n.egg = e; return n;
}
function spawnEggs() {   // 毎朝、小屋の中のニワトリが たまごを うむ(巣ごとに2こまで)
  state.chickens.forEach((ch) => {
    const ck = ch.c || 0, R = ROOMS.coops[ck]; if (!R) return;
    const free = []; R.nests.forEach((_, ni) => [0, 1].forEach(sl => { if (!state.eggs.some(e => (e.c || 0) === ck && e.nest === ni && e.slot === sl)) free.push({ nest: ni, slot: sl, c: ck }); }));
    if (!free.length) return;
    if (ch.fed && rng() < 0.85 + Math.min(0.1, ch.friend * 0.02)) { const f = free[Math.floor(rng() * free.length)], e = { ...f, gold: rng() < 0.03 + Math.min(0.07, ch.friend * 0.005) }; state.eggs.push(e); if (started) addNestEgg(e); }
  });
}
const chicksMade = new Set();
function makeHens() { state.chickens.forEach((_, i) => addHen(i)); }
function addHen(i0) {
  const cs = state.chickens[i0]; if (cs && cs.c == null) cs.c = 0; const ck = cs ? cs.c : 0, c = coopArea(ck), RM = ROOMS.coops[ck]; if (!c || !RANCH.chicken || !RM || hens.some(h => h.i === i0 && !h.chick)) return;
  const mk1 = (gltf, len, chick, i, room) => {
    const cr = makeCreature(gltf, len); let x, z;
    if (room) { const bd = room.bounds; x = rr(bd.minx + 0.5, bd.maxx - 0.5); z = rr(bd.minz + 0.5, bd.maxz - 0.5); cr.outer.position.set(x, 0, z); }
    else { const an = rr(0, 6.28), r = rr(2, 4); x = c.x + Math.cos(an) * r; z = c.z + Math.sin(an) * r; cr.outer.position.set(x, heightAt(x, z), z); }
    hens.push({ i, ck, chick, room, c: cr, x, z, tx: x, tz: z, face: rr(0, 6.28), wait: rr(0, 3), sp: 0, ph: rr(0, 6), petCd: 0, name: chick ? 'ひよこ' : 'ニワトリ' });
  };
  mk1(RANCH.chicken, 0.9, false, i0, i0 % 2 === 1 ? RM : null);
  if (RANCH.chick && !chicksMade.has(ck)) { chicksMade.add(ck); for (let i = 0; i < 2; i++) mk1(RANCH.chick, 0.42, true, -1, null); for (let i = 0; i < 2; i++) mk1(RANCH.chick, 0.42, true, -1, RM); }
}
function henPoint(a) {
  if (a.room) { const bd = a.room.bounds; return [rr(bd.minx + 0.4, bd.maxx - 0.4), rr(bd.minz + 0.4, bd.maxz - 0.4)]; }
  const c = coopArea(a.ck); for (let k = 0; k < 12; k++) { const ang = rr(0, 6.28), r = rr(1.2, 5.5), x = c.x + Math.cos(ang) * r, z = c.z + Math.sin(ang) * r; let hit = false; for (const b of world.colliders.boxes) if (x > b.minx - 0.6 && x < b.maxx + 0.6 && z > b.minz - 0.6 && z < b.maxz + 0.6) { hit = true; break; } if (!hit) return [x, z]; } return [c.x, c.z];
}
function updateHouse(t) { const h = ROOMS.house; if (h && P.room === h) { const f = 1 + Math.sin(t * 9) * 0.06 + Math.sin(t * 23) * 0.04; h.glow.scale.set(2.2 * f, 1.6 * f, 1); roomLight.intensity = h.light.i * (0.94 + Math.sin(t * 9) * 0.04 + Math.sin(t * 23) * 0.02); } }
function updateHens(dt, t) {
  for (const a of hens) {
    if (!a.room && !COOP_SPOTS[a.ck]) { a.c.outer.visible = false; continue; } a.c.outer.visible = true;
    a.petCd -= dt;
    const near = !a.room && Math.hypot(a.x - P.pos.x, a.z - P.pos.z) < 1.8;
    if (near && a.wait > 0.6) a.wait = 0.5;   // 外では近づくと ちょこちょこ逃げる
    if (a.wait > 0) { a.wait -= dt; a.sp *= 0.8; if (a.wait <= 0) { [a.tx, a.tz] = near ? [a.x + (a.x - P.pos.x) * 1.2, a.z + (a.z - P.pos.z) * 1.2] : henPoint(a); if (!a.room) { const c = coopArea(a.ck); if (Math.hypot(a.tx - c.x, a.tz - c.z) > 7) [a.tx, a.tz] = henPoint(a); } } }
    else { const dx = a.tx - a.x, dz = a.tz - a.z, d = Math.hypot(dx, dz); if (d < 0.25) a.wait = rr(1, 4); else { a.sp += ((a.chick ? 1.5 : 1.3) - a.sp) * lam(8, dt); a.face += angDiff(a.face, Math.atan2(dx, dz)) * lam(10, dt); a.x += dx / d * a.sp * dt; a.z += dz / d * a.sp * dt; } }
    const mv = Math.min(1, a.sp / 1.3), w = Math.sin(t * 16 + a.ph);
    a.c.outer.position.set(a.x, a.room ? 0 : heightAt(a.x, a.z), a.z); a.c.outer.rotation.y = a.face;
    a.c.inner.position.y = Math.abs(w) * 0.05 * mv; a.c.inner.rotation.x = w * 0.08 * mv + (mv < 0.2 ? Math.max(0, Math.sin(t * 2.2 + a.ph * 3) - 0.7) * 0.8 : 0);   // 歩くと上下、止まるとときどきついばむ
  }
}
function coopDoorPos(k = 0) { const c = COOP_SPOTS[k]; return c ? { x: c.x, z: c.z + 2.5 } : null; }
function henTarget(a) {
  if (a.chick) return { label: 'ひよこを なでる', sub: 'ぴよぴよ', short: 'なでる', can: a.petCd <= 0, act: () => { a.petCd = 8; sfx('pet'); burst('heart', a.c.outer.position.clone().setY(0.7), 3, { size: 0.3, life: 1.2 }); a.wait = 2; } };
  const s = state.chickens[a.i];
  if (!s.fed) {
    if (count('chicken_feed') > 0) return { label: 'ニワトリに えさを あげる', sub: `とりのえさ のこり${count('chicken_feed')}　あげると あしたの あさ たまごを うむよ`, short: 'あげる', can: true, act: () => { addItem('chicken_feed', -1); s.fed = true; s.friend += 0.5; sfx('feed'); burst('heart', a.c.outer.position.clone().setY(1.2), 4, { size: 0.35, life: 1.3 }); a.wait = 2.5; } };
    return { label: 'ニワトリは おなかが すいている', sub: 'とりのえさが ないと たまごは うまないよ。たねやで かえるよ', short: 'えさ', can: false };
  }
  return { label: 'ニワトリを なでる', sub: `なかよし度 ${Math.floor(s.friend)}　なかよしだと たまごが ふえるよ`, short: 'なでる', can: a.petCd <= 0, act: () => { a.petCd = 10; s.friend += 0.3; sfx('pet'); burst('heart', a.c.outer.position.clone().setY(1.2), 4, { size: 0.35, life: 1.3 }); a.wait = 2.5; } };
}

// ----- 画面タップ(近くの牛・動物・たまご・畑をタップして操作) -----
const _tv = new V3();
function handleTap(tp) {
  const list = [];
  eachTarget((x, z, r, make, bias = 0, y = 0.8, px = 70) => list.push({ x, z, y, r, make, px }));
  let best = null, bd = 1e9; const W = innerWidth, H = innerHeight;
  for (const it of list) {
    _tv.set(it.x, heightAt(it.x, it.z) + it.y, it.z).project(camera); if (_tv.z > 1) continue;
    const sx = (_tv.x * 0.5 + 0.5) * W, sy = (-_tv.y * 0.5 + 0.5) * H, d = Math.hypot(sx - tp.x, sy - tp.y), lim = it.px * (camera.position.distanceTo(new V3(it.x, 0, it.z)) < 10 ? 1.3 : 1);
    if (d < lim && d < bd) { bd = d; best = it; }
  }
  if (!best) return;
  if (Math.hypot(best.x - P.pos.x, best.z - P.pos.z) > best.r + 0.4) { ui.toast('', 'もう少し ちかづこう', '', 1400); return; }
  const t = best.make(); if (t && t.can && t.act) t.act(); else if (t) { sfx('no'); }
}

// ---------- 村人(Meshyでリグ付けした着物の男女) ----------
const NPC_DEF = [
  { id: 'man', name: 'ケンタ', shop: 'yorozu', home: [0, 0], r: 0, lines: ['いらっしゃい! ここは よろずやだ。', 'ひろった ものは ここで 売れるよ。かま・くわ・バケツも そろってるぞ。', 'かまが あれば 草を かって はたけに できる。くわで たがやして、バケツで 水を はこぶんだ。'], _old: ['いい天気だなあ。畑の野菜は、水をやるとよく育つぞ。', '干し草は、牧場のチンチラたちの大好物なんだ。', 'たねが ほしくなったら、よろずやを のぞいてごらん。'] },
  { id: 'bride', name: 'ハナ', shop: 'tane', home: [0, 0], r: 0, lines: ['いらっしゃい! たねやへ ようこそ。', 'たねは まいにち みずを やると そだつのよ。', 'とりの えさも あるわ。とりごやを たてたら どうぞ。'], _old: ['ふわふわの毛は、とってもあたたかいのよ。', '南の草原に、金色にかがやくタンポポがあるって聞いたわ。', 'なでてあげると、チンチラはよろこぶのよ。'] },
];
const npcs = [];
async function makeNPCs() {
  for (const d of NPC_DEF) {
    if (d.shop) { const st = world.spots.stalls.find(s => s.id === d.shop); d.home = [st.x + 2.5, st.z + 1.2]; d.face0 = st.rot; }   // お店の 店主
    try {
      const g = await loader.loadAsync(`./assets/people/kimono_${d.id}_walking.glb`);
      const obj = SkeletonUtils.clone(g.scene); obj.traverse(o => { if (o.isMesh) { o.castShadow = true; o.frustumCulled = false; } });
      obj.updateMatrixWorld(true); const box = new THREE.Box3().setFromObject(obj, true), h = box.getSize(new V3()).y; const k = (h > 0.05 && h < 50) ? 1.55 / h : 1; console.log('NPC', d.id, 'height', h.toFixed(2), 'scale', k.toFixed(2)); obj.scale.setScalar(k); obj.position.y = -box.min.y * k;
      const outer = new THREE.Group(); outer.add(obj); villageRoot.add(outer);
      const mixer = new THREE.AnimationMixer(obj), act = mixer.clipAction(g.animations[0]); act.play(); act.timeScale = 0;
      const [x, z] = d.home; npcs.push({ d, outer, mixer, act, x, z, tx: x, tz: z, face: rr(0, 6.28), wait: rr(0, 2), sp: 0, line: 0 });
    } catch (e) { console.warn('NPC load failed', d.id, e); }
  }
}
function npcPoint(n) { for (let i = 0; i < 20; i++) { const a = rr(0, 6.28), r = rr(1, n.d.r), x = n.d.home[0] + Math.cos(a) * r, z = n.d.home[1] + Math.sin(a) * r; if (world.nearPath(x, z, 5) || i > 15) { let hit = false; for (const b of world.colliders.boxes) if (x > b.minx - 1 && x < b.maxx + 1 && z > b.minz - 1 && z < b.maxz + 1) { hit = true; break; } if (!hit) return [x, z]; } } return n.d.home; }
// ---------- がいとうの あかり(よるに ともる。ちかくの 4つは ほんとうに まわりを てらす) ----------
const lampLights = Array.from({ length: 4 }, () => { const l = new THREE.PointLight('#ffc878', 0, 17, 1.5); scene.add(l); return l; });
const lampFx = new Map();
const lampGlowTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'), gr = x.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,214,130,0.9)'); gr.addColorStop(0.45, 'rgba(255,190,100,0.35)'); gr.addColorStop(1, 'rgba(255,170,80,0)'); x.fillStyle = gr; x.fillRect(0, 0, 128, 128); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
const nightOf = (h) => h > 18.2 || h < 5.8 ? 1 : h > 17 ? (h - 17) / 1.2 : h < 7 ? (7 - h) / 1.2 : 0;
function lampHeads() {
  const out = [];
  for (const s of (world.lanternGlows || [])) out.push({ key: s, x: s.position.x, y: s.position.y, z: s.position.z, own: false });
  { const CM = DECO_MODELS[DECO.campfire.model]; if (CM) for (const m of yardGroup.children) { const f = state.deco[m.userData.di]; if (!f || f.k !== 'campfire') continue; out.push({ key: m, x: m.position.x, y: m.position.y + 0.55 * CM.sc, z: m.position.z, own: true, fire: true }); } }
  const M = DECO_MODELS[DECO.lantern.model];
  if (M) for (const m of yardGroup.children) { const f = state.deco[m.userData.di]; if (!f || f.k !== 'lantern') continue; const off = new V3(-0.3 * M.sc, 0, 0).applyAxisAngle(new V3(0, 1, 0), m.rotation.y); out.push({ key: m, x: m.position.x + off.x, y: m.position.y + 0.5 * M.sc, z: m.position.z + off.z, own: true }); }
  return out;
}
function updateLamps(T) {
  const n = P.room ? 0 : nightOf(state.hour), heads = lampHeads(), live = new Set(heads.map(h => h.key));
  for (const [k, v] of lampFx) if (!live.has(k)) { villageRoot.remove(v.dec); if (v.spr) villageRoot.remove(v.spr); lampFx.delete(k); }
  for (const h of heads) {
    let v = lampFx.get(h.key);
    if (!v) { const dec = new THREE.Mesh(new THREE.CircleGeometry(5.2, 28), new THREE.MeshBasicMaterial({ map: lampGlowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0, polygonOffset: true, polygonOffsetFactor: -2 })); dec.rotation.x = -Math.PI / 2; villageRoot.add(dec);
      let spr = null; if (h.own) { spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: lampGlowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 })); spr.scale.setScalar(2.6); villageRoot.add(spr); }
      v = { dec, spr }; lampFx.set(h.key, v); }
    v.dec.position.set(h.x, heightAt(h.x, h.z) + 0.07, h.z); v.dec.material.opacity = n * (0.5 + Math.sin(T * 4 + h.x) * 0.03);
    if (v.spr) { v.spr.position.set(h.x, h.y, h.z); v.spr.material.opacity = n * (0.75 + Math.sin(T * 5 + h.x) * 0.1); }
  }
  const sorted = heads.map(h => [Math.hypot(h.x - P.pos.x, h.z - P.pos.z), h]).sort((a, b) => a[0] - b[0]);
  lampLights.forEach((l, i) => { const s = sorted[i]; if (!s || n <= 0.01 || s[0] > 40) { l.intensity = 0; return; } l.position.set(s[1].x, s[1].y - 0.2, s[1].z); l.intensity = n * (s[1].fire ? 24 : 16) * (1 - Math.min(1, s[0] / 40) * 0.4) * (s[1].fire ? 0.88 + Math.sin(T * 11 + s[1].x) * 0.12 : 1); });
}
// ---------- なかまの ぼくじょう(あずけた モンスターが 歩きまわる) ----------
const pastureMons = [];
{
  const pr = world.pasture || { x: 14, z: 22, r: 8 }, c = document.createElement('canvas'); c.width = 256; c.height = 96; const g = c.getContext('2d');
  g.fillStyle = '#b88a52'; g.fillRect(0, 0, 256, 96); g.strokeStyle = '#5a3a18'; g.lineWidth = 6; g.strokeRect(4, 4, 248, 88); g.fillStyle = '#3a2410'; g.font = 'bold 26px sans-serif'; g.textAlign = 'center'; g.fillText('なかまの', 128, 40); g.fillText('ぼくじょう', 128, 76);
  const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; const sx = pr.x - pr.r - 1.6, sz = pr.z - 3.5, sg = new THREE.Group();
  const post = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.2, 0.2), new THREE.MeshLambertMaterial({ color: '#7a5230' })); post.position.y = 1.1; sg.add(post);
  const board = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 0.72), new THREE.MeshLambertMaterial({ map: tx, side: THREE.DoubleSide })); board.position.set(0, 2.0, 0.12); sg.add(board);
  sg.position.set(sx, heightAt(sx, sz), sz); sg.rotation.y = -Math.PI / 2; villageRoot.add(sg);
}
async function syncPasture() {
  const GD = await questData(), list = state.pasture || [], pr = world.pasture || { x: 14, z: 22, r: 8 };
  while (pastureMons.length > list.length) { const o = pastureMons.pop(); villageRoot.remove(o.sp); }
  list.forEach((m, i) => {
    const d = GD.MONSTERS[m.id]; let o = pastureMons[i];
    if (!o) { const tex = new THREE.TextureLoader().load(`quest/${d.image}`); tex.colorSpace = THREE.SRGBColorSpace; const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true })); sp.center.set(0.5, 0.04); villageRoot.add(sp); o = { sp, id: m.id, x: pr.x + rr(-4, 4), z: pr.z + rr(-4, 4), tx: 0, tz: 0, wait: rr(0, 3), ph: rr(0, 6) }; o.tx = o.x; o.tz = o.z; pastureMons[i] = o; }
    if (o.id !== m.id) { o.id = m.id; const tex = new THREE.TextureLoader().load(`quest/${d.image}`); tex.colorSpace = THREE.SRGBColorSpace; o.sp.material.map = tex; o.sp.material.needsUpdate = true; }
    const s = 1.5 + Math.min(1.4, m.lv * 0.022); o.sp.scale.set(s, s, 1);
  });
}
function updatePasture(dt, T) {
  const pr = world.pasture || { x: 14, z: 22, r: 8 };
  for (const o of pastureMons) {
    if (o.wait > 0) { o.wait -= dt; if (o.wait <= 0) { const a = rr(0, 6.28), r = rr(0, pr.r - 2); o.tx = pr.x + Math.cos(a) * r; o.tz = pr.z + Math.sin(a) * r; } }
    else { const dx = o.tx - o.x, dz = o.tz - o.z, dd = Math.hypot(dx, dz); if (dd < 0.3) o.wait = rr(2, 6); else { o.x += dx / dd * 0.8 * dt; o.z += dz / dd * 0.8 * dt; } }
    o.sp.position.set(o.x, heightAt(o.x, o.z) + Math.abs(Math.sin(T * 3 + o.ph)) * (o.wait > 0 ? 0.02 : 0.12), o.z);
  }
}
bus.on('pasture', syncPasture);
// ---------- むらを おとずれる きがえどうぶつ(まいにち 4ひき あそびに くる) ----------
const VILLAGERS = [
  { id: 1, name: 'モチ', who: 'ちんちら(きもの)', lines: ['きょうは ぽかぽか して いい きもちだね。', 'この きものは おばあちゃんの おさがりなの。', 'ふわふわの けは まいにち ていれが だいじなんだよ。'] },
  { id: 2, name: 'ハヤテ', who: 'ねこ(にんじゃ)', lines: ['しっ! いまは しのびの ぎょうの さいちゅうでござる。', 'ぼくじょうの ようすは ぜんぶ おみとおしでござる。', 'にんじゃは おやつ ひとつで うごくのでござる。'] },
  { id: 3, name: 'クロ', who: 'いぬ(スーツ)', lines: ['おはようございます! きょうも いちにち よろしく。', 'モンスターを つかまえるなら ボールは たくさん もっておくと いいですよ。', 'しごとの あとの ミルクは さいこうですね。'] },
  { id: 4, name: 'ふわり', who: 'うさぎ(くまパジャマ)', lines: ['ねむい… ふわあ。ベッドで ねると いいゆめが みられるよ。', 'くまさんの パジャマは あったかいの。', 'あとで いっしょに おひるね しない?'] },
  { id: 5, name: 'ゆき', who: 'ちんちら(ウェディング)', lines: ['きょうは とくべつな ひなの。', 'しあわせは ちいさな できごとの つみかさね。', 'ぼくじょうの みんなに かんぱい!'] },
  { id: 6, name: 'シロ', who: 'いぬ(きもの)', lines: ['ワン! おさんぽ たのしいね。', 'おまつりの じゅんびを してるんだよ。', 'しっぽが ゆれちゃう!'] },
  { id: 7, name: 'ミケ', who: 'ねこ(スーツ)', lines: ['かいぎが ある… ような ないような。', 'コインは たいせつに。でも ときどき ごほうびも ね。', 'モンスターの ざいりょうを あつめると、ボールが つくれるよ。'] },
  { id: 8, name: 'ぴょん', who: 'うさぎ(にんじゃ)', lines: ['ぴょん! すがたを けして おどろかせるのが とくいなの。', 'ひるねの あとが いちばん はやく はしれるよ。', 'おいかけっこ しよう!'] },
];
const villagers = [];
let villagerDay = -1;
function villagerGift(n) {   // なかよし(はなした日かず)が ふえるほど いい おくりもの
  const r = rng(), g = { coins: 0, items: {} };
  if (n >= 7 && r < 0.2) g.items.nakama_ball = 1; else if (n >= 3 && r < 0.4) { const ks = ['monster_fur', 'berry', 'mushroom', 'acorn', 'seashell']; g.items[ks[Math.floor(rng() * ks.length)]] = 2; }
  else if (r < 0.7) g.coins = Math.round(30 + rng() * 50 + Math.min(n, 10) * 8); else g.items.hay = 3 + Math.floor(rng() * 3);
  return g;
}
async function refreshVillagers() {
  if (villagerDay === state.day) return; villagerDay = state.day;
  for (const v of villagers) villageRoot.remove(v.outer); villagers.length = 0;
  const order = VILLAGERS.map((d, i) => [((state.day * 2654435761 + i * 40503) >>> 0) % 1000, d]).sort((a, b) => a[0] - b[0]).slice(0, 4).map(a => a[1]);
  for (const d of order) {
    try {
      const g = await loader.loadAsync(`./assets/villager_${d.id}_lite.glb`), obj = g.scene; obj.traverse(o => { if (o.isMesh) { o.castShadow = true; if (!o.geometry.attributes.normal) o.geometry.computeVertexNormals(); } });
      const box = new THREE.Box3().setFromObject(obj), sz = box.getSize(new V3()), k = 1.5 / sz.y, c = box.getCenter(new V3()); obj.scale.setScalar(k); obj.position.set(-c.x * k, -box.min.y * k, -c.z * k);
      const outer = new THREE.Group(); outer.add(obj); villageRoot.add(outer);
      let hx = 0, hz = 6; for (let i = 0; i < 40; i++) { const a = rr(0, 6.28), r = rr(5, 22), x = Math.cos(a) * r, z = 6 + Math.sin(a) * r; if (world.nearPath(x, z, 6) && !world.colliders.boxes.some(b => x > b.minx - 2 && x < b.maxx + 2 && z > b.minz - 2 && z < b.maxz + 2)) { hx = x; hz = z; break; } }
      villagers.push({ d, outer, x: hx, z: hz, tx: hx, tz: hz, home: [hx, hz], face: rr(0, 6.28), wait: rr(0, 3), sp: 0, line: 0 });
    } catch (e) { console.warn('villager failed', d.id, e); }
  }
}
function updateVillagers(dt, T) {
  for (const v of villagers) {
    const near = Math.hypot(v.x - P.pos.x, v.z - P.pos.z) < 3;
    if (v.wait > 0) { v.wait -= dt; v.sp *= 0.8; if (near) v.face += angDiff(v.face, Math.atan2(P.pos.x - v.x, P.pos.z - v.z)) * lam(6, dt); if (v.wait <= 0) { const a = rr(0, 6.28), r = rr(1, 6), x = v.home[0] + Math.cos(a) * r, z = v.home[1] + Math.sin(a) * r; const hit = world.colliders.boxes.some(b => x > b.minx - 1 && x < b.maxx + 1 && z > b.minz - 1 && z < b.maxz + 1); if (!hit && !near) { v.tx = x; v.tz = z; } else v.wait = 1; } }
    else { const dx = v.tx - v.x, dz = v.tz - v.z, dd = Math.hypot(dx, dz); if (dd < 0.4) v.wait = rr(2, 6); else { v.sp += (1.1 - v.sp) * lam(6, dt); v.face += angDiff(v.face, Math.atan2(dx, dz)) * lam(7, dt); v.x += dx / dd * v.sp * dt; v.z += dz / dd * v.sp * dt; } }
    v.outer.position.set(v.x, heightAt(v.x, v.z) + Math.abs(Math.sin(T * 7 + v.home[0])) * 0.1 * Math.min(1, v.sp), v.z); v.outer.rotation.y = v.face;
  }
}
function talkVillager(v) {
  const rec = state.villagers[v.d.id] || (state.villagers[v.d.id] = { last: 0, n: 0 });
  ui.toast(vN(v), v.d.lines[v.line % v.d.lines.length], v.d.who, 4200); v.line++; v.wait = 4; sfx('pet');
  if (rec.last !== state.day) {
    rec.last = state.day; rec.n++; const g = villagerGift(rec.n); state.coins += g.coins; for (const [id, n] of Object.entries(g.items)) addItem(id, n); bus.emit('coins');
    setTimeout(() => { sfx('coin'); ui.toast(`${vN(v)} から プレゼント`, [g.coins ? `${g.coins}コイン` : '', ...Object.entries(g.items).map(([id, n]) => `${ITEMS[id].name}×${n}`)].filter(Boolean).join('、'), `なかよし ${rec.n}日め`, 3600); }, 900);
  }
}
function updateNPCs(dt) {
  for (const n of npcs) {
    if (n.d.shop) { const dd = Math.hypot(P.pos.x - n.x, P.pos.z - n.z); n.sp = 0; n.face += angDiff(n.face, dd < 6 ? Math.atan2(P.pos.x - n.x, P.pos.z - n.z) : n.d.face0) * lam(5, dt); n.outer.position.set(n.x, heightAt(n.x, n.z), n.z); n.outer.rotation.y = n.face; n.act.timeScale = 0; n.mixer.update(dt); continue; }
    const near = Math.hypot(n.x - P.pos.x, n.z - P.pos.z) < 2.6;
    if (n.wait > 0) { n.wait -= dt; n.sp *= 0.8; if (near) n.face += angDiff(n.face, Math.atan2(P.pos.x - n.x, P.pos.z - n.z)) * lam(6, dt); if (n.wait <= 0 && !near) [n.tx, n.tz] = npcPoint(n); else if (n.wait <= 0) n.wait = 1; }
    else { const dx = n.tx - n.x, dz = n.tz - n.z, dd = Math.hypot(dx, dz); if (dd < 0.4) n.wait = rr(2, 6); else { n.sp += (1.15 - n.sp) * lam(6, dt); n.face += angDiff(n.face, Math.atan2(dx, dz)) * lam(7, dt); n.x += dx / dd * n.sp * dt; n.z += dz / dd * n.sp * dt; } }
    n.outer.position.set(n.x, heightAt(n.x, n.z), n.z); n.outer.rotation.y = n.face;
    n.act.timeScale = n.sp > 0.15 ? n.sp / 1.15 : 0; n.mixer.update(dt);
  }
}


// ---------- 海: 釣り・のり養殖 ----------
const FISH_TABLE = [   // id, 重み, 必要タップ数
  ['iwashi', 24, 4], ['aji', 26, 5], ['saba', 18, 6], ['karei', 12, 7], ['ika', 8, 8], ['tai', 5, 10], ['tako', 3, 9], ['fugu', 1.5, 11], ['seaweed', 4, 3],
];
const RIVER_FISH = [['funa', 28, 4], ['ayu', 24, 5], ['nijimasu', 16, 6], ['iwana', 10, 7], ['unagi', 4, 9], ['koi', 2, 11]];
function pickFish(table = FISH_TABLE) {
  const night = state.hour < 5 || state.hour > 19, w = table.map(([id, wt]) => (id === 'ika' || id === 'tako' || id === 'unagi') && night ? wt * 3 : wt), tot = w.reduce((a, b) => a + b, 0); let r = rng() * tot;
  for (let i = 0; i < table.length; i++) { r -= w[i]; if (r <= 0) return table[i]; } return table[0];
}
const seaSpot = () => { const pr = world.spots.pier, e = pr.end; return { sea: true, x: e.x, z: e.z, tx: e.x + pr.dx * 3.6, tz: e.z + pr.dz * 3.6, y: SEA_Y, face: Math.atan2(pr.dx, pr.dz) }; };
let fish = null;   // 釣りの進行 {phase:'wait'|'bite'|'pull', t, ...}
const bobber = new THREE.Group(); { const top = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2), L('#e84a3a')), bot = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), L('#f6f2e6')); bobber.add(top, bot); bobber.visible = false; villageRoot.add(bobber); }
const lineGeo = new THREE.BufferGeometry().setFromPoints([new V3(), new V3()]), fishLine = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: '#f4f0e0' })); fishLine.visible = false; fishLine.frustumCulled = false; villageRoot.add(fishLine);
const fishBar = document.createElement('div'); fishBar.id = 'fishbar'; fishBar.hidden = true; fishBar.innerHTML = '<div class="fb-t"></div><div class="fb-bar"><i></i></div>'; document.body.appendChild(fishBar);
function setFishBar(text, v, hot) { fishBar.hidden = text === null; if (text === null) return; fishBar.querySelector('.fb-t').textContent = text; fishBar.querySelector('i').style.width = Math.max(0, Math.min(1, v)) * 100 + '%'; fishBar.classList.toggle('hot', !!hot); }
function startFishing(spot) {
  spot = spot || seaSpot(); P.face = spot.sea ? spot.face : Math.atan2(spot.tx - spot.x, spot.tz - spot.z);
  fish = { spot, y: spot.y, phase: 'wait', t: rr(2.5, 6.5), tx: spot.tx + rr(-0.6, 0.6) * (spot.sea ? 1 : 0.3), tz: spot.tz + rr(-0.6, 0.6) * (spot.sea ? 1 : 0.3), prog: 0, need: 5, kind: null };
  bobber.visible = fishLine.visible = true; bobber.position.set(fish.tx, fish.y, fish.tz); sfx('water'); burst('drop', new V3(fish.tx, fish.y + 0.2, fish.tz), 6, { size: 0.3, up: 0.8, life: 0.8 });
}
function endFishing(msg, ok) { fish = null; bobber.visible = fishLine.visible = false; setFishBar(null); if (msg) ui.toast(ok ? 'ITEM GET!' : 'ざんねん', msg, '', 2400); }
function fishTarget(spot) {
  if (!fish) {
    if (count('fishing_rod') < 1) return { label: 'ここは つりばしょ', sub: 'つりざおが ひつよう。よろずやで かえるよ', short: 'つりざお', can: false };
    return { label: 'つりを する', sub: 'うきが しずんだら タップ!', short: 'つる', can: true, act: () => startFishing(spot) };
  }
  if (fish.phase === 'wait') return { label: 'うきを みつめて… まってね', sub: 'あたりが きたら タップ(はやすぎると にげるよ)', short: 'まつ', can: true, act: () => endFishing('はやすぎて さかなが にげたよ', false) };
  if (fish.phase === 'bite') return { label: 'あたり!', sub: 'いまだ! タップ!', short: 'ひく!', can: true, act: () => { fish.phase = 'pull'; fish.t = 7; fish.prog = 0.25; sfx('quest'); } };
  return { label: 'ぐいぐい ひいている!', sub: 'タップを れんだして リールを まこう', short: 'まく!', can: true, act: () => { fish.prog += 1 / fish.need; sfx('pick'); burst('drop', new V3(fish.tx, fish.y + 0.1, fish.tz), 3, { size: 0.28, up: 1.2, life: 0.6 }); } };
}
function updateFishing(dt, t) {
  if (!fish) return;
  const d = Math.hypot(P.pos.x - fish.spot.x, P.pos.z - fish.spot.z);
  if (d > 4.5 || Math.hypot(input.mx, input.mz) > 0.5) { endFishing('つりを やめたよ', false); return; }
  const rod = new V3(P.pos.x + Math.sin(P.face) * 0.5, P.pos.y + 1.1, P.pos.z + Math.cos(P.face) * 0.5), a = lineGeo.attributes.position;
  a.setXYZ(0, rod.x, rod.y, rod.z); a.setXYZ(1, bobber.position.x, bobber.position.y, bobber.position.z); a.needsUpdate = true;
  fish.t -= dt;
  if (fish.phase === 'wait') {
    bobber.position.y = fish.y + Math.sin(t * 2.4) * 0.03; setFishBar('うきを まっている…', 0.15 + 0.1 * Math.sin(t * 2), false);
    if (fish.t <= 0) { const f = pickFish(fish.spot.sea ? FISH_TABLE : RIVER_FISH); fish.kind = f[0]; fish.need = f[2]; fish.phase = 'bite'; fish.t = 1.3; sfx('quest'); burst('drop', new V3(fish.tx, fish.y + 0.2, fish.tz), 10, { size: 0.35, up: 1.6, life: 0.9 }); }
  } else if (fish.phase === 'bite') {
    bobber.position.y = fish.y - 0.12 + Math.sin(t * 40) * 0.03; setFishBar('あたり! タップ!', fish.t / 1.3, true);
    if (fish.t <= 0) endFishing('さかなに にげられた…', false);
  } else {
    bobber.position.y = fish.y - 0.05 + Math.sin(t * 30) * 0.05; bobber.position.x = fish.tx + Math.sin(t * 7) * 0.5; fish.prog -= dt * 0.16; setFishBar('リールを まけ!', fish.prog, true);
    if (fish.prog >= 1) { const id = fish.kind; endFishing(null); addItem(id, 1); ui.feed(id, 1); if (id !== 'seaweed') addStat('fish', 1); sfx('harvest'); ui.toast('ITEM GET!', `${ITEMS[id].name}を つった!`, id === 'tai' || id === 'fugu' || id === 'koi' || id === 'unagi' ? 'めずらしい さかなだ!' : '', 3000); burst('spark', P.pos.clone().setY(P.pos.y + 1.4), 12, { size: 0.35, up: 2, life: 1.2 }); }
    else if (fish.prog <= 0 || fish.t <= 0) endFishing('さかなに にげられた…', false);
  }
}

// ----- のりあみ -----
const noriViews = [];
function makeNori() {
  (world.spots.nori || []).forEach((sp, i) => {
    const g = new THREE.Group(); g.position.set(sp.x, sp.y, sp.z); g.rotation.y = sp.rot; villageRoot.add(g);
    const mat = new THREE.MeshLambertMaterial({ color: '#2a4030', side: THREE.DoubleSide }), sheets = [];
    for (const dz of [-0.12, 0.12]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(sp.len * 0.8, 0.9), mat); m.position.set(0, -0.35, dz); g.add(m); sheets.push(m); }
    g.visible = false; noriViews.push({ g, sheets, mat, sp });
  });
}
function updateNori() {
  state.nori.forEach((n, i) => { const v = noriViews[i]; if (!v) return; v.g.visible = n.crop; if (!n.crop) return; const k = Math.min(1, 0.25 + n.days / 3 * 0.75); v.sheets.forEach(m => { m.scale.set(1, k, 1); m.position.y = -0.1 - 0.45 * k; }); v.mat.color.set(n.days >= 3 ? '#16281c' : '#4a7a50'); });
}
function noriTarget(i) {
  const n = state.nori[i];
  if (!n.crop) { if (count('nori_spore') > 0) return { label: 'のりあみに のりのたねを つける', sub: '3日で のりが とれるよ(みずやりは いらないよ)', short: 'つける', can: true, act: () => { addItem('nori_spore', -1); n.crop = true; n.days = 0; sfx('plant'); burst('drop', new V3(world.spots.nori[i].x, SEA_Y + 0.3, world.spots.nori[i].z), 6, { size: 0.3, up: 1, life: 0.8 }); } }; return { label: 'のりあみ(あき)', sub: 'のりのたねを たねやで かえるよ', short: 'のりあみ', can: false }; }
  if (n.days < 3) return { label: 'のりが そだっているよ', sub: `あと${3 - n.days}日`, short: 'そだち中', can: false };
  return { label: 'のりを とる', sub: 'まっくろに そだったよ', short: 'とる', can: true, act: () => { const k = 2 + (rng() < 0.4 ? 1 : 0); addItem('nori', k); ui.feed('nori', k); addStat('nori', k); n.crop = false; n.days = 0; sfx('harvest'); burst('spark', new V3(world.spots.nori[i].x, SEA_Y + 0.8, world.spots.nori[i].z), 10, { size: 0.3, up: 1.6, life: 1 }); } };
}

// ---------- 家で休む ----------
let sleeping = false;
function sleep() {
  sleeping = true; const f = $('#fade'); f.textContent = ''; f.classList.add('on'); sfx('ui');
  setTimeout(() => {
    if (state.hour >= 6.5) { state.day++; newDay(); } state.hour = 6.5; P.stam = 100; P.lock = false;
    healParty(); state.animals.forEach(a => a.hunger = Math.min(1, a.hunger + 0.25)); state.cows.forEach(a => a.hunger = Math.min(1, a.hunger + 0.3));
    save(); f.textContent = 'ぐっすり ねむりました'; ui.setClock();
  }, 1000);
  setTimeout(() => { f.classList.remove('on'); sleeping = false; ui.toast('GOOD MORNING', `${state.day}日目の あさ`, 'たいりょくが かいふくしたよ'); }, 2800);
}

// ---------- インタラクション ----------
let curTarget = null;
// 近くで操作できるものを すべて列挙(ボタン操作と画面タップの両方で使う)
function eachTarget(test) {
  if (!P.room) test(GATE.x, GATE.z + 1.2, 3.6, () => ({ label: 'そとへ でかける', sub: 'はじまりの もり(モンスターと バトルが できるよ)', short: 'でかける', can: true, act: openGate }), -0.3, 1.2, 130);
  const HT = curHot();
  if (ghostInfo) test(ghostInfo.x, ghostInfo.z, ghostInfo.reach, () => placeTarget(), -0.8, 0.2, 140);
  if (!P.room && count('bucket') > 0) {
    for (const s of world.spots.riverWater || []) if (Math.hypot(P.pos.x - s.x, P.pos.z - s.z) < 14) test(s.x, s.z, 2.6, () => waterTarget(), -0.2, 0.5, 90);
    for (const w of state.wells) test(w.x, w.z + 1.4, 3.2, () => waterTarget(), -0.2, 1.0, 90);
  }
  if (world.spots.pier && !P.room && count('fishing_rod') > 0) { const e = world.spots.pier.end; test(e.x, e.z, 3.4, () => fishTarget(), -0.4, 0.8, 130); }
  if (world.spots.river && !P.room && count('fishing_rod') > 0 && Math.hypot(P.pos.x + 55, P.pos.z - 28) < 50) for (const s of world.spots.river) test(s.x, s.z, 2.4, () => fishTarget(s), -0.4, 0.8, 120);
  (world.spots.nori || []).forEach((sp, i) => { if (!P.room) test(sp.x, sp.z, 4.9, () => noriTarget(i), 0, 0.9, 110); });
  plots.forEach((pl, i) => { const s = state.plots[i]; if (HT === 'rake' ? s.tilled : HT === 'hoe' ? !s.tilled : HT === 'hand' ? s.tilled : false) test(pl.pos.x, pl.pos.z, 2.5, () => plotTarget(i, HT), 0, 0.3, 90); });
  if (!P.room && (!ghostInfo || ghostInfo.mode === 'fence' || !ghostInfo.ok)) for (const f of state.fences) {
    const kd = kindOf(f); if (kd === 'paver' || Math.hypot(f.x - P.pos.x, f.z - P.pos.z) >= 2.6) continue;
    if (kd === 'feeder') test(f.x, f.z, 2.6, () => feederTarget(f), 0, 0.5, 70);
    test(f.x, f.z, 2.4, () => fenceTarget(f), kd === 'feeder' ? 0.9 : 0.6, 0.5, 70);
  }
  if (!P.room) {   // たてものの ひっこし
    state.wells.forEach((w, i) => { if (!w.moving) test(w.x, w.z, 2.8, () => moveTarget('well', i), 1.0, 1, 60); });
    state.barns.forEach((b, i) => { if (!b.moving && PENS[i]) test(b.x + 7.4, b.z, 4.2, () => moveTarget('barn', i), 1.2, 1.5, 60); });
    state.coops.forEach((c, i) => { if (!c.moving && COOP_SPOTS[i]) test(c.x + 2.8, c.z - 2.75, 2.4, () => moveTarget('coop', i), 1.2, 1.2, 60); });
  }
  if (!P.room && (HT === 'hoe' || HT === 'rake')) for (const c of state.cleared) test(c.x, c.z, 2.5, () => clearedTarget(c, HT), 0, 0.2, 90);
  for (const n of nodes) if (n.active) test(n.x, n.z, n.d.r, () => n.d.need && count(n.d.need) < 1 ? { label: 'ほしくさが はえている', sub: 'かまが あれば かれるよ(よろずやで かえるよ)', short: 'かまが ひつよう', can: false } : ({ label: n.d.label, sub: ITEMS[n.d.item].name + ` ×${n.d.n}`, short: n.d.need ? 'かる' : 'あつめる', can: true, act: () => collect(n) }));
  for (const a of hens) if (a.room || COOP_SPOTS[a.ck]) test(a.x, a.z, 1.9, () => henTarget(a), 0.4, a.chick ? 0.2 : 0.4, 55);
  if (P.room === ROOMS.house) for (const a of animals) test(a.x, a.z, 2.3, () => animalTarget(a), -0.5, 0.5, 60);
  if (!P.room) for (const a of cows) if (PENS[a.b]) test(a.x, a.z, 3.0, () => cowTarget(a), -0.6, a.c.h * 0.6, 80);
  if (!P.room) test(PC.x, PC.z, 3.4, () => ({ label: 'あずかりパソコン', sub: `なかまを あずける・ひきとる(いま ${(state.pasture || []).length}ひき あずかっているよ)`, short: 'つかう', can: true, act: () => ui.openPanel('pasture') }), 1.2, 1, 40);
  if (!P.room) for (const v of villagers) test(v.x, v.z, 2.4, () => ({ label: `${vN(v)}と はなす`, sub: `あそびに きた ${v.d.who}`, short: 'はなす', can: true, act: () => talkVillager(v) }), -0.4);
  if (!P.room) for (const m of yardGroup.children) { const f = state.deco[m.userData.di]; if (f && f.k === 'bench') test(f.x, f.z, 2.0, () => ({ label: 'ベンチで ひとやすみ', sub: P.stam >= 99 ? 'いまは げんきいっぱい' : 'スタミナが ぜんかいふく するよ', short: 'やすむ', can: P.stam < 99, act: () => { P.stam = 100; sfx('feed'); ui.toast('ひとやすみ', 'スタミナが ぜんかいふくしたよ', '', 1800); } }), 0.2); }
  for (const n of npcs) test(n.x, n.z, 2.4, () => ({ label: `${nN(n)}と はなす`, sub: 'むらのひと', short: 'はなす', can: true, act: () => { ui.toast(nN(n), n.d.lines[n.line % n.d.lines.length], '', 4200); n.line++; n.wait = 4; sfx('pet'); } }), -0.3);
  if (P.room) { const r = P.room; test(r.exit.x, r.exit.z, 1.6, () => ({ label: 'そとに でる', sub: '', short: 'でる', can: true, act: () => goRoom(null, r.outPos(), 0, 6.4) }), 0.5, 1.2, 120);
    if (r.kitchen) test(r.kitchen.x + 3.2, r.kitchen.z + 1.6, 2.4, () => ({ label: 'もようがえ', sub: 'かべがみ・ゆかを かえる', short: 'もようがえ', can: true, act: () => ui.openPanel('decor') }), -0.1, 1.2, 120);
    if (r.kitchen) test(r.kitchen.x, r.kitchen.z, 2.2, () => ({ label: 'りょうりを する', sub: 'ざいりょうで おいしいごはん', short: 'りょうり', can: true, act: () => ui.openPanel('cook') }), -0.2, 1.2, 140);
    for (const f of state.furni) if (f.k === 'workbench') test(f.x, f.z, 2.6, () => ({ label: 'さぎょうだい', sub: 'バトルの ざいりょうで ボールを つくる', short: 'つくる', can: true, act: () => ui.openPanel('craft') }), -0.2, 1.2, 130);
    if (r.bed) test(r.bed.x, r.bed.z + 0.5, 2.4, () => ({ label: 'ベッドで やすむ', sub: 'あさまで ぐっすり(セーブされるよ)', short: 'ねる', can: true, act: sleep }), -0.4, 0.8, 140); }
  else COOP_SPOTS.forEach((_, k) => { const d = coopDoorPos(k); if (d && ROOMS.coops[k]) test(d.x, d.z, 2.2, () => ({ label: 'とりごやに はいる', sub: 'なかで たまごが ひろえるよ', short: 'はいる', can: true, act: () => goRoom(ROOMS.coops[k], ROOMS.coops[k].spawn, Math.PI, 5.6) }), 0.6, 1.2, 130); });
  { const sh = world.spots.ship; test(sh.x, sh.z + 1.2, 3.0, () => ({ label: 'しゅっかばこ', sub: 'いれたものは あさに うれるよ', short: 'いれる', can: true, act: () => ui.openPanel('ship') }), 0.5, 0.6, 120); }
  for (const st of world.spots.stalls) test(st.at.x, st.at.z, 3.0, () => ({ label: `${st.name}を みる`, sub: st.id === 'tane' ? 'たね を かえるよ' : 'うる・かう', short: 'おみせ', can: true, act: () => ui.openPanel('shop', st.id) }), 0.5, 1.5, 150);
  if (!P.room && world.spots.houseDoor) test(world.spots.houseDoor.x, world.spots.houseDoor.z, 2.6, () => ({ label: 'いえに はいる', sub: 'なかに ベッドが あるよ', short: 'はいる', can: true, act: () => goRoom(ROOMS.house, ROOMS.house.spawn, Math.PI, 5.8) }), 0.5, 1.2, 130);
}
function findTarget() {
  const fx = Math.sin(P.face), fz = Math.cos(P.face); let best = null, bs = 1e9;
  const test = (x, z, r, make, bias = 0) => {
    const dx = x - P.pos.x, dz = z - P.pos.z, d = Math.hypot(dx, dz); if (d > r) return; const dot = (dx * fx + dz * fz) / (d || 1);
    const s = d - (dot > 0.2 ? 0.6 : 0) + bias; if (s < bs) { bs = s; best = make; }
  };
  eachTarget(test);
  return best ? best() : null;
}


// ---------- かぐ配置モード(おうちの中で、ゆびで家具を動かす) ----------
let furniMode = false, furniSel = -1, furniDrag = null;
const furniMark = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: '#ffd24a', transparent: true, opacity: 0.42, depthWrite: false })); furniMark.rotation.x = -Math.PI / 2; furniMark.visible = false; furniMark.renderOrder = 3; villageRoot.add(furniMark);
const furniRay = new THREE.Raycaster(), furniV = new THREE.Vector2(), furniPlane = new THREE.Plane(new V3(0, 1, 0), 0);
const furniRect = (f) => ROOMS.house.furniBox(f, HOUSE_MODELS[FURNI[f.k].model]);
const overlap = (a, b) => a.minx < b.maxx && a.maxx > b.minx && a.minz < b.maxz && a.maxz > b.minz;
function furniOK(i, f) {   // 部屋の中・ドアの前をふさがない・ほかの家具に重ならない
  const R = ROOMS.house, b = furniRect(f);
  if (b.minx < R.cx - R.hw + 0.05 || b.maxx > R.cx + R.hw - 0.05 || b.minz < R.cz - R.hd + 0.05 || b.maxz > R.cz + R.hd - 0.05) return false;
  if (b.maxx > R.cx - 0.9 && b.minx < R.cx + 0.9 && b.maxz > R.cz + R.hd - 1.9) return false;
  for (const q of R.fixedBoxes) if (overlap(b, q)) return false;
  for (let j = 0; j < state.furni.length; j++) if (j !== i && overlap(b, furniRect(state.furni[j]))) return false;
  return true;
}
function furniSync(i) { const R = ROOMS.house, f = state.furni[i], m = R.furniGroup.children.find(c => c.userData.fi === i); if (m) { m.position.x = f.x; m.position.z = f.z; m.rotation.y = f.ry; } furniShowMark(); }
function furniShowMark() {
  if (furniSel < 0 || !state.furni[furniSel]) { furniMark.visible = false; return; }
  const b = furniRect(state.furni[furniSel]); furniMark.visible = true; furniMark.scale.set(b.maxx - b.minx + 0.25, b.maxz - b.minz + 0.25, 1); furniMark.position.set((b.minx + b.maxx) / 2, 0.04, (b.minz + b.maxz) / 2);
}
function furniEnter() {
  if (P.room !== ROOMS.house) { ui.toast('かぐ', 'おうちの なかで ひらいてね', '', 2400); sfx('no'); return; }
  furniMode = true; furniSel = -1; document.body.classList.add('furnimode'); $('#furnibar').hidden = false;
  cam.yaw = 0; cam.pitch = 1.12; cam.dist = 8.6; updateCamera(0, true); sfx('ui');
}
function furniExit() {
  furniMode = false; furniSel = -1; furniDrag = null; furniMark.visible = false; document.body.classList.remove('furnimode'); $('#furnibar').hidden = true;
  cam.pitch = 0.62; cam.dist = 6.4; clampRoom(P.pos); updateCamera(0, true); sfx('ui');
}
function furniFloor(e) {
  const r = canvas.getBoundingClientRect(); furniV.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  camera.updateMatrixWorld(); furniRay.setFromCamera(furniV, camera); const out = new V3(); return furniRay.ray.intersectPlane(furniPlane, out) ? out : null;
}
canvas.addEventListener('pointerdown', e => {
  if (!furniMode || ui.panelOpen()) return;
  const r = canvas.getBoundingClientRect(); furniV.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  camera.updateMatrixWorld(); furniRay.setFromCamera(furniV, camera);
  const hit = furniRay.intersectObjects(ROOMS.house.furniGroup.children, false)[0];
  if (hit) { furniSel = hit.object.userData.fi; const p = furniFloor(e), f = state.furni[furniSel]; furniDrag = { ox: p ? p.x - f.x : 0, oz: p ? p.z - f.z : 0 }; sfx('ui'); } else furniSel = -1;
  furniShowMark();
});
canvas.addEventListener('pointermove', e => {
  if (!furniMode || !furniDrag || furniSel < 0) return;
  const p = furniFloor(e); if (!p) return; const f = state.furni[furniSel], nx = Math.round((p.x - furniDrag.ox) * 10) / 10, nz = Math.round((p.z - furniDrag.oz) * 10) / 10;
  for (const c of [{ x: nx, z: nz }, { x: nx, z: f.z }, { x: f.x, z: nz }]) if (furniOK(furniSel, { ...f, ...c })) { f.x = c.x; f.z = c.z; furniSync(furniSel); break; }
});
const furniUp = () => { furniDrag = null; };
canvas.addEventListener('pointerup', furniUp); canvas.addEventListener('pointercancel', furniUp);
document.querySelectorAll('#furnibar button').forEach(b => b.onclick = async () => {
  const k = b.dataset.f, R = ROOMS.house;
  if (k === 'done') return furniExit();
  if (k === 'shop') return ui.openPanel('furni');
  if (furniSel < 0) { ui.toast('かぐ', 'さきに かぐを タップしてね', '', 1800); return sfx('no'); }
  if (k === 'rot') { const f = state.furni[furniSel], c = { ...f, ry: f.ry + Math.PI / 2 }; if (furniOK(furniSel, c)) { f.ry = c.ry; furniSync(furniSel); sfx('ui'); } else sfx('no'); }
  if (k === 'del') { state.furni.splice(furniSel, 1); furniSel = -1; await R.rebuild(); furniShowMark(); sfx('ui'); }
});
bus.on('furniStart', () => furniEnter());
bus.on('furniPut', async (k) => {
  const R = ROOMS.house; if (P.room !== R || !FURNI[k] || (state.furniOwn[k] || 0) <= state.furni.filter(f => f.k === k).length) return;
  if (!(await R.ensure(FURNI[k]))) return;
  const f = { k, x: R.cx, z: R.cz, ry: 0 }; state.furni.push(f); const i = state.furni.length - 1; let found = false;
  for (let r = 0; r < 7 && !found; r += 0.5) for (let a = 0; a < 12 && !found; a++) { f.x = Math.round((R.cx + Math.cos(a / 12 * 6.283) * r) * 10) / 10; f.z = Math.round((R.cz - 0.4 + Math.sin(a / 12 * 6.283) * r) * 10) / 10; if (furniOK(i, f)) found = true; }
  if (!found) { state.furni.pop(); ui.toast('かぐ', 'おく ばしょが ないよ', 'ほかの かぐを しまってね', 2600); return sfx('no'); }
  await R.rebuild(); furniSel = i; furniShowMark(); sfx('coin');
});

// ---------- にわの かざり(むらのどこにでも置ける。ゆびで動かす) ----------
const yardGroup = new THREE.Group(); villageRoot.add(yardGroup);
const DECO_MODELS = {}, yardCircles = [];
let yardMode = false, yardSel = -1, yardDrag = null, yardPan = null; const yardCenter = new V3();
const yardMark = new THREE.Mesh(new THREE.RingGeometry(0.85, 1, 28), new THREE.MeshBasicMaterial({ color: '#ffd24a', transparent: true, opacity: 0.85, depthWrite: false, side: THREE.DoubleSide })); yardMark.rotation.x = -Math.PI / 2; yardMark.visible = false; yardMark.renderOrder = 3; villageRoot.add(yardMark);
async function yardEnsure(F) {
  if (DECO_MODELS[F.model]) return true;
  try { const gl = await loader.loadAsync(`./assets/${F.model}_lite.glb`); let m = null; gl.scene.traverse(o => { if (!m && o.isMesh) m = o; }); if (!m.geometry.attributes.normal) m.geometry.computeVertexNormals(); const bb = new THREE.Box3().setFromBufferAttribute(m.geometry.attributes.position), sz = bb.getSize(new V3()); DECO_MODELS[F.model] = { geo: m.geometry, mat: m.material, bb, sc: F.fit / Math.max(sz.x, sz.y, sz.z) }; return true; } catch (e) { console.warn('deco load failed', F.model, e); return false; }
}
async function yardRebuild() {
  while (yardGroup.children.length) yardGroup.remove(yardGroup.children[0]);
  for (const c of yardCircles) { const i = world.colliders.circles.indexOf(c); if (i >= 0) world.colliders.circles.splice(i, 1); } yardCircles.length = 0;
  for (let i = 0; i < state.deco.length; i++) {
    const f = state.deco[i], F = DECO[f.k]; if (!F || !(await yardEnsure(F))) continue;
    const M = DECO_MODELS[F.model], mesh = new THREE.Mesh(M.geo, M.mat); mesh.scale.setScalar(M.sc); mesh.position.set(f.x, heightAt(f.x, f.z) - M.bb.min.y * M.sc, f.z); mesh.rotation.y = f.ry; mesh.castShadow = !isTouch; mesh.receiveShadow = true; mesh.userData.di = i; yardGroup.add(mesh);
    const c = { x: f.x, z: f.z, r: F.r }; world.colliders.circles.push(c); yardCircles.push(c); mesh.userData.c = c;
  }
}
const yardOK = (x, z) => Math.hypot(x, z) < WORLD_R - 2 && heightAt(x, z) > SEA_Y + 0.15 && riverDist(x, z) > RIVER.hw + 0.8;
function yardSync(i) {
  const f = state.deco[i], m = yardGroup.children.find(c => c.userData.di === i), M = DECO_MODELS[DECO[f.k].model]; if (!m) return;
  m.position.set(f.x, heightAt(f.x, f.z) - M.bb.min.y * M.sc, f.z); m.rotation.y = f.ry; const c = m.userData.c; if (c) { c.x = f.x; c.z = f.z; } yardShowMark();
}
function yardShowMark() {
  if (yardSel < 0 || !state.deco[yardSel]) { yardMark.visible = false; return; }
  const f = state.deco[yardSel]; yardMark.visible = true; yardMark.scale.setScalar(DECO[f.k].r + 0.6); yardMark.position.set(f.x, heightAt(f.x, f.z) + 0.08, f.z);
}
function yardEnter() {
  if (P.room || sleeping || fish) { ui.toast('かざり', 'そとで ひらいてね', '', 2200); sfx('no'); return; }
  yardMode = true; yardSel = -1; document.body.classList.add('yardmode'); $('#yardbar').hidden = false; yardCenter.set(P.pos.x, 0, P.pos.z);
  cam.yaw = 0; cam.pitch = 1.1; cam.dist = 13; updateCamera(0, true); sfx('ui');
}
function yardExit() {
  yardMode = false; yardSel = -1; yardDrag = null; yardPan = null; yardMark.visible = false; document.body.classList.remove('yardmode'); $('#yardbar').hidden = true;
  cam.pitch = 0.36; cam.dist = 6.4; collide(P.pos, 0.34); updateCamera(0, true); sfx('ui');
}
const yardRayFloor = (e, y) => { const r = canvas.getBoundingClientRect(); furniV.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); camera.updateMatrixWorld(); furniRay.setFromCamera(furniV, camera); furniPlane.constant = -y; const out = new V3(); return furniRay.ray.intersectPlane(furniPlane, out) ? out : null; };
canvas.addEventListener('pointerdown', e => {
  if (!yardMode || yardFence || ui.panelOpen()) return;
  const r = canvas.getBoundingClientRect(); furniV.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); camera.updateMatrixWorld(); furniRay.setFromCamera(furniV, camera);
  const hit = furniRay.intersectObjects(yardGroup.children, false)[0];
  if (hit) { yardSel = hit.object.userData.di; const f = state.deco[yardSel], p = yardRayFloor(e, hit.point.y); yardDrag = { ox: p ? p.x - f.x : 0, oz: p ? p.z - f.z : 0, y: hit.point.y }; sfx('ui'); }
  else { yardSel = -1; yardPan = { x: e.clientX, y: e.clientY }; }
  yardShowMark();
});
canvas.addEventListener('pointermove', e => {
  if (!yardMode || yardFence) return;
  if (yardDrag && yardSel >= 0) { const p = yardRayFloor(e, yardDrag.y); if (!p) return; const f = state.deco[yardSel], nx = Math.round((p.x - yardDrag.ox) * 4) / 4, nz = Math.round((p.z - yardDrag.oz) * 4) / 4; if (yardOK(nx, nz)) { f.x = nx; f.z = nz; yardSync(yardSel); } }
  else if (yardPan) {
    const h = canvas.clientHeight, wpp = 2 * cam.dist * Math.tan(camera.fov * Math.PI / 360) / h, dx = e.clientX - yardPan.x, dy = e.clientY - yardPan.y;
    yardCenter.x = THREE.MathUtils.clamp(yardCenter.x - dx * wpp, -WORLD_R, WORLD_R); yardCenter.z = THREE.MathUtils.clamp(yardCenter.z - dy * wpp / Math.sin(cam.pitch), -WORLD_R, WORLD_R); yardPan = { x: e.clientX, y: e.clientY };
  }
});
const yardUp = () => { yardDrag = null; yardPan = null; };
canvas.addEventListener('pointerup', yardUp); canvas.addEventListener('pointercancel', yardUp);
document.querySelectorAll('#yardbar button').forEach(b => b.onclick = async () => {
  const k = b.dataset.y;
  if (k === 'done') return yardExit();
  if (k === 'shop') return ui.openPanel('deco');
  if (yardSel < 0) { ui.toast('かざり', 'さきに かざりを タップしてね', '', 1800); return sfx('no'); }
  if (k === 'rot') { state.deco[yardSel].ry += Math.PI / 4; yardSync(yardSel); sfx('ui'); }
  if (k === 'del') { state.deco.splice(yardSel, 1); yardSel = -1; await yardRebuild(); yardShowMark(); sfx('ui'); }
});
bus.on('yardStart', () => yardEnter());
bus.on('yardPut', async (k) => {
  if (!yardMode || !DECO[k] || (state.decoOwn[k] || 0) <= state.deco.filter(f => f.k === k).length) return;
  if (!(await yardEnsure(DECO[k]))) return;
  let x = Math.round(yardCenter.x * 4) / 4, z = Math.round(yardCenter.z * 4) / 4; if (!yardOK(x, z)) { x = 0; z = 6; }
  state.deco.push({ k, x, z, ry: 0 }); await yardRebuild(); yardSel = state.deco.length - 1; yardShowMark(); sfx('coin');
});

// ---------- そとへの ゲート(はじまりの もり) ----------
const GATE = { x: 5, z: -38 };
{
  const wood = new THREE.MeshLambertMaterial({ color: '#7a5230' }), glow = new THREE.MeshBasicMaterial({ color: '#ffe9a0', transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const g = new THREE.Group();
  for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.5, 4.4, 0.5), wood); p.position.set(s * 2.2, 2.2, 0); p.castShadow = !isTouch; g.add(p); }
  const beam = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.55, 0.6), wood); beam.position.y = 4.4; g.add(beam);
  const portal = new THREE.Mesh(new THREE.PlaneGeometry(3.9, 4.1), glow); portal.position.y = 2.1; g.add(portal); g.userData.portal = portal;
  g.position.set(GATE.x, heightAt(GATE.x, GATE.z), GATE.z); villageRoot.add(g); GATE.mesh = g;
  world.colliders.circles.push({ x: GATE.x - 2.2, z: GATE.z, r: 0.5 }, { x: GATE.x + 2.2, z: GATE.z, r: 0.5 });
  world.keep && world.keep(GATE.x, GATE.z, 4);
}
// ---------- あずかりパソコン(ゲートの みぎ てまえ。なかまを あずける・ひきとる) ----------
const PC = { x: GATE.x + 7, z: GATE.z + 4.5 };
{
  const g = new THREE.Group(), body = new THREE.MeshLambertMaterial({ color: '#d8d4c8' }), dark = new THREE.MeshLambertMaterial({ color: '#4a4a52' }), wood = new THREE.MeshLambertMaterial({ color: '#7a5230' });
  const desk = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.2, 1.4), wood); desk.position.y = 1.0; g.add(desk);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.0, 0.16), wood); l.position.set(sx * 1.05, 0.5, sz * 0.58); g.add(l); }
  const mon = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.95, 0.12), body); mon.position.set(0, 1.9, -0.25); g.add(mon);
  const cv = document.createElement('canvas'); cv.width = 128; cv.height = 96; { const c = cv.getContext('2d'); c.fillStyle = '#12304a'; c.fillRect(0, 0, 128, 96); c.fillStyle = '#7fe0ff'; c.fillRect(14, 14, 100, 6); c.fillRect(14, 30, 70, 6); c.fillRect(14, 46, 84, 6); c.fillStyle = '#ffe9a0'; c.beginPath(); c.arc(64, 74, 9, 0, 6.28); c.fill(); }
  const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace;
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(1.14, 0.78), new THREE.MeshBasicMaterial({ map: tx })); scr.position.set(0, 1.9, -0.185); g.add(scr); g.userData.scr = scr;
  const stand = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.5, 0.2), dark); stand.position.set(0, 1.35, -0.25); g.add(stand);
  const kb = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.06, 0.4), dark); kb.position.set(0, 1.13, 0.3); g.add(kb);
  g.position.set(PC.x, heightAt(PC.x, PC.z), PC.z); g.traverse(o => { if (o.isMesh) o.castShadow = !isTouch; }); villageRoot.add(g);
  world.colliders.boxes.push({ minx: PC.x - 1.2, maxx: PC.x + 1.2, minz: PC.z - 0.7, maxz: PC.z + 0.7 });
  world.keep && world.keep(PC.x, PC.z, 3);
}
function openGate() { if (!state.boss.forest) return goOut('forest'); ui.openPanel('gate'); }
bus.on('goField', (id) => goOut(id));
function goOut(dest) {
  if (sleeping) return; sleeping = true; const f = $('#fade'); f.textContent = ''; f.classList.add('on'); sfx('quest');
  setTimeout(() => { state.pos = { x: GATE.x, z: GATE.z + 3.6 }; save(); location.href = dest === 'lake' ? 'field.html?f=lake' : dest !== 'forest' && dest !== 'lake' ? 'field.html?f=' + dest : 'field.html'; }, 800);
}

// ---------- 村づくり: 草を刈る・畑・いど・牛舎・鶏小屋を すきな ばしょに ----------
const BUILD_MODELS = {};
async function loadMesh(name) {
  if (BUILD_MODELS[name]) return BUILD_MODELS[name];
  const gl = await loader.loadAsync(`./assets/${name}_lite.glb`); let m = null; gl.scene.traverse(o => { if (!m && o.isMesh) m = o; });
  if (!m.geometry.attributes.normal) m.geometry.computeVertexNormals(); m.material.side = THREE.FrontSide;
  return BUILD_MODELS[name] = { geo: m.geometry, mat: m.material, bb: new THREE.Box3().setFromBufferAttribute(m.geometry.attributes.position) };
}
function putModel(M, x, z, scale, rot) { const mesh = new THREE.Mesh(M.geo, M.mat); mesh.scale.setScalar(scale); mesh.position.set(x, heightAt(x, z) - M.bb.min.y * scale, z); mesh.rotation.y = rot; mesh.castShadow = !isTouch; mesh.receiveShadow = true; villageRoot.add(mesh); if (rec) rec.meshes.push(mesh); return mesh; }
let rec = null;   // たてている さいちゅうの たてものの 部品(ひっこし用)
const BUILT = { well: [], barn: [], coop: [] };
const addBoxC = (cx, cz, w, d) => { const b = { minx: cx - w / 2, maxx: cx + w / 2, minz: cz - d / 2, maxz: cz + d / 2 }; world.colliders.boxes.push(b); if (rec) rec.boxes.push(b); return b; };
function unbuild(kind, i) {
  const r = BUILT[kind][i]; if (!r) return;
  r.meshes.forEach(m => villageRoot.remove(m)); r.boxes.forEach(b => { const k = world.colliders.boxes.indexOf(b); if (k >= 0) world.colliders.boxes.splice(k, 1); }); r.circles.forEach(c => { const k = world.colliders.circles.indexOf(c); if (k >= 0) world.colliders.circles.splice(k, 1); });
  BUILT[kind][i] = null;
}
async function addFence(segs) {
  const M = await loadMesh('fence'), len0 = M.bb.max.x - M.bb.min.x, h0 = M.bb.max.y - M.bb.min.y, cells = [];
  for (const [a, b] of segs) {
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.round(len / 2));
    for (let i = 0; i < n; i++) { const t0 = i / n, t1 = (i + 1) / n; cells.push([a[0] + (b[0] - a[0]) * (t0 + t1) / 2, a[1] + (b[1] - a[1]) * (t0 + t1) / 2, Math.atan2(b[1] - a[1], b[0] - a[0]), len / n]); }
    if (Math.abs(b[0] - a[0]) > Math.abs(b[1] - a[1])) addBoxC((a[0] + b[0]) / 2, a[1], len, 0.5); else addBoxC(a[0], (a[1] + b[1]) / 2, 0.5, len);
  }
  const im = new THREE.InstancedMesh(M.geo, M.mat, cells.length), mt = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), pv = new V3(), sv = new V3();
  cells.forEach(([x, z, ang, l], i) => { const sx = l / len0 * 1.04, sy = 1.15 / h0; e.set(0, -ang, 0); q.setFromEuler(e); mt.compose(pv.set(x, heightAt(x, z) + (-M.bb.min.y) * sy, z), q, sv.set(sx, sy, sx * 1.1)); im.setMatrixAt(i, mt); });
  im.castShadow = im.receiveShadow = true; im.computeBoundingSphere(); villageRoot.add(im); if (rec) rec.meshes.push(im);
}
const barnBuilt = new Set(), coopBuilt = new Set();
async function buildWell(w, i) { if (w.moving) return; rec = { meshes: [], boxes: [], circles: [] }; const M = await loadMesh('well'); putModel(M, w.x, w.z, 1.45, 0.4); const c = { x: w.x, z: w.z, r: 1.1 }; world.colliders.circles.push(c); rec.circles.push(c); BUILT.well[i] = rec; rec = null; }
async function buildBarn(k) {
  const B = state.barns[k]; if (!B || B.moving || barnBuilt.has(k)) return; barnBuilt.add(k);
  const px0 = B.x - 11, px1 = B.x, pz0 = B.z - 4.5, pz1 = B.z + 4.5, gz = B.z;
  PENS[k] = { minx: px0, maxx: px1, minz: pz0, maxz: pz1 };
  rec = { meshes: [], boxes: [], circles: [] };
  await addFence([[[px0, pz0], [px1, pz0]], [[px1, pz0], [px1, pz1]], [[px1, pz1], [px0, pz1]], [[px0, pz1], [px0, gz + 2]], [[px0, gz - 2], [px0, pz0]]]);
  const M = await loadMesh('cattle_barn'), bx = B.x + 7.4; putModel(M, bx, B.z, 5.0, -Math.PI / 2); addBoxC(bx, B.z, 5.8, 9.8); BUILT.barn[k] = rec; rec = null;
  makeCows();
}
async function buildCoop(k) {
  const C = state.coops[k]; if (!C || C.moving || coopBuilt.has(k)) return; coopBuilt.add(k);
  const cx = C.x, cz = C.z - 2.75; COOP_SPOTS[k] = { x: cx, z: cz };
  rec = { meshes: [], boxes: [], circles: [] };
  const M = await loadMesh('coop'); putModel(M, cx, cz, 3.6, 0); addBoxC(cx, cz, 4.2, 3.6); BUILT.coop[k] = rec; rec = null;
  if (!ROOMS.coops[k]) ROOMS.coops[k] = buildCoopRoom(k); state.eggs.filter(e => (e.c || 0) === k && !nodes.some(n => n.egg === e)).forEach(addNestEgg); makeHens();
}
async function rebuildPlaced() {
  if (state.plots.some(p => p.x == null)) state.plots = [];   // むかしの セーブ(固定の畑)は つくりなおし
  state.plots.forEach(p => { world.hideGrass(p.x - 1.8, p.z - 1.8, p.x + 1.8, p.z + 1.8); addPlotVisual(p); });
  state.cleared.forEach(c => { world.hideGrass(c.x - 1.8, c.z - 1.8, c.x + 1.8, c.z + 1.8); addCleared(c); });
  for (let i = 0; i < state.wells.length; i++) await buildWell(state.wells[i], i);
  await fenceInit(); makeAnimals(); for (let k = 0; k < state.barns.length; k++) await buildBarn(k); for (let k = 0; k < state.coops.length; k++) await buildCoop(k);
}
bus.on('spawnAnimal', (k) => {
  if (k === 'cow') { const b = Math.max(0, state.barns.findIndex((_, bi) => state.cows.filter(o => o.b === bi).length < 3)); state.cows.push({ hunger: 0.3, friend: 0, milked: false, b }); addCow(state.cows.length - 1); }
  else if (k === 'hen') { const c = Math.max(0, state.coops.findIndex((_, ci) => state.chickens.filter(o => o.c === ci).length < 6)); state.chickens.push({ friend: 0, fed: false, c }); addHen(state.chickens.length - 1); }
  else { state.animals.push({ hunger: 0.4, friend: 0 }); addAnimal(state.animals.length - 1); }
  sfx('quest'); doSave();
});
const waterCap = () => BUCKET.caps[Math.min(BUCKET.caps.length - 1, state.bucketLv || 0)];
const KITS = {
  kit_well: { w: 3, d: 3, label: 'いどを つくる', sub: 'ここに いどを つくるよ(みずが くめる)', stat: 'well' },
  kit_barn: { w: 22, d: 10.5, label: 'ぼくじょうを たてる', sub: 'ぎゅうしゃと ぼくじょうを ここに たてるよ', stat: 'barn' },
  kit_coop: { w: 7, d: 9.5, label: 'とりごやを たてる', sub: 'ここに とりごやを たてるよ', stat: 'coop' },
};
const ghostMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: '#6ad07a', transparent: true, opacity: 0.4, depthWrite: false, side: THREE.DoubleSide })); ghostMesh.rotation.x = -Math.PI / 2; ghostMesh.renderOrder = 4; ghostMesh.visible = false; villageRoot.add(ghostMesh);
let ghostInfo = null;
let toolSel = 'plot';
// ---- ツールボックス(画面の左がわ): て / かま / くわ / もどす / おく。えらんだ どうぐの ことだけが できる ----
let hotSel = 'hand';
const HOTS = [
  { id: 'hand', name: 'て', own: () => true, svg: '<path d="M9 17V8a1.8 1.8 0 0 1 3.6 0v6M12.6 13V6.8a1.8 1.8 0 0 1 3.6 0V13M16.2 13V8.5a1.8 1.8 0 0 1 3.6 0V18c0 4-3 7-7 7s-6-2.5-7-6l-1.5-4a1.8 1.8 0 0 1 3-1.7L9 16"/>' },
  { id: 'sickle', name: 'かま', own: () => count('sickle') > 0, svg: '<path d="M7 25c-2-9 4-17 17-17-5 2-8 6-8 11M8 26l6-6"/>' },
  { id: 'hoe', name: 'くわ', own: () => count('hoe') > 0, svg: '<path d="M7 26L21 8M17 8h9l-3 6h-6"/>' },
  { id: 'bag', name: 'もちもの', own: () => true, svg: '<circle cx="7" cy="16" r="2.2"/><circle cx="16" cy="16" r="2.2"/><circle cx="25" cy="16" r="2.2"/>' },
];
const hotbar = document.createElement('div'); hotbar.id = 'hotbar'; hotbar.hidden = true;
const CHEV = (d) => `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></svg>`;
let hotOpen = false;
hotbar.innerHTML = `<button class="tog" aria-label="ツールボックス"></button>` + HOTS.map(h => `<button data-h="${h.id}" aria-label="${h.name}"><svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${h.svg}</svg><span>${h.name}</span></button>`).join('');
document.body.appendChild(hotbar);
function hotPick(id) {
  const h = HOTS.find(x => x.id === id); if (!h || !h.own()) return sfx('no');
  if (id === 'bag') { sfx('ui'); ui.openPanel('bag'); return; }
  hotSel = id; sfx('ui'); const nm = { hand: 'て(はたけの せわ・あつめる)', sickle: 'かま(草を かる)', hoe: 'くわ(たがやす)', rake: 'もどす(はたけ・かった ばしょを もとに)' }[id]; ui.toast('どうぐ', nm, '', 1400);
}
hotbar.querySelectorAll('button[data-h]').forEach(b => b.onclick = () => hotPick(b.dataset.h));
const hotTog = hotbar.querySelector('.tog');
hotTog.onclick = () => { hotOpen = !hotOpen; sfx('ui'); hotKey = ''; };
addEventListener('keydown', e => { if (e.key === 'Escape' && yardFence) return fenceExit(); if (!started || e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || hotbar.hidden) return; const n = +e.key; if (n >= 1 && n <= HOTS.length) hotPick(HOTS[n - 1].id); });
function curHot() { const h = HOTS.find(x => x.id === hotSel); return h && h.own() ? hotSel : 'hand'; }
let hotKey = '';
function updateHot(show) {
  hotbar.hidden = !show; if (!show) return; const cur = curHot();
  const key = cur + hotOpen + HOTS.map(h => h.own() ? 1 : 0).join(''); if (key === hotKey) return; hotKey = key;
  hotbar.classList.toggle('closed', !hotOpen); hotTog.innerHTML = CHEV(hotOpen ? 'M20 6l-10 10 10 10' : 'M12 6l10 10-10 10') + (!hotOpen && cur !== 'hand' ? `<span>${HOTS.find(x => x.id === cur).name}</span>` : '');
  hotbar.querySelectorAll('button[data-h]').forEach(b => { const h = HOTS.find(x => x.id === b.dataset.h); b.classList.toggle('empty', !h.own()); b.classList.toggle('sel', h.id === cur); });
}
const toolList = () => [];
const currentTool = () => { for (const k of ['kit_barn', 'kit_coop', 'kit_well']) if (count(k) > 0) return k; return curHot() === 'sickle' ? 'plot' : null; };
const toolBtn = document.createElement('button'); toolBtn.className = 'act'; toolBtn.hidden = true; toolBtn.innerHTML = '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 20c6-1 8-5 8-12M14 8c4 2 8 2 12 0M8 26h18"/></svg><span></span>';
toolBtn.onclick = () => { const a = toolList(); if (a.length < 2) return; toolSel = a[(a.indexOf(currentTool()) + 1) % a.length]; sfx('ui'); };
$('#btns').insertBefore(toolBtn, $('#btns').firstChild);
const TOOL_NAME = { plot: 'くさかり', fence: 'さく' };
let lastFence = 0; bus.on('inv', () => { const n = count('fence'); if (n > lastFence) toolSel = 'fence'; lastFence = n; });
function placeCheck(x, z, w, d, skipFence) {
  const x0 = x - w / 2, x1 = x + w / 2, z0 = z - d / 2, z1 = z + d / 2;
  for (let gx = x0; gx <= x1 + 0.01; gx += Math.max(1.5, w / 6)) for (let gz = z0; gz <= z1 + 0.01; gz += Math.max(1.5, d / 4)) {
    if (Math.hypot(gx, gz) > WORLD_R - 4) return 'むらの はしっこには おけないよ';
    if ((seaMask(gx, gz) > 0.01 && heightAt(gx, gz) < SEA_Y + 0.4) || riverDist(gx, gz) < RIVER.hw + 1.6) return 'みずべの ちかくには おけないよ';
    if ((w < 8 || (gx === x0 || gx === x1) === false && Math.abs(gx - x) < 2 && Math.abs(gz - z) < 2) && world.nearPath(gx, gz, 1.0)) return 'みちの うえには おけないよ';
  }
  for (const b of world.colliders.boxes) if (b.minx < x1 + 0.3 && b.maxx > x0 - 0.3 && b.minz < z1 + 0.3 && b.maxz > z0 - 0.3) return 'なにかが じゃまで おけないよ';
  for (const c of world.colliders.circles) { if (skipFence && fenceCircles.includes(c)) continue; const cx = Math.max(x0, Math.min(c.x, x1)), cz = Math.max(z0, Math.min(c.z, z1)); if (Math.hypot(c.x - cx, c.z - cz) < c.r + 0.3) return 'きや ものが じゃまで おけないよ'; }
  for (const p of state.plots.concat(state.cleared)) if (Math.abs(p.x - x) < w / 2 + PLOT_S / 2 - 0.1 && Math.abs(p.z - z) < d / 2 + PLOT_S / 2 - 0.1) return 'はたけと かさなっちゃうよ';
  if (!skipFence) for (const b of state.barns) if (!b.moving && Math.abs(x - b.x) < w / 2 + 11 && Math.abs(z - b.z) < d / 2 + 5.3) return 'ぼくじょうと かさなっちゃうよ';
  if (!skipFence) for (const c of state.coops) if (!c.moving && Math.abs(x - c.x) < w / 2 + 3.5 && Math.abs(z - c.z) < d / 2 + 4.75) return 'とりごやと かさなっちゃうよ';
  return null;
}
function updateGhost() {
  if (yardFence) { fenceBtn.hidden = true; updateHot(false); updateModeGhost(); return; }
  fenceBtn.hidden = !(started && !P.room && !ui.panelOpen() && !yardMode && !fish && !sleeping && !furniMode);
  const mode = (!started || P.room || ui.panelOpen() || fish || yardMode || furniMode || sleeping) ? null : currentTool();
  updateHot(started && !P.room && !ui.panelOpen() && !yardMode && !fish && !sleeping && !furniMode);
  { const a = toolList(), m = currentTool(); toolBtn.hidden = !(a.length >= 2 && mode && m === mode); if (!toolBtn.hidden) toolBtn.lastElementChild.textContent = TOOL_NAME[mode] + '→'; }
  if (!mode) { ghostMesh.visible = false; fenceGhost.visible = false; ghostInfo = null; return; }
  if (mode === 'fence') return updateFenceGhost();
  const K = mode === 'plot' ? { w: PLOT_S, d: PLOT_S } : KITS[mode], fwd = Math.max(K.w, K.d) / 2 * (mode === 'plot' ? 1 : 0.55) + 1.6;
  let x = Math.round((P.pos.x + Math.sin(P.face) * fwd) * 2) / 2, z = Math.round((P.pos.z + Math.cos(P.face) * fwd) * 2) / 2;
  if (mode === 'plot') for (const p of state.plots.concat(state.cleared)) for (const [ox, oz] of [[3.5, 0], [-3.5, 0], [0, 3.5], [0, -3.5]]) if (Math.hypot(p.x + ox - x, p.z + oz - z) < 1.7) { x = p.x + ox; z = p.z + oz; }   // 畑のとなりに ぴったり
  let why = placeCheck(x, z, K.w, K.d);
  ghostInfo = { mode, x, z, w: K.w, d: K.d, ok: !why, why, reach: fwd + 2.5 };
  fenceGhost.visible = false; ghostMesh.visible = true; ghostMesh.scale.set(K.w, K.d, 1); ghostMesh.position.set(x, heightAt(x, z) + 0.12, z); ghostMesh.material.color.set(why ? '#e86a5a' : '#6ad07a');
}
// ---- 置き物システム: さく・ほしくさロール・いしだたみ・えさばこ(state.fences の k でしゅるい)。歩いて つづけて おく(さく) / ゆびで スライド ----
const OBJ = { fence: { item: 'fence', cap: 300, name: 'さく' }, roll: { item: 'hay_roll', cap: 120, name: 'ほしくさロール' }, paver: { item: 'paver', cap: 400, name: 'いしだたみ', step: 2 }, feeder: { item: 'feeder', cap: 12, name: 'えさばこ' } };
const KIND_ITEM = { fence: 'fence', roll: 'hay_roll', paver: 'paver', feeder: 'feeder' }, kindOf = (f) => f.k || 'fence';
const fenceCircles = [], _fm = new THREE.Matrix4(), _fq = new THREE.Quaternion(), _fe = new THREE.Euler(), _fp = new V3(), _fs = new V3(), _fc = new THREE.Color();
let fenceIM = null, fenceM = null, rollIM = null, paverIM = null, feederIM = null, yardFence = false, fenceSel = -1, fenceDrag = null;
const fenceAng = (f) => f.a ?? (f.r ? Math.PI / 2 : 0);
const fenceAt = (x, z, a, skip, kd = 'fence') => state.fences.some(f => f !== skip && kindOf(f) === kd && Math.abs(f.x - x) < 0.01 && Math.abs(f.z - z) < 0.01 && Math.abs(fenceAng(f) - a) < 0.01);
const fenceGhost = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: '#6ad07a', transparent: true, opacity: 0.45, depthWrite: false })); fenceGhost.visible = false; fenceGhost.renderOrder = 4; villageRoot.add(fenceGhost);
const fenceBtn = document.createElement('button'); fenceBtn.className = 'act'; fenceBtn.hidden = true; fenceBtn.innerHTML = '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 26l3-9L22 4l6 6-13 13zM19 7l6 6"/></svg><span>へんしゅう</span>';
$('#btns').insertBefore(fenceBtn, $('#btns').firstChild);
function feederFor(pen) { return pen ? state.fences.find(f => f.k === 'feeder' && (f.hay || 0) > 0 && f.x > pen.minx - 2 && f.x < pen.maxx + 2 && f.z > pen.minz - 2 && f.z < pen.maxz + 2) : null; }
function feederPaint() {
  if (!feederIM) return; let j = 0;
  for (const f of state.fences) if (f.k === 'feeder') feederIM.setColorAt(j++, _fc.set((f.hay || 0) > 0 ? '#f0cc58' : '#8a6a45'));
  if (feederIM.instanceColor) feederIM.instanceColor.needsUpdate = true;
}
function fenceSync() {
  if (!fenceIM) return;
  while (fenceCircles.length) { const c = fenceCircles.pop(), k = world.colliders.circles.indexOf(c); if (k >= 0) world.colliders.circles.splice(k, 1); }
  const M = fenceM, h0 = M.bb.max.y - M.bb.min.y, len0 = M.bb.max.x - M.bb.min.x, sx = 2 / len0 * 1.04, sy = 1.15 / h0, n = { fence: 0, roll: 0, paver: 0, feeder: 0 };
  const line = (f, a, r) => { for (const o of [-0.8, 0, 0.8]) { const c = { x: f.x + Math.cos(a) * o, z: f.z + Math.sin(a) * o, r }; world.colliders.circles.push(c); fenceCircles.push(c); } };
  state.fences.forEach((f) => {
    const kd = kindOf(f), a = fenceAng(f); _fe.set(0, -a, 0); _fq.setFromEuler(_fe);
    if (n[kd] >= OBJ[kd].cap) return;
    if (kd === 'roll') {
      _fm.compose(_fp.set(f.x, heightAt(f.x, f.z) + 0.6, f.z), _fq, _fs.set(1, 1, 1)); rollIM.setMatrixAt(n.roll++, _fm);
      const c = { x: f.x, z: f.z, r: 1.0 }; world.colliders.circles.push(c); fenceCircles.push(c);
    } else if (kd === 'paver') {
      _fm.compose(_fp.set(f.x, heightAt(f.x, f.z) + 0.03, f.z), _fq.set(0, 0, 0, 1), _fs.set(1, 1, 1)); paverIM.setMatrixAt(n.paver, _fm);
      paverIM.setColorAt(n.paver++, _fc.setHSL(0.09, 0.05, 0.74 + ((Math.abs(Math.round(f.x * 7 + f.z * 13)) % 10) / 10) * 0.2));
    } else if (kd === 'feeder') {
      _fm.compose(_fp.set(f.x, heightAt(f.x, f.z) + 0.25, f.z), _fq, _fs.set(1, 1, 1)); feederIM.setMatrixAt(n.feeder++, _fm); line(f, a, 0.45);
    } else {
      _fm.compose(_fp.set(f.x, heightAt(f.x, f.z) - M.bb.min.y * sy, f.z), _fq, _fs.set(sx, sy, sx * 1.1)); fenceIM.setMatrixAt(n.fence++, _fm); line(f, a, 0.4);
    }
  });
  for (const [im, c] of [[fenceIM, n.fence], [rollIM, n.roll], [paverIM, n.paver], [feederIM, n.feeder]]) { im.count = c; im.instanceMatrix.needsUpdate = true; if (c) im.computeBoundingSphere(); }
  if (paverIM.instanceColor) paverIM.instanceColor.needsUpdate = true; feederPaint();
}
async function fenceInit() {
  if (fenceIM) return; fenceM = await loadMesh('fence');
  const mk = (geo, mat, cap) => { const im = new THREE.InstancedMesh(geo, mat, cap); im.count = 0; im.castShadow = im.receiveShadow = true; im.frustumCulled = false; villageRoot.add(im); return im; };
  fenceIM = mk(fenceM.geo, fenceM.mat, OBJ.fence.cap);
  const bm = world.makeBale(), rg = bm.geometry.clone(); rg.rotateZ(Math.PI / 2); rollIM = mk(rg, bm.material, OBJ.roll.cap);
  const pt = mkTex((g, w) => { g.fillStyle = '#9a9488'; g.fillRect(0, 0, w, w); const rows = 4; for (let r = 0; r < rows; r++) { const y0 = r * w / rows, off = r % 2 ? w / 6 : 0; for (let c = -1; c < 3; c++) { g.fillStyle = ['#bdb6a8', '#b0a999', '#c6bfb0'][(r + c + 3) % 3]; g.fillRect(off + c * w / 2.5 + 2, y0 + 2, w / 2.5 - 4, w / rows - 4); } } }, 128);
  paverIM = mk(new THREE.BoxGeometry(1.94, 0.06, 1.94), new THREE.MeshLambertMaterial({ map: pt }), OBJ.paver.cap); paverIM.castShadow = false;
  feederIM = mk(new THREE.BoxGeometry(2, 0.5, 0.85), new THREE.MeshLambertMaterial({ color: '#ffffff' }), OBJ.feeder.cap);
  fenceSync();
}
function updateFenceGhost() {
  const fx = Math.sin(P.face), fz = Math.cos(P.face), a = Math.abs(fx) > Math.abs(fz) ? 0 : Math.PI / 2;
  const x = Math.round((P.pos.x + fx * 2.6) / 2) * 2, z = Math.round((P.pos.z + fz * 2.6) / 2) * 2;
  let why = placeCheck(x, z, 2, 0.6, true);
  if (!why && fenceAt(x, z, a)) why = 'ここには もう あるよ';
  if (!why && state.fences.filter(f => kindOf(f) === 'fence').length >= OBJ.fence.cap) why = 'これいじょう おけないよ';
  ghostInfo = { mode: 'fence', x, z, a, w: 2, d: 0.6, ok: !why, why, reach: 5 };
  ghostMesh.visible = false; fenceGhost.visible = true; fenceGhost.scale.set(2, 1, 0.5); fenceGhost.rotation.y = -a; fenceGhost.position.set(x, heightAt(x, z) + 0.55, z); fenceGhost.material.color.set(why ? '#e86a5a' : '#6ad07a');
}
function placeFence() {
  const gi = ghostInfo; if (!gi || !gi.ok || gi.mode !== 'fence' || count('fence') < 1 || !fenceIM) return sfx('no');
  addItem('fence', -1); state.fences.push({ x: gi.x, z: gi.z, a: gi.a }); fenceSync(); sfx('plant'); burst('dust', new V3(gi.x, heightAt(gi.x, gi.z) + 0.4, gi.z), 6, { size: 0.5, up: 0.6, life: 0.7 });
}
function fenceTarget(f) {
  const kd = kindOf(f), o = OBJ[kd];
  return { label: o.name + 'を はずす', sub: kd === 'feeder' ? 'もちものに もどるよ(ほしくさも かえる)' : 'もちものに もどるよ', short: 'はずす', can: true, act: () => { const k = state.fences.indexOf(f); if (k < 0) return; state.fences.splice(k, 1); addItem(o.item, 1); if (f.hay) addItem('hay', f.hay); fenceSync(); sfx('pick'); } };
}
function feederTarget(f) {
  const n = Math.min(10 - (f.hay || 0), count('hay')); if (n < 1) return fenceTarget(f);
  return { label: 'えさばこに ほしくさを いれる', sub: `いま ${f.hay || 0}/10 (いれる: ${n}こ)`, short: 'いれる', can: true, act: () => { addItem('hay', -n); f.hay = (f.hay || 0) + n; feederPaint(); sfx('feed'); } };
}
function pavCheck(x, z) {
  for (const [ox, oz] of [[-1, -1], [1, -1], [-1, 1], [1, 1], [0, 0]]) { const gx = x + ox, gz = z + oz; if (Math.hypot(gx, gz) > WORLD_R - 4) return 'むらの はしっこには おけないよ'; if ((seaMask(gx, gz) > 0.01 && heightAt(gx, gz) < SEA_Y + 0.4) || riverDist(gx, gz) < RIVER.hw + 1.0) return 'みずべの ちかくには おけないよ'; }
  for (const b of world.colliders.boxes) if (b.minx < x + 0.95 && b.maxx > x - 0.95 && b.minz < z + 0.95 && b.maxz > z - 0.95) return 'なにかが じゃまで おけないよ';
  for (const p of state.plots.concat(state.cleared)) if (Math.abs(p.x - x) < 1 + PLOT_S / 2 - 0.1 && Math.abs(p.z - z) < 1 + PLOT_S / 2 - 0.1) return 'はたけと かさなっちゃうよ';
  return null;
}
const objCheck = (kd, x, z) => kd === 'paver' ? pavCheck(x, z) : placeCheck(x, z, 2, kd === 'fence' ? 0.6 : kd === 'feeder' ? 0.9 : 1.2, true);
// ゆびで つまんで スライドする「さくモード」(かざりモードと おなじ ぞくぞく視点)
const fenceFloorY = () => heightAt(yardCenter.x, yardCenter.z);
function fenceMark() {
  if (fenceSel < 0 || !state.fences[fenceSel]) { yardMark.visible = false; return; }
  const f = state.fences[fenceSel]; yardMark.visible = true; yardMark.scale.setScalar(1.5); yardMark.position.set(f.x, heightAt(f.x, f.z) + 0.1, f.z);
}
const PLACE_ITEM = { fence: 'fence', roll: 'hay_roll', paver: 'paver', feeder: 'feeder' };
let fenceKind = 'fence', fenceRot = 0, fenceInfo = null;
const FDIM = { fence: [2, 1, 0.5], roll: [1.9, 1.2, 1.2], paver: [1.94, 0.12, 1.94], feeder: [2, 0.5, 0.85] };
function fenceEnter(kind) {
  if (kind) fenceKind = kind; else if (count(OBJ[fenceKind].item) < 1) { const k = Object.keys(OBJ).find(x => count(OBJ[x].item) > 0); if (k) fenceKind = k; }
  yardEnter(); if (!yardMode) return; yardFence = true; fenceSel = -1; $('#yardbar').hidden = true; $('#fencebar').hidden = false;
}
bus.on('placeStart', (k) => fenceEnter(k));
function updateModeGhost() {   // さくモード: がめんの まんなかに おく ばしょの わくが ついてくる
  const o = OBJ[fenceKind], title = $('#fenceTitle'), kb = $('#fenceKindBtn');
  const t1 = fenceSel >= 0 ? `えらんだ ${OBJ[kindOf(state.fences[fenceSel] || {})].name}: ゆびで ずらせるよ。「むきを かえる」「しまう」が つかえるよ` : `${o.name}　のこり ${count(o.item)}こ　じめんを ドラッグして ばしょを きめて「おく」(おいた ものは タップで えらんで うごかす)`;
  if (title.textContent !== t1) title.textContent = t1; const t2 = 'どうぐ: ' + o.name; if (kb.textContent !== t2) kb.textContent = t2;
  if (fenceSel >= 0) { fenceGhost.visible = false; fenceInfo = null; return; }
  const st = o.step || 0.5, x = Math.round(yardCenter.x / st) * st, z = Math.round(yardCenter.z / st) * st, a = fenceKind === 'paver' ? 0 : fenceRot;
  const why = count(o.item) < 1 ? 'もっていないよ。バッグか よろずやで' : state.fences.filter(f => kindOf(f) === fenceKind).length >= o.cap ? 'これいじょう おけないよ' : objCheck(fenceKind, x, z) || (fenceAt(x, z, a, null, fenceKind) ? 'ここには もう あるよ' : null);
  fenceInfo = { x, z, a, why };
  const d = FDIM[fenceKind]; fenceGhost.visible = true; fenceGhost.scale.set(d[0], d[1], d[2]); fenceGhost.rotation.y = -a; fenceGhost.position.set(x, heightAt(x, z) + d[1] / 2 + 0.05, z); fenceGhost.material.color.set(why ? '#e86a5a' : '#6ad07a');
}
function fenceExit() { yardFence = false; fenceSel = -1; fenceDrag = null; fenceGhost.visible = false; fenceInfo = null; $('#fencebar').hidden = true; yardExit(); }
fenceBtn.onclick = () => fenceEnter();
canvas.addEventListener('pointerdown', e => {
  if (!yardFence || ui.panelOpen()) return;
  const p = yardRayFloor(e, fenceFloorY()); let best = -1, bd = 1.8;
  if (p) state.fences.forEach((f, i) => { const d = Math.hypot(f.x - p.x, f.z - p.z) + (kindOf(f) === 'paver' ? 0.8 : 0); if (d < bd) { bd = d; best = i; } });
  fenceSel = best;
  if (best >= 0) { const f = state.fences[best]; fenceDrag = { ox: p.x - f.x, oz: p.z - f.z }; sfx('ui'); } else yardPan = { x: e.clientX, y: e.clientY };
  fenceMark();
});
canvas.addEventListener('pointermove', e => {
  if (!yardFence) return;
  if (fenceDrag && fenceSel >= 0) {
    const p = yardRayFloor(e, fenceFloorY()); if (!p) return; const f = state.fences[fenceSel], kd = kindOf(f), st = OBJ[kd].step || 0.5, nx = Math.round((p.x - fenceDrag.ox) / st) * st, nz = Math.round((p.z - fenceDrag.oz) / st) * st;
    if ((nx !== f.x || nz !== f.z) && !objCheck(kd, nx, nz) && !fenceAt(nx, nz, fenceAng(f), f, kd)) { f.x = nx; f.z = nz; fenceSync(); fenceMark(); }
  } else if (yardPan) {
    const h = canvas.clientHeight, wpp = 2 * cam.dist * Math.tan(camera.fov * Math.PI / 360) / h, dx = e.clientX - yardPan.x, dy = e.clientY - yardPan.y;
    yardCenter.x = THREE.MathUtils.clamp(yardCenter.x - dx * wpp, -WORLD_R, WORLD_R); yardCenter.z = THREE.MathUtils.clamp(yardCenter.z - dy * wpp / Math.sin(cam.pitch), -WORLD_R, WORLD_R); yardPan = { x: e.clientX, y: e.clientY };
  }
});
const fenceUp = () => { if (yardFence) { fenceDrag = null; yardPan = null; } };
canvas.addEventListener('pointerup', fenceUp); canvas.addEventListener('pointercancel', fenceUp);
document.querySelectorAll('#fencebar button').forEach(b => b.onclick = () => {
  const k = b.dataset.f, o = OBJ[fenceKind];
  if (k === 'done') return fenceExit();
  if (k === 'put') {
    if (fenceSel >= 0) { fenceSel = -1; fenceMark(); return sfx('ui'); }   // えらんでいる ときは えらびを やめる
    updateModeGhost();
    if (!fenceInfo || fenceInfo.why) { ui.toast(o.name, fenceInfo ? fenceInfo.why : 'ここには おけないよ', '', 1800); return sfx('no'); }
    addItem(o.item, -1); state.fences.push(fenceKind === 'fence' ? { x: fenceInfo.x, z: fenceInfo.z, a: fenceInfo.a } : { x: fenceInfo.x, z: fenceInfo.z, a: fenceInfo.a, k: fenceKind }); fenceSync(); return sfx('plant');
  }
  if (k === 'kind') {
    const list = Object.keys(OBJ).filter(x => count(OBJ[x].item) > 0 || x === fenceKind);
    if (list.length < 2) { ui.toast('どうぐ', 'ほかに おける ものを もっていないよ', 'バッグ・よろずやで ふやせるよ', 2200); return sfx('no'); }
    fenceKind = list[(list.indexOf(fenceKind) + 1) % list.length]; fenceSel = -1; fenceMark(); return sfx('ui');
  }
  if (k === 'land') {
    const cx = yardCenter.x, cz = yardCenter.z; let best = null, bd = 2.8;
    state.plots.forEach((p, i) => { const d = Math.hypot(p.x - cx, p.z - cz); if (d < bd) { bd = d; best = { i, p }; } });
    state.cleared.forEach((c) => { const d = Math.hypot(c.x - cx, c.z - cz); if (d < bd) { bd = d; best = { c }; } });
    if (!best) { ui.toast('もどす', 'はたけや かった ばしょに わくを あわせてね', 'ゆびで ドラッグして うごかせるよ', 2200); return sfx('no'); }
    const t = best.c ? clearedTarget(best.c, 'rake') : plotTarget(best.i, 'rake');
    if (!t.can) { ui.toast(t.label, t.sub, '', 2200); return sfx('no'); } t.act(); return;
  }
  if (k === 'rot') {
    const f = fenceSel >= 0 ? state.fences[fenceSel] : null, kd = f ? kindOf(f) : fenceKind;
    if (kd === 'paver') { ui.toast('いしだたみ', 'いしだたみは まわせないよ', '', 1600); return sfx('no'); }
    if (f) { f.a = (fenceAng(f) + Math.PI / 4) % (Math.PI * 2); fenceSync(); } else fenceRot = (fenceRot + Math.PI / 4) % (Math.PI * 2);
    return sfx('ui');
  }
  if (k === 'del') {
    const f = state.fences[fenceSel]; if (fenceSel < 0 || !f) { ui.toast('もどす', 'おいた ものを タップして えらんでね', '', 1800); return sfx('no'); }
    state.fences.splice(fenceSel, 1); addItem(OBJ[kindOf(f)].item, 1); if (f.hay) addItem('hay', f.hay); fenceSel = -1; fenceSync(); fenceMark(); sfx('ui');
  }
});

function cutGrass() {
  const gi = ghostInfo; if (!gi || !gi.ok || gi.mode !== 'plot' || P.stam < 6) return sfx('no');
  P.stam = Math.max(0, P.stam - 6); P.regen = 1; const p = { x: gi.x, z: gi.z };
  state.cleared.push(p); world.hideGrass(p.x - 1.8, p.z - 1.8, p.x + 1.8, p.z + 1.8); addCleared(p);
  const n = 1 + Math.floor(rng() * 2); addItem('hay', n); ui.feed('hay', n); addStat('cut', 1); sfx('plant'); burst('dust', new V3(p.x, heightAt(p.x, p.z) + 0.4, p.z), 12, { size: 0.8, up: 1, life: 1 });
}
async function placeKit(k) {
  const gi = ghostInfo; if (!gi || !gi.ok || gi.mode !== k || count(k) < 1) return sfx('no');
  addItem(k, -1);
  const mvIdx = (arr) => arr.findIndex(b => b.moving);
  if (k === 'kit_well') { let i = mvIdx(state.wells); if (i >= 0) { Object.assign(state.wells[i], { x: gi.x, z: gi.z }); delete state.wells[i].moving; } else { state.wells.push({ x: gi.x, z: gi.z }); i = state.wells.length - 1; } await buildWell(state.wells[i], i); }
  else if (k === 'kit_barn') { let i = mvIdx(state.barns); if (i >= 0) { Object.assign(state.barns[i], { x: gi.x, z: gi.z }); delete state.barns[i].moving; } else { state.barns.push({ x: gi.x, z: gi.z }); i = state.barns.length - 1; } await buildBarn(i); relocate('barn', i); }
  else { let i = mvIdx(state.coops); if (i >= 0) { Object.assign(state.coops[i], { x: gi.x, z: gi.z }); delete state.coops[i].moving; } else { state.coops.push({ x: gi.x, z: gi.z }); i = state.coops.length - 1; } await buildCoop(i); relocate('coop', i); }
  sfx('quest'); burst('spark', new V3(gi.x, heightAt(gi.x, gi.z) + 1, gi.z), 24, { size: 0.6, up: 2.5, speed: 2, life: 1.6 }); addStat(KITS[k].stat, 1); doSave();
}
function placeTarget() {
  if (ghostInfo.mode === 'fence') return { label: 'さくを おく', sub: ghostInfo.ok ? `のこり ${count('fence')}ほん(あるく むきに のびるよ)` : ghostInfo.why, short: 'おく', can: ghostInfo.ok, act: placeFence };
  const gi = ghostInfo; if (gi.mode === 'plot') return { label: '草を かる', sub: gi.ok ? 'ここの 草を かるよ(ほしくさも とれる。あとで くわで たがやすと はたけに なるよ)' : gi.why, short: 'かる', can: gi.ok && P.stam >= 6, act: cutGrass };
  const K = KITS[gi.mode]; return { label: K.label, sub: gi.ok ? K.sub : gi.why, short: 'たてる', can: gi.ok, act: () => placeKit(gi.mode) };
}
function relocate(kind, k) {   // たて直した ばしょへ どうぶつを うつす
  if (kind === 'barn') for (const a of cows) if (a.b === k) { const [x, z] = penPoint(k); a.x = a.tx = x; a.z = a.tz = z; a.c.outer.visible = true; }
  if (kind === 'coop') for (const a of hens) if (a.ck === k && !a.room) { const [x, z] = henPoint(a); a.x = a.tx = x; a.z = a.tz = z; a.c.outer.visible = true; }
}
function startMove(kind, i) {   // いちど かたづけて キットに もどす(どうぶつ・たまごは そのまま)
  const arr = kind === 'well' ? state.wells : kind === 'barn' ? state.barns : state.coops, b = arr[i]; if (!b || b.moving) return;
  unbuild(kind, i); b.moving = true;
  if (kind === 'barn') { barnBuilt.delete(i); PENS[i] = null; } if (kind === 'coop') { coopBuilt.delete(i); COOP_SPOTS[i] = null; }
  addItem('kit_' + kind, 1); sfx('ui'); ui.toast('ひっこし', 'かたづけたよ', 'キットで すきな ばしょに たて直そう', 3000);
}
const moveTarget = (kind, i) => ({ label: 'ひっこしする', sub: 'いちど かたづけて、すきな ばしょに たてなおせるよ(キットが もどる)', short: 'ひっこし', can: true, act: () => startMove(kind, i) });
function waterTarget() {
  if (state.water >= waterCap()) return { label: 'バケツは いっぱい', sub: `みず ${state.water}/${waterCap()}`, short: 'いっぱい', can: false };
  return { label: 'みずを くむ', sub: `バケツ ${state.water}/${waterCap()}`, short: 'くむ', can: true, act: () => { state.water = waterCap(); sfx('water'); burst('drop', P.pos.clone().setY(P.pos.y + 0.6), 8, { size: 0.28, up: 1, life: 0.8 }); ui.toast('みずを くんだ', `バケツ ${waterCap()}/${waterCap()}`, 'はたけに みずを やろう', 2200); } };
}

// ---------- 通知・クエスト ----------
const rewardText = (r) => [r.coins ? `${r.coins}コイン` : '', ...Object.entries(r.items || {}).map(([k, v]) => `${ITEMS[k].name}×${v}`)].filter(Boolean).join(' / ');
bus.on('questDone', (q) => { sfx('quest'); ui.toast('QUEST CLEAR', q.title, 'ほうしゅう: ' + rewardText(q.reward), 4400); ui.setGoal(); ui.setCoins(); });
bus.on('questNew', (q) => { setTimeout(() => { ui.toast('NEW QUEST', q.title, '', 4200); ui.setGoal(); }, 2600); });
bus.on('coins', () => ui.setCoins());
bus.on('saveNow', () => { if (doSave()) ui.toast('セーブ', 'セーブしました!', '', 2200); else ui.toast('セーブ', 'セーブできませんでした', 'ブラウザの ほぞんスペースを かくにんしてね', 4000); });
bus.on('toTitle', () => { doSave(); location.reload(); });
bus.on('eat', (heal, id) => { P.stam = Math.min(100, P.stam + heal); if (P.stam >= 28) P.lock = false; P.regen = 0; sfx('feed'); ui.toast('ごちそうさま', `${ITEMS[id].name}を たべたよ`, `たいりょく +${heal}`, 2400); burst('heart', P.pos.clone().setY(P.pos.y + 1.1), 5, { size: 0.35, life: 1.2 }); });
bus.on('decor', () => applyDecor());
bus.on('dexNew', (id) => { if (!started) return; setTimeout(() => ui.toast('ずかん', `${ITEMS[id].name} が ずかんに のったよ`, 'メニューの ずかんで みられるよ', 3200), 1500); });
const applyLook = () => { const L = state.look; world.look.sun = L.sun; world.look.hemi = L.hemi; world.look.fog = L.fog; renderer.toneMappingExposure = L.exp; };
bus.on('look', applyLook);

// ---------- 時間 ----------
function updateTime(dt) {
  state.hour += dt * 24 / DAY_SECONDS; if (state.hour >= 24) { state.hour -= 24; state.day++; newDay(); }
  world.setTime(state.hour, P.pos);
}

// ---------- 起動・ロード ----------
let titleMode = true, titleT = 0;
async function boot() {
  try {
    chinGLTF = await loader.loadAsync('./assets/chin_storybook_lite.glb', (e) => { if (e.total) $('.lbar i').style.width = Math.max(10, e.loaded / e.total * 100) + '%'; });
  } catch (err) { $('#loading span').textContent = 'よみこみに しっぱいしました(' + err.message + ')'; throw err; }
  animGLTF = await loader.loadAsync('./assets/hero_chinchilla_lite.glb');   // 牧場のチンチラは二足(たすき付き)、主人公は四足
  for (const g of [chinGLTF, animGLTF]) g.scene.traverse(o => { if (o.isMesh && !o.geometry.attributes.normal) o.geometry.computeVertexNormals(); });
  P.chin = makeChin(0.95); scene.add(P.chin.outer);
  // どれか1つの よみこみが こけても、ゲームは はじめられるように(スマホの キャッシュ食いちがい対策)
  const step = async (name, fn) => { try { return await fn(); } catch (e) { console.warn('boot step failed', name, e); try { window.__bootFail = (window.__bootFail || []).concat(name + ': ' + (e && e.message)); } catch {} } };
  await step('npc', makeNPCs); await step('pasture', async () => { syncPasture(); refreshVillagers(); });
  await step('models', () => world.attachModels(loader)); await step('farm', loadFarmModels); await step('ranch', loadRanchModels); await step('mushroom', loadMushroom); await step('props', loadProps); await step('swimfish', () => initSwimFish(villageRoot, loader)); await step('nori', async () => makeNori());
  ROOMS.house = await step('house', buildHouseRoom);
  $('#loading').classList.add('done');
  $('#btnNew').disabled = false; if (hasSave()) $('#btnContinue').hidden = false;
  if (params.has('resume') && hasSave()) setTimeout(() => startGame(false), 60);   // もりから もどってきたとき
  ui.nameables = () => [
    { key: 'player', group: 'あなた', base: 'Chino' },
    ...state.animals.map((_, i) => ({ key: 'pet:' + i, group: 'ペットの ちんちら', base: ANIMAL_DEF[i % ANIMAL_DEF.length].name })),
    ...state.cows.map((_, i) => ({ key: 'cow:' + i, group: 'うし', base: COW_DEF[i % COW_DEF.length].name })),
    ...VILLAGERS.map(v => ({ key: 'vil:' + v.id, group: 'あそびに くる どうぶつ', base: v.name })),
    ...NPC_DEF.map(d => ({ key: 'npc:' + d.id, group: 'むらの ひと', base: d.name })),
  ].map(x => ({ ...x, cur: nm(x.key, x.base) }));
  ui.onRenamed = () => { applyPlayerName(); for (const a of animals) a.name = nm('pet:' + a.i, a.base); for (const c of cows) c.name = nm('cow:' + c.i, c.base); };
  startSeasonFx(() => ({ day: state.day, hour: state.hour, indoors: !!P.room }));
  window.__g = { yardRebuild, state, ui, world, pastureDay, villagers, talkVillager, BUILT, startMove, feederFor, fenceEnter, fenceExit, placeFence, fenceTarget, clearedTarget, housePoint, placeCheck, ghost: () => ghostInfo, cutGrass, placeKit, waterTarget, plotTarget, rebuildPlaced, bus, budget: () => budgetReport(renderer, scene), disposeObject, villageRoot, BUDGET, P, cam, state, world, scene, camera, setHour: (h) => { state.hour = h; }, tp: (x, z) => { P.pos.set(x, heightAt(x, z), z); }, start: (n) => startGame(n), renderer, animals, cows, hens, ROOMS, goRoom, sleep, startFishing, fishTarget, noriTarget, state2: () => fish, spawnEggs, cowTarget, henTarget, plotTarget, handleTap, collect, camera, plots, nodes, npcs };
  if (params.has('shot')) { startGame(true); const g = (k, d) => params.has(k) ? parseFloat(params.get(k)) : d; P.pos.set(g('x', 0), 0, g('z', 6)); P.pos.y = heightAt(P.pos.x, P.pos.z); P.face = g('face', Math.PI); cam.yaw = g('yaw', 0); cam.pitch = g('pitch', 0.36); cam.dist = g('dist', 6.4); state.hour = g('hour', 10); if (params.has('hud') === false) $('#hud').hidden = true; }
  if (params.get('demo') === 'farm') {   // 撮影用: 畑にいろいろな成長段階を並べる
    const d = [{ tilled: true, crop: 'seed_carrot', days: 0, watered: false }, { tilled: true, crop: 'seed_cabbage', days: 1, watered: true }, { tilled: true, crop: 'seed_carrot', days: 4 }, { tilled: true, crop: 'seed_pumpkin', days: 5 }, { tilled: true, crop: 'seed_tomato', days: 5 }, { tilled: true, crop: 'seed_corn', days: 3, watered: true }];
    d.forEach((o, i) => Object.assign(state.plots[i], { tilled: false, crop: null, days: 0, watered: false }, o));
  }
  if (params.has('notrees')) scene.traverse(o => { if (o.userData && o.userData.tree) o.visible = false; });   // 撮影用: 木を隠す
  if (params.has('budget')) {   // 容量チェック表示(?budget)。予算オーバーは赤
    const el = document.createElement('div'); el.style.cssText = 'position:fixed;left:6px;bottom:6px;z-index:99;font:11px monospace;color:#fff;background:#000a;padding:4px 6px;border-radius:6px;pointer-events:none;white-space:pre';
    document.body.appendChild(el);
    setInterval(() => {
      const r = budgetReport(renderer, scene); el.style.color = r.over.length ? '#ff8a80' : '#b9f6ca';
      el.textContent = 'tex ' + r.texMB + '/' + BUDGET.texMB + 'MB  tri ' + (r.tris / 1e6).toFixed(2) + '/' + (BUDGET.tris / 1e6) + 'M\ncalls ' + r.drawCalls + '/' + BUDGET.drawCalls + '  geo ' + r.geos + '  heap ' + (r.heapMB ?? '-') + 'MB' + (r.over.length ? '\nOVER: ' + r.over.join(',') : '');
    }, 1000);
  }
  frame(); updateCamera(0, true);
  document.title = 'ready';
}
function applyOffline() {
  if (!state.savedAt) return; const el = Math.min(Math.max((Date.now() - state.savedAt) / 1000, 0), 600);
  state.animals.forEach(a => a.hunger = Math.min(1, a.hunger + el / 200)); state.hour = (state.hour + el * 24 / DAY_SECONDS) % 24;
}
function startGame(isNew) {
  unlockAudio(); if (isNew) { reset(); } else { load(); applyOffline(); }
  titleMode = false; started = true; $('#title').classList.add('gone'); if (document.documentElement.classList.contains('resuming')) { document.documentElement.classList.remove('resuming'); $('#fade').style.transition = ''; $('#fade').classList.remove('on'); } $('#hud').hidden = false;
  if (state.pos) P.pos.set(state.pos.x, heightAt(state.pos.x, state.pos.z), state.pos.z); else P.pos.set(0, heightAt(0, 6), 6);
  rebuildPlaced().catch(e => console.warn('rebuild failed', e)); placeNodes(); state.plots.forEach((s, i) => plots[i] && refreshPlot(i)); ensureSeed(); applyDecor(); applyLook(); yardRebuild();
  ui.setCoins(); ui.setClock(); ui.setGoal(); checkQuests(); updateCamera(0, true); applyPlayerName();
  const q = activeQuests()[0];
  if (isNew && params.has('trial')) { Object.assign(state.inv, { seed_cabbage: 3, seed_carrot: 3, hay: 5, milk_can: 1, chicken_feed: 6 }); state.coins = 500; state.selSeed = 'seed_cabbage'; ui.setCoins(); }   // お試しモード(?trial)
  if (isNew) { setTimeout(() => { if (q) ui.toast('NEW QUEST', q.title, 'クエストの ひょうじは 右上の ボタンから', 4800); sfx('quest'); }, 900); setTimeout(() => ui.toast('HINT', isTouch ? '画面を さわって いどう(スティック) / ボタンで アクション' : 'WASD: いどう / Shift: ダッシュ / E: アクション / ドラッグ: カメラ', '', 6000), 5800); }
  else setTimeout(() => ui.toast('WELCOME BACK', `${state.day}日目`, `おかえり、${playerName()}`, 3000), 600);
  setInterval(doSave, 10000); playBgm('village');
  // 初回のカクつき対策: パーティクルのテクスチャ/シェーダーを先にGPUへ送っておく(目に見えない大きさで1フレーム描く)
  { const ws = Object.values(ptex).map(map => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map, transparent: true, depthWrite: false, fog: true, opacity: 0.01 })); s.scale.setScalar(0.01); s.position.copy(camera.position).add(new V3(0, 0, -1).applyQuaternion(camera.quaternion)); scene.add(s); return s; });
    setTimeout(() => ws.forEach(s => { scene.remove(s); s.material.dispose(); }), 600); }
}
let bakDay = -1;
function dailyBackup() { try { if (bakDay === state.day) return; const cur = localStorage.getItem('chinchilla-ranch-v2'); const last = +localStorage.getItem('chinchilla-ranch-v2-bakday') || 0; if (cur && last !== state.day) { localStorage.setItem('chinchilla-ranch-v2-bak', cur); localStorage.setItem('chinchilla-ranch-v2-bakday', String(state.day)); } bakDay = state.day; } catch {} }
function doSave() { if (!started) return false; dailyBackup(); state.pos = { x: P.pos.x, z: P.pos.z }; const ok = save(); if (ok) ui.showSaved(); return ok; }
addEventListener('pagehide', doSave); document.addEventListener('visibilitychange', () => { if (document.hidden) doSave(); });
bus.on('saveFail', () => ui.toast('セーブできないよ!', 'ブラウザの ほぞんスペースが つかえないみたい', '「せってい」の「かきだす」で バックアップしてね', 9000));
try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch {}   // ブラウザに じどうで けされにくく してもらう
// ---- プレイヤーの なまえ(はじめるとき きめる。あとから「なまえ」の がめんで かえられる) ----
const playerName = () => nm('player', 'Chino');
const applyPlayerName = () => { const el = document.querySelector('#bars .nm'); if (el) el.textContent = playerName(); };
function askPlayerName() {
  return new Promise(res => {
    const m = document.createElement('div'); m.id = 'namemodal';
    m.innerHTML = '<div class="box"><h3>あなたの なまえは?</h3><p>ぼくじょうで よばれる なまえを きめてね(8もじまで)</p><input id="pnIn" type="text" maxlength="8" value="Chino" autocomplete="off"><button id="pnOk" class="pill">これで きまり</button></div>';
    document.body.appendChild(m); const inp = m.querySelector('#pnIn'); setTimeout(() => { try { inp.focus(); inp.select(); } catch {} }, 100);
    const ok = () => { const v = inp.value.trim().slice(0, 8) || 'Chino'; m.remove(); res(v); };
    m.querySelector('#pnOk').onclick = ok; inp.addEventListener('keydown', e => { if (e.key === 'Enter') ok(); });
  });
}
// ---- はじめの なかま(御三家)を えらぶ ----
function askStarter() {
  return new Promise(res => {
    const m = document.createElement('div'); m.id = 'namemodal'; m.className = 'starter';
    m.innerHTML = '<div class="box"><h3>はじめの なかまを えらぼう</h3><p>いっしょに ぼうけんする パートナーだよ。しんかすると すがたが かわるよ</p><div class="starters">' +
      STARTERS.map(s => `<button class="stcard" data-id="${s.id}"><img src="quest/assets/monsters/${s.id}.webp" alt=""><b>${s.name}</b><i>${s.el}</i><small>${s.text}</small></button>`).join('') + '</div></div>';
    document.body.appendChild(m);
    m.querySelectorAll('.stcard').forEach(b => b.onclick = () => { const s = STARTERS.find(x => x.id === b.dataset.id); if (!confirm(`${s.name} に する?`)) return; sfx('quest'); m.remove(); res(s.id); });
  });
}
$('#btnNew').onclick = async () => { if (hasSave() && !confirm('いまのセーブデータは きえます。はじめから あそびますか?')) return; const n = await askPlayerName(), sid = await askStarter(); startGame(true); state.names = state.names || {}; state.names.player = n; state.party = [{ id: sid, lv: 5, exp: 0, hp: null }]; state.mdex[sid] = 2; applyPlayerName(); doSave(); };
$('#btnContinue').onclick = () => startGame(false);

// ---------- メインループ ----------
const clock = new THREE.Clock(); let T = 0, mmT = 0, lastFrame = 0;
function frame() {
  requestAnimationFrame(frame);
  if (ECO) { const now = performance.now(); if (now - lastFrame < 30) return; lastFrame = now; }   // 省エネ: 30fps
  const dt = Math.min(clock.getDelta(), 0.05); T += dt; pollInput();
  world.update(dt, T);
  if (titleMode) {
    titleT += dt * 0.07; state.hour = 8.6 + Math.sin(titleT * 0.4) * 0.3; world.setTime(state.hour, new V3(0, 0, 0));
    const a = titleT + 0.4, r = 26; camera.position.set(Math.sin(a) * r + 6, 5.5 + Math.sin(titleT * 2) * 0.6, Math.cos(a) * r - 4); camera.lookAt(0, 2.2, -6);
    if (P.chin) { P.chin.outer.position.set(0, heightAt(0, 6), 6); P.chin.outer.visible = false; }
    updateAnimals(dt, T); updateCows(dt, T); updateHens(dt, T); updateNPCs(dt); updatePasture(dt, T); updateVillagers(dt, T); renderer.render(scene, camera); return;
  }
  P.chin.outer.visible = true;
  if (input.menu) { input.menu = false; if (!sleeping) ui.togglePanel('menu'); }
  if (input.bag) { input.bag = false; ui.togglePanel('bag'); } if (input.quest) { input.quest = false; ui.togglePanel('quest'); }
  GATE.mesh.userData.portal.material.opacity = 0.4 + Math.sin(T * 2.2) * 0.12;
  updateTime(dt); updatePlayer(dt, T); updateGhost(); updateCamera(dt); updateNodes(dt, T); updatePlots(dt); updateAnimals(dt, T); updateCows(dt, T); updateHens(dt, T); updateHouse(T); updateFishing(dt, T); updateSwimFish(dt, T, P.pos); updateNori(); updateNPCs(dt); updatePasture(dt, T); updateVillagers(dt, T); updateLamps(T); updateParts(dt);
  if (furniMode || yardMode) { input.tap = null; input.action = false; ui.setPrompt(null); }
  else if (!ui.panelOpen() && !sleeping) {
    curTarget = fish ? fishTarget() : findTarget(); ui.setPrompt(curTarget);
    if (input.action) { input.action = false; if (curTarget) { if (curTarget.can && curTarget.act) curTarget.act(); else sfx('no'); } }
    if (input.tap) { const tp = input.tap; input.tap = null; if (fish && curTarget && curTarget.act) curTarget.act(); else handleTap(tp); }
  } else { input.action = false; input.tap = null; ui.setPrompt(null); }
  ui.setClock();
  mmT -= dt; if (mmT <= 0) { mmT = 0.04; const q = activeQuests()[0]; ui.drawMinimap(P.pos.x, P.pos.z, P.face, q && q.target); }
  renderer.render(scene, camera);
}
boot();

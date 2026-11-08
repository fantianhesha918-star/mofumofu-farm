// ジム(パズルの へや)。1ページ=1ジム(?f=lake など)。マス目で 1マスずつ うごき、ゴールの さきに ぬしが いる。
// ルールは gymlogic.js(ソルバーと きょうゆう)、マップは gymmaps.js(tools/gym_gen.mjs が つくる)、みためは tools/make_gym_kit.py の Blender パーツ。
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { input, pollInput, setupInput } from './input.js';
import { ui } from './ui.js';
import { ECO, state, load, save, bus, addItem, count } from './state.js';
import { ITEMS } from './data.js';
import { GYM_QUIZ } from './gymquiz.js';
import { sfx, unlockAudio } from './audio.js';
import { setFieldBgm } from './bgm.js';
import { healParty, giveStarter, questData } from './battle.js';
import { FIELDS } from './fielddata.js';
import { parseLevel, newState, step, doorOpen, DIRS } from './gymlogic.js';
import { GYM_MAPS } from './gymmaps.js';
import { GYM_THEMES } from './gymthemes.js';

const $ = (s) => document.querySelector(s);
const V3 = THREE.Vector3;
const params = new URLSearchParams(location.search);
const isTouch = matchMedia('(pointer:coarse)').matches || params.has('touch');
document.body.classList.toggle('touch', isTouch);
const lam = (k, dt) => 1 - Math.exp(-k * dt);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const FID = FIELDS[params.get('f')] && GYM_MAPS[params.get('f')] ? params.get('f') : 'forest';
const SH = FIELDS[params.get('f')] && params.get('shrine') ? params.get('shrine') : null;   // ほこらの なか(でんせつの モンスターの いる どうくつ)
const TKEY = SH ? 'shrine' : FID;   // かべ・かざり・いろの なまえ
const SHRINE_MAP = { rows: ['####@####', '#.......#', '#.......#', '####S####'], hints: ['おくに でんせつの モンスターが いる。しかけは ないよ'], steps: 0, seed: 0 };
const F = FIELDS[FID], BOSS = SH ? { key: 'shrine:' + SH, id: SH, sprite: SH, name: 'でんせつの モンスター' } : F.boss, TH = GYM_THEMES[TKEY] || GYM_THEMES.forest, MAP = SH ? SHRINE_MAP : GYM_MAPS[FID];
const ELITE = !SH && ['castle', 'temple', 'dragon', 'end'].includes(FID);
const ROLE = SH ? 'でんせつの モンスター' : ELITE ? 'してんのう' : 'ぬし';
const CELL = 2, FLOOR_T = 0.34, WALL_H = 0.6;   // かべは ひくめに(うえから みても プレイヤーが かくれない)
document.title = `${TH.name} - もふもふ牧場`;

// ---- 3D しょきか ----
const canvas = $('#c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'default' });
renderer.setPixelRatio(Math.min(devicePixelRatio, ECO ? 1 : isTouch ? 1.5 : 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = TH.exposure || 1.0;
const scene = new THREE.Scene(); scene.background = new THREE.Color(TH.sky); scene.fog = new THREE.Fog(TH.sky, TH.fogN || 26, TH.fogF || 70);
const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 300);
function resize() { const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.fov = w / h < 1 ? 62 : 46; camera.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();
scene.add(new THREE.HemisphereLight(TH.hemi[0], TH.hemi[1], TH.hemi[2]));
const sun = new THREE.DirectionalLight(TH.sun[0], TH.sun[1]); sun.position.set(-14, 26, 18); scene.add(sun);
const fill = new THREE.DirectionalLight(TH.fill || 0x8899ff, 0.5); fill.position.set(14, 10, -16); scene.add(fill);
setupInput(canvas, ui);
$('#hud').hidden = false; $('#mm').hidden = true; $('#goal').hidden = true; $('#btnQuest').hidden = true; $('#btnDash').hidden = true;

// ---- パーツの よみこみ ----
const loader = new GLTFLoader();
const KIT = {};
async function loadKit() {
  const names = ['gym_floor', 'gym_wall', 'gym_wall_low', 'gym_ice', 'gym_rock', 'gym_hole', 'gym_lava', 'gym_plate', 'gym_door_frame', 'gym_door_bars', 'gym_quiz_frame', 'gym_quiz_leaf', 'gym_lock', 'gym_key', 'gym_arrow', 'gym_warp', 'gym_crumble', 'gym_sign', 'gym_goal', 'gym_checkpoint', 'gym_wall_' + TKEY, 'gym_deco_' + TKEY, ...(TH.extra || [])];
  await Promise.all(names.map(async n => {
    try { const gl = await loader.loadAsync(`./assets/gym/${n}_lite.glb`); let m = null; gl.scene.traverse(o => { if (!m && o.isMesh) m = o; }); if (m) { if (!m.geometry.attributes.normal) m.geometry.computeVertexNormals(); KIT[n] = m.geometry; } } catch (e) { console.warn('gym part failed', n, e); }
  }));
}
const mats = {};
const matFor = (kind) => {
  if (mats[kind]) return mats[kind];
  const o = { vertexColors: true };
  if (kind === 'ice') return mats[kind] = new THREE.MeshPhongMaterial({ ...o, shininess: 90, specular: new THREE.Color(0xbfe8ff) });
  if (kind === 'lava') return mats[kind] = new THREE.MeshBasicMaterial({ ...o });
  if (kind === 'glow') return mats[kind] = new THREE.MeshLambertMaterial({ ...o, emissive: new THREE.Color(0x222222) });
  return mats[kind] = new THREE.MeshStandardMaterial({ ...o, roughness: 0.82, metalness: 0.02 });
};
const tint = (hex, mul = 1) => new THREE.Color(hex).multiplyScalar(mul);
const THEMED = () => !!KIT['gym_wall_' + TKEY], WALLM = () => THEMED() ? 'gym_wall_' + TKEY : 'gym_wall';   // ジムごとの せんようの かべ(フルカラー)があれば つかう
const wallTint = (mul) => THEMED() ? tint('#ffffff', Math.min(1, mul * 1.08)) : tint(TH.wall, mul);

// ---- レベル ----
const LV = parseLevel(MAP.rows);
const W = LV.w, H = LV.h;
const cx = (x) => (x - W / 2 + 0.5) * CELL, cz = (y) => (y - H / 2 + 0.5) * CELL;   // マス → せかい ざひょう
const quizDone = () => !!(state.gyms && state.gyms[FID] && state.gyms[FID].quiz);
function freshState() { const st = newState(LV); if (quizDone()) st.cells = st.cells.map(c => c === 'Q' ? '.' : c); return st; }   // もう こたえた とびらは ひらいたまま
let S = newState(LV);
const level = new THREE.Group(); scene.add(level);
let dyn = null;   // うごく もの(いわ・かぎ・とびら・スイッチ・くずれる ゆか・ワープ) の メッシュ

function addMesh(parent, name, kind, x, y, z, color, rotY = 0) {
  const g = KIT[name]; if (!g) return null; const mat = matFor(kind).clone(); if (color) mat.color = new THREE.Color(color);
  const m = new THREE.Mesh(g, mat); m.position.set(x, y, z); m.rotation.y = rotY; parent.add(m); return m;
}
function instOf(name, kind, list, colorFn) {   // list: [{x,y,z,ry,color}]
  const g = KIT[name]; if (!g || !list.length) return; const mat = matFor(kind), im = new THREE.InstancedMesh(g, mat, list.length), mt = new THREE.Matrix4(), q = new THREE.Quaternion(), c = new THREE.Color();
  list.forEach((it, i) => { q.setFromEuler(new THREE.Euler(0, it.ry || 0, 0)); mt.compose(new V3(it.x, it.y, it.z), q, new V3(it.sx || 1, it.sy || 1, it.sz || 1)); im.setMatrixAt(i, mt); c.copy(it.color || new THREE.Color(1, 1, 1)); im.setColorAt(i, c); });
  im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; level.add(im); return im;
}
const PLATE_COL = { a: '#ff8a6a', b: '#6ac8ff', c: '#b6f26a' };
const ARROW_RY = { '^': 0, '>': -Math.PI / 2, 'v': Math.PI, '<': Math.PI / 2 };

let lavaMesh = null, iceMesh = null;
function buildTiles(cells) {   // ゆか・かべ・こおり・あな・ようがん・ベルト(うごかない ぶぶん)を インスタンスで つくる。cells は いまの じょうたい
  for (let k = level.children.length - 1; k >= 0; k--) if (level.children[k].isInstancedMesh) level.remove(level.children[k]);
  const floors = [], walls = [], ices = [], holes = [], lavas = [], arrows = [], base = -FLOOR_T;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x, c = cells[i], X = cx(x), Z = cz(y);
    if (c === '#') walls.push({ x: X, y: base, z: Z, sy: WALL_H, color: wallTint(0.85 + 0.15 * (((x * 7 + y * 13) % 5) / 4)) });
    else if (c === 'i') ices.push({ x: X, y: base, z: Z, color: tint(TH.ice || '#ffffff') });
    else if (c === 'o') holes.push({ x: X, y: base, z: Z, color: tint(TH.floor, 0.9) });
    else if (c === 'l') lavas.push({ x: X, y: base, z: Z, color: tint('#ffffff') });
    else if (c in ARROW_RY) arrows.push({ x: X, y: base, z: Z, ry: ARROW_RY[c], color: tint(TH.arrow || '#ffffff') });
    else if (!/[abcx1-9@ ]/.test(c)) floors.push({ x: X, y: base, z: Z, color: tint(TH.floor, 0.92 + 0.08 * (((x * 5 + y * 11) % 4) / 3)) });
  }
  instOf('gym_floor', 'std', floors); instOf(WALLM(), 'std', walls); iceMesh = instOf('gym_ice', 'ice', ices); instOf('gym_hole', 'std', holes); lavaMesh = instOf('gym_lava', 'lava', lavas); instOf('gym_arrow', 'std', arrows);
}
function buildLevel() {
  for (let k = level.children.length - 1; k >= 0; k--) { const o = level.children[k]; level.remove(o); if (o.material && o.material.dispose && !o.isInstancedMesh) o.material.dispose(); }
  dyn = { rocks: new Map(), keys: new Map(), doors: new Map(), plates: new Map(), crumbles: new Map(), locks: new Map(), cps: new Map(), warps: [], goal: null };
  const base = -FLOOR_T; buildTiles(S.cells);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x, c = LV.cells[i], X = cx(x), Z = cz(y);
    if (c === 'a' || c === 'b' || c === 'c') dyn.plates.set(i, addMesh(level, 'gym_plate', 'glow', X, base, Z, PLATE_COL[c]));
    else if (c === 'A' || c === 'B' || c === 'C') { addMesh(level, 'gym_door_frame', 'std', X, base, Z, TH.wall); const bars = addMesh(level, 'gym_door_bars', 'glow', X, base, Z, PLATE_COL[c.toLowerCase()]); dyn.doors.set(i, { bars, open: 0, baseY: base }); }
    else if (c === 'Q' && S.cells[i] === 'Q') { addMesh(level, 'gym_quiz_frame', 'std', X, base, Z, '#ffffff'); const bars = addMesh(level, 'gym_quiz_leaf', 'std', X - 0.75, base, Z, '#ffffff'); dyn.doors.set(i, { bars, open: 0, baseY: base, quiz: true }); }
    else if (c === 'L') dyn.locks.set(i, addMesh(level, 'gym_lock', 'std', X, base, Z, '#ffffff'));
    else if (c === 'k') dyn.keys.set(i, addMesh(level, 'gym_key', 'glow', X, 0.3, Z, '#ffffff'));
    else if (c === 'x') dyn.crumbles.set(i, addMesh(level, 'gym_crumble', 'std', X, base, Z, '#ffffff'));
    else if (/[1-9]/.test(c)) dyn.warps.push(addMesh(level, 'gym_warp', 'glow', X, base, Z, new THREE.Color().setHSL((+c * 0.17) % 1, 0.85, 0.7)));
    else if (c === 's') addMesh(level, 'gym_sign', 'std', X, 0, Z, '#ffffff');
    else if (c === '=') dyn.cps.set(i, addMesh(level, 'gym_checkpoint', 'glow', X, base, Z, TH.accent || '#ffe9a0'));
    else if (c === '@') dyn.goal = addMesh(level, 'gym_goal', 'glow', X, base, Z, TH.accent || '#ffe9a0');
  }
  for (const i of S.rocks) { const x = i % W, y = (i / W) | 0; dyn.rocks.set(i, addMesh(level, 'gym_rock', 'std', cx(x), 0, cz(y), TH.rock || '#ffffff', ((x * 3 + y) % 4) * 1.57)); }
}

// ---- アリーナ(ゴールの さき: ボスの へや)と まわりの ふんいき ----
const arena = new THREE.Group(); scene.add(arena);
let bossObj = null;
const AR_W = Math.max(7, Math.min(W - 2, 9)), AR_D = 5;
function buildArena() {
  const gx = LV.goal[0], base = -FLOOR_T, fl = [], wl = [];
  for (let k = 1; k <= AR_D; k++) for (let j = -((AR_W - 1) / 2); j <= (AR_W - 1) / 2; j++) fl.push({ x: cx(gx) + j * CELL, y: base, z: cz(0) - k * CELL, color: tint(TH.arenaFloor || TH.floor, 1.05) });
  for (let k = 0; k <= AR_D + 1; k++) for (const s of [-1, 1]) wl.push({ x: cx(gx) + s * ((AR_W + 1) / 2) * CELL, y: base, z: cz(0) - k * CELL, sy: WALL_H, color: wallTint(0.8) });
  for (let j = -((AR_W + 1) / 2); j <= (AR_W + 1) / 2; j++) wl.push({ x: cx(gx) + j * CELL, y: base, z: cz(0) - (AR_D + 1) * CELL, sy: WALL_H, color: wallTint(0.8) });
  const g = new THREE.Group(); instOfTo(g, 'gym_floor', 'std', fl); instOfTo(g, WALLM(), 'std', wl); arena.add(g);
}
function instOfTo(parent, name, kind, list) { const save = level.children.length; instOf(name, kind, list); const im = level.children.pop(); if (im) parent.add(im); }
async function buildBoss() {
  const bx = cx(LV.goal[0]), bz = cz(0) - AR_D * CELL;   // ボスは さいおくの マス(プレイヤーは 2マス まえで とまる)
  const tex = new THREE.TextureLoader().load(`quest/assets/monsters/${BOSS.sprite || BOSS.id}.webp`); tex.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, fog: true })); sp.scale.set(6.2, 6.2, 1); sp.center.set(0.5, 0.04); sp.position.set(bx, 0, bz); arena.add(sp); bossObj = sp;
  if (BOSS.model) {
    try { const gl = await loader.loadAsync(`./assets/${BOSS.model}_lite.glb`); const root = gl.scene; root.traverse(o => { if (o.isMesh && !o.geometry.attributes.normal) o.geometry.computeVertexNormals(); });
      const box = new THREE.Box3().setFromObject(root), sz = box.getSize(new V3()), c = box.getCenter(new V3()), s = (BOSS.h || 5.5) / sz.y; root.scale.setScalar(s); root.position.set(-c.x * s, -box.min.y * s, -c.z * s);
      const outer = new THREE.Group(); outer.add(root); outer.position.set(bx, 0, bz); arena.add(outer); sp.visible = false; bossObj = outer; } catch (e) { console.warn('boss model failed', e); }
  }
  // ぬしの だい(たいせつな ばしょの ひかる わっか)
  const ring = new THREE.Mesh(new THREE.RingGeometry(2.6, 3.0, 40), new THREE.MeshBasicMaterial({ color: TH.accent || '#ffe9a0', transparent: true, opacity: 0.5, depthWrite: false, side: THREE.DoubleSide })); ring.rotation.x = -Math.PI / 2; ring.position.set(bx, 0.05, bz); arena.add(ring); arena.userData.ring = ring;
  arena.userData.bx = bx; arena.userData.bz = bz;
}
function buildDecor() {   // へやの まわり・ボスの へやの かどに ジムの せんようの かざりを ならべる
  const g = KIT['gym_deco_' + TKEY]; if (!g) return; const deco = new THREE.Group(); scene.add(deco);
  const spots = [], hw = W * CELL / 2, hh = H * CELL / 2, gx = cx(LV.goal[0]);
  for (let z = -hh + 2; z <= hh + 2; z += 7.5) { spots.push([-hw - 4.2, z], [hw + 4.2, z + 2.6]); }
  for (let k = 0; k <= AR_D + 1; k += 2) { const z = cz(0) - k * CELL - 2; spots.push([gx - ((AR_W + 1) / 2) * CELL - 4.2, z], [gx + ((AR_W + 1) / 2) * CELL + 4.2, z + 1.6]); }
  spots.push([gx - 5, cz(0) - (AR_D + 1) * CELL - 5], [gx + 5, cz(0) - (AR_D + 1) * CELL - 5], [gx, cz(0) - (AR_D + 1) * CELL - 7]);
  spots.forEach(([x, z], i) => { const m = new THREE.Mesh(g, matFor('std').clone()); const sc = 1.0 + ((i * 7) % 5) * 0.1; m.scale.setScalar(sc); m.position.set(x, -FLOOR_T - 0.05, z); m.rotation.y = i * 1.7; deco.add(m); });
}
// ---- へやの そとの けしき(とおくの おか・やま・くも・わくせい。きりで かすむ) ----
const SCENERY = {
  forest: { t: 'hills', c: ['#7fcf6a', '#6cc35c', '#93dc78'] }, lake: { t: 'spires', c: ['#d8f2ff', '#c4e8fa', '#e8f8ff'] }, volcano: { t: 'cones', c: ['#c98a72', '#b87a62', '#d89a80'] },
  ghost: { t: 'hills', c: ['#8a80c8', '#7a70b8', '#9a90d8'] }, sky: { t: 'clouds', c: ['#ffffff', '#f0f8ff', '#e4f0ff'] }, sun: { t: 'hills', c: ['#f7cc78', '#ffd88a', '#eebb66'] },
  cosmos: { t: 'planets', c: ['#ffb4d8', '#b4d8ff', '#ffe58a'] }, grove: { t: 'hills', c: ['#6bb898', '#7cc4a4', '#8fd0b2'] }, castle: { t: 'spires', c: ['#8468ac', '#9078b8', '#a088c8'] },
  temple: { t: 'planets', c: ['#fff2a8', '#aab4e0', '#ffdc6a'] }, dragon: { t: 'hills', c: ['#4eb4a2', '#5cc2b0', '#6ed0be'] }, end: { t: 'crystals', c: ['#e8c8ff', '#ffd0ec', '#c0d4ff'] },
  shrine: { t: 'crystals', c: ['#c0d4ff', '#ffc0e0', '#e8c8ff'] },
};
function buildScenery() {
  const S = SCENERY[TKEY]; if (!S) return; const grp = new THREE.Group(); scene.add(grp);
  let seed = 7; for (const ch of TKEY) seed = (seed * 31 + ch.charCodeAt(0)) % 9973; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const mat = (c, emissive) => { const m = new THREE.MeshLambertMaterial({ color: c }); if (emissive) { m.emissive = new THREE.Color(emissive); m.emissiveIntensity = 0.55; } return m; };
  const R0 = Math.max(W, H) * CELL / 2 + 16, n = ECO ? 14 : 26, base = -FLOOR_T - 0.4;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * 6.2832 + rnd() * 0.2, r = R0 + rnd() * 26, x = Math.cos(a) * r * 1.2, z = -4 + Math.sin(a) * r, col = S.c[(rnd() * S.c.length) | 0];
    if (S.t === 'hills') { const rr = 7 + rnd() * 11, m = new THREE.Mesh(new THREE.SphereGeometry(rr, 14, 10), mat(col)); m.scale.y = 0.5; m.position.set(x, base - rr * 0.1, z); grp.add(m); if (rnd() < 0.5) { const t = new THREE.Mesh(new THREE.SphereGeometry(1.3 + rnd(), 8, 6), mat('#ffffff')); t.scale.y = 0.8; t.position.set(x + rr * 0.3, base + rr * 0.5, z); grp.add(t); } }
    else if (S.t === 'dunes') { const rr = 8 + rnd() * 10, m = new THREE.Mesh(new THREE.SphereGeometry(rr, 14, 10), mat(col)); m.scale.set(1.4, 0.35, 1); m.position.set(x, base, z); grp.add(m); }
    else if (S.t === 'spires') { const rr = 3 + rnd() * 3.5, h = 12 + rnd() * 16, m = new THREE.Mesh(new THREE.ConeGeometry(rr, h, 8), mat(col)); m.position.set(x, base + h * 0.4, z); grp.add(m); const k = new THREE.Mesh(new THREE.SphereGeometry(rr * 0.35, 8, 6), mat('#ffffff')); k.position.set(x, base + h * 0.4 + h / 2, z); grp.add(k); }
    else if (S.t === 'cones') { const rr = 6 + rnd() * 6, h = 9 + rnd() * 9, m = new THREE.Mesh(new THREE.ConeGeometry(rr, h, 12), mat(col)); m.position.set(x, base + h * 0.35, z); grp.add(m); const g = new THREE.Mesh(new THREE.SphereGeometry(rr * 0.22, 8, 6), new THREE.MeshBasicMaterial({ color: '#ff9a3a' })); g.position.set(x, base + h * 0.35 + h / 2 - 0.2, z); grp.add(g); }
    else if (S.t === 'clouds') { const rr = 5 + rnd() * 6, y = base - 2 + rnd() * 6; for (let j = 0; j < 4; j++) { const m = new THREE.Mesh(new THREE.SphereGeometry(rr * (0.6 + rnd() * 0.5), 10, 8), mat(col)); m.scale.y = 0.65; m.position.set(x + (j - 1.5) * rr * 0.9, y + rnd() * 1.5, z + rnd() * 3); grp.add(m); } }
    else if (S.t === 'planets') { const rr = 3 + rnd() * 6, y = 8 + rnd() * 24, m = new THREE.Mesh(new THREE.SphereGeometry(rr, 14, 10), new THREE.MeshBasicMaterial({ color: col })); m.position.set(x, y, z); grp.add(m); if (rnd() < 0.5) { const ring = new THREE.Mesh(new THREE.TorusGeometry(rr * 1.7, 0.25, 6, 28), new THREE.MeshBasicMaterial({ color: '#ffe58a' })); ring.rotation.x = 1.2; ring.position.copy(m.position); grp.add(ring); } }
    else if (S.t === 'crystals') { const rr = 1.6 + rnd() * 2, h = 9 + rnd() * 10, m = new THREE.Mesh(new THREE.ConeGeometry(rr, h, 6), new THREE.MeshLambertMaterial({ color: col, emissive: col, emissiveIntensity: 0.35 })); m.position.set(x, base + h * 0.4, z); m.rotation.z = (rnd() - 0.5) * 0.3; grp.add(m); }
  }
}
function buildBackdrop() {   // へやの そとがわ: ゆか・ちいさな かざり
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(260, 260), new THREE.MeshLambertMaterial({ color: tint(TH.ground || TH.sky, 0.6) })); ground.rotation.x = -Math.PI / 2; ground.position.y = -FLOOR_T - 0.02; scene.add(ground);
}

// ---- ふわふわ ひかる つぶ(ジムごとの くうき) ----
// kind: up=のぼる / down=おちる / drift=ただよう / twinkle=その ばで またたく
const AMBIENT = {
  forest: { c: '#fff7a0', n: 70, size: 0.34, mode: 'drift', vy: 0.25, top: 6 },
  lake: { c: '#ffffff', n: 110, size: 0.26, mode: 'down', vy: 0.9, top: 9 },
  volcano: { c: '#ffb050', n: 80, size: 0.3, mode: 'up', vy: 1.3, top: 9 },
  ghost: { c: '#d8d0ff', n: 55, size: 0.5, mode: 'up', vy: 0.35, top: 7 },
  sky: { c: '#ffffff', n: 70, size: 0.4, mode: 'drift', vy: 0.15, top: 8 },
  sun: { c: '#ffe58a', n: 90, size: 0.3, mode: 'drift', vy: 0.2, top: 8 },
  cosmos: { c: '#cfe0ff', n: 110, size: 0.3, mode: 'twinkle', vy: 0, top: 9 },
  shrine: { c: '#ffe9a0', n: 90, size: 0.34, mode: 'twinkle', vy: 0, top: 8 },
  grove: { c: '#ffe8f4', n: 60, size: 0.45, mode: 'up', vy: 0.55, top: 8 },
  castle: { c: '#d8a8ff', n: 60, size: 0.34, mode: 'up', vy: 0.5, top: 7 },
  temple: { c: '#ffe9a0', n: 90, size: 0.34, mode: 'twinkle', vy: 0, top: 9 },
  dragon: { c: '#a8ffe8', n: 60, size: 0.42, mode: 'up', vy: 0.6, top: 8 },
  end: { c: '#ffd0f4', n: 100, size: 0.34, mode: 'twinkle', vy: 0, top: 9 },
};
let ambient = null;
function buildAmbient() {
  const A = AMBIENT[TKEY]; if (!A) return; const n = ECO ? Math.round(A.n * 0.5) : A.n;
  const cv = document.createElement('canvas'); cv.width = cv.height = 64; const cg = cv.getContext('2d'), gr = cg.createRadialGradient(32, 32, 2, 32, 32, 30);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.4, 'rgba(255,255,255,0.6)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); cg.fillStyle = gr; cg.fillRect(0, 0, 64, 64);
  const geo = new THREE.BufferGeometry(), pos = new Float32Array(n * 3), ph = new Float32Array(n);
  const hw = W * CELL / 2 + 3, hd = H * CELL / 2 + 3;
  for (let i = 0; i < n; i++) { pos[i * 3] = (Math.random() * 2 - 1) * hw; pos[i * 3 + 1] = 0.3 + Math.random() * A.top; pos[i * 3 + 2] = (Math.random() * 2 - 1) * hd - 4; ph[i] = Math.random() * 6.28; }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({ color: A.c, size: A.size * 3.2, map: new THREE.CanvasTexture(cv), transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true, fog: true });
  const pts = new THREE.Points(geo, mat); pts.frustumCulled = false; scene.add(pts); ambient = { pts, pos, ph, A, n, hw, hd };
}
function updateAmbient(dt) {
  if (!ambient) return; const { pos, ph, A, n, hw, hd } = ambient;
  for (let i = 0; i < n; i++) {
    const k = i * 3; ph[i] += dt;
    if (A.mode === 'twinkle') continue;
    pos[k + 1] += (A.mode === 'down' ? -A.vy : A.vy) * dt; pos[k] += Math.sin(ph[i] * 0.9 + i) * 0.25 * dt; pos[k + 2] += Math.cos(ph[i] * 0.7 + i * 1.3) * 0.2 * dt;
    if (A.mode === 'drift') pos[k + 1] += Math.sin(ph[i] * 1.3) * 0.3 * dt;
    if (pos[k + 1] > A.top + 0.5) pos[k + 1] = 0.2; else if (pos[k + 1] < 0.1) pos[k + 1] = A.top;
    if (pos[k] > hw) pos[k] = -hw; else if (pos[k] < -hw) pos[k] = hw;
  }
  ambient.pts.geometry.attributes.position.needsUpdate = true;
  ambient.pts.material.opacity = A.mode === 'twinkle' ? 0.55 + Math.sin(T * 2.2) * 0.3 : 0.85;
}

// ---- プレイヤー ----
let chin = null, chinGL = null;
function makeChin(h) {
  const root = chinGL.scene.clone(true); root.traverse(o => { if (o.isMesh) o.material = o.material.clone(); });
  const box = new THREE.Box3().setFromObject(root), size = box.getSize(new V3()), c = box.getCenter(new V3()), s = h / size.y;
  root.scale.setScalar(s); root.position.set(-c.x * s, -box.min.y * s, -c.z * s);
  const inner = new THREE.Group(); inner.add(root); const outer = new THREE.Group(); outer.add(inner); return { outer, inner, h };
}
const P = { x: 0, z: 0, face: Math.PI, hopT: 0, scale: 1, moving: false };
const cam = { pos: new V3(), look: new V3() };
let busy = true, T = 0, solved = false, bossOpen = false;
const setPlayerCell = (x, y) => { P.x = cx(x); P.z = cz(y); };

// ---- アニメーション(1ぶんの うごきを じゅんばんに ならべる) ----
const wait = (ms) => sleep(ms);
function tween(dur, fn) { return new Promise(res => { const t0 = performance.now(); const tk = () => { const t = Math.min(1, (performance.now() - t0) / dur); fn(t); if (t < 1) requestAnimationFrame(tk); else res(); }; requestAnimationFrame(tk); }); }
const ease = (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
async function movePlayerTo(x, y, dur) {
  const ax = P.x, az = P.z, bx = cx(x), bz = cz(y); P.face = Math.atan2(bx - ax, bz - az); P.moving = true;
  await tween(dur, t => { P.x = ax + (bx - ax) * t; P.z = az + (bz - az) * t; }); P.moving = false;
}
async function playActs(acts) {
  for (const a of acts) {
    if (a.t === 'turn') { P.face = [Math.PI, Math.PI / 2, 0, -Math.PI / 2][a.d]; continue; }
    if (a.t === 'move') { await movePlayerTo(a.x, a.y, a.slide ? 95 : 170); }
    else if (a.t === 'push') { const m = dyn.rocks.get(a.from); dyn.rocks.delete(a.from); dyn.rocks.set(a.to, m); sfx('pick'); if (m) { const fx = m.position.x, fz = m.position.z, tx = cx(a.to % W), tz = cz((a.to / W) | 0); tween(170, t => { m.position.x = fx + (tx - fx) * t; m.position.z = fz + (tz - fz) * t; m.rotation.y += 0.04; }); } }
    else if (a.t === 'fill') {
      const m = dyn.rocks.get(a.from); dyn.rocks.delete(a.from); sfx(a.kind === 'l' ? 'wx_rain' : 'ballhit');
      if (m) { const fx = m.position.x, fz = m.position.z, tx = cx(a.to % W), tz = cz((a.to / W) | 0); tween(260, t => { m.position.x = fx + (tx - fx) * t; m.position.z = fz + (tz - fz) * t; m.position.y = -t * 0.55; const s = 1 - t * 0.5; m.scale.setScalar(s); }).then(() => { level.remove(m); }); }
      await wait(150); refreshTiles(a.to);
    }
    else if (a.t === 'cp') { const m = dyn.cps.get(a.at); sfx('pick'); if (m) { m.material.emissive.set('#ffe9a0'); m.material.emissiveIntensity = 0.7; } ui.toast('チェックポイント', 'おちても ここから やりなおし', '', 1600); }
    else if (a.t === 'key') { const m = dyn.keys.get(a.at); dyn.keys.delete(a.at); sfx('quest'); if (m) level.remove(m); updateKeysHud(); ui.toast('かぎを てにいれた!', 'かぎの とびらを あけられるよ', '', 1800); }
    else if (a.t === 'unlock') { const m = dyn.locks.get(a.at); dyn.locks.delete(a.at); sfx('quest'); if (m) { tween(380, t => { m.position.y = -FLOOR_T + t * 2.6; }).then(() => level.remove(m)); } updateKeysHud(); await wait(120); }
    else if (a.t === 'crumble') { const m = dyn.crumbles.get(a.at); dyn.crumbles.delete(a.at); sfx('no'); if (m) { tween(360, t => { m.position.y = -FLOOR_T - t * 1.4; m.rotation.x = t * 0.3; }).then(() => level.remove(m)); } refreshTiles(a.at); }
    else if (a.t === 'warp') { sfx('quest'); await tween(120, t => { P.scale = 1 - t; }); P.x = cx(a.x); P.z = cz(a.y); await tween(160, t => { P.scale = t; }); P.scale = 1; }
    else if (a.t === 'fall') { sfx('no'); await tween(380, t => { P.scale = 1 - t * 0.9; chin.outer.position.y = -t * 1.2; }); }
    else if (a.t === 'respawn') { P.x = cx(a.x); P.z = cz(a.y); chin.outer.position.y = 0; await tween(240, t => { P.scale = 0.1 + t * 0.9; }); P.scale = 1; ui.toast('おちてしまった!', 'スタートに もどったよ', '', 1600); }
  }
}
// こうかした マス(あなに いわ・くずれ)の みための こうしん
function refreshTiles() { buildTiles(S.cells); }
function updateDoorsAndPlates(instant) {
  for (const [i, d] of dyn.doors) { const ch = S.cells[i]; if (!ch || !/[ABC]/.test(ch)) continue; const open = doorOpen(S, LV, ch) ? 1 : 0; if (open !== d.open) { d.open = open; if (!instant) sfx(open ? 'quest' : 'no'); } }
  for (const [i, m] of dyn.plates) { const on = S.rocks.includes(i) || (S.x + S.y * W) === i; m.material.emissive.set(on ? PLATE_COL[S.cells[i]] || '#ffffff' : '#000000'); m.material.emissiveIntensity = on ? 0.9 : 0; }
}
function updateKeysHud() { let el = $('#gymkeys'); if (!el) return; el.textContent = S.keys > 0 ? `かぎ ×${S.keys}` : ''; el.hidden = S.keys <= 0; }

// ---- そうさ ----
let moveQueue = null;
async function doStep(d) {
  if (busy || solved) return; busy = true;
  try {
    const r = step(S, LV, d);
    if (!r.moved) { await playActs(r.acts); const qa = r.acts.find(a => a.t === 'quiz'); if (qa) await askQuiz(qa.at); return; }
    S = r.state; await playActs(r.acts); updateDoorsAndPlates(); updateKeysHud();
    if (S.solved) { solved = true; await onSolved(); }
  } catch (e) { console.warn('doStep failed', e); } finally { P.moving = false; P.scale = 1; if (chin) chin.outer.position.y = 0; if (solved) bossOpen = true; busy = false; }   // どこかで しっぱいしても そうさ ふのうに ならない
}
function readDir() {
  const mx = input.mx, mz = input.mz; if (Math.hypot(mx, mz) < 0.45) return -1;
  if (Math.abs(mx) > Math.abs(mz)) return mx > 0 ? 1 : 3; return mz > 0 ? 0 : 2;
}
async function onSolved() {
  state.gyms = state.gyms || {}; state.gyms[FID] = { ...(state.gyms[FID] || {}), solved: 1, day: state.day || 1 }; save();
  sfx('quest'); ui.toast('しかけを とっぱ!', 'ゴールに とうたつ', `${ROLE}の まえに すすもう`, 3000);
  const gx = LV.goal[0];
  for (let k = 1; k <= AR_D - 2; k++) { await tween(240, t => { P.z = cz(0) - (k - 1 + t) * CELL; P.x = cx(gx); P.face = Math.PI; }); }
  bossOpen = true; busy = false;
}
async function resetLevel() {
  if (busy) return; busy = true;
  try { S = freshState(); buildLevel(); setPlayerCell(S.x, S.y); P.face = Math.PI; P.moving = false; P.scale = 1; if (chin) chin.outer.position.y = 0; updateDoorsAndPlates(true); updateKeysHud(); sfx('ui'); }
  catch (e) { console.warn('reset failed', e); } finally { busy = false; }
}


// ---- はなしかけ ----
function dlgShow(lines, choices, who) {
  return new Promise(res => {
    let box = $('#dlg'); if (!box) { box = document.createElement('div'); box.id = 'dlg'; document.body.appendChild(box); } box.hidden = false; let i = 0;
    const stepD = () => {
      if (i < lines.length) { box.innerHTML = `<b>${who}</b><p>${lines[i]}</p><button>つぎへ</button>`; box.querySelector('button').onclick = () => { sfx('ui'); i++; stepD(); }; }
      else { box.innerHTML = `<b>${who}</b><p>${lines[lines.length - 1]}</p><div class="ch">` + choices.map((c, k) => `<button data-k="${k}">${c}</button>`).join('') + '</div>'; box.querySelectorAll('[data-k]').forEach(b => b.onclick = () => { sfx('ui'); box.hidden = true; res(+b.dataset.k); }); }
    }; stepD();
  });
}
// ---- クイズの とびら ----
async function askQuiz(at) {
  const Q = GYM_QUIZ[FID], who = 'ふしぎな とびら'; if (!Q) return;
  sfx('pet');
  const name = (id) => (ITEMS[id] ? ITEMS[id].name : id);
  let first = true;
  for (;;) {
    const opts = Q.opts.slice().sort(() => Math.random() - 0.5);
    const k = await dlgShow(first ? ['とびらに もじが ほられている。', 'こたえの ものを わたすと ひらくようだ。', ...Q.q] : Q.q, [...opts.map(name), 'あとで'], who); first = false;
    if (k === opts.length) return;
    const id = opts[k];
    if (id !== Q.ans) { sfx('no'); await dlgShow(['……ちがうようだ。', 'ヒント: ' + Q.hint], ['もういちど'], who); continue; }
    if (count(id) < 1) { sfx('no'); await dlgShow([`こたえは「${name(id)}」だ。`, 'でも いま もっていない……。', 'むらで あつめてから また きてみよう。(ジムの そとへ でても とびらは かわらないよ)'], ['わかった'], who); return; }
    addItem(id, -1); state.gyms = state.gyms || {}; state.gyms[FID] = { ...(state.gyms[FID] || {}), quiz: 1 }; save();
    sfx('quest'); await dlgShow([`「${name(id)}」を わたした!`, 'ゴゴゴ……とびらが ひらいた!'], ['すすむ'], who);
    S.cells[at] = '.'; const d = dyn.doors.get(at); if (d) d.open = 1; refreshTiles(); return;
  }
}
const bossBeaten = () => !!state.boss[BOSS.key];
const rematchReady = () => bossBeaten() && (state.bossRe || {})[BOSS.key] !== (state.day || 1);
async function talkBoss() {
  if (busy || !bossOpen) return; busy = true; sfx('pet');
  const beaten = bossBeaten(), who = `${ROLE} ${BOSS.name}`;
  if (beaten && !rematchReady()) { await dlgShow(['……きょうは もう たたかった。', 'また あした きてくれ。'], ['わかった'], who); busy = false; return; }
  const lines = beaten ? ['……また きたのか。', 'いちど みとめた あいてだ。もう いちど ちからを みせてもらおう!', '(さいせん: 1日1回。かつと ごほうびが もらえるよ。つよくなっているよ)'] : (ELITE ? [`わたしは してんのう ${['castle', 'temple', 'dragon', 'end'].indexOf(FID) + 1}人目(ぜんいん 4人)、${BOSS.name}。`, ...(BOSS.lines || [])] : (BOSS.lines || ['……']));
  const k = await dlgShow(lines, ['たたかう', 'まだ やめておく'], who);
  if (k === 0) { sfx('quest'); fade(true); await sleep(600); save(); location.href = `field.html?f=${FID}&boss=1&_=${Date.now()}`; return; }
  busy = false;
}
async function talkShrine() {
  if (busy || !bossOpen) return; busy = true; sfx('pet');
  const who = BOSS.name, k = await dlgShow(['……ふしぎな けはいが ただよっている。', `${BOSS.name}が しずかに こちらを みつめている。`, 'つよい あいてだ。HPと かいふくの たべものは じゅんびしたかな?'], ['ちょうせんする', 'まだ やめておく'], who);
  if (k === 0) { sfx('quest'); fade(true); await sleep(600); save(); location.href = `field.html?f=${FID}&legend=${SH}&_=${Date.now()}`; return; }
  busy = false;
}
const fade = (on) => { const f = $('#fade'); f.textContent = ''; f.classList.toggle('on', on); };
function exitGym(toVillage) { busy = true; fade(true); save(); setTimeout(() => { location.href = SH ? `field.html?f=${FID}&fromshrine=${SH}&_=${Date.now()}` : `field.html?f=${FID}&fromgym=1&_=${Date.now()}`; }, 500); }

// ---- ボタン(やりなおし・ヒント・でる) ----
function addButtons() {
  const bar = document.createElement('div'); bar.id = 'gymbar'; bar.style.cssText = 'position:fixed;right:10px;top:calc(64px + env(safe-area-inset-top));z-index:15;display:flex;flex-direction:column;gap:6px;align-items:flex-end';
  const mk = (t, fn) => { const b = document.createElement('button'); b.textContent = t; b.style.cssText = 'font:inherit;font-size:13px;padding:6px 12px;border-radius:12px;border:2px solid #e8c868;background:#3a2a1c;color:#f4ead2;opacity:.92'; b.onclick = fn; return b; };
  bar.append(mk('やりなおし', resetLevel), mk('ヒント', () => ui.toast(TH.name, (MAP.hints || [])[0] || '', `ゴールは いちばん おくの ひかる ばしょ`, 6000)), mk('でる', () => exitGym()));
  const keys = document.createElement('div'); keys.id = 'gymkeys'; keys.hidden = true; keys.style.cssText = 'font-size:14px;color:#ffe08a;text-shadow:0 1px 2px #000;margin-top:2px'; bar.append(keys);
  document.body.appendChild(bar);
}

// ---- フレーム ----
const clock = new THREE.Clock();
let lastFrame = 0;
function frame() {
  requestAnimationFrame(frame); if (ECO) { const now = performance.now(); if (now - lastFrame < 30) return; lastFrame = now; }
  const dt = Math.min(clock.getDelta(), 0.05); T += dt; pollInput(); input.camDX = input.camDY = 0; input.zoom = 0;
  if (chin) {
    if (input.menu) { input.menu = false; if (!busy) ui.togglePanel('menu'); }
    if (!busy && !ui.panelOpen() && !solved) { const d = readDir(); if (d >= 0) doStep(d); }
    chin.outer.position.set(P.x, chin.outer.position.y > -0.01 ? 0 : chin.outer.position.y, P.z); chin.outer.rotation.y = P.face; chin.outer.scale.setScalar(P.scale * 1.45);
    const w = Math.sin(T * 14); chin.inner.position.y = P.moving ? Math.abs(w) * 0.1 : 0; chin.inner.rotation.x = P.moving ? w * 0.09 : 0;
    // カメラ
    const px = P.x, pz = P.z, tgt = new V3(px, 0.6, pz - 4.5), cp = new V3(px, 17, pz + 5.5);   // プレイヤーの すこし おくを みる(したが あきすぎない)
    cam.pos.lerp(cp, lam(6, dt)); cam.look.lerp(tgt, lam(9, dt)); camera.position.copy(cam.pos); camera.lookAt(cam.look);
    updateAmbient(dt);
    // ゆらぎ
    if (lavaMesh) lavaMesh.material.color.setHSL(0.04 + Math.sin(T * 1.6) * 0.015, 0.9, 0.55 + Math.sin(T * 2.4) * 0.08);
    for (const [i, m] of dyn.keys) { m.rotation.y = T * 1.8; m.position.y = 0.3 + Math.sin(T * 2.2 + i) * 0.1; }
    for (const [i, d] of dyn.doors) { if (d.quiz) { d.bars.rotation.y += ((d.open ? 1.9 : 0) - d.bars.rotation.y) * lam(7, dt); continue; } const tgtY = d.baseY + (d.open ? 2.15 : 0); d.bars.position.y += (tgtY - d.bars.position.y) * lam(8, dt); }
    for (const m of dyn.warps) { m.rotation.y = T * 0.6; }
    if (dyn.goal) dyn.goal.material.emissiveIntensity = 0.5 + Math.sin(T * 3) * 0.3;
    if (arena.userData.ring) arena.userData.ring.material.opacity = 0.4 + Math.sin(T * 3) * 0.2;
    if (bossObj && !bossObj.isSprite) bossObj.rotation.y = Math.atan2(P.x - arena.userData.bx, P.z - arena.userData.bz);
    // はなしかけ
    let target = null;
    if (bossOpen && !busy && Math.hypot(P.x - arena.userData.bx, P.z - arena.userData.bz) < 7) target = { label: SH ? BOSS.name + 'に ちかづく' : bossBeaten() ? BOSS.name + 'に さいせんする' : BOSS.name + 'に はなしかける', sub: 'つよい あいてだよ。HPと かいふくの たべものを じゅんびしてね', short: 'はなしかけ', can: true, act: SH ? talkShrine : talkBoss };
    ui.setPrompt(ui.panelOpen() ? null : target);
    if (input.action) { input.action = false; if (target && target.can) target.act(); }
    input.tap = null;
  }
  renderer.render(scene, camera);
}

async function boot() {
  try { await bootMain(); } catch (e) {   // よみこみに しっぱいしても そとへ でられるように する
    console.error('gym boot failed', e); addButtons(); $('#loading2').classList.add('done'); busy = false;
    ui.toast('ジムの よみこみに しっぱい', 'もういちど ひらくか、「でる」で もどってね', '', 8000);
  }
}
async function bootMain() {
  load(); giveStarter();
  await loadKit();
  chinGL = await loader.loadAsync('./assets/chin_storybook_lite.glb'); chinGL.scene.traverse(o => { if (o.isMesh && !o.geometry.attributes.normal) o.geometry.computeVertexNormals(); });
  chin = makeChin(0.95); scene.add(chin.outer);
  S = freshState(); buildBackdrop(); buildScenery(); buildLevel(); buildArena(); buildDecor(); buildAmbient(); await buildBoss(); addButtons();
  ui.setCoins(); ui.setClock && ui.setClock(); ui.setLevel && ui.setLevel();
  const cleared = SH || (state.gyms && state.gyms[FID] && state.gyms[FID].solved);
  if (cleared || params.has('arena')) { setPlayerCell(LV.goal[0], LV.goal[1]); P.z = cz(0) - (AR_D - 2) * CELL; P.x = cx(LV.goal[0]); solved = true; bossOpen = true; }
  else { setPlayerCell(S.x, S.y); P.face = Math.PI; }
  updateDoorsAndPlates(true); updateKeysHud();
  for (const d of dyn.doors.values()) { if (d.quiz) d.bars.rotation.y = d.open ? 1.9 : 0; else d.bars.position.y = d.baseY + (d.open ? 2.15 : 0); }
  cam.pos.set(P.x, 17, P.z + 5.5); cam.look.set(P.x, 0.6, P.z - 4.5);
  setFieldBgm(FID); $('#loading2').classList.add('done');
  busy = false;
  if (SH) { try { const GD = await questData(), m = GD.MONSTERS[SH]; if (m) BOSS.name = m.name; } catch (e) { console.warn('shrine name', e); } }
  setTimeout(() => ui.toast(TH.name, (MAP.hints || [])[0] || '', SH ? `${BOSS.name}が おくで まっている` : `${ROLE} ${BOSS.name}が おくで まっている`, 6000), 800);
  window.__g = { S: () => S, LV, step, doStep, P, scene, camera, TH, resetLevel, state };
  if (params.has('shot')) document.title = 'ready';   // かくにん用の さつえい(shot.py)が まつ めじるし
}
bus.on('coins', () => ui.setCoins());
bus.on('saveNow', () => { if (save()) { sfx('coin'); ui.toast('セーブ', 'セーブしました!', '', 2200); } });
bus.on('toTitle', () => { save(); location.href = 'index.html'; });
unlockAudio(); frame(); boot();
addEventListener('pagehide', () => { try { save(); } catch {} });

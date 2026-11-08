// ジムの マップを つくって、ソルバーで「かならず クリアできる」ことを たしかめて docs/js/gymmaps.js に かきだす
// つかいかた: node tools/gym_gen.mjs [なまえ ...]   (なまえを わたすと それだけ つくりなおす。ぜんぶ スタートは したの まんなか、ゴールは うえの まんなか)
import fs from 'fs';
import { parseLevel, solve, step, newState, DIRS } from '../docs/js/gymlogic.js';

const OUT = new URL('../docs/js/gymmaps_moon.js', import.meta.url);
const mulberry = (a) => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const grid = (w, h, f = '#') => Array.from({ length: h }, () => Array(w).fill(f));
const rows = (g) => g.map(r => r.join(''));
const shuffle = (rng, a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const ri = (rng, a, b) => a + Math.floor(rng() * (b - a + 1));

// ワクと ゴール(うえの まんなか)・スタート(したの まんなか)
function frame(w, h, fill = '.') {
  const g = grid(w, h), gx = (w - 1) >> 1;
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) g[y][x] = fill;
  g[0][gx] = '@'; g[1][gx - 1] = '#'; g[1][gx + 1] = '#'; g[1][gx] = '.'; g[h - 2][gx] = 'S';
  return { g, gx };
}
// かんぜんな めいろ(あなほり)。ブロック(ox,oy)から cw x ch セル
function carveMaze(g, ox, oy, cw, ch, rng) {
  const seen = new Set(), st = [[1, 1]], key = (x, y) => x + ',' + y; g[oy + 1][ox + 1] = '.'; seen.add(key(1, 1));
  const W = cw * 2 + 1, H = ch * 2 + 1;
  while (st.length) {
    const [x, y] = st[st.length - 1], nb = shuffle(rng, DIRS.map(([dx, dy]) => [x + dx * 2, y + dy * 2, dx, dy])).filter(([nx, ny]) => nx > 0 && ny > 0 && nx < W - 1 && ny < H - 1 && !seen.has(key(nx, ny)));
    if (!nb.length) { st.pop(); continue; } const [nx, ny, dx, dy] = nb[0]; g[oy + y + dy][ox + x + dx] = '.'; g[oy + ny][ox + nx] = '.'; seen.add(key(nx, ny)); st.push([nx, ny]);
  }
}
function bfs(g, sx, sy, blocked = (c) => c === '#') {
  const H = g.length, W = g[0].length, d = Array.from({ length: H }, () => Array(W).fill(-1)), par = Array.from({ length: H }, () => Array(W).fill(null)); d[sy][sx] = 0; const q = [[sx, sy]];
  for (let h = 0; h < q.length; h++) { const [x, y] = q[h]; for (const [dx, dy] of DIRS) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H || d[ny][nx] >= 0 || blocked(g[ny][nx])) continue; d[ny][nx] = d[y][x] + 1; par[ny][nx] = [x, y]; q.push([nx, ny]); } }
  return { d, par };
}
const openN = (g, x, y) => DIRS.filter(([dx, dy]) => g[y + dy] && g[y + dy][x + dx] !== undefined && g[y + dy][x + dx] !== '#').length;
const deadEnds = (g, x0 = 1, x1 = g[0].length - 2, y0 = 1, y1 = g.length - 2) => { const out = []; for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (g[y][x] === '.' && openN(g, x, y) === 1) out.push([x, y]); return out; };
const freeCells = (g, ch = '.') => { const o = []; for (let y = 2; y < g.length - 2; y++) for (let x = 1; x < g[0].length - 1; x++) if (g[y][x] === ch) o.push([x, y]); return o; };

// けっかを あじわう(ためしに といて、どんな しかけを つかったか しらべる)
function analyze(lv, path) {
  let s = newState(lv); const ev = {}, vis = new Set();
  for (const d of path) { const r = step(s, lv, d); for (const a of r.acts) { ev[a.t] = (ev[a.t] || 0) + 1; if (a.t === 'move') vis.add(lv.cells[a.y * lv.w + a.x]); } s = r.state; }
  return { ev, vis, solved: s.solved };
}


const HINT = {
  forest: 'つきの ゆか(まるい いし)に のると、つきが まんげつと しんげつで いれかわる。まんげつで ひらく かべ・しんげつで ひらく かべに きをつけて',
  lake: 'かがみに あたると すすむ むきが ななめに かわる。こおりの うえで うまく はねかえって すすもう',
  volcano: 'つきの ゆかで かべを ひらき、しおが ひいている あいだに わたろう',
  ghost: 'かげの ゆかは あかりの つえが ある あいだだけ あるける(6ほ)。あかりを みつけて とおろう',
  sky: 'とけいの レバーに のると ベルトの むきが まわる。ベルトが とおれる むきに なるまで まわそう',
  sun: 'ほしの ゆかに ぜんぶ のると せいざが かんせい。ほしの とびらが ひらくよ',
  cosmos: 'しおは 2ほごとに みちひきする。ひいている あいだに わたりきろう',
  grove: 'ほしを あつめて とびらを あけ、あかりを つかって かげの ゆかを すすもう',
  castle: 'つき・ほし・あかり。みっつの しかけを じゅんばんに ときあかそう',
  temple: 'しお・とけい・つき。タイミングと むきに きをつけて',
  dragon: 'とけい・つき・しお。ぜんぶの しかけが つながっているよ',
  end: 'これまでの しかけが ぜんぶ でてくる。よるの ぼうけんの しあげだ',
};

// ---- へや(チャンバー)と しきり(バリア) ----
// しきりの しゅるい: W/w=つきの かべ h=しお D=かげの ゆか V=とけいの ベルト G=ほしの とびら
function chambers(seed, spec) {
  const rng = mulberry(seed), w = 11, gx = 5, CH = 4, bar = (k) => k === 'h' ? 2 : k === 'D' ? 3 : 1;
  const parts = [{ t: 'ch' }]; spec.forEach(k => { parts.push({ t: 'bar', k }); parts.push({ t: 'ch' }); });
  let h = 2; parts.forEach(p => { h += p.t === 'ch' ? CH : bar(p.k); }); h += 1;
  const g = grid(w, h); let y = h - 2; const chambersY = [];
  for (const p of parts) {
    if (p.t === 'ch') { const y1 = y, y0 = y - CH + 1; for (let yy = y0; yy <= y1; yy++) for (let x = 1; x < w - 1; x++) g[yy][x] = '.'; chambersY.push([y0, y1]); y = y0 - 1; }
    else { const n = bar(p.k), y1 = y, y0 = y - n + 1; for (let yy = y0; yy <= y1; yy++) for (let x = 1; x < w - 1; x++) g[yy][x] = p.k === 'V' ? 'v' : p.k; y = y0 - 1; }
  }
  if (y !== 1) return null;
  g[1][gx] = '.'; g[0][gx] = '@'; g[1][gx - 1] = '#'; g[1][gx + 1] = '#';
  g[h - 2][gx] = 'S';
  spec.forEach((k, i) => {
    const [y0, y1] = chambersY[i], cells = shuffle(rng, (() => { const o = []; for (let yy = y0; yy <= y1; yy++) for (let x = 1; x < w - 1; x++) if (g[yy][x] === '.' && !(yy === h - 2 && x === gx) && !(x === gx && (yy === y0 || yy === y1))) o.push([x, yy]); return o; })());
    const put = (c, n = 1) => { for (let q = 0; q < n; q++) { const e = cells.shift(); if (e) g[e[1]][e[0]] = c; } };
    if (k === 'W' || k === 'w') put('M'); else if (k === 'G') put('z', 3); else if (k === 'D') put('e'); else if (k === 'V') put('V');
    put('#', ri(rng, 3, 5));
  });
  if (spec.includes('G') && !g.flat().includes('z')) return null;
  return { g };
}
const moonIce = (seed) => {
  const rng = mulberry(seed), w = 13, h = 15, { g, gx } = frame(w, h, 'i');
  g[h - 2][gx - 1] = '.'; g[h - 2][gx + 1] = '.'; g[h - 3][gx] = '.';
  const cells = shuffle(rng, freeCells(g, 'i').filter(([x, y]) => !(x === gx && y <= 3) && !(Math.abs(x - gx) <= 1 && y >= h - 4)));
  for (let k = 0; k < 9; k++) g[cells[k][1]][cells[k][0]] = k % 2 ? '/' : '\\';
  for (let k = 9; k < 17; k++) g[cells[k][1]][cells[k][0]] = '#'; for (let k = 17; k < 20; k++) g[cells[k][1]][cells[k][0]] = 'r';
  return { g };
};
const SPEC = { forest: ['W', 'w', 'W'], volcano: ['W', 'h', 'w'], ghost: ['D', 'D', 'D'], sky: ['V', 'V', 'V'], sun: ['G', 'W'], cosmos: ['h', 'h', 'h'], grove: ['D', 'G', 'D'], castle: ['W', 'D', 'G', 'h'], temple: ['h', 'V', 'W', 'h'], dragon: ['V', 'W', 'h', 'D'] };
const GEN = { lake: moonIce }; for (const [k, sp] of Object.entries(SPEC)) GEN[k] = (seed) => chambers(seed, sp);
const NEED = {
  forest: { len: [14, 400], need: (a) => (a.ev.moon || 0) >= 2 }, lake: { len: [8, 60], need: (a) => (a.ev.mirror || 0) >= 2 },
  volcano: { len: [16, 400], need: (a) => (a.ev.moon || 0) >= 1 }, ghost: { len: [16, 400], need: (a) => (a.ev.dark || 0) >= 4 },
  sky: { len: [14, 400], need: (a) => (a.ev.clock || 0) >= 1 }, sun: { len: [14, 400], need: (a) => (a.ev.star || 0) >= 3 },
  cosmos: { len: [14, 400], need: (a) => true }, grove: { len: [16, 400], need: (a) => (a.ev.star || 0) >= 3 && (a.ev.dark || 0) >= 2 },
  castle: { len: [24, 500], need: (a) => (a.ev.moon || 0) >= 1 && (a.ev.star || 0) >= 3 && (a.ev.dark || 0) >= 2 }, temple: { len: [24, 500], need: (a) => (a.ev.clock || 0) >= 1 },
  dragon: { len: [24, 500], need: (a) => (a.ev.clock || 0) >= 1 && (a.ev.moon || 0) >= 1 },
};
if (process.env.DBG) { const k = process.env.DBG; let ok = 0, nul = 0, rs = 0; const lens = []; for (let sd = 1; sd < 60; sd++) { const r = GEN[k](sd); if (!r) { nul++; continue; } const lv = parseLevel(rows(r.g)); const p = solve(lv, 300000); if (!p) { rs++; continue; } ok++; lens.push(p.length + ':' + (analyze(lv, p).ev.moon || 0)); } console.log(k, JSON.stringify({ ok, nul, unsolved: rs, lens: lens.slice(0, 12) })); const r0 = GEN[k](1); if (r0) console.log(rows(r0.g).join(String.fromCharCode(10))); process.exit(0); }
const names = process.argv.slice(2).length ? process.argv.slice(2) : [...Object.keys(NEED), 'end'];
const maps = fs.existsSync(OUT) ? { ...(await import(OUT.href + '?t=' + Date.now())).GYM_MAPS_MOON } : {}; let endPath = null;
function pickOne(name, maxSeed = 4000) {
  let best = null, tried = 0;
  for (let seed = 1; seed < maxSeed && tried < 40; seed++) {
    const r = GEN[name](seed); if (!r) continue; const lv = parseLevel(rows(r.g)); if (!lv.start || !lv.goal) continue;
    const p = solve(lv, 600000); if (!p) continue; const nd = NEED[name], a = analyze(lv, p); tried++;
    if (p.length >= nd.len[0] && p.length <= nd.len[1] && a.solved && nd.need(a) && (!best || p.length > best.steps)) best = { rows: rows(r.g), steps: p.length, seed, path: p };
  }
  return best;
}
function addLobby(name, m) {
  const R = m.rows.map(r => r.split('')), h = R.length; let sx = -1, sy = -1;
  R.forEach((r, y) => r.forEach((c, x) => { if (c === 'S') { sx = x; sy = y; } }));
  if (sy !== h - 2 || R[h - 1][sx] !== '#') { console.log(name, 'lobby: bad start'); return false; }
  R[sy][sx] = '.'; R[h - 1][sx] = 'Q';
  const W = R[0].length, lob = Array(W).fill('#'); for (const dx of [-1, 0, 1]) lob[sx + dx] = '.'; lob[sx] = 'S';
  R.push(lob, Array(W).fill('#'));
  const rr = R.map(r => r.join('')), lv = parseLevel(rr); lv.free = true;
  const solvable = name === 'end' ? (() => { let st = newState(lv); for (const d of [0, 0, ...endPath]) { const r = step(st, lv, d); st = r.state; } return st.solved; })() : !!solve(lv, 1500000);
  if (!solvable) { console.log(name, 'lobby: NOT SOLVABLE'); return false; }
  m.rows = rr; m.hints = [m.hints[0] + ' / はじめの とびらは もんだいに こたえて ひらく']; m.steps += 2; console.log(name, 'lobby ok'); return true;
}
for (const name of names) {
  if (name === 'end') {
    // しゅるいを えらぶ: ほしの とびら(G)と とけいの レバー(V)は ぜんたいに こうかが およぶので、G は さいごの 1つだけ・V は つかわない
    const kinds = ['lake', 'cosmos', 'ghost', 'forest', 'castle'], secs = [];
    for (const k of kinds) { const r = pickOne(k, 3000); if (!r) { console.log('end: section', k, 'FAILED'); secs.length = 0; break; } secs.push(r); }
    if (secs.length !== kinds.length) continue;
    const wmax = Math.max(...secs.map(s => s.rows[0].length)), padded = secs.map(s => s.rows.map(r => { const l = Math.floor((wmax - r.length) / 2); return '#'.repeat(l) + r + '#'.repeat(wmax - r.length - l); }));
    const gxs = secs.map(s => s.rows[0].indexOf('@') + Math.floor((wmax - s.rows[0].length) / 2)), sxs = secs.map(s => s.rows[s.rows.length - 2].indexOf('S') + Math.floor((wmax - s.rows[0].length) / 2));
    let comb = padded[0].map(r => r.split(''));
    for (let k = 1; k < padded.length; k++) {
      const up = padded[k].map(r => r.split('')), low = comb; const gl = gxs[k - 1], su = sxs[k];
      low[0][gl] = '.'; const rowsUp = up.length; up[rowsUp - 1][su] = '.'; up[rowsUp - 2][su] = '=';
      comb = [...up, ...low]; if (gl !== su) { const rr = up.length; comb[rr - 1][gl] = '.'; comb[rr][gl] = '.'; }
    }
    const lv = parseLevel(comb.map(r => r.join(''))); if (!lv.start || !lv.goal) { console.log('end: bad combine'); continue; }
    // へやごとに、まえの へやの おわりの じょうたい(つき・しお・あかり)から とき なおして つなぐ
    let path = [], st = newState(lv), bad = false; st.t = 2;   // ロビーで 2ほ あるいた ぶん
    for (let k = 0; k < secs.length; k++) {
      if (k > 0) for (const d of [0, 0]) { const r = step(st, lv, d); st = r.state; path.push(d); }
      const lvk = parseLevel(secs[k].rows), p = solve(lvk, 400000, { ph: st.ph, t: st.t, lamp: st.lamp });
      if (!p) { console.log('end: section', kinds[k], 'unsolvable from carried state'); bad = true; break; }
      for (const d of p) { const r = step(st, lv, d); st = r.state; path.push(d); }
    }
    if (bad || !st.solved) { console.log('end: replay failed', st.solved); continue; }
    endPath = path; maps.end = { rows: comb.map(r => r.join('')), hints: [HINT.end], steps: path.length, seed: 0 }; console.log('end ok steps', path.length); continue;
  }
  if (!GEN[name]) { console.log('skip', name); continue; }
  const r = pickOne(name); if (!r) { console.log(name, 'FAILED'); continue; }
  maps[name] = { rows: r.rows, hints: [HINT[name]], steps: r.steps, seed: r.seed }; console.log(name, 'ok seed', r.seed, 'steps', r.steps); addLobby(name, maps[name]);
}
if (maps.end && !maps.end.rows.some(r => r.includes('Q'))) addLobby('end', maps.end);
fs.writeFileSync(OUT, '// tools/gym_gen_moon.mjs が つくった「月」シリーズの マップ(うで で かきなおさない)\nexport const GYM_MAPS_MOON = ' + JSON.stringify(maps, null, 1) + ';\n');

// ジムの マップを つくって、ソルバーで「かならず クリアできる」ことを たしかめて docs/js/gymmaps.js に かきだす
// つかいかた: node tools/gym_gen.mjs [なまえ ...]   (なまえを わたすと それだけ つくりなおす。ぜんぶ スタートは したの まんなか、ゴールは うえの まんなか)
import fs from 'fs';
import { parseLevel, solve, step, newState, DIRS } from '../docs/js/gymlogic.js';

const OUT = new URL('../docs/js/gymmaps.js', import.meta.url);
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
  forest: 'かぎを みつけて ゴールの とびらを あけよう。いきどまりに かぎが ある',
  lake: 'こおりの うえは すべって とまらない。いわや かべに ぶつかるまで すすむよ',
  volcano: 'ようがんは いわを おとせば うまる。いわを おして みちを つくろう',
  ghost: 'おはかの ワープに ふれると べつの へやへ とばされる。いきどまりの おくを さがそう',
  sky: 'かぜの ベルトに のると ながされる。あなに おちると スタートに もどるよ',
  sun: 'いわを スイッチに のせると おなじ いろの とびらが ひらく。ぜんぶ ひらこう',
  castle: 'かぎは 1かい つかうと なくなる。とびらの じゅんばんに きをつけて',
  temple: 'ふむと くずれる ゆか。いちど わたった ゆかには もどれないよ',
  cosmos: 'ほしの ワープで とばされる。ながれる ゆかと くみあわせて すすもう',
  grove: 'いわを スイッチに のせると つるの とびらが ひらく。めいろの おくを さがそう',
  dragon: 'こおりの ゆかと かぜの ベルトを くみあわせて すすめ。おちると やりなおし',
  end: 'これまでの しかけが ぜんぶ でてくる。はた(チェックポイント)から やりなおせるよ',
};

const GEN = {
  // 1 もり: かぎと かぎの とびらの めいろ
  forest(seed) {
    const rng = mulberry(seed), cw = 7, ch = 6, g = grid(cw * 2 + 1, ch * 2 + 1); carveMaze(g, 0, 0, cw, ch, rng); const W = g[0].length, H = g.length, gx = (W - 1) >> 1;
    g[1][gx - 1] = '#'; g[1][gx + 1] = '#'; g[2][gx] = '.'; g[1][gx] = 'L'; g[0][gx] = '@'; g[H - 2][gx] = 'S';
    const { d } = bfs(g, gx, H - 2, c => c === '#' || c === 'L'), ends = deadEnds(g).filter(([x, y]) => d[y][x] > 0).sort((a, b) => d[b[1]][b[0]] - d[a[1]][a[0]]);
    if (!ends.length) return null; g[ends[0][1]][ends[0][0]] = 'k'; return { g };
  },
  // 2 みずうみ: こおりの ゆかと いわ
  lake(seed) {
    const rng = mulberry(seed), w = 13, h = 15, { g, gx } = frame(w, h, 'i');
    g[h - 2][gx - 1] = '.'; g[h - 2][gx + 1] = '.'; g[h - 3][gx] = '.';
    const cells = shuffle(rng, freeCells(g, 'i').filter(([x, y]) => !(x === gx && y <= 3)));
    for (let k = 0; k < 13; k++) g[cells[k][1]][cells[k][0]] = 'r'; for (let k = 13; k < 22; k++) g[cells[k][1]][cells[k][0]] = '#';
    return { g };
  },
  // 3 ようがん: いわで ようがんを うめる
  volcano(seed) {
    const rng = mulberry(seed), w = 11, h = 15, { g, gx } = frame(w, h, '.');
    for (let x = 1; x < w - 1; x++) { g[10][x] = 'l'; g[5][x] = 'l'; g[6][x] = 'l'; }
    const bottom = shuffle(rng, freeCells(g).filter(([x, y]) => y >= 11 && y <= 12)), mid = shuffle(rng, freeCells(g).filter(([x, y]) => y >= 7 && y <= 9)), top = shuffle(rng, freeCells(g).filter(([x, y]) => y >= 2 && y <= 4 && x !== gx));
    for (let k = 0; k < 2; k++) g[bottom[k][1]][bottom[k][0]] = 'r'; for (let k = 0; k < 3; k++) g[mid[k][1]][mid[k][0]] = 'r';
    for (let k = 0; k < 3; k++) g[bottom[2 + k][1]][bottom[2 + k][0]] = '#'; for (let k = 0; k < 2; k++) g[mid[3 + k][1]][mid[3 + k][0]] = '#'; for (let k = 0; k < 3; k++) g[top[k][1]][top[k][0]] = '#';
    return { g };
  },
  // 4 ゆうれい: 3つの おはかの めいろを ワープで つなぐ
  ghost(seed) {
    const rng = mulberry(seed), cw = 5, ch = 3, bw = cw * 2 + 1, bh = ch * 2 + 1, w = bw, h = bh * 3 - 2, g = grid(w, h), offs = [0, bh - 1, (bh - 1) * 2];
    for (const oy of offs) { const sub = grid(bw, bh); carveMaze(sub, 0, 0, cw, ch, rng); for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) if (sub[y][x] === '.') g[oy + y][x] = '.'; }
    const gx = cw, sx = cw;   // ゴール・スタートは まんなか(さいはての ジムで たてに つなげるため)
    g[0][gx] = '@'; g[h - 2][sx] = 'S';
    const ends = (oy) => shuffle(rng, deadEnds(g, 1, w - 2, oy + 1, oy + bh - 2).filter(([x, y]) => !(x === sx && y === h - 2) && !(x === gx && y === 1)));
    const e0 = ends(offs[2]), e1 = ends(offs[1]), e2 = ends(offs[0]); if (e0.length < 2 || e1.length < 3 || e2.length < 1) return null;
    g[e0[0][1]][e0[0][0]] = '1'; g[e1[0][1]][e1[0][0]] = '1'; g[e1[1][1]][e1[1][0]] = '2'; g[e2[0][1]][e2[0][0]] = '2';
    g[e0[1][1]][e0[1][0]] = '3'; g[e1[2][1]][e1[2][0]] = '3';   // おとりの ワープ(となりの へやへ もどる)
    return { g };
  },
  // 5 てんくう: かぜの ベルト(ながされる)と くものの あな
  sky(seed) {
    const rng = mulberry(seed), w = 13, h = 15, { g, gx } = frame(w, h, '.');
    const free = () => shuffle(rng, freeCells(g).filter(([x, y]) => !(x === gx && y <= 3) && !(Math.abs(x - gx) <= 1 && y >= h - 4)));
    for (let k = 0; k < 9; k++) { const [x, y] = free()[0], d = ri(rng, 0, 3), len = ri(rng, 3, 5), ch = '^>v<'[d]; for (let j = 0; j < len; j++) { const nx = x + DIRS[d][0] * j, ny = y + DIRS[d][1] * j; if (g[ny] && g[ny][nx] === '.' && ny >= 2 && ny <= h - 3) g[ny][nx] = ch; } }
    for (const [x, y] of free().slice(0, 16)) g[y][x] = 'o'; for (const [x, y] of free().slice(0, 6)) g[y][x] = '#';
    return { g };
  },
  // 6 たいよう: スイッチ(いわ)と とびらの 3つの へや
  sun(seed) {
    const rng = mulberry(seed), w = 11, h = 19, g = grid(w, h), gx = 5;
    for (const [y0, y1] of [[14, 17], [9, 12], [4, 7]]) for (let y = y0; y <= y1; y++) for (let x = 1; x < w - 1; x++) g[y][x] = '.';
    g[1][gx] = '.'; g[2][gx] = '.'; g[0][gx] = '@'; g[3][gx] = 'C'; g[8][gx] = 'B'; g[13][gx] = 'A'; g[h - 2][gx] = 'S'; g[2][gx - 1] = '#'; g[2][gx + 1] = '#';
    const chamber = (y0, y1, plate) => {
      const cells = shuffle(rng, freeCells(g).filter(([x, y]) => y >= y0 && y <= y1 && !(x === gx && (y === y0 || y === y1))));
      const [px, py] = cells[0]; g[py][px] = plate; const [rx, ry] = cells[1]; g[ry][rx] = 'r';
      for (let k = 2; k < 5; k++) g[cells[k][1]][cells[k][0]] = '#';
    };
    chamber(14, 17, 'a'); chamber(9, 12, 'b'); chamber(4, 7, 'c');
    return { g };
  },
  // 7 うちゅう: ワープと ながれる ゆか
  cosmos(seed) {
    const rng = mulberry(seed), w = 13, h = 15, { g, gx } = frame(w, h, '.');
    const free = () => shuffle(rng, freeCells(g).filter(([x, y]) => !(x === gx && y <= 3) && !(Math.abs(x - gx) <= 1 && y >= h - 4)));
    for (let k = 0; k < 6; k++) { const [x, y] = free()[0], d = ri(rng, 0, 3), len = ri(rng, 3, 5), ch = '^>v<'[d]; for (let j = 0; j < len; j++) { const nx = x + DIRS[d][0] * j, ny = y + DIRS[d][1] * j; if (g[ny] && g[ny][nx] === '.' && ny >= 2 && ny <= h - 3) g[ny][nx] = ch; } }
    for (const [x, y] of free().slice(0, 14)) g[y][x] = 'o'; for (const [x, y] of free().slice(0, 5)) g[y][x] = '#';
    for (const n of ['1', '2', '3']) { const f = free(); g[f[0][1]][f[0][0]] = n; g[f[1][1]][f[1][0]] = n; }
    return { g };
  },
  // 8 しんじゅ: めいろ + つるの とびらと スイッチの いわ
  grove(seed) {
    const rng = mulberry(seed), cw = 7, ch = 6, g = grid(cw * 2 + 1, ch * 2 + 1); carveMaze(g, 0, 0, cw, ch, rng); const W = g[0].length, H = g.length, gx = (W - 1) >> 1, sx = gx, sy = H - 2;
    g[1][gx - 1] = '#'; g[1][gx + 1] = '#'; g[2][gx] = '.'; g[0][gx] = '@'; g[sy][sx] = 'S';
    const { d, par } = bfs(g, sx, sy), path = []; let cur = [gx, 1]; while (cur) { path.push(cur); cur = par[cur[1]][cur[0]]; } path.reverse();
    const cands = path.filter(([x, y], i) => i > 6 && i < path.length - 3 && openN(g, x, y) === 2 && !(x === gx && y <= 2)); if (cands.length < 6) return null;
    const door = [cands[Math.floor(cands.length * 0.35)], cands[Math.floor(cands.length * 0.7)]], names = ['A', 'B'], plates = ['a', 'b'];
    for (let k = 0; k < 2; k++) g[door[k][1]][door[k][0]] = names[k];
    const used = new Set();
    for (let k = 0; k < 2; k++) {
      const reach = bfs(g, sx, sy, c => c === '#' || /[AB]/.test(c)).d;   // その とびらまで に いける ばしょ
      const alc = [];   // まっすぐな 3マス いじょうの いきどまりに スイッチ、2マス てまえに いわ
      for (const [ex, ey] of deadEnds(g)) { if (reach[ey][ex] < 0) continue; for (const [dx, dy] of DIRS) { const a = [ex - dx, ey - dy], b = [ex - 2 * dx, ey - 2 * dy], c3 = [ex - 3 * dx, ey - 3 * dy]; if ([a, b, c3].every(([x, y]) => g[y] && g[y][x] === '.') && !used.has(ex + ',' + ey)) alc.push([ex, ey, a, b]); } }
      if (!alc.length) return null; const [ex, ey, , b] = alc[Math.floor(rng() * alc.length)]; g[ey][ex] = plates[k]; g[b[1]][b[0]] = 'r'; used.add(ex + ',' + ey);
    }
    return { g };
  },
  // 9 やみ: かぎと かぎの とびらが 3つ
  castle(seed) {
    const rng = mulberry(seed), cw = 7, ch = 6, g = grid(cw * 2 + 1, ch * 2 + 1); carveMaze(g, 0, 0, cw, ch, rng); const W = g[0].length, H = g.length, gx = (W - 1) >> 1, sx = gx, sy = H - 2;
    g[1][gx - 1] = '#'; g[1][gx + 1] = '#'; g[2][gx] = '.'; g[0][gx] = '@'; g[sy][sx] = 'S';
    const { par } = bfs(g, sx, sy), path = []; let cur = [gx, 1]; while (cur) { path.push(cur); cur = par[cur[1]][cur[0]]; } path.reverse();
    const cands = path.filter(([x, y], i) => i > 5 && i < path.length - 2 && openN(g, x, y) === 2 && !(x === gx && y <= 2)); if (cands.length < 9) return null;
    const doors = [cands[Math.floor(cands.length * 0.25)], cands[Math.floor(cands.length * 0.55)], cands[Math.floor(cands.length * 0.85)]];
    for (const [x, y] of doors) g[y][x] = 'L';
    let prev = null;
    for (let k = 0; k < 3; k++) {
      const reach = bfs(g, sx, sy, c => c === '#' || c === 'L').d;
      const ends = deadEnds(g).filter(([x, y]) => reach[y][x] > 0 && (!prev || prev[y][x] < 0)).sort((a, b) => reach[b[1]][b[0]] - reach[a[1]][a[0]]); if (!ends.length) return null;
      const [kx, ky] = ends[0]; g[ky][kx] = 'k'; prev = reach; g[doors[k][1]][doors[k][0]] = '.';   // この とびらを あけた つもりで つぎの かぎの ばしょを きめる
    }
    for (const [x, y] of doors) g[y][x] = 'L';
    return { g };
  },
  // 10 ほし: ふむと くずれる ゆか
  temple(seed) {
    const rng = mulberry(seed), w = 11, h = 17, { g, gx } = frame(w, h, 'o'); g[h - 2][gx - 1] = '.'; g[h - 2][gx + 1] = '.'; g[h - 3][gx] = '.'; g[2][gx] = '.'; g[3][gx] = '.';
    let x = gx, y = h - 4; const walk = [[x, y]], seen = new Set([x + ',' + y]);
    for (let n = 0; n < 400 && !(x === gx && y === 4); n++) {   // ジグザグに ゴールの てまえまで
      const opts = shuffle(rng, DIRS.slice()).map(([dx, dy]) => [x + dx, y + dy]).filter(([nx, ny]) => nx >= 1 && nx <= w - 2 && ny >= 4 && ny <= h - 4 && !seen.has(nx + ',' + ny));
      const toward = opts.sort((a, b) => (Math.abs(a[0] - gx) + Math.abs(a[1] - 4)) - (Math.abs(b[0] - gx) + Math.abs(b[1] - 4)) + (rng() - 0.5) * 9)[0]; if (!toward) return null;
      [x, y] = toward; seen.add(x + ',' + y); walk.push([x, y]);
    }
    if (!(x === gx && y === 4)) return null;
    walk.forEach(([px, py], i) => { g[py][px] = i % 7 === 3 ? '.' : 'x'; });
    for (let k = 0; k < 14; k++) { const px = ri(rng, 1, w - 2), py = ri(rng, 4, h - 4); if (g[py][px] === 'o') g[py][px] = 'x'; }   // おとりの ゆか
    return { g };
  },
  // 11 せいりゅう: こおり・ベルト・あな・いわ
  dragon(seed) {
    const rng = mulberry(seed), w = 13, h = 15, { g, gx } = frame(w, h, 'i'); g[h - 2][gx - 1] = '.'; g[h - 2][gx + 1] = '.'; g[h - 3][gx] = '.';
    const free = () => shuffle(rng, freeCells(g, 'i').filter(([x, y]) => !(x === gx && y <= 3) && !(Math.abs(x - gx) <= 1 && y >= h - 4)));
    for (let k = 0; k < 5; k++) { const [x, y] = free()[0], d = ri(rng, 0, 3), len = ri(rng, 3, 4), ch = '^>v<'[d]; for (let j = 0; j < len; j++) { const nx = x + DIRS[d][0] * j, ny = y + DIRS[d][1] * j; if (g[ny] && g[ny][nx] === 'i' && ny >= 2 && ny <= h - 3) g[ny][nx] = ch; } }
    for (const [x, y] of free().slice(0, 7)) g[y][x] = 'o'; for (const [x, y] of free().slice(0, 7)) g[y][x] = 'r'; for (const [x, y] of free().slice(0, 6)) g[y][x] = '#';
    return { g };
  },
};

// 12 さいはて: これまでの しかけを たてに つなぐ(ひとつずつ ソルバーで かくにん → つなげた ものを さいごに かくにん)
function sectionGen(kind, seed) { return GEN[kind](seed); }

const NEED = {   // さいたんの てじゅんの はんい / ひつような しかけ
  forest: { len: [50, 140], need: (a) => true },
  lake: { len: [20, 40], need: (a) => a.ev.move > 0 },
  volcano: { len: [30, 110], need: (a) => (a.ev.fill || 0) >= 3 },
  ghost: { len: [50, 160], need: (a) => (a.ev.warp || 0) >= 2 },
  sky: { len: [24, 60], need: (a) => ['^', '>', 'v', '<'].some(c => a.vis.has(c)) },
  sun: { len: [40, 150], need: (a) => ['A', 'B', 'C'].every(c => a.vis.has(c)) },
  castle: { len: [60, 170], need: (a) => (a.ev.unlock || 0) >= 3 },
  temple: { len: [26, 80], need: (a) => (a.ev.crumble || 0) >= 8 },
  cosmos: { len: [20, 60], need: (a) => (a.ev.warp || 0) >= 1 },
  grove: { len: [60, 190], need: (a) => ['A', 'B'].every(c => a.vis.has(c)) },
  dragon: { len: [30, 80], need: (a) => a.vis.has('i') && ['^', '>', 'v', '<'].some(c => a.vis.has(c)) },
};

const KEEP = fs.existsSync(OUT) ? (await import(OUT.href + '?t=' + Date.now())).GYM_MAPS : {};
const names = process.argv.slice(2).length ? process.argv.slice(2) : [...Object.keys(NEED), 'end'];
const maps = { ...KEEP }; let endPath = null;
function pickOne(name, maxSeed = 3000) {
  for (let seed = 1; seed < maxSeed; seed++) {
    const r = GEN[name](seed); if (!r) continue; const lv = parseLevel(rows(r.g)); if (!lv.start || !lv.goal) continue;
    const p = solve(lv, 250000); if (!p) continue; const nd = NEED[name], a = analyze(lv, p);
    if (p.length >= nd.len[0] && p.length <= nd.len[1] && a.solved && nd.need(a)) return { rows: rows(r.g), steps: p.length, seed, path: p };
  }
  return null;
}
for (const name of names) {
  if (name === 'end') {
    // 5つの へやを たてに つなぐ(したから: こおり → ワープ → かぎ → スイッチ → くずれる ゆか)
    const kinds = ['lake', 'ghost', 'castle', 'sun', 'temple'], secs = [];
    for (const k of kinds) { const r = pickOne(k, 1500); if (!r) { console.log('end: section', k, 'FAILED'); secs.length = 0; break; } secs.push(r); }
    if (secs.length !== kinds.length) continue;
    // ひろさを そろえる(はば 13 に ひろげる)
    const wmax = Math.max(...secs.map(s => s.rows[0].length)), padded = secs.map(s => s.rows.map(r => { const l = Math.floor((wmax - r.length) / 2); return '#'.repeat(l) + r + '#'.repeat(wmax - r.length - l); }));
    // したから つみあげる(うわの へやの ゴールと したの へやの スタートを つなぐ)
    let all = padded[0].slice(); const gxs = secs.map(s => s.rows[0].indexOf('@') + Math.floor((wmax - s.rows[0].length) / 2)), sxs = secs.map(s => s.rows[s.rows.length - 2].indexOf('S') + Math.floor((wmax - s.rows[0].length) / 2));
    let ok = true, comb = padded[0].map(r => r.split(''));
    for (let k = 1; k < padded.length; k++) {
      const up = padded[k].map(r => r.split('')), low = comb; const gl = gxs[k - 1], su = sxs[k];
      // したの へやの ゴール → ゆか / うえの へやの スタート(まっすぐ うえ)に ゴールが ずれて いると ろうかを ほる
      low[0][gl] = '.'; const rowsUp = up.length; up[rowsUp - 1][su] = '.'; up[rowsUp - 2][su] = '=';   // はた(チェックポイント)
      comb = [...up, ...low]; if (gl !== su) { const rr = up.length; comb[rr - 1][gl] = '.'; comb[rr][gl] = '.'; ok = ok && true; }
    }
    // 2つめ いこうの スタートは チェックポイントに なる。さいしょの スタートだけ S。うえの ゴールの '@' だけ のこす
    const lv = parseLevel(comb.map(r => r.join(''))); if (!lv.start || !lv.goal) { console.log('end: bad combine'); continue; }
    // つなげた ぜんたいは ひろすぎて ソルバーで とけないので、へやごとの てじゅんを つなげて さいせいして かくにんする
    let sx0 = 0, p = []; const secPaths = secs.map(s => s.path);
    for (let k = 0; k < secPaths.length; k++) { if (k > 0) p.push(0, 0); p.push(...secPaths[k]); }   // へやの さかいの ふたマスは うえへ あるく
    const full = analyze(lv, p); console.log('end replay solved', full.solved, 'steps', p.length); if (!full.solved) { console.log(comb.map(r => r.join('')).join(String.fromCharCode(10))); continue; }
    endPath = p; maps.end = { rows: comb.map(r => r.join('')), hints: [HINT.end], steps: p.length, seed: 0 }; console.log('end ok steps', p.length); continue;
  }
  if (!GEN[name]) { console.log('skip', name); continue; }
  const r = pickOne(name); if (!r) { console.log(name, 'FAILED'); continue; }
  maps[name] = { rows: r.rows, hints: [HINT[name]], steps: r.steps, seed: r.seed }; console.log(name, 'ok seed', r.seed, 'steps', r.steps);
}
// はじめに クイズの とびら(Q)を おく: スタートの したに ちいさな へやを たして、スタートと ほんたいの あいだの かべに Q を うめる(かならず とおる ばしょ)
function addLobby(name, m, path) {
  if (m.rows.some(r => r.includes('Q'))) return;
  const R = m.rows.map(r => r.split('')), h = R.length; let sx = -1, sy = -1;
  R.forEach((r, y) => r.forEach((c, x) => { if (c === 'S') { sx = x; sy = y; } }));
  if (sy !== h - 2 || R[h - 1][sx] !== '#') { console.log(name, 'lobby: bad start'); return; }
  R[sy][sx] = '.'; R[h - 1][sx] = 'Q';
  const W = R[0].length, lob = Array(W).fill('#'); for (const dx of [-1, 0, 1]) lob[sx + dx] = '.'; lob[sx] = 'S';
  R.push(lob, Array(W).fill('#'));
  const rr = R.map(r => r.join('')), lv = parseLevel(rr); lv.free = true;
  const ok = name === 'end' ? (() => { let st = newState(lv); for (const d of [0, 0, ...path]) { const r = step(st, lv, d); st = r.state; } return st.solved; })() : !!solve(lv, 400000);
  if (!ok) { console.log(name, 'lobby: NOT SOLVABLE'); return; }
  m.rows = rr; m.hints = [m.hints[0] + ' / はじめの とびらは もんだいに こたえて ひらく']; m.steps += 2; console.log(name, 'lobby ok');
}
for (const name of Object.keys(maps)) addLobby(name, maps[name], name === 'end' ? endPath : null);
fs.writeFileSync(OUT, '// tools/gym_gen.mjs が つくった マップ(うで で かきなおさない)\nexport const GYM_MAPS = ' + JSON.stringify(maps, null, 1) + ';\n');

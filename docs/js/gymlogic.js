// ジムの パズルの ルール(がめんに よらない ぶぶん)。マス目で 1マスずつ うごく。ソルバー(tools/gym_check.mjs)も おなじ ロジックを つかう
// マスの きごう:
//  #かべ  ' 'そと  .ゆか  S スタート  @ ゴール(ボスの まえ)  s かんばん(はなしかける)
//  i こおり(すべる)  r いわ(おせる)  o あな / l ようがん(おちると スタートへ。いわを おとすと うまる)
//  a b c スイッチ(いわ か じぶんが のると オン)  A B C とびら(おなじ もじの スイッチが ぜんぶ オンで ひらく)
//  = チェックポイント(おちたとき ここから やりなおし)
//  Q クイズの とびら(ぶつかると もんだい。こたえの アイテムを わたすと ひらく。ソルバーは lv.free で いつでも ひらく あつかい)
//  【月シリーズの しかけ】 M つきの ゆか(のると つきが かわる) W/w つきの かべ(Wは まんげつで ひらく・wは しんげつで ひらく)
//  h しお(2ほごとに みちひき。ひいている あいだだけ あるける) / \ かがみ(すすむ むきを かえる) z ほしの ゆか(のると ひかる) G ほしの とびら(ぜんぶ ひかると ひらく)
//  V とけいの レバー(のると ベルトが 1つ まわる) e あかり(つえの ひかりが 6ほ ぶん たまる) D かげの ゆか(ひかりが ある あいだだけ あるける)
//  k かぎ  L かぎの とびら  > < ^ v ベルトコンベア  1〜9 ワープ(おなじ すうじと ペア)  x くずれる ゆか(はなれると あなに なる)
export const DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]];   // うえ みぎ した ひだり
const ARROW = { '^': 0, '>': 1, 'v': 2, '<': 3 };
const ROCK_OK = new Set(['.', 'i', 'a', 'b', 'c', 'o', 'l', 'S']);   // いわを おせる さき

export function parseLevel(rows) {
  const h = rows.length, w = Math.max(...rows.map(r => r.length)), cells = [], rocks = []; let start = null, goal = null; const signs = [], warps = {};
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let c = rows[y][x] || ' '; const i = y * w + x;
    if (c === 'r') { rocks.push(i); c = '.'; }
    if (c === 'S') { start = [x, y]; c = '.'; }
    if (c === '@') goal = [x, y];
    if (c === 's') signs.push(i);
    if (/[1-9]/.test(c)) (warps[c] = warps[c] || []).push(i);
    cells.push(c);
  }
  return { w, h, cells, rocks, start, goal, signs, warps };
}
export const newState = (lv) => ({ x: lv.start[0], y: lv.start[1], dir: 0, keys: 0, ph: 0, t: 0, lamp: 0, cp: -1, cells: lv.cells.slice(), rocks: lv.rocks.slice().sort((a, b) => a - b), solved: false });
export const keyOf = (s) => `${s.x},${s.y},${s.keys},${s.ph},${s.t % 4},${s.lamp},${s.cp},${s.cells.join('')},${s.rocks.join('.')}`;
const cloneState = (s) => ({ ...s, cells: s.cells.slice(), rocks: s.rocks.slice() });

// いま とびらが ひらいているか(おなじ もじの スイッチが ぜんぶ ふまれている)。px,py=じぶんの いち
function plateOn(s, lv, ch, px, py, rocks) {
  const pl = ch.toLowerCase(); let n = 0;
  for (let i = 0; i < s.cells.length; i++) if (s.cells[i] === pl) { n++; const x = i % lv.w, y = (i / lv.w) | 0; if (!(x === px && y === py) && !rocks.includes(i)) return false; }
  return n > 0;
}
export const doorOpen = (s, lv, ch, px = s.x, py = s.y, rocks = s.rocks) => plateOn(s, lv, ch, px, py, rocks);
const isDoor = (c) => c === 'A' || c === 'B' || c === 'C';
// そのマスに あるけるか(いわ・かべ・しまっている とびら・かんばん は だめ)
function walkable(s, lv, x, y, rocks, px, py) {
  if (x < 0 || y < 0 || x >= lv.w || y >= lv.h) return false; const i = y * lv.w + x, c = s.cells[i];
  if (c === '#' || c === ' ' || c === 's' || c === 'Q') return false; if (rocks.includes(i)) return false;
  if (isDoor(c) && !plateOn(s, lv, c, px, py, rocks)) return false;
  if (c === 'W' && s.ph === 0) return false; if (c === 'w' && s.ph === 1) return false;   // つきの かべ
  if (c === 'h' && (s.t % 4) >= 2) return false;   // しお(みちている)
  if (c === 'G' && s.cells.includes('z')) return false;   // ほしの とびら
  if (c === 'D' && !(s.lamp > 0)) return false;   // かげの ゆか(ひかりが ない)
  return true;
}

// 1ほ うごく。うごけなければ null。げんしゃ: { state, acts } acts=がめんの えんしゅつ用の じゅんばん
export function step(s0, lv, d) {
  const s = cloneState(s0), acts = []; s.dir = d; const [dx, dy] = DIRS[d]; const W = lv.w;
  const tx = s.x + dx, ty = s.y + dy; if (tx < 0 || ty < 0 || tx >= lv.w || ty >= lv.h) return { state: s, acts: [{ t: 'turn', d }], moved: false };
  const ti = ty * W + tx; let c = s.cells[ti];
  // いわを おす
  if (s.rocks.includes(ti)) {
    const rx = tx + dx, ry = ty + dy; if (rx < 0 || ry < 0 || rx >= lv.w || ry >= lv.h) return { state: s, acts: [{ t: 'turn', d }], moved: false };
    const ri = ry * W + rx, rc = s.cells[ri]; if (!ROCK_OK.has(rc) || s.rocks.includes(ri)) return { state: s, acts: [{ t: 'turn', d }], moved: false };
    s.rocks.splice(s.rocks.indexOf(ti), 1);
    if (rc === 'o' || rc === 'l') { s.cells[ri] = '.'; acts.push({ t: 'fill', from: ti, to: ri, kind: rc }); } else { s.rocks.push(ri); s.rocks.sort((a, b) => a - b); acts.push({ t: 'push', from: ti, to: ri }); }
    c = s.cells[ti];
  } else {
    if (c === 'Q') { if (lv.free) { s.cells[ti] = '.'; c = '.'; } else return { state: s, acts: [{ t: 'turn', d }, { t: 'quiz', at: ti }], moved: false }; }
    if (c === 'L') { if (s.keys > 0) { s.keys--; s.cells[ti] = '.'; acts.push({ t: 'unlock', at: ti }); c = '.'; } else return { state: s, acts: [{ t: 'turn', d }], moved: false }; }
    else if (!walkable(s, lv, tx, ty, s.rocks, tx, ty)) return { state: s, acts: [{ t: 'turn', d }], moved: false };
  }
  s.t++;   // しおの みちひきは 1ほごとに すすむ(あるきおわった ときの じかんで かぞえる)
  // あるく(こおり・ベルトで つづけて うごく)
  let x = tx, y = ty, dir = d, guard = 0; const from = s.y * W + s.x;
  if (s.cells[from] === 'x') { s.cells[from] = 'o'; acts.push({ t: 'crumble', at: from }); }
  acts.push({ t: 'move', x, y, slide: false });
  for (;;) {
    if (++guard > 80) break;
    const i = y * W + x; c = s.cells[i];
    if (c === 'o' || c === 'l') { acts.push({ t: 'fall', kind: c }); if (s.cp >= 0) { x = s.cp % W; y = (s.cp / W) | 0; } else { x = lv.start[0]; y = lv.start[1]; } acts.push({ t: 'respawn', x, y }); break; }
    if (c === '=') { s.cp = i; acts.push({ t: 'cp', at: i }); }
    if (c === 'M') { s.ph ^= 1; acts.push({ t: 'moon', ph: s.ph }); }
    if (c === 'z') { s.cells[i] = 'y'; acts.push({ t: 'star', at: i, left: s.cells.filter(q => q === 'z').length }); }
    if (c === 'V') { const R = { '^': '>', '>': 'v', 'v': '<', '<': '^' }; s.cells = s.cells.map(q => R[q] || q); acts.push({ t: 'clock' }); }
    if (c === 'e') { s.lamp = 6; acts.push({ t: 'lamp', n: 6 }); }
    if (c === 'D') { s.lamp--; acts.push({ t: 'dark', n: s.lamp }); }
    if (c === 'k') { s.keys++; s.cells[i] = '.'; acts.push({ t: 'key', at: i }); }
    if (c === '@') { s.solved = true; break; }
    if (/[1-9]/.test(c)) { const pair = (lv.warps[c] || []).find(j => j !== i); if (pair != null) { x = pair % W; y = (pair / W) | 0; acts.push({ t: 'warp', x, y }); } break; }
    let nd = null;
    if (c === 'i') nd = dir; else if (c in ARROW) nd = ARROW[c];
    else if (c === '/') { nd = [1, 0, 3, 2][dir]; acts.push({ t: 'mirror', at: i }); } else if (c === '\\') { nd = [3, 2, 1, 0][dir]; acts.push({ t: 'mirror', at: i }); }
    if (nd == null) break;
    const nx = x + DIRS[nd][0], ny = y + DIRS[nd][1];
    if (!walkable(s, lv, nx, ny, s.rocks, nx, ny)) break;
    if (s.cells[i] === 'x') { s.cells[i] = 'o'; acts.push({ t: 'crumble', at: i }); }
    dir = nd; x = nx; y = ny; acts.push({ t: 'move', x, y, slide: true });
  }
  // x を はなれたら あなに(さいしょの いちは ループの まえで しょり ずみ)。さいごの いち いがいの x は ここで
  s.x = x; s.y = y; s.dir = dir;
  // とびらの なかに いる ときに しまって しまうなら ムリ(うごかさない)
  const cc = s.cells[y * W + x]; if (isDoor(cc) && !plateOn(s, lv, cc, x, y, s.rocks)) return { state: cloneState(s0), acts: [{ t: 'turn', d }], moved: false };
  return { state: s, acts, moved: true };
}

// ソルバー: ゴールまでの さいたんの てじゅん(ぜんたんさく)。なければ null
export function solve(lv, limit = 400000, init = null) {
  const s0 = Object.assign(newState(lv), init || {}), seen = new Map([[keyOf(s0), null]]), q = [s0]; let head = 0;
  while (head < q.length && seen.size < limit) {
    const s = q[head++];
    for (let d = 0; d < 4; d++) {
      const r = step(s, lv, d); if (!r.moved) continue; const k = keyOf(r.state); if (seen.has(k)) continue;
      seen.set(k, { prev: keyOf(s), d }); if (r.state.solved) { const path = []; let cur = k; while (seen.get(cur)) { const e = seen.get(cur); path.push(e.d); cur = e.prev; } return path.reverse(); }
      q.push(r.state);
    }
  }
  return null;
}

import { QUESTS, DAY_SECONDS, DEX, ITEMS, TITLES, CROPS, RECIPES } from './data.js';
import { festivalNow } from './season.js';
const DEX_IDS = new Set(DEX.flatMap(g => g.ids));

// ---- セーブの わく: シリーズごとに 3つ。いま あそんでいる わくは localStorage に おぼえておく(どの ページでも おなじ わくを つかう) ----
export const SERIES = [
  { id: 'main', name: 'もふもふ牧場 太陽', sub: 'チンチラと はじめる ぼくじょう くらし' },
  { id: 's2', name: 'もふもふ牧場 月', sub: 'つきあかりの したで あたらしい ぼうけんが はじまる', needs: 'main' },   // でんどういりすると えらべる
];
export const SLOTS = 3;
const BASE_KEY = 'chinchilla-ranch-v2', ACTIVE_KEY = 'chinchilla-ranch-active', UNLOCK_KEY = 'chinchilla-ranch-unlock';
export const slotKey = (series, slot) => series === 'main' ? (slot === 1 ? BASE_KEY : BASE_KEY + '-s' + slot) : BASE_KEY + '-' + series + '-s' + slot;   // main の わく1は むかしの セーブと おなじ キー
export function getActive() {
  try { const m = (localStorage.getItem(ACTIVE_KEY) || '').match(/^([a-z0-9]+):([1-9])$/); if (m && SERIES.some(x => x.id === m[1]) && +m[2] <= SLOTS) return { series: m[1], slot: +m[2] }; } catch { /* しょきち */ }
  return { series: 'main', slot: 1 };
}
let KEY = (() => { const a = getActive(); return slotKey(a.series, a.slot); })();
export function setActive(series, slot) { try { localStorage.setItem(ACTIVE_KEY, series + ':' + slot); } catch { /* ほぞんできなくても つづける */ } KEY = slotKey(series, slot); SAVE_KEY = KEY; }
const readRaw = (k) => { for (const kk of [k, k + '-prev', k + '-bak']) { try { const raw = localStorage.getItem(kk); if (!raw) continue; const d = JSON.parse(raw); if (d && typeof d === 'object') return d; } catch { /* つぎへ */ } } return null; };
export function slotInfo(series, slot) {   // わくの ようすを みる(なければ null)
  const d = readRaw(slotKey(series, slot)); if (!d) return null;
  return { name: (d.names && d.names.player) || 'Chino', day: d.day || 1, coins: d.coins || 0, hof: !!d.hof, badges: Object.keys(d.boss || {}).length, savedAt: d.savedAt || 0, party: (d.party || []).slice(0, 3).map(m => m.id) };
}
export function deleteSlot(series, slot) { const k = slotKey(series, slot); try { for (const s of ['', '-prev', '-bak', '-bakday']) localStorage.removeItem(k + s); } catch { /* むし */ } }
export function unlockedSeries() {   // えらべる シリーズ(でんどういりの セーブが ひとつでも あれば あたらしい シリーズが ひらく)
  let flags = {}; try { flags = JSON.parse(localStorage.getItem(UNLOCK_KEY) || '{}') || {}; } catch { /* むし */ }
  const hofAny = [1, 2, 3].some(n => { const i = slotInfo('main', n); return i && i.hof; });
  return SERIES.filter(x => !x.needs || flags[x.id] || (x.needs === 'main' && hofAny)).map(x => x.id);
}
export function unlockSeries(id) { try { const f = JSON.parse(localStorage.getItem(UNLOCK_KEY) || '{}') || {}; f[id] = 1; localStorage.setItem(UNLOCK_KEY, JSON.stringify(f)); } catch { /* むし */ } }
export const ECO_KEY = 'chinchilla-ranch-eco';
export const ECO = (() => { try { return localStorage.getItem(ECO_KEY) === '1'; } catch { return false; } })();   // 省エネモード(30fps・かげなし・くさ すくなめ)

const fresh = () => ({
  coins: 0,
  inv: {},   // さいしょは なにも もっていない。あつめて → 売って → たねを買って、だんだん できることが ふえる
  selSeed: null,
  plots: [],   // 自分で草を刈って つくる はたけ {x,z,tilled,crop,days,watered}
  cleared: [],   // 草を かっただけの ばしょ {x,z}。くわで たがやすと はたけになる
  daily: {}, prevDaily: {},   // きょう・きのうの うりあげなど
  lastLevel: null,
  hayCut: {},   // かった ほしくさの はえている ばしょ {番号: もどる日}
  fences: [],   // おいた 木の柵 {x,z,r}  r=0:横むき / 1:たてむき
  wells: [],   // 自分で つくった いど {x,z}
  barns: [], coops: [],   // たてた 牛舎(1つに牛3とう)・鶏小屋(1つにニワトリ6わ) {x,z}
  water: 0,   // バケツの 水(ようりょうは bucketLv で ふえる)
  bucketLv: 0,   // バケツの グレード(0〜4)
  animals: [],   // かった チンチラ(いえの なかで くらす)
  cows: [],      // かった うし(ぼくじょう)
  chickens: [],  // かった ニワトリ(とりごや。偶数番=そと / 奇数番=なか)
  decor: { wall: 1, floor: 3, wallOwn: [1], floorOwn: [3] },
  furni: [{ k: 'table_stools', x: 1000.4, z: 30.6, ry: 0 }, { k: 'hutch', x: 1004.05, z: 29.6, ry: -Math.PI / 2 }, { k: 'workbench', x: 996.2, z: 31.4, ry: Math.PI / 2 }],   // 家の中に おいてある家具
  furniOwn: { table_stools: 1, hutch: 1, workbench: 1 },
  look: { exp: 1, sun: 1, hemi: 1, fog: 1 },   // ひかりの ちょうせい
  dex: {},   // ずかん {アイテムid: 手に入れた数}
  mdex: {},
  mdexClaimed: {},   // うけとった ずかんの ほうしゅう   // モンスターずかん {id: 1=みた / 2=なかまにした}
  trainers: {},
  names: {},   // じぶんで きめた なまえ {'pet:0':..., 'cow:1':..., 'vil:3':..., 'npc:man':...}
  tips: {},   // いちどだけ でる ヒント {key:1}
  villagers: {},   // むらを おとずれる どうぶつたち {id: {last:日, n:はなした日かず}}
  legends: {},   // であった でんせつの モンスター {id: 1}(つかまえた/たおした)
  chests: {},   // あけた たからばこ {キー: あけた日}
  bossRe: {},   // ぬしの さいせん {key: 日}   // たおした トレーナー
  pasture: [],   // ぼくじょうに あずけている なかま {id,lv,exp,bond}
  pastureLast: null,   // きのうの かせぎ
  boss: {},   // たおした ボス
  party: [],   // なかまモンスター {id, lv, exp, hp}。先頭から戦う
  deco: [],   // にわに おいてある かざり {k,x,z,ry}
  decoOwn: {},   // もっている家具の数   // 家の かべがみ・ゆか
  nori: Array.from({ length: 6 }, () => ({ crop: false, days: 0 })),   // のりあみ6つ
  ship: {},   // 出荷箱の中身 {アイテムid: 数}。朝に精算
  eggs: [],   // 鶏小屋の巣にある たまご {nest, slot, gold}
  stats: { win: 0, legend: 0, harvest: 0, feed: 0, fluff: 0, earned: 0, milk: 0, egg: 0, cook: 0, gather: 0, plant: 0, shell: 0, fish: 0, nori: 0 },
  questDone: {},
  questSeen: {},
  hour: 7.5,
  day: 1,
  pos: null,
  cookKinds: {}, cropKinds: {},   // つくった りょうり・そだてた さくもつの しゅるい
  titles: {}, titleSel: null,   // とった しょうごう {id: 1} / つけている しょうごう {id, pos:'pre'|'post'}
  casinoAt: null,   // カジノを たてた ばしょ {x,z}
  where: null,   // いま もりに いるとき { f: フィールド名, x, z }(つづきから で そこから はじめる)
  savedAt: 0,
});
export const state = fresh();
export const hasBadge = (k) => !!(state.boss && state.boss[k]);
const TITLE_CAT = Object.fromEntries(TITLES.map(t => [t.id, t.cat])), CROP_ITEMS = new Set(Object.values(CROPS).map(c => c.item)), DISH_IDS = new Set(RECIPES.map(r => r.id));
const sellCat = (id) => DISH_IDS.has(id) ? 'cook' : CROP_ITEMS.has(id) ? 'farm' : (id === 'milk' || id === 'egg' || id === 'golden_egg') ? 'ranch' : ITEMS[id] && ITEMS[id].kind === 'fish' ? 'fish' : null;
const titleSell = (id) => { const c = sellCat(id); return c ? 1 + 0.02 * Object.keys(state.titles || {}).filter(k => TITLE_CAT[k] === c).length : 1; };   // しょうごう 1つで その ぶんやの うりねが +2%
export const sellOf = (id) => Math.round(((ITEMS[id] && ITEMS[id].sell) || 0) * (hasBadge('lake') ? 1.1 : 1) * titleSell(id) * (festivalNow(state.day) ? 1.25 : 1));   // おまつりの 日は うりね+25%   // みずうみの バッジで うりね+10%
export function reset() { Object.assign(state, fresh()); state.series = getActive().series; }

const listeners = {};
export const bus = {
  on(e, f) { (listeners[e] ||= []).push(f); },
  emit(e, ...a) { (listeners[e] || []).forEach(f => f(...a)); },
};

export function hasSave() { try { return !!(localStorage.getItem(KEY) || localStorage.getItem(KEY + '-prev') || localStorage.getItem(KEY + '-bak')); } catch { return false; } }

// セーブは「いま」→「ひとつまえ(-prev)」→「きのうまでの じどうバックアップ(-bak)」の じゅんで よみこむ(こわれても のこりから ふっかつ)
function readSave() {
  for (const k of [KEY, KEY + '-prev', KEY + '-bak']) {
    try { const raw = localStorage.getItem(k); if (!raw) continue; const d = JSON.parse(raw); if (d && typeof d === 'object') { if (k !== KEY) console.warn('save restored from', k); return d; } } catch { /* つぎへ */ }
  }
  return null;
}
export function load() {
  try {
    const d = readSave();
    if (!d) return false;
    const base = fresh(); Object.assign(state, d); if (!d.barns) state.barns = d.barn ? [d.barn] : []; if (!d.coops) state.coops = d.coop ? [d.coop] : []; delete state.barn; delete state.coop; for (const k of ['cows', 'chickens', 'eggs', 'ship', 'decor', 'nori', 'furni', 'furniOwn', 'deco', 'decoOwn', 'look', 'dex', 'party', 'mdex', 'boss', 'wells', 'cleared', 'fences', 'hayCut', 'cookKinds', 'cropKinds', 'titles']) if (!d[k]) state[k] = base[k]; state.stats = Object.assign(base.stats, d.stats); state.eggs = (state.eggs || []).filter(e => e.nest !== undefined); state.daily = state.daily || {}; state.prevDaily = state.prevDaily || {};
    state.bucketLv = state.bucketLv || 0; state.pasture = state.pasture || []; state.villagers = state.villagers || {}; state.tips = state.tips || {}; state.names = state.names || {}; state.chests = state.chests || {}; state.legends = state.legends || {}; state.bossRe = state.bossRe || {}; state.mdexClaimed = state.mdexClaimed || {}; state.trainers = state.trainers || {};
    if (state.inv && state.inv.friend_ball) { state.inv.nakama_ball = (state.inv.nakama_ball || 0) + state.inv.friend_ball; delete state.inv.friend_ball; }
    return true;
  } catch { return false; }
}

export let SAVE_KEY = KEY;
let saveFailed = false, lastOk = true;
export const lastSaveOk = () => lastOk;
let saveBlocked = false;
export const blockSave = () => { saveBlocked = true; };   // データを よみこんだ あと、よみこみなおす まえに ふるい データで うわがきしない ため
export function save() {
  if (saveBlocked) return true;
  const prevAt = state.savedAt;
  try {
    state.savedAt = Date.now();
    const txt = JSON.stringify(state), old = localStorage.getItem(KEY);
    if (old && old !== txt) { try { localStorage.setItem(KEY + '-prev', old); } catch { /* ひとつまえは ほぞんできなくても いい */ } }
    localStorage.setItem(KEY, txt);
    lastOk = true; if (saveFailed) { saveFailed = false; bus.emit('saveOk'); }
    return true;
  } catch {
    lastOk = false; state.savedAt = prevAt;
    if (!saveFailed) { saveFailed = true; bus.emit('saveFail'); }   // ほぞんできない(ようりょう/プライベート)
    return false;
  }
}

export function resetSave() { try { localStorage.removeItem(KEY); localStorage.removeItem(KEY + '-prev'); } catch {} }

export function addItem(id, n = 1) {
  if (n > 0 && DEX_IDS.has(id)) { const first = !state.dex[id]; state.dex[id] = (state.dex[id] || 0) + n; if (first) bus.emit('dexNew', id); }
  state.inv[id] = (state.inv[id] || 0) + n;
  if (state.inv[id] <= 0) delete state.inv[id];
  bus.emit('inv');
}
export function count(id) { return state.inv[id] || 0; }

const DAILY_KEYS = new Set(['earned', 'milk', 'egg', 'harvest', 'fish']);
export function addStat(k, n = 1) {
  state.stats[k] = (state.stats[k] || 0) + n;
  if (DAILY_KEYS.has(k)) { state.daily = state.daily || {}; state.daily[k] = (state.daily[k] || 0) + n; }
  checkQuests();
  bus.emit('stat', k);
}

// 先頭から順に解放。未達成の最初のクエストが「進行中」
export function activeQuests() {
  const out = [];
  for (const q of QUESTS) {
    if (state.questDone[q.id]) continue;
    out.push(q);
    break;
  }
  return out;
}

export function checkQuests() {
  const a = activeQuests()[0];
  if (!a) return;
  if ((state.stats[a.stat] || 0) >= a.n) {
    state.questDone[a.id] = true;
    state.coins += a.reward.coins || 0;
    for (const [k, v] of Object.entries(a.reward.items || {})) addItem(k, v);
    bus.emit('questDone', a);
    bus.emit('coins');
    const nx = activeQuests()[0];
    if (nx) bus.emit('questNew', nx);
    checkQuests();
  }
}

export { QUESTS, DAY_SECONDS };

// ---- 村レベル: 牧場の発展でバトルのモンスターが少し強くなる ----
export function villagePoints() {
  const done = Object.keys(state.questDone || {}).length, dex = Object.keys(state.dex || {}).length, st = state.stats || {};
  const bld = (state.barns || []).length * 6 + (state.coops || []).length * 5 + (state.wells || []).length * 3 + (state.plots || []).length + (state.cows || []).length * 2 + (state.chickens || []).length + (state.animals || []).length * 3 + Math.min((state.fences || []).length, 100) * 0.1;
  return done * 8 + dex * 2 + Math.min(st.harvest || 0, 100) * 0.3 + Math.min(st.earned || 0, 5000) / 100 + bld;
}
export function villageLevel() { return 1 + Math.floor(Math.sqrt(villagePoints() / 4)); }
export function villageBoost() { return Math.min(0.30, (villageLevel() - 1) * 0.015); }

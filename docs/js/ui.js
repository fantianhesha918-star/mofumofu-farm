import { seasonOf } from './season.js';
import { BUCKET, APPEAR, FIELD_NAMES, HOLD, EVO_STONES, MON_GROUPS, ALL_MONS, CRAFT_RECIPES, MDEX_REWARDS, ELEMENT_REWARD, ABILITIES, BADGES, MON_HEAL, ITEMS, SHOP_SEEDS, CROPS, QUESTS, RECIPES, HEAL, DECOR, SHOP_GOODS, FURNI, DECO, DEX, FIELD_MONS } from './data.js';
import { blockSave, SAVE_KEY, ECO, ECO_KEY, lastSaveOk, state, bus, save, addItem, count, addStat, activeQuests, villageLevel, villagePoints, villageBoost, sellOf, hasBadge } from './state.js';
import { sfx } from './audio.js';

const $ = (s) => document.querySelector(s);
const OUT = '#2c1f14';
export function badgeIcon(b, own) {
  const c = own ? b.color : '#4a4038';
  return `<svg viewBox="0 0 48 48" width="46" height="46" style="flex:none"><path d="M16 30 12 44l12-6 12 6-4-14" fill="${own ? '#c9453a' : '#554a40'}" stroke="#2c1f14" stroke-width="2" stroke-linejoin="round"/><circle cx="24" cy="20" r="15" fill="${c}" stroke="#2c1f14" stroke-width="2.4"/><circle cx="24" cy="20" r="11" fill="none" stroke="${own ? '#ffffffaa' : '#ffffff22'}" stroke-width="1.6"/><path d="${b.sym}" fill="none" stroke="${own ? '#fff' : '#ffffff33'}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" transform="translate(0 0)"/></svg>`;
}
const PLACEABLE = { fence: 'fence', hay_roll: 'roll', paver: 'paver', feeder: 'feeder' };   // バッグから えらぶと さくモード
const ANIMAL_CAP = { cow: 3, hen: 6, chin: 3 };
function animalInfo(k) {   // 買えるか(上限・たてものが あるか)
  const arr = k === 'cow' ? state.cows : k === 'hen' ? state.chickens : state.animals;
  const cap = k === 'cow' ? state.barns.length * 3 : k === 'hen' ? state.coops.length * 6 : ANIMAL_CAP[k];
  const why = k === 'cow' && !state.barns.length ? 'ぼくじょうが ひつよう' : k === 'hen' && !state.coops.length ? 'とりごやが ひつよう' : arr.length >= cap ? (k === 'chin' ? 'もう いっぱいだよ' : k === 'cow' ? 'ぼくじょうが いっぱい。ふやそう' : 'とりごやが いっぱい。ふやそう') : '';
  return { n: arr.length, cap, why };
}
// ねだんは ふえるほど あがる(牛舎・鶏小屋は +200ずつ、牛は 200・400…1000まで、ニワトリは 100・200…500まで)
function priceOf(g) {
  const bought = (k) => k === 'kit_barn' ? state.barns.length + count('kit_barn') - state.barns.filter(b => b.moving).length : k === 'kit_coop' ? state.coops.length + count('kit_coop') - state.coops.filter(b => b.moving).length : 0;
  if (g.id === 'kit_barn' || g.id === 'kit_coop') return g.price + 200 * bought(g.id);
  if (g.id === 'a_cow') return Math.min(1000, g.price * (state.cows.length + 1));
  if (g.id === 'a_hen') return Math.min(500, g.price * (state.chickens.length + 1));
  return g.price;
}
let movesIdx = 0;

// ---- 手描き線画アイコン(絵文字は使わない) ----
export function icon(kind, color = '#f4ead2') {
  const st = `stroke="${OUT}" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round"`;
  let b = '';
  switch (kind) {
    case 'seed': b = `<path d="M16 6c6 4 8 11 2 19-6-2-9-9-2-19z" fill="${color}" ${st}/><path d="M16 9c0 5 0 9 2 15" fill="none" ${st}/>`; break;
    case 'turnip': b = `<path d="M16 7c-1-3-4-3-5-1M16 7c1-3 4-3 5-1M16 7v3" fill="none" stroke="#4a8a34" stroke-width="2" stroke-linecap="round"/><path d="M7 15c0-4 4-6 9-6s9 2 9 6c0 6-5 11-9 13-4-2-9-7-9-13z" fill="${color}" ${st}/><path d="M9 14c2-3 12-3 14 0" fill="#c58ad0" ${st} opacity=".9"/>`; break;
    case 'carrot': b = `<path d="M13 8c-2-3-1-5 1-5M16 8c0-3 1-5 3-4M19 9c2-2 4-2 5 0" fill="none" stroke="#4a8a34" stroke-width="2" stroke-linecap="round"/><path d="M10 9c3-3 9-3 12 0-1 7-4 14-6 20-2-6-5-13-6-20z" fill="${color}" ${st}/><path d="M13 14h3M17 19h3M14 22h2" stroke="#b85a14" stroke-width="1.4" stroke-linecap="round"/>`; break;
    case 'tomato': b = `<circle cx="16" cy="18" r="10" fill="${color}" ${st}/><path d="M16 8l-3 3 3-1 3 1zM16 8v3M12 10l4 2 4-2" fill="#5aa43a" ${st}/><path d="M11 16c1-2 2-3 4-3" fill="none" stroke="#fff8" stroke-width="1.6" stroke-linecap="round"/>`; break;
    case 'cabbage': b = `<path d="M5 18c0-8 5-12 11-12s11 4 11 12c0 5-5 9-11 9S5 23 5 18z" fill="${color}" ${st}/><path d="M16 7c-3 4-3 12 0 19M10 10c-2 5 0 11 6 15M22 10c2 5 0 11-6 15" fill="none" stroke="#5a9a3a" stroke-width="1.3"/>`; break;
    case 'pumpkin': b = `<path d="M15 6c0-2 2-3 4-3" fill="none" stroke="#4a7a2a" stroke-width="2.2" stroke-linecap="round"/><ellipse cx="16" cy="18" rx="12" ry="9.5" fill="${color}" ${st}/><path d="M16 9v18M10 10c-3 5-3 11 0 16M22 10c3 5 3 11 0 16" fill="none" stroke="#b86010" stroke-width="1.4"/>`; break;
    case 'eggplant': b = `<path d="M20 5c3-1 5 1 5 3l-4 3z" fill="#5aa43a" ${st}/><path d="M21 9c4 1 6 5 3 11-3 6-9 9-14 7-3-1-3-4 0-7 3-2 5-6 6-10z" fill="${color}" ${st}/><path d="M12 22c2 0 5-3 6-6" fill="none" stroke="#fff6" stroke-width="1.5" stroke-linecap="round"/>`; break;
    case 'corn': b = `<path d="M16 3c-5 4-7 9-7 14 0 6 3 11 7 12 4-1 7-6 7-12 0-5-2-10-7-14z" fill="${color}" ${st}/><path d="M16 5v22M12 10h8M11 15h10M11 20h10" stroke="#c09a1a" stroke-width="1.2"/><path d="M9 29c3-8 5-12 7-14M23 29c-3-8-5-12-7-14" fill="none" stroke="#5aa43a" stroke-width="2.4" stroke-linecap="round"/>`; break;
    case 'puff': b = `<path d="M16 17v11" stroke="#8a6a3a" stroke-width="2" stroke-linecap="round"/><circle cx="16" cy="12" r="8" fill="${color}" ${st}/><path d="M16 12l-5-4M16 12l5-4M16 12v-6M16 12l-6 2M16 12l6 2" stroke="#b9ad90" stroke-width="1.2" stroke-linecap="round"/>`; break;
    case 'berry': b = `<circle cx="11" cy="20" r="5.5" fill="${color}" ${st}/><circle cx="21" cy="20" r="5.5" fill="${color}" ${st}/><circle cx="16" cy="12" r="5.5" fill="${color}" ${st}/><path d="M16 6c3-3 6-2 7 0-3 1-5 1-7 0z" fill="#5aa43a" ${st}/>`; break;
    case 'mushroom': b = `<path d="M12 18h8l1 9h-10z" fill="#f4e8d0" ${st}/><path d="M4 18c0-8 6-12 12-12s12 4 12 12z" fill="${color}" ${st}/><circle cx="12" cy="13" r="1.8" fill="#fff"/><circle cx="19" cy="11" r="1.6" fill="#fff"/><circle cx="22" cy="15" r="1.4" fill="#fff"/>`; break;
    case 'acorn': b = `<path d="M10 14c0 9 3 14 6 14s6-5 6-14z" fill="${color}" ${st}/><path d="M8 14c0-5 4-7 8-7s8 2 8 7z" fill="#7a5028" ${st}/><path d="M16 7V4" ${st} fill="none"/>`; break;
    case 'hay': b = `<rect x="6" y="9" width="20" height="16" rx="3" fill="${color}" ${st}/><path d="M6 14h20M6 20h20M12 9v16M20 9v16" stroke="#a88a2a" stroke-width="1.2"/><path d="M9 9l-2-4M16 9v-5M23 9l2-4" stroke="#c9a840" stroke-width="1.6" stroke-linecap="round"/>`; break;
    case 'milk': b = `<path d="M12 4h8v4l3 4v15a2 2 0 0 1-2 2H11a2 2 0 0 1-2-2V12l3-4z" fill="${color}" ${st}/><path d="M9 16h14M9 22h14" fill="none" stroke="#9ab4d8" stroke-width="1.4"/><path d="M12 4h8" ${st}/>`; break;
    case 'egg': b = `<path d="M16 4c5 0 9 8 9 14a9 9 0 0 1-18 0c0-6 4-14 9-14z" fill="${color}" ${st}/><path d="M11 17c0-3 2-6 4-7" fill="none" stroke="#fff9" stroke-width="1.6" stroke-linecap="round"/>`; break;
    case 'fish': b = `<path d="M3 16c4-7 12-9 18-5l6-5v20l-6-5c-6 4-14 2-18-5z" fill="${color}" ${st}/><circle cx="9" cy="14" r="1.6" fill="#2c1f14"/><path d="M14 11c2 3 2 7 0 10" fill="none" stroke="#fff8" stroke-width="1.4" stroke-linecap="round"/>`; break;
    case 'shell': b = `<path d="M4 22c0-10 5-16 12-16s12 6 12 16c0 3-5 5-12 5S4 25 4 22z" fill="${color}" ${st}/><path d="M16 7v19M10 9c-2 5-2 11 0 16M22 9c2 5 2 11 0 16" fill="none" stroke="#c89880" stroke-width="1.3"/>`; break;
    case 'seaweed': b = `<path d="M10 28c-3-6 3-9 0-14s2-8 2-10M16 28c-3-6 3-8 0-13s2-7 3-9M22 28c-3-5 3-8 0-12" fill="none" stroke="${color}" stroke-width="3.2" stroke-linecap="round"/><path d="M10 28c-3-6 3-9 0-14s2-8 2-10M16 28c-3-6 3-8 0-13s2-7 3-9M22 28c-3-5 3-8 0-12" fill="none" stroke="${OUT}" stroke-width="0.9" stroke-linecap="round"/>`; break;
    case 'nori': b = `<rect x="5" y="7" width="22" height="18" rx="2" fill="${color}" ${st}/><path d="M5 13h22M5 19h22M12 7v18M20 7v18" stroke="#4a6a50" stroke-width="1"/>`; break;
    case 'sickle': b = `<path d="M6 27 22 11" stroke="#7a4a22" stroke-width="3.2" stroke-linecap="round"/><path d="M20 6c-7 0-12 5-12 12 4-4 9-5 14-4 2-3 2-6-2-8z" fill="#cfd6dc" ${st}/>`; break;
    case 'hoe': b = `<path d="M7 28 21 8" stroke="#7a4a22" stroke-width="3.2" stroke-linecap="round"/><path d="M17 6l11 7-3 4-11-6z" fill="#b8c0c8" ${st}/>`; break;
    case 'bucket': b = `<path d="M7 11h18l-2 16H9z" fill="${color}" ${st}/><ellipse cx="16" cy="11" rx="9" ry="3" fill="#4fb0d6" ${st}/><path d="M8 11c0-8 16-8 16 0" fill="none" stroke="#2c1f14" stroke-width="1.6"/>`; break;
    case 'paver': b = `<path d="M3 20 11 9h18l-8 11z M3 20h18l8-11M3 27h18V20" fill="${color}" ${st}/><path d="M12 14l-5 6M17 20v7" fill="none" ${st}/>`; break;
    case 'feeder': b = `<path d="M3 14h26l-3 12H6z" fill="${color}" ${st}/><path d="M6 14c2-5 6-5 8 0s6-5 9 0" fill="#e2c25a" ${st}/>`; break;
    case 'fence': b = `<path d="M4 11v16M16 9v18M28 11v16" stroke="#7a4a22" stroke-width="3.4" stroke-linecap="round"/><path d="M3 14h26M3 22h26" stroke="${color}" stroke-width="3" stroke-linecap="round"/>`; break;
    case 'animal': b = `<path d="M8 12c-2-6 2-9 5-5M24 12c2-6-2-9-5-5" fill="${color}" ${st}/><ellipse cx="16" cy="18" rx="10" ry="9" fill="${color}" ${st}/><circle cx="12" cy="17" r="1.4" fill="#2c1f14"/><circle cx="20" cy="17" r="1.4" fill="#2c1f14"/><path d="M14.5 21.5q1.5 1.3 3 0" fill="none" stroke="#2c1f14" stroke-width="1.4" stroke-linecap="round"/>`; break;
    case 'kit': b = `<path d="M4 12 16 5l12 7v14H4z" fill="${color}" ${st}/><path d="M4 12h24M16 5v21" fill="none" ${st}/><path d="M13 19h6" stroke="#2c1f14" stroke-width="2" stroke-linecap="round"/>`; break;
    case 'rod': b = `<path d="M5 28 25 5" stroke="#a8743a" stroke-width="3" stroke-linecap="round"/><path d="M25 5c4 4 2 12-2 15" fill="none" stroke="#2c1f14" stroke-width="1.2"/><circle cx="23" cy="22" r="3" fill="#e84a3a" ${st}/>`; break;
    case 'can': b = `<ellipse cx="16" cy="8" rx="8" ry="3" fill="#cfd6dc" ${st}/><path d="M8 8v17c0 3 4 4 8 4s8-1 8-4V8" fill="${color}" ${st}/><path d="M8 13c0 3 4 4 8 4s8-1 8-4M8 20c0 3 4 4 8 4s8-1 8-4" fill="none" stroke="#7a8590" stroke-width="1.3"/><path d="M24 11c4 0 4 6 0 6" fill="none" ${st}/>`; break;
    case 'grain': b = `<path d="M9 10c0-3 3-5 7-5s7 2 7 5l3 15c0 2-4 3-10 3S6 27 6 25z" fill="${color}" ${st}/><path d="M10 11c2 1 10 1 12 0" fill="none" ${st}/><circle cx="13" cy="19" r="1.3" fill="#8a6a2a"/><circle cx="18" cy="21" r="1.3" fill="#8a6a2a"/><circle cx="16" cy="16" r="1.3" fill="#8a6a2a"/>`; break;
    case 'bowl': b = `<path d="M4 15h24c0 7-5 12-12 12S4 22 4 15z" fill="#d9c9a8" ${st}/><path d="M6 15c1-3 5-4 10-4s9 1 10 4z" fill="${color}" ${st}/><path d="M12 8c-1-2 1-3 0-5M17 8c-1-2 1-3 0-5M22 8c-1-2 1-3 0-5" fill="none" stroke="#fff9" stroke-width="1.4" stroke-linecap="round"/>`; break;
    case 'plate': b = `<ellipse cx="16" cy="22" rx="13" ry="5" fill="#e8dcc0" ${st}/><path d="M6 20c0-8 5-12 10-12s10 4 10 12c-3 3-17 3-20 0z" fill="${color}" ${st}/><path d="M11 15c2-2 5-3 9-2" fill="none" stroke="#fff8" stroke-width="1.5" stroke-linecap="round"/>`; break;
    case 'charm': b = `<path d="M16 2 19 8 25 6 24 13 29 16 24 19 25 26 19 24 16 30 13 24 7 26 8 19 3 16 8 13 7 6 13 8z" fill="${color}" ${st}/><circle cx="16" cy="16" r="5" fill="#fff8" ${st}/>`; break;
    case 'gem': b = `<path d="M16 3 27 13 16 29 5 13z" fill="${color}" ${st}/><path d="M5 13h22M11 13l5-10 5 10M11 13l5 16 5-16" fill="none" stroke="#fff9" stroke-width="1.2" stroke-linejoin="round"/>`; break;
    case 'feather': b = `<path d="M7 27C6 14 14 5 26 5c0 12-7 20-17 20" fill="${color}" ${st}/><path d="M7 27 21 11" stroke="#fff9" stroke-width="1.4" stroke-linecap="round"/>`; break;
    case 'fang': b = `<path d="M9 5c-2 9 1 18 7 24 6-6 9-15 7-24-5 3-9 3-14 0z" fill="${color}" ${st}/><path d="M13 10c0 6 1 11 3 15" fill="none" stroke="#fff9" stroke-width="1.3" stroke-linecap="round"/>`; break;
    case 'jar': b = `<rect x="8" y="9" width="16" height="18" rx="4" fill="${color}" ${st}/><rect x="9" y="4" width="14" height="6" rx="2" fill="#e8dcc0" ${st}/><path d="M12 15h8" stroke="#fff8" stroke-width="1.6" stroke-linecap="round"/>`; break;
    default: b = `<circle cx="16" cy="16" r="9" fill="${color}" ${st}/>`;
  }
  return `<svg viewBox="0 0 32 32">${b}</svg>`;
}
export const itemIcon = (id) => ITEMS[id].ball ? `<img src="quest/assets/items/${ITEMS[id].ball.icon}.webp" alt="" style="width:36px;height:36px;flex:none;object-fit:contain">` : icon(ITEMS[id].kind, ITEMS[id].color);

// ---- 通知 ----
export function toast(kind, title, sub = '', ms = 3600) {
  const el = document.createElement('div'); el.className = 'toast';
  el.innerHTML = `<div class="k">${kind}</div><div class="t">${title}</div>${sub ? `<div class="s">${sub}</div>` : ''}`;
  const box = $('#toasts'); box.appendChild(el); while (box.children.length > 3) box.firstChild.remove();
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 600); }, ms);
}
const feeds = {};
export function feed(id, n) {
  const key = id; let f = feeds[key];
  if (f && f.el.isConnected) { f.n += n; f.el.querySelector('b').textContent = `×${f.n}`; clearTimeout(f.t); }
  else { const el = document.createElement('div'); el.className = 'feed'; el.innerHTML = `${itemIcon(id)}<span>${ITEMS[id].name}</span><b>×${n}</b>`; $('#itemfeed').appendChild(el); f = feeds[key] = { el, n, t: 0 }; }
  f.t = setTimeout(() => { f.el.classList.add('out'); setTimeout(() => f.el.remove(), 500); }, 2400);
}

// ---- HUD ----
let lastPrompt = '';
export function setPrompt(p) {
  const el = $('#prompt'), act = $('#btnAct');
  if (!p) { el.hidden = true; act.classList.remove('ready'); $('#actLabel').textContent = 'アクション'; lastPrompt = ''; return; }
  const sig = p.label + '|' + (p.sub || '') + '|' + (p.can ? 1 : 0);
  if (sig !== lastPrompt) {
    el.hidden = false; el.classList.toggle('dim', !p.can); el.querySelector('b').textContent = p.label; el.querySelector('small').textContent = p.sub || '';
    el.querySelector('small').style.display = p.sub ? 'block' : 'none'; lastPrompt = sig;
    $('#actLabel').textContent = p.short || p.label.slice(0, 7);
  }
  act.classList.toggle('ready', !!p.can);
}
export function setLevel() {
  const lv = villageLevel(), p = villagePoints(), lo = 4 * (lv - 1) ** 2, hi = 4 * lv * lv, t = $('#lvTxt'), b = $('#lvBar'); if (!t || !b) return;
  const s = `むらレベル ${lv}`; if (t.textContent !== s) t.textContent = s; b.style.width = Math.max(4, Math.min(100, (p - lo) / (hi - lo) * 100)) + '%';
}
export function setStamina(v, low) { const e = $('#stam'); if (!e) return; e.style.width = Math.max(0, v) + '%'; e.classList.toggle('low', low); }
export function setCoins() { $('#coins').textContent = state.coins; }
export function setClock() {
  const h = Math.floor(state.hour), m = Math.floor((state.hour - h) * 60 / 10) * 10;
  const slot = state.hour < 5 ? 'よる' : state.hour < 11 ? 'あさ' : state.hour < 16 ? 'ひる' : state.hour < 19 ? 'ゆうがた' : 'よる';
  const se = seasonOf(state.day); $('#clock').textContent = `${se.name}${se.festival ? '・まつり' : ''} ${state.day}日目 ${slot} ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
export function setGoal() {
  const q = activeQuests()[0], el = $('#goal');
  if (!q) { el.innerHTML = '<small>MISSION</small><b>ぜんぶクリア! のんびりすごそう</b>'; return; }
  const v = Math.min(q.n, state.stats[q.stat] || 0);
  el.innerHTML = `<small>QUEST</small><b>${q.title}</b><em>${v} / ${q.n}</em>`;
}

// ---- ミニマップ ----
const MM_SCALE = 3.4, MM_HALF = 92; let mmBase = null;
export function buildMinimap(world) {
  const S = MM_HALF * 2 * MM_SCALE, c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d');
  const P = (x, z) => [(x + MM_HALF) * MM_SCALE, (z + MM_HALF) * MM_SCALE];
  g.fillStyle = '#7fae52'; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 3000; i++) { g.fillStyle = `hsla(${85 + Math.random() * 30},40%,${40 + Math.random() * 20}%,.25)`; g.fillRect(Math.random() * S, Math.random() * S, 6, 6); }
  // 外周の山
  const [cx, cy] = P(0, 0); const grd = g.createRadialGradient(cx, cy, 64 * MM_SCALE, cx, cy, 86 * MM_SCALE); grd.addColorStop(0, '#0000'); grd.addColorStop(.5, '#8a8678'); grd.addColorStop(1, '#f2f4f8');
  g.fillStyle = grd; g.fillRect(0, 0, S, S);
  // 海と浜
  { const [cx2, cy2] = P(0, 0), A = 0.46, W = 0.6; g.fillStyle = '#e6d6a6'; g.beginPath(); g.arc(cx2, cy2, 83 * MM_SCALE, A - W, A + W); g.arc(cx2, cy2, 64 * MM_SCALE, A + W, A - W, true); g.closePath(); g.fill(); g.fillStyle = '#4fb0d6'; g.beginPath(); g.arc(cx2, cy2, 92 * MM_SCALE, A - W, A + W); g.arc(cx2, cy2, 83 * MM_SCALE, A + W, A - W, true); g.closePath(); g.fill(); g.strokeStyle = '#6a4a2a'; g.lineWidth = 4; g.beginPath(); g.moveTo(...P(Math.cos(A) * 73, Math.sin(A) * 73)); g.lineTo(...P(Math.cos(A) * 90, Math.sin(A) * 90)); g.stroke(); }
  // 川
  if (world.riverPts) { g.strokeStyle = '#4fb0d6'; g.lineWidth = 6.4 * MM_SCALE; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); world.riverPts.forEach((p, i) => { const [a, b] = P(p.x, p.z); i ? g.lineTo(a, b) : g.moveTo(a, b); }); g.stroke(); }
  // 森
  g.fillStyle = '#3f7a42'; for (const [x, z] of world.spots.pines) { const [px, py] = P(x, z); g.beginPath(); g.arc(px, py, 1.9 * MM_SCALE, 0, 7); g.fill(); }
  g.fillStyle = '#4f9a3a'; for (const [x, z] of world.spots.oaks) { const [px, py] = P(x, z); g.beginPath(); g.arc(px, py, 2.2 * MM_SCALE, 0, 7); g.fill(); }
  // 草原
  { const [px, py] = P(-4, 56); const gr = g.createRadialGradient(px, py, 2, px, py, 26 * MM_SCALE); gr.addColorStop(0, '#d8e8a0cc'); gr.addColorStop(1, '#d8e8a000'); g.fillStyle = gr; g.beginPath(); g.arc(px, py, 26 * MM_SCALE, 0, 7); g.fill(); g.fillStyle = '#fff'; for (const [x, z] of world.spots.dandelions.slice(0, 80)) { const [a, b] = P(x, z); g.fillRect(a - 1.5, b - 1.5, 3, 3); } }
  // 麦畑
  { const [a, b] = P(16, -44); g.fillStyle = '#e0bc50'; g.fillRect(a, b, 24 * MM_SCALE, 16 * MM_SCALE); }
  // 道
  g.strokeStyle = '#c9a878'; g.lineCap = 'round'; g.lineJoin = 'round'; g.lineWidth = 2.6 * MM_SCALE;
  for (const pts of world.paths) { g.beginPath(); pts.forEach((p, i) => { const [a, b] = P(p.x, p.z); i ? g.lineTo(a, b) : g.moveTo(a, b); }); g.stroke(); }
  // 建物
  const rect = (x0, z0, w, d, col, line) => { const [a, b] = P(x0, z0); g.fillStyle = col; g.fillRect(a, b, w * MM_SCALE, d * MM_SCALE); if (line) { g.strokeStyle = line; g.lineWidth = 2; g.strokeRect(a, b, w * MM_SCALE, d * MM_SCALE); } };
  rect(-20.5, -17.5, 9, 7, '#b0603a', '#4a2a18'); rect(23.5, -7.2, 6, 4, '#9a4a32', '#4a2a18'); rect(5, -9, 3.6, 1.8, '#d8503a', '#4a2a18');
  
  { const [a, b] = P(46, -38); g.fillStyle = '#e8e0cc'; g.beginPath(); g.arc(a, b, 3 * MM_SCALE, 0, 7); g.fill(); g.strokeStyle = '#4a2a18'; g.lineWidth = 2; g.stroke(); }
  mmBase = c;
}
const TARGETS = { sea: [68, 33], pier: [72, 35.5], tane: [-2.5, -7], cows: [30, -3], coop: [2, -17], meadow: [-4, 60], field: [-10.5, 3.8], pen: [24, -3], shop: [6.5, -6], house: [-16, -10] };
export function drawMinimap(px, pz, heading, qTarget) {
  const cv = $('#mmc'), g = cv.getContext('2d'), W = cv.width, R = 30; if (!mmBase) return;
  g.clearRect(0, 0, W, W); g.save(); g.beginPath(); g.arc(W / 2, W / 2, W / 2, 0, 7); g.clip();
  const s = W / (R * 2) , bx = (px + MM_HALF) * MM_SCALE, bz = (pz + MM_HALF) * MM_SCALE, half = R * MM_SCALE;
  g.drawImage(mmBase, bx - half, bz - half, half * 2, half * 2, 0, 0, W, W);
  // クエスト目標
  let t = TARGETS[qTarget];
  const pl = state.plots[0], bn = state.barns[0], cp = state.coops[0];
  if (qTarget === 'field') t = pl ? [pl.x, pl.z] : TARGETS.shop;
  else if (qTarget === 'cows') t = bn ? [bn.x, bn.z] : TARGETS.shop;
  else if (qTarget === 'coop') t = cp ? [cp.x, cp.z] : TARGETS.shop;
  // つくった はたけ・いど・牛舎・鶏小屋を 地図に
  { const P2 = (x, z) => [W / 2 + (x - px) * s, W / 2 + (z - pz) * s];
    g.fillStyle = '#6a4a2a'; for (const p of state.plots) { const [a, b] = P2(p.x - 1.5, p.z - 1.5); g.fillRect(a, b, 3 * s, 3 * s); }
    g.fillStyle = '#4fb0d6'; for (const w of state.wells) { if (w.moving) continue; const [a, b] = P2(w.x, w.z); g.beginPath(); g.arc(a, b, 1.5 * s, 0, 7); g.fill(); }
    for (const bn of state.barns) { if (bn.moving) continue; const [a, b] = P2(bn.x - 11, bn.z - 4.5); g.strokeStyle = '#6a4a2a'; g.lineWidth = 2; g.strokeRect(a, b, 11 * s, 9 * s); g.fillStyle = '#b0603a'; g.fillRect(...P2(bn.x + 4.5, bn.z - 4.9), 5.8 * s, 9.8 * s); }
    for (const cp of state.coops) { if (cp.moving) continue; g.fillStyle = '#d8a860'; g.fillRect(...P2(cp.x - 2.1, cp.z - 4.5), 4.2 * s, 3.6 * s); } }
  if (t) {
    let dx = (t[0] - px) * s, dz = (t[1] - pz) * s; const l = Math.hypot(dx, dz), lim = W / 2 - 18; const edge = l > lim;
    if (edge) { dx = dx / l * lim; dz = dz / l * lim; }
    g.translate(W / 2 + dx, W / 2 + dz); g.fillStyle = '#ffd24a'; g.strokeStyle = '#4a2a18'; g.lineWidth = 3;
    g.beginPath(); if (edge) { g.rotate(Math.atan2(dz, dx) + Math.PI / 2); g.moveTo(0, -11); g.lineTo(9, 7); g.lineTo(0, 3); g.lineTo(-9, 7); g.closePath(); }
    else { g.moveTo(0, 8); g.lineTo(-8, -6); g.arc(0, -8, 8.6, Math.PI * 0.85, Math.PI * 0.15, false); g.closePath(); }
    g.fill(); g.stroke(); g.setTransform(1, 0, 0, 1, 0, 0);
  }
  // プレイヤー(向きの矢印)
  g.translate(W / 2, W / 2); g.rotate(-heading + Math.PI); g.fillStyle = '#ff8a2a'; g.strokeStyle = '#fff'; g.lineWidth = 3;
  g.beginPath(); g.moveTo(0, -13); g.lineTo(10, 10); g.lineTo(0, 5); g.lineTo(-10, 10); g.closePath(); g.stroke(); g.fill();
  g.restore();
}

// ---- パネル ----
let panelKind = null, shopTab = 'buy', shopId = 'yorozu';
export const panelOpen = () => panelKind !== null;
export function closePanel() { if (!panelKind) return; panelKind = null; $('#panel').hidden = true; sfx('ui'); }
export function openPanel(kind, opt) { panelKind = kind; if (kind === 'shop') { shopId = opt || 'yorozu'; shopTab = shopId === 'tane' ? 'buy' : 'sell'; } $('#panel').hidden = false; sfx('ui'); renderPanel(); }
export function togglePanel(kind) { panelKind === kind ? closePanel() : openPanel(kind); }
const rewardText = (r) => [r.coins ? `${r.coins}コイン` : '', ...Object.entries(r.items || {}).map(([k, v]) => `${ITEMS[k].name}×${v}`)].filter(Boolean).join(' / ');

// ---- バッグの しゅるいわけ ----
const BAG_TABS = [['all', 'すべて'], ['tool', 'どうぐ'], ['food', 'たべもの'], ['seed', 'たね'], ['battle', 'バトル'], ['other', 'そのほか']];
const FOOD_KINDS = new Set(['fish', 'plate', 'bowl', 'carrot', 'cabbage', 'pumpkin', 'tomato', 'corn', 'eggplant', 'berry', 'mushroom', 'milk', 'egg', 'nori', 'seaweed', 'grain', 'jar']);
const BATTLE_KINDS = new Set(['ball', 'charm', 'gem', 'feather', 'fang', 'puff']);
function bagCat(id) {
  const it = ITEMS[id] || {};
  if (it.tool || ['sickle', 'hoe', 'rod', 'bucket', 'can', 'kit', 'animal'].includes(it.kind)) return 'tool';
  if (it.kind === 'seed' || id.startsWith('seed_')) return 'seed';
  if (HEAL[id] || FOOD_KINDS.has(it.kind)) return 'food';
  if (BATTLE_KINDS.has(it.kind) || it.battle || HOLD[id] || EVO_STONES[id]) return 'battle';
  return 'other';
}
let bagTab = 'all';
function bucketRow() {   // バケツの グレードアップ
  if (count('bucket') < 1) return '';
  const lv = state.bucketLv || 0, max = BUCKET.caps.length - 1, cap = BUCKET.caps[lv];
  if (lv >= max) return `<div class="row">${itemIcon('bucket')}<div class="grow">バケツ(さいこうグレード)<small>みずが ${cap}かいぶん はいるよ</small></div><span class="price">MAX</span></div>`;
  const next = BUCKET.caps[lv + 1], p = BUCKET.prices[lv + 1];
  return `<div class="row">${itemIcon('bucket')}<div class="grow">バケツを グレードアップ<small>みずが ${cap}かいぶん → ${next}かいぶん(グレード ${lv + 1}→${lv + 2})</small></div><span class="price">${p}</span><button class="pill" data-bup="1" ${state.coins < p ? 'disabled' : ''}>あげる</button></div>`;
}
function renderPanel() {
  if (!panelKind) return; const body = $('#panel .body'), h2 = $('#panel h2');
  if (panelKind === 'bag') {
    h2.textContent = 'バッグ';
    const all = Object.keys(state.inv).filter(i => ITEMS[i] && state.inv[i] > 0), seeds = all.some(i => i.startsWith('seed_')), ids = bagTab === 'all' ? all : all.filter(i => bagCat(i) === bagTab);
    const nTab = (k) => k === 'all' ? all.length : all.filter(i => bagCat(i) === k).length;
    body.innerHTML = `<div class="tabs bagtabs">${BAG_TABS.map(([k, n]) => `<button data-bt="${k}" class="${bagTab === k ? 'on' : ''}">${n}<small>${nTab(k)}</small></button>`).join('')}</div><p class="hint">所持コイン: <b style="color:var(--gold2)">${state.coins}</b>${seeds ? '　　たねをタップすると、畑でまくたねを えらべるよ。' : ''}　りょうりを タップすると たべて たいりょくが かいふくするよ。</p>` +
      (ids.length ? `<div class="grid">${ids.map(id => `<div class="cell ${id.startsWith('seed_') || HEAL[id] || PLACEABLE[id] ? 'btn' : ''} ${state.selSeed === id ? 'sel' : ''}" data-id="${id}">${itemIcon(id)}<div class="ct">${state.inv[id]}</div><div class="nm">${ITEMS[id].name}</div>${state.selSeed === id ? '<small>えらんでいる</small>' : PLACEABLE[id] ? '<small>おく</small>' : HEAL[id] ? '<small>たべる +' + HEAL[id] + '</small>' : ''}</div>`).join('')}</div>` : `<p class="hint">${bagTab === 'all' ? 'まだ なにも もっていないよ。' : 'この しゅるいは まだ もっていないよ。'}</p>`);
    body.querySelectorAll('[data-bt]').forEach(b => b.onclick = () => { bagTab = b.dataset.bt; sfx('ui'); renderPanel(); });
    body.querySelectorAll('.cell.btn').forEach(c => c.onclick = () => { const id = c.dataset.id; if (PLACEABLE[id]) { closePanel(); bus.emit('placeStart', PLACEABLE[id]); return; } if (HEAL[id]) { addItem(id, -1); bus.emit('eat', HEAL[id], id); renderPanel(); return; } state.selSeed = id; sfx('ui'); renderPanel(); });
  } else if (panelKind === 'quest') {
    h2.textContent = 'クエスト';
    const done = QUESTS.filter(q => state.questDone[q.id]), act = activeQuests();
    body.innerHTML = act.map(q => { const v = Math.min(q.n, state.stats[q.stat] || 0); return `<div class="quest"><h3>${q.title}</h3><p>${q.desc}</p><div class="pg"><i style="width:${v / q.n * 100}%"></i></div><div class="rw">しんこう ${v} / ${q.n}　ほうしゅう: ${rewardText(q.reward)}</div></div>`; }).join('') +
      (done.length ? `<p class="hint" style="margin-top:14px">クリアずみ</p>` + done.map(q => `<div class="quest done"><h3>${q.title}</h3></div>`).join('') : '') +
      (!act.length ? '<p class="hint">ぜんぶクリアしました! つづきは これから。</p>' : '');
  } else if (panelKind === 'menu') {
    h2.textContent = 'メニュー';
    const t = state.savedAt ? new Date(state.savedAt) : null, ts = t ? `${t.getHours()}:${String(t.getMinutes()).padStart(2, '0')}` : 'まだ';
    body.innerHTML = `<p class="hint">オートセーブ: 10秒ごと / さいごに セーブした時こく ${ts}</p>
      <div class="row menurow" data-m="bag"><div class="grow">バッグ<small>もちものを みる・たべる</small></div><span class="chev">›</span></div>
      <div class="row menurow" data-m="quest"><div class="grow">クエスト<small>いまの もくひょう</small></div><span class="chev">›</span></div>
      <div class="row menurow" data-m="furni"><div class="grow">かぐを ならべる<small>おうちの なかで かぐを おく・うごかす</small></div><span class="chev">›</span></div>
      <div class="row menurow" data-m="yard"><div class="grow">にわの かざり<small>むらに かざりを おく・うごかす</small></div><span class="chev">›</span></div>
      <div class="row menurow" data-m="dex"><div class="grow">ずかん<small>あつめた さかな・やさい・りょうり</small></div><span class="chev">›</span></div>
      <div class="row menurow" data-m="party"><div class="grow">なかま<small>モンスター・むらレベル</small></div><span class="chev">›</span></div>
      <div class="row menurow" data-m="mdex"><div class="grow">モンスターずかん<small>であった モンスター</small></div><span class="chev">›</span></div>
      <div class="row menurow" data-m="names"><div class="grow">なまえを かえる<small>ペット・うし・むらの ひと・どうぶつ</small></div><span class="chev">›</span></div>
      <div class="row menurow" data-m="howto"><div class="grow">あそびかた<small>ゲームの すすめかた・バトルの コツ</small></div><span class="chev">›</span></div>
      <div class="row menurow" data-m="settings"><div class="grow">せってい<small>おと・バトルの はやさ・くさの りょう・ひかり</small></div><span class="chev">›</span></div>
      <div class="row menurow" data-m="village"><div class="grow">むらの ようす<small>むらレベル・うりあげ・どうぶつ</small></div><span class="chev">›</span></div>
      <div class="row menurow" data-m="types"><div class="grow">タイプそうせいひょう<small>どの タイプが どれに つよい・よわい</small></div><span class="chev">›</span></div>
      <div class="row menurow" data-m="badge"><div class="grow">バッジ<small>ぬしを たおすと もらえる・おんけい</small></div><span class="chev">›</span></div>
      <div class="row menurow" data-m="save"><div class="grow">${saveRowText()}</div><span class="chev">›</span></div>
      <div class="row menurow" data-m="title"><div class="grow">タイトルへ もどる<small>セーブして ゲームを おわる</small></div><span class="chev">›</span></div>`;
    body.querySelectorAll('.menurow').forEach(r => r.onclick = () => {
      const m = r.dataset.m;
      if (m === 'bag') openPanel('bag'); else if (m === 'quest') openPanel('quest');
      else if (m === 'dex') openPanel('dex');
      else if (m === 'party') openPanel('party');
      else if (m === 'mdex') openPanel('mdex');
      else if (m === 'pasture') openPanel('pasture');
      else if (m === 'settings') openPanel('settings');
      else if (m === 'howto') openPanel('howto');
      else if (m === 'names') openPanel('names');
      else if (m === 'sound') openPanel('sound');
      else if (m === 'village') openPanel('village');
      else if (m === 'badge') openPanel('badge');
      else if (m === 'types') openPanel('types');
      else if (m === 'gfx') openPanel('gfx');
      else if (m === 'look') openPanel('look');
      else if (m === 'yard') { closePanel(); bus.emit('yardStart'); }
      else if (m === 'furni') { closePanel(); bus.emit('furniStart'); }
      else if (m === 'save') { bus.emit('saveNow'); manualSave = { t: Date.now(), ok: lastSaveOk() }; sfx(manualSave.ok ? 'coin' : 'no'); renderPanel(); }
      else if (m === 'title') { r.innerHTML = '<div class="grow">ほんとうに もどる?<small>セーブしてから タイトルに もどるよ。もう一度 タップで けってい</small></div><span class="chev">!</span>'; r.dataset.m = 'title2'; sfx('ui'); }
      else if (m === 'title2') bus.emit('toTitle');
    });
  } else if (panelKind === 'furni') {
    h2.textContent = 'かぐ';
    const placedN = (k) => state.furni.filter(f => f.k === k).length;
    body.innerHTML = `<p class="hint">所持コイン: <b style="color:var(--gold2)">${state.coins}</b>　かぐを かって、おうちに おこう。おいた かぐは ゆびで うごかせるよ。</p>` + Object.entries(FURNI).map(([k, f]) => {
      const own = state.furniOwn[k] || 0, put = placedN(k);
      return `<div class="row"><div class="grow">${f.name}<small>${f.desc ? f.desc + '<br>' : ''}もっている ${own} / おいてる ${put}</small></div>${own > put ? `<button class="pill" data-put="${k}">おく</button>` : ''}<button class="pill" data-buy="${k}" ${state.coins < f.price ? 'disabled' : ''}>かう ${f.price}</button></div>`;
    }).join('');
    body.querySelectorAll('[data-put]').forEach(b => b.onclick = () => { bus.emit('furniPut', b.dataset.put); closePanel(); });
    body.querySelectorAll('[data-buy]').forEach(b => b.onclick = () => { const k = b.dataset.buy, f = FURNI[k]; if (state.coins < f.price) return sfx('no'); state.coins -= f.price; state.furniOwn[k] = (state.furniOwn[k] || 0) + 1; sfx('coin'); bus.emit('coins'); renderPanel(); });
  } else if (panelKind === 'party') {
    h2.textContent = 'なかま';
    body.innerHTML = '<p class="hint">よみこみ中...</p>';
    import('./battle.js').then(async (B) => {
      const GD = await B.questData(), S = await import('./state.js');
      if (panelKind !== 'party') return;
      const vl = S.villageLevel(), vb = Math.round(S.villageBoost() * 100);
      body.innerHTML = `<p class="hint">むらレベル <b style="color:var(--gold2)">${vl}</b>　バトルの モンスターが <b style="color:var(--gold2)">+${vb}%</b> つよくなっているよ(さいだい +30%)。<br>ぼくじょうの やさい・たまご・ミルク・りょうりで、バトルちゅうに かいふくできるよ。ベッドで ねると ぜんいん かいふく。</p>` +
        (state.party.length ? state.party.map((m, i) => { const d = GD.MONSTERS[m.id], st = B.monStats(m), hp = m.hp == null ? st.maxHp : m.hp, pc = Math.max(0, Math.min(100, Math.round(hp / st.maxHp * 100))); return `<div class="mcard"><div class="mhead"><img src="quest/${d.image}" alt=""><div class="mmain"><div class="mname">${m.nick || d.name}${i === 0 ? ' <span class="mtag">せんとう</span>' : ''} ${B.elemChip(d.element)}</div><div class="msub">Lv${m.lv}　HP ${hp}/${st.maxHp}</div><div class="hpbar"><i style="width:${pc}%"></i></div></div></div><details class="mdet"><summary>くわしく みる</summary><div class="mstat"><span>こうげき <b>${st.atk}</b></span><span>ぼうぎょ <b>${st.def}</b></span><span>まほう <b>${st.matk}</b></span><span>まほうぼうぎょ <b>${st.mdef}</b></span><span>すばやさ <b>${st.spd}</b></span><span>かいしん <b>${st.crit}%</b></span><span>ラッキー <b>${st.luck}</b></span><span>なかよし <b>${B.bondLv(m)}/5</b></span></div><div class="mline">せいかく <b style="color:#a8e0b8">${B.natureText(m)}</b></div><div class="mline">もちもの ${m.held && ITEMS[m.held] ? `<b style="color:#f8d888">${ITEMS[m.held].name}</b>(${HOLD[m.held].desc})` : '<span style="opacity:.6">なし</span>'}</div><div class="mline">つぎの わざ <b>${B.nextSkillText(m)}</b></div><div class="mline">${B.evoText(m)}</div></details><div class="mbtns"><button class="pill" data-mv="${i}">わざ</button><button class="pill" data-tr="${i}">おやつ</button><button class="pill" data-hold="${i}">もちもの</button><button class="pill" data-nick="${i}">なまえ</button>${B.canStoneEvolve(m) ? `<button class="pill" data-evo="${i}">しんか</button>` : ''}${i > 0 ? `<button class="pill" data-up="${i}">うえへ</button>` : ''}</div></div>`; }).join('') : '<p class="hint">まだ なかまが いないよ。そとの もりで であえるよ。</p>') + (state.party.length > 1 ? '<p class="hint">いちばん うえの なかまが さいしょに たたかうよ。「うえへ」で ならびかえ。</p>' : '');
      body.querySelectorAll('[data-mv]').forEach(b => b.onclick = () => { movesIdx = +b.dataset.mv; openPanel('moves'); });
      body.querySelectorAll('[data-dep]').forEach(b => b.onclick = async () => { const P2 = await import('./pasture.js'); if (P2.depositMon(+b.dataset.dep)) { sfx('ui'); toast('ぼくじょう', 'なかまを あずけたよ', 'まいあさ コインを もってくるよ', 2400); renderPanel(); } else sfx('no'); });
      body.querySelectorAll('[data-evo]').forEach(b => b.onclick = () => { movesIdx = +b.dataset.evo; openPanel('evo'); });
      body.querySelectorAll('[data-nick]').forEach(b => b.onclick = () => { movesIdx = +b.dataset.nick; openPanel('nick'); });
      body.querySelectorAll('[data-hold]').forEach(b => b.onclick = () => { movesIdx = +b.dataset.hold; openPanel('hold'); });
      body.querySelectorAll('[data-tr]').forEach(b => b.onclick = () => { movesIdx = +b.dataset.tr; openPanel('treat'); });
      body.querySelectorAll('[data-up]').forEach(b => b.onclick = () => { const i = +b.dataset.up; [state.party[i - 1], state.party[i]] = [state.party[i], state.party[i - 1]]; sfx('ui'); renderPanel(); });
    });
  } else if (panelKind === 'pasture') {
    h2.textContent = 'あずかりパソコン';
    body.innerHTML = '<p class="hint">よみこみ中...</p>';
    import('./battle.js').then(async (B) => {
      const GD = await B.questData(), PA = await import('./pasture.js'); if (panelKind !== 'pasture') return;
      state.pasture = state.pasture || [];
      const last = state.pastureLast, inc = (m) => Math.round(6 + m.lv * 1.4);
      body.innerHTML = `<p class="hint">あずけた なかまは、まいあさ コインと ざいりょうを もってきて、すこしずつ せいちょうするよ(${state.pasture.length}/${PA.PASTURE_MAX}ひき)。<br>1日の かせぎ みこみ: <b style="color:var(--gold2)">${state.pasture.reduce((t, m) => t + inc(m), 0)}コイン</b> ほか${last ? `<br>きのう: ${PA.incomeText(last)}` : ''}</p>` +
        '<p class="hint">あずかっている なかま</p>' +
        (state.pasture.length ? state.pasture.map((m, i) => { const d = GD.MONSTERS[m.id]; return `<div class="row"><img src="quest/${d.image}" alt="" style="width:46px;height:46px;object-fit:contain"><div class="grow">${d.name} ${B.elemChip(d.element)}<small>Lv${m.lv}　1日 ${inc(m)}コイン<br>${B.evoText(m)}</small></div><button class="pill" data-wd="${i}" ${state.party.length >= 6 ? 'disabled' : ''}>ひきとる</button>${state.party.length >= 6 ? `<button class="pill" data-sw="${i}">いれかえ</button>` : ''}</div>`; }).join('') : '<p class="hint">まだ だれも いないよ。したの「いまの なかま」から「あずける」を おそう。</p>') +
        `<p class="hint">いまの なかま(${state.party.length}/6)</p>` +
        state.party.map((m, i) => { const d = GD.MONSTERS[m.id]; return `<div class="row"><img src="quest/${d.image}" alt="" style="width:40px;height:40px;object-fit:contain"><div class="grow">${d.name}<small>Lv${m.lv}</small></div><button class="pill" data-dp="${i}" ${state.party.length <= 1 || state.pasture.length >= PA.PASTURE_MAX ? 'disabled' : ''}>あずける</button></div>`; }).join('') +
        '<p class="hint">せんとうに でる なかまは さいごの 1ぴきを のこして あずけられるよ。てもちが 6ぴきの ときは「いれかえ」で ぼくじょうの なかまと こうかんできるよ。</p>';
      body.querySelectorAll('[data-sw]').forEach(b => b.onclick = () => {   // てもちの だれかと いれかえる
        const pi = +b.dataset.sw, mon = state.pasture[pi]; if (!mon) return;
        body.innerHTML = `<p class="hint">${GD.MONSTERS[mon.id].name} と いれかえる てもちの なかまを えらんでね</p>` + state.party.map((m, i) => { const d = GD.MONSTERS[m.id]; return `<div class="row"><img src="quest/${d.image}" alt="" style="width:40px;height:40px;object-fit:contain"><div class="grow">${d.name}<small>Lv${m.lv}</small></div><button class="pill" data-pk="${i}">これと いれかえる</button></div>`; }).join('') + '<div class="row"><button class="pill" data-cx="1">やめる</button></div>';
        body.querySelectorAll('[data-pk]').forEach(k => k.onclick = () => { const pk = +k.dataset.pk, out = state.party[pk]; if (!out) return; out.hp = null; state.party[pk] = mon; state.pasture[pi] = out; bus.emit('pasture'); sfx('ui'); toast('いれかえ', `${GD.MONSTERS[mon.id].name} が てもちに はいったよ`, '', 2000); renderPanel(); });
        body.querySelector('[data-cx]').onclick = () => renderPanel();
      });
      body.querySelectorAll('[data-wd]').forEach(b => b.onclick = () => { if (PA.withdrawMon(+b.dataset.wd)) { sfx('ui'); renderPanel(); } else sfx('no'); });
      body.querySelectorAll('[data-dp]').forEach(b => b.onclick = () => { if (PA.depositMon(+b.dataset.dp)) { sfx('ui'); renderPanel(); } else sfx('no'); });
    });
  } else if (panelKind === 'types') {
    h2.textContent = 'タイプそうせいひょう';
    body.innerHTML = '<p class="hint">よみこみ中...</p>';
    import('./battle.js').then(async (B) => {
      const GD = await B.questData(); if (panelKind !== 'types') return;
      const O = ['fire', 'water', 'grass', 'wind', 'earth', 'thunder', 'heaven', 'dark', 'magic', 'beast'];
      body.innerHTML = '<p class="hint">わざの タイプと あいての タイプで ダメージが かわるよ。ばつぐん=2ばい、いまひとつ=はんぶん。バトルでは あいての よわてんも でるよ。</p>' +
        O.map(e => { const st = O.filter(d => GD.getElementMatchup(e, d).tier === 'strong'), wk = O.filter(d => GD.getElementMatchup(e, d).tier === 'weak'); return `<div class="row"><div class="grow">${B.elemChip(e)}<small>◎ ばつぐん: ${st.map(B.elemChip).join('')}　△ いまひとつ: ${wk.map(B.elemChip).join('')}</small></div></div>`; }).join('') +
        `<div class="row"><div class="grow">${B.elemChip('kami')}<small>どの タイプにも ばつぐん(よわてんは ない)</small></div></div>`;
    });
  } else if (panelKind === 'badge') {
    h2.textContent = 'バッジ';
    body.innerHTML = '<p class="hint">フィールドの ぬしを たおすと バッジが もらえて、ずっと おんけいが つづくよ。</p>' + BADGES.map(b => { const own = hasBadge(b.id); return `<div class="row">${badgeIcon(b, own)}<div class="grow">${b.name}${own ? ' <small style="display:inline;color:var(--gold2)">ゲット!</small>' : ''}<small>${own ? b.bonus : b.boss + ' を たおすと てにはいるよ(' + b.bonus + ')'}</small></div></div>`; }).join('');
  } else if (panelKind === 'gate') {
    h2.textContent = 'どこへ いく?';
    const D = [['forest', 'はじまりの もり', 'くさむらで モンスターと たたかえる(ぬし: もりの ぬし)'], ['lake', 'みずうみの ほとり', 'みず・かぜの モンスターが いる(ぬし: みずうみの ぬし)'], ['volcano', 'ようがんやま', 'ほのお・つち・やみの モンスターが いる。かなり つよいよ'], ['ghost', 'ゆうれいの はかば', 'やみ・まほうの モンスターが いる。とても つよいよ'], ['sky', 'てんくうの はら', 'てん・かみなりの モンスターが いる'], ['sun', 'たいようの はら', 'ほのおの モンスターが いる'], ['cosmos', 'うちゅうの うみ', 'みずの モンスターが いる'], ['grove', 'しんじゅの いせき', 'くさ・かぜの モンスターが いる'], ['castle', 'やみの しろ', 'してんのう① やみの しろ。くさむらは ない。てしたと ぬしの れんせん(バッジ8つで ひらく)'], ['temple', 'ほしの しんでん', 'してんのう② ほしの しんでん。くさむらは ない。かいふくの たべものは 3かいまで'], ['dragon', 'せいりゅうの そら', 'してんのう③ せいりゅうの そら。くさむらは ない。とちゅうで かいふくは できない'], ['end', 'うちゅうの はて', 'してんのう④(さいごの たたかい)。うちゅうの かみが まっている']].map((r, i, all) => [...r, i === 0 || !!state.boss[all[i - 1][0]], i ? all[i - 1][1] : '']);
    body.innerHTML = '<p class="hint">いきさきを えらんでね。ぬしを たおした ばしょの つぎまで、ワープで いけるよ。もどるときは マップの ゲートから。バッジを8つ あつめると でんせつの ほこらが あらわれて、やみの しろから してんのうとの たたかいが はじまるよ。</p>' + D.map(([id, n, d, ok, prev]) => `<div class="row"><div class="grow">${n}${state.boss[id] ? ' <small style="display:inline;color:var(--gold2)">ぬしを たおした</small>' : ''}<small>${ok ? d : prev + 'の ぬしを たおすと ひらくよ'}</small></div><button class="pill" data-go="${id}" ${ok ? '' : 'disabled'}>${ok ? 'いく' : 'とじている'}</button></div>`).join('');
    body.querySelectorAll('[data-go]').forEach(b => b.onclick = () => { closePanel(); bus.emit('goField', b.dataset.go); });
  } else if (panelKind === 'names') {
    h2.textContent = 'なまえを かえる';
    const list = (ui.nameables ? ui.nameables() : []), groups = [...new Set(list.map(x => x.group))];
    body.innerHTML = '<p class="hint">なまえを タップして すきな なまえに かえよう(8もじまで)。からっぽで もとの なまえに もどるよ。</p>' + groups.map(g => `<p class="hint">${g}</p>` + list.filter(x => x.group === g).map(x => `<div class="row"><div class="grow">${x.cur}<small>${x.cur !== x.base ? 'もとの なまえ: ' + x.base : ''}</small></div><button class="pill" data-rn="${x.key}">かえる</button></div>`).join('')).join('');
    body.querySelectorAll('[data-rn]').forEach(b => b.onclick = () => {
      const it = list.find(x => x.key === b.dataset.rn); if (!it) return;
      body.innerHTML = `<p class="hint">「${it.cur}」の あたらしい なまえを いれてね(8もじまで)。</p><div class="row"><input id="rnIn" type="text" maxlength="8" value="${it.cur.replace(/"/g, '')}" style="flex:1;min-width:0;font-size:16px;padding:8px 10px;border-radius:10px;border:2px solid #7a5a30;background:#fff8e8;color:#3a2410"><button class="pill" id="rnOk">きめる</button></div><div class="row"><div class="grow"><button class="pill" id="rnBack">もどる</button></div></div>`;
      body.querySelector('#rnOk').onclick = () => { const v = body.querySelector('#rnIn').value.trim().slice(0, 8); state.names = state.names || {}; if (v && v !== it.base) state.names[it.key] = v; else delete state.names[it.key]; if (ui.onRenamed) ui.onRenamed(); sfx('quest'); save(); renderPanel(); };
      body.querySelector('#rnBack').onclick = () => renderPanel();
    });
  } else if (panelKind === 'howto') {
    h2.textContent = 'あそびかた';
    const SEC = [
      ['まずは むらで', 'そうげんの タンポポ・きいちご・きのこ・どんぐりを ひろって うったり りょうりしたり。かまを かうと ほしくさが とれて、はたけも つくれるよ。'],
      ['ぼくじょう', 'うし・ニワトリ・ちんちらを かって せわを しよう。まいにち ミルクや たまごが とれるよ。「なかまの ぼくじょう」には あずけた モンスターが くらして、まいあさ コインを もってくるよ。'],
      ['そとへ でかけよう', 'むらの そとの もりには モンスターが いるよ。くさむらを あるくと バトルに なるよ。てんきや じかんで でる モンスターが かわるよ。'],
      ['バトルの すすめかた', 'モンスターどうしの 1たい1の しょうぶ。「わざ」で こうげき、「どうぐ」で かいふくや ボール、「いれかえ」で こうたい。わざには PP(つかえる かいすう)が あるよ。ぬしや トレーナーとの しょうぶでは、2ひきめが サポートで てつだうよ。'],
      ['ぼうぎょ・ぬしの ちから', 'わざの いちばん したの「ぼうぎょ」で このターンの ダメージが はんぶんに。ぬしは HPが へると ほんきを だして、ときどき「ちからを ためて」つよい こうげきを してくるよ。そのターンは ぼうぎょが ききめ ばつぐん!'],
      ['じょうたいいじょう', 'どく・やけど・こおり・ねむり・まひ・こんらん・やどりぎ。わざで あいてに かけたり、かけられたり。「なんでもなおし」や たべものの どうぐで なおせるよ。'],
      ['ボールと なかま', 'やせいの モンスターに チモシーボールを なげて なかまに しよう(ぬし・トレーナーの なかまは ぬしだけ)。なかまに すると ずかんが うまるよ。'],
      ['もちもの・せいかく', '「なかま」の「もちもの」で どうぐを もたせると バトルで こうかが あるよ(ものづくりの だいで つくれる)。モンスターには せいかくが あって、「なまえ」で なまえも つけられるよ。'],
      ['しんか', 'レベルが あがると しんかする モンスターも いるよ。まめちんちらは「しんかいし」で すきな ぞくせいに しんかできるよ。'],
      ['よると かいとう', 'よるは くらくなるけど、「にわの かざり」の がいとうを おくと あかるいよ。'],
      ['セーブ', 'じどうで セーブされるよ。「せってい」から データを ファイルに かきだして バックアップできるよ(きかえる ときに 便利)。'],
    ];
    body.innerHTML = '<p class="hint">タップで ひらくよ。</p>' + SEC.map(([t, x], i) => `<div class="row menurow" data-sec="${i}"><div class="grow">${t}<small class="sec-x" style="display:none;white-space:normal">${x}</small></div><span class="chev">›</span></div>`).join('');
    body.querySelectorAll('[data-sec]').forEach(r => r.onclick = () => { const x = r.querySelector('.sec-x'); x.style.display = x.style.display === 'none' ? 'block' : 'none'; sfx('ui'); });
  } else if (panelKind === 'nick') {
    h2.textContent = 'なまえを つける';
    body.innerHTML = '<p class="hint">よみこみ中...</p>';
    import('./battle.js').then(async (B) => {
      const GD = await B.questData(), m = state.party[movesIdx]; if (panelKind !== 'nick' || !m) return; const d = GD.MONSTERS[m.id];
      body.innerHTML = `<p class="hint">${d.name} に すきな なまえを つけよう(8もじまで)。からっぽで もとの なまえに もどるよ。</p><div class="row"><input id="nickIn" type="text" maxlength="8" value="${(m.nick || '').replace(/"/g, '')}" placeholder="${d.name}" style="flex:1;min-width:0;font-size:16px;padding:8px 10px;border-radius:10px;border:2px solid #7a5a30;background:#fff8e8;color:#3a2410"><button class="pill" id="nickOk">きめる</button></div><div class="row"><div class="grow"><button class="pill" id="nickBack">なかまへ もどる</button></div></div>`;
      body.querySelector('#nickOk').onclick = () => { const v = body.querySelector('#nickIn').value.trim().slice(0, 8); m.nick = v || null; sfx('quest'); save(); openPanel('party'); };
      body.querySelector('#nickBack').onclick = () => openPanel('party');
    });
  } else if (panelKind === 'evo') {
    h2.textContent = 'しんかいし';
    body.innerHTML = '<p class="hint">よみこみ中...</p>';
    import('./battle.js').then(async (B) => {
      const GD = await B.questData(), m = state.party[movesIdx]; if (panelKind !== 'evo' || !m) return;
      const have = Object.keys(EVO_STONES).filter(id => count(id) > 0 && B.stoneTarget(m, id));
      body.innerHTML = `<p class="hint">${B.evoText(m)}。しんかは もとに もどせないよ。しんかいしは よろずやで うっているし、たからばこや ぼうけんでも みつかるよ(かみの いしは さいごの ぬしを たおすと もらえるよ)。</p>` +
        (have.length ? have.map(id => { const tg = B.stoneTarget(m, id), to = tg && GD.MONSTERS[tg.id]; return `<div class="row">${itemIcon(id)}<div class="grow">${ITEMS[id].name}<small>${to ? to.name + ' に しんか' : ''} / もっている ×${count(id)}</small></div><button class="pill" data-st="${id}" ${m.lv < (tg ? tg.level : 99) ? 'disabled' : ''}>つかう</button></div>`; }).join('') : '<p class="hint">しんかいしを もっていないよ。</p>') +
        '<div class="row"><div class="grow"><button class="pill" id="evBack">なかまへ もどる</button></div></div>';
      body.querySelectorAll('[data-st]').forEach(b => b.onclick = async () => { const id = b.dataset.st, tg = B.stoneTarget(m, id); if (tg && m.lv >= tg.level && count(id)) { let go = true; try { go = await B.evoOverlay(GD.MONSTERS[m.id].image, GD.MONSTERS[tg.id].image, m.nick || GD.MONSTERS[m.id].name, GD.MONSTERS[tg.id].name); } catch {} if (!go) { toast('しんか', 'なにも おきなかった…', 'いしは そのままだよ', 2200); return; } } if (B.evolveWithStone(m, id)) { sfx('quest'); toast('しんか!', `${GD.MONSTERS[m.id].name} に しんかした!`, '', 3000); save(); openPanel('party'); } else sfx('no'); });
      body.querySelector('#evBack').onclick = () => openPanel('party');
    });
  } else if (panelKind === 'hold') {
    h2.textContent = 'もちもの';
    body.innerHTML = '<p class="hint">よみこみ中...</p>';
    import('./battle.js').then(async (B) => {
      const GD = await B.questData(), m = state.party[movesIdx]; if (panelKind !== 'hold' || !m) return;
      const d = GD.MONSTERS[m.id], have = Object.keys(HOLD).filter(id => count(id) > 0);
      body.innerHTML = `<p class="hint">${d.name} に もたせると、バトルで こうかが あるよ。ひとつだけ もてるよ。</p>` +
        `<div class="row"><div class="grow">いま もっている もの<small>${m.held && ITEMS[m.held] ? `<b style="color:#f8d888">${ITEMS[m.held].name}</b>(${HOLD[m.held].desc})` : 'なし'}</small></div>${m.held ? '<button class="pill" id="hdOff">はずす</button>' : ''}</div>` +
        (have.length ? have.map(id => `<div class="row">${itemIcon(id)}<div class="grow">${ITEMS[id].name}<small>${HOLD[id].desc} / もっている ×${count(id)}</small></div><button class="pill" data-hd="${id}">もたせる</button></div>`).join('') : '<p class="hint">もちものが ないよ。ものづくりの だいで つくれるよ(よろずやでも うっているよ)。</p>') +
        '<div class="row"><div class="grow"><button class="pill" id="hdBack">なかまへ もどる</button></div></div>';
      const off = body.querySelector('#hdOff'); if (off) off.onclick = () => { addItem(m.held, 1); m.held = null; sfx('ui'); save(); renderPanel(); };
      body.querySelectorAll('[data-hd]').forEach(b => b.onclick = () => { const id = b.dataset.hd; if (!count(id)) return; if (m.held) addItem(m.held, 1); addItem(id, -1); m.held = id; sfx('feed'); toast(d.name, `${ITEMS[id].name}を もたせた`, '', 1600); save(); renderPanel(); });
      body.querySelector('#hdBack').onclick = () => openPanel('party');
    });
  } else if (panelKind === 'treat') {
    h2.textContent = 'おやつを あげる';
    body.innerHTML = '<p class="hint">よみこみ中...</p>';
    import('./battle.js').then(async (B) => {
      const GD = await B.questData(), m = state.party[movesIdx]; if (panelKind !== 'treat' || !m) return;
      const d = GD.MONSTERS[m.id], st = B.monStats(m), hp = m.hp == null ? st.maxHp : m.hp, foods = Object.keys(MON_HEAL).filter(id => count(id) > 0);
      body.innerHTML = `<p class="hint">${d.name} ${B.elemChip(d.element)}　Lv${m.lv}　HP ${hp}/${st.maxHp}　なかよし ${B.bondLv(m)}/5<br>ぼくじょうの たべものを あげると HPが かいふくして、なかよしに なるよ(なかよしだと すこし つよくなる)。</p>` +
        (foods.length ? foods.map(id => `<div class="row">${itemIcon(id)}<div class="grow">${ITEMS[id].name}<small>HP +${MON_HEAL[id]} / なかよし +2 / もっている ×${count(id)}</small></div><button class="pill" data-food="${id}">あげる</button></div>`).join('') : '<p class="hint">あげられる たべものが ないよ。やさい・たまご・ミルク・りょうりを つくってこよう。</p>') +
        '<div class="row"><div class="grow"><button class="pill" id="trBack">なかまへ もどる</button></div></div>';
      body.querySelectorAll('[data-food]').forEach(b => b.onclick = () => { const id = b.dataset.food; if (!count(id)) return; addItem(id, -1); m.hp = Math.min(st.maxHp, hp + MON_HEAL[id]); m.bond = (m.bond || 0) + 2; sfx('feed'); toast(d.name, `${ITEMS[id].name}を たべたよ`, 'なかよし ' + B.bondLv(m) + '/5', 1800); renderPanel(); });
      body.querySelector('#trBack').onclick = () => openPanel('party');
    });
  } else if (panelKind === 'moves') {
    h2.textContent = 'わざを えらぶ';
    body.innerHTML = '<p class="hint">よみこみ中...</p>';
    import('./battle.js').then(async (B) => {
      const GD = await B.questData(), m = state.party[movesIdx]; if (panelKind !== 'moves' || !m) return;
      B.movesOf(m); const known = B.knownOf(m), d = GD.MONSTERS[m.id];
      body.innerHTML = `<p class="hint">${d.name} Lv${m.lv}　バトルで つかえる わざは 4つまで。タップで いれかえ(つかう/はずす)。</p>` + known.slice().reverse().map(s => { const sk = GD.SKILLS[s], on = m.moves.includes(s); return `<div class="row"><div class="grow">${sk.name} ${B.elemChip(sk.element || d.element)}<small>${B.skillShort(sk)}　PP ${B.ppOf(m, sk)}/${B.ppMax(sk)}　${on ? '<b style="color:var(--gold2)">セット中</b>' : ''}</small></div><button class="pill" data-sk="${s}">${on ? 'はずす' : 'セット'}</button></div>`; }).join('') + '<div class="row"><div class="grow"><button class="pill" id="mvBack">なかまへ もどる</button></div></div>';
      body.querySelectorAll('[data-sk]').forEach(b => b.onclick = () => { const s = b.dataset.sk, i = m.moves.indexOf(s); if (i >= 0) { if (m.moves.length <= 1) return sfx('no'); m.moves.splice(i, 1); } else { if (m.moves.length >= 4) { sfx('no'); return toast('わざ', 'セットできるのは 4つまで', 'どれかを はずしてね', 2000); } m.moves.push(s); } sfx('ui'); renderPanel(); });
      body.querySelector('#mvBack').onclick = () => openPanel('party');
    });
  } else if (panelKind === 'gfx') {
    h2.textContent = 'くさの りょう';
    let cur = 'mid'; try { cur = localStorage.getItem('chinchilla-ranch-gfx') || (matchMedia('(pointer:coarse)').matches ? 'mid' : 'high'); } catch {}
    const L = [['low', 'かるい', 'くさが すくなめ。いちばん かるい(おそい きしゅむけ)'], ['mid', 'ふつう', 'くさが ふつうに ふえる(スマホの おすすめ)'], ['high', 'きれい', 'くさが いっぱい。パソコンむけ(スマホでは おもいかも)']];
    body.innerHTML = '<p class="hint">くさの かずと みえる きょりを かえるよ。ゲームを とじて ひらきなおすと かわるよ。おもい・おちる ときは「かるい」に もどしてね。</p>' + L.map(([k, n, d]) => `<div class="row"><div class="grow">${n}${cur === k ? ' <b style="color:var(--gold2)">いま</b>' : ''}<small>${d}</small></div><button class="pill" data-g="${k}">${cur === k ? 'えらんでる' : 'えらぶ'}</button></div>`).join('');
    body.querySelectorAll('[data-g]').forEach(b => b.onclick = () => { try { localStorage.setItem('chinchilla-ranch-gfx', b.dataset.g); } catch {} sfx('ui'); toast('くさの りょう', 'ゲームを とじて ひらきなおしてね', 'つぎに ひらいたとき かわるよ', 3200); renderPanel(); });
  } else if (panelKind === 'village') {
    h2.textContent = 'むらの ようす';
    const lv = villageLevel(), p = villagePoints(), lo = 4 * (lv - 1) ** 2, hi = 4 * lv * lv, pct = Math.max(0, Math.min(100, (p - lo) / (hi - lo) * 100));
    const cn = state.cows.length, hn = state.chickens.length, dt = (d) => { d = d || {}; return `うりあげ ${d.earned || 0}コイン / ぎゅうにゅう ${d.milk || 0}本 / たまご ${d.egg || 0}こ / しゅうかく ${d.harvest || 0}こ / さかな ${d.fish || 0}ひき`; };
    const ms = sellOf('milk');
    body.innerHTML = `<div class="row"><div class="grow">むらレベル <b style="color:var(--gold2);font-size:22px">${lv}</b><small>つぎの レベルまで あと ${Math.max(1, Math.ceil(hi - p))}ポイント / バトルの つよさボーナス +${Math.round(villageBoost() * 100)}%</small></div></div>
      <div style="height:10px;border-radius:6px;background:#0003;margin:0 4px 10px"><div style="height:100%;width:${pct}%;border-radius:6px;background:var(--gold2)"></div></div>
      <p class="hint">たてもの・どうぶつ・はたけ・クエスト・ずかん・うりあげが ふえると レベルが あがるよ</p>
      <div class="row"><div class="grow">たてもの<small>ぼくじょう ${state.barns.length}・とりごや ${state.coops.length}・いど ${state.wells.length}・はたけ ${state.plots.length}</small></div></div>
      <div class="row"><div class="grow">どうぶつ<small>うし ${cn}/${state.barns.length * 3}・ニワトリ ${hn}/${state.coops.length * 6}・チンチラ ${state.animals.length}/3</small></div></div>
      <div class="row"><div class="grow">1日の みこみ<small>ぎゅうにゅう ${cn}〜${cn * 3}本(${cn * ms}〜${cn * 3 * ms}コイン)・たまご さいだい ${hn}こ(エサを あげたとき)</small></div></div>
      <div class="row"><div class="grow">きょう<small>${dt(state.daily)}</small></div></div>
      <div class="row"><div class="grow">きのう<small>${dt(state.prevDaily)}</small></div></div>
      <p class="hint">これまでの うりあげ ごうけい: ${state.stats.earned || 0}コイン</p>`;
  } else if (panelKind === 'settings') {
    h2.textContent = 'せってい';
    import('./battle.js').then((B) => {
      if (panelKind !== 'settings') return; const sp = B.battleSpeed(), asv = ui.autosaveMsg(), asist = B.assistOn(), asknick = B.askNickOn();
      const sbtn = (v, l) => `<button class="pill ${Math.abs(sp - v) < 0.01 ? 'sel' : ''}" data-sp="${v}">${l}</button>`;
      body.innerHTML = `<p class="hint">あそびやすさを ととのえよう。</p>
        <div class="row"><div class="grow">バトルの はやさ<small>メッセージや えんしゅつの スピード</small></div>${sbtn(1, 'ふつう')}${sbtn(1.6, 'はやい')}${sbtn(2.5, 'さいそく')}</div>
        <div class="row"><div class="grow">オートセーブの おしらせ<small>セーブした とき 画面の すみに ちいさく ひょうじ</small></div><button class="pill ${asv ? 'sel' : ''}" data-as="${asv ? 0 : 1}">${asv ? 'ひょうじする' : 'ひょうじしない'}</button></div>
        <div class="row"><div class="grow">2ひきで たたかう<small>ぬし・トレーナーせんで 2ひきめが サポートする</small></div><button class="pill ${asist ? 'sel' : ''}" data-as2="${asist ? 0 : 1}">${asist ? 'する' : 'しない'}</button></div>
        <div class="row"><div class="grow">しょうエネモード<small>30フレーム・かげなし・くさ すくなめで バッテリーを ながもちさせる(きりかえると ゲームを よみこみなおすよ)</small></div><button class="pill ${ECO ? 'sel' : ''}" data-eco="${ECO ? 0 : 1}">${ECO ? 'ON' : 'OFF'}</button></div>
        <div class="row"><div class="grow">データを かきだす<small>セーブを ファイルに ほぞん(バックアップ)</small></div><button class="pill" id="sbEx">かきだす</button></div>
        <div class="row"><div class="grow">データを よみこむ<small>かきだした ファイルから もどす(いまの データは きえるよ)</small></div><button class="pill" id="sbIm">よみこむ</button><input type="file" id="sbFile" accept=".json,application/json" hidden></div>
        <div class="row"><div class="grow">ひとつまえに もどす<small>きのうまでの じどうバックアップから もどす</small></div><button class="pill" id="sbBak">もどす</button></div>
        <div class="row"><div class="grow">ゲットしたら なまえを きく<small>なかまに した モンスターに なまえを つけるか たずねる</small></div><button class="pill ${asknick ? 'sel' : ''}" data-an="${asknick ? 0 : 1}">${asknick ? 'きく' : 'きかない'}</button></div>
        <div class="row menurow" data-m="sound"><div class="grow">おとの せってい<small>BGM・こうかおん</small></div><span class="chev">›</span></div>
        <div class="row menurow" data-m="gfx"><div class="grow">くさの りょう<small>かるい・ふつう・きれい</small></div><span class="chev">›</span></div>
        <div class="row menurow" data-m="look"><div class="grow">ひかりの ちょうせい<small>あかるさ・ふんいき</small></div><span class="chev">›</span></div>`;
      body.querySelectorAll('[data-sp]').forEach(b => b.onclick = () => { try { localStorage.setItem(B.SPEED_KEY, b.dataset.sp); } catch {} sfx('ui'); renderPanel(); });
      body.querySelector('#sbEx').onclick = async () => {
        try { save(); } catch {} const txt = localStorage.getItem(SAVE_KEY) || JSON.stringify(state), d = new Date(), name = `mofumofu-save-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}.json`;
        const file = new File([txt], name, { type: 'application/json' });
        try { if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: 'もふもふ牧場 セーブデータ' }); toast('バックアップ', 'ファイルを ほぞんしてね', '', 2400); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
        const a = document.createElement('a'); a.href = URL.createObjectURL(file); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); toast('バックアップ', `${name} を ほぞんしたよ`, '', 2400);
      };
      const loadTxt = (txt) => { let o; try { o = JSON.parse(txt); } catch { return toast('よみこめない', 'ファイルが ただしくないよ', '', 2400); } if (!o || typeof o !== 'object' || (o.coins == null && !o.party)) return toast('よみこめない', 'もふもふ牧場の データじゃないよ', '', 2400); if (!confirm('いまの データは きえて、ファイルの ないように かわるよ。よみこむ?')) return; try { localStorage.setItem(SAVE_KEY + '-bak', localStorage.getItem(SAVE_KEY) || ''); localStorage.setItem(SAVE_KEY, txt); localStorage.setItem(SAVE_KEY + '-prev', txt); } catch {} blockSave(); location.reload(); };
      body.querySelector('#sbIm').onclick = () => body.querySelector('#sbFile').click();
      body.querySelector('#sbFile').onchange = (ev) => { const f = ev.target.files && ev.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => loadTxt(String(r.result)); r.readAsText(f); };
      body.querySelector('#sbBak').onclick = () => { let b = null; try { b = localStorage.getItem(SAVE_KEY + '-bak'); } catch {} if (!b) return toast('もどせない', 'バックアップが まだ ないよ', '', 2200); loadTxt(b); };
      body.querySelectorAll('[data-eco]').forEach(b => b.onclick = () => { try { localStorage.setItem(ECO_KEY, b.dataset.eco); } catch {} try { save(); } catch {} sfx('ui'); toast('しょうエネモード', b.dataset.eco === '1' ? 'ONに したよ。よみこみなおすね' : 'OFFに したよ。よみこみなおすね', '', 1500); setTimeout(() => { location.href = /field\.html/.test(location.pathname) ? location.href : 'index.html?resume=1'; }, 900); });
      body.querySelectorAll('[data-an]').forEach(b => b.onclick = () => { try { localStorage.setItem('chinchilla-ranch-asknick', b.dataset.an); } catch {} sfx('ui'); renderPanel(); });
      body.querySelectorAll('[data-as2]').forEach(b => b.onclick = () => { try { localStorage.setItem('chinchilla-ranch-assist', b.dataset.as2); } catch {} sfx('ui'); renderPanel(); });
      body.querySelectorAll('[data-as]').forEach(b => b.onclick = () => { ui.setAutosaveMsg(b.dataset.as === '1'); sfx('ui'); renderPanel(); });
      body.querySelectorAll('.menurow').forEach(r => r.onclick = () => openPanel(r.dataset.m));
    });
  } else if (panelKind === 'sound') {
    h2.textContent = 'おとの せってい';
    import('./bgm.js').then((A) => {
      if (panelKind !== 'sound') return; const c = A.audioConfig;
      body.innerHTML = `<p class="hint">BGMと こうかおんの おおきさを かえられるよ。</p>
        <div class="row"><div class="grow">BGM<small class="v1">${Math.round(c.bgm * 100)}%</small></div><input type="range" class="sl" data-k="bgm" min="0" max="1" step="0.05" value="${c.bgm}" style="width:46%"></div>
        <div class="row"><div class="grow">こうかおん<small class="v2">${Math.round(c.sfx * 100)}%</small></div><input type="range" class="sl" data-k="sfx" min="0" max="1" step="0.05" value="${c.sfx}" style="width:46%"></div>`;
      body.querySelectorAll('.sl').forEach(i => { i.oninput = () => { A.setVolumes(i.dataset.k === 'bgm' ? +i.value : null, i.dataset.k === 'sfx' ? +i.value : null); i.closest('.row').querySelector('small').textContent = Math.round(i.value * 100) + '%'; }; i.onchange = () => sfx('coin'); });
    });
  } else if (panelKind === 'mdex') {
    h2.textContent = 'モンスターずかん';
    body.innerHTML = '<p class="hint">よみこみ中...</p>';
    import('./battle.js').then(async (B) => {
      const GD = await B.questData(); if (panelKind !== 'mdex') return;
      state.mdexClaimed = state.mdexClaimed || {};
      const total = ALL_MONS.length, seen = ALL_MONS.filter(id => state.mdex[id]).length, got = ALL_MONS.filter(id => state.mdex[id] === 2).length;
      const reward = (r) => rewardText(r), give = (r) => { state.coins += r.coins || 0; for (const [k, v] of Object.entries(r.items || {})) addItem(k, v); bus.emit('coins'); sfx('quest'); };
      const ms = MDEX_REWARDS.map(m => { const key = 'n' + m.n, ok = got >= m.n, claimed = !!state.mdexClaimed[key]; return `<div class="row"><div class="grow">なかまを ${m.n}しゅるい<small>${reward(m.reward)}　(${Math.min(got, m.n)}/${m.n})</small></div>${claimed ? '<span class="price">うけとりずみ</span>' : `<button class="pill" data-mr="${key}" ${ok ? '' : 'disabled'}>うけとる</button>`}</div>`; }).join('');
      const els = [...new Set(ALL_MONS.map(id => GD.MONSTERS[id].element || 'none'))].filter(e => e !== 'none');
      const el = els.map(e => { const ids = ALL_MONS.filter(id => (GD.MONSTERS[id].element || 'none') === e), need = Math.min(ELEMENT_REWARD.n, ids.length), have = ids.filter(id => state.mdex[id] === 2).length, key = 'e_' + e, claimed = !!state.mdexClaimed[key]; return `<div class="row"><div class="grow">${B.elemChip(e)} の なかまを ${need}しゅるい<small>${reward(ELEMENT_REWARD)}　(${Math.min(have, need)}/${need})</small></div>${claimed ? '<span class="price">うけとりずみ</span>' : `<button class="pill" data-mr="${key}" ${have >= need ? '' : 'disabled'}>うけとる</button>`}</div>`; }).join('');
      const grid = MON_GROUPS.map(g => `<p class="hint">${g.name}</p><div class="dexgrid">` + g.ids.map(id => { const d = GD.MONSTERS[id], s2 = state.mdex[id] || 0; return `<div class="dexcell${s2 ? '' : ' off'}" data-md="${id}"><img src="quest/${d.image}" alt="" style="width:54px;height:54px;object-fit:contain${s2 ? '' : ';filter:brightness(0)'}"><b>${s2 ? d.name : '？？？'}</b><small>${s2 === 2 ? 'なかま' : s2 ? 'であった' : ''}</small></div>`; }).join('') + '</div>').join('');
      body.innerHTML = `<p class="hint">であった: <b style="color:var(--gold2)">${seen} / ${total}</b>　なかまに した: <b style="color:var(--gold2)">${got} / ${total}</b></p><p class="hint">なかまを ふやして ほうしゅうを もらおう</p>${ms}<p class="hint">タイプごとの コンプリート</p>${el}${grid}`;
      const APW = { water: 'あめ・ゆき', grass: 'あめ・ひるま', thunder: 'あめ・あらし', wind: 'あらし・ひるま', dark: 'きり・よる', magic: 'きり・よる', heaven: 'ゆき・ひるま', beast: 'よる' };
      body.querySelectorAll('[data-md]').forEach(c => c.onclick = () => {
        const id = c.dataset.md, d = GD.MONSTERS[id], s2 = state.mdex[id] || 0; let box = body.querySelector('#mdDetail');
        if (!box) { box = document.createElement('div'); box.id = 'mdDetail'; box.className = 'row'; box.style.cssText = 'position:sticky;top:0;z-index:2;background:#3a2a1c;border:2px solid #c8a050;border-radius:12px'; body.prepend(box); }
        const ap = APPEAR[id] || [], where = ap.length ? ap.map(f => f.endsWith('!') ? `${FIELD_NAMES[f.slice(0, -1)]}の ぬし` : FIELD_NAMES[f]).join('、') : 'とくべつな ばしょ(ぼくじょうで あずかる など)';
        box.innerHTML = s2 ? `<img src="quest/${d.image}" alt="" style="width:54px;height:54px;object-fit:contain"><div class="grow">${d.name} ${B.elemChip(d.element)}<small>でてくる ばしょ: ${where}<br>でやすい とき: ${APW[d.element] || 'いつでも'}</small></div>` : '<div class="grow">？？？<small>まだ であっていないよ</small></div>';
        sfx('ui');
      });
      body.querySelectorAll('[data-mr]').forEach(b => b.onclick = () => {
        const key = b.dataset.mr; if (state.mdexClaimed[key]) return;
        const r = key.startsWith('e_') ? ELEMENT_REWARD : (MDEX_REWARDS.find(m => 'n' + m.n === key) || {}).reward; if (!r) return;
        state.mdexClaimed[key] = 1; give(r); toast('ずかんの ほうしゅう', rewardText(r), '', 2600); renderPanel();
      });
    });
  } else if (panelKind === 'dex') {
    h2.textContent = 'ずかん';
    const all = DEX.flatMap(g => g.ids), got = all.filter(id => state.dex[id]).length;
    body.innerHTML = `<p class="hint">あつめた数: <b style="color:var(--gold2)">${got} / ${all.length}</b>　はじめて 手に入れると のるよ。</p>` + DEX.map(g => {
      const n = g.ids.filter(id => state.dex[id]).length;
      return `<p class="hint">${g.title}　${n}/${g.ids.length}</p><div class="dexgrid">` + g.ids.map(id => state.dex[id]
        ? `<div class="dexcell">${itemIcon(id)}<b>${ITEMS[id].name}</b><small>×${state.dex[id]}</small></div>`
        : `<div class="dexcell off"><span class="q">?</span><b>？？？</b></div>`).join('') + '</div>';
    }).join('');
  } else if (panelKind === 'look') {
    h2.textContent = 'ひかりの ちょうせい';
    const L = state.look, row = (k, name, lo, hi) => `<div class="row"><div class="grow">${name}<small>${L[k].toFixed(2)}</small></div><input type="range" class="lk" data-k="${k}" min="${lo}" max="${hi}" step="0.02" value="${L[k]}" style="width:46%"></div>`;
    body.innerHTML = `<p class="hint">むらの あかるさや ふんいきを ととのえられるよ。</p>` + row('exp', 'ぜんたいの あかるさ', 0.6, 1.6) + row('sun', 'たいように 当たる ひかり', 0.3, 1.8) + row('hemi', 'かげの あかるさ', 0.4, 2) + row('fog', 'とおくの みえかた', 0.5, 1.6) +
      `<div class="row"><div class="grow">プリセット</div><button class="pill" data-p="soft">やわらか</button><button class="pill" data-p="vivid">くっきり</button><button class="pill" data-p="reset">もどす</button></div>`;
    const apply = () => { bus.emit('look'); };
    body.querySelectorAll('.lk').forEach(i => i.oninput = () => { L[i.dataset.k] = +i.value; i.closest('.row').querySelector('small').textContent = (+i.value).toFixed(2); apply(); });
    body.querySelectorAll('[data-p]').forEach(b => b.onclick = () => { const P = { soft: { exp: 1.08, sun: 0.85, hemi: 1.3, fog: 1.1 }, vivid: { exp: 1.0, sun: 1.3, hemi: 0.8, fog: 1.2 }, reset: { exp: 1, sun: 1, hemi: 1, fog: 1 } }[b.dataset.p]; Object.assign(L, P); apply(); sfx('ui'); renderPanel(); });
  } else if (panelKind === 'deco') {
    h2.textContent = 'にわの かざり';
    body.innerHTML = `<p class="hint">所持コイン: <b style="color:var(--gold2)">${state.coins}</b>　かって、むらの すきな ところに おこう。</p>` + Object.entries(DECO).map(([k, f]) => {
      const own = state.decoOwn[k] || 0, put = state.deco.filter(d => d.k === k).length;
      return `<div class="row"><div class="grow">${f.name}<small>もっている ${own} / おいてる ${put}</small></div>${own > put ? `<button class="pill" data-put="${k}">おく</button>` : ''}<button class="pill" data-buy="${k}" ${state.coins < f.price ? 'disabled' : ''}>かう ${f.price}</button></div>`;
    }).join('');
    body.querySelectorAll('[data-put]').forEach(b => b.onclick = () => { bus.emit('yardPut', b.dataset.put); closePanel(); });
    body.querySelectorAll('[data-buy]').forEach(b => b.onclick = () => { const k = b.dataset.buy, f = DECO[k]; if (state.coins < f.price) return sfx('no'); state.coins -= f.price; state.decoOwn[k] = (state.decoOwn[k] || 0) + 1; sfx('coin'); bus.emit('coins'); renderPanel(); });
  } else if (panelKind === 'decor') {
    h2.textContent = 'もようがえ';
    const sec = (kind, title) => `<p class="hint">${title}</p>` + DECOR[kind].map(d => {
      const own = state.decor[kind + 'Own'].includes(d.n), on = state.decor[kind] === d.n;
      return `<div class="row"><img class="dthumb" src="./assets/interior/${kind}_${d.n}.jpg" alt=""><div class="grow">${d.name}<small>${on ? 'いま つかっている' : own ? 'もっている' : ''}</small></div>${own ? '' : `<span class="price">${d.price}</span>`}<button class="pill" data-d="${kind}:${d.n}:${d.price}" ${on || (!own && state.coins < d.price) ? 'disabled' : ''}>${own ? 'つかう' : 'かう'}</button></div>`;
    }).join('');
    body.innerHTML = `<p class="hint">所持コイン: <b style="color:var(--gold2)">${state.coins}</b>　おうちの ふんいきを かえられるよ。</p>` + sec('wall', 'かべがみ') + sec('floor', 'ゆか');
    body.querySelectorAll('[data-d]').forEach(b => b.onclick = () => {
      const [kind, n, price] = b.dataset.d.split(':'), num = +n, own = state.decor[kind + 'Own'];
      if (!own.includes(num)) { if (state.coins < +price) return sfx('no'); state.coins -= +price; own.push(num); sfx('coin'); bus.emit('coins'); }
      state.decor[kind] = num; sfx('ui'); bus.emit('decor'); renderPanel();
    });
  } else if (panelKind === 'craft') {
    h2.textContent = 'ものづくり';
    const dropIds = Object.keys(ITEMS).filter(i => ITEMS[i].drop), anyHave = () => dropIds.reduce((t, i) => t + count(i), 0);
    body.innerHTML = `<p class="hint">バトルで あつめた ざいりょうで、チモシーボールや もちものを つくれるよ。「どれか」は どの ぞくせいの かけらでも よいよ(もっている かず: ${anyHave()})。</p>` + CRAFT_RECIPES.map(r => {
      const mats = Object.entries(r.need).map(([id, n]) => `<span class="mat ${count(id) >= n ? '' : 'lack'}">${ITEMS[id].name} ${count(id)}/${n}</span>`).join(' ') + (r.any ? ` <span class="mat ${anyHave() >= r.any ? '' : 'lack'}">かけら(どれか) ${anyHave()}/${r.any}</span>` : '');
      const ok = Object.entries(r.need).every(([id, n]) => count(id) >= n) && (!r.any || anyHave() >= r.any);
      return `<div class="row">${itemIcon(r.id)}<div class="grow">${ITEMS[r.id].name}<small>${mats}<br>もっている ×${count(r.id)}</small></div><button class="pill" data-craft="${r.id}" ${ok ? '' : 'disabled'}>つくる</button></div>`;
    }).join('') + '<p class="hint">ざいりょうは バトルの あとに ときどき おちているよ。ぼくじょうの なかまも もってくるよ。</p>';
    body.querySelectorAll('[data-craft]').forEach(b => b.onclick = () => {
      const r = CRAFT_RECIPES.find(x => x.id === b.dataset.craft); if (!r) return;
      if (!Object.entries(r.need).every(([id, n]) => count(id) >= n) || (r.any && anyHave() < r.any)) return sfx('no');
      for (const [id, n] of Object.entries(r.need)) addItem(id, -n);
      let left = r.any || 0; for (const id of dropIds.sort((a, b2) => ITEMS[a].sell - ITEMS[b2].sell)) { while (left > 0 && count(id) > 0) { addItem(id, -1); left--; } }
      addItem(r.id, 1); sfx('quest'); toast('つくった!', ITEMS[r.id].name, '', 1800); renderPanel();
    });
  } else if (panelKind === 'cook') {
    h2.textContent = 'りょうり';
    body.innerHTML = `<p class="hint">ざいりょうを あつめて、暖炉で りょうりを つくろう。りょうりは そのまま売るより 高く売れるよ。</p>` + RECIPES.map(r => {
      const ok = Object.entries(r.need).every(([id, n]) => count(id) >= n), mats = Object.entries(r.need).map(([id, n]) => `<span class="mat ${count(id) >= n ? '' : 'lack'}">${ITEMS[id].name} ${count(id)}/${n}</span>`).join(' ');
      return `<div class="row">${itemIcon(r.id)}<div class="grow">${ITEMS[r.id].name}<small>${mats}</small></div><span class="price">${sellOf(r.id)}</span><button class="pill" data-cook="${r.id}" ${ok ? '' : 'disabled'}>つくる</button></div>`;
    }).join('');
    body.querySelectorAll('[data-cook]').forEach(b => b.onclick = () => { const r = RECIPES.find(x => x.id === b.dataset.cook); if (!r || !Object.entries(r.need).every(([id, n]) => count(id) >= n)) return sfx('no'); for (const [id, n] of Object.entries(r.need)) addItem(id, -n); addItem(r.id, 1); addStat('cook', 1); feed(r.id, 1); sfx('harvest'); renderPanel(); });
  } else if (panelKind === 'ship') {
    h2.textContent = 'しゅっかばこ';
    const ids = Object.keys(state.inv).filter(i => !i.startsWith('seed_') && !ITEMS[i].tool && !ITEMS[i].noSell), inBox = Object.entries(state.ship), sum = inBox.reduce((t, [id, n]) => t + sellOf(id) * n, 0);
    let html = `<p class="hint">はこに入れたものは、あさに まとめて うれるよ。<br>あしたの うりあげ よてい: <b style="color:var(--gold2)">${sum}</b> コイン</p>`;
    if (inBox.length) html += `<p class="hint">はこの中</p>` + inBox.map(([id, n]) => `<div class="row">${itemIcon(id)}<div class="grow">${ITEMS[id].name}<small>×${n}</small></div><button class="pill" data-back="${id}">もどす</button></div>`).join('');
    html += `<p class="hint">もちもの</p>` + (ids.length ? ids.map(id => `<div class="row">${itemIcon(id)}<div class="grow">${ITEMS[id].name} <small>もっている数: ${state.inv[id]}</small></div><span class="price">${sellOf(id)}</span><button class="pill" data-put="${id}" data-n="1">1こ</button><button class="pill" data-put="${id}" data-n="all">ぜんぶ</button></div>`).join('') : '<p class="hint">入れられるものが ないよ。</p>');
    body.innerHTML = html;
    body.querySelectorAll('[data-put]').forEach(b => b.onclick = () => { const id = b.dataset.put, n = b.dataset.n === 'all' ? count(id) : 1; if (!count(id)) return; addItem(id, -n); state.ship[id] = (state.ship[id] || 0) + n; sfx('pick'); renderPanel(); });
    body.querySelectorAll('[data-back]').forEach(b => b.onclick = () => { const id = b.dataset.back; if (!state.ship[id]) return; state.ship[id]--; if (!state.ship[id]) delete state.ship[id]; addItem(id, 1); sfx('ui'); renderPanel(); });
  } else if (panelKind === 'shop') {
    const tane = shopId === 'tane'; h2.textContent = tane ? 'たねや' : 'よろずや';
    let html = (tane ? '' : `<div class="tabs"><button data-t="sell" class="${shopTab === 'sell' ? 'on' : ''}">うる</button><button data-t="buy" class="${shopTab === 'buy' ? 'on' : ''}">かう</button></div>`) + `<p class="hint">所持コイン: <b style="color:var(--gold2)">${state.coins}</b></p>`;
    if (tane) {
      html += SHOP_SEEDS.map(id => { const c = CROPS[id]; return `<div class="row">${itemIcon(id)}<div class="grow">${ITEMS[id].name}<small>${c.name}が そだつよ(まいにち みずやり ${c.days}日で しゅうかく)</small></div><span class="price">${c.price}</span><button class="pill" data-buy="${id}" data-p="${c.price}" ${state.coins < c.price ? 'disabled' : ''}>かう</button></div>`; }).join('') + SHOP_GOODS.tane.map(g => `<div class="row">${itemIcon(g.id)}<div class="grow">${ITEMS[g.id].name}<small>${g.desc}</small></div><span class="price">${g.price}</span><button class="pill" data-buy="${g.id}" data-p="${g.price}" ${state.coins < g.price ? 'disabled' : ''}>かう</button></div>`).join('');
    } else if (shopTab === 'buy') {
      html += bucketRow() + SHOP_GOODS.yorozu.map(g0 => { const g = { ...g0, price: priceOf(g0) }; const an = g.animal ? animalInfo(g.animal) : null, own = g.unique && count(g.id) > 0, full = an && !!an.why; return `<div class="row">${itemIcon(g.id)}<div class="grow">${ITEMS[g.id].name}<small>${['fence', 'hay_roll', 'paver', 'feeder'].includes(g.id) ? `${g.desc}　もっている: ${count(g.id)} / おいた: ${state.fences.filter(f => (f.k || 'fence') === ({ fence: 'fence', hay_roll: 'roll', paver: 'paver', feeder: 'feeder' })[g.id]).length}` : own ? 'もっている' : an ? `いま ${an.n}/${an.cap}　${an.why || g.desc}` : g.desc}</small></div>${own || g.packs ? '' : `<span class="price">${g.price}</span>`}${g.packs ? g.packs.map(n => `<button class="pill" data-buy="${g.id}" data-n="${n}" data-p="${g.price}" ${state.coins < g.price * n ? 'disabled' : ''}>${n}${g.unit || 'ほん'} ${g.price * n}</button>`).join('') : `<button class="pill" data-buy="${g.id}" data-p="${g.price}" ${own || full || state.coins < g.price ? 'disabled' : ''}>${own ? 'かった' : 'かう'}</button>`}</div>`; }).join('');
    } else {
      const ids = Object.keys(state.inv).filter(i => !i.startsWith('seed_') && !ITEMS[i].tool && !ITEMS[i].noSell);
      html += ids.length ? ids.map(id => `<div class="row">${itemIcon(id)}<div class="grow">${ITEMS[id].name} <small>もっている数: ${state.inv[id]}</small></div><span class="price">${sellOf(id)}</span><button class="pill" data-sell="${id}" data-n="1">1こ</button><button class="pill" data-sell="${id}" data-n="all">ぜんぶ</button></div>`).join('') : '<p class="hint">うれるものが ないよ。畑や牧場で そだてて もってこよう。</p>';
    }
    body.innerHTML = html;
    body.querySelectorAll('.tabs button').forEach(b => b.onclick = () => { shopTab = b.dataset.t; sfx('ui'); renderPanel(); });
    body.querySelectorAll('[data-buy]').forEach(b => b.onclick = () => { const id = b.dataset.buy, nn = +(b.dataset.n || 1), p = +b.dataset.p * nn; const ag = SHOP_GOODS.yorozu.find(x => x.id === id && x.animal); if (ag) { const an = animalInfo(ag.animal); if (an.why || state.coins < p) return sfx('no'); state.coins -= p; bus.emit('spawnAnimal', ag.animal); addStat('buy_' + id, 1); sfx('coin'); bus.emit('coins'); return; } if (state.coins < p) return sfx('no'); state.coins -= p; addItem(id, nn); addStat('buy_' + id, nn); sfx('coin'); bus.emit('coins'); });
    body.querySelectorAll('[data-bup]').forEach(b => b.onclick = () => { const lv = state.bucketLv || 0, p = BUCKET.prices[lv + 1]; if (p == null || state.coins < p) return sfx('no'); state.coins -= p; state.bucketLv = lv + 1; sfx('quest'); bus.emit('coins'); toast('バケツ', `グレードアップ! みずが ${BUCKET.caps[lv + 1]}かいぶん はいるよ`, '', 2600); save(); renderPanel(); });
    body.querySelectorAll('[data-sell]').forEach(b => b.onclick = () => { const id = b.dataset.sell, n = b.dataset.n === 'all' ? count(id) : 1; if (!count(id)) return; const total = n * sellOf(id); addItem(id, -n); state.coins += total; addStat('earned', total); sfx('coin'); bus.emit('coins'); });
  }
}
bus.on('inv', renderPanel); bus.on('coins', () => { setCoins(); renderPanel(); });
$('#panelClose').onclick = closePanel;
$('#panel').addEventListener('pointerdown', e => { if (e.target.id === 'panel') closePanel(); });
bus.on('stat', () => { setGoal(); renderPanel(); });

setInterval(() => { try { const lv = villageLevel(); if (state.lastLevel == null) state.lastLevel = lv; else if (lv > state.lastLevel) { state.lastLevel = lv; sfx('quest'); toast('むらレベルアップ!', 'むらレベル ' + lv, 'バトルの つよさボーナスも ふえたよ', 4200); } } catch {}   setLevel(); }, 1000);
const ASV_KEY = 'chinchilla-ranch-asvmsg';
export const autosaveMsg = () => { try { return localStorage.getItem(ASV_KEY) !== '0'; } catch { return true; } };
export const setAutosaveMsg = (on) => { try { localStorage.setItem(ASV_KEY, on ? '1' : '0'); } catch {} };
let asvT = 0;
let manualSave = null;
function saveRowText() {
  const fresh = manualSave && Date.now() - manualSave.t < 600000;
  if (!fresh) return 'セーブ<small>いまの ようすを きろくする</small>';
  const d = new Date(manualSave.t), hm = `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
  return manualSave.ok ? `<b style="color:#9be8a0">セーブしました!</b><small>${hm} に きろくしたよ(もういちど タップで もういちど セーブ)</small>` : `<b style="color:#ff9a8a">セーブできませんでした</b><small>ブラウザの ほぞんスペースが つかえないみたい。「せってい」の「かきだす」で バックアップしてね</small>`;
}
export function showSaved() {
  if (!autosaveMsg()) return; let el = document.getElementById('savemark');
  if (!el) { el = document.createElement('div'); el.id = 'savemark'; el.textContent = 'セーブしました'; document.body.appendChild(el); }
  el.classList.add('on'); clearTimeout(asvT); asvT = setTimeout(() => el.classList.remove('on'), 1400);
}
export function tip(key, title, text) { try { state.tips = state.tips || {}; if (state.tips[key]) return; state.tips[key] = 1; setTimeout(() => toast(title, text, 'ヒント', 5200), 800); } catch {} }
export const ui = { tip, autosaveMsg, setAutosaveMsg, showSaved, toast, feed, setPrompt, setLevel, setStamina, setCoins, setClock, setGoal, drawMinimap, buildMinimap, openPanel, closePanel, togglePanel, panelOpen };

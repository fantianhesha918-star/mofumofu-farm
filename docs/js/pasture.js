// なかまの ぼくじょう: モンスターを あずけておくと、まいあさ コインや ざいりょうを もってきて、すこしずつ せいちょうする
import { state, addItem, bus } from './state.js';
import { DROP_BY_ELEMENT, ITEMS } from './data.js';
import { questData, needExp } from './battle.js';

export const PASTURE_MAX = 12;
export const PASTURE_AT = { x: 14, z: 22, r: 8 };

export function depositMon(i) {
  state.pasture = state.pasture || [];
  if (state.party.length <= 1 || state.pasture.length >= PASTURE_MAX || !state.party[i]) return false;
  const [m] = state.party.splice(i, 1); m.hp = null; state.pasture.push(m); bus.emit('pasture'); return true;
}
export function withdrawMon(i) {
  state.pasture = state.pasture || [];
  if (state.party.length >= 6 || !state.pasture[i]) return false;
  const [m] = state.pasture.splice(i, 1); state.party.push(m); bus.emit('pasture'); return true;
}
// 1日の はじまりに よぶ。もどりち: { coins, items, up:[なまえ], evo:[[まえ,あと]] } か null
export async function pastureDay() {
  state.pasture = state.pasture || []; if (!state.pasture.length) return null;
  const GD = await questData(); let coins = 0; const items = {}, up = [], evo = [];
  for (const m of state.pasture) {
    const d = GD.MONSTERS[m.id]; coins += Math.round(6 + m.lv * 1.4);
    const key = DROP_BY_ELEMENT[d.element || 'none']; if (key && Math.random() < 0.28) items[key] = (items[key] || 0) + 1;
    if (Math.random() < 0.22) items.monster_fur = (items.monster_fur || 0) + 1;
    m.exp = (m.exp || 0) + Math.round(needExp(m.lv, m.id) * 0.25); m.bond = (m.bond || 0) + 1; const lv0 = m.lv;
    while (m.lv < 99 && m.exp >= needExp(m.lv, m.id)) { m.exp -= needExp(m.lv, m.id); m.lv++; }
    if (m.lv > lv0) up.push(d.name);
    const ev = GD.MONSTERS[m.id].evolvesTo; if (ev && m.lv >= ev.level && GD.MONSTERS[ev.id]) { evo.push([d.name, GD.MONSTERS[ev.id].name]); m.id = ev.id; state.mdex[ev.id] = 2; m.moves = null; }
  }
  state.coins += coins; for (const [id, n] of Object.entries(items)) addItem(id, n);
  const res = { day: state.day, coins, items, up, evo }; state.pastureLast = res; bus.emit('coins'); bus.emit('pasture'); return res;
}
export const incomeText = (r) => r ? `${r.coins}コイン` + Object.entries(r.items).map(([id, n]) => `、${ITEMS[id].name}×${n}`).join('') : '';

// カジノ: ディーラーに はなしかけて あそぶ ミニゲーム(docs/casino/*.html は tools/build_casino.py で ボードゲームアプリから とりこみ)。
// かけごとは しない。クリア・じゅんいに おうじて コインが もらえる。
import { state, bus } from './state.js';
import { sfx } from './audio.js';

// コインの ほうしゅう(むずかしさに あわせて)。1日に おなじゲームで まんぞくに もらえるのは FULL_PER_DAY 回まで、そのあとは LATER_RATE ばい
const FULL_PER_DAY = 3, LATER_RATE = 0.2;
export const GAMES = [
  { id: 'othello', name: 'オセロ', desc: 'CPUと たいせん。8×8の ひっくりかえし', hint: 'かち 120 / ひきわけ 50 / まけ 20', pay: { win: 120, draw: 50, lose: 20 } },
  { id: 'babanuki', name: 'ババぬき', desc: 'ジョーカーを もっていたら まけ', hint: 'かち 80 / まけ 15', pay: { win: 80, lose: 15 } },
  { id: 'daifugo', name: 'だいふごう', desc: 'じゅんいで コインが かわるよ', hint: '1い 150 / 2い 100 / 3い 60 / それいか 30', pay: { place: [150, 100, 60, 30] } },
  { id: 'sevens', name: '7ならべ', desc: 'はやく てふだを なくそう', hint: '1い 130 / 2い 90 / 3い 55 / それいか 25', pay: { place: [130, 90, 55, 25] } },
  { id: 'memory', name: 'しんけいすいじゃく', desc: 'おなじ カードを みつけよう(のうトレ)', hint: 'かち 100 / ひきわけ 50 / まけ 20', pay: { win: 100, draw: 50, lose: 20 } },
  { id: 'blackjack', name: 'ブラックジャック', desc: '21に ちかづけよう。ディーラーと しょうぶ', hint: 'かち 80 / ひきわけ 30 / まけ 10', pay: { win: 80, draw: 30, lose: 10 } },
  { id: 'poker', name: 'ポーカー', desc: '5まいで やくを つくる。CPUと しょうぶ', hint: 'かち 100 / ひきわけ 40 / まけ 15', pay: { win: 100, draw: 40, lose: 15 } },
  { id: 'solitaire', name: 'ソリティア', desc: 'ひとりで あそぶ。クリアできたら ごほうび', hint: 'クリア 300', pay: { clear: 300 } },
];

const S = () => { const c = state.casino || (state.casino = { day: 0, n: {} }); if (c.day !== state.day) { c.day = state.day; c.n = {}; } return c; };
const left = (id) => Math.max(0, FULL_PER_DAY - (S().n[id] || 0));

function rewardFor(g, msg) {
  const p = g.pay; let base = 0;
  if (msg.result === 'place') base = p.place ? p.place[Math.min(msg.place, p.place.length) - 1] : 0;
  else base = p[msg.result] || 0;
  if (!base) return 0;
  const c = S(), done = c.n[g.id] || 0; c.n[g.id] = done + 1;
  return Math.round(base * (done < FULL_PER_DAY ? 1 : LATER_RATE));
}

let ov = null, onSave = null;
const E = (h) => { const d = document.createElement('div'); d.innerHTML = h; return d.firstElementChild; };

export function openCasinoMenu(saveFn) {
  if (ov) return; onSave = saveFn;
  ov = E(`<div id="casinoov"><div class="box"><h3>ディーラーの テーブル</h3><p class="lead">あそびたい ゲームを えらんでね。かけごとは しないよ。クリアや じゅんいで コインが もらえるよ</p><div class="glist"></div><button class="pill" id="csClose">たいせきする</button></div></div>`);
  document.body.appendChild(ov); renderList();
  ov.querySelector('#csClose').onclick = closeAll;
}
function renderList() {
  const box = ov.querySelector('.glist');
  box.innerHTML = GAMES.map(g => { const l = left(g.id); return `<button class="gcard" data-g="${g.id}"><b>${g.name}</b><span>${g.desc}</span><small>${g.hint}</small><i>${l > 0 ? `きょうの まんぞくな ごほうび あと ${l}かい` : 'きょうは ごほうびが すくなめ'}</i></button>`; }).join('');
  box.querySelectorAll('.gcard').forEach(b => b.onclick = () => startGame(b.dataset.g));
}
function startGame(id) {
  sfx('ui');
  const g = GAMES.find(x => x.id === id), fr = E(`<div id="casinoplay"><iframe src="casino/${id}.html?v=${Date.now()}" title="${g.name}" allow="fullscreen"></iframe><div class="banner" hidden></div></div>`);
  ov.appendChild(fr); fr.dataset.g = id;
}
function closeGame() { const p = ov && ov.querySelector('#casinoplay'); if (p) p.remove(); if (ov) renderList(); }
function closeAll() { if (ov) { ov.remove(); ov = null; } sfx('ui'); }

window.addEventListener('message', (e) => {
  const m = e.data; if (!m || m.casino !== 1 || !ov) return;
  if (m.close) { closeGame(); return; }
  const play = ov.querySelector('#casinoplay'); if (!play) return;
  const g = GAMES.find(x => x.id === play.dataset.g); if (!g || g.id !== (m.game || g.id)) return;
  const coins = rewardFor(g, m); if (!coins) return;
  state.coins += coins; bus.emit('coins'); sfx('coin'); if (onSave) onSave();
  const b = play.querySelector('.banner'); b.textContent = `コイン +${coins}`; b.hidden = false; b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop');
  setTimeout(() => { if (b) b.hidden = true; }, 3200);
});

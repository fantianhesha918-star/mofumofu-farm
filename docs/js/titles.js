// しょうごう: さくもつ・りょうり・ぼくじょう・つりの きろくで もらえて、プレイヤーの なまえの まえ/うしろに つけられる
import { TITLES, TITLE_CATS } from './data.js';
import { state, bus, save } from './state.js';
import { toast } from './ui.js';

const valOf = (t) => {
  const S = state.stats || {};
  if (t.src === 'ranch') return (S.milk || 0) + (S.egg || 0);
  if (t.src === 'cookKinds' || t.src === 'cropKinds') return Object.keys(state[t.src] || {}).length;
  return S[t.src] || 0;
};
export const titleDone = (t) => !!(state.titles && state.titles[t.id]);

export function checkTitles() {
  state.titles = state.titles || {}; let got = null;
  for (const t of TITLES) if (!state.titles[t.id] && valOf(t) >= t.goal) { state.titles[t.id] = 1; got = t; toast('しょうごう', `「${t.name}」を てにいれた!`, 'むらの ようす から つけられるよ', 4200); }
  if (got) save();
}
bus.on('stat', checkTitles);

// 「あなたの なまえ」に しょうごうを つけた かたち
export function fullName(base) {
  const sel = state.titleSel, t = sel && TITLES.find(x => x.id === sel.id);
  if (!t || !titleDone(t)) return base;
  return sel.pos === 'post' ? `${base} ${t.name}` : `${t.name} ${base}`;
}

export function titlesHtml() {
  const sel = state.titleSel, cats = Object.keys(TITLE_CATS);
  const rows = cats.map(c => {
    const list = TITLES.filter(t => t.cat === c), n = list.filter(titleDone).length;
    return `<p class="hint">${TITLE_CATS[c][0]}　${n}/${list.length}　(${TITLE_CATS[c][1]} +${n * 2}%)</p>` + list.map(t => {
      const done = titleDone(t), v = Math.min(t.goal, valOf(t)), on = sel && sel.id === t.id;
      return done
        ? `<div class="row"><div class="grow"><b style="color:var(--gold2)">${t.name}</b>${on ? ' (つけている)' : ''}<small>${t.desc}</small></div>` + (on ? '<button class="pill" data-tt="off">はずす</button>' : `<button class="pill" data-tt="${t.id}:pre">まえ</button><button class="pill" data-tt="${t.id}:post">うしろ</button>`) + '</div>'
        : `<div class="row" style="opacity:.7"><div class="grow">${t.name}<small>${t.desc}(${v}/${t.goal})</small></div></div>`;
    }).join('');
  }).join('');
  return `<p class="hint" style="margin-top:14px">しょうごう(なまえの「まえ」か「うしろ」に つけられるよ)</p>` + rows;
}

export function bindTitles(body, rerender, changed) {
  body.querySelectorAll('[data-tt]').forEach(b => b.onclick = () => {
    const v = b.dataset.tt; if (v === 'off') state.titleSel = null; else { const [id, pos] = v.split(':'); state.titleSel = { id, pos }; }
    save(); if (changed) changed(); rerender();
  });
}

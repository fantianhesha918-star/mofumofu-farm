// バトルの じょうたいいじょう・のうりょくアップダウン・へんかわざ(ちんちらクエストの わざデータに あとから くわえる)
export const AIL = {
  poison:   { name: 'どく',     msg: 'どくに おかされた!',        dot: 8 },
  burn:     { name: 'やけど',   msg: 'やけどを おった!',          dot: 16 },
  freeze:   { name: 'こおり',   msg: 'こおりづけに なった!' },
  sleep:    { name: 'ねむり',   msg: 'ねむって しまった!' },
  paralyze: { name: 'まひ',     msg: 'からだが しびれて しまった!' },
  confuse:  { name: 'こんらん', msg: 'こんらんして しまった!' },
  leech:    { name: 'やどりぎ', msg: 'やどりぎの たねを うえつけられた!', dot: 8 },
};
export const STAGE_LABEL = { atk: 'こうげき', def: 'ぼうぎょ', spd: 'すばやさ' };
export const stageMult = (n) => (n >= 0 ? 1 + 0.3 * n : 1 / (1 - 0.3 * n));

// へんかわざ(いりょく0)。fx: self=じぶんの のうりょく / foe=あいての のうりょく / heal=HPかいふく / st=じょうたいいじょう ch=かくりつ
const S = (id, name, element, lv, desc, fx) => ({ id, name, element, power: 0, uses: 20, learnLevel: lv, desc, fx });
const UNIVERSAL = [
  S('x_tail',   'しっぽをふる', null, 1,  'しっぽを ふって あいてを ゆだんさせ ぼうぎょを さげる', { foe: { def: -1 } }),
  S('x_growl',  'なきごえ',     null, 1,  'おおきな こえで ないて あいての こうげきを さげる', { foe: { atk: -1 } }),
  S('x_focus',  'きあいだめ',   null, 6,  'きあいを いれて こうげきを あげる', { self: { atk: 1 } }),
  S('x_harden', 'かたくなる',   null, 10, 'からだを かためて ぼうぎょを あげる', { self: { def: 1 } }),
  S('x_glare',  'にらみつける', null, 14, 'あいてを にらんで こうげきを さげる', { foe: { atk: -1 } }),
  S('x_dash',   'ダッシュ',     null, 18, 'かるく はしって すばやさを あげる', { self: { spd: 1 } }),
];
const BY_ELEMENT = {
  fire:    [S('x_onibi', 'おにび', 'fire', 11, 'あやしい ひで あいてを やけどに する', { st: 'burn', ch: 0.85 }), S('x_moeru', 'もえさかる', 'fire', 30, 'ほのおの ちからで こうげきと ぼうぎょが あがる', { self: { atk: 1, def: 1 } })],
  water:   [S('x_koori', 'こごえるいき', 'water', 15, 'つめたい いきで あいてを こおらせる', { st: 'freeze', ch: 0.6 }), S('x_iyashi_w', 'いやしの しずく', 'water', 22, 'みずの めぐみで HPが かいふくする', { heal: 0.4 })],
  grass:   [S('x_doku_g', 'どくの こな', 'grass', 9, 'どくの こなで あいてを どくに する', { st: 'poison', ch: 0.85 }), S('x_yadorigi', 'やどりぎの たね', 'grass', 13, 'あいてから HPを すいとる たねを うえる', { st: 'leech', ch: 0.9 }), S('x_nemuri_g', 'ねむりごな', 'grass', 19, 'ねむりを さそう こなを まく', { st: 'sleep', ch: 0.7 })],
  wind:    [S('x_ayashii_w', 'あやしい かぜ', 'wind', 12, 'ふしぎな かぜで あいてを こんらんさせる', { st: 'confuse', ch: 0.8 }), S('x_oikaze', 'おいかぜ', 'wind', 24, 'かぜに のって すばやさが ぐーんと あがる', { self: { spd: 2 } })],
  earth:   [S('x_nukarumi', 'ぬかるみ', 'earth', 11, 'あしもとを ぬかるませて すばやさを さげる', { foe: { spd: -1 } }), S('x_yoroi_e', 'いわの よろい', 'earth', 26, 'いわを まとって ぼうぎょが ぐーんと あがる', { self: { def: 2 } })],
  thunder: [S('x_denjiha', 'でんじは', 'thunder', 10, 'でんきを ながして あいてを まひさせる', { st: 'paralyze', ch: 0.85 }), S('x_jusei', 'じゅうでん', 'thunder', 28, 'でんきを ためて こうげきが ぐーんと あがる', { self: { atk: 2 } })],
  heaven:  [S('x_inori', 'いやしの いのり', 'heaven', 16, 'いのりで HPが かいふくする', { heal: 0.5 }), S('x_nemuri_h', 'ねむりの うた', 'heaven', 22, 'やさしい うたで あいてを ねむらせる', { st: 'sleep', ch: 0.7 }), S('x_mamori', 'ひかりの まもり', 'heaven', 28, 'ひかりに まもられ こうげきと ぼうぎょが あがる', { self: { atk: 1, def: 1 } })],
  dark:    [S('x_doku_d', 'どくの きり', 'dark', 11, 'どくの きりで あいてを どくに する', { st: 'poison', ch: 0.85 }), S('x_ayashii_d', 'あやしい ひかり', 'dark', 17, 'あやしい ひかりで あいてを こんらんさせる', { st: 'confuse', ch: 0.8 }), S('x_noroi', 'のろいの こえ', 'dark', 23, 'あいての こうげきと ぼうぎょを さげる', { foe: { atk: -1, def: -1 } })],
  magic:   [S('x_nemuri_m', 'ねむりの まほう', 'magic', 14, 'まほうで あいてを ねむらせる', { st: 'sleep', ch: 0.7 }), S('x_madowashi', 'まどわしの つえ', 'magic', 20, 'つえを ふって あいてを こんらんさせる', { st: 'confuse', ch: 0.8 }), S('x_yoroi_m', 'まほうの よろい', 'magic', 30, 'まほうで こうげきと ぼうぎょが あがる', { self: { atk: 1, def: 1 } })],
  beast:   [S('x_dokukiba', 'どくの きばの かまえ', 'beast', 12, 'どくを しこんだ きばで あいてを どくに する', { st: 'poison', ch: 0.85 }), S('x_boso', 'ぼうそう', 'beast', 24, 'あばれて こうげきが ぐーんと あがる', { self: { atk: 2 } })],
};
// ふつうの こうげきわざに くわわる じょうたいいじょうの かくりつ(わざごとに 3つに1つ)
const RULE = { fire: ['burn', 0.2], water: ['freeze', 0.1], thunder: ['paralyze', 0.2], dark: ['poison', 0.2], grass: ['poison', 0.2], wind: ['confuse', 0.15], magic: ['confuse', 0.15], heaven: ['sleep', 0.12], beast: ['poison', 0.15], earth: ['paralyze', 0.1] };
const hash = (s) => [...String(s)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
export function fxOf(sk) {
  if (!sk) return null; if (sk.fx) return sk.fx;
  if (sk._fx !== undefined) return sk._fx;
  const r = sk.power > 0 && sk.element && RULE[sk.element]; sk._fx = r && hash(sk.id) % 3 === 0 ? { st: r[0], ch: r[1] } : null; return sk._fx;
}
export const isStatusSkill = (sk) => !!(sk && sk.power === 0 && sk.fx);
export function fxText(sk) {
  const fx = fxOf(sk); if (!fx) return ''; const out = [];
  if (fx.st) out.push(`${AIL[fx.st].name}${Math.round((fx.ch || 1) * 100)}%`);
  for (const [k, n] of Object.entries(fx.self || {})) out.push(`じぶんの${STAGE_LABEL[k]}${n > 0 ? '↑'.repeat(n) : '↓'}`);
  for (const [k, n] of Object.entries(fx.foe || {})) out.push(`あいての${STAGE_LABEL[k]}${n > 0 ? '↑' : '↓'.repeat(-n)}`);
  if (fx.heal) out.push('HPかいふく');
  return out.join(' / ');
}
// わざデータへ とうろく(なんども よばれても だいじょうぶ)
export function installStatus(GD) {
  if (GD._statusInstalled) return; GD._statusInstalled = true;
  const put = (el, sk) => {
    GD.SKILLS[sk.id] = sk; const tr = GD.COMPANION_SKILL_TRACKS[el]; if (!tr) return; if (tr.includes(sk.id)) return;
    let at = tr.length; for (let i = 0; i < tr.length; i++) { const t = GD.SKILLS[tr[i]]; if (t && (t.learnLevel || 1) > sk.learnLevel) { at = i; break; } }
    tr.splice(at, 0, sk.id);
  };
  for (const el of Object.keys(GD.COMPANION_SKILL_TRACKS)) {
    if (el === 'kami') continue;
    for (const u of UNIVERSAL) put(el, { ...u, element: undefined });
    for (const sk of (BY_ELEMENT[el] || [])) put(el, { ...sk });
  }
}
// てきが つかう へんかわざの こうほ(タイプごと + ぜんタイプ共通のデバフ)
export function enemyStatusPool(GD, element) { return [...(BY_ELEMENT[element] || []).map(s => s.id), 'x_glare', 'x_focus', 'x_harden'].filter(id => GD.SKILLS[id]); }

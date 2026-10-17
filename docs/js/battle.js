// バトル(ちんちらクエストのデータを借りた、1対1のコマンドバトル)
// 主人公は戦わない。手持ちのモンスター(state.party)が戦う。村レベルで ステータスが少し上がる。
import { startSky } from './battlesky.js';
import { AIL, STAGE_LABEL, stageMult, fxOf, fxText, isStatusSkill, installStatus, enemyStatusPool } from './status.js';
import { installExtraMons } from './monsters_extra.js';
import { installExtraSkills, traitSkillsFor } from './skills_extra.js';
import { state, count, addItem, addStat, villageBoost, villageLevel, hasBadge, ECO } from './state.js';
import { ITEMS, HOLD, MON_HEAL, DROP_BY_ELEMENT, BUFFS, buffText, ABILITIES, ABILITY_BY_ELEMENT } from './data.js';
import { itemIcon } from './ui.js';
import { sfx } from './audio.js';
import { playBgm, jingle } from './bgm.js';

let GD = null;
// さいしゅうボス「うちゅうの かみ」の とくべつな わざ(たいよう / ブラックホール / ふたつを あわせた さいきょうの わざ)
const BM = (id, name, element) => ({ id, name, element, power: 26, uses: 99, desc: '', _fx: null });
const BOSS_MOVES = { sun: BM('boss_sun', 'ソーラーコロナ', 'fire'), hole: BM('boss_hole', 'ブラックホール', 'dark'), eclipse: BM('boss_eclipse', 'エクリプスノヴァ', 'kami') };
// ぶつり/まほうの なまえから うごきが きまらない わざは ここで ひとつずつ きめる(なまえと えんしゅつを そろえる)
const MOTION_BY_NAME = { 'しのちょうふく': 'sweep', 'がんせきのちから': 'rain', 'おやこどんナゲット': 'orb', 'やきにくファイヤー': 'orb', 'ひのたま': 'orb', 'タネばくだん': 'orb', 'どろだんご': 'orb', 'エレキボール': 'orb', 'ヒーリングライト': 'orb', 'プラズマヒール': 'orb', 'マジックオーブ': 'orb', 'ドレインタッチ': 'orb', 'すなかけ': 'barrage', 'あわ': 'barrage', 'どろかけ': 'barrage', 'スパーク': 'barrage', 'サンダージャブ': 'barrage', 'サンダーアロー': 'barrage', 'マジックアロー': 'barrage', 'マジックブレット': 'barrage', 'エリアルレイヴ': 'barrage', 'ビーストラッシュ': 'barrage', 'ひっかきラッシュ': 'barrage', 'ベーグルアタック': 'ram', 'サイクラッシュ': 'ram', 'ようがんクラッシュ': 'ram', 'グランドクラッシュ': 'ram', 'イナズマクラッシュ': 'ram', 'だいちのてっけん': 'ram', 'ダークネスストライク': 'ram', 'つきとばし': 'ram', 'とびかかり': 'ram', 'らんぺージ': 'ram', 'ホーリーランス': 'ram', 'かえん': 'beam', 'ねっせん': 'beam', 'みずでっぽう': 'beam', 'ウォータージェット': 'beam', 'でんきショック': 'beam', 'ライトボルト': 'beam', 'チェインライト': 'beam', 'セイクリッドレイ': 'beam', 'ラストライト': 'beam', 'カースアイ': 'beam', 'エレメンタルボルト': 'beam', 'マジックカノン': 'beam', 'ロアー': 'beam', 'デスハウル': 'beam', 'ソウルドレイン': 'beam', 'ピュアフラッシュ': 'beam', 'みずのはね': 'sweep', 'だいれいとう': 'sweep', 'どくのこな': 'sweep', 'すなぼこり': 'sweep', 'はやて': 'sweep', 'ナイトミスト': 'sweep', 'スリープ': 'sweep', 'みずのまい': 'vortex', 'つるのまきつき': 'vortex', 'かぜおこし': 'vortex', 'かぜのおどり': 'vortex', 'スパイラルウィンド': 'vortex', 'ハリケーンブレイク': 'vortex', 'すなじごく': 'vortex', 'ダークバインド': 'vortex', 'テレポート': 'vortex', 'メイルストロム': 'vortex', 'ホーリーストーム': 'vortex', 'ほのおのかべ': 'pillar', 'せいちょう': 'pillar', 'ユグドラシル': 'pillar', 'ストーンエッジ': 'pillar', 'アースウォール': 'pillar', 'すいちょくのちから': 'pillar', 'ライトニングブレイク': 'pillar', 'ギガボルト': 'pillar', 'らいていばんきん': 'pillar', 'カミナリイカヅチ': 'pillar', 'ライトオブヘブン': 'pillar', 'ヘブンズゲート': 'pillar', 'デーモンズゲイト': 'pillar', 'ディメンションゲート': 'pillar', 'しずくのカーテン': 'rain', 'しぜんのめぐみ': 'rain', 'フラワーヒール': 'rain', 'メガトンロック': 'rain', 'シャドウフォール': 'rain', 'スプラッシュ': 'rain', 'ひのもんじ': 'cross', 'つるのムチ': 'cross', 'セイントクロス': 'cross', 'アルティメットセイバー': 'cross', 'しっぽアタック': 'cross', 'べろべろアタック': 'claw', 'フューリーストライク': 'claw', 'かみくだき': 'bite', 'ほのおのちから': 'quake', 'れんごく': 'quake', 'オーシャンブレイク': 'quake', 'しんすいのインパクト': 'quake', 'しぜんのいかり': 'quake', 'グランドネイチャー': 'quake', 'ネイチャーズレイジ': 'quake', 'エアブレイク': 'quake', 'ウィンドバースト': 'quake', 'ガイアインパクト': 'quake', 'アルティメットサンダー': 'quake', 'ラディアンス': 'quake', 'ディバインシールド': 'quake', 'シャイニングサークル': 'quake', 'ルミナスブレイク': 'quake', 'スターライトエクスプロード': 'quake', 'ダークサークル': 'quake', 'ソウルサクリファイス': 'quake', 'ソウルイクリプス': 'quake', 'ワールドオブダーク': 'quake', 'アルティメットダークネス': 'quake', 'マジックシールド': 'quake', 'マナバースト': 'quake', 'マジックサークル': 'quake', 'カオスバースト': 'quake', 'マナブレイク': 'quake', 'アルティメットマジック': 'quake', 'キングオブビースト': 'quake', 'プライマルブレイク': 'quake', 'アルティメットビースト': 'quake', 'ホーリーガード': 'quake' };
// Geminiで つくった えんしゅつの コマ(くろはいけい=screen / しろはいけい=multiply で かさねる)
const NEW_FX = { kami: ['kami_1', 'kami_1b', 'kami_3', 'kami_4', 'kami_5'], dark: ['dark_2', 'dark_3'], magic: ['magic_2', 'magic_3'], beast: ['beast_2'], heaven: ['heaven_2', 'heaven_3'], earth: ['earth_2', 'earth_3'] };
const FX_PARTS = ['part_slash_1', 'part_slash_2', 'part_claw', 'part_bite', 'part_crescent', 'part_ring', 'part_burst', 'part_swirl', 'part_sparkle', 'part_pillar', 'part_beam'];
const registerExtraFx = (G) => {
  if (G._fxExtra) return; G._fxExtra = true; G.ELEMENT_EFFECT_ANIM = G.ELEMENT_EFFECT_ANIM || {};
  for (const [el, names] of Object.entries(NEW_FX)) { const arr = (G.ELEMENT_EFFECT_ANIM[el] = G.ELEMENT_EFFECT_ANIM[el] || []); for (const n of names) arr.push([1, 2, 3, 4].map(k => `assets/effects/anim/${n}/f${k}.webp`)); }
};
const fxBlend = (u) => /\/anim\/earth_[23]\//.test(u) ? 'multiply' : /\/anim\/(kami_|dark_[23]|magic_[23]|beast_2|heaven_[23])/.test(u) ? 'screen' : '';
const fxSeen = new Set();
const preloadFx = (G) => { try { const L = [...Object.values(G.ELEMENT_EFFECTS || {}), ...Object.values(G.ELEMENT_EFFECT_ANIM || {}).flat(2), ...FX_PARTS.map(n => `assets/effects/parts/${n}.webp`), 'assets/effects/boss/boss_sun.webp', 'assets/effects/boss/boss_hole.webp']; for (const u of L) if (!fxSeen.has(u)) { fxSeen.add(u); const i = new Image(); i.src = 'quest/' + u; } } catch (e) {} };   // わざの えを さきに よみこむ(こうかいばんで おくれて でないように)
export function questData() {
  return new Promise((res, rej) => {
    if (window.GAME_DATA) { GD = window.GAME_DATA; installStatus(GD); installExtraSkills(GD); installExtraMons(GD); registerExtraFx(GD); setTimeout(() => preloadFx(GD), 2500); return res(GD); }
    const s = document.createElement('script'); s.src = 'quest/data.js?v=' + (new URL(import.meta.url).searchParams.get('v') || ''); s.onload = () => { GD = window.GAME_DATA; installStatus(GD); installExtraSkills(GD); installExtraMons(GD); registerExtraFx(GD); setTimeout(() => preloadFx(GD), 2500); res(GD); }; s.onerror = rej; document.head.appendChild(s);
  });
}
const img = (p) => 'quest/' + p;
// 画像の下の透明な余白の割合(足もとを台に合わせるため)
function bottomPad(el) {
  try { const c = document.createElement('canvas'), W = 48, H = 48; c.width = W; c.height = H; const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(el, 0, 0, W, H); const d = g.getImageData(0, 0, W, H).data;
    for (let y = H - 1; y >= 0; y--) for (let x = 0; x < W; x++) if (d[(y * W + x) * 4 + 3] > 40) return (H - 1 - y) / H; } catch (e) {} return 0;
}
export const BALL_IDS = ['nakama_ball', 'super_ball', 'hyper_ball', 'master_ball'];
export const SPEED_KEY = 'chinchilla-ranch-bspeed';
export const battleSpeed = () => { try { return Math.max(1, +localStorage.getItem(SPEED_KEY) || 1); } catch { return 1; } };
const sleep = (ms) => new Promise(r => setTimeout(r, ms / battleSpeed()));
// しんかの えんしゅつ: しんかまえ ⇔ しんかご を しろく ひからせながら だんだん はやく いれかえて、さいごに ひかりが はじける(ポケモンふう)
export async function evoSwap(el, oldImage, newImage, wait = (ms) => new Promise(r => setTimeout(r, ms))) {   // しんかしたら true、「やめる」を おされたら false
  const oldSrc = img(oldImage), newSrc = img(newImage), pre = new Image(); pre.src = newSrc; try { await pre.decode(); } catch {}
  const keep = el.style.filter; let showNew = false, stop = false; el.style.transition = 'filter .06s linear';
  const btn = document.createElement('button'); btn.id = 'evoStop'; btn.className = 'pill'; btn.textContent = 'しんかを やめる'; document.body.appendChild(btn);
  const onKey = (e) => { if (e.key === 'Escape') stop = true; }; addEventListener('keydown', onKey); btn.onclick = () => { stop = true; };
  const step = async (ms) => { await wait(ms); return !stop; };
  const WHITE = 'brightness(12) saturate(0)'; let ok = true;
  el.style.filter = 'brightness(1.8)'; ok = await step(500);
  for (const d of [380, 340, 300, 265, 230, 200, 170, 145, 125, 108, 95, 85, 78]) {
    if (!ok) break;
    el.style.filter = WHITE; ok = await step(d * 0.4); if (!ok) break; showNew = !showNew; el.src = showNew ? newSrc : oldSrc; el.style.filter = 'brightness(1.15)'; ok = await step(d * 0.6);
  }
  btn.remove(); removeEventListener('keydown', onKey);
  if (!ok) { el.src = oldSrc; el.style.transition = ''; el.style.filter = keep; return false; }
  el.style.filter = WHITE; await wait(260); el.src = newSrc; await wait(120);
  el.style.transition = 'filter .7s ease-out'; el.style.filter = 'brightness(1)'; await wait(700); el.style.transition = ''; el.style.filter = keep; return true;
}
// バトルの そと(なかまがめん)で しんかいしを つかうとき: がめんの まんなかで えんしゅつ
export async function evoOverlay(oldImage, newImage, oldName = '', newName = '') {   // しんかしたら true
  const ov = document.createElement('div'); ov.id = 'evoov'; ov.innerHTML = '<img alt=""><div class="evotel"></div>'; document.body.appendChild(ov);
  const im = ov.querySelector('img'), tel = ov.querySelector('.evotel'), w = (ms) => new Promise(r => setTimeout(r, ms));
  im.src = img(oldImage); await new Promise(r => { im.onload = r; setTimeout(r, 800); });
  tel.textContent = `おや…? ${oldName} の ようすが…!`; sfx('quest'); await w(1500);
  const done = await evoSwap(im, oldImage, newImage); await w(400);
  if (done) { tel.textContent = `${oldName} は ${newName} に しんかした!`; jingle('win'); await w(2400); } else { tel.textContent = 'なにも おきなかった…'; await w(1600); }
  ov.remove(); return done;
}
const $ = (s, el = document) => el.querySelector(s);

// タイプ(属性)のチップ。ちんちらクエストの属性アイコンを使う
export const elemName = (el) => (el && GD.ELEMENT_LABELS[el]) || 'ノーマル';
export const elemChip = (el) => `<span class="ty ty-${el || 'none'}">${el && GD.ELEMENT_ICONS && GD.ELEMENT_ICONS[el] ? `<img src="quest/${GD.ELEMENT_ICONS[el]}" alt="">` : ''}${elemName(el)}</span>`;
// 相性のヒント(わざを えらぶとき: こうげき側のタイプ → 相手のタイプ)
const EL_ORDER = ['fire', 'water', 'grass', 'wind', 'earth', 'thunder', 'heaven', 'dark', 'magic', 'beast'];
export const weakOf = (defEl) => (defEl && defEl !== 'none') ? EL_ORDER.filter(x => GD.getElementMatchup(x, defEl).tier === 'strong') : [];
export const resistOf = (defEl) => (defEl && defEl !== 'none') ? EL_ORDER.filter(x => GD.getElementMatchup(x, defEl).tier === 'weak') : [];
export const weakLine = (defEl) => { const w = weakOf(defEl), r = resistOf(defEl); return (w.length ? `<span class="wk wk-s">ばつぐん ${w.map(elemChip).join('')}</span>` : '') + (r.length ? `<span class="wk wk-w">いまひとつ ${r.map(elemChip).join('')}</span>` : ''); };
export const matchHint = (atkEl, defEl) => { const t = GD.getElementMatchup(atkEl, defEl).tier; return t === 'strong' ? '<b class="mu-s">◎ ばつぐん ×2</b>' : t === 'weak' ? '<b class="mu-w">△ いまひとつ ×0.5</b>' : ''; };
// レベルアップに いる けいけんち(はやい・ふつう・おそい はモンスターごと。しんかする まえの こは はやく、さいごの すがたの つよい こは ゆっくり)
export const growthMul = (id) => {
  const d = GD.MONSTERS[id]; if (!d) return 1;
  if (d.evolvesTo || d.evolveStone) return 0.9;
  if (/^(legend_|kami_|shinju_|shitennou_)/.test(id) || id === 'dragon') return 1.3;
  return d.level >= 20 ? 1.15 : 1;
};
export const needExp = (lv, id) => Math.max(6, Math.round(GD.expToNext(lv) * 0.6 * (id ? growthMul(id) : 1)));   // スピーディに レベルアップ
// あいての レベルと じぶんの レベルの さで もらえる けいけんちが かわる(ポケモンふう)。じょばんは おおめ
export const expLevelMul = (myLv, foeLv) => {
  const r = Math.pow((2 * foeLv + 10) / (foeLv + myLv + 10), 2.5);
  return Math.max(0.3, Math.min(3, r)) * (myLv <= 12 ? 1.25 - myLv * 0.02 : 1);
};
export const bondLv = (m) => Math.min(5, Math.floor((m.bond || 0) / 5));   // なかよしレベル(0〜5): すこしだけ つよくなる
// まほう系のステータス: こうげき・ぼうぎょを もとに、タイプとなまえで すこしずつ ちがいを つける
const MAGIC_PROFILE = { fire: [1.2, 0.8], water: [1.05, 1.15], grass: [0.9, 1.1], wind: [1.1, 0.9], earth: [0.75, 0.9], thunder: [1.2, 0.8], heaven: [1.1, 1.25], dark: [1.15, 1.0], magic: [1.3, 1.2], beast: [0.75, 0.8], kami: [1.25, 1.25] };
export const monName = (m) => (m && m.nick) || GD.MONSTERS[m.id].name;   // ニックネームが あれば それを つかう
const hashId = (id) => [...String(id)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
export function magicOf(id, element, atk, dfn) {
  const pr = MAGIC_PROFILE[element] || [1, 1], h = hashId(id);
  return { matk: Math.max(1, Math.round(atk * pr[0] * (0.92 + (h % 17) * 0.01))), mdef: Math.max(1, Math.round(dfn * pr[1] * (0.92 + ((h >> 5) % 17) * 0.01))) };
}
// わざが ぶつり か まほう か(タイプと なまえから クロコが ふりわけ)
const MAGIC_EL = new Set(['fire', 'water', 'wind', 'thunder', 'heaven', 'dark', 'magic', 'kami']);
const PHYS_NAME = /アタック|たいあたり|ずつき|タックル|スラッシュ|クラッシュ|ひっかき|パンチ|キック|かみつ|ファング|クロー|チャージ|ラッシュ|ストライク|スピア|ブレード|ソード|カッター|ナゲット|プレス|ぶつけ|なげ|てっけん|つので|しっぽ/;
const MAGIC_NAME = /ブラスト|ウェーブ|フィールド|ストーム|ネイチャー|ヒール|クエイク|ノヴァ|ガイア|ブレス|ハウリング|ビーム|オーラ|のろい|ねむり/;
export const skillKind = (sk) => { const n = sk.name || ''; if (PHYS_NAME.test(n)) return 'phys'; if (MAGIC_EL.has(sk.element)) return 'magic'; return MAGIC_NAME.test(n) ? 'magic' : 'phys'; };
export const kindLabel = (sk) => isStatusSkill(sk) ? 'へんか' : skillKind(sk) === 'magic' ? 'まほう' : 'ぶつり';
export const skillShort = (s) => s.power > 0 ? `いりょく ${s.power}　${kindLabel(s)}${fxText(s) ? '　' + fxText(s) : ''}` : `へんか　${fxText(s)}`;
export function abilityOf(id) { const el = (GD.MONSTERS[id] && GD.MONSTERS[id].element) || 'none', list = ABILITY_BY_ELEMENT[el] || ABILITY_BY_ELEMENT.none; return list[(hashId(id) >>> 3) % list.length]; }
export const holdOf = (m) => (m && m.held && HOLD[m.held]) || {};
export const abilityName = (id) => ABILITIES[abilityOf(id)].name;
export function monStats(m) {
  const def = GD.MONSTERS[m.id], st = GD.getCompanionStats(def, m.lv), b = 1 + villageBoost() + bondLv(m) * 0.03 + (hasBadge('volcano') ? 0.05 : 0) + (hasBadge('end') ? 0.1 : 0), q = (k) => (hasBadge(k) ? 1.08 : 1);
  const atk = Math.round(st.atk * b * q('sun')), dfn = Math.round(st.def * b * q('castle')), mg = magicOf(m.id, def.element, atk, dfn);
  const crit = Math.min(35, Math.round(5 + m.lv * 0.1 + bondLv(m) * 1.5)), luck = 5 + (hashId(m.id) % 8) + Math.floor(m.lv / 6) + bondLv(m) * 2;
  const out = { maxHp: Math.round(st.maxHp * b * q('cosmos')), atk, def: dfn, matk: mg.matk, mdef: mg.mdef, spd: Math.round(st.spd * b * q('temple')), crit, luck: luck + (holdOf(m).luck || 0) };
  const nt = natureOf(m); if (nt.up) { out[nt.up[0]] = Math.round(out[nt.up[0]] * 1.08); out[nt.down[0]] = Math.max(1, Math.round(out[nt.down[0]] * 0.94)); }
  return out;
}
export function giveStarter(id) {
  if (state.party.length) return false;
  id = id || 'mame_chin'; state.party.push({ id, lv: 5, exp: 0, hp: null }); state.mdex[id] = 2; return true;
}
export function giveMon(id, lv = 5) {   // てもちに くわえる(いっぱいなら ぼくじょうへ)。'party' | 'pasture' | null
  const m = { id, lv, exp: 0, hp: null }; state.mdex[id] = 2;
  if (state.party.length < 6) { state.party.push(m); return 'party'; }
  if (state.pasture.length < 12) { state.pasture.push(m); return 'pasture'; }
  return null;
}
export const markCaught = (id) => { state.mdex[id] = 2; };
const hpOf = (m) => m.hp == null ? monStats(m).maxHp : m.hp;
// おぼえている技(属性ごとのトラック。レベルで ふえる) と、バトルで つかう技(さいだい4つ)
// さいしょは シンプルな 3つ(たいあたり・しっぽをふる・なきごえ)。ほかの わざは レベルが あがるほど ゆっくり ふえる
const BASIC_SKILLS = ['tackle', 'x_tail', 'x_growl'];
export function learnLv(sk) { if (!sk) return 99; if (BASIC_SKILLS.includes(sk.id)) return 1; const b = sk.learnLevel || 1; return b <= 1 ? 4 : b + 3; }
export function knownOf(m) {
  const def = GD.MONSTERS[m.id], tr = GD.COMPANION_SKILL_TRACKS[def.element] || GD.COMPANION_SKILL_TRACKS.none, seen = new Set();
  const out = tr.filter(s => GD.SKILLS[s] && learnLv(GD.SKILLS[s]) <= m.lv && !seen.has(s) && seen.add(s));
  for (const t of traitSkillsFor(GD, m.id, def.element)) if (GD.SKILLS[t.id] && m.lv >= learnLv(GD.SKILLS[t.id]) + t.lvAdd && !out.includes(t.id)) out.push(t.id);   // つめ・はね・つの など とくちょうに あわせた ほかの タイプの わざ
  for (const g of (GD.SIG_BY_FORM && GD.SIG_BY_FORM[m.id]) || []) if (m.lv >= g.lv && !out.includes(g.id)) out.push(g.id);   // オリジナルわざ(御三家・でんせつ)は さいごに くわえる = じどうで えらばれやすい
  return out;
}
export function nextSkillText(m) {   // つぎに おぼえる わざ
  const def = GD.MONSTERS[m.id], tr = GD.COMPANION_SKILL_TRACKS[def.element] || GD.COMPANION_SKILL_TRACKS.none, nx = tr.map(x => GD.SKILLS[x]).filter(x => x && learnLv(x) > m.lv).sort((p, q) => learnLv(p) - learnLv(q))[0];
  return nx ? `${nx.name}(Lv${learnLv(nx)})` : 'ぜんぶ おぼえた';
}
export function movesOf(m) {
  const k = knownOf(m); m.moves = (m.moves || []).filter(s => k.includes(s));
  {   // オリジナルわざ: おぼえているのに まだ みていない なかまには 1どだけ じどうで セット(いちばん つよい 1つ。こうげきわざは 3つ のこす)
    const gs = ((GD.SIG_BY_FORM && GD.SIG_BY_FORM[m.id]) || []).filter(g => m.lv >= g.lv); m.sigSeen = m.sigSeen || {};
    const fresh = gs.filter(g => !m.sigSeen[g.id]); fresh.forEach(g => { m.sigSeen[g.id] = 1; });
    const g = fresh[fresh.length - 1];
    if (g && !m.moves.includes(g.id)) {
      if (m.moves.length < 4) m.moves.push(g.id);
      else {
        const atk = m.moves.map((x, i) => [x, i]).filter(([x]) => (GD.SKILLS[x].power || 0) > 0), st = m.moves.map((x, i) => [x, i]).filter(([x]) => !((GD.SKILLS[x].power || 0) > 0));
        const pool = atk.length >= 3 || !st.length ? atk : st;   // こうげきわざが すくない ときは へんかわざを いれかえる
        pool.sort((a, b) => (GD.SKILLS[a[0]].power || 0) - (GD.SKILLS[b[0]].power || 0)); m.moves[(pool[0] || [0, 0])[1]] = g.id;
      }
    }
  }
  for (let i = k.length - 1; i >= 0 && m.moves.length < 4; i--) if (!m.moves.includes(k[i])) m.moves.push(k[i]);   // たりなければ つよい技から
  return m.moves.map(s => GD.SKILLS[s]);
}
export const skillText = (s) => `${skillShort(s)}　タイプ: ${elemName(s.element)}`;
// バトルの ドロップ: 倒した(つかまえた)あいての タイプの かけら か もふもふの けがわ
export function rollDrops(def, boss) {
  const out = {}, add = (id, n) => { out[id] = (out[id] || 0) + n; }, el = def.element || 'none', key = DROP_BY_ELEMENT[el];
  if (key && Math.random() < (boss ? 1 : 0.55)) add(key, boss ? 2 + Math.floor(Math.random() * 2) : 1);
  if (Math.random() < (boss ? 1 : 0.4)) add('monster_fur', boss ? 3 : 1 + (Math.random() < 0.3 ? 1 : 0));
  if (el === 'kami' || def.level >= 80) { if (Math.random() < (boss ? 0.7 : 0.2)) add('god_scale', 1); }
  return out;
}
export function evoText(m) { if (m.id === 'mame_chin') return 'しんか: しんかいしで ぞくせいを えらんで しんか(Lv10から)'; const es = GD.MONSTERS[m.id].evolveStone; if (es && GD.MONSTERS[es.id]) return `しんか: ${ITEMS['evo_' + es.el].name}で ${GD.MONSTERS[es.id].name}に(Lv${es.level}から)`; const ev = GD.MONSTERS[m.id].evolvesTo; if (!ev || !GD.MONSTERS[ev.id]) return 'しんか: もう さいごの すがた'; const left = ev.level - m.lv; return left > 0 ? `しんか: Lv${ev.level}で ${GD.MONSTERS[ev.id].name}に(あと ${left}レベル)` : `しんか: ${GD.MONSTERS[ev.id].name}に なれるよ!`; }
// しんかいしで しんかする なかま(まめちんちら=ぞくせいを えらぶ / ほかは そのぞくせいの いしで 1ぽん みち)
export function stoneTarget(m, stoneId) {
  const el = ITEMS[stoneId] && ITEMS[stoneId].evo; if (!el) return null;
  if (m.id === 'mame_chin') { const to = 'mame_chin_' + el; return GD.MONSTERS[to] ? { id: to, level: 10 } : null; }
  const es = GD.MONSTERS[m.id] && GD.MONSTERS[m.id].evolveStone;
  return es && es.el === el && GD.MONSTERS[es.id] ? { id: es.id, level: es.level || 1 } : null;
}
export const canStoneEvolve = (m) => m.id === 'mame_chin' || !!(GD.MONSTERS[m.id] && GD.MONSTERS[m.id].evolveStone);
export function evolveWithStone(m, stoneId) {   // せいこうで true
  const t = stoneTarget(m, stoneId);
  if (!t || m.lv < t.level || !count(stoneId)) return false;
  const ratio = Math.max(0.1, hpOf(m) / monStats(m).maxHp); addItem(stoneId, -1); m.id = t.id; state.mdex[t.id] = 2; m.hp = Math.round(monStats(m).maxHp * ratio); m.moves = null; movesOf(m); return true;
}
export function healParty() { for (const m of state.party) { m.hp = null; m.pp = null; } }
// わざの PP(のこりかい数)。ベッドで ねると ぜんかいふく
const STRUGGLE = { id: 'struggle', name: 'わるあがき', power: 30, uses: 99, desc: 'わざが つきたとき の さいごの ていこう(じぶんも きずつく)' };
export const ppMax = (s) => s.uses || 20;
export const ppOf = (m, s) => (m.pp && m.pp[s.id] != null) ? m.pp[s.id] : ppMax(s);
// てんき・じかんの えいきょう
const ENV_WX = { rain: { water: 1.2, thunder: 1.1, fire: 0.85 }, storm: { thunder: 1.3, wind: 1.2, fire: 0.8 }, fog: { dark: 1.2, magic: 1.15, heaven: 0.9 }, snow: { water: 1.1, heaven: 1.15, fire: 0.8, grass: 0.9 }, clear: {} };
const ENV_NAME = { rain: 'あめ', storm: 'あらし', fog: 'きり', snow: 'ゆき' };
export const isNight = (h) => h != null && (h >= 20 || h < 5);
export const envMul = (wx, hour, el) => ((ENV_WX[wx] || {})[el] || 1) * (isNight(hour) ? ({ dark: 1.15, heaven: 0.9 }[el] || 1) : ({ heaven: 1.08 }[el] || 1));
export const envText = (wx, hour) => { const t = []; if (ENV_NAME[wx]) t.push(`${ENV_NAME[wx]}の ちから`); if (isNight(hour)) t.push('よるの ちから'); return t.length ? t.join('と ') + ' が はたらいている…' : ''; };
// なかまの せいかく(のびる ステータスが ちがう)
export const NATURES = {
  yancha:   { name: 'やんちゃ',   up: ['atk', 'こうげき'],       down: ['def', 'ぼうぎょ'] },
  ottori:   { name: 'おっとり',   up: ['matk', 'まほう'],        down: ['spd', 'すばやさ'] },
  sekkachi: { name: 'せっかち',   up: ['spd', 'すばやさ'],       down: ['def', 'ぼうぎょ'] },
  nonbiri:  { name: 'のんびり',   up: ['def', 'ぼうぎょ'],       down: ['spd', 'すばやさ'] },
  reisei:   { name: 'れいせい',   up: ['mdef', 'まほうぼうぎょ'], down: ['atk', 'こうげき'] },
  genki:    { name: 'げんき',     up: ['maxHp', 'HP'],           down: ['matk', 'まほう'] },
  majime:   { name: 'まじめ',     up: null,                      down: null },
};
export const natureOf = (m) => { if (!m.nature || !NATURES[m.nature]) { const ks = Object.keys(NATURES); m.nature = ks[(hashId(m.id) + (m.lv || 1) * 7 + Math.floor(Math.random() * 100)) % ks.length]; } return NATURES[m.nature]; };
export const natureText = (m) => { const n = natureOf(m); return n.up ? `${n.name}(${n.up[1]}↑ ${n.down[1]}↓)` : `${n.name}(ふつう)`; };
export const askNickOn = () => { try { return localStorage.getItem('chinchilla-ranch-asknick') !== '0'; } catch { return true; } };
export const assistOn = () => { try { return localStorage.getItem('chinchilla-ranch-assist') !== '0'; } catch { return true; } };


// 1戦。結果: 'win' | 'lose' | 'run' | 'caught'
export async function runBattle(enemyId, opts = {}) {
  await questData();
  if (!state.party.length) giveStarter();
  const base = GD.MONSTERS[enemyId], def = { ...base, ...(opts.boss || {}), ...(opts.over || {}) }, eLv = def.level, e = { id: enemyId, lv: eLv, maxHp: def.hp, hp: def.hp, atk: def.atk, def: def.def, spd: def.spd, ...magicOf(enemyId, def.element, def.atk, def.def) };
  if (!state.mdex[enemyId]) state.mdex[enemyId] = 1;
  e.ab = abilityOf(enemyId); let buff = null, aFort = false, eFort = false;
  const E = { stg: { atk: 0, def: 0, spd: 0 }, ail: null }, fxMap = new Map();
  const fought = new Set();   // このバトルで でた なかま
  let guarding = false, bossPhase = 0, chargeT = 0, charged = false, sup = null;   // ぼうぎょ・ぬしの へんか・サポートの なかま
  const xpLog = [];   // じょうたいいじょう・のうりょくの ランク(このバトルだけ)
  const sd = (side) => { if (side === 'e') return E; const m = state.party[ai]; return fxMap.get(m) || fxMap.set(m, { stg: { atk: 0, def: 0, spd: 0 }, ail: null }).get(m); };
  let ai = state.party.findIndex(m => hpOf(m) > 0);
  if (ai < 0) { state.party[0].hp = 1; ai = 0; }   // 全員たおれていても、先頭が1だけ元気に
  const root = document.createElement('div'); root.id = 'bt';
  root.innerHTML = `<div class="bt-field" style="--bg:url(${img('assets/battlefields/' + (opts.bg || 'battle_grass.webp'))})"><div class="bt-bg"></div>
    <div class="bt-card bt-e"><b class="n"></b><span class="lv"></span><div class="tys"></div><div class="hp"><i></i></div></div>
    <img class="bt-img bt-eimg" alt="">
    <div class="bt-card bt-a"><b class="n"></b><span class="lv"></span><div class="tys"></div><div class="hp"><i></i></div><small class="hpn"></small><div class="xp"><i></i></div></div>
    <img class="bt-img bt-aimg" alt="">
    <div class="bt-pop"></div>
  </div><div class="bt-ui"><div class="bt-msg"></div><div class="bt-cmd"></div></div>`;
  document.body.appendChild(root);
  try { startSky($('.bt-field', root), opts.bg || 'battle_grass.webp'); } catch (e) { console.warn('sky failed', e); }
  // 背景の「丸い台」にモンスターの足もとを合わせる(背景は cover 表示なので、表示倍率からピクセル位置を計算)
  const layout = () => {
    const f = $('.bt-field', root), w = f.clientWidth, h = f.clientHeight; if (!w || !h) return;
    const land = w > h * 1.15, s = land ? h / 760 : Math.max(w / 800, h / 1200), ox = (w - 800 * s) / 2, oy = land ? -300 * s : (h - 1200 * s) / 2, P = (x, y) => [ox + x * s, oy + y * s];
    const bg = $('.bt-bg', root); bg.style.backgroundSize = `${800 * s}px ${1200 * s}px`; bg.style.backgroundPosition = `${ox}px ${oy}px`;
    const BG_AN = { 'battle_castle.webp': { e: [567, 433], a: [233, 817] }, 'battle_temple.webp': { e: [550, 417], a: [293, 867] }, 'battle_sun.webp': { e: [567, 433], a: [283, 817] }, 'battle_grove.webp': { e: [500, 383], a: [300, 850] }, 'battle_dragon.webp': { e: [500, 400], a: [300, 867] }, 'battle_end.webp': { e: [550, 433], a: [267, 833] }, 'battle_cosmos.webp': { e: [567, 433], a: [300, 817] }, 'battle_ghost.webp': { e: [533, 423], a: [293, 800] }, 'battle_forest.webp': { e: [567, 433], a: [293, 833] }, 'battle_sky.webp': { e: [650, 383], a: [267, 800] } };
    const AN = BG_AN[opts.bg] || (opts.bg === 'battle_water.webp' ? { e: [598, 388], a: [282, 932] } : opts.bg === 'battle_volcano.webp' ? { e: [590, 588], a: [282, 892] } : opts.bg === 'battle_cave.webp' ? { e: [600, 398], a: [292, 858] } : { e: [562, 392], a: [265, 890] }), [ex, ey] = P(...AN.e), [ax, ay] = P(...AN.a), ew = Math.min(400 * s * 0.62, w * 0.5), aw = Math.min(480 * s * 0.62, w * 0.55);
    const place = (el, cx, cy, W) => { const dispH = el.naturalWidth ? W * el.naturalHeight / el.naturalWidth : 0, extra = (el._pad || 0) * dispH; el.style.width = W + 'px'; el.style.left = (cx - W / 2) + 'px'; el.style.bottom = (h - cy - 4 * s - extra) + 'px'; el.style.top = 'auto'; el.style.right = 'auto'; el.style.maxHeight = (cy - 8) + 'px'; };
    place($('.bt-eimg', root), ex, ey, ew); place($('.bt-aimg', root), ax, ay, aw);
  };
  layout(); const onR = () => layout(); addEventListener('resize', onR); setTimeout(layout, 60); const ro = new ResizeObserver(layout); ro.observe($('.bt-field', root));
  const msg = (t) => { $('.bt-msg', root).textContent = t; };
  const pop = (side, txt, cls) => { const p = $('.bt-pop', root); p.className = 'bt-pop ' + (cls || '') + ' ' + side; p.textContent = txt; void p.offsetWidth; p.classList.add('on'); };
  const eImg = $('.bt-eimg', root), aImg = $('.bt-aimg', root);
  eImg.src = img(def.image); eImg.onload = () => { eImg._pad = bottomPad(eImg); layout(); };
  // ステータス(とくせい・りょうりバフ こみ)
  const allyStats = () => {
    const a = state.party[ai], st = { ...monStats(a) }, ab = abilityOf(a.id);
    if (buff) { st.atk *= buff.atk || 1; st.matk *= buff.atk || 1; st.def *= buff.def || 1; st.mdef *= buff.def || 1; st.spd *= buff.spd || 1; st.crit += buff.crit || 0; }
    if (ab === 'swift') st.spd *= 1.15; if (ab === 'sharp') st.crit += 10;
    const ho = holdOf(a); if (ho.atk) { st.atk *= ho.atk; st.matk *= ho.atk; } if (ho.def) { st.def *= ho.def; st.mdef *= ho.def; } if (ho.spd) st.spd *= ho.spd; if (ho.crit) st.crit += ho.crit;
    const S = sd('a'); st.atk *= stageMult(S.stg.atk); st.matk *= stageMult(S.stg.atk); st.def *= stageMult(S.stg.def); st.mdef *= stageMult(S.stg.def); st.spd *= stageMult(S.stg.spd);
    if (S.ail && S.ail.k === 'paralyze') st.spd *= 0.5; if (S.ail && S.ail.k === 'burn') st.atk *= 0.75;
    for (const k of ['atk', 'matk', 'def', 'mdef', 'spd']) st[k] = Math.round(st[k]); return st;
  };
  // じょうたいいじょうの アニメ(Blenderで つくった コマ送りの えを モンスターの うえに かさねる)
  const ailEl = { a: null, e: null };
  const syncAil = () => {
    for (const side of ['a', 'e']) {
      const S = sd(side), k = S.ail && S.ail.k; let el = ailEl[side];
      if (!k || hpNow(side) <= 0) { if (el) { el.remove(); ailEl[side] = null; } continue; }
      if (!el) { el = document.createElement('div'); el.className = 'ailfx'; fieldEl.appendChild(el); ailEl[side] = el; }
      if (el.dataset.k !== k) { el.dataset.k = k; el.style.backgroundImage = `url(assets/ailfx/${k}.webp)`; }
      const r = rectOf(imgOf(side)), sz = Math.max(r.w, r.h) * 1.15; el.style.width = el.style.height = sz + 'px'; el.style.left = (r.x - sz / 2) + 'px'; el.style.top = (r.y - sz / 2) + 'px';
    }
  };
  const enemySpd = () => e.spd * (e.ab === 'swift' ? 1.15 : 1) * stageMult(E.stg.spd) * (E.ail && E.ail.k === 'paralyze' ? 0.5 : 1);
  const eS = (k) => { let v = e[k]; if (k === 'atk' || k === 'matk') v *= stageMult(E.stg.atk); else v *= stageMult(E.stg.def); if (k === 'atk' && E.ail && E.ail.k === 'burn') v *= 0.75; return v; };
  const chips = (S) => (S.ail ? `<span class="ail ail-${S.ail.k}">${AIL[S.ail.k].name}</span>` : '') + Object.entries(S.stg).filter(([, n]) => n).map(([k, n]) => `<span class="bf${n < 0 ? ' dn' : ''}">${STAGE_LABEL[k]}${n > 0 ? '+' : ''}${n}</span>`).join('');
  const draw = () => {
    const a = state.party[ai], st = monStats(a); fought.add(a); const ad = GD.MONSTERS[a.id], aHp = hpOf(a);
    $('.bt-e .n', root).innerHTML = def.name + (state.mdex[enemyId] === 2 ? '<img class="gotmark" src="quest/assets/items/icon_ball_timothy.webp" alt="つかまえずみ">' : ''); $('.bt-e .lv', root).textContent = 'Lv' + e.lv; $('.bt-e .hp i', root).style.width = Math.max(0, e.hp / e.maxHp * 100) + '%';
    $('.bt-a .n', root).textContent = monName(a); $('.bt-a .lv', root).textContent = 'Lv' + a.lv; $('.bt-a .hp i', root).style.width = Math.max(0, aHp / st.maxHp * 100) + '%';
    $('.bt-e .tys', root).innerHTML = elemChip(def.element)  + chips(E) + `<div class="wkrow">${weakLine(def.element)}</div>`; $('.bt-a .tys', root).innerHTML = elemChip(ad.element)  + (buff ? `<span class="bf">UP ${buff.turns}</span>` : '') + chips(sd('a'));
    $('.bt-a .hpn', root).textContent = `HP ${Math.max(0, aHp)} / ${st.maxHp}`; $('.bt-a .xp i', root).style.width = Math.min(100, (a.exp || 0) / needExp(a.lv, a.id) * 100) + '%';
    syncAil();
    if (aImg.dataset.src !== ad.image) { aImg.dataset.src = ad.image; aImg.onload = () => { aImg._pad = bottomPad(aImg); layout(); }; aImg.src = img(ad.image); }
  };
  // ---- わざの エフェクト(ちんちらクエストの素材) ----
  const fieldEl = $('.bt-field', root);
  const rectOf = (el) => { const f = fieldEl.getBoundingClientRect(), r = el.getBoundingClientRect(); return { x: r.left - f.left + r.width / 2, y: r.top - f.top + r.height / 2, w: r.width, h: r.height }; };
  const fxImg = (src, r, w) => { const i = document.createElement('img'); i.className = 'bt-fx'; i.src = img(src); i.style.cssText = `left:${r.x}px;top:${r.y}px;width:${w}px`; const bl = fxBlend(src); if (bl) i.style.mixBlendMode = bl; fieldEl.appendChild(i); return i; };
  const ELC = { fire: '#ff7a30', water: '#4aa8ff', grass: '#58c458', wind: '#7adcc8', earth: '#c89a54', thunder: '#ffd830', heaven: '#fff0a0', dark: '#9a5ae0', magic: '#d080ff', beast: '#ffb060', kami: '#fff6c0' };
  const wa = (el, kf, o) => { try { return el.animate(kf, { fill: 'both', ...o, duration: o.duration / battleSpeed(), delay: (o.delay || 0) / battleSpeed() }).finished.catch(() => {}); } catch (e) { return Promise.resolve(); } };
  const ready = (i) => i.complete ? Promise.resolve() : new Promise(r => { i.onload = i.onerror = r; setTimeout(r, 900); });
  const fxFrame = async (src, el, ms, pop) => { const r = rectOf(el), i = fxImg(src, r, Math.max(r.w, r.h) * 1.15); await ready(i); if (pop) wa(i, [{ transform: 'translate(-50%,-50%) scale(.7)', opacity: .6 }, { transform: 'translate(-50%,-50%) scale(1.08)', opacity: 1 }], { duration: ms, easing: 'ease-out' }); await sleep(ms); i.remove(); };
  const qn = (n) => ECO ? Math.max(2, Math.round(n * .5)) : n;   // 省エネモードは えんしゅつの つぶを はんぶんに
  const burst = (r, col, n, pw) => { n = qn(n); for (let k = 0; k < n; k++) { const d = document.createElement('i'), sz = 5 + Math.random() * 9, a = Math.random() * 6.283, dist = (40 + Math.random() * 80) * pw; d.className = 'bt-pt'; d.style.cssText = `left:${r.x}px;top:${r.y}px;width:${sz}px;height:${sz}px;background:${col};box-shadow:0 0 ${sz * 1.6}px ${col}`; fieldEl.appendChild(d); wa(d, [{ transform: 'translate(-50%,-50%) scale(1)', opacity: 1 }, { transform: `translate(calc(-50% + ${Math.cos(a) * dist}px),calc(-50% + ${Math.sin(a) * dist}px)) scale(.2)`, opacity: 0 }], { duration: 420 + Math.random() * 280, easing: 'cubic-bezier(.1,.7,.3,1)' }).then(() => d.remove()); } };
  const flash = (r, col, sz) => { const d = document.createElement('div'); d.className = 'bt-fl'; d.style.cssText = `left:${r.x}px;top:${r.y}px;width:${sz}px;height:${sz}px;background:radial-gradient(circle,#fff 0%,${col} 30%,transparent 68%)`; fieldEl.appendChild(d); wa(d, [{ opacity: .95, transform: 'translate(-50%,-50%) scale(.35)' }, { opacity: 0, transform: 'translate(-50%,-50%) scale(1.5)' }], { duration: 380, easing: 'ease-out' }).then(() => d.remove()); };
  const shake = (amp) => wa(fieldEl, [{ transform: 'translate(0,0)' }, { transform: `translate(${-amp}px,${amp * .5}px)` }, { transform: `translate(${amp}px,${-amp * .6}px)` }, { transform: `translate(${-amp * .6}px,${amp * .3}px)` }, { transform: 'translate(0,0)' }], { duration: 280, fill: 'none' });
  // ---- わざの うごき(なまえ・せつめいで きめる。きまらない わざは IDで ばらけさせる) ----
  const MOTIONS = [
    ['bite', /かみつ|ファング|きば|がぶ|かじ/],
    ['claw', /ひっかき|クロー|つめ|づめ|ひきさ/],
    ['cross', /スラッシュ|ブレード|つるぎ|けん|カッター|ギリ|ぎり|きりさ|ざん|やいば/],
    ['pillar', /らいめい|いかずち|さばき|ホーリー|ひばしら|はしら|ばしら|ピラー|かみなり|じゅもん|じゅそ|ほうこう|ジャッジ|ひかりの/],
    ['rain', /メテオ|いん石|ふらせ|レイン|あめ|おとし|しぐれ|さめ|なだれ|ながれぼし|ほうせき/],
    ['barrage', /れんぞく|つぶて|ニードル|ミサイル|ショット|バレット|ダーツ/],
    ['beam', /ビーム|ほうしゃ|ブレス|レーザー|ブラスト|いぶき|ほえ|ハウリング|ふきつけ/],
    ['ram', /たいあたり|タックル|ずつき|とっしん|つっこ|ぶつか|チャージ|てっけん|プレス|クラッシュ|つので|つらぬ|ランス|スピア|おしつぶ|たたきつ/],
    ['vortex', /うず|たつまき|トルネ|ストーム|あらし|つむじ|サイクロン/],
    ['sweep', /ウェーブ|なみ|かまいたち|ブーメラン|ふぶき|ブリザード|しお/],
    ['quake', /ばくはつ|ノヴァ|クエイク|だいちわり|かいてん|フィールド|オーラ|げんかい|ぜったい|プロミネンス|サンバースト|フレア|じしん|ゆらす|ふるわせ|だいち/],
  ];
  const hashId = (s) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; };
  const motionOf = (sk) => {
    if (MOTION_BY_NAME[sk.name]) return MOTION_BY_NAME[sk.name];
    if (GD.MOTION_HINT && GD.MOTION_HINT[sk.name]) return GD.MOTION_HINT[sk.name];
    for (const t of [sk.name || '', (sk.desc || '').replace(/つめたい/g, '')]) for (const [k, re] of MOTIONS) if (re.test(t)) return k;
    return ['orb', 'orb', 'barrage', 'sweep', 'orb', 'vortex'][hashId(sk.id || '') % 6];
  };
  const mk = (cls, r, css) => { const d = document.createElement('div'); d.className = cls; d.style.cssText = `left:${r.x}px;top:${r.y}px;${css}`; fieldEl.appendChild(d); return d; };
  // ---- てがきの パーツ(しろい ひかりの かたち)に ぞくせいの いろを のせて つかう ----
  const PURL = (n) => img('assets/effects/parts/' + n + '.webp');
  const TR = (x, y, rot, sc, sy) => `translate(calc(-50% + ${x}px),calc(-50% + ${y}px)) rotate(${rot}deg) scale(${sc},${sy === undefined ? sc : sy})`;
  const part = (name, r, w, h, col, kf, o = {}) => {
    const u = PURL(name), d = mk('bt-pt', r, `width:${w}px;height:${h}px;mix-blend-mode:screen;transform-origin:${o.origin || '50% 50%'}`);
    d.innerHTML = `<div style="position:absolute;inset:0;background:${col};-webkit-mask:url(${u}) center/100% 100% no-repeat;mask:url(${u}) center/100% 100% no-repeat"></div><img src="${u}" alt="" style="position:absolute;left:11%;top:11%;width:78%;height:78%;opacity:.9">`;
    return wa(d, kf, o).then(() => d.remove());
  };
  const streak = (r, col, rot, len, delay, th = 10) => { const d = mk('bt-sl', r, `width:${len}px;height:${th}px;transform:translate(-50%,-50%) rotate(${rot}deg);background:linear-gradient(90deg,transparent,#fff 35%,${col} 70%,transparent);box-shadow:0 0 14px ${col}`); wa(d, [{ opacity: 0, clipPath: 'inset(0 100% 0 0)' }, { opacity: 1, clipPath: 'inset(0 0 0 0)', offset: .35 }, { opacity: 0, clipPath: 'inset(0 0 0 0)' }], { duration: 340, delay, easing: 'ease-out' }).then(() => d.remove()); };
  const ring = (r, col, sz, delay) => { part('part_ring', r, sz, sz, col, [{ opacity: .95, transform: TR(0, 0, 0, .2) }, { opacity: 0, transform: TR(0, 0, 0, 1.5) }], { duration: 520, delay, easing: 'ease-out' }); };
  const beamFx = (a, b, col, th) => { const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy), ang = Math.atan2(dy, dx) * 180 / Math.PI, T = (sx) => `translate(0,-50%) rotate(${ang}deg) scaleX(${sx})`; return part('part_beam', a, L, th * 2.4, col, [{ opacity: 0, transform: T(0) }, { opacity: 1, transform: T(1), offset: .3 }, { opacity: 1, transform: T(1), offset: .75 }, { opacity: 0, transform: T(1) }], { duration: 560, easing: 'ease-out', origin: '0 50%' }); };
  const tint = (col) => { const d = document.createElement('div'); d.className = 'bt-tn'; d.style.background = col; fieldEl.appendChild(d); wa(d, [{ opacity: .38 }, { opacity: 0 }], { duration: 420 }).then(() => d.remove()); };
  const crescent = (a, b, col, sz, delay) => { const dx = b.x - a.x, dy = b.y - a.y, ang = Math.atan2(dy, dx) * 180 / Math.PI + 180; return part('part_crescent', a, sz * 1.5, sz * 1.5, col, [{ opacity: 0, transform: TR(0, 0, ang, .5) }, { opacity: 1, offset: .2, transform: TR(dx * .2, dy * .2, ang, .8) }, { opacity: 1, offset: .8, transform: TR(dx * .8, dy * .8, ang, 1.2) }, { opacity: 0, transform: TR(dx, dy, ang, 1.4) }], { duration: 420, delay, easing: 'ease-in' }); };
  // ぞくせい ごとの ちりかた(あたった ところに ちる もの)
  const SHAPE = {
    leaf: 'width:13px;height:8px;border-radius:0 100% 0 100%', drop: 'width:8px;height:13px;border-radius:50% 50% 50% 50%/62% 62% 38% 38%', rock: 'width:10px;height:10px;border-radius:2px', ember: 'width:7px;height:7px;border-radius:50%',
    star: 'width:15px;height:15px;clip-path:polygon(50% 0,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)', feather: 'width:6px;height:17px;border-radius:50%', dot: 'width:8px;height:8px;border-radius:50%',
  };
  const ELSHAPE = { fire: ['ember', 'rise'], water: ['drop', 'fall'], grass: ['leaf', 'spin'], earth: ['rock', 'fall'], wind: ['leaf', 'spin'], thunder: ['star', 'out'], heaven: ['feather', 'spin'], dark: ['dot', 'in'], magic: ['star', 'spin'], beast: ['dot', 'out'], kami: ['feather', 'rise'] };
  const scatter = (el, b, col, pw) => {
    const [kind, mv] = ELSHAPE[el] || ['dot', 'out'], n = qn(Math.round(7 + pw * 6)), bg = kind === 'rock' ? '#9a7a4c' : kind === 'feather' ? '#fffbe8' : col;
    for (let k = 0; k < n; k++) {
      const a = Math.random() * 6.283, dist = (50 + Math.random() * 70) * pw, ox = Math.cos(a) * dist, oy = Math.sin(a) * dist, rot = (Math.random() - .5) * 720;
      const sx = mv === 'in' ? ox : 0, sy = mv === 'in' ? oy : 0, ex = mv === 'in' ? 0 : ox, ey = mv === 'rise' ? -dist * 1.1 : mv === 'fall' ? Math.abs(oy) * .4 + 50 : mv === 'in' ? 0 : oy;
      const d = mk('bt-pt', b, `${SHAPE[kind]};background:${bg};box-shadow:0 0 8px ${col};mix-blend-mode:normal`);
      wa(d, [{ opacity: mv === 'in' ? 0 : 1, transform: `translate(calc(-50% + ${sx}px),calc(-50% + ${sy}px)) rotate(0deg) scale(1)` }, { opacity: 1, offset: mv === 'in' ? .6 : .3 }, { opacity: 0, transform: `translate(calc(-50% + ${ex}px),calc(-50% + ${ey}px)) rotate(${rot}deg) scale(${mv === 'in' ? .3 : .7})` }], { duration: 520 + Math.random() * 300, easing: mv === 'fall' ? 'cubic-bezier(.3,.1,.7,1)' : 'ease-out' }).then(() => d.remove());
    }
    if (el === 'thunder') for (let k = 0; k < 2; k++) {   // いなびかり
      const h = Math.max(b.h, 130) * 1.3, pts = Array.from({ length: 9 }, (_, i) => `${i ? 50 + (Math.random() - .5) * 46 : 50},${i * 12.5}`).join(' ');
      const d = mk('bt-pt', { x: b.x + (k ? 26 : -22), y: b.y }, `width:70px;height:${h}px;mix-blend-mode:screen;border-radius:0`); d.innerHTML = `<svg viewBox="0 0 100 100" preserveAspectRatio="none" style="width:100%;height:100%;overflow:visible"><polyline points="${pts}" fill="none" stroke="#fff" stroke-width="4" stroke-linejoin="round" style="filter:drop-shadow(0 0 6px ${col})"/></svg>`;
      wa(d, [{ opacity: 1, transform: 'translate(-50%,-50%)' }, { opacity: .15, offset: .35 }, { opacity: 1, offset: .55 }, { opacity: 0 }], { duration: 360, delay: k * 70 }).then(() => d.remove());
    }
    if (el === 'wind') crescent({ x: b.x - 60, y: b.y }, { x: b.x + 60, y: b.y }, col, 70, 0);
  };
  const impactAt = (el, b, col, pw, hitSz, big, sh = 1) => { flash(b, col, hitSz * .8); part('part_burst', b, hitSz * 1.7, hitSz * 1.7, col, [{ opacity: .95, transform: TR(0, 0, Math.random() * 30, .3) }, { opacity: 0, transform: TR(0, 0, 40 + Math.random() * 30, 1.15) }], { duration: 440, easing: 'ease-out' }); if (big) part('part_sparkle', b, hitSz * 1.9, hitSz * 1.9, '#ffffff', [{ opacity: 0, transform: TR(0, 0, 0, .5) }, { opacity: 1, offset: .4, transform: TR(0, 0, 8, 1) }, { opacity: 0, transform: TR(0, 0, 16, 1.1) }], { duration: 600 }); burst(b, col, Math.round(5 + pw * 5), pw); scatter(el, b, col, pw); shake((2 + pw * 3) * sh); if (big) tint(col); };
  // ---- オリジナルわざの えんしゅつ(御三家・でんせつ・さいしゅうボス専用) ----
  Object.assign(SHAPE, { diamond: 'width:12px;height:19px;clip-path:polygon(50% 0,100% 50%,50% 100%,0 50%)', petal: 'width:12px;height:17px;border-radius:50% 0 50% 50%' });
  const sh = (kind, col, r, extra = '') => mk('bt-pt', r, `${SHAPE[kind]};background:${kind === 'feather' ? '#fffbe8' : col};box-shadow:0 0 8px ${col};mix-blend-mode:normal;${extra}`);
  const gone = (d) => () => d.remove();
  // しっぽを ひく ように ながれる(カーブしながら とんでいく)
  const stream = (p, q, col, kind, n, amp, dur = 460, gap = 55, size = 1) => {
    n = qn(n);
    const dx = q.x - p.x, dy = q.y - p.y, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
    for (let k = 0; k < n; k++) {
      const d = sh(kind, col, p), kf = [0, .25, .5, .75, 1].map(t => ({ offset: t, opacity: t === 0 ? 0 : 1, transform: `translate(calc(-50% + ${dx * t + nx * amp * Math.sin(t * 6.283)}px),calc(-50% + ${dy * t + ny * amp * Math.sin(t * 6.283)}px)) rotate(${t * 540}deg) scale(${size})` }));
      wa(d, kf, { duration: dur, delay: k * gap, easing: 'ease-in' }).then(gone(d));
    }
  };
  // まわりから あつまる
  const converge = (b, col, kind, n, rad, dur = 620, spin = 540) => {
    n = qn(n);
    for (let k = 0; k < n; k++) {
      const an = k / n * 6.283, d = sh(kind, col, b);
      wa(d, [{ opacity: 0, transform: `translate(calc(-50% + ${Math.cos(an) * rad}px),calc(-50% + ${Math.sin(an) * rad * .7}px)) rotate(0deg)` }, { opacity: 1, offset: .2 }, { opacity: 1, transform: `translate(-50%,-50%) rotate(${spin}deg) scale(.8)` }], { duration: dur, delay: k * 20, easing: 'ease-in' }).then(gone(d));
    }
  };
  const paw = (col, size) => `width:${size}px;height:${size}px;mix-blend-mode:normal;background:radial-gradient(circle at 50% 64%,${col} 0 36%,transparent 38%),radial-gradient(circle at 18% 34%,${col} 0 13%,transparent 15%),radial-gradient(circle at 40% 16%,${col} 0 13%,transparent 15%),radial-gradient(circle at 62% 16%,${col} 0 13%,transparent 15%),radial-gradient(circle at 84% 34%,${col} 0 13%,transparent 15%);filter:drop-shadow(0 0 8px ${col})`;
  const prints = (p, q, col, n, size = 28) => { for (let k = 0; k < n; k++) { const t = (k + 1) / n, d = mk('bt-pt', { x: p.x + (q.x - p.x) * t, y: p.y + (q.y - p.y) * t + (k % 2 ? 12 : -12) }, paw(col, size)); wa(d, [{ opacity: 0, transform: 'translate(-50%,-50%) scale(.3)' }, { opacity: 1, transform: 'translate(-50%,-50%) scale(1.1)', offset: .3 }, { opacity: 1, offset: .7 }, { opacity: 0, transform: 'translate(-50%,-50%) scale(1.2)' }], { duration: 520, delay: k * 150 }).then(gone(d)); } };
  const rays = (b, col, sz, dur = 700) => { const d = mk('bt-pt', b, `width:${sz}px;height:${sz}px;border-radius:50%;mix-blend-mode:screen;background:repeating-conic-gradient(${col} 0 6deg,transparent 6deg 24deg);-webkit-mask:radial-gradient(circle,#000 0,transparent 70%);mask:radial-gradient(circle,#000 0,transparent 70%)`); wa(d, [{ opacity: 0, transform: 'translate(-50%,-50%) rotate(0deg) scale(.3)' }, { opacity: .9, offset: .3, transform: 'translate(-50%,-50%) rotate(60deg) scale(1)' }, { opacity: 0, transform: 'translate(-50%,-50%) rotate(140deg) scale(1.4)' }], { duration: dur, easing: 'ease-out' }).then(gone(d)); };
  const clockFx = (b, col, sz) => {
    const d = mk('bt-rg', b, `width:${sz}px;height:${sz}px;border:5px solid ${col};box-shadow:0 0 20px ${col},inset 0 0 20px ${col}`);
    for (const [len, turn] of [[sz * .36, 900], [sz * .24, 120]]) { const h = document.createElement('i'); h.style.cssText = `position:absolute;left:calc(50% - 2px);top:calc(50% - ${len}px);width:4px;height:${len}px;background:${col};border-radius:2px;transform-origin:50% 100%;box-shadow:0 0 8px ${col}`; d.appendChild(h); wa(h, [{ transform: 'rotate(0deg)' }, { transform: `rotate(${turn}deg)` }], { duration: 760, easing: 'ease-in-out' }); }
    wa(d, [{ opacity: 0, transform: 'translate(-50%,-50%) scale(.4)' }, { opacity: 1, transform: 'translate(-50%,-50%) scale(1)', offset: .25 }, { opacity: 1, offset: .8 }, { opacity: 0, transform: 'translate(-50%,-50%) scale(1.2)' }], { duration: 820 }).then(gone(d));
  };
  const pillarFx = (b, col, w, h = 380, ms = 640) => { part('part_pillar', { x: b.x, y: b.y - h / 2 + b.h * .3 }, h * .5 * Math.max(.8, w / 90), h, col, [{ opacity: 0, transform: TR(0, 0, 0, .3, 1) }, { opacity: 1, offset: .25, transform: TR(0, 0, 0, .7, 1) }, { opacity: 1, offset: .6, transform: TR(0, 0, 0, 1.15, 1) }, { opacity: 0, transform: TR(0, 0, 0, .3, 1) }], { duration: ms, easing: 'ease-out' }); };
  const jawFx = (b, col) => { const jaw = (top) => `width:${Math.max(b.w * .7, 80)}px;height:46px;background:linear-gradient(${top ? 0 : 180}deg,#fff,${col});filter:drop-shadow(0 0 8px ${col});clip-path:polygon(0 ${top ? 0 : 100}%,100% ${top ? 0 : 100}%,100% ${top ? 45 : 55}%,88% ${top ? 100 : 0}%,76% ${top ? 45 : 55}%,64% ${top ? 100 : 0}%,52% ${top ? 45 : 55}%,40% ${top ? 100 : 0}%,28% ${top ? 45 : 55}%,16% ${top ? 100 : 0}%,4% ${top ? 45 : 55}%,0 ${top ? 45 : 55}%)`; for (const top of [true, false]) { const d = mk('bt-sl', { x: b.x, y: b.y + (top ? -40 : 40) }, jaw(top)), o = top ? -90 : 90; wa(d, [{ opacity: 0, transform: `translate(-50%,calc(-50% + ${o}px))` }, { opacity: 1, transform: `translate(-50%,calc(-50% + ${-o * .05}px))`, offset: .3 }, { opacity: 1, transform: `translate(-50%,calc(-50% + ${-o * .05}px))`, offset: .75 }, { opacity: 0, transform: `translate(-50%,calc(-50% + ${o * .3}px))` }], { duration: 460, easing: 'ease-in' }).then(gone(d)); } };
  const dashAt = (fromEl, a, b, ms = 480) => { try { const dx = Math.sign(b.x - a.x) * 14, dy = Math.sign(b.y - a.y) * 8; wa(fromEl, [{ translate: '0 0' }, { translate: `${-dx * 1.5}px ${-dy * 1.5}px`, offset: .25 }, { translate: `${(b.x - a.x) * .72}px ${(b.y - a.y) * .72}px`, offset: .55 }, { translate: '0 0' }], { duration: ms, fill: 'none', easing: 'ease-in-out' }); } catch (e) {} };
  const dim = (op = .55, ms = 900) => { const d = document.createElement('div'); d.className = 'bt-tn'; d.style.cssText = 'background:#05000d;mix-blend-mode:normal;z-index:5'; fieldEl.appendChild(d); wa(d, [{ opacity: 0 }, { opacity: op, offset: .25 }, { opacity: op, offset: .75 }, { opacity: 0 }], { duration: ms }).then(gone(d)); };
  const disc = (r, css, kf, o) => { const d = mk('bt-pt', r, `border-radius:50%;mix-blend-mode:normal;${css}`); return wa(d, kf, o).then(() => d.remove()); };
  const fall = (kind, col, from, to, delay, dur = 320, size = 1) => { const d = sh(kind, col, from); wa(d, [{ opacity: 0, transform: `translate(-50%,-50%) scale(${size})` }, { opacity: 1, offset: .15 }, { opacity: 1, transform: `translate(calc(-50% + ${to.x - from.x}px),calc(-50% + ${to.y - from.y}px)) scale(${size})` }], { duration: dur, delay, easing: 'cubic-bezier(.5,0,.9,.6)' }).then(gone(d)); };
  const R = (n) => (Math.random() - .5) * n;
  const SIG = {
    sig_wakaba: async ({ a, b, col, fromEl, impact }) => { wa(fromEl, [{ rotate: '0deg' }, { rotate: '360deg' }], { duration: 480, fill: 'none' }); stream(a, b, '#7be06a', 'leaf', 9, 26, 420, 45); await sleep(520); converge(b, '#58c458', 'leaf', 10, 90); await sleep(520); impact(); },
    sig_tempest: async ({ a, b, hitSz, impact }) => { stream(a, b, '#7be06a', 'leaf', 8, 44, 460, 50); stream(a, b, '#b8f080', 'leaf', 8, -44, 460, 50); await sleep(560); converge(b, '#58c458', 'leaf', 14, 120, 600, 900); await sleep(560); ring(b, '#58c458', hitSz, 0); impact(1.4); },
    sig_bloom: async ({ b, hitSz, impact }) => { pillarFx(b, '#7be06a', 90); rays(b, '#ffb0d8', hitSz * 2.4, 900); for (let k = 0; k < 14; k++) fall('petal', '#ffb0d8', { x: b.x + R(170), y: b.y - 210 }, { x: b.x + R(120), y: b.y + 30 }, k * 45, 520); ring(b, '#ffb0d8', hitSz * 1.3, 200); await sleep(520); impact(1.5); await sleep(200); },
    sig_bubble: async ({ a, b, fromEl, impact }) => { dashAt(fromEl, a, b); for (let k = 0; k < 9; k++) { const sz = 12 + (k % 3) * 7, d = mk('bt-pt', { x: a.x + (b.x - a.x) * k / 9, y: a.y + (b.y - a.y) * k / 9 }, `width:${sz}px;height:${sz}px;border-radius:50%;border:2px solid #cfeaff;background:radial-gradient(circle at 30% 30%,#fff,#8fd0ff55);mix-blend-mode:normal`); wa(d, [{ opacity: 0, transform: 'translate(-50%,-50%)' }, { opacity: 1, offset: .2 }, { opacity: 0, transform: 'translate(-50%,calc(-50% - 50px)) scale(1.4)' }], { duration: 620, delay: k * 40 }).then(gone(d)); } await sleep(270); impact(1.2); await sleep(220); },
    sig_crash: async ({ b, col, hitSz, impact }) => { crescent({ x: b.x - 170, y: b.y - 70 }, b, '#4aa8ff', 150, 0); crescent({ x: b.x + 170, y: b.y - 70 }, b, '#8fd0ff', 130, 120); for (let k = 0; k < 10; k++) fall('drop', '#4aa8ff', { x: b.x + R(150), y: b.y - 200 }, { x: b.x + R(120), y: b.y + 20 }, 150 + k * 40, 340); await sleep(420); ring(b, '#4aa8ff', hitSz * 1.4, 0); impact(1.8); await sleep(250); },
    sig_captain: async ({ b, hitSz, impact }) => { converge(b, '#4aa8ff', 'drop', 16, 130, 640, 900); await sleep(300); pillarFx(b, '#4aa8ff', 110, 400, 700); for (let k = 0; k < 3; k++) ring(b, '#8fd0ff', hitSz * 1.2, 200 + k * 140); tint('#2a58b0'); await sleep(520); impact(2); await sleep(200); },
    sig_paw: async ({ a, b, col, impact }) => { prints(a, b, '#ff8a40', 3); await sleep(520); const d = mk('bt-pt', b, paw('#ff6a20', 90)); wa(d, [{ opacity: 0, transform: 'translate(-50%,-50%) scale(.4)' }, { opacity: 1, transform: 'translate(-50%,-50%) scale(1.15)', offset: .3 }, { opacity: 0, transform: 'translate(-50%,-50%) scale(1.5)' }], { duration: 520 }).then(gone(d)); await sleep(200); impact(1.3); await sleep(250); },
    sig_twintail: async ({ b, col, hitSz, impact }) => { const L = Math.max(b.w, b.h) * 1.7; streak(b, '#ff7a30', -45, L, 0, 16); streak(b, '#ffb060', 45, L, 110, 16); ring(b, '#ff7a30', hitSz, 160); await sleep(260); impact(1.4); await sleep(250); },
    sig_ninetail: async ({ a, b, hitSz, impact }) => { const ang = Math.atan2(b.y - a.y, b.x - a.x); for (let k = 0; k < 9; k++) { const an = ang + (k - 4) * .22, L = Math.hypot(b.x - a.x, b.y - a.y) * 1.05; beamFx(a, { x: a.x + Math.cos(an) * L, y: a.y + Math.sin(an) * L }, k % 2 ? '#ffb060' : '#ff6a20', 16); await sleep(45); } await sleep(150); ring(b, '#ff7a30', hitSz * 1.8, 0); ring(b, '#ffd060', hitSz * 1.3, 120); pillarFx(b, '#ff7a30', 100); tint('#ff7a30'); await sleep(160); impact(2); await sleep(250); },
    sig_dream: async ({ a, b, impact }) => { stream(a, b, '#ff9ad0', 'star', 10, 34); stream(a, b, '#bfe6ff', 'star', 10, -34); await sleep(650); converge(b, '#ffd0ec', 'star', 8, 70, 480); rays(b, '#ffd0ec', 200, 700); await sleep(420); impact(.8); await sleep(200); },
    sig_time: async ({ b, hitSz, impact }) => { clockFx(b, '#9affb0', hitSz * 1.5); converge(b, '#e8ff9a', 'dot', 14, 110, 700, 360); await sleep(780); flash(b, '#9affb0', hitSz * 1.4); impact(1); await sleep(200); },
    sig_thunderwing: async ({ b, hitSz, impact }) => { crescent({ x: b.x - 160, y: b.y - 40 }, { x: b.x + 10, y: b.y }, '#ffd830', 150, 0); crescent({ x: b.x + 160, y: b.y - 40 }, { x: b.x - 10, y: b.y }, '#fff070', 150, 100); await sleep(420); rays(b, '#ffd830', hitSz * 2, 600); impact(1.6); tint('#ffd830'); await sleep(250); },
    sig_blazewing: async ({ a, b, impact }) => { crescent({ x: b.x - 160, y: b.y - 40 }, { x: b.x + 10, y: b.y }, '#ff6a20', 150, 0); crescent({ x: b.x + 160, y: b.y - 40 }, { x: b.x - 10, y: b.y }, '#ffb060', 150, 100); stream(a, b, '#ff8a40', 'ember', 10, 22, 420, 40); await sleep(440); pillarFx(b, '#ff6a20', 90); impact(1.6); await sleep(250); },
    sig_mane: async ({ a, b, fromEl, impact }) => { rays(a, '#ff9a40', Math.max(a.w, a.h) * 2.6, 520); await sleep(380); dashAt(fromEl, a, b, 460); stream(a, b, '#ff8a40', 'ember', 8, 16, 300, 30); await sleep(300); impact(1.5); await sleep(220); },
    sig_blizzard: async ({ b, hitSz, impact }) => { for (let k = 0; k < 16; k++) fall('diamond', '#bfe6ff', { x: b.x + 130 + Math.random() * 90, y: b.y - 230 }, { x: b.x - 50 + Math.random() * 90, y: b.y + 10 }, k * 50, 340); await sleep(520); ring(b, '#dff2ff', hitSz * 1.3, 0); tint('#bfe6ff'); impact(1.4); await sleep(250); },
    sig_mist: async ({ b, hitSz, impact }) => { for (let k = 0; k < 18; k++) fall('drop', '#bfe6ff', { x: b.x + R(190), y: b.y - 210 }, { x: b.x + R(160), y: b.y + 20 }, k * 40, 380); rays(b, '#dff2ff', hitSz * 2.2, 800); await sleep(560); for (let k = 0; k < 3; k++) ring(b, '#bfe6ff', hitSz, k * 120); impact(1); await sleep(300); },
    sig_ocean: async ({ b, hitSz, impact }) => { for (let k = 0; k < 3; k++) ring(b, '#4a78d0', hitSz * 2.5, k * 150); for (const dx of [-70, 0, 70]) pillarFx({ ...b, x: b.x + dx }, '#4aa8ff', 80, 420, 760); converge(b, '#8fd0ff', 'drop', 16, 150, 700, 720); tint('#2a58b0'); await sleep(560); impact(2.2); await sleep(300); },
    sig_fang: async ({ b, hitSz, impact }) => { jawFx(b, '#ffd830'); await sleep(260); pillarFx(b, '#ffd830', 70, 400, 420); impact(1.6); await sleep(300); },
    sig_magma: async ({ b, hitSz, impact }) => { for (let k = 0; k < 3; k++) streak({ x: b.x, y: b.y + b.h * .3 + (k - 1) * 14 }, '#ff5a20', k * 8 - 8, hitSz * 2.2, k * 70, 9); await sleep(260); for (let k = 0; k < 14; k++) { const d = sh('rock', k % 2 ? '#ff5a20' : '#8a5a30', { x: b.x + R(110), y: b.y + b.h * .3 }); wa(d, [{ opacity: 1, transform: 'translate(-50%,-50%)' }, { opacity: 1, transform: `translate(calc(-50% + ${R(80)}px),calc(-50% - ${90 + Math.random() * 90}px)) rotate(${R(540)}deg)`, offset: .5 }, { opacity: 0, transform: `translate(calc(-50% + ${R(140)}px),calc(-50% + 20px)) rotate(${R(900)}deg)` }], { duration: 700, easing: 'ease-out' }).then(gone(d)); } pillarFx(b, '#ff5a20', 100, 400, 640); ring(b, '#ff5a20', hitSz * 1.5, 100); impact(2); await sleep(350); },
    sig_meteor: async ({ b, impact }) => { for (let k = 0; k < 3; k++) { const f = { x: b.x - 180 + k * 30, y: b.y - 250 }, t = { x: b.x - 20 + k * 22, y: b.y }; fall('star', '#ff5a6a', f, t, k * 150, 340, 1.6); streak({ x: (f.x + t.x) / 2, y: (f.y + t.y) / 2 }, '#ff8a9a', 58, 260, k * 150, 8); } await sleep(300 + 2 * 150 + 120); impact(1.6); await sleep(250); },
    sig_comet: async ({ b, impact }) => { for (let k = 0; k < 3; k++) { const f = { x: b.x + 180 - k * 30, y: b.y - 250 }, t = { x: b.x + 20 - k * 22, y: b.y }; fall('star', '#5aa8ff', f, t, k * 150, 340, 1.6); streak({ x: (f.x + t.x) / 2, y: (f.y + t.y) / 2 }, '#9ad0ff', -58, 260, k * 150, 8); } await sleep(300 + 2 * 150 + 120); impact(1.6); await sleep(250); },
    sig_silver: async ({ a, b, impact }) => { crescent({ x: b.x, y: b.y + 130 }, { x: b.x, y: b.y - 30 }, '#dfe8f5', 150, 0); crescent({ x: b.x, y: b.y + 150 }, { x: b.x, y: b.y - 20 }, '#ffffff', 120, 110); stream(a, b, '#e8eef8', 'feather', 10, 26, 420, 40); await sleep(480); impact(1.4); await sleep(250); },
    sig_dragon: async ({ a, b, hitSz, impact }) => { stream(a, b, '#7be0a0', 'dot', 18, 46, 520, 28, 1.4); stream(a, b, '#ffd860', 'dot', 10, -46, 520, 40, 1); await sleep(640); ring(b, '#7be0a0', hitSz * 1.4, 0); ring(b, '#ffd860', hitSz, 120); impact(1.6); await sleep(250); },
    sig_rainbow: async ({ a, b, hitSz, impact }) => { ['#ff5a5a', '#ff9a3a', '#ffe040', '#5ad05a', '#4aa8ff', '#6a5aff', '#c060ff'].forEach((c, i) => stream(a, b, c, 'petal', 3, (i - 3) * 16, 460, 70)); await sleep(640); rays(b, '#ffffff', hitSz * 2.4, 800); rays(b, '#ffd860', hitSz * 1.8, 700); tint('#fff6d0'); impact(1.4); await sleep(300); },
    sig_crystal: async ({ b, hitSz, impact }) => { converge(b, '#d080ff', 'diamond', 10, 110, 520, 360); await sleep(560); for (let k = 0; k < 16; k++) { const an = k / 16 * 6.283, d = sh('diamond', k % 2 ? '#ff9ae0' : '#d080ff', b); wa(d, [{ opacity: 1, transform: 'translate(-50%,-50%) scale(1.5)' }, { opacity: 0, transform: `translate(calc(-50% + ${Math.cos(an) * 150}px),calc(-50% + ${Math.sin(an) * 110}px)) rotate(${R(720)}deg) scale(.6)` }], { duration: 640, easing: 'ease-out' }).then(gone(d)); } ring(b, '#d080ff', hitSz * 1.5, 0); pillarFx(b, '#d080ff', 90); tint('#8a40d0'); impact(1.8); await sleep(300); },
    // ---- さいしゅうボス「うちゅうの かみ」の とくべつな わざ ----
    boss_sun: async ({ b, hitSz, impact }) => {   // たいよう: おおきな たいようが おちてくる
      const css = `width:300px;height:300px;border-radius:0;background:url(${img('assets/effects/boss/boss_sun.webp')}) center/100% 100% no-repeat;mix-blend-mode:screen`;
      disc({ x: b.x, y: b.y - 230 }, css, [{ opacity: 0, transform: 'translate(-50%,-50%) scale(.3)' }, { opacity: 1, transform: 'translate(-50%,-50%) scale(1)', offset: .3 }, { opacity: 1, transform: `translate(-50%,calc(-50% + 220px)) scale(1.5)`, offset: .85 }, { opacity: 0, transform: `translate(-50%,calc(-50% + 230px)) scale(2.2)` }], { duration: 900, easing: 'ease-in' });
      rays({ x: b.x, y: b.y - 230 }, '#ffcc60', 420, 700); await sleep(760); for (let k = 0; k < 3; k++) ring(b, k % 2 ? '#ffd060' : '#ff7a20', hitSz * 1.6, k * 110); tint('#ff8a30'); impact(2.2); await sleep(350); },
    boss_hole: async ({ b, hitSz, impact }) => {   // ブラックホール: すべてを すいこむ
      dim(.5, 1200);
      disc(b, `width:330px;height:330px;border-radius:0;background:url(${img('assets/effects/boss/boss_hole.webp')}) center/100% 100% no-repeat`, [{ opacity: 0, transform: 'translate(-50%,-50%) scale(.2) rotate(0deg)' }, { opacity: 1, transform: 'translate(-50%,-50%) scale(1.2) rotate(240deg)', offset: .3 }, { opacity: 1, transform: 'translate(-50%,-50%) scale(1.3) rotate(560deg)', offset: .75 }, { opacity: 0, transform: 'translate(-50%,-50%) scale(.1) rotate(800deg)' }], { duration: 1100, easing: 'ease-in-out' });
      converge(b, '#c8a0ff', 'dot', 22, 190, 760, 900); converge(b, '#ffffff', 'star', 8, 150, 700, 600); await sleep(900); flash(b, '#a050ff', hitSz * 1.8); impact(2.4); await sleep(350); },
    boss_eclipse: async ({ b, hitSz, impact }) => {   // エクリプス: たいようと ブラックホールが かさなる
      dim(.6, 1900);
      const sunCss = `width:340px;height:340px;border-radius:0;background:url(${img('assets/effects/boss/boss_sun.webp')}) center/100% 100% no-repeat;mix-blend-mode:screen`;
      disc({ x: b.x, y: b.y - 40 }, sunCss, [{ opacity: 0, transform: 'translate(-50%,-50%) scale(.3)' }, { opacity: 1, transform: 'translate(-50%,-50%) scale(1)', offset: .25 }, { opacity: 1, offset: .7 }, { opacity: 0, transform: 'translate(-50%,-50%) scale(2.4)' }], { duration: 1500 });
      disc({ x: b.x + 170, y: b.y - 40 }, 'width:190px;height:190px;background:radial-gradient(circle,#000 0 62%,#2a0a50 70%,transparent 76%)', [{ opacity: 0, transform: 'translate(-50%,-50%) scale(.6)' }, { opacity: 1, transform: 'translate(-50%,-50%) scale(1)', offset: .25 }, { opacity: 1, transform: 'translate(calc(-50% - 170px),-50%) scale(1.05)', offset: .65 }, { opacity: 1, transform: 'translate(calc(-50% - 170px),-50%) scale(1.05)', offset: .78 }, { opacity: 0, transform: 'translate(calc(-50% - 170px),-50%) scale(2.2)' }], { duration: 1500, easing: 'ease-in-out' });
      rays({ x: b.x, y: b.y - 40 }, '#ffd870', 460, 1300); converge(b, '#ffffff', 'star', 14, 200, 900, 720); await sleep(1000);
      for (let k = 0; k < 4; k++) ring(b, ['#ffffff', '#ffd060', '#a050ff', '#ff7a20'][k], hitSz * 2.2, k * 110); tint('#ffffff'); rays(b, '#ffffff', hitSz * 3, 900); await sleep(320); impact(3); await sleep(500); },
  };
  const playFx = async (fromEl, toEl, sk, elem) => {
    const col = ELC[elem] || '#fff', pw = Math.min(1.8, 0.8 + (sk.power || 40) / 90), b = rectOf(toEl), a = rectOf(fromEl), hitSz = Math.max(b.w, b.h) * 1.1 * pw, mo = motionOf(sk), big = (sk.power || 0) >= 80;
    const impact = (sh = 1) => impactAt(elem, b, col, pw, hitSz, big, sh);
    if (sk.id === 'x_tail') {   // しっぽをふる: からだを ふりふり ゆらす
      wa(fromEl, [{ rotate: '0deg', translate: '0 0' }, { rotate: '-9deg', translate: '-7px 0' }, { rotate: '9deg', translate: '7px 0' }, { rotate: '-9deg', translate: '-7px 0' }, { rotate: '9deg', translate: '7px 0' }, { rotate: '-6deg', translate: '-4px 0' }, { rotate: '0deg', translate: '0 0' }], { duration: 760, fill: 'none', easing: 'ease-in-out' });
      for (let k = 0; k < 3; k++) { await sleep(180); burst({ x: a.x + (k - 1) * a.w * .3, y: a.y - a.h * .35 }, '#ffe9a0', 3, .5); }
      await sleep(300); return;
    }
    if (sk.id === 'x_growl') {   // なきごえ: おとが ひろがる ようすで あらわす
      const ang = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI, dist = Math.hypot(b.x - a.x, b.y - a.y) * .6;
      wa(fromEl, [{ scale: '1' }, { scale: '1.1' }, { scale: '1' }], { duration: 200, iterations: 3, fill: 'none' });
      for (let k = 0; k < 4; k++) { const d = mk('bt-sw', { x: a.x, y: a.y - a.h * .1 }, `width:${44 + k * 8}px;height:${44 + k * 8}px;border-right-color:#fff`); wa(d, [{ opacity: 0, transform: `translate(-50%,-50%) rotate(${ang}deg) translateX(0) scale(.6)` }, { opacity: 1, offset: .2 }, { opacity: 0, transform: `translate(-50%,-50%) rotate(${ang}deg) translateX(${dist}px) scale(1.9)` }], { duration: 640, delay: k * 150, easing: 'ease-out' }).then(() => d.remove()); }
      await sleep(520); wa(toEl, [{ translate: '0 0' }, { translate: `${Math.sign(b.x - a.x) * 12}px 0` }, { translate: '0 0' }], { duration: 300, fill: 'none' }); shake(2.5); await sleep(520); return;
    }
    if (SIG[sk.id]) { await SIG[sk.id]({ a, b, col, pw, fromEl, toEl, hitSz, impact, elem }); return; }   // オリジナルわざ
    const fe = elem === 'kami' && !(GD.ELEMENT_EFFECT_ANIM || {}).kami ? 'heaven' : elem, frames = GD.pickEffectFrames(fe, sk.id);
    if (!frames) { const one = GD.ELEMENT_EFFECTS[fe]; if (one) { const i = fxImg(one, b, Math.max(b.w, b.h) * 1.15); await ready(i); wa(i, [{ transform: 'translate(-50%,-50%) scale(.5)', opacity: 0 }, { transform: 'translate(-50%,-50%) scale(1.1)', opacity: 1, offset: .35 }, { transform: 'translate(-50%,-50%) scale(1.25)', opacity: 0 }], { duration: 560, easing: 'ease-out' }); impact(); await sleep(520); i.remove(); } return; }
    const ti = Math.max(0, frames.length - 3), charge = frames.slice(0, ti), travel = frames[ti], onHit = frames.slice(ti + 1);
    const dx = Math.sign(b.x - a.x) * 14, dy = Math.sign(b.y - a.y) * 8, L = Math.max(b.w, b.h) * 1.3, w = Math.max(a.w, a.h) * 0.8;
    if (mo !== 'ram') try { wa(fromEl, [{ translate: '0 0' }, { translate: `${-dx}px ${-dy}px`, offset: .4 }, { translate: `${dx * 1.6}px ${dy * 1.6}px`, offset: .7 }, { translate: '0 0' }], { duration: 420, fill: 'none', easing: 'ease-in-out' }); } catch (e) {}   // 技を出す側の ため→ふみこみ
    for (const f of charge) await fxFrame(f, fromEl, 100, true);
    if (mo === 'bite') { part('part_bite', b, L * 1.3, L * 1.3, col, [{ opacity: 0, transform: TR(0, 0, 0, 1, 1.9) }, { opacity: 1, offset: .35, transform: TR(0, 0, 0, 1, 1) }, { opacity: 1, offset: .75, transform: TR(0, 0, 0, 1.04, 1.04) }, { opacity: 0, transform: TR(0, 0, 0, 1.1, 1.1) }], { duration: 520, easing: 'ease-in' }); await sleep(190); impact(1.1); await sleep(230); }
    else if (mo === 'claw') { part('part_claw', b, L * 1.25, L * 1.25, col, [{ opacity: 0, transform: TR(40, -40, 0, .7) }, { opacity: 1, offset: .3, transform: TR(0, 0, 0, 1) }, { opacity: 0, transform: TR(-14, 14, 0, 1.08) }], { duration: 440, easing: 'ease-out' }); await sleep(200); impact(); }
    else if (mo === 'cross') { part('part_slash_1', b, L * 1.4, L * 1.4, col, [{ opacity: 0, transform: TR(-60, -50, 0, .6) }, { opacity: 1, offset: .35, transform: TR(0, 0, 0, 1) }, { opacity: 0, transform: TR(40, 30, 0, 1.1) }], { duration: 300, easing: 'ease-out' }); part('part_slash_2', b, L * 1.35, L * 1.35, col, [{ opacity: 0, transform: TR(0, 0, -6, .6) }, { opacity: 1, offset: .35, transform: TR(0, 0, 0, 1) }, { opacity: 0, transform: TR(0, 0, 4, 1.1) }], { duration: 380, delay: 150, easing: 'ease-out' }); await sleep(250); impact(1.2); }
    else if (mo === 'pillar') { const h = 380, d = mk('bt-sl', { x: b.x, y: b.y - h / 2 + b.h * .3 }, `width:${60 * pw}px;height:${h}px;background:linear-gradient(90deg,transparent,${col},#fff,${col},transparent);box-shadow:0 0 28px ${col}`); wa(d, [{ opacity: 0, transform: 'translate(-50%,-50%) scaleX(.2)' }, { opacity: 1, transform: 'translate(-50%,-50%) scaleX(.6)', offset: .25 }, { opacity: 1, transform: 'translate(-50%,-50%) scaleX(1.3)', offset: .6 }, { opacity: 0, transform: 'translate(-50%,-50%) scaleX(.2)' }], { duration: 640, easing: 'ease-out' }).then(() => d.remove()); ring({ x: b.x, y: b.y + b.h * .3 }, col, hitSz * 1.1, 120); await sleep(220); impact(1.3); await sleep(300); }
    else if (mo === 'beam') { const bp = beamFx(a, b, col, Math.round(30 * pw)); await sleep(190); impact(1.3); await bp; }
    else if (mo === 'ram') { try { wa(fromEl, [{ translate: '0 0' }, { translate: `${-dx * 1.5}px ${-dy * 1.5}px`, offset: .25 }, { translate: `${(b.x - a.x) * .72}px ${(b.y - a.y) * .72}px`, offset: .55 }, { translate: '0 0' }], { duration: 480, fill: 'none', easing: 'ease-in-out' }); } catch (e) {} await sleep(260); impact(1.2); await sleep(150); }
    else if (mo === 'rain') { const ww = Math.max(a.w, a.h) * 0.7; for (let k = 0; k < 4; k++) { const x = b.x + (k - 1.5) * 34, p = fxImg(travel, { x, y: b.y - 230 }, ww); wa(p, [{ top: (b.y - 230) + 'px', opacity: 0 }, { opacity: 1, offset: .15 }, { top: (b.y + (k % 2 ? 10 : -14)) + 'px', opacity: 1 }], { duration: 300, delay: k * 110, easing: 'cubic-bezier(.5,0,.9,.6)' }).then(() => { burst({ x, y: b.y }, col, 5, pw * .7); p.remove(); }); } await sleep(300 + 3 * 110); impact(1.2); }
    else if (mo === 'quake') { for (let k = 0; k < 3; k++) ring(b, col, hitSz * 1.2, k * 130); await sleep(150); impact(1.8); await sleep(300); }
    else if (mo === 'barrage') { for (let k = 0; k < 6; k++) { const p = fxImg(travel, { x: a.x, y: a.y + (k % 3 - 1) * 14 }, w * .5), ty = b.y + (k % 3 - 1) * 18; wa(p, [{ left: a.x + 'px', top: (a.y + (k % 3 - 1) * 14) + 'px', opacity: 1 }, { left: b.x + 'px', top: ty + 'px', opacity: 1 }], { duration: 230, delay: k * 85, easing: 'ease-in' }).then(() => { burst({ x: b.x, y: ty }, col, 4, .6); flash({ x: b.x, y: ty }, col, hitSz * .45); p.remove(); }); } await sleep(230 + 5 * 85); impact(); }
    else if (mo === 'vortex') { part('part_swirl', b, hitSz * 1.6, hitSz * 1.6, col, [{ opacity: 0, transform: TR(0, 0, 0, .4) }, { opacity: .95, offset: .3, transform: TR(0, 0, 200, 1) }, { opacity: .9, offset: .75, transform: TR(0, 0, 480, 1.1) }, { opacity: 0, transform: TR(0, 0, 700, .5) }], { duration: 760 }); const [kind] = ELSHAPE[elem] || ['dot'], box = mk('bt-pt', b, 'width:0;height:0;mix-blend-mode:normal'); for (let k = 0; k < 9; k++) { const an = k / 9 * 6.283, rr = 40 + (k % 3) * 22, i = document.createElement('i'); i.style.cssText = `position:absolute;left:${Math.cos(an) * rr}px;top:${Math.sin(an) * rr * .6}px;${SHAPE[kind] || SHAPE.dot};background:${kind === 'feather' ? '#fffbe8' : col};box-shadow:0 0 8px ${col}`; box.appendChild(i); } wa(box, [{ opacity: 0, transform: 'translate(-50%,-50%) rotate(0deg) scale(.4)' }, { opacity: 1, offset: .25, transform: 'translate(-50%,-50%) rotate(260deg) scale(1.1)' }, { opacity: 1, offset: .75 }, { opacity: 0, transform: 'translate(-50%,-50%) rotate(720deg) scale(.5)' }], { duration: 760, easing: 'ease-in-out' }).then(() => box.remove()); await sleep(520); impact(1.1); await sleep(220); }
    else if (mo === 'sweep') { const cp = [crescent(a, b, col, Math.max(a.h, 90) * 1.1, 0), crescent(a, b, col, Math.max(a.h, 90) * .8, 110)]; await sleep(330); impact(1.2); await Promise.all(cp); }
    else {
      const p = fxImg(travel, a, w), arc = -Math.min(60, Math.abs(b.x - a.x) * 0.18); await ready(p);
      const tp = wa(p, [{ left: a.x + 'px', top: a.y + 'px', transform: 'translate(-50%,-50%) scale(.8)' }, { left: (a.x + b.x) / 2 + 'px', top: (a.y + b.y) / 2 + arc + 'px', transform: 'translate(-50%,-50%) scale(1.15)', offset: .55 }, { left: b.x + 'px', top: b.y + 'px', transform: 'translate(-50%,-50%) scale(1.3)' }], { duration: 340, easing: 'cubic-bezier(.45,0,.85,.55)' });
      for (let k = 0; k < 6; k++) { await sleep(52); const r = rectOf(p), g = fxImg(travel, r, w * 0.8); g.style.opacity = .45; wa(g, [{ opacity: .45, transform: 'translate(-50%,-50%) scale(.9)' }, { opacity: 0, transform: 'translate(-50%,-50%) scale(.4)' }], { duration: 260 }).then(() => g.remove()); }
      await tp; p.remove(); impact();
    }
    for (const f of onHit) await fxFrame(f, toEl, 110, true);
  };
  const hit = async (img_, big) => { img_.classList.add('hit'); await sleep(big ? 420 : 320); img_.classList.remove('hit'); };
  const calc = (atk, power, dfn, ae, de, critP = GD.CRIT_CHANCE) => {
    const raw = Math.max(1, atk * power / 20 - dfn * 0.4), rand = 0.9 + Math.random() * 0.2, crit = Math.random() < critP, mu = GD.getElementMatchup(ae, de);
    return { dmg: Math.max(1, Math.round(raw * rand * (crit ? GD.CRIT_MULT : 1) * mu.mult)), crit, tier: mu.tier };
  };
  const tierText = (t, crit) => (crit ? 'かいしんの いちげき! ' : '') + (t === 'strong' ? 'こうかは ばつぐんだ!' : t === 'weak' ? 'こうかは いまひとつ…' : '');

  // ---- じょうたいいじょう・のうりょくアップダウン ----
  const nameOf = (side) => side === 'a' ? monName(state.party[ai]) : def.name;
  const maxOf = (side) => side === 'a' ? monStats(state.party[ai]).maxHp : e.maxHp;
  const hpNow = (side) => side === 'a' ? hpOf(state.party[ai]) : e.hp;
  const imgOf = (side) => side === 'a' ? aImg : eImg;
  const hurt = (side, n) => { if (side === 'a') { const a = state.party[ai]; a.hp = Math.max(0, hpOf(a) - n); } else e.hp = Math.max(0, e.hp - n); draw(); };
  const healSide = (side, n) => { if (side === 'a') { const a = state.party[ai]; a.hp = Math.min(monStats(a).maxHp, hpOf(a) + n); } else e.hp = Math.min(e.maxHp, e.hp + n); draw(); pop(side, '+' + n, 'heal'); };
  const resetStg = () => { sd('a').stg = { atk: 0, def: 0, spd: 0 }; };
  const tryAil = async (side, kind, ch) => {
    const S = sd(side), el = side === 'a' ? GD.MONSTERS[state.party[ai].id].element : def.element;
    if (S.ail || hpNow(side) <= 0) return false;
    if ((kind === 'burn' && el === 'fire') || (kind === 'paralyze' && el === 'thunder') || (kind === 'freeze' && el === 'water')) return false;
    if (side === 'a' && holdOf(state.party[ai]).ward) return false;
    if (side === 'e' && opts.boss) ch *= 0.6;
    if (Math.random() >= ch) return false;
    S.ail = { k: kind, t: kind === 'sleep' ? 2 + Math.floor(Math.random() * 2) : kind === 'freeze' ? 3 : kind === 'confuse' ? 2 + Math.floor(Math.random() * 3) : 99 };
    draw(); msg(`${nameOf(side)} は ${AIL[kind].msg}`); sfx(side === 'a' ? 'no' : 'quest'); await sleep(1000); return true;
  };
  const changeStage = async (side, k, n) => {
    const S = sd(side), old = S.stg[k], nw = Math.max(-3, Math.min(3, old + n)), nm = nameOf(side);
    if (nw === old) { msg(`${nm} の ${STAGE_LABEL[k]}は これいじょう ${n > 0 ? 'あがらない' : 'さがらない'}!`); await sleep(800); return; }
    S.stg[k] = nw; draw(); msg(`${nm} の ${STAGE_LABEL[k]}が ${Math.abs(n) >= 2 ? 'ぐーんと ' : ''}${n > 0 ? 'あがった' : 'さがった'}!`); sfx(n > 0 ? 'quest' : 'no');
    const im = imgOf(side); im.classList.add(n > 0 ? 'glow' : 'dim'); await sleep(900); im.classList.remove('glow', 'dim');
  };
  const useFx = async (side, fx, statusOnly) => {
    if (!fx) return; const foe = side === 'a' ? 'e' : 'a';
    for (const [k, n] of Object.entries(fx.self || {})) await changeStage(side, k, n);
    for (const [k, n] of Object.entries(fx.foe || {})) await changeStage(foe, k, n);
    if (fx.heal) { const mx = maxOf(side), add = Math.min(mx - hpNow(side), Math.round(mx * fx.heal)); if (add > 0) { healSide(side, add); msg(`${nameOf(side)} の HPが かいふくした!`); sfx('feed'); } else msg('でも なにも おこらなかった…'); await sleep(900); }
    if (fx.st) { const ok = await tryAil(foe, fx.st, fx.ch == null ? 1 : fx.ch); if (!ok && statusOnly) { msg(`しかし ${nameOf(foe)} には きまらなかった…`); await sleep(900); } }
  };
  // こうげきの まえの チェック: ねむり・こおり・まひ・こんらん で うごけないことがある
  const actCheck = async (side) => {
    const S = sd(side), ail = S.ail; if (!ail) return true; const nm = nameOf(side);
    if (ail.k === 'sleep') { if (--ail.t <= 0) { S.ail = null; draw(); msg(`${nm} は めを さました!`); await sleep(800); return true; } msg(`${nm} は ぐうぐう ねむっている…`); await sleep(1000); return false; }
    if (ail.k === 'freeze') { if (Math.random() < 0.3 || --ail.t <= 0) { S.ail = null; draw(); msg(`${nm} の こおりが とけた!`); await sleep(800); return true; } msg(`${nm} は こおりついて うごけない!`); await sleep(1000); return false; }
    if (ail.k === 'paralyze' && Math.random() < 0.25) { msg(`${nm} は からだが しびれて うごけない!`); await sleep(1000); return false; }
    if (ail.k === 'confuse') {
      if (--ail.t <= 0) { S.ail = null; draw(); msg(`${nm} の こんらんが とけた!`); await sleep(800); return true; }
      msg(`${nm} は こんらんしている…`); await sleep(700);
      if (Math.random() < 0.4) { const n = Math.max(1, Math.round(maxOf(side) * 0.1)); msg(`${nm} は わけも わからず じぶんを こうげきした!`); sfx('no'); hurt(side, n); await hit(imgOf(side)); pop(side, '-' + n, ''); await sleep(700); return false; }
    }
    return true;
  };
  const allyAttack = async (sk) => {
    if (!(await actCheck('a'))) return;
    const a = state.party[ai], st = allyStats(), ad = GD.MONSTERS[a.id], ab = abilityOf(a.id), fx = fxOf(sk), el = sk.element || ad.element;
    if (sk.id !== 'struggle') { a.pp = a.pp || {}; a.pp[sk.id] = Math.max(0, ppOf(a, sk) - 1); }
    msg(`${monName(a)} の ${sk.name}!`); sfx('pick'); await sleep(350);
    if (sk.power === 0) {   // へんかわざ(ダメージなし)
      if (fx.foe || fx.st) await playFx(aImg, eImg, sk, el); else { aImg.classList.add('glow'); await sleep(500); aImg.classList.remove('glow'); }
      await useFx('a', fx, true); return;
    }
    await playFx(aImg, eImg, sk, el);
    const mg = skillKind(sk) === 'magic', r = calc(mg ? st.matk : st.atk, sk.power, eS(mg ? 'mdef' : 'def'), el, def.element, st.crit / 100);
    let dmg = Math.round(r.dmg * envMul(opts.wx, opts.hour, el)); if (ab === 'pinch' && hpOf(a) < st.maxHp / 3) dmg = Math.round(dmg * 1.3); if (ab === 'typeboost' && el === ad.element) dmg = Math.round(dmg * 1.15); if (e.ab === 'thick') dmg = Math.max(1, Math.round(dmg * 0.88));
    let held = false; if (e.ab === 'fortress' && !eFort && dmg >= e.hp && e.hp > 1) { dmg = e.hp - 1; eFort = true; held = true; }
    if (E.ail && E.ail.k === 'freeze' && el === 'fire') { E.ail = null; }
    e.hp = Math.max(0, e.hp - dmg); sfx('pet'); await hit(eImg); draw(); pop('e', '-' + dmg, r.crit ? 'crit' : '');
    const t = tierText(r.tier, r.crit); if (t) { msg(t); await sleep(650); } else await sleep(250);
    if (held) { msg(`${def.name} は ふくつの こころで こらえた!`); await sleep(800); }
    if (sk.id === 'struggle') { const rc = Math.max(1, Math.round(dmg / 4)); hurt('a', rc); pop('a', '-' + rc, ''); msg(`${monName(a)} は はんどうを うけた!`); await sleep(700); }
    if (fx && e.hp > 0) await useFx('a', fx, false);
  };
  const enemyPick = () => {
    if (Math.random() < 0.28) {
      const A = sd('a'), pool = enemyStatusPool(GD, def.element).filter(id => { const f = GD.SKILLS[id].fx; if (f.st) return !A.ail; if (f.self) return Object.keys(f.self).every(k => E.stg[k] < 2); if (f.foe) return Object.keys(f.foe).every(k => A.stg[k] > -2); if (f.heal) return e.hp < e.maxHp * 0.5; return true; });
      if (pool.length) return GD.SKILLS[pool[Math.floor(Math.random() * pool.length)]];
    }
    return cosmetic(GD.SKILLS[def.skillIds[Math.floor(Math.random() * def.skillIds.length)]] || GD.SKILLS.tackle);
  };
  // てきの「たいあたり」は、タイプに あった わざの なまえ・えんしゅつで みせる(いりょく・じょうたいいじょうは そのまま)
  const cosmetic = (sk) => {
    if (sk.id === 'tackle') { const g = ((GD.SIG_BY_FORM && GD.SIG_BY_FORM[enemyId]) || []).filter(x => e.lv >= x.lv); if (g.length && Math.random() < 0.5) { const c = GD.SKILLS[g[g.length - 1].id]; return { ...c, power: Math.round(sk.power * 1.5), _fx: null }; } }   // でんせつ・御三家の てきは オリジナルわざを つかう
    if (sk.id !== 'tackle' || !def.element || Math.random() < 0.3) return sk;
    const cand = (GD.COMPANION_SKILL_TRACKS[def.element] || []).map(x => GD.SKILLS[x]).filter(x => x && x.id.startsWith('n_') && learnLv(x) <= e.lv);
    if (!cand.length) return sk; const c = cand[Math.floor(Math.random() * cand.length)];
    return { ...c, power: sk.power, _fx: null };
  };
  const bossCheck = async () => {
    if (!opts.boss || opts.trainer || e.hp <= 0) return;
    if (bossPhase < 1 && e.hp <= e.maxHp * 0.5) { bossPhase = 1; e.atk = Math.round(e.atk * 1.2); e.matk = Math.round(e.matk * 1.2); e.spd = Math.round(e.spd * 1.1); fieldEl.classList.add('quake'); sfx('no'); msg(`${def.name} は ほんきを だした!`); await sleep(1300); fieldEl.classList.remove('quake'); msg(`${def.name} は ときどき ちからを ためて つよい こうげきを してくるよ!(ぼうぎょで ふせごう)`); await sleep(1500); }
    if (bossPhase < 2 && e.hp <= e.maxHp * 0.25) { bossPhase = 2; e.atk = Math.round(e.atk * 1.15); e.matk = Math.round(e.matk * 1.15); fieldEl.classList.add('quake'); sfx('no'); msg(`${def.name} は おいつめられて いかりに もえている!`); await sleep(1300); fieldEl.classList.remove('quake'); }
  };
  let finalAlt = 0;
  const enemyAttack = async () => {
    if (hpOf(state.party[ai]) <= 0) return;
    await bossCheck(); if (e.hp <= 0) return;
    if (!(await actCheck('e'))) return;
    let big = false, sk;
    if (charged && enemyId === 'mame_chin_kami') { charged = false; big = true; chargeT = 0; sk = bossPhase >= 2 ? { ...BOSS_MOVES.eclipse, power: 118 } : { ...(finalAlt++ % 2 ? BOSS_MOVES.hole : BOSS_MOVES.sun), power: 92 }; }
    else if (charged) { charged = false; big = true; chargeT = 0; sk = { id: 'x_big', name: `${def.name} の ぜんりょく こうげき`, power: bossPhase >= 2 ? 105 : 88, element: def.element }; }
    else if (bossPhase >= 1 && ++chargeT >= (bossPhase >= 2 ? 2 : 3)) { chargeT = 0; charged = true; msg(`${def.name} は ちからを ためている…!`); sfx('no'); eImg.classList.add('glow'); await sleep(1400); eImg.classList.remove('glow'); return; }
    else sk = enemyId === 'mame_chin_kami' && Math.random() < 0.45 ? (bossPhase < 1 ? BOSS_MOVES.sun : Math.random() < 0.5 ? BOSS_MOVES.sun : BOSS_MOVES.hole) : enemyPick();
    const a = state.party[ai], st = allyStats(), aab = abilityOf(a.id), fx = fxOf(sk), el = sk.element || def.element;
    if (sk.id === 'boss_eclipse') { msg('たいようと ブラックホールが かさなっていく…!'); sfx('no'); await sleep(1200); }
    msg(`${sk.id === 'x_big' ? sk.name : def.name + ' の ' + sk.name}!`); await sleep(350);
    if (sup && hpOf(sup.m) > 0 && sk.power > 0 && !big && Math.random() < 0.3) {   // サポートの なかまを ねらう
      await playFx(eImg, sup.img, sk, el); const ss = monStats(sup.m), mg2 = skillKind(sk) === 'magic', r2 = calc(eS(mg2 ? 'matk' : 'atk'), sk.power, mg2 ? ss.mdef : ss.def, el, GD.MONSTERS[sup.m.id].element, GD.CRIT_CHANCE);
      sup.m.hp = Math.max(0, hpOf(sup.m) - r2.dmg); sfx('no'); await hit(sup.img); supDraw(); msg(`${monName(sup.m)} は ${r2.dmg} の ダメージを うけた!`); await sleep(700);
      if (hpOf(sup.m) <= 0) { msg(`${monName(sup.m)} は たおれた…`); sup.img.classList.add('faint'); await sleep(900); sup.img.remove(); sup = null; }
      return;
    }
    if (sk.power === 0) {
      if (fx.foe || fx.st) await playFx(eImg, aImg, sk, el); else { eImg.classList.add('glow'); await sleep(500); eImg.classList.remove('glow'); }
      await useFx('e', fx, true); return;
    }
    await playFx(eImg, aImg, sk, el);
    const mg = skillKind(sk) === 'magic', r = calc(eS(mg ? 'matk' : 'atk'), sk.power, mg ? st.mdef : st.def, el, GD.MONSTERS[a.id].element, GD.CRIT_CHANCE + (e.ab === 'sharp' ? 0.1 : 0));
    let dmg = Math.round(r.dmg * envMul(opts.wx, opts.hour, el)); if (guarding) dmg = Math.max(1, Math.round(dmg * (big ? 0.35 : 0.5))); if (e.ab === 'pinch' && e.hp < e.maxHp / 3) dmg = Math.round(dmg * 1.3); if (e.ab === 'typeboost' && el === def.element) dmg = Math.round(dmg * 1.15); if (aab === 'thick') dmg = Math.max(1, Math.round(dmg * 0.88));
    let held = false; if ((aab === 'fortress' || holdOf(a).sash) && !aFort && dmg >= hpOf(a) && hpOf(a) > 1) { dmg = hpOf(a) - 1; aFort = true; held = true; }
    const A = sd('a'); if (A.ail && A.ail.k === 'freeze' && el === 'fire') A.ail = null;
    a.hp = Math.max(0, hpOf(a) - dmg); sfx('no'); await hit(aImg); draw(); pop('a', '-' + dmg, r.crit ? 'crit' : '');
    const t = tierText(r.tier, r.crit); if (t) { msg(t); await sleep(650); } else await sleep(250);
    if (held) { msg(`${monName(a)} は ふくつの こころで こらえた!`); await sleep(800); }
    if (fx && hpOf(a) > 0) await useFx('e', fx, false);
    guarding = false;
  };
  // ラウンドの おわり: じこさいせい / りょうりバフの ターンを へらす
  const supDraw = () => { if (!sup) return; const st = monStats(sup.m); $('.hp i', sup.box).style.width = Math.max(0, hpOf(sup.m) / st.maxHp * 100) + '%'; };
  const supAct = async () => {   // サポートの なかまは まいターン じどうで こうげき
    if (!sup || hpOf(sup.m) <= 0 || e.hp <= 0) return;
    const m = sup.m, st = monStats(m), mv = movesOf(m).filter(s => s.power > 0 && ppOf(m, s) > 0).sort((p, q) => q.power - p.power); if (!mv.length) return;
    const sk = mv[Math.random() < 0.7 ? 0 : Math.floor(Math.random() * mv.length)], el = sk.element || GD.MONSTERS[m.id].element, mg = skillKind(sk) === 'magic';
    m.pp = m.pp || {}; m.pp[sk.id] = Math.max(0, ppOf(m, sk) - 1);
    msg(`${monName(m)} も ${sk.name}!`); sfx('pick'); await sleep(300); await playFx(sup.img, eImg, sk, el);
    const r = calc(mg ? st.matk : st.atk, sk.power, eS(mg ? 'mdef' : 'def'), el, def.element, 0.05), dmg = Math.max(1, Math.round(r.dmg * 0.75 * envMul(opts.wx, opts.hour, el)));
    e.hp = Math.max(0, e.hp - dmg); sfx('pet'); await hit(eImg); draw(); pop('e', '-' + dmg, ''); await sleep(450);
  };
  const roundEnd = async () => {
    const a = state.party[ai]; guarding = false;
    await bossCheck();
    await supAct(); if (e.hp <= 0) { result = 'win'; return; }
    for (const side of ['a', 'e']) {
      const S = sd(side); if (!S.ail || hpNow(side) <= 0 || !AIL[S.ail.k].dot) continue;
      const mx = maxOf(side), n = Math.max(1, Math.round(mx / AIL[S.ail.k].dot * (side === 'e' && opts.boss ? 0.5 : 1)));
      hurt(side, n); await hit(imgOf(side)); pop(side, '-' + n, ''); msg(`${nameOf(side)} は ${AIL[S.ail.k].name}の ダメージを うけた`); sfx('no'); await sleep(700);
      if (S.ail.k === 'leech') { const o = side === 'a' ? 'e' : 'a'; if (hpNow(o) > 0) { healSide(o, n); await sleep(400); } }
    }
    if (e.hp <= 0) { result = 'win'; return; }
    if (hpOf(a) <= 0) { if (!(await afterAllyFaint())) result = 'lose'; return; }
    if (hpOf(a) > 0 && abilityOf(a.id) === 'regen') { const mx = monStats(a).maxHp, add = Math.min(mx - hpOf(a), Math.max(1, Math.round(mx / 12))); if (add > 0) { a.hp = hpOf(a) + add; draw(); pop('a', '+' + add, 'heal'); msg(`${monName(a)} は じこさいせいで かいふくした`); await sleep(600); } }
    { const ho = holdOf(a); if (hpOf(a) > 0 && ho.regen) { const mx = monStats(a).maxHp, add = Math.min(mx - hpOf(a), Math.max(1, Math.round(mx / ho.regen))); if (add > 0) { a.hp = hpOf(a) + add; draw(); pop('a', '+' + add, 'heal'); msg(`${monName(a)} は ${ITEMS[a.held].name}で かいふくした`); await sleep(600); } } }
    if (e.hp > 0 && e.ab === 'regen') { const add = Math.min(e.maxHp - e.hp, Math.max(1, Math.round(e.maxHp / 12))); if (add > 0) { e.hp += add; draw(); pop('e', '+' + add, 'heal'); await sleep(500); } }
    if (buff && buff.regen && hpOf(a) > 0) { const mx = monStats(a).maxHp, add = Math.min(mx - hpOf(a), Math.max(1, Math.round(mx * buff.regen))); if (add > 0) { healSide('a', add); msg(`${monName(a)} は ごちそうの ちからで かいふくした`); await sleep(600); } }
    if (buff && --buff.turns <= 0) { msg('りょうりの こうかが きれた'); buff = null; draw(); await sleep(600); }
  };
  // 自分のモンスターが倒れたとき: 次を出す。全滅なら false
  const afterAllyFaint = async () => {
    const a = state.party[ai]; if (hpOf(a) > 0) return true;
    msg(`${monName(a)} は たおれた…`); aImg.classList.add('faint'); await sleep(900);
    const nx = state.party.findIndex(m => hpOf(m) > 0); if (nx < 0) return false;
    let pick = nx;
    if (state.party.filter(m => hpOf(m) > 0).length > 1) {
      msg('つぎに だす なかまを えらんでね');
      const rows = state.party.map((m, i) => ({ html: `${monName(m)} ${elemChip(GD.MONSTERS[m.id].element)}<small>Lv${m.lv} HP ${Math.max(0, hpOf(m))}/${monStats(m).maxHp}　${matchHint(GD.MONSTERS[m.id].element, def.element)}</small>`, v: i, off: hpOf(m) <= 0 }));
      pick = await menu(rows); cmd.innerHTML = '';
    }
    if (sup && state.party[pick] === sup.m) { sup.box.remove(); sup = null; }
    ai = pick; aImg.classList.remove('faint'); resetStg(); draw(); msg(`ゆけっ ${monName(state.party[ai])}!`); await sleep(800); return true;
  };
  // 新しい技: 4つに空きがあれば おぼえる。いっぱいなら どれと入れかえるか えらぶ
  const learnNew = async (a, before) => {
    movesOf(a); const fresh = knownOf(a).filter(s => !before.includes(s)); if (!a.moves) a.moves = [];
    for (const s of fresh) {
      const sk = GD.SKILLS[s], name = monName(a); if (a.moves.includes(s)) continue;
      if (a.moves.length < 4) { a.moves.push(s); sfx('quest'); msg(`${name} は ${sk.name} を おぼえた!`); await sleep(1200); continue; }
      let v = -1;
      while (true) {   // 「わすれて おぼえる」か「おぼえない」を えらぶ → わすれる わざを えらぶ
        msg(`${name} は あたらしく ${sk.name} を おぼえられる!(${skillText(sk)}) でも わざは 4つまで。どうする?`);
        const c = await menu([{ html: `ほかの わざを わすれて ${sk.name} を おぼえる`, v: 'learn' }, { html: `${sk.name} は おぼえない`, v: 'skip' }]); cmd.innerHTML = '';
        if (c === 'skip') break;
        msg(`どの わざを わすれる?`);
        const rows = a.moves.map((m, i) => ({ html: `${GD.SKILLS[m].name}<small>${skillText(GD.SKILLS[m])}</small>`, v: i })); rows.push({ html: 'やっぱり やめる', v: -1 });
        const w = await menu(rows); cmd.innerHTML = ''; if (w >= 0) { v = w; break; }
      }
      if (v >= 0) { const old = GD.SKILLS[a.moves[v]].name; a.moves[v] = s; sfx('quest'); msg(`${old} を わすれて、${sk.name} を おぼえた!`); } else msg(`${sk.name} は おぼえなかった…`);
      await sleep(1300);
    }
  };
  const evolve = async (a, newId) => {
    const oldName = monName(a), oldImage = GD.MONSTERS[a.id].image; msg(`おや…? ${oldName} の ようすが…!`); await sleep(900);
    if (!(await evoSwap(aImg, oldImage, GD.MONSTERS[newId].image, sleep))) { aImg.src = img(oldImage); msg('なにも おきなかった…'); await sleep(2200); return; }
    aImg.dataset.src = GD.MONSTERS[newId].image;
    const ratio = Math.max(0.1, hpOf(a) / monStats(a).maxHp), before = knownOf(a); a.id = newId; state.mdex[newId] = 2;
    a.hp = Math.round(monStats(a).maxHp * ratio); draw(); jingle('win');
    msg(`${oldName} は ${GD.MONSTERS[newId].name} に しんかした!`); await sleep(2200); await learnNew(a, before);
  };
  // レベルアップのポップアップ(タップで次へ: ①レベル → ②ステータスの変化)
  const levelPopup = (name, lv0, lv1, s0, s1) => new Promise(res => {
    const pages = [`<div class="lu-t">レベルが あがった!</div><div class="lu-n">${name}</div><div class="lu-row big"><span>${lv0} レベル</span><i>→</i><b>${lv1} レベル</b></div>`,
      `<div class="lu-t">ステータスが あがった!</div>` + [['HP', 'maxHp', ''], ['こうげき', 'atk', ''], ['ぼうぎょ', 'def', ''], ['まほうこうげき', 'matk', ''], ['まほうぼうぎょ', 'mdef', ''], ['すばやさ', 'spd', ''], ['かいしん', 'crit', '%'], ['ラッキー', 'luck', '']].map(([l, k, u]) => `<div class="lu-row${s1[k] > s0[k] ? ' up' : ''}"><em>${l}</em><span>${s0[k]}${u}</span><i>→</i><b>${s1[k]}${u}</b></div>`).join('')];
    const pop = document.createElement('div'); pop.className = 'bt-lu'; root.appendChild(pop);
    let i = 0; const show = () => { pop.innerHTML = `<div class="lu-box">${pages[i]}<div class="lu-tap">タップでつぎへ</div></div>`; };
    show(); pop.onclick = () => { sfx('ui'); if (++i >= pages.length) { pop.remove(); res(); } else show(); };
  });
  // つかまえた モンスターに なまえを つけるか たずねる
  const askNick = async (m) => {
    if (!askNickOn()) return;
    msg(`${def.name} に なまえを つけますか?`); const v = await menu([{ html: 'なまえを つける', v: 1 }, { html: 'つけない', v: 0 }]); cmd.innerHTML = '';
    if (!v) return;
    await new Promise(res => {
      const ov = document.createElement('div'); ov.className = 'bt-nick'; ov.innerHTML = `<div class="box"><div class="t">${def.name} の なまえ</div><input type="text" maxlength="8" placeholder="${def.name}"><div class="b"><button class="ok">きめる</button><button class="no">やめる</button></div></div>`; root.appendChild(ov);
      const inp = $('input', ov); setTimeout(() => inp.focus(), 50);
      $('.ok', ov).onclick = () => { const t = inp.value.trim().slice(0, 8); if (t) m.nick = t; sfx('quest'); ov.remove(); res(); };
      $('.no', ov).onclick = () => { ov.remove(); res(); };
    });
    if (m.nick) { msg(`${m.nick} と なづけた!`); await sleep(1000); }
  };
  // バトルの けっか(ぜんいんの けいけんち・しょうきん・ドロップを まとめて ひょうじ)
  const resultPopup = () => new Promise(res => {
    const pop = document.createElement('div'); pop.className = 'bt-lu'; root.appendChild(pop);
    const rows = xpLog.map(([n, g, bench]) => `<div class="lu-row"><span>${n}${bench ? ' (ひかえ)' : ''}</span><b>けいけんち +${g}</b></div>`).join('');
    pop.innerHTML = `<div class="lu-box"><div class="lu-t">しょうり!</div>${rows}<div class="lu-row"><span>しょうきん</span><b>+${xpLog.money || 0} コイン</b></div>${xpLog.drops && xpLog.drops.length ? `<div class="lu-row"><span>てにいれた もの</span><b>${xpLog.drops.map(([id, n]) => ITEMS[id].name + '×' + n).join('、')}</b></div>` : ''}<div class="lu-tap">タップでつぎへ</div></div>`;
    pop.onclick = () => { sfx('ui'); pop.remove(); res(); };
  });
  // なかまボールの演出(ちんちらクエストと同じ: なげる→吸いこむ→ゆれる→成功/失敗)
  const captureAnim = (prefix, ok) => new Promise(res => {
    const field = $('.bt-field', root), fr = field.getBoundingClientRect(), pr = aImg.getBoundingClientRect(), er = eImg.getBoundingClientRect();
    const src = (n) => img(`assets/capture/capture_${prefix}_${n}.webp`), sx = pr.left + pr.width / 2 - fr.left, sy = pr.top + pr.height / 2 - fr.top, ex = er.left + er.width / 2 - fr.left, ey = er.top + er.height / 2 - fr.top;
    const ball = document.createElement('img'); ball.className = 'capture-ball-anim'; ball.src = src('fly'); ball.style.left = sx + 'px'; ball.style.top = sy + 'px'; field.appendChild(ball);
    requestAnimationFrame(() => { ball.classList.add('flying', 'spin'); ball.style.left = ex + 'px'; ball.style.top = ey + 'px'; });
    setTimeout(() => { ball.classList.remove('flying', 'spin'); eImg.classList.add('suck-in'); setTimeout(() => { eImg.style.visibility = 'hidden'; eImg.classList.remove('suck-in'); }, 260); ball.src = src('squish'); ball.classList.add('squish'); }, 450);
    setTimeout(() => {
      ball.classList.remove('squish'); let w = 0;
      const next = () => {
        if (w >= 3) { if (ok) { ball.src = src('success'); ball.classList.add('success-pop'); setTimeout(() => { ball.remove(); res(); }, 750); } else { ball.src = src('fail'); ball.classList.add('fail-pop'); eImg.style.visibility = ''; eImg.classList.add('pop-out'); setTimeout(() => eImg.classList.remove('pop-out'), 400); setTimeout(() => { ball.remove(); res(); }, 550); } return; }
        ball.src = src('wobble' + (++w)); ball.classList.remove('wobble'); void ball.offsetWidth; ball.classList.add('wobble'); sfx('pick'); setTimeout(next, 340);
      };
      next();
    }, 700);
  });
  const xpOf = (a) => Math.round(def.exp * expLevelMul(a.lv, eLv) * (opts.trainer ? 1.5 : 1) * (1 + villageBoost() * 0.5) * (hasBadge('forest') ? 1.15 : 1) * (hasBadge('sky') ? 1.15 : 1) * (hasBadge('dragon') ? 1.15 : 1) * (abilityOf(a.id) === 'wise' ? 1.15 : 1) * (holdOf(a).exp || 1) * ((buff && buff.exp) || 1));
  const gainExp = async () => {
    const a = state.party[ai], ad = GD.MONSTERS[a.id], xp = xpOf(a);
    xpLog.push([monName(a), xp, false]); msg(`${xp} の けいけんちを てにいれた!`); a.exp = (a.exp || 0) + xp; await sleep(900);
    a.bond = (a.bond || 0) + 1;   // いっしょに たたかうと なかよしに
    while (a.exp >= needExp(a.lv, a.id)) {
      const before = knownOf(a), oldLv = a.lv, oldSt = monStats(a); a.exp -= needExp(a.lv, a.id); a.lv++; a.hp = hpOf({ ...a, hp: null }); draw(); sfx('quest'); msg(`${monName(a)} は レベル ${a.lv} に あがった!`); await levelPopup(monName(a), oldLv, a.lv, oldSt, monStats(a));
      await learnNew(a, before);
      const ev = GD.MONSTERS[a.id].evolvesTo; if (ev && a.lv >= ev.level && GD.MONSTERS[ev.id]) await evolve(a, ev.id);
    }
    draw();
    // たたかった なかま(こうたいした なかま)は ぜんがく、ひかえは はんぶん もらえる
    for (const m of state.party.slice()) {
      if (m === a) continue; const full = fought.has(m), gain = Math.max(1, Math.round(xpOf(m) * (full ? 1 : 0.5))), nm = monName(m);
      xpLog.push([nm, gain, !full]); m.exp = (m.exp || 0) + gain; if (full) m.bond = (m.bond || 0) + 1;
      msg(`${nm} も ${gain} の けいけんちを てにいれた!${full ? '' : '(ひかえ)'}`); await sleep(800);
      while (m.exp >= needExp(m.lv, m.id)) {
        const before = knownOf(m), oldLv = m.lv, oldSt = monStats(m), alive = hpOf(m) > 0; m.exp -= needExp(m.lv, m.id); m.lv++; if (alive) m.hp = null; sfx('quest');
        msg(`${nm} は レベル ${m.lv} に あがった!`); await levelPopup(nm, oldLv, m.lv, oldSt, monStats(m));
        movesOf(m); for (const sk of knownOf(m).filter(x => !before.includes(x))) if (m.moves.length < 4) { m.moves.push(sk); msg(`${nm} は ${GD.SKILLS[sk].name} を おぼえた!`); await sleep(1000); }
        const ev2 = GD.MONSTERS[m.id].evolvesTo; if (ev2 && m.lv >= ev2.level && GD.MONSTERS[ev2.id]) { const old = nm; if (await evoOverlay(GD.MONSTERS[m.id].image, GD.MONSTERS[ev2.id].image, old, GD.MONSTERS[ev2.id].name)) { m.id = ev2.id; state.mdex[ev2.id] = 2; msg(`${old} は ${monName(m)} に しんかした!`); await sleep(1000); } else { msg('なにも おきなかった…'); await sleep(1000); } }
      }
    }
  };

  if (opts.dbg) opts.dbg({ sd, draw, playFx, aImg, eImg, motionOf, movesOf });
  const cmd = $('.bt-cmd', root);
  const menu = (rows, back) => new Promise(res => {
    cmd.innerHTML = ''; cmd.classList.toggle('list', rows.length > 4);
    rows.forEach(r => { const b = document.createElement('button'); b.innerHTML = r.html; if (r.off) b.disabled = true; b.onclick = () => { sfx('ui'); res(r.v); }; cmd.appendChild(b); });
    if (back) { const b = document.createElement('button'); b.className = 'back'; b.textContent = 'もどる'; b.onclick = () => { sfx('ui'); res('__back'); }; cmd.appendChild(b); }
  });

  let result = null, acted0 = false;
  root.classList.add('nt'); playBgm(opts.boss && !opts.trainer ? 'boss' : 'battle'); draw(); void root.offsetWidth; requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove('nt')));   // さいしょの HPバーは アニメなしで ぴったり表示
  // ---- バトルの はじまりの えんしゅつ(ふつう: アイリスワイプ / ぬし: とくべつな とうじょう) ----
  const introAnim = async () => {
    const isBoss = !!opts.boss && !opts.trainer, fld = $('.bt-field', root), EC = { fire: '#ff6a30', water: '#4aa8ff', grass: '#58c458', wind: '#7adcc8', earth: '#c89a54', thunder: '#ffd830', heaven: '#fff0a0', dark: '#a070e0', magic: '#e070e8', beast: '#e8a860', kami: '#ffe890' }, col = EC[def.element] || '#ffd860';
    const ov = document.createElement('div'); ov.className = 'bt-intro ' + (isBoss ? 'boss' : 'norm'); ov.style.setProperty('--ec', col);
    ov.innerHTML = isBoss
      ? `<div class="bar t"></div><div class="bar b"></div><div class="vig"></div><div class="rays"></div><div class="ban"><small>ぬし</small><b>${def.name}</b></div><div class="flash"></div>`
      : `<div class="sl s1"></div><div class="sl s2"></div><div class="sl s3"></div>${opts.trainer ? `<div class="ban t2"><small>VS</small><b>${opts.trainer}</b></div>` : ''}<div class="iris"></div>`;
    root.appendChild(ov); let skip = false; ov.onclick = () => { skip = true; };
    const wait = async (ms) => { const t0 = performance.now(); while (!skip && performance.now() - t0 < ms / battleSpeed()) await new Promise(r => setTimeout(r, 30)); };
    eImg.style.visibility = 'hidden'; aImg.style.visibility = 'hidden';
    if (isBoss) {
      sfx('no'); fld.classList.add('quake'); await wait(500); sfx('quest'); await wait(1500);
      ov.classList.add('go'); sfx('quest'); await wait(260); eImg.style.visibility = ''; eImg.classList.add('enter-boss'); fld.classList.remove('quake');
      const ring = document.createElement('div'); ring.className = 'bt-ring'; ring.style.setProperty('--ec', col); const r = rectOf(eImg); ring.style.left = r.x + 'px'; ring.style.top = r.y + 'px'; fld.appendChild(ring);
      await wait(700); aImg.style.visibility = ''; aImg.classList.add('enter-a'); await wait(500); ring.remove(); eImg.classList.remove('enter-boss'); aImg.classList.remove('enter-a');
    } else {
      const throwBall = async (el, fromRight) => {   // チモシーボールを なげて、わって なかまが とびだす
        const fr = rectOf(el), tx = fr.x, ty = fr.y + fr.h * 0.15, fw = fld.getBoundingClientRect().width, sx = fromRight ? fw + 30 : -30, sy = fr.y + fr.h * 0.4, ball = document.createElement('img');
        ball.className = 'capture-ball-anim'; ball.src = img('assets/capture/capture_ball_fly.webp'); ball.style.width = '78px'; ball.style.left = '0'; ball.style.top = '0'; fld.appendChild(ball); sfx('pick');
        const kf = []; for (let i = 0; i <= 12; i++) { const t = i / 12; kf.push({ transform: `translate(${sx + (tx - sx) * t}px, ${sy + (ty - sy) * t - Math.sin(Math.PI * t) * fr.h * 0.75}px) translate(-50%, -50%) rotate(${(fromRight ? -1 : 1) * t * 540}deg)` }); }
        const an = ball.animate(kf, { duration: 580 / battleSpeed(), easing: 'linear', fill: 'forwards' }); try { await an.finished; } catch (e) {}
        ball.style.left = tx + 'px'; ball.style.top = ty + 'px'; an.cancel(); ball.src = img('assets/capture/capture_ball_squish.webp'); await wait(150);
        ball.src = img('assets/capture/capture_ball_fail.webp'); ball.classList.add('pop-open'); sfx('quest'); el.style.visibility = ''; el.classList.add('summon'); await wait(650); ball.remove(); el.classList.remove('summon');
      };
      sfx('pick'); await wait(opts.trainer ? 900 : 420); ov.classList.add('go');
      if (opts.trainer) { msg(`${opts.trainer} は ${def.name} を くりだした!`); await wait(300); await throwBall(eImg, true); }   // トレーナーも ボールを なげる
      else { eImg.style.visibility = ''; eImg.classList.add('enter-e'); await wait(800); eImg.classList.remove('enter-e'); }   // やせいは よこから スライドして だいざに つく
      msg(`ゆけっ ${monName(state.party[ai])}!`); await wait(250); await throwBall(aImg, false);
    }
    eImg.style.visibility = ''; aImg.style.visibility = ''; ov.remove();
  };
  try { await introAnim(); } catch (e) { eImg.style.visibility = ''; aImg.style.visibility = ''; }
  if (opts.boss && assistOn()) {
    const mi = state.party.findIndex((m, i) => i !== ai && hpOf(m) > 0);
    if (mi >= 0) {
      const m = state.party[mi], box = document.createElement('div'); box.className = 'bt-sup summon'; box.innerHTML = `<img alt=""><div class="hp"><i></i></div><small></small>`;
      const im = $('img', box); im.src = img(GD.MONSTERS[m.id].image); box.querySelector('small').textContent = monName(m); fieldEl.appendChild(box); setTimeout(() => box.classList.remove('summon'), 700);
      sup = { m, img: im, box }; fought.add(m); supDraw();
    }
  }
  msg(opts.trainer ? `トレーナーの ${opts.trainer} が しょうぶを しかけてきた!` : opts.boss ? `${def.name} が たちはだかった!` : `あっ! やせいの ${def.name} が とびだしてきた!`); sfx('quest'); await sleep(1300);
  if (opts.boss && !opts.trainer && !state.tips.boss) { state.tips.boss = 1; msg('ヒント: ぬしが「ちからを ためて」きたら、つぎの こうげきは とても つよいよ!'); await sleep(2200); }
  if (!state.tips.bt1) { state.tips.bt1 = 1; msg('ヒント: わざには PP(かいすう)が あるよ。ベッドで ねると ぜんかいふく!'); await sleep(2000); }
  { const et = envText(opts.wx, opts.hour); if (et) { msg(et); await sleep(1300); } }
  msg(`ゆけっ ${monName(state.party[ai])}!`); await sleep(700);

  while (!result) {
    if (acted0) { acted0 = false; await roundEnd(); if (result) break; }
    msg(`${monName(state.party[ai])} は どうする?`);
    const top = await menu([{ html: 'わざ', v: 'skill' }, { html: 'どうぐ', v: 'item' }, { html: 'いれかえ', v: 'swap' }, { html: 'にげる', v: 'run' }]);
    let acted = false, allyFirst = false;
    if (top === 'skill') {
      const a = state.party[ai], rows = movesOf(a).map(s => { const el = s.element || GD.MONSTERS[a.id].element; return { html: `${s.name} ${elemChip(el)}<small>${skillShort(s)}　PP ${ppOf(a, s)}/${ppMax(s)}${s.power > 0 ? '　' + matchHint(el, def.element) : ''}</small>`, v: s, off: ppOf(a, s) <= 0 }; });
      let v; if (rows.every(r => r.off)) { msg('つかえる わざが ない! わるあがきを するしか ない…'); await sleep(1100); v = STRUGGLE; } else v = await menu(rows, true);
      if (v === '__back') continue;
      allyFirst = allyStats().spd >= enemySpd(); cmd.innerHTML = '';
      if (v === '__guard') { guarding = true; msg(`${monName(a)} は みを まもっている!`); sfx('pick'); aImg.classList.add('glow'); await sleep(800); aImg.classList.remove('glow'); await enemyAttack(); if (e.hp <= 0) { result = 'win'; break; } if (!(await afterAllyFaint())) { result = 'lose'; break; } }
      else if (allyFirst) { await allyAttack(v); if (e.hp <= 0) { result = 'win'; break; } await enemyAttack(); if (e.hp <= 0) { result = 'win'; break; } if (!(await afterAllyFaint())) { result = 'lose'; break; } }
      else { await enemyAttack(); if (e.hp <= 0) { result = 'win'; break; } if (!(await afterAllyFaint())) { result = 'lose'; break; } await allyAttack(v); if (e.hp <= 0) { result = 'win'; break; } }
      acted = true;
    } else if (top === 'item') {
      const capOut = !!(opts.cap && opts.cap.left <= 0), foods = capOut ? [] : Object.keys(MON_HEAL).filter(id => count(id) > 0), rows = foods.map(id => ({ html: `${itemIcon(id)}${ITEMS[id].name}<small>HP +${Math.round(MON_HEAL[id] * (hasBadge('grove') ? 1.5 : 1))}${BUFFS[id] ? ' / ' + buffText(BUFFS[id]) : ''} / ×${count(id)}${opts.cap ? ' / あと' + opts.cap.left + 'かい' : ''}</small>`, v: id }));
      if (!opts.trainer) BALL_IDS.filter(id => count(id) > 0).reverse().forEach(id => rows.unshift({ html: `${itemIcon(id)}${ITEMS[id].name}<small>${ITEMS[id].ball.mult === Infinity ? 'かならず なかまに なる' : 'せいこうりつ ×' + ITEMS[id].ball.mult} / ×${count(id)}</small>`, v: id }));
      Object.keys(ITEMS).filter(id => ITEMS[id].battle && count(id) > 0).forEach(id => rows.push({ html: `${itemIcon(id)}${ITEMS[id].name}<small>${ITEMS[id].desc || ''} / ×${count(id)}</small>`, v: id }));
      if (!rows.length) { msg(capOut ? 'ここでは もう かいふくの たべものは つかえない!' : 'つかえる どうぐが ない… (牧場の やさいや りょうりで かいふくできるよ)'); await sleep(1400); continue; }
      const v = await menu(rows, true); if (v === '__back') continue; cmd.innerHTML = '';
      if (ITEMS[v] && ITEMS[v].ball) {
        const bl = ITEMS[v].ball; addItem(v, -1); msg(`${ITEMS[v].name}を なげた!`); sfx('pick');
        const hpR = e.hp / e.maxHp, base = Math.min(0.9, 0.15 + (1 - hpR) * 0.6), luckB = monStats(state.party[ai]).luck * 0.004;
        const chance = bl.mult === Infinity ? 1 : Math.min(1, base * bl.mult * (def.catchPenalty || 1) + luckB + (abilityOf(state.party[ai].id) === 'catcher' ? 0.06 : 0)), ok = Math.random() < chance;
        await captureAnim(bl.anim, ok);
        if (ok) { msg(`${def.name} を なかまに した!`); sfx('quest'); await sleep(1100); state.mdex[enemyId] = 2; if (state.party.length < 6) { const nmon = { id: enemyId, lv: e.lv, exp: 0, hp: null }; state.party.push(nmon); await askNick(nmon); } else {   // てもちが 6ぴきなら ぼくじょうへ おくる(むらで いれかえできる)
          state.pasture = state.pasture || [];
          if (state.pasture.length < 12) { const nmon = { id: enemyId, lv: e.lv, exp: 0, hp: null }; state.pasture.push(nmon); msg(`てもちが いっぱいなので ${def.name} は なかまの ぼくじょうに おくられた!`); await sleep(1500); msg('むらの ぼくじょうで てもちと いれかえられるよ'); await sleep(1500); }
          else { msg('ぼくじょうも いっぱいなので 野に かえした…'); await sleep(1100); }
        } result = 'caught'; break; }
        msg(`ああっ、${def.name} が とびだしてしまった!`); await sleep(900);
      } else if (ITEMS[v] && ITEMS[v].battle) {
        const bu = ITEMS[v].battle, a = state.party[ai]; addItem(v, -1); sfx('feed'); msg(`${ITEMS[v].name}を つかった!`); await sleep(700);
        if (bu.cure) { const S = sd('a'); if (S.ail) { S.ail = null; draw(); msg(`${monName(a)} の じょうたいいじょうが なおった!`); } else msg('でも なにも おこらなかった…'); await sleep(900); }
        if (bu.stg) for (const [k, n] of Object.entries(bu.stg)) await changeStage('a', k, n);
        if (bu.pp) { a.pp = a.pp || {}; for (const sk of movesOf(a)) a.pp[sk.id] = Math.min(ppMax(sk), ppOf(a, sk) + bu.pp); msg(`${monName(a)} の わざの PPが かいふくした!`); await sleep(900); }
      } else {
        const a = state.party[ai], st = monStats(a), before = hpOf(a); a.hp = Math.min(st.maxHp, before + Math.round(MON_HEAL[v] * (hasBadge('grove') ? 1.5 : 1))); addItem(v, -1); if (opts.cap) opts.cap.left--; sfx('feed'); sd('a').ail = null; if (BUFFS[v]) buff = { ...BUFFS[v] }; draw(); pop('a', '+' + (a.hp - before), 'heal'); msg(`${ITEMS[v].name}を たべて げんきに なった!`); await sleep(1000);
      }
      await enemyAttack(); if (e.hp <= 0) { result = 'win'; break; } if (!(await afterAllyFaint())) { result = 'lose'; break; } acted = true;
    } else if (top === 'swap') {
      const rows = state.party.map((m, i) => ({ html: `${monName(m)} ${elemChip(GD.MONSTERS[m.id].element)}<small>Lv${m.lv} HP ${Math.max(0, hpOf(m))}/${monStats(m).maxHp}${i === ai ? ' (でている)' : ''}　${matchHint(GD.MONSTERS[m.id].element, def.element)}</small>`, v: i, off: i === ai || hpOf(m) <= 0 || (sup && m === sup.m) }));
      const v = await menu(rows, true); if (v === '__back') continue; cmd.innerHTML = '';
      ai = v; resetStg(); draw(); msg(`ゆけっ ${monName(state.party[ai])}!`); await sleep(800);
      await enemyAttack(); if (e.hp <= 0) { result = 'win'; break; } if (!(await afterAllyFaint())) { result = 'lose'; break; } acted = true;
    } else if (top === 'run') {
      cmd.innerHTML = ''; const a = state.party[ai];
      if (opts.boss) { msg(opts.trainer ? 'トレーナーとの しょうぶからは にげられない!' : 'ぬしからは にげられない!'); await sleep(900); continue; }
      if (Math.random() < Math.min(0.95, 0.5 + (allyStats().spd - enemySpd()) * 0.03)) { msg('うまく にげきれた!'); await sleep(900); result = 'run'; break; }
      msg('にげられなかった!'); await sleep(800); await enemyAttack(); if (e.hp <= 0) { result = 'win'; break; } if (!(await afterAllyFaint())) { result = 'lose'; break; }
      acted = true;
    }
    acted0 = acted;
  }
  cmd.innerHTML = '';
  if (result === 'win' || result === 'caught') {   // なかまに した = しょうり(けいけんちと しょうきんが もらえる)
    if (result === 'win') { eImg.classList.add('faint'); msg(`${def.name} を たおした!`); jingle('win'); await sleep(1300); } else { jingle('win'); await sleep(500); }
    await gainExp(); const money = Math.round(def.money * (hasBadge('ghost') ? 1.25 : 1) * (abilityOf(state.party[ai].id) === 'greedy' ? 1.15 : 1) * (holdOf(state.party[ai]).money || 1) * (1 + monStats(state.party[ai]).luck * 0.004)); state.coins += money; xpLog.money = money; addStat('win', 1); msg(`${money} コインを てにいれた!`); sfx('coin'); await sleep(1100);
    { const dr = rollDrops(def, !!opts.boss && !opts.trainer), names = Object.entries(dr); if (names.length) { for (const [id, n] of names) addItem(id, n); xpLog.drops = names; msg(names.map(([id, n]) => `${ITEMS[id].name}×${n}`).join('、') + ' を てにいれた!'); sfx('pick'); await sleep(1400); } }
    await resultPopup();
    if (opts.boss && opts.onBossWin) { await opts.onBossWin(msg, sleep); }
  }
  else if (result === 'lose') { msg('めのまえが まっくらに なった…'); await sleep(1500); for (const m of state.party) if (hpOf(m) <= 0) m.hp = 1; }
  removeEventListener('resize', onR); ro.disconnect(); root.remove(); playBgm('field');
  return result;
}

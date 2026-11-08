// 「月」シリーズの 新しい属性(ぞくせい)7つ。つき・ほし・ゆめ・しお・しも・かげ・よる
// 相性: つき→かげ→ゆめ→ほし→しも→しお→よる→つき の わ(つぎの ぞくせいに ばつぐん、まえの ぞくせいに いまひとつ)。もとの 10タイプとは ふつう
export const MOON_ELS = ['tsuki', 'hoshi', 'yume', 'shio', 'shimo', 'kage', 'yoru'];
export const MOON_RING = ['tsuki', 'kage', 'yume', 'hoshi', 'shimo', 'shio', 'yoru'];
const LABEL = { tsuki: 'つき', hoshi: 'ほし', yume: 'ゆめ', shio: 'しお', shimo: 'しも', kage: 'かげ', yoru: 'よる' };
const BASE = { tsuki: 'magic', hoshi: 'heaven', yume: 'dark', shio: 'water', shimo: 'water', kage: 'dark', yoru: 'beast' };   // えんしゅつ(エフェクト)・わざの つよさは この ぞくせいを かりる
const PRE = { tsuki: 'ムーン', hoshi: 'スター', yume: 'ドリーム', shio: 'タイド', shimo: 'フロスト', kage: 'シェード', yoru: 'ナイト' };
// 20ばんめまでの わざの なまえ(つよさの じゅんばん)
const SUF = ['ショット', 'アロー', 'スラッシュ', 'ガード', 'ミスト', 'ウェーブ', 'バインド', 'タッチ', 'フィールド', 'サークル', 'ストライク', 'ブラスト', 'スパーク', 'ビーム', 'ゲート', 'ストーム', 'バースト', 'ノヴァ', 'ブレイク', 'ファイナル'];
const DESCS = { tsuki: 'つきの ひかりで こうげきする', hoshi: 'ほしの かがやきで こうげきする', yume: 'ゆめの ちからで こうげきする', shio: 'しおの ながれで こうげきする', shimo: 'つめたい しもで こうげきする', kage: 'かげの ちからで こうげきする', yoru: 'よるの やみで こうげきする' };

export function installMoonElements(GD) {
  if (GD._moonEl) return; GD._moonEl = true;
  for (const el of MOON_ELS) {
    const b = BASE[el];
    GD.ELEMENT_LABELS[el] = LABEL[el];
    if (GD.ELEMENT_EFFECTS && GD.ELEMENT_EFFECTS[b]) GD.ELEMENT_EFFECTS[el] = GD.ELEMENT_EFFECTS[b];
    if (GD.ELEMENT_EFFECT_ANIM) GD.ELEMENT_EFFECT_ANIM[el] = GD.ELEMENT_EFFECT_ANIM[b] || [];   // 絵の アイコンは ない(あとで さしかえ)。もじの チップで ひょうじ
    const baseTrack = GD.COMPANION_SKILL_TRACKS[b]; if (!baseTrack) continue;
    const track = ['tackle'];
    baseTrack.slice(1).forEach((sid, i) => {   // もとの ぞくせいの わざと おなじ つよさ・レベル・かいすうで、なまえだけ あたらしく
      const src = GD.SKILLS[sid]; if (!src) return;
      const id = `m_${el}_${i + 1}`;
      GD.SKILLS[id] = { id, name: PRE[el] + (SUF[i] || 'アタック'), power: src.power, uses: src.uses, learnLevel: src.learnLevel, desc: DESCS[el], element: el };
      track.push(id);
    });
    GD.COMPANION_SKILL_TRACKS[el] = track;
  }
  const orig = GD.getElementMatchup;
  GD.getElementMatchup = (atk, def) => {
    const ia = MOON_RING.indexOf(atk), id = MOON_RING.indexOf(def);
    if (atk === 'kami' || (ia < 0 && id < 0)) return orig(atk, def);
    if (ia < 0 || id < 0) return { mult: 1, tier: 'neutral' };
    const n = MOON_RING.length;
    if ((ia + 1) % n === id) return { mult: 2, tier: 'strong' };
    if ((id + 1) % n === ia) return { mult: 0.5, tier: 'weak' };
    return { mult: 1, tier: 'neutral' };
  };
}

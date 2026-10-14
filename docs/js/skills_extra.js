// わざの かくちょう: エフェクト(うごき)に あわせた わざを ぞくせいごとに ふやす。
// [うごき, なまえ, おぼえる めやすレベル]。なまえに うごきの ことば(ファング/クロー/ブレード/レーザー/はしら/レイン/れんぞく/うず/ウェーブ/ノヴァ…)を ふくめて、エフェクトと そろえる。
// いりょくは 既存の わざと おなじ レベル→いりょく の きょくせんで じどうで きめる(バランスは かわらない)。
const LIST = {
  fire: [['barrage', 'ひのこのれんぞく', 7], ['bite', 'ほのおのファング', 11], ['claw', 'ほのおのクロー', 15], ['sweep', 'ほのおのウェーブ', 19], ['cross', 'ほのおのブレード', 23], ['vortex', 'ひのたつまき', 27], ['beam', 'フレイムレーザー', 34], ['pillar', 'ほのおのはしら', 42], ['rain', 'メテオレイン', 48], ['quake', 'ごくえんのばくはつ', 58]],
  water: [['barrage', 'あわのれんぞく', 7], ['bite', 'みずのファング', 11], ['claw', 'みずのクロー', 15], ['cross', 'ウォーターカッター', 21], ['sweep', 'ビッグウェーブ', 26], ['vortex', 'みずのたつまき', 29], ['beam', 'ハイドロレーザー', 34], ['rain', 'スコールレイン', 40], ['pillar', 'みずのはしら', 46], ['quake', 'みずのノヴァ', 60]],
  grass: [['barrage', 'はっぱのれんぞく', 7], ['bite', 'くさのファング', 11], ['claw', 'つるのクロー', 15], ['cross', 'リーフカッター', 20], ['vortex', 'はっぱのたつまき', 27], ['sweep', 'ねのウェーブ', 31], ['beam', 'ソーラーレーザー', 36], ['rain', 'たねのレイン', 42], ['pillar', 'だいじゅのはしら', 50], ['quake', 'しんりんのノヴァ', 60]],
  wind: [['barrage', 'かぜのれんぞく', 7], ['claw', 'かぜのクロー', 13], ['cross', 'かまいたちカッター', 19], ['sweep', 'ブーメランウェーブ', 23], ['vortex', 'だいたつまき', 28], ['bite', 'かぜのファング', 32], ['beam', 'ウィンドレーザー', 38], ['pillar', 'かぜのはしら', 45], ['rain', 'ぼうふうレイン', 50], ['quake', 'ハリケーンノヴァ', 62]],
  earth: [['barrage', 'いしのれんぞく', 7], ['bite', 'いわのファング', 12], ['claw', 'だいちのクロー', 16], ['cross', 'ロックブレード', 22], ['ram', 'いわのたいあたり', 26], ['sweep', 'すなのウェーブ', 28], ['vortex', 'すなのたつまき', 33], ['rain', 'がんせきレイン', 40], ['pillar', 'だいちのはしら', 46], ['quake', 'だいちのクエイク', 56]],
  thunder: [['barrage', 'でんきのれんぞく', 7], ['bite', 'かみなりファング', 12], ['claw', 'いなずまクロー', 15], ['cross', 'サンダーブレード', 22], ['sweep', 'でんげきウェーブ', 26], ['vortex', 'いかづちのたつまき', 30], ['beam', 'サンダーレーザー', 36], ['pillar', 'らいめいのはしら', 44], ['rain', 'ライトニングレイン', 50], ['quake', 'サンダーノヴァ', 62]],
  heaven: [['barrage', 'きらめきのれんぞく', 7], ['claw', 'ひかりのクロー', 14], ['cross', 'ホーリーブレード', 20], ['sweep', 'あまつのウェーブ', 25], ['vortex', 'きらめきのうず', 29], ['beam', 'きよめのビーム', 34], ['pillar', 'てんしのはしら', 40], ['rain', 'ほしくずレイン', 46], ['bite', 'てんのファング', 52], ['quake', 'てんのノヴァ', 60]],
  dark: [['barrage', 'やみのれんぞく', 7], ['bite', 'やみのファング', 11], ['claw', 'かげのクロー', 14], ['cross', 'シャドウブレード', 21], ['sweep', 'くらやみのウェーブ', 27], ['vortex', 'やみのうず', 30], ['beam', 'ダークレーザー', 36], ['pillar', 'やみのはしら', 44], ['rain', 'くろいレイン', 50], ['quake', 'ダークノヴァ', 62]],
  magic: [['barrage', 'まほうのれんぞく', 7], ['cross', 'マジックブレード', 20], ['sweep', 'ほしくずのウェーブ', 24], ['vortex', 'まほうのうず', 28], ['bite', 'マジックファング', 33], ['beam', 'マジカルレーザー', 35], ['pillar', 'まほうのはしら', 43], ['rain', 'ほしのレイン', 48], ['quake', 'マジカルノヴァ', 60]],
  beast: [['barrage', 'ビーストショット', 7], ['bite', 'ビッグファング', 18], ['claw', 'ひっかきラッシュ', 10], ['cross', 'ワイルドカッター', 22], ['ram', 'ぼうそうとっしん', 26], ['sweep', 'とどろくウェーブ', 30], ['beam', 'ビーストレーザー', 38], ['pillar', 'もうじゅうのはしら', 46], ['rain', 'あれくるうレイン', 50], ['quake', 'ビーストノヴァ', 60]],
  kami: [['barrage', 'きらめきのつぶて', 4], ['claw', 'しんじゅうのクロー', 10], ['cross', 'しんぎのブレード', 16], ['sweep', 'しんせいのウェーブ', 22], ['vortex', 'かみのうず', 28], ['beam', 'しんぱんのレーザー', 34], ['bite', 'かみのファング', 38], ['pillar', 'かみのはしら', 42], ['rain', 'ほしぼしのレイン', 50], ['quake', 'しんせいのノヴァ', 62]],
};
// なまえ: かっこよく、でも なにを する わざか すぐ わかる(カタカナ英語 + にほんご)
const NAMES = {
  fire: { barrage: 'フレイムショット', bite: 'フレイムファング', claw: 'フレイムクロー', sweep: 'ヒートウェーブ', cross: 'フレイムスラッシュ', vortex: 'ファイアストーム', beam: 'フレイムレーザー', pillar: 'フレイムピラー', rain: 'メテオレイン', quake: 'ブレイズノヴァ' },
  water: { barrage: 'バブルショット', bite: 'アクアファング', claw: 'アクアクロー', cross: 'ウォーターカッター', sweep: 'ビッグウェーブ', vortex: 'アクアトルネード', beam: 'ウォータービーム', rain: 'スコールレイン', pillar: 'アクアピラー', quake: 'タイダルノヴァ' },
  grass: { barrage: 'リーフバレット', bite: 'ウッドファング', claw: 'ブランチクロー', cross: 'リーフカッター', vortex: 'リーフトルネード', sweep: 'グリーンウェーブ', beam: 'ソーラーレーザー', rain: 'シードレイン', pillar: 'ウッドピラー', quake: 'フォレストノヴァ' },
  wind: { barrage: 'ウィンドショット', claw: 'ウィンドクロー', cross: 'ウィンドスラッシュ', sweep: 'エアウェーブ', vortex: 'サイクロン', bite: 'ウィンドファング', beam: 'ウィンドレーザー', pillar: 'ウィンドピラー', rain: 'ストームレイン', quake: 'ハリケーンノヴァ' },
  earth: { barrage: 'ロックショット', bite: 'ロックファング', claw: 'アースクロー', cross: 'ロックブレード', ram: 'ロックチャージ', sweep: 'サンドウェーブ', vortex: 'サンドトルネード', rain: 'ロックレイン', pillar: 'アースピラー', quake: 'グランドノヴァ' },
  thunder: { barrage: 'ボルトショット', bite: 'サンダーファング', claw: 'ボルトクロー', cross: 'サンダーブレード', sweep: 'ボルトウェーブ', vortex: 'ライトニングストーム', beam: 'サンダーレーザー', pillar: 'サンダーピラー', rain: 'ライトニングレイン', quake: 'サンダーノヴァ' },
  heaven: { barrage: 'スターショット', claw: 'ヘブンクロー', cross: 'ヘブンブレード', sweep: 'ヘブンウェーブ', vortex: 'ヘブンストーム', beam: 'ヘブンレーザー', pillar: 'ヘブンピラー', rain: 'スターレイン', bite: 'エンジェルファング', quake: 'ヘブンノヴァ' },
  dark: { barrage: 'シャドウバレット', bite: 'シャドウファング', claw: 'シャドウクロー', cross: 'シャドウブレード', sweep: 'ダークウェーブ', vortex: 'ダークストーム', beam: 'ダークレーザー', pillar: 'ダークピラー', rain: 'ダークレイン', quake: 'ダークノヴァ' },
  magic: { barrage: 'マジックショット', cross: 'マジックブレード', sweep: 'ミスティックウェーブ', vortex: 'マジックストーム', bite: 'マジックファング', beam: 'マジカルレーザー', pillar: 'マジックピラー', rain: 'スターダストレイン', quake: 'マジックノヴァ' },
  beast: { barrage: 'ビーストショット', bite: 'ワイルドファング', claw: 'ワイルドクロー', cross: 'ワイルドカッター', ram: 'ビーストチャージ', sweep: 'ビーストウェーブ', beam: 'ビーストレーザー', pillar: 'ビーストピラー', rain: 'ビーストレイン', quake: 'ビーストノヴァ' },
  kami: { barrage: 'ディバインショット', claw: 'ディバインクロー', cross: 'ディバインブレード', sweep: 'ディバインウェーブ', vortex: 'ディバインストーム', beam: 'ディバインレーザー', bite: 'ディバインファング', pillar: 'ディバインピラー', rain: 'ディバインレイン', quake: 'ディバインノヴァ' },
};
for (const [el, list] of Object.entries(LIST)) for (const r of list) r[1] = NAMES[el][r[0]] || r[1];
const DESC = { barrage: 'なんども たたみかけて こうげきする', bite: 'するどい きばで かみつく', claw: 'つめで ひっかく', cross: 'するどく きりさく', pillar: 'そらから はしらを おとす', rain: 'そらから たくさん ふらせる', beam: 'ひかりの すじを はなつ', ram: 'いきおいよく ぶつかる', vortex: 'うずを まいて まきこむ', sweep: 'ひろがる なみで おしながす', quake: 'ちからを はなって あたりを ゆらす' };
// レベル→いりょく(既存のわざの きょくせんに あわせる)
const powerAt = (L) => Math.round(L <= 9 ? 18 + (L - 1) * 1.5 : L <= 13 ? 30 + (L - 9) : L <= 25 ? 34 + (L - 13) * 1.25 : L <= 32 ? 49 + (L - 25) : L <= 44 ? 56 + (L - 32) * 1.5 : L <= 52 ? 74 + (L - 44) : L <= 64 ? 82 + (L - 52) * 1.75 : 103 + (L - 64) * 1.75);
export function installExtraSkills(GD) {
  if (GD._extraSkills) return; GD._extraSkills = true; installSignature(GD);
  if (GD.SKILLS.kami_judgement) GD.SKILLS.kami_judgement.learnLevel = 66;   // しんの ひっさつわざは こうはんで おぼえる
  for (const [el, list] of Object.entries(LIST)) {
    const tr = GD.COMPANION_SKILL_TRACKS[el]; if (!tr) continue;
    for (const [mo, name, L] of list) {
      const id = `n_${el}_${mo}`, power = powerAt(L);
      GD.SKILLS[id] = { id, name, power, uses: power >= 80 ? 5 : power >= 40 ? 10 : 20, learnLevel: L, desc: DESC[mo], element: el };
      let at = tr.length; for (let i = 0; i < tr.length; i++) { const t = GD.SKILLS[tr[i]]; if (t && (t.learnLevel || 1) > L) { at = i; break; } }
      tr.splice(at, 0, id);
    }
  }
}
export const EXTRA_SKILL_LIST = LIST;

// ---- オリジナルわざ(御三家・でんせつ専用。えんしゅつも オリジナル = battle.jsの SIG) ----
// [id, なまえ, ぞくせい, おぼえるLv, いりょくの めやすLv, [つかえる すがた], せつめい]
const SIGS = [
  ['sig_wakaba', 'わかばスピン', 'grass', 8, 8, ['chin_kusa', 'chin_kusa_2', 'chin_kusa_3'], 'くるくる まわって わかばを とばす'],
  ['sig_tempest', 'リーフテンペスト', 'grass', 20, 20, ['chin_kusa_2', 'chin_kusa_3'], 'はっぱの あらしで つつみこむ'],
  ['sig_bloom', 'フォレストブルーム', 'grass', 34, 34, ['chin_kusa_3'], 'おおきな はなを さかせて ひかりで うつ'],
  ['sig_bubble', 'バブルタックル', 'water', 8, 8, ['furebu_mizu', 'furebu_mizu_2', 'furebu_mizu_3'], 'あわを まとって つっこむ'],
  ['sig_crash', 'ウェーブクラッシュ', 'water', 20, 20, ['furebu_mizu_2', 'furebu_mizu_3'], 'おおなみを ぶつける'],
  ['sig_captain', 'キャプテンストーム', 'water', 34, 34, ['furebu_mizu_3'], 'うずまく みずの はしらで のみこむ'],
  ['sig_paw', 'フレイムパウ', 'fire', 8, 8, ['mike_hi', 'mike_hi_2', 'mike_hi_3'], 'ほのおの にくきゅうで ふみつける'],
  ['sig_twintail', 'ツインテールフレア', 'fire', 20, 20, ['mike_hi_2', 'mike_hi_3'], 'ふたつの しっぽから ほのおを はなつ'],
  ['sig_ninetail', 'ナインテイルノヴァ', 'fire', 34, 34, ['mike_hi_3'], 'きゅうほんの ほのおが ひろがって ばくはつする'],
  ['sig_dream', 'ドリームリボン', 'heaven', 1, 30, ['yume_no_ko'], 'ゆめの リボンで まきつけて こうげきする'],
  ['sig_time', 'タイムワープ', 'grass', 1, 45, ['toki_no_yousei'], 'ときを ゆがめて あいてを おそう'],
  ['sig_thunderwing', 'サンダーウィング', 'thunder', 1, 45, ['raigeki_chou'], 'いなずまの つばさで きりさく'],
  ['sig_blazewing', 'ブレイズウィング', 'fire', 1, 50, ['kaen_chou'], 'ほのおの つばさで やきはらう'],
  ['sig_mane', 'ほのおのたてがみ', 'fire', 1, 52, ['homura_shishi'], 'たてがみを もやして つっこむ'],
  ['sig_blizzard', 'ダイヤモンドブリザード', 'water', 1, 55, ['hyosetsu_chou'], 'こおりの けっしょうを ふらせる'],
  ['sig_mist', 'セイントレイン', 'water', 1, 55, ['mizu_kirin'], 'きよらかな あめを ふらせる'],
  ['sig_ocean', 'ディープオーシャン', 'water', 1, 60, ['watatsumi'], 'うみの ちからを ときはなつ'],
  ['sig_fang', 'ライトニングファング', 'thunder', 1, 60, ['kaminari_tora'], 'いなずまを まとった きばで かみつく'],
  ['sig_magma', 'マグマクラッシュ', 'earth', 1, 65, ['magna_kaiju'], 'だいちを われさけて マグマを ふきあげる'],
  ['sig_meteor', 'スターメテオ', 'heaven', 1, 65, ['futago_stella'], 'あかい りゅうせいを ふらせる'],
  ['sig_comet', 'ブルーコメット', 'magic', 1, 65, ['futago_comet'], 'あおい すいせいを ぶつける'],
  ['sig_silver', 'シルバーウィング', 'wind', 1, 70, ['ginyoku'], 'ぎんいろの つばさで なぎはらう'],
  ['sig_dragon', 'スカイドラゴン', 'wind', 1, 70, ['souryu_ten'], 'そらを かける りゅうと なって つらぬく'],
  ['sig_rainbow', 'レインボーフェザー', 'heaven', 1, 75, ['niji_ootori'], 'なないろの はねを まきちらす'],
  ['sig_crystal', 'クリスタルバースト', 'magic', 1, 80, ['maryoku_ou'], 'まりょくの けっしょうを ばくはつさせる'],
];
export const SIG_IDS = SIGS.map(r => r[0]);
export function installSignature(GD) {
  if (GD._sigInstalled) return; GD._sigInstalled = true; GD.SIG_BY_FORM = {};
  for (const [id, name, element, lv, pl, forms, desc] of SIGS) {
    const power = Math.min(125, Math.round(powerAt(pl) * 1.2));
    GD.SKILLS[id] = { id, name, power, uses: power >= 80 ? 5 : 10, learnLevel: lv, desc, element, sig: true };
    for (const f of forms) (GD.SIG_BY_FORM[f] = GD.SIG_BY_FORM[f] || []).push({ id, lv });
  }
}

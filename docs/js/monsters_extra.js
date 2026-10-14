// あとから ふやした モンスター(ちんちらクエストの データに じっこうじ くわえる)。がぞうは quest/assets/monsters/<id>.webp
// きそんモンスターの おなじレベルの へいきんに あわせる ほせい(ひくめだったので ふやす)
const up = (v, k) => Math.round(v * k);
const M = (id, name, element, level, hp0, atk0, def0, spd0, exp, money, evo) => ({ id, name, element, level, hp: up(hp0, 1.3), atk: up(atk0, 1.2), def: up(def0, 1.3), spd: up(spd0, 1.1), exp, money, skillIds: ['tackle'], image: `assets/monsters/${id}.webp`, ...(evo ? (typeof evo[0] === 'string' ? { evolveStone: { el: evo[0], level: evo[2] || 1, id: evo[1] } } : { evolvesTo: { level: evo[0], id: evo[1] } }) : {}) });
// でんせつ: M()の ほせい(HP×1.3 など)を うちけして、かいた かずが そのまま さいしゅうの かずに なるように わる
const LEG = (id, name, el, lv, hp, atk, def, spd) => M(id, name, el, lv, Math.round(hp / 1.3), Math.round(atk / 1.2), Math.round(def / 1.3), Math.round(spd / 1.1), lv * 10, lv * 12);
export const EXTRA_MONS = [
  // かみなり
  M('raimushi', 'ひかりホタル', 'thunder', 3, 24, 8, 4, 9, 15, 10, [11, 'raimushi_2']),
  M('raimushi_2', 'いかづちカブト', 'thunder', 11, 56, 18, 11, 11, 30, 21, ['thunder', 'raimushi_3', 15]),
  M('raimushi_3', 'らいこうカブトキング', 'thunder', 22, 92, 28, 20, 13, 60, 40),   // ホタル→カブト→カブトキング
  M('biriunagi', 'ビリビリうなぎ', 'thunder', 4, 28, 9, 5, 9, 17, 12, [12, 'biriunagi_2']),
  M('biriunagi_2', 'でんじゅうなぎ', 'thunder', 12, 58, 17, 10, 11, 31, 22, ['thunder', 'biriunagi_3', 15]),
  M('biriunagi_3', 'らいりゅうウナギ', 'thunder', 23, 96, 28, 17, 14, 66, 42),
  M('raichou_ko', 'ライチック', 'thunder', 6, 38, 13, 7, 11, 23, 17),
  // まほう
  M('majo_chin', 'まじょっこちんちら', 'magic', 8, 44, 16, 8, 12, 28, 20),
  M('majutsusho', 'まどうしょ', 'magic', 9, 48, 17, 9, 9, 30, 21, ['magic', 'majutsusho_2', 12]),
  M('majutsusho_2', 'だいまどうしょ', 'magic', 21, 92, 30, 16, 12, 62, 42),
  M('lamp_no_sei', 'ランプジーニー', 'magic', 14, 62, 22, 12, 14, 36, 26),
  // かぜ
  M('watage', 'わたぽぽ', 'wind', 3, 24, 8, 4, 11, 15, 10, ['wind', 'watage_2', 8]),
  M('watage_2', 'ダンデリア', 'wind', 14, 62, 21, 12, 16, 36, 26),
  M('tsubame_ko', 'スワロウ', 'wind', 7, 40, 14, 7, 14, 25, 18),
  M('kaze_chou', 'かぜちょう', 'wind', 11, 58, 19, 10, 15, 33, 23),
  // ひかり
  M('kumo_hitsuji', 'クラウドシープ', 'heaven', 5, 36, 10, 8, 8, 20, 14, ['heaven', 'kumo_hitsuji_2', 12]),
  M('kumo_hitsuji_2', 'ひかりひつじ', 'heaven', 20, 100, 26, 18, 12, 55, 38),
  M('tenshi_chin', 'てんしっこちんちら', 'heaven', 9, 48, 16, 9, 12, 29, 21),
  // 2だんめの ついか(御三家いがい)
  M('hono_tanuki', 'ほむらだぬき', 'fire', 6, 38, 13, 7, 10, 23, 17, [16, 'hono_tanuki_2']),
  M('hono_tanuki_2', 'ほむらばけだぬき', 'fire', 16, 70, 22, 13, 12, 38, 27, ['fire', 'hono_tanuki_3', 20]),
  M('hono_tanuki_3', 'ほむらだいだぬき', 'fire', 30, 115, 33, 22, 14, 80, 55),
  M('ringo_ko', 'アップリン', 'grass', 5, 36, 10, 8, 8, 20, 14, ['grass', 'ringo_ko_2', 12]),
  M('ringo_ko_2', 'りんごナイト', 'grass', 18, 85, 24, 17, 11, 48, 33),
  M('dango_mushi', 'ころころだんご', 'earth', 4, 32, 9, 7, 6, 18, 12, ['earth', 'dango_mushi_2', 10]),
  M('dango_mushi_2', 'ごうがんだんご', 'earth', 16, 78, 20, 18, 7, 40, 28),
  M('kitsune_ko', 'こぎつね', 'beast', 6, 38, 12, 7, 12, 23, 17, [20, 'kitsune_ko_2']),
  M('kitsune_ko_2', 'ぎんぎつね', 'beast', 20, 90, 25, 15, 16, 52, 36, ['heaven', 'kitsune_ko_3', 24]),
  M('kitsune_ko_3', 'つきぎつね', 'beast', 32, 120, 35, 22, 19, 90, 60),
  M('denki_neko', 'ぱちぱちネコ', 'thunder', 5, 34, 12, 6, 12, 20, 14, ['thunder', 'denki_neko_2', 10]),
  M('denki_neko_2', 'らいじんネコ', 'thunder', 19, 88, 27, 15, 15, 50, 34),
  M('kagami_ko', 'マジックミラー', 'magic', 10, 50, 17, 9, 11, 30, 21),
  M('fuusen_ko', 'バルーニー', 'wind', 8, 42, 13, 8, 14, 26, 18),
  M('hikari_kame', 'ライトタートル', 'heaven', 12, 62, 15, 14, 7, 32, 22),
  // 御三家(はじめに えらぶ。ほかの ふたつは のこりの ひとつ ぶん めずらしく やせいで でる)
  M('chin_kusa', 'わかばちんちら', 'grass', 5, 40, 11, 9, 11, 20, 14, [16, 'chin_kusa_2']),
  M('chin_kusa_2', 'もりちんちら', 'grass', 16, 76, 20, 16, 13, 40, 28, [32, 'chin_kusa_3']),
  M('chin_kusa_3', 'しんじゅちんちらおう', 'grass', 32, 124, 32, 27, 17, 90, 60),
  M('furebu_mizu', 'しずくフレブル', 'water', 5, 46, 11, 9, 9, 20, 14, [16, 'furebu_mizu_2']),
  M('furebu_mizu_2', 'なみのりフレブル', 'water', 16, 84, 21, 17, 10, 40, 28, [32, 'furebu_mizu_3']),
  M('furebu_mizu_3', 'たいかいフレブルおう', 'water', 32, 136, 34, 27, 14, 90, 60),
  M('mike_hi', 'ひだまりみけ', 'fire', 5, 37, 13, 7, 13, 20, 14, [16, 'mike_hi_2']),
  M('mike_hi_2', 'ほむらみけ', 'fire', 16, 72, 24, 12, 15, 40, 28, [32, 'mike_hi_3']),
  M('mike_hi_3', 'ごうかみけおう', 'fire', 32, 116, 38, 20, 20, 90, 60),
  // 3だんめの ついか(しんかいしで しんかする なかま ふくむ)
  M('kurage_ko', 'ぽよぽよクラゲ', 'water', 7, 40, 11, 8, 9, 24, 16, ['water', 'kurage_ko_2', 12]),
  M('kurage_ko_2', 'ふわりクラゲ', 'water', 20, 80, 22, 14, 13, 46, 31),
  M('houki_ko', 'ブルームキッド', 'magic', 6, 36, 12, 7, 11, 22, 15, ['magic', 'houki_ko_2', 12]),
  M('houki_ko_2', 'まじょほうき', 'magic', 18, 78, 25, 14, 15, 46, 31),
  M('suzu_sei', 'すずようせい', 'magic', 9, 46, 16, 9, 12, 28, 20),
  M('omocha_mahou', 'おもちゃメイジ', 'magic', 13, 60, 19, 11, 10, 33, 24),
  M('denchi_risu', 'でんちリス', 'thunder', 5, 34, 12, 6, 13, 20, 14, ['thunder', 'denchi_risu_2', 10]),
  M('denchi_risu_2', 'らいでんリス', 'thunder', 18, 78, 26, 13, 16, 46, 31),
  M('hoshi_usagi', 'ほしうさぎ', 'heaven', 4, 32, 9, 7, 11, 18, 12, ['heaven', 'hoshi_usagi_2', 12]),
  M('hoshi_usagi_2', 'よぞらうさぎ', 'heaven', 20, 84, 22, 15, 16, 50, 34),
  M('niji_hato', 'にじいろハト', 'heaven', 9, 46, 14, 10, 14, 28, 20),
  M('kantera_bito', 'かんてらびと', 'heaven', 14, 62, 18, 12, 11, 34, 24),
  M('furin_ko', 'チャイムン', 'wind', 6, 36, 11, 8, 12, 22, 15, ['wind', 'furin_ko_2', 12]),
  M('furin_ko_2', 'ふうりんおばけ', 'wind', 20, 84, 22, 15, 17, 50, 34),
  M('tako_ko', 'たこあげこぞう', 'wind', 8, 42, 14, 8, 15, 26, 18),
  M('donguri_robo', 'どんぐりロボ', 'earth', 6, 40, 10, 10, 6, 22, 15, ['earth', 'donguri_robo_2', 14]),
  M('donguri_robo_2', 'どんぐりきょじん', 'earth', 22, 100, 24, 22, 8, 54, 38),
  M('suna_kai', 'すなしんじゅがい', 'earth', 10, 56, 15, 15, 5, 30, 22),
  // 4だんめ: ちょっと かっこいい 枠(3だんかいしんか。つよめ・ゆっくり そだつ)
  M('chibi_ryu', 'ちびりゅう', 'wind', 8, 52, 15, 10, 13, 30, 20, [20, 'sora_ryu']),
  M('sora_ryu', 'あおぞらりゅう', 'wind', 20, 106, 29, 18, 17, 60, 40, [38, 'seikuu_ryuou']),
  M('seikuu_ryuou', 'せいくうりゅうおう', 'wind', 38, 165, 46, 30, 24, 130, 80),
  M('iwagoro', 'いわごろ', 'earth', 8, 58, 14, 14, 6, 30, 20, [20, 'gankou_goro']),
  M('gankou_goro', 'がんこうごろ', 'earth', 20, 118, 28, 25, 9, 60, 40, [38, 'daichi_taishou']),
  M('daichi_taishou', 'だいちたいしょう', 'earth', 38, 190, 44, 42, 12, 130, 80),
  M('mitsugo_hebi', 'みつごしゃへび', 'thunder', 8, 50, 16, 9, 12, 30, 20, [20, 'mitsugo_hydra']),
  M('mitsugo_hydra', 'みつごヒュドラ', 'thunder', 20, 100, 31, 16, 16, 60, 40, [38, 'raimei_hydra']),
  M('raimei_hydra', 'らいめいヒュドラ', 'thunder', 38, 160, 50, 28, 22, 130, 80),
  M('kage_bouzu', 'かげぼうし', 'magic', 8, 48, 16, 9, 11, 30, 20, [20, 'yoru_kage']),
  M('yoru_kage', 'よるかげ', 'magic', 20, 98, 31, 15, 15, 60, 40, [38, 'maboroshi_yomi']),
  M('maboroshi_yomi', 'まぼろしヨミ', 'magic', 38, 158, 50, 26, 22, 130, 80),
  // 4だんめの つづき(けもの・みず・てん・くさ のラインと たんどく)
  M('nebosuke_kyo', 'ねぼすけきょじゅう', 'beast', 8, 60, 12, 12, 5, 30, 20, [20, 'goro_kyojuu']),
  M('goro_kyojuu', 'ごろごろきょじゅう', 'beast', 20, 125, 26, 24, 7, 60, 40, [38, 'daichi_madoromi']),
  M('daichi_madoromi', 'まどろみきょじん', 'beast', 38, 205, 42, 42, 10, 130, 80),
  M('umihebi_ko', 'うみへびっこ', 'water', 8, 50, 14, 9, 12, 30, 20, [20, 'namino_kairyu']),
  M('namino_kairyu', 'なみのりかいりゅう', 'water', 20, 104, 28, 17, 16, 60, 40, [38, 'shinkai_ryujin']),
  M('shinkai_ryujin', 'しんかいりゅう', 'water', 38, 165, 46, 30, 22, 130, 80),
  M('kora_rakko', 'こうらラッコ', 'water', 10, 58, 14, 12, 9, 30, 22),
  M('hikari_kishi', 'ひかりきし', 'heaven', 8, 50, 15, 12, 9, 30, 20, [20, 'sei_kishi']),
  M('sei_kishi', 'せいなるきし', 'heaven', 20, 104, 28, 20, 13, 60, 40, [38, 'tenkuu_shugoshin']),
  M('tenkuu_shugoshin', 'てんくうしゅごしん', 'heaven', 38, 170, 46, 36, 20, 130, 80),
  M('wakagi_shika', 'わかしか', 'grass', 8, 50, 14, 9, 14, 30, 20, [20, 'mori_shika']),
  M('mori_shika', 'もりしか', 'grass', 20, 100, 28, 17, 18, 60, 40, [38, 'shinju_taiboku']),
  M('shinju_taiboku', 'ユグドラ', 'grass', 38, 160, 44, 30, 24, 130, 80),
  M('nari_kami', 'なりかみこぞう', 'thunder', 12, 62, 18, 12, 12, 33, 24),
  // でんせつ(ほこらで であう。ステータスは 「ほせい ごの かず」を わたして M の ほせいを もどす)
  LEG('yume_no_ko', 'ドリーミィ', 'heaven', 30, 200, 36, 26, 36),
  LEG('toki_no_yousei', 'タイムフェアリー', 'grass', 45, 300, 48, 36, 34),
  LEG('raigeki_chou', 'らいげきちょう', 'thunder', 45, 400, 58, 40, 38),
  LEG('kaen_chou', 'かえんちょう', 'fire', 50, 450, 64, 44, 36),
  LEG('homura_shishi', 'フレアレオ', 'fire', 52, 500, 68, 48, 32),
  LEG('hyosetsu_chou', 'ひょうせつちょう', 'water', 55, 520, 66, 54, 32),
  LEG('mizu_kirin', 'すいりん', 'water', 55, 540, 66, 52, 34),
  LEG('watatsumi', 'ワダツミ', 'water', 60, 680, 78, 62, 28),
  LEG('kaminari_tora', 'らいじゅう', 'thunder', 60, 580, 80, 52, 40),
  LEG('magna_kaiju', 'マグナ', 'earth', 65, 720, 88, 70, 24),
  LEG('futago_stella', 'ステラ', 'heaven', 65, 600, 82, 56, 46),
  LEG('futago_comet', 'コメット', 'magic', 65, 600, 82, 56, 46),
  LEG('ginyoku', 'ぎんよく', 'wind', 70, 700, 90, 64, 44),
  LEG('souryu_ten', 'ソウリュウ', 'wind', 70, 680, 92, 60, 48),
  LEG('niji_ootori', 'にじおおとり', 'heaven', 75, 760, 98, 68, 50),
  LEG('maryoku_ou', 'まりょくおう', 'magic', 80, 840, 112, 74, 54),
];
// あらわれる フィールド(ずかんの「でる ばしょ」と フィールドの でやすさ)
export const EXTRA_APPEAR = {
  yume_no_ko: { lake: 1, sun: 1 }, toki_no_yousei: { grove: 1, forest: 1 }, raigeki_chou: { sky: 1 }, kaen_chou: { sun: 1 }, homura_shishi: { sun: 1 }, hyosetsu_chou: { cosmos: 1 }, mizu_kirin: { cosmos: 1 }, watatsumi: { cosmos: 1 },
  kaminari_tora: { grove: 1 }, magna_kaiju: { volcano: 1 }, futago_stella: { sky: 1 }, futago_comet: { sky: 1 }, ginyoku: { lake: 1 }, souryu_ten: { forest: 1 }, niji_ootori: { grove: 1 }, maryoku_ou: { ghost: 1 },
  nebosuke_kyo: { grove: 1, castle: 1 }, goro_kyojuu: { castle: 1, temple: 1 }, daichi_madoromi: { temple: 1, cosmos: 1 }, umihebi_ko: { lake: 2, cosmos: 1 }, namino_kairyu: { lake: 1, cosmos: 1 }, shinkai_ryujin: { cosmos: 1, dragon: 1 }, kora_rakko: { lake: 2 },
  hikari_kishi: { sun: 1, temple: 1 }, sei_kishi: { sun: 1, temple: 1 }, tenkuu_shugoshin: { temple: 1, cosmos: 1 }, wakagi_shika: { forest: 1, grove: 1 }, mori_shika: { grove: 1, forest: 1 }, shinju_taiboku: { grove: 1 }, maboroshi_yomi: { ghost: 1, temple: 1 }, nari_kami: { sky: 1, grove: 1 },
  chibi_ryu: { sky: 1, sun: 1 }, sora_ryu: { sky: 1, dragon: 1 }, seikuu_ryuou: { dragon: 1 }, iwagoro: { volcano: 1, grove: 1 }, gankou_goro: { volcano: 1, castle: 1 }, daichi_taishou: { castle: 1 },
  mitsugo_hebi: { grove: 1, lake: 1 }, mitsugo_hydra: { lake: 1, dragon: 1 }, raimei_hydra: { dragon: 1, cosmos: 1 }, kage_bouzu: { castle: 1, temple: 1, ghost: 1 }, yoru_kage: { ghost: 1, temple: 1 },
  kurage_ko: { lake: 2 }, kurage_ko_2: { lake: 1, cosmos: 1 }, houki_ko: { forest: 1, temple: 1 }, houki_ko_2: { castle: 1, temple: 1 }, suzu_sei: { temple: 1, castle: 1 }, omocha_mahou: { castle: 1, temple: 1 },
  denchi_risu: { forest: 1, sky: 1 }, denchi_risu_2: { grove: 1, dragon: 1 }, hoshi_usagi: { sun: 1, sky: 1 }, hoshi_usagi_2: { sun: 1, cosmos: 1 }, niji_hato: { sky: 1, sun: 1 }, kantera_bito: { temple: 1, cosmos: 1 },
  furin_ko: { sky: 1, forest: 1 }, furin_ko_2: { sky: 1, dragon: 1 }, tako_ko: { sky: 1, forest: 1 }, donguri_robo: { forest: 1, volcano: 1 }, donguri_robo_2: { volcano: 1, grove: 1 }, suna_kai: { forest: 1, grove: 1 },
  chin_kusa: { grove: 1 }, chin_kusa_2: { grove: 1 }, furebu_mizu: { lake: 1 }, furebu_mizu_2: { lake: 1 }, mike_hi: { volcano: 1 }, mike_hi_2: { volcano: 1 },
  hono_tanuki: { forest: 1, volcano: 2 }, hono_tanuki_2: { volcano: 2 }, hono_tanuki_3: { volcano: 1 }, ringo_ko: { forest: 2, grove: 1 }, ringo_ko_2: { grove: 2 }, dango_mushi: { forest: 1, grove: 1 }, dango_mushi_2: { volcano: 1, grove: 1 },
  kitsune_ko: { forest: 1, sun: 1 }, kitsune_ko_2: { sun: 1, sky: 1 }, kitsune_ko_3: { temple: 1 }, denki_neko: { forest: 1, sky: 1 }, denki_neko_2: { grove: 1, dragon: 1 }, kagami_ko: { temple: 1, castle: 1 }, fuusen_ko: { sky: 2, forest: 1 }, hikari_kame: { sun: 1, sky: 1, lake: 1 },
  raimushi: { forest: 2 }, raimushi_2: { grove: 1, volcano: 1 }, raimushi_3: { dragon: 1, volcano: 1 }, biriunagi: { lake: 2 }, biriunagi_2: { lake: 1, grove: 1 }, biriunagi_3: { dragon: 1 }, raichou_ko: { forest: 1, sky: 1 },
  majo_chin: { castle: 1, temple: 1 }, majutsusho: { temple: 1, castle: 1 }, majutsusho_2: { temple: 1, castle: 1 }, lamp_no_sei: { temple: 2, cosmos: 1 },
  watage: { forest: 1, sky: 1 }, watage_2: { grove: 1 }, tsubame_ko: { sky: 1, forest: 1 }, kaze_chou: { sky: 1, grove: 1, dragon: 1 },
  kumo_hitsuji: { sky: 1, sun: 1 }, kumo_hitsuji_2: { temple: 1, sun: 1 }, tenshi_chin: { temple: 1, sun: 1 },
};
export function installExtraMons(GD) {
  if (GD._extraInstalled) return; GD._extraInstalled = true;
  for (const m of EXTRA_MONS) { GD.MONSTERS[m.id] = m; if (Array.isArray(GD.DEX_ORDER) && !GD.DEX_ORDER.includes(m.id)) GD.DEX_ORDER.push(m.id); }
}

// はじめに えらべる 御三家(1だんめ)
export const STARTERS = [
  { id: 'chin_kusa', name: 'わかばちんちら', el: 'くさ', text: 'ふわふわの もりの こ。やさしくて ねばりづよい' },
  { id: 'furebu_mizu', name: 'しずくフレブル', el: 'みず', text: 'むっちり たよれる あばれんぼう。たいりょくが たかい' },
  { id: 'mike_hi', name: 'ひだまりみけ', el: 'ほのお', text: 'すばしっこい ひの ねこ。こうげきと すばやさが たかい' },
];

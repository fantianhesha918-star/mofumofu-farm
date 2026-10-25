// ゲームデータ定義(ロジックから分離。将来Unityへ移すときはScriptableObject/JSONとしてそのまま流用できる形)

// kind: 描画アイコンの形(ui.jsのiconで使用)
export const ITEMS = {
  seed_cabbage:  { name: 'キャベツのたね',   sell: 8,   color: '#9ec06a', kind: 'seed' },
  seed_carrot:   { name: 'にんじんのたね',   sell: 10,  color: '#d9894a', kind: 'seed' },
  seed_pumpkin:  { name: 'かぼちゃのたね',   sell: 14,  color: '#d9a14a', kind: 'seed' },
  seed_tomato:   { name: 'トマトのたね',     sell: 16,  color: '#c95a4a', kind: 'seed' },
  seed_eggplant: { name: 'なすのたね',       sell: 16,  color: '#7a5aa0', kind: 'seed' },
  seed_corn:     { name: 'とうもろこしのたね', sell: 20, color: '#d8c04a', kind: 'seed' },
  cabbage:       { name: 'キャベツ',         sell: 50,  color: '#9ed06a', kind: 'cabbage' },
  carrot:        { name: 'にんじん',         sell: 70,  color: '#f08a2a', kind: 'carrot' },
  pumpkin:       { name: 'かぼちゃ',         sell: 120, color: '#e8861a', kind: 'pumpkin' },
  tomato:        { name: 'トマト',           sell: 90,  color: '#e24a3a', kind: 'tomato' },
  eggplant:      { name: 'なす',             sell: 100, color: '#6a3a8a', kind: 'eggplant' },
  corn:          { name: 'とうもろこし',     sell: 150, color: '#f0d04a', kind: 'corn' },
  dandelion:     { name: 'タンポポ',         sell: 8,   color: '#f4f1e6', kind: 'puff' },
  legend_dande:  { name: 'でんせつのタンポポ', sell: 300, color: '#ffd96a', kind: 'puff' },
  berry:         { name: 'きいちご',         sell: 18,  color: '#d8344a', kind: 'berry' },
  mushroom:      { name: 'きのこ',           sell: 22,  color: '#b5704a', kind: 'mushroom' },
  acorn:         { name: 'どんぐり',         sell: 10,  color: '#a8743a', kind: 'acorn' },
  hay:           { name: 'ほしくさ',         sell: 6,   color: '#e2c25a', kind: 'hay' },
  fluff:         { name: 'ふわふわの毛',     sell: 60,  color: '#d9dbe0', kind: 'puff' },
  milk:          { name: 'ぎゅうにゅう',     sell: 110, color: '#f6f4ee', kind: 'milk' },
  egg:           { name: 'たまご',           sell: 45,  color: '#f2dfc0', kind: 'egg' },
  golden_egg:    { name: 'きんのたまご',     sell: 400, color: '#ffd24a', kind: 'egg' },
  milk_can:      { name: 'ミルクかん(ブリキ缶)', sell: 0, color: '#b8c0c8', kind: 'can', tool: true },
  chicken_feed:  { name: 'とりのえさ',       sell: 0,   color: '#d8b860', kind: 'grain', noSell: true },
  seashell:      { name: 'かいがら',         sell: 38,  color: '#f2d0c0', kind: 'shell' },
  conch:         { name: 'ほらがい',         sell: 160, color: '#f0b8a0', kind: 'shell' },
  seaweed:       { name: 'かいそう',         sell: 30,  color: '#4a7a3a', kind: 'seaweed' },
  nori:          { name: 'のり',             sell: 110, color: '#24382c', kind: 'nori' },
  nori_spore:    { name: 'のりのたね',       sell: 0,   color: '#3a5a40', kind: 'seed', noSell: true },
  nakama_ball:   { name: 'チモシーボール',           sell: 0, color: '#e8b04a', kind: 'ball', noSell: true, ball: { mult: 1.0, anim: 'ball', icon: 'icon_ball_timothy' } },
  super_ball:    { name: 'スーパーチモシーボール',   sell: 0, color: '#6ab0e8', kind: 'ball', noSell: true, ball: { mult: 1.5, anim: 'super_ball', icon: 'icon_ball_super' } },
  hyper_ball:    { name: 'ハイパーチモシーボール',   sell: 0, color: '#b86ae8', kind: 'ball', noSell: true, ball: { mult: 2.0, anim: 'hyper_ball', icon: 'icon_ball_hyper' } },
  master_ball:   { name: 'マスターチモシーボール',   sell: 0, color: '#e86a6a', kind: 'ball', noSell: true, ball: { mult: Infinity, anim: 'master_ball', icon: 'icon_ball_master' } },
  fishing_rod:   { name: 'つりざお',         sell: 0,   color: '#a8743a', kind: 'rod', tool: true },
  sickle:        { name: 'かま',             sell: 0,   color: '#b8c0c8', kind: 'sickle', tool: true },
  hoe:           { name: 'くわ',             sell: 0,   color: '#a8743a', kind: 'hoe', tool: true },
  bucket:        { name: 'バケツ',           sell: 0,   color: '#9aa8b4', kind: 'bucket', tool: true },
  kit_well:      { name: 'いどの キット',     sell: 0,   color: '#8a8a82', kind: 'kit', noSell: true },
  kit_barn:      { name: 'ぎゅうしゃの キット', sell: 0,  color: '#b0603a', kind: 'kit', noSell: true },
  kit_coop:      { name: 'とりごやの キット', sell: 0,   color: '#d8a860', kind: 'kit', noSell: true },
  casino_deed:   { name: 'カジノの けんりしょ', sell: 0, color: '#c0283c', kind: 'kit', noSell: true },
  fence:         { name: '木の さく',         sell: 0,   color: '#a8743a', kind: 'fence', noSell: true, tool: true },
  hay_roll:      { name: 'ほしくさロール',   sell: 0,   color: '#e2c25a', kind: 'hay', noSell: true, tool: true },
  paver:         { name: 'いしだたみ',       sell: 0,   color: '#b5ada0', kind: 'paver', noSell: true, tool: true },
  feeder:        { name: 'えさばこ',         sell: 0,   color: '#a8743a', kind: 'feeder', noSell: true, tool: true },
  a_cow:         { name: 'うし',             sell: 0,   color: '#f2eee6', kind: 'animal', noSell: true, tool: true },
  a_hen:         { name: 'ニワトリ',         sell: 0,   color: '#f4ead2', kind: 'animal', noSell: true, tool: true },
  a_chin:        { name: 'チンチラ',         sell: 0,   color: '#bdb8b0', kind: 'animal', noSell: true, tool: true },
  iwashi:        { name: 'いわし',           sell: 48,  color: '#9ab4c8', kind: 'fish' },
  aji:           { name: 'あじ',             sell: 75,  color: '#a8b8a0', kind: 'fish' },
  saba:          { name: 'さば',             sell: 110, color: '#5a8ab0', kind: 'fish' },
  karei:         { name: 'かれい',           sell: 160, color: '#b8a088', kind: 'fish' },
  ika:           { name: 'いか',             sell: 190, color: '#f0e4e0', kind: 'fish' },
  tai:           { name: 'たい',             sell: 280, color: '#e87a70', kind: 'fish' },
  tako:          { name: 'たこ',             sell: 240, color: '#c8605a', kind: 'fish' },
  fugu:          { name: 'ふぐ',             sell: 340, color: '#d8c890', kind: 'fish' },
  ayu:           { name: 'あゆ',             sell: 90,  color: '#b8c890', kind: 'fish' },
  funa:          { name: 'ふな',             sell: 60,  color: '#9a9a78', kind: 'fish' },
  nijimasu:      { name: 'にじます',         sell: 170, color: '#d8a8b8', kind: 'fish' },
  iwana:         { name: 'いわな',           sell: 230, color: '#a89870', kind: 'fish' },
  unagi:         { name: 'うなぎ',           sell: 320, color: '#5a5a50', kind: 'fish' },
  koi:           { name: 'こい',             sell: 380, color: '#e8905a', kind: 'fish' },
  grilled_fish:  { name: 'やきざかな',       sell: 190, color: '#d89a50', kind: 'plate' },
  fish_soup:     { name: 'さかなのスープ',   sell: 260, color: '#e8b060', kind: 'bowl' },
  squid_grill:   { name: 'いかのやきもの',   sell: 350, color: '#e8c0a0', kind: 'plate' },
  tai_shio:      { name: 'たいのしおやき',   sell: 520, color: '#e89080', kind: 'plate' },
  octo_marinade: { name: 'たこのマリネ',     sell: 460, color: '#d86a58', kind: 'plate' },
  nori_roll:     { name: 'のりまき',         sell: 360, color: '#3a5040', kind: 'plate' },
  seaweed_soup:  { name: 'かいそうスープ',   sell: 190, color: '#7a9a60', kind: 'bowl' },
  shell_butter:  { name: 'かいのバターやき', sell: 280, color: '#f0c898', kind: 'plate' },
  boiled_egg:    { name: 'ゆでたまご',       sell: 80,  color: '#fff3d8', kind: 'egg' },
  jam:           { name: 'きいちごジャム',   sell: 130, color: '#c0304a', kind: 'jar' },
  grilled_corn:  { name: 'やきとうもろこし', sell: 230, color: '#f0c040', kind: 'corn' },
  veg_soup:      { name: 'やさいスープ',     sell: 210, color: '#e8a050', kind: 'bowl' },
  omelet:        { name: 'トマトオムレツ',   sell: 290, color: '#f4c84a', kind: 'plate' },
  corn_soup:     { name: 'コーンスープ',     sell: 360, color: '#f4d870', kind: 'bowl' },
  ratatouille:   { name: 'ラタトゥイユ',     sell: 340, color: '#c8603a', kind: 'bowl' },
  pumpkin_stew:  { name: 'かぼちゃのシチュー', sell: 420, color: '#e89030', kind: 'bowl' },
  golden_omelet: { name: 'きんのオムレツ',   sell: 950, color: '#ffd24a', kind: 'plate' },
};

// days: 水やりを何日続けると収穫できるか(1日1回。あげ忘れた日は育たない)
// model: assets/<model>_lite.glb の作物の列(Meshy製) / yield: 収穫数 / price: たねの値段
export const CROPS = {
  seed_cabbage:  { name: 'キャベツ',   item: 'cabbage',  days: 3, model: 'crop_cabbage',  yield: [1, 2], price: 20 },
  seed_carrot:   { name: 'にんじん',   item: 'carrot',   days: 4, model: 'crop_carrot',   yield: [2, 3], price: 25 },
  seed_pumpkin:  { name: 'かぼちゃ',   item: 'pumpkin',  days: 5, model: 'crop_pumpkin',  yield: [1, 2], price: 35 },
  seed_tomato:   { name: 'トマト',     item: 'tomato',   days: 5, model: 'crop_tomato',   yield: [2, 3], price: 40 },
  seed_eggplant: { name: 'なす',       item: 'eggplant', days: 5, model: 'crop_eggplant', yield: [2, 3], price: 40 },
  seed_corn:     { name: 'とうもろこし', item: 'corn',   days: 6, model: 'crop_corn',     yield: [2, 4], price: 50 },
};
// りょうり: 材料(アイテムid: 数)→ できあがり。台所(暖炉)で作る。作物や牛乳・卵をそのまま売るより高く売れる
export const RECIPES = [
  { id: 'boiled_egg',    need: { egg: 1 } },
  { id: 'jam',           need: { berry: 3 } },
  { id: 'grilled_corn',  need: { corn: 1 } },
  { id: 'veg_soup',      need: { cabbage: 1, carrot: 1 } },
  { id: 'omelet',        need: { egg: 2, tomato: 1 } },
  { id: 'corn_soup',     need: { corn: 1, milk: 1 } },
  { id: 'ratatouille',   need: { eggplant: 1, tomato: 1, pumpkin: 1 } },
  { id: 'pumpkin_stew',  need: { pumpkin: 1, milk: 1 } },
  { id: 'golden_omelet', need: { golden_egg: 1, milk: 1 } },
  { id: 'seaweed_soup',  need: { seaweed: 2, egg: 1 } },
  { id: 'grilled_fish',  need: { aji: 1 } },
  { id: 'fish_soup',     need: { iwashi: 2, cabbage: 1 } },
  { id: 'shell_butter',  need: { seashell: 2, milk: 1 } },
  { id: 'nori_roll',     need: { nori: 2, egg: 1 } },
  { id: 'squid_grill',   need: { ika: 1 } },
  { id: 'octo_marinade', need: { tako: 1, tomato: 1 } },
  { id: 'tai_shio',      need: { tai: 1 } },
];
// たべると たいりょくが かいふくする量(0〜100)
// ボスを たおすと もらえる バッジ(key = state.boss のキー)。もっていると ずっと おんけい
export const BADGES = [
  { id: 'forest', name: 'もりの バッジ', boss: 'もりの ぬし', color: '#4a9a40', bonus: 'バトルの けいけんちが +15%', sym: 'M24 11c-6 4-7 10-3 15 5-1 9-6 3-15zM24 27V15' },
  { id: 'lake', name: 'みずうみの バッジ', boss: 'みずうみの ぬし', color: '#3a78c0', bonus: 'ものを うる ねだんが +10%(しゅっかも)', sym: 'M24 10c-4 6-6 8-6 11a6 6 0 0 0 12 0c0-3-2-5-6-11z' },
  { id: 'volcano', name: 'ようがんの バッジ', boss: 'ようがんの ぬし', color: '#c8502a', bonus: 'なかまの ステータスが ぜんぶ +5%', sym: 'M13 29l7-12 4 6 3-4 7 10z' },
  { id: 'ghost', name: 'ゆうれいの バッジ', boss: 'ゆうれいの ぬし', color: '#6a4a9a', bonus: 'バトルで もらえる コインが +25%', sym: 'M15 31V20a9 9 0 0 1 18 0v11l-3-3-3 3-3-3-3 3-3-3z' },
  { id: 'sky', name: 'てんくうの バッジ', boss: 'てんくうの ぬし', color: '#d8b040', bonus: 'バトルの けいけんちが さらに +15%', sym: 'M24 10l4 9 9 1-7 6 2 9-8-5-8 5 2-9-7-6 9-1z' },
  { id: 'sun', name: 'たいようの バッジ', boss: 'たいようの ぬし', color: '#e0a030', bonus: 'なかまの こうげきが +8%', sym: 'M24 12v4M24 32v4M12 24h4M32 24h4M15 15l3 3M30 30l3 3M33 15l-3 3M18 30l-3 3M24 19a5 5 0 1 0 0 10 5 5 0 0 0 0-10z' },
  { id: 'cosmos', name: 'うちゅうの バッジ', boss: 'うちゅうの ぬし', color: '#3a58b0', bonus: 'なかまの HPが +8%', sym: 'M24 10c-4 6-6 8-6 11a6 6 0 0 0 12 0c0-3-2-5-6-11zM14 32q10 6 20 0' },
  { id: 'grove', name: 'しんじゅの バッジ', boss: 'しんじゅの ぬし', color: '#4a9a60', bonus: 'おやつ・たべものの かいふくが ×1.5', sym: 'M24 36V16M24 22c-6 0-9-4-9-8 6 0 9 3 9 8zM24 26c6 0 9-4 9-8-6 0-9 3-9 8z' },
  { id: 'castle', name: 'やみの バッジ', boss: 'やみの ぬし', color: '#5a3a80', bonus: 'なかまの ぼうぎょが +8%', sym: 'M12 34V18l4 3 4-5 4 5 4-5 4 5 4-3v16z' },
  { id: 'temple', name: 'ほしの バッジ', boss: 'ほしの ぬし', color: '#8a7ad0', bonus: 'なかまの すばやさが +8%', sym: 'M24 10l3 8 8 1-6 6 2 8-7-4-7 4 2-8-6-6 8-1z' },
  { id: 'dragon', name: 'せいりゅうの バッジ', boss: 'せいりゅうの ぬし', color: '#2a9a8a', bonus: 'バトルの けいけんちが さらに +15%', sym: 'M14 30c4-14 14-2 18-12M32 18l4 1-2 3M14 30l-3 3' },
  { id: 'end', name: 'うちゅうの かみの バッジ', boss: 'うちゅうの かみ', color: '#d8b8f0', bonus: 'なかまの ステータスが ぜんぶ +10%', sym: 'M24 12a12 12 0 1 0 0 24 12 12 0 0 0 0-24zM24 18v12M18 24h12' },
];
export const HEAL = { grilled_fish: 50, fish_soup: 55, squid_grill: 65, tai_shio: 80, octo_marinade: 75, nori_roll: 60, seaweed_soup: 40, shell_butter: 55, boiled_egg: 25, jam: 20, grilled_corn: 40, veg_soup: 45, omelet: 60, corn_soup: 70, ratatouille: 70, pumpkin_stew: 90, golden_omelet: 100 };

// 家の もようがえ(かべがみ・ゆか)。n = assets/interior/wall_n.jpg / floor_n.jpg
export const DECOR = {
  wall:  [{ n: 1, name: 'はなの かべがみ', price: 0 }, { n: 2, name: 'あおいろの かべがみ', price: 200 }, { n: 3, name: 'みどりの かべがみ', price: 300 }, { n: 4, name: 'いたばりの かべ', price: 150 }],
  floor: [{ n: 3, name: 'あかちゃの ゆか', price: 0 }, { n: 5, name: 'こいちゃの ゆか', price: 150 }, { n: 4, name: 'しろきの ゆか', price: 250 }, { n: 2, name: 'はいいろの ゆか', price: 250 }, { n: 1, name: 'くろい ゆか', price: 300 }],
};
export const SHOP_SEEDS = Object.keys(CROPS);

// stat: state.stats のキー。到達数 n で達成。先頭から順に解放される(だんだん できることが ふえるチュートリアル)
export const QUESTS = [
  { id: 'q_gather',  title: 'まずは あつめてみよう', desc: '野原の タンポポや きのこ、きいちご、どんぐりを 5つ ひろおう。ひろったものは よろずやで 売れるよ。',
    stat: 'gather', n: 5, target: 'meadow', reward: { coins: 20 } },
  { id: 'q_mush',    title: 'きのこを とろう',     desc: '森の ちかくで きのこを 2つ とろう。',
    stat: 'mushroom', n: 2, target: 'meadow', reward: { coins: 15 } },
  { id: 'q_sell',    title: 'よろずやで うろう',   desc: 'あつめたものを よろずやで 40コインぶん 売ろう。',
    stat: 'earned', n: 40, target: 'shop', reward: { coins: 25 } },
  { id: 'q_sickle',  title: 'かまを かおう',       desc: 'よろずやで かま(60コイン)を かおう。足りなければ、もっと ひろって 売ろう。',
    stat: 'buy_sickle', n: 1, target: 'shop', reward: { coins: 15 } },
  { id: 'q_cut',     title: '草を かろう',         desc: '画面左の ツールボックスで「かま」を えらぶと、前に 四角い わくが 出るよ。「くさを かる」で はたけの ばしょを つくろう。',
    stat: 'cut', n: 1, target: 'meadow', reward: { coins: 30 } },
  { id: 'q_hoe',     title: 'くわを かおう',       desc: 'よろずやで くわ(90コイン)を かおう。',
    stat: 'buy_hoe', n: 1, target: 'shop', reward: { coins: 15 } },
  { id: 'q_till',    title: 'はたけを たがやそう', desc: '草を かった ばしょで、くわで 土を たがやそう。',
    stat: 'till', n: 1, target: 'field', reward: { coins: 30 } },
  { id: 'q_plant',   title: 'はじめての たね',     desc: 'たねやで たねを かって、たがやした はたけに まこう。',
    stat: 'plant', n: 1, target: 'field', reward: { coins: 30 } },
  { id: 'q_bucket',  title: 'バケツを かおう',     desc: 'よろずやで バケツ(40コイン)を かおう。みずを くむのに ひつようだよ。',
    stat: 'buy_bucket', n: 1, target: 'shop', reward: { coins: 15 } },
  { id: 'q_water',   title: 'みずを くんで やろう', desc: 'バケツで 川の水を くんで(川の岸)、はたけに みずを やろう。バケツは 3かいぶん くめるよ。',
    stat: 'water', n: 1, target: 'field', reward: { coins: 30 } },
  { id: 'q_harvest', title: 'はたけを そだてよう', desc: '水を まいにち やって、作物を 3つ しゅうかくしよう。水やりは 1日1回だよ。',
    stat: 'harvest', n: 3, target: 'field', reward: { coins: 80, items: { seed_carrot: 3 } } },
  { id: 'q_well',    title: 'いどを つくろう',     desc: 'よろずやで いどの キット(300コイン)を かって、すきな ばしょに いどを つくろう。川まで いかなくても 水が くめるよ。',
    stat: 'well', n: 1, target: 'shop', reward: { coins: 60 } },
  { id: 'q_barn',    title: 'ぼくじょうを つくろう', desc: 'よろずやで ぎゅうしゃの キット(300コイン)を かって(300コイン)、広い あき地に たてよう。',
    stat: 'barn', n: 1, target: 'shop', reward: { coins: 100 } },
  { id: 'q_cow',     title: 'うしを かおう',       desc: 'よろずやで うし(200コイン)を かおう。ぼくじょうに やってくるよ。',
    stat: 'buy_a_cow', n: 1, target: 'shop', reward: { coins: 60 } },
  { id: 'q_chin',    title: 'ペットを むかえよう', desc: 'よろずやで チンチラ(300コイン)を かおう。いえの なかで いっしょに くらすよ。',
    stat: 'buy_a_chin', n: 1, target: 'shop', reward: { coins: 60 } },
  { id: 'q_feed',    title: 'なかよしチンチラ',   desc: 'いえの チンチラに、ほしくさを 3回 あげよう。ほしくさは 草を かると とれるよ。',
    stat: 'feed', n: 3, target: 'house', reward: { coins: 100 } },
  { id: 'q_milk',    title: 'しぼりたてミルク',   desc: 'よろずやで ミルクかん(ブリキ缶)を かおう。牛に ほしくさを あげて、近づいて タップして ぎゅうにゅうを 2本 しぼろう。',
    stat: 'milk', n: 2, target: 'cows', reward: { coins: 150 } },
  { id: 'q_coop',    title: 'とりごやを たてよう', desc: 'よろずやで とりごやの キット(300コイン)を かって、すきな ばしょに たてよう。',
    stat: 'coop', n: 1, target: 'shop', reward: { coins: 100 } },
  { id: 'q_hen',     title: 'ニワトリを かおう',   desc: 'よろずやで ニワトリ(100コイン)を かおう。とりごやに やってくるよ。',
    stat: 'buy_a_hen', n: 1, target: 'shop', reward: { coins: 40 } },
  { id: 'q_egg',     title: 'たまご あつめ',      desc: 'たねやで とりのえさを かって、鶏小屋の 中の ニワトリに あげよう。つぎの あさ、巣に たまごが うまれているよ。3こ ひろおう。',
    stat: 'egg', n: 3, target: 'coop', reward: { coins: 150, items: { seed_pumpkin: 2 } } },
  { id: 'q_fluff',   title: 'ふわふわコレクション', desc: 'ごきげんなチンチラがくれる「ふわふわの毛」を 3つ あつめよう。',
    stat: 'fluff', n: 3, target: 'house', reward: { coins: 200, items: { seed_tomato: 3 } } },
  { id: 'q_cook',    title: 'はじめての りょうり', desc: 'いえの なかの 暖炉で、たまごや やさいを つかって りょうりを 1つ つくろう。',
    stat: 'cook', n: 1, target: 'house', reward: { coins: 200 } },
  { id: 'q_shell',   title: 'うみべの たからもの', desc: '南東の 浜に ついて、かいがらや ほらがいを 5こ ひろおう。かいそうも おちているよ。',
    stat: 'shell', n: 5, target: 'sea', reward: { coins: 120 } },
  { id: 'q_fish',    title: 'はじめての つり',     desc: 'よろずやで つりざおを かって、浜の 桟橋の さきや 川で さかなを 3ひき つろう。',
    stat: 'fish', n: 3, target: 'pier', reward: { coins: 250 } },
  { id: 'q_nori',    title: 'のりの ようしょく',   desc: 'たねやで のりのたねを かって、桟橋ぞいの のりあみに つけよう。3日たったら のりを 2まい とろう。',
    stat: 'nori', n: 2, target: 'pier', reward: { coins: 300 } },
  { id: 'q_legend',  title: 'でんせつのタンポポ', desc: 'みなみの草原のどこかに、金色にかがやくタンポポがさくといいます。さがしてみよう。',
    stat: 'legend', n: 1, target: 'meadow', reward: { coins: 300 } },
  { id: 'q_shop',    title: 'まちの 人気もの',     desc: 'これまでに、よろずやで 合計 2000コインぶん 売ろう。',
    stat: 'earned', n: 2000, target: 'shop', reward: { coins: 500 } },
];

// おみせの 品ぞろえ(たね以外)。unique=1つだけ買えるどうぐ
export const SHOP_GOODS = {
  yorozu: [{ id: 'sickle', price: 60, unique: true, desc: '草を かれる。かった ばしょを くわで たがやすと はたけに なるよ' }, { id: 'hoe', price: 90, unique: true, desc: 'かった ばしょを たがやして はたけに する' }, { id: 'bucket', price: 40, unique: true, desc: 'かわや いどの 水を くんで はこべる' }, { id: 'hay', price: 10, packs: [1, 10], unit: 'こ', desc: 'ほしくさ。ちんちらや うしの えさに なるよ' }, { id: 'paver', price: 8, packs: [1, 10, 50], unit: 'こ', desc: 'みちを つくる いしだたみ。さくモードで ならべるよ' }, { id: 'feeder', price: 120, packs: [1], unit: 'こ', desc: 'ほしくさを いれておくと ぼくじょうの うしが じぶんで たべるよ(さくモードで おく)' }, { id: 'hay_roll', price: 80, packs: [1], unit: 'こ', desc: 'かざりの ほしくさロール。さくモードで すきな ばしょに おけるよ' }, { id: 'fence', price: 15, packs: [1, 10], desc: '1ほん 15コイン。すきな ばしょに ならべて はたけを かこめるよ' }, { id: 'kit_well', price: 300, desc: 'すきな ばしょに いどを つくれる' }, { id: 'kit_barn', price: 300, desc: 'ぎゅうしゃと ぼくじょう。1つに うし3とう。なんこでも たてられる(ふえるほど ねだんが あがる)' }, { id: 'casino_deed', price: 3000, unique: true, desc: 'むらの なかほどに カジノが たつよ。ディーラーと トランプや オセロで あそんで コインが もらえる(かけごとは しないよ)' }, { id: 'kit_coop', price: 300, desc: 'とりごや。1つに ニワトリ6わ。なんこでも たてられる(ふえるほど ねだんが あがる)' }, { id: 'a_cow', price: 200, animal: 'cow', desc: 'ぼくじょうで そだてる。まいにち ぎゅうにゅうが しぼれる(ふえるほど ねだんが あがる)' }, { id: 'a_hen', price: 100, animal: 'hen', desc: 'とりごやで そだてる。たまごを うむ(ふえるほど ねだんが あがる)' }, { id: 'a_chin', price: 300, animal: 'chin', desc: 'ペット。いえの なかで いっしょに くらせる(さいだい3ひき)' }, { id: 'nakama_ball', price: 80, packs: [1, 5], unit: 'こ', desc: 'そとの やせいモンスターに なげて なかまに する。せいこうりつ ×1.0' }, { id: 'super_ball', price: 200, packs: [1, 5], unit: 'こ', desc: 'せいこうりつ ×1.5。ちょっと つよい ボール' }, { id: 'hyper_ball', price: 450, packs: [1, 5], unit: 'こ', desc: 'せいこうりつ ×2.0。つよい モンスターにも ききやすい' }, { id: 'master_ball', price: 10000, packs: [1], unit: 'こ', desc: 'かならず なかまに なる とっておきの ボール' }, { id: 'evo_fire', price: 150, packs: [1], unit: 'こ', desc: 'まめちんちらや、いし しんかする なかまに つかうと ほのおぞくせいに しんかする' }, { id: 'evo_water', price: 150, packs: [1], unit: 'こ', desc: 'まめちんちらや、いし しんかする なかまに つかうと みずぞくせいに しんかする' }, { id: 'evo_grass', price: 150, packs: [1], unit: 'こ', desc: 'まめちんちらや、いし しんかする なかまに つかうと くさぞくせいに しんかする' }, { id: 'evo_wind', price: 150, packs: [1], unit: 'こ', desc: 'まめちんちらや、いし しんかする なかまに つかうと かぜぞくせいに しんかする' }, { id: 'evo_earth', price: 150, packs: [1], unit: 'こ', desc: 'まめちんちらや、いし しんかする なかまに つかうと だいちぞくせいに しんかする' }, { id: 'evo_thunder', price: 150, packs: [1], unit: 'こ', desc: 'まめちんちらや、いし しんかする なかまに つかうと かみなりぞくせいに しんかする' }, { id: 'evo_heaven', price: 150, packs: [1], unit: 'こ', desc: 'まめちんちらや、いし しんかする なかまに つかうと てんぞくせいに しんかする' }, { id: 'evo_dark', price: 150, packs: [1], unit: 'こ', desc: 'まめちんちらや、いし しんかする なかまに つかうと やみぞくせいに しんかする' }, { id: 'evo_magic', price: 150, packs: [1], unit: 'こ', desc: 'まめちんちらや、いし しんかする なかまに つかうと まほうぞくせいに しんかする' }, { id: 'cure_all', price: 60, packs: [1, 5], unit: 'こ', desc: 'バトルで つかう。じょうたいいじょうを なおす' }, { id: 'tonic_atk', price: 100, packs: [1, 5], unit: 'こ', desc: 'バトルで つかう。こうげきが あがる' }, { id: 'tonic_def', price: 100, packs: [1, 5], unit: 'こ', desc: 'バトルで つかう。ぼうぎょが あがる' }, { id: 'tonic_spd', price: 100, packs: [1, 5], unit: 'こ', desc: 'バトルで つかう。すばやさが あがる' }, { id: 'pp_ether', price: 150, packs: [1, 5], unit: 'こ', desc: 'バトルで つかう。わざの PPが 10かいふく(ベッドで ねても ぜんかいふく)' }, { id: 'hold_regen', price: 400, packs: [1], unit: 'こ', desc: 'なかまに もたせる。バトルで まいターン HPが すこし かいふくする' }, { id: 'hold_exp', price: 900, packs: [1], unit: 'こ', desc: 'なかまに もたせる。もらえる けいけんちが 20%ふえる' }, { id: 'hay', price: 15, desc: '牛や チンチラの ごはん' }, { id: 'fishing_rod', price: 250, unique: true, desc: '浜の桟橋の先で つりが できるよ' }, { id: 'milk_can', price: 400, unique: true, desc: 'これが ないと 牛乳は しぼれないよ' }],
  tane: [{ id: 'nori_spore', price: 30, desc: '桟橋のそばの のりあみに つけると、3日で のりが とれる' }, { id: 'chicken_feed', price: 12, desc: 'ニワトリ1羽の 1日ぶんの ごはん。あげた つぎの あさ たまごが うまれる' }],
};

// ゲーム内1日(24時間)の実時間(秒)
export const DAY_SECONDS = 1800;   // 1日の ながさ(秒): 30ふん

// 家具カタログ(家の中)。model=assets/<model>_lite.glb / scale か fit(最長辺をこの長さに)で大きさ / box=ぶつかり判定(回す前の幅×奥行)
export const FURNI = {
  table_stools: { name: 'テーブルセット', model: 'table_stools', scale: 1.4, box: [2.6, 1.7], price: 350 },
  hutch: { name: 'しょっきだな', model: 'hutch', scale: 1.35, box: [1.9, 0.9], price: 220 },
  workbench: { name: 'さぎょうだい', model: 'workbench', scale: 1.2, box: [2.3, 1.5], price: 280 },
  storage: { name: 'ものいれ', model: 'storage', fit: 1.5, price: 300 },
  kitchen_counter: { name: 'キッチンカウンター', model: 'kitchen_counter', fit: 2.6, price: 480 },
};

// にわの かざり(村のどこにでも置ける。見た目の飾り)。fit=いちばん長い辺をこの長さに
export const DECO = {
  lantern: { name: 'がいとう', model: 'lantern', fit: 3.2, r: 0.3, price: 120 },
  wagon: { name: 'にぐるま', model: 'wagon', fit: 3.4, r: 1.3, price: 300 },
  fence: { name: 'さく', model: 'fence', fit: 3.4, r: 1.3, price: 80 },
  well: { name: 'いど', model: 'well', fit: 2.6, r: 1.0, price: 400 },
  tools: { name: 'どうぐおき', model: 'tools', fit: 1.6, r: 0.6, price: 150 },
  milk_cans: { name: 'ミルクかん', model: 'milk_cans', fit: 1.3, r: 0.5, price: 100 },
  driftwood: { name: 'ながれぎ', model: 'driftwood', fit: 2.6, r: 0.9, price: 60 },
  campfire: { name: 'たきび', model: 'campfire', fit: 1.8, r: 0.9, price: 200, desc: 'よるに あかるく もえる(がいとうより あかるい)' },
  flowerbed: { name: 'はなだん', model: 'flowerbed', fit: 2.2, r: 1.0, price: 120, desc: 'まいあさ 1こにつき 8コイン(さいだい 8こ)' },
  bench: { name: 'ベンチ', model: 'bench', fit: 2.0, r: 0.9, price: 150, desc: 'ちかづいて ひとやすみ すると スタミナが ぜんかいふく' },
  scarecrow: { name: 'かかし', model: 'scarecrow', fit: 2.6, r: 0.5, price: 250, desc: 'はたけの さくもつが ときどき 1日 はやく そだつ(おくほど ふえる)' },
};

// ずかん(はじめて手に入れたものが のる)
export const DEX = [
  { title: 'さかな', ids: ['iwashi', 'aji', 'saba', 'karei', 'ika', 'tai', 'tako', 'fugu'] },
  { title: 'かわの さかな', ids: ['ayu', 'funa', 'nijimasu', 'iwana', 'unagi', 'koi'] },
  { title: 'うみの めぐみ', ids: ['seashell', 'conch', 'seaweed', 'nori'] },
  { title: 'やさい', ids: ['cabbage', 'carrot', 'pumpkin', 'tomato', 'eggplant', 'corn'] },
  { title: 'みつけもの', ids: ['dandelion', 'legend_dande', 'berry', 'mushroom', 'acorn', 'fluff', 'hay'] },
  { title: 'ぼくじょうの めぐみ', ids: ['milk', 'egg', 'golden_egg'] },
  { title: 'りょうり', ids: ['grilled_fish', 'fish_soup', 'squid_grill', 'tai_shio', 'octo_marinade', 'nori_roll', 'seaweed_soup', 'shell_butter', 'boiled_egg', 'jam', 'grilled_corn', 'veg_soup', 'omelet', 'corn_soup', 'ratatouille', 'pumpkin_stew', 'golden_omelet'] },
];

// モンスターのHPを回復する食べもの(バトル中に使う。牧場の野菜・畜産物・りょうり)
export const MON_HEAL = { carrot: 20, cabbage: 20, tomato: 25, corn: 25, eggplant: 25, pumpkin: 35, berry: 12, mushroom: 10, acorn: 10, milk: 30, egg: 20, golden_egg: 60, ...HEAL };

// もりに いるモンスター(モンスターずかんの ならび)。最後は もりの ぬし
export const FIELD_MONS = ['slime', 'aodori', 'dokukinoko', 'mogura', 'komori', 'hinotama', 'saboten', 'koyurei', 'hone_kenshi', 'sai_boya', 'katatsumuri', 'lion_ko', 'fukurou_ko', 'mitsubachi', 'kujira_ko', 'mame_chin', 'iwa_golem'];

// ================= 追加要素 =================
// ---- バトルの ドロップ(ざいりょう)。属性ごとの かけら + けがわ。売れるし、ボールづくりにも つかう ----
export const DROP_BY_ELEMENT = { fire: 'ember_stone', water: 'water_pearl', grass: 'green_leaf', wind: 'wind_feather', earth: 'earth_shard', thunder: 'spark_stone', heaven: 'holy_dust', dark: 'dark_shard', magic: 'magic_dust', beast: 'beast_fang', kami: 'god_scale' };
Object.assign(ITEMS, {
  monster_fur:  { name: 'もふもふの けがわ', sell: 25,  color: '#e8d8c0', kind: 'puff', mat: true },
  ember_stone:  { name: 'ひのいし',         sell: 45,  color: '#e8602a', kind: 'gem', mat: true, drop: true },
  water_pearl:  { name: 'みずのしずく',     sell: 45,  color: '#4a9ae0', kind: 'gem', mat: true, drop: true },
  green_leaf:   { name: 'みどりの はっぱ',   sell: 35,  color: '#5aa84a', kind: 'feather', mat: true, drop: true },
  wind_feather: { name: 'かぜの はね',       sell: 45,  color: '#9ad8c8', kind: 'feather', mat: true, drop: true },
  earth_shard:  { name: 'つちの かけら',     sell: 45,  color: '#b08a50', kind: 'gem', mat: true, drop: true },
  spark_stone:  { name: 'でんきの いし',     sell: 55,  color: '#f0d030', kind: 'gem', mat: true, drop: true },
  holy_dust:    { name: 'ひかりの こな',     sell: 70,  color: '#fff0a8', kind: 'gem', mat: true, drop: true },
  dark_shard:   { name: 'やみの かけら',     sell: 70,  color: '#6a4a98', kind: 'gem', mat: true, drop: true },
  magic_dust:   { name: 'まほうの こな',     sell: 70,  color: '#c06ae0', kind: 'gem', mat: true, drop: true },
  beast_fang:   { name: 'けものの きば',     sell: 45,  color: '#e8e0d0', kind: 'fang', mat: true, drop: true },
  god_scale:    { name: 'かみの うろこ',     sell: 400, color: '#ffe080', kind: 'gem', mat: true, drop: true },
});
DEX.push({ title: 'バトルの ざいりょう', ids: ['monster_fur', ...Object.values(DROP_BY_ELEMENT)] });

// ---- ボールづくり(おうちの 作業台)。any = どの属性のかけらでも よい ----
export const CRAFT_RECIPES = [
  { id: 'nakama_ball', need: { monster_fur: 2, hay: 2 } },
  { id: 'super_ball',  need: { monster_fur: 3 }, any: 3 },
  { id: 'hyper_ball',  need: { monster_fur: 5 }, any: 8 },
  { id: 'master_ball', need: { monster_fur: 12, god_scale: 1 }, any: 20 },
];

// ---- りょうりの バフ(バトル中に たべると 数ターン つよくなる)。atk/def/spd=倍率、crit=かいしん+% ----
export const BUFFS = {
  boiled_egg: { def: 1.1, turns: 4 }, jam: { spd: 1.15, turns: 4 }, grilled_corn: { atk: 1.15, turns: 4 }, veg_soup: { def: 1.2, turns: 4 },
  omelet: { atk: 1.2, turns: 5 }, corn_soup: { atk: 1.15, def: 1.15, turns: 5 }, ratatouille: { spd: 1.25, turns: 5 }, pumpkin_stew: { def: 1.3, turns: 5 },
  golden_omelet: { atk: 1.3, def: 1.3, spd: 1.3, crit: 10, turns: 8 }, seaweed_soup: { spd: 1.1, turns: 4 }, grilled_fish: { atk: 1.1, turns: 4 },
  fish_soup: { spd: 1.15, def: 1.1, turns: 5 }, shell_butter: { crit: 10, turns: 5 }, nori_roll: { def: 1.15, crit: 5, turns: 5 },
  squid_grill: { atk: 1.2, spd: 1.1, turns: 5 }, octo_marinade: { atk: 1.15, crit: 8, turns: 5 }, tai_shio: { atk: 1.25, def: 1.15, turns: 6 },
};
export const buffText = (b) => [b.regen ? `まいターン HP ${Math.round(b.regen * 100)}%かいふく` : '', b.exp ? `けいけんち ×${b.exp}` : '', b.atk ? `こうげき ×${b.atk}` : '', b.def ? `ぼうぎょ ×${b.def}` : '', b.spd ? `すばやさ ×${b.spd}` : '', b.crit ? `かいしん +${b.crit}%` : ''].filter(Boolean).join(' ') + ` (${b.turns}ターン)`;

// ---- とくせい(モンスターごとに1つ。タイプで かたよる) ----
export const ABILITIES = {
  pinch:     { name: 'ピンチで ばりき',   desc: 'HPが 1/3いかに なると ダメージ ×1.3' },
  thick:     { name: 'あつい ひふ',       desc: 'うける ダメージが 12%へる' },
  swift:     { name: 'せんそく',         desc: 'すばやさが 15%あがる' },
  regen:     { name: 'じこさいせい',     desc: 'まいターン HPが 1/12 かいふくする' },
  sharp:     { name: 'かいしんの め',     desc: 'かいしんりつが +10%' },
  typeboost: { name: 'タイプいっち',     desc: 'じぶんと おなじタイプの わざが ×1.15' },
  fortress:  { name: 'ふくつの こころ',   desc: 'たおされる ダメージを 1かいだけ HP1で たえる' },
  catcher:   { name: 'ほかく めいじん',   desc: 'ボールが つかまえやすくなる(+6%)' },
  greedy:    { name: 'ごうつく',         desc: 'しょうきんが +15%' },
  wise:      { name: 'けんじゃ',         desc: 'けいけんちが +15%' },
};
export const ABILITY_BY_ELEMENT = { fire: ['pinch', 'typeboost', 'sharp'], water: ['regen', 'thick', 'typeboost'], grass: ['regen', 'wise', 'catcher'], wind: ['swift', 'sharp', 'catcher'], earth: ['thick', 'fortress', 'typeboost'], thunder: ['swift', 'pinch', 'sharp'], heaven: ['regen', 'fortress', 'wise'], dark: ['sharp', 'pinch', 'greedy'], magic: ['wise', 'typeboost', 'catcher'], beast: ['pinch', 'swift', 'greedy'], kami: ['fortress', 'typeboost', 'wise'], none: ['thick', 'greedy', 'catcher'] };

// ---- モンスターずかんの ほうしゅう(なかまに した しゅるいの かず) ----
export const MDEX_REWARDS = [
  { n: 3,  reward: { coins: 200, items: { nakama_ball: 3 } } },
  { n: 8,  reward: { coins: 500, items: { nakama_ball: 5, super_ball: 1 } } },
  { n: 15, reward: { coins: 1000, items: { super_ball: 3 } } },
  { n: 25, reward: { coins: 2000, items: { super_ball: 3, hyper_ball: 1 } } },
  { n: 40, reward: { coins: 4000, items: { hyper_ball: 3 } } },
  { n: 50, reward: { coins: 8000, items: { hyper_ball: 4, master_ball: 1 } } },
  { n: 65, reward: { coins: 15000, items: { master_ball: 2 } } },
  { n: 79, reward: { coins: 30000, items: { master_ball: 3 } } },   // ぜんぶ
];
// ぞくせいごとの コンプリート(その ぞくせいの なかまが 5しゅるい)
export const ELEMENT_REWARD = { n: 5, coins: 600, items: { super_ball: 1 } };

// ---- モンスターずかん(フィールドごと。さいごは ぬし) ----
export const MON_GROUPS = [{"name": "はじまりの もり", "ids": ["slime", "aodori", "dokukinoko", "mogura", "komori", "hinotama", "saboten", "katatsumuri", "fukurou_ko", "mitsubachi", "usagi_ko", "mame_chin", "hone_kenshi", "koyurei", "shokujinsou_2"]}, {"name": "みずうみの ほとり", "ids": ["slime_2", "aodori_2", "kujira_ko", "slime_3"]}, {"name": "ようがんやま", "ids": ["hinotama_2", "mogura_2", "hone_kenshi_2", "komori_2", "koyurei_2", "hinotama_3", "iwa_golem", "yougan_golem"]}, {"name": "ゆうれいの はかば", "ids": ["koyurei_3", "yurei_ou"]}, {"name": "てんくうの はら", "ids": ["mame_chin_heaven", "tengu_ko", "shinju_pegasus", "shinju_unicorn", "mame_chin_magic", "mame_chin_thunder"]}, {"name": "たいようの はら", "ids": ["saboten_3", "kodai_kyubi", "kodai_oni", "kodai_kitsunemen", "shinju_reishishi", "aodori_3", "legend_houou"]}, {"name": "うちゅうの うみ", "ids": ["kodai_yukionna", "kodai_biwanushi", "kodai_kappabouzu", "shinju_kamezan", "legend_hyoketsuhime", "mame_chin_water", "legend_hoshikujira"]}, {"name": "しんじゅの いせき", "ids": ["dokukinoko_3", "legend_kyoshin", "mame_chin_grass", "shinju_hakurou", "kodai_tengu", "kami_ryokuya"]}, {"name": "やみの しろ", "ids": ["ankoku_madoushi_2", "shinju_cerberus", "kodai_gashadokuro", "legend_meifukishi", "kami_datenken"]}, {"name": "ほしの しんでん", "ids": ["legend_hoshiryu", "legend_shinpan", "majin_madoushi", "kami_seikuu"]}, {"name": "せいりゅうの そら", "ids": ["dragon", "shinju_griffon", "shinju_murasakiryu", "mame_chin_wind"]}, {"name": "うちゅうの はて", "ids": ["mame_chin_dark", "mame_chin_kami", "legend_rasetsuou"]}];
export const ALL_MONS = MON_GROUPS.flatMap(g => g.ids);

// ---- もちもの(なかまに もたせると バトルで こうかが ある。ものづくりの だいで つくれる) ----
export const HOLD = {
  hold_exp:   { exp: 1.2,   desc: 'もらえる けいけんちが 20%ふえる' },
  hold_regen: { regen: 16,  desc: 'まいターン HPが すこし(1/16)かいふくする' },
  hold_power: { atk: 1.1,   desc: 'こうげき・まほうが 10%あがる' },
  hold_guard: { def: 1.12,  desc: 'ぼうぎょ・まほうぼうぎょが 12%あがる' },
  hold_swift: { spd: 1.15,  desc: 'すばやさが 15%あがる' },
  hold_crit:  { crit: 8,    desc: 'かいしんりつが +8%' },
  hold_gold:  { money: 1.3, desc: 'しょうきんが 30%ふえる' },
  hold_luck:  { luck: 15,   desc: 'ラッキーが +15(ボールも つかまえやすく)' },
  hold_ward:  { ward: true, desc: 'どく・まひ・ねむりなどの じょうたいいじょうに かからない' },
  hold_sash:  { sash: true, desc: 'たおされる ダメージを バトルで 1かいだけ HP1で たえる' },
};
Object.assign(ITEMS, {
  hold_exp:   { name: 'まなびの おまもり',   sell: 0, color: '#f0d060', kind: 'charm', hold: true, noSell: true },
  hold_regen: { name: 'いやしの きのみ',     sell: 0, color: '#e86a8a', kind: 'charm', hold: true, noSell: true },
  hold_power: { name: 'ちからの バンド',     sell: 0, color: '#e0603a', kind: 'charm', hold: true, noSell: true },
  hold_guard: { name: 'かたい こうら',       sell: 0, color: '#8a9ab0', kind: 'charm', hold: true, noSell: true },
  hold_swift: { name: 'はやての くつ',       sell: 0, color: '#6ad0c0', kind: 'charm', hold: true, noSell: true },
  hold_crit:  { name: 'するどい つめ',       sell: 0, color: '#c8c0d8', kind: 'charm', hold: true, noSell: true },
  hold_gold:  { name: 'きんの こばん',       sell: 0, color: '#f0b830', kind: 'charm', hold: true, noSell: true },
  hold_luck:  { name: 'しあわせの クローバー', sell: 0, color: '#5ac060', kind: 'charm', hold: true, noSell: true },
  hold_ward:  { name: 'まもりの おふだ',     sell: 0, color: '#e8e0b0', kind: 'charm', hold: true, noSell: true },
  hold_sash:  { name: 'ねばりの たすき',     sell: 0, color: '#c05060', kind: 'charm', hold: true, noSell: true },
});
DEX.push({ title: 'もちもの', ids: Object.keys(HOLD) });
CRAFT_RECIPES.push(
  { id: 'hold_regen', need: { green_leaf: 3, monster_fur: 2 } },
  { id: 'hold_power', need: { beast_fang: 3, monster_fur: 3 } },
  { id: 'hold_guard', need: { earth_shard: 3, monster_fur: 3 } },
  { id: 'hold_swift', need: { wind_feather: 3, monster_fur: 2 } },
  { id: 'hold_crit',  need: { beast_fang: 2, spark_stone: 2 } },
  { id: 'hold_luck',  need: { green_leaf: 4, holy_dust: 1 } },
  { id: 'hold_gold',  need: { spark_stone: 2, monster_fur: 4 } },
  { id: 'hold_exp',   need: { monster_fur: 6, holy_dust: 2 } },
  { id: 'hold_ward',  need: { holy_dust: 2, green_leaf: 2, monster_fur: 3 } },
  { id: 'hold_sash',  need: { dark_shard: 2, monster_fur: 5 } },
);

// ---- まめちんちらの しんかいし(ぞくせいを えらんで しんかする。かみは さいごの ぬしを たおすと もらえる) ----
export const EVO_STONES = {
  evo_fire:    { name: 'ほのおの しんかいし', el: 'fire',    color: '#e8602a' },
  evo_water:   { name: 'みずの しんかいし',   el: 'water',   color: '#4a9ae0' },
  evo_grass:   { name: 'くさの しんかいし',   el: 'grass',   color: '#5aa84a' },
  evo_wind:    { name: 'かぜの しんかいし',   el: 'wind',    color: '#9ad8c8' },
  evo_earth:   { name: 'だいちの しんかいし', el: 'earth',   color: '#b08a50' },
  evo_thunder: { name: 'かみなりの しんかいし', el: 'thunder', color: '#f0d030' },
  evo_heaven:  { name: 'てんの しんかいし',   el: 'heaven',  color: '#fff0a8' },
  evo_dark:    { name: 'やみの しんかいし',   el: 'dark',    color: '#6a4a98' },
  evo_magic:   { name: 'まほうの しんかいし', el: 'magic',   color: '#c06ae0' },
  evo_kami:    { name: 'かみの しんかいし',   el: 'kami',    color: '#ffe080' },
};
for (const [id, v] of Object.entries(EVO_STONES)) ITEMS[id] = { name: v.name, sell: 0, color: v.color, kind: 'gem', noSell: true, evo: v.el };
DEX.push({ title: 'しんかいし', ids: Object.keys(EVO_STONES) });

// ---- バトルで つかう どうぐ(じょうたいいじょうなおし・のうりょくアップ・PPかいふく) ----
Object.assign(ITEMS, {
  cure_all:   { name: 'なんでもなおし', sell: 20, color: '#8ad0a0', kind: 'gem', battle: { cure: 1 }, desc: 'じょうたいいじょうを なおす' },
  tonic_atk:  { name: 'ちからの くすり', sell: 25, color: '#e0603a', kind: 'gem', battle: { stg: { atk: 1 } }, desc: 'こうげきが あがる' },
  tonic_def:  { name: 'まもりの くすり', sell: 25, color: '#8a9ab0', kind: 'gem', battle: { stg: { def: 1 } }, desc: 'ぼうぎょが あがる' },
  tonic_spd:  { name: 'はやての くすり', sell: 25, color: '#6ad0c0', kind: 'gem', battle: { stg: { spd: 1 } }, desc: 'すばやさが あがる' },
  pp_ether:   { name: 'わざの しずく',   sell: 40, color: '#8ac0f0', kind: 'gem', battle: { pp: 10 }, desc: 'すべての わざの PPが 10かいふく' },
});
DEX.push({ title: 'バトルの くすり', ids: ['cure_all', 'tonic_atk', 'tonic_def', 'tonic_spd', 'pp_ether'] });

// ---- モンスターが でてくる ばしょ(field.jsの でかたリストから つくった。「!」は ぬし) ----
export const FIELD_NAMES = {"forest": "はじまりの もり", "volcano": "ようがんやま", "ghost": "ゆうれいの はかば", "sky": "てんくうの はら", "sun": "たいようの はら", "cosmos": "うちゅうの うみ", "grove": "しんじゅの いせき", "castle": "やみの しろ", "temple": "ほしの しんでん", "dragon": "せいりゅうの そら", "end": "うちゅうの はて", "lake": "みずうみの ほとり"};
export const APPEAR = {"slime": ["forest", "lake"], "aodori": ["forest", "lake"], "dokukinoko": ["forest"], "mogura": ["forest"], "komori": ["forest"], "hinotama": ["forest"], "saboten": ["forest"], "katatsumuri": ["forest"], "fukurou_ko": ["forest", "lake"], "mitsubachi": ["forest", "sky", "lake"], "mame_chin": ["forest"], "hone_kenshi": ["forest"], "koyurei": ["forest"], "shokujinsou_2": ["forest!", "grove"], "hinotama_2": ["volcano"], "mogura_2": ["volcano"], "hone_kenshi_2": ["volcano", "ghost"], "komori_2": ["volcano", "ghost"], "koyurei_2": ["volcano", "ghost"], "hinotama_3": ["volcano", "sun"], "iwa_golem": ["volcano"], "yougan_golem": ["volcano!"], "koyurei_3": ["ghost"], "yurei_ou": ["ghost!"], "mame_chin_heaven": ["sky", "temple", "end"], "shinju_pegasus": ["sky", "sky!", "temple"], "shinju_unicorn": ["sky", "temple"], "mame_chin_magic": ["sky", "temple", "end"], "mame_chin_thunder": ["sky", "dragon"], "saboten_3": ["sun", "grove"], "kodai_kyubi": ["sun"], "kodai_oni": ["sun"], "kodai_kitsunemen": ["sun"], "shinju_reishishi": ["sun"], "aodori_3": ["sun"], "legend_houou": ["sun!", "dragon"], "kodai_yukionna": ["cosmos"], "kodai_biwanushi": ["cosmos"], "kodai_kappabouzu": ["cosmos"], "shinju_kamezan": ["cosmos"], "legend_hyoketsuhime": ["cosmos"], "mame_chin_water": ["cosmos"], "legend_hoshikujira": ["cosmos!"], "dokukinoko_3": ["grove"], "legend_kyoshin": ["grove"], "mame_chin_grass": ["grove"], "shinju_hakurou": ["grove"], "kodai_tengu": ["grove", "dragon"], "kami_ryokuya": ["grove!"], "ankoku_madoushi_2": ["castle"], "shinju_cerberus": ["castle"], "kodai_gashadokuro": ["castle"], "legend_meifukishi": ["castle"], "kami_datenken": ["castle!"], "legend_hoshiryu": ["temple"], "legend_shinpan": ["temple", "end"], "majin_madoushi": ["temple"], "kami_seikuu": ["temple!"], "dragon": ["dragon", "dragon!"], "shinju_griffon": ["dragon"], "shinju_murasakiryu": ["dragon"], "mame_chin_wind": ["dragon"], "mame_chin_dark": ["end"], "mame_chin_kami": ["end", "end!"], "legend_rasetsuou": ["end"], "slime_2": ["lake"], "aodori_2": ["lake"], "kujira_ko": ["lake"], "slime_3": ["lake"]};

// ---- つりの さかなを つかった ごちそう(あたらしい バフ: まいターンかいふく・けいけんちアップ) ----
Object.assign(ITEMS, {
  saba_miso:     { name: 'さばの みそに',       sell: 330, color: '#8a6a50', kind: 'plate' },
  karei_nitsuke: { name: 'かれいの につけ',     sell: 420, color: '#c09060', kind: 'plate' },
  ayu_shio:      { name: 'あゆの しおやき',     sell: 260, color: '#d8c070', kind: 'plate' },
  funa_miso:     { name: 'ふなの みそしる',     sell: 180, color: '#b09870', kind: 'plate' },
  nijimasu_meu:  { name: 'にじますの ムニエル', sell: 480, color: '#e8b890', kind: 'plate' },
  iwana_yaki:    { name: 'いわなの いわやき',   sell: 560, color: '#c8a070', kind: 'plate' },
  fugu_sashi:    { name: 'ふぐさし',           sell: 900, color: '#f0e8d0', kind: 'plate' },
  unagi_kabayaki:{ name: 'うなぎの かばやき',   sell: 1100, color: '#8a4a28', kind: 'plate' },
  koi_arai:      { name: 'こいの あらい',       sell: 1500, color: '#e8d0c8', kind: 'plate' },
  tai_meshi:     { name: 'たいめし',           sell: 780, color: '#f0c8b0', kind: 'plate' },
  seafood_pot:   { name: 'うみの ごちそうなべ', sell: 820, color: '#e07a50', kind: 'plate' },
});
Object.assign(HEAL, { saba_miso: 70, karei_nitsuke: 75, ayu_shio: 55, funa_miso: 45, nijimasu_meu: 85, iwana_yaki: 90, fugu_sashi: 60, unagi_kabayaki: 120, koi_arai: 150, tai_meshi: 110, seafood_pot: 140 });
Object.assign(MON_HEAL, { saba_miso: 70, karei_nitsuke: 75, ayu_shio: 55, funa_miso: 45, nijimasu_meu: 85, iwana_yaki: 90, fugu_sashi: 60, unagi_kabayaki: 120, koi_arai: 150, tai_meshi: 110, seafood_pot: 140 });
Object.assign(BUFFS, {
  saba_miso: { def: 1.2, regen: 0.06, turns: 5 }, karei_nitsuke: { atk: 1.15, def: 1.15, turns: 5 }, ayu_shio: { spd: 1.2, turns: 5 }, funa_miso: { regen: 0.05, turns: 4 },
  nijimasu_meu: { def: 1.2, regen: 0.08, turns: 6 }, iwana_yaki: { atk: 1.25, crit: 6, turns: 5 }, fugu_sashi: { atk: 1.2, crit: 15, turns: 6 },
  unagi_kabayaki: { atk: 1.2, spd: 1.2, regen: 0.08, turns: 7 }, koi_arai: { atk: 1.25, def: 1.25, spd: 1.25, crit: 8, turns: 8 },
  tai_meshi: { exp: 1.3, atk: 1.1, turns: 8 }, seafood_pot: { atk: 1.2, def: 1.2, spd: 1.2, regen: 0.05, turns: 6 },
});
RECIPES.push(
  { id: 'saba_miso', need: { saba: 1, carrot: 1 } }, { id: 'karei_nitsuke', need: { karei: 1, mushroom: 1 } }, { id: 'ayu_shio', need: { ayu: 1 } }, { id: 'funa_miso', need: { funa: 2 } },
  { id: 'nijimasu_meu', need: { nijimasu: 1, milk: 1 } }, { id: 'iwana_yaki', need: { iwana: 1, mushroom: 1 } }, { id: 'fugu_sashi', need: { fugu: 1 } },
  { id: 'unagi_kabayaki', need: { unagi: 1 } }, { id: 'koi_arai', need: { koi: 1 } }, { id: 'tai_meshi', need: { tai: 1, corn: 1 } }, { id: 'seafood_pot', need: { iwashi: 1, ika: 1, tako: 1 } },
);
DEX.push({ title: 'つりの ごちそう', ids: ['saba_miso', 'karei_nitsuke', 'ayu_shio', 'funa_miso', 'nijimasu_meu', 'iwana_yaki', 'fugu_sashi', 'unagi_kabayaki', 'koi_arai', 'tai_meshi', 'seafood_pot'] });

// ---- きせつの おくりもの(きせつの はじまりに もらえる。たかく うれる) ----
Object.assign(ITEMS, {
  season_petal: { name: 'さくらの はなびら', sell: 180, color: '#ffb8cc', kind: 'feather', mat: true },
  season_sun:   { name: 'ひまわりの たね',   sell: 180, color: '#f0c020', kind: 'puff', mat: true },
  season_leaf:  { name: 'あかい もみじ',     sell: 180, color: '#e0501e', kind: 'feather', mat: true },
  season_snow:  { name: 'ゆきの けっしょう', sell: 180, color: '#bfe0ff', kind: 'gem', mat: true },
});
DEX.push({ title: 'きせつの おくりもの', ids: ['season_petal', 'season_sun', 'season_leaf', 'season_snow'] });

// バケツの アップグレード(よろずやで おかねを はらう)。lv ごとの みずの ようりょうと ねだん
export const BUCKET = { caps: [3, 5, 8, 12, 16], prices: [0, 150, 400, 900, 2000] };

// ---- あとから ふやした モンスター(js/monsters_extra.js)を ずかん・でる ばしょ に とうろく ----
import { EXTRA_MONS, EXTRA_APPEAR } from './monsters_extra.js';
for (const [id, fs] of Object.entries(EXTRA_APPEAR)) {
  APPEAR[id] = Object.keys(fs);
  for (const f of Object.keys(fs)) { const g = MON_GROUPS.find(x => x.name === FIELD_NAMES[f]); if (g && !g.ids.includes(id)) g.ids.push(id); }
  if (!ALL_MONS.includes(id)) ALL_MONS.push(id);
  if (!FIELD_MONS.includes(id)) FIELD_MONS.push(id);
}

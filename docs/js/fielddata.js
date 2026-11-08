import { MOON_WILD } from './monsters_moon.js';
// フィールド(ぬし・やせい・けしき)の データ。field.js と gym.js が きょうゆうする
export const FIELDS = {
  forest: {
    name: 'はじまりの もり', groundRep: 34, patch: [['#2f6a2a', 0.5, false, 40, 4, 9], ['#d8e070', 0.28, false, 24, 3, 7]],
     fx: { color: '#f4ff9a', n: 70, size: 0.28, dir: 1, speed: [0.05, 0.3], sway: 1.2 },
    sky: '#b9d8d0', g0: '#5f9a44', g1: ['#4f8a3a', '#79ad52', '#6a9e46', '#8dbb5c'], bg: 'battle_forest.webp',
    zones: [[-16, -6, 8], [14, -22, 9], [-8, -34, 8], [22, 4, 7], [-6, -44, 8]],
    trees: [['pine_far', 110, 170, [4.6, 7], 14, 78], ['birch', 24, 40, [3.0, 4.4], 14, 70]],
    wild: [['dokukinoko', 4], ['saboten', 4], ['chin_kusa', 4], ['ringo_ko', 4], ['wakagi_shika', 2], ['slime', 1], ['aodori', 1], ['mogura', 1], ['komori', 1], ['hinotama', 1], ['mitsubachi', 1], ['katatsumuri', 1], ['mame_chin', 1], ['watage', 1]],
    boss: { key: 'forest', x: 0, z: -58, id: 'shokujinsou_2', sprite: 'shokujinsou_2', patch: 'boss_patch', patchW: 15, name: 'ガブリソウ', over: { name: 'ガブリソウ', image: 'assets/bosses/forest.webp', level: 11, hp: 105, atk: 22, def: 15, spd: 9, exp: 110, money: 160 }, model: 'boss_forest', h: 5.0, lines: ['……ここは わたしの もりだ。', 'くさむらで きたえた なかまと いっしょなら、わたしを みとめよう。', 'さあ、かかってこい! HPと かいふくの たべものは じゅんびできたか?'], coins: 300, win: 'ぬし ガブリソウが みとめてくれた! なかまボール×5 と 300コインを もらった!', after: 'もりに へいわが もどったよ' },
  },
  volcano: {
    name: 'ようがんやま', groundGain: 0.85, relief: 1.7, hills: 3.5, patch: [['#1a100c', 0.8, false, 50, 4, 10], ['#ff6a1a', 0.45, true, 36, 2, 6]], props: [['deco_lava_rock', 30, 55, [0.5, 1.1], 6, 60]],
     sky: '#6e3a30', fogN: 20, fogF: 105, g0: '#4a3830', g1: ['#3c2c26', '#5a443a', '#6a4e40', '#2e2420'], bg: 'battle_volcano.webp',
    light: { hemi: [0xffc8a0, 0x5a2a20, 1.15], sun: [0xff9a60, 2.1] }, zd: ['#7a3a1acc', '#8a4a22aa', '#8a4a2200'], tint: [[1.6, 1.9], [0.75, 0.95], [0.5, 0.7]],
    lava: [[-22, -18, 9], [26, -14, 7], [-30, 22, 8]], fx: { color: '#ff9a3a', n: 240, size: 0.5, dir: 1, speed: [0.8, 2.2], sway: 0.4 },
    zones: [[10, -6, 8], [22, -32, 9], [-8, -42, 8], [30, 10, 7], [-34, 0, 7], [2, 26, 7]],
    trees: [['deco_lava_rock', 40, 64, [1.7, 3.4], 12, 74], ['deco_lava_rock', 20, 30, [3.6, 5.4], 26, 76]],
    wild: [['hinotama_2', 3], ['mogura_2', 3], ['hone_kenshi_2', 2], ['komori_2', 2], ['koyurei_2', 2], ['hinotama_3', 1], ['iwa_golem', 1], ['raimushi_2', 1], ['raimushi_3', 1], ['hono_tanuki', 1], ['ringo_ko', 2], ['dango_mushi', 1], ['kitsune_ko', 1], ['denki_neko', 1], ['fuusen_ko', 1], ['hono_tanuki', 2], ['hono_tanuki_2', 2], ['hono_tanuki_3', 1], ['dango_mushi_2', 1], ['mike_hi', 1], ['mike_hi_2', 1], ['houki_ko', 1], ['denchi_risu', 1], ['furin_ko', 1], ['tako_ko', 1], ['donguri_robo', 1], ['suna_kai', 1], ['donguri_robo', 1], ['donguri_robo_2', 1], ['iwagoro', 1], ['gankou_goro', 1], ['wakagi_shika', 1], ['mori_shika', 1], ['toki_no_yousei', 1]], scale: { lv: 5, hp: 1.5, atk: 1.4, def: 1.4, spd: 1.2, exp: 1.5, money: 1.5 },
    boss: { key: 'volcano', x: 0, z: -58, id: 'yougan_golem', name: 'ガンテツ', deco: { model: 'deco_lava_rock', n: 9, r: 7.8, w: 4.2 }, over: { name: 'ガンテツ', image: 'assets/bosses/volcano.webp', level: 26, hp: 302, atk: 52, def: 32, spd: 15, exp: 340, money: 420 }, model: 'boss_volcano', h: 6.6, lines: ['グゴゴゴ……だれだ、わしの ねむりを さまたげるのは。', 'ここは ようがんが ふきだす やま。よわい ものは すぐに やけてしまうぞ。', 'おまえたちの ちからを みせてみろ!', ], coins: 800, win: 'ぬし ガンテツが みとめてくれた! なかまボール×5 と 800コインを もらった!', after: 'ようがんやまに へいわが もどったよ' },
  },
  ghost: {
    name: 'ゆうれいの はかば', groundGain: 2.6, relief: 1.5, hills: 2.5, patch: [['#1e1c32', 0.8, false, 50, 4, 10], ['#6affc8', 0.28, true, 30, 2, 6]], props: [['deco_ghost_lantern', 14, 24, [0.7, 1.1], 8, 55]],
     fx: { color: '#9affd8', n: 120, size: 0.6, dir: 1, speed: [0.2, 0.7], sway: 1.2 },
    sky: '#2c2a46', fogN: 14, fogF: 85, g0: '#5a5878', g1: ['#4c4a68', '#66647f', '#706e8c', '#3e3c58'], bg: 'battle_ghost.webp',
    light: { hemi: [0xc8c8f0, 0x4a4468, 1.0], sun: [0xb8c0ff, 1.5] }, zd: ['#4a3a7acc', '#3e3270aa', '#3e327000'], tint: [[0.55, 0.75], [0.6, 0.8], [1.2, 1.5]],
    zones: [[10, -6, 8], [22, -32, 9], [-8, -42, 8], [30, 10, 7], [-34, 0, 7], [2, 26, 7]],
    trees: [['deco_ghost_lantern', 22, 34, [2.0, 3.0], 12, 70], ['deco_tomb', 26, 40, [1.1, 1.7], 14, 76, null, { fit: true }], ['deco_cross', 18, 28, [1.4, 2.2], 14, 76, null, { fit: true }], ['deco_wisp', 24, 36, [0.8, 1.4], 12, 74, null, { fit: true, basic: true, nofog: true, fly: [0.6, 3.2] }]],
    wild: [['koyurei_2', 4], ['hone_kenshi_2', 4], ['komori_2', 3], ['koyurei_3', 1], ['hone_kenshi_3', 1], ['kage_bouzu', 1], ['yoru_kage', 1], ['maboroshi_yomi', 1]], scale: { lv: 6, hp: 1.6, atk: 1.5, def: 1.5, spd: 1.3, exp: 1.6, money: 1.6 },
    boss: { key: 'ghost', x: 0, z: -58, id: 'yurei_ou', name: 'ヨイヤミ', deco: { model: 'deco_ghost_lantern', n: 9, r: 7.8, w: 3.4 }, over: { name: 'ヨイヤミ', image: 'assets/bosses/ghost.webp', level: 33, hp: 381, atk: 63, def: 39, spd: 19, exp: 480, money: 560 }, model: 'boss_ghost', h: 6.0, lines: ['ふふふ……よく ここまで きたね、いきている ものよ。', 'ここは ねむれぬ たましいが あつまる はかば。', 'わたしを ちっそくさせられるか、ためして あげよう……'], coins: 1200, win: 'ぬし ヨイヤミが みとめてくれた! なかまボール×5 と 1200コインを もらった!', after: 'はかばに しずけさが もどったよ' },
  },
  sky: {
    name: 'てんくうの はら', groundGain: 0.8, relief: 1.4, hills: 3.5, patch: [['#ffffff', 0.55, false, 40, 5, 12], ['#ffe8a0', 0.35, true, 30, 3, 8]], props: [['deco_starshard', 20, 40, [0.5, 1.0], 6, 55]],
     lava: [[-22, -18, 9], [26, -14, 7], [-30, 22, 8]], pool: { h: 0.55, s: 0.6, l: 0.78, glow: '#ffffff' }, fx: { color: '#fff2b0', n: 140, size: 0.4, dir: 1, speed: [0.2, 0.6], sway: 1.0 },
    sky: '#f4dcc8', fogN: 30, fogF: 160, g0: '#a8c890', g1: ['#98c088', '#bcd89c', '#c8dca4', '#a8ccb0'], bg: 'battle_sky.webp',
    light: { hemi: [0xfff0e0, 0xb8a8c8, 1.5], sun: [0xffe8c0, 2.4] }, zd: ['#e8d890cc', '#dcd098aa', '#dcd09800'], tint: [[1.0, 1.2], [1.0, 1.15], [0.8, 1.0]],
    zones: [[12, -8, 8], [22, -32, 9], [-6, -42, 8], [28, 10, 7], [-32, 14, 8], [4, 24, 7]],
    trees: [['deco_starshard', 24, 36, [2.0, 3.2], 12, 70],
      ['cloud_fluffy', 22, 34, [6, 13], 10, 78, '#ffffff', { fit: true, basic: true, nofog: true, fly: [2, 12] }], ['cloud_cumulo', 5, 8, [10, 18], 40, 82, '#ffffff', { fit: true, basic: true, nofog: true, fly: [3, 14] }], ['cloud_long', 6, 10, [11, 20], 30, 82, '#ffffff', { fit: true, basic: true, nofog: true, fly: [5, 16] }], ['cloud_chin', 4, 6, [7, 12], 24, 78, '#ffffff', { fit: true, basic: true, nofog: true, fly: [3, 10] }],
      ['cloud_fluffy', 40, 56, [5, 10], 20, 78, '#ffffff', { fit: true, basic: true, nofog: true, fly: [0, 0.6] }]],
    wild: [['mame_chin_heaven', 2], ['shinju_pegasus', 2], ['shinju_unicorn', 1], ['mitsubachi', 2], ['mame_chin_magic', 2], ['mame_chin_thunder', 1], ['raichou_ko', 1], ['watage', 1], ['tsubame_ko', 1], ['kaze_chou', 1], ['kumo_hitsuji', 1], ['kitsune_ko_2', 1], ['denki_neko', 1], ['fuusen_ko', 2], ['hikari_kame', 1], ['denchi_risu', 1], ['hoshi_usagi', 1], ['niji_hato', 1], ['furin_ko', 1], ['furin_ko_2', 1], ['tako_ko', 1], ['chibi_ryu', 1], ['sora_ryu', 1], ['nari_kami', 1]], scale: { lv: 6, hp: 1.7, atk: 1.6, def: 1.6, spd: 1.4, exp: 1.7, money: 1.7 },
    boss: { key: 'sky', x: 0, z: -58, id: 'shinju_pegasus', name: 'セラフィ', deco: { model: 'deco_starshard', n: 9, r: 7.8, w: 3.4 }, over: { name: 'セラフィ', image: 'assets/bosses/sky.webp', level: 40, hp: 482, atk: 76, def: 48, spd: 23, exp: 700, money: 800 }, model: 'boss_celestial', h: 6.2, lines: ['……ほしの ひかりに みちびかれて きたのですね。', 'ここは そらに いちばん ちかい はら。', 'ちからと きずなを、わたしに みせてください。'], coins: 2000, win: 'ぬし セラフィが みとめてくれた! なかまボール×5 と 2000コインを もらった!', after: 'てんくうに ひかりが もどったよ' },
  },
  sun: {
    name: 'たいようの はら', relief: 1.5, hills: 3, patch: [['#1a100c', 0.8, false, 50, 4, 10], ['#ff6a1a', 0.45, true, 36, 2, 6]], props: [['deco_lava_rock', 30, 55, [0.5, 1.1], 6, 60]],
     sky: '#f6c878', fogN: 22, fogF: 130, g0: '#7a5230', g1: ['#6a4528', '#8a6038', '#9a6c3c', '#5a3a22'], fx: { color: '#ff9a3a', n: 320, size: 0.5, dir: 1, speed: [0.8, 2.2], sway: 0.4 },
    lava: [[-22, -18, 9], [26, -14, 7], [-30, 22, 8]], bg: 'battle_sun.webp',
    light: { hemi: [0xffe0a0, 0x8a5a30, 1.5], sun: [0xffc070, 2.4] }, zd: ['#e8b040cc', '#d8a040aa', '#d8a04000'], tint: [[1.3, 1.6], [1.0, 1.25], [0.5, 0.7]],
    zones: [[10, -6, 8], [22, -32, 9], [-8, -42, 8], [30, 10, 7], [-34, 0, 7], [2, 26, 7]],
    trees: [['deco_lava_rock', 24, 36, [1.6, 3.0], 12, 74]],
    wild: [['hinotama_3', 3], ['saboten_3', 2], ['kodai_kyubi', 1], ['kodai_oni', 2], ['kodai_kitsunemen', 2], ['shinju_reishishi', 1], ['aodori_3', 2], ['kumo_hitsuji', 1], ['kumo_hitsuji_2', 1], ['tenshi_chin', 1], ['kitsune_ko', 1], ['kitsune_ko_2', 1], ['hikari_kame', 1], ['hoshi_usagi', 1], ['hoshi_usagi_2', 1], ['niji_hato', 1], ['chibi_ryu', 1], ['hikari_kishi', 1], ['sei_kishi', 1], ['yume_no_ko', 1]], scale: { lv: 4, hp: 1.4, atk: 1.4, def: 1.4, spd: 1.2, exp: 2, money: 2 },
    boss: { key: 'sun', x: 0, z: -58, id: 'legend_houou', name: 'アカツキ', deco: { model: 'deco_lava_rock', n: 9, r: 7.8, w: 3.6 }, over: { name: 'アカツキ', image: 'assets/bosses/sun.webp', level: 47, hp: 605, atk: 91, def: 56, spd: 27, exp: 800, money: 900 }, model: 'boss_phoenix_b', h: 6.6, lines: ['……あたたかい ひかりに ひかれて きたのですね。', 'わたしは たいようの ひを まもる もの。', 'ほのおの ちからを うけとめられるか、みせてください!'], coins: 3000, win: 'ぬし アカツキが みとめてくれた! なかまボール×5 と 3000コインを もらった!', after: 'たいようの はらに あたたかさが もどったよ' },
  },
  cosmos: {
    name: 'うちゅうの うみ', groundGain: 1.25, relief: 1.2, hills: 2, patch: [['#0a1238', 0.8, false, 46, 4, 11], ['#6a9aff', 0.4, true, 36, 2, 7]], props: [['deco_water_orb', 20, 40, [0.4, 0.9], 6, 55]],
     lava: [[-22, -18, 9], [26, -14, 7], [-30, 22, 8]], pool: { h: 0.62, s: 0.8, l: 0.28, glow: '#6a9aff' }, fx: { color: '#bfe0ff', n: 220, size: 0.35, dir: 1, speed: [0.05, 0.25], sway: 2.0 },
    sky: '#1c2a5e', fogN: 16, fogF: 110, g0: '#3a4478', g1: ['#2e3868', '#46528a', '#505e98', '#262e58'], bg: 'battle_cosmos.webp',
    light: { hemi: [0xe0e8ff, 0x5a6088, 1.35], sun: [0x9ab8ff, 1.7] }, zd: ['#4a62b0cc', '#3a52a0aa', '#3a52a000'], tint: [[0.55, 0.8], [0.8, 1.0], [1.5, 1.9]],
    zones: [[10, -6, 8], [22, -32, 9], [-8, -42, 8], [30, 10, 7], [-34, 0, 7], [2, 26, 7]],
    trees: [['deco_water_orb', 20, 30, [1.6, 2.6], 12, 74], ['deco_star5', 34, 56, [1.6, 3.4], 14, 78, '#ffffff', { fit: true, basic: true, nofog: true, fly: [1, 9] }], ['deco_star5', 14, 22, [1.4, 2.6], 14, 78, '#ffb0e8', { fit: true, basic: true, nofog: true, fly: [1, 9] }], ['deco_star5', 14, 22, [1.4, 2.6], 14, 78, '#a0f0ff', { fit: true, basic: true, nofog: true, fly: [1, 9] }],
      ['deco_planet_ring', 8, 12, [9, 16], 36, 82, '#ffffff', { fit: true, basic: true, nofog: true, fly: [6, 22] }], ['deco_planet_ring', 5, 8, [7, 12], 40, 82, '#a8c8ff', { fit: true, basic: true, nofog: true, fly: [6, 22] }], ['deco_planet_moon', 8, 12, [4, 9], 30, 80, '#ffffff', { fit: true, basic: true, nofog: true, fly: [4, 14] }], ['deco_crescent', 6, 10, [3, 6], 24, 78, '#ffffff', { fit: true, basic: true, nofog: true, fly: [3, 12] }]],
    wild: [['kodai_yukionna', 2], ['kodai_biwanushi', 2], ['kodai_kappabouzu', 2], ['shinju_kamezan', 2], ['legend_hyoketsuhime', 1], ['mame_chin_water', 2], ['lamp_no_sei', 1], ['kurage_ko_2', 1], ['hoshi_usagi_2', 1], ['kantera_bito', 1], ['raimei_hydra', 1], ['daichi_madoromi', 1], ['umihebi_ko', 1], ['namino_kairyu', 1], ['shinkai_ryujin', 1], ['tenkuu_shugoshin', 1]], scale: { lv: 4, hp: 1.4, atk: 1.4, def: 1.4, spd: 1.2, exp: 2, money: 2 },
    boss: { key: 'cosmos', x: 0, z: -58, id: 'legend_hoshikujira', name: 'ギンガ', deco: { model: 'deco_water_orb', n: 9, r: 7.8, w: 3.6 }, over: { name: 'ギンガ', image: 'assets/bosses/cosmos.webp', level: 54, hp: 728, atk: 106, def: 65, spd: 31, exp: 1000, money: 1100 }, model: 'boss_whale', h: 6.0, lines: ['…………(ふかく ひびく うたごえ)', 'ここは ほしぼしが ながれる うみ。', 'わたしの うたを きいて、まだ たっていられるかな?'], coins: 4000, win: 'ぬし ギンガが みとめてくれた! なかまボール×5 と 4000コインを もらった!', after: 'うちゅうの うみに うたごえが ひびくよ' },
  },
  grove: {
    name: 'しんじゅの いせき', groundGain: 0.85, relief: 1.3, hills: 2, patch: [['#2e6a3a', 0.6, false, 46, 4, 10], ['#d8f8a8', 0.35, true, 30, 3, 7]], props: [['deco_pillar_vine', 16, 30, [0.5, 1.0], 6, 55]],
     lava: [[-22, -18, 9], [26, -14, 7], [-30, 22, 8]], pool: { h: 0.42, s: 0.6, l: 0.35, glow: '#a0ffc8' }, fx: { color: '#b8f07a', n: 100, size: 0.35, dir: -1, speed: [0.4, 0.9], sway: 1.0, blend: 'normal' },
    sky: '#cfe8c8', fogN: 26, fogF: 140, g0: '#7aa860', g1: ['#6a9a52', '#90bc66', '#a0c872', '#5c8a46'], bg: 'battle_grove.webp',
    light: { hemi: [0xf0ffe0, 0x7a9a60, 1.5], sun: [0xf4ffd0, 2.3] }, zd: ['#5a9a3acc', '#4a8a36aa', '#4a8a3600'], tint: [[0.8, 1.0], [1.0, 1.15], [0.8, 1.0]],
    zones: [[10, -6, 8], [22, -32, 9], [-8, -42, 8], [30, 10, 7], [-34, 0, 7], [2, 26, 7]],
    trees: [['deco_pillar_vine', 22, 32, [1.8, 3.2], 12, 74], ['deco_ruin_arch', 8, 12, [3.6, 5.0], 16, 74, null, { fit: true }], ['deco_pillar_broken', 14, 22, [2.0, 3.0], 14, 74, null, { fit: true }], ['deco_pearl_shell', 14, 22, [1.2, 2.0], 12, 70, null, { fit: true }]],
    wild: [['dokukinoko_3', 3], ['saboten_3', 3], ['shokujinsou_2', 3], ['legend_kyoshin', 1], ['mame_chin_grass', 2], ['ringo_ko', 1], ['ringo_ko_2', 3], ['chin_kusa', 1], ['chin_kusa_2', 2], ['wakagi_shika', 2], ['mori_shika', 2], ['shinju_taiboku', 1], ['toki_no_yousei', 1], ['shinju_hakurou', 1], ['kodai_tengu', 1], ['watage_2', 1], ['kaze_chou', 1], ['raimushi_2', 1], ['dango_mushi_2', 1], ['donguri_robo_2', 1], ['mame_chin', 1], ['nebosuke_kyo', 1]], scale: { lv: 4, hp: 1.4, atk: 1.4, def: 1.4, spd: 1.2, exp: 2, money: 2 },
    boss: { key: 'grove', x: 0, z: -58, id: 'kami_ryokuya', name: 'ユグ', deco: { model: 'deco_pillar_vine', n: 9, r: 7.8, w: 3.6 }, over: { name: 'ユグ', image: 'assets/bosses/grove.webp', level: 60, hp: 874, atk: 121, def: 73, spd: 34, exp: 1300, money: 1500 }, model: 'boss_goddess', h: 6.4, lines: ['……ようこそ、ちいさき ものよ。', 'この いせきは もりの いのちを みまもる ばしょ。', 'きずなの つよさを、みせてもらいましょう。'], coins: 5000, win: 'ぬし ユグが みとめてくれた! なかまボール×5 と 5000コインを もらった!', after: 'いせきに みどりの ひかりが もどったよ' },
  },
  castle: {
    name: 'やみの しろ', groundGain: 2.4, relief: 1.5, hills: 3, patch: [['#120a1e', 0.8, false, 50, 4, 10], ['#a070ff', 0.4, true, 30, 2, 6]], props: [['deco_dark_sword', 16, 30, [0.5, 1.0], 6, 55]],
     lava: [[-22, -18, 9], [26, -14, 7], [-30, 22, 8]], pool: { h: 0.78, s: 0.7, l: 0.22, glow: '#a070ff' }, fx: { color: '#c8b8e0', n: 140, size: 0.3, dir: -1, speed: [0.3, 0.7], sway: 0.6, blend: 'normal' },
    sky: '#241a36', fogN: 12, fogF: 80, g0: '#4a4058', g1: ['#3c3248', '#564a68', '#605474', '#30283c'], bg: 'battle_castle.webp',
    light: { hemi: [0xe0d4f0, 0x504060, 1.1], sun: [0xc0a0ff, 1.5] }, zd: ['#5a3a80cc', '#4a2a70aa', '#4a2a7000'], tint: [[0.9, 1.1], [0.5, 0.7], [1.2, 1.5]],
    zones: [[10, -6, 8], [22, -32, 9], [-8, -42, 8], [30, 10, 7], [-34, 0, 7], [2, 26, 7]],
    trees: [['deco_dark_sword', 20, 30, [1.8, 3.0], 12, 72], ['deco_spire', 12, 18, [5, 8], 22, 78, null, { fit: true }], ['deco_banner', 16, 26, [3.5, 4.8], 14, 76, null, { fit: true }]],
    wild: [['ankoku_madoushi_2', 3], ['hone_kenshi_3', 3], ['komori_3', 2], ['koyurei_3', 2], ['shinju_cerberus', 1], ['kodai_gashadokuro', 1], ['legend_meifukishi', 1], ['majutsusho', 1], ['majutsusho_2', 1], ['majo_chin', 1], ['kagami_ko', 1], ['mame_chin', 1], ['houki_ko_2', 1], ['suzu_sei', 1], ['omocha_mahou', 1], ['gankou_goro', 1], ['daichi_taishou', 1], ['kage_bouzu', 1], ['nebosuke_kyo', 1], ['goro_kyojuu', 1]], scale: { lv: 4, hp: 1.4, atk: 1.4, def: 1.4, spd: 1.2, exp: 2, money: 2 },
    boss: { key: 'castle', x: 0, z: -58, id: 'kami_datenken', name: 'クロガネ', deco: { model: 'deco_dark_sword', n: 9, r: 7.8, w: 3.6 }, over: { name: 'クロガネ', image: 'assets/bosses/castle.webp', level: 66, hp: 1030, atk: 136, def: 82, spd: 37, exp: 1600, money: 1900 }, model: 'boss_darkknight', h: 6.4, lines: ['……ここまで たどりついたか。', 'わが けんは やみに ちかった ほこり。', 'おまえの いしを、この けんで たしかめよう!'], coins: 6500, win: 'してんのう クロガネが みとめてくれた! なかまボール×5 と 6500コインを もらった!', after: 'しろに しずかな ねむりが もどったよ' },
  },
  temple: {
    name: 'ほしの しんでん', groundGain: 1.8, relief: 1.3, hills: 2.5, patch: [['#2a3068', 0.7, false, 46, 4, 10], ['#ffe9a0', 0.4, true, 36, 2, 6]], props: [['deco_armillary', 8, 16, [0.5, 0.9], 8, 55], ['deco_starshard', 16, 30, [0.5, 1.0], 6, 55]],
     lava: [[-22, -18, 9], [26, -14, 7], [-30, 22, 8]], pool: { h: 0.13, s: 0.9, l: 0.6, glow: '#fff0a0' }, fx: { color: '#ffe9a0', n: 180, size: 0.4, dir: 1, speed: [0.2, 0.6], sway: 1.0 },
    sky: '#14183c', fogN: 18, fogF: 120, g0: '#6a74a8', g1: ['#5a6498', '#7680b8', '#838dc4', '#4e5890'], bg: 'battle_temple.webp',
    light: { hemi: [0xe4e8ff, 0x555c88, 1.35], sun: [0xffe8b0, 1.9] }, zd: ['#6a78c0cc', '#5a68b0aa', '#5a68b000'], tint: [[0.7, 0.9], [0.8, 1.0], [1.4, 1.7]],
    zones: [[10, -6, 8], [22, -32, 9], [-8, -42, 8], [30, 10, 7], [-34, 0, 7], [2, 26, 7]],
    trees: [['deco_armillary', 18, 26, [1.6, 2.8], 12, 72], ['deco_starshard', 20, 30, [1.8, 3.0], 20, 76]],
    wild: [['shinju_unicorn', 2], ['shinju_pegasus', 2], ['legend_hoshiryu', 1], ['legend_shinpan', 1], ['mame_chin_heaven', 2], ['mame_chin_magic', 2], ['majin_madoushi', 1], ['majo_chin', 1], ['majutsusho', 1], ['majutsusho_2', 1], ['lamp_no_sei', 2], ['kumo_hitsuji_2', 1], ['tenshi_chin', 1], ['kitsune_ko_3', 1], ['kagami_ko', 1], ['mame_chin', 1], ['houki_ko', 1], ['houki_ko_2', 1], ['suzu_sei', 1], ['omocha_mahou', 1], ['kantera_bito', 1], ['kage_bouzu', 1], ['yoru_kage', 1], ['goro_kyojuu', 1], ['daichi_madoromi', 1], ['hikari_kishi', 1], ['sei_kishi', 1], ['tenkuu_shugoshin', 1], ['maboroshi_yomi', 1]], scale: { lv: 4, hp: 1.4, atk: 1.4, def: 1.4, spd: 1.2, exp: 2, money: 2 },
    boss: { key: 'temple', x: 0, z: -58, id: 'kami_seikuu', name: 'アストラ', deco: { model: 'deco_armillary', n: 9, r: 7.8, w: 3.6 }, over: { name: 'アストラ', image: 'assets/bosses/temple.webp', level: 72, hp: 1187, atk: 151, def: 91, spd: 41, exp: 2000, money: 2400 }, model: 'boss_stargod', h: 6.6, lines: ['……ほしの めぐりが、あなたを ここへ みちびきました。', 'わたしは そらの うんめいを よむ もの。', 'あなたの みらいを、ここで みせてください。'], coins: 8000, win: 'してんのう アストラが みとめてくれた! なかまボール×5 と 8000コインを もらった!', after: 'しんでんに ほしの ひかりが もどったよ' },
  },
  dragon: {
    name: 'せいりゅうの そら', relief: 2.0, hills: 4, patch: [['#3a7a6a', 0.55, false, 46, 4, 11], ['#e0fff8', 0.4, true, 30, 3, 8]], props: [['deco_water_orb', 16, 30, [0.4, 0.8], 6, 55]],
     lava: [[-22, -18, 9], [26, -14, 7], [-30, 22, 8]], pool: { h: 0.48, s: 0.7, l: 0.5, glow: '#c0fff0' }, fx: { color: '#e0fff8', n: 120, size: 0.3, dir: 0.3, speed: [0.3, 0.8], sway: 3.0, wind: 3 },
    sky: '#bfeadf', fogN: 30, fogF: 170, g0: '#78b0a0', g1: ['#68a090', '#88c4b0', '#98d0bc', '#5c9484'], bg: 'battle_dragon.webp',
    light: { hemi: [0xe0fff4, 0x6a9a90, 1.5], sun: [0xf0fff0, 2.3] }, zd: ['#4a9a8acc', '#3a8a7aaa', '#3a8a7a00'], tint: [[0.6, 0.8], [1.0, 1.2], [0.9, 1.1]],
    zones: [[10, -6, 8], [22, -32, 9], [-8, -42, 8], [30, 10, 7], [-34, 0, 7], [2, 26, 7]],
    trees: [['deco_water_orb', 14, 20, [1.4, 2.2], 14, 74], ['deco_torii', 6, 10, [4.5, 6.5], 20, 76, null, { fit: true }], ['deco_toro', 20, 32, [1.8, 2.8], 14, 74, null, { fit: true }], ['cloud_fluffy', 14, 22, [10, 20], 16, 78, '#ffffff', { fit: true, basic: true, nofog: true, fly: [4, 16] }], ['cloud_long', 5, 8, [18, 32], 30, 82, '#ffffff', { fit: true, basic: true, nofog: true, fly: [7, 20] }]],
    wild: [['dragon', 2], ['shinju_griffon', 2], ['kodai_tengu', 2], ['shinju_murasakiryu', 1], ['legend_houou', 1], ['mame_chin_wind', 2], ['mame_chin_thunder', 2], ['raimushi_3', 1], ['biriunagi_3', 1], ['kaze_chou', 1], ['denki_neko_2', 1], ['mame_chin', 1], ['denchi_risu_2', 1], ['furin_ko_2', 1], ['sora_ryu', 1], ['seikuu_ryuou', 1], ['mitsugo_hydra', 1], ['raimei_hydra', 1], ['shinkai_ryujin', 1]], scale: { lv: 4, hp: 1.4, atk: 1.4, def: 1.4, spd: 1.2, exp: 2, money: 2 },
    boss: { key: 'dragon', x: 0, z: -58, id: 'dragon', name: 'ソウリュウ', over: { name: 'ソウリュウ', image: 'assets/bosses/dragon.webp', level: 78, hp: 1366, atk: 168, def: 102, spd: 45, exp: 2500, money: 3000 }, model: 'boss_dragon', h: 7.0, lines: ['……わらべよ、ここは そらの いただき。', 'わが こえは かみなり、わが いぶきは あらし。', 'そのゆうきが ほんものか、みせてみよ!'], coins: 10000, win: 'してんのう ソウリュウが みとめてくれた! なかまボール×5 と 10000コインを もらった!', after: 'そらに せいりゅうの すがたが ゆうゆうと もどったよ' },
  },
  end: {
    name: 'うちゅうの はて', groundGain: 1.35, relief: 1.6, hills: 3, patch: [['#160c3a', 0.8, false, 56, 4, 11], ['#ff9aff', 0.42, true, 40, 2, 7], ['#8ad0ff', 0.35, true, 30, 2, 6]], props: [['deco_starshard', 24, 44, [0.5, 1.1], 6, 55], ['deco_water_orb', 12, 24, [0.4, 0.8], 8, 55, '#e0b0ff']],
     lava: [[-22, -18, 9], [26, -14, 7], [-30, 22, 8]], pool: { h: 0.8, s: 0.7, l: 0.3, glow: '#ff9aff' }, fx: { color: '#ffd8ff', n: 320, size: 0.5, dir: 1, speed: [0.05, 0.3], sway: 1.5 },
    fx2: { color: '#8ad0ff', n: 200, size: 0.3, dir: 1, speed: [0.3, 0.9], sway: 0.8, h: 4 },
    sky: '#0a0618', fogN: 14, fogF: 100, g0: '#4a3a78', g1: ['#3c2e68', '#5a4690', '#6a54a0', '#30245a'], bg: 'battle_end.webp',
    light: { hemi: [0xf4eef8, 0x60507a, 1.35], sun: [0xffd8ff, 1.8] }, zd: ['#7a5ac0cc', '#6a4ab0aa', '#6a4ab000'], tint: [[0.9, 1.2], [0.6, 0.8], [1.4, 1.8]],
    zones: [[10, -6, 8], [22, -32, 9], [-8, -42, 8], [30, 10, 7], [-34, 0, 7], [2, 26, 7]],
    trees: [['deco_starshard', 38, 56, [1.8, 3.4], 12, 74], ['deco_armillary', 14, 20, [1.8, 3.2], 20, 76], ['deco_water_orb', 14, 20, [1.4, 2.4], 14, 70, '#e0b0ff'], ['deco_star5', 30, 50, [1.5, 3.0], 14, 78, '#ffffff', { fit: true, basic: true, nofog: true, fly: [1, 9] }], ['deco_planet_ring', 6, 10, [8, 15], 34, 80, '#e0b0ff', { fit: true, basic: true, nofog: true, fly: [6, 22] }]],
    wild: [['mame_chin_magic', 2], ['mame_chin_dark', 2], ['mame_chin_heaven', 2], ['mame_chin_kami', 1], ['legend_rasetsuou', 1], ['legend_shinpan', 1]], scale: { lv: 4, hp: 1.4, atk: 1.4, def: 1.4, spd: 1.2, exp: 2, money: 2 },
    boss: { key: 'end', x: 0, z: -58, id: 'mame_chin_kami', name: 'カムイ', deco: { model: 'deco_starshard', n: 9, r: 7.8, w: 3.6 }, patch: 'patch_cosmic', patchW: 18, over: { name: 'カムイ', image: 'assets/bosses/end.webp', level: 90, hp: 1800, atk: 200, def: 120, spd: 55, exp: 5000, money: 6000 }, model: 'final_ultimate', h: 7.4, lines: ['……ついに ここまで きたのですね、ちいさな ぼうけんしゃ。', 'わたしは すべての ほしを うんだ もの。', 'あなたと なかまの きずなを、さいごに ためします!'], coins: 20000, win: 'してんのう カムイが みとめてくれた! なかまボール×5 と 20000コインを もらった!', after: 'うちゅうに あたらしい ほしが うまれたよ' },
  },
  lake: {
    name: 'みずうみの ほとり', groundRep: 34, patch: [['#3e7a4a', 0.45, false, 36, 4, 9]], props: [['deco_ice_crystal', 14, 26, [0.45, 0.9], 8, 55]],
     fx: { color: '#ffffff', n: 200, size: 0.3, dir: -1, speed: [0.8, 1.6], sway: 0.5, blend: 'normal' },
    sky: '#a6d6ee', g0: '#6aa04a', g1: ['#5a9444', '#86b858', '#74a84e', '#a0c868'], bg: 'battle_water.webp', lake: { x: -26, z: -16, r: 17 },
    zones: [[12, -8, 8], [22, -32, 9], [-6, -42, 8], [28, 10, 7], [-32, 14, 8], [4, 24, 7]],
    trees: [['deco_reed', 70, 110, [1.2, 2.2], 14, 74, null, { fit: true }], ['deco_rock_smooth', 24, 40, [0.5, 1.2], 14, 76, null, { fit: true }], ['deco_ice_crystal', 14, 22, [1.4, 2.6], 18, 76, null, { fit: true }]],
    wild: [['slime_2', 3], ['aodori_2', 3], ['kujira_ko', 3], ['slime', 2], ['aodori', 2], ['fukurou_ko', 2], ['mitsubachi', 1], ['slime_3', 1], ['biriunagi', 2], ['biriunagi_2', 1], ['hikari_kame', 1], ['furebu_mizu', 1], ['furebu_mizu_2', 1], ['kurage_ko', 2], ['kurage_ko_2', 1], ['mitsugo_hebi', 1], ['mitsugo_hydra', 1], ['umihebi_ko', 2], ['namino_kairyu', 1], ['kora_rakko', 2], ['yume_no_ko', 1]], scale: { lv: 6, hp: 1.5, atk: 1.4, def: 1.4, spd: 1.2, exp: 1.5, money: 1.5 },
    boss: { key: 'lake', x: 16, z: -58, deco: { model: 'deco_ice_crystal', n: 9, r: 7.5, w: 3.4 }, id: 'yeti', name: 'ブリザ', over: { name: 'ブリザ', image: 'assets/bosses/lake.webp', level: 19, hp: 200, atk: 34, def: 20, spd: 14, exp: 240, money: 280 }, model: 'boss_lake', h: 5.8, lines: ['……さむい かぜが ふいてきたな。', 'このみずうみは わたしの すみか。ふみあらす ものは かえさん。', 'こおりのように つめたい わたしを、おまえの なかまは とかせるか?'], coins: 500, win: 'ぬし ブリザが みとめてくれた! なかまボール×5 と 500コインを もらった!', after: 'みずうみに へいわが もどったよ' },
  },
};
FIELDS.sun.flyers = { flare: 28, spurt: 3 };   // たいよう: フレアの 火の玉が とびかう + 溶岩のふんしゅつ
FIELDS.temple.flyers = { meteor: 7, flare: 18, colors: ['#d8e8ff', '#7aa8ff', '#080c30'], speed: 0.5, A: [3, 8], B: [2, 6], h0: [1.5, 5], size: [0.25, 0.55] };   // ほしの しんでん: ながれぼし + ほしの ちり
FIELDS.ghost.flyers = { flare: 24, colors: ['#c8f4ff', '#58b8e8', '#04101c'], speed: 0.4, A: [2, 6], B: [0.8, 2.5], h0: [0.6, 2.2], size: [0.35, 0.8] };   // ゆうれいの はかば: ふわふわ ひとだま
FIELDS.volcano.flyers = { flare: 0, spurt: 6 };   // ようがんやま: 溶岩の池から 溶岩の かたまりが ふきあがる

// ---- シリーズ「月」: おなじ 12だんかいの ぶたいを、よるの せかい(ルナリア)の ないように きりかえる ----
// きまり: キー(forest…end)は おなじ。なまえ・けしき・やせい・ぬしの ことばだけ さしかえる。じゅんじ ふやしていく
const MOON_SKIN = {
  forest: {
    name: 'つきみの はら', sky: '#22385e', fogN: 22, fogF: 100, g0: '#4a7a6a', g1: ['#3f6f62', '#5a8a74', '#4e8068', '#6a9a7c'],
    light: { hemi: [0xc8d8ff, 0x3a4a5e, 1.15], sun: [0xbcd0ff, 1.5] },
    fx: { color: '#fff4b0', n: 90, size: 0.3, dir: 1, speed: [0.05, 0.3], sway: 1.2 },
    wild: [['tsukiusa', 4], ['hoshifuku', 3], ['yumehitsuji', 3], ['hoshi_usagi', 3], ['fukurou_ko', 3], ['kumo_hitsuji', 2], ['yume_no_ko', 2], ['mitsubachi', 1], ['watage', 1], ['chin_kusa', 1]],
    boss: { name: 'ツキミノ', over: { name: 'ツキミノ' }, lines: ['……よい つきよだ。', 'つきあかりの したで きたえた なかまと いっしょなら、わたしを みとめよう。', 'さあ、かかってこい! HPと かいふくの たべものは じゅんびできたか?'], win: 'ぬし ツキミノが みとめてくれた! なかまボール×5 と 300コインを もらった!', after: 'つきみの はらに へいわが もどったよ' },
    gym: '月みの ジム',
  },
};
// のこりの だんかい: なまえ・ぬしの なまえ・やせいの おいかけを さしかえる(けしきは よるの ひかりで ぜんぶ きりかわる)
const MOON_NAMES2 = {
  lake: ['かがみの みずうみ', 'ミカゲ', 'みずうみに つきが うつったよ', [['tsukiusa_2', 1], ['hoshifuku', 1]]],
  volcano: ['あかつきの かざん', 'アカツチ', 'かざんに あかい つきが のぼったよ', [['tsukiusa_2', 1], ['yumehitsuji_2', 1]]],
  ghost: ['かげぼうしの はか', 'クラヤミ', 'はかばに しずけさが もどったよ', [['yumehitsuji_2', 2], ['hoshifuku_2', 1]]],
  sky: ['くもの うえの たかだい', 'ウンカイ', 'たかだいに ほしぞらが もどったよ', [['hoshifuku_2', 2], ['tsukiusa_2', 1]]],
  sun: ['ほしすなの さばく', 'スナボシ', 'さばくに ひんやりした かぜが ふいたよ', [['tsukiusa_2', 1], ['hoshifuku_2', 1]]],
  cosmos: ['ほしの うみべ', 'シオサイ', 'うみべに なみおとが もどったよ', [['yumehitsuji_2', 1], ['hoshifuku_2', 1]]],
  grove: ['ほたるの もり', 'ホタルビ', 'もりに ひかりの つぶが もどったよ', [['tsukiusa_2', 2], ['yumehitsuji_2', 1]]],
  castle: ['かげの しろ', 'カゲロウ', 'しろに しずかな ねむりが もどったよ', [['yumehitsuji_3', 1], ['hoshifuku_3', 1]]],
  temple: ['つきの しんでん', 'ゲツレイ', 'しんでんに つきの ひかりが もどったよ', [['tsukiusa_3', 1], ['hoshifuku_3', 1]]],
  dragon: ['とけいとうの まち', 'ハグルマ', 'まちの とけいが うごきだしたよ', [['hoshifuku_3', 1], ['yumehitsuji_3', 1]]],
  end: ['ほしうみの おわり', 'シンゲツ', 'ほしうみに あたらしい つきが うまれたよ', [['tsukiusa_3', 1], ['yumehitsuji_3', 1], ['hoshifuku_3', 1]]],
};
for (const [k, [name, boss, after, add]] of Object.entries(MOON_NAMES2)) MOON_SKIN[k] = { name, wildAdd: add, boss: { name: boss, over: { name: boss }, after } };
const MOON_LINES = {
  lake: ['……みずうみに つきが うつっているだろう。', 'しずかな みなもほど、ふかい ものだ。きみの こころは どうだ?', 'さあ、なみを たてて みせろ! HPと かいふくの たべものは じゅんびできたか?'],
  volcano: ['……あかい つきが のぼると、やまは めを さます。', 'あつい たたかいを のぞむなら、わたしが あいてに なろう。', 'ひなんは ここまでだ。ぜんりょくで こい!'],
  ghost: ['……よなかの はかばに よく きたな。', 'かげは、あかりが あるから うまれる。きみの あかりを みせてみろ。', 'こわがるな。たたかいの あとは しずかな ねむりが まっている。'],
  sky: ['……ここは くもの うえ。ほしが てに とどく ばしょだ。', 'たかい ところは かぜが つよい。ふきとばされないよう たえてみせろ。', 'そらの たたかいに、ひきかえす みちは ないぞ!'],
  sun: ['……ひるの あつさが うそのような すなの よるだ。', 'ほしを かぞえる ちからが あるか、ためさせて もらおう。', 'さあ、すなけむりの なかで たたかおう!'],
  cosmos: ['……よるの うみは、ほしの かけらで できている。', 'なみの おとが きこえるか? それが わたしの こどうだ。', 'しおが みちる まえに、わたしを こえて ゆけ!'],
  grove: ['……ほたるが みちを てらして くれたようだな。', 'もりの ひかりは ちいさくても あたたかい。きみの なかまも そうか?', 'さあ、ひかりの なかで ちからを みせてくれ!'],
  castle: ['……かげの しろへ よく たどりついた。わたしは してんのうの ひとり。', 'ここから さきは、なまはんかな ちからでは とおれない。', 'ぜんりょくで こい。わたしも ぜんりょくで あいてを しよう!'],
  temple: ['……つきの しんでんへ ようこそ。まんげつの ひかりが きみを てらしている。', 'わたしは ひかりに つかえる してんのう。まよいは すてなさい。', 'さあ、つきの ひかりに いのりを こめて たたかおう!'],
  dragon: ['……とけいの はりが ときを きざんでいる。ここは ときの まちだ。', 'ときは だれにも もどせない。だから いまを ぜんりょくで いきるのだ。', 'さあ、いくぞ! ときの かべを こえて みせろ!'],
  end: ['……よくぞ ここまで きた。ぼうけんしゃよ。', 'しんげつの よるは、すべての はじまりで おわり。わたしは さいごの かべだ。', 'きみと なかまの すべてを かけて、わたしに むかって こい!'],
};
for (const [k, l] of Object.entries(MOON_LINES)) if (MOON_SKIN[k]) MOON_SKIN[k].boss.lines = l;
function skinText(F, sk) { const old = F.boss.name; if (sk.boss && sk.boss.name && !sk.boss.win && F.boss.win) sk.boss.win = F.boss.win.replace(old, sk.boss.name); }

// 「月」シリーズ: ぬし いがいの トレーナーの せりふ(ばしょごとに 3にんぶん)。{n}=トレーナーの なまえ
export const MOON_TRAINER_LINES = {
  forest: [['やあ! いい つきよだね。', 'ぼくの なかまと しょうぶしよう!', 'つよいね! つきに ねがって きたえておくよ。'], ['おだんごを たべながら ぼうけん中なんだ。', 'しょうぶで おなかを すかせよう!', 'まけた…。おだんご わけてあげる。'], ['つきあかりの したで たたかうと ちからが わくんだ。', 'さあ、いくよ!', 'いい しょうぶだった。また あおうね。']],
  lake: [['みなもに うつる つきを みていたんだ。', 'じゃまするなら しょうぶだよ!', 'きみの なかま、すてきだね。'], ['この みずうみ、よるは かがみみたいだろ?', 'ぼくの なかまも きれいだよ。しょうぶ!', 'あれ? ぼくの ほうが うつりが わるかったな。'], ['しずかに しょうぶを しよう。', 'なみを たてないでね!', 'しずかな ぼくも まけると くやしいな。']],
  volcano: [['あかい つきの よるは からだが ほてるよ。', 'ひを つけられたく なかったら しょうぶだ!', 'あつい しょうぶだった! またね!'], ['ここの ねつを あびて きたえてるんだ。', 'ぼくの なかまは あつくるしいぞ!', 'くっ…。もっと きたえなきゃ。'], ['よるの かざんは きれいだろ?', 'みとれてる ばあいじゃ ないよ。しょうぶだ!', 'つよいな。ぬしにも かてるかもね。']],
  ghost: [['しっ…。かげが うごいたよ。', 'みつかったからには しょうぶだ!', 'ふふ…。おどろかせて ごめんね。'], ['こわく ないよ。ぼくの なかまが ついてる。', 'いくよ! まけないぞ!', 'こわかった…。きみの ほうが つよいよ。'], ['まよいみちで あいてを さがしてたんだ。', 'ちょうど よかった! しょうぶしよう!', 'おつかれさま。あかりを ありがとう。']],
  sky: [['たかい ところは きもちいいね。', 'ほしに いちばん ちかい しょうぶを しよう!', 'ひゃあ、おちるかと おもった!'], ['くもの うえで ひるね してたのに…。', 'おこしたんだから しょうぶだよ!', 'いい ゆめを みそこなったよ。ふふ。'], ['かぜが つよいね! たおれないでよ?', 'いくぞ! ふっとばしてやる!', 'かぜに まけた…。たいした もんだ。']],
  sun: [['ひるの あつさが うそみたいだ。', 'こおる まえに しょうぶで あたたまろう!', 'あたたまったよ。ありがとう!'], ['ほしを かぞえてたら ひとりぼっちで さみしくて。', 'しょうぶして くれる?', 'たのしかった! また かぞえよう。'], ['すなの したに おたからが あるらしいよ。', 'しょうぶに かったら おしえるよ!', 'おたから? あれは うそだよ。ごめん。']],
  cosmos: [['なみおとを きいてると ねむくなるね。', 'ねむけざましに しょうぶだ!', 'めが さめたよ。ありがとう!'], ['しおが ひく まえに しょうぶを おわらせよう。', 'いそいで いくよ!', 'まにあったね。いい しょうぶだった。'], ['ほしが うみに おちた ばしょを さがしてるんだ。', 'みつける まえに しょうぶだ!', 'みつからなかったけど たのしかった。']],
  grove: [['ほたるが みちを てらして くれるんだ。', 'あかりの なかで しょうぶしよう!', 'あたたかい しょうぶだったね。'], ['もりの おくは ふしぎな ひかりで いっぱいだよ。', 'ひかりに まけない ちからを みせて!', 'まぶしかった! まいったよ。'], ['ここで きみを まっていたんだ。', 'ぼくの なかまが うずうずしてる! いくよ!', 'ありがとう。もっと つよく なれそうだ。']],
  castle: [['ここは かげの しろ。かるい きもちで きては いけない。', 'わたしと しょうぶを してもらおう。', '……みごとだ。さきへ すすみなさい。'], ['かげの なかに いると こころが しずまるよ。', 'こころを みだしたら まけるよ!', 'こころが ぶれたのは ぼくだった…。'], ['けいびの おしごと中だ。', 'とおりたいなら ちからを しめせ!', 'とおって よし。きをつけて。']],
  temple: [['つきの ひかりは こころを きよめる。', 'さあ、きみの こころを みせてごらん。', 'きよらかな しょうぶだった。'], ['しんでんでは いのりが ちからになるんだ。', 'ぼくの いのりを うけてみろ!', 'いのりが とどかなかったな…。'], ['まんげつの よるは とくべつだよ。', 'とくべつな しょうぶを しよう!', 'すばらしい! ひかりが きみを まもるよ。']],
  dragon: [['とけいの はりは もどせないんだよ。', 'だから いまを ぜんりょくで しょうぶだ!', 'いい しょうぶだった。じかんを わすれたよ。'], ['はぐるまが まわる おとが すきなんだ。', 'ぼくの なかまも まわるぞ!', 'まわりすぎた…。めが まわる〜。'], ['ときの まちへ ようこそ。', 'あんない ついでに しょうぶだ!', 'いい たびを ね。ぬしは つよいよ。']],
  end: [['ここが ほしうみの おわり…。', 'さいごの たたかいの まえに ちからを みせて!', 'きみなら きっと だいじょうぶだ。'], ['しんげつの よるは すべてが しずまるね。', 'しずけさを やぶる しょうぶだ!', 'しずかに おうえんしてるよ。'], ['ぼうけんの おわりが ちかいね。', 'おもいでづくりに しょうぶしよう!', 'いい おもいでに なったよ。ありがとう!']],
};
export function applySeriesSkin(series) {
  if (series !== 's2') return;
  for (const [k, sk] of Object.entries(MOON_SKIN)) {
    const F = FIELDS[k]; if (!F) continue;
    skinText(F, sk); const { boss, gym, wildAdd, ...rest } = sk; Object.assign(F, rest); if (wildAdd) F.wild = [...F.wild, ...wildAdd]; if (MOON_WILD[k]) F.wild = [...F.wild, ...MOON_WILD[k]];
    if (boss) { const { over, ...b } = boss; Object.assign(F.boss, b); if (over) F.boss.over = { ...F.boss.over, ...over }; }
  }
}
try { const m = (localStorage.getItem('chinchilla-ranch-active') || '').match(/^([a-z0-9]+):/); if (m) applySeriesSkin(m[1]); } catch { /* むし */ }

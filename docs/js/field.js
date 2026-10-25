// そとの マップ「はじまりの もり」(軽い3Dマップ)。むらとは別ページ=別メモリ。草むらを歩くとバトルになる。
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { input, pollInput, setupInput } from './input.js';
import { ui } from './ui.js';
import { ECO, state, load, save, bus, count, addItem } from './state.js';
import { sfx, unlockAudio } from './audio.js';
import { lawnKit } from './world.js';
import { BADGES, DAY_SECONDS, DROP_BY_ELEMENT, ITEMS, HEAL, EVO_STONES } from './data.js';
import { playBgm } from './bgm.js';
import { runBattle, markCaught, giveStarter, giveMon, healParty, questData, assistOn } from './battle.js';

const $ = (s) => document.querySelector(s);
const V3 = THREE.Vector3;
const params = new URLSearchParams(location.search);
const isTouch = matchMedia('(pointer:coarse)').matches || params.has('touch');
document.body.classList.toggle('touch', isTouch);
let seed = 4242; const rnd = () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const R = (a, b) => a + (b - a) * rnd();
const lam = (k, dt) => 1 - Math.exp(-k * dt);

// ---- フィールドの しゅるい(?f=lake で みずうみ)。1ページ=1マップ ----
const FIELDS = {
  forest: {
    name: 'はじまりの もり', groundRep: 34, patch: [['#2f6a2a', 0.5, false, 40, 4, 9], ['#d8e070', 0.28, false, 24, 3, 7]],
     fx: { color: '#f4ff9a', n: 70, size: 0.28, dir: 1, speed: [0.05, 0.3], sway: 1.2 },
    sky: '#b9d8d0', g0: '#5f9a44', g1: ['#4f8a3a', '#79ad52', '#6a9e46', '#8dbb5c'], bg: 'battle_forest.webp',
    zones: [[-16, -6, 8], [14, -22, 9], [-8, -34, 8], [22, 4, 7], [-6, -44, 8]],
    trees: [['pine_far', 110, 170, [4.6, 7], 14, 78], ['birch', 24, 40, [3.0, 4.4], 14, 70]],
    wild: [['slime', 3], ['aodori', 3], ['dokukinoko', 2], ['mogura', 3], ['komori', 3], ['hinotama', 2], ['saboten', 2], ['katatsumuri', 1], ['fukurou_ko', 1], ['mitsubachi', 1], ['mame_chin', 1], ['hone_kenshi', 1], ['koyurei', 1], ['raichou_ko', 1], ['watage', 1], ['tsubame_ko', 1], ['raimushi', 2]],
    boss: { key: 'forest', x: 0, z: -58, id: 'shokujinsou_2', sprite: 'shokujinsou_2', patch: 'boss_patch', patchW: 15, name: 'もりの ぬし', over: { name: 'もりの ぬし', image: 'assets/bosses/forest.webp', level: 11, hp: 105, atk: 22, def: 15, spd: 9, exp: 110, money: 160 }, model: 'boss_forest', h: 5.0, lines: ['……ここは わたしの もりだ。', 'くさむらで きたえた なかまと いっしょなら、わたしを みとめよう。', 'さあ、かかってこい! HPと かいふくの たべものは じゅんびできたか?'], coins: 300, win: 'もりの ぬしが みとめてくれた! なかまボール×5 と 300コインを もらった!', after: 'もりに へいわが もどったよ' },
  },
  volcano: {
    name: 'ようがんやま', groundGain: 0.85, relief: 1.7, hills: 3.5, patch: [['#1a100c', 0.8, false, 50, 4, 10], ['#ff6a1a', 0.45, true, 36, 2, 6]], props: [['deco_lava_rock', 30, 55, [0.5, 1.1], 6, 60]],
     sky: '#6e3a30', fogN: 20, fogF: 105, g0: '#4a3830', g1: ['#3c2c26', '#5a443a', '#6a4e40', '#2e2420'], bg: 'battle_volcano.webp',
    light: { hemi: [0xffc8a0, 0x5a2a20, 1.15], sun: [0xff9a60, 2.1] }, zd: ['#7a3a1acc', '#8a4a22aa', '#8a4a2200'], tint: [[1.6, 1.9], [0.75, 0.95], [0.5, 0.7]],
    lava: [[-22, -18, 9], [26, -14, 7], [-30, 22, 8]], fx: { color: '#ff9a3a', n: 240, size: 0.5, dir: 1, speed: [0.8, 2.2], sway: 0.4 },
    zones: [[10, -6, 8], [22, -32, 9], [-8, -42, 8], [30, 10, 7], [-34, 0, 7], [2, 26, 7]],
    trees: [['deco_lava_rock', 40, 64, [1.7, 3.4], 12, 74], ['deco_lava_rock', 20, 30, [3.6, 5.4], 26, 76]],
    wild: [['hinotama_2', 3], ['mogura_2', 3], ['hone_kenshi_2', 2], ['komori_2', 2], ['koyurei_2', 2], ['hinotama_3', 1], ['iwa_golem', 1], ['raimushi_2', 1], ['raimushi_3', 1], ['hono_tanuki', 1], ['ringo_ko', 2], ['dango_mushi', 1], ['kitsune_ko', 1], ['denki_neko', 1], ['fuusen_ko', 1], ['hono_tanuki', 2], ['hono_tanuki_2', 2], ['hono_tanuki_3', 1], ['dango_mushi_2', 1], ['mike_hi', 1], ['mike_hi_2', 1], ['houki_ko', 1], ['denchi_risu', 1], ['furin_ko', 1], ['tako_ko', 1], ['donguri_robo', 1], ['suna_kai', 1], ['donguri_robo', 1], ['donguri_robo_2', 1], ['iwagoro', 1], ['gankou_goro', 1], ['wakagi_shika', 1], ['mori_shika', 1], ['toki_no_yousei', 1]], scale: { lv: 5, hp: 1.5, atk: 1.4, def: 1.4, spd: 1.2, exp: 1.5, money: 1.5 },
    boss: { key: 'volcano', x: 0, z: -58, id: 'yougan_golem', name: 'ようがんの ぬし', deco: { model: 'deco_lava_rock', n: 9, r: 7.8, w: 4.2 }, over: { name: 'ようがんの ぬし', image: 'assets/bosses/volcano.webp', level: 26, hp: 302, atk: 52, def: 32, spd: 15, exp: 340, money: 420 }, model: 'boss_volcano', h: 6.6, lines: ['グゴゴゴ……だれだ、わしの ねむりを さまたげるのは。', 'ここは ようがんが ふきだす やま。よわい ものは すぐに やけてしまうぞ。', 'おまえたちの ちからを みせてみろ!', ], coins: 800, win: 'ようがんの ぬしが みとめてくれた! なかまボール×5 と 800コインを もらった!', after: 'ようがんやまに へいわが もどったよ' },
  },
  ghost: {
    name: 'ゆうれいの はかば', groundGain: 2.6, relief: 1.5, hills: 2.5, patch: [['#1e1c32', 0.8, false, 50, 4, 10], ['#6affc8', 0.28, true, 30, 2, 6]], props: [['deco_ghost_lantern', 14, 24, [0.7, 1.1], 8, 55]],
     fx: { color: '#9affd8', n: 120, size: 0.6, dir: 1, speed: [0.2, 0.7], sway: 1.2 },
    sky: '#2c2a46', fogN: 14, fogF: 85, g0: '#5a5878', g1: ['#4c4a68', '#66647f', '#706e8c', '#3e3c58'], bg: 'battle_ghost.webp',
    light: { hemi: [0xc8c8f0, 0x4a4468, 1.0], sun: [0xb8c0ff, 1.5] }, zd: ['#4a3a7acc', '#3e3270aa', '#3e327000'], tint: [[0.55, 0.75], [0.6, 0.8], [1.2, 1.5]],
    zones: [[10, -6, 8], [22, -32, 9], [-8, -42, 8], [30, 10, 7], [-34, 0, 7], [2, 26, 7]],
    trees: [['deco_ghost_lantern', 22, 34, [2.0, 3.0], 12, 70], ['pine_far', 40, 70, [4.4, 6.6], 20, 78, '#2a2638']],
    wild: [['koyurei_2', 4], ['hone_kenshi_2', 4], ['komori_2', 3], ['koyurei_3', 1], ['hone_kenshi_3', 1], ['kage_bouzu', 1], ['yoru_kage', 1], ['maboroshi_yomi', 1]], scale: { lv: 6, hp: 1.6, atk: 1.5, def: 1.5, spd: 1.3, exp: 1.6, money: 1.6 },
    boss: { key: 'ghost', x: 0, z: -58, id: 'yurei_ou', name: 'ゆうれいの ぬし', deco: { model: 'deco_ghost_lantern', n: 9, r: 7.8, w: 3.4 }, over: { name: 'ゆうれいの ぬし', image: 'assets/bosses/ghost.webp', level: 33, hp: 381, atk: 63, def: 39, spd: 19, exp: 480, money: 560 }, model: 'boss_ghost', h: 6.0, lines: ['ふふふ……よく ここまで きたね、いきている ものよ。', 'ここは ねむれぬ たましいが あつまる はかば。', 'わたしを ちっそくさせられるか、ためして あげよう……'], coins: 1200, win: 'ゆうれいの ぬしが みとめてくれた! なかまボール×5 と 1200コインを もらった!', after: 'はかばに しずけさが もどったよ' },
  },
  sky: {
    name: 'てんくうの はら', groundGain: 0.8, relief: 1.4, hills: 3.5, patch: [['#ffffff', 0.55, false, 40, 5, 12], ['#ffe8a0', 0.35, true, 30, 3, 8]], props: [['deco_starshard', 20, 40, [0.5, 1.0], 6, 55]],
     lava: [[-22, -18, 9], [26, -14, 7], [-30, 22, 8]], pool: { h: 0.55, s: 0.6, l: 0.78, glow: '#ffffff' }, fx: { color: '#fff2b0', n: 140, size: 0.4, dir: 1, speed: [0.2, 0.6], sway: 1.0 },
    sky: '#f4dcc8', fogN: 30, fogF: 160, g0: '#a8c890', g1: ['#98c088', '#bcd89c', '#c8dca4', '#a8ccb0'], bg: 'battle_sky.webp',
    light: { hemi: [0xfff0e0, 0xb8a8c8, 1.5], sun: [0xffe8c0, 2.4] }, zd: ['#e8d890cc', '#dcd098aa', '#dcd09800'], tint: [[1.0, 1.2], [1.0, 1.15], [0.8, 1.0]],
    zones: [[12, -8, 8], [22, -32, 9], [-6, -42, 8], [28, 10, 7], [-32, 14, 8], [4, 24, 7]],
    trees: [['deco_starshard', 24, 36, [2.0, 3.2], 12, 70], ['birch', 30, 50, [3.0, 4.4], 16, 72]],
    wild: [['mame_chin_heaven', 2], ['shinju_pegasus', 2], ['shinju_unicorn', 1], ['mitsubachi', 2], ['mame_chin_magic', 2], ['mame_chin_thunder', 1], ['raichou_ko', 1], ['watage', 1], ['tsubame_ko', 1], ['kaze_chou', 1], ['kumo_hitsuji', 1], ['kitsune_ko_2', 1], ['denki_neko', 1], ['fuusen_ko', 2], ['hikari_kame', 1], ['denchi_risu', 1], ['hoshi_usagi', 1], ['niji_hato', 1], ['furin_ko', 1], ['furin_ko_2', 1], ['tako_ko', 1], ['chibi_ryu', 1], ['sora_ryu', 1], ['nari_kami', 1]], scale: { lv: 6, hp: 1.7, atk: 1.6, def: 1.6, spd: 1.4, exp: 1.7, money: 1.7 },
    boss: { key: 'sky', x: 0, z: -58, id: 'shinju_pegasus', name: 'てんくうの ぬし', deco: { model: 'deco_starshard', n: 9, r: 7.8, w: 3.4 }, over: { name: 'てんくうの ぬし', image: 'assets/bosses/sky.webp', level: 40, hp: 482, atk: 76, def: 48, spd: 23, exp: 700, money: 800 }, model: 'boss_celestial', h: 6.2, lines: ['……ほしの ひかりに みちびかれて きたのですね。', 'ここは そらに いちばん ちかい はら。', 'ちからと きずなを、わたしに みせてください。'], coins: 2000, win: 'てんくうの ぬしが みとめてくれた! なかまボール×5 と 2000コインを もらった!', after: 'てんくうに ひかりが もどったよ' },
  },
  sun: {
    name: 'たいようの はら', relief: 1.5, hills: 3, patch: [['#1a100c', 0.8, false, 50, 4, 10], ['#ff6a1a', 0.45, true, 36, 2, 6]], props: [['deco_lava_rock', 30, 55, [0.5, 1.1], 6, 60]],
     sky: '#f6c878', fogN: 22, fogF: 130, g0: '#7a5230', g1: ['#6a4528', '#8a6038', '#9a6c3c', '#5a3a22'], fx: { color: '#ff9a3a', n: 320, size: 0.5, dir: 1, speed: [0.8, 2.2], sway: 0.4 },
    lava: [[-22, -18, 9], [26, -14, 7], [-30, 22, 8]], bg: 'battle_sun.webp',
    light: { hemi: [0xffe0a0, 0x8a5a30, 1.5], sun: [0xffc070, 2.4] }, zd: ['#e8b040cc', '#d8a040aa', '#d8a04000'], tint: [[1.3, 1.6], [1.0, 1.25], [0.5, 0.7]],
    zones: [[10, -6, 8], [22, -32, 9], [-8, -42, 8], [30, 10, 7], [-34, 0, 7], [2, 26, 7]],
    trees: [['deco_lava_rock', 24, 36, [1.6, 3.0], 12, 74], ['birch', 14, 20, [3.0, 4.4], 20, 76, '#3a2418']],
    wild: [['hinotama_3', 3], ['saboten_3', 2], ['kodai_kyubi', 1], ['kodai_oni', 2], ['kodai_kitsunemen', 2], ['shinju_reishishi', 1], ['aodori_3', 2], ['kumo_hitsuji', 1], ['kumo_hitsuji_2', 1], ['tenshi_chin', 1], ['kitsune_ko', 1], ['kitsune_ko_2', 1], ['hikari_kame', 1], ['hoshi_usagi', 1], ['hoshi_usagi_2', 1], ['niji_hato', 1], ['chibi_ryu', 1], ['hikari_kishi', 1], ['sei_kishi', 1], ['yume_no_ko', 1]], scale: { lv: 4, hp: 1.4, atk: 1.4, def: 1.4, spd: 1.2, exp: 2, money: 2 },
    boss: { key: 'sun', x: 0, z: -58, id: 'legend_houou', name: 'たいようの ぬし', deco: { model: 'deco_lava_rock', n: 9, r: 7.8, w: 3.6 }, over: { name: 'たいようの ぬし', image: 'assets/bosses/sun.webp', level: 47, hp: 605, atk: 91, def: 56, spd: 27, exp: 800, money: 900 }, model: 'boss_phoenix_b', h: 6.6, lines: ['……あたたかい ひかりに ひかれて きたのですね。', 'わたしは たいようの ひを まもる もの。', 'ほのおの ちからを うけとめられるか、みせてください!'], coins: 3000, win: 'たいようの ぬしが みとめてくれた! なかまボール×5 と 3000コインを もらった!', after: 'たいようの はらに あたたかさが もどったよ' },
  },
  cosmos: {
    name: 'うちゅうの うみ', groundGain: 1.25, relief: 1.2, hills: 2, patch: [['#0a1238', 0.8, false, 46, 4, 11], ['#6a9aff', 0.4, true, 36, 2, 7]], props: [['deco_water_orb', 20, 40, [0.4, 0.9], 6, 55]],
     lava: [[-22, -18, 9], [26, -14, 7], [-30, 22, 8]], pool: { h: 0.62, s: 0.8, l: 0.28, glow: '#6a9aff' }, fx: { color: '#bfe0ff', n: 220, size: 0.35, dir: 1, speed: [0.05, 0.25], sway: 2.0 },
    sky: '#1c2a5e', fogN: 16, fogF: 110, g0: '#3a4478', g1: ['#2e3868', '#46528a', '#505e98', '#262e58'], bg: 'battle_cosmos.webp',
    light: { hemi: [0xe0e8ff, 0x5a6088, 1.35], sun: [0x9ab8ff, 1.7] }, zd: ['#4a62b0cc', '#3a52a0aa', '#3a52a000'], tint: [[0.55, 0.8], [0.8, 1.0], [1.5, 1.9]],
    zones: [[10, -6, 8], [22, -32, 9], [-8, -42, 8], [30, 10, 7], [-34, 0, 7], [2, 26, 7]],
    trees: [['deco_water_orb', 20, 30, [1.6, 2.6], 12, 74], ['pine_far', 20, 40, [4.4, 6.6], 24, 80, '#26346a']],
    wild: [['kodai_yukionna', 2], ['kodai_biwanushi', 2], ['kodai_kappabouzu', 2], ['shinju_kamezan', 2], ['legend_hyoketsuhime', 1], ['mame_chin_water', 2], ['lamp_no_sei', 1], ['kurage_ko_2', 1], ['hoshi_usagi_2', 1], ['kantera_bito', 1], ['raimei_hydra', 1], ['daichi_madoromi', 1], ['umihebi_ko', 1], ['namino_kairyu', 1], ['shinkai_ryujin', 1], ['tenkuu_shugoshin', 1]], scale: { lv: 4, hp: 1.4, atk: 1.4, def: 1.4, spd: 1.2, exp: 2, money: 2 },
    boss: { key: 'cosmos', x: 0, z: -58, id: 'legend_hoshikujira', name: 'うちゅうの ぬし', deco: { model: 'deco_water_orb', n: 9, r: 7.8, w: 3.6 }, over: { name: 'うちゅうの ぬし', image: 'assets/bosses/cosmos.webp', level: 54, hp: 728, atk: 106, def: 65, spd: 31, exp: 1000, money: 1100 }, model: 'boss_whale', h: 6.0, lines: ['…………(ふかく ひびく うたごえ)', 'ここは ほしぼしが ながれる うみ。', 'わたしの うたを きいて、まだ たっていられるかな?'], coins: 4000, win: 'うちゅうの ぬしが みとめてくれた! なかまボール×5 と 4000コインを もらった!', after: 'うちゅうの うみに うたごえが ひびくよ' },
  },
  grove: {
    name: 'しんじゅの いせき', groundGain: 0.85, relief: 1.3, hills: 2, patch: [['#2e6a3a', 0.6, false, 46, 4, 10], ['#d8f8a8', 0.35, true, 30, 3, 7]], props: [['deco_pillar_vine', 16, 30, [0.5, 1.0], 6, 55]],
     lava: [[-22, -18, 9], [26, -14, 7], [-30, 22, 8]], pool: { h: 0.42, s: 0.6, l: 0.35, glow: '#a0ffc8' }, fx: { color: '#b8f07a', n: 100, size: 0.35, dir: -1, speed: [0.4, 0.9], sway: 1.0, blend: 'normal' },
    sky: '#cfe8c8', fogN: 26, fogF: 140, g0: '#7aa860', g1: ['#6a9a52', '#90bc66', '#a0c872', '#5c8a46'], bg: 'battle_grove.webp',
    light: { hemi: [0xf0ffe0, 0x7a9a60, 1.5], sun: [0xf4ffd0, 2.3] }, zd: ['#5a9a3acc', '#4a8a36aa', '#4a8a3600'], tint: [[0.8, 1.0], [1.0, 1.15], [0.8, 1.0]],
    zones: [[10, -6, 8], [22, -32, 9], [-8, -42, 8], [30, 10, 7], [-34, 0, 7], [2, 26, 7]],
    trees: [['deco_pillar_vine', 22, 32, [1.8, 3.2], 12, 74], ['birch', 40, 60, [3.2, 4.8], 16, 74]],
    wild: [['dokukinoko_3', 2], ['saboten_3', 2], ['shokujinsou_2', 2], ['legend_kyoshin', 1], ['mame_chin_grass', 2], ['shinju_hakurou', 1], ['kodai_tengu', 2], ['biriunagi_2', 1], ['watage_2', 1], ['kaze_chou', 1], ['raimushi_2', 1], ['ringo_ko', 1], ['ringo_ko_2', 2], ['dango_mushi', 1], ['dango_mushi_2', 1], ['denki_neko_2', 1], ['mame_chin', 1], ['chin_kusa', 1], ['chin_kusa_2', 1], ['denchi_risu_2', 1], ['donguri_robo_2', 1], ['suna_kai', 1], ['iwagoro', 1], ['mitsugo_hebi', 1], ['nebosuke_kyo', 1], ['wakagi_shika', 1], ['mori_shika', 1], ['shinju_taiboku', 1], ['nari_kami', 1], ['toki_no_yousei', 1]], scale: { lv: 4, hp: 1.4, atk: 1.4, def: 1.4, spd: 1.2, exp: 2, money: 2 },
    boss: { key: 'grove', x: 0, z: -58, id: 'kami_ryokuya', name: 'しんじゅの ぬし', deco: { model: 'deco_pillar_vine', n: 9, r: 7.8, w: 3.6 }, over: { name: 'しんじゅの ぬし', image: 'assets/bosses/grove.webp', level: 60, hp: 874, atk: 121, def: 73, spd: 34, exp: 1300, money: 1500 }, model: 'boss_goddess', h: 6.4, lines: ['……ようこそ、ちいさき ものよ。', 'この いせきは もりの いのちを みまもる ばしょ。', 'きずなの つよさを、みせてもらいましょう。'], coins: 5000, win: 'しんじゅの ぬしが みとめてくれた! なかまボール×5 と 5000コインを もらった!', after: 'いせきに みどりの ひかりが もどったよ' },
  },
  castle: {
    name: 'やみの しろ', groundGain: 2.4, relief: 1.5, hills: 3, patch: [['#120a1e', 0.8, false, 50, 4, 10], ['#a070ff', 0.4, true, 30, 2, 6]], props: [['deco_dark_sword', 16, 30, [0.5, 1.0], 6, 55]],
     lava: [[-22, -18, 9], [26, -14, 7], [-30, 22, 8]], pool: { h: 0.78, s: 0.7, l: 0.22, glow: '#a070ff' }, fx: { color: '#c8b8e0', n: 140, size: 0.3, dir: -1, speed: [0.3, 0.7], sway: 0.6, blend: 'normal' },
    sky: '#241a36', fogN: 12, fogF: 80, g0: '#4a4058', g1: ['#3c3248', '#564a68', '#605474', '#30283c'], bg: 'battle_castle.webp',
    light: { hemi: [0xe0d4f0, 0x504060, 1.1], sun: [0xc0a0ff, 1.5] }, zd: ['#5a3a80cc', '#4a2a70aa', '#4a2a7000'], tint: [[0.9, 1.1], [0.5, 0.7], [1.2, 1.5]],
    zones: [[10, -6, 8], [22, -32, 9], [-8, -42, 8], [30, 10, 7], [-34, 0, 7], [2, 26, 7]],
    trees: [['deco_dark_sword', 20, 30, [1.8, 3.0], 12, 72], ['pine_far', 30, 50, [4.4, 6.6], 22, 78, '#1e1428']],
    wild: [['ankoku_madoushi_2', 3], ['hone_kenshi_3', 3], ['komori_3', 2], ['koyurei_3', 2], ['shinju_cerberus', 1], ['kodai_gashadokuro', 1], ['legend_meifukishi', 1], ['majutsusho', 1], ['majutsusho_2', 1], ['majo_chin', 1], ['kagami_ko', 1], ['mame_chin', 1], ['houki_ko_2', 1], ['suzu_sei', 1], ['omocha_mahou', 1], ['gankou_goro', 1], ['daichi_taishou', 1], ['kage_bouzu', 1], ['nebosuke_kyo', 1], ['goro_kyojuu', 1]], scale: { lv: 4, hp: 1.4, atk: 1.4, def: 1.4, spd: 1.2, exp: 2, money: 2 },
    boss: { key: 'castle', x: 0, z: -58, id: 'kami_datenken', name: 'やみの ぬし', deco: { model: 'deco_dark_sword', n: 9, r: 7.8, w: 3.6 }, over: { name: 'やみの ぬし', image: 'assets/bosses/castle.webp', level: 66, hp: 1030, atk: 136, def: 82, spd: 37, exp: 1600, money: 1900 }, model: 'boss_darkknight', h: 6.4, lines: ['……ここまで たどりついたか。', 'わが けんは やみに ちかった ほこり。', 'おまえの いしを、この けんで たしかめよう!'], coins: 6500, win: 'やみの ぬしが みとめてくれた! なかまボール×5 と 6500コインを もらった!', after: 'しろに しずかな ねむりが もどったよ' },
  },
  temple: {
    name: 'ほしの しんでん', groundGain: 1.8, relief: 1.3, hills: 2.5, patch: [['#2a3068', 0.7, false, 46, 4, 10], ['#ffe9a0', 0.4, true, 36, 2, 6]], props: [['deco_armillary', 8, 16, [0.5, 0.9], 8, 55], ['deco_starshard', 16, 30, [0.5, 1.0], 6, 55]],
     lava: [[-22, -18, 9], [26, -14, 7], [-30, 22, 8]], pool: { h: 0.13, s: 0.9, l: 0.6, glow: '#fff0a0' }, fx: { color: '#ffe9a0', n: 180, size: 0.4, dir: 1, speed: [0.2, 0.6], sway: 1.0 },
    sky: '#14183c', fogN: 18, fogF: 120, g0: '#6a74a8', g1: ['#5a6498', '#7680b8', '#838dc4', '#4e5890'], bg: 'battle_temple.webp',
    light: { hemi: [0xe4e8ff, 0x555c88, 1.35], sun: [0xffe8b0, 1.9] }, zd: ['#6a78c0cc', '#5a68b0aa', '#5a68b000'], tint: [[0.7, 0.9], [0.8, 1.0], [1.4, 1.7]],
    zones: [[10, -6, 8], [22, -32, 9], [-8, -42, 8], [30, 10, 7], [-34, 0, 7], [2, 26, 7]],
    trees: [['deco_armillary', 18, 26, [1.6, 2.8], 12, 72], ['deco_starshard', 20, 30, [1.8, 3.0], 20, 76]],
    wild: [['shinju_unicorn', 2], ['shinju_pegasus', 2], ['legend_hoshiryu', 1], ['legend_shinpan', 1], ['mame_chin_heaven', 2], ['mame_chin_magic', 2], ['majin_madoushi', 1], ['majo_chin', 1], ['majutsusho', 1], ['majutsusho_2', 1], ['lamp_no_sei', 2], ['kumo_hitsuji_2', 1], ['tenshi_chin', 1], ['kitsune_ko_3', 1], ['kagami_ko', 1], ['mame_chin', 1], ['houki_ko', 1], ['houki_ko_2', 1], ['suzu_sei', 1], ['omocha_mahou', 1], ['kantera_bito', 1], ['kage_bouzu', 1], ['yoru_kage', 1], ['goro_kyojuu', 1], ['daichi_madoromi', 1], ['hikari_kishi', 1], ['sei_kishi', 1], ['tenkuu_shugoshin', 1], ['maboroshi_yomi', 1]], scale: { lv: 4, hp: 1.4, atk: 1.4, def: 1.4, spd: 1.2, exp: 2, money: 2 },
    boss: { key: 'temple', x: 0, z: -58, id: 'kami_seikuu', name: 'ほしの ぬし', deco: { model: 'deco_armillary', n: 9, r: 7.8, w: 3.6 }, over: { name: 'ほしの ぬし', image: 'assets/bosses/temple.webp', level: 72, hp: 1187, atk: 151, def: 91, spd: 41, exp: 2000, money: 2400 }, model: 'boss_stargod', h: 6.6, lines: ['……ほしの めぐりが、あなたを ここへ みちびきました。', 'わたしは そらの うんめいを よむ もの。', 'あなたの みらいを、ここで みせてください。'], coins: 8000, win: 'ほしの ぬしが みとめてくれた! なかまボール×5 と 8000コインを もらった!', after: 'しんでんに ほしの ひかりが もどったよ' },
  },
  dragon: {
    name: 'せいりゅうの そら', relief: 2.0, hills: 4, patch: [['#3a7a6a', 0.55, false, 46, 4, 11], ['#e0fff8', 0.4, true, 30, 3, 8]], props: [['deco_water_orb', 16, 30, [0.4, 0.8], 6, 55]],
     lava: [[-22, -18, 9], [26, -14, 7], [-30, 22, 8]], pool: { h: 0.48, s: 0.7, l: 0.5, glow: '#c0fff0' }, fx: { color: '#e0fff8', n: 120, size: 0.3, dir: 0.3, speed: [0.3, 0.8], sway: 3.0, wind: 3 },
    sky: '#bfeadf', fogN: 30, fogF: 170, g0: '#78b0a0', g1: ['#68a090', '#88c4b0', '#98d0bc', '#5c9484'], bg: 'battle_dragon.webp',
    light: { hemi: [0xe0fff4, 0x6a9a90, 1.5], sun: [0xf0fff0, 2.3] }, zd: ['#4a9a8acc', '#3a8a7aaa', '#3a8a7a00'], tint: [[0.6, 0.8], [1.0, 1.2], [0.9, 1.1]],
    zones: [[10, -6, 8], [22, -32, 9], [-8, -42, 8], [30, 10, 7], [-34, 0, 7], [2, 26, 7]],
    trees: [['deco_water_orb', 14, 20, [1.4, 2.2], 14, 74], ['birch', 30, 50, [3.2, 4.8], 18, 76]],
    wild: [['dragon', 2], ['shinju_griffon', 2], ['kodai_tengu', 2], ['shinju_murasakiryu', 1], ['legend_houou', 1], ['mame_chin_wind', 2], ['mame_chin_thunder', 2], ['raimushi_3', 1], ['biriunagi_3', 1], ['kaze_chou', 1], ['denki_neko_2', 1], ['mame_chin', 1], ['denchi_risu_2', 1], ['furin_ko_2', 1], ['sora_ryu', 1], ['seikuu_ryuou', 1], ['mitsugo_hydra', 1], ['raimei_hydra', 1], ['shinkai_ryujin', 1]], scale: { lv: 4, hp: 1.4, atk: 1.4, def: 1.4, spd: 1.2, exp: 2, money: 2 },
    boss: { key: 'dragon', x: 0, z: -58, id: 'dragon', name: 'せいりゅうの ぬし', over: { name: 'せいりゅうの ぬし', image: 'assets/bosses/dragon.webp', level: 78, hp: 1366, atk: 168, def: 102, spd: 45, exp: 2500, money: 3000 }, model: 'boss_dragon', h: 7.0, lines: ['……わらべよ、ここは そらの いただき。', 'わが こえは かみなり、わが いぶきは あらし。', 'そのゆうきが ほんものか、みせてみよ!'], coins: 10000, win: 'せいりゅうの ぬしが みとめてくれた! なかまボール×5 と 10000コインを もらった!', after: 'そらに せいりゅうの すがたが ゆうゆうと もどったよ' },
  },
  end: {
    name: 'うちゅうの はて', groundGain: 1.35, relief: 1.6, hills: 3, patch: [['#160c3a', 0.8, false, 56, 4, 11], ['#ff9aff', 0.42, true, 40, 2, 7], ['#8ad0ff', 0.35, true, 30, 2, 6]], props: [['deco_starshard', 24, 44, [0.5, 1.1], 6, 55], ['deco_water_orb', 12, 24, [0.4, 0.8], 8, 55, '#e0b0ff']],
     lava: [[-22, -18, 9], [26, -14, 7], [-30, 22, 8]], pool: { h: 0.8, s: 0.7, l: 0.3, glow: '#ff9aff' }, fx: { color: '#ffd8ff', n: 320, size: 0.5, dir: 1, speed: [0.05, 0.3], sway: 1.5 },
    fx2: { color: '#8ad0ff', n: 200, size: 0.3, dir: 1, speed: [0.3, 0.9], sway: 0.8, h: 4 },
    sky: '#0a0618', fogN: 14, fogF: 100, g0: '#4a3a78', g1: ['#3c2e68', '#5a4690', '#6a54a0', '#30245a'], bg: 'battle_end.webp',
    light: { hemi: [0xf4eef8, 0x60507a, 1.35], sun: [0xffd8ff, 1.8] }, zd: ['#7a5ac0cc', '#6a4ab0aa', '#6a4ab000'], tint: [[0.9, 1.2], [0.6, 0.8], [1.4, 1.8]],
    zones: [[10, -6, 8], [22, -32, 9], [-8, -42, 8], [30, 10, 7], [-34, 0, 7], [2, 26, 7]],
    trees: [['deco_starshard', 38, 56, [1.8, 3.4], 12, 74], ['deco_armillary', 14, 20, [1.8, 3.2], 20, 76], ['deco_water_orb', 14, 20, [1.4, 2.4], 14, 70, '#e0b0ff']],
    wild: [['mame_chin_magic', 2], ['mame_chin_dark', 2], ['mame_chin_heaven', 2], ['mame_chin_kami', 1], ['legend_rasetsuou', 1], ['legend_shinpan', 1]], scale: { lv: 4, hp: 1.4, atk: 1.4, def: 1.4, spd: 1.2, exp: 2, money: 2 },
    boss: { key: 'end', x: 0, z: -58, id: 'mame_chin_kami', name: 'うちゅうの かみ', deco: { model: 'deco_starshard', n: 9, r: 7.8, w: 3.6 }, patch: 'patch_cosmic', patchW: 18, over: { name: 'うちゅうの かみ', image: 'assets/bosses/end.webp', level: 90, hp: 1800, atk: 200, def: 120, spd: 55, exp: 5000, money: 6000 }, model: 'final_ultimate', h: 7.4, lines: ['……ついに ここまで きたのですね、ちいさな ぼうけんしゃ。', 'わたしは すべての ほしを うんだ もの。', 'あなたと なかまの きずなを、さいごに ためします!'], coins: 20000, win: 'うちゅうの かみが みとめてくれた! なかまボール×5 と 20000コインを もらった!', after: 'うちゅうに あたらしい ほしが うまれたよ' },
  },
  lake: {
    name: 'みずうみの ほとり', groundRep: 34, patch: [['#3e7a4a', 0.45, false, 36, 4, 9]], props: [['deco_ice_crystal', 14, 26, [0.45, 0.9], 8, 55]],
     fx: { color: '#ffffff', n: 200, size: 0.3, dir: -1, speed: [0.8, 1.6], sway: 0.5, blend: 'normal' },
    sky: '#a6d6ee', g0: '#6aa04a', g1: ['#5a9444', '#86b858', '#74a84e', '#a0c868'], bg: 'battle_water.webp', lake: { x: -26, z: -16, r: 17 },
    zones: [[12, -8, 8], [22, -32, 9], [-6, -42, 8], [28, 10, 7], [-32, 14, 8], [4, 24, 7]],
    trees: [['birch', 40, 70, [3.0, 4.6], 14, 70], ['pine_far', 50, 80, [4.4, 6.6], 20, 78]],
    wild: [['slime_2', 3], ['aodori_2', 3], ['kujira_ko', 3], ['slime', 2], ['aodori', 2], ['fukurou_ko', 2], ['mitsubachi', 1], ['slime_3', 1], ['biriunagi', 2], ['biriunagi_2', 1], ['hikari_kame', 1], ['furebu_mizu', 1], ['furebu_mizu_2', 1], ['kurage_ko', 2], ['kurage_ko_2', 1], ['mitsugo_hebi', 1], ['mitsugo_hydra', 1], ['umihebi_ko', 2], ['namino_kairyu', 1], ['kora_rakko', 2], ['yume_no_ko', 1]], scale: { lv: 6, hp: 1.5, atk: 1.4, def: 1.4, spd: 1.2, exp: 1.5, money: 1.5 },
    boss: { key: 'lake', x: 16, z: -58, deco: { model: 'deco_ice_crystal', n: 9, r: 7.5, w: 3.4 }, id: 'yeti', name: 'みずうみの ぬし', over: { name: 'みずうみの ぬし', image: 'assets/bosses/lake.webp', level: 19, hp: 200, atk: 34, def: 20, spd: 14, exp: 240, money: 280 }, model: 'boss_lake', h: 5.8, lines: ['……さむい かぜが ふいてきたな。', 'このみずうみは わたしの すみか。ふみあらす ものは かえさん。', 'こおりのように つめたい わたしを、おまえの なかまは とかせるか?'], coins: 500, win: 'みずうみの ぬしが みとめてくれた! なかまボール×5 と 500コインを もらった!', after: 'みずうみに へいわが もどったよ' },
  },
};
const FID = ['lake', 'volcano', 'ghost', 'sky', 'sun', 'cosmos', 'grove', 'castle', 'temple', 'dragon', 'end'].includes(params.get('f')) ? params.get('f') : 'forest', F = FIELDS[FID], LC = F.lake || null, WATER_Y = -0.9;
// ---- してんのうの フィールド: せまくて くらい・くさむらなし。バッジ8つで ひらく ----
const GYM8 = ['forest', 'lake', 'volcano', 'ghost', 'sky', 'sun', 'cosmos', 'grove'], gymClear = () => GYM8.every(k => state.boss[k]);
const ELITE = ['castle', 'temple', 'dragon', 'end'].includes(FID), SPZ = ELITE ? 20 : 46;
if (ELITE) {
  F.zones = []; F.lava = []; F.pool = null; F.fogN = 8; F.fogF = 62; F.boss.x = 0; F.boss.z = -16;
  F.trees = F.trees.map(([nm, nT, nP, sc, , , tn]) => [nm, nT * 2, nP * 2, sc, 31, 48, tn]);
  F.props = (F.props || []).map(([nm, nT, nP, sc, r0, r1, tn]) => [nm, Math.ceil(nT / 2), Math.ceil(nP / 2), sc, r0, Math.min(r1, 25), tn]);
}
document.title = F.name;
const canvas = $('#c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'default' });
renderer.setPixelRatio(Math.min(devicePixelRatio, ECO ? 1 : isTouch ? 1.25 : 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
const scene = new THREE.Scene(); scene.background = new THREE.Color(F.sky); scene.fog = new THREE.Fog(F.sky, F.fogN || 28, F.fogF || 150);
const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 400);
function resize() { const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.fov = w / h < 1 ? 66 : 52; camera.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();
const LT = F.light || { hemi: [0xdfeeff, 0x6a7a40, 1.35], sun: [0xfff0d0, 2.3] };
const hemiL = new THREE.HemisphereLight(...LT.hemi); scene.add(hemiL);
const sun = new THREE.DirectionalLight(LT.sun[0], LT.sun[1]); sun.position.set(30, 50, 20); scene.add(sun);

setupInput(canvas, ui);
$('#hud').hidden = false; $('#mm').hidden = true; $('#goal').hidden = true; $('#btnQuest').hidden = true;

// ---- 地面 ----
let waterMesh = null; const lavaMeshes = [];
const hBase = (x, z) => { const r = Math.hypot(x, z); return (Math.sin(x * 0.07 + 1.2) * Math.cos(z * 0.06) * 1.3 + Math.sin(x * 0.19 + z * 0.15) * 0.25) * Math.min(1, r / 24) * (F.relief || 1) + (F.hills ? (Math.sin(x * 0.032 + 2) * Math.cos(z * 0.028 + 1) + Math.sin(x * 0.05 - z * 0.04) * 0.5) * F.hills * Math.min(1, r / 34) : 0); };
const PL = F.pool || null, LAVA = F.lava || [], LAVAY = LAVA.map(([cx, cz]) => hBase(cx, cz) - 0.5);
const hAt = (x, z) => { let h = hBase(x, z); for (let i = 0; i < LAVA.length; i++) { const [cx, cz, r] = LAVA[i], d = Math.hypot(x - cx, z - cz); if (d < r + 4) { const t = THREE.MathUtils.smoothstep(r + 4 - d, 0, 4); h = h + (LAVAY[i] - h) * t; } } if (!LC) return h; const d = Math.hypot(x - LC.x, z - LC.z); if (d > LC.r + 7) return h; const t = Math.min(1, Math.max(0, (LC.r + 7 - d) / 12)); return h - t * t * (3 - 2 * t) * 3.4; };   // みずうみの くぼみ
const isWater = (x, z) => (!!LC && Math.hypot(x - LC.x, z - LC.z) < LC.r + 14 && hAt(x, z) < WATER_Y + 0.12) || LAVA.some(([cx, cz, r]) => Math.hypot(x - cx, z - cz) < r * 0.96);
const gtex = (() => { const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'); g.fillStyle = F.g0; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 2600; i++) { g.fillStyle = F.g1[i % 4]; g.globalAlpha = 0.5; g.fillRect(Math.random() * 256, Math.random() * 256, 3, 3 + Math.random() * 5); } g.globalAlpha = 1;
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(44, 44); t.anisotropy = 4; return t; })();
{
  const g = new THREE.PlaneGeometry(220, 220, 110, 110); g.rotateX(-Math.PI / 2); const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) p.setY(i, hAt(p.getX(i), p.getZ(i)));
  g.computeVertexNormals();
  if (LC) {   // みずべは すなはま色に
    const col = new Float32Array(p.count * 3), sand = new THREE.Color(1.5, 1.3, 0.78);
    for (let i = 0; i < p.count; i++) { const h = p.getY(i), t = THREE.MathUtils.smoothstep(h, WATER_Y + 1.1, WATER_Y - 0.1), c = new THREE.Color(1, 1, 1).lerp(sand, t); if (h < WATER_Y - 0.6) c.multiplyScalar(0.7); col.set([c.r, c.g, c.b], i * 3); }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  }
  const gmat = new THREE.MeshLambertMaterial({ map: gtex, vertexColors: !!LC }); scene.add(new THREE.Mesh(g, gmat));
  // 専用の地面画像(assets/textures/ground_<フィールド名>.jpg があれば差し替え。つなぎ目のない正方形の画像)
  const gImg = new Image(); gImg.onload = () => {
    const N = isTouch ? 768 : 1024, c1 = document.createElement('canvas'); c1.width = c1.height = N; const x1 = c1.getContext('2d'); x1.drawImage(gImg, 0, 0, N, N);
    const A = x1.getImageData(0, 0, N, N), d = A.data, h = N / 2, tmp = new Uint8ClampedArray(d);   // つなぎ目なし化: 半分ずらした絵を端にまぜる
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const wx = Math.sin(Math.PI * (x + 0.5) / N), wy = Math.sin(Math.PI * (y + 0.5) / N), w = Math.min(1, Math.pow(wx * wy, 0.7) * 1.25), i = (y * N + x) * 4, j = (((y + h) % N) * N + ((x + h) % N)) * 4;
      for (let k = 0; k < 3; k++) d[i + k] = tmp[i + k] * w + tmp[j + k] * (1 - w);
    }
    x1.putImageData(A, 0, 0);
    const t = new THREE.CanvasTexture(c1); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(F.groundRep || 20, F.groundRep || 20); t.anisotropy = 4; gmat.map = t; gmat.color.setScalar(F.groundGain || 1); gmat.needsUpdate = true;
  }; gImg.onerror = () => {}; gImg.src = `./assets/textures/ground_${FID}.jpg`;
  LAVA.forEach(([cx, cz, r], i) => { const m = new THREE.Mesh(new THREE.CircleGeometry(r, 36), new THREE.MeshBasicMaterial({ color: PL ? new THREE.Color().setHSL(PL.h, PL.s, PL.l) : '#ff6a1a', fog: false })); m.rotation.x = -Math.PI / 2; m.position.set(cx, LAVAY[i] + 0.1, cz); scene.add(m); lavaMeshes.push(m); const glow = new THREE.Mesh(new THREE.RingGeometry(r * 0.98, r + 1.6, 36), new THREE.MeshBasicMaterial({ color: PL ? PL.glow : '#ff9a3a', transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); glow.rotation.x = -Math.PI / 2; glow.position.set(cx, LAVAY[i] + 0.14, cz); scene.add(glow); });
  if (LC) { waterMesh = new THREE.Mesh(new THREE.CircleGeometry(LC.r + 14, 48), new THREE.MeshBasicMaterial({ color: '#1c5f9c', transparent: true, opacity: 0.94, fog: false })); waterMesh.rotation.x = -Math.PI / 2; waterMesh.position.set(LC.x, WATER_Y, LC.z); scene.add(waterMesh); }
}

// ---- 地面の もよう(F.patch=[[色,濃さ,ひかり?,個数,小さい半径,大きい半径],...]) ----
for (const [pc, pa, glow, pn, r0, r1] of (F.patch || [])) {
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  for (let i = 0; i < 46; i++) { const a = R(0, 6.283), d = 52 * Math.sqrt(rnd()), rad = R(5, 16) * (1 - d / 80); const gr = g.createRadialGradient(64 + Math.cos(a) * d, 64 + Math.sin(a) * d, 0, 64 + Math.cos(a) * d, 64 + Math.sin(a) * d, rad); gr.addColorStop(0, pc); gr.addColorStop(1, pc + '00'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); }
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const geo = new THREE.PlaneGeometry(1, 1, 6, 6); geo.rotateX(-Math.PI / 2);
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: pa, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1.5, blending: glow ? THREE.AdditiveBlending : THREE.NormalBlending, fog: true });
  let k = 0, tries = 0;
  while (k < pn && tries++ < pn * 20) {
    const x = R(-95, 95), z = R(-95, 95), r = R(r0, r1);
    if (Math.hypot(x - 0, z - SPZ) < 5 || LAVA.some(([cx, cz, rr]) => Math.hypot(x - cx, z - cz) < rr + r * 0.6) || (LC && hAt(x, z) < WATER_Y + 1.2)) continue;
    const m = new THREE.Mesh(geo.clone(), mat); const q = m.geometry.attributes.position;
    for (let i = 0; i < q.count; i++) { const vx = x + q.getX(i) * r * 2, vz = z + q.getZ(i) * r * 2; q.setXYZ(i, vx, hAt(vx, vz) + 0.05 + k * 0.0006, vz); }
    m.frustumCulled = false; scene.add(m); k++;
  }
}

// ---- 草むら(ここを歩くとモンスターが出る) ----
let lawnTime = null;
const ZONES = F.zones;
const inZone = (x, z) => ZONES.some(([cx, cz, r]) => Math.hypot(x - cx, z - cz) < r);
{
  const dtex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); const gr = g.createRadialGradient(64, 64, 10, 64, 64, 64); const zd = F.zd || ['#3a7a2ccc', '#4a8a36aa', '#4a8a3600']; gr.addColorStop(0, zd[0]); gr.addColorStop(0.75, zd[1]); gr.addColorStop(1, zd[2]); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); const t0 = new THREE.CanvasTexture(c); t0.colorSpace = THREE.SRGBColorSpace; return t0; })();
  const kit = lawnKit(); lawnTime = kit.time; const mt = new THREE.Matrix4(), col = new THREE.Color();
  for (const [cx, cz, r] of ZONES) {
    const d = new THREE.Mesh(new THREE.CircleGeometry(r * 1.08, 28), new THREE.MeshLambertMaterial({ map: dtex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 })); d.rotation.x = -Math.PI / 2; d.position.set(cx, hAt(cx, cz) + 0.04, cz); scene.add(d);
    const per = Math.round(r * r * (isTouch ? 5 : 7.5)), lists = kit.geos.map(() => []);   // 草のかたまりを村と同じ形で敷く
    for (let i = 0; i < per; i++) { const a = R(0, 6.28), rr = r * Math.sqrt(rnd()); lists[i % lists.length].push([cx + Math.cos(a) * rr, cz + Math.sin(a) * rr]); }
    lists.forEach((arr, gi) => { const im = new THREE.InstancedMesh(kit.geos[gi], kit.mat, arr.length); arr.forEach(([x, z], i) => { const s = R(0.9, 1.5); mt.compose(new V3(x, hAt(x, z) - 0.01, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, R(0, 6.28), 0)), new V3(s, s * R(0.9, 1.4), s)); im.setMatrixAt(i, mt); const l = R(0.85, 1.12); const gt = F.tint || [[0.68, 0.82], [0.92, 0.92], [0.6, 0.78]]; col.setRGB(l * R(gt[0][0], gt[0][1]), l * R(gt[1][0], gt[1][1]), l * R(gt[2][0], gt[2][1])); im.setColorAt(i, col); }); im.computeBoundingSphere(); scene.add(im); });
  }
}

// ---- 木 ----
const circles = [];
const loader = new GLTFLoader();
const firstMesh = (gl) => { let m = null; gl.scene.traverse(o => { if (!m && o.isMesh) m = o; }); return m; };
async function plant(name, n, scaleR, rMin, rMax, tint) {
  const gl = await loader.loadAsync(`./assets/${name}_lite.glb`), m = firstMesh(gl); if (tint) { m.material = m.material.clone(); m.material.color.set(tint); }
  const bb = new THREE.Box3().setFromBufferAttribute(m.geometry.attributes.position), im = new THREE.InstancedMesh(m.geometry, m.material, n), mt = new THREE.Matrix4(); let k = 0, tries = 0;
  while (k < n && tries++ < n * 40) {
    const a = R(0, 6.28), r = R(rMin, rMax), x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (Math.hypot(x - BOSS.x, z - BOSS.z) < 11 || inZone(x, z) || ZONES.some(([cx, cz, rz]) => Math.hypot(x - cx, z - cz) < rz + 2.5) || Math.hypot(x, z - (GZ - 4)) < 9 || (LC && hAt(x, z) < WATER_Y + 0.9) || LAVA.some(([cx, cz, r]) => Math.hypot(x - cx, z - cz) < r + 3) || circles.some(c => Math.hypot(c.x - x, c.z - z) < 3.4)) continue;
    const s = R(scaleR[0], scaleR[1]); mt.compose(new V3(x, hAt(x, z) - bb.min.y * s - 0.1, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, R(0, 6.28), 0)), new V3(s, s * R(0.92, 1.12), s)); im.setMatrixAt(k++, mt);
    if (r < 64) circles.push({ x, z, r: 0.6 * s * 0.22 + 0.45 });
  }
  im.count = k; im.computeBoundingSphere(); scene.add(im);
}

// ---- 主人公 ----
let chin = null, chinGL = null;
function makeChin(h) {
  const root = chinGL.scene.clone(true); root.traverse(o => { if (o.isMesh) o.material = o.material.clone(); });
  const box = new THREE.Box3().setFromObject(root), size = box.getSize(new V3()), c = box.getCenter(new V3()), s = h / size.y;
  root.scale.setScalar(s); root.position.set(-c.x * s, -box.min.y * s, -c.z * s);
  const inner = new THREE.Group(); inner.add(root); const outer = new THREE.Group(); outer.add(inner); return { outer, inner, h };
}
function hop(c, speed, t) { const w = Math.sin(t * 11); c.inner.position.y = Math.abs(w) * 0.13 * c.h * speed; c.inner.rotation.x = w * 0.09 * speed; c.inner.rotation.z = Math.sin(t * 5.5) * 0.05 * speed; }
const P = { pos: new V3(0, 0, SPZ), face: Math.PI, sp: 0, t: 0 };
const cam = { yaw: 0, pitch: 0.36, dist: 6.4, pos: new V3(), look: new V3() };

// ---- ペットの ちんちらが ついてくる(ときどき ひろいものを みつけてくる) ----
const PET_TINT = [[1.28, 1.1, 0.85], [1.6, 1.6, 1.66], [0.62, 0.62, 0.7]], PET_NAME = ['モカ', 'ユキ', 'クロ'];
let petF = null, petT = 45; window.__makePet = () => makePet();
function makePet() {
  if (!(state.animals || []).length) return;
  petF = makeChin(0.58); const t = PET_TINT[0]; petF.outer.traverse(o => { if (o.isMesh) o.material.color.multiply(new THREE.Color(t[0], t[1], t[2])); });
  petF.x = P.pos.x + 1.4; petF.z = P.pos.z + 1.4; petF.f = 0; petF.sp = 0; scene.add(petF.outer);
}
function petReward() {
  const nm = (state.names && state.names['pet:0']) || PET_NAME[0], r = rnd(); let text = '';
  if (r < 0.45) { const c = 15 + FI * 12 + Math.floor(rnd() * 15); state.coins += c; ui.setCoins(); text = `${c}コイン`; }
  else if (r < 0.75) { addItem('monster_fur', 1); text = `${ITEMS.monster_fur.name}×1`; }
  else if (r < 0.88) { const ks = Object.values(DROP_BY_ELEMENT).filter(k => k !== 'god_scale'), k = ks[Math.floor(rnd() * ks.length)]; addItem(k, 1); text = `${ITEMS[k].name}×1`; }
  else if (r < 0.93) { const ks = Object.keys(EVO_STONES).filter(k => k !== 'evo_kami'), k = ks[Math.floor(rnd() * ks.length)]; addItem(k, 1); text = `${ITEMS[k].name}×1`; }   // しんかいし
  else { const b = FI >= 4 ? 'super_ball' : 'nakama_ball'; addItem(b, 1); text = `${ITEMS[b].name}×1`; }
  sfx('pick'); ui.toast(nm, 'なにかを みつけてきたよ!', text, 3200); save();
}
function updatePet(dt, T) {
  if (!petF) return;
  const bx = P.pos.x - Math.sin(P.face) * 1.8 + Math.cos(P.face) * 0.9, bz = P.pos.z - Math.cos(P.face) * 1.8 - Math.sin(P.face) * 0.9, dx = bx - petF.x, dz = bz - petF.z, d = Math.hypot(dx, dz);
  const sp = d > 0.3 ? Math.min(5.5, d * 3.2) : 0; petF.sp += (sp - petF.sp) * Math.min(1, dt * 8);
  if (d > 0.3) { petF.x += dx / d * petF.sp * dt; petF.z += dz / d * petF.sp * dt; petF.f = Math.atan2(dx, dz); }
  if (d > 14) { petF.x = bx; petF.z = bz; }
  petF.outer.position.set(petF.x, hAt(petF.x, petF.z), petF.z); petF.outer.rotation.y = petF.f; hop(petF, Math.min(1, petF.sp / 4.1), T);
  petT -= dt * (P.sp > 0.5 ? 1 : 0.25); if (petT <= 0) { petT = 55 + rnd() * 50; petReward(); }
}
// ---- もりの ぬし(ボス): 見えている。たおすと 二度目は でない ----
const BOSS = F.boss;
let bossSprite = null;
const bossBeaten = () => !!state.boss[BOSS.key];
const rematchReady = () => bossBeaten() && (state.bossRe || {})[BOSS.key] !== (state.day || 1);   // たおした ぬしは 1日1回 さいせんできる
function makeBoss() {
  if (bossBeaten() && !rematchReady()) return;
  const tex = new THREE.TextureLoader().load(`quest/assets/monsters/${BOSS.sprite || BOSS.id}.webp`); tex.colorSpace = THREE.SRGBColorSpace;
  bossSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, fog: true })); bossSprite.scale.set(6.5, 6.5, 1); bossSprite.center.set(0.5, 0.04); bossSprite.position.set(BOSS.x, hAt(BOSS.x, BOSS.z), BOSS.z); scene.add(bossSprite);
  const ring = new THREE.Mesh(new THREE.RingGeometry(3.2, 3.6, 36), new THREE.MeshBasicMaterial({ color: bossBeaten() ? '#b07af0' : '#ffb84a', transparent: true, opacity: 0.55, depthWrite: false, side: THREE.DoubleSide })); ring.rotation.x = -Math.PI / 2; ring.position.set(BOSS.x, hAt(BOSS.x, BOSS.z) + 0.08, BOSS.z); scene.add(ring); bossSprite.userData.ring = ring;
  circles.push({ x: BOSS.x, z: BOSS.z, r: 2.0 }); tryBossModel(); tryBossPatch(); tryBossDeco();
}
let bossModel = null, bossPatch = null, bossDeco = null;
async function tryBossDeco() {   // ボスの まわりの かざり(こおりの けっしょう など)。プレイヤーが くる がわ(手前)は あけておく
  const D = BOSS.deco; if (!D || state.boss[BOSS.key]) return;
  try {
    const url = `./assets/${D.model}_lite.glb`, ok = await fetch(url, { method: 'HEAD' }).then(r => r.ok).catch(() => false); if (!ok) return;
    const gl = await loader.loadAsync(url); let m = null; gl.scene.traverse(o => { if (!m && o.isMesh) m = o; });
    if (!m.geometry.attributes.normal) m.geometry.computeVertexNormals(); m.material.side = THREE.FrontSide;
    const bb = new THREE.Box3().setFromBufferAttribute(m.geometry.attributes.position), w0 = bb.max.x - bb.min.x, im = new THREE.InstancedMesh(m.geometry, m.material, D.n), mt = new THREE.Matrix4(); let k = 0;
    for (let i = 0; i < D.n * 3 && k < D.n; i++) {
      const a = (k / D.n) * 6.283 + R(-0.18, 0.18) + 0.3; if (Math.cos(a - 1.5708) > 0.86) continue;   // 手前(+z)は あける
      const r = D.r + R(-1.2, 1.4), x = BOSS.x + Math.cos(a) * r, z = BOSS.z + Math.sin(a) * r, sc = D.w / w0 * R(0.7, 1.3);
      mt.compose(new V3(x, hAt(x, z) - bb.min.y * sc - 0.05, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, R(0, 6.28), 0)), new V3(sc, sc * R(0.9, 1.2), sc)); im.setMatrixAt(k++, mt);
      circles.push({ x, z, r: D.w * 0.3 });
    }
    im.count = k; im.computeBoundingSphere(); scene.add(im); bossDeco = im;
  } catch (e) { console.warn('boss deco failed', e); }
}
async function tryBossPatch() {   // ボスの いる ばしょの つち(かれた じめん)
  if (!BOSS.patch || state.boss[BOSS.key]) return;
  try {
    const url = `./assets/${BOSS.patch}_lite.glb`, ok = await fetch(url, { method: 'HEAD' }).then(r => r.ok).catch(() => false); if (!ok) return;
    const gl = await loader.loadAsync(url), root = gl.scene; let m = null; root.traverse(o => { if (!m && o.isMesh) m = o; });
    if (!m.geometry.attributes.normal) m.geometry.computeVertexNormals(); m.material.side = THREE.DoubleSide;
    const box = new THREE.Box3().setFromBufferAttribute(m.geometry.attributes.position), sz = box.getSize(new V3()), s = (BOSS.patchW || 14) / sz.x;
    const mesh = new THREE.Mesh(m.geometry, m.material); mesh.scale.set(s, s * 0.6, s); mesh.position.set(BOSS.x, hAt(BOSS.x, BOSS.z) - box.min.y * s * 0.6 - 0.02, BOSS.z); mesh.receiveShadow = true; scene.add(mesh); bossPatch = mesh;
    if (bossSprite) bossSprite.userData.ring.visible = false;
  } catch (e) { console.warn('boss patch failed', e); }
}
async function tryBossModel() {   // assets/boss_xxx_lite.glb が あれば 3Dで ひょうじ(なければ 2Dの すがた)
  if (!BOSS.model) return;
  try {
    const url = `./assets/${BOSS.model}_lite.glb`, ok = await fetch(url, { method: 'HEAD' }).then(r => r.ok).catch(() => false); if (!ok) return;
    const gl = await loader.loadAsync(url); const root = gl.scene; root.traverse(o => { if (o.isMesh && !o.geometry.attributes.normal) o.geometry.computeVertexNormals(); });
    const box = new THREE.Box3().setFromObject(root), sz = box.getSize(new V3()), c = box.getCenter(new V3()), s = (BOSS.h || 5.5) / sz.y;
    root.scale.setScalar(s); root.position.set(-c.x * s, -box.min.y * s, -c.z * s);
    const outer = new THREE.Group(); outer.add(root); outer.position.set(BOSS.x, hAt(BOSS.x, BOSS.z), BOSS.z); scene.add(outer); bossModel = outer;
    if (bossSprite) bossSprite.visible = false;
  } catch (e) { console.warn('boss model failed', e); }
}
// はなしかける: セリフを 1つずつ → 「たたかう / まだ やめておく」
function dlgShow(lines, choices, who = BOSS.name) {
  return new Promise(res => {
    let box = $('#dlg'); if (!box) { box = document.createElement('div'); box.id = 'dlg'; document.body.appendChild(box); } box.hidden = false;
    let i = 0;
    const step = () => {
      if (i < lines.length) { box.innerHTML = `<b>${who}</b><p>${lines[i]}</p><button>つぎへ</button>`; box.querySelector('button').onclick = () => { sfx('ui'); i++; step(); }; }
      else { box.innerHTML = `<b>${who}</b><p>${lines[lines.length - 1]}</p><div class="ch">` + choices.map((c, k) => `<button data-k="${k}">${c}</button>`).join('') + '</div>'; box.querySelectorAll('[data-k]').forEach(b => b.onclick = () => { sfx('ui'); box.hidden = true; res(+b.dataset.k); }); }
    };
    step();
  });
}
async function talkBoss() {
  if (busy) return; busy = true; sfx('pet');
  const k = await dlgShow(bossBeaten() ? ['……また きたのか。', 'いちど みとめた あいてだ。もう いちど ちからを みせてもらおう!', '(さいせん: 1日1回。かつと ごほうびが もらえるよ。ぬしは つよくなっているよ)'] : (BOSS.lines || ['……']), ['たたかう', 'まだ やめておく']);
  busy = false; if (k === 0) challengeBoss();
}
// ---- ジムリーダーふう: ぬしの まえに してんのう(てした)が なんたいか れんせんで たたかう ----
async function gymTeam() {
  const GD = await questData(), k = F.scale || { lv: 0, hp: 1, atk: 1, def: 1, spd: 1, exp: 1, money: 1 }, n = FI < 4 ? 2 : FI === 11 ? 4 : 3;
  const ids = [...new Set((F.wild || []).map(([id]) => id))].filter(id => !['yume_no_ko', 'toki_no_yousei'].includes(id) && GD.MONSTERS[id]);
  const pool = ids.map(id => GD.MONSTERS[id]).sort((a, b) => b.level - a.level).slice(0, Math.max(n + 2, 5));
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  return pool.slice(0, n).sort((a, b) => a.level - b.level).map((b) => ({ id: b.id, name: b.name, over: { level: b.level + k.lv + 3, hp: Math.round(b.hp * k.hp * 1.15), atk: Math.round(b.atk * k.atk * 1.05), def: Math.round(b.def * k.def * 1.05), spd: Math.round(b.spd * k.spd), exp: Math.round(b.exp * k.exp), money: Math.round(b.money * k.money) } }));
}
async function hallOfFame() {
  const GD = await questData(); state.hof = state.hof || { day: state.day || 1, party: state.party.map(m => m.id) }; save();
  const ov = document.createElement('div');
  ov.style.cssText = 'position:fixed;inset:0;z-index:60;background:radial-gradient(#3a2a70,#0a0618);color:#ffe9a0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:16px;text-align:center;font-family:inherit';
  ov.innerHTML = `<div style="font-size:30px;font-weight:bold;letter-spacing:4px">でんどういり!</div><div style="font-size:14px;color:#fff">してんのうを ぜんいん たおした! このなかまが でんせつに のこる</div><div style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center;max-width:520px">${state.party.map(m => { const b = GD.MONSTERS[m.id] || {}; return `<div style="width:30%;min-width:96px"><img src="quest/assets/monsters/${m.id}.webp" style="width:100%;aspect-ratio:1;object-fit:contain"><div style="font-size:13px;color:#fff">${m.nick || b.name || m.id}</div><div style="font-size:12px">Lv${m.lv}</div></div>`; }).join('')}</div><button id="hofOk" style="font-size:16px;padding:10px 26px;border-radius:12px;border:2px solid #ffe9a0;background:#2a1a50;color:#ffe9a0">むらへ かえる</button>`;
  document.body.appendChild(ov); sfx('quest');
  await new Promise(r => { ov.querySelector('#hofOk').onclick = r; });
  ov.remove(); goVillage(false);
}
async function challengeBoss() {
  if (busy) return; busy = true; sfx('quest'); fade(true); await new Promise(r => setTimeout(r, 700));
  const re = bossBeaten(), o = BOSS.over, cap = ELITE ? { left: 3 } : null;   // してんのうは かいふくの たべものが 3かいまで
  if (cap) { ui.toast('してんのうの たたかい', 'かいふくの たべものは 3かいまで!', 'てしたも ぬしも れんせん。とちゅうで かいふくは できないよ', 3600); await new Promise(r => setTimeout(r, 1200)); }
  const over = re ? { ...o, level: o.level + 3, hp: Math.round(o.hp * 1.2), atk: Math.round(o.atk * 1.1), def: Math.round(o.def * 1.1), exp: Math.round(o.exp * 0.8), money: Math.round(o.money * 0.5) } : o;
  const team = re ? null : (await gymTeam()).map(u => ({ id: u.id, over: u.over })).concat([{ id: BOSS.id, over, isBoss: true }]);   // はじめては てしたを たおしてから ぬし(1つの たたかいで つづける)
  const res = await runBattle(re ? BOSS.id : team[0].id, { boss: over, ...(team ? { team, trainer: `${BOSS.name}の てした`, trainerBall: FI < 3 ? 'nakama_ball' : FI < 7 ? 'super_ball' : 'hyper_ball' } : {}), bg: F.bg, wx: WX, hour: hourNow(), cap, onBossWin: async (msg, sleep) => {
    if (re) { state.bossRe = state.bossRe || {}; state.bossRe[BOSS.key] = state.day || 1; const bn = FI < 3 ? 'nakama_ball' : FI < 7 ? 'super_ball' : 'hyper_ball'; addItem(bn, 2); const bonus = Math.round(BOSS.coins * 0.25); state.coins += bonus; msg(`${BOSS.name} に また かった! ${bonus}コインと ${ITEMS[bn].name}×2 を もらった!`); sfx('quest'); await sleep(2200); }
    else { state.boss[BOSS.key] = 1; addItem('nakama_ball', 5); if (FID === 'forest' && !state.gotMame) { state.gotMame = 1; const gm = giveMon('mame_chin', 5); if (gm) msg(gm === 'party' ? 'もりの ぬしから まめちんちらを あずかった! なかまに なったよ!' : 'もりの ぬしから まめちんちらを あずかった! ぼくじょうで まっているよ!'); } if (FID === 'end') addItem('evo_kami', 1); state.coins += BOSS.coins; msg(BOSS.win + (FID === 'end' ? ' かみの しんかいしを てにいれた!' : '')); sfx('quest'); await sleep(2200); } } });
  save(); fade(false); grace = 6; encDist = 0; ui.setCoins();
  if (res === 'lose') { goVillage(true); return; }
  if (re && state.bossRe[BOSS.key] === (state.day || 1) && bossSprite) { scene.remove(bossSprite); scene.remove(bossSprite.userData.ring); bossSprite = null; if (bossModel) { scene.remove(bossModel); bossModel = null; } ui.toast(BOSS.name, 'さいせんに しょうり!', 'あした また たたかえるよ', 4200); }
  else if (!re && state.boss[BOSS.key] && bossSprite) { makeShrines(); if (!gate2) buildGate2(); scene.remove(bossSprite); scene.remove(bossSprite.userData.ring); bossSprite = null; if (bossModel) { scene.remove(bossModel); bossModel = null; } if (bossPatch) { scene.remove(bossPatch); bossPatch = null; } if (bossDeco) { scene.remove(bossDeco); bossDeco = null; } { const bd = BADGES.find(b => b.id === BOSS.key); if (bd) setTimeout(() => { sfx('quest'); ui.toast('BADGE GET!', bd.name, bd.bonus, 6000); }, 2600); }
    if (GYM8.includes(BOSS.key) && gymClear()) setTimeout(() => { sfx('quest'); ui.toast('バッジが 8つ そろった!', 'でんせつの ほこらが あらわれた', 'ほこらの でんせつモンスターを なかまにして、やみの しろ(してんのう)に ちょうせんしよう!', 8000); }, 9500);
    if (FID === 'end') { await hallOfFame(); return; }
    ui.toast(BOSS.name, 'ぬしを たおした!', BOSS.after + ({ forest: '(むらの ゲートから みずうみへ いけるよ)', lake: '(むらの ゲートから ようがんやまへ いけるよ)' }[BOSS.key] || ''), 5200); }
  busy = false;
}


// ---- トレーナー(人間): 話しかけて 1対1の しょうぶ。1人1回(かつと コインと けいけんち) ----
const FIDS = ['forest', 'lake', 'volcano', 'ghost', 'sky', 'sun', 'cosmos', 'grove', 'castle', 'temple', 'dragon', 'end'];
const TRAINER_SPOTS = [[-9, 28], [10, 12], [-15, -10], [9, -28], [-8, -46], [16, 30]];
const TRAINER_NAMES = [['ケンジ', 'male'], ['ミサキ', 'female'], ['タクミ', 'male'], ['ユイ', 'female'], ['ハルト', 'male'], ['サクラ', 'female']];
const trainers = [];
async function makeTrainers() {
  state.trainers = state.trainers || {};
  const GD = await questData(), fi = Math.max(0, FIDS.indexOf(FID)), n = fi < 2 ? 2 : 3, k = F.scale || { lv: 0, hp: 1, atk: 1, def: 1, spd: 1, exp: 1, money: 1 };
  const spots = TRAINER_SPOTS.filter(([x, z]) => !inZone(x, z) && !ZONES.some(([cx, cz, r]) => Math.hypot(x - cx, z - cz) < r + 2) && !isWater(x, z) && !(LC && hAt(x, z) < WATER_Y + 1) && !LAVA.some(([cx, cz, r]) => Math.hypot(x - cx, z - cz) < r + 4) && Math.hypot(x - BOSS.x, z - BOSS.z) > 14 && !circles.some(c => Math.hypot(c.x - x, c.z - z) < 3)).slice(0, n);
  const models = {};
  for (const g of ['male', 'female']) { try { models[g] = await loader.loadAsync(`./assets/human_${g}_lite.glb`); } catch (e) { console.warn('trainer model failed', e); return; } }
  spots.forEach(([x, z], i) => {
    const [name, gender] = TRAINER_NAMES[(fi + i * 2) % TRAINER_NAMES.length];
    // もっている なかまの かず(1〜3ひき。あとの フィールドほど おおめ)。1ぴきだけの ときは すこし レベルが たかい
    const roll = ((fi * 7 + i * 13 + 5) * 37) % 100, size = fi < 2 ? (roll < 60 ? 1 : 2) : fi < 6 ? (roll < 30 ? 1 : roll < 75 ? 2 : 3) : (roll < 15 ? 1 : roll < 55 ? 2 : 3), share = size === 1 ? 1 : 0.75;
    const team = [], used = new Set();
    for (let j = 0; team.length < size && j < 12; j++) {
      const wid = WILD[(fi + i + j * 3) % WILD.length][0]; if (used.has(wid) || !GD.MONSTERS[wid]) continue; used.add(wid); const b = GD.MONSTERS[wid];
      team.push({ id: wid, over: { level: b.level + k.lv + 2 + (size === 1 ? 3 : 0), hp: Math.round(b.hp * k.hp * 1.15), atk: Math.round(b.atk * k.atk * 1.05), def: Math.round(b.def * k.def * 1.05), spd: Math.round(b.spd * k.spd), exp: Math.round(b.exp * k.exp * 1.6 * share), money: Math.round(b.money * k.money * 2.5 * share) } });
    }
    const wild = team[0].id, over = team[0].over;
    const root = models[gender].scene.clone(true); root.traverse(o => { if (o.isMesh && !o.geometry.attributes.normal) o.geometry.computeVertexNormals(); });
    const box = new THREE.Box3().setFromObject(root), sz = box.getSize(new V3()), c = box.getCenter(new V3()), s = 3.2 / sz.y;
    root.scale.setScalar(s); root.position.set(-c.x * s, -box.min.y * s, -c.z * s);
    const outer = new THREE.Group(); outer.add(root); outer.position.set(x, hAt(x, z), z); scene.add(outer);
    const mk = document.createElement('canvas'); mk.width = mk.height = 64; { const g = mk.getContext('2d'); g.fillStyle = '#ffd860'; g.strokeStyle = '#5a3a10'; g.lineWidth = 5; g.beginPath(); g.arc(32, 32, 26, 0, 6.28); g.fill(); g.stroke(); g.fillStyle = '#5a3a10'; g.font = 'bold 40px sans-serif'; g.textAlign = 'center'; g.fillText('!', 32, 46); }
    const mt = new THREE.CanvasTexture(mk); mt.colorSpace = THREE.SRGBColorSpace; const mark = new THREE.Sprite(new THREE.SpriteMaterial({ map: mt, transparent: true, depthWrite: false })); mark.scale.set(0.9, 0.9, 1); mark.position.y = 4.0; outer.add(mark);
    const circ = { x, z, r: 0.9 }; circles.push(circ);
    const key = FID + '_' + i;
    trainers.push({ key, name, mon: wild, over, team, ball: fi < 3 ? 'nakama_ball' : fi < 7 ? 'super_ball' : 'hyper_ball', x, z, outer, mark, circ, hx: x, hz: z, hd: R(0, 6.28), want: R(0, 6.28), wt: R(1, 3), tx: x, tz: z, walk: false, sp: 0, lines: [`${name}: やあ! きみも ぼうけんしゃ かい?`, `${name}: ぼくの なかまと しょうぶしよう! まけないよ!`], afterLines: [`${name}: つよいね! また きたえておくよ。`] });
  });
}
async function talkTrainer(t) {
  if (busy) return; if (!state.trainers[t.key]) return spotTrainer(t);   // まだ かってない トレーナーとは かならず しょうぶ
  busy = true; sfx('pet');
  const done = !!state.trainers[t.key], k = await dlgShow(done ? t.afterLines : t.lines, done ? ['じゃあね'] : ['しょうぶする', 'やめておく'], t.name);
  busy = false; if (!done && k === 0) challengeTrainer(t);
}
// ---- トレーナーは ふらふら あるきまわり、視線も ランダムに うごく。視線に はいると みつかって、しょうぶから にげられない ----
let tCool = 3;
function updateTrainers(dt, T) {
  tCool -= dt;
  for (const t of trainers) {
    const done = !!state.trainers[t.key];
    if (!done && !busy && !ui.panelOpen()) {
      t.wt -= dt;
      if (t.walk) {   // めあての ばしょへ あるく(むいた ほうが 視線)
        const dx = t.tx - t.x, dz = t.tz - t.z, d = Math.hypot(dx, dz), step = 1.5 * dt;
        if (d < 0.25) { t.walk = false; t.wt = R(1.5, 4.5); t.sp = 0; }
        else { const nx = t.x + dx / d * step, nz = t.z + dz / d * step; if (isWater(nx, nz) || circles.some(c => c !== t.circ && Math.hypot(c.x - nx, c.z - nz) < c.r + 0.9)) { t.walk = false; t.wt = 0.6; t.sp = 0; } else { t.x = nx; t.z = nz; t.want = Math.atan2(dx, dz); t.sp = 1; } }
      } else if (t.wt <= 0) {   // ランダムに「あるく」か「きょろきょろ 見まわす」
        if (rnd() < 0.55) { const a = R(0, 6.28), r = R(2, 7); const tx = t.hx + Math.sin(a) * r, tz = t.hz + Math.cos(a) * r; if (!isWater(tx, tz) && !(LC && hAt(tx, tz) < WATER_Y + 1)) { t.tx = tx; t.tz = tz; t.walk = true; } t.wt = R(0.5, 1.5); }
        else { t.want = R(0, 6.28); t.wt = R(1.2, 3.5); }
      }
      const da = Math.atan2(Math.sin(t.want - t.hd), Math.cos(t.want - t.hd)); t.hd += da * Math.min(1, dt * (t.walk ? 6 : 2.2));
      t.circ.x = t.x; t.circ.z = t.z;
      // みつかった?(ちかくは うしろでも きづく。視線の ほうこう 約75度・きょり10)
      if (tCool <= 0) {
        const px = P.pos.x - t.x, pz = P.pos.z - t.z, d = Math.hypot(px, pz), ang = Math.abs(Math.atan2(Math.sin(Math.atan2(px, pz) - t.hd), Math.cos(Math.atan2(px, pz) - t.hd)));
        if (d < 2.6 || (d < 10 && ang < 0.65)) { spotTrainer(t); return; }
      }
    }
    t.outer.rotation.y = t.hd; t.outer.position.set(t.x, hAt(t.x, t.z) + Math.abs(Math.sin(T * 5 + t.x)) * (t.sp ? 0.09 : 0.02), t.z);
    t.mark.visible = !done; t.mark.position.y = 4.0 + Math.sin(T * 3 + t.z) * 0.12;
  }
}
async function spotTrainer(t) {
  if (busy) return; busy = true; sfx('no'); t.mark.scale.set(1.8, 1.8, 1);
  t.hd = Math.atan2(P.pos.x - t.x, P.pos.z - t.z); t.walk = false;
  const t0 = performance.now();
  while (performance.now() - t0 < 2400) {   // びっくりして かけよってくる
    const dx = P.pos.x - t.x, dz = P.pos.z - t.z, d = Math.hypot(dx, dz); if (d < 2.6) break;
    t.x += dx / d * 6 * 0.016; t.z += dz / d * 6 * 0.016; t.hd = Math.atan2(dx, dz); t.circ.x = t.x; t.circ.z = t.z;
    t.outer.rotation.y = t.hd; t.outer.position.set(t.x, hAt(t.x, t.z) + Math.abs(Math.sin(performance.now() / 70)) * 0.1, t.z);
    await new Promise(r => setTimeout(r, 16));
  }
  t.mark.scale.set(0.9, 0.9, 1); sfx('pet');
  await dlgShow([`${t.name}: みつけたぞ! ぼくと しょうぶだ!`], ['しょうぶする'], t.name);   // にげられない
  busy = false; challengeTrainer(t);
}
async function challengeTrainer(t) {
  if (busy) return; busy = true; sfx('quest'); fade(true); await new Promise(r => setTimeout(r, 700));
  const res = await runBattle(t.mon, { boss: t.over, team: t.team, double: t.team.length >= 2 && assistOn(), trainerBall: t.ball, trainer: t.name, bg: F.bg, wx: WX, hour: hourNow(), onBossWin: async (msg, sleep) => { state.trainers[t.key] = 1; msg(`${t.name} との しょうぶに かった!`); sfx('quest'); await sleep(1600); } });
  save(); fade(false); grace = 6; encDist = 0; ui.setCoins(); tCool = 5;
  if (res === 'lose') { goVillage(true); return; }
  busy = false;
}

// ---- むらへのゲート ----
const gate = new THREE.Group(); const GZ = ELITE ? 25 : 56;
{
  const wood = new THREE.MeshLambertMaterial({ color: '#7a5230' }), glow = new THREE.MeshBasicMaterial({ color: '#ffe9a0', transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.5, 4.4, 0.5), wood); p.position.set(s * 2.2, 2.2, 0); gate.add(p); }
  const beam = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.55, 0.6), wood); beam.position.y = 4.4; gate.add(beam);
  const portal = new THREE.Mesh(new THREE.PlaneGeometry(3.9, 4.1), glow); portal.position.y = 2.1; gate.add(portal); gate.userData.portal = portal;
  gate.position.set(0, hAt(0, GZ), GZ); scene.add(gate); circles.push({ x: -2.2, z: GZ, r: 0.5 }, { x: 2.2, z: GZ, r: 0.5 });
}

// ---- つぎの フィールドへの ゲート(ぬしを たおすと ひらく) ----
const ORDER = ['forest', 'lake', 'volcano', 'ghost', 'sky', 'sun', 'cosmos', 'grove', 'castle', 'temple', 'dragon', 'end'], NEXT = ORDER[ORDER.indexOf(FID) + 1], NX = F.boss.x * 63 / Math.hypot(F.boss.x, F.boss.z), NZ = F.boss.z * 63 / Math.hypot(F.boss.x, F.boss.z);   // ぬしの うしろ(あるける はんいの いちばん おく)に ひらく
let gate2 = null;
function buildGate2() {
  if (!(NEXT && FIELDS[NEXT] && state.boss[BOSS.key])) return;
  gate2 = gate.clone(true); const pm = new THREE.MeshBasicMaterial({ color: '#9ad0ff', transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  gate2.children.forEach(c => { if (c === gate.userData.portal || c.geometry.type === 'PlaneGeometry') c.material = pm; }); gate2.userData.portal = gate2.children.find(c => c.material === pm);
  gate2.position.set(NX, hAt(NX, NZ), NZ); scene.add(gate2); circles.push({ x: NX - 2.2, z: NZ, r: 0.5 }, { x: NX + 2.2, z: NZ, r: 0.5 });
}
function goNext() {
  busy = true; fading = true; save(); fade(true);
  setTimeout(() => { state.pos = { x: 0, z: 46 }; save(); location.href = 'field.html?f=' + NEXT + '&_=' + Date.now(); }, 800);
}

// ---- 入力・移動 ----
let busy = true, fading = false, encDist = 0, grace = 8;
const WR = ELITE ? 28 : 66;
function updatePlayer(dt) {
  const blocked = busy || ui.panelOpen();
  const mx = blocked ? 0 : input.mx, mz = blocked ? 0 : input.mz, sy = Math.sin(cam.yaw), cy = Math.cos(cam.yaw);
  let dx = -sy * mz + cy * mx, dz = -cy * mz - sy * mx; const mag = Math.min(1, Math.hypot(dx, dz)), dashing = !blocked && input.dash && mag > 0.15;
  P.sp += (mag * (dashing ? 7.2 : 4.1) - P.sp) * lam(10, dt);
  if (mag > 0.05) { const a = Math.atan2(dx, dz); let d = a - P.face; while (d > Math.PI) d -= 6.283; while (d < -Math.PI) d += 6.283; P.face += d * lam(14, dt); }
  const ox = P.pos.x, oz = P.pos.z;
  if (P.sp > 0.01 && mag > 0.01) {
    P.pos.x += dx / mag * P.sp * dt; P.pos.z += dz / mag * P.sp * dt;
    for (const c of circles) { const ddx = P.pos.x - c.x, ddz = P.pos.z - c.z; if (Math.abs(ddx) > 4 || Math.abs(ddz) > 4) continue; const d = Math.hypot(ddx, ddz), m = 0.42 + c.r; if (d < m && d > 1e-5) { P.pos.x = c.x + ddx / d * m; P.pos.z = c.z + ddz / d * m; } }
    const r = Math.hypot(P.pos.x, P.pos.z); if (r > WR) { P.pos.x *= WR / r; P.pos.z *= WR / r; }
    if (isWater(P.pos.x, P.pos.z)) { P.pos.x = ox; P.pos.z = oz; }   // みずうみには はいれない
  }
  P.pos.y = hAt(P.pos.x, P.pos.z); P.t += dt * (0.6 + P.sp * 0.14);
  chin.outer.position.copy(P.pos); chin.outer.rotation.y = P.face; hop(chin, Math.min(1, P.sp / 4.1) * (dashing ? 1.25 : 1), P.t);
  const moved = Math.hypot(P.pos.x - ox, P.pos.z - oz);
  if (!busy && inZone(P.pos.x, P.pos.z)) { encDist += moved; grace -= dt; if (encDist > 6 && grace <= 0) { encDist = R(0, 2); if (rnd() < 0.5) startEncounter(); } } else if (!inZone(P.pos.x, P.pos.z)) encDist = Math.min(encDist, 2);
}
function updateCamera(dt, instant) {
  if (!busy && !ui.panelOpen()) { cam.yaw -= input.camDX * 0.0058; cam.pitch = THREE.MathUtils.clamp(cam.pitch + input.camDY * 0.0045, 0.08, 1.15); }
  input.camDX = input.camDY = 0; if (input.zoom) { cam.dist = THREE.MathUtils.clamp(cam.dist + input.zoom * 0.7, 3.4, 11); input.zoom = 0; }
  const tgt = new V3(P.pos.x, P.pos.y + 1.15, P.pos.z), cp = new V3(Math.sin(cam.yaw) * Math.cos(cam.pitch), Math.sin(cam.pitch), Math.cos(cam.yaw) * Math.cos(cam.pitch)).multiplyScalar(cam.dist).add(tgt);
  { const vx = cp.x - tgt.x, vz = cp.z - tgt.z, len2 = vx * vx + vz * vz; let tmax = 1;   // 木のみきが間に入ったら カメラを寄せる
    if (len2 > 0.01) { const len = Math.sqrt(len2); for (const c of circles) { const ox = c.x - tgt.x, oz = c.z - tgt.z; if (Math.abs(ox) > 14 || Math.abs(oz) > 14 || Math.hypot(ox, oz) < c.r + 0.9) continue; const t = (ox * vx + oz * vz) / len2; if (t <= 0 || t >= 1.05) continue; if (Math.hypot(ox - vx * t, oz - vz * t) < c.r + 0.45) tmax = Math.min(tmax, Math.max(0.3, t - (c.r + 0.6) / len)); } }
    if (tmax < 1) cp.set(tgt.x + vx * tmax, tgt.y + (cp.y - tgt.y) * tmax, tgt.z + vz * tmax); }
  const gy = hAt(cp.x, cp.z) + 0.7; if (cp.y < gy) cp.y = gy;
  if (instant) { cam.pos.copy(cp); cam.look.copy(tgt); } else { cam.pos.lerp(cp, lam(9, dt)); cam.look.lerp(tgt, lam(14, dt)); }
  camera.position.copy(cam.pos); camera.lookAt(cam.look);
}

// ---- エンカウント・バトル ----
const WILD = F.wild;
async function pickWild() { const GD = await questData(), h = hourNow(), ws = WILD.map(([id, w]) => [id, w * elemWeight((GD.MONSTERS[id] && GD.MONSTERS[id].element) || 'none', h)]), tot = ws.reduce((a, b) => a + b[1], 0); let r = rnd() * tot; for (const [id, w] of ws) { r -= w; if (r <= 0) return id; } return ws[0][0]; }
const fade = (on) => { const f = $('#fade'); f.textContent = ''; f.classList.toggle('on', on); };
async function startEncounter(forceId) {
  if (busy) return; busy = true; sfx('quest'); fade(true); await new Promise(r => setTimeout(r, 700));
  const id = forceId || await pickWild(); let over = null;
  if (F.scale) { const GD = await questData(), b = GD.MONSTERS[id], k = F.scale; over = { level: b.level + k.lv, hp: Math.round(b.hp * k.hp), atk: Math.round(b.atk * k.atk), def: Math.round(b.def * k.def), spd: Math.round(b.spd * k.spd), exp: Math.round(b.exp * k.exp), money: Math.round(b.money * k.money) }; }   // おくの ばしょは すこし つよい
  const res = await runBattle(id, { over, bg: F.bg, wx: WX, hour: hourNow() }); save();
  fade(false); grace = 6; encDist = 0;
  if (res === 'lose') { goVillage(true); return; }
  busy = false;
}
function goVillage(lost) {
  busy = true; fading = true; save(); fade(true);
  setTimeout(() => { if (lost) healParty(); state.pos = { x: 5, z: -34.4 }; save(); location.href = 'index.html?resume=1&_=' + Date.now(); }, 800);
}

// ---- ターゲット(ゲート) ----
let target = null;
function updateTarget() {
  const d = Math.hypot(P.pos.x, P.pos.z - GZ);
  target = d < 5 && !busy ? (ELITE && FID !== 'castle' && !bossBeaten() ? { label: 'ひきかえせない', sub: 'してんのうとの たたかいの とちゅうだ。ぬしを たおすまで もどれないよ', short: 'ひきかえせない', can: false, act: () => {} } : { label: 'むらへ かえる', sub: 'ぼくじょうの むらに もどるよ', short: 'かえる', can: true, act: () => goVillage(false) }) : null;
  if (!target && gate2 && !busy && Math.hypot(P.pos.x - NX, P.pos.z - NZ) < 5) target = { label: FIELDS[NEXT].name + 'へ すすむ', sub: 'ぬしを たおしたので ひらいたよ。むらの ゲートからも えらべるよ', short: 'すすむ', can: true, act: goNext };
  if (!target && bossSprite && !busy && Math.hypot(P.pos.x - BOSS.x, P.pos.z - BOSS.z) < 6.5) target = { label: bossBeaten() ? BOSS.name + 'に さいせんする' : BOSS.name + 'に はなしかける', sub: 'つよい あいてだよ。HPと かいふくの たべものを じゅんびしてね(たたかいが はじまると にげられないよ)', short: 'はなしかける', can: true, act: talkBoss };
  if (!target && !busy) { const sh = shrines.find(s => !(state.legends && state.legends[s.id]) && Math.hypot(P.pos.x - s.x, P.pos.z - s.z) < 4.2); if (sh) target = { label: 'でんせつの ほこら', sub: 'ふしぎな けはいが する…。つよい あいてだよ', short: 'ちかづく', can: true, act: () => challengeLegend(sh) }; }
  if (!target && !busy) { const c = chests.find(c => Math.hypot(P.pos.x - c.x, P.pos.z - c.z) < 3.2); if (c) { const rd = chestReady(c); target = { label: 'たからばこ', sub: rd ? 'ひらいてみよう!' : 'からっぽ(3日で ふっかつ)', short: rd ? 'あける' : 'からっぽ', can: true, act: () => openChest(c) }; } }
  if (!target && !busy) { const t = trainers.find(t => Math.hypot(P.pos.x - t.x, P.pos.z - t.z) < 4.5); if (t) target = { label: t.name + 'に はなしかける', sub: state.trainers[t.key] ? 'しょうぶは おわったよ' : 'トレーナーだよ。しょうぶを もちかけてくるよ', short: 'はなす', can: true, act: () => talkTrainer(t) }; }
  ui.setPrompt(ui.panelOpen() ? null : target);
}

// ---- 起動 ----
bus.on('coins', () => ui.setCoins());
bus.on('saveNow', () => { if (save()) { sfx('coin'); ui.toast('セーブ', 'セーブしました!', '', 2200); } else ui.toast('セーブ', 'セーブできませんでした', 'ブラウザの ほぞんスペースを かくにんしてね', 4000); });
bus.on('toTitle', () => { save(); location.href = 'index.html'; });
// ---- ふうけいの つぶ(F.fx: 火の粉・雪・ほたる・星など) ----
const dotTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 32; const g = c.getContext('2d'), gr = g.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, '#fff'); gr.addColorStop(0.5, '#fffc'); gr.addColorStop(1, '#fff0'); g.fillStyle = gr; g.fillRect(0, 0, 32, 32); return new THREE.CanvasTexture(c); })();
const fxLayers = [];
function addFxLayer(FX) {
  const n = isTouch ? Math.floor(FX.n * 0.6) : FX.n, pos = new Float32Array(n * 3), vel = [], H = FX.h || 16;
  for (let i = 0; i < n; i++) { pos[i * 3] = R(-70, 70); pos[i * 3 + 1] = R(0, H); pos[i * 3 + 2] = R(-70, 70); vel.push([R(FX.speed[0], FX.speed[1]) * FX.dir, R(-0.5, 0.5)]); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pts = new THREE.Points(g, new THREE.PointsMaterial({ map: dotTex, alphaTest: 0.02, color: FX.color, size: FX.size, transparent: true, opacity: 1, depthWrite: false, blending: FX.blend === 'normal' ? THREE.NormalBlending : THREE.AdditiveBlending }));
  pts.frustumCulled = false; scene.add(pts); fxLayers.push({ FX, pts, vel, H });
}
for (const FX of [F.fx, F.fx2]) if (FX) addFxLayer(FX);
function updateEmbers(dt) {
  for (const { FX, pts, vel, H } of fxLayers) {
    const a = pts.geometry.attributes.position, wind = FX.wind || 0;
    for (let i = 0; i < vel.length; i++) {
      let y = a.getY(i) + vel[i][0] * dt, x = a.getX(i) + (Math.sin(T * 0.8 + i) * FX.sway * 0.3 + vel[i][1] + wind) * dt;
      if (y > H) y = 0; else if (y < 0) y = H; if (x > 70) x = -70;
      a.setXYZ(i, x, y, a.getZ(i));
    }
    a.needsUpdate = true;
  }
  updateEnd(dt);
}
// ---- うちゅうの はて(さいごの フィールド)専用の そら・ほし・オーロラ・かみの かんむり ----
const endAnim = [];
function updateEnd(dt) { for (const f of endAnim) f(T, dt); }
if (FID === 'end') {
  const glowTex = (c0, c1) => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, c0); gr.addColorStop(1, c1); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; };
  // 星空(カメラについてくる)
  const sky = new THREE.Group(); scene.add(sky);
  const N = isTouch ? 900 : 1800, sp = new Float32Array(N * 3), sc = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) { const u = R(0.02, 1), th = R(0, 6.283), ph = Math.acos(u), r = 300; sp[i * 3] = r * Math.sin(ph) * Math.cos(th); sp[i * 3 + 1] = r * Math.cos(ph); sp[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th); const c = new THREE.Color().setHSL(R(0.55, 0.95), 0.6, R(0.7, 1)); sc.set([c.r, c.g, c.b], i * 3); }
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(sp, 3)); sg.setAttribute('color', new THREE.BufferAttribute(sc, 3));
  const stars = new THREE.Points(sg, new THREE.PointsMaterial({ map: dotTex, alphaTest: 0.02, size: isTouch ? 5 : 4, sizeAttenuation: false, vertexColors: true, fog: false, transparent: true, depthWrite: false })); stars.frustumCulled = false; sky.add(stars);
  // ほしぐも(ぼんやり光る雲)
  [['#ff6ad0', -160, 120, -200, 260], ['#6a9aff', 200, 90, -120, 300], ['#b06aff', -40, 140, 230, 280], ['#4affd8', 230, 130, 180, 220], ['#ff9ab0', -230, 100, 80, 240]].forEach(([col, x, y, z, w]) => {
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(col + 'aa', col + '00'), blending: THREE.AdditiveBlending, depthWrite: false, fog: false, transparent: true, opacity: 0.55 })); sprite.position.set(x, y, z); sprite.scale.set(w, w * 0.6, 1); sky.add(sprite);
  });
  // わくせい(リングつき)
  const planet = (col, em, rad, x, y, z, ring) => { const m = new THREE.Mesh(new THREE.SphereGeometry(rad, 32, 24), new THREE.MeshStandardMaterial({ color: col, emissive: em, emissiveIntensity: 0.5, roughness: 0.8, fog: false })); m.position.set(x, y, z); sky.add(m); if (ring) { const r = new THREE.Mesh(new THREE.RingGeometry(rad * 1.5, rad * 2.2, 64), new THREE.MeshBasicMaterial({ color: ring, transparent: true, opacity: 0.55, side: THREE.DoubleSide, fog: false, depthWrite: false })); r.rotation.x = Math.PI / 2.6; r.rotation.y = 0.3; m.add(r); } return m; };
  const p1 = planet('#d8a0ff', '#6a3a9a', 34, -150, 95, -230, '#ffd8ff'), p2 = planet('#7ac8ff', '#1a4a8a', 18, 190, 70, -170), p3 = planet('#ffe0a8', '#8a5a20', 9, 60, 55, -240);
  endAnim.push((t) => { sky.position.copy(camera.position); p1.rotation.y = t * 0.03; p2.rotation.y = t * 0.05; p3.rotation.y = t * 0.08; stars.material.opacity = 0.85 + Math.sin(t * 1.3) * 0.15; });
  // オーロラ(ゆらめく光のカーテン)
  const auroraTex = (c) => { const cv = document.createElement('canvas'); cv.width = 8; cv.height = 128; const g = cv.getContext('2d'), gr = g.createLinearGradient(0, 128, 0, 0); gr.addColorStop(0, c + '00'); gr.addColorStop(0.25, c + 'cc'); gr.addColorStop(0.6, c + '55'); gr.addColorStop(1, c + '00'); g.fillStyle = gr; g.fillRect(0, 0, 8, 128); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t; };
  [['#6affc8', 10], ['#c06aff', -4], ['#6ab0ff', 5]].forEach(([col, y0], i) => {
    const geo = new THREE.PlaneGeometry(260, 46, 40, 1), au = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: auroraTex(col), transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
    au.position.set(0, 26 + y0, -75 - i * 30); scene.add(au);
    endAnim.push((t) => { const p = geo.attributes.position; for (let k = 0; k < p.count; k++) { const x = p.getX(k); p.setZ(k, Math.sin(x * 0.045 + t * 0.5 + i * 2) * 14 + Math.sin(x * 0.11 + t * 0.9) * 4); } p.needsUpdate = true; au.material.opacity = 0.4 + Math.sin(t * 0.6 + i * 1.7) * 0.15; });
  });
  // かみの かんむり(ぬしの ほしのわ と ひかりの はしら)
  const halo = new THREE.Group(); halo.position.set(BOSS.x, 0, BOSS.z); scene.add(halo);
  [[8.5, 0.07, '#ffd8ff', 0.5, 0.2], [11, 0.05, '#9ad0ff', 0.35, -0.15], [6.2, 0.06, '#ffe9a0', 0.8, 0.35]].forEach(([r, tu, col, tilt, spd], i) => {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r, tu, 8, 96), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false }));
    ring.position.y = 9.5 + i * 0.6; ring.rotation.x = Math.PI / 2 + tilt; halo.add(ring);
    endAnim.push((t) => { ring.rotation.z = t * spd; ring.rotation.x = Math.PI / 2 + tilt + Math.sin(t * 0.4 + i) * 0.12; });
  });
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 5, 40, 24, 1, true), new THREE.MeshBasicMaterial({ map: auroraTex('#ffd8ff'), transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
  beam.position.y = 20; halo.add(beam); endAnim.push((t) => { beam.rotation.y = t * 0.2; beam.material.opacity = 0.28 + Math.sin(t * 1.1) * 0.08; });
  scene.fog.near = 30; scene.fog.far = 190;
}

// ---- じかん・てんき(フィールドに はいるたびに 日づけで きまる) ----
const WX_NAME = { clear: 'はれ', rain: 'あめ', storm: 'あらし', fog: 'きり', snow: 'ゆき' };
const FIELD_WX = { forest: [['clear', 55], ['rain', 25], ['fog', 20]], lake: [['clear', 40], ['rain', 25], ['snow', 20], ['fog', 15]], volcano: [['clear', 60], ['fog', 25], ['storm', 15]], ghost: [['fog', 55], ['clear', 30], ['rain', 15]], def: [['clear', 55], ['rain', 20], ['fog', 20], ['storm', 5]] };
const WX_MULT = { rain: { water: 2.2, grass: 1.8, thunder: 1.6, fire: 0.5 }, storm: { thunder: 3, wind: 2.5, water: 1.8, fire: 0.4 }, fog: { dark: 2.2, magic: 1.6, heaven: 0.7 }, snow: { water: 2, heaven: 1.6, fire: 0.4 }, clear: {} };
const WX_HINT = { rain: 'みずや くさの モンスターが でやすいよ', storm: 'でんきや かぜの モンスターが でやすいよ', fog: 'やみや まほうの モンスターが でやすいよ', snow: 'みずや てんの モンスターが でやすいよ', clear: '' };
const FI = Math.max(0, ['forest', 'lake', 'volcano', 'ghost', 'sky', 'sun', 'cosmos', 'grove', 'castle', 'temple', 'dragon', 'end'].indexOf(FID));
let WX = 'clear';
const pickWx = () => { const tb = FIELD_WX[FID] || FIELD_WX.def; let x = ((state.day || 1) * 2654435761 + FI * 40503) >>> 0; x = (x ^ (x >>> 15)) * 2246822519 >>> 0; const r = (x % 1000) / 1000 * tb.reduce((a, b) => a + b[1], 0); let acc = 0; for (const [k, w] of tb) { acc += w; if (r < acc) return k; } return 'clear'; };
const hourNow = () => state.hour == null ? 10 : state.hour;
const nightK = (h) => h >= 20 || h < 5 ? 1 : h >= 18 ? (h - 18) / 2 : h < 7 ? (7 - h) / 2 : 0;   // 夜の こさ(0〜1)
const timeName = (h) => h >= 20 || h < 5 ? 'よる' : h < 7 ? 'あさやけ' : h < 17 ? 'ひるま' : 'ゆうがた';
function elemWeight(el, h) {
  let m = (WX_MULT[WX] || {})[el] || 1; const night = nightK(h);
  if (night > 0.9) m *= ({ dark: 2.5, magic: 1.8, beast: 1.4, heaven: 0.5, fire: 0.8 })[el] || 1; else if (h >= 7 && h < 17) m *= ({ grass: 1.3, heaven: 1.5, wind: 1.2, dark: 0.6 })[el] || 1;
  return m;
}
const baseSky = new THREE.Color(F.sky), nightSky = new THREE.Color('#0c1230'), tmpC = new THREE.Color(), hemiBase = LT.hemi[2], sunBase = LT.sun[1], fogN0 = scene.fog.near, fogF0 = scene.fog.far, hemiSky0 = new THREE.Color(LT.hemi[0]);
let flash = 0;
function updateSky(dt) {
  const n = nightK(hourNow()), wl = ({ clear: 1, rain: 0.82, storm: 0.6, fog: 0.9, snow: 0.95 })[WX], lm = (1 - 0.5 * n) * wl;
  tmpC.copy(baseSky).lerp(nightSky, 0.75 * n); if (WX === 'fog' || WX === 'storm') tmpC.lerp(new THREE.Color('#9aa4ac'), WX === 'fog' ? 0.45 : 0.3);
  scene.background.copy(tmpC); scene.fog.color.copy(tmpC); scene.fog.near = fogN0 * (WX === 'fog' ? 0.3 : 1); scene.fog.far = fogF0 * (WX === 'fog' ? 0.45 : WX === 'rain' || WX === 'storm' ? 0.75 : 1);
  hemiL.intensity = hemiBase * lm + flash * 2.4; sun.intensity = sunBase * lm * (WX === 'storm' ? 0.5 : 1) + flash * 2;
}
// あめ(線で えがく)
let rain = null;
function initWeather() {
  WX = WX_NAME[params.get('wx')] ? params.get('wx') : pickWx(); if (params.has('hour')) state.hour = parseFloat(params.get('hour'));
  if (WX === 'rain' || WX === 'storm') {
  const n = isTouch ? 420 : 800, pos = new Float32Array(n * 6), spd = [];
  for (let i = 0; i < n; i++) { const x = R(-22, 22), y = R(0, 24), z = R(-22, 22); pos.set([x, y, z, x + 0.25, y + 1.5, z], i * 6); spd.push(R(18, 26)); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  rain = { lines: new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: '#c0dcff', transparent: true, opacity: WX === 'storm' ? 0.85 : 0.7, depthWrite: false })), spd, n }; rain.lines.frustumCulled = false; scene.add(rain.lines);
  }
  if (WX === 'snow') addFxLayer({ color: '#ffffff', n: 280, size: 0.38, dir: -1, speed: [0.8, 1.7], sway: 0.7, blend: 'normal', h: 18 });
}
function updateWeather(dt) {
  if (rain) { const a = rain.lines.geometry.attributes.position, c = chin ? chin.outer.position : { x: 0, z: 0 }; rain.lines.position.set(c.x, 0, c.z);
    for (let i = 0; i < rain.n; i++) { let y = a.getY(i * 2) - rain.spd[i] * dt; if (y < 0) y += 24; a.setXYZ(i * 2, a.getX(i * 2), y, a.getZ(i * 2)); a.setXYZ(i * 2 + 1, a.getX(i * 2) + 0.25, y + 1.5, a.getZ(i * 2)); } a.needsUpdate = true; }
  if (WX === 'storm') { if (flash > 0) flash = Math.max(0, flash - dt * 6); else if (rnd() < dt / 7) flash = 1; }
  state.hour = Math.min(23.9, hourNow() + dt * 24 / DAY_SECONDS);   // そとでは 1日を こえない(かならず むらで ねる)
}
const wxEl = document.createElement('div'); wxEl.id = 'wx'; document.body.appendChild(wxEl);
let wxT = 0;
function updateWxLabel() { const h = hourNow(); wxEl.innerHTML = `<b>${WX_NAME[WX]}</b> ${timeName(h)} ${String(Math.floor(h)).padStart(2, '0')}:${String(Math.floor((h % 1) * 60)).padStart(2, '0')}`; ui.setClock && ui.setClock(); }

// ---- たからばこ(3日で ふっかつ) ----
const CHEST_SPOTS = [[-20, 34], [22, 22], [-26, 6], [25, -8], [0, -30], [-22, -30], [28, -44], [-34, 20]];
const chests = [];
const chestMat = { wood: new THREE.MeshLambertMaterial({ color: '#8a5a2c' }), dark: new THREE.MeshLambertMaterial({ color: '#5a3818' }), gold: new THREE.MeshLambertMaterial({ color: '#e8c050', emissive: '#6a4a10' }) };
function buildChest() {
  const g = new THREE.Group(), body = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.9, 1.0), chestMat.wood); body.position.y = 0.45; g.add(body);
  const lid = new THREE.Group(); lid.position.set(0, 0.9, -0.5); const lm = new THREE.Mesh(new THREE.BoxGeometry(1.56, 0.3, 1.06), chestMat.dark); lm.position.set(0, 0.15, 0.5); lid.add(lm); const lt = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.12, 0.9), chestMat.wood); lt.position.set(0, 0.34, 0.5); lid.add(lt); g.add(lid);
  const bandA = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.94, 1.04), chestMat.gold), bandB = bandA.clone(); bandA.position.set(-0.5, 0.45, 0); bandB.position.set(0.5, 0.45, 0); g.add(bandA, bandB);
  const lock = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.3, 0.1), chestMat.gold); lock.position.set(0, 0.88, 0.54); g.add(lock);
  const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTex, color: '#ffe080', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.8 })); gl.scale.set(2.6, 2.6, 1); gl.position.y = 1.1; g.add(gl);
  g.userData = { lid, glow: gl }; return g;
}
function chestReady(c) { const d = state.chests[c.key]; return d == null || (state.day || 1) - d >= 3; }
function chestLoot() {
  const r = rnd(), out = { coins: 0, items: {} }, add = (id, n) => { out.items[id] = (out.items[id] || 0) + n; };
  if (r < 0.5) out.coins = Math.round(80 + FI * 70 + rnd() * (40 + FI * 30));
  else if (r < 0.75) { if (FI < 3) add('nakama_ball', 1 + Math.floor(rnd() * 2)); else if (FI < 7) add(rnd() < 0.5 ? 'super_ball' : 'nakama_ball', rnd() < 0.5 ? 1 : 3); else { add('hyper_ball', 1); if (FI >= 9 && rnd() < 0.12) add('master_ball', 1); } }
  else if (r < 0.92) { const keys = Object.values(DROP_BY_ELEMENT).filter(k => k !== 'god_scale'); add(keys[Math.floor(rnd() * keys.length)], 2 + Math.floor(rnd() * 3)); add('monster_fur', 1 + Math.floor(rnd() * 3)); }
  else if (r < 0.97) { const st = Object.keys(EVO_STONES).filter(k => k !== 'evo_kami'); add(st[Math.floor(rnd() * st.length)], 1); out.coins = Math.round(30 + FI * 20); }   // しんかいし
  else { const foods = Object.keys(HEAL); add(foods[Math.floor(rnd() * foods.length)], 2); out.coins = Math.round(40 + FI * 30); }
  return out;
}
function openChest(c) {
  if (busy) return; if (!chestReady(c)) { ui.toast('たからばこ', 'からっぽだよ', `あと ${3 - ((state.day || 1) - state.chests[c.key])}日で また はいるかも`, 2600); return; }
  const loot = chestLoot(); state.chests[c.key] = state.day || 1; state.coins += loot.coins; for (const [id, n] of Object.entries(loot.items)) addItem(id, n); ui.setCoins(); sfx('quest');
  c.open = 0.01; ui.toast('たからばこ!', [loot.coins ? `${loot.coins}コイン` : '', ...Object.entries(loot.items).map(([id, n]) => `${ITEMS[id].name}×${n}`)].filter(Boolean).join('、'), '', 4200); save();
}
async function makeChests() {
  state.chests = state.chests || {}; const fi = FI, n = fi < 2 ? 3 : 4;
  const spots = CHEST_SPOTS.filter(([x, z]) => !inZone(x, z) && !ZONES.some(([cx, cz, r]) => Math.hypot(x - cx, z - cz) < r + 2) && !isWater(x, z) && !(LC && hAt(x, z) < WATER_Y + 1) && !LAVA.some(([cx, cz, r]) => Math.hypot(x - cx, z - cz) < r + 4) && Math.hypot(x - BOSS.x, z - BOSS.z) > 14 && !circles.some(c => Math.hypot(c.x - x, c.z - z) < 3)).slice(0, n);
  spots.forEach(([x, z], i) => { const m = buildChest(); m.position.set(x, hAt(x, z), z); m.rotation.y = rnd() * 6.28; scene.add(m); circles.push({ x, z, r: 0.9 }); chests.push({ key: FID + '_c' + i, x, z, m, open: 0 }); });
}
function updateChests(dt) {
  for (const c of chests) {
    const ready = chestReady(c); c.m.userData.glow.visible = ready; c.m.userData.glow.material.opacity = 0.55 + Math.sin(T * 3 + c.x) * 0.25;
    if (c.open > 0 && c.open < 1) c.open = Math.min(1, c.open + dt * 2.2); c.m.userData.lid.rotation.x = ready ? 0 : -1.9 * (c.open > 0 ? c.open : 1);
  }
}

// ---- でんせつの ほこら(フィールドの おくに ひとつずつ。ちかづくと でんせつの モンスターに であえる。つかまえるか たおすと しずかになる) ----
const LEGENDS = {   // バッジ8つで あらわれる。してんのうの フィールドには おかない
  forest: [['souryu_ten', 70]], lake: [['ginyoku', 70]], volcano: [['magna_kaiju', 65]], ghost: [['maryoku_ou', 80]],
  sky: [['raigeki_chou', 45], ['futago_stella', 65], ['futago_comet', 65]], sun: [['kaen_chou', 50], ['homura_shishi', 52]],
  cosmos: [['hyosetsu_chou', 55], ['mizu_kirin', 55], ['watatsumi', 60]], grove: [['kaminari_tora', 60], ['niji_ootori', 75]],
};
const SHRINE_SPOTS = [[34, 8], [-36, -6], [12, -40], [-14, 40], [38, -26], [-40, 22], [6, 26], [-30, -34], [30, 36], [-46, 4]];
const shrines = [], shrineTex = new THREE.TextureLoader();
const shrineMat = { stone: new THREE.MeshLambertMaterial({ color: '#8a8a94' }), gold: new THREE.MeshLambertMaterial({ color: '#d9b25a' }) };
function buildShrine() {
  const g = new THREE.Group(), base = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.8, 0.35, 10), shrineMat.stone); base.position.y = 0.18; g.add(base);
  for (const sx of [-1, 1]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 2.6, 8), shrineMat.stone); p.position.set(sx * 1.0, 1.6, 0); g.add(p); }
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.28, 0.4), shrineMat.gold); lintel.position.y = 2.95; g.add(lintel);
  const lintel2 = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.2, 0.3), shrineMat.stone); lintel2.position.y = 2.55; g.add(lintel2);
  return g;
}
async function makeShrines() {
  if (!gymClear() || shrines.length) return;   // バッジ8つで ほこらが あらわれる
  const list = (LEGENDS[FID] || []).filter(([id]) => !(state.legends && state.legends[id])); if (!list.length) return;
  const spots = SHRINE_SPOTS.filter(([x, z]) => !inZone(x, z) && !ZONES.some(([cx, cz, r]) => Math.hypot(x - cx, z - cz) < r + 3) && !isWater(x, z) && !(LC && hAt(x, z) < WATER_Y + 1) && !LAVA.some(([cx, cz, r]) => Math.hypot(x - cx, z - cz) < r + 4) && Math.hypot(x - BOSS.x, z - BOSS.z) > 16 && !circles.some(c => Math.hypot(c.x - x, c.z - z) < 4) && Math.hypot(x, z - 46) > 18);
  list.forEach(([id, lv], i) => {
    const s = spots[i]; if (!s) return; const [x, z] = s, g = buildShrine(); g.position.set(x, hAt(x, z), z); g.rotation.y = Math.atan2(-x, -z); scene.add(g); circles.push({ x, z, r: 1.7 });
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: shrineTex.load(`quest/assets/monsters/${id}.webp`), transparent: true, opacity: 0.0, depthWrite: false, fog: false }));
    sp.scale.set(2.6, 2.6, 1); sp.position.set(x, hAt(x, z) + 1.6, z); scene.add(sp);
    shrines.push({ id, lv, x, z, g, sp });
  });
}
function updateShrines(dt) {
  for (const s of shrines) {
    if (state.legends && state.legends[s.id]) { s.g.visible = false; s.sp.visible = false; continue; }
    const d = Math.hypot(P.pos.x - s.x, P.pos.z - s.z), want = d < 16 ? Math.min(0.85, (16 - d) / 8) : 0;   // ちかづくと ぼんやり すがたが うかぶ
    s.sp.material.opacity += (want - s.sp.material.opacity) * Math.min(1, dt * 2); s.sp.position.y = hAt(s.x, s.z) + 1.7 + Math.sin(T * 1.6 + s.x) * 0.15;
  }
}
async function challengeLegend(s) {
  if (busy) return; busy = true; sfx('quest'); fade(true); await new Promise(r => setTimeout(r, 700));
  const res = await runBattle(s.id, { bg: F.bg, wx: WX, hour: hourNow(), legend: true }); save();
  if (res === 'caught' || res === 'win') { state.legends = state.legends || {}; state.legends[s.id] = 1; save(); }
  fade(false); grace = 6; encDist = 0;
  if (res === 'lose') { goVillage(true); return; }
  busy = false;
}
const clock = new THREE.Clock(); let T = 0, lastFrame = 0;
function frame() {
  requestAnimationFrame(frame); if (ECO) { const now = performance.now(); if (now - lastFrame < 30) return; lastFrame = now; }   // 省エネ: 30fps
  const dt = Math.min(clock.getDelta(), 0.05); T += dt; pollInput();
  if (chin) {
    if (input.menu) { input.menu = false; if (!busy) ui.togglePanel('menu'); }
    updatePlayer(dt); updateCamera(dt); updateTarget();
    if (input.action) { input.action = false; if (target && target.can) target.act(); }
    input.tap = null;
    if (lawnTime) lawnTime.value = T;
    if (bossModel) { bossModel.rotation.y = Math.atan2(P.pos.x - BOSS.x, P.pos.z - BOSS.z); bossModel.position.y = hAt(BOSS.x, BOSS.z) + Math.sin(T * 1.6) * 0.06; }
    if (bossSprite) bossSprite.userData.ring.material.opacity = 0.4 + Math.sin(T * 3) * 0.2;
    gate.userData.portal.material.opacity = 0.4 + Math.sin(T * 2.2) * 0.12;
    if (gate2) gate2.userData.portal.material.opacity = 0.4 + Math.sin(T * 2.2 + 1) * 0.12;
    updateEmbers(dt); updateWeather(dt); updateSky(dt); updateChests(dt); updateShrines(dt); updatePet(dt, T); if ((wxT += dt) > 1) { wxT = 0; updateWxLabel(); }
    updateTrainers(dt, T);
    lavaMeshes.forEach((m, i) => m.material.color.setHSL((PL ? PL.h : 0.045) + Math.sin(T * 1.7 + i) * 0.01, PL ? PL.s : 1, (PL ? PL.l : 0.36) + Math.sin(T * 2.3 + i * 2) * 0.04));
    if (waterMesh) { waterMesh.material.color.setHSL(0.575, 0.7, 0.3 + Math.sin(T * 0.9) * 0.03); waterMesh.position.y = WATER_Y + Math.sin(T * 0.7) * 0.03; }
  }
  renderer.render(scene, camera);
}
async function boot() {
  load(); initWeather(); buildGate2(); chinGL = await loader.loadAsync('./assets/chin_storybook_lite.glb'); chinGL.scene.traverse(o => { if (o.isMesh && !o.geometry.attributes.normal) o.geometry.computeVertexNormals(); });
  chin = makeChin(0.95); scene.add(chin.outer); makePet(); makeBoss(); if (!ELITE) { await makeTrainers(); await makeChests(); } await makeShrines();
  for (const [nm, nT, nP, sc, r0, r1, tn] of [...F.trees, ...(F.props || [])]) await plant(nm, isTouch ? nT : nP, sc, r0, r1, tn);
  await questData(); const first = giveStarter(); save();
  ui.setCoins(); ui.setClock && ui.setClock(); ui.setLevel && ui.setLevel();
  P.pos.set(0, hAt(0, SPZ), SPZ); cam.yaw = 0; cam.pitch = 0.36; updateCamera(0, true);
  playBgm('field'); $('#loading2').classList.add('done'); updateWxLabel();
  { const h = hourNow(), hints = [WX_HINT[WX], nightK(h) > 0.9 ? 'よるは やみや まほうの モンスターが でやすいよ' : (h >= 7 && h < 17 ? 'ひるまは てんや くさの モンスターが でやすいよ' : '')].filter(Boolean); if (WX !== 'clear' || hints.length) setTimeout(() => ui.toast(`てんき: ${WX_NAME[WX]} / ${timeName(h)}`, hints.join(' / ') || 'おだやかな ひだよ', '', 4200), 1500); } busy = false; fade(false); document.title = 'ready';
  if (first) ui.toast('なかまが できた!', 'まめちんちらが ついてきたよ', 'くさむらを あるくと モンスターが でてくるよ', 5200);
  else ui.toast(F.name, 'くさむらを あるくと モンスターが でてくるよ', FID === 'lake' ? 'ここの モンスターは すこし つよいよ' : '', 3600);
  window.__f = { gymTeam, challengeBoss, shrines, challengeLegend, trainers, talkTrainer, talkBoss, cam, hAt, isWater, P, state, startEncounter, runBattle, scene, camera, renderer, goVillage, ZONES, count, addItem, circles };
}
unlockAudio(); frame(); boot();
addEventListener('pagehide', () => { try { save(); } catch {} });
document.addEventListener('visibilitychange', () => { if (document.hidden) { try { save(); } catch {} } });
setInterval(() => { if (!busy) { try { save(); } catch {} } }, 15000);   // もりでも じどうセーブ
bus.on('saveFail', () => ui.toast('セーブできないよ!', 'ブラウザの ほぞんスペースが つかえないみたい', 'むらで「せってい」から かきだしてね', 9000));
try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch {}

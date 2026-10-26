// BGM(外部音源なし。WebAudioで鳴らす シーケンサー+シンセ。リバーブ・ストリングス・ブラス・ドラムなどで ぶあつく ならす)
// 曲は「コード進行(度数)」+「メロディ(度数の文字列)」+「楽器レイヤー」で書く。tools/ には なにも いらない。
import { unlockAudio, audioCtx } from './audio.js';

const KEY = 'chinchilla-ranch-audio';
const cfg = (() => { try { return { bgm: 0.6, sfx: 0.6, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { return { bgm: 0.6, sfx: 0.6 }; } })();
export const audioConfig = cfg;
const saveCfg = () => { try { localStorage.setItem(KEY, JSON.stringify(cfg)); } catch {} };

const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
const SCALES = { major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10], dorian: [0, 2, 3, 5, 7, 9, 10], lydian: [0, 2, 4, 6, 7, 9, 11], mixo: [0, 2, 4, 5, 7, 9, 10], phrygian: [0, 1, 3, 5, 7, 8, 10] };
const PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
// 度数 → MIDI。deg=1〜(7を こえても OK)、oct=オクターブ、acc=半音
const degMidi = (tr, deg, oct = 0, acc = 0) => { const i = deg - 1, sc = SCALES[tr.mode || 'major']; return tr.key + sc[((i % 7) + 7) % 7] + 12 * (Math.floor(i / 7) + oct) + acc; };

// メロディ文字列: 'こうぞう= 度数[#|b][\'|,]*:ながさ' を スペースで つなぎ、小節は | で くぎる。1小節=16。r=やすみ
function parseMel(str, tr, name) {
  return str.split('|').map((bar, bi) => {
    const out = []; let s = 0;
    for (const tok of bar.trim().split(/\s+/)) {
      if (!tok) continue; const m = /^([r1-9])([#b]?)([',]*):(\d+)$/.exec(tok); if (!m) throw new Error(`${name}: bad token ${tok}`);
      const len = +m[4];
      if (m[1] !== 'r') { const up = (m[3].match(/'/g) || []).length - (m[3].match(/,/g) || []).length; out.push([s, degMidi(tr, +m[1], up, m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0), len]); }
      s += len;
    }
    if (s !== 16) (window.__bgmWarn || (window.__bgmWarn = [])).push(`${name} bar${bi + 1} = ${s}`);
    return out;
  });
}
function splitLegacy(notes, n) {   // [ステップ, MIDI, ながさ] を ステップが もどるごとに 小節へ わける
  const bars = []; let bar = 0, last = -1;
  for (const nt of notes) { if (nt[0] <= last) bar++; last = nt[0]; (bars[bar] || (bars[bar] = [])).push(nt); }
  for (let i = 0; i < Math.max(n, bars.length); i++) bars[i] = bars[i] || []; return bars;
}
// コード: 数字(度数)+しゅうしょく[M=メジャー m=マイナー d=ディミニッシュ s=sus4 7 9 5=パワー] か、'Am' 'Bb' などの なまえ
function chordOf(tr, tok) {
  const nm = /^([A-G])([#b]?)(.*)$/.exec(tok);
  if (nm) {
    const pc = (PC[nm[1]] + (nm[2] === '#' ? 1 : nm[2] === 'b' ? -1 : 0) + 12) % 12, r = 40 + ((pc - 4 + 12) % 12), q = nm[3];
    const th = q.startsWith('dim') || (q.startsWith('m') && !q.startsWith('maj')) ? r + 3 : q.startsWith('sus') ? r + 5 : r + 4, fi = q.startsWith('dim') ? r + 6 : r + 7, ct = [r, th, fi];
    if (q.includes('7')) ct.push(r + (q.includes('maj') ? 11 : 10)); return ct;
  }
  const m = /^(\d)(.*)$/.exec(tok), d = +m[1], q = m[2], root = degMidi(tr, d, -2); let third = degMidi(tr, d + 2, -2), fifth = degMidi(tr, d + 4, -2);
  if (q.includes('M')) third = root + 4; if (q.includes('m')) third = root + 3; if (q.includes('d')) { third = root + 3; fifth = root + 6; } if (q.includes('s')) third = root + 5;
  const ct = q.includes('5') ? [root, root + 7] : [root, third, fifth]; if (q.includes('7')) ct.push(degMidi(tr, d + 6, -2)); if (q.includes('9')) ct.push(degMidi(tr, d + 8, -2)); return ct;
}
const up = (s) => s.replace(/(\d[#b]?)([',]*):/g, (a, d, o) => d + o + "':");   // メロディを 1オクターブ うえへ

// ドラムの パターン(16ステップ。x=ふつう X=つよい g=ゴースト)
const DR = {
  soft: { h: '..x...x...x...x.', v: 0.5 },
  walk: { k: 'x.......x.......', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.', v: 0.7 },
  pop: { k: 'x.....x.x.......', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.', o: '..............x.', v: 0.85 },
  four: { k: 'x...x...x...x...', s: '....x.......x...', h: '..x...x...x...x.', o: '..x...x...x...x.', v: 0.9 },
  rock: { k: 'x.....x.x.x.....', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.', o: '..............x.', v: 1, fill: 1, crash: 8 },
  gallop: { k: 'x..xx..xx..xx.x.', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.', v: 1, fill: 1, crash: 8 },
  march: { k: 'x...x...x...x...', s: 'x.x.X.x.x.x.X.xx', h: '................', v: 0.95, fill: 1, crash: 8 },
  taiko: { k: 'x.......x.......', t: '..1...2...1.2.3.', v: 0.9, boom: 1, crash: 8 },
  epic: { k: 'x...x...x...x...', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.', t: '..............12', v: 1, fill: 1, crash: 4, boom: 1 },
  heart: { k: 'x..x............', v: 0.55 },
  fight: { k: 'x..x..x.x..x..x.', s: 'x.g.X.g.x.g.X.xx', h: 'x.x.x.x.x.x.x.x.', o: '..............x.', v: 1, fill: 1, crash: 8 },
  grand: { k: 'x...x...x.x.x...', s: '....X.......X.x.', t: '..............12', v: 1, fill: 1, crash: 4, boom: 1 },
  fightB: { k: 'x..x..x.x.xx..x.', s: 'x.g.X.g.x.g.X.xx', h: 'xxxxxxxxxxxxxxxx', o: '..............x.', v: 1, fill: 1, crash: 8, boom: 1 },
  boss: { k: 'x..x..x.x.xx..x.', s: '....x.......x...', h: 'xxxxxxxxxxxxxxxx', o: '..............x.', v: 1, fill: 1, crash: 8, boom: 1 },
};

const TRACKS = {
  // ---------- むら ----------
  village: { bpm: 88, key: 60, mode: 'major', g: 1.0, chords: ['1', '6', '4', '5', '1', '6', '4', '5'],
    lead: [{ i: 'flute', v: 0.2, oct: 1, pass: 1, r: 0.35, m: "5:4 3:2 1:2 3:4 5:4|6:4 5:2 3:2 1:4 3:4|4:4 6:2 4:2 1:4 6,:4|5:6 4:2 2:4 7,:4|3:4 5:2 6:2 5:4 3:4|6:6 5:2 3:4 1:4|4:4 4:2 5:2 6:4 1':4|2':4 1':2 7:2 5:8" },
      { i: 'bell', v: 0.16, oct: 1, pass: 2, r: 0.5, m: "5:4 3:2 1:2 3:4 5:4|6:4 5:2 3:2 1:4 3:4|4:4 6:2 4:2 1:4 6,:4|5:6 4:2 2:4 7,:4|3:4 5:2 6:2 5:4 3:4|6:6 5:2 3:4 1:4|4:4 4:2 5:2 6:4 1':4|2':4 1':2 7:2 5:8" },
      { i: 'flute', v: 0.1, oct: 0, pass: 2, r: 0.35, m: "3:8 1:8|1:8 6,:8|1:8 4,:8|2:8 5,:8|1:8 3:8|3:8 1:8|1:8 6,:8|7,:8 5,:8" }],
    pad: { i: 'strings', v: 0.05, r: 0.5 }, bass: { i: 'bass', v: 0.2, p: '1.......5.......' }, arp: { i: 'harp', v: 0.1, p: '0.1.2.1.0.1.2.1.', up: 12, r: 0.4 }, drums: DR.soft },
  // ---------- フィールド(12) ----------
  f_forest: { bpm: 112, key: 67, mode: 'major', g: 1.0, chords: ['1', '5', '6', '4', '1', '5', '4', '5'],
    lead: [{ i: 'flute', v: 0.2, pass: 1, r: 0.3, m: "1:2 3:2 5:4 3:2 1:2 3:4|2:2 4:2 5:4 4:2 2:2 5,:4|3:2 5:2 6:4 5:2 3:2 6:2 5:2|4:4 6:2 4:2 1':4 6:4|5:4 3:2 5:2 1':4 5:4|2':4 1':2 7:2 5:4 2:4|6:2 6:2 1':4 3':4 1':2 6:2|5:8 7:2 5:2 2:4" },
      { i: 'lead', v: 0.11, pass: 2, r: 0.3, m: "1:2 3:2 5:4 3:2 1:2 3:4|2:2 4:2 5:4 4:2 2:2 5,:4|3:2 5:2 6:4 5:2 3:2 6:2 5:2|4:4 6:2 4:2 1':4 6:4|5:4 3:2 5:2 1':4 5:4|2':4 1':2 7:2 5:4 2:4|6:2 6:2 1':4 3':4 1':2 6:2|5:8 7:2 5:2 2:4" },
      { i: 'flute', v: 0.13, pass: 2, r: 0.3, m: "1:2 3:2 5:4 3:2 1:2 3:4|2:2 4:2 5:4 4:2 2:2 5,:4|3:2 5:2 6:4 5:2 3:2 6:2 5:2|4:4 6:2 4:2 1':4 6:4|5:4 3:2 5:2 1':4 5:4|2':4 1':2 7:2 5:4 2:4|6:2 6:2 1':4 3':4 1':2 6:2|5:8 7:2 5:2 2:4" }],
    pad: { i: 'strings', v: 0.045, pass: 2 }, bass: { i: 'bass', v: 0.2, p: '1.....5.1.....5.' }, arp: { i: 'pluck', v: 0.1, p: '0.1.2.1.0.1.2.1.', up: 12 },
    drums: [{ ...DR.walk, pass: 1 }, { ...DR.pop, pass: 2 }] },
  f_lake: { bpm: 76, key: 65, mode: 'major', g: 1.0, chords: ['1', '6', '2', '5', '4', '1', '2', '5'],
    lead: [{ i: 'flute', v: 0.2, pass: 1, r: 0.5, m: "5:6 3:2 1:4 3:4|6:4 1':2 6:2 3':8|2':4 4':2 2':2 6:4 4:4|5:4 7:4 2':4 7:4|4:4 6:2 1':2 4':4 1':4|3':4 1':2 5:2 1':8|2':4 4':4 2':4 6:4|5:2 7:2 2':4 5':2 2':2 7:4" },
      { i: 'bell', v: 0.17, pass: 2, r: 0.6, m: "5:6 3:2 1:4 3:4|6:4 1':2 6:2 3':8|2':4 4':2 2':2 6:4 4:4|5:4 7:4 2':4 7:4|4:4 6:2 1':2 4':4 1':4|3':4 1':2 5:2 1':8|2':4 4':4 2':4 6:4|5:2 7:2 2':4 5':2 2':2 7:4" }],
    pad: { i: 'strings', v: 0.05, r: 0.6 }, bass: { i: 'bass', v: 0.17, p: '1.......5.......' }, arp: { i: 'harp', v: 0.12, p: '0.1.2.3.2.1.0.1.', up: 12, r: 0.5 }, drums: { ...DR.soft, pass: 2 } },
  f_volcano: { bpm: 126, key: 62, mode: 'phrygian', g: 1.0, chords: ['1', '2', '1', '7', '1', '2', '7', '2'],
    lead: [{ i: 'brass', v: 0.2, pass: 1, r: 0.25, m: "1:3 1:1 3:2 1:2 5:4 3:2 1:2|2:3 2:1 4:2 2:2 6:4 4:2 2:2|1:2 3:2 5:2 3:2 1':4 5:4|7,:4 2:2 4:2 7:4 4:4|5:3 5:1 3:2 1:2 3:4 5:4|6:3 6:1 4:2 2:2 4:4 6:4|7:4 5:2 4:2 2:4 4:4|2:2 4:2 6:4 2':8" },
      { i: 'brass', v: 0.2, pass: 2, r: 0.25, m: "1:3 1:1 3:2 1:2 5:4 3:2 1:2|2:3 2:1 4:2 2:2 6:4 4:2 2:2|1:2 3:2 5:2 3:2 1':4 5:4|7,:4 2:2 4:2 7:4 4:4|5:3 5:1 3:2 1:2 3:4 5:4|6:3 6:1 4:2 2:2 4:4 6:4|7:4 5:2 4:2 2:4 4:4|2:2 4:2 6:4 2':8" },
      { i: 'lead', v: 0.1, oct: 1, pass: 2, r: 0.25, m: "1:3 1:1 3:2 1:2 5:4 3:2 1:2|2:3 2:1 4:2 2:2 6:4 4:2 2:2|1:2 3:2 5:2 3:2 1':4 5:4|7,:4 2:2 4:2 7:4 4:4|5:3 5:1 3:2 1:2 3:4 5:4|6:3 6:1 4:2 2:2 4:4 6:4|7:4 5:2 4:2 2:4 4:4|2:2 4:2 6:4 2':8" }],
    pad: { i: 'strings', v: 0.05 }, bass: { i: 'synbass', v: 0.22, p: '1.1.1.1.1.1.1.1.' }, arp: { i: 'pluck', v: 0.07, p: '0.....1.0.....2.', up: 12, pass: 2 },
    drums: [{ ...DR.taiko, pass: 1 }, { ...DR.epic, pass: 2 }] },
  f_ghost: { bpm: 70, key: 64, mode: 'minor', g: 1.0, chords: ['1', '2d', '1', '7', '1', '6', '2d', '5M'],
    lead: [{ i: 'bell', v: 0.18, pass: 1, r: 0.7, m: "1':6 r:2 5:4 3:4|2':4 r:4 4':4 2':4|1':4 3':4 1':4 7:4|7:8 2':4 7:4|5,:8 3,:4 1,:4|6,:6 5,:2 3,:4 5,:4|2:4 4:4 6:4 4:4|5:4 7#:4 2':4 5:4" },
      { i: 'flute', v: 0.12, pass: 2, r: 0.7, m: "1':6 r:2 5:4 3:4|2':4 r:4 4':4 2':4|1':4 3':4 1':4 7:4|7:8 2':4 7:4|5,:8 3,:4 1,:4|6,:6 5,:2 3,:4 5,:4|2:4 4:4 6:4 4:4|5:4 7#:4 2':4 5:4" }],
    pad: { i: 'choir', v: 0.06, r: 0.7 }, bass: { i: 'bass', v: 0.14, p: '1...............' }, arp: { i: 'bell', v: 0.07, p: '0...1...2...1...', up: 12, r: 0.7, pass: 2 }, drums: DR.heart },
  f_sky: { bpm: 92, key: 60, mode: 'major', g: 1.0, chords: ['1', '5', '6', '3', '4', '1', '4', '5'],
    lead: [{ i: 'flute', v: 0.2, oct: 1, pass: 1, r: 0.5, m: "5:4 3:2 5:2 1':4 5:4|2':4 7:2 5:2 7:4 2':4|3':4 1':2 6:2 3':4 6:4|7:4 5:2 3:2 5:8|4:4 6:2 4:2 1':4 4':4|3':4 1':2 5:2 1':8|6:4 4':4 1':4 6:4|2':4 7:2 2':2 5:8" },
      { i: 'bell', v: 0.15, oct: 1, pass: 2, r: 0.6, m: "5:4 3:2 5:2 1':4 5:4|2':4 7:2 5:2 7:4 2':4|3':4 1':2 6:2 3':4 6:4|7:4 5:2 3:2 5:8|4:4 6:2 4:2 1':4 4':4|3':4 1':2 5:2 1':8|6:4 4':4 1':4 6:4|2':4 7:2 2':2 5:8" },
      { i: 'flute', v: 0.12, oct: 0, pass: 2, r: 0.5, m: "3:8 1:8|2:8 5,:8|1:8 6,:8|3:8 5,:8|1:8 4,:8|1:8 3:8|4,:8 6,:8|2:8 7,:8" }],
    pad: { i: 'choir', v: 0.06, r: 0.6 }, bass: { i: 'bass', v: 0.15, p: '1.......5.......' }, arp: { i: 'harp', v: 0.12, p: '0.1.2.3.4.3.2.1.', up: 12, r: 0.5 }, drums: { ...DR.walk, v: 0.55, pass: 2 } },
  f_sun: { bpm: 118, key: 62, mode: 'major', g: 1.0, chords: ['1', '5', '6', '4', '1', '5', '4', '5'],
    lead: [{ i: 'lead', v: 0.16, pass: 1, r: 0.25, m: "1':2 1':2 3':2 5':2 3':4 1':4|7:2 7:2 5:2 7:2 2':8|6:4 1':2 3':2 6':4 3':4|4':4 6:2 1':2 4':4 1':4|1':2 3':2 5':4 3':2 1':2 5:4|7':2 5':2 2':4 7':2 5':2 7':4|4':2 6':2 1'':4 6':2 4':2 6':4|5':8 7':2 5':2 2':4" },
      { i: 'brass', v: 0.17, pass: 2, r: 0.25, m: "1':2 1':2 3':2 5':2 3':4 1':4|7:2 7:2 5:2 7:2 2':8|6:4 1':2 3':2 6':4 3':4|4':4 6:2 1':2 4':4 1':4|1':2 3':2 5':4 3':2 1':2 5:4|7':2 5':2 2':4 7':2 5':2 7':4|4':2 6':2 1'':4 6':2 4':2 6':4|5':8 7':2 5':2 2':4" }],
    pad: { i: 'strings', v: 0.045, pass: 2 }, bass: { i: 'bass', v: 0.2, p: '1.1.5.1.1.1.5.1.' }, arp: { i: 'pluck', v: 0.09, p: '0.1.2.1.0.1.2.1.', up: 12 }, drums: [{ ...DR.walk, pass: 1 }, { ...DR.pop, pass: 2 }] },
  f_cosmos: { bpm: 80, key: 65, mode: 'lydian', g: 1.0, chords: ['1', '2', '3', '2', '1', '2', '5', '2'],
    lead: [{ i: 'bell', v: 0.18, pass: 1, r: 0.8, m: "5:4 1':4 3':4 5:4|2':8 4':4 2':4|3':4 1':4 6:4 3:4|2':4 7:4 5:4 7:4|1':8 5:4 1':4|4':4 2':4 4':4 6':4|5':8 3':4 5:4|2':4 4':4 7:4 5:4" },
      { i: 'choir', v: 0.1, pass: 2, r: 0.8, m: "5:4 1':4 3':4 5:4|2':8 4':4 2':4|3':4 1':4 6:4 3:4|2':4 7:4 5:4 7:4|1':8 5:4 1':4|4':4 2':4 4':4 6':4|5':8 3':4 5:4|2':4 4':4 7:4 5:4" }],
    pad: { i: 'choir', v: 0.055, r: 0.8 }, bass: { i: 'bass', v: 0.14, p: '1...............' }, arp: { i: 'bell', v: 0.09, p: '0.1.2.1.0.1.2.3.', up: 12, r: 0.8, delay: 1 }, drums: { ...DR.soft, v: 0.4, pass: 2 } },
  f_grove: { bpm: 90, key: 62, mode: 'major', g: 1.0, chords: ['1', '6', '2', '5', '1', '3', '4', '5'],
    lead: [{ i: 'flute', v: 0.2, pass: 1, r: 0.45, m: "1':4 3':2 5':2 3':4 1':4|6:4 1':2 3':2 1':4 6:4|2':4 4':2 6:2 4':4 2':4|5:4 7:2 2':2 7:4 5:4|3':4 5':2 3':2 1':4 3':4|3':4 5':4 7':4 5':4|4':4 6:2 4':2 1':4 4':4|5:4 7:4 2':4 5:4" },
      { i: 'marimba', v: 0.17, pass: 2, r: 0.4, m: "1':4 3':2 5':2 3':4 1':4|6:4 1':2 3':2 1':4 6:4|2':4 4':2 6:2 4':4 2':4|5:4 7:2 2':2 7:4 5:4|3':4 5':2 3':2 1':4 3':4|3':4 5':4 7':4 5':4|4':4 6:2 4':2 1':4 4':4|5:4 7:4 2':4 5:4" }],
    pad: { i: 'strings', v: 0.045, r: 0.5 }, bass: { i: 'bass', v: 0.16, p: '1.....5.1.....5.' }, arp: { i: 'marimba', v: 0.11, p: '0.1.2.1.0.1.2.1.', up: 12 }, drums: [{ ...DR.soft, pass: 1 }, { ...DR.walk, v: 0.55, pass: 2 }] },
  f_castle: { bpm: 104, key: 60, mode: 'minor', g: 1.0, chords: ['1', '4', '5M', '1', '6', '4', '5M', '5M'],
    lead: [{ i: 'organ', v: 0.17, pass: 1, r: 0.5, m: "1':4 3':2 5':2 3':4 1':4|4':4 6':2 4':2 1':8|5':4 7#':2 2'':2 7#':4 5':4|1'':4 5':2 3':2 1':8|6':4 1'':2 6':2 3':4 1'':4|4':4 6':4 1'':4 6':4|5':4 7#':4 2'':4 7#':4|5':8 7#':4 5':4" },
      { i: 'brass', v: 0.18, pass: 2, r: 0.4, m: "1':4 3':2 5':2 3':4 1':4|4':4 6':2 4':2 1':8|5':4 7#':2 2'':2 7#':4 5':4|1'':4 5':2 3':2 1':8|6':4 1'':2 6':2 3':4 1'':4|4':4 6':4 1'':4 6':4|5':4 7#':4 2'':4 7#':4|5':8 7#':4 5':4" }],
    pad: { i: 'strings', v: 0.06, r: 0.6 }, bass: { i: 'bass', v: 0.2, p: '1.....1.5.....1.' }, arp: { i: 'harp', v: 0.1, p: '0.1.2.1.0.1.2.1.', up: 12, r: 0.5 }, drums: [{ ...DR.heart, v: 0.7, pass: 1 }, { ...DR.march, v: 0.6, pass: 2 }] },
  f_temple: { bpm: 88, key: 64, mode: 'dorian', g: 1.0, chords: ['1', '7', '4', '1', '1', '7', '4', '5'],
    lead: [{ i: 'flute', v: 0.2, pass: 1, r: 0.6, m: "5:4 1':4 3':4 1':4|7:4 2':4 4':4 2':4|6':4 4':4 1':4 6:4|5:8 1':4 5:4|3':4 5':4 3':4 1':4|7':4 4':4 2':4 7:4|4':4 6':4 1'':4 6':4|5':8 7':4 5':4" },
      { i: 'choir', v: 0.1, pass: 2, r: 0.7, m: "5:4 1':4 3':4 1':4|7:4 2':4 4':4 2':4|6':4 4':4 1':4 6:4|5:8 1':4 5:4|3':4 5':4 3':4 1':4|7':4 4':4 2':4 7:4|4':4 6':4 1'':4 6':4|5':8 7':4 5':4" }],
    pad: { i: 'choir', v: 0.06, r: 0.7 }, bass: { i: 'bass', v: 0.16, p: '1.......1.......' }, arp: { i: 'harp', v: 0.1, p: '0.1.2.3.2.1.0.1.', up: 12, r: 0.6 }, drums: [{ ...DR.taiko, v: 0.6, pass: 2 }] },
  f_dragon: { bpm: 120, key: 62, mode: 'minor', g: 1.0, chords: ['1', '6', '7', '1', '1', '6', '5M', '5M'],
    lead: [{ i: 'brass', v: 0.19, pass: 1, r: 0.3, m: "1':4 3':2 5':2 5':4 3':4|6:4 1':2 3':2 6':4 3':4|7:4 2':2 4':2 7':4 4':4|1':8 5:4 1':4|5':4 3':2 5':2 1'':4 5':4|6':4 3':2 6':2 1'':4 6':4|5':4 7#':4 2'':4 7#':4|5':8 7#':4 5':4" },
      { i: 'brass', v: 0.19, pass: 2, r: 0.3, m: "1':4 3':2 5':2 5':4 3':4|6:4 1':2 3':2 6':4 3':4|7:4 2':2 4':2 7':4 4':4|1':8 5:4 1':4|5':4 3':2 5':2 1'':4 5':4|6':4 3':2 6':2 1'':4 6':4|5':4 7#':4 2'':4 7#':4|5':8 7#':4 5':4" },
      { i: 'lead', v: 0.09, pass: 2, r: 0.3, m: "1':4 3':2 5':2 5':4 3':4|6:4 1':2 3':2 6':4 3':4|7:4 2':2 4':2 7':4 4':4|1':8 5:4 1':4|5':4 3':2 5':2 1'':4 5':4|6':4 3':2 6':2 1'':4 6':4|5':4 7#':4 2'':4 7#':4|5':8 7#':4 5':4" }],
    pad: { i: 'strings', v: 0.06 }, bass: { i: 'synbass', v: 0.22, p: '1.1.1.1.1.1.1.1.' }, arp: { i: 'pluck', v: 0.07, p: '0.1.2.1.0.1.2.1.', up: 12, pass: 2 },
    drums: [{ ...DR.rock, pass: 1 }, { ...DR.epic, pass: 2 }] },
  f_end: { bpm: 100, key: 71, mode: 'minor', g: 1.0, chords: ['1', '6', '3', '7', '1', '6', '4', '5M'],
    lead: [{ i: 'choir', v: 0.17, pass: 1, r: 0.8, m: "1:4 3:4 5:4 3:4|6:4 1':4 3':4 1':4|3':4 5:4 7:4 5:4|7:4 2':4 4':4 2':4|5:6 3:2 1:4 3:4|6:4 4:4 6:4 1':4|4:4 6:4 1':4 6:4|5:4 7#:4 2':4 7#:4" },
      { i: 'brass', v: 0.17, pass: 2, r: 0.5, m: "1:4 3:4 5:4 3:4|6:4 1':4 3':4 1':4|3':4 5:4 7:4 5:4|7:4 2':4 4':4 2':4|5:6 3:2 1:4 3:4|6:4 4:4 6:4 1':4|4:4 6:4 1':4 6:4|5:4 7#:4 2':4 7#:4" },
      { i: 'bell', v: 0.12, pass: 2, r: 0.8, m: "1:4 3:4 5:4 3:4|6:4 1':4 3':4 1':4|3':4 5:4 7:4 5:4|7:4 2':4 4':4 2':4|5:6 3:2 1:4 3:4|6:4 4:4 6:4 1':4|4:4 6:4 1':4 6:4|5:4 7#:4 2':4 7#:4" }],
    pad: { i: 'choir', v: 0.065, r: 0.8 }, bass: { i: 'bass', v: 0.2, p: '1.....1.5.....1.' }, arp: { i: 'bell', v: 0.1, p: '0.1.2.3.4.3.2.1.', up: 12, r: 0.8, delay: 1 },
    drums: [{ ...DR.walk, v: 0.5, pass: 1 }, { ...DR.epic, pass: 2 }] },
  // ---------- バトル ----------
  battle: { bpm: 164, key: 57, mode: 'minor', g: 1.0, chords: ['Am', 'Am', 'F', 'G', 'Am', 'F', 'Dm', 'E'],
    lead: [{ i: 'lead', v: 0.15, r: 0.2, notes: [[0, 81, 2], [2, 76, 2], [4, 72, 2], [6, 76, 2], [8, 81, 4], [12, 79, 2], [14, 76, 2], [0, 77, 2], [2, 76, 2], [4, 72, 2], [6, 69, 2], [8, 72, 8], [0, 77, 2], [2, 81, 2], [4, 84, 2], [6, 81, 2], [8, 77, 4], [12, 81, 4], [0, 83, 2], [2, 79, 2], [4, 74, 2], [6, 79, 2], [8, 83, 6], [14, 81, 2], [0, 81, 2], [2, 84, 2], [4, 88, 4], [8, 86, 2], [10, 84, 2], [12, 81, 4], [0, 84, 2], [2, 81, 2], [4, 77, 2], [6, 81, 2], [8, 84, 8], [0, 86, 2], [2, 81, 2], [4, 77, 2], [6, 74, 2], [8, 77, 4], [12, 81, 4], [0, 80, 2], [2, 83, 2], [4, 88, 4], [8, 87, 2], [10, 83, 2], [12, 80, 2], [14, 83, 2]] },
      { i: 'brass', v: 0.1, r: 0.2, pass: 2, notes: [[0, 81, 2], [2, 76, 2], [4, 72, 2], [6, 76, 2], [8, 81, 4], [12, 79, 2], [14, 76, 2], [0, 77, 2], [2, 76, 2], [4, 72, 2], [6, 69, 2], [8, 72, 8], [0, 77, 2], [2, 81, 2], [4, 84, 2], [6, 81, 2], [8, 77, 4], [12, 81, 4], [0, 83, 2], [2, 79, 2], [4, 74, 2], [6, 79, 2], [8, 83, 6], [14, 81, 2], [0, 81, 2], [2, 84, 2], [4, 88, 4], [8, 86, 2], [10, 84, 2], [12, 81, 4], [0, 84, 2], [2, 81, 2], [4, 77, 2], [6, 81, 2], [8, 84, 8], [0, 86, 2], [2, 81, 2], [4, 77, 2], [6, 74, 2], [8, 77, 4], [12, 81, 4], [0, 80, 2], [2, 83, 2], [4, 88, 4], [8, 87, 2], [10, 83, 2], [12, 80, 2], [14, 83, 2]] }],
    pad: { i: 'strings', v: 0.05, r: 0.3 }, bass: { i: 'synbass', v: 0.22, p: '1.11.1.11.1.1.1.' }, arp: { i: 'pluck', v: 0.06, p: '0.1.2.1.2.1.0.1.', up: 12 }, drums: DR.gallop },
  battle2: { bpm: 154, key: 64, mode: 'minor', g: 1.0, chords: ['1', '7', '6', '7', '1', '4', '5M', '1'],
    lead: [{ i: 'lead', v: 0.16, r: 0.2, pass: 1, m: "1':2 1':2 3':2 5':2 3':4 1':2 7:2|7':2 7':2 2':2 4':2 2':4 7':4|6':2 6':2 1':2 3':2 1':4 6':4|7':4 2':2 4':2 2':4 4':4|1':2 3':2 5':2 3':2 1':2 5':2 3':2 1':2|4':4 6':2 1':2 4':4 6':4|5':4 7#':2 2'':2 7#':4 5':4|1':8 3':4 5':4" },
      { i: 'brass', v: 0.17, r: 0.2, pass: 2, m: "1':2 1':2 3':2 5':2 3':4 1':2 7:2|7':2 7':2 2':2 4':2 2':4 7':4|6':2 6':2 1':2 3':2 1':4 6':4|7':4 2':2 4':2 2':4 4':4|1':2 3':2 5':2 3':2 1':2 5':2 3':2 1':2|4':4 6':2 1':2 4':4 6':4|5':4 7#':2 2'':2 7#':4 5':4|1':8 3':4 5':4" },
      { i: 'lead', v: 0.08, r: 0.2, pass: 2, m: "1':2 1':2 3':2 5':2 3':4 1':2 7:2|7':2 7':2 2':2 4':2 2':4 7':4|6':2 6':2 1':2 3':2 1':4 6':4|7':4 2':2 4':2 2':4 4':4|1':2 3':2 5':2 3':2 1':2 5':2 3':2 1':2|4':4 6':2 1':2 4':4 6':4|5':4 7#':2 2'':2 7#':4 5':4|1':8 3':4 5':4" }],
    pad: { i: 'strings', v: 0.05 }, bass: { i: 'synbass', v: 0.22, p: '1.1.1.1.1.1.1.1.' }, arp: { i: 'pluck', v: 0.06, p: '0.1.2.1.2.1.0.1.', up: 12 }, drums: DR.rock },
  battle3: { bpm: 158, key: 62, mode: 'dorian', g: 1.0, chords: ['1', '4', '1', '4', '1', '4', '7', '5'],
    lead: [{ i: 'lead', v: 0.16, r: 0.2, pass: 1, m: "1':2 3':2 5':2 3':2 1':4 5:4|4':2 6:2 1':2 6:2 4':4 1':4|1':2 3':2 5':2 6':2 5':4 3':4|4':2 6':2 4':2 1':2 6:4 4:4|5':4 3':2 5':2 6':4 5':4|6':4 4':2 6':2 4':4 1':4|7':2 7':2 2':2 4':2 7':4 4':4|5':4 7':4 5':4 3':4" },
      { i: 'brass', v: 0.17, r: 0.2, pass: 2, m: "1':2 3':2 5':2 3':2 1':4 5:4|4':2 6:2 1':2 6:2 4':4 1':4|1':2 3':2 5':2 6':2 5':4 3':4|4':2 6':2 4':2 1':2 6:4 4:4|5':4 3':2 5':2 6':4 5':4|6':4 4':2 6':2 4':4 1':4|7':2 7':2 2':2 4':2 7':4 4':4|5':4 7':4 5':4 3':4" }],
    pad: { i: 'strings', v: 0.05 }, bass: { i: 'synbass', v: 0.22, p: '1.1.1.1.1.1.1.1.' }, arp: { i: 'pluck', v: 0.06, p: '0.2.1.2.0.2.1.2.', up: 12 }, drums: DR.gallop },
  battle_trainer: { bpm: 168, key: 60, mode: 'minor', g: 1.0, chords: ['1', '1', '4', '5M', '1', '6', '4', '5M'],
    lead: [{ i: 'brass', v: 0.19, r: 0.2, m: "1':3 1':1 3':2 5':2 3':2 1':2 5:4|1':3 1':1 3':2 5':2 1'':4 5':4|4':3 4':1 6':2 1'':2 6':4 4':4|5':3 5':1 7#':2 2'':2 7#':4 5':4|1':2 3':2 5':2 3':2 1'':4 5':4|6':4 1'':2 6':2 3':4 1':4|4':2 6':2 1'':2 6':2 4':4 6':4|5':2 5':2 7#':2 2'':2 7#':4 5':4" },
      { i: 'lead', v: 0.1, r: 0.2, pass: 2, m: "1':3 1':1 3':2 5':2 3':2 1':2 5:4|1':3 1':1 3':2 5':2 1'':4 5':4|4':3 4':1 6':2 1'':2 6':4 4':4|5':3 5':1 7#':2 2'':2 7#':4 5':4|1':2 3':2 5':2 3':2 1'':4 5':4|6':4 1'':2 6':2 3':4 1':4|4':2 6':2 1'':2 6':2 4':4 6':4|5':2 5':2 7#':2 2'':2 7#':4 5':4" }],
    pad: { i: 'strings', v: 0.055 }, bass: { i: 'synbass', v: 0.22, p: '1.11.1.11.1.1.1.' }, arp: { i: 'pluck', v: 0.06, p: '0.1.2.1.0.1.2.1.', up: 12 }, drums: DR.march },
  battle_legend: { bpm: 148, key: 66, mode: 'minor', g: 1.0, chords: ['1', '6', '3', '7', '1', '6', '4', '5M'],
    lead: [{ i: 'choir', v: 0.17, r: 0.6, pass: 1, m: "1':4 3':2 5':2 3':4 1':4|6:4 1':2 3':2 6':4 3':4|3':4 5':2 7:2 5':4 3':4|7:4 2':2 4':2 2':4 7:4|5':4 3':2 5':2 3':4 1':4|6':4 3':2 6':2 3':4 1':4|4':4 6':2 1':2 6:4 4:4|5':4 7#':4 5':4 7#':4" },
      { i: 'brass', v: 0.19, r: 0.4, pass: 2, m: "1':4 3':2 5':2 3':4 1':4|6:4 1':2 3':2 6':4 3':4|3':4 5':2 7:2 5':4 3':4|7:4 2':2 4':2 2':4 7:4|5':4 3':2 5':2 3':4 1':4|6':4 3':2 6':2 3':4 1':4|4':4 6':2 1':2 6:4 4:4|5':4 7#':4 5':4 7#':4" },
      { i: 'choir', v: 0.1, r: 0.6, pass: 2, m: "1':4 3':2 5':2 3':4 1':4|6:4 1':2 3':2 6':4 3':4|3':4 5':2 7:2 5':4 3':4|7:4 2':2 4':2 2':4 7:4|5':4 3':2 5':2 3':4 1':4|6':4 3':2 6':2 3':4 1':4|4':4 6':2 1':2 6:4 4:4|5':4 7#':4 5':4 7#':4" }],
    pad: { i: 'strings', v: 0.06, r: 0.5 }, bass: { i: 'synbass', v: 0.22, p: '1.1.1.1.1.1.1.1.' }, arp: { i: 'bell', v: 0.09, p: '0.1.2.3.2.1.0.1.', up: 12, r: 0.7 }, drums: DR.epic },
  // ---------- ボス ----------
  boss: { bpm: 170, key: 62, mode: 'minor', g: 1.0, chords: ['Dm', 'Dm', 'Bb', 'A', 'Dm', 'Gm', 'Edim', 'A', 'Bb', 'F', 'Gm', 'Dm', 'Bb', 'F', 'A', 'A'],
    lead: [{ i: 'brass', v: 0.2, r: 0.25, notes: [[0, 86, 3], [3, 85, 1], [4, 86, 2], [6, 89, 2], [8, 88, 4], [12, 86, 2], [14, 85, 2], [0, 81, 2], [2, 82, 2], [4, 81, 2], [6, 77, 2], [8, 74, 8], [0, 89, 3], [3, 86, 1], [4, 82, 4], [8, 86, 2], [10, 89, 2], [12, 91, 4], [0, 88, 3], [3, 85, 1], [4, 81, 4], [8, 85, 2], [10, 88, 2], [12, 85, 4], [0, 86, 2], [2, 89, 2], [4, 93, 4], [8, 91, 2], [10, 89, 2], [12, 86, 4], [0, 91, 3], [3, 89, 1], [4, 86, 4], [8, 82, 2], [10, 86, 2], [12, 89, 4], [0, 88, 2], [2, 85, 2], [4, 82, 2], [6, 79, 2], [8, 76, 4], [12, 79, 4], [0, 85, 2], [2, 88, 2], [4, 91, 2], [6, 88, 2], [8, 85, 4], [12, 81, 4], [0, 82, 4], [4, 86, 4], [8, 89, 8], [0, 89, 4], [4, 88, 2], [6, 86, 2], [8, 84, 8], [0, 82, 4], [4, 86, 4], [8, 91, 4], [12, 89, 4], [0, 86, 8], [8, 89, 4], [12, 86, 4], [0, 89, 4], [4, 93, 4], [8, 91, 4], [12, 89, 4], [0, 88, 4], [4, 89, 4], [8, 93, 8], [0, 91, 2], [2, 88, 2], [4, 85, 2], [6, 88, 2], [8, 91, 2], [10, 93, 2], [12, 91, 4], [0, 85, 4], [4, 88, 4], [8, 81, 8]] },
      { i: 'lead', v: 0.09, r: 0.25, pass: 2, notes: [[0, 86, 3], [3, 85, 1], [4, 86, 2], [6, 89, 2], [8, 88, 4], [12, 86, 2], [14, 85, 2], [0, 81, 2], [2, 82, 2], [4, 81, 2], [6, 77, 2], [8, 74, 8], [0, 89, 3], [3, 86, 1], [4, 82, 4], [8, 86, 2], [10, 89, 2], [12, 91, 4], [0, 88, 3], [3, 85, 1], [4, 81, 4], [8, 85, 2], [10, 88, 2], [12, 85, 4], [0, 86, 2], [2, 89, 2], [4, 93, 4], [8, 91, 2], [10, 89, 2], [12, 86, 4], [0, 91, 3], [3, 89, 1], [4, 86, 4], [8, 82, 2], [10, 86, 2], [12, 89, 4], [0, 88, 2], [2, 85, 2], [4, 82, 2], [6, 79, 2], [8, 76, 4], [12, 79, 4], [0, 85, 2], [2, 88, 2], [4, 91, 2], [6, 88, 2], [8, 85, 4], [12, 81, 4], [0, 82, 4], [4, 86, 4], [8, 89, 8], [0, 89, 4], [4, 88, 2], [6, 86, 2], [8, 84, 8], [0, 82, 4], [4, 86, 4], [8, 91, 4], [12, 89, 4], [0, 86, 8], [8, 89, 4], [12, 86, 4], [0, 89, 4], [4, 93, 4], [8, 91, 4], [12, 89, 4], [0, 88, 4], [4, 89, 4], [8, 93, 8], [0, 91, 2], [2, 88, 2], [4, 85, 2], [6, 88, 2], [8, 91, 2], [10, 93, 2], [12, 91, 4], [0, 85, 4], [4, 88, 4], [8, 81, 8]] }],
    pad: { i: 'strings', v: 0.06 }, bass: { i: 'synbass', v: 0.24, p: '1.11.1.11.1.1.11' }, arp: { i: 'pluck', v: 0.06, p: '0123012301230123', up: 12 }, drums: DR.boss },
  boss2: { bpm: 176, key: 59, mode: 'minor', g: 1.0, chords: ['1', '1', '6', '5M', '1', '4', '7', '5M', '6', '4', '1', '5M', '6', '7', '5M', '5M'],
    lead: [{ i: 'brass', v: 0.2, r: 0.3, m: "1':3 1':1 3':2 5':2 1'':4 5':4|3':3 3':1 5':2 3':2 1':8|6':3 6':1 1'':2 6':2 3'':4 1'':4|5':4 7#':2 2'':2 7#':4 5':4|1'':4 5':2 3':2 1'':4 5':4|4':4 6':2 4':2 1'':4 6':4|7':3 7':1 2'':2 7':2 4'':4 2'':4|5':4 7#':4 2'':4 5':4|6':4 1'':4 3'':4 1'':4|4':4 6':4 1'':4 6':4|1'':4 3'':2 1'':2 5':4 1'':4|5':8 7#':4 2'':4|6':4 3'':4 1'':4 6':4|7':4 4'':4 2'':4 7':4|5':2 7#':2 2'':2 7#':2 2'':4 7#':4|5':8 7#':4 5':4" },
      { i: 'choir', v: 0.1, r: 0.6, pass: 2, m: "1':3 1':1 3':2 5':2 1'':4 5':4|3':3 3':1 5':2 3':2 1':8|6':3 6':1 1'':2 6':2 3'':4 1'':4|5':4 7#':2 2'':2 7#':4 5':4|1'':4 5':2 3':2 1'':4 5':4|4':4 6':2 4':2 1'':4 6':4|7':3 7':1 2'':2 7':2 4'':4 2'':4|5':4 7#':4 2'':4 5':4|6':4 1'':4 3'':4 1'':4|4':4 6':4 1'':4 6':4|1'':4 3'':2 1'':2 5':4 1'':4|5':8 7#':4 2'':4|6':4 3'':4 1'':4 6':4|7':4 4'':4 2'':4 7':4|5':2 7#':2 2'':2 7#':2 2'':4 7#':4|5':8 7#':4 5':4" }],
    pad: { i: 'strings', v: 0.065 }, bass: { i: 'synbass', v: 0.24, p: '1.11.1.11.1.1.11' }, arp: { i: 'pluck', v: 0.06, p: '0123012301230123', up: 12 }, drums: DR.boss },
  boss_final: { bpm: 180, key: 57, mode: 'minor', g: 1.0, chords: ['1', '1', '6', '7', '1', '4', '5M', '1', '6', '7', '1', '5M', '4', '6', '5M', '5M'],
    lead: [{ i: 'brass', v: 0.2, r: 0.3, m: "1':2 1':2 1':2 3':2 5':4 3':2 1':2|1':3 1':1 3':2 5':2 1'':4 5':4|6':4 1'':2 6':2 3'':4 1'':4|7':4 2'':2 7':2 4'':4 2'':4|1'':4 5':2 3':2 1'':4 3'':4|4':4 6':2 4':2 1'':4 6':4|5':4 7#':2 2'':2 7#':4 5':4|1'':8 5':4 1'':4|6':2 1'':2 3'':4 1'':4 6':4|7':2 2'':2 4'':4 2'':4 7':4|1'':4 3'':2 5'':2 3'':4 1'':4|5':4 7#':4 2'':4 7#':4|4':4 6':4 1'':4 6':4|6':4 1'':4 3'':4 1'':4|5':2 7#':2 2'':2 7#':2 5'':4 2'':4|5':8 7#':4 2'':4" },
      { i: 'choir', v: 0.11, r: 0.6, m: "1':2 1':2 1':2 3':2 5':4 3':2 1':2|1':3 1':1 3':2 5':2 1'':4 5':4|6':4 1'':2 6':2 3'':4 1'':4|7':4 2'':2 7':2 4'':4 2'':4|1'':4 5':2 3':2 1'':4 3'':4|4':4 6':2 4':2 1'':4 6':4|5':4 7#':2 2'':2 7#':4 5':4|1'':8 5':4 1'':4|6':2 1'':2 3'':4 1'':4 6':4|7':2 2'':2 4'':4 2'':4 7':4|1'':4 3'':2 5'':2 3'':4 1'':4|5':4 7#':4 2'':4 7#':4|4':4 6':4 1'':4 6':4|6':4 1'':4 3'':4 1'':4|5':2 7#':2 2'':2 7#':2 5'':4 2'':4|5':8 7#':4 2'':4" }],
    pad: { i: 'strings', v: 0.07 }, bass: { i: 'synbass', v: 0.24, p: '1.11.1.11.1.1.11' }, arp: { i: 'bell', v: 0.08, p: '0123210301232103', up: 12, r: 0.6 }, drums: { ...DR.boss, crash: 4 } },
};
// ファミコン風の べつパターン: 戦闘曲3つを コピー(矩形波2+波形メモリベース+ノイズドラム)
for (const k of ['battle', 'battle2', 'battle3']) TRACKS['chip_' + k] = JSON.parse(JSON.stringify(TRACKS[k]));
// GBA風 どうどうパターン: トレーナー・でんせつ・ボス用の コピー
const GBA_SRC = { gba_trainer: 'battle_trainer', gba_legend: 'battle_legend', gba_boss: 'boss', gba_boss2: 'boss2' };
for (const [k, v] of Object.entries(GBA_SRC)) TRACKS[k] = JSON.parse(JSON.stringify(TRACKS[v]));
// ピアノ主役パターン: ピアノ=イントロ+しゅせんりつ / ストリングス=きんぱくの ばんそう+メロディ補強 / 金管=サビ / ベース+ドラム=はやさ
const PF_SRC = { pf_battle: 'battle', pf_battle2: 'battle2', pf_battle3: 'battle3', pf_trainer: 'battle_trainer', pf_boss: 'boss', pf_boss2: 'boss2' };
for (const [k, v] of Object.entries(PF_SRC)) TRACKS[k] = JSON.parse(JSON.stringify(TRACKS[v]));
// きょくの てんかい: sty=がっきの ならべかた / intro=イントロの しょうせつすう / lift=さいごの 8しょうせつで あげる はんおん / brk=いったん しずまる しょうせつ(つぎで ばくはつ) / riser=もりあげの ノイズ
const PLAN = {
  village: { sty: 'folk' }, f_forest: { sty: 'folk' }, f_lake: { sty: 'folk' }, f_grove: { sty: 'folk' }, f_sun: { sty: 'bright', lift: 2 }, f_sky: { sty: 'sacred' }, f_cosmos: { sty: 'sacred' }, f_temple: { sty: 'sacred', lift: 2 },
  f_ghost: { sty: 'dark' }, f_castle: { sty: 'dark', lift: 2 }, f_volcano: { sty: 'dark', lift: 2 }, f_dragon: { sty: 'epic', lift: 2, riser: 1 }, f_end: { sty: 'epic', lift: 2, riser: 1, brk: 15 },
  gba_trainer: { intro: 2, lift: 2 }, gba_legend: { intro: 2, lift: 2, brk: 15 }, gba_boss: { intro: 2, lift: 2, brk: 15 }, gba_boss2: { intro: 2, lift: 2, brk: 15 },
  pf_battle: { intro: 2, lift: 2 }, pf_battle2: { intro: 2, lift: 2 }, pf_battle3: { intro: 2, lift: 2 }, pf_trainer: { intro: 2, lift: 2 }, pf_boss: { intro: 2, lift: 2, riser: 1, brk: 15 }, pf_boss2: { intro: 2, lift: 2, riser: 1, brk: 15 },
  chip_battle: { lift: 2 }, chip_battle2: { lift: 2 }, chip_battle3: { lift: 2 },
  battle: { sty: 'epic', intro: 2, lift: 2, riser: 1 }, battle2: { sty: 'epic', intro: 2, lift: 2, riser: 1 }, battle3: { sty: 'epic', intro: 2, lift: 2, riser: 1 }, battle_trainer: { sty: 'epic', intro: 2, lift: 2, riser: 1 },
  battle_legend: { sty: 'epic', sac: 1, intro: 2, lift: 2, riser: 1, brk: 15 }, boss: { sty: 'epic', intro: 2, lift: 2, riser: 1, brk: 15 }, boss2: { sty: 'epic', intro: 2, lift: 2, riser: 1, brk: 15 }, boss_final: { sty: 'epic', sac: 1, intro: 2, lift: 2, riser: 1, brk: 15 },
};
// がっきの そうび: スタイルごとに ストリングス・ホルン・ピアノ・ベルなどを かさねて あつみと かんしょうを だす
function orchestrate(tr) {
  const sty = tr.sty, add = (k, l) => tr['L_' + k].push(l);
  if (sty === 'folk') {
    add('pad', { i: 'cello', v: 0.07, up: -12, only: [0], pass: 2, r: 0.4 }); add('arp', { i: 'pizz', v: 0.11, p: '..0...1...2...1.', up: 12, pass: 2 });
    add('arp', { i: 'glock', v: 0.07, p: '0.1.2.3.4.3.2.1.', up: 36, r: 0.5, pass: 3 }); add('pad', { i: 'horn', v: 0.05, pass: 3, r: 0.4 });
  } else if (sty === 'bright') {
    add('pad', { i: 'cello', v: 0.07, up: -12, only: [0], pass: 2 }); add('stab', { i: 'trumpet', v: 0.1, p: '..x...x...x...x.', up: 12, len: 1.6, pass: 2 }); add('arp', { i: 'glock', v: 0.07, p: '0.1.2.3.4.3.2.1.', up: 36, pass: 3 }); add('pad', { i: 'horn', v: 0.06, pass: 3 });
  } else if (sty === 'sacred') {
    add('pad', { i: 'choir', v: 0.05, pass: 2, r: 0.8 }); add('arp', { i: 'tubular', v: 0.09, p: '0...............', up: 12, r: 0.8, pass: 2 }); add('arp', { i: 'piano', v: 0.1, p: '0.1.2.3.2.1.0.1.', up: 12, pass: 2, r: 0.5 });
    add('pad', { i: 'cello', v: 0.08, up: -12, only: [0, 2], pass: 3 }); add('arp', { i: 'celesta', v: 0.08, p: '..0.1.2.3.2.1.0.', up: 36, r: 0.6, pass: 3 }); add('pad', { i: 'horn', v: 0.06, pass: 3, r: 0.5 });
  } else if (sty === 'dark') {
    add('pad', { i: 'cello', v: 0.09, up: -12, only: [0, 1], r: 0.4 }); add('arp', { i: 'tubular', v: 0.08, p: '0...............', up: 12, r: 0.8, pass: 1 }); add('pad', { i: 'organ', v: 0.035, pass: 2, up: 0 });
    add('stab', { i: 'brass', v: 0.11, p: 'x..x..x.........', up: 0, len: 1.4, pass: 3 }); add('pad', { i: 'choir', v: 0.06, pass: 3, r: 0.8 });
  } else if (sty === 'epic') {
    add('pad', { i: 'cello', v: 0.09, up: -12, only: [0, 1], r: 0.3 }); add('pad', { i: 'horn', v: 0.06, pass: 2, r: 0.4 }); add('stab', { i: 'brass', v: 0.12, p: '.x...x..x.x.....', up: 0, len: 1.5, pass: 2 });
    add('stab', { i: 'trumpet', v: 0.1, p: 'x..x..x.x..x..x.', up: 12, len: 1.3, pass: 3 }); add('pad', { i: 'choir', v: 0.055, pass: 3, r: 0.7 }); add('arp', { i: 'piano', v: 0.09, p: '0.1.2.1.0.1.2.1.', up: 24, pass: 3 });
    add('arp', { i: 'glock', v: 0.07, p: '..0.......1.....', up: 36, r: 0.5, pass: 3 });
    if (tr.sac) { add('arp', { i: 'tubular', v: 0.09, p: '0...............', up: 12, r: 0.8, pass: 2 }); add('pad', { i: 'choir', v: 0.05, pass: 2, r: 0.8 }); }
  }
}
// 戦闘曲の ひな形: メロディ=トランペット系ブラス / ハモリ+はやい きざみ=ストリングス / ベース=とまらない エレキベース / ドラム=スネアおおめ
function battleArr(tr) {
  const sc = SCALES[tr.mode || 'major'], harm = (bars) => bars.map(b => b.map(([st, m, len]) => {
    const rel = m - tr.key, oc = Math.floor(rel / 12), i = sc.indexOf(((rel % 12) + 12) % 12); if (i < 0) return [st, m - 4, len];
    const j = i - 2; return [st, tr.key + 12 * (oc + Math.floor(j / 7)) + sc[((j % 7) + 7) % 7], len]; }));
  const base = tr.L_lead.slice();
  for (const l of base) {
    if (l.i === 'lead' && l.v >= 0.15) l.i = 'trumpet';
    if (l.i === 'choir' && l.v >= 0.15) tr.L_lead.push({ ...l, i: 'trumpet', v: 0.12, r: 0.25 });
    if ((l.i === 'trumpet' || l.i === 'brass') && l.v >= 0.15) tr.L_lead.push({ ...l, i: 'sleg', v: 0.075, r: 0.35, bars_: harm(l.bars_) });
  }
  tr.L_arp.push({ i: 'sstac', v: 0.045, p: '0120120120120120', up: 24 }, { i: 'sstac', v: 0.03, p: '2102102102102102', up: 36, pass: 2 });
  tr.L_bass = [{ i: 'ebass', v: 0.2, p: '1818181818181858' }];
  tr.L_drums = [/^boss/.test(tr.name) ? DR.fightB : DR.fight];
}
function pfArr(tr) {
  tr.pf = true; const sc = SCALES[tr.mode || 'major'], harm = (bars) => bars.map(b => b.map(([st, m, len]) => {
    const rel = m - tr.key, oc = Math.floor(rel / 12), i = sc.indexOf(((rel % 12) + 12) % 12); if (i < 0) return [st, m - 4, len];
    const j = i - 2; return [st, tr.key + 12 * (oc + Math.floor(j / 7)) + sc[((j % 7) + 7) % 7], len]; }));
  const groups = new Map(); for (const l of tr.L_lead) { if (!(l.v >= 0.15 || l.i === 'brass')) continue; const k = l.m || JSON.stringify(l.notes); (groups.get(k) || groups.set(k, []).get(k)).push(l); }
  const mel = [...groups.values()].map(g => g.length > 1 ? { ...g[0], pass: undefined } : g[0]), out = [];
  for (const l of mel) {
    out.push({ ...l, i: 'piano', v: 0.2, r: 0.35, leg: 1.2 }, { ...l, i: 'piano', v: 0.08, oct: -1, r: 0.35, leg: 1.2 },
      { ...l, i: 'sleg', v: 0.08, pass: 2, bars_: l.bars_, r: 0.35 }, { ...l, i: 'sleg', v: 0.06, pass: 2, bars_: harm(l.bars_), r: 0.35 }, { ...l, i: 'brass', v: 0.13, pass: 2, r: 0.3 });
  }
  tr.L_lead = out; tr.L_pad = [{ i: 'strings', v: 0.06, r: 0.4 }]; tr.L_stab = [{ i: 'trumpet', v: 0.09, p: 'x..x..x.x..x..x.', up: 12, len: 1.2, pass: 3 }];
  tr.L_arp = [{ i: 'sstac', v: 0.05, p: '0120120120120120', up: 24 }, { i: 'sstac', v: 0.03, p: '2102102102102102', up: 36, pass: 2 }];
  tr.L_bass = [{ i: 'ebass', v: 0.2, p: '1818181818181858' }];
  tr.L_drums = [/^pf_boss/.test(tr.name) ? DR.fightB : DR.fight];
}
function gbaArr(tr) {   // ブラス=しゅせんりつ・ファンファーレ / シンセ=わおんの あつみ・かざり / ベース=どっしり / ドラム=どうどう
  const main = tr.L_lead.filter(l => l.v >= 0.15 || l.i === 'brass' || l.i === 'trumpet' || l.i === 'lead');
  tr.L_lead = main.map(l => ({ ...l, i: 'brass', v: 0.17, r: 0.3 }));
  for (const l of main) tr.L_lead.push({ ...l, i: 'horn', v: 0.07, oct: -1, r: 0.3 }, { ...l, i: 'trumpet', v: 0.06, pass: 2, r: 0.25 });
  tr.L_stab = [{ i: 'brass', v: 0.1, p: 'x.....x.x.......', up: 12, len: 1.3, pass: 2 }, { i: 'synpad', v: 0.07, p: '..x...x...x...x.', up: 12, len: 1.0 }];
  tr.L_pad = [{ i: 'synpad', v: 0.045, r: 0.4 }, { i: 'cello', v: 0.08, up: -12, only: [0], r: 0.3 }];
  tr.L_arp = [{ i: 'bell', v: 0.05, p: '0.1.2.3.2.1.0.1.', up: 36, r: 0.5, pass: 2 }, { i: 'pluck', v: 0.04, p: '..0.1.2.1.0.1.2.', up: 24 }];
  tr.L_bass = [{ i: 'bass', v: 0.26, p: '1...1...1.1.1.5.' }, { i: 'synbass', v: 0.1, p: '1...1...1.1.1.5.', pass: 2 }];
  tr.L_drums = [DR.grand];
}
function chipArr(tr) {   // 矩形波1=メロディ / 矩形波2=ハモリ・あいの手 / 波形メモリ=ベース / ノイズ=ドラム
  tr.chip = true; tr.g = 1.35; const sc = SCALES[tr.mode || 'major'], harm = (bars) => bars.map(b => b.map(([st, m, len]) => {
    const rel = m - tr.key, oc = Math.floor(rel / 12), i = sc.indexOf(((rel % 12) + 12) % 12); if (i < 0) return [st, m - 4, len];
    const j = i - 2; return [st, tr.key + 12 * (oc + Math.floor(j / 7)) + sc[((j % 7) + 7) % 7], len]; }));
  const main = tr.L_lead.filter(l => l.v >= 0.15 || l.i === 'brass').map(l => ({ ...l, i: 'pulse', v: 0.075, r: 0.04, leg: 0.9 }));
  tr.L_lead = [...main, ...main.map(l => ({ ...l, i: 'pulse25', v: 0.05, bars_: harm(l.bars_) }))];
  tr.L_arp = [{ i: 'pulse25', v: 0.035, p: '..0.1.2.1.0.1.2.', up: 24, len: 1.0 }, { i: 'pulse25', v: 0.04, p: '0120120120120120', up: 24, len: 0.8, pass: 2 }];
  tr.L_pad = []; tr.L_stab = [];
  tr.L_bass = [{ i: 'wavebass', v: 0.2, p: '1.8.1.8.1.8.5.8.' }];
  tr.L_drums = [{ ...DR.fight, o: undefined, fill: 1, crash: 0 }];
}
const ALIAS = { field: null, battle: null };   // 'field' → いまの フィールドの きょく / 'battle' → ランダムに えらぶ
let fieldTheme = 'f_forest', lastBattle = '';

// ---------- じゅんび: 小節ごとに わける ----------
for (const [name, tr] of Object.entries(TRACKS)) {
  const pl = PLAN[name] || {}; tr.sty = pl.sty; tr.intro = pl.intro || 0; tr.lift = pl.lift || 0; tr.brk = pl.brk == null ? -1 : pl.brk; tr.riser = !!pl.riser; tr.sac = !!pl.sac;
  tr.n = 24; tr.ct = tr.chords.map(c => chordOf(tr, c));   // 24しょうせつ: 16(ふつう) + 8(さいご: ひとつ うえの キーで もりあがる)
  for (const k of ['lead', 'pad', 'bass', 'arp', 'drums', 'stab']) {
    let L = tr[k]; if (!L) { tr['L_' + k] = []; continue; } if (!Array.isArray(L)) L = [L]; tr['L_' + k] = L;
    for (const l of L) { if (l.m) l.bars_ = parseMel(l.m, tr, name); else if (l.notes) l.bars_ = splitLegacy(l.notes, tr.chords.length); }
  }
  orchestrate(tr); tr.name = name; if (/^pf_/.test(name)) pfArr(tr); else if (/^gba_/.test(name)) gbaArr(tr); else if (/^chip_/.test(name)) chipArr(tr); else if (/^(battle|boss)/.test(name)) battleArr(tr);
}

// ---------- オーディオ ----------
let ac = null, G = null, timer = null, cur = null, want = null, nextT = 0, step = 0, tbus = null;
function makeIR(ctx, sec = 2.4) {
  const n = Math.floor(ctx.sampleRate * sec), b = ctx.createBuffer(2, n, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); let lp = 0; for (let i = 0; i < n; i++) { const x = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2.6); lp += (x - lp) * 0.35; d[i] = lp; } }
  return b;
}
function buildChain(ctx) {   // コンプレッサー → ぜんたいの ボリューム → スピーカー。リバーブと ビブラートの きょうつう ぶひん
  const out = ctx.createGain(), comp = ctx.createDynamicsCompressor(); comp.threshold.value = -16; comp.knee.value = 12; comp.ratio.value = 4; comp.attack.value = 0.006; comp.release.value = 0.2;
  const rev = ctx.createConvolver(); rev.buffer = makeIR(ctx); const wet = ctx.createGain(); wet.gain.value = 0.5; rev.connect(wet); wet.connect(comp); comp.connect(out);
  const dl = ctx.createDelay(1); dl.delayTime.value = 0.28; const fb = ctx.createGain(); fb.gain.value = 0.32; const dfl = ctx.createBiquadFilter(); dfl.type = 'lowpass'; dfl.frequency.value = 2400; dl.connect(dfl); dfl.connect(fb); fb.connect(dl); const dw = ctx.createGain(); dw.gain.value = 0.5; dfl.connect(dw); dw.connect(comp);
  const lfo = ctx.createOscillator(), vib = ctx.createGain(); lfo.frequency.value = 5.3; vib.gain.value = 9; lfo.connect(vib); lfo.start();
  return { out, comp, rev, dl, vib, ctx };
}
function trackBus() {   // きょくごとの ミキサー(きりかえの とき ふんわり けす)
  const mix = ac.createGain(), send = ac.createGain(), dsend = ac.createGain(); mix.connect(G.comp); send.connect(G.rev); dsend.connect(G.dl); send.gain.value = 1; dsend.gain.value = 1; return { mix, send, dsend };
}
function ensure() {
  const a = audioCtx(); if (!a.ac) return false;
  if (ac !== a.ac) { ac = a.ac; G = buildChain(ac); G.out.connect(ac.destination); }
  G.out.gain.value = cfg.bgm * 0.55; return true;
}
const outTo = (node, r = 0.25, dly = 0) => {
  node.connect(tbus.mix);
  if (r > 0) { const s = ac.createGain(); s.gain.value = r; node.connect(s); s.connect(tbus.send); }
  if (dly > 0) { const s = ac.createGain(); s.gain.value = dly; node.connect(s); s.connect(tbus.dsend); }
};
const osc = (type, f, t, end, det = 0, vib = false) => { const o = ac.createOscillator(); o.type = type; o.frequency.value = f; if (det) o.detune.value = det; if (vib) G.vib.connect(o.detune); o.start(t); o.stop(end); return o; };
function env(g, t, dur, vol, a, d, s, r) { const e = t + Math.max(dur, a + d + 0.02); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + a); g.gain.linearRampToValueAtTime(vol * s, t + a + d); g.gain.setValueAtTime(vol * s, e); g.gain.exponentialRampToValueAtTime(0.0001, e + r); return e + r + 0.05; }
const lp = (f, q = 0.7) => { const x = ac.createBiquadFilter(); x.type = 'lowpass'; x.frequency.value = f; x.Q.value = q; return x; };
let subCurve = null;
let pwCtx = null, pwMap = {};
function pulseWave(d) { if (pwCtx !== ac) { pwCtx = ac; pwMap = {}; } if (pwMap[d]) return pwMap[d]; const N = 32, re = new Float32Array(N), im = new Float32Array(N); for (let n = 1; n < N; n++) { re[n] = 2 / (n * Math.PI) * Math.sin(n * Math.PI * d); im[n] = 2 / (n * Math.PI) * (1 - Math.cos(n * Math.PI * d)); } return pwMap[d] = ac.createPeriodicWave(re, im); }
function voice(inst, f, t, dur, vol, o = {}) {
  const g = ac.createGain(), r = o.r, dl = o.delay ? 0.45 : 0; let end;
  switch (inst) {
    case 'lead': { end = env(g, t, dur, vol, 0.015, 0.12, 0.75, 0.1); const fl = lp(Math.min(5200, f * 5 + 900)); fl.connect(g); const m = ac.createGain(); m.gain.value = 0.5; [osc('sawtooth', f, t, end, -8, true), osc('sawtooth', f, t, end, 8, true)].forEach(x => x.connect(m)); const s = osc('square', f, t, end, 0, true), sg = ac.createGain(); sg.gain.value = 0.25; s.connect(sg); sg.connect(fl); m.connect(fl); outTo(g, r ?? 0.22, dl); break; }
    case 'brass': { end = env(g, t, dur, vol, 0.035, 0.15, 0.85, 0.1); const fl = lp(700); fl.frequency.setValueAtTime(600, t); fl.frequency.linearRampToValueAtTime(Math.min(3600, f * 4), t + 0.12); fl.connect(g); [-5, 5].forEach(d => osc('sawtooth', f, t, end, d, true).connect(fl)); outTo(g, r ?? 0.22, dl); break; }
    case 'flute': { end = env(g, t, dur, vol, 0.06, 0.1, 0.8, 0.15); const a = osc('sine', f, t, end, 0, true), b = osc('triangle', f, t, end, 3, true), c = osc('sine', f * 2, t, end, 0, true), cg = ac.createGain(), bg = ac.createGain(); bg.gain.value = 0.3; cg.gain.value = 0.08; a.connect(g); b.connect(bg); bg.connect(g); c.connect(cg); cg.connect(g); outTo(g, r ?? 0.35, dl); break; }
    case 'bell': { const e = t + Math.max(dur, 0.2) + 0.9; g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, e); end = e + 0.05; [[1, 1], [2.76, 0.32], [5.4, 0.1]].forEach(([m, a]) => { const x = osc('sine', f * m, t, end), xg = ac.createGain(); xg.gain.value = a; x.connect(xg); xg.connect(g); }); outTo(g, r ?? 0.55, dl); break; }
    case 'pluck': { const e = t + Math.max(dur, 0.1); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, e + 0.12); end = e + 0.2; const fl = lp(4500); fl.frequency.setValueAtTime(4500, t); fl.frequency.exponentialRampToValueAtTime(600, t + 0.22); fl.connect(g); osc('sawtooth', f, t, end).connect(fl); const tr2 = osc('triangle', f, t, end, 6), tg = ac.createGain(); tg.gain.value = 0.5; tr2.connect(tg); tg.connect(fl); outTo(g, r ?? 0.25, dl); break; }
    case 'harp': { const e = t + 1.1; g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, e); end = e + 0.05; osc('triangle', f, t, end).connect(g); const h = osc('sine', f * 2, t, end), hg = ac.createGain(); hg.gain.value = 0.25; h.connect(hg); hg.connect(g); outTo(g, r ?? 0.45, dl); break; }
    case 'marimba': { const e = t + 0.38; g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.003); g.gain.exponentialRampToValueAtTime(0.0001, e); end = e + 0.05; osc('sine', f, t, end).connect(g); const h = osc('sine', f * 4, t, end), hg = ac.createGain(); hg.gain.value = 0.22; h.connect(hg); hg.connect(g); outTo(g, r ?? 0.3, dl); break; }
    case 'strings': { end = env(g, t, dur, vol, 0.35, 0.2, 0.85, 0.5); const fl = lp(Math.min(2400, f * 5)); fl.connect(g); [-9, 9].forEach(d => osc('sawtooth', f, t, end, d, true).connect(fl)); outTo(g, r ?? 0.5, dl); break; }
    case 'choir': { end = env(g, t, dur, vol, 0.5, 0.25, 0.85, 0.7); const sum = ac.createGain(); [[700, 1.2], [1150, 1.2]].forEach(([fr, q]) => { const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = fr; bp.Q.value = q; sum.connect(bp); bp.connect(g); }); osc('sawtooth', f, t, end, -6, true).connect(sum); osc('sawtooth', f, t, end, 6, true).connect(sum); const tr2 = osc('triangle', f, t, end, 0, true), tg = ac.createGain(); tg.gain.value = 0.6; tr2.connect(tg); tg.connect(g); outTo(g, r ?? 0.65, dl); break; }
    case 'organ': { end = env(g, t, dur, vol, 0.012, 0.05, 0.95, 0.08); const fl = lp(3200); fl.connect(g); osc('square', f, t, end).connect(fl); [[0.5, 0.5, 'sine'], [2, 0.35, 'sine'], [3, 0.12, 'sine']].forEach(([m, a, ty]) => { const x = osc(ty, f * m, t, end), xg = ac.createGain(); xg.gain.value = a; x.connect(xg); xg.connect(fl); }); outTo(g, r ?? 0.4, dl); break; }
    case 'bass': { end = env(g, t, dur, vol, 0.008, 0.1, 0.7, 0.06); const fl = lp(650); fl.connect(g); osc('sawtooth', f, t, end).connect(fl); const sb = osc('sine', f, t, end), sg = ac.createGain(); sg.gain.value = 0.9; sb.connect(sg); sg.connect(g); outTo(g, 0, 0); break; }
    case 'synbass': { end = env(g, t, dur, vol, 0.005, 0.08, 0.6, 0.05); const fl = lp(520); fl.connect(g); osc('square', f, t, end).connect(fl); const sb = osc('sine', f, t, end), sg = ac.createGain(); sg.gain.value = 0.8; sb.connect(sg); sg.connect(g); outTo(g, 0, 0); break; }
    case 'piano': { const e = t + Math.max(dur, 0.25) + 0.9; g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.004); g.gain.exponentialRampToValueAtTime(vol * 0.35, t + 0.25); g.gain.exponentialRampToValueAtTime(0.0001, e); end = e + 0.05; [[1, 1, 'triangle'], [2, 0.4, 'sine'], [3, 0.16, 'sine'], [4, 0.07, 'sine']].forEach(([m, a, ty]) => { const x = osc(ty, f * m, t, end), xg = ac.createGain(); xg.gain.value = a; x.connect(xg); xg.connect(g); }); outTo(g, r ?? 0.4, dl); break; }
    case 'celesta': { const e = t + 1.1; g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.003); g.gain.exponentialRampToValueAtTime(0.0001, e); end = e + 0.05; osc('sine', f, t, end).connect(g); const h = osc('sine', f * 3.99, t, end), hg = ac.createGain(); hg.gain.value = 0.28; h.connect(hg); hg.connect(g); outTo(g, r ?? 0.6, dl); break; }
    case 'glock': { const e = t + 0.7; g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.002); g.gain.exponentialRampToValueAtTime(0.0001, e); end = e + 0.05; osc('sine', f, t, end).connect(g); const h = osc('sine', f * 2.76, t, end), hg = ac.createGain(); hg.gain.value = 0.35; h.connect(hg); hg.connect(g); outTo(g, r ?? 0.5, dl); break; }
    case 'tubular': { const e = t + 2.6; g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, e); end = e + 0.05; [[1, 1], [2, 0.5], [3, 0.3], [4.2, 0.14], [5.4, 0.08]].forEach(([m, a]) => { const x = osc('sine', f * m, t, end), xg = ac.createGain(); xg.gain.value = a; x.connect(xg); xg.connect(g); }); outTo(g, r ?? 0.8, dl); break; }
    case 'pizz': { const e = t + 0.3; g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.003); g.gain.exponentialRampToValueAtTime(0.0001, e); end = e + 0.05; const fl = lp(2200); fl.connect(g); osc('triangle', f, t, end).connect(fl); const sw = osc('sawtooth', f, t, end), sg = ac.createGain(); sg.gain.value = 0.25; sw.connect(sg); sg.connect(fl); outTo(g, r ?? 0.3, dl); break; }
    case 'horn': { end = env(g, t, dur, vol, 0.14, 0.2, 0.85, 0.3); const fl = lp(1200); fl.connect(g); [-4, 4].forEach(d => osc('sawtooth', f, t, end, d, true).connect(fl)); const tr2 = osc('triangle', f, t, end), tg = ac.createGain(); tg.gain.value = 0.5; tr2.connect(tg); tg.connect(fl); outTo(g, r ?? 0.45, dl); break; }
    case 'trumpet': { end = env(g, t, dur, vol, 0.02, 0.1, 0.85, 0.08); const fl = lp(900); fl.frequency.setValueAtTime(900, t); fl.frequency.linearRampToValueAtTime(Math.min(5200, f * 6), t + 0.08); fl.connect(g); [-6, 6].forEach(d => osc('sawtooth', f, t, end, d, true).connect(fl)); const sq = osc('square', f, t, end), sg = ac.createGain(); sg.gain.value = 0.3; sq.connect(sg); sg.connect(fl); outTo(g, r ?? 0.25, dl); break; }
    case 'cello': { end = env(g, t, dur, vol, 0.2, 0.2, 0.9, 0.35); const fl = lp(Math.min(1500, f * 6)); fl.connect(g); [-6, 6].forEach(d => osc('sawtooth', f, t, end, d, true).connect(fl)); osc('sine', f, t, end).connect(g); outTo(g, r ?? 0.35, dl); break; }
    case 'pulse': case 'pulse25': { end = env(g, t, dur, vol, 0.003, 0.06, 0.7, 0.04); const o = ac.createOscillator(); o.setPeriodicWave(pulseWave(inst === 'pulse' ? 0.5 : 0.25)); o.frequency.value = f; o.start(t); o.stop(end); outTo(g, r ?? 0.04, 0); o.connect(g); break; }
    case 'wavebass': { end = env(g, t, dur, vol, 0.002, 0.03, 0.9, 0.02); osc('triangle', f, t, end).connect(g); outTo(g, 0, 0); break; }
    case 'synpad': { end = env(g, t, dur, vol, 0.05, 0.15, 0.8, 0.2); const fl = lp(Math.min(2800, f * 4)); fl.connect(g); [-10, 0, 10].forEach(d => osc('sawtooth', f, t, end, d, true).connect(fl)); outTo(g, r ?? 0.3, dl); break; }
    case 'subbass': { end = env(g, t, dur, vol, 0.012, 0.1, 0.85, 0.08); osc('triangle', f, t, end).connect(g); outTo(g, 0, 0); break; }   // 小さな スピーカーでも きこえる 軽い ひくい音(三角波=倍音つき。ノード数を ふやさない)
    case 'sleg': { end = env(g, t, dur, vol, 0.04, 0.1, 0.85, 0.12); const fl = lp(Math.min(3400, f * 5)); fl.connect(g); [-8, 8].forEach(d => osc('sawtooth', f, t, end, d, true).connect(fl)); outTo(g, r ?? 0.35, dl); break; }
    case 'sstac': { end = env(g, t, Math.min(dur, 0.11), vol, 0.006, 0.05, 0.5, 0.04); const fl = lp(Math.min(3000, f * 6)); fl.connect(g); [-7, 7].forEach(d => osc('sawtooth', f, t, end, d, true).connect(fl)); outTo(g, r ?? 0.18, dl); break; }
    case 'ebass': { end = env(g, t, dur, vol, 0.004, 0.07, 0.65, 0.05); const fl = lp(1100); fl.frequency.setValueAtTime(1100, t); fl.frequency.exponentialRampToValueAtTime(380, t + 0.12); fl.connect(g); osc('sawtooth', f, t, end).connect(fl); const sb = osc('sine', f, t, end), sg = ac.createGain(); sg.gain.value = 0.8; sb.connect(sg); sg.connect(g); outTo(g, 0, 0); break; }
    default: return;
  }
}
function riser(t, dur, vol = 0.12) {   // もりあげの ヒューーッ
  const n = noiseSrc(), f = ac.createBiquadFilter(), g = ac.createGain(); n.loop = true; f.type = 'bandpass'; f.Q.value = 1.2; f.frequency.setValueAtTime(300, t); f.frequency.exponentialRampToValueAtTime(7500, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + dur * 0.96); g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.04); n.connect(f); f.connect(g); outTo(g, 0.3); n.start(t); n.stop(t + dur + 0.1);
}
let noiseBuf = null, noiseCtx = null;
function noiseSrc() { if (noiseCtx !== ac) { noiseCtx = ac; noiseBuf = ac.createBuffer(1, Math.floor(ac.sampleRate * 0.6), ac.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; } const n = ac.createBufferSource(); n.buffer = noiseBuf; return n; }
let chipMode = false;
function chipPerc(kind, t, vol) {   // ファミコンの ノイズチャンネル風: みじかい ノイズだけ
  const n = noiseSrc(), f = ac.createBiquadFilter(), g = ac.createGain(); n.loop = true;
  const k = kind === 'k' || kind === 'boom' || kind === 't', s = kind === 's' || kind === 'c';
  f.type = k ? 'lowpass' : 'highpass'; f.frequency.value = k ? 220 : s ? 1800 : 7000; const dur = k ? 0.11 : s ? 0.13 : kind === 'crash' ? 0.45 : kind === 'o' ? 0.12 : 0.035;
  g.gain.setValueAtTime(vol * (k ? 1.6 : 1), t); g.gain.exponentialRampToValueAtTime(0.001, t + dur); n.connect(f); f.connect(g); g.connect(tbus.mix); n.start(t); n.stop(t + dur + 0.05);
}
function perc(kind, t, vol, pitch = 1) {
  if (chipMode) return chipPerc(kind, t, vol);
  if (kind === 'k' || kind === 'boom' || kind === 't') {
    const o = ac.createOscillator(), g = ac.createGain(), boom = kind === 'boom', tom = kind === 't';
    o.type = 'sine'; o.frequency.setValueAtTime(boom ? 110 : tom ? 200 * pitch : 160, t); o.frequency.exponentialRampToValueAtTime(boom ? 38 : tom ? 90 * pitch : 48, t + (boom ? 0.28 : tom ? 0.22 : 0.1));
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + (boom ? 0.6 : tom ? 0.32 : 0.18)); o.connect(g); outTo(g, boom || tom ? 0.25 : 0); o.start(t); o.stop(t + 0.65);
  } else {
    const n = noiseSrc(), f = ac.createBiquadFilter(), g = ac.createGain(); f.type = 'highpass'; f.frequency.value = kind === 's' ? 1400 : kind === 'c' ? 2500 : kind === 'crash' ? 4200 : kind === 'o' ? 6500 : 7500;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + (kind === 's' ? 0.17 : kind === 'crash' ? 0.9 : kind === 'o' ? 0.18 : kind === 'c' ? 0.12 : 0.045)); n.connect(f); f.connect(g); outTo(g, kind === 'crash' ? 0.5 : kind === 's' || kind === 'c' ? 0.2 : 0); n.start(t); n.stop(t + 0.95);
    if (kind === 's') { const o = ac.createOscillator(), g2 = ac.createGain(); o.type = 'triangle'; o.frequency.setValueAtTime(220, t); o.frequency.exponentialRampToValueAtTime(110, t + 0.08); g2.gain.setValueAtTime(vol * 0.5, t); g2.gain.exponentialRampToValueAtTime(0.001, t + 0.1); o.connect(g2); outTo(g2, 0.1); o.start(t); o.stop(t + 0.12); }
  }
}
const passOf = (bar) => bar >= 16 ? 3 : bar % 16 < 8 ? 1 : 2;   // 1=まえはん 2=こうはん 3=さいごの もりあがり
const on = (l, P) => !l.pass || l.pass === P || (P === 3 && l.pass === 2);
const ch = (p, st) => p[st % p.length];
function scheduleIntro(tr, s, t, sd) { chipMode = !!tr.chip;   // イントロ: ひくい ストリングス+ティンパニ→スネアロール→ブラスの いっぱつ
  const ct = tr.ct[0], bi = Math.floor(s / 16), st = s % 16, last = bi === tr.intro - 1, g = tr.g;
  if (tr.pf) {   // ピアノの イントロ: ゆっくり アルペジオ → さいごの しょうせつは かけあがり
    if (st === 0) { for (const m of ct) voice('sleg', mtof(m), t, sd * 16, 0.045 * g, { r: 0.5 }); if (bi === 0) perc('boom', t, 0.4 * g); }
    const ix = last ? st : st / 2;
    if (last || st % 2 === 0) voice('piano', mtof(ct[ix % 3] + 12 * (last ? Math.floor(st / 5) : Math.floor((ix % 6) / 3)) + 24), t, sd * 2, (last ? 0.12 + st * 0.006 : 0.14) * g, { r: 0.4 });
    if (last) { if (st >= 8) perc('s', t, (0.05 + (st - 8) * 0.04) * g); if (st === 15) perc('t', t, 0.3 * g); }
    return;
  }
  if (st === 0) { for (const m of ct) voice(bi === 0 ? 'strings' : 'choir', mtof(m), t, sd * 16, 0.06 * g, { r: 0.6 }); voice('cello', mtof(ct[0] - 12), t, sd * 16, 0.1 * g, {}); if (bi === 0) perc('boom', t, 0.5 * g); if (tr.sty === 'epic') riser(t, sd * 16 * tr.intro, 0.1 * g); }
  if (last) { if ([0, 4, 8, 10, 12, 13, 14, 15].includes(st)) perc('t', t, (0.25 + st * 0.02) * g, 1 + (15 - st) * 0.03); if (st >= 8) perc('s', t, (0.05 + (st - 8) * 0.04) * g); if (st === 15) { for (const m of ct) voice('brass', mtof(m + 12), t, sd * 2, 0.1 * g, {}); } }
  else if (st % 4 === 0) perc('t', t, 0.22 * g, 1.2 - (st / 16) * 0.2);
}
function scheduleStep(tr, s, t, sd) {
  chipMode = !!tr.chip;
  if (s < 0) { scheduleIntro(tr, s + tr.intro * 16, t, sd); return; }
  const bar = Math.floor(s / 16) % tr.n, st = s % 16, ext = bar >= 16, sb = ext ? 8 + (bar - 16) : bar, P = passOf(bar), trp = ext ? tr.lift : 0, ct = tr.ct[sb % tr.ct.length], gg = tr.g, brk = bar === tr.brk;
  if (tr.riser && (bar === 7 || bar === 23 || brk) && st === 0) riser(t, sd * 16, 0.11 * gg);
  if (brk) { if (st >= 8) perc('s', t, (0.05 + (st - 8) * 0.045) * gg); if (st % 4 === 0) perc('t', t, 0.2 * gg, 1.1 - st * 0.02); }
  if (tr.brk >= 0 && bar === tr.brk + 1 && st === 0) { perc('crash', t, 0.3 * gg); perc('boom', t, 0.55 * gg); }
  if (!brk) {
    for (const l of tr.L_lead) { if (!on(l, P)) continue; const nb = l.bars_.length, notes = l.bars_[sb % nb] || []; for (const [ms, m, len] of notes) if (ms === st) voice(l.i, mtof(m + 12 * (l.oct || 0) + trp), t, sd * len * (l.leg || 0.93), l.v * gg, l); }
    for (const l of tr.L_bass) { if (!on(l, P)) continue; const c = ch(l.p, st); if (c === '.') continue; let len = 1; while (len < 16 && ch(l.p, st + len) === '.') len++; const bm = ct[0] - 12 + trp + (c === '5' ? 7 : c === '8' ? 12 : c === '3' ? ct[1] - ct[0] : 0); voice(l.i, mtof(bm), t, sd * len * 0.9, l.v * gg * 1.05, l); if (!tr.chip && bm - 12 >= 24) voice('subbass', mtof(bm - 12), t, sd * len * 0.9, l.v * gg * 0.6, {}); }
    for (const l of tr.L_arp) { if (!on(l, P)) continue; const c = ch(l.p, st); if (c === '.') continue; const ix = +c, nm = ct[ix % ct.length] + 12 * Math.floor(ix / ct.length) + (l.up ?? 24) + trp; voice(l.i, mtof(nm), t, sd * (l.len || 1.6), l.v * gg * ((l.up ?? 24) >= 36 ? 0.65 : 1), l); }
    for (const l of tr.L_stab) { if (!on(l, P)) continue; if (ch(l.p, st) !== 'x') continue; for (const m of ct) voice(l.i, mtof(m + (l.up ?? 12) + trp), t, sd * (l.len || 1.5), l.v * gg * 0.7, l); }
    for (const d of tr.L_drums) {
      if (!on(d, P)) continue; const v = d.v || 1, a = (c, base) => c === 'X' ? base * 1.3 : c === 'g' ? base * 0.5 : base, fillNow = d.fill && sb % 4 === 3 && st >= 12;
      for (const kk of ['k', 's', 'h', 'o', 'c']) { const p = d[kk]; if (!p) continue; const c = p[st]; if (!c || c === '.') continue; if (kk === 's' && fillNow) continue; perc(kk, t, a(c, { k: 0.5, s: 0.3, h: 0.1, o: 0.09, c: 0.2 }[kk]) * v * gg); }
      if (d.t && d.t[st] && d.t[st] !== '.') perc('t', t, 0.4 * v * gg, 1 + (3 - (+d.t[st])) * 0.18);
      if (d.boom && st === 0 && sb % 2 === 0) perc('boom', t, 0.45 * v * gg);
      if (d.crash && st === 0 && (sb % d.crash === 0 || (ext && sb % 2 === 0))) perc('crash', t, 0.2 * v * gg);
      if (fillNow) { perc('s', t, (0.12 + (st - 12) * 0.05) * v * gg); if (ext && st % 2 === 0) perc('t', t, 0.3 * v * gg, 1.2 - (st - 12) * 0.1); }
    }
  }
  for (const l of tr.L_pad) { if (!on(l, P) || st !== 0) continue; ct.forEach((m, ix) => { if (l.only && !l.only.includes(ix)) return; voice(l.i, mtof(m + (l.up || 0) + trp), t, sd * 16 * 0.98, l.v * gg, l); }); }
}
function tick() {
  if (!ac || !cur) return; const tr = TRACKS[cur], sd = 60 / tr.bpm / 4;
  if (ac.state !== 'running') { try { ac.resume(); } catch {} return; }   // iPhoneで 中断(interrupted/suspended)されたら ふっきする
  if (nextT < ac.currentTime) nextT = ac.currentTime + 0.05;
  while (nextT < ac.currentTime + 0.6) {   // 先よみ0.6秒: 画面が重くて タイマーが おくれても 音が とぎれにくい
    try { scheduleStep(tr, step, nextT, sd); } catch (e) { (window.__bgmErr || (window.__bgmErr = [])).push(String(e && e.message || e)); }   // 1音の しっぱいで 曲ぜんたいが 止まらないように
    step++; if (step >= tr.n * 16) step = 0; nextT += sd;
  }
}
function fadeOut(tb) { if (!tb) return; const now = ac.currentTime; try { tb.mix.gain.cancelScheduledValues(now); tb.mix.gain.setValueAtTime(tb.mix.gain.value, now); tb.mix.gain.linearRampToValueAtTime(0, now + 0.4); tb.send.gain.setValueAtTime(tb.send.gain.value, now); tb.send.gain.linearRampToValueAtTime(0, now + 0.4); tb.dsend.gain.linearRampToValueAtTime(0, now + 0.4); } catch {} setTimeout(() => { try { tb.mix.disconnect(); tb.send.disconnect(); tb.dsend.disconnect(); } catch {} }, 4200); }
function startNow(name) {
  clearInterval(timer); timer = null; fadeOut(tbus); tbus = null;
  if (!cfg.bgm || !name || !TRACKS[name]) { cur = null; return; }
  cur = name; step = -(TRACKS[name].intro || 0) * 16; nextT = 0; tbus = trackBus(); timer = setInterval(tick, 80); tick();
}
const GBA_ALT = { battle_trainer: ['gba_trainer', 'pf_trainer'], battle_legend: ['gba_legend'], boss: ['gba_boss', 'pf_boss'], boss2: ['gba_boss2', 'pf_boss2'] };
function resolve(name) {
  if (name === 'field') return fieldTheme;
  if (name === 'battle') { const pool = ['battle', 'battle2', 'battle3', 'chip_battle', 'chip_battle2', 'chip_battle3', 'pf_battle', 'pf_battle2', 'pf_battle3'].filter(x => x !== lastBattle); lastBattle = pool[Math.floor(Math.random() * pool.length)]; return lastBattle; }
  const alt = GBA_ALT[name];
  if (alt) { const o = [name, ...alt]; return o[Math.floor(Math.random() * o.length)]; }
  return name;
}
export function playBgm(name) {
  want = name; if (!ensure()) return;   // まだ音が使えない(タッチしたら はじまる)
  if (timer && cur && (GBA_ALT[name] || []).includes(cur)) return; const to = resolve(name); if (to === cur && timer) return; startNow(to);
}
export function setFieldBgm(fid) { fieldTheme = 'f_' + fid; if (!TRACKS[fieldTheme]) fieldTheme = 'f_forest'; playBgm('field'); }
export function stopBgm() { want = null; cur = null; clearInterval(timer); timer = null; fadeOut(tbus); tbus = null; }
export function setVolumes(bgm, sfx) {
  if (bgm != null) cfg.bgm = bgm; if (sfx != null) cfg.sfx = sfx; saveCfg();
  const a = audioCtx(); if (a.master) a.master.gain.value = 0.35 * cfg.sfx * 1.6;
  if (G) G.out.gain.value = cfg.bgm * 0.55;
  if (cfg.bgm && want && !timer) { if (ensure()) startNow(resolve(want)); } else if (!cfg.bgm) { clearInterval(timer); timer = null; cur = null; }
}
// 短いファンファーレ
let jingleBusy = false;
export function jingle(kind = 'win') {
  if (!ensure()) return; const was = cur, t = ac.currentTime + 0.05, seq = kind === 'catch' ? [[67, 0, .12], [72, .13, .12], [76, .26, .12], [79, .39, .3], [76, .78, .12], [79, .92, .12], [84, 1.06, .2], [83, 1.34, .12], [84, 1.48, .8], [79, 1.48, .8], [76, 1.48, .8]] : kind === 'win' ? [[72, 0, .14], [72, .16, .14], [72, .32, .14], [76, .5, .3], [72, .86, .14], [76, 1.02, .14], [79, 1.2, .5]] : [[79, 0, .12], [76, .12, .12], [72, .24, .12], [67, .36, .4]];
  if (was) { clearInterval(timer); timer = null; fadeOut(tbus); tbus = null; }
  const jb = trackBusTmp(); for (const [m, d, l] of seq) { voiceTmp('lead', mtof(m), t + d, l, 0.16, jb); voiceTmp('bell', mtof(m + 12), t + d, l, 0.08, jb); voiceTmp('bass', mtof(m - 12), t + d, l, 0.14, jb); }
  if (was) { jingleBusy = true; setTimeout(() => { jingleBusy = false; if (want) startNow(resolve(want === 'battle' ? was : want)); }, 2100); }
}
function trackBusTmp() { const b = trackBus(); tbus = b; return b; }
function voiceTmp(i, f, t, d, v, b) { tbus = b; voice(i, f, t, d, v, {}); }
// さいしょの タッチで 音を ゆるす(ページを開きなおしても ならせる)
const unlock = () => { unlockAudio(); const a = audioCtx(); if (a.master) a.master.gain.value = 0.35 * cfg.sfx * 1.6; if (want && !timer) { if (ensure()) startNow(resolve(want)); } };
['pointerdown', 'touchend', 'keydown'].forEach(ev => addEventListener(ev, unlock, { once: false, passive: true }));
setInterval(() => { try { if (cfg.bgm && want && !timer && ac && ac.state !== 'closed' && !jingleBusy) { if (ensure()) startNow(resolve(want)); } } catch {} }, 3000);   // 見はり番: 曲が とまっていたら かけなおす
document.addEventListener('visibilitychange', () => { const a = audioCtx(); if (!a.ac) return; if (document.hidden) a.ac.suspend(); else a.ac.resume(); });

// ---------- テスト用: オフラインで 曲を レンダリングして 音のおおきさ・エラーを しらべる ----------
export async function __bgmTest(names, secs = 20) {
  const res = {}, saveAc = ac, saveG = G, saveTb = tbus, saveCur = cur;
  for (const name of names || Object.keys(TRACKS)) {
    try {
      const off = new OfflineAudioContext(2, 44100 * secs, 44100); ac = off; G = buildChain(off); G.out.gain.value = 0.85 * 0.6; G.out.connect(off.destination); tbus = trackBus();
      const tr = TRACKS[name], sd = 60 / tr.bpm / 4; let s = -(tr.intro || 0) * 16, t = 0; while (t < secs - 1.5) { scheduleStep(tr, s, t, sd); s++; if (s >= tr.n * 16) s = 0; t += sd; }
      const buf = await off.startRendering(), d0 = buf.getChannelData(0), d1 = buf.getChannelData(1); let pk = 0, sq = 0; for (let i = 0; i < d0.length; i++) { const a = Math.max(Math.abs(d0[i]), Math.abs(d1[i])); if (a > pk) pk = a; sq += d0[i] * d0[i]; }
      res[name] = { peak: +pk.toFixed(3), rms: +(20 * Math.log10(Math.sqrt(sq / d0.length) + 1e-9)).toFixed(1), bars: tr.n };
    } catch (e) { res[name] = { err: String(e && e.message || e) }; }
  }
  ac = saveAc; G = saveG; tbus = saveTb; cur = saveCur; return { res, warn: window.__bgmWarn || [] };
}
export const __tracks = () => Object.fromEntries(Object.entries(TRACKS).map(([k, t]) => [k, { bpm: t.bpm, lead: t.L_lead.map(l => { let lo = 999, hi = 0; for (const b of l.bars_ || []) for (const n of b) { const m = n[1] + 12 * (l.oct || 0); lo = Math.min(lo, m); hi = Math.max(hi, m); } return [l.i, lo, hi]; }) }]));

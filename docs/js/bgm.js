// BGM(外部音源なし。WebAudioで鳴らす ちいさなシーケンサー。本番では音源に差し替え可)
import { unlockAudio, audioCtx } from './audio.js';

const KEY = 'chinchilla-ranch-audio';
const cfg = (() => { try { return { bgm: 0.6, sfx: 0.6, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { return { bgm: 0.6, sfx: 0.6 }; } })();
export const audioConfig = cfg;
const saveCfg = () => { try { localStorage.setItem(KEY, JSON.stringify(cfg)); } catch {} };

const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
// コードは [根音, 3度, 5度](MIDI)。1小節=16ステップ(16分音符)
const C = { C: [48, 52, 55], Am: [45, 48, 52], F: [41, 45, 48], G: [43, 47, 50], Em: [40, 43, 47], D: [50, 54, 57], Dm: [50, 53, 57], Bb: [46, 50, 53], A: [45, 49, 52], Cc: [48, 52, 55], Gm: [43, 46, 50], E: [40, 44, 47], Edim: [40, 43, 46] };
const mel = (...a) => a;   // [ステップ, 音, ながさ]

const TRACKS = {
  // のんびり(むら)
  village: { bpm: 88, bars: ['C', 'Am', 'F', 'G', 'C', 'Am', 'F', 'G'], arp: { wave: 'triangle', vol: 0.07, pat: [0, 1, 2, 1, 0, 1, 2, 1], up: 12, every: 2 }, bass: { wave: 'sine', vol: 0.13, steps: [0, 8] },
    mel: { wave: 'sine', vol: 0.1, notes: [
      mel(0, 76, 4), mel(4, 79, 2), mel(6, 76, 2), mel(8, 74, 4), mel(12, 72, 4),
      mel(0, 69, 4), mel(4, 72, 4), mel(8, 76, 6), mel(14, 74, 2),
      mel(0, 72, 4), mel(4, 69, 2), mel(6, 72, 2), mel(8, 74, 4), mel(12, 72, 4),
      mel(0, 71, 6), mel(6, 74, 2), mel(8, 79, 8),
      mel(0, 76, 4), mel(4, 79, 4), mel(8, 81, 4), mel(12, 79, 4),
      mel(0, 76, 6), mel(6, 72, 2), mel(8, 69, 8),
      mel(0, 77, 4), mel(4, 76, 2), mel(6, 74, 2), mel(8, 72, 8),
      mel(0, 74, 4), mel(4, 71, 4), mel(8, 67, 8)] } },
  // ぼうけん(もり)
  field: { bpm: 112, bars: ['Am', 'F', 'C', 'G', 'Am', 'F', 'G', 'Am'], arp: { wave: 'square', vol: 0.035, pat: [0, 2, 1, 2, 0, 2, 1, 2], up: 12, every: 2 }, bass: { wave: 'triangle', vol: 0.16, steps: [0, 6, 8, 14] },
    mel: { wave: 'triangle', vol: 0.12, notes: [
      mel(0, 69, 2), mel(2, 72, 2), mel(4, 76, 4), mel(8, 74, 2), mel(10, 72, 2), mel(12, 69, 4),
      mel(0, 72, 2), mel(2, 69, 2), mel(4, 77, 4), mel(8, 76, 4), mel(12, 72, 4),
      mel(0, 76, 4), mel(4, 79, 2), mel(6, 76, 2), mel(8, 72, 4), mel(12, 76, 4),
      mel(0, 74, 4), mel(4, 71, 2), mel(6, 74, 2), mel(8, 79, 8),
      mel(0, 69, 2), mel(2, 72, 2), mel(4, 76, 4), mel(8, 81, 4), mel(12, 79, 4),
      mel(0, 77, 4), mel(4, 76, 2), mel(6, 72, 2), mel(8, 69, 8),
      mel(0, 74, 4), mel(4, 79, 4), mel(8, 78, 4), mel(12, 74, 4),
      mel(0, 69, 8), mel(8, 72, 4), mel(12, 76, 4)] } },
  // バトル(ドラム・パッド・ぶあついリードで、きんぱくした たたかいの ふんいき)
  battle: { bpm: 164, bars: ['Am', 'Am', 'F', 'G', 'Am', 'F', 'Dm', 'E'],
    arp: { wave: 'triangle', vol: 0.03, pat: [0, 1, 2, 1, 2, 1, 0, 1], up: 12, every: 2, lp: 2200 },
    bass: { wave: 'sawtooth', vol: 0.11, steps: [0, 2, 3, 4, 6, 8, 10, 11, 12, 14], lp: 520 },
    pad: { wave: 'sawtooth', vol: 0.022, lp: 1100 },
    drums: { k: [0, 6, 8, 11], s: [4, 12], h: [0, 2, 4, 6, 8, 10, 12, 14], hv: 0.5 },
    mel: { wave: 'sawtooth', vol: 0.05, lp: 3200, det: 9, notes: [
      mel(0, 81, 2), mel(2, 76, 2), mel(4, 72, 2), mel(6, 76, 2), mel(8, 81, 4), mel(12, 79, 2), mel(14, 76, 2),
      mel(0, 77, 2), mel(2, 76, 2), mel(4, 72, 2), mel(6, 69, 2), mel(8, 72, 8),
      mel(0, 77, 2), mel(2, 81, 2), mel(4, 84, 2), mel(6, 81, 2), mel(8, 77, 4), mel(12, 81, 4),
      mel(0, 83, 2), mel(2, 79, 2), mel(4, 74, 2), mel(6, 79, 2), mel(8, 83, 6), mel(14, 81, 2),
      mel(0, 81, 2), mel(2, 84, 2), mel(4, 88, 4), mel(8, 86, 2), mel(10, 84, 2), mel(12, 81, 4),
      mel(0, 84, 2), mel(2, 81, 2), mel(4, 77, 2), mel(6, 81, 2), mel(8, 84, 8),
      mel(0, 86, 2), mel(2, 81, 2), mel(4, 77, 2), mel(6, 74, 2), mel(8, 77, 4), mel(12, 81, 4),
      mel(0, 80, 2), mel(2, 83, 2), mel(4, 88, 4), mel(8, 87, 2), mel(10, 83, 2), mel(12, 80, 2), mel(14, 83, 2)] } },
  // ボス(おもく せまってくる ひくい ギャロップ・ふきんしんな ひびき・はやい ドラム)
  boss: { bpm: 176, bars: ['Dm', 'Dm', 'Bb', 'A', 'Dm', 'Gm', 'Edim', 'A'],
    arp: { wave: 'sawtooth', vol: 0.026, pat: [0, 1, 2, 1, 0, 2, 1, 2], up: 12, every: 1, lp: 2000 },
    bass: { wave: 'sawtooth', vol: 0.14, steps: [0, 1, 2, 3, 4, 6, 7, 8, 9, 10, 11, 12, 14, 15], lp: 480 },
    pad: { wave: 'sawtooth', vol: 0.03, lp: 900 },
    drums: { k: [0, 3, 6, 8, 10, 11, 14], s: [4, 12], h: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], hv: 0.45, boom: [0] },
    mel: { wave: 'sawtooth', vol: 0.058, lp: 3600, det: 12, notes: [
      mel(0, 86, 3), mel(3, 85, 1), mel(4, 86, 2), mel(6, 89, 2), mel(8, 88, 4), mel(12, 86, 2), mel(14, 85, 2),
      mel(0, 81, 2), mel(2, 82, 2), mel(4, 81, 2), mel(6, 77, 2), mel(8, 74, 8),
      mel(0, 89, 3), mel(3, 86, 1), mel(4, 82, 4), mel(8, 86, 2), mel(10, 89, 2), mel(12, 91, 4),
      mel(0, 88, 3), mel(3, 85, 1), mel(4, 81, 4), mel(8, 85, 2), mel(10, 88, 2), mel(12, 85, 4),
      mel(0, 86, 2), mel(2, 89, 2), mel(4, 93, 4), mel(8, 91, 2), mel(10, 89, 2), mel(12, 86, 4),
      mel(0, 91, 3), mel(3, 89, 1), mel(4, 86, 4), mel(8, 82, 2), mel(10, 86, 2), mel(12, 89, 4),
      mel(0, 88, 2), mel(2, 85, 2), mel(4, 82, 2), mel(6, 79, 2), mel(8, 76, 4), mel(12, 79, 4),
      mel(0, 85, 2), mel(2, 88, 2), mel(4, 91, 2), mel(6, 88, 2), mel(8, 85, 4), mel(12, 81, 4)] } },
};

let ac = null, bus = null, timer = null, cur = null, want = null, nextT = 0, step = 0;
function ensure() {
  const a = audioCtx(); if (!a.ac) return false;
  if (ac !== a.ac) { ac = a.ac; bus = ac.createGain(); bus.connect(ac.destination); }
  bus.gain.value = cfg.bgm * 0.8; return true;
}
function note(wave, freq, t, dur, vol, lp, det) {
  const o = ac.createOscillator(), g = ac.createGain(); o.type = wave; o.frequency.value = freq; if (det) o.detune.value = det;
  let out = g; if (lp) { const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lp; g.connect(f); out = f; }
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(0.06, dur));
  o.connect(g); out.connect(bus); o.start(t); o.stop(t + dur + 0.06);
}
function padNote(wave, freq, t, dur, vol, lp) {   // のばす おと(ふくらんで、さいごに きえる)
  const o = ac.createOscillator(), g = ac.createGain(), f = ac.createBiquadFilter(); o.type = wave; o.frequency.value = freq; f.type = 'lowpass'; f.frequency.value = lp || 1200;
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.18); g.gain.setValueAtTime(vol, t + dur - 0.12); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(f); f.connect(g); g.connect(bus); o.start(t); o.stop(t + dur + 0.05);
}
let noiseBuf = null;
function noiseSrc() { if (!noiseBuf || noiseBuf.sampleRate !== ac.sampleRate) { noiseBuf = ac.createBuffer(1, Math.floor(ac.sampleRate * 0.4), ac.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; } const n = ac.createBufferSource(); n.buffer = noiseBuf; return n; }
function perc(kind, t, vol) {   // ドラム(キック/スネア/ハイハット/ひくい ドーン)
  if (kind === 'k' || kind === 'boom') {
    const o = ac.createOscillator(), g = ac.createGain(), lo = kind === 'boom' ? 38 : 48; o.type = 'sine'; o.frequency.setValueAtTime(kind === 'boom' ? 110 : 160, t); o.frequency.exponentialRampToValueAtTime(lo, t + (kind === 'boom' ? 0.25 : 0.1));
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + (kind === 'boom' ? 0.5 : 0.18)); o.connect(g); g.connect(bus); o.start(t); o.stop(t + 0.55);
  } else {
    const n = noiseSrc(), f = ac.createBiquadFilter(), g = ac.createGain(); f.type = 'highpass'; f.frequency.value = kind === 's' ? 1400 : 7000;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + (kind === 's' ? 0.16 : 0.045)); n.connect(f); f.connect(g); g.connect(bus); n.start(t); n.stop(t + 0.2);
    if (kind === 's') { const o = ac.createOscillator(), g2 = ac.createGain(); o.type = 'triangle'; o.frequency.setValueAtTime(220, t); o.frequency.exponentialRampToValueAtTime(110, t + 0.08); g2.gain.setValueAtTime(vol * 0.5, t); g2.gain.exponentialRampToValueAtTime(0.001, t + 0.1); o.connect(g2); g2.connect(bus); o.start(t); o.stop(t + 0.12); }
  }
}
function scheduleStep(tr, s, t, sd) {
  const bar = Math.floor(s / 16) % tr.bars.length, st = s % 16, ch = C[tr.bars[bar]];
  if (tr.bass.steps.includes(st)) note(tr.bass.wave, mtof(ch[0] - 12 + (st % 4 === 2 && tr.bass.steps.length > 4 ? 12 : 0)), t, sd * (tr.bass.steps.length > 4 ? 1.6 : 6), tr.bass.vol, tr.bass.lp);
  if (st % tr.arp.every === 0) { const i = tr.arp.pat[(st / tr.arp.every) % tr.arp.pat.length]; note(tr.arp.wave, mtof(ch[i % 3] + tr.arp.up), t, sd * 1.8, tr.arp.vol, tr.arp.lp); }
  for (const [ms, m, len] of tr.mel.notes_[bar]) if (ms === st) { note(tr.mel.wave, mtof(m), t, sd * len * 0.95, tr.mel.vol, tr.mel.lp, tr.mel.det ? -tr.mel.det : 0); if (tr.mel.det) note(tr.mel.wave, mtof(m), t, sd * len * 0.95, tr.mel.vol, tr.mel.lp, tr.mel.det); }
  if (tr.pad && st === 0) for (const m of ch) padNote(tr.pad.wave, mtof(m), t, sd * 16, tr.pad.vol, tr.pad.lp);
  if (tr.drums) { const d = tr.drums; if (d.k.includes(st)) perc('k', t, 0.5); if (d.s.includes(st)) perc('s', t, 0.3); if (d.h.includes(st)) perc('h', t, 0.1 * (d.hv || 1) * (st % 4 === 0 ? 1.4 : 1)); if (d.boom && d.boom.includes(st) && bar % 2 === 0) perc('boom', t, 0.45); }
}
// メロディを小節ごとに分けておく(1小節=16ステップ)
for (const tr of Object.values(TRACKS)) {
  tr.mel.notes_ = tr.bars.map(() => []); let bar = 0, last = -1;
  for (const n of tr.mel.notes) { if (n[0] <= last) bar++; last = n[0]; (tr.mel.notes_[bar] || (tr.mel.notes_[bar] = [])).push(n); }
}
function tick() {
  if (!ac || !cur) return; const tr = TRACKS[cur], sd = 60 / tr.bpm / 4;
  if (nextT < ac.currentTime) nextT = ac.currentTime + 0.05;
  while (nextT < ac.currentTime + 0.35) { scheduleStep(tr, step, nextT, sd); step = (step + 1) % (tr.bars.length * 16); nextT += sd; }
}
function startNow(name) {
  cur = name; step = 0; nextT = 0; clearInterval(timer);
  if (!cfg.bgm || !name) { cur = null; return; }
  timer = setInterval(tick, 80); tick();
}
export function playBgm(name) {
  want = name; if (name === cur && timer) return;
  if (!ensure()) return;   // まだ音が使えない(タッチしたら はじまる)
  startNow(name);
}
export function stopBgm() { want = null; cur = null; clearInterval(timer); timer = null; }
export function setVolumes(bgm, sfx) {
  if (bgm != null) cfg.bgm = bgm; if (sfx != null) cfg.sfx = sfx; saveCfg();
  const a = audioCtx(); if (a.master) a.master.gain.value = 0.35 * cfg.sfx * 1.6;
  if (bus) bus.gain.value = cfg.bgm * 0.8;
  if (cfg.bgm && want && !timer) { if (ensure()) startNow(want); } else if (!cfg.bgm) { clearInterval(timer); timer = null; cur = null; }
}
// 短いファンファーレ
export function jingle(kind = 'win') {
  if (!ensure()) return; const t = ac.currentTime + 0.05, seq = kind === 'win' ? [[72, 0, .14], [72, .16, .14], [72, .32, .14], [76, .5, .3], [72, .86, .14], [76, 1.02, .14], [79, 1.2, .5]] : [[79, 0, .12], [76, .12, .12], [72, .24, .12], [67, .36, .4]];
  const was = cur; if (was) { clearInterval(timer); timer = null; }
  for (const [m, d, l] of seq) note('square', mtof(m), t + d, l, 0.07); for (const [m, d, l] of seq) note('triangle', mtof(m - 12), t + d, l, 0.1);
  if (was) setTimeout(() => { if (want === was) startNow(was); }, 2100);
}
// さいしょの タッチで 音を ゆるす(ページを開きなおしても ならせる)
const unlock = () => { unlockAudio(); const a = audioCtx(); if (a.master) a.master.gain.value = 0.35 * cfg.sfx * 1.6; if (want && !timer) { if (ensure()) startNow(want); } };
['pointerdown', 'touchend', 'keydown'].forEach(ev => addEventListener(ev, unlock, { once: false, passive: true }));
document.addEventListener('visibilitychange', () => { const a = audioCtx(); if (!a.ac) return; if (document.hidden) a.ac.suspend(); else a.ac.resume(); });

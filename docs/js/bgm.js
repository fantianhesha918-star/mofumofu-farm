// BGM(外部音源なし。WebAudioで鳴らす ちいさなシーケンサー。本番では音源に差し替え可)
import { unlockAudio, audioCtx } from './audio.js';

const KEY = 'chinchilla-ranch-audio';
const cfg = (() => { try { return { bgm: 0.6, sfx: 0.6, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { return { bgm: 0.6, sfx: 0.6 }; } })();
export const audioConfig = cfg;
const saveCfg = () => { try { localStorage.setItem(KEY, JSON.stringify(cfg)); } catch {} };

const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
// コードは [根音, 3度, 5度](MIDI)。1小節=16ステップ(16分音符)
const C = { C: [48, 52, 55], Am: [45, 48, 52], F: [41, 45, 48], G: [43, 47, 50], Em: [40, 43, 47], D: [50, 54, 57], Dm: [50, 53, 57], Bb: [46, 50, 53], A: [45, 49, 52], Cc: [48, 52, 55], Gm: [43, 46, 50], E: [40, 44, 47] };
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
  // バトル
  battle: { bpm: 150, bars: ['Em', 'C', 'G', 'D', 'Em', 'C', 'D', 'Em'], arp: { wave: 'square', vol: 0.04, pat: [0, 1, 2, 1, 2, 1, 0, 1], up: 12, every: 2 }, bass: { wave: 'sawtooth', vol: 0.1, steps: [0, 2, 4, 6, 8, 10, 12, 14], lp: 700 },
    mel: { wave: 'square', vol: 0.06, notes: [
      mel(0, 76, 2), mel(2, 76, 2), mel(4, 79, 2), mel(6, 83, 2), mel(8, 81, 4), mel(12, 79, 4),
      mel(0, 79, 2), mel(2, 79, 2), mel(4, 76, 2), mel(6, 72, 2), mel(8, 76, 8),
      mel(0, 74, 2), mel(2, 74, 2), mel(4, 79, 2), mel(6, 83, 2), mel(8, 86, 4), mel(12, 83, 4),
      mel(0, 81, 4), mel(4, 78, 4), mel(8, 74, 8),
      mel(0, 76, 2), mel(2, 79, 2), mel(4, 83, 2), mel(6, 86, 2), mel(8, 83, 4), mel(12, 79, 4),
      mel(0, 84, 2), mel(2, 79, 2), mel(4, 76, 2), mel(6, 72, 2), mel(8, 79, 8),
      mel(0, 78, 2), mel(2, 81, 2), mel(4, 86, 2), mel(6, 81, 2), mel(8, 78, 4), mel(12, 74, 4),
      mel(0, 76, 4), mel(4, 83, 4), mel(8, 76, 8)] } },
  // ボス
  boss: { bpm: 164, bars: ['Dm', 'Bb', 'C', 'A', 'Dm', 'Gm', 'A', 'Dm'], arp: { wave: 'sawtooth', vol: 0.03, pat: [0, 1, 2, 1, 0, 2, 1, 2], up: 12, every: 1, lp: 2400 }, bass: { wave: 'sawtooth', vol: 0.12, steps: [0, 2, 3, 4, 6, 8, 10, 11, 12, 14], lp: 600 },
    mel: { wave: 'square', vol: 0.065, notes: [
      mel(0, 74, 3), mel(3, 77, 1), mel(4, 81, 4), mel(8, 80, 2), mel(10, 81, 2), mel(12, 84, 4),
      mel(0, 82, 3), mel(3, 81, 1), mel(4, 77, 4), mel(8, 74, 8),
      mel(0, 79, 3), mel(3, 84, 1), mel(4, 88, 4), mel(8, 86, 2), mel(10, 84, 2), mel(12, 79, 4),
      mel(0, 81, 4), mel(4, 85, 4), mel(8, 88, 8),
      mel(0, 86, 3), mel(3, 84, 1), mel(4, 81, 4), mel(8, 77, 4), mel(12, 81, 4),
      mel(0, 82, 3), mel(3, 79, 1), mel(4, 74, 4), mel(8, 70, 8),
      mel(0, 85, 2), mel(2, 88, 2), mel(4, 91, 4), mel(8, 88, 4), mel(12, 85, 4),
      mel(0, 86, 8), mel(8, 81, 4), mel(12, 74, 4)] } },
};

let ac = null, bus = null, timer = null, cur = null, want = null, nextT = 0, step = 0;
function ensure() {
  const a = audioCtx(); if (!a.ac) return false;
  if (ac !== a.ac) { ac = a.ac; bus = ac.createGain(); bus.connect(ac.destination); }
  bus.gain.value = cfg.bgm * 0.8; return true;
}
function note(wave, freq, t, dur, vol, lp) {
  const o = ac.createOscillator(), g = ac.createGain(); o.type = wave; o.frequency.value = freq;
  let out = g; if (lp) { const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lp; g.connect(f); out = f; }
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(0.06, dur));
  o.connect(g); out.connect(bus); o.start(t); o.stop(t + dur + 0.06);
}
function scheduleStep(tr, s, t, sd) {
  const bar = Math.floor(s / 16) % tr.bars.length, st = s % 16, ch = C[tr.bars[bar]];
  if (tr.bass.steps.includes(st)) note(tr.bass.wave, mtof(ch[0] - 12 + (st % 4 === 2 && tr.bass.steps.length > 4 ? 12 : 0)), t, sd * (tr.bass.steps.length > 4 ? 1.6 : 6), tr.bass.vol, tr.bass.lp);
  if (st % tr.arp.every === 0) { const i = tr.arp.pat[(st / tr.arp.every) % tr.arp.pat.length]; note(tr.arp.wave, mtof(ch[i % 3] + tr.arp.up), t, sd * 1.8, tr.arp.vol, tr.arp.lp); }
  for (const [ms, m, len] of tr.mel.notes_[bar]) if (ms === st) note(tr.mel.wave, mtof(m), t, sd * len * 0.95, tr.mel.vol);
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

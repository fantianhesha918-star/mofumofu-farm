// 外部音源なしのWebAudio効果音(試作用。Unity移行時は本番音源に差し替える)
let ac = null, master = null;
export function unlockAudio() {
  if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
  try { ac = new (window.AudioContext || window.webkitAudioContext)(); master = ac.createGain(); master.gain.value = 0.35; master.connect(ac.destination); } catch { ac = null; }
}
export const audioCtx = () => ({ ac, master });
function tone(freq, t0, dur, type = 'sine', vol = 0.5, slide = 0) {
  if (!ac) return; const t = ac.currentTime + t0, o = ac.createOscillator(), g = ac.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.05);
}
function noise(t0, dur, vol = 0.3, f = 2000) {
  if (!ac) return; const n = ac.sampleRate * dur, b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const s = ac.createBufferSource(); s.buffer = b; const fl = ac.createBiquadFilter(); fl.type = 'bandpass'; fl.frequency.value = f; const g = ac.createGain(); g.gain.value = vol;
  s.connect(fl); fl.connect(g); g.connect(master); s.start(ac.currentTime + t0);
}
export function sfx(name) {
  if (!ac) return;
  switch (name) {
    case 'pick': tone(660, 0, 0.12, 'sine', 0.4); tone(990, 0.07, 0.16, 'sine', 0.35); break;
    case 'coin': tone(1200, 0, 0.08, 'square', 0.12); tone(1600, 0.07, 0.18, 'square', 0.12); break;
    case 'plant': tone(180, 0, 0.14, 'sine', 0.5, -80); noise(0, 0.12, 0.2, 500); break;
    case 'water': noise(0, 0.5, 0.07, 2400); break;
    case 'harvest': tone(520, 0, 0.1, 'triangle', 0.4); tone(780, 0.08, 0.1, 'triangle', 0.4); tone(1040, 0.16, 0.2, 'triangle', 0.4); break;
    case 'feed': tone(440, 0, 0.1, 'sine', 0.3); tone(550, 0.1, 0.1, 'sine', 0.3); tone(700, 0.2, 0.2, 'sine', 0.3); break;
    case 'pet': tone(880, 0, 0.12, 'sine', 0.25); tone(1180, 0.09, 0.2, 'sine', 0.25); break;
    case 'quest': [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.11, 0.3, 'triangle', 0.35)); break;
    case 'ui': tone(700, 0, 0.06, 'sine', 0.2); break;
    case 'no': tone(200, 0, 0.18, 'sawtooth', 0.15, -40); break;
  }
}

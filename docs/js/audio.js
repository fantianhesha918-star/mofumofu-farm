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
function nsweep(t0, dur, vol, f0, f1, q = 2, type = 'bandpass') {   // ノイズに フィルターの うごきを つけて 「ヒュッ」「ゴォォ」を つくる
  if (!ac) return; const n = Math.floor(ac.sampleRate * (dur + 0.05)), b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  const t = ac.currentTime + t0, s = ac.createBufferSource(); s.buffer = b; const fl = ac.createBiquadFilter(); fl.type = type; fl.Q.value = q; fl.frequency.setValueAtTime(f0, t); fl.frequency.exponentialRampToValueAtTime(Math.max(40, f1), t + dur);
  const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + dur * 0.35); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); s.connect(fl); fl.connect(g); g.connect(master); s.start(t);
}
function chime(freq, t0, dur, vol = 0.2) { tone(freq, t0, dur, 'sine', vol); tone(freq * 2.76, t0, dur * 0.6, 'sine', vol * 0.3); }
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
    case 'ballhit': tone(170, 0, 0.12, 'triangle', 0.55, -90); tone(1500, 0.015, 0.07, 'square', 0.14); noise(0, 0.07, 0.35, 1900); break;   // ボールが あたる
    case 'wobble': tone(310, 0, 0.1, 'square', 0.16, -70); tone(210, 0.07, 0.12, 'triangle', 0.3, -50); noise(0.02, 0.05, 0.12, 2500); break;   // コトッと ゆれる
    case 'levelup': [523, 659, 784, 1047, 1319].forEach((f, i) => { tone(f, i * 0.075, 0.22, 'square', 0.1); tone(f / 2, i * 0.075, 0.22, 'triangle', 0.22); }); tone(1568, 0.42, 0.55, 'square', 0.1); tone(784, 0.42, 0.55, 'triangle', 0.25); tone(2093, 0.5, 0.4, 'sine', 0.12); break;   // レベルアップ
    case 'tick': tone(880, 0, 0.05, 'square', 0.07); break;
    // ---- わざの こうかおん: だす おと(mv_ うごき) / あたる おと(el_ ぞくせい) / ダメージの おもさ(hit_) ----
    case 'mv_ram': noise(0, 0.25, 0.22, 600); tone(120, 0, 0.22, 'sawtooth', 0.18, 220); break;
    case 'mv_beam': tone(300, 0, 0.55, 'sawtooth', 0.12, 900); tone(305, 0, 0.55, 'sawtooth', 0.1, 900); break;
    case 'mv_orb': tone(520, 0, 0.28, 'sine', 0.25, 520); tone(1040, 0.05, 0.2, 'sine', 0.1, 400); break;
    case 'mv_barrage': for (let i = 0; i < 5; i++) tone(700 + i * 40, i * 0.06, 0.05, 'square', 0.1); break;
    case 'mv_bite': tone(900, 0, 0.05, 'square', 0.15); tone(900, 0.09, 0.05, 'square', 0.15); noise(0.1, 0.1, 0.25, 2500); break;
    case 'mv_claw': noise(0, 0.12, 0.3, 3500); noise(0.08, 0.12, 0.3, 3000); noise(0.16, 0.12, 0.3, 3500); break;
    case 'mv_cross': noise(0, 0.14, 0.32, 4200); tone(1500, 0, 0.12, 'sawtooth', 0.08, -700); noise(0.12, 0.14, 0.32, 3800); break;
    case 'mv_pillar': tone(200, 0, 0.45, 'sawtooth', 0.16, 650); noise(0.1, 0.4, 0.18, 1500); break;
    case 'mv_rain': noise(0, 0.6, 0.16, 3200); break;
    case 'mv_vortex': tone(220, 0, 0.8, 'sine', 0.2, 300); noise(0, 0.8, 0.2, 900); break;
    case 'mv_sweep': noise(0, 0.45, 0.22, 1500); tone(400, 0, 0.4, 'sine', 0.12, 400); break;
    case 'mv_quake': tone(60, 0, 0.6, 'sine', 0.5, -20); noise(0, 0.45, 0.35, 200); break;
    case 'el_fire': noise(0, 0.32, 0.35, 1200); tone(160, 0, 0.22, 'sawtooth', 0.2, -80); break;
    case 'el_water': noise(0, 0.38, 0.3, 900); tone(700, 0, 0.16, 'sine', 0.2, -400); break;
    case 'el_grass': noise(0, 0.22, 0.25, 2800); tone(500, 0.03, 0.1, 'triangle', 0.15, 200); break;
    case 'el_wind': noise(0, 0.45, 0.25, 1800); tone(500, 0, 0.35, 'sine', 0.08, -250); break;
    case 'el_earth': tone(80, 0, 0.32, 'sine', 0.55, -30); noise(0, 0.28, 0.3, 300); break;
    case 'el_thunder': noise(0, 0.16, 0.4, 4000); tone(1800, 0, 0.09, 'sawtooth', 0.2, -1200); tone(90, 0.04, 0.3, 'sawtooth', 0.2, -30); break;
    case 'el_heaven': [880, 1109, 1319].forEach((f, i) => tone(f, i * 0.07, 0.45, 'triangle', 0.18)); break;
    case 'el_dark': tone(110, 0, 0.55, 'sawtooth', 0.2, -40); tone(113, 0, 0.55, 'sawtooth', 0.2, -40); noise(0, 0.3, 0.12, 400); break;
    case 'el_magic': [1200, 1500, 1800, 2200].forEach((f, i) => tone(f, i * 0.06, 0.18, 'sine', 0.14, 500)); break;
    case 'el_beast': tone(140, 0, 0.28, 'sawtooth', 0.3, -60); noise(0, 0.18, 0.25, 700); break;
    case 'el_kami': [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.05, 0.7, 'triangle', 0.16)); tone(1568, 0.2, 0.6, 'sine', 0.1); break;
    // ---- ためる おと(わざの はじまり): ぞくせいごとに ちがう ----
    case 'ch_fire': nsweep(0, 0.4, 0.2, 400, 2200, 1.2); tone(180, 0, 0.4, 'sawtooth', 0.08, 220); break;
    case 'ch_water': nsweep(0, 0.4, 0.18, 800, 2600, 3); [660, 880, 1100].forEach((f, i) => tone(f, i * 0.09, 0.2, 'sine', 0.12)); break;
    case 'ch_grass': nsweep(0, 0.4, 0.15, 1500, 4200, 2); tone(420, 0, 0.35, 'triangle', 0.1, 320); break;
    case 'ch_wind': nsweep(0, 0.45, 0.22, 500, 3000, 0.8); break;
    case 'ch_earth': tone(70, 0, 0.45, 'sine', 0.3, 30); nsweep(0, 0.45, 0.15, 300, 120, 1.5); break;
    case 'ch_thunder': for (let i = 0; i < 4; i++) tone(1200 + i * 220, i * 0.07, 0.04, 'square', 0.07); nsweep(0, 0.4, 0.15, 2500, 6000, 1); tone(300, 0, 0.4, 'sawtooth', 0.07, 600); break;
    case 'ch_heaven': [784, 988, 1175, 1568].forEach((f, i) => chime(f, i * 0.08, 0.5, 0.12)); break;
    case 'ch_dark': tone(90, 0, 0.5, 'sawtooth', 0.12, -30); tone(93, 0, 0.5, 'sawtooth', 0.1, -30); nsweep(0, 0.5, 0.12, 900, 150, 1.5); break;
    case 'ch_magic': for (let i = 0; i < 6; i++) tone(900 + i * 260, i * 0.05, 0.14, 'sine', 0.1, 500); break;
    case 'ch_beast': tone(110, 0, 0.35, 'sawtooth', 0.18, -50); nsweep(0, 0.3, 0.2, 600, 200, 1.2); break;
    case 'ch_kami': [523, 659, 784, 1047, 1319].forEach((f, i) => chime(f, i * 0.07, 0.6, 0.1)); nsweep(0, 0.5, 0.1, 1000, 5000, 1); break;
    // ---- あたった あとの よいん(いままでの el_ に かさねる) ----
    case 'ex_fire': nsweep(0.04, 0.5, 0.22, 3000, 700, 1); for (let i = 0; i < 5; i++) noise(0.05 + i * 0.07, 0.04, 0.12, 3500 + i * 300); break;
    case 'ex_water': nsweep(0.03, 0.45, 0.2, 2800, 900, 2); for (let i = 0; i < 4; i++) tone(900 + i * 150, 0.1 + i * 0.07, 0.06, 'sine', 0.1, -300); break;
    case 'ex_grass': for (let i = 0; i < 5; i++) noise(0.03 + i * 0.05, 0.05, 0.16, 3400 + i * 200); tone(600, 0.05, 0.12, 'triangle', 0.1, 300); break;
    case 'ex_wind': nsweep(0.02, 0.55, 0.2, 3500, 800, 1.2); tone(900, 0.05, 0.3, 'sine', 0.06, -500); break;
    case 'ex_earth': tone(60, 0.04, 0.5, 'sine', 0.35, -15); nsweep(0.04, 0.5, 0.2, 500, 150, 1.2); for (let i = 0; i < 4; i++) noise(0.15 + i * 0.07, 0.05, 0.1, 600 + i * 120); break;
    case 'ex_thunder': noise(0.05, 0.05, 0.3, 5000); tone(70, 0.06, 0.6, 'sawtooth', 0.15, -20); nsweep(0.1, 0.5, 0.12, 6000, 1200, 1); break;
    case 'ex_heaven': [1568, 1976, 2349].forEach((f, i) => chime(f, 0.05 + i * 0.06, 0.6, 0.1)); break;
    case 'ex_dark': tone(80, 0.04, 0.7, 'sawtooth', 0.15, -35); nsweep(0.05, 0.6, 0.15, 700, 100, 2); break;
    case 'ex_magic': for (let i = 0; i < 6; i++) chime(1200 + i * 240, 0.04 + i * 0.05, 0.3, 0.07); break;
    case 'ex_beast': tone(100, 0.03, 0.3, 'sawtooth', 0.2, -40); nsweep(0.03, 0.3, 0.2, 1500, 400, 1); break;
    case 'ex_kami': [1047, 1319, 1568, 2093].forEach((f, i) => chime(f, 0.04 + i * 0.07, 0.8, 0.09)); tone(130, 0.04, 0.7, 'triangle', 0.2, -30); break;
    // ---- せんようの わざ ----
    case 'sp_jiware': tone(55, 0, 0.9, 'sine', 0.55, -20); nsweep(0, 0.9, 0.3, 700, 90, 1.5); for (let i = 0; i < 5; i++) noise(0.1 + i * 0.09, 0.08, 0.2, 500 + i * 100); break;
    case 'sp_tsunami': nsweep(0, 1.1, 0.35, 200, 1800, 0.7); nsweep(0.5, 0.9, 0.3, 1800, 300, 0.7); tone(70, 0.4, 0.7, 'sine', 0.3, -20); break;
    case 'sp_fubuki': nsweep(0, 1.0, 0.3, 800, 3500, 1); [2093, 2637, 3136, 2349].forEach((f, i) => chime(f, 0.2 + i * 0.12, 0.5, 0.08)); break;
    case 'sp_taifuu': nsweep(0, 1.0, 0.32, 300, 2400, 0.8); nsweep(0.2, 0.9, 0.25, 2000, 400, 0.8); tone(200, 0, 0.9, 'sine', 0.1, 150); break;
    // ---- かいふく・まもる・ひんし ----
    case 'heal': [659, 784, 988, 1319].forEach((f, i) => chime(f, i * 0.08, 0.5, 0.14)); break;
    case 'guard': tone(220, 0, 0.12, 'square', 0.18, -60); chime(1400, 0.02, 0.3, 0.14); nsweep(0, 0.2, 0.15, 3000, 1500, 3); break;
    case 'faint': tone(440, 0, 0.5, 'triangle', 0.25, -330); tone(220, 0.1, 0.6, 'sine', 0.2, -160); nsweep(0.05, 0.6, 0.12, 1200, 150, 1); break;
    case 'crit': tone(2200, 0, 0.08, 'square', 0.15, -900); chime(1760, 0.03, 0.4, 0.14); noise(0, 0.08, 0.35, 5000); break;
    // ---- じょうたいいじょう ----
    case 'ail_poison': for (let i = 0; i < 4; i++) tone(300 + i * 60, i * 0.11, 0.1, 'sine', 0.18, 280); nsweep(0, 0.5, 0.1, 600, 300, 1.5); break;
    case 'ail_burn': nsweep(0, 0.5, 0.2, 2500, 800, 1); for (let i = 0; i < 6; i++) noise(i * 0.06, 0.04, 0.14, 3000 + i * 250); break;
    case 'ail_freeze': chime(2637, 0, 0.5, 0.14); chime(3136, 0.08, 0.5, 0.12); nsweep(0.04, 0.3, 0.2, 7000, 3000, 3); noise(0.25, 0.05, 0.25, 4800); break;
    case 'ail_sleep': [784, 659, 523, 392].forEach((f, i) => tone(f, i * 0.2, 0.5, 'sine', 0.13)); break;
    case 'ail_paralyze': for (let i = 0; i < 6; i++) { noise(i * 0.06, 0.03, 0.3, 4500); tone(1800 - i * 120, i * 0.06, 0.04, 'square', 0.1, -700); } break;
    case 'ail_confuse': tone(500, 0, 0.7, 'sine', 0.16, 0); for (let i = 0; i < 5; i++) tone(500 + (i % 2 ? 150 : -150), i * 0.12, 0.12, 'triangle', 0.1); break;
    case 'ail_leech': nsweep(0, 0.6, 0.12, 400, 2400, 1.5); tone(300, 0, 0.55, 'sine', 0.12, 500); break;
    // ---- てんこう ----
    case 'wx_sun': [1047, 1319, 1568].forEach((f, i) => chime(f, i * 0.12, 0.9, 0.08)); nsweep(0, 0.9, 0.08, 1500, 4000, 1); break;
    case 'wx_rain': nsweep(0, 1.1, 0.16, 3500, 3000, 0.5, 'highpass'); break;
    case 'wx_sand': nsweep(0, 1.2, 0.22, 600, 1600, 0.8); nsweep(0.3, 0.9, 0.15, 1800, 500, 0.8); break;
    case 'wx_hail': for (let i = 0; i < 9; i++) tone(2400 + (i * 137) % 900, i * 0.07, 0.04, 'triangle', 0.1); nsweep(0, 0.7, 0.1, 5000, 3500, 1); break;
    case 'wx_fog': tone(110, 0, 1.2, 'sine', 0.12); tone(165, 0, 1.2, 'sine', 0.08); nsweep(0, 1.2, 0.08, 400, 700, 1); break;
    case 'hit': tone(150, 0, 0.1, 'triangle', 0.5, -80); noise(0, 0.06, 0.35, 1500); break;
    case 'hit_strong': tone(130, 0, 0.16, 'triangle', 0.65, -90); tone(80, 0, 0.2, 'sine', 0.5, -30); noise(0, 0.1, 0.45, 1300); tone(1800, 0.02, 0.06, 'square', 0.12); break;
    case 'hit_weak': tone(230, 0, 0.08, 'triangle', 0.25, -80); noise(0, 0.04, 0.15, 1800); break;
    case 'hit_crit': tone(130, 0, 0.16, 'triangle', 0.65, -90); noise(0, 0.1, 0.5, 1300); tone(2000, 0.02, 0.1, 'square', 0.15); tone(2600, 0.07, 0.12, 'square', 0.12); break;
  }
}

// バトル画面の空に 動きを つける(くも・とり・ほし・ひのこ・きり など。フィールドごとに ちがう)
const THEME = {
  'battle_grass.webp': 'day', 'battle_forest.webp': 'day', 'battle_grove.webp': 'day', 'battle_water.webp': 'day', 'battle_dragon.webp': 'day',
  'battle_sky.webp': 'cloud', 'battle_sun.webp': 'sun', 'battle_volcano.webp': 'ember', 'battle_ghost.webp': 'ghost', 'battle_castle.webp': 'bat',
  'battle_cave.webp': 'dust', 'battle_temple.webp': 'star', 'battle_cosmos.webp': 'star', 'battle_end.webp': 'aurora',
};
export function startSky(field, bg) {
  const kind = THEME[bg] || 'day', cv = document.createElement('canvas'); cv.className = 'bt-sky'; field.insertBefore(cv, field.querySelector('.bt-card'));
  const cx = cv.getContext('2d'); let W = 0, H = 0, last = performance.now(), T = 0;
  const R = (a, b) => a + Math.random() * (b - a);
  const fit = () => { const w = field.clientWidth, h = field.clientHeight; if (!w || !h) return; const k = Math.min(1.5, devicePixelRatio || 1) * 0.6; W = Math.round(w * k); H = Math.round(h * 0.42 * k); cv.width = W; cv.height = H; };
  fit(); window.addEventListener('resize', fit);
  const cloudCol = { day: '255,255,255', cloud: '255,250,245', sun: '255,226,170', ghost: '170,160,210', bat: '90,70,110', dust: '200,190,170', ember: '60,40,36', star: '200,210,255', aurora: '200,255,230' }[kind];
  const nCloud = { day: 6, cloud: 8, sun: 6, ghost: 5, bat: 4, ember: 5, dust: 3, star: 0, aurora: 0 }[kind];
  const clouds = Array.from({ length: nCloud }, () => ({ x: R(0, 1), y: R(0.04, kind === 'day' || kind === 'cloud' || kind === 'sun' ? 0.4 : 0.7), s: R(0.12, 0.26), v: R(0.004, 0.012), a: R(0.35, 0.7) }));
  const stars = Array.from({ length: kind === 'star' ? 70 : kind === 'aurora' ? 40 : 0 }, () => ({ x: R(0, 1), y: R(0, 0.85), r: R(0.4, 1.6), p: R(0, 6), v: R(1, 3) }));
  const parts = Array.from({ length: kind === 'ember' ? 40 : kind === 'dust' ? 24 : kind === 'ghost' ? 10 : kind === 'sun' ? 18 : 0 }, () => ({ x: R(0, 1), y: R(0, 1), v: R(0.03, 0.09), w: R(0, 6), r: R(0.8, 2.6) }));
  const birds = [], bats = []; let shoot = null, nextShoot = R(2, 5), nextBird = R(1, 4);
  const blob = (x, y, s, a) => { const g = cx.createRadialGradient(x, y, 0, x, y, s); g.addColorStop(0, `rgba(${cloudCol},${a})`); g.addColorStop(0.6, `rgba(${cloudCol},${a * 0.45})`); g.addColorStop(1, `rgba(${cloudCol},0)`); cx.fillStyle = g; cx.beginPath(); cx.ellipse(x, y, s, s * 0.55, 0, 0, 6.3); cx.fill(); };
  const loop = (now) => {
    if (!field.isConnected) { window.removeEventListener('resize', fit); return; }
    const dt = Math.min(0.05, (now - last) / 1000); last = now; T += dt; requestAnimationFrame(loop);
    if (!W) { fit(); return; }
    cx.clearRect(0, 0, W, H); cx.globalCompositeOperation = kind === 'ember' || kind === 'star' || kind === 'aurora' || kind === 'sun' ? 'lighter' : 'source-over';
    if (kind === 'aurora') { for (let i = 0; i < 3; i++) { const y0 = H * (0.25 + i * 0.12); cx.beginPath(); cx.moveTo(0, y0); for (let x = 0; x <= W; x += W / 24) cx.lineTo(x, y0 + Math.sin(x * 0.012 + T * 0.6 + i * 2) * H * 0.08); cx.lineTo(W, y0 + H * 0.34); cx.lineTo(0, y0 + H * 0.34); const g = cx.createLinearGradient(0, y0 - H * 0.1, 0, y0 + H * 0.34); const c = ['120,255,200', '140,170,255', '230,150,255'][i]; g.addColorStop(0, `rgba(${c},0)`); g.addColorStop(0.35, `rgba(${c},${0.2 + Math.sin(T + i) * 0.06})`); g.addColorStop(1, `rgba(${c},0)`); cx.fillStyle = g; cx.fill(); } }
    if (kind === 'sun') { for (let i = 0; i < 5; i++) { const x0 = W * (0.15 + i * 0.18) + Math.sin(T * 0.3 + i) * 12; const g = cx.createLinearGradient(x0, 0, x0 + W * 0.15, H); g.addColorStop(0, 'rgba(255,240,190,0.16)'); g.addColorStop(1, 'rgba(255,240,190,0)'); cx.fillStyle = g; cx.beginPath(); cx.moveTo(x0, 0); cx.lineTo(x0 + W * 0.07, 0); cx.lineTo(x0 + W * 0.3, H); cx.lineTo(x0 + W * 0.12, H); cx.fill(); } }
    for (const s of stars) { const a = 0.35 + 0.65 * Math.abs(Math.sin(T * s.v + s.p)); cx.fillStyle = `rgba(255,255,255,${a})`; cx.beginPath(); cx.arc(s.x * W, s.y * H, s.r * (W / 400 + 0.5), 0, 6.3); cx.fill(); }
    if (kind === 'star' || kind === 'aurora') { nextShoot -= dt; if (nextShoot < 0 && !shoot) { shoot = { x: R(0.4, 1), y: R(0, 0.3), t: 0 }; nextShoot = R(3, 7); } if (shoot) { shoot.t += dt; const p = shoot.t / 0.7, x = shoot.x * W - p * W * 0.35, y = shoot.y * H + p * H * 0.4; const g = cx.createLinearGradient(x, y, x + W * 0.1, y - H * 0.11); g.addColorStop(0, `rgba(255,255,255,${Math.max(0, 1 - p)})`); g.addColorStop(1, 'rgba(255,255,255,0)'); cx.strokeStyle = g; cx.lineWidth = 2; cx.beginPath(); cx.moveTo(x, y); cx.lineTo(x + W * 0.1, y - H * 0.11); cx.stroke(); if (p >= 1) shoot = null; } }
    for (const c of clouds) { c.x += c.v * dt * (kind === 'ghost' ? 1.6 : 1); if (c.x > 1.3) c.x = -0.3; const s = c.s * W, y = c.y * H; blob(c.x * W, y, s, c.a * (kind === 'ember' ? 0.45 : 1)); blob(c.x * W - s * 0.55, y + s * 0.1, s * 0.7, c.a * 0.9); blob(c.x * W + s * 0.6, y + s * 0.08, s * 0.75, c.a * 0.85); }
    for (const p of parts) {
      if (kind === 'ember') { p.y -= p.v * dt * 1.4; p.x += Math.sin(T * 1.5 + p.w) * 0.02 * dt; if (p.y < -0.05) { p.y = 1.05; p.x = R(0, 1); } cx.fillStyle = `rgba(255,${Math.round(110 + 90 * Math.abs(Math.sin(T * 3 + p.w)))},40,${0.9 * Math.min(1, p.y + 0.2)})`; cx.beginPath(); cx.arc(p.x * W, p.y * H, p.r * (W / 400 + 0.4), 0, 6.3); cx.fill(); }
      else if (kind === 'dust') { p.y -= p.v * 0.3 * dt; p.x += Math.sin(T * 0.7 + p.w) * 0.01 * dt; if (p.y < 0) p.y = 1; cx.fillStyle = `rgba(230,220,190,${0.25 + 0.2 * Math.sin(T + p.w)})`; cx.beginPath(); cx.arc(p.x * W, p.y * H, p.r * 0.8, 0, 6.3); cx.fill(); }
      else if (kind === 'ghost') { p.y -= p.v * 0.5 * dt; p.x += Math.sin(T * 0.8 + p.w) * 0.03 * dt; if (p.y < -0.1) { p.y = 1.05; p.x = R(0, 1); } const x = p.x * W, y = p.y * H, g = cx.createRadialGradient(x, y, 0, x, y, p.r * 9); g.addColorStop(0, 'rgba(190,230,255,0.55)'); g.addColorStop(1, 'rgba(190,230,255,0)'); cx.fillStyle = g; cx.beginPath(); cx.arc(x, y, p.r * 9, 0, 6.3); cx.fill(); }
      else if (kind === 'sun') { p.y += p.v * 0.2 * dt; p.x += Math.sin(T + p.w) * 0.01 * dt; if (p.y > 1) p.y = 0; cx.fillStyle = `rgba(255,236,170,${0.35 + 0.35 * Math.sin(T * 2 + p.w)})`; cx.beginPath(); cx.arc(p.x * W, p.y * H, p.r, 0, 6.3); cx.fill(); }
    }
    cx.globalCompositeOperation = 'source-over';
    if (kind === 'day' || kind === 'cloud' || kind === 'sun') { nextBird -= dt; if (nextBird < 0) { void ({ x: -0.05, y: R(0.15, 0.6), v: R(0.06, 0.1), p: R(0, 6) }); nextBird = R(5, 11); } }
    if (kind === 'bat') { nextBird -= dt; if (nextBird < 0) { void ({ x: 1.05, y: R(0.2, 0.7), v: R(0.1, 0.17), p: R(0, 6) }); nextBird = R(2.5, 6); } }
    const wing = (b, col, big) => { b.x += (kind === 'bat' ? -1 : 1) * b.v * dt; const x = b.x * W, y = b.y * H + Math.sin(T * 2 + b.p) * H * 0.02, f = Math.sin(T * (big ? 12 : 7) + b.p) * 0.6, sz = (big ? 9 : 7) * (W / 400 + 0.5); cx.strokeStyle = col; cx.lineWidth = Math.max(1.2, sz * 0.18); cx.lineCap = 'round'; cx.beginPath(); cx.moveTo(x - sz, y - sz * 0.4 * (1 + f)); cx.quadraticCurveTo(x - sz * 0.4, y + sz * 0.1, x, y); cx.quadraticCurveTo(x + sz * 0.4, y + sz * 0.1, x + sz, y - sz * 0.4 * (1 + f)); cx.stroke(); };
    for (let i = birds.length - 1; i >= 0; i--) { wing(birds[i], 'rgba(40,50,60,0.75)', false); if (birds[i].x > 1.1) birds.splice(i, 1); }
    for (let i = bats.length - 1; i >= 0; i--) { wing(bats[i], 'rgba(15,10,25,0.9)', true); if (bats[i].x < -0.1) bats.splice(i, 1); }
  };
  requestAnimationFrame(loop);
}

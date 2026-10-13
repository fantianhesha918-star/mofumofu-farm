// きせつ(7日で 1きせつ。はる→なつ→あき→ふゆ)。むらの いろあい・ふってくる もの・おまつり
export const SEASONS = [
  { id: 'spring', name: 'はる', tint: 'rgba(255,196,220,.11)', gift: 'season_petal' },
  { id: 'summer', name: 'なつ', tint: 'rgba(255,232,110,.09)', gift: 'season_sun' },
  { id: 'autumn', name: 'あき', tint: 'rgba(255,140,50,.15)', gift: 'season_leaf' },
  { id: 'winter', name: 'ふゆ', tint: 'rgba(150,190,255,.15)', gift: 'season_snow' },
];
export function seasonOf(day) {
  const d = Math.max(1, day || 1) - 1, idx = Math.floor(d / 7) % 4, dayIn = (d % 7) + 1;
  return { ...SEASONS[idx], idx, dayIn, first: dayIn === 1, festival: dayIn === 7 };
}
export const festivalNow = (day) => seasonOf(day).festival;

// ふってくる もの(はなびら・ほたる・もみじ・ゆき)。むらの そとや おうちの なかでは でない
export function startSeasonFx(getInfo) {
  const cv = document.createElement('canvas'); cv.id = 'season-fx'; cv.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:2;'; document.body.appendChild(cv);
  const tint = document.createElement('div'); tint.id = 'season-tint'; tint.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:1;mix-blend-mode:soft-light;transition:background 1.5s;'; document.body.appendChild(tint);
  const cx = cv.getContext('2d'); let W = 0, H = 0, last = performance.now(), kind = '';
  const fit = () => { const k = Math.min(1.5, devicePixelRatio || 1) * 0.6; W = Math.round(innerWidth * k); H = Math.round(innerHeight * k); cv.width = W; cv.height = H; };
  fit(); addEventListener('resize', fit);
  const R = (a, b) => a + Math.random() * (b - a);
  let ps = [];
  const petalImg = new Image(); petalImg.src = './assets/effects/sakura_sheet.webp';   // Blenderで つくった はなびら(8コマ)
  const spawn = (id) => ({ x: R(0, 1), y: R(-0.1, 1), v: R(0.04, 0.1), w: R(0, 6), s: R(0.6, 1.4), r: R(0, 6), c: Math.random() });
  const loop = (now) => {
    requestAnimationFrame(loop); const dt = Math.min(0.05, (now - last) / 1000); last = now;
    const info = getInfo(), S = seasonOf(info.day); const want = info.indoors ? '' : S.id;
    if (tint.dataset.s !== S.id) { tint.dataset.s = S.id; tint.style.background = S.tint; }
    tint.style.display = info.indoors ? 'none' : '';
    if (kind !== want) { kind = want; ps = want ? Array.from({ length: want === 'winter' ? 46 : want === 'summer' ? 18 : 24 }, () => spawn(want)) : []; }
    cx.clearRect(0, 0, W, H); if (!kind || !W) return;
    const night = info.hour >= 19.5 || info.hour < 5.5, T = now / 1000;
    for (const p of ps) {
      p.y += p.v * dt * (kind === 'summer' ? -0.6 : 1); p.x += Math.sin(T * 0.8 + p.w) * 0.03 * dt * (kind === 'winter' ? 1 : 2.2); p.r += dt * (kind === 'autumn' ? 2.4 : 1.2);
      if (kind === 'summer') { if (p.y < -0.05) { p.y = 1.05; p.x = R(0, 1); } } else if (p.y > 1.05) { p.y = -0.05; p.x = R(0, 1); }
      const x = p.x * W, y = p.y * H, u = W / 400 + 0.4;
      if (kind === 'spring') { if (petalImg.complete && petalImg.naturalWidth) { const fr = Math.floor(T * 3 + p.w * 3) & 7, sz = 22 * p.s * u; cx.save(); cx.translate(x, y); cx.rotate(p.r * 0.6); cx.globalAlpha = 0.95; cx.drawImage(petalImg, fr * 64, 0, 64, 64, -sz / 2, -sz / 2, sz, sz); cx.restore(); } }
      else if (kind === 'summer') { if (night) { const a = 0.4 + 0.5 * Math.sin(T * 2 + p.w); const g = cx.createRadialGradient(x, y, 0, x, y, 9 * u); g.addColorStop(0, `rgba(255,255,150,${a})`); g.addColorStop(1, 'rgba(255,255,150,0)'); cx.fillStyle = g; cx.beginPath(); cx.arc(x, y, 9 * u, 0, 6.3); cx.fill(); } else if (p.c > 0.7) { cx.fillStyle = 'rgba(255,255,220,.35)'; cx.beginPath(); cx.arc(x, y, 2 * p.s * u, 0, 6.3); cx.fill(); } }
      else if (kind === 'autumn') { cx.save(); cx.translate(x, y); cx.rotate(p.r); cx.fillStyle = ['rgba(230,90,40,.9)', 'rgba(240,160,40,.9)', 'rgba(190,60,30,.9)'][Math.floor(p.c * 3)]; cx.beginPath(); cx.moveTo(0, -5 * p.s * u); cx.lineTo(3.5 * p.s * u, 0); cx.lineTo(0, 5 * p.s * u); cx.lineTo(-3.5 * p.s * u, 0); cx.closePath(); cx.fill(); cx.restore(); }
      else { cx.fillStyle = 'rgba(255,255,255,.88)'; cx.beginPath(); cx.arc(x, y, 1.6 * p.s * u, 0, 6.3); cx.fill(); }
    }
  };
  requestAnimationFrame(loop);
}

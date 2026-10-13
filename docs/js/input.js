// 入力統合: キーボード/マウス/タッチ(浮動仮想スティック+ボタン+カメラドラッグ)
export const input = { mx: 0, mz: 0, dash: false, action: false, camDX: 0, camDY: 0, zoom: 0, bag: false, quest: false, menu: false, tap: null };

const keys = new Set();
const joy = { x: 0, z: 0 };
let btnDashDown = false;

export function pollInput() {
  let x = joy.x, z = joy.z;
  if (keys.has('KeyA') || keys.has('ArrowLeft')) x -= 1;
  if (keys.has('KeyD') || keys.has('ArrowRight')) x += 1;
  if (keys.has('KeyW') || keys.has('ArrowUp')) z += 1;
  if (keys.has('KeyS') || keys.has('ArrowDown')) z -= 1;
  const l = Math.hypot(x, z); if (l > 1) { x /= l; z /= l; }
  input.mx = x; input.mz = z;
  input.dash = keys.has('ShiftLeft') || keys.has('ShiftRight') || btnDashDown;
}

export function setupInput(canvas, ui) {
  addEventListener('keydown', e => {
    if (e.repeat) return; keys.add(e.code);
    if (e.code === 'KeyE' || e.code === 'Space' || e.code === 'Enter') input.action = true;
    if (e.code === 'KeyQ' || e.code === 'KeyI') input.bag = true;
    if (e.code === 'KeyJ') input.quest = true;
    if (e.code === 'Escape') { if (ui.panelOpen()) ui.closePanel(); else input.menu = true; }
    if (e.code === 'KeyM') input.menu = true;
  });
  addEventListener('keyup', e => keys.delete(e.code));
  addEventListener('blur', () => keys.clear());

  // 仮想スティック(画面左側、触った位置に出る)
  const zone = document.getElementById('joyzone'), base = document.getElementById('joybase'), knob = document.getElementById('joyknob');
  let jid = null, cx = 0, cy = 0; const RAD = 58;
  let zt = null;   // 短いタップ(動いていない)を『画面タップ』として通知
  zone.addEventListener('pointerdown', e => { zt = { x: e.clientX, y: e.clientY, t: performance.now() }; });
  zone.addEventListener('pointerup', e => { if (zt && Math.hypot(e.clientX - zt.x, e.clientY - zt.y) < 8 && performance.now() - zt.t < 350) input.tap = { x: e.clientX, y: e.clientY }; zt = null; });
  zone.addEventListener('pointerdown', e => {
    if (jid !== null) return; jid = e.pointerId; zone.setPointerCapture(jid); cx = e.clientX; cy = e.clientY;
    base.style.left = cx + 'px'; base.style.top = cy + 'px'; base.classList.add('on'); knob.style.transform = 'translate(-50%,-50%)';
  });
  // 2本目の指(スティックを持ったまま)でカメラを回す
  let sid = null, slx = 0, sly = 0;
  zone.addEventListener('pointerdown', e => { if (jid !== null && e.pointerId !== jid && sid === null) { sid = e.pointerId; slx = e.clientX; sly = e.clientY; zone.setPointerCapture(sid); } });
  zone.addEventListener('pointermove', e => { if (e.pointerId === sid) { input.camDX += e.clientX - slx; input.camDY += e.clientY - sly; slx = e.clientX; sly = e.clientY; } });
  const send = e => { if (e.pointerId === sid) sid = null; };
  zone.addEventListener('pointerup', send); zone.addEventListener('pointercancel', send);
  zone.addEventListener('pointermove', e => {
    if (e.pointerId !== jid) return;
    let dx = e.clientX - cx, dy = e.clientY - cy; const l = Math.hypot(dx, dy);
    if (l > RAD) { dx = dx / l * RAD; dy = dy / l * RAD; }
    knob.style.transform = `translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px))`;
    const arrow = document.getElementById('joyarrow'); if (l > 8) { base.classList.add('moving'); arrow.style.transform = `rotate(${Math.atan2(dx, -dy) * 180 / Math.PI}deg)`; } else base.classList.remove('moving');
    const m = Math.min(1, l / RAD);
    if (m < 0.14) { joy.x = joy.z = 0; } else { const k = (m - 0.14) / 0.86 / (l || 1); joy.x = (e.clientX - cx) * k; joy.z = -(e.clientY - cy) * k; const jl = Math.hypot(joy.x, joy.z); if (jl > 1) { joy.x /= jl; joy.z /= jl; } }
  });
  const end = e => { if (e.pointerId !== jid) return; jid = null; joy.x = joy.z = 0; base.classList.remove('on', 'moving'); };
  zone.addEventListener('pointerup', end); zone.addEventListener('pointercancel', end);

  // カメラ(右側のドラッグ/マウスドラッグ)
  let cid = null, lx = 0, ly = 0, ct = null;
  canvas.addEventListener('pointerdown', e => { ct = { x: e.clientX, y: e.clientY, t: performance.now() }; if (cid !== null) return; cid = e.pointerId; canvas.setPointerCapture(cid); lx = e.clientX; ly = e.clientY; });
  canvas.addEventListener('pointermove', e => { if (e.pointerId !== cid) return; input.camDX += e.clientX - lx; input.camDY += e.clientY - ly; lx = e.clientX; ly = e.clientY; });
  const cend = e => { if (e.pointerId === cid) { cid = null; if (e.type === 'pointerup' && ct && Math.hypot(e.clientX - ct.x, e.clientY - ct.y) < 8 && performance.now() - ct.t < 350) input.tap = { x: e.clientX, y: e.clientY }; } };
  canvas.addEventListener('pointerup', cend); canvas.addEventListener('pointercancel', cend);
  canvas.addEventListener('wheel', e => { input.zoom += Math.sign(e.deltaY); e.preventDefault(); }, { passive: false });

  // ボタン
  const act = document.getElementById('btnAct'), dash = document.getElementById('btnDash');
  act.addEventListener('pointerdown', e => { e.preventDefault(); input.action = true; });
  dash.addEventListener('pointerdown', e => { e.preventDefault(); btnDashDown = true; dash.classList.add('on'); dash.setPointerCapture(e.pointerId); });
  const dup = () => { btnDashDown = false; dash.classList.remove('on'); };
  dash.addEventListener('pointerup', dup); dash.addEventListener('pointercancel', dup);
  document.getElementById('btnMenu').addEventListener('click', () => { input.menu = true; });
  document.getElementById('btnQuest').addEventListener('click', () => { input.quest = true; });
  addEventListener('contextmenu', e => e.preventDefault());
}

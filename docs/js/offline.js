// オフライン(つうしんりょう へらす) 用: Service Worker の とうろくと、「ぜんぶ ほぞん」ボタン
const TEST = /[?&]sw=1/.test(location.search);
const LOCAL = /^(localhost|127\.|192\.168\.|10\.)/.test(location.hostname) && !TEST;
const mb = (b) => (b / 1048576 >= 10 ? Math.round(b / 1048576) : (b / 1048576).toFixed(1)) + 'MB';
if ('serviceWorker' in navigator && !LOCAL && (TEST || !/[?&]shot=/.test(location.search))) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
  const box = () => document.getElementById('offlineBox');
  const sw = async () => { const r = await navigator.serviceWorker.ready; return r.active || navigator.serviceWorker.controller; };
  const mount = () => {
    const tb = document.querySelector('#title .tbox'); if (!tb || box()) return;
    const d = document.createElement('div'); d.id = 'offlineBox'; d.style.cssText = 'margin-top:14px;text-align:center;font-size:12px;color:#f3e6cc;opacity:.92';
    d.innerHTML = '<button id="offBtn" hidden style="font:inherit;font-size:12px;padding:7px 14px;border-radius:999px;border:1px solid #d9c08a;background:rgba(0,0,0,.25);color:#f3e6cc">オフライン用に ぜんぶ ほぞん</button><div id="offMsg" style="margin-top:6px;min-height:1.2em"></div>';
    tb.appendChild(d);
    d.querySelector('#offBtn').onclick = async () => {
      if (!confirm('ゲームの そざいを ぜんぶ たんまつに ほぞんします(約145MB)。\nWi-Fiに つないでから おすのが おすすめだよ。はじめますか?')) return;
      try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch (e) {}
      d.querySelector('#offBtn').disabled = true; d.querySelector('#offMsg').textContent = 'じゅんびちゅう...';
      (await sw()).postMessage({ type: 'precache' });
    };
    sw().then(s => s && s.postMessage({ type: 'status' }));
  };
  navigator.serviceWorker.addEventListener('message', (e) => {
    const m = e.data || {}, t = document.getElementById('offMsg'), b = document.getElementById('offBtn');
    if (m.type === 'progress' && t) t.textContent = `ほぞんちゅう ${Math.round(m.bytes / Math.max(1, m.totalBytes) * 100)}% (${mb(m.bytes)} / ${mb(m.totalBytes)})`;
    else if (m.type === 'done' && t) { t.textContent = 'ほぞん できたよ! つうしんなしでも あそべるよ'; if (b) b.hidden = true; }
    else if (m.type === 'status' && t) { if (m.full) { t.textContent = 'ほぞんずみ(つうしんなしでも あそべるよ)'; if (b) b.hidden = true; } else if (b) b.hidden = false; }
    else if (m.type === 'error' && t) { t.textContent = 'ほぞんできなかったよ。もういちど おしてね'; if (b) { b.disabled = false; b.hidden = false; } }
    else if (m.type === 'updated') {   // あたらしい ばんを うけとった
      const title = document.getElementById('title');
      if (title && !title.classList.contains('gone')) location.reload();
      else { const d = document.createElement('div'); d.textContent = 'あたらしい ばんを うけとったよ。つぎに ひらくとき こうしんされるよ'; d.style.cssText = 'position:fixed;left:50%;bottom:14px;transform:translateX(-50%);background:rgba(44,31,20,.92);color:#f3e6cc;padding:8px 14px;border-radius:999px;font-size:12px;z-index:99;pointer-events:none'; document.body.appendChild(d); setTimeout(() => d.remove(), 5000); }
    }
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
}

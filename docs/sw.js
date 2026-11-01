/* もふもふ牧場 オフライン用 Service Worker
   - 一度 ひらいた ファイルは たんまつに のこして、つぎからは つうしんしない(キャッシュ優先)
   - 「ぜんぶ ほぞん」を おすと、ぜんぶの そざいを まとめて ほぞん(files.json の いちらんを つかう)
   - あたらしい ばんが でたら、かわった ファイルだけ ダウンロード(ハッシュで くらべる) */
const VER = '202611011259';
const CACHE = 'mofumofu-files';
const META = 'mofumofu-meta';
const BASE = new URL('./', self.location).pathname;
let MAN = null, HASH = null, saveT = 0;

const keyOf = (u) => { let p = u.pathname; if (!p.startsWith(BASE)) return null; p = decodeURIComponent(p.slice(BASE.length)); return p === '' ? 'index.html' : p; };
const urlOf = (k) => BASE + k.split('/').map(encodeURIComponent).join('/');
async function metaGet(name) { try { const c = await caches.open(META), r = await c.match(name); return r ? await r.json() : null; } catch (e) { return null; } }
async function metaPut(name, obj) { const c = await caches.open(META); await c.put(name, new Response(JSON.stringify(obj), { headers: { 'content-type': 'application/json' } })); }
async function manifest() { if (!MAN) MAN = await metaGet('manifest'); return MAN; }
async function hashes() { if (!HASH) HASH = (await metaGet('hashes')) || {}; return HASH; }
function saveHashesSoon() { clearTimeout(saveT); saveT = setTimeout(async () => { if (HASH) await metaPut('hashes', HASH); }, 1500); }
async function say(msg) { for (const c of await self.clients.matchAll({ includeUncontrolled: true })) c.postMessage(msg); }

async function fetchPut(k, h) {
  const r = await fetch(urlOf(k), { cache: 'no-cache' });
  if (!r.ok) throw new Error(k + ' ' + r.status);
  await (await caches.open(CACHE)).put(urlOf(k), r.clone());
  (await hashes())[k] = h; saveHashesSoon(); return r;
}
async function pool(items, n, fn) {
  let i = 0;
  await Promise.all(Array.from({ length: n }, async () => { while (i < items.length) { const it = items[i++]; try { await fn(it); } catch (e) {} } }));
}

// 一ばん あたらしい いちらんを とって、かわった ぶんだけ こうしん。all=true なら ぜんぶ ほぞん
async function sync(all, report) {
  let man;
  try { const r = await fetch(BASE + 'files.json', { cache: 'no-cache' }); if (!r.ok) return 0; man = await r.json(); } catch (e) { return 0; }
  await metaPut('manifest', man); MAN = man;
  const H = await hashes(), cache = await caches.open(CACHE), files = man.files, have = new Set((await cache.keys()).map(q => keyOf(new URL(q.url))));
  const todo = Object.keys(files).filter(k => (all || have.has(k)) && (!have.has(k) || H[k] !== files[k][0]));
  for (const k of have) if (k && !files[k]) { await cache.delete(urlOf(k)); delete H[k]; }
  const totalBytes = todo.reduce((a, k) => a + files[k][1], 0); let done = 0, bytes = 0, changed = 0;
  await pool(todo, 4, async (k) => {
    await fetchPut(k, files[k][0]); done++; bytes += files[k][1]; changed++;
    if (report && (done % 5 === 0 || done === todo.length)) say({ type: 'progress', done, total: todo.length, bytes, totalBytes });
  });
  if (all) await metaPut('full', { v: man.v, at: Date.now() });
  await metaPut('hashes', H); return changed;
}

self.addEventListener('install', () => { self.skipWaiting(); });
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => { await self.clients.claim(); const full = await metaGet('full'); const n = await sync(!!full, false); if (n) say({ type: 'updated', n }); })());
});
self.addEventListener('message', (e) => {
  const d = e.data || {};
  if (d.type === 'precache') e.waitUntil((async () => { try { await sync(true, true); say({ type: 'done' }); } catch (err) { say({ type: 'error', msg: String(err) }); } })());
  if (d.type === 'status') e.waitUntil((async () => {
    const f = await metaGet('full'), m = await metaGet('manifest');
    say({ type: 'status', full: !!f, ver: VER, files: m ? Object.keys(m.files).length : 0, bytes: m ? Object.values(m.files).reduce((a, v) => a + v[1], 0) : 0 });
  })());
});
self.addEventListener('fetch', (e) => {
  const req = e.request; if (req.method !== 'GET') return;
  const u = new URL(req.url);
  if (u.origin === self.location.origin) {
    let k = keyOf(u); if (k === null || k === 'sw.js' || k === 'files.json') return;
    if (u.pathname.endsWith('/')) k = 'index.html';
    e.respondWith((async () => {
      const cache = await caches.open(CACHE), hit = await cache.match(urlOf(k));
      if (hit) return hit;
      try {
        const r = await fetch(req);
        if (r.ok && r.status === 200) { const m = await manifest(); if (!m || m.files[k]) { cache.put(urlOf(k), r.clone()); if (m) { (await hashes())[k] = m.files[k][0]; saveHashesSoon(); } } }
        return r;
      } catch (err) { if (req.mode === 'navigate') { const i = await cache.match(urlOf('index.html')); if (i) return i; } throw err; }
    })());
  } else if (/fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)) {   // Google Fonts: よんだら のこす
    e.respondWith((async () => {
      const cache = await caches.open('mofumofu-fonts'), hit = await cache.match(req);
      const net = fetch(req).then(r => { if (r.ok || r.type === 'opaque') cache.put(req, r.clone()); return r; }).catch(() => hit);
      return hit || net;
    })());
  }
});

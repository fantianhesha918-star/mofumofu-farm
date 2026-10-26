"""ボードゲームアプリ -> docs/casino/ へゲームを取り込む(元アプリは変更しない)。
使い方: python tools/build_casino.py
- pwa.js / online.js / マニフェストを外し、戻るリンク・オンライン対戦を隠す
- stats.js を差し替え、BGStats.record の結果(勝ち/負け/順位/クリア)を親ページへ postMessage
- 橋渡しの受け取り側は docs/js/casino.js
ボードゲームアプリ側でゲームを直したら、このスクリプトを再実行して取り込み直す。
"""
import re, shutil, os

SRC = os.path.expanduser('~/OneDrive/Desktop/クロードコード/アプリ/ボードゲームアプリ/docs')
DST = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'docs', 'casino')
PAGES = {'babanuki': 'babanuki.html', 'daifugo': 'daifugo.html', 'sevens': 'sevens.html',
         'solitaire': 'solitaire.html', 'memory': 'memory.html', 'othello': 'index.html'}

os.makedirs(DST, exist_ok=True)
for d in ('cards', 'othello'):
    shutil.copytree(os.path.join(SRC, 'assets', d), os.path.join(DST, 'assets', d), dirs_exist_ok=True)

# stats.js: record の結果を親ページへ知らせる
st = open(os.path.join(SRC, 'stats.js'), encoding='utf-8').read()
old = """  function record(game, patchFn){
    const d = load();
    const cur = d[game] || {};
    patchFn(cur);
    d[game] = cur;
    save(d);
    return cur;
  }"""
new = """  function record(game, patchFn){
    const d = load();
    const cur = d[game] || {};
    const before = JSON.parse(JSON.stringify(cur));
    patchFn(cur);
    d[game] = cur;
    save(d);
    // ---- カジノ橋渡し: 増えた項目から結果を決めて親(ちんちら牧場)へ ----
    const up = k => (cur[k] || 0) > (before[k] || 0);
    let result = null, place = 0;
    if (cur.ranks) for (const p in cur.ranks) if ((cur.ranks[p] || 0) > ((before.ranks || {})[p] || 0)) { result = 'place'; place = +p; }
    if (!result) result = up('clears') ? 'clear' : up('wins') ? 'win' : up('draws') ? 'draw' : up('losses') ? 'lose' : null;
    if (result) { try { parent.postMessage({ casino: 1, game: game, result: result, place: place }, '*'); } catch (e) {} }
    return cur;
  }"""
assert old in st
open(os.path.join(DST, 'stats.js'), 'w', encoding='utf-8').write(st.replace(old, new))

EXTRA = """
<style>
a.back-btn, [data-to="home"], a[href="index.html"], a[href="trump.html"], a[href^="rules.html"], a.rules-link, [data-val="online"], #fieldOnline, #onlineCreate { display:none !important; }
#casinoClose{ position:fixed; right:10px; top:max(8px, env(safe-area-inset-top)); z-index:9999; padding:6px 14px; border-radius:16px; border:1px solid #fff6; background:#000a; color:#fff; font-size:14px; }
</style>
<button id="casinoClose" type="button">カジノにもどる</button>
<script>
document.getElementById('casinoClose').onclick = function(){ try{ parent.postMessage({ casino: 1, close: 1 }, '*'); }catch(e){} };
%s
</script>
"""
for key, fn in PAGES.items():
    h = open(os.path.join(SRC, fn), encoding='utf-8').read()
    h = re.sub(r'<script[^>]*src="pwa\.js"[^>]*></script>\s*', '', h)
    h = re.sub(r'<script[^>]*src="online\.js"[^>]*></script>\s*', '', h)
    h = re.sub(r'<link[^>]*rel="manifest"[^>]*>\s*', '', h)
    h = re.sub(r'<link[^>]*rel="(apple-touch-icon|icon)"[^>]*>\s*', '', h)
    auto = "document.querySelector('[data-game=\"othello\"]').click(); document.querySelectorAll('#othelloSetup [data-val=\"cpu\"]').forEach(function(b){ b.click(); });" if key == 'othello' else ''
    h = h.replace('</body>', EXTRA % auto + '</body>')
    open(os.path.join(DST, key + '.html'), 'w', encoding='utf-8').write(h)
    print('ok', key)

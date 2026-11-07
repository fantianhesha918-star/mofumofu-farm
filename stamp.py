"""公開前に実行: JS/CSSに バージョンを つけて、スマホの キャッシュ食いちがい(ファイルの 新旧まざり)を ふせぐ。
使い方: python stamp.py   (docs/index.html と docs/field.html を書きかえる)"""
import re, time, glob, os, json
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'docs')
V = time.strftime('%Y%m%d%H%M')
mods = sorted(os.path.basename(p) for p in glob.glob(os.path.join(D, 'js', '*.js')))
imports = {'three': './vendor/three.module.js', 'three/addons/': './vendor/addons/'}
for m in mods: imports['./js/' + m] = f'./js/{m}?v={V}'
im = '<script type="importmap">' + json.dumps({'imports': imports}, ensure_ascii=False, separators=(',', ':')) + '</script>'
for page, entry in (('index.html', 'game.js'), ('field.html', 'field.js'), ('gym.html', 'gym.js')):
    p = os.path.join(D, page); s = open(p, encoding='utf-8').read()
    s, n1 = re.subn(r'<script type="importmap">.*?</script>', lambda m: im, s, count=1, flags=re.S)
    s, n2 = re.subn(r'src="js/%s[^"]*"' % re.escape(entry), f'src="js/{entry}?v={V}"', s, count=1)
    s, n3 = re.subn(r'href="style\.css[^"]*"', f'href="style.css?v={V}"', s, count=1)
    open(p, 'w', encoding='utf-8').write(s); print(page, n1, n2, n3)
print('version', V)
# ---- オフライン用: ファイルの いちらん(files.json)と、sw.js の ばんごうを こうしん ----
import hashlib
files = {}
for root, dirs, fs in os.walk(D):
    dirs[:] = [d for d in dirs if d != 'dev']
    for f in fs:
        rel = os.path.relpath(os.path.join(root, f), D).replace(os.sep, '/')
        if rel in ('sw.js', 'files.json'): continue
        b = open(os.path.join(root, f), 'rb').read(); files[rel] = [hashlib.md5(b).hexdigest()[:10], len(b)]
json.dump({'v': V, 'files': files}, open(os.path.join(D, 'files.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
sw = os.path.join(D, 'sw.js'); t = open(sw, encoding='utf-8').read(); t = re.sub(r"const VER = '[^']*';", f"const VER = '{V}';", t, count=1); open(sw, 'w', encoding='utf-8').write(t)
print('files.json', len(files), 'files', sum(v[1] for v in files.values()) // 1048576, 'MB')

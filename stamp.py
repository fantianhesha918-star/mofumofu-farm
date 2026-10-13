"""公開前に実行: JS/CSSに バージョンを つけて、スマホの キャッシュ食いちがい(ファイルの 新旧まざり)を ふせぐ。
使い方: python stamp.py   (docs/index.html と docs/field.html を書きかえる)"""
import re, time, glob, os, json
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'docs')
V = time.strftime('%Y%m%d%H%M')
mods = sorted(os.path.basename(p) for p in glob.glob(os.path.join(D, 'js', '*.js')))
imports = {'three': './vendor/three.module.js', 'three/addons/': './vendor/addons/'}
for m in mods: imports['./js/' + m] = f'./js/{m}?v={V}'
im = '<script type="importmap">' + json.dumps({'imports': imports}, ensure_ascii=False, separators=(',', ':')) + '</script>'
for page, entry in (('index.html', 'game.js'), ('field.html', 'field.js')):
    p = os.path.join(D, page); s = open(p, encoding='utf-8').read()
    s, n1 = re.subn(r'<script type="importmap">.*?</script>', lambda m: im, s, count=1, flags=re.S)
    s, n2 = re.subn(r'src="js/%s[^"]*"' % re.escape(entry), f'src="js/{entry}?v={V}"', s, count=1)
    s, n3 = re.subn(r'href="style\.css[^"]*"', f'href="style.css?v={V}"', s, count=1)
    open(p, 'w', encoding='utf-8').write(s); print(page, n1, n2, n3)
print('version', V)

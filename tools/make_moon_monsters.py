"""「月」シリーズのモンスター150体: moon_dex.py の表から
  1) docs/js/monsters_moon.js  (データ。絵(docs/quest/assets/monsters/<id>.webp)が ある子だけ ゲームに 登録される)
  2) 月シリーズモンスター案.md (一覧 + Gemini用プロンプト)
を 作る。絵を 置いたら もう一度 実行すると 出てくる子が ふえる。
使い方: python tools/make_moon_monsters.py
"""
import os, json, sys
sys.path.insert(0, os.path.dirname(__file__))
from moon_dex import LINES

ROOT = os.path.join(os.path.dirname(__file__), '..')
IMG = os.path.join(ROOT, 'docs', 'quest', 'assets', 'monsters')
ARCH = {'b': (1, 1, 1, 1), 't': (1.25, 0.9, 1.25, 0.85), 'a': (0.9, 1.25, 0.9, 1.0), 'f': (0.9, 1.0, 0.85, 1.3)}
EL_JA = {'tsuki': 'つき', 'hoshi': 'ほし', 'yume': 'ゆめ', 'shio': 'しお', 'shimo': 'しも', 'kage': 'かげ', 'yoru': 'よる'}
EL_LOOK = {'tsuki': '月光の黄色と乳白色', 'hoshi': '星の金色と夜空の藍色', 'yume': '淡い紫とパステルピンク', 'shio': '海の青と泡の白', 'shimo': '氷の水色と霜の白', 'kage': '濃い紺と紫の影', 'yoru': '夜の紺とあたたかい茶色'}


def has_img(i):
    return os.path.exists(os.path.join(IMG, i + '.webp'))


def stats(lv, arch):
    hp = (22 + 3.3 * lv) * ARCH[arch][0]; atk = (8 + 1.0 * lv) * ARCH[arch][1]; df = (4 + 0.62 * lv) * ARCH[arch][2]; spd = (10 + 0.3 * lv) * ARCH[arch][3]
    return [round(hp), round(atk), round(df), round(spd)]


mons = []   # {id,name,el,lv,hp,atk,def,spd,stage,line,evo,area,note}
for key, el, area, arch, names, note in LINES:
    lv1 = min(26, 2 + 2 * area); lvs = [lv1, lv1 + 10, lv1 + 22]
    ids = [key, key + '_2', key + '_3']; branch = len(names) == 4
    rows = [(ids[0], names[0], 0, lvs[0]), (ids[1], names[1], 1, lvs[1]), (ids[2], names[2], 2, lvs[2])]
    if branch: rows.append((key + '_3n', names[3], 2, lvs[2]))
    for i, n, st, lv in rows:
        h, a, d, s = stats(lv, arch)
        if i.endswith('_3n'): a = round(a * 1.1); d = round(d * 0.9)
        m = dict(id=i, name=n, el=el, lv=lv, hp=h, atk=a, df=d, spd=s, stage=st, line=key, area=area, note=note, branch=branch)
        if st == 0: m['evo'] = [lvs[1], ids[1]]
        elif st == 1: m['evo'] = [lvs[2], ids[2]] + ([key + '_3n'] if branch else [])
        mons.append(m)

ready = {m['id'] for m in mons if has_img(m['id'])}
out = ['// tools/make_moon_monsters.py が つくった「月」シリーズの モンスター(うで で かきなおさない)', '// 絵(quest/assets/monsters/<id>.webp)が ある子だけ ゲームに とうろくされる', 'const up = (v, k) => Math.round(v * k);',
       'const M = (id, name, element, level, hp0, atk0, def0, spd0, evo) => ({ id, name, element, level, hp: up(hp0, 1.3), atk: up(atk0, 1.2), def: up(def0, 1.3), spd: up(spd0, 1.1), exp: level * 5, money: Math.round(level * 3.3), skillIds: [\'tackle\'], image: `assets/monsters/${id}.webp`, ...(evo ? { evolvesTo: evo } : {}) });',
       'export const MOON_DEX = [']
for m in mons:
    evo = 'null'
    if 'evo' in m:
        lv, nid = m['evo'][0], m['evo'][1]
        if len(m['evo']) == 3:
            nn = m['evo'][2]; full = nid if nid in ready else None; nw = nn if nn in ready else nid
            evo = '{ level: %d, id: %s, moon: { full: %s, new: %s } }' % (lv, json.dumps(nid), json.dumps(nid), json.dumps(nw))
        else:
            evo = '{ level: %d, id: %s }' % (lv, json.dumps(nid))
    out.append('  [%s, M(%s, %s, %s, %d, %d, %d, %d, %d, %s)],' % (json.dumps(m['id' ] in ready), json.dumps(m['id']), json.dumps(m['name'], ensure_ascii=False), json.dumps(m['el']), m['lv'], round(m['hp'] / 1.3), round(m['atk'] / 1.2), round(m['df'] / 1.3), round(m['spd'] / 1.1), evo))
out.append('];')
out.append('export const MOON_MONS = MOON_DEX.filter(([ok]) => ok).map(([, m]) => m);')
# やせい: 1だんめ=area..area+2 / 2だんめ=area+2..area+5 / 3だんめ=area+5..12
wild = {a: [] for a in range(1, 13)}
for m in mons:
    ar = m['area']; lo, hi, w = ((ar, ar + 2, 3), (ar + 2, ar + 5, 2), (ar + 5, 12, 1))[m['stage']]
    if m['id'] not in ready: continue
    for a in range(lo, min(12, hi) + 1): wild[a].append([m['id'], w])
FK = ['forest', 'lake', 'volcano', 'ghost', 'sky', 'sun', 'cosmos', 'grove', 'castle', 'temple', 'dragon', 'end']
out.append('export const MOON_WILD = ' + json.dumps({FK[a - 1]: wild[a] for a in wild}, ensure_ascii=False) + ';')
open(os.path.join(ROOT, 'docs', 'js', 'monsters_moon.js'), 'w', encoding='utf-8').write('\n'.join(out) + '\n')

# あんない
md = ['# 「月」シリーズ モンスター150体(案)', '', '更新: python tools/make_moon_monsters.py(絵を `docs/quest/assets/monsters/<id>.webp` に置いてから実行)。絵がある子だけゲームに出る。', '', f'現在ゲームに登録されている数: {len(ready)} / {len(mons)}', '',
      '## Geminiで作るときの共通指示(わかばちんちら風)', '',
      '- 手描き水彩風・やさしい線・白背景・単体・正面やや斜め・かわいい頭身(2〜3頭身)。ぬるっとしたCG感は避ける。進化後は「強くかっこよく」か「かわいさ維持」のどちらかに振り切る(ひとつの系統の中でも1段階ごとに変化を大きく)',
      '- 出力: 透過または白背景のPNG/WebP、縦長(約3:4)。ファイル名は下表のid.webp', '- 属性の雰囲気色(参考): ' + ' / '.join(f'{EL_JA[k]}={v}' for k, v in EL_LOOK.items()), '',
      '## 一覧(出る場所の番号 1=つきみのはら 2=かがみのみずうみ 3=あかつきのかざん 4=かげぼうしのはか 5=くものうえのたかだい 6=ほしすなのさばく 7=ほしのうみべ 8=ほたるのもり 9=かげのしろ 10=つきのしんでん 11=とけいとうのまち 12=ほしうみのおわり)', '',
      '| id | 名前 | 属性 | 段階 | Lv | 出る場所 | 絵 |', '|---|---|---|---|---|---|---|']
for m in mons:
    stn = ['1', '2', '3(満月系)' if m['branch'] else '3', '3(新月系)'][m['stage'] + (1 if m['id'].endswith('_3n') else 0)]
    md.append(f"| {m['id']} | {m['name']} | {EL_JA[m['el']]} | {stn} | {m['lv']} | {m['area']} | {'○' if m['id'] in ready else ''} |")
md += ['', '## Geminiプロンプト(コピペ用)', '']
for key, el, area, arch, names, note in LINES:
    md.append(f'### {names[0]}の系統({EL_JA[el]}属性)')
    md.append(f'系統メモ: {note}')
    for k, n in enumerate(names):
        sid = [key, key + '_2', key + '_3', key + '_3n'][k]
        stage = ['1段階目(幼い・小さい)', '2段階目', '3段階目(最終)' if len(names) == 3 else '3段階目(満月系・最終)', '3段階目(新月系・最終。満月系と見た目を大きく変える)'][k]
        md.append(f'- `{sid}` {n}: 「{note}」を元に、{stage}の姿。{EL_JA[el]}属性の雰囲気({EL_LOOK[el]})。手描き水彩風、白背景、単体。')
    md.append('')
open(os.path.join(ROOT, '月シリーズモンスター案.md'), 'w', encoding='utf-8').write('\n'.join(md))
print('monsters', len(mons), 'ready', len(ready))

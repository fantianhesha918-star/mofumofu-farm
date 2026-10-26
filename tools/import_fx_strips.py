"""Geminiの 4コマ横長エフェクトを、ゲーム用の コマ(anim/<名前>/f1〜f4.webp, 384x384 RGB)に 切り分ける。
使い方: python tools/import_fx_strips.py  (下の JOBS の 元ファイル→名前 を直して 実行)
- 白い枠・つなぎ目を はぶき、黒背景は 黒を しめて(screen合成で もやが のらないように)、白背景(じわれ)は 白を しめる(multiply用)。
"""
import os, sys, numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', 'docs', 'quest', 'assets', 'effects', 'anim')
SRC = os.path.expanduser('~/OneDrive/Desktop/クロードコード/クロコ確認フォルダ')
ARC = os.path.join(HERE, '..', '素材', 'わざエフェクト', 'Gemini原本')

# (元ファイル(部分一致できる末尾), 名前, 背景 'black'|'white')
JOBS = [('jzcei6jzce', 'kami_2', 'black')]

def trim_white_edges(a):
    """黒背景の コマの まわりに ついた 白い枠・線を はぶく(外側から 白っぽい列/行を けずる)"""
    h, w = a.shape
    l, r, t, b = 0, w, 0, h
    def white_col(x): return (a[t:b, x] > 200).mean() > 0.7
    def white_row(y): return (a[y, l:r] > 200).mean() > 0.7
    for _ in range(60):
        ch = False
        if l < r - 40 and white_col(l): l += 1; ch = True
        if r > l + 40 and white_col(r - 1): r -= 1; ch = True
        if t < b - 40 and white_row(t): t += 1; ch = True
        if b > t + 40 and white_row(b - 1): b -= 1; ch = True
        if not ch: break
    return l + 3, r - 3, t + 3, b - 3

def trim_dark_edges(a):
    """白背景の コマに ついた 黒・灰色の 枠線を はぶく"""
    h, w = a.shape; l, r, t, b = 0, w, 0, h
    for _ in range(80):
        ch = False
        if l < r - 40 and (a[t:b, l] < 190).mean() > 0.5: l += 1; ch = True
        if r > l + 40 and (a[t:b, r - 1] < 190).mean() > 0.5: r -= 1; ch = True
        if t < b - 40 and (a[t, l:r] < 190).mean() > 0.5: t += 1; ch = True
        if b > t + 40 and (a[b - 1, l:r] < 190).mean() > 0.5: b -= 1; ch = True
        if not ch: break
    return l + 3, r - 3, t + 3, b - 3

def process(path, name, bg):
    opt = ''
    if ':' in bg: bg, opt = bg.split(':')
    im = Image.open(path).convert('RGB'); W, H = im.size; fw = W / 4
    os.makedirs(os.path.join(OUT, name), exist_ok=True)
    for k in range(4):
        fr = im.crop((round(k * fw), 0, round((k + 1) * fw), H))
        if opt.startswith('inset'):   # ふちの ごみ・枠線を ふち N% ぶん けずる
            n = float(opt[5:]) / 100; fr = fr.crop((int(fr.width * n), int(fr.height * n), int(fr.width * (1 - n)), int(fr.height * (1 - n))))
        if bg == 'black':
            g = np.asarray(fr.convert('L')).astype(int)
            l, r, t, b = trim_white_edges(g); fr = fr.crop((l, t, r, b))
            arr = np.asarray(fr).astype(float)
            arr = np.clip((arr - 10) * 255 / 245, 0, 255)   # 黒を しめる
            if opt == 'defog':   # 中央に のこった 白いもやの かたまりを けす(小さい 星は のこす)
                from PIL import ImageFilter
                bl = np.asarray(Image.fromarray(arr.astype('uint8')).filter(ImageFilter.GaussianBlur(min(arr.shape[:2]) * 0.06))).astype(float)
                arr = np.clip((arr - bl * 0.9 - 70) * 2.2, 0, 255)   # なだらかな もやだけ ひく(星の ふちは のこる)
            if opt == 'num':   # コマの ひだりうえに 焼きこまれた ①②③④ を ぼかしながら けす
                hh, ww = arr.shape[:2]; yy = np.arange(hh)[:, None] / hh; xx = np.arange(ww)[None, :] / ww
                arr = arr * np.clip(np.maximum((xx - 0.13) / 0.06, (yy - 0.15) / 0.06), 0, 1)[:, :, None]
            if opt == 'mask_bottom': arr[int(arr.shape[0] * 0.84):] = 0   # 画面の したに 焼きこまれた 文字を 黒で かくす
            hh, ww = arr.shape[:2]; fe = max(6, int(min(hh, ww) * 0.06))   # ふちを なめらかに ぼかして、四角い きれめを けす(screen合成で 目立たない)
            my = np.minimum(np.arange(hh), np.arange(hh)[::-1]); mx = np.minimum(np.arange(ww), np.arange(ww)[::-1])
            m = np.clip(np.minimum(my[:, None], mx[None, :]) / fe, 0, 1); arr = arr * m[:, :, None]
        else:
            l, r, t, b = trim_dark_edges(np.asarray(fr.convert('L')).astype(int)); fr = fr.crop((l, t, r, b))
            arr = np.asarray(fr).astype(float)
            arr = np.clip(arr * 255 / 243, 0, 255)   # 白を しめる
        fr = Image.fromarray(arr.astype('uint8'))
        # 正方形に: 長い辺に あわせて ふちを 背景色で うめる
        s = max(fr.size); canvas = Image.new('RGB', (s, s), (0, 0, 0) if bg == 'black' else (255, 255, 255)); canvas.paste(fr, ((s - fr.width) // 2, (s - fr.height) // 2))
        canvas.resize((384, 384), Image.LANCZOS).save(os.path.join(OUT, name, f'f{k + 1}.webp'), quality=88)
    print('ok', name)

if __name__ == '__main__':
    for suffix, name, bg in JOBS:
        cand = [f for f in os.listdir(SRC) if f.endswith(suffix + '.jpg')]
        if cand:
            p = os.path.join(SRC, cand[0]); process(p, name, bg)
            os.makedirs(ARC, exist_ok=True); os.replace(p, os.path.join(ARC, name + '.jpg'))
        elif os.path.exists(os.path.join(ARC, name + '.jpg')): process(os.path.join(ARC, name + '.jpg'), name, bg)   # すでに 原本へ しまってある 場合は そこから やりなおし
        else: print('skip', name)   # 原本は 素材/わざエフェクト/Gemini原本 へ(ゴミ箱ではなく 保管)

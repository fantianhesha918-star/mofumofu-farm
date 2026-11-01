"""フィールドの かざりを Blender で つくりなおす(ていねいな ばん)。
使い方: blender -b -P tools/make_deco_hq.py -- 出力フォルダ(docs/assets) [なまえ ...]   なまえを わたすと それだけ つくる
"""
import bpy, sys, math, random, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import blib as B
from blib import rbox, cyl, sph, rock, tube, leaf, start, build

args = sys.argv[sys.argv.index('--') + 1:]; OUT = args[0]; ONLY = set(args[1:])
STONE, STONE2, MOSS, GRASS = '#a39b8a', '#b8b09e', '#59803a', '#6a9a3c'
def want(n): return not ONLY or n in ONLY

# ---------------- いせきの アーチ ----------------
def ruin_arch():
    random.seed(3); start(OUT)
    rbox(5.0, 1.8, 0.3, 0, 0, 0.15, '#8f897a', 0.05, jit=0.015, moss=(MOSS, 0.3))                 # どだい
    for sx, h in ((-1.6, 3.4), (1.6, 2.3)):
        rbox(1.0, 1.0, 0.3, sx, 0, 0.45, '#9a9384', 0.04, jit=0.01, moss=(MOSS, 0.5))              # ざせき
        for k in range(int(h / 0.55)):                                                              # ブロックを つむ
            rbox(0.78 + random.uniform(-0.03, 0.03), 0.78, 0.54, sx + random.uniform(-0.02, 0.02), random.uniform(-0.02, 0.02), 0.75 + k * 0.56, STONE if k % 2 else STONE2, 0.035, jit=0.012, moss=(MOSS, 1.1), noise_amt=0.14)
        rbox(1.0, 1.0, 0.22, sx, 0, 0.75 + int(h / 0.55) * 0.56, '#c1baa8', 0.04, jit=0.01)         # はしらがしら
    rbox(4.3, 0.85, 0.7, -0.15, 0, 4.3, '#bfb8a6', 0.05, rot=(0, 0.035, 0), jit=0.012, moss=(MOSS, 0.4))   # よこの はり
    rbox(1.3, 0.8, 0.6, 1.65, 0.05, 4.95, '#b6af9d', 0.05, rot=(0.1, 0.0, 0.4), jit=0.02)          # ずれた いし
    rbox(0.9, 0.8, 0.5, 1.9, 1.4, 0.3, STONE, 0.05, rot=(0.2, 0.3, 0.6), jit=0.02, moss=(MOSS, 0.6))  # おちた ブロック
    rbox(0.7, 0.6, 0.4, 2.7, 0.9, 0.2, STONE2, 0.05, rot=(0.1, -0.2, 0.2), jit=0.02, moss=(MOSS, 0.5))
    for i in range(10):
        rock(random.uniform(0.1, 0.22), random.uniform(-2.2, 2.6), random.uniform(-0.9, 1.5), 0.05, '#8a8476', (1, 1, 0.7), sub=2, seed=i)
    for sx in (-1.6, 1.6):                                                                          # つる(ツタ)
        for k in range(3):
            a = random.uniform(0, 6.28); x0, y0 = sx + math.cos(a) * 0.46, math.sin(a) * 0.46
            pts = [(x0 + random.uniform(-.05, .05), y0, 0.3 + t * 0.55 + random.uniform(-.03, .03)) for t in range(0, 7)]
            tube(pts, 0.025, 0.012, '#3f6a2a', seg=5)
            for j in range(0, 7, 2): leaf(0.28, 0.2, pts[j][0], pts[j][1], pts[j][2], GRASS, rot=(0.4, 0, a), bend=0.3)
    for sx, sz in ((-1.6, 4.65), (-0.8, 4.65), (1.0, 4.65)):                                         # うえの くさ
        sph(0.4, sx, 0, sz, MOSS, (1.5, 1.0, 0.45))
    build('deco_ruin_arch')

# ---------------- おれた はしら ----------------
def pillar_broken():
    random.seed(5); start(OUT)
    rbox(1.7, 1.7, 0.25, 0, 0, 0.125, '#9d9686', 0.05, jit=0.012, moss=(MOSS, 0.3))                  # どだい
    cyl(0.78, 0.35, 0, 0, 0.43, '#b4ad9b', 20, moss=(MOSS, 0.5))                                      # かだい
    cyl(0.64, 2.0, 0, 0, 1.6, '#bfb8a6', 24, moss=(MOSS, 1.0))                                        # はしら
    for k in range(12):                                                                                # みぞ(フルート)
        a = k / 12 * 6.283; rbox(0.05, 0.05, 1.9, math.cos(a) * 0.645, math.sin(a) * 0.645, 1.6, '#9d9686', 0.01, rot=(0, 0, a), noise_amt=0.05)
    for k in range(7):                                                                                      # おれた さき(ギザギザ)
        a = k / 7 * 6.283 + 0.3; h = 0.15 + (k * 37 % 10) / 10 * 0.5
        rbox(0.34, 0.3, h + 0.5, math.cos(a) * 0.4, math.sin(a) * 0.4, 2.6 + (h + 0.5) / 2, '#c8c1af', 0.03, rot=(0, 0.12 * (k % 3 - 1), a), jit=0.03, moss=None)
    cyl(0.4, 0.5, 0, 0, 2.85, '#bfb8a6', 12)
    cyl(0.62, 0.85, 1.55, 0.55, 0.62, '#b9b2a0', 20, rot=(0, math.pi / 2, 0.3), moss=(MOSS, 0.8))      # ころがった ちゅうかん
    cyl(0.56, 0.55, 1.2, -1.15, 0.56, '#b0a999', 20, rot=(0.15, 0, 0), moss=(MOSS, 0.7))
    rbox(0.9, 0.7, 0.4, -1.25, 0.6, 0.2, '#a8a190', 0.05, rot=(0, 0, 0.5), jit=0.02, moss=(MOSS, 0.5))
    for i in range(9): rock(random.uniform(0.07, 0.18), random.uniform(-1.8, 2.4), random.uniform(-1.6, 1.4), 0.04, '#8f897a', (1, 1, 0.7), sub=2, seed=i)
    for x, y in ((0.7, 0.5), (-0.5, -0.7)):
        sph(0.35, x, y, 0.22, MOSS, (1.4, 1.0, 0.5))
        for k in range(5): leaf(0.35, 0.1, x + random.uniform(-.15, .15), y + random.uniform(-.15, .15), 0.2, GRASS, rot=(0.5, 0, random.uniform(0, 6.28)), bend=0.5)
    build('deco_pillar_broken')

# ---------------- はかいし ----------------
def tomb():
    random.seed(7); start(OUT)
    rbox(1.7, 1.2, 0.18, 0, 0, 0.09, '#6d6d75', 0.04, jit=0.01, moss=(MOSS, 0.2))
    rbox(1.2, 0.4, 0.14, 0, -0.1, 0.25, '#74747c', 0.03, jit=0.008)
    rbox(1.0, 0.3, 1.0, 0, 0.1, 0.78, '#7d7d86', 0.05, jit=0.01, moss=(MOSS, 0.55))                  # ほんたい
    cyl(0.5, 0.3, 0, 0.1, 1.28, '#868690', 24, rot=(math.pi / 2, 0, 0), moss=None)                     # まるい うえ
    rbox(0.14, 0.05, 0.62, 0, -0.07, 0.85, '#585860', 0.01); rbox(0.44, 0.05, 0.14, 0, -0.07, 1.0, '#585860', 0.01)   # きざんだ じゅうじ
    for x in (-0.38, 0.38): rbox(0.1, 0.03, 0.02, x, -0.07, 0.6, '#5a5a62', 0)
    for x, c in ((-0.55, '#e8e0ff'), (0.55, '#ffe0a0'), (0.35, '#ff9ac0')):                              # おそなえの はな
        tube([(x, -0.5, 0.18), (x + 0.02, -0.5, 0.42)], 0.012, 0.01, '#4a7a30', seg=5)
        for k in range(5): sph(0.05, x + math.cos(k * 1.26) * 0.06, -0.5 + math.sin(k * 1.26) * 0.06, 0.45, c, seg=8, ring=6)
    for x, y in ((0.7, -0.2), (-0.75, 0.15), (0.3, 0.55)):                                              # くさ
        for k in range(7): leaf(0.35 + random.uniform(0, .15), 0.06, x, y, 0.1, '#5f8f38', rot=(0.55, 0, random.uniform(0, 6.28)), bend=0.5)
    rock(0.22, -0.9, -0.5, 0.1, '#8a8a90', (1.3, 1, 0.6), sub=2, seed=3)
    build('deco_tomb')

# ---------------- じゅうじかの はか ----------------
def cross():
    random.seed(9); start(OUT)
    rbox(1.5, 1.1, 0.2, 0, 0, 0.1, '#6d6d75', 0.04, jit=0.01, moss=(MOSS, 0.25))
    rbox(0.8, 0.7, 0.25, 0, 0, 0.32, '#77777f', 0.04, jit=0.01, moss=(MOSS, 0.4))
    rbox(0.3, 0.26, 1.5, 0, 0, 1.25, '#81818a', 0.04, jit=0.008, moss=(MOSS, 0.8))
    rbox(1.0, 0.26, 0.28, 0, 0, 1.55, '#81818a', 0.04, jit=0.008, moss=(MOSS, 0.2))
    cyl(0.22, 0.27, 0, 0, 1.55, '#8c8c95', 20, rot=(math.pi / 2, 0, 0))                                   # わっか(ケルト)
    cyl(0.14, 0.3, 0, 0, 1.55, '#7a7a84', 20, rot=(math.pi / 2, 0, 0))
    for x, y in ((0.55, 0.15), (-0.6, -0.2)):
        for k in range(7): leaf(0.4, 0.06, x, y, 0.1, '#5f8f38', rot=(0.55, 0, random.uniform(0, 6.28)), bend=0.5)
    sph(0.3, 0.45, 0.3, 0.3, MOSS, (1.3, 1.0, 0.5))
    build('deco_cross')

# ---------------- なめらかな いし ----------------
def rock_smooth():
    random.seed(11); start(OUT)
    rock(0.75, 0, 0, 0.4, '#99948a', (1.35, 1.0, 0.7), rough=0.18, seed=2, moss=(MOSS, 0.55), noise_amt=0.14)
    rock(0.45, 0.95, 0.35, 0.22, '#a39e93', (1.2, 1.0, 0.65), rough=0.2, seed=5, moss=(MOSS, 0.3))
    rock(0.32, -0.8, 0.5, 0.16, '#8c887e', (1.1, 1.0, 0.7), rough=0.2, seed=8, moss=(MOSS, 0.2))
    for i in range(7): rock(random.uniform(0.06, 0.12), random.uniform(-1.4, 1.6), random.uniform(-0.9, 1.0), 0.03, '#8f8b80', (1, 1, 0.7), sub=2, seed=i)
    for x, y in ((0.2, -0.55), (-0.55, 0.1)):
        for k in range(6): leaf(0.32, 0.06, x, y, 0.06, '#5f9238', rot=(0.55, 0, random.uniform(0, 6.28)), bend=0.5)
    build('deco_rock_smooth')

# ---------------- とりい ----------------
def torii():
    start(OUT); RED, DK = '#c8321f', '#2a1a14'
    for sx in (-1, 1):
        rbox(0.62, 0.62, 0.18, sx * 1.35, 0, 0.09, '#8a8478', 0.03, moss=(MOSS, 0.15))                      # いしの だい
        cyl(0.2, 3.5, sx * 1.35, 0, 1.95, RED, 24, r2=0.17, noise_amt=0.05); cyl(0.215, 0.28, sx * 1.35, 0, 0.32, DK, 24)   # はしら と ねもと
    rbox(4.9, 0.34, 0.3, 0, 0, 3.45, RED, 0.04, noise_amt=0.05)                                            # ぬき(したの よこぼう)
    for sx in (-1, 1): rbox(0.34, 0.32, 0.06, sx * 2.0, 0, 3.7, DK, 0.01)
    rbox(4.1, 0.28, 0.24, 0, 0, 2.72, RED, 0.03, noise_amt=0.05)                                           # ぬき
    rbox(0.5, 0.2, 0.55, 0, 0, 3.1, '#e0b040', 0.02)                                                       # がくづか
    rbox(0.42, 0.04, 0.46, 0, -0.12, 3.1, '#2a2a2a', 0)
    rbox(6.0, 0.62, 0.22, 0, 0, 3.92, DK, 0.05)                                                            # かさぎ(くろ)
    rbox(6.0, 0.46, 0.26, 0, 0, 4.1, RED, 0.05, noise_amt=0.05)
    for sx in (-1, 1):                                                                                      # そりあがり
        rbox(1.3, 0.62, 0.22, sx * 3.1, 0, 4.0, DK, 0.05, rot=(0, -sx * 0.22, 0)); rbox(1.2, 0.46, 0.26, sx * 3.1, 0, 4.18, RED, 0.05, rot=(0, -sx * 0.22, 0))
    build('deco_torii')

# ---------------- いしどうろう ----------------
def toro():
    random.seed(13); start(OUT); S = '#a9a392'
    cyl(0.75, 0.22, 0, 0, 0.11, '#8f8a7a', 8, moss=(MOSS, 0.2)); cyl(0.5, 0.18, 0, 0, 0.3, S, 8)         # だい
    cyl(0.26, 1.35, 0, 0, 1.05, S, 8, moss=(MOSS, 0.6)); cyl(0.31, 0.12, 0, 0, 1.78, '#b6b09e', 8)             # はしら
    cyl(0.62, 0.2, 0, 0, 1.9, S, 8, r2=0.7)                                                               # うけ(はす)
    cyl(0.34, 0.1, 0, 0, 2.05, '#9a9484', 8)
    for k in range(4):                                                                                      # ひぶくろの はしら
        a = k * math.pi / 2 + math.pi / 4; rbox(0.12, 0.12, 0.62, math.cos(a) * 0.3, math.sin(a) * 0.3, 2.4, S, 0.02)
    cyl(0.22, 0.55, 0, 0, 2.4, '#ffd36a', 8, glow=0.1)                                                     # あかり
    cyl(0.92, 0.18, 0, 0, 2.78, '#b0aa99', 8, r2=0.68)                                                    # やね
    cyl(0.68, 0.34, 0, 0, 2.97, '#a9a392', 8, r2=0.3)
    sph(0.2, 0, 0, 3.22, '#c0baa8', (1, 1, 1.2), seg=12, ring=8); cyl(0.07, 0.15, 0, 0, 3.4, '#a9a392', 8)   # ほうじゅ
    for x, y in ((0.55, 0.3), (-0.5, -0.35)):
        for k in range(6): leaf(0.3, 0.06, x, y, 0.08, '#5f8f38', rot=(0.55, 0, random.uniform(0, 6.28)), bend=0.5)
    build('deco_toro')

# ---------------- ヨシ ----------------
def reed():
    random.seed(15); start(OUT)
    for i in range(16):
        a = random.uniform(0, 6.28); r = random.uniform(0.0, 0.5); h = random.uniform(1.5, 2.3); x, y = math.cos(a) * r, math.sin(a) * r
        bx, by = random.uniform(-0.18, 0.18), random.uniform(-0.18, 0.18)
        pts = [(x + bx * (t / 6) ** 2, y + by * (t / 6) ** 2, h * t / 6) for t in range(7)]
        tube(pts, 0.026, 0.012, '#7aa43f', seg=6, noise_amt=0.1)
        if i % 3 == 0: tube([(pts[5][0], pts[5][1], pts[5][2]), (pts[6][0], pts[6][1], pts[6][2] + 0.0)], 0.0, 0.0, '#7aa43f', seg=3) if False else None
        if i % 2 == 0: cyl(0.06, 0.42, pts[5][0], pts[5][1], pts[5][2] + 0.1, '#7a4a28', 10, noise_amt=0.1)          # がま の ほ
        for j in (1, 2):
            leaf(1.0 + random.uniform(0, 0.4), 0.09, x, y, 0.15 * j, '#82b044', rot=(0.9 + 0.1 * j, 0, a + j * 2.1), bend=1.2)
    build('deco_reed')

# ---------------- ひまわり ----------------
def sunflower():
    random.seed(17); start(OUT)
    pts = [(0, 0, 0), (0.0, 0.03, 0.8), (0.0, 0.08, 1.7), (0.0, 0.2, 2.5), (0.0, 0.3, 3.0)]
    tube(pts, 0.085, 0.06, '#4f8a2c', seg=8)
    for z, a, s in ((0.5, 0.0, 1.0), (1.1, 3.14, 1.15), (1.7, 1.6, 0.95), (2.1, 4.7, 0.8)):
        leaf(0.9 * s, 0.55 * s, 0, 0.03, z, '#5aa036', rot=(0.7, 0, a), bend=0.9)
    cx, cy, cz = 0, -0.12, 3.0                                                                              # はな(まえむき)
    for ring, (n, L, W, col, dz) in enumerate([(18, 1.0, 0.36, '#f2a810', 0.0), (18, 0.9, 0.34, '#ffc61a', 0.03)]):
        for i in range(n):
            a = i / n * 6.283 + ring * 0.15
            leaf(L, W, cx, cy - 0.02 * ring, cz, col, rot=(math.pi / 2, a, 0), bend=0.0, noise_amt=0.05)
    cyl(0.52, 0.2, cx, cy + 0.0, cz, '#4a2e16', 28, rot=(math.pi / 2, 0, 0))                                 # たね
    cyl(0.34, 0.24, cx, cy - 0.03, cz, '#2e1c0e', 24, rot=(math.pi / 2, 0, 0))
    for i in range(34):
        a = i * 2.4; r = 0.04 + 0.3 * math.sqrt(i / 34); sph(0.03, cx + math.cos(a) * r, cy - 0.14, cz + math.sin(a) * r, '#6a4624', seg=6, ring=5)
    build('deco_sunflower')

# ---------------- せんとう(やみの しろ) ----------------
def spire():
    random.seed(19); start(OUT); W = '#4a4360'
    cyl(1.25, 0.5, 0, 0, 0.25, '#3a344c', 14, moss=None)
    cyl(1.0, 4.6, 0, 0, 2.8, W, 14)
    for k in range(9): cyl(1.012, 0.04, 0, 0, 0.7 + k * 0.5, '#2f2a3e', 14)                               # れんがの す
    for k in range(14):
        a = k / 14 * 6.283; z = 0.9 + (k % 7) * 0.62
        rbox(0.12, 0.05, 0.22, math.cos(a) * 1.0, math.sin(a) * 1.0, z, '#5b5474', 0.01, rot=(0, 0, a + math.pi / 2))
    cyl(1.22, 0.3, 0, 0, 5.2, '#2f2a3e', 14)
    for k in range(10):                                                                                     # はざま(ぎざぎざ)
        a = k / 10 * 6.283; rbox(0.34, 0.3, 0.42, math.cos(a) * 1.1, math.sin(a) * 1.1, 5.55, '#352f46', 0.02, rot=(0, 0, a))
    cyl(1.05, 2.8, 0, 0, 6.7, '#251e33', 14, r2=0.06)                                                       # とんがり やね
    for k in range(8): a = k / 8 * 6.283; rbox(0.05, 0.05, 2.6, math.cos(a) * 0.52, math.sin(a) * 0.52, 6.55, '#3a3050', 0.01, rot=(0, math.atan(0.92 / 2.7), a), jit=0)
    cyl(0.04, 1.4, 0, 0, 8.7, '#6a6078', 8); rbox(0.8, 0.04, 0.45, 0.42, 0, 9.15, '#7a1230', 0.01)
    for z in (1.9, 3.3, 4.5):                                                                                # まど
        rbox(0.42, 0.18, 0.8, 0, -1.0, z, '#1d1a28', 0.04); rbox(0.3, 0.1, 0.68, 0, -1.07, z, '#f2b040', 0.03, glow=0.05)
    rbox(0.9, 0.3, 1.5, 0, -1.04, 0.95, '#2f2218', 0.05); cyl(0.45, 0.3, 0, -1.04, 1.7, '#2f2218', 14, rot=(math.pi / 2, 0, 0))   # もん
    sph(0.28, 0.6, 0.9, 0.2, '#31412a', (1.5, 1, 0.5))
    build('deco_spire')

# ---------------- はた ----------------
def banner():
    start(OUT)
    cyl(0.85, 0.32, 0, 0, 0.16, '#3f3a4a', 8); cyl(0.55, 0.25, 0, 0, 0.44, '#4a4458', 8)
    cyl(0.07, 4.5, 0, 0, 2.6, '#6a5a3a', 10)
    sph(0.15, 0, 0, 4.95, '#e0b040', seg=12, ring=8)
    rbox(1.8, 0.05, 0.1, 0.9, 0, 4.55, '#6a5a3a', 0.01)                                                    # よこぼう
    rbox(1.55, 0.04, 2.4, 0.9, 0, 3.3, '#8a1830', 0.02, noise_amt=0.06)                                    # ぬの
    for k in range(3): rbox(0.5, 0.045, 0.7, 0.4 + k * 0.5, 0, 1.78 + (0 if k == 1 else 0.12), '#8a1830', 0.01)   # すその ぎざぎざ
    rbox(1.55, 0.05, 0.1, 0.9, 0, 4.4, '#e0b040', 0.01); rbox(1.55, 0.05, 0.08, 0.9, 0, 2.15, '#e0b040', 0.01)
    cyl(0.28, 0.06, 0.9, -0.03, 3.45, '#e0b040', 5, rot=(math.pi / 2, 0, 0)); cyl(0.14, 0.07, 0.9, -0.04, 3.45, '#8a1830', 5, rot=(math.pi / 2, 0, 0))
    for x in (0.25, 1.55): cyl(0.045, 0.3, x, 0, 4.35, '#e0b040', 8); sph(0.07, x, 0, 4.18, '#e0b040', seg=8, ring=6)
    build('deco_banner')

# ---------------- ひとだま ----------------
def wisp():
    start(OUT)
    tail = [(0.0, 0.0, 0.0), (0.05, 0.0, 0.35), (0.0, 0.05, 0.75), (-0.08, 0.0, 1.1), (-0.15, 0.0, 1.45)]
    sph(0.5, 0, 0, 0.55, '#8fe0f8', (1, 1, 1.05), seg=24, ring=16, noise_amt=0.04)
    tube([(0.0, 0, 0.7), (0.06, 0, 1.0), (0.12, 0, 1.35), (0.02, 0, 1.7), (-0.12, 0, 2.0), (-0.1, 0, 2.2)], 0.42, 0.0, '#8fe0f8', seg=16)
    sph(0.32, 0, -0.05, 0.5, '#e8fbff', (1, 1, 1.1), seg=16, ring=10, glow=0.1)
    for x, z in ((-0.17, 0.62), (0.17, 0.62)): sph(0.07, x, -0.46, z, '#1d3a5a', (0.8, 0.5, 1.3), seg=10, ring=8)
    sph(0.06, 0, -0.47, 0.42, '#1d3a5a', (1.4, 0.5, 0.8), seg=10, ring=8)
    for i in range(6):
        a = i * 1.05; sph(0.07 + 0.03 * (i % 2), math.cos(a) * 0.75, math.sin(a) * 0.75, 0.3 + i * 0.28, '#b8f2ff', seg=10, ring=8, glow=0.05)
    build('deco_wisp')

# ---------------- しんじゅの かい ----------------
def shell_half(col1, col2, flip, tilt, hy):
    import bmesh
    bpy.ops.mesh.primitive_uv_sphere_add(radius=1, segments=44, ring_count=18, location=(0, 0, 0)); o = bpy.context.object
    bm = bmesh.new(); bm.from_mesh(o.data); geom = bm.verts[:] + bm.edges[:] + bm.faces[:]
    bmesh.ops.bisect_plane(bm, geom=geom, dist=0.0001, plane_co=(0, 0, 0), plane_no=(0, 0, 1), clear_inner=True)
    for v in bm.verts:
        th = math.atan2(v.co.x, -v.co.y - 0.0001); rr = math.hypot(v.co.x, v.co.y)
        v.co.x *= 1.0; v.co.y *= 0.92; v.co.z *= 0.42 * (1 - 0.0)
        k = 0.05 * math.cos(th * 9) * min(1, rr * 1.5); v.co.x += v.co.x * k; v.co.y += v.co.y * k; v.co.z += (0.5 + 0.5 * math.cos(th * 9)) * 0.045 * min(1, rr * 1.4)
        if flip: v.co.z = -v.co.z
        v.co.y -= hy                               # ちょうつがいを げんてんへ
    bm.to_mesh(o.data); bm.free()
    m = o.modifiers.new('s', 'SOLIDIFY'); m.thickness = 0.05; bpy.ops.object.modifier_apply(modifier='s')
    o.rotation_euler = (tilt, 0, 0); o.location = (0, hy + 0.0, 0.3); bpy.context.view_layer.update()
    B.paint(o, col1, noise_amt=0.07, smooth=True); return o

def pearl_shell():
    start(OUT)
    rock(1.2, 0, 0, 0.0, '#e8d29a', (1.4, 1.1, 0.12), rough=0.05, sub=3, seed=2, noise_amt=0.1)             # すな
    for k in range(7): sph(0.08, math.cos(k * 1.1) * 1.2, math.sin(k * 1.1) * 0.9, 0.1, '#f2e4b8', seg=8, ring=6)
    shell_half('#f4b8c8', None, True, 0.0, 0.85)                                                            # したの から(おわん)
    shell_half('#f8cad6', None, False, -1.0, 0.85)                                                          # うえの から(ひらいた)
    sph(0.46, 0, -0.05, 0.62, '#fff4ea', seg=28, ring=18)                                                    # しんじゅ
    sph(0.12, -0.16, -0.2, 0.86, '#ffffff', seg=10, ring=8, glow=0.1)
    for x, y, z in ((-1.0, -0.6, 0.2), (1.1, -0.5, 0.15)): rock(0.14, x, y, z, '#9a9486', (1.2, 1, 0.7), sub=2, seed=4)
    build('deco_pearl_shell')

ALL = [('ruin_arch', ruin_arch), ('pillar_broken', pillar_broken), ('tomb', tomb), ('cross', cross), ('rock_smooth', rock_smooth), ('torii', torii), ('toro', toro), ('reed', reed), ('sunflower', sunflower), ('spire', spire), ('banner', banner), ('wisp', wisp), ('pearl_shell', pearl_shell)]
for n, f in ALL:
    if want('deco_' + n) or want(n): f()

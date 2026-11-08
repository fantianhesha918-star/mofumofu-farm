"""村・フィールドの こもの(たきび・どんぐり・きのこ・かかし・ベンチ など)を Blender で つくりなおす。
使い方: blender -b -P tools/make_props_hq.py -- 出力フォルダ(docs/assets) [なまえ ...]
"""
import bpy, sys, math, random, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import blib as B
from blib import rbox, cyl, sph, rock, tube, leaf, start, build, ground_extras, vine, candle

args = sys.argv[sys.argv.index('--') + 1:]; OUT = args[0]; ONLY = set(args[1:])
G1, G2, G3 = '#5f9238', '#4a7a2c', '#7bb04a'
def want(n): return not ONLY or n in ONLY
def tuft(x, y, z, n=6, h=0.3, col=G1, w=0.06):
    for k in range(n): leaf(h * random.uniform(0.7, 1.2), w, x + random.uniform(-.05, .05), y + random.uniform(-.05, .05), z, col, rot=(0.55, 0, random.uniform(0, 6.28)), bend=0.5)


# ================= ほそかい かざり(2026-11 クオリティ アップ) =================
def extras_campfire():
    rnd = random.Random(31)
    for (a, ph) in ((0.5, 0), (2.7, 1), (4.5, 2)):   # マシュマロの くし
        x0, y0 = math.cos(a) * 1.35, math.sin(a) * 1.35; x1, y1 = math.cos(a) * 0.32, math.sin(a) * 0.32
        tube([(x0, y0, 0.05), ((x0 + x1) / 2, (y0 + y1) / 2, 0.38), (x1, y1, 0.62)], 0.014, 0.012, '#7a5a34', seg=5)
        for k in range(2): sph(0.07, x1 + (x0 - x1) * 0.1 * k, y1 + (y0 - y1) * 0.1 * k, 0.62 + 0.0 - k * 0.07, '#fff6ea' if k else '#ffd8c0', (1, 1, 0.9), seg=8, ring=6)
    for k in range(3):   # すわる まるた(こけつき)
        a = k * 2.09 + 1.0; x, y = math.cos(a) * 1.65, math.sin(a) * 1.65
        cyl(0.24, 0.42, x, y, 0.21, '#7a5632', 12, noise_amt=0.15, moss=('#59803a', 0.2)); cyl(0.21, 0.02, x, y, 0.43, '#c9a06a', 12)
    for i in range(14): sph(0.02, rnd.uniform(-0.5, 0.5), rnd.uniform(-0.5, 0.5), 0.05 + rnd.uniform(0, 0.12), '#ff9a3a', seg=5, ring=4, glow=0.3)   # おきび
    ground_extras(1.9, seed=41, peb=10, tufts=8, flowers=3, mush=2, leaves=3)

def extras_ground(r, seed, **kw):
    ground_extras(r, seed=seed, **kw)

def extras_scarecrow():
    sph(0.28, 0.6, 0.35, 0.22, '#ff9a2a', (1, 1, 0.8), seg=12, ring=8); cyl(0.04, 0.12, 0.6, 0.35, 0.46, '#4a7a30', 6)
    sph(0.22, -0.55, 0.4, 0.18, '#e88a22', (1, 1, 0.8), seg=12, ring=8)
    for k in range(3): leaf(0.4, 0.18, 0.6, 0.35, 0.3, '#5f9238', rot=(0.4, 0, k * 2.1), bend=0.3)
    ground_extras(0.95, seed=43, peb=6, tufts=8, flowers=4, mush=1, leaves=2)

def campfire():
    random.seed(1); start(OUT)
    cyl(0.62, 0.04, 0, 0, 0.02, '#2a2420', 20, noise_amt=0.2)                                      # はい
    for i in range(10):                                                                             # いしの わ
        a = i / 10 * 6.283 + random.uniform(-.08, .08); r = 0.68 + random.uniform(-.04, .06)
        rock(random.uniform(0.17, 0.25), math.cos(a) * r, math.sin(a) * r, 0.12, '#9c9588' if i % 2 else '#8a847a', (1.15, 1.0, 0.75), rough=0.16, sub=2, seed=i, noise_amt=0.14)
    for a0, tl in ((0.3, 0.45), (2.4, 0.5), (4.3, 0.42)):                                           # まき
        L = 0.95
        o = cyl(0.085, L, math.cos(a0) * 0.12, math.sin(a0) * 0.12, 0.2, '#5a3a22', 12, rot=(0, math.pi / 2 - tl, a0 + math.pi / 2), noise_amt=0.15)
        cyl(0.075, 0.02, math.cos(a0) * 0.12 + math.cos(a0 + math.pi / 2) * 0.42 * math.sin(tl), math.sin(a0) * 0.12 + math.sin(a0 + math.pi / 2) * 0.42 * math.sin(tl), 0.2 + 0.42 * math.cos(tl), '#d8b078', 12, rot=(0, math.pi / 2 - tl, a0 + math.pi / 2))
    for (r0, r1, h, col, gl, ph) in ((0.28, 0.0, 0.9, '#ff6a1a', 0.0, 0), (0.2, 0.0, 0.75, '#ffa628', 0.05, 2), (0.12, 0.0, 0.52, '#fff0a0', 0.15, 4)):   # ほのお
        for k in range(3 if r0 > 0.15 else 1):
            a = k * 2.1 + ph; x, y = math.cos(a) * 0.12 * (k > 0), math.sin(a) * 0.12 * (k > 0)
            tube([(x, y, 0.28), (x + 0.03, y, 0.28 + h * 0.4), (x - 0.04, y + 0.03, 0.28 + h * 0.75), (x + 0.02, y, 0.28 + h)], r0, r1, col, seg=10, glow=gl, noise_amt=0.05)
    for i in range(9): sph(0.022, random.uniform(-.4, .4), random.uniform(-.4, .4), 0.6 + random.uniform(0, .5), '#ffd060', seg=6, ring=4, glow=0.2)
    extras_campfire()
    build('campfire')

def acorn():
    random.seed(2); start(OUT)
    for x, y, rot in ((0, 0, (0.0, 0.0, 0)), (0.28, 0.12, (0.9, 0.2, 0.4)), (-0.2, 0.2, (-0.7, 0.3, 1.0))):
        c = (x, y, 0.2)
        s = sph(0.15, x, y, 0.17, '#a8743a', (1, 1, 1.35), seg=16, ring=12, rot=rot, noise_amt=0.06)
        cyl(0.02, 0.07, x, y, 0.37, '#6a4a22', 8, r2=0.0, rot=rot)
        sph(0.165, x, y, 0.3, '#7a5028', (1, 1, 0.7), seg=16, ring=10, rot=rot, noise_amt=0.1)                # ぼうし
        for k in range(12): a = k * 0.52; sph(0.02, x + math.cos(a) * 0.1, y + math.sin(a) * 0.1, 0.34, '#5e3c1c', seg=6, ring=4, rot=rot)
        cyl(0.018, 0.1, x, y, 0.44, '#5a3a1a', 8, rot=rot)
    leaf(0.32, 0.18, 0.1, -0.05, 0.03, '#6a9a34', rot=(0.2, 0, 0.8), bend=0.1)
    build('acorn')

def berrybush():
    random.seed(3); start(OUT)
    for i in range(16):
        a = random.uniform(0, 6.28); r = random.uniform(0.0, 0.62); sph(random.uniform(0.28, 0.4), math.cos(a) * r, math.sin(a) * r, random.uniform(0.28, 0.5), random.choice([G2, G1, '#3f6a24', G3]), (1, 1, 0.8), seg=10, ring=7, noise_amt=0.2)
    for i in range(34):
        a = random.uniform(0, 6.28); r = random.uniform(0.1, 0.85); leaf(0.26, 0.14, math.cos(a) * r, math.sin(a) * r, random.uniform(0.3, 0.7), random.choice([G1, G3, G2]), rot=(random.uniform(0.3, 1.0), 0, random.uniform(0, 6.28)), bend=0.4)
    for i in range(22):
        a = random.uniform(0, 6.28); r = random.uniform(0.35, 0.8); sph(0.05, math.cos(a) * r, math.sin(a) * r, random.uniform(0.3, 0.68), random.choice(['#d8283a', '#e8384a', '#b81e30']), seg=8, ring=6)
    build('berrybush')

def dandelion():
    random.seed(4); start(OUT)
    for i in range(8): leaf(0.5, 0.14, 0, 0, 0.02, G1, rot=(0.35, 0, i * 0.8), bend=0.5)                    # ねもとの は
    tube([(0, 0, 0.0), (0.03, 0.0, 0.3), (0.0, 0.02, 0.62), (-0.02, 0.0, 0.8)], 0.016, 0.01, '#6aa040', seg=6)
    cz = 0.88
    for i in range(70):                                                                                     # わたげ
        u = random.uniform(-1, 1); a = random.uniform(0, 6.28); s = math.sqrt(1 - u * u); d = (math.cos(a) * s, math.sin(a) * s, u)
        cyl(0.002, 0.15, d[0] * 0.075 - 0.02, d[1] * 0.075, cz + d[2] * 0.075, '#e8e8e0', 4, rot=(math.acos(d[2]) * 0 + math.pi / 2 * 0 , 0, 0)) if False else None
        sph(0.026, -0.02 + d[0] * 0.15, d[1] * 0.15, cz + d[2] * 0.15, '#ffffff', (1, 1, 1), seg=6, ring=4, glow=0.05)
    sph(0.07, -0.02, 0, cz, '#d8d0b8', seg=10, ring=8)
    build('dandelion')

def kelp():
    random.seed(5); start(OUT)
    for i in range(7):
        a = i / 7 * 6.283 + random.uniform(-.2, .2); L = random.uniform(1.0, 1.5)
        pts = [(math.cos(a) * 0.1 + math.sin(t * 3 + i) * 0.06, math.sin(a) * 0.1, t * L * 0.9) for t in [k / 6 for k in range(7)]]
        tube(pts, 0.03, 0.012, random.choice(['#4f6a2a', '#5a7a30', '#3f5a24']), seg=6)
        for j in range(1, 6, 2): leaf(0.5, 0.2, pts[j][0], pts[j][1], pts[j][2], random.choice(['#5a8a34', '#6a9a3c', '#4f7a2c']), rot=(0.9, 0, a + j), bend=0.6)
        sph(0.05, pts[3][0], pts[3][1], pts[3][2], '#8aa04a', seg=8, ring=6)
    build('kelp')

def mushroom():
    random.seed(6); start(OUT)
    for x, y, h, r in ((0, 0, 0.55, 0.42), (0.7, 0.3, 0.38, 0.28), (-0.55, 0.45, 0.3, 0.22), (0.3, -0.6, 0.26, 0.19)):
        cyl(0.07 + r * 0.12, h, x, y, h / 2, '#f4e8d0', 14, r2=0.06 + r * 0.1, noise_amt=0.05)
        cyl(r * 0.8, 0.02, x, y, h - 0.01, '#d8c8a0', 20, noise_amt=0.05)                                    # ひだ
        sph(r, x, y, h + r * 0.1, '#e03a2a', (1, 1, 0.62), seg=20, ring=12, noise_amt=0.05)
        for k in range(9):
            a = random.uniform(0, 6.28); rr = random.uniform(0.2, 0.85) * r; sph(r * 0.15, x + math.cos(a) * rr, y + math.sin(a) * rr, h + r * 0.1 + math.sqrt(max(0.01, 1 - (rr / r) ** 2)) * r * 0.58, '#fff4ea', (1, 1, 0.3), seg=8, ring=6)
    for x, y in ((0.2, 0.5), (-0.4, -0.2), (0.9, -0.2)): sph(0.3, x, y, 0.05, '#4f8a2c', (1.4, 1, 0.3), seg=10, ring=6)
    for x, y in ((0.4, 0.2), (-0.2, 0.15), (0.2, -0.3)): tuft(x, y, 0.03, 5, 0.3)
    build('mushroom')

def nori_rack():
    random.seed(7); start(OUT); POST = '#7a5a30'
    for sx in (-0.9, 0, 0.9):
        cyl(0.045, 0.94, sx, 0, 0.47, POST, 10, noise_amt=0.15)
        for sy in (-0.28, 0.28): cyl(0.04, 0.9, sx, sy, 0.45, POST, 10, noise_amt=0.15)
        sph(0.06, sx, 0, 0.0, '#5a4220', (1.6, 1.6, 0.4), seg=8, ring=6)
    for z in (0.9, 0.55): cyl(0.028, 1.9, 0, 0.0, z, '#8a6a3a', 10, rot=(0, math.pi / 2, 0), noise_amt=0.15)
    for z in (0.9, 0.55):
        for sy in (-0.28, 0.28): cyl(0.022, 1.9, 0, sy, z, '#8a6a3a', 8, rot=(0, math.pi / 2, 0), noise_amt=0.15)
    for i in range(6):                                                                                      # のり(ほしてある)
        x = -0.78 + i * 0.31; rbox(0.27, 0.025, 0.4, x, 0.0, 0.7, '#233a1c' if i % 2 else '#2d4a22', 0.01, noise_amt=0.2)
    for sx in (-0.9, 0, 0.9): tube([(sx - 0.05, 0, 0.9), (sx, 0.02, 0.88), (sx + 0.05, 0, 0.9)], 0.012, 0.012, '#c0a060', seg=5)
    ground_extras(1.3, seed=55, peb=9, tufts=0, flowers=0, mush=0)
    build('nori_rack')

def scarecrow():
    random.seed(8); start(OUT)
    cyl(0.07, 1.7, 0, 0, 0.85, '#7a5a30', 10, noise_amt=0.15)                                               # しちゅう
    cyl(0.055, 1.8, 0, 0, 1.12, '#7a5a30', 10, rot=(0, math.pi / 2, 0), noise_amt=0.15)                      # うで
    sph(0.34, 0, 0, 0.95, '#6a8ab8', (1.0, 0.7, 1.2), seg=14, ring=10, noise_amt=0.1)                       # シャツ
    for sx in (-1, 1):
        cyl(0.11, 0.7, sx * 0.55, 0, 1.12, '#6a8ab8', 12, rot=(0, math.pi / 2, 0), noise_amt=0.1)
        for k in range(6): leaf(0.2, 0.025, sx * 0.93, 0, 1.12, '#e0c060', rot=(0, 0, 0), bend=0.1) if False else cyl(0.01, 0.2, sx * 0.93 + sx * 0.05, random.uniform(-.04, .04), 1.12 + random.uniform(-.04, .04), '#e0c060', 5, rot=(0, math.pi / 2, 0))
    for k in range(10): cyl(0.01, 0.22, random.uniform(-.25, .25), random.uniform(-.1, .1), 0.65, '#e0c060', 5, rot=(random.uniform(-.2, .2), 0, 0))
    rbox(0.18, 0.04, 0.16, 0.12, -0.26, 0.9, '#c8483a', 0.01)                                               # つぎあて
    sph(0.22, 0, 0, 1.42, '#f0d4a0', (1, 0.95, 1.05), seg=16, ring=12, noise_amt=0.05)                     # あたま
    for sx in (-0.07, 0.07): sph(0.02, sx, -0.2, 1.47, '#2a1a0a', seg=6, ring=4)
    sph(0.03, 0, -0.22, 1.4, '#c8786a', seg=8, ring=6); tube([(-0.08, -0.2, 1.33), (0, -0.21, 1.31), (0.08, -0.2, 1.33)], 0.008, 0.008, '#6a3a2a', seg=4)
    cyl(0.4, 0.04, 0, 0, 1.6, '#e0b858', 24, noise_amt=0.1); cyl(0.2, 0.2, 0, 0, 1.7, '#e0b858', 20, noise_amt=0.1); cyl(0.205, 0.05, 0, 0, 1.64, '#c8483a', 20)   # ぼうし
    for sx in (-1, 1): sph(0.045, sx * 0.1, -0.3, 0.78, '#e8e8e0', seg=8, ring=6)
    extras_scarecrow()
    build('scarecrow')

def bench():
    random.seed(9); start(OUT); W1, W2 = '#a8784a', '#8a5e36'
    for i in range(3): rbox(1.5, 0.11, 0.07, 0, -0.05 + i * 0.13, 0.5, W1 if i % 2 else '#b08050', 0.02, noise_amt=0.1)   # ざめん
    for i in range(3): rbox(1.5, 0.05, 0.14, 0, 0.3, 0.66 + i * 0.17, W1 if i % 2 else '#b08050', 0.02, rot=(-0.12, 0, 0), noise_amt=0.1)   # せもたれ
    for sx in (-0.65, 0.65):
        rbox(0.09, 0.08, 0.5, sx, 0.0, 0.25, W2, 0.015, noise_amt=0.1); rbox(0.09, 0.08, 0.5, sx, 0.3, 0.25, W2, 0.015, noise_amt=0.1)
        rbox(0.09, 0.08, 0.95, sx, 0.34, 0.6, W2, 0.015, rot=(-0.12, 0, 0), noise_amt=0.1)
        rbox(0.09, 0.4, 0.07, sx, 0.0, 0.58, W2, 0.015); rbox(0.1, 0.1, 0.07, sx, -0.15, 0.62, W2, 0.015)
    rbox(1.4, 0.05, 0.05, 0, 0.0, 0.15, W2, 0.01)
    for sx in (-0.75, 0.75): cyl(0.02, 0.1, sx, 0.0, 0.5, '#5a5a62', 8, rot=(0, math.pi / 2, 0))
    ground_extras(1.2, seed=45, peb=6, tufts=7, flowers=4, mush=1, leaves=2)
    build('bench')

def flowerbed():
    random.seed(10); start(OUT)
    rbox(1.5, 1.1, 0.3, 0, 0, 0.15, '#8a5e36', 0.03, noise_amt=0.12)
    rbox(1.38, 0.98, 0.04, 0, 0, 0.3, '#4a3020', 0.02, noise_amt=0.1)
    for x, y in ((0.75, 0.55), (-0.75, 0.55), (0.75, -0.55), (-0.75, -0.55)): rbox(0.14, 0.14, 0.34, x, y, 0.17, '#6a4626', 0.02)
    cols = ['#ff7aa8', '#ffd84a', '#ffffff', '#b89cff', '#ff8a4a']
    for i in range(16):
        x, y = random.uniform(-0.58, 0.58), random.uniform(-0.4, 0.4); h = random.uniform(0.3, 0.55); c = random.choice(cols)
        tube([(x, y, 0.3), (x + random.uniform(-.04, .04), y, 0.3 + h * 0.5), (x, y, 0.3 + h)], 0.012, 0.01, '#4a7a2c', seg=5)
        leaf(0.2, 0.08, x, y, 0.34, G1, rot=(0.7, 0, random.uniform(0, 6.28)), bend=0.4)
        for k in range(6): a = k * 1.047; sph(0.045, x + math.cos(a) * 0.055, y + math.sin(a) * 0.055, 0.3 + h + 0.01, c, (1, 1, 0.5), seg=8, ring=6)
        sph(0.03, x, y, 0.3 + h + 0.02, '#ffd040', seg=8, ring=6)
    ground_extras(1.3, seed=57, peb=6, tufts=6, flowers=0, mush=1, leaves=2)
    build('flowerbed')

def egg_nest():
    random.seed(11); start(OUT)
    for ring in range(3):
        for i in range(14):
            a0 = random.uniform(0, 6.28); R0 = 0.78 - ring * 0.1; z = 0.06 + ring * 0.07
            pts = [(math.cos(a0 + t * 0.9) * R0, math.sin(a0 + t * 0.9) * R0, z + random.uniform(-.02, .02)) for t in [k / 4 for k in range(5)]]
            tube(pts, 0.025, 0.02, random.choice(['#d8b050', '#c89a3c', '#e8c868']), seg=5, noise_amt=0.1)
    cyl(0.52, 0.06, 0, 0, 0.05, '#c89a3c', 18, noise_amt=0.15)
    for x, y, rot in ((0, 0.12, (0, 0.2, 0.3)), (0.32, -0.15, (0.1, 0.2, 1.2)), (-0.3, -0.12, (0.2, 0.0, 2.0))):
        sph(0.18, x, y, 0.28, '#f0e0c0', (0.82, 0.82, 1.1), seg=16, ring=12, rot=rot, noise_amt=0.05)
        for k in range(6): a = k * 1.2; sph(0.018, x + math.cos(a) * 0.12, y + math.sin(a) * 0.12, 0.3 + math.sin(a * 2) * 0.1, '#b89a70', seg=5, ring=4)
    for k in range(5): leaf(0.2, 0.05, random.uniform(-.5, .5), random.uniform(-.5, .5), 0.14, '#fff8ee', rot=(0.5, 0, random.uniform(0, 6.28)), bend=0.4, noise_amt=0.04)
    ground_extras(0.9, seed=47, peb=6, tufts=7, flowers=3, mush=1)
    build('egg_nest')

def birch():
    random.seed(12); start(OUT)
    pts = [(0, 0, 0), (0.02, 0, 0.5), (-0.02, 0.02, 1.0), (0.03, 0, 1.4), (0.0, -0.02, 1.8)]
    tube(pts, 0.085, 0.03, '#ece6d8', seg=10, noise_amt=0.06)
    for z in (0.15, 0.42, 0.7, 0.95, 1.2, 1.45): rbox(0.09 + random.uniform(0, .05), 0.012, 0.03, 0.0, -0.09 + 0.05 * z * 0, z, '#2a2420', 0, rot=(0, 0, random.uniform(0, 6.28)))
    for z, a, L in ((0.9, 0.5, 0.5), (1.2, 2.8, 0.55), (1.5, 4.6, 0.45), (1.6, 1.5, 0.4)):
        bp = [(0.0, 0, z), (math.cos(a) * L * 0.5, math.sin(a) * L * 0.5, z + L * 0.35), (math.cos(a) * L, math.sin(a) * L, z + L * 0.6)]
        tube(bp, 0.022, 0.01, '#d8d0c0', seg=6)
        for k in range(8): sph(0.1, bp[2][0] + random.uniform(-.2, .2), bp[2][1] + random.uniform(-.2, .2), bp[2][2] + random.uniform(-.1, .22), random.choice(['#9ac04a', '#b0d060', '#86b03c']), (1, 1, 0.7), seg=8, ring=6, noise_amt=0.15)
    for k in range(10): sph(0.1, random.uniform(-.2, .2), random.uniform(-.2, .2), 1.65 + random.uniform(0, .35), random.choice(['#9ac04a', '#b0d060', '#86b03c']), (1, 1, 0.75), seg=8, ring=6, noise_amt=0.15)
    ground_extras(1.0, seed=51, peb=6, tufts=8, flowers=3, mush=3, leaves=6)
    build('birch')

for n, f in (('campfire', campfire), ('acorn', acorn), ('berrybush', berrybush), ('dandelion', dandelion), ('kelp', kelp), ('mushroom', mushroom), ('nori_rack', nori_rack), ('scarecrow', scarecrow), ('bench', bench), ('flowerbed', flowerbed), ('egg_nest', egg_nest), ('birch', birch)):
    if want(n): f()

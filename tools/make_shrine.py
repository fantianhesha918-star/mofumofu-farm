"""でんせつの ほこら(どうくつの たてもの)を Blender で つくる。フィールドに たつ。まえが +Z(Blender では -Y)。はば およそ 9・たかさ 6。
使い方: blender -b -P tools/make_shrine.py -- docs/assets [なまえ ...]
 shrine_cave   … いわの おやま+いしの アーチ+しめなわ+とうろう+けっしょう(フルカラー頂点カラー。ゲームで いろを かけない)
 shrine_portal … アーチの なかの ひかる めん(ゲームで かさねる)
"""
import bpy, sys, math, random
sys.path.insert(0, __file__.rsplit('tools', 1)[0] + 'tools')
import blib as B

out = sys.argv[sys.argv.index('--') + 1]
only = sys.argv[sys.argv.index('--') + 2:]
ASSETS = []
def asset(fn): ASSETS.append(fn); return fn

ROCKS = ['#a39eb8', '#b4afc8', '#948fab', '#bdb8d0']
CREAM = '#f1e8d0'; GOLD = '#ffd45a'

def crystal(x, y, z, h, col, tilt=(0, 0)):
    B.cyl(h * 0.2, h, x, y, z + h / 2, col, seg=6, r2=h * 0.03, rot=(tilt[0], tilt[1], 0), noise_amt=0.03, glow=0.14, smooth=True)

@asset
def shrine_cave():
    random.seed(21)
    # --- おやま: おおきな いわを かさねる(したに こけ・うえに くさ) ---
    B.sph(3.9, 0, 2.7, 1.4, '#9a8ee0', scale=(1.2, 1.05, 0.95), seg=24, ring=16, noise_amt=0.06, freq=1.2, moss=('#86cf74', 1.3))
    B.sph(2.6, 0.2, 3.2, 3.0, '#b4a8f0', scale=(1.2, 1.1, 0.9), seg=20, ring=14, noise_amt=0.06, freq=1.4)
    for k in range(18):   # まわりの ごろごろ いわ
        a = random.uniform(0, 6.28); r = random.uniform(2.6, 4.3)
        x, y = math.cos(a) * r * 1.15, 2.5 + math.sin(a) * r * 0.95
        if y < 0.4: y = 0.4 + random.uniform(0, 0.8)
        B.rock(random.uniform(0.7, 1.4), x, y, random.uniform(0.3, 1.6), random.choice(['#9a8ee0', '#aa9ef0', '#8a84d8', '#b8aef4', '#a0b0f0', '#c0a8e8']), scale=(1, 1, 0.8), rough=0.14, sub=2, seed=k, noise_amt=0.05, moss=('#86cf74', 0.9))
    # --- うえの くさ・つた・おはな ---
    for k in range(11):
        a = random.uniform(0, 6.28); r = random.uniform(0.2, 2.4)
        B.sph(random.uniform(0.5, 0.9), math.cos(a) * r, 3.0 + math.sin(a) * r * 0.8, random.uniform(4.2, 5.0), random.choice(['#6fcf6a', '#5cc060', '#86dc78']), scale=(1, 1, 0.7), seg=10, ring=7, noise_amt=0.05)
    for k in range(5):   # たれさがる つた
        x = random.uniform(-3.3, 3.3); y = random.uniform(1.0, 2.0); h = random.uniform(1.4, 2.4)
        B.tube([(x, y - 1.7, 3.6 + h * 0.2), (x + 0.1, y - 1.9, 2.6), (x - 0.05, y - 2.0, 3.6 - h * 0.5 + 0.9)], 0.08, 0.05, '#5cbc5e', seg=6, noise_amt=0.04)
    for k in range(14):
        a = random.uniform(0, 6.28); r = random.uniform(0.6, 2.8); cx, cy, cz = math.cos(a) * r, 3.0 + math.sin(a) * r * 0.8, random.uniform(4.5, 5.2)
        pc = random.choice(['#ffb8d4', '#fff0a0', '#ffffff', '#d8c8ff'])
        for q in range(5):
            b = q / 5 * 6.28; B.sph(0.1, cx + math.cos(b) * 0.13, cy + math.sin(b) * 0.13, cz, pc, seg=6, ring=4, noise_amt=0.0)
        B.sph(0.08, cx, cy, cz + 0.02, '#ffd23a', seg=6, ring=4, noise_amt=0.0)
    # --- いりぐち(いしの アーチ・かいだん) ---
    ay = -1.9
    B.rbox(6.0, 3.2, 0.3, 0, ay + 0.4, 0.15, '#e4dcc4', bev=0.14, bseg=3, noise_amt=0.03)
    for k in range(3):
        B.rbox(3.8 - k * 0.5, 0.9, 0.2, 0, ay - 1.15 - k * 0.8, 0.12 + (2 - k) * 0.0, '#efe6cc' if k % 2 == 0 else '#e4dcc4', bev=0.1, bseg=3, noise_amt=0.03)
    B.rbox(3.2, 1.8, 3.6, 0, ay + 1.0, 1.85, '#0e0a1c', bev=0.0, noise_amt=0.0)   # くらい おく
    for s in (-1, 1):
        B.cyl(0.44, 3.4, s * 1.7, ay, 1.85, '#f6eed8', seg=24, noise_amt=0.02, smooth=True)
        B.cyl(0.58, 0.24, s * 1.7, ay, 0.4, '#ffd45a', seg=24, noise_amt=0.0, smooth=True); B.cyl(0.58, 0.24, s * 1.7, ay, 3.3, '#ffd45a', seg=24, noise_amt=0.0, smooth=True)
        B.sph(0.36, s * 1.7, ay, 3.78, '#ffb3c8', seg=14, ring=10, noise_amt=0.0, glow=0.05)
    pts = [(-1.7 * math.cos(t * math.pi), ay, 3.3 + 1.7 * math.sin(t * math.pi)) for t in [i / 22 for i in range(23)]]
    B.tube(pts, 0.4, 0.4, '#f6eed8', seg=12, noise_amt=0.02)
    pts2 = [(-1.7 * math.cos(t * math.pi), ay - 0.4, 3.3 + 1.7 * math.sin(t * math.pi)) for t in [i / 22 for i in range(23)]]
    B.tube(pts2, 0.08, 0.08, '#ffd45a', seg=8, noise_amt=0.0, glow=0.05)
    B.sph(0.55, 0, ay - 0.05, 5.15, '#ffd45a', scale=(1, 0.8, 1), seg=14, ring=10, noise_amt=0.0, glow=0.08)
    for k in range(5):
        a = (k + 0.5) / 5 * math.pi; B.sph(0.15, -math.cos(a) * 1.7, ay - 0.45, 3.3 + math.sin(a) * 1.7, '#fff6c8', seg=8, ring=6, noise_amt=0.0, glow=0.12)
    # --- しめなわ と しで ---
    rp = [(-2.0 + 4.0 * t, ay - 0.55, 3.45 - 0.38 * math.sin(t * math.pi)) for t in [i / 16 for i in range(17)]]
    B.tube(rp, 0.14, 0.14, '#f0e0a8', seg=8, noise_amt=0.04)
    for t in (0.2, 0.4, 0.6, 0.8):
        x = -2.0 + 4.0 * t; z = 3.45 - 0.38 * math.sin(t * math.pi)
        for j in range(3): B.rbox(0.24, 0.03, 0.17, x + (0.08 if j % 2 else -0.08), ay - 0.57, z - 0.2 - j * 0.16, '#ffffff', bev=0.0, noise_amt=0.0, glow=0.06)
    # --- いしどうろう ---
    for s in (-1, 1):
        x, y = s * 3.6, ay - 0.4
        B.cyl(0.55, 0.25, x, y, 0.2, '#d4cebf', seg=10, noise_amt=0.03); B.cyl(0.2, 1.0, x, y, 0.8, '#e0dacb', seg=10, noise_amt=0.03, smooth=True)
        B.rbox(0.85, 0.85, 0.7, x, y, 1.65, '#ece6d4', bev=0.12, bseg=3, noise_amt=0.03); B.sph(0.26, x, y, 1.65, '#ffe9a0', seg=10, ring=8, noise_amt=0.0, glow=0.4)
        B.cyl(0.8, 0.2, x, y, 2.15, '#d4cebf', seg=10, r2=0.12, noise_amt=0.03); B.sph(0.13, x, y, 2.5, '#ffd45a', seg=8, ring=6, noise_amt=0.0, glow=0.1)
    # --- ひかる きのこ ---
    for (x, y, sz) in [(-2.6, -2.6, 0.5), (-3.0, -1.6, 0.34), (2.7, -2.7, 0.46), (3.2, -1.7, 0.32), (-4.0, -0.4, 0.4), (4.1, -0.5, 0.36)]:
        cc = random.choice(['#ff9ac0', '#9ad0ff', '#ffe08a'])
        B.cyl(sz * 0.18, sz, x, y, 0.2 + sz / 2, '#fff2e0', seg=8, noise_amt=0.0, smooth=True)
        B.sph(sz * 0.7, x, y, 0.2 + sz, cc, scale=(1, 1, 0.65), seg=12, ring=8, noise_amt=0.0, glow=0.18)
        for q in range(3):
            B.sph(sz * 0.12, x + random.uniform(-0.2, 0.2) * sz * 2, y + random.uniform(-0.2, 0.2) * sz * 2, 0.2 + sz * 1.3, '#ffffff', seg=6, ring=4, noise_amt=0.0)
    # --- けっしょう ---
    def crystal(x, y, z, h, col, tilt):
        B.cyl(h * 0.2, h, x, y, z + h / 2, col, seg=6, r2=h * 0.03, rot=(tilt[0], tilt[1], 0), noise_amt=0.03, glow=0.16, smooth=True)
    # --- ほそかい かざり(2026-11) ---
    for (x, y) in ((-4.6, -2.8), (4.6, -2.6)):   # つみいし(ケルン)
        for k in range(4): B.rock(0.42 - k * 0.07, x + random.uniform(-0.05, 0.05), y, 0.25 + k * 0.38, random.choice(['#cfc8e0', '#b8b0d0', '#a8a0c4']), scale=(1, 1, 0.65), rough=0.1, sub=1, seed=k + int(x), noise_amt=0.04)
    gp = [(-3.6 + 7.2 * t, ay - 0.7, 2.6 - 0.45 * math.sin(t * math.pi) + 0.0) for t in [i / 18 for i in range(19)]]
    B.tube(gp, 0.03, 0.03, '#8a6a3a', seg=5, noise_amt=0.0)   # かざりなわ(はたの ガーランド)
    for i, t in enumerate([j / 12 for j in range(1, 12)]):
        B.rbox(0.22, 0.03, 0.26, -3.6 + 7.2 * t, ay - 0.72, 2.45 - 0.45 * math.sin(t * math.pi), ['#ffb8d4', '#fff0a0', '#c0e8ff', '#c8f0c0'][i % 4], bev=0.0, rot=(0, 0, 0.78), noise_amt=0.0)
    for s_ in (-1, 1): B.vine(s_ * 1.7, ay, 0.4, 3.0, a0=s_, turns=1.1, rad=0.46, n=14, r=0.04, seed=int(s_ * 7 + 20))
    for k in range(10): B.sph(random.uniform(0.04, 0.08), random.uniform(-4, 4), random.uniform(-4.5, 2.0), random.uniform(0.6, 5.0), '#fff2a0', seg=5, ring=4, noise_amt=0.0, glow=0.4)   # ほたる
    B.tube([(0.5, 3.0, 5.0), (0.6, 3.0, 5.8), (0.5, 3.1, 6.5)], 0.08, 0.04, '#b98a5c', seg=6, noise_amt=0.05)   # わかぎ
    for k in range(5): B.sph(0.3, 0.5 + math.cos(k * 1.26) * 0.25, 3.1 + math.sin(k * 1.26) * 0.25, 6.6, random.choice(['#ffc4dc', '#ffb0cc']), seg=7, ring=5, noise_amt=0.0)
    B.ground_extras(5.4, seed=33, peb=14, tufts=10, flowers=8, mush=0, leaves=0)
    for (x, y, z, h, c) in [(-3.2, 0.9, 0.6, 1.9, '#ffc0e0'), (-3.8, 1.6, 0.5, 1.2, '#c0d4ff'), (3.3, 0.9, 0.6, 2.1, '#c0e8ff'), (3.9, 1.7, 0.5, 1.1, '#ffe0a0'), (-1.5, 4.4, 3.5, 1.4, '#e8c8ff'), (1.7, 4.2, 3.6, 1.7, '#ffd0ec'), (0.2, 3.4, 4.2, 1.2, '#c0f0ff'), (-0.8, 2.4, 4.6, 1.0, '#ffe9a0'), (-2.4, 3.0, 3.2, 1.2, '#c0d4ff')]:
        crystal(x, y, z, h, c, (random.uniform(-0.2, 0.2), random.uniform(-0.2, 0.2)))

@asset
def shrine_portal():   # アーチの なかの ひかる めん
    B.rbox(2.3, 0.05, 3.3, 0, -2.0, 1.85, '#ffffff', bev=0.0, noise_amt=0.0)

for fn in ASSETS:
    if only and fn.__name__ not in only: continue
    B.start(out); fn(); B.build(fn.__name__, ground=False)   # ちめんを z=0 に そろえる(うめた いわが ういてしまわない ように)

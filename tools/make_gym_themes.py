"""ジムごとの せんようパーツ(かべ12・かざり12)を Blender で つくる。フルカラーの 頂点カラー(ゲームでは いろを かけない)。
使い方: blender -b -P tools/make_gym_themes.py -- docs/assets/gym [なまえ ...]
かべ: gym_wall_<key>  1マス(2x2)、たかさ 2.6。ゲームでは たかさを 0.6ばいに つぶして つかう(上から みても みやすい)
かざり: gym_deco_<key>  へやの まわり・ボスの へやの かどに おく おおきな かざり(あしもとが 原点)
"""
import bpy, sys, math, random
sys.path.insert(0, __file__.rsplit('tools', 1)[0] + 'tools')
import blib as B

out = sys.argv[sys.argv.index('--') + 1]
only = sys.argv[sys.argv.index('--') + 2:]
ASSETS = []
def asset(fn): ASSETS.append(fn); return fn

def ring(r, z, th, col, seg=28, tilt=(0, 0), **kw):
    pts = []
    for i in range(seg + 1):
        a = i / seg * 6.2832; x, y = math.cos(a) * r, math.sin(a) * r
        pts.append((x, y * math.cos(tilt[0]), z + y * math.sin(tilt[0])))
    return B.tube(pts, th, th, col, seg=8, **kw)

def base_block(col, h=2.5, bev=0.06, **kw):
    return B.rbox(1.96, 1.96, h, 0, 0, h / 2, col, bev=bev, **kw)

# =====================================================================  かべ
@asset
def gym_wall_forest():   # いけがき
    random.seed(1)
    B.rbox(1.9, 1.9, 0.5, 0, 0, 0.25, '#6b4b2a', bev=0.05, noise_amt=0.15)   # したの つち・きの わく
    for k in range(34):
        x, y = random.uniform(-0.8, 0.8), random.uniform(-0.8, 0.8); z = random.uniform(0.55, 2.3)
        g = random.choice(['#3e8a3a', '#4f9c44', '#35762f', '#5aa64a', '#2f6a2c'])
        B.sph(random.uniform(0.34, 0.55), x, y, z, g, scale=(1, 1, 0.85), seg=10, ring=7, noise_amt=0.16, freq=3.0)
    for k in range(10):   # はな
        a = random.uniform(0, 6.28); r = random.uniform(0.7, 0.98); B.sph(0.07, math.cos(a) * r, math.sin(a) * r, random.uniform(0.9, 2.2), random.choice(['#ffd1e8', '#fff3a0', '#ffffff']), seg=6, ring=4, noise_amt=0.0)
    for sx in (-1, 1):
        for sy in (-1, 1): B.rbox(0.2, 0.2, 2.7, sx * 0.92, sy * 0.92, 1.35, '#7a5530', bev=0.04, noise_amt=0.14)

@asset
def gym_wall_lake():   # こおりの ブロック
    random.seed(2)
    for k in range(4):
        z = 0.35 + k * 0.62; B.rbox(1.94 - k * 0.03, 1.94 - k * 0.03, 0.58, random.uniform(-0.03, 0.03), random.uniform(-0.03, 0.03), z, random.choice(['#a9d9f2', '#bfe6f8', '#9fd0ec']), bev=0.1, jit=0.02, noise_amt=0.12, freq=1.7, glow=0.03)
    B.rbox(2.0, 2.0, 0.1, 0, 0, 2.68, '#f2fbff', bev=0.05, noise_amt=0.04, glow=0.08)   # ゆきの ふた
    for k in range(10):   # つらら
        x, y = random.uniform(-0.85, 0.85), random.choice([-1, 1]) * 0.99; B.cyl(random.uniform(0.07, 0.13), random.uniform(0.4, 0.9), x, y, 2.3, '#d8f2ff', seg=6, r2=0.0, noise_amt=0.03, glow=0.06)
    for k in range(8):   # しもの けっしょう
        B.cyl(0.1, random.uniform(0.3, 0.6), random.uniform(-0.8, 0.8), random.uniform(-0.8, 0.8), 2.85, '#ffffff', seg=5, r2=0.0, noise_amt=0.02, glow=0.1)

@asset
def gym_wall_volcano():   # げんぶがんの はしら
    random.seed(3)
    for k in range(7):
        a = k / 7 * 6.28; r = 0.62 if k else 0.0; x, y = math.cos(a) * r, math.sin(a) * r; h = random.uniform(2.1, 2.7)
        B.cyl(0.38, h, x, y, h / 2, random.choice(['#3a3436', '#463e40', '#2f2a2c']), seg=6, noise_amt=0.14, freq=3.0)
        B.cyl(0.3, 0.06, x, y, h + 0.03, '#ff7a22', seg=6, noise_amt=0.1, glow=0.35)   # さきが あかい
    B.rbox(1.96, 1.96, 0.3, 0, 0, 0.15, '#2a2426', bev=0.06, noise_amt=0.1)
    for k in range(8):   # われめの ひかり
        a = random.uniform(0, 6.28); B.rbox(0.06, 0.5, 0.05, math.cos(a) * 0.8, math.sin(a) * 0.8, random.uniform(0.5, 2.0), '#ff8a2a', bev=0.0, rot=(0, 0, a), noise_amt=0.05, glow=0.4)

@asset
def gym_wall_ghost():   # はかばの へい(はかいしが うまっている)
    random.seed(4)
    for k in range(4): B.rbox(1.96, 1.96, 0.6, 0, 0, 0.3 + k * 0.58, random.choice(['#55526e', '#4b4864', '#605c7c']), bev=0.06, jit=0.015, noise_amt=0.1, freq=2.0)
    for s in (-1, 1):   # アーチの はかいし
        for k, x in enumerate((-0.45, 0.45)):
            B.rbox(0.62, 0.16, 1.1, x, s * 1.0, 1.45, '#7a7898', bev=0.07, noise_amt=0.08)
            B.cyl(0.31, 0.16, x, s * 1.0, 2.0, '#7a7898', seg=14, rot=(1.5708, 0, 0), noise_amt=0.06)
            B.rbox(0.08, 0.05, 0.5, x, s * 1.09, 1.55, '#4a4864', bev=0.0, noise_amt=0.03); B.rbox(0.36, 0.05, 0.08, x, s * 1.09, 1.7, '#4a4864', bev=0.0, noise_amt=0.03)
    B.rbox(2.04, 2.04, 0.14, 0, 0, 2.66, '#3c3a52', bev=0.05, noise_amt=0.06)
    for k in range(6):   # こけ・おにび
        B.sph(random.uniform(0.1, 0.2), random.uniform(-0.8, 0.8), random.uniform(-0.8, 0.8), 2.75, '#9ad8ff', seg=8, ring=6, noise_amt=0.0, glow=0.25)

@asset
def gym_wall_sky():   # くもの かべ
    random.seed(5)
    B.rbox(1.9, 1.9, 0.35, 0, 0, 0.18, '#f4f6ff', bev=0.1, noise_amt=0.05)
    for k in range(30):
        x, y = random.uniform(-0.75, 0.75), random.uniform(-0.75, 0.75); z = random.uniform(0.5, 2.4)
        B.sph(random.uniform(0.33, 0.52), x, y, z, random.choice(['#ffffff', '#f2f6ff', '#e6eeff']), scale=(1, 1, 0.8), seg=10, ring=7, noise_amt=0.05, freq=2.5)
    ring(0.95, 2.2, 0.06, '#ffe08a', seg=24, noise_amt=0.0, glow=0.1)   # きんの わっか
    for sx in (-1, 1):
        for sy in (-1, 1): B.sph(0.1, sx * 0.9, sy * 0.9, 2.65, '#ffe08a', seg=8, ring=6, noise_amt=0.0, glow=0.2)

@asset
def gym_wall_sun():   # さがんがんの いしづみ(たいようの レリーフ)
    random.seed(6)
    for k in range(5): B.rbox(1.96, 1.96, 0.5, 0, 0, 0.25 + k * 0.5, random.choice(['#d9ab62', '#e0b46e', '#cfa05a']), bev=0.06, jit=0.012, noise_amt=0.1, freq=2.0)
    for s in (-1, 1):
        B.cyl(0.5, 0.1, 0, s * 0.98, 1.4, '#ffd24f', seg=24, rot=(1.5708, 0, 0), noise_amt=0.03, glow=0.1)   # たいよう
        B.cyl(0.32, 0.12, 0, s * 0.99, 1.4, '#e6a53a', seg=24, rot=(1.5708, 0, 0), noise_amt=0.03)
        for k in range(12):
            a = k / 12 * 6.28; B.rbox(0.28, 0.1, 0.07, math.cos(a) * 0.68, s * 0.99, 1.4 + math.sin(a) * 0.68, '#ffd24f', bev=0.01, rot=(0, -a, 0), noise_amt=0.0, glow=0.1)
    B.rbox(2.06, 2.06, 0.14, 0, 0, 2.58, '#b88246', bev=0.05, noise_amt=0.06)

@asset
def gym_wall_cosmos():   # ほしの かけらを ふくむ くろい かべ
    random.seed(7)
    for k in range(4): B.rbox(1.96, 1.96, 0.6, 0, 0, 0.3 + k * 0.58, random.choice(['#2c3a78', '#34448a', '#26326c']), bev=0.07, jit=0.015, noise_amt=0.1, freq=2.0)
    for k in range(18):   # けっしょう
        a = random.uniform(0, 6.28); r = random.uniform(0.2, 1.0); B.cyl(random.uniform(0.07, 0.14), random.uniform(0.35, 0.9), math.cos(a) * r, math.sin(a) * r, 2.45, random.choice(['#8ad0ff', '#c0e4ff', '#a8b8ff']), seg=5, r2=0.0, rot=(random.uniform(-0.3, 0.3), random.uniform(-0.3, 0.3), 0), noise_amt=0.03, glow=0.25)
    for k in range(10):
        B.sph(0.05, random.uniform(-0.95, 0.95), random.choice([-1, 1]) * 0.99, random.uniform(0.5, 2.2), '#ffffff', seg=6, ring=4, noise_amt=0.0, glow=0.3)   # ほし

@asset
def gym_wall_grove():   # こけむした いしと つた
    random.seed(8)
    for k in range(4): B.rbox(1.96, 1.96, 0.6, 0, 0, 0.3 + k * 0.58, random.choice(['#7a8a72', '#6c7c64', '#84947a']), bev=0.06, jit=0.015, noise_amt=0.12, freq=2.0, moss=('#3f8a3a', 2.3))
    for k in range(7):   # つる
        x = random.uniform(-0.9, 0.9); s = random.choice([-1, 1]); pts = [(x + 0.06 * math.sin(i), s * 1.0, 2.6 - i * 0.3) for i in range(8)]
        B.tube(pts, 0.05, 0.03, '#2f7a30', seg=6, noise_amt=0.1)
        for j in range(5): B.leaf(0.28, 0.16, x + 0.05 * j, s * 1.04, 2.5 - j * 0.4, '#4cae48', rot=(1.2, 0, random.uniform(-1, 1)), noise_amt=0.1)
    B.rbox(2.04, 2.04, 0.14, 0, 0, 2.66, '#4f7a42', bev=0.05, noise_amt=0.1)
    for k in range(5):
        a = random.uniform(0, 6.28); B.cyl(0.05, 0.22, math.cos(a) * 0.8, math.sin(a) * 0.8, 2.78, '#f5ecd8', seg=8, noise_amt=0.03); B.sph(0.14, math.cos(a) * 0.8, math.sin(a) * 0.8, 2.95, random.choice(['#e2563e', '#f0a040']), scale=(1, 1, 0.55), seg=10, ring=6, noise_amt=0.05)

@asset
def gym_wall_castle():   # くろい じょうへき(さきの とがった とう)
    random.seed(9)
    for k in range(5): B.rbox(1.96, 1.96, 0.5, 0, 0, 0.25 + k * 0.5, random.choice(['#3e364e', '#463e58', '#352e44']), bev=0.05, jit=0.012, noise_amt=0.1, freq=2.0)
    for sx in (-1, 0, 1):
        for sy in (-1, 1): B.rbox(0.3, 0.3, 0.4, sx * 0.72, sy * 0.8, 2.7, '#2a243a', bev=0.04, noise_amt=0.06)   # ぎざぎざ
    for sx in (-1, 1):
        B.cyl(0.14, 0.7, sx * 0.9, 0.9, 3.0, '#7a6ca0', seg=6, r2=0.0, noise_amt=0.05)   # とがった さき
    B.rbox(0.5, 0.04, 1.3, 0, 1.0, 1.4, '#7a2a6a', bev=0.0, noise_amt=0.05); B.rbox(0.5, 0.04, 1.3, 0, -1.0, 1.4, '#7a2a6a', bev=0.0, noise_amt=0.05)   # のぼり
    for s in (-1, 1): B.cyl(0.1, 0.1, 0, s * 1.02, 1.0, '#c898ff', seg=10, rot=(1.5708, 0, 0), noise_amt=0.0, glow=0.3)

@asset
def gym_wall_temple():   # ほしの だいりせき(きんの ほし)
    random.seed(10)
    for k in range(4): B.rbox(1.96, 1.96, 0.62, 0, 0, 0.31 + k * 0.6, random.choice(['#c4c8e4', '#ced2ee', '#bac0de']), bev=0.06, jit=0.01, noise_amt=0.06, freq=1.6)
    for s in (-1, 1):
        for k in range(5):   # ほし
            a = k * 1.2566 + 1.5708; b = a + 2.5133; x0, z0, x1, z1 = math.cos(a) * 0.5, 1.4 + math.sin(a) * 0.5, math.cos(b) * 0.5, 1.4 + math.sin(b) * 0.5
            B.rbox(math.hypot(x1 - x0, z1 - z0), 0.05, 0.06, (x0 + x1) / 2, s * 0.99, (z0 + z1) / 2, '#ffd86a', bev=0.0, rot=(0, -math.atan2(z1 - z0, x1 - x0), 0), noise_amt=0.0, glow=0.15)
    B.rbox(2.06, 2.06, 0.16, 0, 0, 2.62, '#8e96c4', bev=0.05, noise_amt=0.05)
    for sx in (-1, 1):
        for sy in (-1, 1): B.cyl(0.13, 2.5, sx * 0.9, sy * 0.9, 1.3, '#e0e4f6', seg=10, noise_amt=0.04)

@asset
def gym_wall_dragon():   # ひすいの うろこの かべ
    random.seed(11)
    B.rbox(1.9, 1.9, 2.4, 0, 0, 1.2, '#2a6a64', bev=0.08, noise_amt=0.1)
    for row in range(6):
        for k in range(8):
            for s in (-1, 1):
                x = -0.85 + k * 0.24 + (0.12 if row % 2 else 0); z = 0.3 + row * 0.4
                B.cyl(0.19, 0.08, x, s * 0.96, z, random.choice(['#3fa89c', '#4cbcae', '#35968a']), seg=12, rot=(1.5708, 0, 0), noise_amt=0.1, glow=0.04)
    for k in range(5):
        B.cyl(0.1, 0.5, -0.8 + k * 0.4, 0.8, 2.65, '#ffe08a', seg=6, r2=0.0, noise_amt=0.03, glow=0.1); B.cyl(0.1, 0.5, -0.8 + k * 0.4, -0.8, 2.65, '#ffe08a', seg=6, r2=0.0, noise_amt=0.03, glow=0.1)   # せびれの とげ
    B.rbox(2.04, 2.04, 0.12, 0, 0, 2.46, '#1f4f4a', bev=0.05, noise_amt=0.06)

@asset
def gym_wall_end():   # くろい ガラスの かべ(うかぶ かけら)
    random.seed(12)
    for k in range(4): B.rbox(1.96, 1.96, 0.62, 0, 0, 0.31 + k * 0.6, random.choice(['#4a2e78', '#3e2668', '#54388a']), bev=0.08, jit=0.02, noise_amt=0.12, freq=1.8, glow=0.02)
    for k in range(14):   # ルーンと かけら
        a = random.uniform(0, 6.28); B.rbox(0.07, 0.5, 0.06, math.cos(a) * 0.88, math.sin(a) * 0.88, random.uniform(0.4, 2.2), '#ff7aff', bev=0.0, rot=(0, 0, a), noise_amt=0.03, glow=0.45)
    for k in range(7):
        B.cyl(random.uniform(0.1, 0.18), random.uniform(0.5, 0.9), random.uniform(-0.7, 0.7), random.uniform(-0.7, 0.7), 2.9 + random.uniform(0, 0.3), random.choice(['#d8a8ff', '#ff9aff', '#a8c0ff']), seg=5, r2=0.0, rot=(random.uniform(-0.5, 0.5), random.uniform(-0.5, 0.5), 0), noise_amt=0.04, glow=0.3)

# =====================================================================  かざり
@asset
def gym_deco_forest():   # おおきな き
    random.seed(21)
    B.tube([(0, 0, 0), (0.1, 0, 1.4), (-0.1, 0.1, 2.8), (0, 0, 3.8)], 0.55, 0.28, '#6e4a2a', seg=10, noise_amt=0.14)
    for k in range(18):
        a = random.uniform(0, 6.28); r = random.uniform(0.2, 1.8); B.sph(random.uniform(0.7, 1.2), math.cos(a) * r, math.sin(a) * r, random.uniform(3.4, 5.2), random.choice(['#3e8a3a', '#4f9c44', '#35762f', '#5aa64a']), scale=(1, 1, 0.85), seg=10, ring=7, noise_amt=0.16)
@asset
def gym_deco_lake():   # こおりの けっしょう
    random.seed(22)
    for k in range(9):
        a = k / 9 * 6.28 + random.uniform(-0.3, 0.3); r = random.uniform(0.2, 1.0); h = random.uniform(1.5, 4.2) if k else 4.8
        B.cyl(random.uniform(0.3, 0.5), h, math.cos(a) * r, math.sin(a) * r, h / 2, random.choice(['#a8dcf5', '#c4ecff', '#8cc8ea']), seg=6, r2=0.04, rot=(random.uniform(-0.15, 0.15), random.uniform(-0.15, 0.15), 0), noise_amt=0.08, glow=0.08)
    B.rock(1.0, 0, 0, 0.2, '#dff4ff', scale=(1.3, 1.3, 0.4), noise_amt=0.05, glow=0.1)
@asset
def gym_deco_volcano():   # ふんかする かざん
    random.seed(23)
    B.cyl(1.7, 3.0, 0, 0, 1.5, '#3a3032', seg=9, r2=0.55, noise_amt=0.16, freq=2.4)
    for k in range(6):
        a = k / 6 * 6.28; B.rock(random.uniform(0.35, 0.6), math.cos(a) * 1.4, math.sin(a) * 1.4, 0.35, '#463a3c', scale=(1, 1, 0.8), rough=0.3, seed=k, noise_amt=0.14)
    ring(0.6, 3.02, 0.14, '#ff8a2a', seg=18, noise_amt=0.1, glow=0.4)
    B.cyl(0.55, 0.12, 0, 0, 3.0, '#ffb03a', seg=16, noise_amt=0.1, glow=0.5)
    for k in range(7):
        a = k / 7 * 6.28 + 0.3; B.tube([(math.cos(a) * 0.62, math.sin(a) * 0.62, 3.0), (math.cos(a) * 1.0, math.sin(a) * 1.0, 1.9), (math.cos(a) * 1.5, math.sin(a) * 1.5, 0.5)], 0.1, 0.06, '#ff8a2a', seg=6, noise_amt=0.06, glow=0.45)
    for k in range(6):
        B.sph(random.uniform(0.08, 0.16), random.uniform(-0.5, 0.5), random.uniform(-0.5, 0.5), 3.7 + random.uniform(0, 1.3), '#ffb03a', seg=8, ring=6, noise_amt=0.0, glow=0.5)
@asset
def gym_deco_ghost():   # かれき と ちょうちん
    random.seed(24)
    B.tube([(0, 0, 0), (0.2, 0, 1.2), (-0.2, 0.1, 2.4), (0.1, 0, 3.4)], 0.4, 0.14, '#2a2638', seg=8, noise_amt=0.1)
    for a, z, L in [(0.4, 2.2, 1.4), (-0.6, 2.8, 1.2), (1.0, 1.6, 1.0), (3.4, 2.5, 1.3), (2.6, 3.0, 0.9)]:
        B.tube([(0, 0, z), (math.cos(a) * L * 0.5, math.sin(a) * L * 0.5, z + 0.4), (math.cos(a) * L, math.sin(a) * L, z + 0.5)], 0.1, 0.03, '#2a2638', seg=6, noise_amt=0.1)
    B.cyl(0.02, 0.8, 1.2, 0.7, 2.4, '#4a4660', seg=5, noise_amt=0.0); B.sph(0.28, 1.2, 0.7, 1.8, '#9ad8ff', scale=(1, 1, 1.2), seg=10, ring=8, noise_amt=0.0, glow=0.35)
@asset
def gym_deco_sky():   # くもの はしら
    random.seed(25)
    for k in range(7):
        B.sph(random.uniform(0.7, 1.1), random.uniform(-0.5, 0.5), random.uniform(-0.5, 0.5), 0.8 + k * 0.5, random.choice(['#ffffff', '#f2f6ff']), scale=(1, 1, 0.8), seg=10, ring=7, noise_amt=0.05)
    for z in (2.0, 3.2): ring(1.2, z, 0.07, '#ffe08a', seg=28, noise_amt=0.0, glow=0.1)
    B.sph(0.3, 0, 0, 4.4, '#fff3a0', seg=12, ring=8, noise_amt=0.0, glow=0.3)
@asset
def gym_deco_sun():   # たいようの オベリスク
    B.rbox(1.1, 1.1, 0.5, 0, 0, 0.25, '#b88246', bev=0.06, noise_amt=0.08)
    B.cyl(0.55, 3.4, 0, 0, 2.2, '#e6b86a', seg=4, r2=0.3, rot=(0, 0, 0.785), noise_amt=0.08)
    B.cyl(0.3, 0.7, 0, 0, 4.2, '#ffd24f', seg=4, r2=0.0, rot=(0, 0, 0.785), noise_amt=0.03, glow=0.2)
    B.cyl(0.7, 0.12, 0, -0.35, 3.0, '#ffd24f', seg=26, rot=(1.5708, 0, 0), noise_amt=0.03, glow=0.2)
@asset
def gym_deco_cosmos():   # わくせい
    B.cyl(0.4, 1.4, 0, 0, 0.7, '#3e4e90', seg=8, r2=0.2, noise_amt=0.1)
    B.sph(1.0, 0, 0, 2.5, '#5a78d8', seg=18, ring=12, noise_amt=0.12, glow=0.05)
    ring(1.7, 2.5, 0.09, '#8ad0ff', seg=34, tilt=(0.45, 0), noise_amt=0.0, glow=0.25)
    B.sph(0.22, 1.9, 0, 3.2, '#c0e4ff', seg=10, ring=8, noise_amt=0.0, glow=0.3)
@asset
def gym_deco_grove():   # おおきな きのこ
    random.seed(26)
    for (x, y, s) in [(0, 0, 1.0), (1.2, 0.4, 0.55), (-1.0, 0.5, 0.45)]:
        B.cyl(0.35 * s, 2.0 * s, x, y, 1.0 * s, '#f1e8d2', seg=10, noise_amt=0.06)
        B.sph(1.3 * s, x, y, 2.1 * s, '#c8453a', scale=(1, 1, 0.55), seg=14, ring=8, noise_amt=0.08)
        for k in range(7):
            a = random.uniform(0, 6.28); r = random.uniform(0.2, 1.0) * s; B.sph(0.14 * s, x + math.cos(a) * r, y + math.sin(a) * r, 2.1 * s + 0.55 * s * math.sqrt(max(0, 1 - (r / (1.3 * s)) ** 2)), '#ffffff', seg=6, ring=4, noise_amt=0.0)
@asset
def gym_deco_castle():   # ゴシックの とう
    B.cyl(0.9, 3.6, 0, 0, 1.8, '#3e364e', seg=10, noise_amt=0.1)
    B.cyl(1.15, 0.3, 0, 0, 3.7, '#2a243a', seg=10, noise_amt=0.06)
    B.cyl(1.0, 2.2, 0, 0, 4.95, '#4a3e5e', seg=10, r2=0.0, noise_amt=0.08)
    for k in range(4):
        a = k * 1.5708; B.rbox(0.28, 0.1, 0.6, math.cos(a) * 0.9, math.sin(a) * 0.9, 2.4, '#c898ff', bev=0.02, rot=(0, 0, a), noise_amt=0.0, glow=0.3)
@asset
def gym_deco_temple():   # てんたいぎ
    B.rbox(1.0, 1.0, 0.4, 0, 0, 0.2, '#c4c8e4', bev=0.06, noise_amt=0.05)
    B.cyl(0.14, 2.4, 0, 0, 1.6, '#e0e4f6', seg=10, noise_amt=0.04)
    for tilt, r, col in ((0.0, 1.5, '#ffd86a'), (1.1, 1.5, '#ffe9a0'), (0.55, 1.15, '#ffd86a')):
        ring(r, 2.5, 0.07, col, seg=30, tilt=(tilt, 0), noise_amt=0.0, glow=0.15)
    B.sph(0.32, 0, 0, 2.5, '#8ad0ff', seg=12, ring=8, noise_amt=0.0, glow=0.3)
@asset
def gym_deco_dragon():   # とぐろを まく りゅうの はしら
    random.seed(33)
    pts = [(math.cos(t * 0.8) * (1.15 - t * 0.045), math.sin(t * 0.8) * (1.15 - t * 0.045), 0.25 + t * 0.34) for t in [i * 0.3 for i in range(34)]]
    B.tube(pts, 0.36, 0.14, '#3fa89c', seg=10, noise_amt=0.1, glow=0.03)
    for i in range(1, len(pts), 2):   # せびれ
        x, y, z = pts[i]; B.cyl(0.08, 0.32, x * 1.12, y * 1.12, z + 0.2, '#ffe08a', seg=5, r2=0.0, noise_amt=0.02, glow=0.1)
    hx, hy, hz = pts[-1]
    B.sph(0.3, hx, hy, hz + 0.12, '#4cbcae', scale=(1.5, 0.95, 0.9), seg=12, ring=8, noise_amt=0.06)
    B.sph(0.16, hx + 0.3, hy, hz + 0.03, '#35968a', scale=(1.3, 0.9, 0.7), seg=10, ring=6, noise_amt=0.06)
    for s2 in (-1, 1):
        B.cyl(0.07, 0.6, hx - 0.05, hy + s2 * 0.2, hz + 0.5, '#ffe08a', seg=6, r2=0.0, rot=(0, -0.5, 0), noise_amt=0.02, glow=0.12)
        B.sph(0.06, hx + 0.2, hy + s2 * 0.2, hz + 0.28, '#ffffff', seg=6, ring=4, noise_amt=0.0, glow=0.4)
        B.tube([(hx + 0.3, hy + s2 * 0.1, hz - 0.05), (hx + 0.7, hy + s2 * 0.3, hz - 0.2), (hx + 1.0, hy + s2 * 0.4, hz - 0.5)], 0.03, 0.015, '#e8d0a0', seg=5, noise_amt=0.0)   # ひげ
@asset
def gym_deco_end():   # うかぶ けっしょう
    random.seed(32)
    B.cyl(0.5, 3.8, 0, 0, 1.9, '#5a38a0', seg=6, r2=0.0, noise_amt=0.1, glow=0.1)
    for k in range(9):
        a = k / 9 * 6.28; B.cyl(random.uniform(0.15, 0.28), random.uniform(0.6, 1.2), math.cos(a) * 1.3, math.sin(a) * 1.3, 1.5 + random.uniform(0, 2.2), random.choice(['#d8a8ff', '#ff9aff', '#a8c0ff']), seg=5, r2=0.0, rot=(random.uniform(-0.4, 0.4), 0, random.uniform(0, 3)), noise_amt=0.04, glow=0.3)
    ring(1.4, 2.0, 0.05, '#ff9aff', seg=30, tilt=(0.9, 0), noise_amt=0.0, glow=0.4)

for fn in ASSETS:
    if only and fn.__name__ not in only: continue
    B.start(out); fn(); B.build(fn.__name__)

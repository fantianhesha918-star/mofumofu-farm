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
def gym_wall_forest():   # まるい いけがき(ぽんぽんの はっぱ・おおきな おはな)
    random.seed(1)
    B.rbox(1.9, 1.9, 0.5, 0, 0, 0.25, '#c99a5e', bev=0.16, bseg=3, noise_amt=0.05)   # きの うえきばち
    B.rbox(1.96, 1.96, 0.1, 0, 0, 0.5, '#e6bd82', bev=0.05, bseg=3, noise_amt=0.03)
    G = ['#3fae4a', '#52bf55', '#34a043', '#63cb5e']
    for k in range(16):
        a = k / 16 * 6.28 + random.uniform(-0.2, 0.2); r = random.choice([0.5, 0.62, 0.0]) if k > 3 else 0.0
        x, y = math.cos(a) * r * 1.2, math.sin(a) * r * 1.2; z = random.uniform(0.95, 2.05)
        B.sph(random.uniform(0.42, 0.58), x, y, z, random.choice(G), scale=(1, 1, 0.9), seg=12, ring=8, noise_amt=0.06, freq=2.5)
    for k in range(9):   # おおきな おはな(まんなかの きいろ)
        a = random.uniform(0, 6.28); r = random.uniform(0.55, 0.95); cx, cy, cz = math.cos(a) * r, math.sin(a) * r, random.uniform(1.0, 2.2)
        pc = random.choice(['#ffb8d4', '#fff0a0', '#ffffff', '#ffc8a0'])
        for q in range(5):
            b = q / 5 * 6.28; B.sph(0.065, cx + math.cos(b) * 0.09, cy + math.sin(b) * 0.09, cz, pc, seg=6, ring=4, noise_amt=0.0)
        B.sph(0.055, cx, cy, cz + 0.02, '#ffd23a', seg=6, ring=4, noise_amt=0.0)
    for sx in (-1, 1):
        for sy in (-1, 1): B.rbox(0.22, 0.22, 2.7, sx * 0.92, sy * 0.92, 1.35, '#d9a86a', bev=0.1, bseg=3, noise_amt=0.05)

@asset
def gym_wall_lake():   # マシュマロみたいな こおりの ブロック(ゆきの ぼうし・まるい つらら)
    random.seed(2)
    for k in range(3):
        z = 0.42 + k * 0.78; B.rbox(1.94 - k * 0.04, 1.94 - k * 0.04, 0.72, 0, 0, z, ['#bfe9fb', '#cdeffd', '#b2e0f6'][k], bev=0.22, bseg=3, noise_amt=0.05, freq=1.7, glow=0.03)
    B.rbox(2.04, 2.04, 0.3, 0, 0, 2.52, '#ffffff', bev=0.15, bseg=3, noise_amt=0.02, glow=0.06)   # ゆきの ぼうし
    for k in range(6):
        B.sph(random.uniform(0.2, 0.34), random.uniform(-0.75, 0.75), random.uniform(-0.75, 0.75), 2.72, '#ffffff', scale=(1, 1, 0.7), seg=10, ring=7, noise_amt=0.0, glow=0.06)
    for k in range(8):   # まるい つらら
        x, y = random.uniform(-0.8, 0.8), random.choice([-1, 1]) * 0.99; h = random.uniform(0.35, 0.7)
        B.cyl(0.11, h, x, y, 2.35 - h / 2 + 0.05, '#e4f8ff', seg=10, r2=0.03, noise_amt=0.0, glow=0.08, smooth=True); B.sph(0.05, x, y, 2.35 - h + 0.05, '#ffffff', seg=8, ring=6, noise_amt=0.0)
    for k in range(4):   # ゆきの けっしょう(ほし)
        B.sph(0.07, random.uniform(-0.7, 0.7), random.uniform(-0.7, 0.7), 2.9, '#e8fbff', seg=6, ring=4, noise_amt=0.0, glow=0.1)

@asset
def gym_wall_ghost():   # ふんわり むらさきの へい(かわいい おばけが のぞいている)
    random.seed(4)
    cols = ['#9a92d4', '#a89fe0', '#8f87c8']
    for k in range(3): B.rbox(1.96, 1.96, 0.78, 0, 0, 0.4 + k * 0.76, cols[k], bev=0.2, bseg=3, noise_amt=0.05, freq=2.0, glow=0.04)
    for s in (-1, 1):   # まるい はかいし
        for x in (-0.45, 0.45):
            B.rbox(0.6, 0.18, 0.9, x, s * 1.0, 1.3, '#c9c3ee', bev=0.1, bseg=3, noise_amt=0.03)
            B.cyl(0.3, 0.18, x, s * 1.0, 1.75, '#c9c3ee', seg=20, rot=(1.5708, 0, 0), noise_amt=0.03, smooth=True)
            B.rbox(0.08, 0.06, 0.4, x, s * 1.1, 1.4, '#8f87c8', bev=0.0, noise_amt=0.02); B.rbox(0.28, 0.06, 0.08, x, s * 1.1, 1.52, '#8f87c8', bev=0.0, noise_amt=0.02)
    B.rbox(2.04, 2.04, 0.2, 0, 0, 2.68, '#cfc8f2', bev=0.1, bseg=3, noise_amt=0.03, glow=0.04)
    # ちょこんと のっている ちいさな おばけ(しろい ふわふわ・ひとみ・ほっぺ)
    B.sph(0.34, 0, 0, 3.0, '#ffffff', scale=(1, 1, 1.15), seg=16, ring=12, noise_amt=0.0, glow=0.04)
    for sx in (-1, 1):
        B.sph(0.05, sx * 0.12, -0.3, 3.06, '#3a3060', seg=8, ring=6, noise_amt=0.0); B.sph(0.06, sx * 0.2, -0.28, 2.93, '#ffc0d8', scale=(1, 0.5, 0.8), seg=8, ring=6, noise_amt=0.0)
    for sx in (-1, 1): B.sph(0.12, sx * 0.3, 0, 2.78, '#ffffff', seg=10, ring=8, noise_amt=0.0)

def cute_block(cols, h=2.5, bev=0.2, glow=0.03, n=3):   # ぷっくり まるい ブロックを n だん つむ(うえほど ほんの すこし ほそい)
    z = 0; step = h / n
    for k in range(n):
        B.rbox(1.96 - k * 0.03, 1.96 - k * 0.03, step + 0.02, 0, 0, z + step / 2, cols[k % len(cols)], bev=bev, bseg=3, noise_amt=0.05, freq=2.0, glow=glow); z += step

def star5(r, x, y, z, col, thick=0.1, **kw):   # ふっくらした 5かくの ほし(よこたわる)
    B.cyl(r * 0.55, thick, x, y, z, col, seg=5, noise_amt=0.0, smooth=True, **kw)
    for k in range(5):
        a = k / 5 * 6.2832 + 1.5708; B.cyl(r * 0.3, thick, x + math.cos(a) * r * 0.55, y + math.sin(a) * r * 0.55, z, col, seg=10, r2=0.04, noise_amt=0.0, smooth=True, **kw)

@asset
def gym_wall_volcano():   # まるい けいしょく いわ(ぷっくり あかい あつい かざん)
    random.seed(3)
    cute_block(['#c98a72', '#d89a80', '#be7e68'], bev=0.22)
    B.rbox(2.02, 2.02, 0.22, 0, 0, 2.6, '#ff9a4a', bev=0.1, bseg=3, noise_amt=0.04, glow=0.2)   # あつい ふた
    for k in range(5):   # ぷくぷく マグマの あわ
        B.sph(random.uniform(0.16, 0.3), random.uniform(-0.7, 0.7), random.uniform(-0.7, 0.7), 2.78, '#ffd06a', scale=(1, 1, 0.8), seg=10, ring=7, noise_amt=0.0, glow=0.25)
    for k in range(6):   # わきから たれる マグマ
        x, y = random.uniform(-0.8, 0.8), random.choice([-1, 1]) * 0.99; h = random.uniform(0.4, 1.0)
        B.rbox(0.16, 0.06, h, x, y, 2.5 - h / 2, '#ff8a3a', bev=0.03, bseg=2, noise_amt=0.0, glow=0.25); B.sph(0.09, x, y, 2.5 - h, '#ffb050', seg=8, ring=6, noise_amt=0.0, glow=0.25)

@asset
def gym_wall_sky():   # もこもこの くも
    random.seed(5)
    B.rbox(1.9, 1.9, 0.5, 0, 0, 0.25, '#e4f2ff', bev=0.2, bseg=3, noise_amt=0.03)
    for k in range(15):
        a = k / 15 * 6.28; r = random.choice([0.0, 0.5, 0.65]) if k > 2 else 0.0; z = random.uniform(0.8, 2.2)
        B.sph(random.uniform(0.42, 0.6), math.cos(a) * r * 1.2, math.sin(a) * r * 1.2, z, random.choice(['#ffffff', '#f4faff', '#e8f4ff']), scale=(1, 1, 0.9), seg=12, ring=8, noise_amt=0.03, glow=0.05)
    star5(0.2, 0.0, -0.9, 2.4, '#ffe58a', thick=0.08, glow=0.1)   # ちいさな ほし
    for k in range(4): B.sph(0.07, random.uniform(-0.8, 0.8), random.uniform(-0.8, 0.8), 2.7 + random.uniform(0, 0.2), '#fff6c8', seg=6, ring=4, noise_amt=0.0, glow=0.1)

@asset
def gym_wall_sun():   # たいようの ブロック(おひさま もよう)
    random.seed(6)
    cute_block(['#ffd88a', '#ffe0a0', '#f7cc78'], bev=0.22)
    B.cyl(0.55, 0.16, 0, 0, 2.58, '#ffb830', seg=28, noise_amt=0.02, glow=0.1, smooth=True)
    B.cyl(0.42, 0.2, 0, 0, 2.62, '#ffe27a', seg=28, noise_amt=0.0, glow=0.12, smooth=True)
    for k in range(10):   # おひさまの ひかり
        a = k / 10 * 6.2832; B.cyl(0.09, 0.3, math.cos(a) * 0.78, math.sin(a) * 0.78, 2.6, '#ffb830', seg=8, r2=0.0, rot=(0, 1.5708, a), noise_amt=0.0, glow=0.08)
    for sx in (-1, 1): B.sph(0.05, sx * 0.14, -0.32, 2.74, '#a0522d', seg=6, ring=4, noise_amt=0.0)   # おめめ
    B.sph(0.06, 0, -0.38, 2.68, '#ff9a8a', scale=(2, 1, 0.6), seg=8, ring=6, noise_amt=0.0)

@asset
def gym_wall_cosmos():   # ほしぞらの ブロック(ほしと わくせい)
    random.seed(7)
    cute_block(['#7684d8', '#8896e4', '#6a78cc'], bev=0.22)
    B.sph(0.38, 0, 0, 2.95, '#ffb4d8', seg=16, ring=12, noise_amt=0.03, glow=0.08)   # わくせい
    ring_pts = [(math.cos(i / 24 * 6.2832) * 0.62, math.sin(i / 24 * 6.2832) * 0.62, 2.95 + math.sin(i / 24 * 6.2832) * 0.1) for i in range(25)]
    B.tube(ring_pts, 0.05, 0.05, '#ffe58a', seg=6, noise_amt=0.0, glow=0.1)
    for k in range(6): star5(0.13, random.uniform(-0.8, 0.8), random.uniform(-0.8, 0.8), 2.58, '#fff2a8', thick=0.06, glow=0.1)

@asset
def gym_wall_grove():   # しんじゅの かい(ぱかっと ひらいた かいがらと まるい しんじゅ)
    random.seed(8)
    cute_block(['#7cc4a4', '#8fd0b2', '#6bb898'], bev=0.22)
    for s in (-1, 1):   # かいがら(ホタテ)
        B.cyl(0.62, 0.14, 0, s * 0.18, 2.95, '#ffd6e4', seg=20, rot=(1.5708 + s * 0.5, 0, 0), noise_amt=0.02, smooth=True, glow=0.06)
        for k in range(-3, 4): B.rbox(0.05, 0.05, 0.55, k * 0.15, s * 0.3, 3.0, '#f0b4c8', bev=0.0, noise_amt=0.0)
    B.sph(0.22, 0, 0, 2.7, '#ffffff', seg=14, ring=10, noise_amt=0.0, glow=0.14)   # しんじゅ
    for k in range(5): B.sph(random.uniform(0.07, 0.12), random.uniform(-0.8, 0.8), random.uniform(-0.8, 0.8), 2.58, random.choice(['#ffffff', '#ffe8f0', '#e8fff4']), seg=8, ring=6, noise_amt=0.0, glow=0.08)

@asset
def gym_wall_castle():   # むらさきの おしろの へい(ぎざぎざの かざりと こうもり)
    random.seed(9)
    cute_block(['#9078b8', '#a088c8', '#8468ac'], bev=0.22)
    for k in range(4):   # ぎざぎざ
        B.rbox(0.38, 0.38, 0.4, -0.72 + k * 0.48, -0.78, 2.68, '#b8a0e0', bev=0.1, bseg=3, noise_amt=0.03)
        B.rbox(0.38, 0.38, 0.4, -0.72 + k * 0.48, 0.78, 2.68, '#b8a0e0', bev=0.1, bseg=3, noise_amt=0.03)
    B.sph(0.22, 0, 0, 2.85, '#4a3a6a', scale=(1, 0.9, 0.9), seg=12, ring=8, noise_amt=0.0)   # こうもり
    for s in (-1, 1):
        B.sph(0.2, s * 0.3, 0, 2.88, '#4a3a6a', scale=(1.3, 0.35, 0.8), seg=10, ring=6, noise_amt=0.0)
        B.cyl(0.06, 0.14, s * 0.1, -0.02, 3.08, '#4a3a6a', seg=6, r2=0.0, noise_amt=0.0)
        B.sph(0.04, s * 0.08, -0.2, 2.9, '#ffe27a', seg=6, ring=4, noise_amt=0.0, glow=0.2)

@asset
def gym_wall_temple():   # ほしの ブロック(きんの おおきな ほし)
    random.seed(10)
    cute_block(['#8a98e0', '#9aa8ec', '#7e8cd4'], bev=0.22)
    star5(0.62, 0, 0, 2.62, '#ffdc6a', thick=0.18, glow=0.1)
    for k in range(5): B.sph(random.uniform(0.06, 0.1), random.uniform(-0.85, 0.85), random.uniform(-0.85, 0.85), 2.55, '#fff4c0', seg=6, ring=4, noise_amt=0.0, glow=0.12)

@asset
def gym_wall_dragon():   # ひすいの うろこの ブロック(ちいさな つの)
    random.seed(11)
    cute_block(['#5cc2b0', '#6ed0be', '#4eb4a2'], bev=0.22)
    for r in range(3):   # うろこ
        for c in range(4): B.cyl(0.26, 0.08, -0.7 + c * 0.47 + (r % 2) * 0.2, -0.99, 0.5 + r * 0.7, '#8ae0d0', seg=14, rot=(1.5708, 0, 0), noise_amt=0.02, smooth=True)
    for s in (-1, 1): B.cyl(0.14, 0.55, s * 0.4, 0, 2.8, '#ffe6a0', seg=10, r2=0.02, rot=(0, s * 0.3, 0), noise_amt=0.0, smooth=True)
    B.sph(0.2, 0, -0.1, 2.62, '#ff9aa8', scale=(1, 1, 0.6), seg=10, ring=8, noise_amt=0.0)   # ほっぺの ほうせき

@asset
def gym_wall_end():   # むらさきの すいしょうの ブロック(ぷっくり けっしょう)
    random.seed(12)
    cute_block(['#9a78d4', '#aa88e0', '#8c6ac8'], bev=0.22)
    for k in range(6):
        x, y = random.uniform(-0.6, 0.6), random.uniform(-0.6, 0.6); h = random.uniform(0.5, 0.9)
        B.cyl(random.uniform(0.14, 0.2), h, x, y, 2.6 + h / 2, random.choice(['#e8c8ff', '#ffd0ec', '#d4c0ff']), seg=6, r2=0.04, rot=(random.uniform(-0.2, 0.2), random.uniform(-0.2, 0.2), 0), noise_amt=0.03, glow=0.12, smooth=True)
    for k in range(4): B.sph(0.06, random.uniform(-0.8, 0.8), random.uniform(-0.8, 0.8), 2.58, '#ffffff', seg=6, ring=4, noise_amt=0.0, glow=0.12)

# =====================================================================  かざり
def _leafy(x, y, z, r, cols, n=5, flat=0.88):   # ぽんぽんの はっぱの かたまり
    for k in range(n):
        a = k / n * 6.2832 + random.uniform(0, 1); rr = r * 0.55 if k else 0.0
        B.sph(r * random.uniform(0.75, 1.0), x + math.cos(a) * rr, y + math.sin(a) * rr, z + random.uniform(-0.1, 0.25) * r, random.choice(cols), scale=(1, 1, flat), seg=10, ring=7, noise_amt=0.05, freq=1.8)

@asset
def gym_deco_forest():   # おおきな まるい き(みの なる き)
    random.seed(21)
    B.tube([(0, 0, -0.1), (0.1, 0, 1.6), (-0.1, 0.1, 3.0)], 0.7, 0.42, '#c99a5e', seg=10, noise_amt=0.06)
    _leafy(0, 0, 4.6, 2.0, ['#6cc35c', '#7fcf6a', '#93dc78', '#5cb852'], n=6)
    for k in range(9):
        a = random.uniform(0, 6.28); d = random.uniform(0.8, 2.6)
        B.sph(0.2, math.cos(a) * d, math.sin(a) * d, random.uniform(3.8, 6.0), random.choice(['#ff7a8a', '#ffe27a', '#ffffff']), seg=6, ring=4, noise_amt=0.0)
    for k in range(3): B.rock(random.uniform(0.35, 0.6), random.uniform(-1.4, 1.4), random.uniform(-1.4, 1.4), 0.1, '#bdb8c8', scale=(1, 1, 0.6), rough=0.15, sub=1, seed=k, noise_amt=0.05, moss=('#86cf74', 0.4))

@asset
def gym_deco_lake():   # ゆきだるまと こおりの けっしょう
    random.seed(22)
    B.sph(1.1, 0, 0, 1.0, '#ffffff', seg=14, ring=10, noise_amt=0.02, glow=0.05); B.sph(0.8, 0, 0, 2.3, '#ffffff', seg=14, ring=10, noise_amt=0.02, glow=0.05); B.sph(0.55, 0, 0, 3.2, '#ffffff', seg=12, ring=9, noise_amt=0.02, glow=0.05)
    for sx in (-1, 1): B.sph(0.07, sx * 0.2, -0.5, 3.3, '#3a3a50', seg=6, ring=4, noise_amt=0.0)
    B.cyl(0.08, 0.35, 0, -0.55, 3.15, '#ff9a4a', seg=6, r2=0.0, rot=(1.5708, 0, 0), noise_amt=0.0)
    B.rbox(1.1, 1.1, 0.2, 0, -0.1, 2.75, '#ff8a9a', bev=0.08, bseg=3, noise_amt=0.0)   # マフラー
    B.cyl(0.4, 0.35, 0, 0, 3.75, '#4a4a68', seg=12, noise_amt=0.0, smooth=True); B.cyl(0.62, 0.08, 0, 0, 3.58, '#4a4a68', seg=12, noise_amt=0.0, smooth=True)   # ぼうし
    for (x, y, h, c) in [(2.0, 0.6, 2.4, '#c0e4ff'), (2.7, -0.3, 1.5, '#d8f0ff'), (-2.0, 0.8, 2.0, '#b8dcff'), (-2.6, -0.4, 1.3, '#e0f4ff')]:
        B.cyl(h * 0.22, h, x, y, h / 2, c, seg=6, r2=h * 0.04, rot=(random.uniform(-0.15, 0.15), random.uniform(-0.15, 0.15), 0), noise_amt=0.03, glow=0.12, smooth=True)

@asset
def gym_deco_volcano():   # ちいさな かざん(けむり つき)
    random.seed(23)
    B.cyl(2.8, 3.6, 0, 0, 1.8, '#c98a72', seg=14, r2=1.1, noise_amt=0.06, smooth=True)
    B.cyl(1.2, 0.3, 0, 0, 3.7, '#ff9a4a', seg=14, noise_amt=0.04, glow=0.25, smooth=True)
    for k in range(4): B.sph(random.uniform(0.2, 0.34), random.uniform(-0.6, 0.6), random.uniform(-0.6, 0.6), 3.95, '#ffd06a', scale=(1, 1, 0.8), seg=8, ring=6, noise_amt=0.0, glow=0.25)
    for k in range(5):
        B.rbox(0.28, 0.12, 1.8 - k * 0.1, math.cos(k * 1.3) * 1.5, math.sin(k * 1.3) * 1.5, 1.5, '#ff8a3a', bev=0.04, bseg=2, rot=(0, 0, k * 1.3 + 1.57), noise_amt=0.0, glow=0.2)
    for k, z in enumerate((4.9, 5.7, 6.4, 7.0)): B.sph(0.55 + k * 0.1, 0.1 * k, 0.0, z, '#f4eee8', seg=10, ring=8, noise_amt=0.03)   # けむり

@asset
def gym_deco_ghost():   # ちょうちんの き と ふわふわ おばけ
    random.seed(24)
    B.tube([(0, 0, -0.1), (0.2, 0, 1.4), (-0.1, 0, 2.8)], 0.5, 0.3, '#8a7aa8', seg=10, noise_amt=0.06)
    _leafy(0, 0, 4.0, 1.7, ['#a898d8', '#b8a8e8', '#9a88c8'], n=5)
    for k in range(4):
        a = k / 4 * 6.28 + 0.5; B.sph(0.25, math.cos(a) * 1.4, math.sin(a) * 1.4, 3.4, '#ffe9a0', seg=8, ring=6, noise_amt=0.0, glow=0.4)   # ちょうちん
    B.sph(0.7, 1.8, -1.6, 3.4, '#ffffff', scale=(1, 1, 1.15), seg=14, ring=10, noise_amt=0.0, glow=0.06)   # おばけ
    for sx in (-1, 1): B.sph(0.09, 1.8 + sx * 0.2, -2.2, 3.5, '#3a3060', seg=6, ring=4, noise_amt=0.0)
    for sx in (-1, 1): B.sph(0.2, 1.8 + sx * 0.5, -1.6, 2.95, '#ffffff', seg=8, ring=6, noise_amt=0.0)

@asset
def gym_deco_sky():   # くもの ちゅう と にじ
    random.seed(25)
    for k, (z, r) in enumerate(((0.9, 1.5), (2.2, 1.3), (3.4, 1.1), (4.4, 0.9))):
        B.sph(r, 0.1 * k, 0, z, '#ffffff', scale=(1, 1, 0.85), seg=12, ring=8, noise_amt=0.03, glow=0.05)
        for j in range(3): B.sph(r * 0.6, math.cos(j * 2.1 + k) * r * 0.8, math.sin(j * 2.1 + k) * r * 0.8, z - 0.1, '#f4faff', seg=10, ring=7, noise_amt=0.03)
    for i, c in enumerate(['#ff9a9a', '#ffd08a', '#fff09a', '#9ae8a8', '#9ac8ff']):
        pts = [(2.0 * math.cos(t * math.pi) * (1 - i * 0.07), 0.0, 1.0 + 3.2 * math.sin(t * math.pi) * (1 - i * 0.07)) for t in [j / 16 for j in range(17)]]
        B.tube(pts, 0.14, 0.14, c, seg=6, noise_amt=0.0, glow=0.08)

@asset
def gym_deco_sun():   # おおきな ひまわり
    random.seed(26)
    B.tube([(0, 0, -0.1), (0.1, 0, 2.0), (0, 0.15, 4.0)], 0.2, 0.14, '#6cc35c', seg=8, noise_amt=0.03)
    for s in (-1, 1): B.leaf(1.1, 0.5, 0.05, 0, 1.4, '#7fcf6a', rot=(0, 0, s * 1.4), bend=0.4, noise_amt=0.03)
    for k in range(14):
        a = k / 14 * 6.2832; B.sph(0.45, math.cos(a) * 1.15, -0.2, 4.3 + math.sin(a) * 1.15, '#ffd83a', scale=(1, 0.5, 1.5), seg=8, ring=6, noise_amt=0.02, glow=0.1)
    B.cyl(0.85, 0.35, 0, -0.15, 4.3, '#8a5a30', seg=20, rot=(1.5708, 0, 0), noise_amt=0.04, smooth=True)
    for sx in (-1, 1): B.sph(0.07, sx * 0.25, -0.38, 4.45, '#2a1a10', seg=6, ring=4, noise_amt=0.0)

@asset
def gym_deco_cosmos():   # わくせい と ほし
    random.seed(27)
    B.sph(1.6, 0, 0, 3.0, '#ffb4d8', seg=18, ring=14, noise_amt=0.03, glow=0.08)
    pts = [(math.cos(i / 32 * 6.2832) * 2.7, math.sin(i / 32 * 6.2832) * 2.7, 3.0 + math.sin(i / 32 * 6.2832) * 0.6) for i in range(33)]
    B.tube(pts, 0.14, 0.14, '#ffe58a', seg=8, noise_amt=0.0, glow=0.1)
    B.sph(0.4, 2.4, 0.5, 4.6, '#b4d8ff', seg=10, ring=8, noise_amt=0.0, glow=0.1)
    for k in range(5):
        a = k / 5 * 6.2832; B.cyl(0.3, 0.12, math.cos(a) * 2.6, math.sin(a) * 2.6, 5.4 + (k % 2) * 0.6, '#fff2a8', seg=5, noise_amt=0.0, glow=0.15, smooth=True)
    B.cyl(0.9, 1.0, 0, 0, 0.5, '#8896e4', seg=12, r2=0.6, noise_amt=0.04, smooth=True)

@asset
def gym_deco_grove():   # おおきな きのこ
    random.seed(28)
    for (x, y, s, c) in [(0, 0, 1.0, '#ff7a8a'), (1.9, -0.9, 0.6, '#ffc07a'), (-1.7, -0.7, 0.5, '#9ad0ff')]:
        B.cyl(0.45 * s, 3.0 * s, x, y, 1.5 * s, '#fff2e0', seg=14, r2=0.35 * s, noise_amt=0.03, smooth=True)
        B.sph(1.7 * s, x, y, 3.1 * s, c, scale=(1, 1, 0.7), seg=16, ring=10, noise_amt=0.03, glow=0.05)
        for k in range(7):
            a = random.uniform(0, 6.28); d = random.uniform(0.3, 1.3) * s; B.sph(0.22 * s, x + math.cos(a) * d, y + math.sin(a) * d, 3.1 * s + 1.1 * s * math.sqrt(max(0.0, 1 - (d / (1.7 * s)) ** 2)) * 0.7, '#ffffff', scale=(1, 1, 0.5), seg=6, ring=4, noise_amt=0.0)

@asset
def gym_deco_castle():   # まるい むらさきの とう(こうもり)
    random.seed(29)
    B.cyl(1.4, 5.0, 0, 0, 2.5, '#a088c8', seg=24, noise_amt=0.04, smooth=True)
    B.cyl(1.6, 0.4, 0, 0, 5.1, '#c0a8e8', seg=24, noise_amt=0.03, smooth=True)
    B.cyl(1.8, 2.4, 0, 0, 6.5, '#7a58b0', seg=24, r2=0.1, noise_amt=0.04, smooth=True)
    B.sph(0.25, 0, 0, 7.9, '#ffd45a', seg=10, ring=8, noise_amt=0.0, glow=0.1)
    for z in (2.0, 3.6): B.rbox(0.6, 0.3, 0.9, 0, -1.35, z, '#ffe9a0', bev=0.12, bseg=3, noise_amt=0.0, glow=0.3)
    B.sph(0.3, 1.8, 0.2, 5.2, '#4a3a6a', scale=(1, 0.9, 0.9), seg=10, ring=8, noise_amt=0.0)
    for s in (-1, 1): B.sph(0.3, 1.8 + s * 0.45, 0.2, 5.25, '#4a3a6a', scale=(1.3, 0.35, 0.8), seg=8, ring=6, noise_amt=0.0)

@asset
def gym_deco_temple():   # ほしの ぞう(だいざの うえの ほし)
    random.seed(30)
    B.cyl(1.3, 0.6, 0, 0, 0.3, '#aab4e0', seg=20, noise_amt=0.03, smooth=True); B.cyl(0.9, 1.6, 0, 0, 1.4, '#bcc4ee', seg=20, r2=0.7, noise_amt=0.03, smooth=True)
    B.cyl(0.55, 0.3, 0, 0, 3.0, '#ffdc6a', seg=5, noise_amt=0.0, glow=0.12, smooth=True)
    for k in range(5):
        a = k / 5 * 6.2832 + 1.5708; B.cyl(0.3, 0.3, math.cos(a) * 0.55, math.sin(a) * 0.55, 3.0, '#ffdc6a', seg=10, r2=0.05, noise_amt=0.0, glow=0.12, smooth=True)
    for k in range(5):
        a = k / 5 * 6.2832; B.cyl(0.18, 0.1, math.cos(a) * 1.6, math.sin(a) * 1.6, 3.6 + (k % 2) * 0.7, '#fff4c0', seg=5, noise_amt=0.0, glow=0.15, smooth=True)

@asset
def gym_deco_dragon():   # とぐろを まく ちいさな りゅう
    random.seed(31)
    pts = [(math.cos(t * 6.0) * (1.4 - t * 0.5), math.sin(t * 6.0) * (1.4 - t * 0.5), 0.5 + t * 3.6) for t in [i / 40 for i in range(41)]]
    B.tube(pts, 0.55, 0.3, '#5cc2b0', seg=10, noise_amt=0.04)
    hx, hy, hz = pts[-1]
    B.sph(0.7, hx, hy, hz + 0.3, '#6ed0be', scale=(1, 1.2, 0.9), seg=14, ring=10, noise_amt=0.03)
    for s in (-1, 1):
        B.sph(0.12, hx + s * 0.32, hy - 0.62, hz + 0.45, '#ffffff', seg=8, ring=6, noise_amt=0.0); B.sph(0.06, hx + s * 0.32, hy - 0.7, hz + 0.45, '#2a2a40', seg=6, ring=4, noise_amt=0.0)
        B.cyl(0.12, 0.5, hx + s * 0.35, hy, hz + 0.9, '#ffe6a0', seg=8, r2=0.02, rot=(0, s * 0.4, 0), noise_amt=0.0, smooth=True)
    B.sph(0.18, hx, hy - 0.8, hz + 0.1, '#ff9aa8', seg=8, ring=6, noise_amt=0.0)

@asset
def gym_deco_end():   # にじいろの けっしょう
    random.seed(32)
    B.rock(1.3, 0, 0, 0.5, '#9a78d4', scale=(1, 1, 0.55), rough=0.14, sub=2, seed=4, noise_amt=0.05)
    for (x, y, h, c) in [(0, 0, 4.2, '#e8c8ff'), (-1.0, 0.4, 3.0, '#ffc0e0'), (1.1, -0.3, 3.4, '#c0d4ff'), (0.4, 1.0, 2.2, '#ffe9a0'), (-0.6, -1.0, 2.6, '#c0f0ff'), (1.8, 0.9, 1.6, '#ffd0ec')]:
        B.cyl(h * 0.17, h, x, y, 0.7 + h / 2, c, seg=6, r2=h * 0.02, rot=(random.uniform(-0.15, 0.15), random.uniform(-0.15, 0.15), 0), noise_amt=0.03, glow=0.16, smooth=True)

@asset
def gym_wall_shrine():   # ほこらの なかの いわかべ(まるい いわ+けっしょう)
    random.seed(31)
    cute_block(['#9d96b8', '#aaa3c6', '#8e87aa'], bev=0.22)
    for k in range(5):
        x, y = random.uniform(-0.7, 0.7), random.uniform(-0.7, 0.7); h = random.uniform(0.4, 0.8)
        B.cyl(random.uniform(0.13, 0.2), h, x, y, 2.55 + h / 2, random.choice(['#ffc0e0', '#c0d4ff', '#ffe9a0', '#c0f0ff']), seg=6, r2=0.03, rot=(random.uniform(-0.2, 0.2), random.uniform(-0.2, 0.2), 0), noise_amt=0.03, glow=0.14, smooth=True)
    for k in range(3):
        B.sph(random.uniform(0.15, 0.25), random.uniform(-0.8, 0.8), random.uniform(-0.8, 0.8), 2.6, '#8fd67a', scale=(1, 1, 0.6), seg=8, ring=6, noise_amt=0.0)

@asset
def gym_deco_shrine():   # ほこらの かざり(おおきな けっしょう の かたまり)
    random.seed(32)
    B.rock(1.1, 0, 0, 0.5, '#a39eb8', scale=(1, 1, 0.6), rough=0.14, sub=2, seed=3, noise_amt=0.05)
    for (x, y, h, c) in [(0, 0, 3.2, '#e8c8ff'), (-0.7, 0.3, 2.2, '#ffc0e0'), (0.8, -0.2, 2.6, '#c0d4ff'), (0.3, 0.7, 1.6, '#ffe9a0'), (-0.4, -0.7, 1.9, '#c0f0ff')]:
        B.cyl(h * 0.16, h, x, y, 0.6 + h / 2, c, seg=6, r2=h * 0.02, rot=(random.uniform(-0.15, 0.15), random.uniform(-0.15, 0.15), 0), noise_amt=0.03, glow=0.14, smooth=True)

for fn in ASSETS:
    if only and fn.__name__ not in only: continue
    B.start(out); fn(); B.build(fn.__name__)

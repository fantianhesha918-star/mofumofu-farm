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

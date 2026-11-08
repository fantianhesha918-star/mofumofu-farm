"""ジム(パズルの へや)の きょうつう パーツを Blender で つくる(頂点カラー・面取り・ノイズの いろむら)。
使い方: blender -b -P tools/make_gym_kit.py -- docs/assets [なまえ ...]   (なまえを わたすと それだけ つくる)
どれも 1マス = 2x2 の おおきさ。ゆかの うえが y=0 になるよう、あしもとが 原点(ゆかタイルだけ あつさ 0.34)。
あかるい ニュートラルな いろで つくり、ゲームの がわで テーマごとに いろを かけあわせる(InstancedMesh の instanceColor)。
"""
import bpy, sys, math, random
sys.path.insert(0, __file__.rsplit('tools', 1)[0] + 'tools')
import blib as B
from mathutils import Vector

out = sys.argv[sys.argv.index('--') + 1]
only = sys.argv[sys.argv.index('--') + 2:]

def asset(fn):
    ASSETS.append(fn); return fn
ASSETS = []

STONE = '#c6c9d1'; STONE2 = '#dcdee5'; STONE_D = '#a3a6b0'; STONE_DD = '#7d808b'

@asset
def gym_floor():   # かわいい ゆか(ふっくら まるい かど・ふかふかの うわ いた)。ほぼ しろ → テーマの いろが きれいに のる
    random.seed(11)
    B.rbox(1.96, 1.96, 0.34, 0, 0, 0.17, '#f1ebdf', bev=0.14, bseg=3, noise_amt=0.025, freq=1.6)
    B.rbox(1.62, 1.62, 0.07, 0, 0, 0.36, '#fffaf0', bev=0.07, bseg=3, noise_amt=0.02, freq=2.6)
    for sx in (-1, 1):
        for sy in (-1, 1):
            B.sph(0.075, sx * 0.72, sy * 0.72, 0.4, '#e6d7bd', scale=(1, 1, 0.6), seg=10, ring=6, noise_amt=0.02)   # かどの まるい びょう
    for k in range(3):   # ちいさな きらきらの てん
        B.sph(0.035, random.uniform(-0.5, 0.5), random.uniform(-0.5, 0.5), 0.41, '#ffffff', scale=(1, 1, 0.5), seg=6, ring=4, noise_amt=0.0, glow=0.05)

@asset
def gym_quiz_frame():   # クイズの とびらの わく(まるい アーチ・きんの かざり)。いろは そのまま(ゲームで いろを かけない)
    CREAM = '#f6e9cf'; GOLD = '#ffd45a'; PINK = '#ffb3c8'
    B.rbox(1.96, 0.5, 0.2, 0, 0, 0.1, '#e8d8b8', bev=0.08, bseg=3, noise_amt=0.02)   # しきい
    for s in (-1, 1):
        B.cyl(0.24, 1.95, s * 0.86, 0, 0.98, CREAM, seg=20, noise_amt=0.02, smooth=True)
        B.cyl(0.3, 0.2, s * 0.86, 0, 0.28, GOLD, seg=20, noise_amt=0.0, smooth=True); B.cyl(0.3, 0.2, s * 0.86, 0, 1.88, GOLD, seg=20, noise_amt=0.0, smooth=True)
        B.sph(0.2, s * 0.86, 0, 2.12, PINK, seg=14, ring=10, noise_amt=0.0)   # ピンクの たま
    pts = [(-0.86 * math.cos(t * math.pi), 0, 1.95 + 0.86 * math.sin(t * math.pi)) for t in [i / 16 for i in range(17)]]
    B.tube(pts, 0.2, 0.2, CREAM, seg=12, noise_amt=0.02)   # アーチ
    pts2 = [(-0.86 * math.cos(t * math.pi), -0.18, 1.95 + 0.86 * math.sin(t * math.pi)) for t in [i / 16 for i in range(17)]]
    B.tube(pts2, 0.07, 0.07, GOLD, seg=8, noise_amt=0.0)   # きんの ふち
    B.cyl(0.66, 0.1, 0, 0, 3.04, GOLD, seg=32, noise_amt=0.0, glow=0.04, smooth=True)   # うえから みえる 「?」メダル
    B.cyl(0.54, 0.12, 0, 0, 3.06, '#fff4bf', seg=32, noise_amt=0.0, glow=0.05, smooth=True)
    pts = [(0.23 * math.cos(math.radians(190 - i * 17)), 0.14 + 0.23 * math.sin(math.radians(190 - i * 17)), 3.15) for i in range(15)] + [(0.04, -0.12, 3.15), (0.0, -0.2, 3.15)]
    B.tube(pts, 0.07, 0.07, '#f0a020', seg=8, noise_amt=0.0)
    B.sph(0.085, 0, -0.38, 3.15, '#f0a020', seg=10, ring=8, noise_amt=0.0)
    for k in range(5):   # アーチの ほし
        a = (k + 0.5) / 5 * math.pi; B.sph(0.07, -math.cos(a) * 0.86, -0.22, 1.95 + math.sin(a) * 0.86, '#fff6c8', seg=8, ring=6, noise_amt=0.0, glow=0.08)

@asset
def gym_quiz_leaf():   # クイズの とびらの 戸(ひだりの ちょうつがいが げんてん)。「?」の メダルつき。ゲームで ひらく
    WOOD = '#f1c98a'; WOOD2 = '#e2b270'
    B.rbox(1.5, 0.18, 1.95, 0.75, 0, 0.98, WOOD, bev=0.06, bseg=3, noise_amt=0.03)
    B.cyl(0.75, 0.18, 0.75, 0, 1.95, WOOD, seg=24, rot=(1.5708, 0, 0), noise_amt=0.03, smooth=True)
    for k in range(1, 4):   # いたの すじ
        B.rbox(0.025, 0.2, 2.5, k * 0.375, 0, 1.2, WOOD2, bev=0.0, noise_amt=0.02)
    for z in (0.45, 1.6):   # よこの たがね
        B.rbox(1.5, 0.22, 0.12, 0.75, 0, z, '#caa061', bev=0.04, noise_amt=0.03)
    B.cyl(0.46, 0.08, 0.75, -0.12, 1.55, '#ffe27a', seg=28, rot=(1.5708, 0, 0), noise_amt=0.0, glow=0.04, smooth=True)   # メダル
    B.cyl(0.38, 0.1, 0.75, -0.14, 1.55, '#fff2b0', seg=28, rot=(1.5708, 0, 0), noise_amt=0.0, smooth=True)
    zc = 1.62; pts = [(0.75 + 0.2 * math.cos(a), -0.2, zc + 0.02 + 0.2 * math.sin(a)) for a in [math.radians(190 - i * 17) for i in range(15)]]
    pts += [(0.75 + 0.02, -0.2, zc - 0.28), (0.75 + 0.0, -0.2, zc - 0.36)]
    B.tube(pts, 0.055, 0.055, '#e8a020', seg=8, noise_amt=0.0, glow=0.02)   # 「?」の かたち
    B.sph(0.07, 0.75, -0.2, zc - 0.55, '#e8a020', seg=10, ring=8, noise_amt=0.0)
    B.sph(0.07, 1.38, -0.12, 0.95, '#c98a3a', seg=10, ring=8, noise_amt=0.0)   # とって

@asset
def gym_wall():
    random.seed(5)
    for k in range(5):   # れんがの だん(すこし ずらして めじを つくる)
        z = 0.25 + k * 0.5; ox = (k % 2) * 0.05
        B.rbox(1.96, 1.96, 0.47, ox * 0.4, 0, z, '#bfc2cb' if k % 2 else '#c9ccd4', bev=0.045, jit=0.012, noise_amt=0.1, freq=2.0)
    B.rbox(2.06, 2.06, 0.14, 0, 0, 2.57, STONE_DD, bev=0.04, noise_amt=0.06)   # かんむり
    B.rbox(1.9, 1.9, 0.06, 0, 0, 2.67, STONE_D, bev=0.03, noise_amt=0.06)
    for sx in (-1, 1):
        for sy in (-1, 1):
            B.rbox(0.2, 0.2, 2.5, sx * 0.93, sy * 0.93, 1.25, STONE_D, bev=0.05, noise_amt=0.08)   # かどの はしら

@asset
def gym_wall_low():   # ひくい かべ・てすり(そとの かこい)
    B.rbox(1.96, 0.5, 0.9, 0, 0, 0.45, STONE, bev=0.05, noise_amt=0.1)
    B.rbox(2.0, 0.62, 0.12, 0, 0, 0.94, STONE_DD, bev=0.04, noise_amt=0.06)

@asset
def gym_sign():
    B.rbox(0.14, 0.14, 1.2, 0, 0, 0.6, '#9b6b3c', bev=0.03, noise_amt=0.12, freq=3)
    B.rbox(1.15, 0.12, 0.7, 0, -0.04, 1.2, '#b98650', bev=0.04, noise_amt=0.1, freq=3)
    B.rbox(1.25, 0.15, 0.1, 0, -0.03, 1.58, '#7d5330', bev=0.03, noise_amt=0.08)
    for k, y in enumerate((1.34, 1.2, 1.06)):
        B.rbox(0.75 - k * 0.12, 0.03, 0.05, 0, -0.12, y, '#5a3b1f', bev=0.01, noise_amt=0.02)
    B.rbox(0.5, 0.5, 0.12, 0, 0, 0.06, STONE_D, bev=0.04, noise_amt=0.06)

PASTEL = '#f1ebdf'; PASTEL2 = '#fffaf0'; PASTEL_D = '#d9cfbb'

def soft_tile(h=0.34, col=PASTEL, top=PASTEL2):   # ぷっくり まるい タイル(ゆかと おなじ かたち)
    B.rbox(1.96, 1.96, h, 0, 0, h / 2, col, bev=0.14, bseg=3, noise_amt=0.025, freq=1.6)
    B.rbox(1.62, 1.62, 0.07, 0, 0, h + 0.02, top, bev=0.07, bseg=3, noise_amt=0.02, freq=2.6)

def rim4(col, inner=1.3, h=0.34, bev=0.12):   # あなの ふち(まるい)
    t = (1.96 - inner) / 2
    B.rbox(1.96, t, h, 0, (inner + t) / 2, h / 2, col, bev=bev, bseg=3, noise_amt=0.03)
    B.rbox(1.96, t, h, 0, -(inner + t) / 2, h / 2, col, bev=bev, bseg=3, noise_amt=0.03)
    B.rbox(t, inner, h, (inner + t) / 2, 0, h / 2, col, bev=bev, bseg=3, noise_amt=0.03)
    B.rbox(t, inner, h, -(inner + t) / 2, 0, h / 2, col, bev=bev, bseg=3, noise_amt=0.03)

@asset
def gym_ice():   # マシュマロの こおり
    random.seed(23)
    B.rbox(1.96, 1.96, 0.34, 0, 0, 0.17, '#cfeefc', bev=0.14, bseg=3, noise_amt=0.04, freq=1.5, glow=0.03)
    B.rbox(1.7, 1.7, 0.07, 0, 0, 0.37, '#f2fcff', bev=0.08, bseg=3, noise_amt=0.03, glow=0.06)
    for k in range(3):
        L = random.uniform(0.3, 0.5); a = random.uniform(0, 3.14)
        B.rbox(L, 0.03, 0.012, random.uniform(-0.5, 0.5), random.uniform(-0.5, 0.5), 0.415, '#a8d8f0', bev=0.0, rot=(0, 0, a), noise_amt=0.02)
    for sx in (-1, 1):
        for sy in (-1, 1):
            B.sph(0.09, sx * 0.78, sy * 0.78, 0.4, '#ffffff', scale=(1, 1, 0.6), seg=8, ring=6, noise_amt=0.0, glow=0.05)
    for k in range(4):
        B.sph(0.035, random.uniform(-0.6, 0.6), random.uniform(-0.6, 0.6), 0.42, '#ffffff', scale=(1, 1, 0.5), seg=6, ring=4, noise_amt=0.0, glow=0.1)

@asset
def gym_rock():   # まるい いわ(つるんと した ごろごろ いし。うえに ちいさな こけ)
    random.seed(31)
    B.sph(0.88, 0, 0, 0.62, '#e2e4ec', scale=(1, 1, 0.78), seg=18, ring=12, noise_amt=0.04, freq=1.6)
    B.sph(0.5, -0.3, -0.25, 0.9, '#f2f3f8', scale=(1, 1, 0.55), seg=12, ring=8, noise_amt=0.03)   # ハイライト
    B.sph(0.34, 0.45, 0.2, 1.0, '#d6d9e4', scale=(1, 1, 0.6), seg=12, ring=8, noise_amt=0.03)
    for k in range(3):   # こけの ふさ
        B.sph(random.uniform(0.12, 0.2), random.uniform(-0.3, 0.3), random.uniform(-0.3, 0.3), 1.14, '#9fd68a', scale=(1, 1, 0.6), seg=8, ring=6, noise_amt=0.0)
    B.rbox(1.7, 1.7, 0.08, 0, 0, 0.04, '#bfc2cc', bev=0.04, bseg=2, noise_amt=0.04)   # かげ

@asset
def gym_hole():   # おとしあな(まるい ふち。ふかい あおぐろい あな)
    rim4(PASTEL, 1.3, 0.34, 0.12)
    B.rbox(1.3, 1.3, 0.02, 0, 0, 0.02, '#2c2a48', bev=0.0, noise_amt=0.05, freq=3)
    for k in range(5):
        B.sph(random.uniform(0.04, 0.09), random.uniform(-0.45, 0.45), random.uniform(-0.45, 0.45), 0.06, '#6a66a0', scale=(1, 1, 0.5), seg=6, ring=4, noise_amt=0.0, glow=0.06)   # そこの ほし
    for sx in (-1, 1):
        for sy in (-1, 1): B.sph(0.11, sx * 0.8, sy * 0.8, 0.38, '#e6d7bd', scale=(1, 1, 0.6), seg=8, ring=6, noise_amt=0.0)

@asset
def gym_lava():   # ようがん(ぷくぷく ひかる あわ)
    random.seed(41)
    rim4('#f0d8c8', 1.3, 0.36, 0.12)
    B.rbox(1.34, 1.34, 0.2, 0, 0, 0.1, '#ff8a2a', bev=0.04, noise_amt=0.2, freq=2.4, glow=0.15)
    for k in range(7):
        B.sph(random.uniform(0.1, 0.22), random.uniform(-0.5, 0.5), random.uniform(-0.5, 0.5), 0.22, random.choice(['#ffc04a', '#ffd86a', '#ffa83a']), scale=(1, 1, 0.8), seg=10, ring=7, noise_amt=0.0, glow=0.22)

@asset
def gym_plate():   # スイッチ(まるい ぼたん。ゲームで いろを かける)
    soft_tile()
    B.cyl(0.8, 0.12, 0, 0, 0.44, '#ffffff', seg=32, noise_amt=0.02, smooth=True)
    B.cyl(0.62, 0.1, 0, 0, 0.5, '#fff6e4', seg=32, noise_amt=0.0, glow=0.04, smooth=True)
    for k in range(5):
        a = k / 5 * 6.2832 + 1.5708; B.sph(0.1, math.cos(a) * 0.36, math.sin(a) * 0.36, 0.56, '#ffffff', scale=(1, 1, 0.5), seg=8, ring=6, noise_amt=0.0)
    B.sph(0.16, 0, 0, 0.58, '#ffffff', scale=(1, 1, 0.55), seg=12, ring=8, noise_amt=0.0, glow=0.04)

@asset
def gym_door_frame():   # とびらの わく(まるい アーチ)
    CREAM = '#f6e9cf'; GOLD = '#ffd45a'
    B.rbox(1.96, 0.5, 0.2, 0, 0, 0.1, '#e8d8b8', bev=0.08, bseg=3, noise_amt=0.02)
    for s in (-1, 1):
        B.cyl(0.24, 1.95, s * 0.86, 0, 0.98, CREAM, seg=20, noise_amt=0.02, smooth=True)
        B.cyl(0.3, 0.18, s * 0.86, 0, 1.88, GOLD, seg=20, noise_amt=0.0, smooth=True)
        B.sph(0.2, s * 0.86, 0, 2.12, '#ffffff', seg=14, ring=10, noise_amt=0.0)
    pts = [(-0.86 * math.cos(t * math.pi), 0, 1.95 + 0.86 * math.sin(t * math.pi)) for t in [i / 16 for i in range(17)]]
    B.tube(pts, 0.2, 0.2, CREAM, seg=12, noise_amt=0.02)
    B.sph(0.22, 0, -0.02, 2.84, '#ffffff', scale=(1, 0.8, 1), seg=12, ring=8, noise_amt=0.0, glow=0.04)

@asset
def gym_door_bars():   # とびらの さく(まるい ぼう・ボールの せんたん。ゲームで いろを かける)
    for k in range(5):
        x = -0.6 + k * 0.3
        B.cyl(0.09, 2.2, x, 0, 1.15, '#ffffff', seg=14, noise_amt=0.0, smooth=True)
        B.sph(0.13, x, 0, 2.3, '#ffffff', seg=12, ring=8, noise_amt=0.0, glow=0.05)
    B.rbox(1.4, 0.14, 0.14, 0, 0, 0.5, '#f4f4f4', bev=0.06, bseg=3, noise_amt=0.0)
    B.rbox(1.4, 0.14, 0.14, 0, 0, 1.5, '#f4f4f4', bev=0.06, bseg=3, noise_amt=0.0)
    B.sph(0.16, 0, 0.1, 1.0, '#ffe58a', seg=12, ring=8, noise_amt=0.0, glow=0.08)

@asset
def gym_lock():   # かぎの とびら(きの とびらと おおきな きんの かぎあな)
    B.rbox(1.82, 0.5, 2.3, 0, 0, 1.15, '#f1c98a', bev=0.2, bseg=3, noise_amt=0.04, freq=3.0)
    for z in (0.5, 1.8): B.rbox(1.86, 0.54, 0.14, 0, 0, z, '#d9a869', bev=0.06, bseg=3, noise_amt=0.03)
    B.rbox(1.96, 0.62, 0.18, 0, 0, 2.38, '#e8d8b8', bev=0.08, bseg=3, noise_amt=0.03)
    B.cyl(0.44, 0.2, 0, -0.28, 1.2, '#ffd45a', seg=26, rot=(1.5708, 0, 0), noise_amt=0.0, smooth=True, glow=0.04)
    B.cyl(0.32, 0.24, 0, -0.31, 1.2, '#fff0a8', seg=26, rot=(1.5708, 0, 0), noise_amt=0.0, smooth=True)
    B.sph(0.1, 0, -0.44, 1.28, '#7a5a30', seg=10, ring=8, noise_amt=0.0); B.rbox(0.1, 0.1, 0.22, 0, -0.44, 1.12, '#7a5a30', bev=0.03, bseg=2, noise_amt=0.0)
    B.rbox(0.07, 0.22, 0.2, 0, 0.28, 1.12, '#ffd66e', bev=0.0, noise_amt=0.0)

@asset
def gym_key():   # かぎ(ハートの かたちの わっか・きらきら)
    pts = []
    for i in range(33):
        t = i / 32 * 6.2832; x = 16 * math.sin(t) ** 3 / 16 * 0.27; z = 0.95 + (13 * math.cos(t) - 5 * math.cos(2 * t) - 2 * math.cos(3 * t) - math.cos(4 * t)) / 16 * 0.27
        pts.append((x, 0, z))
    B.tube(pts, 0.065, 0.065, '#ffd24f', seg=8, noise_amt=0.0, glow=0.1)
    B.cyl(0.07, 0.62, 0, 0, 0.45, '#ffd24f', seg=12, noise_amt=0.0, glow=0.06, smooth=True)
    for z, l in [(0.14, 0.24), (0.3, 0.17)]:
        B.rbox(l, 0.1, 0.1, l / 2, 0, z, '#ffd24f', bev=0.04, bseg=3, noise_amt=0.0, glow=0.06)
    B.sph(0.09, 0, 0, 0.98, '#fff3b8', seg=10, ring=8, noise_amt=0.0, glow=0.25)
    for a in (0.8, 2.4, 4.0): B.sph(0.04, math.cos(a) * 0.5, 0, 0.95 + math.sin(a) * 0.5, '#ffffff', seg=6, ring=4, noise_amt=0.0, glow=0.2)

@asset
def gym_arrow():   # ベルトコンベア(ふとい ふんわり やじるし。さきが きた=-Z)
    B.rbox(1.96, 1.96, 0.3, 0, 0, 0.15, '#e8e4f0', bev=0.14, bseg=3, noise_amt=0.03)
    B.rbox(1.64, 1.64, 0.06, 0, 0, 0.33, '#a8b0cc', bev=0.08, bseg=3, noise_amt=0.03)
    for y in (-0.5, 0.0, 0.5):
        for s in (-1, 1):
            B.rbox(0.66, 0.2, 0.07, s * 0.26, y - 0.12, 0.4, '#ffffff', bev=0.09, bseg=3, rot=(0, 0, s * 0.6), noise_amt=0.0)
    for s in (-1, 1): B.rbox(0.09, 1.7, 0.1, s * 0.86, 0, 0.36, '#ffe48a', bev=0.04, bseg=3, noise_amt=0.0)

@asset
def gym_warp():   # ワープ(くるくる ひかる ほしの まる)
    soft_tile()
    B.cyl(0.84, 0.1, 0, 0, 0.44, '#ffffff', seg=32, noise_amt=0.02, smooth=True)
    pts = [(math.cos(i / 32 * 6.2832) * 0.66, math.sin(i / 32 * 6.2832) * 0.66, 0.54) for i in range(33)]
    B.tube(pts, 0.07, 0.07, '#ffffff', seg=8, noise_amt=0.0, glow=0.05)
    for k in range(5):
        a = k / 5 * 6.2832 + 1.5708; B.sph(0.1, math.cos(a) * 0.66, math.sin(a) * 0.66, 0.56, '#ffffff', seg=8, ring=6, noise_amt=0.0, glow=0.08)
    pts = [(math.cos(t) * (0.05 + t * 0.06), math.sin(t) * (0.05 + t * 0.06), 0.56) for t in [i * 0.35 for i in range(14)]]
    B.tube(pts, 0.05, 0.05, '#ffffff', seg=6, noise_amt=0.0, glow=0.06)   # うずまき

@asset
def gym_crumble():   # くずれる ゆか(クッキーみたいな 4まい)
    random.seed(53)
    for (x, y) in [(-0.5, -0.5), (0.5, -0.5), (-0.5, 0.5), (0.5, 0.5)]:
        B.rbox(0.92, 0.92, 0.34, x, y, 0.17, '#f4d6a0', bev=0.14, bseg=3, rot=(0, 0, random.uniform(-0.05, 0.05)), noise_amt=0.06, freq=2)
        B.rbox(0.7, 0.7, 0.04, x, y, 0.36, '#fbe6bc', bev=0.04, bseg=3, noise_amt=0.04)
        for k in range(3): B.sph(0.05, x + random.uniform(-0.25, 0.25), y + random.uniform(-0.25, 0.25), 0.4, '#8a5a3c', scale=(1, 1, 0.5), seg=6, ring=4, noise_amt=0.0)   # チョコチップ

@asset
def gym_goal():   # ゴール(きんの ほしの ぶたい)
    soft_tile()
    B.cyl(0.86, 0.1, 0, 0, 0.44, '#ffe9a0', seg=36, noise_amt=0.02, smooth=True, glow=0.04)
    pts = [(math.cos(i / 36 * 6.2832) * 0.68, math.sin(i / 36 * 6.2832) * 0.68, 0.52) for i in range(37)]
    B.tube(pts, 0.06, 0.06, '#ffffff', seg=8, noise_amt=0.0)
    B.cyl(0.3, 0.1, 0, 0, 0.56, '#ffffff', seg=5, noise_amt=0.0, smooth=True)
    for k in range(5):
        a = k / 5 * 6.2832 + 1.5708; B.cyl(0.16, 0.1, math.cos(a) * 0.3, math.sin(a) * 0.3, 0.56, '#ffffff', seg=10, r2=0.03, noise_amt=0.0, smooth=True)
    for s in (-1, 1):
        B.cyl(0.17, 1.5, s * 0.85, -0.7, 0.75, '#f6e9cf', seg=16, noise_amt=0.02, smooth=True)
        B.cyl(0.24, 0.14, s * 0.85, -0.7, 1.52, '#ffd45a', seg=16, noise_amt=0.0, smooth=True)
        B.sph(0.17, s * 0.85, -0.7, 1.74, '#ffffff', seg=12, ring=8, noise_amt=0.0, glow=0.06)

@asset
def gym_entrance():   # フィールドに たつ ジムの いりぐち(まえが +Z。はば 9・たかさ 7)
    random.seed(77)
    B.rbox(10.4, 4.2, 0.35, 0, 0.3, 0.17, STONE_D, bev=0.08, noise_amt=0.1, freq=1.1)   # だい
    B.rbox(9.0, 3.2, 0.3, 0, 0.1, 0.5, STONE, bev=0.07, noise_amt=0.1)
    for k in range(3):
        B.rbox(5.2 - k * 0.5, 0.9, 0.2, 0, 2.1 - k * 0.45, 0.75 + k * 0.2, STONE2 if k % 2 else STONE, bev=0.05, noise_amt=0.08)
    for s in (-1, 1):   # はしら
        B.rbox(1.7, 1.9, 5.6, s * 3.2, -0.4, 3.4, STONE, bev=0.1, noise_amt=0.1, freq=1.2)
        B.rbox(2.1, 2.3, 0.5, s * 3.2, -0.4, 0.75, STONE_DD, bev=0.08, noise_amt=0.08)
        B.rbox(2.1, 2.3, 0.45, s * 3.2, -0.4, 6.4, STONE_DD, bev=0.08, noise_amt=0.08)
        for k in range(4):   # はしらの ほりこみ
            B.rbox(1.2, 0.12, 0.35, s * 3.2, 0.58, 1.8 + k * 1.1, STONE_D, bev=0.03, noise_amt=0.05)
        B.sph(0.4, s * 3.2, 0.1, 6.95, '#ffffff', scale=(1, 1, 1), noise_amt=0.0)
    B.rbox(9.2, 2.3, 1.3, 0, -0.4, 6.0, STONE, bev=0.12, noise_amt=0.1, freq=1.1)   # うえの よこぼう
    B.rbox(9.8, 2.7, 0.4, 0, -0.4, 6.8, STONE_DD, bev=0.1, noise_amt=0.07)
    B.rbox(2.6, 2.4, 1.2, 0, -0.45, 7.55, STONE, bev=0.12, noise_amt=0.08)   # まんなかの かざり
    B.sph(0.55, 0, 0.8, 7.55, '#ffffff', scale=(1, 0.6, 1.2), noise_amt=0.0)   # ほうせき
    for s in (-1, 1):
        B.rbox(0.18, 0.18, 2.3, s * 1.45, 0.78, 4.8, STONE_D, bev=0.03, noise_amt=0.05)   # ゲートの ふち
    for s in (-1, 1):   # はたの ポール
        B.cyl(0.1, 4.8, s * 4.9, 1.4, 2.5, STONE_DD, seg=10, noise_amt=0.05)
        B.rbox(0.05, 1.5, 1.0, s * 4.9, 2.15, 4.4, '#ffffff', bev=0.0, noise_amt=0.0)
    for k in range(10):   # くずれた いし・がれき
        B.rock(random.uniform(0.15, 0.35), random.uniform(-4.5, 4.5), random.uniform(1.6, 2.4), 0.52, STONE_D, rough=0.3, sub=1, seed=k, noise_amt=0.1)

@asset
def gym_portal():   # いりぐちの なかの ひかる めん(ふくろ。ゲームで かさねあわせる)
    B.rbox(2.9, 0.05, 4.6, 0, 0.7, 2.3, '#ffffff', bev=0.0, noise_amt=0.0)

@asset
def gym_checkpoint():   # チェックポイント(はたの たった ゆか)
    random.seed(19)
    B.rbox(1.96, 1.96, 0.34, 0, 0, 0.17, STONE, bev=0.05, noise_amt=0.07)
    B.cyl(0.55, 0.12, 0, 0, 0.4, STONE_D, seg=24, noise_amt=0.05)
    B.cyl(0.07, 2.2, 0, 0, 1.45, '#d9dbe2', seg=10, noise_amt=0.03)
    B.sph(0.12, 0, 0, 2.6, '#ffe08a', noise_amt=0.0, glow=0.15)
    pts = [(0.0 + 0.62 * t, 0.0, 2.35 - 0.12 * t + 0.07 * math.sin(t * 5.0)) for t in [i / 8 for i in range(9)]]
    for k in range(8):   # はたの ぬの(ひらひら)
        x0 = 0.07 + k * 0.08; B.rbox(0.085, 0.03, 0.62 - k * 0.02, x0, 0.0, 2.05 - k * 0.012 + 0.03 * math.sin(k * 0.9), '#ffffff', bev=0.0, noise_amt=0.0, glow=0.04)
    B.rbox(0.74, 0.04, 0.05, 0.4, 0.0, 2.32, '#ffe08a', bev=0.0, noise_amt=0.0)
    for k in range(4):
        a = k * 1.5708 + 0.785; B.cyl(0.05, 0.14, math.cos(a) * 0.78, math.sin(a) * 0.78, 0.45, '#ffffff', seg=6, r2=0.0, noise_amt=0.0)

for fn in ASSETS:
    if only and fn.__name__ not in only: continue
    B.start(out); fn(); B.build(fn.__name__)

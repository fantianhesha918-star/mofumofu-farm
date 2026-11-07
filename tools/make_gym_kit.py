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
def gym_floor():
    random.seed(11)
    B.rbox(1.96, 1.96, 0.34, 0, 0, 0.17, STONE, bev=0.05, noise_amt=0.07, freq=1.6)
    B.rbox(1.52, 1.52, 0.05, 0, 0, 0.355, STONE2, bev=0.025, noise_amt=0.05, freq=2.6)
    B.rbox(1.18, 1.18, 0.03, 0, 0, 0.395, STONE, bev=0.015, noise_amt=0.05)
    for sx in (-1, 1):
        for sy in (-1, 1):
            B.cyl(0.085, 0.07, sx * 0.80, sy * 0.80, 0.36, STONE_D, seg=10, noise_amt=0.05)
    for k in range(5):   # かすかな ひび・かけ
        B.rbox(random.uniform(0.2, 0.5), 0.018, 0.012, random.uniform(-0.6, 0.6), random.uniform(-0.6, 0.6), 0.41, STONE_D, bev=0.0, rot=(0, 0, random.uniform(0, 3.14)), noise_amt=0.02)

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
def gym_ice():
    random.seed(23)
    B.rbox(1.96, 1.96, 0.34, 0, 0, 0.17, '#b8dcef', bev=0.05, noise_amt=0.1, freq=1.5)
    B.rbox(1.8, 1.8, 0.05, 0, 0, 0.365, '#e9f7ff', bev=0.03, noise_amt=0.05, glow=0.04)
    for k in range(9):   # こおりの ひび
        L = random.uniform(0.35, 0.8); a = random.uniform(0, 3.14)
        B.rbox(L, 0.022, 0.012, random.uniform(-0.55, 0.55), random.uniform(-0.55, 0.55), 0.395, '#7fb6da', bev=0.0, rot=(0, 0, a), noise_amt=0.03)
    for sx in (-1, 1):
        for sy in (-1, 1):
            B.sph(0.13, sx * 0.85, sy * 0.85, 0.38, '#ffffff', scale=(1, 1, 0.55), noise_amt=0.03)   # しもの つぶ
    for k in range(4):
        B.rbox(0.2, 0.2, 0.012, random.uniform(-0.6, 0.6), random.uniform(-0.6, 0.6), 0.4, '#ffffff', bev=0.02, rot=(0, 0, random.uniform(0, 1.5)), noise_amt=0.0, glow=0.1)   # きらめき

@asset
def gym_rock():
    random.seed(31)
    B.rock(0.8, 0, 0, 0.62, '#b7b9c0', scale=(1.0, 1.0, 0.82), rough=0.2, sub=3, seed=4, noise_amt=0.14, freq=2.0)
    B.rock(0.42, 0.46, 0.3, 0.38, '#a9acb4', scale=(1, 1, 0.8), rough=0.22, sub=2, seed=9, noise_amt=0.12)
    B.rock(0.34, -0.5, -0.36, 0.3, '#a2a5ad', scale=(1, 1, 0.8), rough=0.22, sub=2, seed=12, noise_amt=0.12)
    B.rbox(0.62, 0.62, 0.05, 0, 0, 1.16, '#e6e8ee', bev=0.03, rot=(0, 0, 0.5), noise_amt=0.04)   # うえの たいらな めじるし
    for k in range(3):
        a = k * 2.1 + 0.4; B.rbox(0.5, 0.045, 0.045, math.cos(a) * 0.58, math.sin(a) * 0.58, 0.8, '#8c8f99', bev=0.01, rot=(0, 0, a + 1.57), noise_amt=0.03)   # ほりこみ

@asset
def gym_hole():   # おとしあな(ふちが ある)
    B.rbox(1.96, 0.33, 0.34, 0, 0.815, 0.17, STONE, bev=0.04, noise_amt=0.07)
    B.rbox(1.96, 0.33, 0.34, 0, -0.815, 0.17, STONE, bev=0.04, noise_amt=0.07)
    B.rbox(0.33, 1.3, 0.34, 0.815, 0, 0.17, STONE, bev=0.04, noise_amt=0.07)
    B.rbox(0.33, 1.3, 0.34, -0.815, 0, 0.17, STONE, bev=0.04, noise_amt=0.07)
    B.rbox(1.3, 1.3, 0.02, 0, 0, 0.02, '#14141c', bev=0.0, noise_amt=0.1, freq=3)
    for k in range(6):   # あなの そこの がれき
        B.rock(0.12, random.uniform(-0.45, 0.45), random.uniform(-0.45, 0.45), 0.05, '#2a2a34', rough=0.3, sub=1, seed=k, noise_amt=0.1)
    for sx in (-1, 1):
        for sy in (-1, 1):
            B.rbox(0.36, 0.36, 0.06, sx * 0.8, sy * 0.8, 0.36, STONE_D, bev=0.02, noise_amt=0.05)

@asset
def gym_lava():   # ようがんの あな(ひかる)
    random.seed(41)
    B.rbox(1.96, 0.33, 0.36, 0, 0.815, 0.18, '#6c6660', bev=0.04, noise_amt=0.14)
    B.rbox(1.96, 0.33, 0.36, 0, -0.815, 0.18, '#6c6660', bev=0.04, noise_amt=0.14)
    B.rbox(0.33, 1.3, 0.36, 0.815, 0, 0.18, '#6c6660', bev=0.04, noise_amt=0.14)
    B.rbox(0.33, 1.3, 0.36, -0.815, 0, 0.18, '#6c6660', bev=0.04, noise_amt=0.14)
    B.rbox(1.34, 1.34, 0.2, 0, 0, 0.1, '#ff7a1c', bev=0.02, noise_amt=0.28, freq=2.4, glow=0.12)
    for k in range(7):
        B.rock(random.uniform(0.12, 0.26), random.uniform(-0.5, 0.5), random.uniform(-0.5, 0.5), 0.22, '#3a2c26', scale=(1, 1, 0.45), rough=0.2, sub=2, seed=k, noise_amt=0.1)   # かたまった かわ
    for k in range(5):
        B.rbox(random.uniform(0.3, 0.6), 0.04, 0.02, random.uniform(-0.45, 0.45), random.uniform(-0.45, 0.45), 0.27, '#ffd45a', bev=0.0, rot=(0, 0, random.uniform(0, 3.14)), noise_amt=0.02, glow=0.2)

@asset
def gym_plate():   # スイッチ(ルーンの ついた まるい いし)
    B.rbox(1.96, 1.96, 0.34, 0, 0, 0.17, STONE, bev=0.05, noise_amt=0.07)
    B.cyl(0.84, 0.1, 0, 0, 0.39, STONE_D, seg=28, noise_amt=0.05)
    B.cyl(0.66, 0.05, 0, 0, 0.45, '#ffffff', seg=28, noise_amt=0.0, glow=0.0)
    B.cyl(0.5, 0.06, 0, 0, 0.46, STONE_DD, seg=28, noise_amt=0.04)
    for k in range(4):   # ルーンの きざみ
        a = k * 1.5708 + 0.785; B.rbox(0.34, 0.07, 0.05, math.cos(a) * 0.35, math.sin(a) * 0.35, 0.5, '#ffffff', bev=0.01, rot=(0, 0, a), noise_amt=0.0)
    B.cyl(0.14, 0.08, 0, 0, 0.51, '#ffffff', seg=16, noise_amt=0.0)

@asset
def gym_door_frame():   # とびらの わく(いわの もん)
    B.rbox(0.42, 1.96, 2.7, -0.77, 0, 1.35, STONE, bev=0.05, noise_amt=0.09)
    B.rbox(0.42, 1.96, 2.7, 0.77, 0, 1.35, STONE, bev=0.05, noise_amt=0.09)
    B.rbox(1.96, 1.96, 0.46, 0, 0, 2.55, STONE_D, bev=0.05, noise_amt=0.08)
    B.rbox(2.06, 2.06, 0.12, 0, 0, 2.84, STONE_DD, bev=0.04, noise_amt=0.06)
    B.sph(0.2, 0, 1.0, 2.55, '#ffffff', scale=(1, 0.5, 1), noise_amt=0.0)   # うえの かざり たま
    B.rbox(1.2, 0.4, 0.05, 0, 0, 0.02, STONE_D, bev=0.01, noise_amt=0.05)   # しきい

@asset
def gym_door_bars():   # とびらの さく(あくと うえへ あがる)
    for k in range(7):
        x = -0.55 + k * 0.183
        B.cyl(0.055, 2.3, x, 0, 1.18, '#d8dae0', seg=10, noise_amt=0.03)
        B.cyl(0.07, 0.16, x, 0, 2.34, '#ffffff', seg=8, r2=0.0, noise_amt=0.0)
    B.rbox(1.3, 0.1, 0.1, 0, 0, 0.5, '#bfc2cb', bev=0.02, noise_amt=0.03)
    B.rbox(1.3, 0.1, 0.1, 0, 0, 1.5, '#bfc2cb', bev=0.02, noise_amt=0.03)
    B.cyl(0.13, 0.08, 0, 0.07, 1.0, '#ffe08a', seg=14, rot=(1.5708, 0, 0), noise_amt=0.02)

@asset
def gym_lock():   # かぎの とびら
    B.rbox(1.82, 0.5, 2.3, 0, 0, 1.15, '#a98a64', bev=0.06, noise_amt=0.1, freq=3.0)
    for z in (0.5, 1.15, 1.8):
        B.rbox(1.86, 0.54, 0.12, 0, 0, z, '#6d6a72', bev=0.03, noise_amt=0.05)
    B.rbox(1.96, 0.62, 0.16, 0, 0, 2.38, STONE_DD, bev=0.04, noise_amt=0.06)
    B.cyl(0.34, 0.2, 0, -0.28, 1.12, '#ffd66e', seg=22, rot=(1.5708, 0, 0), noise_amt=0.03)
    B.cyl(0.07, 0.22, 0, -0.4, 1.17, '#3b2d18', seg=12, rot=(1.5708, 0, 0), noise_amt=0.0)
    B.rbox(0.07, 0.22, 0.2, 0, -0.4, 1.03, '#3b2d18', bev=0.0, noise_amt=0.0)
    B.rbox(0.07, 0.22, 0.2, 0, 0.28, 1.12, '#ffd66e', bev=0.0, noise_amt=0.0)

@asset
def gym_key():
    pts = [(math.cos(i / 16 * 6.2832) * 0.2, 0, 0.78 + math.sin(i / 16 * 6.2832) * 0.2) for i in range(17)]
    B.tube(pts, 0.05, 0.05, '#ffd24f', seg=8, noise_amt=0.03, glow=0.08)
    B.rbox(0.09, 0.09, 0.62, 0, 0, 0.3, '#ffd24f', bev=0.02, noise_amt=0.03, glow=0.05)
    for k, (z, l) in enumerate([(0.12, 0.2), (0.24, 0.14), (0.36, 0.22)]):
        B.rbox(l, 0.08, 0.07, l / 2, 0, z, '#ffd24f', bev=0.015, noise_amt=0.03, glow=0.05)
    B.sph(0.07, 0, 0, 0.78, '#fff3b8', noise_amt=0.0, glow=0.2)

@asset
def gym_arrow():   # ベルトコンベア(さきが きた=-Z)
    B.rbox(1.96, 1.96, 0.3, 0, 0, 0.15, '#9ea2ad', bev=0.05, noise_amt=0.08)
    B.rbox(1.64, 1.64, 0.05, 0, 0, 0.325, '#4b4f5c', bev=0.025, noise_amt=0.06)
    for k, y in enumerate((-0.45, 0.0, 0.45)):   # シェブロン
        for s in (-1, 1):
            B.rbox(0.62, 0.17, 0.05, s * 0.27, y - 0.13, 0.37, '#f4f6fb', bev=0.025, rot=(0, 0, s * 0.6), noise_amt=0.0)
    for s in (-1, 1):
        B.rbox(0.06, 1.7, 0.08, s * 0.85, 0, 0.35, '#ffdf6a', bev=0.015, noise_amt=0.02)

@asset
def gym_warp():
    random.seed(7)
    B.rbox(1.96, 1.96, 0.34, 0, 0, 0.17, STONE, bev=0.05, noise_amt=0.07)
    B.cyl(0.86, 0.1, 0, 0, 0.39, STONE_D, seg=32, noise_amt=0.05)
    pts = [(math.cos(i / 32 * 6.2832) * 0.7, math.sin(i / 32 * 6.2832) * 0.7, 0.5) for i in range(33)]
    B.tube(pts, 0.06, 0.06, '#ffffff', seg=8, noise_amt=0.0)
    for k in range(5):   # ほしの かたち
        a = k * 1.2566 + 1.5708; b = a + 2.5133
        x0, y0, x1, y1 = math.cos(a) * 0.5, math.sin(a) * 0.5, math.cos(b) * 0.5, math.sin(b) * 0.5
        B.rbox(math.hypot(x1 - x0, y1 - y0), 0.05, 0.04, (x0 + x1) / 2, (y0 + y1) / 2, 0.5, '#ffffff', bev=0.01, rot=(0, 0, math.atan2(y1 - y0, x1 - x0)), noise_amt=0.0)
    B.sph(0.13, 0, 0, 0.56, '#ffffff', noise_amt=0.0)
    for k in range(4):
        a = k * 1.5708 + 0.785; B.rbox(0.14, 0.14, 0.5, math.cos(a) * 0.92, math.sin(a) * 0.92, 0.6, STONE_DD, bev=0.03, noise_amt=0.06)
        B.cyl(0.07, 0.16, math.cos(a) * 0.92, math.sin(a) * 0.92, 0.92, '#ffffff', seg=6, r2=0.0, noise_amt=0.0)

@asset
def gym_crumble():   # くずれる ゆか
    random.seed(53)
    for (x, y, w, h, tz) in [(-0.5, -0.5, 0.92, 0.92, 0.02), (0.5, -0.5, 0.92, 0.92, -0.02), (-0.5, 0.5, 0.92, 0.92, -0.03), (0.5, 0.5, 0.92, 0.92, 0.03)]:
        B.rbox(w, h, 0.34, x, y, 0.17 + tz, '#c0a98c', bev=0.05, jit=0.02, rot=(random.uniform(-0.02, 0.02), random.uniform(-0.02, 0.02), random.uniform(-0.06, 0.06)), noise_amt=0.12, freq=2)
        B.rbox(w * 0.7, h * 0.7, 0.03, x, y, 0.36 + tz, '#d8c6ab', bev=0.015, noise_amt=0.08)
    for k in range(6):
        B.rock(0.09, random.uniform(-0.8, 0.8), random.uniform(-0.8, 0.8), 0.37, '#a88f70', rough=0.3, sub=1, seed=k, noise_amt=0.1)

@asset
def gym_sign():
    B.rbox(0.14, 0.14, 1.2, 0, 0, 0.6, '#9b6b3c', bev=0.03, noise_amt=0.12, freq=3)
    B.rbox(1.15, 0.12, 0.7, 0, -0.04, 1.2, '#b98650', bev=0.04, noise_amt=0.1, freq=3)
    B.rbox(1.25, 0.15, 0.1, 0, -0.03, 1.58, '#7d5330', bev=0.03, noise_amt=0.08)
    for k, y in enumerate((1.34, 1.2, 1.06)):
        B.rbox(0.75 - k * 0.12, 0.03, 0.05, 0, -0.12, y, '#5a3b1f', bev=0.01, noise_amt=0.02)
    B.rbox(0.5, 0.5, 0.12, 0, 0, 0.06, STONE_D, bev=0.04, noise_amt=0.06)

@asset
def gym_goal():   # ゴール(ボスの へやへの いり口の かざり いし)
    B.rbox(1.96, 1.96, 0.34, 0, 0, 0.17, STONE, bev=0.05, noise_amt=0.07)
    B.cyl(0.86, 0.1, 0, 0, 0.39, '#ffe9a0', seg=36, noise_amt=0.04)
    pts = [(math.cos(i / 36 * 6.2832) * 0.66, math.sin(i / 36 * 6.2832) * 0.66, 0.47) for i in range(37)]
    B.tube(pts, 0.05, 0.05, '#ffffff', seg=8, noise_amt=0.0)
    for k in range(8):
        a = k * 0.7854; B.rbox(0.5, 0.07, 0.05, math.cos(a) * 0.42, math.sin(a) * 0.42, 0.47, '#ffffff', bev=0.01, rot=(0, 0, a), noise_amt=0.0)
    B.sph(0.16, 0, 0, 0.55, '#ffffff', scale=(1, 1, 0.7), noise_amt=0.0)
    for s in (-1, 1):
        B.rbox(0.3, 0.3, 1.5, s * 0.85, -0.7, 0.75, STONE_D, bev=0.05, noise_amt=0.08)
        B.rbox(0.4, 0.4, 0.12, s * 0.85, -0.7, 1.55, STONE_DD, bev=0.04, noise_amt=0.06)
        B.sph(0.14, s * 0.85, -0.7, 1.72, '#ffffff', noise_amt=0.0)

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

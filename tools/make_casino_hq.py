"""カジノの がいかんを Blender で つくりなおす(ていねいな ばん)。
使い方: blender -b -P tools/make_casino_hq.py -- 出力.glb
むき: いりぐちが glTF の +Z がわ(Blender では -Y)。げんてん=ゆかの ちゅうしん。はば 8 / おくゆき 6.4。
かんばん(ゲームが 'CASINO' の もじを はる いた)は、x=0 / たかさ 5.9 / まえから 0.5 のところ(はば 5.6 × たかさ 1.6)に おく。
"""
import bpy, sys, math, os, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import blib as B
from blib import rbox, cyl, sph

out = sys.argv[sys.argv.index('--') + 1]
random.seed(4); B.start('.')
parts = B.parts

def emissive(name, hexc, strength):
    m = bpy.data.materials.new(name); m.use_nodes = True; b = m.node_tree.nodes['Principled BSDF']; c = B.lin(hexc)
    b.inputs['Base Color'].default_value = (*c, 1); b.inputs['Emission Color'].default_value = (*c, 1); b.inputs['Emission Strength'].default_value = strength; b.inputs['Roughness'].default_value = 0.4
    return m
GLOW, NEON, BULB = emissive('glow', '#ffd77a', 2.0), emissive('neon', '#ff7ac0', 2.2), emissive('bulb', '#fff2b0', 3.0)
def E(o, m): o.data.materials.append(m); return o

W, D, H = 8.0, 6.4, 4.0
Y0 = -D / 2                      # まえの かべ
WALL, CREAM, GOLD, DARK, ROOF, WOOD = '#8c1f2e', '#ecdcb4', '#e0b040', '#3a2418', '#2d2433', '#4a2c1a'

# ---- どだい・かいだん ----
rbox(W + 1.0, D + 1.0, 0.35, 0, 0, 0.175, '#8a8070', 0.04, jit=0.01, noise_amt=0.1)
for k in range(3): rbox(3.8 - k * 0.2, 0.7, 0.12 * (3 - k) + 0.04, 0, Y0 - 0.55 - 0.7 * (2 - k) - 0.2, (0.12 * (3 - k) + 0.04) / 2, '#9a9080', 0.03, noise_amt=0.1)
rbox(1.8, 2.5, 0.05, 0, Y0 - 1.4, 0.4, '#a01830', 0.01, noise_amt=0.04)                        # あかい カーペット
for sx in (-1.15, 1.15):
    for k in range(3): cyl(0.05, 0.9, sx, Y0 - 0.7 - k * 0.9, 0.85, GOLD, 10); sph(0.09, sx, Y0 - 0.7 - k * 0.9, 1.32, GOLD, seg=10, ring=8)
    from blib import tube
    tube([(sx, Y0 - 0.7, 1.15), (sx, Y0 - 1.15, 1.02), (sx, Y0 - 1.6, 1.02), (sx, Y0 - 2.05, 1.02), (sx, Y0 - 2.5, 1.15)], 0.03, 0.03, '#a01830', seg=6)

# ---- ほんたい ----
rbox(W, D, H, 0, 0, 0.35 + H / 2, WALL, 0.05, noise_amt=0.07)
rbox(W + 0.1, D + 0.1, 0.9, 0, 0, 0.8, '#6e1624', 0.04, noise_amt=0.06)                         # こしかべ
rbox(W + 0.14, D + 0.14, 0.14, 0, 0, 1.3, GOLD, 0.02)
for sx in (-3.9, -1.95, 1.95, 3.9):                                                              # はしら(ピラスター)
    rbox(0.42, 0.22, 3.1, sx, Y0 - 0.1, 3.05, CREAM, 0.03, noise_amt=0.06); rbox(0.52, 0.28, 0.2, sx, Y0 - 0.1, 4.5, GOLD, 0.02); rbox(0.52, 0.28, 0.2, sx, Y0 - 0.1, 1.5, GOLD, 0.02)
    for sy in (1, -1): pass
for sx in (-1, 1):                                                                               # よこの かべにも
    for y in (-2.0, 0, 2.0): rbox(0.2, 0.42, 3.1, sx * (W / 2 + 0.1), y, 3.05, CREAM, 0.03, noise_amt=0.06)
# まど(アーチ)
for sx in (-2.95, 2.95):
    rbox(1.5, 0.12, 1.9, sx, Y0 - 0.02, 3.05, GOLD, 0.03); cyl(0.75, 0.12, sx, Y0 - 0.02, 4.0, GOLD, 24, rot=(math.pi / 2, 0, 0))
    E(rbox(1.2, 0.14, 1.6, sx, Y0 - 0.06, 3.05, '#ffd77a', 0.01), GLOW); E(cyl(0.6, 0.14, sx, Y0 - 0.06, 3.85, '#ffd77a', 24, rot=(math.pi / 2, 0, 0)), GLOW)
    rbox(0.05, 0.16, 2.6, sx, Y0 - 0.1, 3.3, GOLD, 0); rbox(1.2, 0.16, 0.05, sx, Y0 - 0.1, 3.3, GOLD, 0)
    rbox(1.8, 0.35, 0.12, sx, Y0 - 0.2, 2.05, GOLD, 0.02); rbox(0.9, 0.1, 0.1, sx, Y0 - 0.45, 2.0, '#6e1624', 0.01)
for sx in (-1, 1):
    for y in (-1.0, 1.0):
        rbox(0.12, 1.3, 1.9, sx * (W / 2 + 0.02), y, 3.05, GOLD, 0.03); E(rbox(0.14, 1.05, 1.65, sx * (W / 2 + 0.04), y, 3.05, '#ffd77a', 0.01), GLOW)
# コーニス(ひさし)と はもん
rbox(W + 0.6, D + 0.6, 0.28, 0, 0, 4.5, GOLD, 0.04)
for i in range(26): rbox(0.16, 0.16, 0.16, -W / 2 - 0.1 + i * (W + 0.2) / 25, Y0 - 0.38, 4.28, '#c99a30', 0.02)
rbox(W + 0.8, D + 0.8, 0.12, 0, 0, 4.7, '#b88a2a', 0.03)

# ---- やね(だんだん) ----
rbox(W + 0.9, D + 0.9, 0.32, 0, 0, 4.9, ROOF, 0.05, noise_amt=0.05)
rbox(W - 0.9, D - 0.9, 0.5, 0, 0.2, 5.25, '#352a3c', 0.05, noise_amt=0.05)
rbox(W - 2.4, D - 2.4, 0.5, 0, 0.3, 5.7, '#3d3146', 0.05, noise_amt=0.05)
for sx in (-1, 1):
    for sy in (-1, 1):                                                                           # かどの ドーム
        x, y = sx * (W / 2 + 0.2), sy * (D / 2 + 0.2)
        cyl(0.34, 0.5, x, y, 5.25, CREAM, 14); sph(0.36, x, y, 5.5, GOLD, (1, 1, 1.0), seg=14, ring=10); cyl(0.03, 0.4, x, y, 5.95, GOLD, 8); sph(0.07, x, y, 6.2, GOLD2 if False else '#fff0a0', seg=8, ring=6)
# ---- かんばん(ゲームが もじを はる いた) ----
SY = 5.9; SYF = -(D / 2 - 0.5)
rbox(5.6, 0.35, 1.6, 0, SYF, SY, '#16101c', 0.02)
for dz in (0.87, -0.87): rbox(5.9, 0.45, 0.14, 0, SYF, SY + dz, GOLD, 0.03)
for sx in (-2.95, 2.95): rbox(0.14, 0.45, 1.9, sx, SYF, SY, GOLD, 0.03)
for sx in (-2.0, 2.0): rbox(0.16, 0.2, 0.9, sx, SYF + 0.1, 5.35, GOLD, 0.02)
for i in range(15):
    x = -2.8 + i * 0.4; E(sph(0.075, x, SYF - 0.25, SY + 0.87, '#fff2b0', seg=8, ring=6), BULB); E(sph(0.075, x, SYF - 0.25, SY - 0.87, '#fff2b0', seg=8, ring=6), BULB)
for i in range(4):
    z = SY - 0.45 + i * 0.3; E(sph(0.075, -2.95, SYF - 0.25, z, '#fff2b0', seg=8, ring=6), BULB); E(sph(0.075, 2.95, SYF - 0.25, z, '#fff2b0', seg=8, ring=6), BULB)
for sx in (-2.6, 2.6): E(sph(0.28, sx, SYF, SY + 1.25, '#ff7ac0', seg=14, ring=10), NEON); cyl(0.05, 0.3, sx, SYF, SY + 1.0, GOLD, 8)

# ---- いりぐち(ポーチ) ----
PY = Y0 - 1.55
for sx in (-1.45, 1.45):
    cyl(0.3, 0.2, sx, PY, 0.45, GOLD, 16); cyl(0.2, 3.5, sx, PY, 2.3, CREAM, 18, noise_amt=0.05); cyl(0.3, 0.22, sx, PY, 4.05, GOLD, 16); rbox(0.62, 0.62, 0.14, sx, PY, 4.2, GOLD, 0.02)
    for k in range(8): a = k / 8 * 6.283; rbox(0.03, 0.03, 3.3, sx + math.cos(a) * 0.205, PY + math.sin(a) * 0.205, 2.3, '#c8b890', 0, noise_amt=0.03)
rbox(3.9, 2.4, 0.24, 0, Y0 - 1.0, 4.35, GOLD, 0.04)
rbox(3.5, 2.1, 0.12, 0, Y0 - 1.0, 4.52, '#a01830', 0.03, noise_amt=0.05)
bpy.ops.mesh.primitive_cone_add(radius1=1.7, radius2=0.0, depth=0.9, vertices=3, location=(0, 0, 0)); o = bpy.context.object
o.rotation_euler = (0, 0, math.pi / 2); o.scale = (1, 0.12, 1.0); o.rotation_euler = (math.pi / 2, 0, 0); o.location = (0, Y0 - 0.06, 4.9); bpy.context.view_layer.update(); B.paint(o, CREAM)   # はふ
# ドア
rbox(1.7, 0.16, 2.5, 0, Y0 - 0.02, 1.7, GOLD, 0.03); cyl(0.85, 0.16, 0, Y0 - 0.02, 2.95, GOLD, 24, rot=(math.pi / 2, 0, 0))
rbox(1.5, 0.2, 2.35, 0, Y0 - 0.04, 1.65, WOOD, 0.03, noise_amt=0.08); cyl(0.75, 0.2, 0, Y0 - 0.04, 2.82, WOOD, 24, rot=(math.pi / 2, 0, 0))
rbox(0.05, 0.24, 2.7, 0, Y0 - 0.06, 1.85, GOLD, 0)
E(cyl(0.55, 0.22, 0, Y0 - 0.08, 3.0, '#ffd77a', 24, rot=(math.pi / 2, 0, 0)), GLOW)
for sx in (-0.2, 0.2): sph(0.07, sx, Y0 - 0.2, 1.7, GOLD, seg=10, ring=8)
for sx in (-0.95, 0.95):                                                                         # ランタン
    rbox(0.2, 0.2, 0.06, sx, Y0 - 0.18, 3.15, GOLD, 0.01); E(rbox(0.16, 0.16, 0.3, sx, Y0 - 0.18, 2.95, '#fff2b0', 0.02), BULB); cyl(0.03, 0.1, sx, Y0 - 0.18, 3.18, GOLD, 8)
# ---- うらがわ・よこの かざり ----
for sx in (-1, 1): rbox(0.7, 0.7, 0.6, sx * 3.4, 2.6, 5.1, '#4a3a52', 0.04)

# ---- ざいしつを きめて とうごう ----
for o in parts:
    if not o.data.materials: o.data.materials.append(B.MAT)
bpy.ops.object.select_all(action='DESELECT')
for o in parts: o.select_set(True)
bpy.context.view_layer.objects.active = parts[0]
bpy.ops.object.join(); o = bpy.context.object; bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
bpy.ops.object.select_all(action='DESELECT'); o.select_set(True); bpy.context.view_layer.objects.active = o
bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', use_selection=True, export_yup=True, export_apply=True, export_vertex_color='ACTIVE')
print('exported', out, len(o.data.polygons), 'faces')

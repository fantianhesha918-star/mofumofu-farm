"""カジノの外観モデルを作る(Blender 5.x のバックグラウンド実行)。
使い方: blender -b -P tools/make_casino_blender.py -- 出力.glb
モデルの向き: 入口が +Z 側。原点=足元の中心。幅(x)=8、奥行き(z)=6.4、棟の高さ約6.2。
"""
import bpy, sys, math

out = sys.argv[sys.argv.index('--') + 1]
bpy.ops.wm.read_factory_settings(use_empty=True)

def mat(name, rgb, emit=0.0, rough=0.7, metal=0.0):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*rgb, 1)
    b.inputs['Roughness'].default_value = rough; b.inputs['Metallic'].default_value = metal
    if emit > 0:
        b.inputs['Emission Color'].default_value = (*rgb, 1); b.inputs['Emission Strength'].default_value = emit
    return m

def hexc(h):
    h = h.lstrip('#'); c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return [(v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4) for v in c]

M = {
    'wall': mat('wall', hexc('#8c1f2e')), 'trim': mat('trim', hexc('#e0b040'), rough=0.35, metal=0.6),
    'roof': mat('roof', hexc('#2d2433')), 'door': mat('door', hexc('#3a2418')), 'glass': mat('glass', hexc('#ffd77a'), emit=2.0),
    'bulb': mat('bulb', hexc('#fff0a0'), emit=4.0), 'carpet': mat('carpet', hexc('#b0182c')), 'stone': mat('stone', hexc('#cfc3ad')),
    'sign': mat('sign', hexc('#16101c')), 'neon': mat('neon', hexc('#ff5a8a'), emit=3.0),
}
objs = []

def box(name, sx, sy, sz, x, y, z, m, rx=0, ry=0, rz=0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x, -z, y))   # blender: y前 -> glTFのz。ここは (x, 奥行き, 高さ) で指定
    o = bpy.context.object; o.name = name; o.scale = (sx, sz, sy); o.rotation_euler = (rx, rz, ry)
    o.data.materials.append(M[m]); objs.append(o); return o

def cyl(name, r, h, x, y, z, m, seg=14):
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=h, vertices=seg, location=(x, -z, y))
    o = bpy.context.object; o.name = name; o.data.materials.append(M[m]); objs.append(o); return o

def sph(name, r, x, y, z, m):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, segments=8, ring_count=6, location=(x, -z, y))
    o = bpy.context.object; o.name = name; o.data.materials.append(M[m]); objs.append(o); return o

W, D, H = 8.0, 6.4, 4.0
# 土台と階段
box('base', W + 0.8, 0.35, D + 0.8, 0, 0.175, 0, 'stone')
box('step', 3.0, 0.2, 1.2, 0, 0.1, D / 2 + 0.9, 'stone')
box('carpet', 1.9, 0.06, 2.2, 0, 0.38, D / 2 + 1.0, 'carpet')
# 本体
box('body', W, H, D, 0, 0.35 + H / 2, 0, 'wall')
# 金の帯(腰・軒)
box('trim_low', W + 0.12, 0.18, D + 0.12, 0, 0.55, 0, 'trim')
box('trim_top', W + 0.3, 0.25, D + 0.3, 0, 0.35 + H, 0, 'trim')
# 屋根(平屋根+低い寄棟風の二段)
box('roof1', W + 0.9, 0.35, D + 0.9, 0, 0.35 + H + 0.42, 0, 'roof')
box('roof2', W - 1.2, 0.5, D - 1.2, 0, 0.35 + H + 0.85, 0, 'roof')
# 入口まわり: 柱2本+ひさし
for sx in (-1.45, 1.45):
    cyl('pillar', 0.22, H - 0.2, sx, 0.35 + (H - 0.2) / 2, D / 2 + 1.55, 'trim')
box('canopy', 3.9, 0.22, 2.3, 0, 0.35 + H - 0.55, D / 2 + 0.95, 'trim')
box('door', 1.5, 2.5, 0.12, 0, 0.35 + 1.25, D / 2 + 0.03, 'door')
for sx in (-0.3, 0.3):
    sph('knob', 0.07, sx, 1.5, D / 2 + 0.14, 'trim')
box('door_glow', 1.3, 0.35, 0.08, 0, 0.35 + 2.75, D / 2 + 0.03, 'glass')
# 看板(屋根の上に大きな板+ふち+電球)
SY = 0.35 + H + 1.55
box('sign_board', 5.6, 1.6, 0.35, 0, SY, D / 2 - 0.5, 'sign')
box('sign_frame_t', 5.9, 0.14, 0.45, 0, SY + 0.87, D / 2 - 0.5, 'trim')
box('sign_frame_b', 5.9, 0.14, 0.45, 0, SY - 0.87, D / 2 - 0.5, 'trim')
for sx in (-2.95, 2.95):
    box('sign_frame_s', 0.14, 1.9, 0.45, sx, SY, D / 2 - 0.5, 'trim')
for i in range(15):   # ふちの電球
    x = -2.8 + i * 0.4; sph('bulb', 0.07, x, SY + 0.87, D / 2 - 0.22, 'bulb'); sph('bulb', 0.07, x, SY - 0.87, D / 2 - 0.22, 'bulb')
for i in range(4):
    y = SY - 0.45 + i * 0.3; sph('bulb', 0.07, -2.95, y, D / 2 - 0.22, 'bulb'); sph('bulb', 0.07, 2.95, y, D / 2 - 0.22, 'bulb')
# 看板の上のかざり: スペード・ダイヤっぽい飾り玉と星
for sx in (-2.6, 2.6):
    sph('orb', 0.28, sx, SY + 1.25, D / 2 - 0.5, 'neon')
# 窓(左右に2つずつ)
for sx in (-2.7, 2.7):
    box('win', 1.4, 1.4, 0.1, sx, 0.35 + 2.0, D / 2 + 0.03, 'glass')
    box('win_frame', 1.6, 1.6, 0.06, sx, 0.35 + 2.0, D / 2 + 0.0, 'trim')
for sz in (-1.2, 1.2):
    for sx in (-W / 2, W / 2):
        box('win_side', 0.1, 1.2, 1.2, sx, 0.35 + 2.0, sz, 'glass')

bpy.ops.object.select_all(action='DESELECT')
for o in objs: o.select_set(True)
bpy.context.view_layer.objects.active = objs[0]
bpy.ops.object.join()
bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', use_selection=True, export_yup=True, export_apply=True)
print('exported', out)

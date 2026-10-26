"""ステージごとの かざり(木のかわり)を Blender で作る。ぜんぶ 頂点カラー・単一メッシュ。足元が原点(Z上)。
使い方: blender -b -P tools/make_theme_deco.py -- 出力フォルダ(docs/assets)
出力: deco_reed / deco_rock_smooth / deco_tomb / deco_cross / deco_wisp / deco_sunflower / deco_ruin_arch /
      deco_pillar_broken / deco_pearl_shell / deco_spire / deco_banner / deco_torii / deco_toro  (_lite.glb)
"""
import bpy, sys, math, random

out = sys.argv[sys.argv.index('--') + 1]
random.seed(11)

def lin(h):
    h = h.lstrip('#'); c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return [(v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4) for v in c]

parts = []
MAT = None

def finish_part(o, col, smooth=False):
    me = o.data
    at = me.color_attributes.new(name='Col', type='FLOAT_COLOR', domain='POINT')
    c = lin(col) + [1.0]
    at.data.foreach_set('color', c * len(me.vertices)); me.color_attributes.active_color = at
    if smooth: bpy.ops.object.shade_smooth()
    parts.append(o); return o

def box(sx, sy, sz, x, y, z, col, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x, y, z)); o = bpy.context.object; o.scale = (sx, sy, sz); o.rotation_euler = rot
    return finish_part(o, col)

def cyl(r, h, x, y, z, col, seg=10, rot=(0, 0, 0), r2=None):
    if r2 is None:
        bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=h, vertices=seg, location=(x, y, z))
    else:
        bpy.ops.mesh.primitive_cone_add(radius1=r, radius2=r2, depth=h, vertices=seg, location=(x, y, z))
    o = bpy.context.object; o.rotation_euler = rot; return finish_part(o, col)

def sph(r, x, y, z, col, scale=(1, 1, 1), seg=12, ring=8):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, segments=seg, ring_count=ring, location=(x, y, z)); o = bpy.context.object; o.scale = scale
    return finish_part(o, col, smooth=True)

def build(name):
    global parts
    bpy.ops.object.select_all(action='DESELECT')
    for o in parts: o.select_set(True)
    bpy.context.view_layer.objects.active = parts[0]
    bpy.ops.object.join(); o = bpy.context.object
    # 足元を z=0 に そろえる
    zmin = min((o.matrix_world @ v.co).z for v in o.data.vertices)
    for v in o.data.vertices: v.co.z -= zmin
    o.data.materials.clear(); o.data.materials.append(MAT)
    bpy.ops.object.select_all(action='DESELECT'); o.select_set(True); bpy.context.view_layer.objects.active = o
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    bpy.ops.export_scene.gltf(filepath=f'{out}/{name}_lite.glb', export_format='GLB', use_selection=True, export_yup=True, export_apply=True, export_vertex_color='ACTIVE')
    print('exported', name, len(o.data.polygons), 'faces')
    bpy.data.objects.remove(o, do_unlink=True); parts = []

def start():
    global MAT, parts
    bpy.ops.wm.read_factory_settings(use_empty=True); parts = []
    MAT = bpy.data.materials.new('m'); MAT.use_nodes = True
    b = MAT.node_tree.nodes['Principled BSDF']; b.inputs['Base Color'].default_value = (1, 1, 1, 1); b.inputs['Roughness'].default_value = 0.9; b.inputs['Metallic'].default_value = 0.0

# ---- ヨシ(ガマ) ----
start()
for i in range(9):
    a = i * 2.4; r = random.uniform(0.0, 0.45); h = random.uniform(1.3, 2.0); tl = random.uniform(-0.12, 0.12); tl2 = random.uniform(-0.12, 0.12)
    x, y = math.cos(a) * r, math.sin(a) * r
    cyl(0.025, h, x, y, h / 2, '#6f9a3c', 6, rot=(tl, tl2, 0))
    if i % 2 == 0: cyl(0.07, 0.38, x + tl2 * h * 0.5, y - tl * h * 0.5, h * 0.88, '#7a4a28', 8, rot=(tl, tl2, 0))
build('deco_reed')

# ---- なめらかな石 ----
start()
sph(0.6, 0, 0, 0.32, '#8e8a82', (1.2, 1.0, 0.62)); sph(0.4, 0.8, 0.3, 0.2, '#9c978d', (1.1, 1.0, 0.6)); sph(0.28, -0.6, 0.5, 0.15, '#7e7a72', (1.0, 1.0, 0.6))
build('deco_rock_smooth')

# ---- 墓石 ----
start()
box(1.3, 0.9, 0.18, 0, 0, 0.09, '#6a6a72'); box(0.9, 0.3, 0.9, 0, 0, 0.45, '#77777f'); cyl(0.45, 0.3, 0, 0, 0.9, '#808089', 16, rot=(math.pi / 2, 0, 0))
box(0.55, 0.32, 0.1, 0, 0.02, 0.75, '#5a5a62')
sph(0.25, 0.35, 0.35, 0.12, '#3f5a38', (1.4, 1.0, 0.5))
build('deco_tomb')

# ---- 十字架の はか ----
start()
box(1.1, 0.9, 0.2, 0, 0, 0.1, '#6a6a72'); box(0.3, 0.3, 1.3, 0, 0, 0.85, '#7d7d86'); box(0.9, 0.3, 0.28, 0, 0, 1.15, '#7d7d86')
sph(0.2, -0.35, 0.3, 0.2, '#3f5a38', (1.3, 1.0, 0.6))
build('deco_cross')

# ---- ひとだま ----
start()
sph(0.5, 0, 0, 0.5, '#9fe8ff', (1, 1, 1.15)); sph(0.28, 0, 0, 0.45, '#ffffff', (1, 1, 1.1)); cyl(0.32, 0.9, 0, 0, 1.15, '#9fe8ff', 12, r2=0.0)
sph(0.12, 0.35, 0, 0.1, '#cfe9ff')
build('deco_wisp')

# ---- ひまわり ----
start()
cyl(0.1, 3.0, 0, 0, 1.5, '#4f8a2c', 8)
for sgn in (1, -1): sph(0.45, sgn * 0.4, 0, 1.2, '#5ea038', (1.2, 0.5, 0.18))
cyl(0.55, 0.22, 0, 0.12, 3.15, '#5a3a1c', 16, rot=(math.pi / 2 - 0.25, 0, 0))
for i in range(14):
    a = i * 2 * math.pi / 14; cx, cz = math.cos(a) * 0.82, math.sin(a) * 0.82
    sph(0.32, cx, 0.1, 3.15 + cz, '#ffc61a', (0.6, 0.2, 1.2), seg=8, ring=6).rotation_euler = (0, a - math.pi / 2, 0)
build('deco_sunflower')

# ---- いせきの アーチ ----
start()
box(0.8, 0.8, 3.2, -1.5, 0, 1.6, '#b9b2a2'); box(0.8, 0.8, 2.1, 1.5, 0, 1.05, '#b0a998'); box(4.0, 0.9, 0.7, -0.0, 0, 3.2, '#c3bcac', rot=(0, 0.04, 0))
box(0.95, 0.95, 0.25, -1.5, 0, 0.12, '#9a9486'); box(0.95, 0.95, 0.25, 1.5, 0, 0.12, '#9a9486')
sph(0.5, -1.5, 0, 3.55, '#5c8a3c', (1.8, 1.0, 0.4)); sph(0.4, 1.5, 0, 2.1, '#5c8a3c', (1.4, 1.0, 0.4)); box(0.5, 0.5, 0.4, 2.3, 0.4, 0.2, '#b0a998', rot=(0, 0, 0.5))
build('deco_ruin_arch')

# ---- おれた はしら ----
start()
cyl(0.65, 2.4, 0, 0, 1.2, '#bdb6a6', 14); cyl(0.7, 0.3, 0, 0, 0.15, '#a49d8e', 14); cyl(0.72, 0.25, 0, 0, 2.5, '#c9c2b2', 14, rot=(0.0, 0.5, 0.0))
cyl(0.6, 0.9, 1.5, 0.3, 0.6, '#b4ad9d', 14, rot=(0, math.pi / 2, 0)); cyl(0.55, 0.7, -1.2, 0.9, 0.55, '#b0a999', 14, rot=(math.pi / 2, 0, 0.4))
sph(0.45, 0.55, 0.2, 0.3, '#5c8a3c', (1.5, 1.0, 0.5))
build('deco_pillar_broken')

# ---- しんじゅの かい ----
start()
sph(1.0, 0, 0, 0.35, '#f2b6c8', (1.0, 0.85, 0.42), seg=16, ring=10)
for i in range(7):
    a = -1.2 + i * 0.4; cyl(0.06, 0.8, math.sin(a) * 0.6, -math.cos(a) * 0.5, 0.55, '#e59ab0', 6, rot=(0.6, 0, a))
sph(0.42, 0, 0, 0.78, '#fff7ee', seg=14, ring=10)
build('deco_pearl_shell')

# ---- せんとう(やみの しろ) ----
start()
cyl(0.95, 4.2, 0, 0, 2.1, '#3e3850', 12); cyl(1.1, 0.35, 0, 0, 4.25, '#2c2638', 12)
for i in range(8):
    a = i * math.pi / 4; box(0.4, 0.4, 0.45, math.cos(a) * 1.0, math.sin(a) * 1.0, 4.65, '#2c2638', rot=(0, 0, a))
cyl(1.15, 2.4, 0, 0, 5.8, '#241c30', 12, r2=0.0); cyl(0.05, 1.0, 0, 0, 7.6, '#6a6078', 6); box(0.7, 0.05, 0.4, 0.38, 0, 7.8, '#7a1230')
box(0.35, 0.12, 0.8, 0.0, -0.93, 2.2, '#f2b040')
build('deco_spire')

# ---- はた ----
start()
box(0.9, 0.9, 0.3, 0, 0, 0.15, '#3a3444'); cyl(0.08, 4.3, 0, 0, 2.3, '#2a2432', 8)
box(1.4, 0.06, 2.0, 0.75, 0, 3.0, '#7a1230'); box(0.5, 0.08, 0.5, 0.75, 0, 3.0, '#d8a838'); sph(0.14, 0, 0, 4.5, '#d8a838')
build('deco_banner')

# ---- とりい ----
start()
for sx in (-1.6, 1.6): cyl(0.24, 3.6, sx, 0, 1.8, '#c8321e', 10); box(0.6, 0.6, 0.2, sx, 0, 0.1, '#2a2a2a')
box(4.8, 0.45, 0.4, 0, 0, 3.55, '#2a2a2a'); box(4.3, 0.34, 0.34, 0, 0, 3.32, '#c8321e'); box(3.5, 0.24, 0.28, 0, 0, 2.7, '#c8321e'); box(0.3, 0.3, 0.5, 0, 0, 3.1, '#c8321e')
build('deco_torii')

# ---- いしどうろう ----
start()
cyl(0.55, 0.3, 0, 0, 0.15, '#9a968c', 8); cyl(0.2, 1.0, 0, 0, 0.8, '#aaa69c', 8); cyl(0.5, 0.2, 0, 0, 1.4, '#9a968c', 8)
box(0.62, 0.62, 0.55, 0, 0, 1.78, '#d8d2c0'); box(0.34, 0.34, 0.5, 0, -0.3, 1.78, '#ffd36a')
cyl(0.85, 0.45, 0, 0, 2.28, '#8a867c', 4, r2=0.2, rot=(0, 0, math.pi / 4)); sph(0.13, 0, 0, 2.62, '#aaa69c')
build('deco_toro')

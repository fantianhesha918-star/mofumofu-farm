"""フィールドの たからばこを Blender で作る(頂点カラー・面取りあり)。
使い方: blender -b -P tools/make_chest.py -- 出力フォルダ(docs/assets)
出力: chest_base_lite.glb(はこの ほんたい。なかに こばんと ほうせき) / chest_lid_lite.glb(ふた。げんてん=ちょうつがい)
向き: まえが +Z(glTF)。はばは x=1.5、おくゆき 1.0。ほんたいの たかさ 0.7。
"""
import bpy, sys, math, bmesh

out = sys.argv[sys.argv.index('--') + 1]

def lin(h):
    h = h.lstrip('#'); c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return [(v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4) for v in c]

parts = []; MAT = None

def paint(o, col, smooth=False):
    me = o.data
    at = me.color_attributes.new(name='Col', type='FLOAT_COLOR', domain='POINT')
    at.data.foreach_set('color', (lin(col) + [1.0]) * len(me.vertices))
    me.color_attributes.active_color = at
    if smooth: bpy.ops.object.shade_smooth()
    parts.append(o); return o

def rbox(sx, sy, sz, x, y, z, col, bev=0.025, rot=(0, 0, 0)):
    """面取りした はこ。(x,y,z)は ちゅうしん。yは Blender の おくゆき(まえ=-y)"""
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x, y, z)); o = bpy.context.object; o.scale = (sx, sy, sz)
    bpy.ops.object.transform_apply(scale=True); o.rotation_euler = rot
    if bev > 0:
        m = o.modifiers.new('b', 'BEVEL'); m.width = min(bev, min(sx, sy, sz) * 0.45); m.segments = 2; m.limit_method = 'NONE'
        bpy.ops.object.modifier_apply(modifier='b')
    return paint(o, col)

def cyl(r, h, x, y, z, col, seg=12, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=h, vertices=seg, location=(x, y, z)); o = bpy.context.object; o.rotation_euler = rot
    return paint(o, col)

def sph(r, x, y, z, col, scale=(1, 1, 1), seg=12, ring=8):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, segments=seg, ring_count=ring, location=(x, y, z)); o = bpy.context.object; o.scale = scale
    return paint(o, col, smooth=True)

def ico(r, x, y, z, col, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_ico_sphere_add(radius=r, subdivisions=1, location=(x, y, z)); o = bpy.context.object; o.rotation_euler = rot
    return paint(o, col)

def half_cyl(r, length, x, y, z, col, sz=1.0, seg=20):
    """x じくの はんえん(うえがわだけ)。zの たかさは sz ばい"""
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=length, vertices=seg, location=(x, y, z)); o = bpy.context.object
    o.rotation_euler = (0, math.pi / 2, 0); bpy.ops.object.transform_apply(rotation=True)
    bm = bmesh.new(); bm.from_mesh(o.data)
    geom = bm.verts[:] + bm.edges[:] + bm.faces[:]
    bmesh.ops.bisect_plane(bm, geom=geom, dist=0.0001, plane_co=(0, 0, z), plane_no=(0, 0, 1), clear_inner=True, use_snap_center=False)
    cut = [e for e in bm.edges if e.is_boundary]
    if cut: bmesh.ops.holes_fill(bm, edges=cut)
    bm.to_mesh(o.data); bm.free()
    for v in o.data.vertices: v.co.z = z + (v.co.z - z) * sz
    return paint(o, col, smooth=True)

def start():
    global MAT, parts
    bpy.ops.wm.read_factory_settings(use_empty=True); parts = []
    MAT = bpy.data.materials.new('m'); MAT.use_nodes = True
    b = MAT.node_tree.nodes['Principled BSDF']; b.inputs['Base Color'].default_value = (1, 1, 1, 1); b.inputs['Roughness'].default_value = 0.78; b.inputs['Metallic'].default_value = 0.0

def build(name, shift=(0, 0, 0)):
    global parts
    bpy.ops.object.select_all(action='DESELECT')
    for o in parts: o.select_set(True)
    bpy.context.view_layer.objects.active = parts[0]
    bpy.ops.object.join(); o = bpy.context.object
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    for v in o.data.vertices: v.co.x -= shift[0]; v.co.y -= shift[1]; v.co.z -= shift[2]
    o.data.materials.clear(); o.data.materials.append(MAT)
    bpy.ops.object.select_all(action='DESELECT'); o.select_set(True); bpy.context.view_layer.objects.active = o
    bpy.ops.export_scene.gltf(filepath=f'{out}/{name}_lite.glb', export_format='GLB', use_selection=True, export_yup=True, export_apply=True, export_vertex_color='ACTIVE')
    print('exported', name, len(o.data.polygons), 'faces')
    bpy.data.objects.remove(o, do_unlink=True); parts = []

WOOD, WOOD2, WOOD3 = '#8f5d2e', '#7a4c24', '#5e3818'
IRON, GOLD, GOLD2 = '#4b4a52', '#e6bd48', '#fff0a0'
W, D, H = 1.5, 1.0, 0.7          # ほんたい: はば・おくゆき・たかさ
HY = D / 2                       # ちょうつがいの いち(うしろ はし)

# ---------------- ほんたい ----------------
start()
rbox(W, D, H, 0, 0, H / 2, WOOD, 0.035)
for z in (0.17, 0.35, 0.53):    # いたの みぞ(まえ・うしろ・よこ)
    rbox(W - 0.02, 0.014, 0.014, 0, -D / 2 - 0.002, z, WOOD3, 0); rbox(W - 0.02, 0.014, 0.014, 0, D / 2 + 0.002, z, WOOD3, 0)
    rbox(0.014, D - 0.02, 0.014, -W / 2 - 0.002, 0, z, WOOD3, 0); rbox(0.014, D - 0.02, 0.014, W / 2 + 0.002, 0, z, WOOD3, 0)
rbox(W + 0.06, D + 0.06, 0.06, 0, 0, H - 0.03, IRON, 0.02)        # ふちの てつわ
rbox(W + 0.06, D + 0.06, 0.07, 0, 0, 0.035, IRON, 0.02)            # したの てつわ
for sx in (-1, 1):                                                  # かどの はばひろの かなぐ
    for sy in (-1, 1):
        rbox(0.2, 0.2, H + 0.02, sx * (W / 2 - 0.05), sy * (D / 2 - 0.05), H / 2, IRON, 0.03)
        cyl(0.028, 0.03, sx * (W / 2 - 0.05), sy * (D / 2 + 0.056), 0.5, GOLD2, 8, rot=(math.pi / 2, 0, 0)); cyl(0.028, 0.03, sx * (W / 2 - 0.05), sy * (D / 2 + 0.056), 0.2, GOLD2, 8, rot=(math.pi / 2, 0, 0))
for sx in (-1, 1):                                                  # きんいろの たてぼね(まえ・うしろ)
    for sy in (-1, 1):
        rbox(0.15, 0.03, H - 0.02, sx * 0.46, sy * (D / 2 + 0.012), H / 2, GOLD, 0.012)
        for z in (0.12, 0.58): cyl(0.022, 0.03, sx * 0.46, sy * (D / 2 + 0.034), z, GOLD2, 8, rot=(math.pi / 2, 0, 0))
for sx in (-1, 1):                                                  # あし
    for sy in (-1, 1): rbox(0.16, 0.16, 0.05, sx * (W / 2 - 0.1), sy * (D / 2 - 0.1), 0.0, WOOD3, 0.02)
# まえの かぎあな プレート
rbox(0.3, 0.05, 0.34, 0, -D / 2 - 0.03, 0.5, GOLD, 0.02); cyl(0.035, 0.03, 0, -D / 2 - 0.065, 0.52, '#2a1a08', 10, rot=(math.pi / 2, 0, 0)); rbox(0.025, 0.03, 0.1, 0, -D / 2 - 0.065, 0.45, '#2a1a08', 0)
# ふたを あけた とき みえる なか
rbox(W - 0.14, D - 0.14, 0.03, 0, 0, H - 0.1, '#33200e', 0)          # なかの ぞこ
for i, (x, y, r) in enumerate([(-0.45, 0.05, 0.34), (0.1, -0.1, 0.42), (0.5, 0.12, 0.3), (-0.1, 0.22, 0.32), (0.0, -0.28, 0.28), (-0.5, -0.25, 0.26)]):
    sph(r, x, y, H - 0.08, GOLD, (1, 1, 0.5), seg=12, ring=8)
for i in range(22):                                                 # こばん
    a = i * 2.39; rr = 0.12 + (i * 0.037) % 0.5
    x, y = math.cos(a) * rr * 1.2, math.sin(a) * rr * 0.62
    cyl(0.07, 0.016, x, y, H + 0.04 + (i % 4) * 0.025, GOLD if i % 3 else GOLD2, 14, rot=((i % 5 - 2) * 0.22, (i % 3 - 1) * 0.3, a))
for x, y, col in [(-0.3, 0.1, '#e03a4a'), (0.35, -0.12, '#3a8ae0'), (0.05, 0.25, '#3ad07a'), (-0.1, -0.2, '#c04af0')]:   # ほうせき
    ico(0.075, x, y, H + 0.1, col, rot=(0.4, 0.3, x * 4))
build('chest_base')

# ---------------- ふた(げんてん = ちょうつがい。うしろの ふち) ----------------
start()
LR = D / 2                      # ふたの はんけい
cy = -HY                        # ふたの ちゅうしん y(ちょうつがい から まえへ)
half_cyl(LR, W - 0.02, 0, 0, H, WOOD2, sz=0.62)                       # まるい ふた
rbox(W, D, 0.07, 0, 0, H + 0.035, WOOD3, 0.02)                         # ふたの わく(した)
for ix in (-1, 1):                                                     # きんいろの バンド
    half_cyl(LR + 0.03, 0.15, ix * 0.46, 0, H, GOLD, sz=0.66)
for ix in (-1, 1):                                                     # よこの てつの ふち
    half_cyl(LR + 0.025, 0.07, ix * (W / 2 - 0.04), 0, H, IRON, sz=0.66)
cyl(0.03, W + 0.08, 0, HY + 0.03, H + 0.02, IRON, 10, rot=(0, math.pi / 2, 0))   # ちょうつがい
# まえの ロック(ふた がわ)
rbox(0.2, 0.05, 0.12, 0, -D / 2 - 0.04, H + 0.1, GOLD, 0.02)
sph(0.05, 0, -D / 2 - 0.07, H + 0.15, GOLD2, (1, 0.6, 1))
build('chest_lid', shift=(0, HY, H))

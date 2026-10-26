"""宇宙フィールドの かざり(星・わくせい・月・みかづき)を Blender で作る。ライトを使わない頂点カラー付き。
使い方: blender -b -P tools/make_space_deco.py -- 出力フォルダ(docs/assets)
出力: deco_star5_lite.glb / deco_planet_ring_lite.glb / deco_planet_moon_lite.glb / deco_crescent_lite.glb
"""
import bpy, bmesh, sys, math, random
from mathutils import Vector

out = sys.argv[sys.argv.index('--') + 1]
random.seed(7)

def lin(h):
    h = h.lstrip('#'); c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return [(v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4) for v in c]

def new_obj(name, verts, faces):
    me = bpy.data.meshes.new(name); me.from_pydata(verts, [], faces); me.update()
    o = bpy.data.objects.new(name, me); bpy.context.collection.objects.link(o); return o

def paint(o, fn):
    me = o.data; at = me.color_attributes.new(name='Col', type='FLOAT_COLOR', domain='POINT')
    data = []
    for v in me.vertices: data += list(fn(v.co)) + [1.0]
    at.data.foreach_set('color', data); me.color_attributes.active_color = at

def join_export(objs, fname):
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs: o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    if len(objs) > 1: bpy.ops.object.join()
    bpy.ops.export_scene.gltf(filepath=out + '/' + fname, export_format='GLB', use_selection=True, export_yup=True,
                              export_apply=True, export_vertex_color='ACTIVE', export_active_vertex_color_when_no_material=True)
    print('exported', fname)

def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def sphere(name, r, seg, ring):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, segments=seg, ring_count=ring); o = bpy.context.object; o.name = name
    bpy.ops.object.shade_smooth(); return o

# ---- 星(ぷっくり5つ角) ----
reset()
vs = [(0, 0, 0.3), (0, 0, -0.3)]
for i in range(10):
    a = math.pi / 2 + i * math.pi / 5; r = 1.0 if i % 2 == 0 else 0.5
    vs.append((math.cos(a) * r, 0, math.sin(a) * r))
fs = []
for i in range(10):
    j = 2 + i; k = 2 + (i + 1) % 10
    fs.append((0, j, k)); fs.append((1, k, j))
st = new_obj('star5', vs, fs)
paint(st, lambda c: lin('#ffe27a') if (c.x * c.x + c.z * c.z) < 0.01 else lin('#ffd040'))
join_export([st], 'deco_star5_lite.glb')

# ---- 輪っか付きの わくせい ----
reset()
body = sphere('planet', 1.0, 18, 12)
bands = ['#f2c27a', '#e89a5a', '#f7dca0', '#d97a4a', '#f2c27a', '#e8b070']
def band(c):
    t = (c.z + 1) / 2; i = min(len(bands) - 1, int(t * len(bands)))
    return lin(bands[i])
paint(body, band)
ring_v, ring_f = [], []
n = 36
for i in range(n):
    a = i * 2 * math.pi / n
    ring_v += [(math.cos(a) * 1.45, math.sin(a) * 1.45, 0), (math.cos(a) * 2.2, math.sin(a) * 2.2, 0)]
for i in range(n):
    a, b = i * 2, ((i + 1) % n) * 2
    ring_f.append((a, a + 1, b + 1, b))
rg = new_obj('ring', ring_v, ring_f)
paint(rg, lambda c: lin('#f6e6c0') if (c.x * c.x + c.y * c.y) < 3.6 else lin('#c9b48a'))
rg.rotation_euler = (math.radians(72), math.radians(8), math.radians(-18)); body.rotation_euler = (0, 0, 0)
bpy.context.view_layer.update()
for o in (rg,):
    bpy.context.view_layer.objects.active = o; o.select_set(True); bpy.ops.object.transform_apply(rotation=True)
join_export([body, rg], 'deco_planet_ring_lite.glb')

# ---- 月(クレーターつき) ----
reset()
mo = sphere('moon', 1.0, 22, 14)
craters = [Vector((random.uniform(-1, 1), random.uniform(-1, 1), random.uniform(-1, 1))).normalized() for _ in range(9)]
sizes = [random.uniform(0.28, 0.5) for _ in craters]
def moon(c):
    v = c.normalized(); col = lin('#d8d6cc')
    for cr, sz in zip(craters, sizes):
        d = (v - cr).length
        if d < sz: col = lin('#a8a69c') if d > sz * 0.7 else lin('#8e8c84'); break
    return col
paint(mo, moon)
join_export([mo], 'deco_planet_moon_lite.glb')

# ---- みかづき ----
reset()
bpy.ops.mesh.primitive_cylinder_add(radius=1.0, depth=0.5, vertices=32); a = bpy.context.object; a.rotation_euler = (math.pi / 2, 0, 0)
bpy.ops.mesh.primitive_cylinder_add(radius=0.82, depth=0.7, vertices=32, location=(0.42, 0, 0)); b = bpy.context.object; b.rotation_euler = (math.pi / 2, 0, 0)
bpy.context.view_layer.objects.active = a; a.select_set(True)
for o in (a, b): bpy.ops.object.select_all(action='DESELECT'); o.select_set(True); bpy.context.view_layer.objects.active = o; bpy.ops.object.transform_apply(rotation=True)
md = a.modifiers.new('cut', 'BOOLEAN'); md.operation = 'DIFFERENCE'; md.object = b; md.solver = 'EXACT'
bpy.context.view_layer.objects.active = a; bpy.ops.object.modifier_apply(modifier='cut')
bpy.data.objects.remove(b, do_unlink=True)
paint(a, lambda c: lin('#fff2b0'))
join_export([a], 'deco_crescent_lite.glb')

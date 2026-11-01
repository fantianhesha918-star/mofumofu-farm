"""Blender用の ぶひん づくり ヘルパー(頂点カラー・面取り・ノイズの いろむら・コケ)。
tools/make_*_hq.py から  exec(open(.../blib.py).read())  ではなく  sys.path に tools を いれて import blib  で つかう。
ぜんぶ Z が うえ・足元が原点。出力は _lite.glb(頂点カラー、単一メッシュ)。
"""
import bpy, bmesh, math, random, sys
from mathutils import noise, Vector

parts = []; MAT = None; OUT = '.'

def lin(h):
    h = h.lstrip('#'); c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return [(v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4) for v in c]

def mix(a, b, t):
    t = max(0.0, min(1.0, t)); return [a[i] * (1 - t) + b[i] * t for i in range(3)]

def paint(o, col, noise_amt=0.12, freq=2.2, moss=None, top=None, glow=0.0, smooth=False, seed=0, shade=None, band=None):
    """いろを ぬる。noise_amt: いろむら / moss=(いろ, たかさ): したから その たかさまで コケ / top=(いろ, たかさ): うえを その いろに"""
    me = o.data; base = lin(col); mc = lin(moss[0]) if moss else None; tc = lin(top[0]) if top else None
    at = me.color_attributes.new(name='Col', type='FLOAT_COLOR', domain='POINT'); buf = []
    mw = o.matrix_world
    for v in me.vertices:
        p = mw @ v.co; n = noise.noise(Vector((p.x * freq + seed, p.y * freq, p.z * freq))) * 0.5 + 0.5
        f = 1 + (n - 0.5) * 2 * noise_amt; c = [min(1.0, base[i] * f) for i in range(3)]
        if mc:
            m = noise.noise(Vector((p.x * 3.1 + 9, p.y * 3.1, p.z * 3.1))) * 0.5 + 0.5
            c = mix(c, [min(1.0, mc[i] * (0.8 + 0.4 * m)) for i in range(3)], (moss[1] - p.z) / max(0.05, moss[1]) * 1.3 - 0.15 + (m - 0.5) * 0.5)
        if tc and p.z > top[1]: c = mix(c, tc, (p.z - top[1]) / 0.12)
        if glow: c = [min(1.0, x + glow) for x in c]
        if band: c = mix(c, lin(band[0]), 0.5 + 0.5 * math.sin(p.z * band[1] + noise.noise(Vector((p.x, p.y, p.z)) * 0.8) * 1.5) - 0.5 if band[2] else 0.5 + 0.5 * math.sin(p.z * band[1]))
        if shade:   # ライトを うけない ざいしつ(MeshBasic)むけに、めんの むきで あかるさを やきつける
            nrm = (mw.to_3x3() @ v.normal).normalized(); L = Vector(shade[:3]).normalized(); f2 = shade[3] + (1 - shade[3]) * max(0.0, nrm.dot(L)); c = [min(1.0, x * f2) for x in c]
        buf += c + [1.0]
    at.data.foreach_set('color', buf); me.color_attributes.active_color = at
    if smooth: bpy.ops.object.shade_smooth()
    parts.append(o); return o

def rbox(sx, sy, sz, x, y, z, col, bev=0.03, rot=(0, 0, 0), jit=0.0, **kw):
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, 0)); o = bpy.context.object; o.scale = (sx, sy, sz)
    bpy.ops.object.transform_apply(scale=True)
    if bev > 0:
        m = o.modifiers.new('b', 'BEVEL'); m.width = min(bev, min(sx, sy, sz) * 0.45); m.segments = 2; m.limit_method = 'NONE'
        bpy.ops.object.modifier_apply(modifier='b')
    if jit:
        bm = bmesh.new(); bm.from_mesh(o.data)
        for v in bm.verts: v.co += Vector((random.uniform(-jit, jit), random.uniform(-jit, jit), random.uniform(-jit, jit)))
        bm.to_mesh(o.data); bm.free()
    o.rotation_euler = rot; o.location = (x, y, z); bpy.context.view_layer.update()
    return paint(o, col, **kw)

def cyl(r, h, x, y, z, col, seg=16, rot=(0, 0, 0), r2=None, **kw):
    if r2 is None: bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=h, vertices=seg, location=(0, 0, 0))
    else: bpy.ops.mesh.primitive_cone_add(radius1=r, radius2=r2, depth=h, vertices=seg, location=(0, 0, 0))
    o = bpy.context.object; o.rotation_euler = rot; o.location = (x, y, z); bpy.context.view_layer.update()
    return paint(o, col, **kw)

def sph(r, x, y, z, col, scale=(1, 1, 1), seg=16, ring=10, rot=(0, 0, 0), **kw):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, segments=seg, ring_count=ring, location=(0, 0, 0)); o = bpy.context.object
    o.scale = scale; bpy.ops.object.transform_apply(scale=True); o.rotation_euler = rot; o.location = (x, y, z); bpy.context.view_layer.update()
    kw.setdefault('smooth', True); return paint(o, col, **kw)

def rock(r, x, y, z, col, scale=(1, 1, 1), rough=0.22, sub=3, seed=1, **kw):
    """でこぼこの いし(ノイズで ゆがめた まるい かたまり)"""
    bpy.ops.mesh.primitive_ico_sphere_add(radius=r, subdivisions=sub, location=(0, 0, 0)); o = bpy.context.object
    for v in o.data.vertices:
        n = noise.noise(Vector((v.co.x * 1.7 + seed, v.co.y * 1.7, v.co.z * 1.7))) * rough + noise.noise(Vector((v.co.x * 5 + seed, v.co.y * 5, v.co.z * 5))) * rough * 0.3
        v.co *= 1 + n
    o.scale = scale; bpy.ops.object.transform_apply(scale=True); o.location = (x, y, z); bpy.context.view_layer.update()
    kw.setdefault('smooth', True); return paint(o, col, seed=seed, **kw)

def tube(pts, r0, r1, col, seg=8, **kw):
    """てんの ならびを ほそい くだで つなぐ(くき・つる・くびれ)。r0→r1 で ほそく"""
    n = len(pts); verts = []; faces = []
    for i, p in enumerate(pts):
        p = Vector(p); t = (Vector(pts[min(i + 1, n - 1)]) - Vector(pts[max(i - 1, 0)])).normalized()
        a = Vector((0, 0, 1)) if abs(t.z) < 0.9 else Vector((1, 0, 0)); u = t.cross(a).normalized(); w = t.cross(u).normalized(); r = r0 + (r1 - r0) * i / max(1, n - 1)
        for k in range(seg):
            th = k / seg * 2 * math.pi; verts.append(p + u * math.cos(th) * r + w * math.sin(th) * r)
    for i in range(n - 1):
        for k in range(seg):
            a = i * seg + k; b = i * seg + (k + 1) % seg; faces.append((a, b, b + seg, a + seg))
    faces.append(tuple(range(seg - 1, -1, -1))); faces.append(tuple(range((n - 1) * seg, n * seg)))
    me = bpy.data.meshes.new('t'); me.from_pydata([tuple(v) for v in verts], [], faces); me.update()
    o = bpy.data.objects.new('t', me); bpy.context.collection.objects.link(o); bpy.context.view_layer.objects.active = o
    kw.setdefault('smooth', True); return paint(o, col, **kw)

def leaf(length, width, x, y, z, col, rot=(0, 0, 0), bend=0.3, **kw):
    """うすい はっぱ(ひし形を まげたもの)。さきが +Y"""
    N = 6; vs = []; fs = []
    for i in range(N + 1):
        t = i / N; w = width * math.sin(math.pi * min(1, t * 1.05)) * (1 - t * 0.2) / 2; yy = t * length; zz = -bend * (t ** 2) * length
        vs += [(-w, yy, zz), (w, yy, zz + 0.002)]
    for i in range(N): a = i * 2; fs.append((a, a + 1, a + 3, a + 2))
    me = bpy.data.meshes.new('l'); me.from_pydata(vs, [], fs); me.update(); o = bpy.data.objects.new('l', me); bpy.context.collection.objects.link(o)
    bpy.context.view_layer.objects.active = o; mod = o.modifiers.new('s', 'SOLIDIFY'); mod.thickness = 0.008; bpy.ops.object.modifier_apply(modifier='s')
    o.rotation_euler = rot; o.location = (x, y, z); bpy.context.view_layer.update()
    kw.setdefault('smooth', True); return paint(o, col, **kw)

def start(out=None):
    global MAT, parts, OUT
    if out: OUT = out
    bpy.ops.wm.read_factory_settings(use_empty=True); parts = []
    MAT = bpy.data.materials.new('m'); MAT.use_nodes = True
    b = MAT.node_tree.nodes['Principled BSDF']; b.inputs['Base Color'].default_value = (1, 1, 1, 1); b.inputs['Roughness'].default_value = 0.8; b.inputs['Metallic'].default_value = 0.0

def build(name, shift=(0, 0, 0), ground=True):
    global parts
    bpy.ops.object.select_all(action='DESELECT')
    for o in parts: o.select_set(True)
    bpy.context.view_layer.objects.active = parts[0]
    bpy.ops.object.join(); o = bpy.context.object
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    zmin = min(v.co.z for v in o.data.vertices) if ground else 0
    for v in o.data.vertices: v.co.x -= shift[0]; v.co.y -= shift[1]; v.co.z -= zmin + shift[2]
    o.data.materials.clear(); o.data.materials.append(MAT)
    bpy.ops.object.select_all(action='DESELECT'); o.select_set(True); bpy.context.view_layer.objects.active = o
    bpy.ops.export_scene.gltf(filepath=f'{OUT}/{name}_lite.glb', export_format='GLB', use_selection=True, export_yup=True, export_apply=True, export_vertex_color='ACTIVE')
    print('exported', name, len(o.data.polygons), 'faces')
    bpy.data.objects.remove(o, do_unlink=True); parts = []

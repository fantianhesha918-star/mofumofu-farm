"""うちゅうの かざり(ほし・つき・わくせい・みかづき)を Blender で つくりなおす。MeshBasic(ライトなし)で つかうので、あかるさは 頂点カラーに やきつける。
使い方: blender -b -P tools/make_space_hq.py -- 出力フォルダ [なまえ ...]
"""
import bpy, sys, math, os, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import blib as B
from blib import rbox, cyl, sph, rock, start, build
args = sys.argv[sys.argv.index('--') + 1:]; OUT = args[0]; ONLY = set(args[1:]); SH = (0.4, -0.5, 0.8, 0.55)
def want(n): return not ONLY or n in ONLY

def star5():
    start(OUT)
    vs = []; fs = []; N = 10
    for k in range(N):
        a = math.pi / 2 + k * 2 * math.pi / N; r = 1.0 if k % 2 == 0 else 0.46
        vs.append((math.cos(a) * r, 0.0, math.sin(a) * r))                         # 0..9 ふち
    vs.append((0, -0.32, 0)); vs.append((0, 0.32, 0))                              # 10: まえの ちゅうしん / 11: うしろ
    for k in range(N): fs.append((10, (k + 1) % N, k)); fs.append((11, k, (k + 1) % N))
    # ふくらみ: ふちの うち がわの とげの あいだに すこし でっぱりを つける(きらきらした ほうせきふうの ほし)
    for k in range(1, N, 2):
        pass
    me = bpy.data.meshes.new('s'); me.from_pydata(vs, [], fs); me.update()
    o = bpy.data.objects.new('s', me); bpy.context.collection.objects.link(o); bpy.context.view_layer.objects.active = o
    sol = o.modifiers.new('s', 'SOLIDIFY'); sol.thickness = 0.0
    bv = o.modifiers.new('b', 'BEVEL'); bv.width = 0.03; bv.segments = 2; bpy.ops.object.modifier_apply(modifier='b')
    B.paint(o, '#ffc830', noise_amt=0.04, shade=SH, smooth=False)
    build('deco_star5')

def planet_moon():
    random.seed(2); start(OUT)
    bpy.ops.mesh.primitive_ico_sphere_add(radius=1.0, subdivisions=5, location=(0, 0, 0)); o = bpy.context.object
    from mathutils import noise, Vector
    craters = [(Vector((random.gauss(0, 1), random.gauss(0, 1), random.gauss(0, 1))).normalized(), random.uniform(0.12, 0.3)) for _ in range(16)]
    for v in o.data.vertices:
        n = v.co.normalized(); d = noise.noise(n * 2.0) * 0.05 + noise.noise(n * 6.0) * 0.02; depth = 0
        for c, r in craters:
            ang = math.acos(max(-1, min(1, n.dot(c)))); 
            if ang < r * 1.3: depth += (-0.07 * (1 - (ang / (r * 1.3)) ** 2)) + (0.025 if r * 0.85 < ang < r * 1.15 else 0)
        v.co = n * (1 + d + depth)
    B.paint(o, '#b9ad94', noise_amt=0.16, freq=3.0, shade=SH, smooth=True)
    build('deco_planet_moon')

def planet_ring():
    start(OUT)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.62, segments=48, ring_count=32, location=(0, 0, 0)); o = bpy.context.object
    B.paint(o, '#d8843a', noise_amt=0.1, freq=1.5, shade=SH, smooth=True, band=('#f4d9a0', 18, True))
    for R, r, col in ((1.0, 0.07, '#e8c88a'), (1.17, 0.08, '#c8a468'), (1.33, 0.06, '#f0dca8'), (1.46, 0.05, '#b89462')):
        bpy.ops.mesh.primitive_torus_add(major_radius=R, minor_radius=r, major_segments=64, minor_segments=8, location=(0, 0, 0)); t = bpy.context.object; t.scale = (1, 1, 0.12); bpy.ops.object.transform_apply(scale=True)
        B.paint(t, col, noise_amt=0.08, freq=3, shade=SH, smooth=True)
    for p in B.parts: p.rotation_euler = (0.38, 0.0, 0.25)
    build('deco_planet_ring')

def crescent():
    start(OUT)
    bpy.ops.mesh.primitive_cylinder_add(radius=1.0, depth=0.5, vertices=64, location=(0, 0, 0)); a = bpy.context.object; a.rotation_euler = (math.pi / 2, 0, 0); bpy.ops.object.transform_apply(rotation=True)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.82, depth=0.7, vertices=64, location=(0.38, 0, 0)); b = bpy.context.object; b.rotation_euler = (math.pi / 2, 0, 0); bpy.ops.object.transform_apply(rotation=True)
    m = a.modifiers.new('d', 'BOOLEAN'); m.operation = 'DIFFERENCE'; m.object = b; bpy.context.view_layer.objects.active = a; bpy.ops.object.modifier_apply(modifier='d')
    bpy.data.objects.remove(b, do_unlink=True)
    bv = a.modifiers.new('b', 'BEVEL'); bv.width = 0.09; bv.segments = 4; bpy.ops.object.modifier_apply(modifier='b')
    B.paint(a, '#f6d060', noise_amt=0.05, shade=SH, smooth=True)
    for x, z, r in ((0.55, 0.55, 0.06), (0.75, -0.2, 0.045), (0.5, -0.75, 0.05)):                # ちいさな ほし
        sph(r, x, 0.0, z, '#fff6c0', seg=8, ring=6, shade=SH)
    build('deco_crescent')

for n, f in (('star5', star5), ('planet_moon', planet_moon), ('planet_ring', planet_ring), ('crescent', crescent)):
    if want('deco_' + n) or want(n): f()

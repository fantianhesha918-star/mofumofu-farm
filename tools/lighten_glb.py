"""重い glb を かるくする(ポリゴンを へらし、テクスチャを ちいさく)。
使い方: blender -b -P tools/lighten_glb.py -- 入力.glb 出力.glb 目標三角形数 テクスチャ辺(px)
"""
import bpy, sys
src, dst, target, tex = sys.argv[sys.argv.index('--') + 1:][:4]; target = int(target); tex = int(tex)
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)
if bpy.data.actions or any(o.type == 'ARMATURE' for o in bpy.data.objects): print('LIGHT skip(anim)', src.split('/')[-1]); sys.exit(0)
meshes = [o for o in bpy.data.objects if o.type == 'MESH']
total = 0
for o in meshes:
    o.data.calc_loop_triangles(); total += len(o.data.loop_triangles)
for o in meshes:
    o.data.calc_loop_triangles(); n = len(o.data.loop_triangles)
    bpy.context.view_layer.objects.active = o
    md = o.modifiers.new('dec', 'DECIMATE'); md.ratio = min(1.0, target / max(1, total)); md.use_collapse_triangulate = True
    bpy.ops.object.modifier_apply(modifier='dec')
for im in bpy.data.images:
    if im.size[0] > tex: im.scale(tex, tex)
if total <= target: target = total   # すでに すくない モデルは そのまま
after = 0
for o in meshes:
    o.data.calc_loop_triangles(); after += len(o.data.loop_triangles)
bpy.ops.export_scene.gltf(filepath=dst, export_format='GLB', export_image_format='JPEG', export_jpeg_quality=85, export_draco_mesh_compression_enable=False)
print('LIGHT', src.split('/')[-1], total, '->', after)

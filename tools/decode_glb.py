"""Draco圧縮のglbを、Blenderで読み込んで非圧縮で書き出す。使い方: blender -b -P tools/decode_glb.py -- 入力.glb 出力.glb"""
import bpy, sys
a = sys.argv[sys.argv.index('--') + 1:]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=a[0])
bpy.ops.export_scene.gltf(filepath=a[1], export_format='GLB', export_draco_mesh_compression_enable=False)
print('decoded', a[1])

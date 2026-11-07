"""ボードゲームアプリ(life-road-party)の Draco圧縮GLBを、そのまま読める GLB に変換して docs/assets/gym/ へ置く
使い方: blender -b -P tools/import_bg_models.py -- <outdir> name1 name2 ...  (name は models/ の ファイル名(拡張子なし))
"""
import bpy, sys, os
argv = sys.argv[sys.argv.index('--') + 1:]
out, names = argv[0], argv[1:]
SRC = r'C:/Users/飯田/OneDrive/Desktop/クロードコード/アプリ/life-road-party/docs/models'
os.makedirs(out, exist_ok=True)
for n in names:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=f'{SRC}/{n}.glb')
    # 画像は 512px に おとして かるくする
    for im in bpy.data.images:
        if im.size[0] > 512 or im.size[1] > 512:
            try: im.scale(512, 512)
            except Exception: pass
    bpy.ops.export_scene.gltf(filepath=f'{out}/{n}_lite.glb', export_format='GLB', export_draco_mesh_compression_enable=False,
                              export_image_format='JPEG', export_jpeg_quality=82, export_apply=False)
    print('exported', n, os.path.getsize(f'{out}/{n}_lite.glb') // 1024, 'KB')

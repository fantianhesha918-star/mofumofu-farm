# もふもふ牧場(仮)

チンチラが主人公の、3D三人称視点のほのぼの牧場ゲーム(畑・牧場の世話・アイテム集め)。
ブラウザ(three.js)で動く試作版。**最終目標はUnityでの本格制作**で、この試作は見た目・操作感・ゲームの流れを固めるためのもの。

- 作成開始: 2026-10-06
- 参考: 動画 `素材/参考動画/ScreenRecording_10-06-2026 20-08-30_1.MP4`。写実寄りでやわらかい光の田園風景、革ベストのチンチラ「Chino」、NEW QUEST / ITEM GET の通知、ミニマップ
- 方針: 「できるだけ近づける」ではなく妥協せず本格的に作る(2026-10-06 ユーザー指示)

## 起動(開発)

```
cd docs && python -m http.server 8123   # http://localhost:8123/
```
画面確認用: `python shot.py 名前 "x=0&z=8&dist=4&hour=11" 1280 600 4` (ヘッドレスEdgeで読み込み完了を待って撮影。出力は作業用フォルダ)
`?shot=1&x=&z=&yaw=&pitch=&dist=&hour=&face=` で任意の位置・時刻から開始できる。

## 構成

- `docs/index.html` `style.css` `js/`
  - `data.js`: アイテム・作物・クエストの定義(**Unity移行時はそのままScriptableObject/JSON化できる形**)
  - `state.js`: セーブ/ロード・クエスト進行・イベント
  - `world.js`: 地形・空・昼夜・建物・草・木・山
  - `game.js`: プレイヤー・カメラ・畑・牧場の動物・村人・アイテム・インタラクション
  - `ui.js` `input.js` `audio.js`: HUD/パネル/ミニマップ、入力(スマホ仮想スティック対応)、効果音
- `docs/vendor/`: three.js(同梱)
- `docs/assets/` の中身(実行時に読み込まれる素材。ジャンル別):
  - `textures/`(地面・草・干し草などの画像)、`effects/`(桜のはなびら等の演出画像)、`ailfx/`(状態異常の演出)、`interior/`(室内の壁・床)、`people/`(人物モデル)、`data/`(設定json)。3Dモデル(`*_lite.glb`)は `assets/` 直下
  - `docs/quest/assets/` は ちんちらクエスト由来の画像(`monsters/` `items/` `battlefields/` `effects/` `capture/` `icons/`)
- `素材/`(**元画像・作業用。アプリには読み込まれない**。ジャンル別):
  - `内装(壁紙・床)/` `バトルフィールド/` `地面画像/` `アイコン/` `確認用スクショ/` と、`モンスター/入稿待ち/`(Geminiで作った新モンスター画像を置く)→ 使ったら `モンスター/処理済み/` へ移す
- `資料/`: 企画書・Gemini用プロンプト集などの文書
- `素材原本/`: 加工スクリプトと小さな記録のみ(公開リポジトリには含めない。`.gitignore`済み)
- **高ポリの元データ(.glb、約3GB)は OneDrive 外の `別の作業フォルダ` に退避済み**(2026-10-07移動。OneDrive同期を軽くするため)。スクリプトで再加工するときは、そのフォルダを作業ディレクトリにして実行する(`BAKE_OUT`環境変数で出力先を指定可能)。新規取得分は `C:/meshy_work/orig/`。Meshy側のダウンロードリンクは数日で期限切れになるが、タスク自体は`new_assets.json`のIDから再取得できる
  - `make_impostor.py`(草の貼り絵) `make_ground_decals.py`(地面の草・干し草テクスチャ) `bake_model.py`(高ポリ→軽量+ベイク) `decimate_model.py`(旧方式。Meshyの破片状UVでは模様が崩れるため非推奨)

## 遊び方(現状)

左スティック=移動 / 右ドラッグ=カメラ / ダッシュ / アクション(畑・動物・拾う・おみせ・やすむ・村人と話す)。PC: WASD・Shift・E・Q(バッグ)・J(クエスト)。
畑: **たがやす→たねをまく→みずやり(1日1回・数日)→しゅうかく**(作物6種、あげ忘れた日は育たない、家で眠ると翌朝)。牧場: ほしくさ(干し草の山)をあげる→ふわふわの毛。クエスト5本、昼夜、オートセーブあり。

## 使用しているMeshy素材(アカウントのタスク名)

| 用途 | Meshyタスク名 | 加工 |
|---|---|---|
| 主人公 | rustic_chinchilla(革のたすき+タンポポ) | 4万面+3072ベイク(`hero_chinchilla_lite.glb`)。2026-10-07に採用 |
| 牧場のチンチラ | storybook_chinchilla_3d | 4万面+ベイク(`chin_storybook_lite.glb`)。色違いで3匹 |
| 松 | rustic_pine_tree | 4千面(`pine_lite.glb`)。近景のみMeshy製、遠景は軽い円錐 |
| 井戸・農具・街灯・牛舎 | rustic_stone_water_well / rustic_farm_tools_cluster / rustic_wooden_lantern_post / rustic_cattle_barn | `well` `tools` `lantern` `cattle_barn` (_lite.glb)。街灯は夜に灯りがともる |
| 畑・作物 | modular_tilled_farmland / modular_*_crop_row(6種) | `farmland` `crop_*`(_lite.glb)。成長は拡大で表現(成長段階の3Dはユーザー作成中) |
| 未取り込み | rustic_cow(牛)、rustic_wooden_arch_bridge(橋)、小川・川・水たまり・小麦畑パッチ | 牛は搾乳の実装時、橋は小川を入れるときに |
| 足元の草むら(アクセント) | realistic_grass_model | 6方向の貼り絵アトラス |
| 地面の草 | modular_meadow_grass_model / modular_clover_pebble_model | 真上からの貼り絵(デカール) |
| 干し草ロール | longer_hay_bale_model | 側面・端面テクスチャ |
| 村人(着物の男女) | chibi_kimono_man_model / chibi_kimono_bride_fixed | **Meshyでリグ付け済み**(歩く・走る) |
| 柵 | rustic_wooden_ranch_fence_model | 5千面+ベイク(`fence_lite.glb`)を区間ごとに並べる |
| 荷車 | rustic_wooden_wagon_model | 2.2万面+ベイク(`wagon_lite.glb`) |
| 白樺 | rustic_birch_tree_model | 1.6万面+ベイク(`birch_lite.glb`)、広葉樹の代わりに配置 |
| 道の土パッチ | modular_dirt_path_patch_model | 真上から撮った貼り絵(`dirt_decal.png`)を道の縁に |
| 農家 | rustic_rural_farmhouse_model | 4.5万面+3072ベイク(`farmhouse_lite.glb`)。当たり判定・ドア位置は`world.js`の`spots.house` |
| 風車 | rustic_rural_windmill_model | 塔(4万面)と羽根(1.4万面)に分割してベイク。羽根は`windmill_hub.json`の位置を軸に回転 |
| 納屋 | rustic_rural_barn_model | 4万面+3072ベイク(`barn_lite.glb`)。牧場の中の小屋 |
| 未使用 | semi_realistic_chinchilla_3d | 予備(`chin_semireal_lite.glb`作成済み) |

- Meshyのリグ付けは**人型のみ対応**(チンチラのような四足は不可)。チンチラは当面プログラムによる動き(ぴょんぴょん・ゆれ)。
- APIで作った素材はMeshyの画面のライブラリには出ない(API側にのみ存在)。ダウンロードリンクは数日で期限切れになるので、生成後すぐ`素材原本/`へ保存する。

## 今後の予定・課題

- 針葉樹(松)・屋台・山をMeshy素材に置き換える(現状は自作の簡易モデルで「おもちゃ風」)。山はカクカクした見た目
- 主人公に革ベスト・ポーチを付ける(動画の見た目)
- 牧場のチンチラ3匹もストーリーブック版に(色違い)。ニワトリ等の動物の追加
- チンチラの骨入りアニメ(Blender 5.2で作成 or Unityで)
- 動画のようなHUDの作り込み、効果音・BGMの本番素材
- Unity移行: glb素材・データ定義・ルールを流用


## フォルダ整理のルール(2026-10-12〜)
- 画像・素材は**ジャンル別のフォルダ**に置く。ルート直下に画像を散らかさない
- 新しい素材は「入稿待ち」→ アプリに組み込んだら「処理済み」(または `docs/assets/…` のジャンル別フォルダ)へ仕分ける
- `docs/` のJS・CSSを変えたら公開前に `python stamp.py`(スマホのキャッシュ対策)

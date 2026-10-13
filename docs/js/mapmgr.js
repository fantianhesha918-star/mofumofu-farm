// マップ管理: 容量(メモリ)予算のチェックと、マップ丸ごとの破棄
import * as THREE from 'three';

// スマホでの目安。これを超えるとiPhoneで落ちやすくなる
export const BUDGET = { texMB: 200, tris: 3000000, geos: 400, drawCalls: 900 };

const texKeys = ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'emissiveMap', 'alphaMap', 'bumpMap'];

// root以下のジオメトリ・マテリアル・テクスチャを解放する(userData.keep が立っているものは残す)
export function disposeObject(root) {
  const geos = new Set(), mats = new Set(), texs = new Set();
  root.traverse(o => {
    if (o.userData && o.userData.keep) return;
    if (o.geometry) geos.add(o.geometry);
    if (o.material) for (const m of [].concat(o.material)) { mats.add(m); for (const k of texKeys) if (m[k] && m[k].isTexture) texs.add(m[k]); }
    if (o.isLight && o.shadow && o.shadow.map) o.shadow.map.dispose();
  });
  geos.forEach(g => g.dispose()); mats.forEach(m => m.dispose()); texs.forEach(t => t.dispose());
  if (root.parent) root.parent.remove(root);
  return { geos: geos.size, mats: mats.size, texs: texs.size };
}

// いまシーンにある物の使用量を数える
export function budgetReport(renderer, scene) {
  const seen = new Set(), rows = []; let texBytes = 0;
  scene.traverse(o => {
    for (const m of [].concat(o.material || [])) for (const k of texKeys) {
      const t = m[k]; if (!t || !t.isTexture || !t.image || seen.has(t.uuid)) continue; seen.add(t.uuid);
      const b = (t.image.width || 0) * (t.image.height || 0) * 4 * (t.generateMipmaps ? 1.33 : 1); texBytes += b; rows.push([Math.round(b / 1e5) / 10, `${t.image.width}x${t.image.height}`, k, o.name || o.parent?.name || '']);
    }
  });
  rows.sort((a, b) => b[0] - a[0]);
  const info = renderer.info, r = {
    texMB: Math.round(texBytes / 1e6), tris: info.render.triangles, geos: info.memory.geometries, drawCalls: info.render.calls, textures: info.memory.textures, programs: info.programs ? info.programs.length : 0,
    heapMB: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1e6) : null, top: rows.slice(0, 6),
  };
  r.over = Object.keys(BUDGET).filter(k => r[k] > BUDGET[k]);
  return r;
}

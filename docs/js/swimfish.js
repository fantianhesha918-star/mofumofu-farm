// 海と川を およぐ さかな(Blenderで つくった 4しゅるい。海: アジ・クマノミ / 川: ヤマメ・こい)
import * as THREE from 'three';
import { heightAt, SEA_A, SEA_Y, RIVER, riverPoints } from './world.js';

const SPECIES = {
  sea1: { len: 1.15, n: 9, kind: 'sea', speed: [1.3, 2.0], school: true },
  sea2: { len: 0.75, n: 7, kind: 'sea', speed: [0.7, 1.2] },
  riv1: { len: 0.85, n: 6, kind: 'river', speed: [0.9, 1.5] },
  riv2: { len: 0.95, n: 4, kind: 'river', speed: [0.5, 0.9] },
};
const time = { value: 0 };
const rnd = (a, b) => a + Math.random() * (b - a);
const fishes = [];

function seaOK(x, z) { return heightAt(x, z) < SEA_Y - 0.45 && Math.hypot(x, z) > 62; }
function inSeaSector(x, z) { let d = Math.atan2(z, x) - SEA_A; d = Math.atan2(Math.sin(d), Math.cos(d)); return Math.abs(d) < 0.8; }

export async function initSwimFish(parent, loader) {
  const root = new THREE.Group(); root.name = 'swimfish'; parent.add(root);
  for (const [id, S] of Object.entries(SPECIES)) {
    let g; try { g = await loader.loadAsync(`./assets/fish_${id}_lite.glb`); } catch (e) { console.warn('fish failed', id, e); continue; }
    let src = null; g.scene.traverse(o => { if (!src && o.isMesh) src = o; });
    if (!src) continue;
    const bb = new THREE.Box3().setFromBufferAttribute(src.geometry.attributes.position), L0 = bb.max.x - bb.min.x;
    const mat = src.material.clone(); mat.side = THREE.DoubleSide;
    mat.onBeforeCompile = (sh) => {   // しっぽを ふる(体の うしろほど おおきく くねる)
      sh.uniforms.uT = time;
      sh.vertexShader = 'uniform float uT;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
        float ph = modelMatrix[3].x * 2.7 + modelMatrix[3].z * 1.9;
        float k = smoothstep(0.1, -0.55, transformed.x);
        transformed.z += sin(uT * 9.0 + transformed.x * 5.0 + ph) * 0.11 * k;`);
    };
    for (let i = 0; i < S.n; i++) {
      const m = new THREE.Mesh(src.geometry, mat); const sc = S.len * 1.35 / L0 * rnd(0.85, 1.2); m.scale.setScalar(sc);
      const f = { m, S, sp: rnd(S.speed[0], S.speed[1]), a: rnd(0, 6.28), t: rnd(0, 1), dir: Math.random() < 0.5 ? 1 : -1, off: rnd(-0.6, 0.6), turn: 0, x: 0, z: 0, y: 0, home: null };
      if (S.kind === 'river') { f.y = RIVER.y - rnd(0.07, 0.13); } else { f.y = SEA_Y - rnd(0.08, 0.16); f.home = null; }
      if (S.kind === 'sea') {   // うみの そうとう おくまった ところから はじめる
        for (let k = 0; k < 80; k++) { const a = SEA_A + rnd(-0.6, 0.6), r = rnd(84, 98); const x = Math.cos(a) * r, z = Math.sin(a) * r; if (seaOK(x, z)) { f.x = x; f.z = z; break; } }
        if (!f.x) { m.visible = false; }
        if (S.school && fishes.length) { const lead = fishes.filter(q => q.S === S).pop(); if (lead && lead.x) { f.x = lead.x + rnd(-2, 2); f.z = lead.z + rnd(-2, 2); f.a = lead.a + rnd(-0.3, 0.3); f.lead = lead; } }
      }
      root.add(m); fishes.push(f);
    }
  }
}

export function updateSwimFish(dt, T, playerPos) {
  time.value = T;
  const P = riverPoints, N = P.length;
  for (const f of fishes) {
    const m = f.m;
    if (f.S.kind === 'river') {
      f.t += f.dir * f.sp * dt * 0.012; if (f.t > 0.98) { f.t = 0.98; f.dir = -1; } if (f.t < 0.02) { f.t = 0.02; f.dir = 1; }
      const fi = f.t * (N - 1), i = Math.min(N - 2, Math.floor(fi)), u = fi - i, a = P[i], b = P[i + 1];
      const tx = b.x - a.x, tz = b.z - a.z, tl = Math.hypot(tx, tz) || 1, nx = -tz / tl, nz = tx / tl;
      f.off += Math.sin(T * 0.7 + f.sp * 7) * dt * 0.5; f.off = Math.max(-1.7, Math.min(1.7, f.off));
      const x = a.x + tx * u + nx * f.off, z = a.z + tz * u + nz * f.off;
      m.position.set(x, f.y + Math.sin(T * 1.3 + f.sp * 5) * 0.03, z); m.rotation.y = Math.atan2(-tz * f.dir, tx * f.dir) + Math.sin(T * 0.9 + f.sp) * 0.15;
    } else if (m.visible) {
      let ang = f.a, nxp, nzp;
      f.turn += (Math.random() - 0.5) * dt * 4; f.turn = Math.max(-0.9, Math.min(0.9, f.turn));
      if (f.lead && Math.random() < 0.02) f.turn += Math.atan2(Math.sin(f.lead.a - ang), Math.cos(f.lead.a - ang)) * 0.3;
      ang += f.turn * dt;
      nxp = f.x + Math.cos(ang) * f.sp * dt; nzp = f.z + Math.sin(ang) * f.sp * dt;
      if (!seaOK(nxp, nzp) || !inSeaSector(nxp, nzp) || Math.hypot(nxp, nzp) > 104) { ang += Math.PI * 0.6 * (Math.random() < 0.5 ? 1 : -1); f.turn = 0; nxp = f.x; nzp = f.z; }
      f.a = ang; f.x = nxp; f.z = nzp;
      m.position.set(f.x, f.y + Math.sin(T * 1.1 + f.sp * 9) * 0.04, f.z); m.rotation.y = Math.atan2(-Math.sin(ang), Math.cos(ang));
    }
  }
}
if (typeof window !== 'undefined') window.__swim = fishes;

import { clamp, lerp, smooth, ease, framesFor } from './choreography.js';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { FullScreenQuad } from 'three/addons/postprocessing/Pass.js';

// ESMFold v1 prediction for ERICFADEYEV: [residue, atom, element, x, y, z]
const ATOMS = [[1,"N","N",1.43,-7.15,9.55],[1,"CA","C",0.92,-7.38,8.21],[1,"C","C",0.84,-6.08,7.42],[1,"CB","C",-0.46,-8.05,8.26],[1,"O","O",0.29,-5.09,7.90],[1,"CG","C",-0.42,-9.51,8.69],[1,"CD","C",-1.57,-9.90,9.61],[1,"OE1","O",-2.42,-9.03,9.91],[1,"OE2","O",-1.61,-11.07,10.04],[2,"N","N",1.68,-5.49,6.72],[2,"CA","C",1.75,-4.35,5.81],[2,"C","C",0.48,-4.22,4.99],[2,"CB","C",2.96,-4.49,4.88],[2,"O","O",0.00,-5.19,4.41],[2,"CG","C",4.23,-3.85,5.42],[2,"CD","C",5.42,-4.11,4.50],[2,"NE","N",6.02,-2.87,4.03],[2,"NH1","N",8.15,-3.74,3.81],[2,"NH2","N",7.75,-1.54,3.29],[2,"CZ","C",7.30,-2.72,3.71],[3,"N","N",-0.44,-3.10,5.31],[3,"CA","C",-1.65,-2.75,4.57],[3,"C","C",-1.28,-2.30,3.16],[3,"CB","C",-2.46,-1.65,5.29],[3,"O","O",-0.41,-1.46,2.98],[3,"CG1","C",-2.80,-2.09,6.72],[3,"CG2","C",-3.73,-1.31,4.51],[3,"CD1","C",-3.17,-0.94,7.65],[4,"N","N",-1.29,-3.01,1.97],[4,"CA","C",-1.21,-2.61,0.57],[4,"C","C",-2.60,-2.38,-0.02],[4,"CB","C",-0.47,-3.66,-0.25],[4,"O","O",-3.52,-3.16,0.23],[4,"SG","S",1.20,-4.02,0.36],[5,"N","N",-2.84,-1.03,-0.35],[5,"CA","C",-3.91,-0.57,-1.23],[5,"C","C",-3.62,-0.93,-2.68],[5,"CB","C",-4.11,0.94,-1.09],[5,"O","O",-2.60,-0.50,-3.24],[5,"CG","C",-4.49,1.38,0.30],[5,"CD1","C",-5.66,0.92,0.89],[5,"CD2","C",-3.67,2.25,1.02],[5,"CE1","C",-6.02,1.33,2.17],[5,"CE2","C",-4.03,2.66,2.30],[5,"CZ","C",-5.20,2.19,2.88],[6,"N","N",-3.66,-2.06,-3.16],[6,"CA","C",-3.65,-2.45,-4.57],[6,"C","C",-4.73,-1.70,-5.35],[6,"CB","C",-3.85,-3.96,-4.71],[6,"O","O",-5.88,-1.64,-4.92],[7,"N","N",-4.47,-0.37,-5.69],[7,"CA","C",-5.22,0.42,-6.66],[7,"C","C",-5.85,-0.48,-7.73],[7,"CB","C",-4.33,1.47,-7.32],[7,"O","O",-5.14,-1.15,-8.47],[7,"CG","C",-3.92,2.58,-6.37],[7,"OD1","O",-4.80,3.15,-5.68],[7,"OD2","O",-2.71,2.89,-6.30],[8,"N","N",-6.77,-1.43,-7.34],[8,"CA","C",-7.68,-2.25,-8.13],[8,"C","C",-8.42,-1.41,-9.17],[8,"CB","C",-8.69,-2.96,-7.23],[8,"O","O",-9.24,-0.55,-8.82],[8,"CG","C",-8.05,-3.98,-6.29],[8,"CD","C",-7.69,-3.40,-4.93],[8,"OE1","O",-8.05,-2.24,-4.65],[8,"OE2","O",-7.04,-4.12,-4.14],[9,"N","N",-7.69,-0.87,-10.09],[9,"CA","C",-8.39,-0.35,-11.26],[9,"C","C",-8.97,-1.48,-12.10],[9,"CB","C",-7.45,0.50,-12.11],[9,"O","O",-8.29,-2.48,-12.35],[9,"CG","C",-7.12,1.84,-11.50],[9,"CD1","C",-8.05,2.88,-11.51],[9,"CD2","C",-5.88,2.07,-10.90],[9,"CE1","C",-7.75,4.12,-10.95],[9,"CE2","C",-5.57,3.30,-10.34],[9,"OH","O",-6.21,5.54,-9.81],[9,"CZ","C",-6.51,4.32,-10.37],[10,"N","N",-10.34,-1.67,-12.05],[10,"CA","C",-11.20,-2.52,-12.87],[10,"C","C",-12.09,-1.69,-13.78],[10,"CB","C",-12.05,-3.43,-11.98],[10,"O","O",-12.76,-0.76,-13.33],[10,"CG","C",-11.26,-4.52,-11.27],[10,"CD","C",-12.13,-5.47,-10.46],[10,"OE1","O",-13.32,-5.14,-10.23],[10,"OE2","O",-11.62,-6.54,-10.06],[11,"N","N",-11.78,-1.26,-14.79],[11,"CA","C",-12.74,-1.36,-15.88],[11,"C","C",-12.02,-1.72,-17.17],[11,"CB","C",-13.54,-0.05,-16.05],[11,"O","O",-10.90,-1.25,-17.42],[11,"CG1","C",-14.87,-0.32,-16.76],[11,"CG2","C",-13.78,0.61,-14.70]];
const SEQ = 'ERICFADEYEV';
const N_RES = SEQ.length;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const html = document.documentElement;
const css = name => getComputedStyle(html).getPropertyValue(name).trim();

const stageEl = document.getElementById('stage');
const stageTrack = document.getElementById('stageTrack');
const canvas = document.getElementById('gl');
let renderer;
try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); } catch { throw new Error('no WebGL'); }
const phoneQuery = matchMedia('(width < 860px)');
let phone = phoneQuery.matches;
let quality = 1;
let dpr = Math.min(devicePixelRatio, phone ? 1.5 : 2);
let qualitySince = 0, slowFrames = 0, fastFrames = 0, samples = 0;

// ---- structure prep: center, then lay the chain's end-to-end axis along +x
const atoms = ATOMS.map(([res, name, el, x, y, z]) => ({ res, name, el, fold: new THREE.Vector3(x, y, z) }));
const centroid = atoms.reduce((s, a) => s.add(a.fold), new THREE.Vector3()).multiplyScalar(1 / atoms.length);
atoms.forEach(a => a.fold.sub(centroid));
const caOf = r => atoms.find(a => a.res === r && a.name === 'CA').fold;
const toX = new THREE.Quaternion().setFromUnitVectors(caOf(N_RES).clone().sub(caOf(1)).normalize(), new THREE.Vector3(1, 0, 0));
atoms.forEach(a => a.fold.applyQuaternion(toX));
const FOLD_LEN = (() => { let a = Infinity, b = -Infinity; for (const p of atoms) { a = Math.min(a, p.fold.x); b = Math.max(b, p.fold.x); } return b - a + 6; })();

// ---- unfolded chain: one bead per residue, joined by its N and C atoms
const SPACING = 4.9, CHAIN_LEN = SPACING * (N_RES - 1) + 8;
const perRes = r => atoms.filter(a => a.res === r && a.name !== 'N' && a.name !== 'C').length;
const ISO = 0.35;
atoms.forEach(a => {
  const cx = (a.res - (N_RES + 1) / 2) * SPACING;
  const link = a.name === 'N' ? -1.55 : a.name === 'C' ? 1.55 : 0;
  const backbone = ['N', 'CA', 'C'].includes(a.name);
  a.chain = new THREE.Vector3(cx + link, 0, 0);
  a.R = backbone ? 3.4 : 2.9;
  a.sFold = backbone ? 1.0 : 0.8;
  a.sChain = link ? 0.2 : 1.6 / perRes(a.res);
  a.s = a.sChain;
  a.now = a.chain.clone();
});
const resAtoms = Array.from({ length: N_RES }, (_, i) => atoms.filter(a => a.res === i + 1));


// ---- scene: a sheet of paper (the page colour) filling the stage, the molecule just above it
renderer.toneMapping = THREE.NeutralToneMapping;
renderer.shadowMap.enabled = false;   // nothing on the page catches a shadow any more
renderer.shadowMap.type = THREE.VSMShadowMap;
const scene = new THREE.Scene();
let environmentTarget;
function ensureEnvironment() {
  if (environmentTarget) return;
  const generator = new THREE.PMREMGenerator(renderer), room = new RoomEnvironment();
  try { environmentTarget = generator.fromScene(room, 0.04); scene.environment = environmentTarget.texture; }
  finally { room.dispose(); generator.dispose(); }
}
const camera = new THREE.PerspectiveCamera(30, 1, 1, 4000);
const rig = new THREE.Group(), outer = new THREE.Group(), spinner = new THREE.Group(), mol = new THREE.Group();
scene.add(rig); rig.add(outer); outer.add(spinner); spinner.add(mol);
const HOVER = 9;
// the molecule's outline, drawn small (a quarter size) into a hidden image each frame, then blurred wide.
// The blur stands in for "distance to the outline", so the cover needs one lookup per pixel.
const silTarget = new THREE.WebGLRenderTarget(64, 64), blurA = new THREE.WebGLRenderTarget(64, 64), blurB = new THREE.WebGLRenderTarget(64, 64);
const blurMat = new THREE.ShaderMaterial({
  uniforms: { tMap: { value: null }, uDir: { value: new THREE.Vector2() } },
  vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: `uniform sampler2D tMap; uniform vec2 uDir; varying vec2 vUv;
    void main() {
      float sum = 0.0, wsum = 0.0;
      for (int i = -7; i <= 7; i++) { float w = exp(-float(i * i) / 24.0); sum += texture2D(tMap, vUv + uDir * float(i)).r * w; wsum += w; }
      gl_FragColor = vec4(sum / wsum, 0.0, 0.0, 1.0);
    }`,
  depthTest: false, depthWrite: false,
});
const blurQuad = new FullScreenQuad(blurMat);
const BLUR_PX = 46;                                       // how far the cover reaches past the outline, in CSS px
const paperMat = new THREE.ShaderMaterial({
  uniforms: { uSil: { value: blurB.texture }, uBg: { value: new THREE.Color() }, uRes: { value: new THREE.Vector2(1, 1) }, uDpr: { value: dpr },
              uStrip: { value: 120 }, uEdge: { value: 46 }, uFade: { value: 70 }, uRough: { value: 1 }, uDark: { value: 0 }, uTopY: { value: 1 }, uBotY: { value: 0 }, uFadeMode: { value: 3 }, uBelow: { value: 1 }, uAppear: { value: 0 }, uFadeStart: { value: 0.42 }, uCell: { value: 6.5 } },
  vertexShader: `void main() { gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: `
    uniform sampler2D uSil; uniform vec3 uBg; uniform vec2 uRes; uniform float uDpr, uStrip, uEdge, uFade, uRough, uDark, uTopY, uBotY, uFadeMode, uBelow, uAppear, uFadeStart, uCell;
    float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    void main() {
      vec2 frag = gl_FragCoord.xy, uv = frag / uRes;
      // solid near the outline, thinning further out; the higher up the screen, the tighter it hugs the molecule
      float up = clamp(frag.y / uRes.y, 0.0, 1.0);
      float halo = smoothstep(0.03 + 0.3 * up, 0.34 + 0.24 * up, texture2D(uSil, uv).r);
      if (uFadeMode > 0.5) { float y0 = mix(uBotY, uTopY, uFadeStart); halo *= 1.0 - 0.4 * smoothstep(0.6, 1.05, (frag.y - y0) / max(1.0, uTopY - y0)); }
      float fromBottom = frag.y / uDpr, fromTop = (uRes.y - frag.y) / uDpr;
      float strip = 1.0 - smoothstep(uStrip, uStrip + uEdge, fromBottom);
      float yMid = mix(uBotY, uTopY, 0.5);
      float below = uBelow * (1.0 - smoothstep(yMid, yMid + uEdge * uDpr, frag.y));
      float cov = max(max(halo, strip), below) * smoothstep(0.0, uFade, fromTop);
      cov *= uAppear;                                                   // arriving and leaving: the dots grow from, and shrink to, nothing
      if (cov <= 0.001) discard;
      if (cov < 0.999) {
        // halftone: a 45-degree screen like the print, dots shrinking toward each edge
        vec2 p = mat2(0.7071, -0.7071, 0.7071, 0.7071) * frag / (uCell * uDpr);
        vec2 cell = floor(p);
        float r = sqrt(cov) * 0.76 * (1.0 + (hash(cell) - 0.5) * 0.4 * uRough);
        if (hash(cell + 3.7) > cov + 0.35) discard;
        if (length(fract(p) - 0.5) > r) discard;
      }
      float g = hash(floor(frag / max(uDpr, 1.0)));                   // a touch of grain, to match the page
      vec3 grain = mix(vec3(0.45, 0.40, 0.33), vec3(0.75), uDark);
      gl_FragColor = vec4(mix(uBg, grain, 0.08 * g), 1.0);
    }`,
});
const paper = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), paperMat);
paper.renderOrder = -1;
const shadowCatcher = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShadowMaterial({ color: 0x1a1408, opacity: 0.08 }));
shadowCatcher.position.z = 0.05; shadowCatcher.receiveShadow = true;
const sun = new THREE.DirectionalLight(0xffffff, 0.7);
sun.position.set(-14, 26, 75); sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024); sun.shadow.radius = 9; sun.shadow.blurSamples = 10;
scene.add(paper, shadowCatcher, sun, sun.target);

// ---- 1. glass: the opal water drop
const glass = new THREE.MeshPhysicalMaterial({
  color: 0xffffff, roughness: 0.02, metalness: 0, transmission: 1, thickness: 3.2, ior: 1.33,
  attenuationColor: new THREE.Color(0x8db4e2), attenuationDistance: 40, specularIntensity: 0.9, envMapIntensity: 1.0,
  dispersion: 0.5, iridescence: 1, iridescenceIOR: 1.32, iridescenceThicknessRange: [220, 560],
  transparent: true, opacity: 0.9, depthWrite: false,
});
glass.onBeforeCompile = shader => {
  shader.fragmentShader = shader.fragmentShader.replace('#include <opaque_fragment>', `
    float grazing = 1.0 - abs(dot(normal, normalize(vViewPosition)));
    outgoingLight *= 1.0 - 0.3 * smoothstep(0.72, 0.97, grazing);
    #include <opaque_fragment>`);
};

// ---- surface nets over a grid fitted tightly around the atoms
const MAX_V = 120000, MAX_I = 720000;
const posArr = new Float32Array(MAX_V * 3), norArr = new Float32Array(MAX_V * 3), idxArr = new Uint32Array(MAX_I);
const geom = new THREE.BufferGeometry();
geom.setAttribute('position', new THREE.BufferAttribute(posArr, 3).setUsage(THREE.DynamicDrawUsage));
geom.setAttribute('normal', new THREE.BufferAttribute(norArr, 3).setUsage(THREE.DynamicDrawUsage));
geom.setIndex(new THREE.BufferAttribute(idxArr, 1).setUsage(THREE.DynamicDrawUsage));
const liquid = new THREE.Mesh(geom, glass);
liquid.frustumCulled = false; liquid.castShadow = true;
mol.add(liquid);

const grad = new Float32Array(3);
function fieldAt(x, y, z) {
  let f = 0, gx = 0, gy = 0, gz = 0;
  for (const a of atoms) {
    const dx = x - a.now.x, dy = y - a.now.y, dz = z - a.now.z, R2 = a.R * a.R;
    const r2 = dx * dx + dy * dy + dz * dz;
    if (r2 >= R2) continue;
    const q = 1 - r2 / R2, k = -6 * a.s * q * q / R2;
    f += a.s * q * q * q; gx += k * dx; gy += k * dy; gz += k * dz;
  }
  grad[0] = gx; grad[1] = gy; grad[2] = gz;
  return f;
}
const EDGES = [];
for (let c = 0; c < 8; c++) for (const bit of [1, 2, 4]) if (!(c & bit)) EDGES.push([c, c | bit]);
let F = new Float32Array(0), cellVert = new Int32Array(0);
function meshSurface(cell) {
  let x0 = Infinity, y0 = Infinity, z0 = Infinity, x1 = -Infinity, y1 = -Infinity, z1 = -Infinity;
  for (const a of atoms) {
    x0 = Math.min(x0, a.now.x - a.R); x1 = Math.max(x1, a.now.x + a.R);
    y0 = Math.min(y0, a.now.y - a.R); y1 = Math.max(y1, a.now.y + a.R);
    z0 = Math.min(z0, a.now.z - a.R); z1 = Math.max(z1, a.now.z + a.R);
  }
  x0 -= cell; y0 -= cell; z0 -= cell;
  const nx = Math.ceil((x1 - x0) / cell) + 2, ny = Math.ceil((y1 - y0) / cell) + 2, nz = Math.ceil((z1 - z0) / cell) + 2;
  const nxy = nx * ny, N = nxy * nz;
  if (F.length < N) { F = new Float32Array(N); cellVert = new Int32Array(N); }
  F.fill(0, 0, N);
  for (const a of atoms) {
    const R2 = a.R * a.R, s = a.s, px = a.now.x, py = a.now.y, pz = a.now.z;
    const ia = Math.max(0, Math.floor((px - a.R - x0) / cell)), ib = Math.min(nx - 1, Math.ceil((px + a.R - x0) / cell));
    const ja = Math.max(0, Math.floor((py - a.R - y0) / cell)), jb = Math.min(ny - 1, Math.ceil((py + a.R - y0) / cell));
    const ka = Math.max(0, Math.floor((pz - a.R - z0) / cell)), kb = Math.min(nz - 1, Math.ceil((pz + a.R - z0) / cell));
    for (let k = ka; k <= kb; k++) {
      const dz = z0 + k * cell - pz, dz2 = dz * dz;
      if (dz2 >= R2) continue;
      for (let j = ja; j <= jb; j++) {
        const dy = y0 + j * cell - py, dyz = dy * dy + dz2;
        if (dyz >= R2) continue;
        const row = j * nx + k * nxy;
        for (let i = ia; i <= ib; i++) {
          const dx = x0 + i * cell - px, r2 = dx * dx + dyz;
          if (r2 < R2) { const q = 1 - r2 / R2; F[row + i] += s * q * q * q; }
        }
      }
    }
  }
  const off = [0, 1, nx, nx + 1, nxy, nxy + 1, nxy + nx, nxy + nx + 1];
  const v = new Float32Array(8);
  let vc = 0;
  for (let k = 0; k < nz - 1; k++) for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
    const id = i + j * nx + k * nxy;
    let mask = 0;
    for (let c = 0; c < 8; c++) { v[c] = F[id + off[c]]; if (v[c] > ISO) mask |= 1 << c; }
    if (mask === 0 || mask === 255 || vc >= MAX_V) { cellVert[id] = -1; continue; }
    let sx = 0, sy = 0, sz = 0, n = 0;
    for (const [c0, c1] of EDGES) {
      if (((mask >> c0) & 1) === ((mask >> c1) & 1)) continue;
      const t = (ISO - v[c0]) / (v[c1] - v[c0]);
      sx += (c0 & 1) + t * ((c1 & 1) - (c0 & 1));
      sy += (c0 >> 1 & 1) + t * ((c1 >> 1 & 1) - (c0 >> 1 & 1));
      sz += (c0 >> 2 & 1) + t * ((c1 >> 2 & 1) - (c0 >> 2 & 1));
      n++;
    }
    let px = x0 + (i + sx / n) * cell, py = y0 + (j + sy / n) * cell, pz = z0 + (k + sz / n) * cell;
    const f = fieldAt(px, py, pz), g2 = grad[0] * grad[0] + grad[1] * grad[1] + grad[2] * grad[2];
    if (g2 > 1e-9) {
      const step = Math.max(-cell, Math.min(cell, (f - ISO) / Math.sqrt(g2))) / Math.sqrt(g2);
      px -= step * grad[0]; py -= step * grad[1]; pz -= step * grad[2];
      fieldAt(px, py, pz);
    }
    const gl = Math.hypot(grad[0], grad[1], grad[2]) || 1;
    posArr[vc * 3] = px; posArr[vc * 3 + 1] = py; posArr[vc * 3 + 2] = pz;
    norArr[vc * 3] = -grad[0] / gl; norArr[vc * 3 + 1] = -grad[1] / gl; norArr[vc * 3 + 2] = -grad[2] / gl;
    cellVert[id] = vc++;
  }
  let ic = 0;
  const quad = (a, b, c, d, flip) => {
    if (a < 0 || b < 0 || c < 0 || d < 0 || ic + 6 > MAX_I) return;
    if (flip) idxArr.set([a, c, b, a, d, c], ic); else idxArr.set([a, b, c, a, c, d], ic);
    ic += 6;
  };
  for (let k = 1; k < nz - 1; k++) for (let j = 1; j < ny - 1; j++) for (let i = 1; i < nx - 1; i++) {
    const id = i + j * nx + k * nxy, inside = F[id] > ISO;
    if (inside !== (F[id + 1] > ISO)) quad(cellVert[id], cellVert[id - nx], cellVert[id - nx - nxy], cellVert[id - nxy], !inside);
    if (inside !== (F[id + nx] > ISO)) quad(cellVert[id], cellVert[id - nxy], cellVert[id - 1 - nxy], cellVert[id - 1], !inside);
    if (inside !== (F[id + nxy] > ISO)) quad(cellVert[id], cellVert[id - 1], cellVert[id - 1 - nx], cellVert[id - nx], !inside);
  }
  geom.setDrawRange(0, ic);
  // Upload only what the current mesh uses when the surface changes during the unfold.
  for (const attribute of [geom.attributes.position, geom.attributes.normal, geom.index]) {
    const count = attribute === geom.index ? ic : vc * 3;
    if (count === 0) continue;
    attribute.clearUpdateRanges();
    attribute.addUpdateRange(0, count);
    attribute.needsUpdate = true;
  }
}

// residues fold one after another, N-terminus first, each swinging through a gentle arc
function placeAtoms(t) {
  for (const a of atoms) {
    const i = a.res - 1;
    const e = ease(clamp((t - (i / (N_RES - 1)) * 0.38) / 0.62));
    a.now.lerpVectors(a.chain, a.fold, e);
    a.now.y += Math.sin(Math.PI * e) * 3.2 * Math.sin(i * 1.7 + 0.4);
    a.s = lerp(a.sChain, a.sFold, e);
  }
}
const FINE = 0.36, COARSE = 0.55;

// the outline-only copy of the molecule, seen only by the hidden outline pass (layer 1)
const silMesh = new THREE.Mesh(geom, new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide }));
silMesh.layers.set(1); silMesh.frustumCulled = false;
mol.add(silMesh);

// ---- shared shading for the hand-made looks: simple light, in view space
const LIGHT = `
  vec3 L1 = normalize(vec3(-0.45, 0.62, 0.64));
  vec3 L2 = normalize(vec3(0.7, -0.35, 0.6));
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }`;

// ---- 2. print: two-ink risograph halftone, slightly out of register, overprinting like real ink
const risoUniforms = (ink, angle, offset, mode) => ({
  uInk: { value: new THREE.Color(ink) }, uAngle: { value: angle }, uOffset: { value: new THREE.Vector2(...offset) },
  uCell: { value: phone ? 5.2 : 6.5 }, uDpr: { value: dpr }, uRes: { value: new THREE.Vector2(1, 1) }, uMode: { value: mode }, uRough: { value: 1 }, uFade: { value: 70 }, uWave: { value: 0 }, uTopY: { value: 1 }, uBotY: { value: 0 }, uFadeMode: { value: 3 }, uTime: { value: 0 }, uAppear: { value: 0 }, uBotFade: { value: 0 }, uFadeStart: { value: 0.42 },
});
const risoVert = `
  uniform vec2 uOffset, uRes; uniform float uRough, uWave, uTime;
  varying vec3 vN;
  void main() {
    vN = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    vec2 drift = uWave * vec2(sin(uTime * 0.53) + 0.5 * sin(uTime * 1.31 + 1.7), cos(uTime * 0.47) + 0.5 * sin(uTime * 1.07 + 0.4)) * 1.5;   // the plates wander in and out of register
    gl_Position.xy += (uOffset * uRough + drift * step(0.01, length(uOffset))) / uRes * 2.0 * gl_Position.w;   // misregistration, in pixels
  }`;
const risoFrag = `
  uniform vec3 uInk; uniform vec2 uRes; uniform float uAngle, uCell, uDpr, uMode, uRough, uFade, uTopY, uBotY, uFadeMode, uTime, uWave, uAppear, uBotFade, uFadeStart;
  varying vec3 vN;
  ${LIGHT}
  float vnoise(vec2 x) { vec2 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y); }
  // how far up the molecule's own height this point is: 0 in its lower part, 1 at its top
  float hAt(float y) { float y0 = mix(uBotY, uTopY, uFadeStart); return clamp((y - y0) / max(1.0, uTopY - y0), 0.0, 1.0); }
  void main() {
    vec3 n = normalize(vN);
    float lum = 0.12 + 0.88 * max(dot(n, L1), 0.0);
    float edge = 1.0 - abs(n.z);                        // 0 facing us, 1 at the silhouette
    float rim = pow(edge, 2.2);
    // ink plate: the shadows; colour plate: a broad flat fill with its own light
    float cov = uMode < 0.5 ? clamp(pow(1.0 - lum, 1.4) * 0.78 + rim * 0.26 + 0.02, 0.0, 1.0)
                            : clamp(0.2 + 0.36 * max(dot(n, L2), 0.0) + rim * 0.1, 0.0, 1.0);
    // toward the outline the dots get smaller and fewer, so the shape dissolves rather than stops
    float fade = 1.0 - smoothstep(uMode < 0.5 ? 0.6 : 0.68, 0.99, edge);
    cov *= mix(0.25, 1.0, fade);
    float topFade = smoothstep(0.0, uFade, (uRes.y - gl_FragCoord.y) / uDpr);
    cov *= topFade; fade *= topFade;

    float ca = cos(uAngle), sa = sin(uAngle);
    mat2 R = mat2(ca, -sa, sa, ca);
    vec2 p = R * gl_FragCoord.xy / (uCell * uDpr);
    if (uWave > 0.0) {
      // once unfolded, the dot screen itself swims: a slow current carries the dots along, and a gentle
      // warp bends the rows, so the ink inside each bead flows like something alive
      vec2 sp0 = gl_FragCoord.xy / uDpr;
      vec2 flow = vec2(vnoise(sp0 * 0.03 + vec2(uTime * 0.22, 0.0)), vnoise(sp0 * 0.03 + vec2(3.1, uTime * 0.19))) - 0.5;
      p += uWave * (flow * 1.9 + vec2(uTime * 0.13, uTime * 0.05));
    }
    vec2 cell = floor(p);
    float h = uFadeMode > 0.5 ? hAt(gl_FragCoord.y) : 0.0;

    if (uFadeMode > 0.5 && uFadeMode < 1.5) {
      // ink-out: like the press running dry toward the top; dots shrink, then go missing
      float k = 1.0 - 0.7 * smoothstep(0.45, 1.0, h);      // a light touch: only the very top thins, and never quite to nothing
      if (uBotFade > 0.5) {                                 // computers: the same at the bottom
        float yb = mix(uTopY, uBotY, uFadeStart);
        float hb = clamp((yb - gl_FragCoord.y) / max(1.0, yb - uBotY), 0.0, 1.0);
        k *= 1.0 - 0.7 * smoothstep(0.45, 1.0, hb);
      }
      cov *= k; fade *= mix(1.0, k, 0.4);
    } else if (uFadeMode > 1.5 && uFadeMode < 2.5) {
      // worn: blotchy patches lift away, like a well-used screen
      float nz = vnoise(cell * 0.27 + 11.0) * 0.7 + vnoise(cell * 0.9 + 3.0) * 0.3;
      if (nz < h * 1.15 - 0.08) discard;
      cov *= 1.0 - 0.3 * h;
    }
    if (hash(cell + 17.3) > fade + 0.22) discard;            // scattered dropout at the very edge

    if (uFadeMode > 2.5) {
      // drift: in the upper part each dot lifts off and floats upward, shrinking as it rises
      vec2 up = R * vec2(0.0, 1.0);
      bool hit = false;
      for (int j = 0; j < 4; j++) {
        vec2 c = floor(p - up * float(j));
        float hc = hAt((transpose(R) * ((c + 0.5) * uCell * uDpr)).y);
        float rnd = hash(c);
        float lift = hc * hc * (1.0 + 2.4 * rnd) + hc * 0.3 * sin(uTime * 0.9 + rnd * 6.283);
        vec2 ctr = c + 0.5 + up * lift + vec2(-up.y, up.x) * hc * 0.25 * sin(uTime * 0.6 + rnd * 12.0);
        float rc = sqrt(cov) * 0.72 * (1.0 + (rnd - 0.5) * 0.5 * uRough) * pow(1.0 - hc, 0.85);
        if (length(p - ctr) < rc * uAppear) { hit = true; break; }
      }
      if (!hit) discard;
    } else {
      float r = sqrt(cov) * 0.72 * (1.0 + (hash(cell) - 0.5) * 0.5 * uRough);   // each dot inked a little differently
      if (uWave > 0.0) {
        vec2 sp = gl_FragCoord.xy / uDpr;
        vec2 q = vec2(vnoise(sp * 0.009 + vec2(uTime * 0.05, 0.0)), vnoise(sp * 0.009 + vec2(5.2, -uTime * 0.04)));
        float pool = vnoise(sp * 0.018 + q * 2.4 + vec2(uTime * 0.16, uTime * 0.05));        // slow, swirling patches
        float rnd = hash(cell + 9.1);
        float breathe = sin(uTime * (0.5 + 0.7 * rnd) + rnd * 6.283);                       // each dot on its own rhythm
        r *= 1.0 + uWave * (0.85 * (pool - 0.5) + 0.14 * breathe);
      }
      if (length(fract(p) - 0.5) > r * uAppear) discard;
    }
    gl_FragColor = vec4(uInk, 1.0);
  }`;
const depthMat = new THREE.MeshBasicMaterial({ colorWrite: false, polygonOffset: true, polygonOffsetFactor: 2, polygonOffsetUnits: 4 });
const depthOnly = new THREE.Mesh(geom, depthMat); depthOnly.renderOrder = 0;
const risoColorMat = new THREE.ShaderMaterial({ uniforms: risoUniforms(0xb1502a, 1.31, [1.6, -1.1], 1), vertexShader: risoVert, fragmentShader: risoFrag, transparent: true, depthTest: false, depthWrite: false, blending: THREE.MultiplyBlending, premultipliedAlpha: false });
const risoInkMat = new THREE.ShaderMaterial({ uniforms: risoUniforms(0x231d18, 0.26, [0, 0], 0), vertexShader: risoVert, fragmentShader: risoFrag, transparent: true, depthWrite: false, blending: THREE.MultiplyBlending, premultipliedAlpha: false });
const risoColor = new THREE.Mesh(geom, risoColorMat); risoColor.renderOrder = 1;
const risoInk = new THREE.Mesh(geom, risoInkMat); risoInk.renderOrder = 2;
[depthOnly, risoColor, risoInk].forEach(m => { m.frustumCulled = false; mol.add(m); });

// ---- 3. stipple: a hand-dotted drawing; dots gather where it's dark and along the edges
let stipple = null;
const stippleMat = new THREE.ShaderMaterial({
  uniforms: { uInk: { value: new THREE.Color() }, uMark: { value: new THREE.Color() }, uSize: { value: 1.7 }, uDpr: { value: dpr }, uZoom: { value: 1 }, uRough: { value: 1 }, uResY: { value: 400 }, uAppear: { value: 0 } },
  vertexShader: `
    attribute vec2 seed;
    uniform float uSize, uDpr, uZoom, uRough, uResY, uAppear;
    varying float vKeep, vAccent;
    ${LIGHT}
    void main() {
      vec3 n = normalize(normalMatrix * normal);
      float lum = 0.12 + 0.88 * max(dot(n, L1), 0.0);
      float rim = pow(1.0 - abs(n.z), 2.0);
      float dark = clamp(pow(1.0 - lum, 1.2) + rim * 0.65, 0.0, 1.0);
      vKeep = step(seed.x, dark * 0.92 + 0.035);
      vAccent = step(seed.y, 0.05 * uRough);
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * mv;
      gl_PointSize = uSize * uDpr * (0.75 + 0.5 * seed.y) * mix(1.0, sqrt(uZoom), 0.8);
      gl_PointSize *= smoothstep(-1.0, 1.0 - 140.0 / uResY, -(gl_Position.y / gl_Position.w)) * uAppear;   // shrink away toward the top
      if (vKeep < 0.5) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    }`,
  fragmentShader: `
    uniform vec3 uInk, uMark;
    varying float vKeep, vAccent;
    void main() {
      vec2 d = gl_PointCoord - 0.5;
      if (dot(d, d) > 0.25) discard;
      gl_FragColor = vec4(mix(uInk, uMark, vAccent), 1.0);
    }`,
});
function buildStipple() {
  // scatter points over the surface's triangles, a few per triangle, with interpolated normals
  const count = geom.drawRange.count, idx = idxArr, P = posArr, Nn = norArr;
  const tris = count / 3, PER = phone ? 2 : 3;
  const pos = new Float32Array(tris * PER * 3), nor = new Float32Array(tris * PER * 3), seed = new Float32Array(tris * PER * 2);
  let k = 0;
  for (let t = 0; t < tris; t++) {
    const a = idx[t * 3], b = idx[t * 3 + 1], c = idx[t * 3 + 2];
    for (let q = 0; q < PER; q++) {
      let u = Math.random(), v = Math.random(); if (u + v > 1) { u = 1 - u; v = 1 - v; }
      const w = 1 - u - v;
      for (let j = 0; j < 3; j++) {
        pos[k * 3 + j] = P[a * 3 + j] * w + P[b * 3 + j] * u + P[c * 3 + j] * v;
        nor[k * 3 + j] = Nn[a * 3 + j] * w + Nn[b * 3 + j] * u + Nn[c * 3 + j] * v;
      }
      seed[k * 2] = Math.random(); seed[k * 2 + 1] = Math.random(); k++;
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  g.setAttribute('seed', new THREE.BufferAttribute(seed, 2));
  stipple = new THREE.Points(g, stippleMat); stipple.frustumCulled = false; stipple.renderOrder = 3;
  mol.add(stipple);
}

// fold it once, finely; after that it only turns
placeAtoms(1); meshSurface(FINE); buildStipple();
const foldCenters = resAtoms.map(list => list.reduce((s, a) => s.add(a.fold), new THREE.Vector3()).multiplyScalar(1 / list.length));

// ---- apply the page's style to the scene
let lastSize = document.documentElement.dataset.size;
let pepMode = 'riso', motion = 'pan', rough = 1;
const theme = { from: null, to: null, t0: 0, cur: null };
function themeNow() { return theme.cur ? { bg: theme.cur.bg.clone(), ink: theme.cur.ink.clone(), mark: theme.cur.mark.clone(), dark: theme.cur.dark } : theme.to; }
function tickTheme() {
  if (!theme.to) return;
  const A = theme.from, B = theme.to, age = performance.now() - theme.t0;
  if (theme.cur?.k === 1 && theme.cur.to === B && age > 700) return;
  // follow the page's own CSS fade exactly: read the page colour the browser is showing right now
  // (mid-transition it reports the in-between value), so the cover can never differ from the page
  let bg, k;
  if (reduceMotion || age > 700) { bg = B.bg.clone(); k = 1; }
  else {
    bg = new THREE.Color(getComputedStyle(document.body).backgroundColor).convertLinearToSRGB();
    const dx = B.bg.r - A.bg.r, dy = B.bg.g - A.bg.g, dz = B.bg.b - A.bg.b, dd = dx * dx + dy * dy + dz * dz;
    k = dd < 1e-6 ? 1 : clamp(((bg.r - A.bg.r) * dx + (bg.g - A.bg.g) * dy + (bg.b - A.bg.b) * dz) / dd);
  }
  if (theme.cur && theme.cur.k === 1 && k === 1 && theme.cur.to === theme.to) return;
  const ink = A.ink.clone().lerp(B.ink, k), mark = A.mark.clone().lerp(B.mark, k);
  const dark = k < 0.5 ? A.dark : B.dark;   // inks multiply like real overprinting on light paper; on a dark ground they're laid on top
  paperMat.uniforms.uBg.value.copy(bg);
  risoInkMat.uniforms.uInk.value.copy(ink); risoColorMat.uniforms.uInk.value.copy(mark);
  stippleMat.uniforms.uInk.value.copy(ink); stippleMat.uniforms.uMark.value.copy(mark);
  if (!theme.cur || theme.cur.dark !== dark) for (const m of [risoColorMat, risoInkMat]) m.blending = dark ? THREE.NormalBlending : THREE.MultiplyBlending;
  theme.cur = { bg, ink, mark, dark, k, to: B };
}
function applyStyle() {
  pepMode = html.dataset.pep; motion = html.dataset.motion; rough = +html.dataset.rough;
  const fm = { off: 0, ink: 1, worn: 2, drift: 3 }[html.dataset.fade] ?? 1;
  for (const m of [risoColorMat, risoInkMat, paperMat]) m.uniforms.uFadeMode.value = fm;
  const bg = new THREE.Color(css('--bg')), ink = new THREE.Color(css('--ink')), mark = new THREE.Color(css('--mark')), mark2 = new THREE.Color(css('--mark-2'));
  const raw = c => c.clone().convertLinearToSRGB();   // these shaders output colour as-is
  renderer.setClearColor(0x000000, 0);
  for (const m of [risoColorMat, risoInkMat]) m.uniforms.uRough.value = 0.4 + rough * 0.6;
  stippleMat.uniforms.uRough.value = rough;
  // the colours glide to the new theme over 0.4 s, in step with the page's own fade
  const to = { bg: raw(bg), ink: raw(ink), mark: raw(mark), dark: bg.getHSL({}).l < 0.4 };
  theme.from = theme.to ? themeNow() : to; theme.to = to; theme.t0 = performance.now();
  tickTheme();
  glass.attenuationColor.copy(new THREE.Color(0xffffff).lerp(mark2, 0.35));
  if (pepMode === 'glass') ensureEnvironment();
  liquid.visible = pepMode === 'glass';
  shadowCatcher.visible = false;
  paperMat.uniforms.uDark.value = to.dark ? 1 : 0; paperMat.uniforms.uRough.value = rough;
  depthOnly.visible = pepMode !== 'glass';
  risoColor.visible = risoInk.visible = pepMode === 'riso';
  stipple.visible = pepMode === 'stipple';
  ring.wob = rough;
  ring.key = '';   // redraw the ring in the new hand
  if (typeof measure === 'function' && SW > 1 && lastSize !== html.dataset.size) { lastSize = html.dataset.size; measure(); }   // only when the size changed (resizing blanks the canvas)
}

// ---- sizing: the paper at z = 0 exactly fills the stage
const TAN15 = Math.tan(THREE.MathUtils.degToRad(15));
let VS = 1, stTop = 0;
const tailEl = document.querySelector('.tail'), portraitEl = document.querySelector('.portrait');
const svhProbe = document.getElementById('svhProbe');
let SW = 1, SH = 1, visW = 100, visH = 100, D = 100, fitScale = 1, sized = false, colCx = 0.25;
function measure() {
  phone = phoneQuery.matches;
  dpr = Math.min(devicePixelRatio, phone ? 1.5 : 2) * quality;
  dpr = Math.max(Math.min(devicePixelRatio, 1), dpr);
  const r = stageEl.getBoundingClientRect();
  SW = r.width; SH = r.height;
  VS = phone ? Math.min(SH, svhProbe.offsetHeight || innerHeight) : SH;
  visW = 100; visH = visW * SH / SW; D = visH / (2 * TAN15);
  camera.position.set(0, 0, D); camera.aspect = SW / SH; camera.far = D * 4;
  camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  paper.scale.set(visW, visH, 1); shadowCatcher.scale.set(visW, visH, 1);
  Object.assign(sun.shadow.camera, { left: -visH, right: visH, top: visH, bottom: -visH }); sun.shadow.camera.updateProjectionMatrix();
  // on a computer the molecule lives in the left column of the page grid (45% of up to 1280px)
  const cw = Math.min(SW - 80, 1280), cl = (SW - cw) / 2;
  colCx = (cl + cw * 0.27) / SW;               // a little in from the column's centre, toward the middle of the page
  const colWorld = visW * (cw * 0.45) / SW;
  fitScale = phone ? 0.245 * (visW * VS / SW) / 15                                 // phones: sized by the screen's height (the molecule is ~15 Å thick)
                   : Math.min(0.86 * visH / FOLD_LEN, 0.62 * colWorld / 15)    // stood up, filling most of the window's height
                     * (html.dataset.size === 'large' ? 1.55 : 1);              // the "much larger" variant runs off the window, edge to edge
  for (const m of [risoColorMat, risoInkMat, paperMat]) {
    m.uniforms.uRes.value.set(SW * dpr, SH * dpr);
    m.uniforms.uDpr.value = dpr;
    // With the large desktop peptide, fade only the tips.
    m.uniforms.uFadeStart.value = !phone && html.dataset.size === 'large' ? 0.7 : 0.42;
  }
  risoColorMat.uniforms.uBotFade.value = risoInkMat.uniforms.uBotFade.value = phone ? 0 : 1;
  risoColorMat.uniforms.uCell.value = risoInkMat.uniforms.uCell.value = phone ? 5.2 : 6.5;
  stippleMat.uniforms.uResY.value = SH;
  stippleMat.uniforms.uDpr.value = dpr;
  paperMat.uniforms.uStrip.value = phone ? (SH - VS) + Math.max(44, VS * 0.07) : -200;   // a slim solid strip at the bottom of the visible screen, and everything under Safari's bar (phones)
  paperMat.uniforms.uBelow.value = phone ? 1 : 0;
  paperMat.uniforms.uCell.value = phone ? 5.2 : 6.5;      // phones print on a finer screen
  const qw = Math.max(16, Math.round(SW / 4)), qh = Math.max(16, Math.round(SH / 4));
  for (const t of [silTarget, blurA, blurB]) t.setSize(qw, qh);
  sized = false;
}
const stageObserver = new ResizeObserver(measure);
stageObserver.observe(stageEl);
stageObserver.observe(svhProbe);
phoneQuery.addEventListener('change', measure);
measure();
// a point on screen (CSS px within the stage) lifted to height z above the paper
const toWorld = (sx, sy, z, out) => out.set((sx / SW - 0.5) * visW * (D - z) / D, (0.5 - sy / SH) * visH * (D - z) / D, z);

// ---- framing for each slide: the whole molecule, then close on each project's residue, each
//      time from a different side of the screen, so it travels across the page as you scroll
const slides = [...document.querySelectorAll('.slide')], bar = document.getElementById('bar');
const phoneFrames = framesFor(slides, true), desktopFrames = framesFor(slides, false);

// 0 = intro, 1 = first project and so on, blending between adjacent framings.
function slidePos(y) {
  let s = 0;
  for (let i = 1; i < slides.length; i++) {
    if (phone) {
      s += smooth(VS * 0.72, VS * 0.42, phoneLayout.articles[i - 1] - y);
    } else {
      s += smooth(innerHeight * 0.72, innerHeight * 0.36, slides[i].getBoundingClientRect().top);
    }
  }
  return s;
}

// ---- the hand-drawn ring: an imperfect loop with an overshoot, redrawn for each residue
const ring = { el: document.getElementById('ring'), halo: document.getElementById('ringHalo'), path: document.getElementById('ringPath'), tick: document.getElementById('ringTick'), text: document.getElementById('ringText'), key: '', wob: 1, drawnAt: 0 };
function loopPath(r, wob, seed) {
  let rnd = seed; const R = () => (rnd = (rnd * 9301 + 49297) % 233280) / 233280;
  const pts = [], n = 28, start = R() * Math.PI * 2, sweep = Math.PI * 2 * (1.08 + 0.06 * wob);
  for (let i = 0; i <= n; i++) {
    const a = start + sweep * i / n;
    const rr = r * (1 + (R() - 0.5) * (0.08 + 0.1 * wob) + 0.06 * Math.sin(a * 2 + seed));
    pts.push([Math.cos(a) * rr * 1.12, Math.sin(a) * rr * 0.9]);
  }
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
    d += ` Q${x0.toFixed(1)} ${y0.toFixed(1)} ${((x0 + x1) / 2).toFixed(1)} ${((y0 + y1) / 2).toFixed(1)}`;
  }
  return d;
}

// ---- the loop
const tmp = new THREE.Vector3(), tgt = new THREE.Vector3(), off = new THREE.Vector3();
let visible = false, start = null, sPrev = -1;
let foldShown = 1, meshFine = true, lastMove = 0;
let cleared = false;
let ufVel = 0, fdShown = 0, fdVel = 0, frameNo = 0, spinAcc = 0;                               // the unfold follows a spring: gentle start, quick middle, soft landing                     // seconds, for a full unfold
let ufShown = 0, lastFrame = null, aliveSince = null, appear = 0, heldOff = 0, lastNear = null, spinTarget = 0, spinOff = 0, spinVel = 0;
const cam = { x: 0, y: 0, s: 1, tilt: 0, init: false };
const finaleEl = document.getElementById('finale'), lettersEl = document.getElementById('letters');
const NAME = 'ERICFADEYEV', CODES = ['Glu','Arg','Ile','Cys','Phe','Ala','Asp','Glu','Tyr','Glu','Val'];
const letterEls = [...NAME].map((ch, i) => { const el = document.createElement('span'); el.textContent = ch; lettersEl.appendChild(el); return el; });
// Cache document positions after reflow. Safari can deliver scroll updates in steps, and
// reading layout after writing the finale letters would force the browser to lay them out.
let phoneLayout, phoneY = null, stageY = null;
const nativeStageScroll = CSS.supports('animation-timeline', 'scroll(root block)') && CSS.supports('animation-range', '0px 1px');
function measurePhoneLayout() {
  if (!phoneQuery.matches) return;
  const y = scrollY;
  phoneLayout = {
    articles: slides.slice(1).map(slide => slide.getBoundingClientRect().top + slide.firstElementChild.offsetTop + y),
    workTop: slides[0].getBoundingClientRect().top + y,
    stageOrigin: stageTrack.getBoundingClientRect().top + y,
    tailBottom: tailEl.getBoundingClientRect().bottom + y,
    finaleTop: finaleEl.getBoundingClientRect().top + y,
    maxY: html.scrollHeight - html.clientHeight,
  };
  const height = svhProbe.offsetHeight || innerHeight;
  phoneLayout.releaseY = Math.max(1, Math.min(phoneLayout.maxY - 8, phoneLayout.finaleTop - height * 0.22));
  // One CSS pixel per scroll pixel until the finale; then the stage stays in document space.
  stageEl.style.setProperty('--stage-origin', `${-phoneLayout.stageOrigin}px`);
  stageEl.style.setProperty('--stage-distance', `${phoneLayout.releaseY}px`);
}
const layoutObserver = new ResizeObserver(measurePhoneLayout);
for (const el of [document.body, document.querySelector('.hero'), tailEl, svhProbe, ...slides]) layoutObserver.observe(el);
phoneQuery.addEventListener('change', measurePhoneLayout);
addEventListener('resize', measurePhoneLayout);
measurePhoneLayout();

// 0 while reading, 1 once you've reached the very end
function unfoldPos(y) {
  // Finish a little before the bottom so the unfolding cannot stall partway.
  const height = phone ? VS : innerHeight;
  const fy = phone ? phoneLayout.finaleTop : finaleEl.getBoundingClientRect().top + y;
  const maxY = phone ? phoneLayout.maxY : html.scrollHeight - innerHeight;
  const together = document.documentElement.dataset.unfold === 'together';
  // together is scrubbed by scroll over a long window that starts as the ending's space first rises into view
  const a = fy - height * (together ? 0.85 : 0.65), b = phone ? phoneLayout.releaseY : Math.min(maxY - 8, fy - height * 0.15);
  return smooth(Math.min(a, b - 40), b, y);
}
new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { rootMargin: '200px 0px' }).observe(stageEl);
addEventListener('stylechange', applyStyle);
applyStyle();

// where the rig must sit, at scale s, so residue r lands on screen point (sx, sy)
function placeFor(fr, s) {
  if (fr.pan !== undefined) {                       // part-way between the whole molecule centred and the residue centred
    const a = placeFor({ ...fr, res: 0, pan: undefined }, s), b = placeFor({ ...fr, pan: undefined }, s);
    return a.lerp(b, fr.pan);
  }
  if (fr.sx === undefined) fr = { ...fr, sx: colCx + (fr.dx || 0) };   // computer frames sit in the left column
  rig.position.set(0, 0, HOVER); rig.scale.setScalar(s); rig.updateMatrixWorld(true);
  if (!fr.res) { toWorld(fr.sx * SW, fr.sy * VS - (fr.vp ? stTop : 0), HOVER, tgt); return off.set(tgt.x, tgt.y, 0).clone(); }
  tmp.copy(foldCenters[fr.res - 1]).applyMatrix4(mol.matrixWorld);
  toWorld(fr.sx * SW, fr.sy * VS - (fr.vp ? stTop : 0), tmp.z, tgt);
  return new THREE.Vector3(tgt.x - tmp.x, tgt.y - tmp.y, 0);
}

function frame(ms) {
  const time = ms / 1000;
  if (start === null) start = time;
  const dt = lastFrame === null ? 0 : Math.min(0.1, time - lastFrame); lastFrame = time;
  const y = scrollY;
  let tailBottom;
  if (phone) {
    // Smooth the scroll samples once for all cues. Bound the delay on fast flings
    // so the pose still follows the article on screen.
    if (phoneY === null || reduceMotion || Math.abs(y - phoneY) < 0.5) phoneY = y;
    else {
      const maxBehind = VS * 0.12;
      phoneY = lerp(clamp(phoneY, y - maxBehind, y + maxBehind), y, 1 - Math.exp(-dt / 0.045));
    }
    tailBottom = phoneLayout.tailBottom - y;
    appear = smooth(VS * 0.75, VS * 0.5, phoneLayout.workTop - phoneY);
    if (reduceMotion) appear = Number(appear >= 0.5);
  } else {
    phoneY = null;
    tailBottom = tailEl.getBoundingClientRect().bottom;
    const ph = portraitEl.getBoundingClientRect().bottom;
    const want = ph < innerHeight * 0.3;
    appear = reduceMotion ? Number(want) : lerp(appear, Number(want), 1 - Math.exp(-dt * 3));
  }
  tickTheme();
  // Older browsers without scroll timelines retain a transform-only fallback.
  // Native timelines need no per-frame DOM writes to keep the stage anchored.
  if (phone) {
    const anchorY = clamp(y, 0, phoneLayout.releaseY);
    if (!nativeStageScroll && anchorY !== stageY) {
      stageEl.style.setProperty('--stage-scroll', `${anchorY}px`);
      stageY = anchorY;
    }
  } else if (!visible) return;
  if (phone && (appear === 0 || y >= phoneLayout.releaseY + SH)) { if (!cleared) { renderer.setScissorTest(false); renderer.clear(); cleared = true; lettersEl.style.display = 'none'; } return; }
  cleared = false;
  if (!sized) { renderer.setPixelRatio(dpr); renderer.setSize(SW, SH, false); sized = true; }
  for (const m of [risoColorMat, risoInkMat, paperMat, stippleMat]) m.uniforms.uAppear.value = ease(clamp(appear));
  glass.opacity = 0.9 * clamp(appear);

  // slides -> a blend of two framings (sp is already eased, and continuous, so the blend is linear)
  stTop = phone ? clamp(y, 0, phoneLayout.releaseY) - y : stageEl.getBoundingClientRect().top;
  const sp = motion === 'pan' ? slidePos(phoneY) : 0;
  const FRAMES = phone ? phoneFrames : desktopFrames;
  const i0 = Math.min(Math.floor(sp), FRAMES.length - 1), i1 = Math.min(i0 + 1, FRAMES.length - 1), f = sp - i0;
  const A = FRAMES[i0], B = FRAMES[i1];
  // On desktop the unfold follows a spring; on phones it uses the same scroll as the project poses.
  // Ensure the chain is fully open at the release boundary, even during a fast swipe.
  const ufPos = unfoldPos(phone ? (y >= phoneLayout.releaseY ? y : Math.min(phoneY, phoneLayout.releaseY)) : y);
  const ufTarget = reduceMotion ? Number(ufPos > 0.5) : ufPos;
  if (phone || ufTarget < ufShown || reduceMotion) { ufShown = ufTarget; ufVel = 0; }
  else {
    const w = html.dataset.unfold === 'together' ? 6.5 : 7.5;   // together: tracks the scroll, but a hard flick still plays out over ~0.4 s   // together follows the scroll closely (just enough spring to stay smooth)
    for (let k = 0; k < 4; k++) { const h = dt / 4; ufVel += (w * w * (ufTarget - ufShown) - 2 * w * ufVel) * h; ufShown += ufVel * h; }
    if (ufShown > ufTarget) { ufShown = ufTarget; ufVel = 0; }
    if (ufTarget >= 1 && ufShown > 0.997) { ufShown = 1; ufVel = 0; }
  }
  const uf = ufShown;
  // how the ending is choreographed: mv = swinging flat and gliding to the centre, fd = the unfolding itself
  //   move:     come forward first (still folded), then open in place at a steady size
  //   together: start moving; midway through the move it begins to open, finishing just after the move does
  //   none:     glide to the centre still folded; the name appears above it
  const mode = html.dataset.unfold || 'move';
  const upright = false;
  let mv, fd;
  if (mode === 'together') { mv = ease(smooth(0, 0.66, uf)); fd = smooth(0.33, 0.86, uf); }   // the move starts; midway through it the opening begins, and finishes just after the move
  else if (mode === 'none') { mv = ease(uf); fd = 0; }
  else { mv = ease(smooth(0, 0.32, uf)); fd = smooth(0.3, 1, uf); }
  const lp = mode === 'none' ? smooth(0.35, 1, uf) : fd;      // how far the name has arrived
  const ue = mv;                                              // (the framing below follows the move)
  const zoom = lerp(A.zoom, B.zoom, f);
  const chainScale = (phone ? 0.86 : 0.56) * visW / CHAIN_LEN;
  const upScale = Math.min(0.64 * visH / CHAIN_LEN, fitScale * 1.2);   // a straight chain standing in the left column
  const sProj = fitScale * zoom;
  let s;
  if (mode === 'none') s = lerp(sProj, fitScale * (phone ? 1 : 0.62), mv);
  else s = lerp(sProj, chainScale, mv);

  // unfolding: the same fold, played backwards as you reach the end
  const t = 1 - fd;
  const alive = t < 0.001 && !reduceMotion;
  frameNo++;
  if (alive && (!phone || time - lastMove >= 1 / 30 || foldShown !== -1)) { // cap costly mobile mesh rebuilds at 30 Hz
    // fully unfolded: the chain drifts like something in water. Layered rhythms per bead, so it never quite repeats
    placeAtoms(0);
    const k = smooth(0, 1.5, time - (aliveSince ??= time));
    for (const a of atoms) {
      const ph = (a.res - 1) * 0.62;
      a.now.y += k * (0.42 * Math.sin(time * 0.83 - ph) + 0.2 * Math.sin(time * 0.37 - ph * 1.7 + 1.3));
      a.now.z += k * (0.32 * Math.cos(time * 0.61 - ph * 0.8) + 0.14 * Math.sin(time * 1.13 - ph * 2.1));
      a.now.x += k * 0.1 * Math.sin(time * 0.71 - ph * 1.3 + 0.6);
    }
    meshSurface(phone ? 0.85 : 0.6); meshFine = false; lastMove = time; foldShown = -1;
  } else if (alive) { /* skipped frame: keep the last shape */ }
  else if (Math.abs(t - foldShown) > 2e-4) { aliveSince = null; placeAtoms(t); meshSurface(phone ? 0.8 : COARSE); meshFine = false; lastMove = time; foldShown = t; }   // (a coarser grid on phones while it moves)
  else if (!meshFine && time - lastMove > 0.15) { meshSurface(FINE); meshFine = true; }
  if (stipple) stipple.visible = pepMode === 'stipple' && t > 0.999;          // dots are scattered on the folded shape only
  if (pepMode === 'stipple') risoInk.visible = t <= 0.999;

  // The phone pose already uses the smoothed scroll position.
  const kf = phone || !cam.init ? 1 : 1 - Math.exp(-dt * (uf > 0.01 ? 18 : 14));
  const projTilt = lerp(A.tilt, B.tilt, f);
  cam.tilt = lerp(cam.tilt, upright ? lerp(projTilt, Math.PI / 2, smooth(0, 0.4, fd)) : lerp(projTilt, 0, ue), kf);
  outer.rotation.set(lerp(0.2, 0.08, ue), 0, cam.tilt);
  // the turn about its long axis follows the scroll, continuously (no per-project kicks)
  spinOff = reduceMotion ? 0 : sp * (phone ? 0.75 : 0.5);
  // the slow turn about its long axis: about a third as fast once the chain has opened (accumulated, so changing speed never jumps)
  if (!reduceMotion) spinAcc += dt * (pepMode === 'glass' ? 0.18 : 0.12) * (1 - 0.65 * fd);
  spinner.rotation.x = -(0.6 + spinOff + spinAcc);
  scene.updateMatrixWorld(true);
  const pa = placeFor(A, s), pb = placeFor(B, s);
  let px = lerp(pa.x, pb.x, f), py = lerp(pa.y, pb.y, f);
  if (ue > 0) { const pc = placeFor({ res: 0, sx: 0.5, sy: 0.5 }, s); px = lerp(px, pc.x, ue); py = lerp(py, pc.y, ue); }
  else if (upright && fd > 0) { const pc = placeFor({ res: 0, dx: 0, sy: 0.44 }, s); px = lerp(px, pc.x, ease(fd)); py = lerp(py, pc.y, ease(fd)); }
  cam.x = lerp(cam.x, px, kf); cam.y = lerp(cam.y, py, kf); cam.s = lerp(cam.s, s, kf); cam.init = true;
  rig.position.set(cam.x, cam.y, HOVER);
  rig.scale.setScalar(cam.s);
  scene.updateMatrixWorld(true);
  stippleMat.uniforms.uZoom.value = zoom;
  // the molecule's top and bottom on screen (in the shaders' pixel units, measured up from the bottom)
  let yMin = Infinity, yMax = -Infinity;
  for (const a of atoms) { tmp.copy(a.now).applyMatrix4(mol.matrixWorld).project(camera); yMin = Math.min(yMin, tmp.y); yMax = Math.max(yMax, tmp.y); }
  const padPx = 3 * s * SW / visW * dpr;
  const topY = (yMax + 1) / 2 * SH * dpr + padPx, botY = (yMin + 1) / 2 * SH * dpr - padPx;
  for (const m of [risoColorMat, risoInkMat, paperMat]) { m.uniforms.uTopY.value = topY; m.uniforms.uBotY.value = botY; }
  risoColorMat.uniforms.uTime.value = risoInkMat.uniforms.uTime.value = reduceMotion ? 0 : time;
  risoColorMat.uniforms.uWave.value = risoInkMat.uniforms.uWave.value = reduceMotion ? 0 : smooth(0.6, 1, mode === 'none' ? lp : fd);

  // the ring: shown once a project is framed (or, when still, around the project in view)
  const near = Math.round(sp), settled = Math.abs(sp - near) < 0.18;
  let fr = motion === 'pan' ? (settled ? FRAMES[near] : null) : FRAMES[stillFocus()];
  fr = null;   // (the residue ring is retired)

  // the letters: one over each bead, coming in left to right as the chain straightens
  lettersEl.style.display = lp > 0.5 ? '' : 'none';
  if (lp > 0.5) {
    const molTop = SH - topY / dpr;                       // (none: keep the name clear of the folded molecule)
    const lift = 3.4 * s * SW / visW + 26;
    for (let i = 0; i < N_RES; i++) {
      tmp.set(0, 0, 0); for (const a of resAtoms[i]) tmp.add(a.chain);   // the straight chain's bead: the name holds still while the chain drifts
      tmp.multiplyScalar(1 / resAtoms[i].length).applyMatrix4(mol.matrixWorld).project(camera);
      const gap = (i < 4 ? -1 : 1) * Math.min(9, SW * 0.022);                         // a word gap between Eric and Fadeyev
      const bx = (tmp.x + 1) / 2 * SW, by = (1 - tmp.y) / 2 * SH;
      const k = smooth(0.62 + i * 0.018, 0.8 + i * 0.018, lp);   // the last letter lands exactly as the chain straightens
      letterEls[i].style.opacity = k;
      letterEls[i].style.transform = upright
        ? `translate(${(bx + lift + (1 - k) * 10).toFixed(1)}px, ${(by - gap).toFixed(1)}px) translate(-50%, -50%) rotate(-90deg)`
        : `translate(${(bx + gap).toFixed(1)}px, ${((mode === 'none' ? Math.min(by - lift, molTop - 34) : by - lift) + (1 - k) * 10).toFixed(1)}px) translate(-50%, -50%)`;
    }
  }
  if (fr && fr.res) {
    tmp.copy(foldCenters[fr.res - 1]).applyMatrix4(mol.matrixWorld).project(camera);
    const x = (tmp.x + 1) / 2 * SW, y = (1 - tmp.y) / 2 * SH;
    const r = clamp(3.2 * s * SW / visW, 22, 46);
    const dir = phone ? (x > SW * 0.55 ? -1 : 1) : 1;   // label goes toward the roomier side (toward the words, on a computer)
    const key = fr.res + ':' + Math.round(r / 6) + ':' + ring.wob + ':' + dir;
    if (key !== ring.key) {
      ring.key = key;
      ring.path.setAttribute('d', loopPath(r, ring.wob, fr.res * 17 + 3)); ring.halo.setAttribute('d', ring.path.getAttribute('d'));
      ring.tick.setAttribute('d', `M${(dir * r * 0.8).toFixed(1)} ${(-r * 0.75).toFixed(1)} L${(dir * r * 1.5).toFixed(1)} ${(-r * 1.45).toFixed(1)}`);
      ring.text.textContent = fr.label;
      ring.text.setAttribute('text-anchor', dir > 0 ? 'start' : 'end');
      ring.text.setAttribute('x', (dir * r * 1.58).toFixed(1)); ring.text.setAttribute('y', (-r * 1.5).toFixed(1));
      const len = ring.path.getTotalLength();
      ring.path.style.transition = 'none'; ring.path.style.strokeDasharray = len; ring.path.style.strokeDashoffset = len;
      ring.path.getBoundingClientRect();
      ring.path.style.transition = reduceMotion ? 'none' : 'stroke-dashoffset .7s cubic-bezier(.6,.05,.3,1)';
      ring.path.style.strokeDashoffset = 0;
      ring.halo.style.strokeDasharray = len; ring.halo.style.strokeDashoffset = 0;
    }
    for (const el of [ring.halo, ring.path, ring.tick, ring.text]) { el.style.opacity = smooth(0.6, 1, appear); el.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)})`); }
  } else {
    for (const el of [ring.halo, ring.path, ring.tick, ring.text]) el.style.opacity = 0;
    if (!fr) ring.key = '';
  }

  camera.layers.set(1);
  renderer.setRenderTarget(silTarget); renderer.render(scene, camera);
  camera.layers.set(0);
  const step = BLUR_PX / 4 / 7;                                   // in quarter-size pixels, spread over 7 taps each way
  blurMat.uniforms.tMap.value = silTarget.texture; blurMat.uniforms.uDir.value.set(step / silTarget.width, 0);
  renderer.setRenderTarget(blurA); blurQuad.render(renderer);
  blurMat.uniforms.tMap.value = blurA.texture; blurMat.uniforms.uDir.value.set(0, step / silTarget.height);
  renderer.setRenderTarget(blurB); blurQuad.render(renderer);
  renderer.setRenderTarget(null);
  // only the band from the bottom of the canvas up to just above the molecule can hold anything: clear the
  // whole canvas (cheap), then draw just that band
  const bandPx = Math.min(SH, topY / dpr + BLUR_PX + 90);
  // ...and never below the end of the work section: at the very end the full-height stage overhangs the footer
  const clipPx = clamp(stTop + SH - tailBottom, 0, SH);
  renderer.setScissorTest(false); renderer.clear();
  renderer.setScissorTest(true); renderer.setScissor(0, clipPx, SW, Math.max(0, bandPx - clipPx));
  renderer.autoClear = false; renderer.render(scene, camera); renderer.autoClear = true;
  renderer.setScissorTest(false);
}
// with motion off, the ring follows whichever project's text is on screen
function stillFocus() {
  let best = 0;
  const band = phone ? Math.max(0, stTop) + VS * 0.6 : innerHeight * 0.62, head = bar.getBoundingClientRect().bottom;
  slides.forEach((el, i) => { const r = el.getBoundingClientRect(); if (r.top < head + (band - head) * 0.55) best = i; });
  return best;
}
// Adapt only after sustained frame pressure, never continuously resize while scrolling.
let raf = 0, lastTick = 0, lastScroll = scrollY, lastScrollAt = performance.now();
function tick(ms) {
  const delta = lastTick ? ms - lastTick : 0; lastTick = ms;
  if (scrollY !== lastScroll) { lastScroll = scrollY; lastScrollAt = ms; }
  try {
    frame(ms);
    if (!cleared && appear > .9 && delta > 0 && delta < 250) {
      samples++; if (delta > 22) slowFrames++; if (delta < 18) fastFrames++;
      if (ms - qualitySince > 3000 && samples >= 75 && ms - lastScrollAt > 180) {
        const next = slowFrames / samples > .3 ? Math.max(.67, quality - .16)
          : fastFrames / samples > .9 ? Math.min(1, quality + .08) : quality;
        qualitySince = ms; samples = slowFrames = fastFrames = 0;
        if (next !== quality) { quality = next; measure(); }
      }
    } else { samples = slowFrames = fastFrames = 0; }
    raf = requestAnimationFrame(tick);
  } catch (error) {
    console.warn('Peptide renderer failed; using static fallback.', error);
    html.classList.remove('peptide-live');
  }
}
function resume() { if (!raf && !document.hidden) { lastTick = 0; lastFrame = null; raf = requestAnimationFrame(tick); } }
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { cancelAnimationFrame(raf); raf = 0; } else resume();
});
canvas.addEventListener('webglcontextlost', e => {
  e.preventDefault(); cancelAnimationFrame(raf); raf = 0; html.classList.remove('peptide-live');
});
canvas.addEventListener('webglcontextrestored', () => { measure(); html.classList.add('peptide-live'); resume(); });
html.classList.add('peptide-live');
resume();

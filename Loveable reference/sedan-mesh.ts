/* ---------------------------------------------------------------------
 * Procedural holographic sedan.
 *
 * The body is a lofted surface: a squircle cross-section swept along the
 * car's length with varying width / roofline, so it has genuine 3D depth
 * and curved automotive surfaces (hood, cowl, beltline, tapered tail).
 * A second loft forms the greenhouse (windshield, roof, rear glass).
 * Wheels, arches, grille, lamps, mirrors and door seams are derived from
 * the same surface functions so they sit exactly on the body.
 *
 * Units are metres. Origin is on the ground at the centre of the car,
 * +x = front, +y = up, +z = right.
 * ------------------------------------------------------------------ */
import * as THREE from "three";

import type { VehicleZone } from "@/lib/vehicle-damage";

export const CAR_LENGTH = 4.6;
const HALF_L = CAR_LENGTH / 2;
const BODY_HALF_W = 0.9;
const RING = 56; // cross-section resolution
const STEPS = 64; // lengthwise resolution

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (t: number) => {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
};

/* ---- lower body surface functions -------------------------------- */

function bodyHalfWidth(x: number) {
  const front = Math.max(0, (x - 1.35) / (HALF_L - 1.35));
  const rear = Math.max(0, (-x - 1.45) / (HALF_L - 1.45));
  const taper = 1 - 0.2 * front * front - 0.16 * rear * rear;
  const bulge = 1 + 0.03 * Math.cos((x / HALF_L) * Math.PI);
  return BODY_HALF_W * taper * bulge;
}

function beltline(x: number) {
  if (x >= 0.62) {
    // hood: falls forward with a slight crown
    const t = smooth((x - 0.62) / (HALF_L - 0.62));
    return lerp(0.86, 0.74, t);
  }
  if (x >= -1.25) return 0.86;
  const t = smooth((-x - 1.25) / (HALF_L - 1.25));
  return lerp(0.86, 0.8, t); // trunk lid
}

function underside(x: number) {
  const front = Math.max(0, (x - 1.75) / (HALF_L - 1.75));
  const rear = Math.max(0, (-x - 1.8) / (HALF_L - 1.8));
  return 0.3 + 0.15 * smooth(front) + 0.15 * smooth(rear);
}

/** Squircle ring for the lower body at station x. */
function bodyRing(x: number, scale = 1): THREE.Vector3[] {
  const hw = bodyHalfWidth(x) * scale;
  const top = beltline(x);
  const bottom = underside(x);
  const cy = (top + bottom) / 2;
  const hh = ((top - bottom) / 2) * scale;
  const p = 3.6;
  const pts: THREE.Vector3[] = [];
  for (let j = 0; j < RING; j++) {
    const th = (j / RING) * Math.PI * 2;
    const c = Math.cos(th);
    const s = Math.sin(th);
    const z = Math.sign(c) * Math.pow(Math.abs(c), 2 / p) * hw;
    const y = cy + Math.sign(s) * Math.pow(Math.abs(s), 2 / p) * hh;
    pts.push(new THREE.Vector3(x, y, z));
  }
  return pts;
}

/* ---- greenhouse (cabin) surface functions ------------------------ */

const CABIN_FRONT = 0.72; // windshield base
const CABIN_REAR = -1.42; // rear glass base
const CABIN_BASE_Y = 0.81;

function roofline(x: number) {
  if (x > 0.02) {
    // windshield rake
    const t = smooth((CABIN_FRONT - x) / (CABIN_FRONT - 0.02));
    return lerp(CABIN_BASE_Y + 0.02, 1.44, t);
  }
  if (x > -0.95) {
    const t = (0.02 - x) / 0.97;
    return 1.44 - 0.05 * t; // gently falling roof
  }
  const t = smooth((-0.95 - x) / (-0.95 - CABIN_REAR));
  return lerp(1.38, CABIN_BASE_Y + 0.02, t); // rear glass
}

function cabinHalfWidth(x: number) {
  const mid = (CABIN_FRONT + CABIN_REAR) / 2;
  const u = Math.abs(x - mid) / ((CABIN_FRONT - CABIN_REAR) / 2);
  return 0.74 * (1 - 0.14 * u * u);
}

/** Half squircle (base -> roof) for the greenhouse at station x. */
function cabinRing(x: number, scale = 1): THREE.Vector3[] {
  const hw = cabinHalfWidth(x) * scale;
  const h = (roofline(x) - CABIN_BASE_Y) * scale;
  const p = 4.0;
  const pts: THREE.Vector3[] = [];
  for (let j = 0; j < RING; j++) {
    // sweep from right sill, over the roof, down to the left sill
    const th = (j / (RING - 1)) * Math.PI;
    const c = Math.cos(th);
    const s = Math.sin(th);
    const z = Math.sign(c) * Math.pow(Math.abs(c), 2 / p) * hw;
    const y = CABIN_BASE_Y + Math.pow(Math.abs(s), 2 / p) * h;
    pts.push(new THREE.Vector3(x, y, z));
  }
  return pts;
}

/* ---- lofting helpers --------------------------------------------- */

function loft(sections: THREE.Vector3[][], closedRing: boolean, capEnds: boolean) {
  const cols = sections[0]!.length;
  const pos: number[] = [];
  const idx: number[] = [];
  sections.forEach((sec) => sec.forEach((v) => pos.push(v.x, v.y, v.z)));

  const ringCount = closedRing ? cols : cols - 1;
  for (let i = 0; i < sections.length - 1; i++) {
    for (let j = 0; j < ringCount; j++) {
      const jn = (j + 1) % cols;
      const a = i * cols + j;
      const b = i * cols + jn;
      const c = (i + 1) * cols + j;
      const d = (i + 1) * cols + jn;
      idx.push(a, c, b, b, c, d);
    }
  }

  if (capEnds) {
    [0, sections.length - 1].forEach((si, end) => {
      const centre = new THREE.Vector3();
      sections[si]!.forEach((v) => centre.add(v));
      centre.divideScalar(cols);
      const ci = pos.length / 3;
      pos.push(centre.x, centre.y, centre.z);
      for (let j = 0; j < cols; j++) {
        const jn = (j + 1) % cols;
        const a = si * cols + j;
        const b = si * cols + jn;
        if (end === 0) idx.push(ci, a, b);
        else idx.push(ci, b, a);
      }
    });
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

function stations(from: number, to: number, count: number) {
  return Array.from({ length: count }, (_, i) => lerp(from, to, i / (count - 1)));
}

function lineGeo(points: THREE.Vector3[]) {
  return new THREE.BufferGeometry().setFromPoints(points);
}

/* ---- holographic body shader ------------------------------------- */

function holoMaterial(scanUniform: { value: number }) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: {
      uScan: scanUniform,
      uBase: { value: new THREE.Color(0x061019) },
      uRim: { value: new THREE.Color(0x38e8ff) },
      uPulse: { value: new THREE.Color(0xa855f7) },
    },
    vertexShader: /* glsl */ `
      varying vec3 vNormalV;
      varying vec3 vViewV;
      varying vec3 vLocal;
      void main() {
        vLocal = position;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vNormalV = normalize(normalMatrix * normal);
        vViewV = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uScan;
      uniform vec3 uBase;
      uniform vec3 uRim;
      uniform vec3 uPulse;
      varying vec3 vNormalV;
      varying vec3 vViewV;
      varying vec3 vLocal;
      void main() {
        float f = 1.0 - abs(dot(normalize(vNormalV), normalize(vViewV)));
        float rim = pow(clamp(f, 0.0, 1.0), 2.1);
        // fine horizontal scan grid over the surface
        float grid = smoothstep(0.86, 1.0, abs(sin(vLocal.y * 42.0))) * 0.09;
        // travelling scan sheet
        float sweep = exp(-pow((vLocal.x - uScan) * 5.0, 2.0));
        vec3 col = uBase + uRim * (rim * 0.85 + grid) + uPulse * sweep * 0.55;
        float alpha = 0.34 + rim * 0.5 + sweep * 0.25 + grid;
        gl_FragColor = vec4(col, clamp(alpha, 0.0, 0.95));
      }
    `,
  });
}

/* ---- semantic damage zones (local car space) --------------------- */

function sideZ(x: number) {
  return bodyHalfWidth(x) + 0.02;
}

export const VEHICLE_ZONES: Record<VehicleZone, THREE.Vector3> = {
  windshield: new THREE.Vector3(0.4, 1.15, 0),
  roof: new THREE.Vector3(-0.5, 1.42, 0),
  hood: new THREE.Vector3(1.5, 0.82, 0),
  "front-bumper": new THREE.Vector3(2.28, 0.5, 0),
  grille: new THREE.Vector3(2.26, 0.6, 0),
  "rear-bumper": new THREE.Vector3(-2.28, 0.52, 0),
  trunk: new THREE.Vector3(-1.85, 0.83, 0),
  "rear-glass": new THREE.Vector3(-1.2, 1.12, 0),
  "front-left-fender": new THREE.Vector3(1.45, 0.78, -sideZ(1.45)),
  "front-right-fender": new THREE.Vector3(1.45, 0.78, sideZ(1.45)),
  "front-left-headlight": new THREE.Vector3(2.12, 0.7, -0.58),
  "front-right-headlight": new THREE.Vector3(2.12, 0.7, 0.58),
  "rear-left-taillight": new THREE.Vector3(-2.14, 0.72, -0.56),
  "rear-right-taillight": new THREE.Vector3(-2.14, 0.72, 0.56),
  "front-left-door": new THREE.Vector3(0.25, 0.66, -sideZ(0.25)),
  "front-right-door": new THREE.Vector3(0.25, 0.66, sideZ(0.25)),
  "rear-left-door": new THREE.Vector3(-0.8, 0.66, -sideZ(-0.8)),
  "rear-right-door": new THREE.Vector3(-0.8, 0.66, sideZ(-0.8)),
  "left-mirror": new THREE.Vector3(0.6, 0.94, -0.94),
  "right-mirror": new THREE.Vector3(0.6, 0.94, 0.94),
  "rear-left-quarter": new THREE.Vector3(-1.6, 0.76, -sideZ(-1.6)),
  "rear-right-quarter": new THREE.Vector3(-1.6, 0.76, sideZ(-1.6)),
};

/* ---- the vehicle ------------------------------------------------- */

export interface SedanBuild {
  group: THREE.Group;
  scanUniform: { value: number };
  dispose: () => void;
}

export function buildSedan(): SedanBuild {
  const group = new THREE.Group();
  const disposables: Array<{ dispose: () => void }> = []; // geometries + materials
  const track = <T extends { dispose: () => void }>(o: T) => {
    disposables.push(o);
    return o;
  };

  const scanUniform = { value: -HALF_L };
  const bodyMat = track(holoMaterial(scanUniform));
  const edgeMat = track(
    new THREE.LineBasicMaterial({ color: 0x7df0ff, transparent: true, opacity: 0.85 }),
  );
  const contourMat = track(
    new THREE.LineBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.22 }),
  );
  const seamMat = track(
    new THREE.LineBasicMaterial({ color: 0x67e8f9, transparent: true, opacity: 0.5 }),
  );

  /* body + greenhouse surfaces */
  const bodyGeo = track(
    loft(
      stations(-HALF_L, HALF_L, STEPS).map((x) => bodyRing(x)),
      true,
      true,
    ),
  );
  const cabinGeo = track(
    loft(
      stations(CABIN_FRONT, CABIN_REAR, 40).map((x) => cabinRing(x)),
      false,
      false,
    ),
  );
  group.add(new THREE.Mesh(bodyGeo, bodyMat));
  group.add(new THREE.Mesh(cabinGeo, bodyMat));

  /* illuminated silhouette edges */
  group.add(new THREE.LineSegments(track(new THREE.EdgesGeometry(bodyGeo, 26)), edgeMat));
  group.add(new THREE.LineSegments(track(new THREE.EdgesGeometry(cabinGeo, 22)), edgeMat));

  /* lengthwise character lines: beltline, shoulder, sill, roof arc */
  const long = stations(-HALF_L + 0.05, HALF_L - 0.05, 60);
  [0, 6, 14, 28].forEach((j) => {
    const pts = long.map((x) => bodyRing(x, 1.004)[j % RING]!);
    group.add(new THREE.Line(track(lineGeo(pts)), seamMat));
  });
  const cabinLong = stations(CABIN_FRONT, CABIN_REAR, 44);
  [4, Math.floor(RING / 2), RING - 5].forEach((j) => {
    const pts = cabinLong.map((x) => cabinRing(x, 1.004)[j]!);
    group.add(new THREE.Line(track(lineGeo(pts)), seamMat));
  });

  /* cross-section contour rings (scan look) */
  stations(-HALF_L + 0.2, HALF_L - 0.2, 17).forEach((x) => {
    group.add(new THREE.LineLoop(track(lineGeo(bodyRing(x, 1.002))), contourMat));
  });

  stations(CABIN_FRONT - 0.05, CABIN_REAR + 0.05, 9).forEach((x) => {
    group.add(new THREE.Line(track(lineGeo(cabinRing(x, 1.002))), contourMat));
  });

  /* door seams: vertical arcs on the flanks */
  [0.68, -0.28, -1.32].forEach((x) => {
    [1, -1].forEach((side) => {
      const ring = bodyRing(x, 1.006);
      const pts = ring.filter((v) => side * v.z > 0.28 && v.y > underside(x) + 0.06);
      if (pts.length > 1) group.add(new THREE.Line(track(lineGeo(pts)), seamMat));
    });
  });

  /* wheels + arches */
  const tireGeo = track(new THREE.CylinderGeometry(0.36, 0.36, 0.24, 30, 1, true));
  const tireMat = track(
    new THREE.MeshBasicMaterial({
      color: 0x080f1a,
      transparent: true,
      opacity: 0.95,
      side: THREE.DoubleSide,
    }),
  );
  const faceGeo = track(new THREE.TorusGeometry(0.36, 0.008, 5, 34));
  const hubGeo = track(new THREE.TorusGeometry(0.13, 0.008, 5, 22));
  const rimMat = track(
    new THREE.MeshBasicMaterial({ color: 0x38e8ff, transparent: true, opacity: 0.75 }),
  );
  const WHEEL_Y = 0.36;
  const wheelXs = [1.42, -1.42];
  wheelXs.forEach((wx) => {
    [1, -1].forEach((side) => {
      const wz = side * (bodyHalfWidth(wx) - 0.07);
      const tire = new THREE.Mesh(tireGeo, tireMat);
      tire.position.set(wx, WHEEL_Y, wz);
      tire.rotation.x = Math.PI / 2;
      group.add(tire);

      // tyre sidewall rings
      [0.12, -0.12].forEach((off) => {
        const ring = new THREE.Mesh(faceGeo, rimMat);
        ring.position.set(wx, WHEEL_Y, wz + off);
        group.add(ring);
      });

      const outer = wz + side * 0.12;
      const hub = new THREE.Mesh(hubGeo, rimMat);
      hub.position.set(wx, WHEEL_Y, outer);
      group.add(hub);
      for (let k = 0; k < 5; k++) {
        const a = (k / 5) * Math.PI * 2 + 0.3;
        group.add(
          new THREE.Line(
            track(
              lineGeo([
                new THREE.Vector3(wx + Math.cos(a) * 0.13, WHEEL_Y + Math.sin(a) * 0.13, outer),
                new THREE.Vector3(wx + Math.cos(a) * 0.33, WHEEL_Y + Math.sin(a) * 0.33, outer),
              ]),
            ),
            contourMat,
          ),
        );
      }

      // wheel arch: explicit top arc hugging the flank
      const archPts: THREE.Vector3[] = [];
      for (let k = 0; k <= 26; k++) {
        const a = Math.PI * (0.08 + (0.84 * k) / 26);
        archPts.push(
          new THREE.Vector3(
            wx + Math.cos(a) * 0.43,
            WHEEL_Y - 0.02 + Math.sin(a) * 0.44,
            side * (bodyHalfWidth(wx) + 0.012),
          ),
        );
      }
      group.add(new THREE.Line(track(lineGeo(archPts)), seamMat));
    });
  });

  /* grille */
  const grilleGeo = track(new THREE.BoxGeometry(0.05, 0.17, 0.78));
  const grilleMat = track(
    new THREE.MeshBasicMaterial({ color: 0x0b1a2b, transparent: true, opacity: 0.85 }),
  );
  const grille = new THREE.Mesh(grilleGeo, grilleMat);
  grille.position.set(2.22, 0.6, 0);
  group.add(grille);
  group.add(
    (() => {
      const l = new THREE.LineSegments(track(new THREE.EdgesGeometry(grilleGeo)), edgeMat);
      l.position.copy(grille.position);
      return l;
    })(),
  );
  for (let i = -3; i <= 3; i++) {
    const bar = new THREE.Line(
      track(
        lineGeo([
          new THREE.Vector3(2.25, 0.52, i * 0.11),
          new THREE.Vector3(2.25, 0.68, i * 0.11),
        ]),
      ),
      contourMat,
    );
    group.add(bar);
  }

  /* head- and taillights */
  const lampGeo = track(new THREE.SphereGeometry(1, 16, 12));
  const headMat = track(
    new THREE.MeshBasicMaterial({
      color: 0xbdf3ff,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  const tailMat = track(
    new THREE.MeshBasicMaterial({
      color: 0xff6b8b,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  [1, -1].forEach((side) => {
    const head = new THREE.Mesh(lampGeo, headMat);
    head.position.set(2.13, 0.66, side * 0.55);
    head.scale.set(0.13, 0.055, 0.19);
    group.add(head);

    const tail = new THREE.Mesh(lampGeo, tailMat);
    tail.position.set(-2.2, 0.66, side * 0.52);
    tail.scale.set(0.1, 0.05, 0.18);
    group.add(tail);
  });

  /* mirrors */
  const mirrorGeo = track(new THREE.BoxGeometry(0.1, 0.055, 0.2));
  [1, -1].forEach((side) => {
    const m = new THREE.Mesh(mirrorGeo, bodyMat);
    m.position.set(0.6, 0.9, side * 0.88);
    m.rotation.y = side * 0.22;
    group.add(m);
    const e = new THREE.LineSegments(track(new THREE.EdgesGeometry(mirrorGeo)), edgeMat);
    e.position.copy(m.position);
    e.rotation.copy(m.rotation);
    group.add(e);
    const stem = new THREE.Line(
      track(
        lineGeo([
          new THREE.Vector3(0.66, 0.87, side * 0.78),
          new THREE.Vector3(0.6, 0.9, side * 0.85),
        ]),
      ),
      edgeMat,
    );
    group.add(stem);
  });

  const dispose = () => {
    disposables.forEach((d) => d.dispose());
    group.clear();
  };

  return { group, scanUniform, dispose };
}

/** Inspection chamber floor: grid, rings and a soft pulse ring. */
export function buildPlatform() {
  const group = new THREE.Group();
  const disposables: Array<{ dispose: () => void }> = [];
  const track = <T extends { dispose: () => void }>(o: T) => {
    disposables.push(o);
    return o;
  };

  const gridMat = track(
    new THREE.LineBasicMaterial({ color: 0x1d5f7a, transparent: true, opacity: 0.5 }),
  );
  const grid = new THREE.GridHelper(9, 18, 0x1b6a86, 0x0e2536);
  group.add(grid);

  const ringMat = track(
    new THREE.MeshBasicMaterial({
      color: 0x22d3ee,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
    }),
  );
  const ring = new THREE.Mesh(track(new THREE.RingGeometry(3.05, 3.3, 96)), ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.004;
  group.add(ring);

  const ring2Mat = track(
    new THREE.MeshBasicMaterial({
      color: 0xa855f7,
      transparent: true,
      opacity: 0.22,
      side: THREE.DoubleSide,
    }),
  );
  const ring2 = new THREE.Mesh(track(new THREE.RingGeometry(3.5, 3.56, 96)), ring2Mat);
  ring2.rotation.x = -Math.PI / 2;
  ring2.position.y = 0.004;
  group.add(ring2);

  // radial tick marks
  const ticks: THREE.Vector3[] = [];
  for (let i = 0; i < 36; i++) {
    const a = (i / 36) * Math.PI * 2;
    ticks.push(
      new THREE.Vector3(Math.cos(a) * 3.32, 0.004, Math.sin(a) * 3.32),
      new THREE.Vector3(Math.cos(a) * 3.46, 0.004, Math.sin(a) * 3.46),
    );
  }
  group.add(new THREE.LineSegments(track(lineGeo(ticks)), gridMat));

  const dispose = () => {
    disposables.forEach((d) => d.dispose());
    grid.geometry.dispose();
    (grid.material as THREE.Material).dispose();
    group.clear();
  };

  return { group, ringMat, ring2Mat, dispose };
}

/** Floating data points around the vehicle. */
export function buildParticles(count = 220) {
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 1.6 + Math.random() * 2.6;
    pos[i * 3] = Math.cos(a) * r * 1.35;
    pos[i * 3 + 1] = Math.random() * 2.6;
    pos[i * 3 + 2] = Math.sin(a) * r;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({
    color: 0x67e8f9,
    size: 0.028,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const points = new THREE.Points(geo, mat);
  return {
    points,
    dispose: () => {
      geo.dispose();
      mat.dispose();
    },
  };
}

/** Vertical scan sheet that sweeps along the vehicle. */
export function buildScanSheet() {
  const geo = new THREE.PlaneGeometry(2.4, 1.8);
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    uniforms: { uOpacity: { value: 0.09 } },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uOpacity;
      varying vec2 vUv;
      void main() {
        vec2 d = vUv - 0.5;
        float fade = smoothstep(0.5, 0.05, length(d * vec2(1.0, 1.25)));
        gl_FragColor = vec4(vec3(0.55, 0.42, 1.0), fade * uOpacity);
      }
    `,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.y = Math.PI / 2;
  mesh.position.y = 0.85;
  return {
    mesh,
    dispose: () => {
      geo.dispose();
      mat.dispose();
    },
  };
}

export const SCAN_RANGE = HALF_L + 0.4;
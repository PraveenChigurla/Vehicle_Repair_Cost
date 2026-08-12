/* ---------------------------------------------------------------------
 * Holographic digital twin of a real 3D vehicle.
 *
 * The geometry comes from an actual GLB automotive model
 * (public/models/vehicle.glb — Draco compressed, decoded with the
 * decoder in public/draco/). Nothing here invents car shapes: we only
 * re-skin the real surfaces with a holographic AI-inspection material
 * (dark metallic base + cyan fresnel edges + travelling scan band +
 * wireframe contour overlay) and derive semantic damage anchors from
 * the model's real bounding box.
 *
 * After normalisation the car is: origin on the ground at its centre,
 * +x = front, +y = up, +z = right, length = CAR_LENGTH metres.
 * ------------------------------------------------------------------ */
import * as THREE from "three";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

import type { VehicleZone } from "@/lib/vehicle-damage";

export const CAR_LENGTH = 4.6;
export const MODEL_URL = "/models/vehicle.glb";

export interface HoloCar {
  group: THREE.Group;
  scanUniform: { value: number };
  /** world -> car space matrix; update every frame from the turntable */
  toCarUniform: { value: THREE.Matrix4 };
  zones: Record<VehicleZone, THREE.Vector3>;
  size: THREE.Vector3;
  wheels: THREE.Object3D[];
  dispose: () => void;
}

const GLASS = /glass|window|windshield|windscreen/i;
const LAMP = /light|lamp|led|signal|projector/i;
const TIRE = /tire|tyre|rubber/i;
const RIM = /rim|nut|brake|centre|center|chrome|metal/i;
const INTERIOR = /interior|leather|carpet|steering|seat|dash/i;

/* --- holographic body material ------------------------------------ */
function bodyMaterial(
  scanUniform: { value: number },
  toCar: { value: THREE.Matrix4 },
  accent: number,
) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: true,
    side: THREE.FrontSide,
    uniforms: {
      uScanX: scanUniform,
      uToCar: toCar,
      uAccent: { value: new THREE.Color(accent) },
    },
    vertexShader: /* glsl */ `
      uniform mat4 uToCar;
      varying vec3 vN;
      varying vec3 vV;
      varying vec3 vWorld;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorld = (uToCar * wp).xyz;
        vN = normalize(mat3(modelMatrix) * normal);
        vV = normalize(cameraPosition - wp.xyz);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uScanX;
      uniform vec3 uAccent;
      varying vec3 vN;
      varying vec3 vV;
      varying vec3 vWorld;

      void main() {
        vec3 N = normalize(vN);
        vec3 V = normalize(vV);

        // two studio lights: cool key from front-left, magenta rim from rear-right
        float key  = max(dot(N, normalize(vec3(0.55, 0.75, 0.6))), 0.0);
        float rim  = max(dot(N, normalize(vec3(-0.7, 0.25, -0.6))), 0.0);
        float up   = max(N.y, 0.0);

        vec3 col = vec3(0.012, 0.025, 0.045);                 // very dark near-black navy paint
        col += vec3(0.0, 0.85, 1.0) * pow(key, 2.0) * 0.85;   // cyan key light
        col += vec3(0.48, 0.23, 1.0) * pow(rim, 3.0) * 0.55;  // purple rim light
        col += vec3(0.05, 0.10, 0.18) * up * 0.35;            // sky bounce

        // specular sheen -> metallic read
        vec3 H = normalize(normalize(vec3(0.55, 0.75, 0.6)) + V);
        col += vec3(0.0, 0.85, 1.0) * pow(max(dot(N, H), 0.0), 46.0) * 0.5;

        // fresnel edge glow (the holographic contour)
        float f = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 2.6);
        col += uAccent * f * 1.25;

        // holographic horizontal scan lines
        float lines = 0.5 + 0.5 * sin(vWorld.y * 90.0);
        col += vec3(0.06, 0.24, 0.30) * lines * (0.18 + 0.5 * f);

        // travelling AI scan band along the car length
        float band = exp(-pow((vWorld.x - uScanX) / 0.30, 2.0));
        col += vec3(0.35, 0.85, 1.0) * band * 0.85;
        col += vec3(0.30, 0.15, 0.55) * exp(-pow((vWorld.x - uScanX) / 0.9, 2.0)) * 0.22;

        float alpha = 0.80 + f * 0.2 + band * 0.15;
        gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
      }
    `,
  });
}

function glassMaterial(scanUniform: { value: number }, toCar: { value: THREE.Matrix4 }) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    uniforms: { uScanX: scanUniform, uToCar: toCar },
    vertexShader: /* glsl */ `
      uniform mat4 uToCar;
      varying vec3 vN;
      varying vec3 vV;
      varying vec3 vWorld;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorld = (uToCar * wp).xyz;
        vN = normalize(mat3(modelMatrix) * normal);
        vV = normalize(cameraPosition - wp.xyz);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uScanX;
      varying vec3 vN;
      varying vec3 vV;
      varying vec3 vWorld;
      void main() {
        float f = pow(1.0 - clamp(dot(normalize(vN), normalize(vV)), 0.0, 1.0), 2.0);
        float lines = 0.5 + 0.5 * sin(vWorld.y * 130.0);
        float band = exp(-pow((vWorld.x - uScanX) / 0.34, 2.0));
        vec3 col = vec3(0.03, 0.08, 0.12) * (0.35 + f * 1.5);
        col += vec3(0.0, 0.85, 1.0) * lines * 0.15;
        col += vec3(0.0, 0.85, 1.0) * band * 0.6;
        gl_FragColor = vec4(col, 0.30 + f * 0.35 + band * 0.2);
      }
    `,
  });
}

/* --- zone anchors derived from the real model bounds --------------- */
function computeZones(box: THREE.Box3): Record<VehicleZone, THREE.Vector3> {
  const L = box.max.x - box.min.x;
  const H = box.max.y;
  const W = box.max.z;
  const p = (fx: number, fy: number, fz: number) =>
    new THREE.Vector3(fx * (L / 2), fy * H, fz * W);

  return {
    windshield: p(0.16, 0.78, 0),
    roof: p(-0.1, 0.98, 0),
    hood: p(0.62, 0.6, 0),
    "front-bumper": p(0.95, 0.3, 0),
    grille: p(0.93, 0.4, 0),
    "rear-bumper": p(-0.95, 0.32, 0),
    trunk: p(-0.76, 0.62, 0),
    "rear-glass": p(-0.42, 0.8, 0),
    "front-left-fender": p(0.6, 0.5, -0.9),
    "front-right-fender": p(0.6, 0.5, 0.9),
    "front-left-headlight": p(0.86, 0.45, -0.6),
    "front-right-headlight": p(0.86, 0.45, 0.6),
    "rear-left-taillight": p(-0.9, 0.48, -0.6),
    "rear-right-taillight": p(-0.9, 0.48, 0.6),
    "front-left-door": p(0.1, 0.42, -0.98),
    "front-right-door": p(0.1, 0.42, 0.98),
    "rear-left-door": p(-0.3, 0.42, -0.96),
    "rear-right-door": p(-0.3, 0.42, 0.96),
    "left-mirror": p(0.2, 0.68, -1.02),
    "right-mirror": p(0.2, 0.68, 1.02),
    "rear-left-quarter": p(-0.66, 0.46, -0.92),
    "rear-right-quarter": p(-0.66, 0.46, 0.92),
  };
}

/** Load the GLB vehicle and re-skin it as a holographic digital twin. */
export async function loadHoloCar(): Promise<HoloCar> {
  const draco = new DRACOLoader();
  draco.setDecoderPath("/draco/");
  const loader = new GLTFLoader();
  loader.setDRACOLoader(draco);

  const gltf = await loader.loadAsync(MODEL_URL);
  draco.dispose();

  const model = gltf.scene;
  const scanUniform = { value: 0 };
  const toCarUniform = { value: new THREE.Matrix4() };
  const disposables: Array<{ dispose: () => void }> = [];
  const track = <T extends { dispose: () => void }>(o: T) => {
    disposables.push(o);
    return o;
  };

  /* the source model faces -z: turn it so +x is the front */
  model.rotation.y = -Math.PI / 2;

  /* normalise scale + sit on the ground, centred */
  model.updateMatrixWorld(true);
  const raw = new THREE.Box3().setFromObject(model);
  const rawSize = raw.getSize(new THREE.Vector3());
  const scale = CAR_LENGTH / Math.max(rawSize.x, 0.001);
  model.scale.setScalar(scale);
  model.updateMatrixWorld(true);
  const scaled = new THREE.Box3().setFromObject(model);
  const centre = scaled.getCenter(new THREE.Vector3());
  model.position.set(-centre.x, -scaled.min.y, -centre.z);

  const group = new THREE.Group();
  group.add(model);
  group.updateMatrixWorld(true);

  const box = new THREE.Box3().setFromObject(group);
  const size = box.getSize(new THREE.Vector3());

  /* --- re-skin every real surface --------------------------------- */
  const holo = track(bodyMaterial(scanUniform, toCarUniform, 0x00D9FF));
  const holoAccent = track(bodyMaterial(scanUniform, toCarUniform, 0x7C3CFF));
  const glass = track(glassMaterial(scanUniform, toCarUniform));
  const tire = track(
    new THREE.MeshBasicMaterial({ color: 0x070c14 }),
  );
  const rim = track(bodyMaterial(scanUniform, toCarUniform, 0x67e8f9));
  const lamp = track(new THREE.MeshBasicMaterial({ color: 0xbdf0ff }));
  const contour = track(
    new THREE.LineBasicMaterial({
      color: 0x22d3ee,
      transparent: true,
      opacity: 0.16,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );

  const wheels: THREE.Object3D[] = [];
  const overlays: THREE.LineSegments[] = [];

  model.traverse((o) => {
    if (/^wheel_(fl|fr|rl|rr)$/i.test(o.name)) wheels.push(o);
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;

    const key = `${o.name} ${(mesh.material as THREE.Material | undefined)?.name ?? ""}`;

    if (INTERIOR.test(key)) {
      mesh.visible = false; // keep the twin readable from outside
      return;
    }
    if (GLASS.test(key)) {
      mesh.material = glass;
      return;
    }
    if (LAMP.test(key)) {
      mesh.material = lamp;
      return;
    }
    if (TIRE.test(key)) {
      mesh.material = tire;
      return;
    }
    if (RIM.test(key)) {
      mesh.material = rim;
      return;
    }

    mesh.material = /carbon|trim|plastic/i.test(key) ? holoAccent : holo;

    // wireframe contour over the real panels
    const count = mesh.geometry.getAttribute("position")?.count ?? 0;
    if (count > 60 && count < 40000) {
      const edges = new THREE.LineSegments(
        track(new THREE.EdgesGeometry(mesh.geometry, 24)),
        contour,
      );
      edges.position.copy(mesh.position);
      edges.quaternion.copy(mesh.quaternion);
      edges.scale.copy(mesh.scale);
      mesh.parent?.add(edges);
      overlays.push(edges);
    }
  });

  const dispose = () => {
    overlays.forEach((e) => e.removeFromParent());
    disposables.forEach((d) => d.dispose());
    model.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.isMesh) mesh.geometry.dispose();
    });
    group.clear();
  };

  return { group, scanUniform, toCarUniform, zones: computeZones(box), size, wheels, dispose };
}
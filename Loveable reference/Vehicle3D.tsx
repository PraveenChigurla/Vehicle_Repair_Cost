import { RotateCcw, Move3d, ZoomIn } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

import { DamageMarkerCard } from "./DamageMarkerCard";
import { loadHoloCar } from "./holo-car";
import { buildParticles, buildPlatform, buildScanSheet } from "./sedan-mesh";

import { SEVERITY_COLOR, resolveZone, type DamagePart } from "@/lib/vehicle-damage";

const DEFAULT_VIEW = { rotY: 0.78, rotX: -0.2, zoom: 6.1 };

export function Vehicle3D({ parts }: { parts: DamagePart[] }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const labelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const view = useRef({ ...DEFAULT_VIEW, dragging: false, lastX: 0, lastY: 0, idle: 0 });
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    let disposed = false;
    let cleanup: (() => void) | null = null;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 200);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    const start = performance.now();

    const boot = async () => {
      const car = await loadHoloCar();
      if (disposed) {
        car.dispose();
        return;
      }

    /* turntable holds car + markers so damage stays attached while rotating */
    const turntable = new THREE.Group();
    scene.add(turntable);

    turntable.add(car.group);
    const SCAN_RANGE = car.size.x / 2 + 0.4;

    const platform = buildPlatform();
    turntable.add(platform.group);

    const particles = buildParticles();
    turntable.add(particles.points);

    const scan = buildScanSheet();
    scan.mesh.scale.set(car.size.z / 2.4 + 0.35, (car.size.y + 0.6) / 1.8, 1);
    scan.mesh.position.y = car.size.y * 0.55;
    turntable.add(scan.mesh);

    /* --- damage markers: real 3D points on the vehicle surface --- */
    const markerGeo = new THREE.SphereGeometry(0.055, 14, 12);
    const haloGeo = new THREE.RingGeometry(0.09, 0.13, 32);
    const markers = parts.map((p, i) => {
      const zone = resolveZone(p);
      const anchor = car.zones[zone].clone();
      const color = SEVERITY_COLOR[p.severity].hex;

      // stagger the connector length so cards don't collide on screen
      const lift = 0.85 + (i % 3) * 0.55;
      const outward = new THREE.Vector3(anchor.x * 0.2, 0.62, anchor.z * 0.95)
        .normalize()
        .applyAxisAngle(new THREE.Vector3(0, 1, 0), (i - (parts.length - 1) / 2) * 0.75)
        .multiplyScalar(lift);
      const tip = anchor.clone().add(outward);

      const group = new THREE.Group();
      const dotMat = new THREE.MeshBasicMaterial({ color });
      const dot = new THREE.Mesh(markerGeo, dotMat);
      dot.position.copy(anchor);
      group.add(dot);

      const haloMat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const halo = new THREE.Mesh(haloGeo, haloMat);
      halo.position.copy(anchor);
      group.add(halo);

      const lineMat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.75 });
      const lineGeom = new THREE.BufferGeometry().setFromPoints([anchor, tip]);
      group.add(new THREE.Line(lineGeom, lineMat));

      turntable.add(group);
      return { anchor, tip, halo, haloMat, dotMat, lineMat, lineGeom };
    });

    camera.position.set(0, 1.55, view.current.zoom);

    /* --- interaction: drag to rotate vehicle, scroll to zoom --- */
    const v = view.current;
    const onPointerDown = (e: PointerEvent) => {
      v.dragging = true;
      v.lastX = e.clientX;
      v.lastY = e.clientY;
    };
    const onPointerUp = () => {
      v.dragging = false;
      v.idle = 0;
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!v.dragging) return;
      v.rotY += (e.clientX - v.lastX) * 0.007;
      v.rotX = clampNum(v.rotX + (e.clientY - v.lastY) * 0.005, -0.5, 0.45);
      v.lastX = e.clientX;
      v.lastY = e.clientY;
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1);
      v.zoom = clampNum(v.zoom * Math.exp(dy * 0.0015), 5, 16);
    };
    const canvas = renderer.domElement;
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    const resize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      if (!w || !h) return;
      renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    let raf = 0;
    const projected = new THREE.Vector3();
    const worldTip = new THREE.Vector3();
    const worldAnchor = new THREE.Vector3();
    const camDir = new THREE.Vector3();
    const centreY = car.size.y * 0.5;
    const placements = parts.map(() => ({ x: 0, y: 0, hidden: false, dim: false }));

    const tick = () => {
      const t = (performance.now() - start) / 1000;
      if (!v.dragging) v.rotY += 0.0022; // slow idle turntable
      turntable.rotation.set(v.rotX, v.rotY, 0);
      turntable.updateMatrixWorld(true);
      car.toCarUniform.value.copy(turntable.matrixWorld).invert();

      // gentle camera breathing
      camera.position.set(0, 1.5 + Math.sin(t * 0.35) * 0.06, v.zoom);
      camera.lookAt(0, centreY, 0);
      camera.getWorldDirection(camDir);

      // scan sweep along the car
      const sweep = ((t * 0.42) % 2) - 1; // -1..1
      const scanX = sweep * SCAN_RANGE;
      car.scanUniform.value = scanX;
      scan.mesh.position.x = scanX;
      (scan.mesh.material as THREE.ShaderMaterial).uniforms['uOpacity']!.value =
        0.11 * (1 - Math.abs(sweep) * 0.6);

      platform.ringMat.opacity = 0.24 + Math.sin(t * 1.6) * 0.07;
      platform.ring2Mat.opacity = 0.16 + Math.sin(t * 1.6 + 1.2) * 0.06;
      particles.points.rotation.y = t * 0.03;
      particles.points.position.y = Math.sin(t * 0.5) * 0.06;

      const w = mount.clientWidth;
      const h = mount.clientHeight;

      markers.forEach((m, i) => {
        const pulse = 0.85 + Math.sin(t * 2.6 + i) * 0.25;
        m.halo.scale.setScalar(pulse);
        m.haloMat.opacity = 0.55 - (pulse - 0.85) * 0.6;
        m.halo.quaternion.copy(camera.quaternion);
        m.halo.quaternion.premultiply(turntable.quaternion.clone().invert());
        m.lineMat.opacity = 0.55 + Math.sin(t * 2.6 + i) * 0.2;

        // is this damage point facing the camera?
        worldAnchor.copy(m.anchor).applyMatrix4(turntable.matrixWorld);
        const facing = worldAnchor
          .clone()
          .sub(new THREE.Vector3(0, centreY, 0))
          .normalize()
          .dot(camDir);

        worldTip.copy(m.tip).applyMatrix4(turntable.matrixWorld);
        projected.copy(worldTip).project(camera);
        placements[i] = {
          x: (projected.x * 0.5 + 0.5) * w,
          y: (-projected.y * 0.5 + 0.5) * h,
          hidden: projected.z > 1,
          dim: facing > 0.25,
        };
      });

      /* keep cards inside the viewport and de-collide them vertically */
      if (w && h) {
        const CARD_W = 132;
        const CARD_H = 70;
        placements.forEach((pl) => {
          pl.x = Math.min(Math.max(pl.x, CARD_W / 2 + 8), Math.max(CARD_W / 2 + 8, w - CARD_W / 2 - 8));
          pl.y = Math.min(Math.max(pl.y, CARD_H + 8), Math.max(CARD_H + 8, h - 8));
        });
        const order = placements.map((_, i) => i).sort((a, b) => placements[a]!.y - placements[b]!.y);
        for (let a = 1; a < order.length; a++) {
          const cur = placements[order[a]!]!;
          for (let b = 0; b < a; b++) {
            const prev = placements[order[b]!]!;
            if (Math.abs(cur.x - prev.x) < CARD_W && cur.y - prev.y < CARD_H) {
              cur.y = prev.y + CARD_H;
            }
          }
        }
        placements.forEach((pl, i) => {
          const el = labelRefs.current[i];
          if (!el) return;
          el.style.transform = `translate(${Math.round(pl.x - el.offsetWidth / 2)}px, ${Math.round(
            pl.y - el.offsetHeight,
          )}px)`;
          el.style.opacity = pl.hidden ? "0" : pl.dim ? "0.28" : "1";
        });
      }

      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };

      turntable.updateMatrixWorld(true);
      tick();
      setReady(true);

      cleanup = () => {
        cancelAnimationFrame(raf);
        markers.forEach((m) => {
          m.haloMat.dispose();
          m.dotMat.dispose();
          m.lineMat.dispose();
          m.lineGeom.dispose();
        });
        markerGeo.dispose();
        haloGeo.dispose();
        car.dispose();
        platform.dispose();
        particles.dispose();
        scan.dispose();
      };
    };

    boot().catch((err: unknown) => {
      console.error("[Vehicle3D] failed to load vehicle model", err);
      setFailed(true);
    });

    return () => {
      disposed = true;
      cleanup?.();
      scene.clear();
      renderer.dispose();
      const canvas = renderer.domElement;
      if (canvas.parentNode === mount) mount.removeChild(canvas);
    };
  }, [parts]);

  const resetView = () => {
    Object.assign(view.current, DEFAULT_VIEW);
  };

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* chamber ambience behind the transparent canvas */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_35%,rgba(34,211,238,0.10),transparent_65%)]" />
      <div className="pointer-events-none absolute inset-x-[8%] bottom-[4%] h-[26%] rounded-[50%] bg-cyan-500/10 blur-3xl" />

      <div
        ref={mountRef}
        className="absolute inset-0 cursor-grab touch-none active:cursor-grabbing"
      />

      {!ready && (
        <div className="absolute inset-0 grid place-items-center text-[11px] uppercase tracking-widest text-cyan-400/60">
          Initializing 3D scan…
        </div>
      )}

      {parts.map((p, i) => (
        <DamageMarkerCard
          key={`${p.part}-${i}`}
          part={p}
          cardRef={(el) => {
            labelRefs.current[i] = el;
          }}
        />
      ))}

      <button
        onClick={resetView}
        className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full border border-cyan-400/30 bg-[#050a13]/80 px-3 py-1.5 text-[10px] uppercase tracking-wide text-cyan-300 transition hover:bg-cyan-400/10"
      >
        <RotateCcw size={11} /> Reset view
      </button>

      <div className="pointer-events-none absolute bottom-3 left-3 flex flex-wrap items-center gap-3 text-[10px] uppercase tracking-wide text-slate-500">
        <span className="flex items-center gap-1.5">
          <Move3d size={12} /> Drag to rotate vehicle
        </span>
        <span className="flex items-center gap-1.5">
          <ZoomIn size={12} /> Scroll to zoom
        </span>
      </div>
    </div>
  );
}

function clampNum(v: number, a: number, b: number) {
  return Math.min(b, Math.max(a, v));
}
import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Html, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { AnalysisResponse } from "@/types/analysis";

interface VehicleModelProps {
  data: AnalysisResponse | null;
  isScanning: boolean;
}

export default function VehicleModel({ data, isScanning }: VehicleModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  
  // Load the downloaded GLB car model
  const { scene } = useGLTF("/models/car.glb");

  // Clone the scene and override materials to look premium & cinematic
  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);
    
    // Create premium automotive paint material
    const carPaint = new THREE.MeshPhysicalMaterial({
      color: 0x050a15, // deep dark blue/black
      metalness: 0.9,
      roughness: 0.1,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      envMapIntensity: 1.5,
    });
    
    // Create glass material
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x000000,
      metalness: 0.9,
      roughness: 0.0,
      transmission: 0.9,
      transparent: true,
      envMapIntensity: 2.0,
    });

    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        // Very basic material heuristics (this works well for standard models)
        const matName = (mesh.material as THREE.Material).name?.toLowerCase() || '';
        if (matName.includes('glass') || matName.includes('window')) {
          mesh.material = glassMat;
        } else if (matName.includes('tire') || matName.includes('rubber')) {
          mesh.material = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
        } else if (matName.includes('chrome') || matName.includes('metal')) {
          mesh.material = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 1.0, roughness: 0.2 });
        } else {
          // Default to car paint for the body
          mesh.material = carPaint;
        }
      }
    });
    return clone;
  }, [scene]);

  // Gentle hovering animation for the car
  useFrame((state) => {
    if (groupRef.current && !isScanning) {
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime) * 0.02;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0.4, 0]}>
      {/* The Actual GLTF Vehicle */}
      <primitive object={clonedScene} scale={0.8} />

      {/* Holographic Damage Markers (Phase C) */}
      {data?.predictions?.map((pred, idx) => {
        // Approximate anchor points (X, Y, Z) since we don't know the exact vertex of the GLTF
        // In a real app, this would be mapped to specific sub-meshes
        let pos: [number, number, number] = [0, 0, 0];
        const part = pred.part.toLowerCase();
        
        if (part.includes("windshield")) {
          pos = [0, 1.2, 0.5];
        } else if (part.includes("fender")) {
          pos = [idx % 2 === 0 ? 0.9 : -0.9, 0.6, 1.5];
        } else if (part.includes("light")) {
          pos = [idx % 2 === 0 ? 0.8 : -0.8, 0.7, 2.0];
        } else if (part.includes("door")) {
          pos = [idx % 2 === 0 ? 1.0 : -1.0, 0.7, 0];
        } else {
          pos = [Math.sin(idx) * 0.8, 0.8, Math.cos(idx) * 1.5]; // Fallback
        }

        const isSevere = pred.severity === "severe";
        const isModerate = pred.severity === "moderate";
        const colorClass = isSevere ? "border-rose-500 text-rose-500 shadow-rose-500/50" 
                         : isModerate ? "border-amber-500 text-amber-500 shadow-amber-500/50" 
                         : "border-cyan-400 text-cyan-400 shadow-cyan-400/50";
        const bgClass = isSevere ? "bg-rose-950/80" : isModerate ? "bg-amber-950/80" : "bg-cyan-950/80";

        return (
          <Html key={idx} position={pos} center zIndexRange={[100, 0]} style={{ transition: 'all 0.5s' }}>
            <div className={`relative flex flex-col items-center pointer-events-none ${isScanning ? 'opacity-0 scale-50' : 'opacity-100 scale-100'}`}>
              
              {/* Callout Box */}
              <div className={`backdrop-blur-md border ${colorClass} ${bgClass} px-3 py-1.5 rounded flex flex-col items-center shadow-[0_0_15px_currentColor] mb-8 w-32`}>
                <span className="text-[10px] font-black uppercase tracking-widest text-white drop-shadow-md">{pred.part}</span>
                <span className="text-[8px] font-bold uppercase tracking-widest mb-1">{pred.severity}</span>
                <div className="w-full h-px bg-current/30 my-0.5"></div>
                <div className="flex justify-between w-full text-[7px] text-white/70 mt-1">
                  <span>CONF</span>
                  <span>{(pred.severity_confidence * 100).toFixed(1)}%</span>
                </div>
                <div className="text-[11px] font-bold text-white mt-0.5">
                  ₹{pred.repair_cost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </div>
              </div>

              {/* Connecting Line & Anchor Dot */}
              <div className={`absolute top-full left-1/2 w-px h-8 bg-current -translate-x-1/2 -mt-8 ${colorClass}`}></div>
              <div className={`absolute top-full left-1/2 w-2 h-2 rounded-full bg-current -translate-x-1/2 shadow-[0_0_8px_currentColor] ${colorClass}`}></div>
              
            </div>
          </Html>
        );
      })}
    </group>
  );
}

// Preload the model for performance
useGLTF.preload("/models/car.glb");

import React, { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows, Sparkles, Grid } from "@react-three/drei";
import * as THREE from "three";
import { AnalysisResponse } from "@/types/analysis";
import { PipelineStage } from "@/app/page";
import VehicleModel from "./VehicleModel";

interface ThreeSceneProps {
  stage: PipelineStage;
  data: AnalysisResponse | null;
  onUpload: (file: File) => void;
}

// Phase B: Holographic Scanning Effects
function ScanningEffects({ active }: { active: boolean }) {
  const scanGroupRef = useRef<THREE.Group>(null);
  const planeRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (scanGroupRef.current && active) {
      scanGroupRef.current.rotation.y = state.clock.elapsedTime * 0.8;
    }
    if (planeRef.current && active) {
      // Sweep the scan plane top to bottom over the vehicle
      planeRef.current.position.y = (Math.sin(state.clock.elapsedTime * 2) * 1.5) + 0.5;
    }
  });

  if (!active) return null;

  return (
    <group>
      {/* Revolving HUD rings */}
      <group ref={scanGroupRef} position={[0, -0.9, 0]}>
        {/* Cyan outer ring */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[4.5, 4.6, 64]} />
          <meshBasicMaterial color={0x06b6d4} transparent opacity={0.6} side={THREE.DoubleSide} />
        </mesh>
        {/* Purple dashed inner ring */}
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
          <ringGeometry args={[3, 3.2, 32]} />
          <meshBasicMaterial color={0x8b5cf6} transparent opacity={0.9} wireframe side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* Vertical Scan Sweep Plane */}
      <mesh ref={planeRef} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[12, 12]} />
        <meshBasicMaterial color={0x06b6d4} transparent opacity={0.15} side={THREE.DoubleSide} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>

      {/* Holographic Dust / Point Cloud */}
      <Sparkles count={400} scale={10} size={1.5} speed={0.6} opacity={0.4} color={0x06b6d4} />
      <Sparkles count={200} scale={8} size={2} speed={0.4} opacity={0.5} color={0x8b5cf6} />
    </group>
  );
}

// Phase A: Glowing Circular Inspection Platform
function InspectionPlatform() {
  const platformRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (platformRef.current) {
      // Extremely slow, subtle platform rotation
      platformRef.current.rotation.y = state.clock.elapsedTime * 0.05;
    }
  });

  return (
    <group ref={platformRef} position={[0, -1, 0]}>
      {/* Base Solid Disc */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <cylinderGeometry args={[6, 6.5, 0.2, 64]} />
        <meshStandardMaterial color="#020617" roughness={0.3} metalness={0.9} />
      </mesh>
      
      {/* Cyan Base Glow Ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.11, 0]}>
        <ringGeometry args={[5.8, 6.0, 64]} />
        <meshBasicMaterial color={0x06b6d4} transparent opacity={0.4} />
      </mesh>

      {/* Inner Purple Floor Ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.11, 0]}>
        <ringGeometry args={[4.0, 4.05, 64]} />
        <meshBasicMaterial color={0x8b5cf6} transparent opacity={0.6} />
      </mesh>

      {/* Technical Radial Grid */}
      <Grid 
        position={[0, 0.12, 0]} 
        args={[10.5, 10.5]} 
        cellSize={0.5} 
        cellThickness={0.5} 
        cellColor="#1e3a8a" 
        sectionSize={2.5} 
        sectionThickness={1} 
        sectionColor="#3b82f6" 
        fadeDistance={6} 
        fadeStrength={1} 
      />
    </group>
  );
}

export default function ThreeScene({ stage, data, onUpload }: ThreeSceneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isScanning = stage === "scanning";

  return (
    <div className="w-full h-full relative">
      
      {/* Upload Overlay */}
      {stage === "upload" && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-auto">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border border-cyan-500/30 bg-black/40 hover:bg-cyan-900/20 hover:border-cyan-400 transition-all p-12 rounded-2xl cursor-pointer text-center group shadow-[0_0_40px_rgba(6,182,212,0.1)]"
          >
            <div className="w-16 h-16 border-2 border-cyan-400 rounded-full mx-auto mb-6 flex items-center justify-center group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(6,182,212,0.4)]">
              <span className="text-cyan-400 text-3xl font-light">+</span>
            </div>
            <h2 className="text-cyan-400 font-mono font-bold tracking-[0.3em] uppercase text-sm drop-shadow-md">Initialize AI Scan</h2>
            <p className="text-cyan-500/60 font-mono text-[9px] uppercase mt-3 tracking-[0.2em]">Select vehicle image to begin 3D analysis</p>
          </div>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) onUpload(e.target.files[0]);
          }} />
        </div>
      )}

      {/* Cinematic HUD Overlays */}
      <div className="absolute top-6 left-6 font-mono text-[9px] text-cyan-500/60 uppercase tracking-[0.2em] z-10 pointer-events-none">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></div>
          SYS.VISION.3D.ACTIVE
        </div>
        <div className="mt-1 ml-3.5">RENDER: WEBGL (THREE.JS)</div>
        <div className="mt-1 ml-3.5">MODEL: PREMIUM AUTO .GLB</div>
      </div>

      <div className="absolute bottom-6 left-6 font-mono text-[9px] text-slate-500 uppercase tracking-[0.2em] z-10 pointer-events-none">
        DRAG TO ORBIT CAMERA • SCROLL TO ZOOM
      </div>

      <Canvas 
        camera={{ position: [5, 3, 6], fov: 45 }} 
        gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2 }}
      >
        <color attach="background" args={["#010308"]} />
        <fog attach="fog" args={["#010308", 6, 18]} />

        {/* Phase A: Cinematic Lighting */}
        <ambientLight intensity={0.5} />
        {/* Main Key Light */}
        <directionalLight position={[10, 10, 5]} intensity={2.5} color="#ffffff" castShadow shadow-mapSize={[2048, 2048]} />
        {/* Cyan Rim Light */}
        <pointLight position={[-6, 2, -5]} intensity={50} color="#06b6d4" distance={20} />
        {/* Violet Fill Light */}
        <pointLight position={[6, 1, 5]} intensity={40} color="#8b5cf6" distance={20} />

        {/* Cinematic 3/4 Controls */}
        <OrbitControls 
          enablePan={false} 
          minPolarAngle={Math.PI / 6} 
          maxPolarAngle={Math.PI / 2 - 0.05} 
          minDistance={4} 
          maxDistance={10} 
          autoRotate={!isScanning && stage !== 'upload'} 
          autoRotateSpeed={0.3} 
        />

        {/* Phase A: Platform */}
        <InspectionPlatform />

        {/* Phase A: The Premium 3D Vehicle */}
        <VehicleModel data={data} isScanning={isScanning} />

        {/* Phase B: Scanning Effects */}
        <ScanningEffects active={isScanning} />

        {/* High quality contact shadows under the car */}
        <ContactShadows position={[0, -0.99, 0]} opacity={0.9} scale={15} blur={2.5} far={4} resolution={1024} color="#000000" />
        
        {/* Environment Map for Metallic Reflections */}
        <Environment preset="studio" />
      </Canvas>
      
    </div>
  );
}

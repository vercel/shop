"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useScroll, ScrollControls, Scroll } from "@react-three/drei";
import * as THREE from "three";

const LIME = "#84cc16";

function BagBody() {
  const geometry = useRef<THREE.BufferGeometry>(null);

  // Tapered box: wider at top, narrower at bottom
  const geo = new THREE.BoxGeometry(1.6, 2, 1, 1, 1, 1);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    // Taper: bottom is 80% width, top is 100%
    const scale = 0.8 + 0.2 * ((y + 1) / 2);
    pos.setX(i, pos.getX(i) * scale);
    pos.setZ(i, pos.getZ(i) * scale);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();

  return (
    <mesh geometry={geo}>
      <meshStandardMaterial color={LIME} flatShading />
    </mesh>
  );
}

function BagHandle({ side }: { side: 1 | -1 }) {
  return (
    <mesh position={[side * 0.4, 1.3, 0]} rotation={[0, 0, 0]}>
      <torusGeometry args={[0.3, 0.05, 6, 8, Math.PI]} />
      <meshStandardMaterial color={LIME} flatShading />
    </mesh>
  );
}

function BagFold() {
  return (
    <mesh position={[0, 1.01, 0]}>
      <boxGeometry args={[1.6, 0.08, 1]} />
      <meshStandardMaterial color="#65a30d" flatShading />
    </mesh>
  );
}

function Bag() {
  const groupRef = useRef<THREE.Group>(null);
  const scroll = useScroll();

  useFrame((_state, delta) => {
    if (!groupRef.current) return;
    const offset = scroll.offset;
    // Scroll-driven rotation: 2 full spins over the scroll
    groupRef.current.rotation.y = offset * Math.PI * 4;
    // Gentle idle float
    groupRef.current.position.y =
      Math.sin(Date.now() * 0.001) * 0.08;
    // Subtle tilt
    groupRef.current.rotation.x =
      Math.sin(Date.now() * 0.0007) * 0.05;
    // Damped auto-rotation when idle (barely perceptible)
    groupRef.current.rotation.y += delta * 0.1;
  });

  return (
    <group ref={groupRef}>
      <BagBody />
      <BagHandle side={1} />
      <BagHandle side={-1} />
      <BagFold />
    </group>
  );
}

export function ShoppingBagScene({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-[calc(100vh-4rem)] w-full">
      <Canvas
        camera={{ position: [0, 0.5, 5], fov: 35 }}
        style={{ position: "fixed", top: "4rem", right: 0, width: "50%", height: "calc(100vh - 4rem)", pointerEvents: "none" }}
      >
        <ScrollControls pages={5} damping={0.2}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} intensity={1} />
          <directionalLight position={[-3, 2, -2]} intensity={0.3} />
          <Bag />
          <Scroll html style={{ width: "200%" }}>
            {children}
          </Scroll>
        </ScrollControls>
      </Canvas>
    </div>
  );
}

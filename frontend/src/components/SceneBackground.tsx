import { useRef, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import * as THREE from "three";

function Particles({ count = 120 }: { count?: number }) {
  const mesh = useRef<THREE.Points>(null);
  const mouse = useRef({ x: 0, y: 0 });
  const { viewport } = useThree();

  const [positions, sizes] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const sz = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 12;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 12;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 6;
      sz[i] = Math.random() * 2 + 0.5;
    }
    return [pos, sz];
  }, [count]);

  useFrame(({ pointer, clock }) => {
    if (!mesh.current) return;
    const t = clock.getElapsedTime();

    mouse.current.x += (pointer.x * viewport.width * 0.15 - mouse.current.x) * 0.02;
    mouse.current.y += (pointer.y * viewport.height * 0.15 - mouse.current.y) * 0.02;

    mesh.current.rotation.y = t * 0.02 + mouse.current.x * 0.05;
    mesh.current.rotation.x = t * 0.01 + mouse.current.y * 0.05;
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-size"
          args={[sizes, 1]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        color="#3b82f6"
        transparent
        opacity={0.6}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

function FloatingIcosahedron() {
  const meshRef = useRef<THREE.Mesh>(null);
  const mouse = useRef({ x: 0, y: 0 });
  const { viewport } = useThree();

  useFrame(({ pointer, clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();

    mouse.current.x += (pointer.x * viewport.width * 0.08 - mouse.current.x) * 0.015;
    mouse.current.y += (pointer.y * viewport.height * 0.08 - mouse.current.y) * 0.015;

    meshRef.current.rotation.x = t * 0.08 + mouse.current.y * 0.1;
    meshRef.current.rotation.y = t * 0.12 + mouse.current.x * 0.1;
    meshRef.current.rotation.z = t * 0.05;
  });

  return (
    <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.8}>
      <mesh ref={meshRef} position={[2.5, 0.5, -2]}>
        <icosahedronGeometry args={[1.4, 1]} />
        <meshStandardMaterial
          color="#1e3a8a"
          wireframe
          transparent
          opacity={0.15}
          emissive="#3b82f6"
          emissiveIntensity={0.1}
        />
      </mesh>
    </Float>
  );
}

function FloatingTorus() {
  const meshRef = useRef<THREE.Mesh>(null);
  const mouse = useRef({ x: 0, y: 0 });
  const { viewport } = useThree();

  useFrame(({ pointer, clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();

    mouse.current.x += (pointer.x * viewport.width * 0.05 - mouse.current.x) * 0.01;
    mouse.current.y += (pointer.y * viewport.height * 0.05 - mouse.current.y) * 0.01;

    meshRef.current.rotation.x = t * 0.06 + mouse.current.y * 0.08;
    meshRef.current.rotation.y = t * 0.1 + mouse.current.x * 0.08;
  });

  return (
    <Float speed={1} rotationIntensity={0.2} floatIntensity={0.6}>
      <mesh ref={meshRef} position={[-3, -1, -3]}>
        <torusGeometry args={[1, 0.3, 16, 32]} />
        <meshStandardMaterial
          color="#0000ff"
          wireframe
          transparent
          opacity={0.1}
          emissive="#6366f1"
          emissiveIntensity={0.08}
        />
      </mesh>
    </Float>
  );
}

function FloatingOctahedron() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    meshRef.current.rotation.x = t * 0.15;
    meshRef.current.rotation.z = t * 0.1;
  });

  return (
    <Float speed={2} rotationIntensity={0.4} floatIntensity={1}>
      <mesh ref={meshRef} position={[-1.5, 2, -4]}>
        <octahedronGeometry args={[0.6]} />
        <meshStandardMaterial
          color="#1e3a8a"
          wireframe
          transparent
          opacity={0.12}
          emissive="#3b82f6"
          emissiveIntensity={0.06}
        />
      </mesh>
    </Float>
  );
}

export function SceneBackground() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden>
      <Canvas
        camera={{ position: [0, 0, 6], fov: 50 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.3} />
        <pointLight position={[5, 5, 5]} intensity={0.4} color="#3b82f6" />
        <pointLight position={[-5, -3, 3]} intensity={0.2} color="#6366f1" />

        <Particles />
        <FloatingIcosahedron />
        <FloatingTorus />
        <FloatingOctahedron />
      </Canvas>
    </div>
  );
}

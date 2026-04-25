"use client";

import { useMemo, useRef, useState, useCallback, useEffect } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { Points, PointMaterial, Sphere } from "@react-three/drei";
import * as THREE from "three";
import { continents, countries, isLand } from "./earthData";

// --- Types ---
type VisibilityLevel = 0 | 1 | 2;

// --- Helpers ---

function latLngToVec3(lat: number, lng: number, radius: number): [number, number, number] {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return [
    -(radius * Math.sin(phi) * Math.cos(theta)),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  ];
}

function generateGlobePoints(count: number, radius: number): Float32Array {
  const positions = new Float32Array(count * 3);
  const goldenRatio = (1 + Math.sqrt(5)) / 2;
  for (let i = 0; i < count; i++) {
    const theta = (2 * Math.PI * i) / goldenRatio;
    const phi = Math.acos(1 - (2 * (i + 0.5)) / count);
    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.cos(phi);
    positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
  }
  return positions;
}

// --- US Outline ---
const usOutline: [number, number][] = [
  [48.5,-124.5],[48.5,-123],[48.5,-117],[49,-104],[49,-95.5],
  [47,-91],[46.5,-84.5],[45.5,-83],[43,-82.5],[42,-83],
  [41.5,-82.5],[42,-81],[42,-79],[43,-78.5],[43.5,-76.5],
  [42,-73.5],[41,-73.5],[41,-72],[41,-71.5],[42,-70],
  [41.5,-70],[41.5,-69.5],[42.5,-70.5],[42,-71.5],[43,-70.5],
  [44,-68],[45,-67],[47,-67.5],[47.5,-69],[45,-71],
  [44,-72],[43,-73.5],[41.5,-73.5],[40.5,-74],[39.5,-74.5],
  [38.5,-75],[38,-76],[37,-76],[36,-76],[35.5,-75.5],
  [35,-76.5],[34.5,-77.5],[33.5,-78],[32.5,-79.5],[32,-81],
  [31,-81.5],[30.5,-81.5],[30,-81.5],[28.5,-80.5],[27,-80],
  [25.5,-80],[25,-81],[26,-82],[27,-82.5],[28,-83],
  [29,-83],[29.5,-84],[30,-85],[30,-87],[30.5,-88.5],
  [30,-89.5],[29,-89.5],[29,-91],[29.5,-93],[29,-95],
  [28.5,-96.5],[27,-97],[26,-97.5],[26,-99],[28,-100],
  [29.5,-101],[30,-103],[31.5,-106],[32,-107],[32,-108.5],
  [31.5,-111],[32.5,-114.5],[33,-117],[34,-118.5],[34,-120],
  [35,-121],[37,-122.5],[38,-123],[40,-124],[42,-124.5],
  [46,-124],[48.5,-124.5],
];

// Ray-casting point-in-polygon
function isInsideUS(lat: number, lng: number): boolean {
  let inside = false;
  for (let i = 0, j = usOutline.length - 1; i < usOutline.length; j = i++) {
    const [yi, xi] = usOutline[i];
    const [yj, xj] = usOutline[j];
    if ((yi > lat) !== (yj > lat) && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

// Generate dots on land masses worldwide
function generateLandDots(count: number, radius: number): Float32Array {
  const dots: [number, number, number][] = [];
  let attempts = 0;
  while (dots.length < count && attempts < count * 10) {
    const lat = -60 + Math.random() * 130; // -60 to 70
    const lng = -180 + Math.random() * 360;
    attempts++;
    if (isLand(lat, lng)) {
      dots.push(latLngToVec3(lat, lng, radius));
    }
  }
  const positions = new Float32Array(dots.length * 3);
  dots.forEach((pos, i) => {
    positions[i * 3] = pos[0];
    positions[i * 3 + 1] = pos[1];
    positions[i * 3 + 2] = pos[2];
  });
  return positions;
}

// Generate dots that fill the US outline
function generateUSFillDots(count: number, radius: number): Float32Array {
  const dots: [number, number, number][] = [];
  // Bounding box of US: lat 25-49, lng -125 to -67
  let attempts = 0;
  while (dots.length < count && attempts < count * 8) {
    const lat = 25 + Math.random() * 24; // 25 to 49
    const lng = -125 + Math.random() * 58; // -125 to -67
    attempts++;
    if (isInsideUS(lat, lng)) {
      dots.push(latLngToVec3(lat, lng, radius));
    }
  }
  const positions = new Float32Array(dots.length * 3);
  dots.forEach((pos, i) => {
    positions[i * 3] = pos[0];
    positions[i * 3 + 1] = pos[1];
    positions[i * 3 + 2] = pos[2];
  });
  return positions;
}

function USOutlineLine() {
  const geometry = useMemo(() => {
    const points = usOutline.map(([lat, lng]) => {
      const pos = latLngToVec3(lat, lng, 2.008);
      return new THREE.Vector3(pos[0], pos[1], pos[2]);
    });
    return new THREE.BufferGeometry().setFromPoints(points);
  }, []);

  return (
    <line geometry={geometry}>
      <lineBasicMaterial color="#d9c4a0" transparent opacity={0.35} />
    </line>
  );
}

function ContinentOutlines() {
  const continentGeos = useMemo(() => {
    return continents.map((outline) => {
      const points = outline.map(([lat, lng]) => {
        const pos = latLngToVec3(lat, lng, 2.005);
        return new THREE.Vector3(pos[0], pos[1], pos[2]);
      });
      return new THREE.BufferGeometry().setFromPoints(points);
    });
  }, []);

  const countryGeos = useMemo(() => {
    return countries.map((outline) => {
      const points = outline.map(([lat, lng]) => {
        const pos = latLngToVec3(lat, lng, 2.006);
        return new THREE.Vector3(pos[0], pos[1], pos[2]);
      });
      return new THREE.BufferGeometry().setFromPoints(points);
    });
  }, []);

  return (
    <group>
      {continentGeos.map((geo, i) => (
        <line key={`c-${i}`} geometry={geo}>
          <lineBasicMaterial color="#d9c4a0" transparent opacity={0.12} />
        </line>
      ))}
      {countryGeos.map((geo, i) => (
        <line key={`co-${i}`} geometry={geo}>
          <lineBasicMaterial color="#d9c4a0" transparent opacity={0.08} />
        </line>
      ))}
    </group>
  );
}

// --- 3D Globe ---
function GlobeMesh({ level }: { level: VisibilityLevel }) {
  const basePositions = useMemo(() => generateGlobePoints(1800, 2), []);
  const landPositions = useMemo(() => generateLandDots(1200, 2.004), []);

  // Dots inside US — more dots at higher levels
  const reachPositions = useMemo(() => {
    const count = level === 0 ? 8 : level === 1 ? 60 : 250;
    return generateUSFillDots(count, 2.01);
  }, [level]);

  const config = useMemo(() => {
    switch (level) {
      case 0:
        return { baseOpacity: 0.04, reachColor: "#555555", reachOpacity: 0.2, reachSize: 0.025 };
      case 1:
        return { baseOpacity: 0.1, reachColor: "#f0c838", reachOpacity: 0.9, reachSize: 0.04 };
      case 2:
        return { baseOpacity: 0.15, reachColor: "#5dd88a", reachOpacity: 1, reachSize: 0.04 };
    }
  }, [level]);

  const groupRef = useRef<THREE.Group>(null);
  const isDragging = useRef(false);
  const previousMouse = useRef({ x: 0, y: 0 });
  const velocity = useRef({ x: 0, y: 0 });

  // Attach pointer events to the canvas
  const { gl } = useThree();
  useEffect(() => {
    const canvas = gl.domElement;

    const onPointerDown = (e: PointerEvent) => {
      isDragging.current = true;
      previousMouse.current = { x: e.clientX, y: e.clientY };
      velocity.current = { x: 0, y: 0 };
      canvas.style.cursor = "grabbing";
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging.current || !groupRef.current) return;
      const dx = e.clientX - previousMouse.current.x;
      const dy = e.clientY - previousMouse.current.y;
      groupRef.current.rotation.y += dx * 0.005;
      groupRef.current.rotation.x += dy * 0.005;
      velocity.current = { x: dx * 0.005, y: dy * 0.005 };
      previousMouse.current = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = () => {
      isDragging.current = false;
      canvas.style.cursor = "grab";
    };

    canvas.style.cursor = "grab";
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointerleave", onPointerUp);

    return () => {
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointerleave", onPointerUp);
    };
  }, [gl]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    if (isDragging.current) return;

    // Decay drag velocity
    velocity.current.x *= 0.95;
    velocity.current.y *= 0.95;

    if (Math.abs(velocity.current.x) > 0.0001 || Math.abs(velocity.current.y) > 0.0001) {
      groupRef.current.rotation.y += velocity.current.x;
      groupRef.current.rotation.x += velocity.current.y;
    } else {
      // Auto-rotate when idle
      groupRef.current.rotation.y += delta * 0.08;
    }
  });

  return (
    <group ref={groupRef} rotation={[0.2, 0, 0]}>
      {/* Dark sphere core */}
      <Sphere args={[1.98, 48, 48]}>
        <meshBasicMaterial color="#0A261E" />
      </Sphere>

      {/* Wireframe globe lines */}
      <Sphere args={[2, 48, 48]}>
        <meshBasicMaterial
          color="#d9c4a0"
          wireframe
          transparent
          opacity={0.06}
        />
      </Sphere>

      {/* Continent outlines */}
      <ContinentOutlines />

      {/* US outline */}
      <USOutlineLine />

      {/* Base dot grid */}
      <Points positions={basePositions} stride={3} frustumCulled={false}>
        <PointMaterial
          transparent
          color="#d9c4a0"
          size={0.012}
          sizeAttenuation
          depthWrite={false}
          opacity={config.baseOpacity}
        />
      </Points>

      {/* Land dots — denser on continents */}
      <Points positions={landPositions} stride={3} frustumCulled={false}>
        <PointMaterial
          transparent
          color="#d9c4a0"
          size={0.015}
          sizeAttenuation
          depthWrite={false}
          opacity={config.baseOpacity * 1.5 + 0.04}
        />
      </Points>

      {/* Reach dots filling US */}
      <Points positions={reachPositions} stride={3} frustumCulled={false}>
        <PointMaterial
          transparent
          color={config.reachColor}
          size={config.reachSize}
          sizeAttenuation
          depthWrite={false}
          opacity={config.reachOpacity}
        />
      </Points>
    </group>
  );
}

// --- Auto-resize handler ---
function ResizeHandler() {
  const { gl } = useThree();
  useEffect(() => {
    const canvas = gl.domElement;
    canvas.style.width = "100%";
    canvas.style.height = "100%";
  }, [gl]);
  return null;
}

// --- Tabs ---
const levels = [
  {
    id: 0 as VisibilityLevel,
    label: "No Online Presence",
    tagline: "Your mosque is invisible.",
    description: "Without any digital presence, families in your own neighborhood can't find you. You don't exist online.",
  },
  {
    id: 1 as VisibilityLevel,
    label: "Social Media Only",
    tagline: "Scattered and buried.",
    description: "Posts reach 5-10% of followers. Announcements get buried in feeds. No push notifications, no direct line to your community.",
  },
  {
    id: 2 as VisibilityLevel,
    label: "Social Media + Your App",
    tagline: "Your community, connected.",
    description: "A branded app with push notifications reaches every member directly. Prayer times, events, donations — all in one place your community checks daily.",
  },
];

// --- Main Export ---
export default function VisibilityGlobe() {
  const [activeLevel, setActiveLevel] = useState<VisibilityLevel>(0);

  const handleLevel = useCallback((level: VisibilityLevel) => {
    setActiveLevel(level);
  }, []);

  const current = levels[activeLevel];

  return (
    <div className="grid items-center gap-8 sm:gap-10 lg:grid-cols-[1fr_1.1fr]">
      {/* Left — Globe (bigger) */}
      <div className="relative mx-auto aspect-square w-full max-w-[320px] sm:max-w-[400px]">
        <div
          className="pointer-events-none absolute inset-[-10%] rounded-full transition-all duration-700"
          style={{
            opacity: activeLevel === 0 ? 0.1 : activeLevel === 1 ? 0.35 : 0.6,
            background: `radial-gradient(circle, ${
              activeLevel === 2 ? "rgba(26,107,66,0.25)" : activeLevel === 1 ? "rgba(212,175,55,0.18)" : "rgba(100,100,100,0.08)"
            }, transparent 65%)`,
          }}
        />
        <Canvas
          camera={{ position: [0, 0, 5.5], fov: 45 }}
          dpr={[1, 1.5]}
          gl={{ antialias: true, alpha: true }}
          style={{ background: "transparent" }}
        >
          <ResizeHandler />
          <GlobeMesh level={activeLevel} />
        </Canvas>
      </div>

      {/* Right — Tabs + Content */}
      <div>
        <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:gap-3">
          {levels.map((l) => (
            <button
              key={l.id}
              onClick={() => handleLevel(l.id)}
              className={`cursor-pointer rounded-full px-5 py-2.5 text-[13px] font-semibold transition-all duration-300 ${
                activeLevel === l.id
                  ? l.id === 0
                    ? "bg-dark-green/10 text-dark-green"
                    : l.id === 1
                      ? "bg-[#d4af37]/15 text-[#9a7b2e]"
                      : "bg-[#1a6b42]/15 text-[#1a6b42]"
                  : "bg-dark-green/[0.03] text-dark-green/40 hover:bg-dark-green/[0.06] hover:text-dark-green/60"
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>

        <div className="min-h-[120px]">
          <h3
            className="mb-3 font-[family-name:var(--font-display)] text-[28px] leading-[1.15] transition-colors duration-500"
            style={{
              color: activeLevel === 0 ? "#0A261E" : activeLevel === 1 ? "#9a7b2e" : "#1a6b42",
            }}
          >
            {current.tagline}
          </h3>
          <p className="max-w-[440px] text-[15px] leading-[1.7] text-dark-green/50">
            {current.description}
          </p>

          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[12px] font-semibold tracking-[0.15em] uppercase text-dark-green/30">Community reach</span>
              <span
                className="text-[14px] font-bold transition-colors duration-500"
                style={{ color: activeLevel === 0 ? "#999" : activeLevel === 1 ? "#d4af37" : "#1a6b42" }}
              >
                {activeLevel === 0 ? "~0%" : activeLevel === 1 ? "~8%" : "~95%"}
              </span>
            </div>
            <div className="h-[6px] w-full overflow-hidden rounded-full bg-dark-green/[0.06]">
              <div
                className="h-full rounded-full transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
                style={{
                  width: activeLevel === 0 ? "2%" : activeLevel === 1 ? "8%" : "95%",
                  background: activeLevel === 0
                    ? "#aaa"
                    : activeLevel === 1
                      ? "linear-gradient(90deg, #d4af37, #b8922a)"
                      : "linear-gradient(90deg, #1a6b42, #4a8c65)",
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

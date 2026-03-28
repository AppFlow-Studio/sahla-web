"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";

interface Star {
  x: number;
  y: number;
  size: number;
  opacity: number;
  twinkleDuration: number;
  twinkleDelay: number;
  color: string;
  flare: boolean;
}

function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function generateStars(): Star[] {
  const result: Star[] = [];
  const colors = [
    "rgba(240,235,227,",
    "rgba(196,168,122,",
    "rgba(217,196,160,",
    "rgba(74,140,101,",
  ];

  for (let i = 0; i < 200; i++) {
    const r1 = seededRandom(i * 7 + 1);
    const r2 = seededRandom(i * 13 + 2);
    const r3 = seededRandom(i * 19 + 3);
    const r4 = seededRandom(i * 23 + 4);
    const r5 = seededRandom(i * 31 + 5);
    const r6 = seededRandom(i * 37 + 6);

    const colorIndex = r6 < 0.7 ? 0 : r6 < 0.85 ? 1 : r6 < 0.95 ? 2 : 3;
    const isFlare = i < 20;

    result.push({
      x: Math.round(r1 * 10000) / 100,
      y: Math.round(r2 * 10000) / 100,
      size: isFlare
        ? Math.round((4 + r3 * 4) * 100) / 100
        : Math.round((1.5 + r3 * 2.5) * 100) / 100,
      opacity: isFlare
        ? Math.round((0.7 + r4 * 0.3) * 100) / 100
        : Math.round((0.5 + r4 * 0.5) * 100) / 100,
      twinkleDuration: isFlare
        ? Math.round((2 + r5 * 3) * 100) / 100
        : Math.round((3 + r5 * 6) * 100) / 100,
      twinkleDelay: Math.round(r6 * 500) / 100,
      color: colors[colorIndex],
      flare: isFlare,
    });
  }
  return result;
}

export default function Starfield() {
  const [stars, setStars] = useState<Star[]>([]);

  useEffect(() => {
    setStars(generateStars());
  }, []);

  const { regularStars, flareStars } = useMemo(() => {
    return {
      regularStars: stars.filter((s) => !s.flare),
      flareStars: stars.filter((s) => s.flare),
    };
  }, [stars]);

  if (stars.length === 0) {
    return <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" />;
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {/* Regular stars use pure CSS animation for performance */}
      {regularStars.map((star, i) => (
        <div
          key={`s${i}`}
          className="absolute rounded-full"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: star.size,
            height: star.size,
            backgroundColor: `${star.color}${star.opacity})`,
            boxShadow: `0 0 ${star.size * 3}px ${star.color}0.5)`,
            animation: `twinkle ${star.twinkleDuration}s ease-in-out ${star.twinkleDelay}s infinite`,
            willChange: "opacity",
          }}
        />
      ))}

      {/* Flare stars use Framer Motion for richer animation */}
      {flareStars.map((star, i) => (
        <motion.div
          key={`f${i}`}
          className="absolute rounded-full"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: star.size,
            height: star.size,
            backgroundColor: `${star.color}${star.opacity})`,
            boxShadow: `0 0 ${star.size * 4}px ${star.color}0.6)`,
          }}
          animate={{
            opacity: [star.opacity * 0.3, 1, star.opacity * 0.3],
            scale: [1, 1.6, 1],
          }}
          transition={{
            duration: star.twinkleDuration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: star.twinkleDelay,
          }}
        />
      ))}
    </div>
  );
}

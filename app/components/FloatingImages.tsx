"use client";

import { motion } from "framer-motion";

interface CardConfig {
  x: string;
  y: string;
  width: number;
  height: number;
  rotate: number;
  gradient: string;
  delay: number;
  duration: number;
  floatRange: number;
}

const cards: CardConfig[] = [
  {
    x: "8%",
    y: "15%",
    width: 120,
    height: 90,
    rotate: -15,
    gradient: "from-[#1a3a2a]/70 to-[#2d5a3d]/40",
    delay: 0,
    duration: 7,
    floatRange: 18,
  },
  {
    x: "75%",
    y: "10%",
    width: 100,
    height: 75,
    rotate: 12,
    gradient: "from-[#c4a87a]/30 to-[#a08960]/15",
    delay: 1.2,
    duration: 8,
    floatRange: 22,
  },
  {
    x: "85%",
    y: "35%",
    width: 130,
    height: 95,
    rotate: 8,
    gradient: "from-[#2d5a3d]/50 to-[#4a8c65]/25",
    delay: 0.5,
    duration: 9,
    floatRange: 15,
  },
  {
    x: "3%",
    y: "55%",
    width: 110,
    height: 80,
    rotate: -20,
    gradient: "from-[#1a3a2a]/60 to-[#c4a87a]/20",
    delay: 2,
    duration: 7.5,
    floatRange: 20,
  },
  {
    x: "20%",
    y: "75%",
    width: 90,
    height: 70,
    rotate: 5,
    gradient: "from-[#d9c4a0]/25 to-[#a08960]/10",
    delay: 0.8,
    duration: 8.5,
    floatRange: 16,
  },
  {
    x: "50%",
    y: "80%",
    width: 105,
    height: 78,
    rotate: -8,
    gradient: "from-[#2d5a3d]/45 to-[#1a3a2a]/20",
    delay: 1.5,
    duration: 7,
    floatRange: 19,
  },
  {
    x: "70%",
    y: "70%",
    width: 115,
    height: 85,
    rotate: 18,
    gradient: "from-[#c4a87a]/25 to-[#4a8c65]/15",
    delay: 0.3,
    duration: 9.5,
    floatRange: 14,
  },
  {
    x: "35%",
    y: "8%",
    width: 80,
    height: 60,
    rotate: -5,
    gradient: "from-[#4a8c65]/35 to-[#2d5a3d]/15",
    delay: 2.5,
    duration: 8,
    floatRange: 21,
  },
  {
    x: "60%",
    y: "5%",
    width: 95,
    height: 70,
    rotate: 10,
    gradient: "from-[#a08960]/30 to-[#c4a87a]/15",
    delay: 1,
    duration: 7.8,
    floatRange: 17,
  },
  {
    x: "92%",
    y: "60%",
    width: 100,
    height: 75,
    rotate: -12,
    gradient: "from-[#1a3a2a]/55 to-[#4a8c65]/25",
    delay: 1.8,
    duration: 8.2,
    floatRange: 20,
  },
  {
    x: "15%",
    y: "40%",
    width: 85,
    height: 65,
    rotate: 15,
    gradient: "from-[#d9c4a0]/20 to-[#1a3a2a]/30",
    delay: 0.6,
    duration: 9,
    floatRange: 18,
  },
  {
    x: "45%",
    y: "88%",
    width: 70,
    height: 55,
    rotate: -3,
    gradient: "from-[#2d5a3d]/35 to-[#a08960]/15",
    delay: 2.2,
    duration: 7.2,
    floatRange: 15,
  },
];

export default function FloatingImages() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {cards.map((card, i) => (
        <motion.div
          key={i}
          className={`absolute rounded-lg bg-gradient-to-br ${card.gradient} shadow-2xl shadow-black/30`}
          style={{
            left: card.x,
            top: card.y,
            width: card.width,
            height: card.height,
            rotate: card.rotate,
          }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{
            opacity: [0, 1, 1],
            scale: [0.8, 1, 1],
            y: [0, -card.floatRange, 0],
            rotateX: [0, 5, 0],
            rotateY: [0, -3, 0],
          }}
          transition={{
            opacity: { duration: 1.5, delay: card.delay },
            scale: { duration: 1.5, delay: card.delay },
            y: {
              duration: card.duration,
              repeat: Infinity,
              ease: "easeInOut",
              delay: card.delay,
            },
            rotateX: {
              duration: card.duration * 1.2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: card.delay,
            },
            rotateY: {
              duration: card.duration * 1.4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: card.delay,
            },
          }}
        />
      ))}
    </div>
  );
}

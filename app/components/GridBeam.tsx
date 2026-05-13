'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/utils/cn'

export const GridBeam: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className
}) => (
  <div className={cn('relative w-full h-full', className)}>
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <Beam id="beam1" className="top-0 left-[10%]" delay={0} />
      <Beam id="beam2" className="top-[20%] left-[45%]" delay={1.2} />
      <Beam id="beam3" className="top-[50%] right-[10%]" delay={0.6} />
      <Beam id="beam4" className="bottom-[15%] left-[25%]" delay={2.0} />
      <Beam id="beam5" className="top-[35%] left-[70%]" delay={1.6} />
    </div>
    {children}
  </div>
)

const Beam: React.FC<{ id: string; className?: string; delay?: number }> = ({
  id,
  className,
  delay = 0
}) => {
  return (
    <svg
      width="156"
      height="63"
      viewBox="0 0 156 63"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('absolute', className)}
    >
      <path
        d="M31 .5h32M0 .5h32m30 31h32m-1 0h32m-1 31h32M62.5 32V0m62 63V31"
        stroke={`url(#${id})`}
        strokeWidth={1.5}
      />
      <defs>
        <motion.linearGradient
          variants={{
            initial: {
              x1: '40%',
              x2: '50%',
              y1: '160%',
              y2: '180%'
            },
            animate: {
              x1: '0%',
              x2: '10%',
              y1: '-40%',
              y2: '-20%'
            }
          }}
          animate="animate"
          initial="initial"
          transition={{
            duration: 1.8,
            repeat: Infinity,
            repeatType: 'loop',
            ease: 'linear',
            delay,
            repeatDelay: 0.5
          }}
          id={id}
        >
          <stop stopColor="#1a6b42" stopOpacity="0" />
          <stop stopColor="#1a6b42" />
          <stop offset="0.325" stopColor="#B8922A" />
          <stop offset="1" stopColor="#d4af37" stopOpacity="0" />
        </motion.linearGradient>
      </defs>
    </svg>
  )
}

"use client"

import { type ComponentPropsWithoutRef, type ReactNode, useState } from "react"
import { ArrowRightIcon } from "@radix-ui/react-icons"

import { cn } from "@/lib/utils"

interface BentoGridProps extends ComponentPropsWithoutRef<"div"> {
  children: ReactNode
  className?: string
}

interface BentoCardProps extends ComponentPropsWithoutRef<"div"> {
  name: string
  className: string
  background: ReactNode | ((hovered: boolean) => ReactNode)
  Icon: React.ElementType
  description: string
  href: string
  cta: string
}

const BentoGrid = ({ children, className, ...props }: BentoGridProps) => {
  return (
    <div
      className={cn(
        "grid w-full auto-rows-[22rem] grid-cols-3 gap-4",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

const BentoCard = ({
  name,
  className,
  background,
  Icon,
  description,
  href,
  cta,
  ...props
}: BentoCardProps) => {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      key={name}
      className={cn(
        "group relative col-span-3 flex flex-col justify-between overflow-hidden rounded-xl",
        "transform-gpu rounded-2xl border border-dark-green/[0.06] bg-white shadow-[0_2px_20px_-4px_rgba(10,38,30,0.06)]",
        className
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      {...props}
    >
      <div>{typeof background === "function" ? background(hovered) : background}</div>
      <div className="pointer-events-none relative z-10 mt-auto p-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-lg border border-dark-green/10 bg-dark-green/[0.04]">
            <Icon size={14} weight="light" className="text-dark-green/60" />
          </div>
          <div>
            <h3 className="text-[13px] font-semibold leading-tight text-dark-green">{name}</h3>
            <p className="text-[11px] leading-snug text-dark-green/40">{description}</p>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 transform-gpu transition-all duration-300 group-hover:bg-dark-green/[0.01]" />
    </div>
  )
}

export { BentoCard, BentoGrid }

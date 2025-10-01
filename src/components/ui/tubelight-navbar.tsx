"use client"

import React, { useEffect, useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface NavItem {
  name: string
  url: string
  icon: LucideIcon
}

interface NavBarProps {
  items: NavItem[]
  authButtons?: React.ReactNode
  className?: string
}

export function NavBar({ items, authButtons, className }: NavBarProps) {
  const [activeTab, setActiveTab] = useState(items[0].name)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  return (
    <div
      className={cn(
        "fixed bottom-0 sm:top-0 left-1/2 -translate-x-1/2 z-50 w-[95vw] sm:w-auto max-w-7xl",
        "mb-4 sm:mb-0 sm:mt-6 px-2 sm:px-0",
        className,
      )}
    >
      <div className="flex items-center justify-between sm:justify-center gap-2 sm:gap-3 bg-black/20 border border-white/10 backdrop-blur-lg py-1.5 sm:py-1 px-2 sm:px-1 rounded-full shadow-lg">
        <div className="flex items-center gap-1 sm:gap-3 overflow-x-auto scrollbar-hide">
          {items.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.name

            return (
              <Link
                key={item.name}
                href={item.url}
                onClick={() => setActiveTab(item.name)}
                className={cn(
                  "relative cursor-pointer text-sm font-semibold rounded-full transition-colors",
                  "text-white/80 hover:text-white flex items-center justify-center",
                  "px-3 sm:px-6 py-2.5 sm:py-2 min-h-[44px]",
                  isActive && "bg-white/10 text-white",
                )}
              >
                <span className="hidden md:inline">{item.name}</span>
                <span className="md:hidden flex items-center justify-center">
                  <Icon size={20} strokeWidth={2.5} />
                </span>
                {isActive && (
                  <motion.div
                    layoutId="lamp"
                    className="absolute inset-0 w-full bg-white/5 rounded-full -z-10"
                    initial={false}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 30,
                    }}
                  >
                    <div className="hidden sm:block absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-white rounded-t-full">
                      <div className="absolute w-12 h-6 bg-white/20 rounded-full blur-md -top-2 -left-2" />
                      <div className="absolute w-8 h-6 bg-white/20 rounded-full blur-md -top-1" />
                      <div className="absolute w-4 h-4 bg-white/20 rounded-full blur-sm top-0 left-2" />
                    </div>
                  </motion.div>
                )}
              </Link>
            )
          })}
        </div>
        {authButtons && (
          <>
            <div className="h-6 w-px bg-white/20 hidden sm:block" />
            <div className="pr-1 sm:pr-2 flex-shrink-0">{authButtons}</div>
          </>
        )}
      </div>
    </div>
  )
}
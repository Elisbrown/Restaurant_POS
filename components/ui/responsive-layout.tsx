"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

// Breakpoint utilities
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
}

export function useBreakpoint() {
  const [breakpoint, setBreakpoint] = useState<string>("sm")

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth
      if (width >= breakpoints["2xl"]) setBreakpoint("2xl")
      else if (width >= breakpoints.xl) setBreakpoint("xl")
      else if (width >= breakpoints.lg) setBreakpoint("lg")
      else if (width >= breakpoints.md) setBreakpoint("md")
      else setBreakpoint("sm")
    }

    updateBreakpoint()
    window.addEventListener("resize", updateBreakpoint)
    return () => window.removeEventListener("resize", updateBreakpoint)
  }, [])

  return breakpoint
}

export function useIsMobile() {
  const breakpoint = useBreakpoint()
  return breakpoint === "sm"
}

export function useIsTablet() {
  const breakpoint = useBreakpoint()
  return breakpoint === "md"
}

export function useIsDesktop() {
  const breakpoint = useBreakpoint()
  return ["lg", "xl", "2xl"].includes(breakpoint)
}

// Responsive grid component
interface ResponsiveGridProps {
  children: React.ReactNode
  className?: string
  cols?: {
    sm?: number
    md?: number
    lg?: number
    xl?: number
    "2xl"?: number
  }
  gap?: number
}

export function ResponsiveGrid({
  children,
  className = "",
  cols = { sm: 1, md: 2, lg: 3, xl: 4, "2xl": 5 },
  gap = 4,
}: ResponsiveGridProps) {
  const gridClasses = [
    `grid gap-${gap}`,
    cols.sm && `grid-cols-${cols.sm}`,
    cols.md && `md:grid-cols-${cols.md}`,
    cols.lg && `lg:grid-cols-${cols.lg}`,
    cols.xl && `xl:grid-cols-${cols.xl}`,
    cols["2xl"] && `2xl:grid-cols-${cols["2xl"]}`,
  ]
    .filter(Boolean)
    .join(" ")

  return <div className={cn(gridClasses, className)}>{children}</div>
}

// Responsive container
interface ResponsiveContainerProps {
  children: React.ReactNode
  className?: string
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full"
  padding?: boolean
}

export function ResponsiveContainer({
  children,
  className = "",
  maxWidth = "xl",
  padding = true,
}: ResponsiveContainerProps) {
  const containerClasses = ["mx-auto", maxWidth !== "full" && `max-w-${maxWidth}`, padding && "px-4 sm:px-6 lg:px-8"]
    .filter(Boolean)
    .join(" ")

  return <div className={cn(containerClasses, className)}>{children}</div>
}

// Responsive text component
interface ResponsiveTextProps {
  children: React.ReactNode
  className?: string
  size?: {
    sm?: string
    md?: string
    lg?: string
    xl?: string
    "2xl"?: string
  }
}

export function ResponsiveText({
  children,
  className = "",
  size = { sm: "text-sm", md: "text-base", lg: "text-lg" },
}: ResponsiveTextProps) {
  const textClasses = [
    size.sm,
    size.md && `md:${size.md}`,
    size.lg && `lg:${size.lg}`,
    size.xl && `xl:${size.xl}`,
    size["2xl"] && `2xl:${size["2xl"]}`,
  ]
    .filter(Boolean)
    .join(" ")

  return <div className={cn(textClasses, className)}>{children}</div>
}

// Touch-optimized button for mobile
interface TouchButtonProps {
  children: React.ReactNode
  onClick?: () => void
  className?: string
  variant?: "primary" | "secondary" | "outline"
  size?: "sm" | "md" | "lg"
  disabled?: boolean
}

export function TouchButton({
  children,
  onClick,
  className = "",
  variant = "primary",
  size = "md",
  disabled = false,
}: TouchButtonProps) {
  const isMobile = useIsMobile()

  const baseClasses = "rounded-lg font-medium transition-all duration-200 active:scale-95"

  const variantClasses = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800",
    secondary: "bg-gray-600 text-white hover:bg-gray-700 active:bg-gray-800",
    outline: "border-2 border-blue-600 text-blue-600 hover:bg-blue-50 active:bg-blue-100",
  }

  const sizeClasses = {
    sm: isMobile ? "px-4 py-3 text-sm min-h-[44px]" : "px-3 py-2 text-sm",
    md: isMobile ? "px-6 py-4 text-base min-h-[48px]" : "px-4 py-2 text-base",
    lg: isMobile ? "px-8 py-5 text-lg min-h-[52px]" : "px-6 py-3 text-lg",
  }

  const disabledClasses = disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"

  return (
    <button
      onClick={disabled ? undefined : onClick}
      className={cn(baseClasses, variantClasses[variant], sizeClasses[size], disabledClasses, className)}
      disabled={disabled}
    >
      {children}
    </button>
  )
}

// Responsive modal/dialog
interface ResponsiveModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  title?: string
  className?: string
}

export function ResponsiveModal({ isOpen, onClose, children, title, className = "" }: ResponsiveModalProps) {
  const isMobile = useIsMobile()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />
        <div
          className={cn(
            "relative bg-white rounded-lg shadow-xl",
            isMobile
              ? "w-full max-w-sm mx-4 max-h-[90vh] overflow-y-auto"
              : "w-full max-w-md max-h-[80vh] overflow-y-auto",
            className,
          )}
        >
          {title && (
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">{title}</h3>
            </div>
          )}
          <div className="p-6">{children}</div>
        </div>
      </div>
    </div>
  )
}

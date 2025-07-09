"use client"

import type React from "react"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, X } from "lucide-react"
import { debounce, PerformanceManager } from "@/lib/performance"

interface OptimizedSearchProps {
  data: any[]
  searchFields: string[]
  onResults: (results: any[]) => void
  placeholder?: string
  className?: string
  minSearchLength?: number
}

export function OptimizedSearch({
  data,
  searchFields,
  onResults,
  placeholder = "Search...",
  className = "",
  minSearchLength = 1,
}: OptimizedSearchProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const pm = PerformanceManager.getInstance()

  // Memoized search function for performance
  const searchFunction = useMemo(() => {
    return (term: string) => {
      if (!term || term.length < minSearchLength) {
        return data
      }

      const start = performance.now()
      const lowerTerm = term.toLowerCase()

      const results = data.filter((item) => {
        return searchFields.some((field) => {
          const value = getNestedValue(item, field)
          return value && value.toString().toLowerCase().includes(lowerTerm)
        })
      })

      const end = performance.now()
      pm.recordMetric("search_time", end - start)

      return results
    }
  }, [data, searchFields, minSearchLength, pm])

  // Debounced search to optimize performance
  const debouncedSearch = useCallback(
    debounce((term: string) => {
      setIsSearching(true)

      // Check cache first
      const cacheKey = `search_${term}_${searchFields.join("_")}`
      let results = pm.get(cacheKey)

      if (!results) {
        results = searchFunction(term)
        pm.set(cacheKey, results, 1000 * 60) // Cache for 1 minute
      }

      onResults(results)
      setIsSearching(false)
    }, 150),
    [searchFunction, onResults, pm, searchFields],
  )

  // Effect to trigger search
  useEffect(() => {
    debouncedSearch(searchTerm)
  }, [searchTerm, debouncedSearch])

  // Clear search
  const clearSearch = () => {
    setSearchTerm("")
    onResults(data)
  }

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-10"
        />
        {searchTerm && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSearch}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {isSearching && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  )
}

// Helper function to get nested object values
function getNestedValue(obj: any, path: string): any {
  return path.split(".").reduce((current, key) => current?.[key], obj)
}

// Virtual scrolling component for large datasets
interface VirtualScrollProps {
  items: any[]
  itemHeight: number
  containerHeight: number
  renderItem: (item: any, index: number) => React.ReactNode
  className?: string
}

export function VirtualScroll({ items, itemHeight, containerHeight, renderItem, className = "" }: VirtualScrollProps) {
  const [scrollTop, setScrollTop] = useState(0)

  const visibleStart = Math.floor(scrollTop / itemHeight)
  const visibleEnd = Math.min(visibleStart + Math.ceil(containerHeight / itemHeight) + 1, items.length)

  const visibleItems = items.slice(visibleStart, visibleEnd)
  const totalHeight = items.length * itemHeight
  const offsetY = visibleStart * itemHeight

  return (
    <div
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
    >
      <div style={{ height: totalHeight, position: "relative" }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) => renderItem(item, visibleStart + index))}
        </div>
      </div>
    </div>
  )
}

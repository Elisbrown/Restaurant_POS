import { LRUCache } from "lru-cache"

// Performance monitoring and optimization utilities
export class PerformanceManager {
  private static instance: PerformanceManager
  private cache: LRUCache<string, any>
  private metrics: Map<string, number[]> = new Map()

  private constructor() {
    this.cache = new LRUCache({
      max: 1000,
      ttl: 1000 * 60 * 5, // 5 minutes
    })
  }

  static getInstance(): PerformanceManager {
    if (!PerformanceManager.instance) {
      PerformanceManager.instance = new PerformanceManager()
    }
    return PerformanceManager.instance
  }

  // Cache management
  set(key: string, value: any, ttl?: number): void {
    this.cache.set(key, value, { ttl })
  }

  get(key: string): any {
    return this.cache.get(key)
  }

  has(key: string): boolean {
    return this.cache.has(key)
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  // Performance metrics
  recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, [])
    }
    const values = this.metrics.get(name)!
    values.push(value)

    // Keep only last 100 measurements
    if (values.length > 100) {
      values.shift()
    }
  }

  getMetrics(name: string): { avg: number; min: number; max: number; count: number } {
    const values = this.metrics.get(name) || []
    if (values.length === 0) {
      return { avg: 0, min: 0, max: 0, count: 0 }
    }

    const sum = values.reduce((a, b) => a + b, 0)
    return {
      avg: sum / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      count: values.length,
    }
  }

  getAllMetrics(): Record<string, any> {
    const result: Record<string, any> = {}
    for (const [name] of this.metrics) {
      result[name] = this.getMetrics(name)
    }
    return result
  }

  // Memory usage
  getMemoryUsage(): NodeJS.MemoryUsage {
    return process.memoryUsage()
  }

  // Cache statistics
  getCacheStats(): any {
    return {
      size: this.cache.size,
      max: this.cache.max,
      calculatedSize: this.cache.calculatedSize,
      hits: this.cache.hits,
      misses: this.cache.misses,
      hitRate: this.cache.hits / (this.cache.hits + this.cache.misses) || 0,
    }
  }
}

// Performance timing decorator
export function measurePerformance(target: any, propertyName: string, descriptor: PropertyDescriptor) {
  const method = descriptor.value
  descriptor.value = async function (...args: any[]) {
    const start = performance.now()
    try {
      const result = await method.apply(this, args)
      const end = performance.now()
      PerformanceManager.getInstance().recordMetric(`${target.constructor.name}.${propertyName}`, end - start)
      return result
    } catch (error) {
      const end = performance.now()
      PerformanceManager.getInstance().recordMetric(`${target.constructor.name}.${propertyName}.error`, end - start)
      throw error
    }
  }
}

// Debounce utility for search optimization
export function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Preload critical resources
export async function preloadCriticalData() {
  const pm = PerformanceManager.getInstance()

  try {
    // Preload categories
    if (!pm.has("categories")) {
      const response = await fetch("/api/inventory/categories")
      const categories = await response.json()
      pm.set("categories", categories, 1000 * 60 * 10) // 10 minutes
    }

    // Preload active products
    if (!pm.has("active-products")) {
      const response = await fetch("/api/inventory/products?status=active")
      const products = await response.json()
      pm.set("active-products", products, 1000 * 60 * 5) // 5 minutes
    }

    // Preload tables
    if (!pm.has("tables")) {
      const response = await fetch("/api/sales/tables")
      const tables = await response.json()
      pm.set("tables", tables, 1000 * 60 * 15) // 15 minutes
    }
  } catch (error) {
    console.error("Failed to preload critical data:", error)
  }
}

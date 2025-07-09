import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { PerformanceManager } from "@/lib/performance"

export async function GET() {
  try {
    const pm = PerformanceManager.getInstance()
    const start = performance.now()

    // Check database connection
    let dbStatus = "disconnected"
    let dbStats = null

    try {
      const { db } = await connectToDatabase()
      await db.admin().ping()
      dbStatus = "connected"

      // Get database statistics
      const stats = await db.stats()
      dbStats = {
        collections: stats.collections,
        dataSize: stats.dataSize,
        indexSize: stats.indexSize,
        storageSize: stats.storageSize,
      }
    } catch (error) {
      console.error("Database health check failed:", error)
    }

    const end = performance.now()
    pm.recordMetric("health_check_time", end - start)

    // Get system metrics
    const memoryUsage = pm.getMemoryUsage()
    const cacheStats = pm.getCacheStats()
    const performanceMetrics = pm.getAllMetrics()

    // Calculate uptime
    const uptime = process.uptime()

    const healthData = {
      status: dbStatus === "connected" ? "healthy" : "unhealthy",
      timestamp: new Date().toISOString(),
      uptime: {
        seconds: uptime,
        formatted: formatUptime(uptime),
      },
      database: {
        status: dbStatus,
        stats: dbStats,
      },
      memory: {
        rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
        external: Math.round(memoryUsage.external / 1024 / 1024), // MB
      },
      cache: cacheStats,
      performance: performanceMetrics,
      responseTime: end - start,
    }

    return NextResponse.json(healthData)
  } catch (error) {
    console.error("Health check error:", error)
    return NextResponse.json(
      {
        status: "error",
        message: "Health check failed",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  return `${days}d ${hours}h ${minutes}m ${secs}s`
}

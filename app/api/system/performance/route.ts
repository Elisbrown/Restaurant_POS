import { NextResponse } from "next/server"
import { PerformanceManager } from "@/lib/performance"
import { SecurityManager } from "@/lib/security"

export async function GET() {
  try {
    const pm = PerformanceManager.getInstance()
    const sm = SecurityManager.getInstance()

    const performanceData = {
      timestamp: new Date().toISOString(),
      metrics: pm.getAllMetrics(),
      cache: pm.getCacheStats(),
      memory: pm.getMemoryUsage(),
      security: {
        recentEvents: sm.getSecurityEvents(50),
      },
    }

    return NextResponse.json(performanceData)
  } catch (error) {
    console.error("Performance data error:", error)
    return NextResponse.json({ error: "Failed to get performance data" }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const pm = PerformanceManager.getInstance()
    pm.clear()

    return NextResponse.json({
      message: "Performance cache cleared successfully",
    })
  } catch (error) {
    console.error("Cache clear error:", error)
    return NextResponse.json({ error: "Failed to clear cache" }, { status: 500 })
  }
}

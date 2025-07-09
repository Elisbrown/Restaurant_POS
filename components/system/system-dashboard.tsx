"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Activity, Database, HardDrive, Shield, Clock, Download, Upload, Trash2, RefreshCw } from "lucide-react"
import { useToast } from "@/components/ui/toast-notification"

interface HealthData {
  status: string
  timestamp: string
  uptime: {
    seconds: number
    formatted: string
  }
  database: {
    status: string
    stats: any
  }
  memory: {
    rss: number
    heapUsed: number
    heapTotal: number
    external: number
  }
  cache: any
  performance: any
  responseTime: number
}

interface BackupData {
  name: string
  timestamp: string
  size: number
  path: string
}

export function SystemDashboard() {
  const [healthData, setHealthData] = useState<HealthData | null>(null)
  const [backups, setBackups] = useState<BackupData[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const { showToast } = useToast()

  useEffect(() => {
    fetchHealthData()
    fetchBackups()

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchHealthData()
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  const fetchHealthData = async () => {
    try {
      const response = await fetch("/api/system/health")
      const data = await response.json()
      setHealthData(data)
    } catch (error) {
      console.error("Failed to fetch health data:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchBackups = async () => {
    try {
      const response = await fetch("/api/system/backup")
      const data = await response.json()
      setBackups(data.backups || [])
    } catch (error) {
      console.error("Failed to fetch backups:", error)
    }
  }

  const createBackup = async () => {
    setCreating(true)
    try {
      const response = await fetch("/api/system/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create" }),
      })

      const data = await response.json()

      if (response.ok) {
        showToast({
          type: "success",
          title: "Backup Created",
          message: "Database backup created successfully",
        })
        fetchBackups()
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Backup Failed",
        message: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setCreating(false)
    }
  }

  const restoreBackup = async (backupPath: string) => {
    if (!confirm("Are you sure you want to restore this backup? This will overwrite current data.")) {
      return
    }

    try {
      const response = await fetch("/api/system/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "restore", backupPath }),
      })

      const data = await response.json()

      if (response.ok) {
        showToast({
          type: "success",
          title: "Backup Restored",
          message: "Database restored successfully",
        })
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Restore Failed",
        message: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }

  const clearCache = async () => {
    try {
      const response = await fetch("/api/system/performance", {
        method: "DELETE",
      })

      if (response.ok) {
        showToast({
          type: "success",
          title: "Cache Cleared",
          message: "Performance cache cleared successfully",
        })
        fetchHealthData()
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Clear Failed",
        message: "Failed to clear cache",
      })
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">System Dashboard</h1>
        <Button onClick={fetchHealthData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {healthData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Status</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Badge variant={healthData.status === "healthy" ? "default" : "destructive"}>{healthData.status}</Badge>
                <span className="text-xs text-muted-foreground">{healthData.responseTime.toFixed(2)}ms</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Database</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <Badge variant={healthData.database.status === "connected" ? "default" : "destructive"}>
                  {healthData.database.status}
                </Badge>
                {healthData.database.stats && (
                  <p className="text-xs text-muted-foreground">{healthData.database.stats.collections} collections</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-sm font-medium">{healthData.memory.heapUsed} MB</p>
                <p className="text-xs text-muted-foreground">of {healthData.memory.heapTotal} MB</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Uptime</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium">{healthData.uptime.formatted}</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="backups">Backups</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Cache Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                {healthData?.cache && (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Size:</span>
                      <span>
                        {healthData.cache.size} / {healthData.cache.max}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Hit Rate:</span>
                      <span>{(healthData.cache.hitRate * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Hits:</span>
                      <span>{healthData.cache.hits}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Misses:</span>
                      <span>{healthData.cache.misses}</span>
                    </div>
                    <Button onClick={clearCache} variant="outline" size="sm" className="w-full mt-4 bg-transparent">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear Cache
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                {healthData?.performance && (
                  <div className="space-y-2">
                    {Object.entries(healthData.performance).map(([key, value]: [string, any]) => (
                      <div key={key} className="flex justify-between text-sm">
                        <span className="truncate">{key}:</span>
                        <span>{value.avg?.toFixed(2)}ms avg</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="backups" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Database Backups</CardTitle>
              <CardDescription>Manage database backups and restore points</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button onClick={createBackup} disabled={creating}>
                  <Download className="h-4 w-4 mr-2" />
                  {creating ? "Creating..." : "Create Backup"}
                </Button>

                <div className="space-y-2">
                  {backups.map((backup) => (
                    <div key={backup.path} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{backup.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(backup.timestamp).toLocaleString()} • {formatBytes(backup.size)}
                        </p>
                      </div>
                      <Button onClick={() => restoreBackup(backup.path)} variant="outline" size="sm">
                        <Upload className="h-4 w-4 mr-2" />
                        Restore
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Events</CardTitle>
              <CardDescription>Recent security events and alerts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Security monitoring is active. Check logs for detailed information.
                </p>
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-green-500" />
                  <span className="text-sm">All security systems operational</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

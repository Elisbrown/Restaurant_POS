"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useLanguage } from "@/contexts/language-context"
import { ArrowLeft, Search, Download } from "lucide-react"
import type { LoginLog, ActivityLog } from "@/lib/auth"

interface ActivityLogsProps {
  staffId?: string
  staffName?: string
}

export function ActivityLogs({ staffId, staffName }: ActivityLogsProps) {
  const [loginLogs, setLoginLogs] = useState<LoginLog[]>([])
  const [adminLogs, setAdminLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  const { t } = useLanguage()
  const router = useRouter()

  useEffect(() => {
    fetchLogs()
  }, [staffId])

  const fetchLogs = async () => {
    try {
      const loginResponse = await fetch(`/api/staff/${staffId}/login-logs`)
      const adminResponse = await fetch(`/api/staff/${staffId}/admin-logs`)

      if (loginResponse.ok) {
        const loginData = await loginResponse.json()
        setLoginLogs(loginData)
      }

      if (adminResponse.ok) {
        const adminData = await adminResponse.json()
        setAdminLogs(adminData)
      }
    } catch (error) {
      console.error("Error fetching logs:", error)
    } finally {
      setLoading(false)
    }
  }

  const exportLogs = async (type: "login" | "admin") => {
    try {
      const response = await fetch(`/api/staff/${staffId}/export-logs?type=${type}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${staffName}_${type}_logs.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error("Error exporting logs:", error)
    }
  }

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleString()
  }

  const filteredLoginLogs = loginLogs.filter(
    (log) =>
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) || log.ipAddress.includes(searchTerm.toLowerCase()),
  )

  const filteredAdminLogs = adminLogs.filter(
    (log) =>
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => router.push("/dashboard/staff")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h2 className="text-2xl font-bold">{t("activityLogs")}</h2>
            <p className="text-gray-600">{staffName}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Search className="h-4 w-4 text-gray-400" />
          <Input
            placeholder={`${t("search")} logs...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
      </div>

      <Tabs defaultValue="login" className="space-y-4">
        <TabsList>
          <TabsTrigger value="login">{t("loginActivity")}</TabsTrigger>
          <TabsTrigger value="admin">{t("adminActivity")}</TabsTrigger>
        </TabsList>

        <TabsContent value="login">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{t("loginActivity")}</CardTitle>
              <Button variant="outline" size="sm" onClick={() => exportLogs("login")}>
                <Download className="mr-2 h-4 w-4" />
                {t("export")}
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("timestamp")}</TableHead>
                    <TableHead>{t("action")}</TableHead>
                    <TableHead>{t("status")}</TableHead>
                    <TableHead>{t("ipAddress")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLoginLogs.map((log, index) => (
                    <TableRow key={index}>
                      <TableCell>{formatDate(log.timestamp)}</TableCell>
                      <TableCell className="capitalize">{log.action}</TableCell>
                      <TableCell>
                        <Badge variant={log.success ? "default" : "destructive"}>
                          {log.success ? t("success") : t("failed")}
                        </Badge>
                      </TableCell>
                      <TableCell>{log.ipAddress}</TableCell>
                    </TableRow>
                  ))}
                  {filteredLoginLogs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-gray-500">
                        No login activity found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="admin">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{t("adminActivity")}</CardTitle>
              <Button variant="outline" size="sm" onClick={() => exportLogs("admin")}>
                <Download className="mr-2 h-4 w-4" />
                {t("export")}
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("timestamp")}</TableHead>
                    <TableHead>{t("action")}</TableHead>
                    <TableHead>{t("details")}</TableHead>
                    <TableHead>Admin User</TableHead>
                    <TableHead>{t("ipAddress")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAdminLogs.map((log, index) => (
                    <TableRow key={index}>
                      <TableCell>{formatDate(log.timestamp)}</TableCell>
                      <TableCell>{log.action}</TableCell>
                      <TableCell>{log.details}</TableCell>
                      <TableCell>{log.adminUser}</TableCell>
                      <TableCell>{log.ipAddress}</TableCell>
                    </TableRow>
                  ))}
                  {filteredAdminLogs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-gray-500">
                        No admin activity found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

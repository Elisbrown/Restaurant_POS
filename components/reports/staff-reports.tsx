"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useLanguage } from "@/contexts/language-context"
import { CalendarIcon, Download, TrendingUp, Clock, Star } from "lucide-react"
import { format } from "date-fns"

interface StaffReportData {
  summary: {
    totalStaff: number
    activeStaff: number
    topPerformer: string
    avgPerformance: number
  }
  performance: {
    staffName: string
    role: string
    totalSales: number
    orderCount: number
    avgOrderValue: number
    hoursWorked: number
    rating: number
    lastActive: string
  }[]
  attendance: {
    staffName: string
    role: string
    loginTime: string
    logoutTime: string
    hoursWorked: number
    date: string
  }[]
  rankings: {
    staffName: string
    role: string
    totalSales: number
    rank: number
  }[]
}

export function StaffReports() {
  const [data, setData] = useState<StaffReportData | null>(null)
  const [loading, setLoading] = useState(false)
  const [dateFrom, setDateFrom] = useState<Date>(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
  const [dateTo, setDateTo] = useState<Date>(new Date())
  const [roleFilter, setRoleFilter] = useState("all")
  const [reportType, setReportType] = useState("performance")

  const { t } = useLanguage()

  useEffect(() => {
    generateReport()
  }, [dateFrom, dateTo, roleFilter, reportType])

  const generateReport = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        dateFrom: dateFrom.toISOString(),
        dateTo: dateTo.toISOString(),
        role: roleFilter,
        type: reportType,
      })

      const response = await fetch(`/api/reports/staff?${params}`)
      if (response.ok) {
        const reportData = await response.json()
        setData(reportData)
      }
    } catch (error) {
      console.error("Error generating staff report:", error)
    } finally {
      setLoading(false)
    }
  }

  const exportReport = async (format: "csv" | "pdf") => {
    try {
      const params = new URLSearchParams({
        dateFrom: dateFrom.toISOString(),
        dateTo: dateTo.toISOString(),
        role: roleFilter,
        type: reportType,
        format,
      })

      const response = await fetch(`/api/reports/staff/export?${params}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `staff-report-${format(dateFrom, "yyyy-MM-dd")}-to-${format(dateTo, "yyyy-MM-dd")}.${format}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error("Error exporting report:", error)
    }
  }

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString()} XAF`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString()
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "Manager":
        return "bg-purple-100 text-purple-800"
      case "Waitress":
        return "bg-blue-100 text-blue-800"
      case "Cook":
        return "bg-orange-100 text-orange-800"
      case "Cashier":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Badge className="bg-yellow-100 text-yellow-800">🥇 1st</Badge>
    if (rank === 2) return <Badge className="bg-gray-100 text-gray-800">🥈 2nd</Badge>
    if (rank === 3) return <Badge className="bg-orange-100 text-orange-800">🥉 3rd</Badge>
    return <Badge variant="outline">#{rank}</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Staff Performance Reports</h2>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => exportReport("csv")}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={() => exportReport("pdf")}>
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Report Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {/* Date From */}
            <div className="space-y-2">
              <label className="text-sm font-medium">From Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(dateFrom, "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={(date) => date && setDateFrom(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Date To */}
            <div className="space-y-2">
              <label className="text-sm font-medium">To Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(dateTo, "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={dateTo} onSelect={(date) => date && setDateTo(date)} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            {/* Role Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="Manager">Manager</SelectItem>
                  <SelectItem value="Waitress">Waitress</SelectItem>
                  <SelectItem value="Cook">Cook</SelectItem>
                  <SelectItem value="Cashier">Cashier</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Report Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Report Type</label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="performance">Performance</SelectItem>
                  <SelectItem value="attendance">Attendance</SelectItem>
                  <SelectItem value="rankings">Rankings</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button onClick={generateReport} disabled={loading} className="w-full">
                {loading ? "Generating..." : "Generate Report"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Content */}
      {data && (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.summary.totalStaff}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Active Staff</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{data.summary.activeStaff}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Top Performer</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold text-purple-600">{data.summary.topPerformer}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Avg Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{formatCurrency(data.summary.avgPerformance)}</div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Table */}
          {reportType === "performance" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="mr-2 h-5 w-5" />
                  Staff Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Staff Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Total Sales</TableHead>
                      <TableHead>Orders</TableHead>
                      <TableHead>Avg Order Value</TableHead>
                      <TableHead>Hours Worked</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Last Active</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.performance.map((staff, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{staff.staffName}</TableCell>
                        <TableCell>
                          <Badge className={getRoleColor(staff.role)}>{staff.role}</Badge>
                        </TableCell>
                        <TableCell className="font-medium text-green-600">{formatCurrency(staff.totalSales)}</TableCell>
                        <TableCell>{staff.orderCount}</TableCell>
                        <TableCell>{formatCurrency(staff.avgOrderValue)}</TableCell>
                        <TableCell>{staff.hoursWorked}h</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Star className="h-4 w-4 text-yellow-500 mr-1" />
                            {staff.rating.toFixed(1)}
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(staff.lastActive)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Attendance Table */}
          {reportType === "attendance" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="mr-2 h-5 w-5" />
                  Staff Attendance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Staff Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Login Time</TableHead>
                      <TableHead>Logout Time</TableHead>
                      <TableHead>Hours Worked</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.attendance.map((record, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{record.staffName}</TableCell>
                        <TableCell>
                          <Badge className={getRoleColor(record.role)}>{record.role}</Badge>
                        </TableCell>
                        <TableCell>{formatDate(record.date)}</TableCell>
                        <TableCell>{formatTime(record.loginTime)}</TableCell>
                        <TableCell>{record.logoutTime ? formatTime(record.logoutTime) : "Still logged in"}</TableCell>
                        <TableCell>{record.hoursWorked.toFixed(1)}h</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Rankings Table */}
          {reportType === "rankings" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Star className="mr-2 h-5 w-5" />
                  Staff Rankings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rank</TableHead>
                      <TableHead>Staff Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Total Sales</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.rankings.map((staff, index) => (
                      <TableRow key={index}>
                        <TableCell>{getRankBadge(staff.rank)}</TableCell>
                        <TableCell className="font-medium">{staff.staffName}</TableCell>
                        <TableCell>
                          <Badge className={getRoleColor(staff.role)}>{staff.role}</Badge>
                        </TableCell>
                        <TableCell className="font-medium text-green-600">{formatCurrency(staff.totalSales)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}

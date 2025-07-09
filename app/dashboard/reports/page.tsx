"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BarChart3, Users, Package, Activity, TrendingUp, FileText } from "lucide-react"

export default function ReportsPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Reports & Analytics</h2>
          <p className="text-muted-foreground">Generate comprehensive reports and analyze business performance</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Sales Reports */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="mr-2 h-5 w-5 text-green-600" />
                Sales Reports
              </CardTitle>
              <CardDescription>Detailed sales analysis, staff performance, and revenue insights</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => (window.location.href = "/dashboard/reports/sales")}>
                <BarChart3 className="mr-2 h-4 w-4" />
                Generate Sales Report
              </Button>
            </CardContent>
          </Card>

          {/* Inventory Reports */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="mr-2 h-5 w-5 text-blue-600" />
                Inventory Reports
              </CardTitle>
              <CardDescription>Stock levels, product performance, and inventory valuation</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="w-full bg-transparent"
                onClick={() => (window.location.href = "/dashboard/reports/inventory")}
              >
                <Package className="mr-2 h-4 w-4" />
                Generate Inventory Report
              </Button>
            </CardContent>
          </Card>

          {/* Staff Reports */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="mr-2 h-5 w-5 text-purple-600" />
                Staff Reports
              </CardTitle>
              <CardDescription>Individual performance, attendance, and productivity metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="w-full bg-transparent"
                onClick={() => (window.location.href = "/dashboard/reports/staff")}
              >
                <Users className="mr-2 h-4 w-4" />
                Generate Staff Report
              </Button>
            </CardContent>
          </Card>

          {/* Activity Reports */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="mr-2 h-5 w-5 text-orange-600" />
                Activity Reports
              </CardTitle>
              <CardDescription>Login/logout activities, security events, and system usage</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="w-full bg-transparent"
                onClick={() => (window.location.href = "/dashboard/reports/activity")}
              >
                <Activity className="mr-2 h-4 w-4" />
                Generate Activity Report
              </Button>
            </CardContent>
          </Card>

          {/* Analytics Dashboard */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="mr-2 h-5 w-5 text-indigo-600" />
                Analytics Dashboard
              </CardTitle>
              <CardDescription>Real-time KPIs, charts, and business intelligence</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="w-full bg-transparent"
                onClick={() => (window.location.href = "/dashboard/analytics")}
              >
                <BarChart3 className="mr-2 h-4 w-4" />
                View Dashboard
              </Button>
            </CardContent>
          </Card>

          {/* Custom Reports */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="mr-2 h-5 w-5 text-gray-600" />
                Custom Reports
              </CardTitle>
              <CardDescription>Build custom reports with advanced filtering and export options</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full bg-transparent" disabled>
                <FileText className="mr-2 h-4 w-4" />
                Coming Soon
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Statistics</CardTitle>
            <CardDescription>Overview of key metrics for today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">0 XAF</div>
                <div className="text-sm text-muted-foreground">Today's Sales</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">0</div>
                <div className="text-sm text-muted-foreground">Orders Today</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">0</div>
                <div className="text-sm text-muted-foreground">Active Staff</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">0</div>
                <div className="text-sm text-muted-foreground">Low Stock Items</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

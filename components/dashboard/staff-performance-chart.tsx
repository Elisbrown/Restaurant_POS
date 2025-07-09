"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface StaffPerformanceChartProps {
  data: {
    staffName: string
    sales: number
    orders: number
    avgOrderValue: number
  }[]
}

export function StaffPerformanceChart({ data }: StaffPerformanceChartProps) {
  const formatCurrency = (value: number) => {
    return `${value.toLocaleString()} XAF`
  }

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="staffName" fontSize={12} angle={-45} textAnchor="end" height={80} />
          <YAxis tickFormatter={formatCurrency} fontSize={12} />
          <Tooltip
            formatter={(value: number, name: string) => [
              formatCurrency(value),
              name === "sales" ? "Total Sales" : name === "avgOrderValue" ? "Avg Order Value" : "Orders",
            ]}
          />
          <Bar dataKey="sales" fill="#8884d8" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

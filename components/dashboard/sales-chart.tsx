"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface SalesChartProps {
  data: {
    date: string
    sales: number
    orders: number
  }[]
}

export function SalesChart({ data }: SalesChartProps) {
  const formatCurrency = (value: number) => {
    return `${value.toLocaleString()} XAF`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
  }

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tickFormatter={formatDate} fontSize={12} />
          <YAxis tickFormatter={formatCurrency} fontSize={12} />
          <Tooltip
            formatter={(value: number, name: string) => [
              name === "sales" ? formatCurrency(value) : value,
              name === "sales" ? "Sales" : "Orders",
            ]}
            labelFormatter={(label) => `Date: ${formatDate(label)}`}
          />
          <Line
            type="monotone"
            dataKey="sales"
            stroke="#8884d8"
            strokeWidth={2}
            dot={{ fill: "#8884d8", strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="orders"
            stroke="#82ca9d"
            strokeWidth={2}
            dot={{ fill: "#82ca9d", strokeWidth: 2, r: 4 }}
            yAxisId="right"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

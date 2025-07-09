"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface TopProductsChartProps {
  data: {
    productName: string
    quantity: number
    revenue: number
  }[]
}

export function TopProductsChart({ data }: TopProductsChartProps) {
  const formatCurrency = (value: number) => {
    return `${value.toLocaleString()} XAF`
  }

  const truncateName = (name: string, maxLength = 15) => {
    return name.length > maxLength ? `${name.substring(0, maxLength)}...` : name
  }

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data.slice(0, 8)} layout="horizontal">
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" tickFormatter={formatCurrency} fontSize={12} />
          <YAxis
            type="category"
            dataKey="productName"
            tickFormatter={(value) => truncateName(value)}
            fontSize={12}
            width={100}
          />
          <Tooltip
            formatter={(value: number, name: string) => [
              name === "revenue" ? formatCurrency(value) : value,
              name === "revenue" ? "Revenue" : "Quantity Sold",
            ]}
          />
          <Bar dataKey="revenue" fill="#8884d8" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

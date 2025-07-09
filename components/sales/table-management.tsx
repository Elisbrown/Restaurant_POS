"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useLanguage } from "@/contexts/language-context"
import { useAuth } from "@/contexts/auth-context"
import { Users, Plus, Edit, Eye, Clock, CheckCircle, AlertCircle } from "lucide-react"
import type { Table } from "@/lib/models"

export function TableManagement() {
  const [tables, setTables] = useState<Table[]>([])
  const [selectedFloor, setSelectedFloor] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingTable, setEditingTable] = useState<Table | null>(null)
  const [loading, setLoading] = useState(true)

  const { t } = useLanguage()
  const { user } = useAuth()

  const floors = ["Lounge", "Club", "Bar", "Terrace"]
  const statuses = ["AVAILABLE", "OCCUPIED", "RESERVED", "CLEANING"]

  useEffect(() => {
    fetchTables()
  }, [])

  const fetchTables = async () => {
    try {
      const response = await fetch("/api/sales/tables")
      if (response.ok) {
        const data = await response.json()
        setTables(data)
      }
    } catch (error) {
      console.error("Error fetching tables:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddTable = async (tableData: Partial<Table>) => {
    try {
      const response = await fetch("/api/sales/tables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tableData),
      })

      if (response.ok) {
        await fetchTables()
        setIsAddDialogOpen(false)
      }
    } catch (error) {
      console.error("Error adding table:", error)
    }
  }

  const handleUpdateTable = async (id: string, tableData: Partial<Table>) => {
    try {
      const response = await fetch(`/api/sales/tables/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tableData),
      })

      if (response.ok) {
        await fetchTables()
        setEditingTable(null)
      }
    } catch (error) {
      console.error("Error updating table:", error)
    }
  }

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const response = await fetch(`/api/sales/tables/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })

      if (response.ok) {
        await fetchTables()
      }
    } catch (error) {
      console.error("Error updating table status:", error)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "OCCUPIED":
        return <Users className="h-4 w-4 text-red-600" />
      case "RESERVED":
        return <Clock className="h-4 w-4 text-yellow-600" />
      case "CLEANING":
        return <AlertCircle className="h-4 w-4 text-blue-600" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return "bg-green-100 text-green-800 border-green-200"
      case "OCCUPIED":
        return "bg-red-100 text-red-800 border-red-200"
      case "RESERVED":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "CLEANING":
        return "bg-blue-100 text-blue-800 border-blue-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const filteredTables = selectedFloor === "all" ? tables : tables.filter((table) => table.floor === selectedFloor)

  const getFloorStats = (floor: string) => {
    const floorTables = tables.filter((t) => t.floor === floor)
    return {
      total: floorTables.length,
      available: floorTables.filter((t) => t.status === "AVAILABLE").length,
      occupied: floorTables.filter((t) => t.status === "OCCUPIED").length,
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Table Management</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Table
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Table</DialogTitle>
            </DialogHeader>
            <TableForm onSubmit={handleAddTable} onCancel={() => setIsAddDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Floor Filter */}
      <div className="flex items-center space-x-4">
        <Label>Filter by Floor:</Label>
        <Select value={selectedFloor} onValueChange={setSelectedFloor}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Floors</SelectItem>
            {floors.map((floor) => (
              <SelectItem key={floor} value={floor}>
                {floor}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Floor Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        {floors.map((floor) => {
          const stats = getFloorStats(floor)
          return (
            <Card key={floor}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{floor}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-xs text-muted-foreground">
                  {stats.available} available, {stats.occupied} occupied
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Tables Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredTables.map((table) => (
          <Card key={table._id} className={`border-2 ${getStatusColor(table.status)}`}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">Table {table.number}</CardTitle>
                  <p className="text-sm text-muted-foreground">{table.name}</p>
                </div>
                <div className="flex items-center space-x-1">
                  {getStatusIcon(table.status)}
                  <Badge variant="outline" className={getStatusColor(table.status)}>
                    {table.status}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Floor:</span>
                  <span className="font-medium">{table.floor}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Capacity:</span>
                  <span className="font-medium">{table.capacity} guests</span>
                </div>

                {/* Status Actions */}
                <div className="flex flex-wrap gap-1 mt-3">
                  {statuses.map((status) => (
                    <Button
                      key={status}
                      variant={table.status === status ? "default" : "outline"}
                      size="sm"
                      className="text-xs"
                      onClick={() => handleStatusChange(table._id!, status)}
                      disabled={table.status === status}
                    >
                      {status.charAt(0) + status.slice(1).toLowerCase()}
                    </Button>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between mt-3">
                  {table.status === "OCCUPIED" && table.currentOrderId && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => (window.location.href = `/dashboard/sales/orders/${table.currentOrderId}`)}
                    >
                      <Eye className="mr-1 h-3 w-3" />
                      View Order
                    </Button>
                  )}

                  {table.status === "AVAILABLE" && (
                    <Button
                      size="sm"
                      onClick={() => (window.location.href = `/dashboard/sales/orders/new?table=${table._id}`)}
                    >
                      <Plus className="mr-1 h-3 w-3" />
                      New Order
                    </Button>
                  )}

                  <Button variant="ghost" size="sm" onClick={() => setEditingTable(table)}>
                    <Edit className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Table Dialog */}
      {editingTable && (
        <Dialog open={!!editingTable} onOpenChange={() => setEditingTable(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Table {editingTable.number}</DialogTitle>
            </DialogHeader>
            <TableForm
              table={editingTable}
              onSubmit={(data) => handleUpdateTable(editingTable._id!, data)}
              onCancel={() => setEditingTable(null)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

function TableForm({
  table,
  onSubmit,
  onCancel,
}: {
  table?: Table
  onSubmit: (data: Partial<Table>) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    number: table?.number || "",
    name: table?.name || "",
    capacity: table?.capacity || 4,
    floor: table?.floor || "Lounge",
    isActive: table?.isActive ?? true,
  })

  const floors = ["Lounge", "Club", "Bar", "Terrace"]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="number">Table Number</Label>
        <Input
          id="number"
          value={formData.number}
          onChange={(e) => setFormData({ ...formData, number: e.target.value })}
          required
        />
      </div>

      <div>
        <Label htmlFor="name">Table Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., VIP Corner, Window Side"
        />
      </div>

      <div>
        <Label htmlFor="capacity">Capacity</Label>
        <Input
          id="capacity"
          type="number"
          min="1"
          max="20"
          value={formData.capacity}
          onChange={(e) => setFormData({ ...formData, capacity: Number.parseInt(e.target.value) })}
          required
        />
      </div>

      <div>
        <Label htmlFor="floor">Floor</Label>
        <Select value={formData.floor} onValueChange={(value) => setFormData({ ...formData, floor: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {floors.map((floor) => (
              <SelectItem key={floor} value={floor}>
                {floor}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{table ? "Update" : "Add"} Table</Button>
      </div>
    </form>
  )
}

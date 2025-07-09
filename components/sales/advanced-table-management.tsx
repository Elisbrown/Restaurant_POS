"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useAuth } from "@/contexts/auth-context"
import { Plus, Edit, Trash2, Users, MapPin, Merge } from "lucide-react"
import type { Table } from "@/lib/models"

export function AdvancedTableManagement() {
  const [tables, setTables] = useState<Table[]>([])
  const [selectedTables, setSelectedTables] = useState<string[]>([])
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showMergeDialog, setShowMergeDialog] = useState(false)
  const [showSplitDialog, setShowSplitDialog] = useState(false)
  const [editingTable, setEditingTable] = useState<Table | null>(null)
  const [formData, setFormData] = useState({
    number: "",
    name: "",
    floor: "",
    capacity: 2,
    x: 0,
    y: 0,
  })
  const [floors] = useState(["Ground Floor", "First Floor", "VIP Floor", "Terrace"])

  const { user } = useAuth()

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
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = editingTable ? `/api/sales/tables/${editingTable._id}` : "/api/sales/tables"
      const method = editingTable ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        fetchTables()
        resetForm()
        setShowAddDialog(false)
        setShowEditDialog(false)
      }
    } catch (error) {
      console.error("Error saving table:", error)
    }
  }

  const handleDelete = async (tableId: string) => {
    if (!confirm("Are you sure you want to delete this table?")) return

    try {
      const response = await fetch(`/api/sales/tables/${tableId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        fetchTables()
      }
    } catch (error) {
      console.error("Error deleting table:", error)
    }
  }

  const handleStatusChange = async (tableId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/sales/tables/${tableId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        fetchTables()
      }
    } catch (error) {
      console.error("Error updating table status:", error)
    }
  }

  const handleMergeTables = async () => {
    if (selectedTables.length < 2) return

    try {
      const response = await fetch("/api/sales/tables/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tableIds: selectedTables }),
      })

      if (response.ok) {
        fetchTables()
        setSelectedTables([])
        setShowMergeDialog(false)
      }
    } catch (error) {
      console.error("Error merging tables:", error)
    }
  }

  const resetForm = () => {
    setFormData({
      number: "",
      name: "",
      floor: "",
      capacity: 2,
      x: 0,
      y: 0,
    })
    setEditingTable(null)
  }

  const openEditDialog = (table: Table) => {
    setEditingTable(table)
    setFormData({
      number: table.number.toString(),
      name: table.name,
      floor: table.floor,
      capacity: table.capacity,
      x: table.x || 0,
      y: table.y || 0,
    })
    setShowEditDialog(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return "bg-green-100 border-green-300 text-green-800"
      case "OCCUPIED":
        return "bg-red-100 border-red-300 text-red-800"
      case "RESERVED":
        return "bg-yellow-100 border-yellow-300 text-yellow-800"
      case "DIRTY":
        return "bg-gray-100 border-gray-300 text-gray-800"
      case "MAINTENANCE":
        return "bg-purple-100 border-purple-300 text-purple-800"
      default:
        return "bg-gray-100 border-gray-300 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return "✅"
      case "OCCUPIED":
        return "👥"
      case "RESERVED":
        return "📅"
      case "DIRTY":
        return "🧹"
      case "MAINTENANCE":
        return "🔧"
      default:
        return "❓"
    }
  }

  const groupedTables = tables.reduce(
    (acc, table) => {
      if (!acc[table.floor]) {
        acc[table.floor] = []
      }
      acc[table.floor].push(table)
      return acc
    },
    {} as Record<string, Table[]>,
  )

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Table Management</h2>
          <p className="text-gray-600">Manage restaurant tables and their status</p>
        </div>

        <div className="flex space-x-2">
          {selectedTables.length > 1 && (
            <Button variant="outline" onClick={() => setShowMergeDialog(true)}>
              <Merge className="mr-2 h-4 w-4" />
              Merge Tables ({selectedTables.length})
            </Button>
          )}

          {user?.role === "Manager" || user?.role === "Super Admin" ? (
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Table
            </Button>
          ) : null}
        </div>
      </div>

      {/* Table Layout by Floor */}
      {Object.entries(groupedTables).map(([floor, floorTables]) => (
        <div key={floor} className="mb-8">
          <h3 className="text-xl font-semibold mb-4 flex items-center">
            <MapPin className="mr-2 h-5 w-5" />
            {floor} ({floorTables.length} tables)
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
            {floorTables.map((table) => (
              <Card
                key={table._id}
                className={`cursor-pointer hover:shadow-lg transition-all ${getStatusColor(table.status)} ${
                  selectedTables.includes(table._id!) ? "ring-2 ring-blue-500" : ""
                }`}
                onClick={() => {
                  if (selectedTables.includes(table._id!)) {
                    setSelectedTables(selectedTables.filter((id) => id !== table._id))
                  } else {
                    setSelectedTables([...selectedTables, table._id!])
                  }
                }}
              >
                <CardContent className="p-4 text-center">
                  <div className="text-2xl mb-2">{getStatusIcon(table.status)}</div>
                  <div className="font-bold text-lg mb-1">Table {table.number}</div>
                  <div className="text-sm text-gray-600 mb-2">{table.name}</div>
                  <Badge variant="outline" className="text-xs mb-2">
                    {table.status}
                  </Badge>
                  <div className="text-xs text-gray-500 mb-3">
                    <Users className="inline h-3 w-3 mr-1" />
                    {table.capacity} seats
                  </div>

                  {/* Quick Status Actions */}
                  <div className="flex flex-col space-y-1">
                    {table.status === "AVAILABLE" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleStatusChange(table._id!, "OCCUPIED")
                        }}
                        className="text-xs"
                      >
                        Mark Occupied
                      </Button>
                    )}

                    {table.status === "OCCUPIED" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleStatusChange(table._id!, "DIRTY")
                        }}
                        className="text-xs"
                      >
                        Mark Dirty
                      </Button>
                    )}

                    {table.status === "DIRTY" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleStatusChange(table._id!, "AVAILABLE")
                        }}
                        className="text-xs"
                      >
                        Mark Clean
                      </Button>
                    )}

                    {(user?.role === "Manager" || user?.role === "Super Admin") && (
                      <div className="flex space-x-1 mt-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation()
                            openEditDialog(table)
                          }}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(table._id!)
                          }}
                          className="text-red-600"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}

      {/* Add/Edit Table Dialog */}
      <Dialog
        open={showAddDialog || showEditDialog}
        onOpenChange={(open) => {
          if (!open) {
            setShowAddDialog(false)
            setShowEditDialog(false)
            resetForm()
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTable ? "Edit Table" : "Add New Table"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
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
                  placeholder="e.g., Window Table, VIP Booth"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="floor">Floor</Label>
                <Select value={formData.floor} onValueChange={(value) => setFormData({ ...formData, floor: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select floor" />
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
              <div>
                <Label htmlFor="capacity">Capacity</Label>
                <Input
                  id="capacity"
                  type="number"
                  min="1"
                  max="20"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: Number.parseInt(e.target.value) || 2 })}
                  required
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddDialog(false)
                  setShowEditDialog(false)
                  resetForm()
                }}
              >
                Cancel
              </Button>
              <Button type="submit">{editingTable ? "Update Table" : "Add Table"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Merge Tables Dialog */}
      <Dialog open={showMergeDialog} onOpenChange={setShowMergeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Merge Tables</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              You are about to merge {selectedTables.length} tables. This will combine their orders into a single bill.
            </p>

            <div className="space-y-2">
              <h4 className="font-medium">Selected Tables:</h4>
              {selectedTables.map((tableId) => {
                const table = tables.find((t) => t._id === tableId)
                return table ? (
                  <div key={tableId} className="flex items-center space-x-2">
                    <Badge variant="outline">Table {table.number}</Badge>
                    <span className="text-sm text-gray-600">
                      {table.name} - {table.floor}
                    </span>
                  </div>
                ) : null
              })}
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowMergeDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleMergeTables}>
                <Merge className="mr-2 h-4 w-4" />
                Merge Tables
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

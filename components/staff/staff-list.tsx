"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useLanguage } from "@/contexts/language-context"
import { useAuth } from "@/contexts/auth-context"
import { Search, Plus, Edit, Trash2, Power, RotateCcw, Activity } from "lucide-react"
import type { User } from "@/lib/auth"

interface StaffMember extends User {
  _id: string
}

export function StaffList() {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [filteredStaff, setFilteredStaff] = useState<StaffMember[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState<StaffMember | null>(null)
  const [showStatusDialog, setShowStatusDialog] = useState<{
    staff: StaffMember
    action: "activate" | "deactivate"
  } | null>(null)
  const [showPasswordDialog, setShowPasswordDialog] = useState<{ staff: StaffMember; password: string } | null>(null)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const { t } = useLanguage()
  const { user } = useAuth()

  useEffect(() => {
    fetchStaff()
  }, [])

  useEffect(() => {
    const filtered = staff.filter(
      (member) =>
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.role.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    setFilteredStaff(filtered)
  }, [staff, searchTerm])

  const fetchStaff = async () => {
    try {
      const response = await fetch("/api/staff")
      if (response.ok) {
        const data = await response.json()
        setStaff(data)
      }
    } catch (error) {
      console.error("Error fetching staff:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (staffMember: StaffMember, action: "activate" | "deactivate") => {
    setActionLoading(staffMember._id)
    try {
      const response = await fetch(`/api/staff/${staffMember._id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: action === "activate" }),
      })

      if (response.ok) {
        setMessage({
          type: "success",
          text: action === "activate" ? t("staffActivated") : t("staffDeactivated"),
        })
        fetchStaff()
      } else {
        throw new Error("Failed to update status")
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to update staff status" })
    } finally {
      setActionLoading(null)
      setShowStatusDialog(null)
    }
  }

  const handleDelete = async (staffMember: StaffMember) => {
    setActionLoading(staffMember._id)
    try {
      const response = await fetch(`/api/staff/${staffMember._id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setMessage({ type: "success", text: t("staffDeleted") })
        fetchStaff()
      } else {
        throw new Error("Failed to delete staff")
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to delete staff member" })
    } finally {
      setActionLoading(null)
      setShowDeleteDialog(null)
    }
  }

  const handlePasswordReset = async (staffMember: StaffMember) => {
    setActionLoading(staffMember._id)
    try {
      const response = await fetch(`/api/staff/${staffMember._id}/reset-password`, {
        method: "POST",
      })

      if (response.ok) {
        const data = await response.json()
        setShowPasswordDialog({ staff: staffMember, password: data.newPassword })
      } else {
        throw new Error("Failed to reset password")
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to reset password" })
    } finally {
      setActionLoading(null)
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "Super Admin":
        return "bg-red-100 text-red-800"
      case "Manager":
        return "bg-purple-100 text-purple-800"
      case "Waitress":
        return "bg-blue-100 text-blue-800"
      case "Stock Manager":
        return "bg-green-100 text-green-800"
      case "Cashier":
        return "bg-yellow-100 text-yellow-800"
      case "Cook":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
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
        <h2 className="text-2xl font-bold">{t("staffList")}</h2>
        <Button onClick={() => (window.location.href = "/dashboard/staff/add")}>
          <Plus className="mr-2 h-4 w-4" />
          {t("addStaff")}
        </Button>
      </div>

      {message && (
        <Alert variant={message.type === "error" ? "destructive" : "default"}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              placeholder={`${t("search")} staff...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("name")}</TableHead>
                <TableHead>{t("username")}</TableHead>
                <TableHead>{t("email")}</TableHead>
                <TableHead>{t("role")}</TableHead>
                <TableHead>{t("assignedFloor")}</TableHead>
                <TableHead>{t("status")}</TableHead>
                <TableHead>{t("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStaff.map((member) => (
                <TableRow key={member._id}>
                  <TableCell className="font-medium">{member.name}</TableCell>
                  <TableCell>{member.username}</TableCell>
                  <TableCell>{member.email}</TableCell>
                  <TableCell>
                    <Badge className={getRoleBadgeColor(member.role)}>
                      {t(member.role.toLowerCase().replace(" ", "") as any)}
                    </Badge>
                  </TableCell>
                  <TableCell>{member.assignedFloor ? t(member.assignedFloor.toLowerCase() as any) : "-"}</TableCell>
                  <TableCell>
                    <Badge variant={member.isActive ? "default" : "secondary"}>
                      {member.isActive ? t("active") : t("inactive")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => (window.location.href = `/dashboard/staff/${member._id}/edit`)}
                        disabled={actionLoading === member._id}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setShowStatusDialog({
                            staff: member,
                            action: member.isActive ? "deactivate" : "activate",
                          })
                        }
                        disabled={actionLoading === member._id || member.role === "Super Admin"}
                      >
                        <Power className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePasswordReset(member)}
                        disabled={actionLoading === member._id}
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => (window.location.href = `/dashboard/staff/${member._id}/activity`)}
                      >
                        <Activity className="h-4 w-4" />
                      </Button>

                      {member.role !== "Super Admin" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowDeleteDialog(member)}
                          disabled={actionLoading === member._id}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!showDeleteDialog} onOpenChange={() => setShowDeleteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t("delete")} {t("staffManagement")}
            </DialogTitle>
            <DialogDescription>{t("confirmDelete")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(null)}>
              {t("cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => showDeleteDialog && handleDelete(showDeleteDialog)}
              disabled={!!actionLoading}
            >
              {t("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Change Confirmation Dialog */}
      <Dialog open={!!showStatusDialog} onOpenChange={() => setShowStatusDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {showStatusDialog?.action === "activate" ? t("activate") : t("deactivate")} {t("staffManagement")}
            </DialogTitle>
            <DialogDescription>
              {showStatusDialog?.action === "activate" ? t("confirmActivate") : t("confirmDeactivate")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusDialog(null)}>
              {t("cancel")}
            </Button>
            <Button
              onClick={() => showStatusDialog && handleStatusChange(showStatusDialog.staff, showStatusDialog.action)}
              disabled={!!actionLoading}
            >
              {showStatusDialog?.action === "activate" ? t("activate") : t("deactivate")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Password Reset Dialog */}
      <Dialog open={!!showPasswordDialog} onOpenChange={() => setShowPasswordDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("passwordReset")}</DialogTitle>
            <DialogDescription>
              {t("passwordReset")} {showPasswordDialog?.password}
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <code className="text-sm font-mono">{showPasswordDialog?.password}</code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigator.clipboard.writeText(showPasswordDialog?.password || "")}
              >
                Copy
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowPasswordDialog(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

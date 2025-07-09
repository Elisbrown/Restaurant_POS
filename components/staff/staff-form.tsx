"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useLanguage } from "@/contexts/language-context"
import { useAuth } from "@/contexts/auth-context"
import { ArrowLeft, Loader2 } from "lucide-react"

interface StaffFormProps {
  staffId?: string
  isEdit?: boolean
}

export function StaffForm({ staffId, isEdit = false }: StaffFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    phone: "",
    role: "",
    assignedFloor: "",
    password: "",
  })
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(isEdit)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const { t } = useLanguage()
  const { user } = useAuth()
  const router = useRouter()

  const roles = ["Manager", "Waitress", "Stock Manager", "Cashier", "Cook"]

  const floors = ["Lounge", "Club", "Bar", "Terrace"]

  useEffect(() => {
    if (isEdit && staffId) {
      fetchStaffMember()
    }
  }, [isEdit, staffId])

  const fetchStaffMember = async () => {
    try {
      const response = await fetch(`/api/staff/${staffId}`)
      if (response.ok) {
        const staff = await response.json()
        setFormData({
          name: staff.name,
          username: staff.username,
          email: staff.email,
          phone: staff.phone,
          role: staff.role,
          assignedFloor: staff.assignedFloor || "",
          password: "",
        })
      } else {
        setError("Failed to load staff member")
      }
    } catch (error) {
      setError("Failed to load staff member")
    } finally {
      setInitialLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const url = isEdit ? `/api/staff/${staffId}` : "/api/staff"
      const method = isEdit ? "PUT" : "POST"

      const submitData = { ...formData }
      if (isEdit && !submitData.password) {
        delete submitData.password // Don't update password if not provided
      }

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(isEdit ? t("staffUpdated") : t("staffCreated"))
        if (!isEdit) {
          // Show generated password for new staff
          setSuccess(`${t("staffCreated")}. Generated password: ${data.generatedPassword}`)
        }
        setTimeout(() => {
          router.push("/dashboard/staff")
        }, 2000)
      } else {
        setError(data.error || "Failed to save staff member")
      }
    } catch (error) {
      setError("Failed to save staff member")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" onClick={() => router.push("/dashboard/staff")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h2 className="text-2xl font-bold">{isEdit ? t("editStaff") : t("addStaff")}</h2>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t("staffDetails")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t("name")} *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">{t("username")} *</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => handleInputChange("username", e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t("email")} *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">{t("phone")}</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">{t("role")} *</Label>
                <Select value={formData.role} onValueChange={(value) => handleInputChange("role", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={`Select ${t("role").toLowerCase()}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role} value={role}>
                        {t(role.toLowerCase().replace(" ", "") as any)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.role === "Waitress" && (
                <div className="space-y-2">
                  <Label htmlFor="assignedFloor">{t("assignedFloor")}</Label>
                  <Select
                    value={formData.assignedFloor}
                    onValueChange={(value) => handleInputChange("assignedFloor", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={`Select ${t("assignedFloor").toLowerCase()}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {floors.map((floor) => (
                        <SelectItem key={floor} value={floor}>
                          {t(floor.toLowerCase() as any)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {isEdit && (
                <div className="space-y-2">
                  <Label htmlFor="password">{t("newPassword")} (leave blank to keep current)</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    disabled={loading}
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/dashboard/staff")}
                disabled={loading}
              >
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("save")}...
                  </>
                ) : (
                  t("save")
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

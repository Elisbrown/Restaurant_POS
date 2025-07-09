"use client"

import type React from "react"

import { useState, useEffect, createContext, useContext, useCallback } from "react"
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react"
import { Button } from "@/components/ui/button"

type ToastType = "success" | "error" | "warning" | "info"

interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

interface ToastContextType {
  showToast: (toast: Omit<Toast, "id">) => void
  hideToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast: Toast = {
      ...toast,
      id,
      duration: toast.duration ?? 5000,
    }

    setToasts((prev) => [...prev, newToast])

    // Auto-dismiss after duration
    if (newToast.duration > 0) {
      setTimeout(() => {
        hideToast(id)
      }, newToast.duration)
    }
  }, [])

  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      <ToastContainer toasts={toasts} onHide={hideToast} />
    </ToastContext.Provider>
  )
}

function ToastContainer({ toasts, onHide }: { toasts: Toast[]; onHide: (id: string) => void }) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onHide={onHide} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onHide }: { toast: Toast; onHide: (id: string) => void }) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const handleHide = () => {
    setIsVisible(false)
    setTimeout(() => onHide(toast.id), 300)
  }

  const getIcon = () => {
    switch (toast.type) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-500" />
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case "info":
        return <Info className="h-5 w-5 text-blue-500" />
    }
  }

  const getBorderColor = () => {
    switch (toast.type) {
      case "success":
        return "border-l-green-500"
      case "error":
        return "border-l-red-500"
      case "warning":
        return "border-l-yellow-500"
      case "info":
        return "border-l-blue-500"
    }
  }

  return (
    <div
      className={`
        transform transition-all duration-300 ease-in-out
        ${isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"}
        bg-white border-l-4 ${getBorderColor()} rounded-lg shadow-lg p-4 min-w-80
      `}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">{getIcon()}</div>
        <div className="ml-3 flex-1">
          <p className="text-sm font-medium text-gray-900">{toast.title}</p>
          {toast.message && <p className="mt-1 text-sm text-gray-500">{toast.message}</p>}
          {toast.action && (
            <div className="mt-2">
              <Button variant="outline" size="sm" onClick={toast.action.onClick}>
                {toast.action.label}
              </Button>
            </div>
          )}
        </div>
        <div className="ml-4 flex-shrink-0">
          <Button variant="ghost" size="sm" onClick={handleHide} className="h-6 w-6 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

// Convenience hooks for different toast types
export function useSuccessToast() {
  const { showToast } = useToast()
  return useCallback(
    (title: string, message?: string, action?: Toast["action"]) => {
      showToast({ type: "success", title, message, action })
    },
    [showToast],
  )
}

export function useErrorToast() {
  const { showToast } = useToast()
  return useCallback(
    (title: string, message?: string, action?: Toast["action"]) => {
      showToast({ type: "error", title, message, action, duration: 0 }) // Don't auto-dismiss errors
    },
    [showToast],
  )
}

export function useWarningToast() {
  const { showToast } = useToast()
  return useCallback(
    (title: string, message?: string, action?: Toast["action"]) => {
      showToast({ type: "warning", title, message, action })
    },
    [showToast],
  )
}

export function useInfoToast() {
  const { showToast } = useToast()
  return useCallback(
    (title: string, message?: string, action?: Toast["action"]) => {
      showToast({ type: "info", title, message, action })
    },
    [showToast],
  )
}

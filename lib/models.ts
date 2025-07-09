export interface Category {
  _id?: string
  name: string
  nameEn: string
  nameFr: string
  description?: string
  descriptionEn?: string
  descriptionFr?: string
  image?: string
  parentId?: string
  isActive: boolean
  sortOrder: number
  createdAt: Date
  updatedAt?: Date
}

export interface Product {
  _id?: string
  name: string
  nameEn: string
  nameFr: string
  description?: string
  descriptionEn?: string
  descriptionFr?: string
  sku: string
  barcode?: string
  categoryId: string
  price: number
  costPrice: number
  images: string[]
  stockQuantity: number
  minStockLevel: number
  maxStockLevel: number
  unit: string // "piece", "liter", "kg", etc.
  isActive: boolean
  isAvailable: boolean
  tags: string[]
  nutritionalInfo?: {
    calories?: number
    protein?: number
    carbs?: number
    fat?: number
    allergens?: string[]
  }
  createdAt: Date
  updatedAt?: Date
  createdBy: string
  updatedBy?: string
}

export interface StockMovement {
  _id?: string
  productId: string
  type: "IN" | "OUT" | "ADJUSTMENT" | "SALE" | "WASTE" | "RETURN"
  quantity: number
  previousStock: number
  newStock: number
  reason: string
  reference?: string // PO number, sale ID, etc.
  cost?: number
  supplierId?: string
  performedBy: string
  timestamp: Date
  notes?: string
}

export interface Supplier {
  _id?: string
  name: string
  contactPerson: string
  email: string
  phone: string
  address: string
  city: string
  country: string
  paymentTerms: string
  isActive: boolean
  createdAt: Date
  updatedAt?: Date
}

export interface PurchaseOrder {
  _id?: string
  poNumber: string
  supplierId: string
  status: "DRAFT" | "SENT" | "CONFIRMED" | "RECEIVED" | "CANCELLED"
  items: {
    productId: string
    quantity: number
    unitCost: number
    totalCost: number
  }[]
  subtotal: number
  tax: number
  total: number
  orderDate: Date
  expectedDelivery?: Date
  actualDelivery?: Date
  createdBy: string
  notes?: string
}

// Sales & Order Management Models (Phase 4)
export interface Table {
  _id?: string
  number: string
  name: string
  capacity: number
  floor: string // "Lounge", "Club", "Bar", "Terrace"
  status: "AVAILABLE" | "OCCUPIED" | "RESERVED" | "CLEANING" | "DIRTY"
  currentOrderId?: string
  isActive: boolean
  position?: {
    x: number
    y: number
  }
  createdAt: Date
  updatedAt?: Date
}

export interface Order {
  _id?: string
  orderNumber: string
  tableId?: string
  tableNumber?: string
  customerName?: string
  customerPhone?: string
  type: "DINE_IN" | "TAKEAWAY" | "DELIVERY"
  status: "PENDING" | "CONFIRMED" | "PREPARING" | "READY" | "SERVED" | "COMPLETED" | "CANCELLED"
  items: OrderItem[]
  subtotal: number
  tax: number
  discount: number
  total: number
  paymentStatus: "PENDING" | "PARTIAL" | "PAID" | "REFUNDED"
  paymentMethod?: "CASH" | "CARD" | "MOBILE_MONEY" | "BANK_TRANSFER"
  notes?: string
  specialInstructions?: string
  waiterId?: string
  waiterName?: string
  createdAt: Date
  updatedAt?: Date
  completedAt?: Date
}

export interface OrderItem {
  productId: string
  productName: string
  productNameFr: string
  sku: string
  quantity: number
  unitPrice: number
  totalPrice: number
  notes?: string
  status: "PENDING" | "PREPARING" | "READY" | "SERVED"
  modifiers?: {
    name: string
    price: number
  }[]
}

export interface Payment {
  _id?: string
  orderId: string
  amount: number
  method: "CASH" | "CARD" | "MOBILE_MONEY" | "BANK_TRANSFER"
  status: "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED"
  reference?: string
  processedBy: string
  timestamp: Date
  notes?: string
}

export interface Customer {
  _id?: string
  name: string
  phone: string
  email?: string
  address?: string
  loyaltyPoints: number
  totalOrders: number
  totalSpent: number
  lastVisit?: Date
  preferences?: string[]
  isActive: boolean
  createdAt: Date
  updatedAt?: Date
}

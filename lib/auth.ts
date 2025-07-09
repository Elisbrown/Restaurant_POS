import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { getDatabase } from "./mongodb"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production"

export interface User {
  _id?: string
  name: string
  username: string
  email: string
  phone: string
  password: string
  role: "Super Admin" | "Manager" | "Waitress" | "Stock Manager" | "Cashier" | "Cook"
  assignedFloor?: string
  isActive: boolean
  forcePasswordChange: boolean
  createdAt: Date
  lastLogin?: Date
}

export interface LoginLog {
  username: string
  email: string
  timestamp: Date
  success: boolean
  ipAddress: string
  action: "login" | "logout"
}

export interface ActivityLog {
  timestamp: Date
  adminUser: string
  adminEmail: string
  action: string
  targetUser?: string
  details: string
  ipAddress: string
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12)
  return bcrypt.hash(password, salt)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export function generateToken(userId: string, role: string): string {
  return jwt.sign(
    { userId, role, exp: Math.floor(Date.now() / 1000) + 2 * 60 * 60 }, // 2 hours
    JWT_SECRET,
  )
}

export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    return null
  }
}

export async function createSuperAdmin() {
  const db = await getDatabase()
  const users = db.collection("users")

  const existingSuperAdmin = await users.findOne({ role: "Super Admin" })
  if (existingSuperAdmin) {
    return existingSuperAdmin
  }

  const hashedPassword = await hashPassword("AdminPL2025$")

  const superAdmin: User = {
    name: "Sunyin Elisbrown",
    username: "Elisbrown",
    email: "sunyinelisbrown@gmail.com",
    phone: "+237679690703",
    password: hashedPassword,
    role: "Super Admin",
    isActive: true,
    forcePasswordChange: true,
    createdAt: new Date(),
  }

  const result = await users.insertOne(superAdmin)
  return { ...superAdmin, _id: result.insertedId }
}

export async function logActivity(activity: LoginLog) {
  const db = await getDatabase()
  const logs = db.collection("login_logs")
  await logs.insertOne(activity)
}

export async function logAdminActivity(activity: ActivityLog) {
  const db = await getDatabase()
  const logs = db.collection("admin_activity_logs")
  await logs.insertOne(activity)
}

export async function generateRandomPassword(): Promise<string> {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*"
  let password = ""
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

export function validatePassword(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long")
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter")
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter")
  }
  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number")
  }
  if (!/[!@#$%^&*]/.test(password)) {
    errors.push("Password must contain at least one special character (!@#$%^&*)")
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

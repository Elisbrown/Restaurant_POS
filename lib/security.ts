import bcrypt from "bcryptjs"
import crypto from "crypto"
import jwt from "jsonwebtoken"

// Security configuration
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "default-key-change-in-production"
const JWT_SECRET = process.env.JWT_SECRET || "default-jwt-secret"
const SALT_ROUNDS = 12

export class SecurityManager {
  private static instance: SecurityManager
  private rateLimitMap: Map<string, { count: number; resetTime: number }> = new Map()
  private securityEvents: Array<{ timestamp: Date; event: string; ip?: string; userId?: string }> = []

  private constructor() {}

  static getInstance(): SecurityManager {
    if (!SecurityManager.instance) {
      SecurityManager.instance = new SecurityManager()
    }
    return SecurityManager.instance
  }

  // Password hashing
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS)
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash)
  }

  // Data encryption (AES-256)
  encrypt(text: string): string {
    const algorithm = "aes-256-cbc"
    const key = crypto.scryptSync(ENCRYPTION_KEY, "salt", 32)
    const iv = crypto.randomBytes(16)

    const cipher = crypto.createCipher(algorithm, key)
    let encrypted = cipher.update(text, "utf8", "hex")
    encrypted += cipher.final("hex")

    return iv.toString("hex") + ":" + encrypted
  }

  decrypt(encryptedText: string): string {
    const algorithm = "aes-256-cbc"
    const key = crypto.scryptSync(ENCRYPTION_KEY, "salt", 32)

    const textParts = encryptedText.split(":")
    const iv = Buffer.from(textParts.shift()!, "hex")
    const encrypted = textParts.join(":")

    const decipher = crypto.createDecipher(algorithm, key)
    let decrypted = decipher.update(encrypted, "hex", "utf8")
    decrypted += decipher.final("utf8")

    return decrypted
  }

  // JWT token management
  generateToken(payload: any, expiresIn = "24h"): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn })
  }

  verifyToken(token: string): any {
    try {
      return jwt.verify(token, JWT_SECRET)
    } catch (error) {
      throw new Error("Invalid token")
    }
  }

  // Rate limiting
  checkRateLimit(identifier: string, maxRequests = 100, windowMs = 60000): boolean {
    const now = Date.now()
    const record = this.rateLimitMap.get(identifier)

    if (!record || now > record.resetTime) {
      this.rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs })
      return true
    }

    if (record.count >= maxRequests) {
      this.logSecurityEvent("rate_limit_exceeded", identifier)
      return false
    }

    record.count++
    return true
  }

  // Security event logging
  logSecurityEvent(event: string, ip?: string, userId?: string): void {
    this.securityEvents.push({
      timestamp: new Date(),
      event,
      ip,
      userId,
    })

    // Keep only last 1000 events
    if (this.securityEvents.length > 1000) {
      this.securityEvents.shift()
    }
  }

  getSecurityEvents(limit = 100): Array<any> {
    return this.securityEvents.slice(-limit)
  }

  // Input sanitization
  sanitizeInput(input: string): string {
    return input
      .replace(/[<>]/g, "") // Remove potential HTML tags
      .replace(/['"]/g, "") // Remove quotes
      .trim()
  }

  // Generate secure random string
  generateSecureRandom(length = 32): string {
    return crypto.randomBytes(length).toString("hex")
  }

  // Validate password strength
  validatePasswordStrength(password: string): { valid: boolean; errors: string[] } {
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

    if (!/\d/.test(password)) {
      errors.push("Password must contain at least one number")
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push("Password must contain at least one special character")
    }

    return { valid: errors.length === 0, errors }
  }

  // Security headers
  getSecurityHeaders(): Record<string, string> {
    return {
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "X-XSS-Protection": "1; mode=block",
      "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
      "Content-Security-Policy":
        "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
      "Referrer-Policy": "strict-origin-when-cross-origin",
    }
  }
}

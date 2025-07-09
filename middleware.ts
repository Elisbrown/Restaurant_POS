import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { SecurityManager } from "@/lib/security"

// Rate limiting store
const rateLimitStore = new Map<string, number[]>()

// Security middleware
export function middleware(request: NextRequest) {
  const security = SecurityManager.getInstance()
  const response = NextResponse.next()

  // Add security headers
  const securityHeaders = security.getSecurityHeaders()
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  // Rate limiting
  const ip = request.ip || request.headers.get("x-forwarded-for") || "unknown"
  if (!security.checkRateLimit(ip)) {
    return new NextResponse("Too Many Requests", { status: 429 })
  }

  // Protected routes
  const protectedPaths = ["/dashboard", "/api/staff", "/api/inventory", "/api/sales", "/api/reports"]
  const isProtectedPath = protectedPaths.some((path) => request.nextUrl.pathname.startsWith(path))

  if (isProtectedPath) {
    const token = request.cookies.get("auth-token")?.value

    if (!token) {
      if (request.nextUrl.pathname.startsWith("/api/")) {
        return new NextResponse("Unauthorized", { status: 401 })
      }
      return NextResponse.redirect(new URL("/login", request.url))
    }

    try {
      const decoded = security.verifyToken(token)

      // Add user info to headers for API routes
      if (request.nextUrl.pathname.startsWith("/api/")) {
        response.headers.set("x-user-id", decoded.userId)
        response.headers.set("x-user-role", decoded.role)
      }
    } catch (error) {
      security.logSecurityEvent("invalid_token", ip)

      if (request.nextUrl.pathname.startsWith("/api/")) {
        return new NextResponse("Unauthorized", { status: 401 })
      }
      return NextResponse.redirect(new URL("/login", request.url))
    }
  }

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public/).*)"],
}

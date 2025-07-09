import { type NextRequest, NextResponse } from "next/server"
import { logActivity } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { username, email } = await request.json()

    const clientIP = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"

    await logActivity({
      username,
      email,
      timestamp: new Date(),
      success: true,
      ipAddress: clientIP,
      action: "logout",
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

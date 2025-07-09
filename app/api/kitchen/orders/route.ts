import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const token =
      request.headers.get("authorization")?.replace("Bearer ", "") ||
      request.cookies.get("platinum-lounge-token")?.value

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || !["Super Admin", "Manager", "Cook"].includes(decoded.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const db = await getDatabase()

    // Fetch orders by status for kitchen dashboard
    const [pending, processing, complete] = await Promise.all([
      db.collection("orders").find({ status: "PENDING" }).sort({ createdAt: 1 }).toArray(),
      db.collection("orders").find({ status: "PROCESSING" }).sort({ createdAt: 1 }).toArray(),
      db.collection("orders").find({ status: "READY" }).sort({ createdAt: 1 }).toArray(),
    ])

    return NextResponse.json({
      pending,
      processing,
      complete,
    })
  } catch (error) {
    console.error("Error fetching kitchen orders:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

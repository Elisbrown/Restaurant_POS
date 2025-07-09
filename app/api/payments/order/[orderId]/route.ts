import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest, { params }: { params: { orderId: string } }) {
  try {
    const { db } = await connectToDatabase()

    const payments = await db.collection("payments").find({ orderId: params.orderId }).sort({ timestamp: -1 }).toArray()

    return NextResponse.json(payments)
  } catch (error) {
    console.error("Error fetching order payments:", error)
    return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 })
  }
}

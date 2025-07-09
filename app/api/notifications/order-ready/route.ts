import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json()
    const db = await getDatabase()

    // Get order details
    const order = await db.collection("orders").findOne({ _id: new ObjectId(orderId) })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    // Create notification for waitress
    await db.collection("notifications").insertOne({
      type: "ORDER_READY",
      orderId,
      tableNumber: order.tableNumber,
      waiterName: order.waiterName,
      message: `Order for Table ${order.tableNumber} is ready`,
      createdAt: new Date(),
      read: false,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error creating notification:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

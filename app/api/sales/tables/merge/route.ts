import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest) {
  try {
    const token =
      request.headers.get("authorization")?.replace("Bearer ", "") ||
      request.cookies.get("platinum-lounge-token")?.value

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || !["Super Admin", "Manager", "Waitress"].includes(decoded.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { tableIds } = await request.json()

    if (!tableIds || tableIds.length < 2) {
      return NextResponse.json({ error: "At least 2 tables required for merge" }, { status: 400 })
    }

    const db = await getDatabase()

    // Get all tables and their orders
    const tables = await db
      .collection("tables")
      .find({ _id: { $in: tableIds.map((id: string) => new ObjectId(id)) } })
      .toArray()

    const orders = await db
      .collection("orders")
      .find({
        tableId: { $in: tableIds },
        paymentStatus: "PENDING",
      })
      .toArray()

    if (orders.length === 0) {
      return NextResponse.json({ error: "No active orders found for selected tables" }, { status: 400 })
    }

    // Create merged order
    const primaryTable = tables[0]
    const allItems = orders.flatMap((order) => order.items)
    const totalAmount = orders.reduce((sum, order) => sum + order.total, 0)

    const mergedOrder = {
      orderNumber: `MERGED-${Date.now()}`,
      tableId: primaryTable._id.toString(),
      tableNumber: primaryTable.number,
      mergedTables: tables.map((t) => ({ id: t._id, number: t.number })),
      items: allItems,
      total: totalAmount,
      subtotal: orders.reduce((sum, order) => sum + order.subtotal, 0),
      tax: orders.reduce((sum, order) => sum + order.tax, 0),
      status: "READY",
      paymentStatus: "PENDING",
      type: "DINE_IN",
      waiterName: orders[0].waiterName,
      createdAt: new Date(),
      mergedFrom: orders.map((o) => o._id),
    }

    // Insert merged order
    await db.collection("orders").insertOne(mergedOrder)

    // Mark original orders as merged
    await db
      .collection("orders")
      .updateMany(
        { _id: { $in: orders.map((o) => o._id) } },
        { $set: { status: "MERGED", mergedInto: mergedOrder._id } },
      )

    // Update table statuses
    await db
      .collection("tables")
      .updateMany(
        { _id: { $in: tableIds.map((id: string) => new ObjectId(id)) } },
        { $set: { status: "OCCUPIED", mergedOrder: mergedOrder._id } },
      )

    return NextResponse.json({ success: true, mergedOrderId: mergedOrder._id })
  } catch (error) {
    console.error("Error merging tables:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

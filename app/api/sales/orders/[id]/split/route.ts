import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token =
      request.headers.get("authorization")?.replace("Bearer ", "") ||
      request.cookies.get("platinum-lounge-token")?.value

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || !["Super Admin", "Manager", "Waitress", "Cashier"].includes(decoded.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { splitType, splits } = await request.json()
    const db = await getDatabase()

    // Get original order
    const originalOrder = await db.collection("orders").findOne({ _id: new ObjectId(params.id) })

    if (!originalOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    if (originalOrder.paymentStatus === "PAID") {
      return NextResponse.json({ error: "Cannot split paid order" }, { status: 400 })
    }

    const splitOrders = []

    if (splitType === "BY_ITEM") {
      // Split by specific items
      for (let i = 0; i < splits.length; i++) {
        const split = splits[i]
        const splitItems = split.items
        const splitSubtotal = splitItems.reduce((sum: number, item: any) => sum + item.totalPrice, 0)
        const splitTax = splitSubtotal * 0.1925
        const splitTotal = splitSubtotal + splitTax

        const splitOrder = {
          ...originalOrder,
          _id: new ObjectId(),
          orderNumber: `${originalOrder.orderNumber}-SPLIT-${i + 1}`,
          items: splitItems,
          subtotal: splitSubtotal,
          tax: splitTax,
          total: splitTotal,
          splitFrom: originalOrder._id,
          splitIndex: i + 1,
          createdAt: new Date(),
        }

        splitOrders.push(splitOrder)
      }
    } else if (splitType === "BY_AMOUNT") {
      // Split by equal amounts
      const splitCount = splits.length
      const amountPerSplit = originalOrder.total / splitCount

      for (let i = 0; i < splitCount; i++) {
        const splitOrder = {
          ...originalOrder,
          _id: new ObjectId(),
          orderNumber: `${originalOrder.orderNumber}-SPLIT-${i + 1}`,
          items: i === 0 ? originalOrder.items : [], // Only first split gets items for reference
          subtotal: amountPerSplit / 1.1925,
          tax: (amountPerSplit / 1.1925) * 0.1925,
          total: amountPerSplit,
          splitFrom: originalOrder._id,
          splitIndex: i + 1,
          splitType: "EQUAL_AMOUNT",
          createdAt: new Date(),
        }

        splitOrders.push(splitOrder)
      }
    }

    // Insert split orders
    await db.collection("orders").insertMany(splitOrders)

    // Mark original order as split
    await db.collection("orders").updateOne(
      { _id: new ObjectId(params.id) },
      {
        $set: {
          status: "SPLIT",
          splitInto: splitOrders.map((o) => o._id),
          updatedAt: new Date(),
        },
      },
    )

    return NextResponse.json({
      success: true,
      splitOrders: splitOrders.map((o) => ({ id: o._id, orderNumber: o.orderNumber, total: o.total })),
    })
  } catch (error) {
    console.error("Error splitting order:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

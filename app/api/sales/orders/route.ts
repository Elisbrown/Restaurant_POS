import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import type { Order, StockMovement } from "@/lib/models"

export async function GET(request: NextRequest) {
  try {
    const { db } = await connectToDatabase()
    const { searchParams } = new URL(request.url)

    const status = searchParams.get("status")
    const type = searchParams.get("type")
    const tableId = searchParams.get("tableId")
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const page = Number.parseInt(searchParams.get("page") || "1")

    const query: any = {}

    if (status) {
      query.status = status
    }

    if (type) {
      query.type = type
    }

    if (tableId) {
      query.tableId = tableId
    }

    const orders = await db
      .collection("orders")
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .toArray()

    const total = await db.collection("orders").countDocuments(query)

    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching orders:", error)
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { db } = await connectToDatabase()
    const orderData = await request.json()

    // Generate order number
    const orderCount = await db.collection("orders").countDocuments()
    const orderNumber = `ORD-${Date.now()}-${(orderCount + 1).toString().padStart(4, "0")}`

    // Get table information if dine-in
    let tableNumber = null
    if (orderData.type === "DINE_IN" && orderData.tableId) {
      const table = await db.collection("tables").findOne({ _id: new ObjectId(orderData.tableId) })

      if (table) {
        tableNumber = table.number

        // Update table status to OCCUPIED
        await db.collection("tables").updateOne(
          { _id: new ObjectId(orderData.tableId) },
          {
            $set: {
              status: "OCCUPIED",
              updatedAt: new Date(),
            },
          },
        )
      }
    }

    const newOrder: Order = {
      ...orderData,
      orderNumber,
      tableNumber,
      status: "PENDING",
      paymentStatus: "PENDING",
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection("orders").insertOne(newOrder)
    const orderId = result.insertedId.toString()

    // Update table with current order ID
    if (orderData.tableId) {
      await db.collection("tables").updateOne(
        { _id: new ObjectId(orderData.tableId) },
        {
          $set: {
            currentOrderId: orderId,
            updatedAt: new Date(),
          },
        },
      )
    }

    // Create stock movements for each item
    const stockMovements = []
    for (const item of orderData.items) {
      // Get current product stock
      const product = await db.collection("products").findOne({ _id: new ObjectId(item.productId) })

      if (product) {
        const newStock = product.stockQuantity - item.quantity

        // Update product stock
        await db.collection("products").updateOne(
          { _id: new ObjectId(item.productId) },
          {
            $set: {
              stockQuantity: newStock,
              updatedAt: new Date(),
            },
          },
        )

        // Create stock movement record
        const stockMovement: StockMovement = {
          productId: item.productId,
          type: "SALE",
          quantity: -item.quantity, // Negative for outgoing
          previousStock: product.stockQuantity,
          newStock,
          reason: "Sale",
          reference: orderNumber,
          performedBy: orderData.waiterName || "System",
          timestamp: new Date(),
          notes: `Order: ${orderNumber}`,
        }

        stockMovements.push(stockMovement)
      }
    }

    if (stockMovements.length > 0) {
      await db.collection("stock_movements").insertMany(stockMovements)
    }

    return NextResponse.json({ _id: result.insertedId, ...newOrder }, { status: 201 })
  } catch (error) {
    console.error("Error creating order:", error)
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 })
  }
}

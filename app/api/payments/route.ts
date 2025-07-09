import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import type { Payment } from "@/lib/models"

export async function GET(request: NextRequest) {
  try {
    const { db } = await connectToDatabase()
    const { searchParams } = new URL(request.url)

    const orderId = searchParams.get("orderId")
    const status = searchParams.get("status")
    const method = searchParams.get("method")
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const page = Number.parseInt(searchParams.get("page") || "1")

    const query: any = {}

    if (orderId) {
      query.orderId = orderId
    }

    if (status) {
      query.status = status
    }

    if (method) {
      query.method = method
    }

    const payments = await db
      .collection("payments")
      .find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .toArray()

    const total = await db.collection("payments").countDocuments(query)

    return NextResponse.json({
      payments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching payments:", error)
    return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { db } = await connectToDatabase()
    const paymentData = await request.json()

    // Validate order exists
    const order = await db.collection("orders").findOne({ _id: new ObjectId(paymentData.orderId) })
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    // Create payment record
    const payment: Payment = {
      orderId: paymentData.orderId,
      amount: paymentData.amount,
      method: paymentData.method,
      status: "COMPLETED", // Assume successful for now
      reference: paymentData.reference,
      processedBy: paymentData.processedBy,
      timestamp: new Date(),
      notes: paymentData.notes,
    }

    const result = await db.collection("payments").insertOne(payment)

    // Calculate total payments for this order
    const allPayments = await db
      .collection("payments")
      .find({ orderId: paymentData.orderId, status: "COMPLETED" })
      .toArray()

    const totalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0)

    // Update order payment status
    let paymentStatus = "PENDING"
    if (totalPaid >= order.total) {
      paymentStatus = "PAID"

      // Update order status to completed if fully paid
      await db.collection("orders").updateOne(
        { _id: new ObjectId(paymentData.orderId) },
        {
          $set: {
            status: "COMPLETED",
            paymentStatus: "PAID",
            completedAt: new Date(),
            updatedAt: new Date(),
          },
        },
      )

      // Free up table if dine-in
      if (order.tableId) {
        await db.collection("tables").updateOne(
          { _id: new ObjectId(order.tableId) },
          {
            $set: {
              status: "DIRTY", // Table needs cleaning after customer leaves
              currentOrderId: null,
              updatedAt: new Date(),
            },
          },
        )
      }
    } else if (totalPaid > 0) {
      paymentStatus = "PARTIAL"

      await db.collection("orders").updateOne(
        { _id: new ObjectId(paymentData.orderId) },
        {
          $set: {
            paymentStatus: "PARTIAL",
            updatedAt: new Date(),
          },
        },
      )
    }

    return NextResponse.json({ _id: result.insertedId, ...payment }, { status: 201 })
  } catch (error) {
    console.error("Error processing payment:", error)
    return NextResponse.json({ error: "Failed to process payment" }, { status: 500 })
  }
}
